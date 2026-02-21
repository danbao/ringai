# @testring/logger

Distributed logging system providing structured log output with multi-process aggregation, level-based filtering, step grouping, and plugin hooks.

## Installation

```bash
pnpm add @testring/logger
```

## Overview

The logger module has a **client-server** architecture:

- **`LoggerServer`** — runs in the main process, receives log entries from all workers via `@testring/transport`, filters by log level, formats output, and invokes plugin hooks
- **`LoggerClient`** / **`AbstractLoggerClient`** — runs in each worker (and the main process), provides the logging API, and broadcasts log entries to the server
- **`loggerClient`** — pre-instantiated singleton exported for direct use

## API Reference

### `LoggerServer` class

Extends [`PluggableModule`](./pluggable-module.md). Processes and outputs log entries from all processes.

```typescript
import { LoggerServer } from '@testring/logger';
```

**Constructor:**

```typescript
new LoggerServer(
  config: IConfigLogger,
  transportInstance: ITransport,
  stdout: NodeJS.WritableStream,
  numberOfRetries?: number,
  shouldSkip?: boolean,
)
```

| Parameter          | Type                    | Default | Description                                     |
| ------------------ | ----------------------- | ------- | ----------------------------------------------- |
| `config`           | `IConfigLogger`         | —       | Log level and silent mode configuration          |
| `transportInstance` | `ITransport`           | —       | Transport for receiving log messages from workers |
| `stdout`           | `NodeJS.WritableStream` | —       | Output stream for formatted log messages         |
| `numberOfRetries`  | `number`                | `0`     | Retry count on plugin errors before failing      |
| `shouldSkip`       | `boolean`               | `false` | Skip failed entries instead of throwing after retries |

**Plugin hooks** (registered in constructor):

| Hook         | Type  | Arguments                    | Description                                |
| ------------ | ----- | ---------------------------- | ------------------------------------------ |
| `beforeLog`  | write | `(logEntity, meta)`          | Transform log entry before output; return modified entry. Set `muteStdout: true` on the entry to suppress console output |
| `onLog`      | read  | `(logEntity, meta)`          | Observe log entry after output             |
| `onError`    | read  | `(error, meta)`              | Observe errors during hook/output processing |

**Queue processing:** Log entries are queued and processed sequentially. If `config.silent` is `true` or the entry's level is below `config.logLevel`, the entry is discarded without queuing.

#### `getQueueStatus(): LogQueueStatus`

Returns `'EMPTY'` or `'RUNNING'`.

---

### `LogLevelNumeric` enum

Numeric ordering used for level filtering:

```typescript
import { LogLevelNumeric } from '@testring/logger';
```

| Name      | Value | Description               |
| --------- | ----- | ------------------------- |
| `verbose` | `0`   | Most detailed output      |
| `debug`   | `1`   | Debug information         |
| `info`    | `2`   | General information       |
| `warning` | `3`   | Warnings                  |
| `error`   | `4`   | Errors only               |
| `silent`  | `5`   | No output                 |

---

### `LoggerClient` class

Extends `AbstractLoggerClient`. Broadcasts log entries universally via transport (main process ↔ all workers).

```typescript
import { LoggerClient } from '@testring/logger';
```

### `loggerClient` singleton

Pre-instantiated `LoggerClient` using the default transport. This is the primary import for logging throughout the framework:

```typescript
import { loggerClient } from '@testring/logger';

loggerClient.info('Test started');
loggerClient.error('Something failed', error);
```

---

### `AbstractLoggerClient` class

Base class providing the full logging API. Both `LoggerClient` and any custom client implementations extend this class.

**Constructor:**

```typescript
new AbstractLoggerClient(
  transportInstance?: ITransport,
  prefix?: string | null,
  marker?: string | number | null,
  stepStack?: Stack<stepEntity>,
)
```

#### Logging Methods

All methods accept variadic arguments that become the `content` array in the log entry.

| Method                    | Log Type     | Log Level  | Description                  |
| ------------------------- | ------------ | ---------- | ---------------------------- |
| `log(...args)`            | `log`        | `info`     | General log message          |
| `info(...args)`           | `info`       | `info`     | Informational message        |
| `success(...args)`        | `success`    | `info`     | Success message              |
| `warn(...args)`           | `warning`    | `warning`  | Warning message              |
| `error(...args)`          | `error`      | `error`    | Error message                |
| `debug(...args)`          | `debug`      | `debug`    | Debug message                |
| `verbose(...args)`        | `debug`      | `verbose`  | Verbose debug message        |
| `screenshot(filename, content)` | `screenshot` | `info` | Screenshot capture entry   |
| `file(filename, meta?)`   | `file`       | `info`     | File reference entry         |
| `media(...args)`          | `media`      | `info`     | Media content entry          |

#### Step Methods

Steps provide hierarchical grouping of log entries. Steps can be nested — each new `startStep` pushes onto an internal stack.

| Method                          | Description                                                    |
| ------------------------------- | -------------------------------------------------------------- |
| `startStep(message, stepType?)` | Push a new step onto the stack and emit a step log entry       |
| `endStep(message?, ...args)`    | Pop steps until matching `message` is found; optionally log args |
| `endAllSteps()`                 | Pop all steps from the stack                                   |
| `step(message, callback, stepType?)` | Wraps `startStep` / `endStep` around an async callback    |

**Typed step shortcuts:** `startStepLog`, `startStepInfo`, `startStepDebug`, `startStepSuccess`, `startStepWarning`, `startStepError` — each calls `startStep` with the corresponding `LogStepTypes` value. Similarly `stepLog`, `stepInfo`, `stepDebug`, `stepSuccess`, `stepWarning`, `stepError`.

```typescript
// Automatic step lifecycle
await loggerClient.step('Login flow', async () => {
  loggerClient.info('Navigating to login page');
  await page.goto('/login');
  loggerClient.info('Filling credentials');
  await page.fill('#user', 'admin');
});

// Manual step control
loggerClient.startStep('Setup');
loggerClient.info('Preparing environment');
loggerClient.endStep('Setup');
```

#### Logger Derivation Methods

| Method                                          | Description                                         |
| ----------------------------------------------- | --------------------------------------------------- |
| `withPrefix(prefix)`                            | Returns a new logger instance with the given prefix |
| `withMarker(marker)`                            | Returns a new logger instance with the given marker |
| `createNewLogger(prefix?, marker?, stepStack?)` | Returns a new logger instance with full customization; shares the same step stack by default |

```typescript
const testLogger = loggerClient.withPrefix('[LoginTest]');
testLogger.info('Starting test');
// Output: ... | [LoginTest] Starting test

const markedLogger = loggerClient.withMarker(42);
```

## Log Entry Format

Each log entry (`ILogEntity`) contains:

```typescript
interface ILogEntity {
  time: Date;
  type: LogTypes;          // log, info, warning, error, debug, step, screenshot, file, media, success
  logLevel: LogLevel;      // verbose, debug, info, warning, error, silent
  content: any[];          // variadic arguments passed to the log method
  stepUid: string | null;  // current step ID (for step entries)
  stepType: LogStepTypes | null;
  parentStep: string | null;
  prefix: string | null;
  marker: string | number | null;
  muteStdout?: boolean;    // set by beforeLog plugin to suppress console output
}
```

### Console Output Format

```
HH:MM:SS | LEVEL     | PROCESS    | [prefix] message
```

Examples:
```
10:15:32 | info      | main       | Test started
10:15:33 | debug     | worker-1   | Loading test file: login.spec.ts
10:15:34 | warning   | worker-2   | Test retry: 2nd attempt
10:15:35 | error     | worker-1   | Assertion failed
10:15:35 | info      | worker-1   | [screenshot] Filename: failure.png;
10:15:36 | info      | worker-1   | [step] Login flow
```

On macOS terminals with emoji support, log levels display as emoji icons (`ℹ`, `🔍`, `⚠`, `✖`, `🔈`).

## Configuration

```typescript
interface IConfigLogger {
  logLevel: 'verbose' | 'debug' | 'info' | 'warning' | 'error' | 'silent';
  silent: boolean;
}
```

**CLI:**
```bash
testring run --logLevel debug
testring run --silent
```

**Configuration file (`.testringrc`):**
```json
{
  "logLevel": "info",
  "silent": false
}
```

## Writing Logger Plugins

```typescript
// my-logger-plugin.ts
export default (pluginAPI) => {
  const logger = pluginAPI.getLogger();

  // Transform entries before output
  logger.beforeLog((logEntity, meta) => {
    return {
      ...logEntity,
      content: [`[${new Date().toISOString()}]`, ...logEntity.content],
    };
  });

  // Observe entries after output (e.g., send to external service)
  logger.onLog((logEntity, meta) => {
    if (logEntity.logLevel === 'error') {
      externalReporter.send(logEntity);
    }
  });

  // Handle processing errors
  logger.onError((error, meta) => {
    console.error('Logger plugin error:', error);
  });
};
```

## Dependencies

- `@testring/pluggable-module` — Plugin hook base class
- `@testring/transport` — Inter-process message passing
- `@testring/utils` — `Queue`, `Stack`, `generateUniqId`
- `@testring/types` — Type definitions
- `chalk` — Terminal color formatting

## Related Modules

- [`@testring/pluggable-module`](./pluggable-module.md) — Base class for `LoggerServer`
- [`@testring/transport`](./transport.md) — Delivers log entries from workers to server
- [`@testring/plugin-api`](./plugin-api.md) — Exposes `getLogger()` for plugin authors
