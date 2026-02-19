# Migration Guide: v0.x → v1.0

> This guide helps you migrate your testring tests from v0.x to v1.0.

## Overview

Testring v1.0 includes major architectural changes:

- **ESM-first**: All packages now support ESM natively
- **Modern tooling**: pnpm + Turborepo + tsup
- **New worker model**: worker_threads + Tinypool (optional)
- **Plugin system**: hookable-based with lifecycle management
- **TypeScript-first**: Better type safety throughout

## Breaking Changes

### 1. Module System

**Before (CommonJS):**
```javascript
const { testring } = require('@testring/core');
```

**After (ESM):**
```javascript
import { testring } from '@testring/core/index.js';
```

### 2. Configuration

**Before:**
```javascript
// testring.config.js
module.exports = {
  tests: './tests/**/*.ts',
  workerLimit: 5,
};
```

**After (TypeScript-first):**
```typescript
// testring.config.ts
import { defineConfig } from '@testring/cli-config';

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
import { Hookable } from 'hookable';
import type { TestringPlugin } from '@testring/types';

class MyPlugin implements TestringPlugin {
  private hooks: Hookable<any>;
  
  constructor() {
    this.hooks = new Hookable({
      onInit: async () => { /* ... */ },
      onTestStart: async (test) => { /* ... */ },
    });
  }
  
  // Register hooks
  async onInit() {
    // Plugin initialization
  }
}

export default MyPlugin;
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
import { WebApplication } from '@testring/web-application';

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
import { transport } from '@testring/transport';

// Now uses MessagePort + birpc internally
transport.send('message', payload);
```

## New Features in v1.0

### 1. CLI Subcommands

```bash
# Run tests
testring run

# Initialize new project
testring init

# List available plugins
testring plugin list
```

### 2. Reporter System

Built-in reporters: spec, dot, json, html

```bash
testring run --reporter=spec
testring run --reporter=json --reporter-output=results.json
```

### 3. Environment Variables

- `TESTRING_SKIP_DEPENDENCY_BUILD=true` - Skip dependency build (ESM mode)

## Migration Steps

1. **Update dependencies:**
   ```bash
   pnpm remove @testring/core
   pnpm add @testring/web-application @testring/test-worker
   ```

2. **Convert to ESM:**
   - Add `"type": "module"` to package.json
   - Add `.js` extension to all imports

3. **Update configuration:**
   - Convert to TypeScript with `defineConfig()`

4. **Update plugins:**
   - Implement new plugin interface
   - Use hookable for hook registration

5. **Update tests:**
   - Ensure ESM compatibility
   - Update any CommonJS-specific code

## Known Issues

- TypeScript errors in transport may require type casting (will be fixed in Phase 5.x)
- Some packages still have `any` types that need refinement

## Getting Help

- GitHub Issues: https://github.com/ringcentral/testring/issues
- Discord: Join our community channel

## Changelog Highlights

### Removed Packages (replaced by native Node.js):
- `@testring/async-assert` → Use `node:assert` + Chai
- `@testring/transport/serialize` → Use `structuredClone`
- `@testring/http-api` → Use native `fetch`

### Deprecated:
- `plugin-selenium-driver` → Use `plugin-playwright-driver`
