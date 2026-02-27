# @ringai/e2e-test-app

End-to-end test application for the ringai framework. This private package serves as both the integration test suite for the framework itself and a reference implementation for writing effective E2E tests with ringai.

## Overview

The e2e-test-app provides:

- **30 Playwright-based E2E test specs** covering all WebApplication methods (27 main + 3 webdriver-protocol)
- **Hono-based mock web server** with 28 static HTML fixtures
- **Cloudflare Worker deployment** for online test environments
- **Screenshot testing** configuration examples
- **Complete test patterns** for assertions, soft assertions, form handling, navigation, etc.

## Project Structure

```
e2e-test-app/
├── src/
│   ├── mock-web-server.ts        # Hono mock server (port 8080)
│   ├── test-runner.ts            # E2E test execution wrapper
│   ├── shared-routes.ts          # Route registration for all HTML fixtures
│   └── static-fixtures/          # 28 HTML fixture generators (TypeScript)
│       ├── alert.ts
│       ├── assert-demo.ts
│       ├── click.ts
│       ├── cookie.ts
│       ├── css.ts
│       ├── drag-and-drop.ts
│       ├── elements.ts
│       ├── focus-stable.ts
│       ├── form.ts
│       ├── frame.ts
│       ├── get-size.ts
│       ├── get-source.ts
│       ├── html-and-text.ts
│       ├── iframe1.ts / iframe2.ts
│       ├── location-size.ts
│       ├── mock.ts
│       ├── responsive.ts
│       ├── screenshot.ts
│       ├── scroll.ts
│       ├── simulate-field.ts
│       ├── tag-name.ts
│       ├── timezone.ts
│       ├── title.ts
│       ├── upload.ts
│       ├── wait-for-exist.ts
│       ├── wait-for-visible.ts
│       └── wait-until.ts
├── test/
│   ├── playwright/
│   │   ├── config.cjs            # Playwright test configuration
│   │   ├── config-screenshot.cjs # Screenshot-enabled config
│   │   ├── env.json              # Environment parameters
│   │   ├── test/                 # 27 spec files + 3 webdriver-protocol specs
│   │   │   ├── utils.js          # getTargetUrl helper
│   │   │   ├── alert.spec.js
│   │   │   ├── assert-methods.spec.js
│   │   │   ├── basic-custom-config.spec.js
│   │   │   ├── click.spec.js
│   │   │   ├── cookie.spec.js
│   │   │   ├── css.spec.js
│   │   │   ├── drag-and-drop.spec.js
│   │   │   ├── elements.spec.js
│   │   │   ├── focus-stable.spec.js
│   │   │   ├── form.spec.js
│   │   │   ├── frame.spec.js
│   │   │   ├── get-html-and-texts.spec.js
│   │   │   ├── get-size.spec.js
│   │   │   ├── get-source.spec.js
│   │   │   ├── responsive.spec.js
│   │   │   ├── screenshot-control.spec.js
│   │   │   ├── scroll-and-move.spec.js
│   │   │   ├── select.spec.js
│   │   │   ├── simulate-field.spec.js
│   │   │   ├── soft-assert.spec.js
│   │   │   ├── tag-name-and-execute.spec.js
│   │   │   ├── title.spec.js
│   │   │   ├── upload.spec.js
│   │   │   ├── wait-for-exist.spec.js
│   │   │   ├── wait-for-visible.spec.js
│   │   │   ├── wait-until.spec.js
│   │   │   ├── windows.spec.js
│   │   │   └── webdriver-protocol/   # 3 protocol-level specs
│   │   │       ├── save-pdf.spec.js
│   │   │       ├── set-timezone.spec.js
│   │   │       └── status-back-forward.spec.js
│   │   └── test-screenshots/     # Screenshot comparison specs
│   ├── simple/                   # Simple test examples
│   └── integration/              # Integration tests (mocha)
├── timeout-config.cjs            # Centralized timeout constants
└── package.json
```

## Mock Web Server

The mock server uses **Hono** (lightweight web framework) with `@hono/node-server`:

```typescript
import { MockWebServer } from './src/mock-web-server';

const server = new MockWebServer();
await server.start(); // Runs on port 8080

// Endpoints:
// GET  /static/*.html  — 27 HTML test fixture pages
// POST /upload         — File upload endpoint
// GET  /health         — Health check
// GET  /               — Server info

server.stop();
```

The same Hono app is exported for **Cloudflare Worker** deployment:

```typescript
export default app; // Cloudflare Workers entry point
```

## Running Tests

```bash
# Run E2E tests (headless Chromium)
pnpm run test:e2e

# Run E2E tests with visible browser
pnpm run test:playwright

# Run screenshot comparison tests
pnpm run test:screenshots

# Run simple unit tests
pnpm run test:simple

# Run integration tests
pnpm run test:integration
```

All E2E tests are executed via `tsx src/test-runner.ts` which starts the mock web server and runs the ringai CLI.

## Configuration

### Playwright Config (`test/playwright/config.cjs`)

```javascript
const TIMEOUTS = require('../../timeout-config.cjs');

module.exports = async (config) => {
    const local = !config.headless;

    const compilerConfig = {
        target: 'es2022',
    };

    if (config.debug) {
        compilerConfig.sourceMap = true;
    }

    return {
        screenshotPath: './_tmp/',
        workerLimit: 5,
        maxWriteThreadCount: 2,
        screenshots: 'disable',
        retryCount: local ? 0 : 2,
        testTimeout: local ? 0 : 90000,
        tests: 'test/playwright/test/**/*.spec.js',
        plugins: [
            ['playwright-driver', {
                browserName: 'chromium',
                launchOptions: {
                    headless: !local,
                    slowMo: local ? 500 : 0,
                    args: local ? [] : ['--no-sandbox'],
                },
                clientTimeout: local ? 0 : (config.testTimeout || TIMEOUTS.CLIENT_SESSION),
            }],
            ['compiler', compilerConfig],
        ],
    };
};
```

### Environment Config (`test/playwright/env.json`)

```json
{
    "envParameters": {
        "baseUrl": "http://localhost:8080/static/"
    }
}
```

## Writing Tests

All E2E specs follow the `run(async (api) => { ... })` pattern:

```javascript
import { run } from 'ringai';
import { getTargetUrl } from './utils';

run(async (api) => {
    const app = api.application;
    await app.url(getTargetUrl(api, 'form.html'));

    // Interact with elements using data-test-automation-id selectors
    await app.setValue(app.root.form.nameInput, 'test');
    const value = await app.getValue(app.root.form.nameInput);

    // Hard assertions — stop on failure
    await app.assert.equal(value, 'test');

    // Soft assertions — collect errors, continue
    await app.softAssert.isString(value);
});
```

### URL Helper

```javascript
// test/playwright/test/utils.js
export const getTargetUrl = (api, urlPath) => {
    let { baseUrl } = api.getEnvironment();
    if (!baseUrl.endsWith('/')) baseUrl += '/';
    if (urlPath.startsWith('/')) urlPath = urlPath.slice(1);
    return `${baseUrl}${urlPath}`;
};
```

### Adding New Tests

1. Create an HTML fixture in `src/static-fixtures/your-page.ts`:
   ```typescript
   import { Context } from 'hono';

   export function getYourPageHtml(c: Context) {
       const html = `<!DOCTYPE html>
   <html><body data-test-automation-id="root">
       <div data-test-automation-id="element">Content</div>
   </body></html>`;
       return c.html(html);
   }
   ```

2. Register the route in `src/shared-routes.ts`:
   ```typescript
   import { getYourPageHtml } from './static-fixtures/your-page';
   // ...
   app.get('/static/your-page.html', getYourPageHtml);
   ```

3. Create the spec file in `test/playwright/test/your-test.spec.js`:
   ```javascript
   import { run } from 'ringai';
   import { getTargetUrl } from './utils';

   run(async (api) => {
       const app = api.application;
       await app.url(getTargetUrl(api, 'your-page.html'));
       // ... test logic
   });
   ```

## Test Coverage by Category

### Assertions (`assert-methods.spec.js`)
33 chai.assert methods: equal, notEqual, strictEqual, deepEqual, isTrue, isFalse, ok, isNotOk, typeOf, isString, isNumber, isBoolean, isArray, isObject, isNull, isNotNull, isUndefined, isDefined, include, notInclude, match, isAbove, isBelow, isAtLeast, isAtMost, lengthOf, isEmpty, isNotEmpty, property, notProperty, exists, notExists, throws, doesNotThrow

### Soft Assertions (`soft-assert.spec.js`)
Non-throwing failure collection, `_errorMessages` array, mixed assert/softAssert scenarios

### Form & Input (`form.spec.js`, `simulate-field.spec.js`)
setValue, getValue, clearValue, clearElement, addValue, keys, isEnabled, isDisabled, isReadOnly, isChecked, setChecked, getPlaceHolderValue, simulateJSFieldClear, simulateJSFieldChange

### Select (`select.spec.js`)
selectByValue, selectByIndex, selectByVisibleText, selectByAttribute, selectNotCurrent, getSelectedText, getSelectTexts, getSelectValues, getOptionsProperty

### Click & Navigation (`click.spec.js`, `title.spec.js`)
click, clickButton, clickCoordinates, doubleClick, url, getTitle, refresh

### Elements (`elements.spec.js`)
isElementsExist, notExists, isExisting, getElementsCount, getElementsIds, isElementSelected

### Wait Methods (`wait-for-exist.spec.js`, `wait-for-visible.spec.js`, `wait-until.spec.js`)
waitForExist, waitForNotExists, waitForVisible, waitForNotVisible, waitForRoot, waitForValue, waitForAlert, waitUntil, isBecomeVisible, isBecomeHidden

### Window/Tab (`windows.spec.js`)
getMainTabId, getTabIds, getCurrentTabId, switchTab, setActiveTab, newWindow, window, windowHandles, closeCurrentTab, closeBrowserWindow, closeAllOtherTabs, closeFirstSiblingTab, switchToFirstSiblingTab, switchToMainSiblingTab, maximizeWindow, getWindowSize, refresh

### Position & Size (`get-size.spec.js`)
getSize, getLocation, getWindowSize, getActiveElement

### Scroll & Mouse (`scroll-and-move.spec.js`)
scroll, scrollIntoView, scrollIntoViewIfNeeded, moveToObject

### Tag Name & JS Execution (`tag-name-and-execute.spec.js`)
getTagName, execute (sync), executeAsync (async callback)

### Other Specs
- `alert.spec.js` — alertAccept, alertDismiss, alertText, isAlertOpen
- `cookie.spec.js` — setCookie, getCookie, deleteCookie
- `css.spec.js` — getCssProperty, isCSSClassExists, getAttribute
- `drag-and-drop.spec.js` — dragAndDrop
- `frame.spec.js` — switchToFrame, switchToParentFrame
- `get-html-and-texts.spec.js` — getHTML, getText, getTexts, getTextWithoutFocus
- `get-source.spec.js` — getSource
- `screenshot-control.spec.js` — disableScreenshots, enableScreenshots, makeScreenshot
- `upload.spec.js` — uploadFile
- `focus-stable.spec.js` — isFocused, isStable, waitForStable, isClickable, waitForClickable
- `responsive.spec.js` — setViewportSize, responsive layout testing
- `webdriver-protocol/` — savePDF, setTimeZone, status, back, forward

## Dependencies

- **`hono`** + **`@hono/node-server`** — Mock web server
- **`ringai`** — Main framework
- **`@ringai/cli`** — CLI for running tests
- **`@ringai/plugin-playwright-driver`** — Playwright browser driver
- **`@ringai/plugin-compiler`** — TypeScript/ESM compilation for spec files
- **`@ringai/plugin-fs-store`** — Screenshot storage
- **`@ringai/web-application`** — Web application testing API
- **`c8`** — E2E code coverage
- **`concurrently`** — Parallel process execution
- **`chai`** — Assertion library
- **`mocha`** — Integration test runner

## Related Modules

- [`@ringai/web-application`](web-application.md) — Core web testing API
- [`@ringai/plugin-playwright-driver`](plugin-playwright-driver.md) — Playwright integration
- [`@ringai/element-path`](element-path.md) — Element selector system
