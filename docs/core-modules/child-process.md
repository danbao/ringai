# @ringai/child-process

Child process management module that provides cross-platform child process creation and management capabilities, supporting direct execution of JavaScript and TypeScript files.

## Installation

```bash
pnpm add @ringai/child-process
```

## Overview

This module provides enhanced child process management features, including:

- Direct execution of JavaScript and TypeScript files
- Cross-platform compatibility (Windows, Linux, macOS) with `pathToFileURL` for Windows path handling
- Debug mode support with automatic port allocation
- Inter-process communication (IPC) via Node.js `child_process`
- TypeScript execution via **tsx** (ESM loader)
- Process state detection (`isChildProcess`)

## API Reference

### `fork(filePath, args?, options?)`

Creates a child process to execute the given file. For `.ts` files, automatically configures the **tsx** ESM loader via `NODE_OPTIONS`. Returns an `IChildProcessFork` (a `ChildProcess` extended with a `debugPort` property).

The fork function injects a `--ringai-parent-pid=<pid>` argument into the child process argv, which is used by `isChildProcess()` to detect whether the current process was spawned by ringai.

```typescript
import { fork } from '@ringai/child-process';

async function fork(
  filePath: string,
  args?: Array<string>,
  options?: Partial<IChildProcessForkOptions>,
): Promise<IChildProcessFork>;
```

**Parameters:**

| Parameter  | Type                                | Default | Description                                |
| ---------- | ----------------------------------- | ------- | ------------------------------------------ |
| `filePath` | `string`                            | —       | Path to the `.js` or `.ts` file to execute |
| `args`     | `Array<string>`                     | `[]`    | Additional arguments passed to the child   |
| `options`  | `Partial<IChildProcessForkOptions>` | `{}`    | Fork configuration options                 |

**`IChildProcessForkOptions`:**

| Property         | Type             | Default                                           | Description                                 |
| ---------------- | ---------------- | ------------------------------------------------- | ------------------------------------------- |
| `debug`          | `boolean`        | `false`                                           | Enable `--inspect-brk` debugging            |
| `debugPortRange` | `Array<number>`  | `[9229, 9222, 9230–9240]`                         | Preferred ports for the debug inspector     |

**`IChildProcessFork`** (extends `ChildProcess`):

| Property    | Type             | Description                                       |
| ----------- | ---------------- | ------------------------------------------------- |
| `debugPort` | `number \| null` | The allocated debug port, or `null` if not in debug mode |

#### TypeScript Execution with tsx

When `filePath` has a `.ts` extension, `fork` resolves the **tsx** ESM loader path using `createRequire` and converts it to a `file://` URL via `pathToFileURL()` for Windows compatibility. The resulting URL is injected as `NODE_OPTIONS="--import <tsx-url>"` into the child process environment.

The tsx path resolution strategy is:

1. Try resolving `tsx/esm` from the project root (`process.cwd()`)
2. Fall back to resolving from the current module (`import.meta.url`)
3. Fall back to the bare specifier `tsx/esm`

The resolved path is cached after the first resolution.

### `spawn(command, args?, env?)`

Spawns a child process with IPC support. The process is spawned in detached mode with an IPC channel (`stdio: [null, null, null, 'ipc']`).

```typescript
import { spawn } from '@ringai/child-process';

function spawn(
  command: string,
  args?: Array<string>,
  env?: Record<string, string | undefined>,
): ChildProcess;
```

**Parameters:**

| Parameter | Type                                    | Default       | Description                                          |
| --------- | --------------------------------------- | ------------- | ---------------------------------------------------- |
| `command` | `string`                                | —             | The command to execute (e.g., `process.execPath`)    |
| `args`    | `Array<string>`                         | `[]`          | Arguments to pass to the command                     |
| `env`     | `Record<string, string \| undefined>`   | `undefined`   | Optional environment variables merged with `process.env` |

When `env` is provided, it is merged with `process.env` (`{ ...process.env, ...env }`). When omitted, `process.env` is used directly.

The spawned process uses `process.cwd()` as the working directory and runs in detached mode.

### `isChildProcess(argv?)`

Checks whether the current process was spawned by ringai by looking for a `--ringai-parent-pid=` argument in the process argv.

```typescript
import { isChildProcess } from '@ringai/child-process';

function isChildProcess(argv?: string[]): boolean;
```

**Parameters:**

| Parameter | Type             | Default         | Description                               |
| --------- | ---------------- | --------------- | ----------------------------------------- |
| `argv`    | `string[]`       | `process.argv`  | The argument array to search              |

Returns `true` if any element in `argv` starts with `--ringai-parent-pid=`.

## Usage Examples

### Execute a JavaScript File

```typescript
import { fork } from '@ringai/child-process';

const child = await fork('./worker.js');

child.on('message', (data) => {
  console.log('Received:', data);
});

child.send({ type: 'start' });
```

### Execute a TypeScript File

```typescript
import { fork } from '@ringai/child-process';

// Automatically uses tsx ESM loader for .ts files
const child = await fork('./worker.ts');

child.on('message', (data) => {
  console.log('Received:', data);
});
```

### Fork with Debug Mode

```typescript
import { fork } from '@ringai/child-process';

const child = await fork('./worker.js', [], {
  debug: true,
  debugPortRange: [9229, 9230, 9231, 9232],
});

console.log(`Debug at: chrome://inspect → localhost:${child.debugPort}`);
```

### Detect Child Process

```typescript
import { isChildProcess } from '@ringai/child-process';

if (isChildProcess()) {
  // Running inside a ringai-forked child process
  process.on('message', (msg) => {
    process.send?.({ result: 'done' });
  });
} else {
  // Running as the main process
  console.log('Main process');
}
```

### Spawn with Custom Environment

```typescript
import { spawn } from '@ringai/child-process';

const child = spawn('node', ['script.js'], {
  MY_VAR: 'hello',
  DEBUG: 'true',
});

child.on('message', (msg) => {
  console.log('IPC message:', msg);
});
```

## Dependencies

- `@ringai/types` — Type definitions (`IChildProcessForkOptions`, `IChildProcessFork`)
- `@ringai/utils` — Utility functions (`getAvailablePort`)

## Related Modules

- [`@ringai/test-worker`](./test-worker.md) — Test worker process management (uses `fork` internally)
- [`@ringai/transport`](./transport.md) — Inter-process communication layer
- [`@ringai/utils`](./utils.md) — Utility functions
