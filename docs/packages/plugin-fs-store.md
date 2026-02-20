# @testring/plugin-fs-store

File system storage plugin for the testring framework. Extends `@testring/fs-store` by hooking into the `FSStoreServer`'s file name assignment process, routing output files to configured directories based on file type.

## Installation

```bash
pnpm add --save-dev @testring/plugin-fs-store
```

## Export

The package exports a single default plugin function:

```typescript
import plugin from '@testring/plugin-fs-store';
```

## How It Works

### Plugin Registration (index.ts)

```typescript
import { PluginAPI } from '@testring/plugin-api';
import { cbGen } from './onFileName';

export default (pluginAPI: PluginAPI, config: Record<string, any>) => {
  const { staticPaths = {} } = config;
  const storeServer = pluginAPI.getFSStoreServer();
  storeServer.onFileNameAssign(cbGen(staticPaths));
};
```

1. Extracts `staticPaths` from the plugin config — a map of file types to output directories.
2. Gets the `FSStoreServer` via `pluginAPI.getFSStoreServer()`.
3. Registers a `onFileNameAssign` hook using the `cbGen()` callback generator.

### File Name Generation (onFileName.ts)

The `cbGen(staticPaths)` function returns an async callback with signature:

```typescript
(fName: string, reqData: IOnFileNameHookData) => Promise<string>
```

**Logic flow:**

1. **Skip if already altered** — If the incoming `fileName` differs from `fName`, another hook already changed it; return `fName` as-is.

2. **Build path from request** (`makePathNameFromRequest`):
   - If `meta.global === true` and `meta.fileName` is set, use its directory directly.
   - Otherwise, determine the base directory:
     - If `meta.type` exists in `staticPaths`, use that path.
     - Otherwise, fall back to `os.tmpdir()`.
   - Append `meta.extraPath` if present.
   - Build name parts based on `meta.uniqPolicy`:
     - If `FSFileUniqPolicy.worker` and `workerId` is set, prepend worker ID (with `/` replaced by `_`).
     - Append `meta.subtype` (string or array) to name parts.

3. **Generate unique file name** (`ensureUniqName`):
   - If no `meta.fileName` is provided, generate a unique name: `{nameParts}_{randomId}.{ext}`
   - Uses `ensureNewFile()` from `@testring/utils` to guarantee no collision.
   - If `meta.fileName` exists and `extraName` is not empty, insert the extra name before the extension.

4. **Return** the full path: `path.join(basePath, fileName)`.

### File Path Structure

```
{staticPath}/{extraPath}/{workerPrefix}_{subtype}_{uniqueId}.{ext}
```

Example with config `{ screenshot: './screens' }`:

```
./screens/worker-1_login-page_a3b2c.png
./screens/extra/worker-2_dashboard_d4e5f.png
```

## Configuration

### Plugin Config

```typescript
interface PluginConfig {
  staticPaths?: Record<string, string>;  // type → directory mapping
}
```

### In `.testringrc`

```json
{
  "plugins": [
    ["@testring/plugin-fs-store", {
      "staticPaths": {
        "screenshot": "./test-results/screenshots",
        "log": "./test-results/logs",
        "report": "./test-results/reports"
      }
    }]
  ]
}
```

### File Metadata (IOnFileNameHookData)

The hook receives request data with:

```typescript
interface IOnFileNameHookData {
  meta: {
    type: string;                          // file category (matches staticPaths keys)
    subtype?: string | string[];           // additional name segments
    ext?: string;                          // file extension (default: 'tmp')
    extraPath?: string;                    // extra subdirectory
    uniqPolicy?: FSFileUniqPolicy;         // 'worker' to prefix with worker ID
    workerId?: string;                     // override worker ID in meta
    preserveName?: boolean;                // if true, skip name part generation
    global?: boolean;                      // if true + fileName, use fileName's directory
    fileName?: string;                     // existing file name (skip unique generation)
  };
  workerId: string;                        // current test worker ID
}
```

## File Release Handling

The `cbGen` callback only handles **file name assignment** — it determines where files should be written. Actual file creation, writing, and cleanup are managed by `@testring/fs-store` (`FSScreenshotFactory`, `FSTextFactory`, etc.). This plugin's role is purely to route file names to the correct directories based on type.

When `meta.global` is `true` with a `fileName`, the file is treated as shared across workers (e.g., a summary report) and its path is used directly without worker-specific naming.

## Dependencies

- `@testring/plugin-api` — Plugin API interface
- `@testring/types` — `FSFileUniqPolicy`, `IOnFileNameHookData`
- `@testring/utils` — `generateUniqId`, `fs.ensureNewFile`, `fs.ensureDir`
- `path`, `os` — Node.js built-ins
