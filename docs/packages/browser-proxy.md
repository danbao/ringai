# @ringai/browser-proxy

Browser proxy module providing the bridge between the ringai framework and browser automation. The `BrowserProxyController` extends `PluggableModule` to load browser driver plugins dynamically and dispatch browser commands to them.

## Installation

```bash
pnpm add @ringai/browser-proxy --dev
```

## Exports

```typescript
import { BrowserProxyController } from '@ringai/browser-proxy';
```

## Architecture Overview

```
Main Process
┌──────────────────────────────┐
│  BrowserProxyController      │
│    extends PluggableModule   │
│    implements IBrowserProxy  │
│    Controller                │
│                              │
│    Loads plugin via hook     │
│    → requirePlugin()         │
│    → pluginFactory(config)   │
│    → IBrowserProxyPlugin     │
│                              │
│    Dispatches commands       │
│    directly on plugin        │
└──────────────────────────────┘
```

## BrowserProxyController Class

Extends `PluggableModule`. Loads a browser driver plugin via the `BrowserProxyPlugins.getPlugin` hook and dispatches browser commands directly to the plugin instance.

```typescript
import { BrowserProxyController } from '@ringai/browser-proxy';
```

### Constructor

```typescript
class BrowserProxyController extends PluggableModule implements IBrowserProxyController {
    constructor()
}
```

Takes no arguments. Registers the `BrowserProxyPlugins.getPlugin` hook via `PluggableModule`.

### Plugin Hook

| Hook | Enum | Description |
|------|------|-------------|
| `getPlugin` | `BrowserProxyPlugins.getPlugin` | Resolves the external browser plugin path and configuration |

### Methods

| Method | Description |
|--------|-------------|
| `init()` | Calls the `getPlugin` hook to obtain plugin path and config. Loads the plugin module via `requirePlugin()`, calls the factory function with the config, and stores the resulting `IBrowserProxyPlugin` instance. Logs a warning if no plugin is configured. |
| `execute(applicant, command)` | Looks up the `command.action` method on the loaded plugin and calls it with `(applicant, ...command.args)`. Throws if plugin is not initialized or the action method does not exist. |
| `kill()` | Calls `plugin.kill()` to terminate the browser, then clears the plugin reference. Logs errors but does not rethrow. |

### How It Works

1. On `init()`, the controller calls its `getPlugin` hook, which returns an `IBrowserProxyWorkerConfig` containing `{ plugin: string, config: any }`.
2. The `plugin` string is a module path loaded via `requirePlugin()` from `@ringai/utils`. The loaded module must export a factory function `(config) => IBrowserProxyPlugin`.
3. The factory is called with the config to produce an `IBrowserProxyPlugin` instance (e.g., `PlaywrightPlugin`).
4. On `execute()`, the controller dispatches the command by calling the named method on the plugin directly in-process.

### Usage Example

```typescript
import { BrowserProxyController } from '@ringai/browser-proxy';

const controller = new BrowserProxyController();

// Register the plugin hook (typically done by the plugin system)
controller.hook('getPlugin', (config) => ({
    plugin: '@ringai/plugin-playwright-driver/plugin',
    config: { browserName: 'chromium', launchOptions: { headless: true } },
}));

await controller.init();
await controller.execute('test-1', { action: 'url', args: ['https://example.com'] });
const title = await controller.execute('test-1', { action: 'getTitle', args: [] });
await controller.kill();
```

## Dependencies

- `@ringai/pluggable-module` — Plugin hook system
- `@ringai/logger` — Logging
- `@ringai/utils` — `requirePlugin()`
- `@ringai/types` — Type definitions and enums (`BrowserProxyPlugins`, `IBrowserProxyCommand`, `IBrowserProxyController`, `IBrowserProxyPlugin`, `IBrowserProxyWorkerConfig`)

## Related Modules

- [`@ringai/plugin-playwright-driver`](./plugin-playwright-driver.md) — Playwright browser driver plugin
- [`@ringai/web-application`](./web-application.md) — Web application testing layer
- [`@ringai/plugin-api`](../core-modules/plugin-api.md) — Plugin registration API
