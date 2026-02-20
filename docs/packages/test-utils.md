# @testring/test-utils

Testing utilities for the testring framework. Provides mock implementations of core interfaces (`ITransport`, `ITestWorker`, `IBrowserProxyController`), file-system helpers, and a browser-driver plugin compatibility tester.

## Installation

```bash
pnpm add --save-dev @testring/test-utils
```

## Exports

```typescript
import {
  TransportMock,
  TestWorkerMock,
  BrowserProxyControllerMock,
  fileReaderFactory,
  fileResolverFactory,
  PluginCompatibilityTester,
  type CompatibilityTestConfig,
} from '@testring/test-utils';
```

## TransportMock

A mock implementation of `ITransport` (from `@testring/types`) built on Node.js `EventEmitter`. All broadcast/send methods emit events locally, making it easy to test message-driven logic without real IPC.

```typescript
import { TransportMock } from '@testring/test-utils';

const transport = new TransportMock();

// Listen for messages — returns an unsubscribe function
const off = transport.on('test.start', (payload, source) => {
  console.log(payload, source);
});

// Broadcast emits locally
transport.broadcast('test.start', { file: 'app.spec.ts' });

// Clean up
off();
```

### API

```typescript
class TransportMock extends EventEmitter implements ITransport {
  // Emit messageType with payload
  broadcast<T>(messageType: string, payload: T): void;

  // Emit messageType with payload and processID as source
  broadcastFrom<T>(messageType: string, payload: T, processID: string): void;

  // Same as broadcast (local-only mock)
  broadcastLocal<T>(messageType: string, payload: T): void;

  // Same as broadcast (mock has no remote distinction)
  broadcastUniversally<T>(messageType: string, payload: T): void;

  // Emit messageType with payload (src is ignored in mock)
  send<T>(src: string, messageType: string, payload: T): Promise<void>;

  // Subscribe — returns unsubscribe function
  on<T>(messageType: string, callback: (m: T, source?: string) => void): () => void;

  // Subscribe once — returns unsubscribe function
  once<T>(messageType: string, callback: (m: T, source?: string) => void): () => void;

  // Subscribe once, filtered by processID source
  onceFrom<T>(processID: string, messageType: string, callback: (m: T, source?: string) => void): () => void;

  // Register a child process emitter
  registerChild(processID: string, process: IWorkerEmitter): void;

  // Always returns true (mock assumes child-process context)
  isChildProcess(): boolean;

  // Return empty arrays (no real processes)
  getProcessStdioConfig(): any[];
  getProcessesList(): any[];
}
```

## TestWorkerMock

A mock implementation of `ITestWorker` that creates `TestWorkerMockInstance` objects. Configurable to simulate success or failure with optional delays.

```typescript
import { TestWorkerMock } from '@testring/test-utils';

// Success with 100 ms delay
const worker = new TestWorkerMock(false, 100);

const instance = worker.spawn();
console.log(instance.getWorkerID()); // 'worker/test'

await instance.execute(); // resolves after 100 ms
await instance.kill();

console.log(worker.$getSpawnedCount());        // 1
console.log(worker.$getExecutionCallsCount()); // 1
console.log(worker.$getKillCallsCount());      // 1
```

### Simulating failures

```typescript
const failWorker = new TestWorkerMock(true, 50);
const inst = failWorker.spawn();

try {
  await inst.execute(); // rejects after 50 ms
} catch (err) {
  // err === { test: 'file.js', error: Error('test') }
}
```

### API

```typescript
class TestWorkerMock implements ITestWorker {
  constructor(shouldFail?: boolean, executionDelay?: number);

  // Create a new worker instance
  spawn(): TestWorkerMockInstance;

  // Introspection helpers (prefixed with $)
  $getSpawnedCount(): number;
  $getKillCallsCount(): number;       // sum across all instances
  $getExecutionCallsCount(): number;  // sum across all instances
  $getInstanceName(): string;         // workerID of first instance
  $getErrorInstance(): any;           // error object of first instance
}

class TestWorkerMockInstance implements ITestWorkerInstance {
  getWorkerID(): string;           // always 'worker/test'
  execute(): Promise<void>;        // resolves or rejects based on config
  kill(): Promise<void>;           // resolves pending execute, clears timeout

  $getKillCallsCount(): number;
  $getExecuteCallsCount(): number;
  $getErrorInstance(): any;        // { test: 'file.js', error: Error('test') }
}
```

## BrowserProxyControllerMock

A minimal mock of `IBrowserProxyController` that records every command for later assertion.

```typescript
import { BrowserProxyControllerMock } from '@testring/test-utils';

const controller = new BrowserProxyControllerMock();

await controller.init();
await controller.execute('app', { command: 'click', args: ['#btn'] });
await controller.execute('app', { command: 'url', args: ['https://example.com'] });

// Inspect recorded commands
const commands = controller.$getCommands();
console.log(commands.length); // 2
console.log(commands[0]);     // { command: 'click', args: ['#btn'] }

await controller.kill();
```

### API

```typescript
class BrowserProxyControllerMock implements IBrowserProxyController {
  init(): Promise<void>;
  execute(applicant: string, command: IBrowserProxyCommand): Promise<number>;  // always returns 1
  kill(): Promise<void>;

  // Introspection
  $getCommands(): IBrowserProxyCommand[];
}
```

## fileResolverFactory()

Creates a function that resolves file paths relative to a root directory.

```typescript
import { fileResolverFactory } from '@testring/test-utils';

const resolve = fileResolverFactory('/project', 'test', 'fixtures');

resolve('data.json');
// → '/project/test/fixtures/data.json'

resolve('..', 'other.json');
// → '/project/test/other.json'
```

### Signature

```typescript
function fileResolverFactory(...root: string[]): (...file: string[]) => string;
```

Uses `path.resolve()` internally — the root segments and file segments are concatenated and resolved.

## fileReaderFactory()

Creates an async function that reads a file as UTF-8 text, relative to a root directory.

```typescript
import { fileReaderFactory } from '@testring/test-utils';

const readFixture = fileReaderFactory('/project', 'test', 'fixtures');

const content = await readFixture('sample.html');
console.log(content); // file contents as string
```

### Signature

```typescript
function fileReaderFactory(...root: string[]): (source: string) => Promise<string>;
```

Uses `fs.readFile` with `'utf8'` encoding. Rejects with `NodeJS.ErrnoException` if the file does not exist.

## PluginCompatibilityTester

A test harness that verifies an `IBrowserProxyPlugin` implementation has all required methods and can perform common browser operations (navigation, element queries, form interactions, JS execution, screenshots, wait operations, session management, error handling).

```typescript
import { PluginCompatibilityTester } from '@testring/test-utils';
import type { CompatibilityTestConfig } from '@testring/test-utils';

const config: CompatibilityTestConfig = {
  pluginName: 'my-driver',
  skipTests: ['screenshots'],
  customTimeouts: {
    waitForExist: 10000,
    waitForVisible: 8000,
  },
};

const tester = new PluginCompatibilityTester(myPlugin, config);

// Run all tests at once
const results = await tester.runAllTests();
console.log(`Passed: ${results.passed}, Failed: ${results.failed}, Skipped: ${results.skipped}`);
```

### CompatibilityTestConfig

```typescript
interface CompatibilityTestConfig {
  pluginName: string;
  skipTests?: string[];         // lowercase, no-spaces test names to skip
  customTimeouts?: {
    [method: string]: number;   // timeout overrides in milliseconds
  };
}
```

### Individual Test Methods

Each method tests a specific aspect of the plugin and can be run independently:

| Method | Tests |
|--------|-------|
| `testMethodImplementation()` | All required `IBrowserProxyPlugin` method names exist and are functions |
| `testBasicNavigation()` | `url()`, `getTitle()`, `refresh()`, `getSource()`, `end()` |
| `testElementQueries()` | `isExisting()`, `isVisible()`, `getText()` |
| `testFormInteractions()` | `setValue()`, `getValue()`, `clearValue()`, `isEnabled()`, `isSelected()` |
| `testJavaScriptExecution()` | `execute()`, `executeAsync()` with arguments |
| `testScreenshots()` | `makeScreenshot()` returns a non-empty string |
| `testWaitOperations()` | `waitForExist()`, `waitForVisible()`, `waitUntil()` |
| `testSessionManagement()` | Multiple independent sessions via different applicant IDs |
| `testErrorHandling()` | Clicking non-existent elements throws, ending non-existent sessions is graceful |

### runAllTests()

Runs every test in sequence, respects `skipTests`, calls `plugin.kill()` at the end:

```typescript
async runAllTests(): Promise<{
  passed: number;
  failed: number;
  skipped: number;
}>;
```

### Skip Test Names

Use these lowercase, no-space names in `skipTests`:

`methodimplementation`, `basicnavigation`, `elementqueries`, `forminteractions`, `javascriptexecution`, `screenshots`, `waitoperations`, `sessionmanagement`, `errorhandling`

## Dependencies

- **`@testring/types`** — `ITransport`, `ITestWorker`, `ITestWorkerInstance`, `IBrowserProxyController`, `IBrowserProxyCommand`, `IBrowserProxyPlugin`, `IWorkerEmitter`

## Related Modules

- **`@testring/transport`** — Production transport implementation
- **`@testring/test-worker`** — Production test worker
- **`@testring/browser-proxy`** — Production browser proxy controller
- **`@testring/plugin-playwright-driver`** — Playwright-based browser driver plugin
