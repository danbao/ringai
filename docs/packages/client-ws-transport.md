# @ringai/client-ws-transport

WebSocket client transport for the ringai devtool system. Wraps the browser `WebSocket` API in an `EventEmitter`-based interface with automatic message queuing, optional reconnection, and a handshake protocol for app registration.

## Installation

```bash
pnpm add @ringai/client-ws-transport
```

## Quick Start

```typescript
import { ClientWsTransport } from '@ringai/client-ws-transport';
import { ClientWsTransportEvents, DevtoolEvents } from '@ringai/types';

const ws = new ClientWsTransport('localhost', 3001);

ws.on(ClientWsTransportEvents.OPEN, () => {
  console.log('Connected');
});

ws.on(ClientWsTransportEvents.MESSAGE, (message) => {
  console.log('Received:', message);
});

ws.connect();

// Perform handshake after connection opens
await ws.handshake('my-app-id');

// Send a message
await ws.send(DevtoolEvents.WORKER_ACTION, { actionType: 'run' });
```

## Exports

```typescript
import { ClientWsTransport } from '@ringai/client-ws-transport';
```

Event and message types are re-exported from `@ringai/types`:

```typescript
import {
  ClientWsTransportEvents,
  DevtoolEvents,
  type IClientWsTransport,
  type IDevtoolWSMessage,
  type IDevtoolWSHandshakeResponseMessage,
} from '@ringai/types';
```

## ClientWsTransport

### Constructor

```typescript
new ClientWsTransport(host: string, port: number, shouldReconnect?: boolean)
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `host` | `string` | — | WebSocket server hostname |
| `port` | `number` | — | WebSocket server port |
| `shouldReconnect` | `boolean` | `true` | Automatically reconnect on error |

Constructs the URL as `ws://<host>:<port>`. No connection is established until `connect()` is called.

### connect()

```typescript
connect(url?: string): void
```

Opens a WebSocket connection. If a previous connection exists it is closed first. Optionally accepts a full URL override; otherwise uses the URL from the constructor.

Registers internal handlers for the four WebSocket events (`onopen`, `onmessage`, `onclose`, `onerror`) and emits the corresponding `ClientWsTransportEvents`.

### disconnect()

```typescript
disconnect(): void
```

Closes the current WebSocket connection, if any.

### reconnect()

```typescript
reconnect(): void
```

Reconnects using the current connection's URL. Called automatically on error when `shouldReconnect` is `true`.

### getConnectionStatus()

```typescript
getConnectionStatus(): boolean
```

Returns `true` when the underlying WebSocket `readyState` is `1` (OPEN).

### send()

```typescript
send(type: DevtoolEvents, payload: any): Promise<void>
```

Sends a JSON-encoded message `{ type, payload }` over the WebSocket.

**Message queuing:** If the connection is not open (or a previous send is queued), the message is pushed to an internal `Queue<IQueuedMessage>`. When the connection opens (or after a successful send), queued messages are flushed in FIFO order.

```typescript
// Messages sent before the connection opens are queued automatically
ws.send(DevtoolEvents.WORKER_ACTION, { actionType: 'pause' });
ws.connect(); // queued message is sent once connected
```

### handshake()

```typescript
handshake(appId: string): Promise<void>
```

Performs the devtool handshake protocol:

1. Subscribes to incoming `MESSAGE` events
2. Sends a `HANDSHAKE_REQUEST` with `{ appId }`
3. Waits for a `HANDSHAKE_RESPONSE` message
4. Resolves on success or rejects with `Error(payload.error)` on failure
5. Automatically removes the internal message listener

```typescript
try {
  await ws.handshake('test-app');
  console.log('Handshake successful');
} catch (err) {
  console.error('Handshake rejected:', err.message);
}
```

## Events

The class extends `EventEmitter` and emits `ClientWsTransportEvents`:

| Event | Enum Value | Emitted When | Callback Signature |
|-------|------------|-------------|-------------------|
| OPEN | `'ClientWsTransportEvents/OPEN'` | WebSocket connection opens | `() => void` |
| MESSAGE | `'ClientWsTransportEvents/MESSAGE'` | A message is received | `(data: IDevtoolWSMessage) => void` |
| CLOSE | `'ClientWsTransportEvents/CLOSE'` | WebSocket connection closes | `() => void` |
| ERROR | `'ClientWsTransportEvents/ERROR'` | A WebSocket error occurs | `(error: Event \| Error) => void` |

### Listening

```typescript
ws.on(ClientWsTransportEvents.OPEN, () => { /* connected */ });
ws.on(ClientWsTransportEvents.MESSAGE, (msg) => { /* IDevtoolWSMessage */ });
ws.on(ClientWsTransportEvents.CLOSE, () => { /* disconnected */ });
ws.on(ClientWsTransportEvents.ERROR, (err) => { /* error */ });
```

## Message Format

Messages are sent and received as JSON with the shape:

```typescript
interface IDevtoolWSMessage {
  type: DevtoolEvents;
  payload: any;
}
```

### DevtoolEvents Enum

| Value | String |
|-------|--------|
| `HANDSHAKE_REQUEST` | `'DevtoolEvents/HANDSHAKE_REQUEST'` |
| `HANDSHAKE_RESPONSE` | `'DevtoolEvents/HANDSHAKE_RESPONSE'` |
| `WORKER_ACTION` | `'DevtoolEvents/WORKER_ACTION'` |
| `STORE_STATE` | `'DevtoolEvents/STORE_STATE'` |
| `GET_STORE` | `'DevtoolEvents/GET_STORE'` |

### Handshake Response Payload

```typescript
interface IDevtoolWSHandshakeResponseMessage {
  type: DevtoolEvents.HANDSHAKE_RESPONSE;
  payload: {
    appId: string;
    connectionId: string;
    error: null | Error | string;
  };
}
```

## Internal Message Queue

`ClientWsTransport` uses a `Queue<IQueuedMessage>` from `@ringai/utils` to buffer outbound messages when the connection is not ready:

```typescript
interface IQueuedMessage {
  type: DevtoolEvents;
  payload: any;
  resolve: () => any;
}
```

- When `send()` is called and the queue is empty, it attempts a direct WebSocket send. If the send throws (connection not open), the message is enqueued.
- When `send()` is called and the queue is non-empty, the message is appended to the queue.
- On `OPEN`, the queue is flushed: each queued message is sent in order, its promise resolved, and the entry removed.

## Connection Lifecycle

```
new ClientWsTransport(host, port)
        │
        ▼
    connect()  ──────────►  WebSocket created
        │                        │
        │                   onopen ──► emit OPEN ──► flush queue
        │                        │
        │                 onmessage ──► parse JSON ──► emit MESSAGE
        │                        │
        │                  onclose ──► emit CLOSE
        │                        │
        │                  onerror ──► emit ERROR
        │                              │
        │               shouldReconnect?
        │                   yes ──► reconnect()
        │
    disconnect() ──────►  connection.close()
```

## Dependencies

- **`@ringai/types`** — `ClientWsTransportEvents`, `DevtoolEvents`, `IClientWsTransport`, `IDevtoolWSHandshakeResponseMessage`
- **`@ringai/utils`** — `Queue` data structure for message buffering

## Related Modules

- **`@ringai/devtool-backend`** — Server-side WebSocket handler that this client connects to
- **`@ringai/transport`** — IPC transport for worker communication (different from WS transport)
