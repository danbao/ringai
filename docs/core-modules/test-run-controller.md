# @testring/test-run-controller

Orchestrates the execution of a test queue across one or more worker processes. Extends `PluggableModule` to provide a rich set of lifecycle hooks for plugins to observe and control test execution, retries, and scheduling.

## Installation

```bash
pnpm add @testring/test-run-controller
```

## Overview

The `TestRunController` is the scheduling core of the testring framework. Given a set of test files, it:

1. Prepares a `Queue<IQueuedTest>` from the file list, calling the `beforeRun` hook to allow plugins to modify the queue
2. Spawns worker processes (or runs locally) up to the configured `workerLimit`
3. Dequeues tests one at a time per worker, calling `beforeTest` / `afterTest` hooks around each execution
4. Handles failures with configurable retry logic (`retryCount`, `retryDelay`), consulting `shouldNotRetry` before re-queuing
5. Supports `bail` mode to stop on the first failure
6. Applies per-test timeouts via `testTimeout`

## API Reference

### `TestRunController` class

```typescript
import { TestRunController } from '@testring/test-run-controller';

const controller = new TestRunController(config, testWorker, devtoolConfig);
```

**Constructor:**

| Parameter       | Type                              | Default | Description                              |
| --------------- | --------------------------------- | ------- | ---------------------------------------- |
| `config`        | `IConfig`                         | —       | Framework configuration object           |
| `testWorker`    | `ITestWorker`                     | —       | Worker factory (provides `spawn()`)      |
| `devtoolConfig` | `IDevtoolRuntimeConfiguration \| null` | `null`  | Optional devtool runtime configuration   |

The constructor registers all plugin hooks from `TestRunControllerPlugins`.

---

#### `controller.runQueue(testSet)`

Prepares the test queue and executes all tests. Returns a promise that resolves to an array of errors (if any tests failed) or `null` (if all passed).

```typescript
const errors = await controller.runQueue(testFiles);

if (errors) {
  console.error(`${errors.length} test(s) failed`);
} else {
  console.log('All tests passed');
}
```

| Parameter | Type          | Description                  |
| --------- | ------------- | ---------------------------- |
| `testSet` | `IFile[]`     | Array of test files to run   |

Returns `Promise<Error[] | null>`.

**Internal flow:**

1. `prepareTests()` wraps each `IFile` into an `IQueuedTest`, then calls the `beforeRun` write-hook so plugins can filter or reorder the queue
2. `executeQueue()` calls `shouldNotExecute` — if the hook returns `true`, the run is skipped and `null` is returned
3. Based on `config.workerLimit`:
   - `'local'` — creates one worker, runs tests sequentially in the current process
   - `number` — creates `min(workerLimit, queue.length)` workers, runs tests in parallel across child processes
4. After all tests complete (or an error is thrown with `bail`), the `afterRun` hook is called

---

#### `controller.kill()`

Kills all active worker processes and clears the test queue. Use this for graceful shutdown.

```typescript
await controller.kill();
```

Returns `Promise<void>`.

---

### `IQueuedTest` interface

Each test in the queue is represented by this structure:

```typescript
interface IQueuedTest {
  retryCount: number;       // Current retry attempt (0-based)
  retryErrors: Array<any>;  // Errors accumulated across retries
  test: IFile;              // The test file ({ path, content })
  parameters: any;          // Test parameters (includes runData)
  envParameters: any;       // Environment parameters from config
}
```

When a test fails and is re-queued for retry, `retryCount` is incremented and the error is pushed to `retryErrors`.

---

### `TestRunControllerPlugins` enum

Defines all available plugin hook names. The controller registers these hooks via `PluggableModule`:

```typescript
const enum TestRunControllerPlugins {
  beforeRun = 'beforeRun',
  beforeTest = 'beforeTest',
  afterTest = 'afterTest',
  beforeTestRetry = 'beforeTestRetry',
  afterRun = 'afterRun',
  shouldNotExecute = 'shouldNotExecute',
  shouldNotStart = 'shouldNotStart',
  shouldNotRetry = 'shouldNotRetry',
}
```

## Plugin Hooks

All hooks are accessed through the `PluggableModule` system. Plugins typically register via the `@testring/plugin-api` wrapper rather than calling `getHook()` directly.

### Lifecycle hooks

#### `beforeRun` (write hook)

Called after the test queue is prepared but before any test is executed. Receives the test queue array and can return a modified version.

```typescript
// Plugin example: filter out skipped tests
pluginAPI.getTestRunController().beforeRun((testQueue) => {
  return testQueue.filter((item) => !item.test.path.includes('.skip.'));
});
```

**Signature:** `(testQueue: IQueuedTest[]) => IQueuedTest[] | void`

#### `beforeTest` (read hook)

Called before each individual test execution. Receives the queued test and worker metadata.

**Signature:** `(queuedTest: IQueuedTest, workerMeta: ITestWorkerCallbackMeta) => void`

#### `afterTest` (read hook)

Called after each test completes (whether it passed or failed). Receives the queued test, the error (or `null` on success), and worker metadata.

**Signature:** `(queuedTest: IQueuedTest, error: Error | null, workerMeta: ITestWorkerCallbackMeta) => void`

#### `beforeTestRetry` (read hook)

Called when a failed test is about to be re-queued for retry (after the retry delay). Receives the queued test, the error that caused the failure, and worker metadata.

**Signature:** `(queuedTest: IQueuedTest, error: Error, workerMeta: ITestWorkerCallbackMeta) => void`

#### `afterRun` (read hook)

Called after the entire test queue finishes. Receives `null` on success or an `Error` if the run failed.

**Signature:** `(error: Error | null) => void`

### Control hooks (write hooks)

These hooks return a boolean to control execution flow.

#### `shouldNotExecute`

Called before the queue starts. Return `true` to skip the entire test run.

**Signature:** `(shouldSkip: boolean, testQueue: Queue<IQueuedTest>) => boolean`

#### `shouldNotStart`

Called before each individual test. Return `true` to skip that specific test.

**Signature:** `(shouldSkip: boolean, queuedTest: IQueuedTest, workerMeta: ITestWorkerCallbackMeta) => boolean`

#### `shouldNotRetry`

Called when a test fails and a retry is being considered. Return `true` to prevent the retry.

**Signature:** `(shouldNotRetry: boolean, queuedTest: IQueuedTest, workerMeta: ITestWorkerCallbackMeta) => boolean`

## Configuration

The controller reads the following fields from `IConfig`:

| Field            | Type                | Default          | Description                                              |
| ---------------- | ------------------- | ---------------- | -------------------------------------------------------- |
| `workerLimit`    | `number \| 'local'` | `1`              | Number of parallel workers, or `'local'` for in-process  |
| `restartWorker`  | `boolean`           | `false`          | Restart each worker after every test execution           |
| `retryCount`     | `number`            | `3`              | Maximum number of retries for a failed test              |
| `retryDelay`     | `number`            | `2000`           | Delay (ms) before retrying a failed test                 |
| `testTimeout`    | `number`            | `900000` (15min) | Per-test timeout in milliseconds                         |
| `bail`           | `boolean`           | `false`          | Stop the entire run on the first test failure            |
| `screenshots`    | `ScreenshotsConfig` | `'disable'`      | `'disable'`, `'enable'`, or `'afterError'`               |
| `screenshotPath` | `string`            | `'./_tmp/'`      | Directory for screenshot output                          |
| `debug`          | `boolean`           | `false`          | Enables debug info in run data                           |
| `logLevel`       | `LogLevel`          | `'info'`         | Log level passed to workers                              |
| `devtool`        | `boolean`           | `false`          | Enables devtool runtime configuration                    |
| `envParameters`  | `object`            | `{}`             | Environment parameters passed to each test               |

## Usage Example

```typescript
import { TestRunController } from '@testring/test-run-controller';
import { TestWorker } from '@testring/test-worker';

const config = {
  workerLimit: 4,
  retryCount: 2,
  retryDelay: 1000,
  testTimeout: 60000,
  bail: false,
  screenshots: 'afterError',
  screenshotPath: './screenshots/',
  debug: false,
  logLevel: 'info',
  envParameters: { baseUrl: 'http://localhost:3000' },
};

const testWorker = new TestWorker(config);
const controller = new TestRunController(config, testWorker);

const testFiles = [
  { path: './tests/login.spec.js', content: '' },
  { path: './tests/checkout.spec.js', content: '' },
];

const errors = await controller.runQueue(testFiles);

if (errors) {
  process.exit(1);
}
```

## Source Files

| File                          | Description                                    |
| ----------------------------- | ---------------------------------------------- |
| `src/test-run-controller.ts`  | `TestRunController` class                      |
| `src/index.ts`                | Re-export                                      |

## Dependencies

- `@testring/pluggable-module` — plugin hook system base class
- `@testring/logger` — logging via `loggerClient`
- `@testring/utils` — `Queue` data structure
- `@testring/types` — `IConfig`, `IQueuedTest`, `TestRunControllerPlugins`, and related types

## Related Modules

- `@testring/test-worker` — creates and manages worker process instances
- `@testring/plugin-api` — provides the plugin-facing API that wraps these hooks
- `@testring/cli` — invokes `runQueue()` as part of the `run` command
