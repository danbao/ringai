# @ringai/api

Test API module that provides the core test execution interface, test lifecycle management, and test context for the ringai framework.

## Installation

```bash
pnpm add @ringai/api
```

## Overview

This module serves as the primary API layer for writing and executing tests in ringai. It provides:

- The `run()` function — the main entry point for test execution
- `beforeRun()` and `afterRun()` lifecycle callbacks
- `TestAPIController` — manages test ID, parameters, environment, and event bus
- `TestContext` — the `api` object passed into every test function, providing logging, web application access, and parameter retrieval
- Re-export of `WebApplication` from `@ringai/web-application`

## API Reference

### `run(...tests)`

The main entry point for test execution. Accepts one or more test functions, creates a `TestContext` instance, and runs each test sequentially.

```typescript
import { run } from '@ringai/api';

type TestFunction = (api: TestContext) => void | Promise<void>;

async function run(...tests: Array<TestFunction>): Promise<void>;
```

**Execution flow:**

1. Emits `started` event on the bus
2. Flushes all registered `beforeRun` callbacks
3. Starts a logger step for the current test ID
4. Calls each test function sequentially with the `TestContext` as both `this` and the first argument
5. On success: ends the logger step with "Test passed", emits `finished` event
6. On failure: restructures the error, ends the logger step with "Test failed", emits `failed` event with the error
7. In all cases: the `afterRun` callbacks include `api.end()` which stops all web application instances

```typescript
import { run } from '@ringai/api';

await run(async (api) => {
  await api.application.url('https://example.com');
  await api.log('Page loaded');
});
```

#### Running Multiple Tests Sequentially

```typescript
import { run } from '@ringai/api';

const loginTest = async (api) => {
  await api.application.url('/login');
  await api.application.setValue('#username', 'testuser');
  await api.application.setValue('#password', 'secret');
  await api.application.click('#login-btn');
};

const dashboardTest = async (api) => {
  await api.log('Checking dashboard');
  const title = await api.application.getTitle();
  await api.log('Dashboard title:', title);
};

await run(loginTest, dashboardTest);
```

### `beforeRun(callback)` / `afterRun(callback)`

Register lifecycle callbacks that run before/after the test functions.

```typescript
import { beforeRun, afterRun } from '@ringai/api';

beforeRun(async () => {
  // Runs before the first test function
  console.log('Setting up test environment');
});

afterRun(async () => {
  // Runs after all test functions complete (or on failure)
  console.log('Cleaning up');
});
```

`beforeRun` callbacks are flushed (executed and cleared) at the start of `run()`, after the `started` event. They are wrapped with `@ringai/async-breakpoints` for debugger support.

The `run()` function automatically registers an `afterRun` callback that calls `api.end()` to stop all web application instances.

### `TestAPIController` class

Manages the test state: test ID, parameters, environment parameters, lifecycle callbacks, and the event bus.

```typescript
import { testAPIController } from '@ringai/api';
```

#### `testAPIController.setTestID(testID)` / `testAPIController.getTestID()`

Set and get the unique identifier for the current test.

```typescript
testAPIController.setTestID('user-login-e2e');
const id = testAPIController.getTestID(); // 'user-login-e2e'
```

#### `testAPIController.setTestParameters(params)` / `testAPIController.getTestParameters()`

Set and get test-specific parameters (arbitrary object).

```typescript
testAPIController.setTestParameters({
  username: 'testuser',
  timeout: 5000,
});

const params = testAPIController.getTestParameters();
```

#### `testAPIController.setEnvironmentParameters(params)` / `testAPIController.getEnvironmentParameters()`

Set and get environment-specific parameters (arbitrary object).

```typescript
testAPIController.setEnvironmentParameters({
  baseUrl: 'https://staging.example.com',
});

const env = testAPIController.getEnvironmentParameters();
```

#### `testAPIController.getBus()`

Returns the `BusEmitter` instance for the current test. The bus emits these events:

| Event      | Payload         | When                                 |
| ---------- | --------------- | ------------------------------------ |
| `started`  | —               | Test execution begins                |
| `finished` | —               | All test functions completed successfully |
| `failed`   | `Error`         | A test function threw an error       |

```typescript
const bus = testAPIController.getBus();
bus.on('failed', (error) => {
  console.error('Test failed:', error.message);
});
```

The `BusEmitter` extends `EventEmitter` and provides typed methods:

```typescript
class BusEmitter extends EventEmitter {
  async startedTest(): Promise<void>;
  async finishedTest(): Promise<void>;
  async failedTest(error: Error): Promise<void>;
}
```

#### `testAPIController.registerBeforeRunCallback(callback)` / `testAPIController.registerAfterRunCallback(callback)`

Low-level registration of lifecycle callbacks. Prefer using `beforeRun()` and `afterRun()` from the top-level exports.

#### `testAPIController.flushBeforeRunCallbacks()` / `testAPIController.flushAfterRunCallbacks()`

Executes all registered callbacks in order and clears the list. Both methods integrate with `@ringai/async-breakpoints` (waiting before and after instruction breakpoints).

### `testAPIController` singleton

A pre-created instance exported from the module:

```typescript
import { testAPIController } from '@ringai/api';
```

### `TestContext` class

The test context object passed as the `api` argument to each test function. Provides web application access, logging, parameter access, and custom application management.

#### `api.application`

A lazily-created `WebApplication` instance bound to the current test ID and transport. Created on first access.

```typescript
await api.application.url('https://example.com');
await api.application.click('#submit');
const text = await api.application.getText('.result');
```

#### `api.log(...message)` / `api.logError(...message)` / `api.logWarning(...message)`

Log messages at info, error, and warning levels. All messages are prefixed with `[logged inside test]`.

```typescript
await api.log('Step completed:', stepName);
await api.logWarning('Slow response detected');
await api.logError('Element not found:', selector);
```

#### `api.logBusiness(message)` / `api.stopLogBusiness()`

Start and stop a named business-level logging step. Calling `logBusiness()` again automatically stops the previous step.

```typescript
await api.logBusiness('User registration flow');
// ... test steps ...
await api.stopLogBusiness();
```

#### `api.getParameters()` / `api.getEnvironment()`

Retrieve the test parameters and environment parameters from the `TestAPIController`.

```typescript
const params = api.getParameters();
const env = api.getEnvironment();
const baseUrl = env.baseUrl;
```

#### `api.initCustomApplication<T>(Constructor)`

Creates a custom `WebApplication` subclass instance, bound to the current test ID and transport.

```typescript
import { WebApplication } from '@ringai/web-application';

class AdminApp extends WebApplication {
  async loginAsAdmin() {
    await this.url('/admin/login');
    await this.setValue('#user', 'admin');
    await this.click('#login');
  }
}

const admin = api.initCustomApplication(AdminApp);
await admin.loginAsAdmin();
```

#### `api.getCustomApplicationsList()`

Returns an array of all custom `WebApplication` instances created via `initCustomApplication()`.

#### `api.end()`

Stops the default `application` and all custom applications. Called automatically during `afterRun`. Returns a `Promise` that resolves when all applications have ended.

#### `api.cloneInstance<O>(obj)`

Creates a shallow clone of the `TestContext` merged with the provided object. Useful for extending the context.

### `WebApplication` re-export

The `WebApplication` class from `@ringai/web-application` is re-exported for convenience:

```typescript
import { WebApplication } from '@ringai/api';
```

## Complete Example

```typescript
import { run, beforeRun, afterRun, testAPIController } from '@ringai/api';

testAPIController.setTestParameters({
  username: 'testuser@example.com',
  password: 'secure123',
});

testAPIController.setEnvironmentParameters({
  baseUrl: 'https://staging.example.com',
});

beforeRun(async () => {
  console.log('Test starting:', testAPIController.getTestID());
});

afterRun(async () => {
  console.log('Test completed');
});

await run(async (api) => {
  const { baseUrl } = api.getEnvironment();
  const { username, password } = api.getParameters();

  await api.logBusiness('Login flow');
  await api.application.url(`${baseUrl}/login`);
  await api.application.setValue('#email', username);
  await api.application.setValue('#password', password);
  await api.application.click('#login-btn');
  await api.log('Login submitted');
  await api.stopLogBusiness();

  await api.logBusiness('Dashboard verification');
  const title = await api.application.getTitle();
  await api.log('Dashboard title:', title);
  await api.stopLogBusiness();
});
```

## Dependencies

- `@ringai/web-application` — `WebApplication` class
- `@ringai/async-breakpoints` — Async breakpoint integration in lifecycle callbacks
- `@ringai/logger` — `loggerClient` for logging and step management
- `@ringai/transport` — `transport` singleton for web application IPC
- `@ringai/utils` — `restructureError` for error normalization
- `@ringai/types` — Type definitions (`TestEvents`, `ITestQueuedTestRunData`)

## Related Modules

- [`@ringai/test-worker`](./test-worker.md) — Runs test files in worker processes (invokes `run()`)
- [`@ringai/test-run-controller`](./test-run-controller.md) — Orchestrates test execution
- [`@ringai/web-application`](../packages/web-application.md) — Web application abstraction
- [`@ringai/async-breakpoints`](./async-breakpoints.md) — Debugger breakpoint support
