# @ringai/sandbox

Code sandbox module providing isolated JavaScript execution environments for test files. Uses Node.js `vm` module to create sandboxed contexts with custom `require()` implementations for dependency resolution and module overriding.

## Installation

```bash
pnpm add @ringai/sandbox --dev
```

## Architecture Overview

The sandbox module provides an in-process `vm.createContext`-based execution environment. The `TestWorkerInstance` in `@ringai/test-worker` uses `Sandbox` as its execution engine, injecting module overrides to provide scoped test API instances.

## Exports

```typescript
import { Sandbox } from '@ringai/sandbox';
```

## Sandbox Class

The `Sandbox` class executes source code inside a `vm.createContext()` with a custom `require()` implementation that resolves dependencies from a pre-built `DependencyDict` and supports module overrides.

```typescript
import { Sandbox } from '@ringai/sandbox';

type DependencyDict = Record<string, Record<string, { path: string; content: string }>>;
```

### Constructor

```typescript
class Sandbox {
    constructor(
        source: string,                       // Source code to execute
        filename: string,                     // Absolute file path (used for require resolution)
        dependencies: DependencyDict,         // Pre-built dependency map
        moduleOverrides?: Map<string, any>,   // Optional map of module name → mock exports
    )
}
```

On construction, the sandbox creates a proxied context and caches itself in a static `modulesCache` keyed by filename.

The `moduleOverrides` parameter allows callers to provide custom module implementations that take priority over the dependency dict and package resolution. This is used by `TestWorkerInstance` to inject scoped versions of `@ringai/api` and `ringai` modules per test execution.

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
3. If a `moduleOverrides` map is provided and contains the requested path, returns the override
4. Otherwise, falls back to `requirePackageSync()` from `@ringai/utils` for Node.js built-ins and installed packages

### Usage Example

```typescript
import { Sandbox } from '@ringai/sandbox';

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

### Module Overrides Example

```typescript
import { Sandbox } from '@ringai/sandbox';

const overrides = new Map<string, any>();
overrides.set('my-module', { greet: () => 'hello from override' });

const sandbox = new Sandbox(
    'const m = require("my-module"); module.exports = m.greet();',
    '/tests/override-test.js',
    {},
    overrides,
);

const result = sandbox.execute(); // 'hello from override'
Sandbox.clearCache();
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

The `TestWorkerInstance` in `@ringai/test-worker` creates a `Sandbox` instance for each test execution, injecting scoped API modules via `moduleOverrides`:

```typescript
// Inside TestWorkerInstance.runTest()
const moduleOverrides = new Map<string, any>();
moduleOverrides.set('@ringai/api', {
    testAPIController: workerAPI,
    TestAPIController,
    TestContext,
    WebApplication,
    run: scopedRun,
    beforeRun: scopedBeforeRun,
    afterRun: scopedAfterRun,
});
moduleOverrides.set('ringai', {
    run: scopedRun,
    default: scopedRun,
});

const sandbox = new Sandbox(
    message.content,
    message.path,
    message.dependencies,
    moduleOverrides,
);
await sandbox.execute();
```

## Dependencies

- `@ringai/utils` — `requirePackageSync()` for fallback module resolution
- `node:vm` — VM context creation and script execution
