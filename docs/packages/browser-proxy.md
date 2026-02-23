# @ringai/browser-proxy

Browser proxy module providing the bridge between the ringai framework and browser automation. Offers two architectures: the legacy controller-based approach using child process isolation with IPC, and the new simplified `BrowserProxyPlaywright` class that calls Playwright APIs directly.

## Installation

```bash
pnpm add @ringai/browser-proxy --dev
```

## Architecture Overview

The module provides two distinct approaches to browser automation:

### Legacy Architecture (Controller + Worker + Plugin)

```
Main Process                          Child Process (forked)
┌──────────────────────────┐          ┌─────────────────────────┐
│  BrowserProxyController  │          │  browser-proxy/index.ts │
│    extends PluggableModule          │    BrowserProxy          │
│                          │          │      loads plugin        │
│  BrowserProxyWorker ─────┼─ fork ──→│      dispatches commands │
│    (manages child proc)  │          │                         │
│                          │          │  IBrowserProxyPlugin     │
│  BrowserProxyLocalWorker │          │    (e.g., Playwright,   │
│    (in-process variant)  │          │     Playwright driver)  │
└──────────────────────────┘          └─────────────────────────┘
```

### New Architecture (Direct Playwright)

```
Main Process
┌────────────────────────────────┐
│  BrowserProxyPlaywright        │
│    implements IBrowserProxyPlugin│
│                                │
│    Playwright Browser          │
│      → BrowserContext          │
│        → Page                  │
│          → Locator API         │
└────────────────────────────────┘
```

## BrowserProxyPlaywright Class (Recommended)

Direct Playwright integration without child process overhead. Implements `IBrowserProxyPlugin` with all standard browser actions.

```typescript
import { BrowserProxyPlaywright, createBrowserProxyPlaywright } from '@ringai/browser-proxy';
```

### Constructor

```typescript
class BrowserProxyPlaywright implements IBrowserProxyPlugin {
    constructor(config?: {
        browserName?: 'chromium' | 'firefox' | 'webkit';
        launchOptions?: {
            headless?: boolean;
            args?: string[];
            executablePath?: string;
            devtools?: boolean;
            [key: string]: any;
        };
        contextOptions?: {
            viewport?: { width: number; height: number };
            ignoreHTTPSErrors?: boolean;
            recordVideo?: { dir: string };
            [key: string]: any;
        };
    })
}
```

Defaults:
- `browserName`: `'chromium'`
- `launchOptions`: `{ headless: true, args: [] }`
- `contextOptions`: `{}`

### Lifecycle Methods

| Method | Description |
|--------|-------------|
| `init()` | Launches browser, creates context and page. No-op if already initialized. |
| `kill()` | Closes page, context, and browser. |
| `end(applicant)` | Alias for `kill()`. |

### Navigation

| Method | Description |
|--------|-------------|
| `url(applicant, val)` | Navigate to URL via `page.goto(val)` |
| `getTitle(applicant)` | Returns `page.title()` |
| `refresh(applicant)` | Reloads page via `page.reload()` |
| `getSource(applicant)` | Returns full page HTML via `page.content()` |

### Element Interactions

| Method | Description |
|--------|-------------|
| `click(applicant, selector)` | Click element via Playwright locator |
| `doubleClick(applicant, selector)` | Double-click via `locator.dblclick()` |
| `getText(applicant, selector)` | Get `textContent()` |
| `getValue(applicant, selector)` | Get `inputValue()` |
| `setValue(applicant, selector, value)` | Fill input via `locator.fill()` |
| `clearValue(applicant, selector)` | Clear input via `locator.clear()` |
| `keys(applicant, value)` | Type text via `page.keyboard.type()` |
| `moveToObject(applicant, selector, x, y)` | Hover element via `locator.hover()` |
| `dragAndDrop(applicant, source, dest)` | Drag via `locator.dragTo()` |

### Element State

| Method | Returns | Description |
|--------|---------|-------------|
| `isVisible(applicant, selector)` | `boolean` | `locator.isVisible()` |
| `isEnabled(applicant, selector)` | `boolean` | `locator.isEnabled()` |
| `isSelected(applicant, selector)` | `boolean` | `locator.isChecked()` |
| `isExisting(applicant, selector)` | `boolean` | `locator.count() > 0` |

### Waiting

| Method | Description |
|--------|-------------|
| `waitForExist(applicant, selector, timeout?)` | Wait for element attached (default 30s) |
| `waitForVisible(applicant, selector, timeout?)` | Wait for element visible (default 30s) |
| `waitForValue(applicant, selector, timeout?, reverse?)` | Wait for visible/hidden state |
| `waitForSelected(applicant, selector, timeout?, reverse?)` | Wait for visible/hidden state |
| `waitUntil(applicant, condition, timeout?, msg?, interval?)` | Poll condition until true |

### Script Execution

| Method | Description |
|--------|-------------|
| `execute(applicant, fn, args)` | `page.evaluate(fn, ...args)` |
| `executeAsync(applicant, fn, args)` | Wraps function with callback pattern |

### Select Operations

| Method | Description |
|--------|-------------|
| `selectByIndex(applicant, selector, index)` | Select option by index |
| `selectByValue(applicant, selector, value)` | Select option by value |
| `selectByVisibleText(applicant, selector, text)` | Select option by label |
| `selectByAttribute(applicant, selector, attr, value)` | Select option by attribute |

### Attribute & Style

| Method | Description |
|--------|-------------|
| `getAttribute(applicant, selector, attr)` | Get element attribute |
| `getHTML(applicant, selector)` | Get `innerHTML()` |
| `getCssProperty(applicant, selector, prop)` | Get computed CSS property |
| `getSize(applicant, selector)` | Get `boundingBox()` dimensions |
| `getTagName(applicant, selector)` | Get tag name (lowercase) |

### Window/Tab Operations

| Method | Description |
|--------|-------------|
| `newWindow(applicant, url, name, features)` | Opens new page in context |
| `getCurrentTabId(applicant)` | Returns current page index |
| `getTabIds(applicant)` | Returns array of page indices |
| `switchTab(applicant, tabId)` | Switches active page by index |
| `close(applicant, tabId)` | Closes page by index |
| `windowHandles(applicant)` | Alias for getting page indices |

### Cookie Operations

| Method | Description |
|--------|-------------|
| `setCookie(applicant, cookie)` | Add cookie via `context.addCookies()` |
| `getCookie(applicant, name?)` | Get cookie(s) via `context.cookies()` |
| `deleteCookie(applicant, name)` | Clear cookie via `context.clearCookies()` |

### Other Operations

| Method | Description |
|--------|-------------|
| `makeScreenshot(applicant)` | Returns base64-encoded screenshot |
| `scroll(applicant, selector, x, y)` | Scroll element |
| `scrollIntoView(applicant, selector)` | `locator.scrollIntoViewIfNeeded()` |
| `frame(applicant, frameID)` | Switch to frame by name or URL |
| `elements(applicant, xpath)` | Returns array of element indices |

### Factory Function

```typescript
function createBrowserProxyPlaywright(config?: {
    browserName?: 'chromium' | 'firefox' | 'webkit';
    launchOptions?: { ... };
    contextOptions?: { ... };
}): BrowserProxyPlaywright
```

### Usage Example

```typescript
import { createBrowserProxyPlaywright } from '@ringai/browser-proxy';

const browser = createBrowserProxyPlaywright({
    browserName: 'chromium',
    launchOptions: { headless: true },
    contextOptions: { viewport: { width: 1280, height: 720 } },
});

await browser.init();
await browser.url('test-1', 'https://example.com');
const title = await browser.getTitle('test-1');
await browser.click('test-1', '#submit-button');
await browser.kill();
```

## BrowserProxyController Class (Legacy)

Extends `PluggableModule`. Manages a pool of `BrowserProxyWorker` instances that communicate with browser plugins via forked child processes.

```typescript
import { BrowserProxyController, browserProxyControllerFactory } from '@ringai/browser-proxy';
```

### Constructor

```typescript
class BrowserProxyController extends PluggableModule implements IBrowserProxyController {
    constructor(
        transport: ITransport,
        workerCreator: (pluginPath: string, config: any) => ChildProcess | Promise<ChildProcess>
    )
}
```

### Plugin Hook

| Hook | Enum | Description |
|------|------|-------------|
| `getPlugin` | `BrowserProxyPlugins.getPlugin` | Resolves the external browser plugin configuration |

### Methods

| Method | Description |
|--------|-------------|
| `init()` | Loads plugin config via hook, sets worker limit, creates local worker if `workerLimit === 'local'` |
| `execute(applicant, command)` | Routes command to appropriate worker. Manages worker pool with round-robin assignment. |
| `kill()` | Terminates all workers and resets state. |

### Worker Pool Behavior

- Workers are created on-demand up to `workerLimit`
- Each applicant (test session) is mapped to a specific worker
- Round-robin assignment when pool is full
- `BrowserProxyActions.end` releases the applicant-worker mapping
- `workerLimit: 'local'` uses `BrowserProxyLocalWorker` (in-process)

### browserProxyControllerFactory (Deprecated)

```typescript
/** @deprecated Use createBrowserProxyPlaywright for simplified Playwright-only implementation */
function browserProxyControllerFactory(transport: ITransport): BrowserProxyController
```

Creates a `BrowserProxyController` with `fork()` from `@ringai/child-process` as the worker creator.

## BrowserProxyWorker Class (Internal)

Manages a single forked child process running a browser plugin. Handles IPC via transport with command-response pattern.

```typescript
class BrowserProxyWorker implements IBrowserProxyWorker {
    constructor(
        transport: ITransport,
        workerCreator: (pluginPath: string, config: any) => ChildProcess | Promise<ChildProcess>,
        spawnConfig: IBrowserProxyWorkerConfig
    )
}
```

Key behaviors:
- Lazy spawning: process is forked on first `execute()` call
- Command queuing: commands sent before spawn completes are queued
- Auto-reconnect: if the child process exits unexpectedly, it re-spawns and replays queued commands
- Each command gets a unique ID and is tracked in a pending pool

## BrowserProxyLocalWorker Class (Internal)

In-process worker alternative. Creates a `BrowserProxy` instance directly without forking. Uses transport broadcasting instead of per-child IPC.

```typescript
class BrowserProxyLocalWorker implements IBrowserProxyWorker {
    constructor(transport: ITransport, spawnConfig: IBrowserProxyWorkerConfig)
}
```

## BrowserProxy Class (Internal, Child Process)

Runs inside the forked child process. Loads a browser plugin dynamically and dispatches commands to it.

```typescript
class BrowserProxy {
    constructor(transport: ITransport, pluginPath: string, pluginConfig: any)
}
```

- Loads plugin via `requirePlugin()` from `@ringai/utils`
- Plugin must export a factory function: `(config) => IBrowserProxyPlugin`
- Listens for `BrowserProxyMessageTypes.execute` messages
- Calls the corresponding method on the plugin instance
- Sends responses back via `BrowserProxyMessageTypes.response`

## Message Protocol

```typescript
const enum BrowserProxyMessageTypes {
    execute = 'BrowserProxy/EXEC',       // Command from controller to worker
    response = 'BrowserProxy/RESPONSE',  // Response from worker to controller
    exception = 'BrowserProxy/EXCEPTION' // Fatal error from worker
}

interface IBrowserProxyCommand {
    action: BrowserProxyActions;  // Method name to call on plugin
    args: any[];                  // Arguments to pass
}

interface IBrowserProxyCommandResponse {
    uid: string;          // Command correlation ID
    response: any;        // Return value from plugin method
    error: Error | null;  // Error if command failed
}
```

## Dependencies

- `@ringai/child-process` — `fork()` for spawning browser proxy workers
- `@ringai/transport` — IPC message passing
- `@ringai/pluggable-module` — Plugin hook system
- `@ringai/logger` — Logging
- `@ringai/utils` — `generateUniqId()`, `requirePlugin()`
- `@ringai/types` — Type definitions and enums
- `playwright` — Browser automation (for `BrowserProxyPlaywright`)

## Related Modules

- [`@ringai/plugin-playwright-driver`](./plugin-playwright-driver.md) — Playwright plugin for the legacy controller architecture
- [`@ringai/transport`](../core-modules/transport.md) — Inter-process communication layer
- [`@ringai/plugin-api`](../core-modules/plugin-api.md) — Plugin registration API
