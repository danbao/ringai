# Plugin Development

This guide covers how to create and use plugins with the testring framework.

## Plugin Usage

### Configuration

Plugins are configured in `.testringrc` (JSON) or `.testringrc.js` (ESM):

```json
{
    "plugins": [
        "testring-plugin-logger-fs",

        ["testring-plugin-test-metadata", {
            "format": "json"
        }],

        ["@testring/plugin-playwright-driver", {
            "headless": true
        }]
    ]
}
```

### CLI Arguments

Plugins can also be specified via CLI:

```bash
testring run --plugins=testring-plugin-1 --plugins=testring-plugin-2
```

## Plugin API

Every plugin receives a `PluginAPI` instance and an optional user configuration object. The `PluginAPI` provides access to the framework's core modules:

```typescript
import type { PluginAPI } from '@testring/plugin-api';

export default (pluginAPI: PluginAPI, userConfig?: Record<string, unknown>) => {
    // Available PluginAPI methods:

    // Get the logger instance for this plugin
    const logger = pluginAPI.getLogger();

    // Get the file system reader (may be null)
    const fsReader = pluginAPI.getFSReader();

    // Get the test worker controller
    const testWorker = pluginAPI.getTestWorker();

    // Get the test run controller
    const testRunController = pluginAPI.getTestRunController();

    // Get the browser proxy
    const browserProxy = pluginAPI.getBrowserProxy();

    // Get the file system store server
    const fsStoreServer = pluginAPI.getFSStoreServer();
};
```

### PluginAPI Methods

| Method | Return Type | Description |
|--------|-------------|-------------|
| `getLogger()` | `LoggerAPI` | Prefixed logger for the plugin |
| `getFSReader()` | `FSReaderAPI \| null` | File system reader (null if unavailable) |
| `getTestWorker()` | `TestWorkerAPI` | Test worker process controller |
| `getTestRunController()` | `TestRunControllerAPI` | Test run lifecycle controller |
| `getBrowserProxy()` | `BrowserProxyAPI` | Browser automation proxy |
| `getFSStoreServer()` | `FSStoreServerAPI` | File system store for artifacts |

## Creating a Plugin

### Simple Logger Plugin

```typescript
// testring-plugin-custom-logger/src/index.ts
import type { PluginAPI } from '@testring/plugin-api';

interface CustomLoggerConfig {
    logErrors?: boolean;
    outputFile?: string;
}

export default (pluginAPI: PluginAPI, userConfig?: CustomLoggerConfig) => {
    const logger = pluginAPI.getLogger();

    logger.onLog((log) => {
        switch (log.type) {
            case 'error':
                if (userConfig?.logErrors) {
                    console.error(...log.content);
                }
                break;

            default:
                console.log(...log.content);
        }
    });
};
```

### Test Lifecycle Plugin

```typescript
// testring-plugin-test-reporter/src/index.ts
import type { PluginAPI } from '@testring/plugin-api';

interface ReporterConfig {
    outputFormat?: 'json' | 'text';
}

export default (pluginAPI: PluginAPI, userConfig?: ReporterConfig) => {
    const testRunController = pluginAPI.getTestRunController();
    const logger = pluginAPI.getLogger();

    testRunController.onStart(() => {
        logger.info('Test run started');
    });

    testRunController.onFinish((results) => {
        logger.info('Test run finished', results);
    });
};
```

### Browser Interaction Plugin

```typescript
// testring-plugin-screenshots/src/index.ts
import type { PluginAPI } from '@testring/plugin-api';

interface ScreenshotConfig {
    outputDir?: string;
    onFailure?: boolean;
}

export default (pluginAPI: PluginAPI, userConfig?: ScreenshotConfig) => {
    const browserProxy = pluginAPI.getBrowserProxy();
    const logger = pluginAPI.getLogger();
    const outputDir = userConfig?.outputDir ?? './screenshots';

    // Hook into browser proxy for screenshot capabilities
    logger.info(`Screenshots plugin initialized, output: ${outputDir}`);
};
```

## Hook System

Testring uses the [hookable](https://github.com/unjs/hookable) library (via `PluggableModule`) for its plugin hook system. Core modules extend `PluggableModule` and expose lifecycle hooks.

### How Hooks Work

```typescript
import { PluggableModule } from '@testring/pluggable-module';

// Core modules extend PluggableModule
class MyModule extends PluggableModule {
    constructor() {
        // Declare available hooks
        super(['beforeAction', 'afterAction']);
    }

    async performAction() {
        // Call hooks at lifecycle points
        await this.callHook('beforeAction', data);
        // ... do work ...
        await this.callHook('afterAction', result);
    }
}
```

### Registering Hooks

Plugins can register hook handlers using the hookable API:

```typescript
import { PluggableModule } from '@testring/pluggable-module';

// Register a single hook
module.registerHook('beforeAction', async (data) => {
    console.log('Before action:', data);
});

// Register multiple hooks at once
module.registerHooks({
    beforeAction: async (data) => { /* ... */ },
    afterAction: async (result) => { /* ... */ },
});

// Hook into every hook call (debugging)
module.hookBefore((event) => {
    console.log('Hook triggered:', event);
});
```

## Plugin Package Structure

A testring plugin follows this standard ESM package structure:

```
testring-plugin-my-feature/
├── src/
│   └── index.ts           # Plugin entry point
├── dist/                  # Built output (ESM)
├── test/
│   └── index.spec.ts      # Plugin tests
├── package.json           # "type": "module"
├── tsconfig.json
├── tsconfig.build.json
└── tsup.config.ts         # Build configuration
```

### package.json

```json
{
    "name": "testring-plugin-my-feature",
    "version": "1.0.0",
    "type": "module",
    "main": "./dist/index.js",
    "exports": {
        ".": "./dist/index.js"
    },
    "scripts": {
        "build": "tsup",
        "test": "vitest run"
    },
    "peerDependencies": {
        "@testring/plugin-api": "^0.8.0",
        "@testring/types": "^0.8.0"
    },
    "devDependencies": {
        "@testring/plugin-api": "^0.8.0",
        "@testring/types": "^0.8.0",
        "tsup": "^8.0.0",
        "typescript": "^5.4.0",
        "vitest": "^3.0.0"
    }
}
```

### tsup.config.ts

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['esm'],
    target: 'es2022',
    dts: true,
    sourcemap: true,
    clean: true,
});
```

## Testing Plugins

Use Vitest to test your plugin:

```typescript
// test/index.spec.ts
import { describe, it, expect, vi } from 'vitest';
import myPlugin from '../src/index.js';

describe('My Plugin', () => {
    it('should initialize with pluginAPI', () => {
        const mockLogger = {
            onLog: vi.fn(),
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
        };

        const mockPluginAPI = {
            getLogger: vi.fn(() => mockLogger),
            getFSReader: vi.fn(() => null),
            getTestWorker: vi.fn(),
            getTestRunController: vi.fn(),
            getBrowserProxy: vi.fn(),
            getFSStoreServer: vi.fn(),
        };

        myPlugin(mockPluginAPI as any, { logErrors: true });

        expect(mockPluginAPI.getLogger).toHaveBeenCalled();
        expect(mockLogger.onLog).toHaveBeenCalled();
    });
});
```

## Existing Plugins

Refer to these existing plugins in the `packages/` directory for real-world examples:

| Plugin | Description |
|--------|-------------|
| `@testring/plugin-playwright-driver` | Playwright browser automation driver |
| `@testring/plugin-babel` | Babel transpilation for test files |
| `@testring/plugin-fs-store` | File system storage for test artifacts |

## Summary

1. Plugins receive a `PluginAPI` instance with access to core modules
2. The hook system is powered by [hookable](https://github.com/unjs/hookable) via `PluggableModule`
3. Use ESM (`"type": "module"`) and TypeScript for plugin packages
4. Build with tsup, test with Vitest
5. Install dependencies with pnpm
