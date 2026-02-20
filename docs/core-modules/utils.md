# @testring/utils

General-purpose utility module providing error classes, data structures, file system helpers, network port utilities, package loading, and more.

## Installation

```bash
pnpm add @testring/utils
```

## Overview

This module provides cross-cutting utilities used throughout the testring framework:

- **Error hierarchy** — structured error classes with context, codes, and error chaining
- **File system helpers** — directory creation, file touch, existence checks
- **Port utilities** — port availability detection and allocation
- **Package loading** — safe `require` with resolution fallbacks
- **Plugin loading** — plugin resolution with prefix conventions
- **Data structures** — `Queue<T>`, `Stack<T>`, `MultiLock`
- **Misc** — unique ID generation, memory reporting, throttle, error restructuring

## API Reference

### Error Hierarchy

All custom errors extend `TestringError`, which extends the native `Error`. Each error class sets `this.name` to the class name automatically and supports structured context via `ErrorContext`.

#### `ErrorContext` type

```typescript
interface ErrorContext {
  code?: string;                    // Programmatic error code (e.g., 'ERR_TRANSPORT_TIMEOUT')
  contextId?: string;               // Context identifier (e.g., worker ID, plugin name)
  metadata?: Record<string, unknown>; // Additional structured data
  cause?: Error;                    // Chained error (ES2022 Error.cause)
}
```

#### `TestringError`

Base error class for all testring errors. Supports three constructor overloads:

```typescript
import { TestringError } from '@testring/utils';

// Simple message
throw new TestringError('Something went wrong');

// Message with contextId string (prepended to message)
throw new TestringError('Connection lost', 'worker-3');
// → error.message === 'worker-3: Connection lost'
// → error.contextId === 'worker-3'

// Message with full ErrorContext
throw new TestringError('Connection lost', {
  code: 'ERR_TRANSPORT',
  contextId: 'worker-3',
  metadata: { retries: 3 },
  cause: originalError,
});
// → error.message === 'ERR_TRANSPORT:worker-3: Connection lost'
// → error.code === 'ERR_TRANSPORT'
// → error.cause === originalError
```

**Properties:**

| Property     | Type                         | Description                          |
| ------------ | ---------------------------- | ------------------------------------ |
| `name`       | `string`                     | Class name (e.g., `'TestringError'`) |
| `message`    | `string`                     | Error message (with optional prefix) |
| `code`       | `string \| undefined`        | Programmatic error code              |
| `contextId`  | `string \| undefined`        | Context identifier                   |
| `metadata`   | `Record<string, unknown> \| undefined` | Additional data             |
| `cause`      | `Error \| undefined`         | Chained error                        |

**Methods:**

- `toJSON()` — Returns a JSON-serializable representation of the error.

#### `TransportError`

For transport/IPC-related failures.

```typescript
import { TransportError } from '@testring/utils';

throw new TransportError('Message delivery failed', {
  code: 'ERR_SEND',
  contextId: 'worker-1',
});
```

#### `PluginError`

For plugin lifecycle and loading failures.

```typescript
import { PluginError } from '@testring/utils';

throw new PluginError('Plugin initialization failed', 'my-plugin');
```

#### `ConfigError`

For configuration validation and parsing failures.

```typescript
import { ConfigError } from '@testring/utils';

throw new ConfigError('Invalid timeout value', {
  code: 'ERR_CONFIG_VALIDATION',
  metadata: { field: 'timeout', value: -1 },
});
```

#### `WorkerError`

For worker process failures.

```typescript
import { WorkerError } from '@testring/utils';

throw new WorkerError('Worker crashed', {
  contextId: 'worker-5',
  cause: originalError,
});
```

### File System Utilities (`fs` namespace)

Imported as a namespace:

```typescript
import { fs } from '@testring/utils';
```

#### `fs.ensureDir(savePath)`

Creates a directory recursively (like `mkdir -p`). Resolves if the directory already exists.

```typescript
await fs.ensureDir('/tmp/testring/reports');
```

#### `fs.touchFile(fName)`

Opens a file in append mode (`a+`) and immediately closes it, creating the file if it doesn't exist.

```typescript
await fs.touchFile('/tmp/testring/output.log');
```

#### `fs.exists(path)`

Returns `true` if the path is accessible, `false` otherwise.

```typescript
if (await fs.exists('/tmp/testring/cache.json')) {
  // file exists
}
```

#### `fs.ensureNewFile(fName)`

Attempts to create a file exclusively (`ax` flag). Returns `true` if the file was created, `false` if it already exists.

```typescript
const created = await fs.ensureNewFile('/tmp/testring/lock');
if (created) {
  console.log('Lock acquired');
}
```

### Port Utilities

#### `isAvailablePort(port, host)`

Tests whether a port is available by attempting to start a TCP server on it. Returns `true` if available, `false` if in use.

```typescript
import { isAvailablePort } from '@testring/utils';

const available = await isAvailablePort(3000, 'localhost');
```

#### `getRandomPort(host)`

Binds to port `0` to get an OS-assigned random available port. Returns the port number.

```typescript
import { getRandomPort } from '@testring/utils';

const port = await getRandomPort('localhost');
// e.g., 49152
```

#### `getAvailablePort(ports?, host?)`

Tries each port in the given array in order, returning the first available one. If none are available, falls back to `getRandomPort()`.

```typescript
import { getAvailablePort } from '@testring/utils';

const port = await getAvailablePort([3000, 3001, 3002], 'localhost');
```

**Parameters:**

| Parameter | Type             | Default       | Description                      |
| --------- | ---------------- | ------------- | -------------------------------- |
| `ports`   | `Array<number>`  | `[]`          | Preferred ports to try           |
| `host`    | `string`         | `'localhost'` | Host to bind on                  |

#### `getAvailableFollowingPort(start, host?, skipPorts?)`

Starting from `start`, finds the first available port, incrementing by 1 each time. Ports in `skipPorts` are skipped.

```typescript
import { getAvailableFollowingPort } from '@testring/utils';

const port = await getAvailableFollowingPort(9229, 'localhost', [9230]);
// Tries 9229, skips 9230, tries 9231, etc.
```

### Package Utilities

#### `requirePackage<T>(modulePath, parentModule?)`

Loads a module using Node.js `createRequire`. Resolution strategy:

1. If `parentModule` is provided, resolves relative to its directory first, then falls back to absolute
2. Falls back to `resolve.sync()` from `process.cwd()`

Throws `ReferenceError` with a descriptive message if the module cannot be loaded.

```typescript
import { requirePackage } from '@testring/utils';

const config = requirePackage<MyConfig>('./config.json');
```

#### `resolvePackage(modulePath, parentModule?)`

Resolves the full file path of a module without loading it. Same resolution strategy as `requirePackage`.

```typescript
import { resolvePackage } from '@testring/utils';

const fullPath = resolvePackage('@testring/logger');
```

#### `requirePlugin<T>(pluginPath)`

Resolves and loads a testring plugin. Tries these prefixed variants in order:

1. `@testring/plugin-<pluginPath>`
2. `testring-plugin-<pluginPath>`
3. `@testring/<pluginPath>`
4. `<pluginPath>` as-is

Handles ES module default export normalization (detects `__esModule` flag and returns `.default` if present).

```typescript
import { requirePlugin } from '@testring/utils';

const plugin = requirePlugin('playwright-driver');
// Resolves @testring/plugin-playwright-driver
```

### Data Structures

#### `Queue<T>`

A FIFO queue with filtering and extraction capabilities. Implements `IQueue<T>` and is iterable.

```typescript
import { Queue } from '@testring/utils';

const queue = new Queue<string>(['a', 'b', 'c']);

queue.push('d', 'e');         // Add elements
const item = queue.shift();   // Remove and return first element ('a')
queue.length;                 // 4
queue.getFirstElement();      // 'b' (peek without removing)
queue.getFirstElement(1);     // 'c' (peek with offset)
queue.clean();                // Remove all elements
```

**Additional methods:**

| Method                    | Returns    | Description                                                    |
| ------------------------- | ---------- | -------------------------------------------------------------- |
| `remove(fn)`              | `number`   | Removes elements where `fn(item, index)` returns `true`. Returns count removed. |
| `extract(fn)`             | `T[]`      | Removes and returns elements matching the predicate. Non-matching elements remain. |

#### `Stack<T>`

A LIFO stack. Implements `IStack<T>` and is iterable.

```typescript
import { Stack } from '@testring/utils';

const stack = new Stack<number>();

stack.push(1);
stack.push(2);
stack.push(3);

stack.getLastElement();     // 3 (peek)
stack.getLastElement(1);    // 2 (peek with offset from top)
const top = stack.pop();    // 3
stack.length;               // 2
stack.clean();              // Remove all elements
```

#### `MultiLock`

A multi-count lock manager that tracks lock counts per ID with an optional global limit. Useful for concurrency control (e.g., limiting concurrent worker processes).

```typescript
import { MultiLock } from '@testring/utils';

// Allow up to 4 total locks across all IDs
const lock = new MultiLock(4);

lock.acquire('worker-1');  // true (total: 1)
lock.acquire('worker-1');  // true (total: 2)
lock.acquire('worker-2');  // true (total: 3)
lock.acquire('worker-3');  // true (total: 4)
lock.acquire('worker-4');  // false (limit reached)

lock.release('worker-1');  // true (total: 3)
lock.getSize('worker-1');  // 1 (locks for worker-1)
lock.getSize();            // 3 (total locks)

lock.clean('worker-1');    // Remove all locks for worker-1
lock.clean();              // Remove all locks for all IDs

lock.getIds();             // Map<string, number> of all IDs and their lock counts
```

**Constructor:**

| Parameter   | Type     | Default | Description                                    |
| ----------- | -------- | ------- | ---------------------------------------------- |
| `lockLimit` | `number` | `0`     | Max total locks across all IDs (0 = unlimited) |

### Other Utilities

#### `generateUniqId(size?)`

Generates a unique ID using `nanoid`. Optional `size` parameter controls the ID length.

```typescript
import { generateUniqId } from '@testring/utils';

const id = generateUniqId();    // e.g., 'V1StGXR8_Z5jdHi6B-myT'
const short = generateUniqId(8); // e.g., 'a1b2c3d4'
```

#### `getMemoryReport()` / `getHeapReport()`

Return human-readable strings with current process memory usage (formatted via the `bytes` library).

```typescript
import { getMemoryReport, getHeapReport } from '@testring/utils';

console.log(getMemoryReport());
// 'Total memory usage: 45.2MB, External memory: 1.2MB.'

console.log(getHeapReport());
// 'Total heap: 30.5MB, used heap: 25.1MB'
```

#### `throttle<T>(func, limit)`

Classic throttle function. Ensures `func` is called at most once per `limit` milliseconds. Trailing calls are scheduled.

```typescript
import { throttle } from '@testring/utils';

const throttledLog = throttle((msg: string) => {
  console.log(msg);
}, 1000);

throttledLog('hello');  // Executes immediately
throttledLog('world');  // Scheduled after 1000ms
```

#### `restructureError(error)`

Normalizes error-like objects into proper `Error` instances. If the input is already an `Error`, returns it as-is. Otherwise, creates a new `Error` with the input's `message` and `stack`.

```typescript
import { restructureError } from '@testring/utils';

const err = restructureError({ message: 'oops', stack: '...' });
// Returns a proper Error instance
```

## Dependencies

- `nanoid` — Unique ID generation
- `bytes` — Human-readable byte formatting
- `resolve` — Module path resolution fallback

## Related Modules

- [`@testring/types`](./types.md) — Type definitions (`IQueue`, `IStack`, `ErrorContext`)
- [`@testring/transport`](./transport.md) — Uses `generateUniqId` for message UIDs
- [`@testring/plugin-api`](./plugin-api.md) — Uses `requirePlugin` for plugin loading
