# Migration Guide: v0.x → v1.0

> This guide helps you migrate your ringai tests from v0.x to v1.0.

## Overview

Ringai v1.0 includes major architectural changes:

- **ESM-first**: All packages now support ESM natively
- **Modern tooling**: pnpm + Turborepo + tsup
- **New worker model**: worker_threads + Tinypool (optional)
- **Plugin system**: hookable-based with lifecycle management
- **TypeScript-first**: Better type safety throughout

## ESM Migration (v0.8.0+)

Starting with v0.8.0, ringai has fully migrated to ESM. This section covers the key changes if you are upgrading from a pre-0.8.0 version.

### What Changed

| Component | Before (≤ v0.7.x) | After (v0.8.0+) |
|-----------|-------------------|------------------|
| **Module system** | CommonJS (`require`) | ESM (`import`) with `"type": "module"` |
| **CLI framework** | yargs | [citty](https://github.com/unjs/citty) (lightweight, ESM-native) |
| **Build system** | tsc / custom | [tsup](https://tsup.egoist.dev/) (esbuild-based, ESM output) |
| **Test framework** | Mocha / custom | [Vitest](https://vitest.dev/) (v8 coverage) |
| **TypeScript runner** | ts-node | [tsx](https://tsx.is/) (ESM-compatible) |
| **Browser driver** | Selenium (primary) | [Playwright](https://playwright.dev/) (primary) |
| **Node.js support** | Node 18, 20 | Node 22+ only |
| **CI** | SonarQube v5 | SonarQube v7 |

### Updating Your package.json

Add `"type": "module"` to your project's `package.json`:

```json
{
    "type": "module"
}
```

### Updating Imports

**Before (CommonJS):**
```javascript
const { ringai } = require('@ringai/core');
const LoginPage = require('../pages/LoginPage');
```

**After (ESM):**
```typescript
import { ringai } from '@ringai/core/index.js';
import { LoginPage } from '../pages/LoginPage.js';
```

### Replacing CJS-specific APIs

| CJS API | ESM Replacement |
|---------|-----------------|
| `__dirname` | `path.dirname(fileURLToPath(import.meta.url))` |
| `__filename` | `fileURLToPath(import.meta.url)` |
| `require()` | `import` or `createRequire(import.meta.url)` |
| `require.resolve()` | `createRequire(import.meta.url).resolve()` |
| `module.exports` | `export default` / `export { ... }` |

### Updating Tests to Vitest

**Before (Mocha/Chai):**
```javascript
const { expect } = require('chai');

describe('My Test', function() {
    it('should work', function(done) {
        expect(result).to.equal(42);
        done();
    });
});
```

**After (Vitest):**
```typescript
import { describe, it, expect } from 'vitest';

describe('My Test', () => {
    it('should work', () => {
        expect(result).toBe(42);
    });
});
```

### Updating Browser Tests to Playwright

**Before (Selenium):**
```javascript
const { Builder, By } = require('selenium-webdriver');

const driver = await new Builder().forBrowser('chrome').build();
await driver.get('http://example.com');
await driver.findElement(By.id('button')).click();
await driver.quit();
```

**After (Playwright):**
```typescript
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('http://example.com');
await page.locator('#button').click();
await browser.close();
```

### Using pnpm

All dependency management now uses pnpm:

```bash
# Install dependencies
pnpm install

# Add a package
pnpm add @ringai/web-application

# Run scripts
pnpm test
pnpm run build
```

## Breaking Changes

### 1. Module System

**Before (CommonJS):**
```javascript
const { ringai } = require('@ringai/core');
```

**After (ESM):**
```javascript
import { ringai } from '@ringai/core/index.js';
```

### 2. Configuration

**Before:**
```javascript
// ringai.config.js
module.exports = {
    tests: './tests/**/*.ts',
    workerLimit: 5,
};
```

**After (TypeScript-first):**
```typescript
// ringai.config.ts
import { defineConfig } from '@ringai/cli-config';

export default defineConfig({
    tests: './tests/**/*.ts',
    workerLimit: 5,
});
```

### 3. Plugin API

**Before:**
```javascript
class MyPlugin {
    onInit() { }
    onTestStart(test) { }
}

module.exports = MyPlugin;
```

**After:**
```typescript
import type { PluginAPI } from '@ringai/plugin-api';

export default (pluginAPI: PluginAPI, userConfig?: Record<string, unknown>) => {
    const logger = pluginAPI.getLogger();
    const testRunController = pluginAPI.getTestRunController();

    testRunController.onStart(() => {
        logger.info('Tests started');
    });
};
```

### 4. Browser API

**Before:**
```javascript
const webApplication = new WebApplication(config);
await webApplication.open('http://example.com');
await webApplication.click('#button');
```

**After:**
```typescript
import { WebApplication } from '@ringai/web-application';

const webApplication = new WebApplication(config);
await webApplication.open('http://example.com');
// WebApplication now wraps Playwright Page API directly
await webApplication.click('#button');
```

### 5. Transport (Internal)

If you were using transport directly:

**Before:**
```javascript
const transport = new Transport(config);
transport.send('message', payload);
```

**After:**
```typescript
import { transport } from '@ringai/transport';

transport.send('message', payload);
```

## New Features in v1.0

### 1. CLI Subcommands

```bash
# Run tests
ringai run

# Initialize new project
ringai init

# List available plugins
ringai plugin list
```

### 2. Reporter System

Built-in reporters: spec, dot, json, html

```bash
ringai run --reporter=spec
ringai run --reporter=json --reporter-output=results.json
```

### 3. Environment Variables

- `RINGAI_SKIP_DEPENDENCY_BUILD=true` — Skip dependency build (ESM mode)

## Migration Steps

1. **Update Node.js** to v22 or later.

2. **Switch to pnpm:**
   ```bash
   corepack enable pnpm
   pnpm import   # converts package-lock.json to pnpm-lock.yaml
   ```

3. **Update dependencies:**
   ```bash
   pnpm remove @ringai/core
   pnpm add @ringai/web-application @ringai/test-worker
   ```

4. **Convert to ESM:**
   - Add `"type": "module"` to `package.json`
   - Change `require()` to `import`
   - Add `.js` extension to all relative imports

5. **Update configuration:**
   - Convert to TypeScript with `defineConfig()`

6. **Update plugins:**
   - Implement new plugin interface using `PluginAPI`
   - Use hookable for hook registration

7. **Update tests:**
   - Migrate from Mocha/Chai to Vitest
   - Update Selenium tests to Playwright

8. **Update CI:**
   - Use Node.js 22+
   - Use pnpm for install/build/test

## Known Issues

- TypeScript errors in transport may require type casting (will be fixed in Phase 5.x)
- Some packages still have `any` types that need refinement

## Getting Help

- GitHub Issues: https://github.com/danbao/ringai/issues

## Changelog Highlights

### Removed Packages:
- `@ringai/async-assert` — merged into `@ringai/web-application`
- `@ringai/transport/serialize` — use `structuredClone`
- `@ringai/http-api` — use native `fetch`
- `@ringai/plugin-babel` — replaced by `@ringai/plugin-compiler`
- `@ringai/client-ws-transport` — removed
- `@ringai/devtool-backend` — removed
- `@ringai/devtool-frontend` — removed
- `@ringai/devtool-extension` — removed
- `@ringai/download-collector-crx` — removed
- `@ringai/dependencies-builder` — removed
- `@ringai/plugin-selenium-driver` — use `@ringai/plugin-playwright-driver`
