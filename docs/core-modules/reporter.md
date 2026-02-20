# @testring/reporter

Flexible test reporting system with built-in reporters (spec, dot, json) and support for custom reporter plugins.

## Installation

```bash
pnpm add @testring/reporter
```

## Overview

The reporter module provides:

- **`ReporterManager`** — orchestrates multiple reporters, dispatches lifecycle events
- **`TestReporter`** — abstract base class for building custom reporters
- **Built-in reporters** — `SpecReporter`, `DotReporter`, `JsonReporter`

## API Reference

### `ReporterManager` class

Manages multiple reporters and dispatches test lifecycle events to all of them.

```typescript
import { ReporterManager } from '@testring/reporter';
```

**Constructor:**

```typescript
new ReporterManager(
  configs?: IReporterConfig[],
  defaultOptions?: IReporterOptions,
)
```

| Parameter        | Type                | Default     | Description                                        |
| ---------------- | ------------------- | ----------- | -------------------------------------------------- |
| `configs`        | `IReporterConfig[]` | `[]`        | Array of reporter configurations                   |
| `defaultOptions` | `IReporterOptions`  | `{}`        | Default options merged into each reporter's options |

If no reporters are configured, `SpecReporter` is added by default.

**Built-in reporter map:**

| Name     | Class            | Description                        |
| -------- | ---------------- | ---------------------------------- |
| `'spec'` | `SpecReporter`   | Hierarchical pass/fail output      |
| `'dot'`  | `DotReporter`    | Compact dot-based progress         |
| `'json'` | `JsonReporter`   | Machine-readable JSON output       |
| `'list'` | `SpecReporter`   | Alias for `spec`                   |

**Methods:**

| Method                                                  | Return            | Description                                         |
| ------------------------------------------------------- | ----------------- | --------------------------------------------------- |
| `addReporter(config, defaultOptions?)`                  | `void`            | Add a reporter at runtime                           |
| `start(tests: ITestResult[])`                           | `void`            | Notify all reporters that a test run is starting    |
| `testPass(test: ITestResult)`                           | `void`            | Report a passed test                                |
| `testFail(test: ITestResult)`                           | `void`            | Report a failed test                                |
| `testSkip(test: ITestResult)`                           | `void`            | Report a skipped test                               |
| `testPending(test: ITestResult)`                        | `void`            | Report a pending test                               |
| `end(success: boolean, error?: string)`                 | `ITestRunResult`  | Finalize the run; returns aggregated results        |
| `error(err: Error)`                                     | `void`            | Report a runner-level error                         |
| `getState()`                                            | `ITestState`      | Get current test state snapshot                     |
| `getReporters()`                                        | `ITestReporter[]` | Get list of registered reporters                    |
| `close()`                                               | `Promise<void>`   | Close all reporters and release resources           |

**Example:**

```typescript
import { ReporterManager } from '@testring/reporter';

const manager = new ReporterManager([
  { reporter: 'spec', options: { colors: true, verbose: true } },
  { reporter: 'json' },
]);

manager.start(tests);
// ... during execution ...
manager.testPass(testResult);
manager.testFail(testResult);
const runResult = manager.end(true);
await manager.close();
```

---

### `TestReporter` abstract class

Base class for all reporters. Provides output helpers, color support, and duration formatting.

```typescript
import { TestReporter } from '@testring/reporter';
```

**Constructor:**

```typescript
new TestReporter(options?: IReporterOptions)
```

**Properties:**

| Property  | Type                  | Description                         |
| --------- | --------------------- | ----------------------------------- |
| `name`    | `string`              | Reporter name (override in subclass)|
| `output`  | `NodeJS.WriteStream`  | Output stream (default: `stdout`)   |
| `colors`  | `boolean`             | Color output enabled                |
| `verbose` | `boolean`             | Verbose output enabled              |

**Lifecycle methods** (override in subclasses):

| Method                                 | Description                        |
| -------------------------------------- | ---------------------------------- |
| `onStart(runInfo)`                     | Called when test run starts         |
| `onTestPass(test)`                     | Called when a test passes           |
| `onTestFail(test)`                     | Called when a test fails            |
| `onTestSkip(test)`                     | Called when a test is skipped       |
| `onTestPending(test)`                  | Called when a test is pending       |
| `onEnd(result)`                        | Called when test run ends           |
| `onError(error)`                       | Called on runner-level error        |
| `close()`                              | Async cleanup                      |

**Protected helper methods:**

| Method                        | Description                                        |
| ----------------------------- | -------------------------------------------------- |
| `write(text)`                 | Write to output stream                             |
| `writeln(text?)`              | Write line to output stream                        |
| `getColor(color)`             | Get ANSI color code (`red`, `green`, `yellow`, `blue`, `cyan`, `gray`, `bold`, `reset`) |
| `colorize(color, text)`       | Wrap text in ANSI color codes                      |
| `formatDuration(ms)`          | Format milliseconds as human-readable (`42ms`, `1.50s`, `2m 30s`) |

---

### Built-in Reporters

#### `SpecReporter`

Hierarchical test output similar to Mocha's spec reporter.

```
  ✓ should do something (42ms)
  ✗ should handle errors
      Expected value to be true
  ○ should be skipped
  ⊘ should be implemented later
```

- Shows full test title with pass/fail/skip/pending icons
- Displays error messages inline; stack traces in verbose mode
- Prints summary with counts and duration

#### `DotReporter`

Compact dot-based progress indicator.

```
  ....F..S.P....
```

| Symbol | Meaning |
| ------ | ------- |
| `.`    | Passed  |
| `F`    | Failed  |
| `S`    | Skipped |
| `P`    | Pending |

Line wraps at 80 characters. Prints summary at end.

#### `JsonReporter`

Outputs complete test results as formatted JSON. Ideal for CI pipelines and programmatic consumption.

```json
{
  "stats": {
    "suites": 1,
    "tests": 10,
    "passes": 8,
    "failures": 1,
    "skipped": 1,
    "pending": 0,
    "retries": 0,
    "start": "2026-01-01T00:00:00.000Z",
    "end": "2026-01-01T00:00:05.000Z",
    "duration": 5000
  },
  "tests": [...],
  "success": false,
  "error": "1 test failed"
}
```

---

## Interfaces

### `ITestReporter`

Base interface that all reporters must satisfy.

```typescript
interface ITestReporter {
  name: string;
  onStart?(runInfo: { startTime: number; tests: ITestResult[] }): void;
  onTestPass?(test: ITestResult): void;
  onTestFail?(test: ITestResult): void;
  onTestSkip?(test: ITestResult): void;
  onTestPending?(test: ITestResult): void;
  onEnd?(result: ITestRunResult): void;
  onError?(error: Error): void;
  close?(): void | Promise<void>;
}
```

### `ITestResult`

Represents a single test result.

```typescript
interface ITestResult {
  id: string;
  file: IFile;
  title: string;
  fullTitle: string;
  status: 'passed' | 'failed' | 'pending' | 'skipped';
  duration: number;
  error?: Error;
  retries: number;
  startTime: number;
  endTime: number;
}
```

### `ITestRunResult`

Represents the complete test run result.

```typescript
interface ITestRunResult {
  startTime: number;
  endTime: number;
  duration: number;
  tests: ITestResult[];
  state: ITestState;
  success: boolean;
  error?: string;
}
```

### `ITestState`

Current state counters for a test run.

```typescript
interface ITestState {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  pending: number;
  retries: number;
}
```

### `IReporterOptions`

Options passed to reporter constructors.

```typescript
interface IReporterOptions {
  output?: NodeJS.WriteStream;
  colors?: boolean;
  verbose?: boolean;
  [key: string]: unknown;
}
```

### `IReporterConfig`

Configuration for registering a reporter with `ReporterManager`.

```typescript
interface IReporterConfig {
  reporter: BuiltInReporter | ReporterConstructor | string;
  options?: IReporterOptions;
}
```

### `BuiltInReporter` type

```typescript
type BuiltInReporter = 'spec' | 'dot' | 'json' | 'list';
```

### `ReporterConstructor` type

```typescript
type ReporterConstructor = new (options?: IReporterOptions) => ITestReporter;
```

---

## Creating Custom Reporters

Extend `TestReporter` and override lifecycle methods:

```typescript
import { TestReporter } from '@testring/reporter';
import type { ITestResult, ITestRunResult, IReporterOptions } from '@testring/reporter';

export class TapReporter extends TestReporter {
  public name = 'tap';
  private count = 0;

  constructor(options: IReporterOptions = {}) {
    super(options);
  }

  override onStart(): void {
    this.writeln('TAP version 13');
  }

  override onTestPass(test: ITestResult): void {
    this.count++;
    this.writeln(`ok ${this.count} - ${test.fullTitle}`);
  }

  override onTestFail(test: ITestResult): void {
    this.count++;
    this.writeln(`not ok ${this.count} - ${test.fullTitle}`);
    if (test.error) {
      this.writeln(`  ---`);
      this.writeln(`  message: ${test.error.message}`);
      this.writeln(`  ---`);
    }
  }

  override onTestSkip(test: ITestResult): void {
    this.count++;
    this.writeln(`ok ${this.count} - ${test.fullTitle} # SKIP`);
  }

  override onEnd(result: ITestRunResult): void {
    this.writeln(`1..${result.state.total}`);
  }
}
```

Register it with `ReporterManager`:

```typescript
import { ReporterManager } from '@testring/reporter';
import { TapReporter } from './tap-reporter.js';

const manager = new ReporterManager([
  { reporter: TapReporter as any },
]);
```

Or implement the `ITestReporter` interface directly as a plain object:

```typescript
import type { ITestReporter, ITestResult } from '@testring/reporter';

const myReporter: ITestReporter = {
  name: 'my-reporter',
  onTestPass(test: ITestResult) {
    console.log(`PASS: ${test.title}`);
  },
  onTestFail(test: ITestResult) {
    console.error(`FAIL: ${test.title} - ${test.error?.message}`);
  },
};
```
