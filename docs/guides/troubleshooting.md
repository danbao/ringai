# Troubleshooting Guide

This guide helps resolve common issues when working with testring.

## Environment Requirements

testring requires:
- **Node.js 22+** (ES2022 features, native ESM support)
- **pnpm 10+** (package manager)
- **TypeScript 5+** (ES2022 target)

```bash
node --version   # Should show v22.0.0 or higher
pnpm --version   # Should show 10.0.0 or higher
```

## Installation Issues

### pnpm Workspace Errors

**Problem:** Dependencies fail to install or resolve in the monorepo.

```bash
# Clean install from scratch
pnpm run cleanup
pnpm install

# Or full reinstall
pnpm run reinstall
```

### Permission Errors

**Problem:** Permission denied during global installation.

```bash
# Use pnpm's built-in global management (no sudo needed)
pnpm setup
pnpm add -g @testring/cli
```

### Peer Dependency Conflicts

**Problem:** pnpm strict mode rejects mismatched peer dependencies.

Check `pnpm-workspace.yaml` and ensure all workspace packages use consistent dependency versions:

```bash
pnpm run deps:validate
pnpm run deps:find-updates
```

## ESM-Specific Issues

### "require is not defined" / "module is not defined"

**Problem:** Code uses CommonJS syntax in an ESM package.

All testring packages use `"type": "module"` in `package.json`. Use ESM imports:

```typescript
// ❌ Wrong
const { Sandbox } = require('@testring/sandbox');

// ✅ Correct
import { Sandbox } from '@testring/sandbox';
```

### `__dirname` / `__filename` Not Available

**Problem:** ESM modules don't have `__dirname` or `__filename` globals.

```typescript
// ✅ ESM equivalent
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```

### Configuration File Format

**Problem:** `.testringrc.js` fails to load with ESM errors.

testring supports these config formats:
- `.testringrc` — JSON (always works)
- `.testringrc.js` — Must use ESM syntax (`export default { ... }`)
- `.testringrc.cjs` — Use for CommonJS config (`module.exports = { ... }`)

```javascript
// .testringrc.js (ESM)
export default {
    plugins: ['@testring/plugin-playwright-driver'],
    workerLimit: 4,
};
```

```javascript
// .testringrc.cjs (CommonJS fallback)
module.exports = {
    plugins: ['@testring/plugin-playwright-driver'],
    workerLimit: 4,
};
```

### Dynamic Imports

**Problem:** `import()` paths need to be file URLs on Windows.

```typescript
// ❌ May fail on Windows
const mod = await import('/absolute/path/to/module.js');

// ✅ Cross-platform
import { pathToFileURL } from 'node:url';
const mod = await import(pathToFileURL('/absolute/path/to/module.js').href);
```

## TypeScript Issues

### Using tsx Instead of ts-node

**Problem:** `ts-node` doesn't work well with ESM + TypeScript.

testring uses `tsx` as the TypeScript ESM loader:

```bash
# ❌ ts-node often fails with ESM
npx ts-node --esm script.ts

# ✅ Use tsx instead
npx tsx script.ts
```

For running scripts that need TypeScript support:
```bash
node --import tsx/esm script.ts
```

### TypeScript Compilation Errors

**Problem:** Build fails with type errors.

```bash
# Build all packages (turbo handles dependency order)
pnpm run build

# Build main packages only
pnpm run build:main
```

Ensure your `tsconfig.json` extends the base config:
```json
{
    "extends": "../../tsconfig.base.json",
    "compilerOptions": {
        "outDir": "./dist",
        "rootDir": "./src"
    }
}
```

## Build System Issues

### turbo Cache Issues

**Problem:** Build seems stuck or uses stale output.

```bash
# Clear turbo cache
rm -rf .turbo
rm -rf node_modules/.cache/turbo

# Force rebuild without cache
npx turbo run build --force

# Or clean everything and rebuild
pnpm run cleanup
pnpm install
pnpm run build
```

### tsup Build Failures

**Problem:** Individual package build fails.

```bash
# Build a specific package
cd core/sandbox
npx tsup

# Check the package's tsup.config.ts matches the base pattern
```

Ensure each package's `tsup.config.ts` imports from the base config:
```typescript
import { createTsupConfig } from '../../tsup.config.base';
export default createTsupConfig();
```

### Missing dist/ Directory

**Problem:** Package cannot be imported because `dist/` doesn't exist.

```bash
# Build the specific package and its dependencies
pnpm run build

# Or build just main packages
pnpm run build:main
```

## Testing Issues

### Vitest Configuration

**Problem:** Tests fail to run or can't find test files.

The root `vitest.config.ts` configures all test paths. Run tests with:

```bash
# All unit tests
pnpm run test:unit

# Single test file
npx vitest run path/to/file.spec.ts

# Watch mode
pnpm run test:unit:watch

# With coverage
pnpm run test:unit:coverage
```

### Test Isolation Failures

**Problem:** Tests interfere with each other or share state.

The `SandboxWorkerThreads` class creates a fresh `Worker` thread per execution. If you see state leaking:

1. Check that `SandboxWorkerThreads.clearCache()` is called after tests
2. Ensure test files don't modify global state
3. Run problematic tests in isolation: `npx vitest run --no-threads path/to/test.spec.ts`

### E2E Test Failures

**Problem:** E2E tests fail in headless mode.

```bash
# Run E2E tests
pnpm run test:e2e:headless

# Debug by running headed
# Set headless: false in the Playwright config
```

## Playwright Browser Issues

### Browsers Not Installed

**Problem:** `browserType.launch: Executable doesn't exist`

```bash
# Install all Playwright browsers
npx playwright install

# Install specific browser
npx playwright install chromium
npx playwright install firefox
npx playwright install webkit

# Install with system dependencies (Linux CI)
npx playwright install --with-deps
```

### Browser Launch Failures in CI

**Problem:** Browsers crash on startup in Docker/CI environments.

```bash
# Install system dependencies
npx playwright install-deps

# Use appropriate launch args
```

For Docker, ensure your configuration includes sandbox-disabling args:

```typescript
const browser = createBrowserProxyPlaywright({
    browserName: 'chromium',
    launchOptions: {
        headless: true,
        args: ['--no-sandbox', '--disable-dev-shm-usage'],
    },
});
```

### Playwright Version Mismatch

**Problem:** `browserType.launch: Browser was downloaded for a different version`

```bash
# Reinstall browsers matching the installed Playwright version
npx playwright install
```

## Windows-Specific Issues

### Path Separator Issues

**Problem:** File paths use backslashes that break ESM `import()`.

testring handles this internally by converting to `file://` URLs, but in custom code:

```typescript
import { pathToFileURL } from 'node:url';

// ❌ Breaks on Windows
const mod = await import('C:\\project\\module.js');

// ✅ Works cross-platform
const mod = await import(pathToFileURL('C:\\project\\module.js').href);
```

### Line Ending Issues

**Problem:** Git checkout changes line endings, causing test snapshots to fail.

```bash
# Configure git for consistent line endings
git config core.autocrlf input
```

### Long Path Issues

**Problem:** `ENAMETOOLONG` errors in `node_modules`.

```bash
# Enable long paths on Windows
git config core.longpaths true
```

## Worker Process Issues

### Worker Spawn Failures

**Problem:** `fork()` fails with `ENOENT` or `ENOMEM`.

- Check that the build is up to date (`pnpm run build`)
- Verify the worker entry point exists: `core/test-worker/dist/worker.js`
- Reduce `workerLimit` if running out of memory

### IPC Communication Errors

**Problem:** `Transport error` or `IPC channel closed`

This usually means a worker process crashed. Check:

1. Worker stderr output in logs (prefixed with `[worker/<id>]`)
2. Compilation errors (check `TestWorkerPlugin.compile` hooks)
3. Sandbox execution errors (test code syntax/runtime errors)

### Worker Timeout

**Problem:** Tests hang and eventually timeout.

```json
{
    "timeout": 60000,
    "workerLimit": 2
}
```

- Reduce `workerLimit` to avoid resource exhaustion
- Check for unresolved promises in test code
- Use `waitForRelease: false` unless debugging with devtools

## Linting Issues

### ESLint Flat Config

**Problem:** Linting fails or ignores files.

testring uses ESLint flat config (`eslint.config.js`):

```bash
# Run linting
pnpm run lint

# Auto-fix
pnpm run lint:fix
```

## Debug Tips

### Enable Debug Logging

```bash
# Run with debug logging
DEBUG=testring:* pnpm run test:unit

# Debug specific module
DEBUG=testring:worker pnpm run test:unit
```

### Use Local Worker Mode

For easier debugging, set `localWorker: true` in the worker config. This runs tests in the main process where breakpoints and stack traces work directly.

### Inspect Worker Processes

```bash
# Run with Node.js inspector
node --inspect-brk node_modules/.bin/vitest run path/to/test.spec.ts
```

### Check Package Versions

```bash
# Verify all testring packages are at consistent versions
pnpm run deps:validate

# List installed testring packages
pnpm list --filter "@testring/*" --depth 0
```

## Common Error Messages

### "Cannot find module '@testring/...'"

**Cause:** Package not installed or not built.

```bash
pnpm install
pnpm run build
```

### "SandboxWorkerThreads: worker exited with code 1"

**Cause:** Test code has a runtime error.

Check the worker logs for the actual error. Common causes:
- Missing dependencies in the sandbox `DependencyDict`
- Syntax errors in test files
- `require()` calls for modules not in the dependency map

### "Plugin is not a function"

**Cause:** Browser plugin doesn't export a factory function.

Plugins must export: `(config) => IBrowserProxyPlugin`

### "Executable doesn't exist at ..."

**Cause:** Playwright browsers not installed.

```bash
npx playwright install
```

## Getting Help

If you're still experiencing issues:

1. Check the [GitHub Issues](https://github.com/nicholasrq/testring/issues)
2. Review the [API Documentation](../core-modules/api.md)
3. Run with debug logging enabled
4. Create a minimal reproduction case
5. Open a new issue with Node.js version, OS, and full error output
