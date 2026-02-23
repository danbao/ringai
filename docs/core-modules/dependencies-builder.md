# @ringai/dependencies-builder

> **DEPRECATED:** This package has been removed in v0.8.0 (Phase 2.4 of the refactor). ESM-native module resolution is used instead. This documentation is retained for historical reference only.

The `dependencies-builder` package previously provided static analysis of `require()` calls to build dependency dictionaries for the sandbox module. With the migration to ESM and `worker_threads`-based sandbox execution, this package is no longer needed.

## Migration

If you previously depended on `@ringai/dependencies-builder`:

- **For test file dependency resolution:** ESM `import` statements are resolved natively by Node.js
- **For sandbox execution:** The `@ringai/sandbox` module now uses `worker_threads` with ESM loader hooks
- **For dependency analysis:** Use standard tooling like `madge` or the built-in `node --experimental-loader` hooks
