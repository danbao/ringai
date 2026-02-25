# Changelog

All notable changes to this project will be documented in this file.

## [0.8.0] - 2026-02-25

### Bug Fixes

- **browser execution**: Restore browser execution in e2e tests — replace `SandboxWorkerThreads` with `Sandbox` (vm-based) so test closures run in the same thread as the browser proxy transport; propagate `workerLimit` from main config to `BrowserProxyController.init()`; add missing tsup entry points for `plugin-playwright-driver` and `browser-proxy` packages ([fb3ba460])
- **simulate-field**: Normalize `ElementPath` to XPath string via `normalizeSelector()` before passing to `executeAsync` in `simulateJSFieldChange` ([48c7e16d])
- **tag-name-and-execute**: Add public `getTagName()` and `executeAsync()` methods to `WebApplication` (previously only available internally via `WebClient`) ([48c7e16d])
- **wait-until**: Replace `page.waitForFunction(condition)` with Node.js-side polling loop — the condition closure references server-side objects (`app`, `transport`) that don't exist in the browser context ([48c7e16d])
- **package scripts**: Fix broken scripts across the monorepo — `fs-reader/test:performance` (ESM resolution), `e2e-test-app/test:integration` (CJS require in ESM package), `timeout-config` (version prefix validation), standalone `vitest` test commands in 3 packages ([4b1356aa])
- **sandbox workers**: Suppress experimental require-module warnings in sandbox workers ([abf3f6ad])
- **ESM sandbox**: Enable ESM require in sandbox worker and fix error serialization ([786a6c34])
- **logger**: Handle Date deserialization in logger `formatTime` ([e3b2265a])
- **test-worker**: Add worker entry point to test-worker tsup config ([ef0178df])
- **ESM plugins**: Make `requirePackage`/`requirePlugin` async to support ESM plugins ([ae10e684])
- **e2e config**: Rename `.testringrc` to `.ringairc` for e2e simple test config ([b938294e])
- **CJS entry**: Use dynamic `import()` in `ringai.cjs` to support ESM cli module ([e162972c])

### Refactoring

- **e2e test consolidation**: Consolidate e2e tests from 37 to 29 files — merge redundant tests (debug-keys, debug-readonly, wait-methods-extended, screenshots-disabled, location-and-window, webdriver-protocol/elements, basic-verification) into existing spec files with zero API coverage loss ([e71d90b0])
- **mocha → vitest migration**: Migrate `plugin-playwright-driver`, `timeout-config`, and `test-utils` test scripts from mocha to vitest; delete stale `.mocharc.json` files; update root `test:plugin-playwright` scripts ([eb01a331])
- **package scripts cleanup**: Clean up package scripts and migrate to vitest/tsx ([b27fd3a9])

### Rename

- **testring → ringai**: Rename project from testring to ringai across all packages, configs, and documentation ([2f1b2702])
