# @testring/sandbox

Code sandbox module providing isolated JavaScript execution environments for test files. Offers two implementations: a legacy `vm`-based sandbox and a modern `worker_threads`-based sandbox, plus ESM loader hooks for module mocking and instrumentation.

## Installation

```bash
pnpm add @testring/sandbox --dev
```

## Architecture Overview

The sandbox module provides three main subsystems:

1. **Sandbox** — Legacy `vm.createContext`-based execution (synchronous, in-process)
2. **SandboxWorkerThreads** — Modern `worker_threads`-based execution (async, isolated per-thread)
3. **ESMLoaderHooks** — Hook registry for intercepting ESM module loading, enabling mocking and code instrumentation

The `WorkerController` in `@testring/test-worker` uses `SandboxWorkerThreads` as its default execution engine.

## Sandbox Class (Legacy VM)

The `Sandbox` class executes source code inside a `vm.createContext()` with a custom `require()` implementation that resolves dependencies from a pre-built `DependencyDict`.

```typescript
import { Sandbox } from '@testring/sandbox';

type DependencyDict = Record<string, Record<string, { path: string; content: string }>>;
```

### Constructor

```typescript
class Sandbox {
    constructor(
        source: string,           // Source code to execute
        filename: string,         // Absolute file path (used for require resolution)
        dependencies: DependencyDict  // Pre-built dependency map
    )
}
```

On construction, the sandbox creates a proxied context and caches itself in a static `modulesCache` keyed by filename.

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `execute()` | `any` | Runs the source in a VM context, returns `module.exports`. Handles cyclic dependencies via `isCompiling` flag. |
| `getContext()` | `any` | Returns the proxied context object. |
| `static clearCache()` | `void` | Clears the global module cache (`modulesCache`). |
| `static evaluateScript(filename, code)` | `Promise<Sandbox>` | Evaluates additional code in an existing sandbox's context. Throws if the sandbox for `filename` doesn't exist in cache. |

### Context Environment

Each sandbox provides these variables to executed code:

```typescript
{
    __dirname: string,      // path.dirname(filename)
    __filename: string,     // The filename passed to constructor
    require: Function,      // Custom require: resolves from DependencyDict, falls back to requirePackage()
    module: {               // Proxied module object
        filename: string,
        id: string,
        exports: any        // Proxied to sandbox.exports
    },
    exports: any,           // Alias for module.exports (via proxy)
    global: any             // Self-referencing context proxy
}
```

### Dependency Resolution

The `require()` implementation:

1. Looks up the requested path in `dependencies[currentFilename]`
2. If found, creates a new `Sandbox` for the dependency (or uses cached) and calls `.execute()`
3. If not found, falls back to `requirePackage()` from `@testring/utils` for Node.js built-ins and installed packages

### Usage Example

```typescript
import { Sandbox } from '@testring/sandbox';

const dependencies = {
    '/tests/main.js': {
        './helper': {
            path: '/tests/helper.js',
            content: 'module.exports = { add: (a, b) => a + b };'
        }
    },
    '/tests/helper.js': {}
};

const sandbox = new Sandbox(
    'const h = require("./helper"); module.exports = h.add(2, 3);',
    '/tests/main.js',
    dependencies
);

const result = sandbox.execute(); // 5

// Clean up
Sandbox.clearCache();
```

## SandboxWorkerThreads Class

The `SandboxWorkerThreads` class runs test code in an isolated `worker_threads.Worker`. Internally it spawns a worker that recreates the legacy VM sandbox logic inside the thread, providing process-level isolation without the overhead of `child_process.fork()`.

```typescript
import { SandboxWorkerThreads, createSandboxWorkerThreads } from '@testring/sandbox';
```

### Constructor

```typescript
class SandboxWorkerThreads extends EventEmitter {
    constructor(
        source: string,           // Source code to execute
        filename: string,         // Absolute file path
        dependencies: DependencyDict  // Pre-built dependency map
    )
}
```

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `execute()` | `Promise<void>` | Spawns a fresh `Worker` thread, posts the source/filename/dependencies, waits for completion. Rejects on error or non-zero exit. |
| `static clearCache()` | `void` | No-op (each execution creates a fresh worker). |

### How It Works

1. A `Worker` is created with `eval: true` using an inlined script
2. The inlined script contains a minimal `VmSandbox` class (mirror of the legacy `Sandbox`)
3. The main thread sends an `execute` message with `{ source, filename, dependencies }`
4. The worker executes the code in a `vm.createContext` and posts back `{ ok: true }` or `{ ok: false, error }`
5. The worker is terminated after each execution

### Factory Function

```typescript
function createSandboxWorkerThreads(
    source: string,
    filename: string,
    dependencies: DependencyDict
): SandboxWorkerThreads
```

### Usage Example

```typescript
import { SandboxWorkerThreads } from '@testring/sandbox';

const sandbox = new SandboxWorkerThreads(
    'console.log("Hello from worker thread");',
    '/tests/hello.js',
    {}
);

await sandbox.execute();
```

## ESM Loader Hooks

The `ESMLoaderHooks` system provides a registry for intercepting ESM module loading, enabling test mocking and code instrumentation.

```typescript
import {
    ESMLoaderHooks,
    esmLoaderHooks,
    createESMLoader,
    createMock,
    createDefaultMock,
} from '@testring/sandbox';
```

### Types

```typescript
type MockedModule = {
    [key: string]: any;
};

type ModuleMock = {
    default?: MockedModule;       // Default export mock
    namedExports?: MockedModule;  // Named exports mock
};

type LoaderHook = {
    onLoad?: (specifier: string, context: any) => Promise<ModuleMock | null> | ModuleMock | null;
    onLoaded?: (specifier: string, module: any) => Promise<any> | any;
    onError?: (specifier: string, error: Error) => void;
};
```

### ESMLoaderHooks Class

Manages hooks and mocked modules:

| Method | Description |
|--------|-------------|
| `registerHook(pattern, hook)` | Register a `LoaderHook` for a module pattern (supports `*` wildcards) |
| `unregisterHook(pattern)` | Remove a registered hook |
| `mockModule(specifier, mock)` | Mock a specific module |
| `unmockModule(specifier)` | Remove a module mock |
| `clearMocks()` | Clear all mocked modules |
| `isMocked(specifier)` | Check if a module is mocked |
| `getMock(specifier)` | Get the mock for a specifier |
| `findMatchingHooks(specifier)` | Find all hooks matching a specifier (exact match or wildcard) |

### Global Instance

```typescript
// Pre-created singleton
export const esmLoaderHooks = new ESMLoaderHooks();
```

### createESMLoader(hook)

Creates a Node.js-compatible ESM loader object with `resolve` and `load` hooks. The loader:

- Checks for mocked modules and returns `data:` URLs with generated mock code
- Runs registered `onLoad` hooks during resolution
- Runs registered `onLoaded` hooks after loading

```typescript
const loader = createESMLoader({
    onLoad: async (specifier) => {
        if (specifier === './my-module') {
            return { default: { mock: true } };
        }
        return null;
    }
});
```

### createMock(namedExports)

Creates a `ModuleMock` with named exports:

```typescript
const mock = createMock({
    myFunction: () => 'mocked',
    myValue: 42,
});
esmLoaderHooks.mockModule('./my-module', mock);
```

### createDefaultMock(defaultExport)

Creates a `ModuleMock` with a default export:

```typescript
const mock = createDefaultMock({ foo: 'bar' });
esmLoaderHooks.mockModule('./my-module', mock);
```

## Script Class (Internal)

Thin wrapper around `vm.Script`:

```typescript
class Script {
    constructor(source: string, filename: string)
    runInContext(context: vm.Context, options?: vm.RunningScriptOptions): void
}
```

Used internally by the `Sandbox` class.

## Integration with Test Worker

The `WorkerController` in `@testring/test-worker` creates a `SandboxWorkerThreads` instance for each test execution:

```typescript
// Inside WorkerController.runTest()
const sandbox = new SandboxWorkerThreads(
    message.content,
    message.path,
    message.dependencies
);
await sandbox.execute();
```

After execution completes (or fails), `SandboxWorkerThreads.clearCache()` is called for cleanup.

## Dependencies

- `@testring/utils` — `requirePackage()` for fallback module resolution, `generateUniqId()`
- `@testring/logger` — Logging via `loggerClient`
- `node:vm` — VM context creation and script execution
- `node:worker_threads` — Worker thread isolation
- `node:url` — `fileURLToPath` for ESM loader hooks
