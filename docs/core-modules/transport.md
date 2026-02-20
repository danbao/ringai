# @testring/transport

Transport layer module that provides inter-process communication (IPC) mechanisms and message passing in multi-process environments.

## Installation

```bash
pnpm add @testring/transport
```

## Overview

This module is the core communication layer of the testring framework, responsible for:

- Inter-Process Communication (IPC) between the main process and worker processes
- Point-to-point message delivery to specific child processes
- Broadcast messaging to all connected processes or locally
- Child process registration and lifecycle management
- Message serialization and deserialization via `structuredClone`

The transport module is split into two internal subsystems:

- **DirectTransport** — point-to-point messaging with TCP-like acknowledgement (send returns a `Promise<void>` that resolves when the child acknowledges)
- **BroadcastTransport** — one-to-many messaging via the root process IPC channel

## API Reference

### `Transport` class

The main transport class that combines direct and broadcast communication.

```typescript
import { Transport } from '@testring/transport';

const transport = new Transport(process);
```

**Constructor:**

| Parameter         | Type               | Default                    | Description                                               |
| ----------------- | ------------------ | -------------------------- | --------------------------------------------------------- |
| `rootProcess`     | `NodeJS.Process`   | `process`                  | The Node.js process object used for broadcast IPC         |
| `broadcastToLocal`| `boolean`          | `isChildProcess()` result  | When `true`, `broadcastUniversally` sends via broadcast; otherwise sends locally |

#### `transport.send<T>(processID, messageType, payload)`

Sends a direct message to a specific registered child process. Returns a `Promise<void>` that resolves when the child process acknowledges receipt.

```typescript
await transport.send('worker-1', 'execute-test', {
  testFile: 'login.spec.ts',
});
```

Throws `ReferenceError` if the `processID` is not registered.

#### `transport.broadcast<T>(messageType, payload)`

Sends a message to the parent process via IPC (used from child processes). The payload is serialized before sending.

```typescript
transport.broadcast('log-entry', { level: 'info', message: 'Test started' });
```

#### `transport.broadcastLocal<T>(messageType, payload)`

Triggers message listeners locally within the current process (no IPC). The payload is **not** serialized.

```typescript
transport.broadcastLocal('config-updated', newConfig);
```

#### `transport.broadcastUniversally<T>(messageType, payload)`

Automatically selects the broadcast strategy based on the process context:

- **Child process** → calls `broadcast()` (sends via IPC to parent)
- **Main process** → calls `broadcastLocal()` (triggers local listeners)

```typescript
transport.broadcastUniversally('status-update', { ready: true });
```

#### `transport.isChildProcess()`

Returns `true` if this transport instance was created in a child process context (determined by the `broadcastToLocal` constructor parameter, which defaults to the result of `isChildProcess()` from `@testring/child-process`).

```typescript
if (transport.isChildProcess()) {
  console.log('Running in a testring child process');
}
```

#### `transport.registerChild(processID, child)`

Registers a child process (an `IWorkerEmitter`) for direct communication. The child is stored in an internal registry and its `message` and `exit` events are wired up automatically.

```typescript
import { fork } from '@testring/child-process';

const child = await fork('./worker.ts');
transport.registerChild('worker-1', child);
```

Throws `ReferenceError` if a process with the same `processID` is already registered. When the child emits `exit`, it is automatically removed from the registry and pending response handlers are cleaned up.

#### `transport.getProcessesList()`

Returns an array of all currently registered child process IDs.

```typescript
const ids = transport.getProcessesList();
// ['worker-1', 'worker-2']
```

#### `transport.on<T>(messageType, callback)`

Registers a listener for a specific message type. The callback receives the message payload and (optionally) the source `processID`. Returns an unsubscribe function.

```typescript
const off = transport.on('test-result', (result, processID) => {
  console.log(`Result from ${processID}:`, result);
});

// Later: unsubscribe
off();
```

#### `transport.once<T>(messageType, callback)`

Like `on()`, but the listener fires only once. Returns an unsubscribe function.

```typescript
const off = transport.once('init-complete', (data) => {
  console.log('Initialization complete');
});
```

#### `transport.onceFrom<T>(processID, messageType, callback)`

Listens for a single message of the given type from a specific process. The listener is removed after the first matching message. Returns an unsubscribe function.

```typescript
transport.onceFrom('worker-1', 'ready', () => {
  console.log('Worker-1 is ready');
});
```

### `transport` singleton

The module exports a pre-configured singleton instance created with `new Transport(process)`:

```typescript
import { transport } from '@testring/transport';

// Ready to use — already bound to the current process
transport.on('my-event', (data) => { /* ... */ });
```

### `serialize(value)` and `deserialize(value)`

Serialization functions used internally by the transport layer to clone message payloads across process boundaries. Built on `structuredClone` (Node.js 17+).

```typescript
import { serialize, deserialize } from '@testring/transport';

const cloned = serialize({ date: new Date(), set: new Set([1, 2, 3]) });
// Returns a deep clone via structuredClone

const restored = deserialize(cloned);
```

**Supported types:** all types supported by `structuredClone` — primitives, `Date`, `Error`, `Map`, `Set`, `ArrayBuffer`, typed arrays, objects with circular references, etc.

**Not supported:** Functions — attempting to serialize a function throws a `DataCloneError` with a descriptive message.

## Internal Architecture

### DirectTransport

Handles point-to-point messaging to registered child processes:

- Each `send()` creates a unique message UID (`processID|nanoid`)
- The message (with serialized payload) is sent via `child.send()`
- A response handler is stored; it resolves the `send()` promise when the child acknowledges via a `messageResponse` internal message type
- On child `exit`, the child is unregistered and all pending response handlers for that process are resolved (preventing memory leaks)

### BroadcastTransport

Handles parent-process IPC communication:

- `broadcast()` serializes the payload and sends it to the parent process via `process.send()`
- Incoming messages from the parent process are deserialized and forwarded to listeners
- After processing an incoming message, an automatic `messageResponse` acknowledgement is sent back

### Message Format

```typescript
interface ITransportDirectMessage {
  type: string;     // Message type identifier
  payload: any;     // Message content (serialized for IPC)
  uid?: string;     // Unique message ID (for direct transport acknowledgement)
}
```

### Handler Type

```typescript
type TransportMessageHandler<T = unknown> = (
  message: T,
  processID?: string,
) => void;
```

## Usage Examples

### Main Process: Distribute and Collect

```typescript
import { transport } from '@testring/transport';
import { fork } from '@testring/child-process';

// Register workers
const child1 = await fork('./test-worker.ts');
transport.registerChild('worker-1', child1);

const child2 = await fork('./test-worker.ts');
transport.registerChild('worker-2', child2);

// Collect results
transport.on('test-result', (result, processID) => {
  console.log(`[${processID}] ${result.status}`);
});

// Distribute work
await transport.send('worker-1', 'execute-test', { file: 'a.spec.ts' });
await transport.send('worker-2', 'execute-test', { file: 'b.spec.ts' });
```

### Child Process: Listen and Respond

```typescript
import { transport } from '@testring/transport';

transport.on('execute-test', async (task) => {
  const result = await runTest(task.file);
  transport.broadcast('test-result', result);
});
```

### Waiting for a Specific Process Response

```typescript
import { transport } from '@testring/transport';

// Send a command and wait for the specific worker's response
await transport.send('worker-1', 'run-check', { type: 'health' });

transport.onceFrom('worker-1', 'check-result', (data) => {
  console.log('Health check:', data);
});
```

## Dependencies

- `@testring/child-process` — `isChildProcess()` detection
- `@testring/types` — Type definitions (`ITransport`, `IWorkerEmitter`, `TransportMessageHandler`, `ITransportDirectMessage`)
- `@testring/utils` — `generateUniqId` for message UIDs
- `events` — Node.js `EventEmitter`

## Related Modules

- [`@testring/child-process`](./child-process.md) — Child process creation and management
- [`@testring/test-worker`](./test-worker.md) — Test worker processes
- [`@testring/logger`](./logger.md) — Logging system (uses transport internally)
