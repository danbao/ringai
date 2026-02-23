# @ringai/plugin-api

Plugin API module that provides the plugin system infrastructure — plugin resolution, loading, initialization, and access to framework module hooks.

## Installation

```bash
pnpm add @ringai/plugin-api
```

## Overview

This module is the core of the ringai plugin system. It provides:

- **`PluginAPI`** — the object passed to every plugin function, giving access to framework module hooks
- **`PluginController`** — resolves, loads, and initializes plugins from configuration
- **`applyPlugins()`** — the entry point that wires plugins to framework modules

Plugins are functions that receive a `PluginAPI` instance and optionally a config object. They use the API to register read/write hooks on framework modules (logger, test worker, test run controller, browser proxy, FS reader, FS store server).

## API Reference

### `applyPlugins(pluginsDestinations, config)`

The main entry point for initializing plugins. Creates a `PluginController` and calls `initialize()` with the plugin list from config.

```typescript
import { applyPlugins } from '@ringai/plugin-api';

applyPlugins(moduleInstances, config);
```

**Parameters:**

| Parameter              | Type              | Description                                            |
| ---------------------- | ----------------- | ------------------------------------------------------ |
| `pluginsDestinations`  | `IPluginModules`  | Object containing framework module instances           |
| `config`               | `IConfig`         | Full ringai configuration (reads `config.plugins`)   |

### `PluginController` class

Handles plugin resolution, loading, validation, and initialization.

```typescript
import { PluginController } from '@ringai/plugin-api';

const controller = new PluginController(moduleInstances);
controller.initialize(config.plugins);
```

#### `controller.initialize(plugins)`

Iterates over the plugin list and processes each one. Accepts `undefined`, `null`, or an array. Each plugin entry can be:

- **A string** — the plugin module name (resolved via `requirePlugin`)
- **A tuple `[string, object]`** — plugin name and its configuration object

```typescript
controller.initialize([
  'playwright-driver',                     // string form
  ['my-custom-plugin', { timeout: 5000 }], // tuple with config
]);
```

**Plugin resolution flow:**

1. The plugin name is passed to `requirePlugin()` from `@ringai/utils`
2. `requirePlugin` tries these prefixed variants in order:
   - `@ringai/plugin-<name>`
   - `ringai-plugin-<name>`
   - `@ringai/<name>`
   - `<name>` as-is
3. The resolved module must export a function — if not, a `SyntaxError` is thrown
4. The function is called with `(pluginAPI, pluginConfig)` where `pluginAPI` is a `PluginAPI` instance and `pluginConfig` is the config object (or `null`)

### `PluginAPI` class

The object passed to each plugin function. Provides getter methods that return module-specific API wrappers for registering hooks.

```typescript
class PluginAPI {
  constructor(pluginName: string, modules: IPluginModules);

  getLogger(): LoggerAPI;
  getFSReader(): FSReaderAPI | null;
  getTestWorker(): TestWorkerAPI;
  getTestRunController(): TestRunControllerAPI;
  getBrowserProxy(): BrowserProxyAPI;
  getFSStoreServer(): FSStoreServerAPI;
}
```

Each getter creates a new API wrapper bound to the plugin's name and the corresponding module instance. The plugin name is used to identify which plugin registered each hook.

## Module APIs

All module API classes extend `AbstractAPI`, which provides `registryReadPlugin(hookName, callback)` (read-only hooks, for observation) and `registryWritePlugin(hookName, callback)` (write hooks, can modify data flowing through the pipeline).

### LoggerAPI

Access via `pluginAPI.getLogger()`.

| Method                        | Hook Type | Description                                              |
| ----------------------------- | --------- | -------------------------------------------------------- |
| `beforeLog(handler)`          | write     | Transform log entity before it is written. Receives `(logEntity, meta)`, must return modified `ILogEntity`. |
| `onLog(handler)`              | read      | Observe log entries after they are written. Receives `(logEntity, meta)`. |
| `onError(handler)`            | write     | Handle errors in the logger. Receives `(error, meta)`.   |

```typescript
export default (pluginAPI) => {
  const logger = pluginAPI.getLogger();

  logger.beforeLog((logEntity, meta) => {
    // Add custom metadata to every log entry
    return { ...logEntity, extra: { plugin: 'my-plugin' } };
  });

  logger.onLog((logEntity, meta) => {
    // Observe all log entries
    console.log(`[${logEntity.logLevel}] ${logEntity.content}`);
  });
};
```

### FSReaderAPI

Access via `pluginAPI.getFSReader()`. Returns `null` if no FS reader module is available.

| Method                        | Hook Type | Description                                              |
| ----------------------------- | --------- | -------------------------------------------------------- |
| `onBeforeResolve(callback)`   | write     | Transform file resolution input before resolving.        |
| `onAfterResolve(callback)`    | write     | Transform file resolution output after resolving.        |

```typescript
const fsReader = pluginAPI.getFSReader();

if (fsReader) {
  fsReader.onBeforeResolve(async (files) => {
    // Filter out temp files before resolution
    return files.filter(f => !f.includes('/temp/'));
  });

  fsReader.onAfterResolve(async (files) => {
    // Sort resolved files alphabetically
    return files.sort();
  });
}
```

### TestWorkerAPI

Access via `pluginAPI.getTestWorker()`.

| Method                        | Hook Type | Description                                              |
| ----------------------------- | --------- | -------------------------------------------------------- |
| `beforeCompile(handler)`      | write     | Transform compilation inputs. Receives `(paths, filenameEntry, codeEntry)`, must return modified `paths` array. |
| `compile(handler)`            | write     | Transform compiled code. Receives `(code, filename)`, must return modified code string. |

```typescript
const testWorker = pluginAPI.getTestWorker();

testWorker.compile(async (code, filename) => {
  // Transform code before execution (e.g., Babel, custom transforms)
  return transformCode(code, filename);
});

testWorker.beforeCompile(async (paths, filenameEntry, codeEntry) => {
  // Modify the list of paths to compile
  return paths.filter(p => !p.endsWith('.skip.ts'));
});
```

### TestRunControllerAPI

Access via `pluginAPI.getTestRunController()`.

| Method                        | Hook Type | Description                                              |
| ----------------------------- | --------- | -------------------------------------------------------- |
| `beforeRun(handler)`          | write     | Transform the test queue before execution starts. Receives `(queue: IQueuedTest[])`, must return modified queue. |
| `beforeTest(handler)`         | write     | Called before each individual test. Receives `(test: IQueuedTest)`. |
| `beforeTestRetry(handler)`    | write     | Called before a test retry. Receives `(test: IQueuedTest)`. |
| `afterTest(handler)`          | write     | Called after each individual test. Receives `(test: IQueuedTest)`. |
| `afterRun(handler)`           | write     | Called after all tests complete. Receives `(queue: IQueuedTest[])`. |
| `shouldNotExecute(handler)`   | write     | Control whether the entire test suite should be skipped. Receives `(state: boolean, queue: IQueuedTest[])`, must return boolean. |
| `shouldNotStart(handler)`     | write     | Control whether a specific test should be skipped. Receives `(state: boolean, test: IQueuedTest)`, must return boolean. |
| `shouldNotRetry(handler)`     | write     | Control whether a failed test should be retried. Receives `(state: boolean, test: IQueuedTest)`, must return boolean. |

```typescript
const controller = pluginAPI.getTestRunController();

controller.beforeRun(async (queue) => {
  console.log(`Running ${queue.length} tests`);
  return queue; // Must return the (possibly modified) queue
});

controller.shouldNotRetry(async (state, test) => {
  // Don't retry tests tagged with 'no-retry'
  if (test.path.includes('.no-retry.')) {
    return true;
  }
  return state;
});

controller.afterTest(async (test) => {
  console.log(`Finished: ${test.path}`);
});
```

### BrowserProxyAPI

Access via `pluginAPI.getBrowserProxy()`.

| Method                        | Hook Type | Description                                              |
| ----------------------------- | --------- | -------------------------------------------------------- |
| `proxyPlugin(pluginPath, config)` | write | Register a browser driver plugin. Only one plugin can register — subsequent calls throw an error. |

This is how browser driver plugins (like `@ringai/plugin-playwright-driver`) register themselves:

```typescript
export default (pluginAPI, pluginConfig) => {
  const browserProxy = pluginAPI.getBrowserProxy();

  browserProxy.proxyPlugin(
    '@ringai/plugin-playwright-driver/driver',
    pluginConfig || {},
  );
};
```

**Note:** Only one browser proxy plugin can be active at a time. If a second plugin tries to call `proxyPlugin()`, an error is thrown indicating which plugin already registered.

### FSStoreServerAPI

Access via `pluginAPI.getFSStoreServer()`.

| Method                        | Hook Type | Description                                              |
| ----------------------------- | --------- | -------------------------------------------------------- |
| `onFileNameAssign(handler)`   | write     | Transform the file name when a file is created in the FS store. Receives `(fileName, fileMetaData)`, must return the new file name string. |
| `onRelease(handler)`          | read      | Observe when a file is released from the FS store. Receives `(data: IOnFileReleaseHookData)`. |

```typescript
const fsStore = pluginAPI.getFSStoreServer();

fsStore.onFileNameAssign(async (fileName, metadata) => {
  // Customize file names for screenshots
  if (metadata.type === 'screenshot') {
    return `screenshots/${Date.now()}-${fileName}`;
  }
  return fileName;
});

fsStore.onRelease((data) => {
  console.log(`File released: ${data.fileName}`);
});
```

## Plugin Development

### Basic Plugin Structure

A plugin is a function exported as the default export of a module:

```typescript
// my-plugin.ts
import type { PluginAPI } from '@ringai/plugin-api';

export default (pluginAPI: PluginAPI, config: any) => {
  const logger = pluginAPI.getLogger();
  const controller = pluginAPI.getTestRunController();

  controller.beforeRun(async (queue) => {
    console.log(`[my-plugin] Starting ${queue.length} tests`);
    return queue;
  });

  logger.onLog((logEntity, meta) => {
    // Custom log processing
  });
};
```

### Plugin Configuration

Plugins are configured in the ringai configuration file (`.ringairc`, `.ringairc.js`, or `.ringairc.cjs`):

```javascript
// .ringairc.js
export default {
  plugins: [
    // String form — no config
    'playwright-driver',

    // Tuple form — with config
    ['my-custom-plugin', { timeout: 5000, retries: 3 }],

    // Local plugin path
    './plugins/my-local-plugin',

    // Scoped package
    '@my-org/ringai-plugin-reporter',
  ],
};
```

### Complete Plugin Example: Test Reporter

```typescript
// plugins/reporter.ts
import type { PluginAPI } from '@ringai/plugin-api';
import type { IQueuedTest } from '@ringai/types';

export default (pluginAPI: PluginAPI) => {
  const controller = pluginAPI.getTestRunController();
  const logger = pluginAPI.getLogger();

  let startTime: number;
  let totalTests = 0;

  controller.beforeRun(async (queue) => {
    startTime = Date.now();
    totalTests = queue.length;
    return queue;
  });

  controller.afterTest(async (test) => {
    // Log each test completion
  });

  controller.afterRun(async (queue) => {
    const duration = Date.now() - startTime;
    console.log(`Completed ${totalTests} tests in ${duration}ms`);
  });
};
```

## Type Definitions

```typescript
// Plugin descriptor in config
type ConfigPluginDescriptor = string | [string, object];

// Framework modules passed to PluginAPI
interface IPluginModules {
  logger: IPluggableModule;
  fsReader?: IPluggableModule;
  testWorker: IPluggableModule;
  testRunController: IPluggableModule;
  browserProxy: IPluggableModule;
  fsStoreServer: IPluggableModule;
}

// Plugin function signature
type PluginFunction = (api: PluginAPI, config: object | null) => void;
```

## Dependencies

- `@ringai/types` — Type definitions (`IConfig`, `IPluginModules`, `ConfigPluginDescriptor`)
- `@ringai/utils` — `requirePlugin` for plugin resolution and loading
- `@ringai/fs-store` — `fsStoreServerHooks` constants for FS store hook names

## Related Modules

- [`@ringai/utils`](./utils.md) — Plugin resolution (`requirePlugin`)
- [`@ringai/pluggable-module`](./pluggable-module.md) — Hook system foundation
- [`@ringai/cli-config`](./cli-config.md) — Configuration management
- [`@ringai/transport`](./transport.md) — Inter-process communication
