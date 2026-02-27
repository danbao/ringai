# @ringai/transport

Transport layer module that provides event-based message passing for inter-process communication (IPC) within the ringai framework.

## Installation

```bash
pnpm add @ringai/transport
```

## Overview

This module is the core communication layer of the ringai framework, providing an EventEmitter-based message passing system. It implements the `ITransport` interface from `@ringai/types` with:

- Point-to-point message delivery via `send()`
- Broadcast messaging via `broadcast()`
- Event subscription via `on()` and `once()`

## API Reference

### `Transport` class

The main transport class built on Node.js `EventEmitter`.

```typescript
import { Transport } from '@ringai/transport';

const transport = new Transport();
```

The constructor takes no parameters.

#### `transport.send<T>(processID, messageType, payload)`

Emits a message with the given `messageType` and `payload`. The `processID` parameter identifies the target (used by higher-level modules for routing). Returns a resolved `Promise<void>`.

```typescript
await transport.send('worker-1', 'execute-test', {
  testFile: 'login.spec.ts',
});
```

#### `transport.broadcast<T>(messageType, payload)`

Emits a message with the given `messageType` and `payload` to all listeners.

```typescript
transport.broadcast('log-entry', { level: 'info', message: 'Test started' });
```

#### `transport.on<T>(messageType, callback)`

Registers a listener for a specific message type. The callback receives the message payload. Returns an unsubscribe function.

```typescript
const off = transport.on('test-result', (result) => {
  console.log('Result:', result);
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

### `transport` singleton

The module exports a pre-created singleton instance:

```typescript
import { transport } from '@ringai/transport';

// Ready to use
transport.on('my-event', (data) => { /* ... */ });
```

### Handler Type

```typescript
type TransportMessageHandler<T = unknown> = (
  message: T,
  processID?: string,
) => void;
```

## Usage Examples

### Send and Listen

```typescript
import { transport } from '@ringai/transport';

// Listen for results
transport.on('test-result', (result) => {
  console.log('Result:', result);
});

// Send a message
await transport.send('worker-1', 'execute-test', { file: 'a.spec.ts' });
```

### Broadcast

```typescript
import { transport } from '@ringai/transport';

transport.on('execute-test', async (task) => {
  const result = await runTest(task.file);
  transport.broadcast('test-result', result);
});
```

## Dependencies

- `@ringai/types` — Type definitions (`ITransport`, `TransportMessageHandler`)
- `events` — Node.js `EventEmitter`

## Related Modules

- [`@ringai/child-process`](./child-process.md) — Child process creation and management
- [`@ringai/test-worker`](./test-worker.md) — Test worker processes
- [`@ringai/logger`](./logger.md) — Logging system (uses transport internally)
