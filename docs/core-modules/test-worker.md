# @testring/test-worker

Test worker module that manages spawning and executing tests in isolated processes. Provides the execution engine for the testring framework with support for child process isolation, local (in-process) execution, compilation hooks, and IPC-based communication via `@testring/transport`.

## Installation

```bash
pnpm add @testring/test-worker --dev
```

## Architecture Overview

The module consists of several key components:

1. **TestWorker** — Main factory class (extends `PluggableModule`) that creates worker instances
2. **TestWorkerInstance** — Manages a forked child process for isolated test execution
3. **TestWorkerLocal** — In-process worker for debugging (no child process)
4. **WorkerController** — Runs inside the child process, orchestrates test execution via `SandboxWorkerThreads`
5. **TestWorkerTinypool** — Experimental `worker_threads`-based alternative using Tinypool

### Process Model

```
Main Process                          Child Process (forked)
┌──────────────────┐                  ┌──────────────────────┐
│  TestWorker      │                  │  worker/index.ts     │
│    .spawn()  ────┼──── fork() ────→ │    WorkerController  │
│                  │                  │      .init()         │
│  TestWorkerInstance                 │                      │
│    .execute() ───┼── transport ───→ │    .executeTest()    │
│    .kill()       │                  │      SandboxWorker   │
│                  │  ← transport ──  │      Threads         │
└──────────────────┘                  └──────────────────────┘
```

## TestWorker Class

The main entry point. Extends `PluggableModule` with two plugin hooks for compilation.

```typescript
import { TestWorker } from '@testring/test-worker';
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
| `compile` | `TestWorkerPlugin.compile` | `(source: string, filename: string) => Promise<string>` | Compiles source code (e.g., TypeScript → JavaScript) |

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `spawn()` | `TestWorkerInstance` | Creates a new worker instance with the configured transport, compiler hooks, and config |

### Usage

```typescript
import { TestWorker } from '@testring/test-worker';
import { transport } from '@testring/transport';
import { TestWorkerPlugin } from '@testring/types';

const testWorker = new TestWorker(transport, {
    screenshots: 'disable',
    waitForRelease: false,
    localWorker: false,
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

Manages a single child process (or local worker) for test execution. Handles process lifecycle, IPC communication, and source compilation.

```typescript
import { TestWorkerInstance } from '@testring/test-worker';
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
    localWorker: boolean;            // Use in-process execution (no fork)
}
```

Default config:
```typescript
{
    screenshots: 'disable',
    waitForRelease: false,
    localWorker: false,
}
```

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `execute(file, parameters, envParameters)` | `Promise<void>` | Compiles and sends a test file for execution. Resolves on `TestStatus.done`, rejects on `TestStatus.failed`. |
| `getWorkerID()` | `string` | Returns the unique worker ID (format: `worker/<uniqId>`) |
| `kill(signal?)` | `Promise<void>` | Terminates the worker process. Default signal: `SIGTERM`. |

### Execution Flow

1. **`execute(file, parameters, envParameters)`** is called
2. `beforeCompile` hook is invoked with file paths
3. Source is compiled via the `compile` hook (with caching)
4. Worker process is initialized (forked if not already running)
5. Execution payload is sent via transport: `TestWorkerAction.executeTest`
6. Worker listens for `TestWorkerAction.executionComplete` response
7. Promise resolves/rejects based on `TestStatus`

### Worker Process Creation

When `localWorker` is `false` (default):
- Uses `fork()` from `@testring/child-process` to spawn a child process
- The child runs `worker/index.ts` which initializes a `WorkerController`
- The worker is registered with transport using the worker ID
- stdout/stderr are piped to the logger

When `localWorker` is `true`:
- Creates a `TestWorkerLocal` instance (in-process, no fork)
- Uses the same `WorkerController` but runs in the main process
- Useful for debugging since breakpoints and stack traces work directly

## TestWorkerLocal Class

In-process worker that implements `IWorkerEmitter`. Used when `localWorker: true`.

```typescript
class TestWorkerLocal extends EventEmitter implements IWorkerEmitter {
    constructor(transportInstance: ITransport)
}
```

| Method | Description |
|--------|-------------|
| `kill()` | Emits `'exit'` event |
| `send(message)` | Dispatches `executeTest` messages to the internal `WorkerController` |

## WorkerController Class

Runs inside the child process (or in-process for local mode). Orchestrates test execution using `SandboxWorkerThreads` from `@testring/sandbox`.

```typescript
class WorkerController {
    constructor(transport: ITransport, testAPI: TestAPIController)
}
```

### Methods

| Method | Description |
|--------|-------------|
| `init()` | Registers transport listener for `TestWorkerAction.executeTest` |
| `executeTest(message)` | Main execution method — sets up API, runs sandbox, handles completion/failure |

### Test Execution Flow (inside worker)

1. Broadcasts `TestWorkerAction.register` with execution state
2. If `waitForRelease` is set, registers devtools listeners (pause, resume, evaluate, release)
3. Creates a `SandboxWorkerThreads` instance with compiled source and dependencies
4. Configures `TestAPIController` with environment/test parameters and test ID
5. Calls `sandbox.execute()` — runs the test code
6. Listens for `TestEvents.started`/`finished`/`failed` from the test API bus
7. On completion: flushes callbacks, clears sandbox cache, broadcasts `executionComplete`

### Devtools Integration

When `waitForRelease: true`, the worker supports:

| Transport Action | Behavior |
|-----------------|----------|
| `evaluateCode` | Currently a no-op (SandboxWorkerThreads doesn't support live evaluation) |
| `releaseTest` | Breaks execution stack and completes successfully |
| `pauseTestExecution` | Adds a before-instruction breakpoint via `asyncBreakpoints` |
| `runTillNextExecution` | Resolves current breakpoint, adds after-instruction breakpoint |
| `resumeTestExecution` | Releases all breakpoints |

## TestWorkerTinypool Class (Experimental)

An experimental alternative that uses Tinypool (`worker_threads` pool) instead of `child_process.fork()`.

```typescript
import { TestWorkerTinypool, createTinypoolWorker } from '@testring/test-worker';
```

Benefits over child process:
- Lower overhead (no separate V8 instance)
- Shared memory support via `SharedArrayBuffer`
- Automatic worker recycling

```typescript
class TestWorkerTinypool extends EventEmitter implements IWorkerEmitter {
    constructor(transport: ITransport, workerScript: string)
    
    init(): Promise<void>
    executeTest(payload: any): Promise<void>
    send(message: any): boolean
    kill(): Promise<void>
}

function createTinypoolWorker(transport: ITransport, workerScript: string): TestWorkerTinypool
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
    localWorker: boolean;
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

- `@testring/pluggable-module` — Plugin hook system (`PluggableModule`)
- `@testring/child-process` — `fork()` for spawning worker processes
- `@testring/transport` — IPC message passing between main and worker processes
- `@testring/sandbox` — `SandboxWorkerThreads` for test code execution
- `@testring/api` — `TestAPIController` for test lifecycle events
- `@testring/async-breakpoints` — Breakpoint support for devtools integration
- `@testring/logger` — Logging via `loggerClient`
- `@testring/fs-store` — `FSStoreClient` for file system operations
- `@testring/utils` — `generateUniqId()`, `restructureError()`
- `@testring/types` — All type definitions and enums

## Related Modules

- [`@testring/sandbox`](./sandbox.md) — Code execution sandbox
- [`@testring/test-run-controller`](./index.md) — Orchestrates test runs using TestWorker
- [`@testring/transport`](./transport.md) — Inter-process communication layer
- [`@testring/api`](./api.md) — Test API and lifecycle events
