# @testring/fs-reader

File system reader that locates test files by glob pattern, reads their content, and exposes plugin hooks for custom file resolution logic.

## Installation

```bash
pnpm add @testring/fs-reader
```

## Overview

`FSReader` extends [`PluggableModule`](/docs/core-modules/pluggable-module.md) and provides a two-step pipeline:

1. **Locate** — resolve a glob pattern to a list of file paths using [`tinyglobby`](https://github.com/SuperchupuDev/tinyglobby)
2. **Resolve** — read file contents from disk with concurrency limiting via [`p-limit`](https://github.com/sindresorhus/p-limit) (max 10 concurrent reads)

Plugin hooks allow modifying the file list between these steps.

## API Reference

### `FSReader` class

```typescript
import { FSReader } from '@testring/fs-reader';
```

**Constructor:**

```typescript
new FSReader()
```

Registers two plugin hooks: `beforeResolve` and `afterResolve` (from `FSReaderPlugins` enum).

#### `find(pattern): Promise<IFile[]>`

Main method. Locates files matching the glob `pattern`, runs them through the plugin pipeline, reads their content, and returns an array of `IFile` objects.

**Pipeline:**

```
glob(pattern)
  → beforeResolve hook (can filter/reorder file paths)
  → resolve: read file contents (p-limit concurrency = 10)
  → afterResolve hook (can filter/transform resolved files)
  → return IFile[]
```

Throws an `Error` if no files match the pattern after the `beforeResolve` hook.

```typescript
const reader = new FSReader();
const files = await reader.find('./tests/**/*.spec.ts');

for (const file of files) {
  console.log(file.path, file.content.length);
}
```

**Windows compatibility:** On Windows, the pattern is automatically converted using `tinyglobby`'s `convertPathToPattern()` to handle backslash path separators.

#### `readFile(fileName): Promise<IFile | null>`

Reads a single file by path. Resolves the path to absolute, reads the content as a UTF-8 string, and returns an `IFile` object. Rejects if the file does not exist or cannot be read.

```typescript
const file = await reader.readFile('./tests/login.spec.ts');
if (file) {
  console.log(file.path);    // absolute path
  console.log(file.content);  // file content as string
}
```

---

### `IFile` interface

```typescript
interface IFile {
  path: string;     // Absolute file path
  content: string;  // File content as UTF-8 string
}
```

---

### `FSReaderPlugins` hooks

| Hook            | Type  | Input                | Output               | Description                                  |
| --------------- | ----- | -------------------- | -------------------- | -------------------------------------------- |
| `beforeResolve` | write | `string[]` (paths)   | `string[]` (paths)   | Modify the list of matched file paths before reading |
| `afterResolve`  | write | `IFile[]` (files)    | `IFile[]` (files)    | Modify the list of resolved files after reading |

## Writing FSReader Plugins

Plugins register via the `plugin-api`:

```typescript
// my-fs-plugin.ts
export default (pluginAPI) => {
  const fsReader = pluginAPI.getFSReader();

  if (fsReader) {
    // Filter out files before reading
    fsReader.onBeforeResolve((files) => {
      return files.filter((filePath) => !filePath.includes('.skip'));
    });

    // Transform resolved files after reading
    fsReader.onAfterResolve((files) => {
      return files.map((file) => ({
        ...file,
        content: addTestWrapper(file.content),
      }));
    });
  }
};
```

Or register directly on the `Hook` instance:

```typescript
const reader = new FSReader();
const beforeHook = reader.getHook('beforeResolve');

beforeHook?.writeHook('myPlugin', (filePaths) => {
  // Sort files alphabetically
  return filePaths.sort();
});
```

## Internal Modules

### `locateFiles(searchpath): Promise<string[]>`

Uses `tinyglobby`'s `glob()` to resolve a pattern to file paths. Returns an empty array if `searchpath` is falsy.

### `resolveFiles(files): Promise<IFile[]>`

Reads an array of file paths concurrently (max 10 at a time via `p-limit`). Skips files that fail to read. Throws if no files are successfully read.

### `readFile(file): Promise<IFile>`

Reads a single file, resolving its path to absolute. Returns `{ path, content }`. Rejects if the file does not exist.

## Dependencies

- `@testring/pluggable-module` — Plugin hook base class
- `@testring/logger` — Error logging when no files match
- `@testring/types` — `IFSReader`, `IFile`, `FSReaderPlugins`
- `tinyglobby` — Fast glob pattern matching
- `p-limit` — Concurrency limiter for file reads

## Related Modules

- [`@testring/pluggable-module`](/docs/core-modules/pluggable-module.md) — Base class for `FSReader`
- [`@testring/plugin-api`](/docs/core-modules/plugin-api.md) — Exposes `getFSReader()` with `onBeforeResolve` / `onAfterResolve` methods
- [`@testring/test-run-controller`](/docs/core-modules/test-run-controller.md) — Uses `FSReader` to discover test files
