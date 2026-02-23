# @ringai/fs-store

File storage module providing coordinated file operations in multi-process environments. Uses a client-server architecture over `@ringai/transport` for file locking, access control, and lifecycle management.

## Installation

```bash
pnpm add @ringai/fs-store
```

## Overview

The module coordinates file operations across worker processes:

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Worker 1   │  │  Worker 2   │  │  Worker N   │
│ FSStoreClient│  │ FSStoreClient│  │ FSStoreClient│
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       └────────────────┼────────────────┘
                        │  transport
               ┌────────┴────────┐
               │  FSStoreServer  │
               │  (main process) │
               └────────┬────────┘
                        │
                   File System
```

- **`FSStoreServer`** — main-process coordinator that manages file permissions, locking, and naming via transport messages
- **`FSStoreClient`** — worker-side client that requests lock/access/unlink permissions from the server
- **`FSStoreFile`** — high-level file abstraction with read/write/append/unlink, locking, and transaction support
- **Factory functions** — pre-configured `FSStoreFile` creators for common file types

## Exports

```typescript
import {
  FSStoreServer,
  fsStoreServerHooks,
  FSStoreClient,
  FSStoreFile,
  FSClientGet,
  FSScreenshotFactory,
  FSTextFactory,
  FSBinaryFactory,
  FS_CONSTANTS,
} from '@ringai/fs-store';
```

## API Reference

### `FSStoreServer` class

Extends [`PluggableModule`](./pluggable-module.md). Runs in the main process and coordinates all file operations.

```typescript
new FSStoreServer(threadCount?: number, msgNamePrefix?: string)
```

| Parameter       | Type     | Default        | Description                            |
| --------------- | -------- | -------------- | -------------------------------------- |
| `threadCount`   | `number` | `10`           | Max concurrent file operations (LockPool size) |
| `msgNamePrefix` | `string` | `'fs-store'`   | Transport message name prefix          |

The constructor calls `init()` automatically, registering transport listeners for request, release, and cleanup messages.

#### `init(): boolean | serverState`

Registers transport listeners. Called automatically by the constructor. Returns `false` if already initialized, or `serverState.initialized` (value `2`) on first init.

#### `getState(): number`

Returns the server state: `0` (new), `1` (init started), `2` (initialized).

#### `getNameList(): string[]`

Returns the full paths of all files currently managed by the server.

#### `cleanUpTransport(): void`

Removes all transport listeners registered by this server instance.

#### Plugin Hooks

| Hook Name     | Constant                       | Type  | Arguments                                            | Description                          |
| ------------- | ------------------------------ | ----- | ---------------------------------------------------- | ------------------------------------ |
| `onFileName`  | `fsStoreServerHooks.ON_FILENAME` | write | `(fileName, { workerId, requestId, meta })`         | Transform the file name/path. Return a new path to override the default `os.tmpdir()/fileName` |
| `onQueue`     | `fsStoreServerHooks.ON_QUEUE`    | write | `(defaultPool, meta, { workerId, defaultQueue })`   | Provide a custom permission pool for specific workers or file types |
| `onRelease`   | `fsStoreServerHooks.ON_RELEASE`  | read  | `({ workerId, requestId, fullPath, fileName, action })` | Observe file release events     |

```typescript
import { FSStoreServer, fsStoreServerHooks } from '@ringai/fs-store';

const server = new FSStoreServer(20, 'my-store');

// Custom file naming
server.getHook(fsStoreServerHooks.ON_FILENAME)?.writeHook(
  'customPath',
  (fileName, { workerId, meta }) => {
    return path.join('/custom/output', workerId, fileName);
  }
);

// Log file releases
server.getHook(fsStoreServerHooks.ON_RELEASE)?.readHook(
  'monitor',
  ({ workerId, fileName, action }) => {
    console.log(`[${workerId}] ${action}: ${fileName}`);
  }
);
```

---

### `FSStoreClient` class

Worker-side client that communicates with `FSStoreServer` via transport messages.

```typescript
new FSStoreClient(msgNamePrefix?: string)
```

| Parameter       | Type     | Default      | Description                   |
| --------------- | -------- | ------------ | ----------------------------- |
| `msgNamePrefix` | `string` | `'fs-store'` | Must match the server prefix  |

#### `getLock(meta, callback): string`

Requests a file lock (prevents deletion). Calls `callback(fullPath, requestId)` when the lock is granted. Returns the `requestId`.

```typescript
const requestId = client.getLock({ ext: 'txt' }, (fullPath, reqId) => {
  console.log('Locked:', fullPath);
  // ... do work ...
  client.release(reqId);
});
```

#### `getAccess(meta, callback): string`

Requests write access to a file. Calls `callback(fullPath, requestId)` when access is granted. Returns the `requestId`.

#### `getUnlink(meta, callback): string`

Requests permission to delete a file (waits for all locks to be released). Requires `meta.fileName` to be set. Returns the `requestId`.

#### `release(requestId, callback?): boolean`

Releases a previously acquired lock or access. Returns `false` if no request data exists for the given ID.

#### `releaseAllWorkerActions(): void`

Broadcasts a cleanup message to release all operations for the current worker.

---

### `FSClientGet(prefix?): FSStoreClient`

Factory function that returns a cached `FSStoreClient` singleton per prefix. Ensures only one client instance exists per message prefix.

```typescript
import { FSClientGet } from '@ringai/fs-store';

const client = FSClientGet('my-store');
```

---

### `FSStoreFile` class

High-level file abstraction that handles the full request/response lifecycle with the server.

```typescript
new FSStoreFile(options: FSStoreOptions)
```

```typescript
type FSStoreOptions = {
  meta: requestMeta;                                // File metadata (fileName, ext, type, etc.)
  lock?: boolean;                                    // Auto-lock on creation (default: false)
  fsOptions?: { encoding: BufferEncoding; flag?: string }; // Node.js fs options
  fsStorePrefix?: string;                            // Transport prefix for FSStoreClient
};

type requestMeta = {
  fileName?: string;           // File name (auto-generated if not provided)
  ext?: string;                // File extension (default: 'tmp')
  type?: FSStoreType;          // File type classification
  uniqPolicy?: FSFileUniqPolicy; // Uniqueness scope
  subtype?: string | string[];
  extraPath?: string;
  global?: boolean;            // Treat fileName as full path
  preserveName?: boolean;      // Don't add unique suffixes
  workerId?: string;
};
```

#### Instance Methods

| Method                            | Returns            | Description                                          |
| --------------------------------- | ------------------ | ---------------------------------------------------- |
| `lock()`                          | `Promise<void>`    | Acquire a file lock from the server                  |
| `unlock()`                        | `Promise<boolean>` | Release the most recent lock                         |
| `unlockAll()`                     | `Promise<boolean>` | Release all locks                                    |
| `getAccess()`                     | `Promise<void>`    | Acquire exclusive write access                       |
| `releaseAccess()`                 | `Promise<boolean>` | Release write access                                 |
| `read()`                          | `Promise<Buffer>`  | Acquire access, read file, release access             |
| `write(data: Buffer)`             | `Promise<string>`  | Acquire access, write file, release access; returns full path |
| `append(data: Buffer)`            | `Promise<string>`  | Acquire access, append to file, release access; returns full path |
| `stat()`                          | `Promise<fs.Stats>`| Acquire access, stat file, release access             |
| `unlink()`                        | `Promise<boolean>` | Request unlink permission, delete file; marks file invalid |
| `waitForUnlock()`                 | `Promise<void>`    | Wait until all locks are released                    |
| `transaction(cb)`                 | `Promise<void>`    | Execute `cb` within a locked+accessed transaction     |
| `startTransaction()`              | `Promise<void>`    | Manually begin a transaction (acquire access + lock)  |
| `endTransaction()`                | `Promise<void>`    | End a transaction (release access + unlock)           |
| `getFullPath()`                   | `string \| null`   | Current resolved file path                           |
| `getState()`                      | `Record<string, any>` | Internal state object                             |
| `isLocked()`                      | `boolean`          | Whether the file has an active lock                  |
| `isValid()`                       | `boolean`          | Whether the file is still valid (not unlinked)       |

#### Static Methods

Convenience methods that create a temporary `FSStoreFile`, perform the operation, and return:

```typescript
// Write and get file path
const filePath = await FSStoreFile.write(Buffer.from('hello'), options);

// Append to file
const filePath = await FSStoreFile.append(Buffer.from('more'), options);

// Read file content
const buffer = await FSStoreFile.read(options);

// Delete file
const filePath = await FSStoreFile.unlink(options);
```

#### Transaction Example

```typescript
const file = new FSStoreFile({
  meta: { ext: 'log' },
  fsOptions: { encoding: 'utf8' },
});

await file.transaction(async () => {
  await file.write(Buffer.from('Header\n'));
  await file.append(Buffer.from('Line 1\n'));
  await file.append(Buffer.from('Line 2\n'));
});
// Access and lock are automatically acquired before and released after
```

---

### Factory Functions

Pre-configured `FSStoreFile` creators for common file types. Each returns a new `FSStoreFile` with appropriate defaults.

#### `FSScreenshotFactory(extraMeta?, extraData?): FSStoreFile`

Creates a screenshot file with `FSStoreType.screenshot`, extension `png`, binary encoding, and `FSFileUniqPolicy.global`.

```typescript
import { FSScreenshotFactory } from '@ringai/fs-store';

const file = FSScreenshotFactory({ fileName: 'login-page.png' });
await file.write(screenshotBuffer);
```

#### `FSTextFactory(extraMeta?, extraData?): FSStoreFile`

Creates a text file with `FSStoreType.text`, UTF-8 encoding, and `FSFileUniqPolicy.global`.

```typescript
import { FSTextFactory } from '@ringai/fs-store';

const file = FSTextFactory({ ext: 'log' });
await file.write(Buffer.from('Test output log'));
```

#### `FSBinaryFactory(extraMeta?, extraData?): FSStoreFile`

Creates a binary file with `FSStoreType.bin`, binary encoding, and `FSFileUniqPolicy.global`.

```typescript
import { FSBinaryFactory } from '@ringai/fs-store';

const file = FSBinaryFactory({ ext: 'dat' });
await file.write(binaryBuffer);
```

---

### `FS_CONSTANTS`

Transport message name constants:

```typescript
import { FS_CONSTANTS } from '@ringai/fs-store';
```

| Key                         | Value                  | Description                  |
| --------------------------- | ---------------------- | ---------------------------- |
| `DW_ID`                     | `'*'`                  | Default worker ID            |
| `FS_REQ_NAME_POSTFIX`       | `'_action_request'`    | Request message postfix      |
| `FS_RESP_NAME_POSTFIX`      | `'_action_response'`   | Response message postfix     |
| `FS_RELEASE_NAME_POSTFIX`   | `'_release_request'`   | Release message postfix      |
| `FS_RELEASE_RESP_NAME_POSTFIX` | `'_release_response'` | Release response postfix    |
| `FS_CLEAN_REQ_NAME_POSTFIX` | `'_release_worker'`    | Worker cleanup postfix       |
| `FS_DEFAULT_MSG_PREFIX`     | `'fs-store'`           | Default message prefix       |

---

### Type Enums

#### `FSStoreType`

```typescript
enum FSStoreType {
  screenshot = 'screenshot',
  globalText = 'globalText',
  globalBin = 'globalBin',
  text = 'text',
  bin = 'bin',
}
```

#### `FSFileUniqPolicy`

```typescript
enum FSFileUniqPolicy {
  global,   // Unique across all workers
  worker,   // Unique per worker
}
```

## Dependencies

- `@ringai/pluggable-module` — Plugin hook base class for `FSStoreServer`
- `@ringai/transport` — Inter-process communication
- `@ringai/logger` — Logging (via `loggerClient.withPrefix`)
- `@ringai/utils` — `generateUniqId`, `fs.ensureDir`, `fs.touchFile`
- `@ringai/types` — Type definitions

## Related Modules

- [`@ringai/pluggable-module`](./pluggable-module.md) — Base class for `FSStoreServer`
- [`@ringai/transport`](./transport.md) — Message passing between server and clients
- [`@ringai/plugin-api`](./plugin-api.md) — Exposes `getFSStore()` for plugin authors
- [`@ringai/plugin-fs-store`](../packages/plugin-fs-store.md) — Default fs-store plugin implementation
