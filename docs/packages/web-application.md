# @ringai/web-application

The browser automation layer for the ringai framework, providing two distinct APIs for web application testing: a full-featured `WebApplication` class that communicates through the transport/browser-proxy layer, and a simplified `WebApplicationSimplified` class that wraps Playwright's `Page` directly.

## Installation

```bash
pnpm add @ringai/web-application
```

## Exports

```typescript
import {
  WebApplication,
  WebApplicationSimplified,
  WebApplicationController,
} from '@ringai/web-application';
```

## Architecture

### WebApplication

The primary testing class. Extends `PluggableModule` and communicates with browsers via `WebClient` → `ITransport` → `BrowserProxyController` → Playwright. Every browser command is serialized as an IPC message, making it safe for multi-process parallel test execution.

Key internal classes:
- **`WebClient`** — Sends `BrowserProxyActions` commands over IPC transport. Each call creates a unique `uid`, sends the request via `transport.broadcastUniversally()`, and resolves when a matching response arrives.
- **`WebApplicationController`** — An `EventEmitter` that listens on the main process side for `WebApplicationMessageType.execute` messages, forwards them to `IBrowserProxyController`, and sends responses back.

### WebApplicationSimplified (NEW)

A thin wrapper around a Playwright `Page` object. It keeps ringai's `ElementPath` selector syntax and assert hooks but calls Playwright's native locator API directly — no IPC serialization.

Use `WebApplicationSimplified` when you want direct Playwright access (auto-wait, network interception, tracing) without the multi-process overhead.

## WebApplication

### Constructor

```typescript
class WebApplication extends PluggableModule {
  constructor(
    testUID: string,           // unique test identifier
    transport: ITransport,     // ringai transport instance
    config?: Partial<IWebApplicationConfig>,
  )
}
```

### Configuration

```typescript
interface IWebApplicationConfig {
  screenshotsEnabled: boolean;   // default: false
  screenshotPath: string;        // default: './_tmp/'
  devtool: IDevtoolConfig | null; // default: null
}

interface IDevtoolConfig {
  extensionId: string;
  httpPort: number;
  wsPort: number;
  host: string;
}
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `root` | `ElementPathProxy` | Root element path for building selectors via chaining |
| `assert` | `AsyncAssertionApi` | Hard assertions — test stops on failure, takes screenshot |
| `softAssert` | `AsyncAssertionApi` | Soft assertions — collects errors, test continues |
| `client` | `WebClient` | Lazily created IPC client (one per instance) |
| `logger` | `LoggerClient` | Prefixed logger `[web-application]` |
| `initPromise` | `Promise<any>` | Resolves when initialization is complete |
| `isSessionStopped` | `boolean` | Whether `end()` has been called |
| `mainTabID` | `string \| null` | The main/first tab handle |

### Navigation

```typescript
await app.openPage(url: string, timeout?: number): Promise<any>
await app.url(val?: string): Promise<any>      // get or set URL
await app.refresh(): Promise<any>
await app.back(): Promise<any>
await app.forward(): Promise<any>
await app.getTitle(): Promise<string>
await app.getUrl(): Promise<any>                // alias for url()
await app.getSource(): Promise<string>
```

### Element Interaction

All element methods accept `ElementPath | string` (XPath string or `ElementPathProxy` from `root`):

```typescript
// Click
await app.click(xpath, timeout?, options?)
await app.clickButton(xpath, timeout?)
await app.clickCoordinates(xpath, { x: 'center', y: 'top' }, timeout?)
await app.doubleClick(xpath, timeout?)

// Input
await app.setValue(xpath, value, emulateViaJS?, timeout?)
await app.clearValue(xpath, timeout?)
await app.clearElement(xpath, emulateViaJS?, timeout?)
await app.addValue(xpath, value, timeout?)
await app.simulateJSFieldChange(xpath, value)
await app.simulateJSFieldClear(xpath)
await app.keys(value: string | string[])

// Reading
await app.getText(xpath, trim?, timeout?): Promise<string>
await app.getTextWithoutFocus(xpath, trim?, timeout?): Promise<string>
await app.getTexts(xpath, trim?, timeout?): Promise<string[]>
await app.getValue(xpath, timeout?): Promise<any>
await app.getAttribute(xpath, attr, timeout?): Promise<any>
await app.getHTML(xpath, timeout?): Promise<string>
await app.getCssProperty(xpath, property, timeout?): Promise<any>
await app.getSize(xpath, timeout?): Promise<{ width, height }>
await app.getLocation(xpath, timeout?): Promise<any>
await app.getTagName(xpath, timeout?): Promise<string>
await app.getPlaceHolderValue(xpath): Promise<any>

// Select/dropdown
await app.selectByIndex(xpath, index, timeout?)
await app.selectByValue(xpath, value, timeout?)
await app.selectByVisibleText(xpath, text, timeout?)
await app.selectByAttribute(xpath, attribute, value, timeout?)
await app.getSelectedText(xpath, timeout?): Promise<string>
await app.getSelectTexts(xpath, trim?, timeout?): Promise<string[]>
await app.getSelectValues(xpath, timeout?): Promise<any[]>
await app.getOptionsProperty(xpath, property, timeout?): Promise<any[]>
await app.selectNotCurrent(xpath, timeout?)

// Checkbox
await app.setChecked(xpath, checked?, timeout?)
await app.isChecked(xpath, timeout?): Promise<boolean>
```

### Wait Methods

```typescript
await app.waitForExist(xpath, timeout?)
await app.waitForNotExists(xpath, timeout?)
await app.waitForVisible(xpath, timeout?)
await app.waitForNotVisible(xpath, timeout?)
await app.waitForClickable(xpath, timeout?)
await app.waitForEnabled(xpath, timeout?)
await app.waitForStable(xpath, timeout?)
await app.waitForValue(xpath, timeout?, reverse?)
await app.waitForSelected(xpath, timeout?, reverse?)
await app.waitForRoot(timeout?)
await app.waitUntil(condition, timeout?, timeoutMsg?, interval?)
await app.waitForAlert(timeout?): Promise<boolean>
```

Timeouts come from `@ringai/timeout-config`:
- `WAIT_TIMEOUT` — default element wait
- `PAGE_LOAD_MAX` — page navigation timeout
- `TICK_TIMEOUT` — polling interval

### State Checks

```typescript
await app.isVisible(xpath, timeout?): Promise<boolean>
await app.isEnabled(xpath, timeout?): Promise<boolean>
await app.isDisabled(xpath, timeout?): Promise<boolean>
await app.isReadOnly(xpath, timeout?): Promise<boolean>
await app.isClickable(xpath, timeout?): Promise<boolean>
await app.isFocused(xpath): Promise<boolean>
await app.isStable(xpath): Promise<boolean>
await app.isExisting(xpath): Promise<boolean>
await app.isElementsExist(xpath, timeout?): Promise<boolean>
await app.notExists(xpath, timeout?): Promise<boolean>
await app.isBecomeVisible(xpath, timeout?): Promise<boolean>
await app.isBecomeHidden(xpath, timeout?): Promise<boolean>
await app.isCSSClassExists(xpath, ...classNames): Promise<boolean>
```

### Scrolling & Mouse

```typescript
await app.scrollIntoView(xpath, topOffset?, leftOffset?, timeout?)
await app.scrollIntoViewIfNeeded(xpath, topOffset?, leftOffset?, timeout?)
await app.scroll(xpath, x?, y?, timeout?)
await app.moveToObject(xpath, x?, y?, timeout?)
await app.dragAndDrop(source, destination, timeout?)
```

### Multi-Tab / Multi-Window

```typescript
await app.getTabIds(): Promise<string[]>
await app.getCurrentTabId(): Promise<string>
await app.getMainTabId(): Promise<string | null>
await app.switchTab(tabId)
await app.setActiveTab(tabId)
await app.newWindow(url, name, features?)
await app.window(handle)
await app.windowHandles(): Promise<string[]>
await app.closeCurrentTab()
await app.closeBrowserWindow(focusToTabId?)
await app.closeAllOtherTabs()
await app.closeFirstSiblingTab()
await app.switchToFirstSiblingTab(): Promise<boolean>
await app.switchToMainSiblingTab(): Promise<boolean>
await app.maximizeWindow(): Promise<boolean>
await app.getWindowSize(): Promise<any>
```

### Frames

```typescript
await app.switchToFrame(name)
await app.switchToParentFrame()
```

### Alerts

```typescript
await app.isAlertOpen(): Promise<boolean>
await app.alertAccept(timeout?)
await app.alertDismiss(timeout?)
await app.alertText(timeout?): Promise<string>
```

### Cookies

```typescript
await app.setCookie(cookieObj)
await app.getCookie(cookieName?)
await app.deleteCookie(cookieName)
```

### Screenshots

```typescript
await app.makeScreenshot(force?): Promise<string | null>
await app.enableScreenshots()
await app.disableScreenshots()
```

Screenshots are saved via `FSScreenshotFactory` from `@ringai/fs-store` and logged with `logger.file()`.

### Other

```typescript
await app.execute(fn, ...args)       // run sync JS in browser
await app.executeAsync(fn, ...args)  // run async JS in browser (callback pattern)
await app.pause(ms)                  // delay
await app.uploadFile(fullPath)
await app.savePDF(options: SavePdfOptions)
await app.setTimeZone(timezone)
await app.logNavigatorVersion()
await app.getActiveElement()
await app.elements(xpath)            // raw element list
await app.getElementsCount(xpath, timeout?)
await app.getElementsIds(xpath, timeout?)
await app.isElementSelected(elementId)
app.extendInstance(obj)              // mixin custom methods
app.isStopped(): boolean
await app.end()                      // close session
```

### Assertions

Built on `chai.assert` wrapped in async Proxy (see `async-assert.ts`):

```typescript
// Hard assert — stops test on failure
await app.assert.equal(actual, expected, successMessage?)
await app.assert.isTrue(value, message?)
await app.assert.contains(haystack, needle, message?)
// ... all chai.assert methods

// Soft assert — collects errors, test continues
await app.softAssert.equal(actual, expected, successMessage?)
const errors = app.getSoftAssertionErrors() // string[]
```

Both automatically trigger `makeScreenshot()` on success and error via the `onSuccess`/`onError` callbacks.

### Devtool Integration

When `config.devtool` is set, `WebApplication` performs a Chrome extension handshake on the first `url()` call. It registers itself via `WebApplicationDevtoolActions.register` over the transport, navigates to the extension options page, and enables element highlighting during `waitForExist` / `elements` calls by posting `ADD_XPATH_HIGHLIGHT` messages.

## WebApplicationSimplified

### Constructor

```typescript
class WebApplicationSimplified {
  constructor(
    testUID: string,
    page: Page,               // Playwright Page object directly
    transport: ITransport,
    config?: Partial<IWebApplicationConfig>,
  )
}
```

### Key Differences from WebApplication

| Feature | WebApplication | WebApplicationSimplified |
|---------|---------------|------------------------|
| Browser communication | IPC via WebClient/Transport | Direct Playwright Page API |
| Auto-wait | Manual `waitForExist` calls | Playwright's built-in auto-wait |
| Selectors | XPath from ElementPath | ElementPath → Playwright Locator |
| Multi-process | Yes (designed for it) | Single process |
| Assertions | Full chai-based assert/softAssert | Hook-based (onSuccess/onError) |
| Screenshot | Via FSScreenshotFactory | `page.screenshot()` directly |

### Core Methods

```typescript
// Navigation
await simplified.url(val: string)
await simplified.getTitle(): Promise<string>
await simplified.refresh()
await simplified.back()
await simplified.forward()

// Elements — converts ElementPath to Playwright Locator internally
await simplified.click(selector, options?)
await simplified.doubleClick(selector)
await simplified.getText(selector): Promise<string>
await simplified.getAttribute(selector, attr): Promise<string>
await simplified.getValue(selector): Promise<string>
await simplified.setValue(selector, value)
await simplified.clearValue(selector)

// State
await simplified.isVisible(selector): Promise<boolean>
await simplified.isEnabled(selector): Promise<boolean>
await simplified.isSelected(selector): Promise<boolean>
await simplified.isExisting(selector): Promise<boolean>
await simplified.isClickable(selector): Promise<boolean>
await simplified.isFocused(selector): Promise<boolean>
await simplified.isDisabled(selector): Promise<boolean>

// Waiting — delegates to Playwright's locator.waitFor()
await simplified.waitForExist(selector, timeout?)
await simplified.waitForVisible(selector, timeout?)
await simplified.waitForHidden(selector, timeout?)
await simplified.waitForStable(selector, timeout?)
await simplified.waitForEnabled(selector, timeout?)
await simplified.waitUntil(condition, timeout?, msg?, interval?)

// Direct Playwright access
simplified.getPage(): Page
simplified.getContext(): BrowserContext
```

## WebApplicationController

Runs on the main process. Bridges transport messages to the browser proxy:

```typescript
class WebApplicationController extends EventEmitter {
  constructor(
    browserProxyController: IBrowserProxyController,
    transport: ITransport,
  )

  init()   // start listening for execute messages
  kill()   // stop processing (marks isKilled = true)
}
```

Events emitted:
- `WebApplicationControllerEventType.execute` — when a command is received
- `WebApplicationControllerEventType.response` — when a response is sent back
- `WebApplicationControllerEventType.afterResponse` — after response is delivered

## Usage Example

```typescript
import { WebApplication } from '@ringai/web-application';

// In a ringai test worker context:
const app = new WebApplication('test-001', transport, {
  screenshotsEnabled: true,
  screenshotPath: './screenshots/',
});

await app.openPage('https://example.com');

// Use element path chaining
const loginBtn = app.root.button.loginButton;
await app.waitForExist(loginBtn);
await app.click(loginBtn);

// Assertions with auto-screenshot
await app.assert.equal(await app.getTitle(), 'Dashboard');

// Soft assertions
await app.softAssert.isTrue(
  await app.isVisible(app.root.div.welcomeMessage),
);
const errors = app.getSoftAssertionErrors();

await app.end();
```

## Dependencies

- `@ringai/element-path` — ElementPath selector system
- `@ringai/transport` — IPC communication
- `@ringai/logger` — Logging
- `@ringai/fs-store` — Screenshot file storage
- `@ringai/pluggable-module` — Plugin hook support
- `@ringai/async-breakpoints` — Debug breakpoint support
- `@ringai/timeout-config` — Centralized timeout values
- `@ringai/types` — TypeScript interfaces
- `@ringai/utils` — Utilities (`generateUniqId`)
- `chai` — Assertion library (used by `createAssertion`)
- `playwright` — Browser automation (used by `WebApplicationSimplified`)
