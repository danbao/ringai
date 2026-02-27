# @ringai/test-worker

Test worker module that manages compiling and executing tests using the `Sandbox` from `@ringai/sandbox`. Provides compilation hooks via the plugin system and in-process test execution with scoped API instances.

## Installation

```bash
pnpm add @ringai/test-worker --dev
```

## Architecture Overview

The module consists of two key components:

1. **TestWorker** — Main factory class (extends `PluggableModule`) that creates worker instances
2. **TestWorkerInstance** — Compiles test source code, creates a sandboxed execution environment with scoped API modules, and runs the test in-process

### Execution Model

```
┌──────────────────────────────────────────────────────────┐
│  Main Process                                            │
│                                                          │
│  TestWorker                                              │
│    .spawn() ──→ TestWorkerInstance                       │
│                   .execute(file, params, envParams)      │
│                       │                                  │
│                       ├── beforeCompile hook              │
│                       ├── compile hook (source → JS)      │
│                       ├── Create scoped API modules       │
│                       ├── Sandbox(source, path, deps,     │
│                       │          moduleOverrides)         │
│                       └── sandbox.execute()               │
│                            ├── Test calls run()           │
│                            ├── Bus events (started/       │
│                            │   finished/failed)           │
│                            └── Promise resolves/rejects   │
└──────────────────────────────────────────────────────────┘
```

## Exports

```typescript
import { TestWorker, TestWorkerInstance } from '@ringai/test-worker';
```

## TestWorker Class

The main entry point. Extends `PluggableModule` with two plugin hooks for compilation.

```typescript
import { TestWorker } from '@ringai/test-worker';
```

### Constructor

```typescript
class TestWorker extends PluggableModule implements ITestWorker {
    constructor(
        transport: ITransport,
        workerConfig: ITestWorkerConfig
    )
}
```

### Plugin Hooks

| Hook | Enum | Signature | Description |
|------|------|-----------|-------------|
| `beforeCompile` | `TestWorkerPlugin.beforeCompile` | `(paths: string[]) => Promise<string[]>` | Called before compilation with file paths |
| `compile` | `TestWorkerPlugin.compile` | `(source: string, filename: string) => Promise<string>` | Compiles source code (e.g., TypeScript to JavaScript) |

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `spawn()` | `TestWorkerInstance` | Creates a new worker instance with the configured transport, compiler hooks, and config |

### Usage

```typescript
import { TestWorker } from '@ringai/test-worker';
import { transport } from '@ringai/transport';
import { TestWorkerPlugin } from '@ringai/types';

const testWorker = new TestWorker(transport, {
    screenshots: 'disable',
    waitForRelease: false,
});

// Register a TypeScript compiler plugin
const compileHook = testWorker.getHook(TestWorkerPlugin.compile);
if (compileHook) {
    compileHook.writeHook('typescript', async (source, filename) => {
        if (filename.endsWith('.ts')) {
            return compileTypeScript(source);
        }
        return source;
    });
}

// Spawn a worker instance
const instance = testWorker.spawn();
```

## TestWorkerInstance Class

Manages compilation and in-process execution of test files. Uses `Sandbox` from `@ringai/sandbox` with module overrides to provide scoped API instances per test.

```typescript
import { TestWorkerInstance } from '@ringai/test-worker';
```

### Constructor

```typescript
class TestWorkerInstance implements ITestWorkerInstance {
    constructor(
        transport: ITransport,
        compile: FileCompiler,
        beforeCompile: (paths: string[], filePath: string, fileContent: string) => Promise<string[]>,
        workerConfig: Partial<ITestWorkerConfig>
    )
}
```

### Configuration

```typescript
interface ITestWorkerConfig {
    screenshots: ScreenshotsConfig;  // Screenshot capture mode
    waitForRelease: boolean;         // Wait for devtools release signal
}
```

Default config:
```typescript
{
    screenshots: 'disable',
    waitForRelease: false,
}
```

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `execute(file, parameters, envParameters)` | `Promise<void>` | Compiles source, creates a sandboxed environment, and runs the test. Resolves on success, rejects on failure. |
| `getWorkerID()` | `string` | Returns the unique worker ID (format: `worker/<uniqId>`) |
| `kill()` | `Promise<void>` | Aborts the current test execution via `AbortController`. |

### Execution Flow

1. **`execute(file, parameters, envParameters)`** is called
2. `beforeCompile` hook is invoked with file paths
3. Source is compiled via the `compile` hook (with caching)
4. A scoped `TestAPIController` is created for this execution
5. Module overrides are set up mapping `@ringai/api` and `ringai` to scoped versions
6. A `Sandbox` instance is created with the compiled source, dependencies, and module overrides
7. `sandbox.execute()` runs the test code
8. The test code calls the scoped `run()` which emits bus events (`started`/`finished`/`failed`)
9. On `finished`: the promise resolves
10. On `failed`: the promise rejects with the error

### Scoped API Modules

Each test execution gets its own scoped versions of the API modules. This ensures test isolation when running multiple tests:

```typescript
// Module overrides injected into the Sandbox
moduleOverrides.set('@ringai/api', {
    testAPIController: workerAPI,    // Scoped controller
    TestAPIController,
    TestContext,
    WebApplication,
    run: scopedRun,                  // Scoped run function
    beforeRun: scopedBeforeRun,
    afterRun: scopedAfterRun,
});
moduleOverrides.set('ringai', {
    run: scopedRun,
    default: scopedRun,
});
```

## Type Reference

### Enums

```typescript
const enum TestWorkerPlugin {
    beforeCompile = 'beforeCompile',
    compile = 'compile',
}

const enum TestWorkerAction {
    executeTest = 'TestWorkerAction/executeTest',
    executionComplete = 'TestWorkerAction/executionComplete',
    register = 'TestWorkerAction/register',
    updateExecutionState = 'TestWorkerAction/updateExecutionState',
    unregister = 'TestWorkerAction/unregister',
    evaluateCode = 'TestWorkerAction/evaluateCode',
    releaseTest = 'TestWorkerAction/releaseTest',
    pauseTestExecution = 'TestWorkerAction/pauseTestExecution',
    resumeTestExecution = 'TestWorkerAction/resumeTestExecution',
    runTillNextExecution = 'TestWorkerAction/runTillNextExecution',
}

const enum TestStatus {
    idle = 'idle',
    done = 'done',
    failed = 'failed',
}

const enum TestEvents {
    started = 'test/started',
    finished = 'test/finished',
    failed = 'test/failed',
}
```

### Interfaces

```typescript
interface ITestWorkerInstance {
    getWorkerID(): string;
    execute(file: IFile, parameters: any, envParameters: any): Promise<any>;
    kill(signal?: NodeJS.Signals): Promise<void>;
}

interface ITestWorkerConfig {
    screenshots: ScreenshotsConfig;
    waitForRelease: boolean;
}

interface ITestWorker {
    spawn(): ITestWorkerInstance;
}

interface ITestExecutionMessage {
    path: string;
    content: string;
    dependencies: Record<string, any>;
    parameters: Record<string, unknown>;
    envParameters: Record<string, unknown>;
    waitForRelease: boolean;
}
```

## Dependencies

- `@ringai/pluggable-module` — Plugin hook system (`PluggableModule`)
- `@ringai/transport` — Transport instance for broadcasting worker events
- `@ringai/sandbox` — `Sandbox` for test code execution
- `@ringai/api` — `TestAPIController`, `TestContext`, `WebApplication` for scoped test API
- `@ringai/async-breakpoints` — `BreakStackError` for devtools integration
- `@ringai/logger` — Logging via `loggerClient`
- `@ringai/utils` — `generateUniqId()`, `restructureError()`
- `@ringai/types` — All type definitions and enums

## Related Modules

- [`@ringai/sandbox`](./sandbox.md) — Code execution sandbox
- [`@ringai/test-run-controller`](./test-run-controller.md) — Orchestrates test runs using TestWorker
- [`@ringai/transport`](./transport.md) — Inter-process communication layer
- [`@ringai/api`](./api.md) — Test API and lifecycle events
