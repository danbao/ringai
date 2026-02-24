# ringai

Main entry package for the ringai framework. Provides the `ringai` CLI command and re-exports the `run()` function from `@ringai/api` for programmatic use.

## Installation

```bash
pnpm add ringai
```

## Overview

The `ringai` package is the user-facing entry point that ties together the CLI and the API:

- **CLI binary** — `bin/ringai.cjs` is a CJS wrapper that calls `runCLI()` from `@ringai/cli`
- **Programmatic API** — `src/index.ts` re-exports `run()` from `@ringai/api`

This is the package users install to run tests. It sits at **Layer 9** (Entry) in the core architecture, depending only on `@ringai/api` and `@ringai/cli`.

## CLI Usage

After installing, the `ringai` command is available via `npx` or in `package.json` scripts:

```bash
# Run tests with default config (.ringairc)
npx ringai

# Run with explicit options
npx ringai run --tests "./tests/**/*.spec.js" --worker-limit 4

# Show help
npx ringai --help
```

The CLI is implemented in `@ringai/cli` using [citty](https://github.com/unjs/citty). The `ringai` package provides the CJS bin entry point:

```javascript
// bin/ringai.cjs
#!/usr/bin/env node
const { runCLI } = require('@ringai/cli');
runCLI(process.argv);
```

### Available subcommands

| Command           | Description                              |
| ----------------- | ---------------------------------------- |
| `ringai run`    | Execute tests                            |
| `ringai init`   | Initialize a new ringai configuration  |
| `ringai plugin` | Plugin management utilities              |

## Programmatic API

The default and named export is the `run()` function from `@ringai/api`:

```typescript
import { run } from 'ringai';

await run();
```

`run()` reads configuration (via `@ringai/cli-config`), sets up the logger, loads plugins, and orchestrates test execution through the test-run-controller and test-worker modules.

## Package Structure

```
core/ringai/
├── bin/
│   └── ringai.cjs     # CJS CLI entry point
├── src/
│   └── index.ts          # Re-exports run() from @ringai/api
├── package.json
├── tsconfig.json
└── tsup.config.ts
```

**Key `package.json` fields:**

```json
{
  "name": "ringai",
  "type": "module",
  "main": "./dist/index.js",
  "bin": {
    "ringai": "./bin/ringai.cjs"
  },
  "dependencies": {
    "@ringai/api": "workspace:*",
    "@ringai/cli": "workspace:*"
  }
}
```

The bin entry uses `.cjs` to ensure compatibility when invoked by Node.js directly, since the `bin` field needs to work regardless of the caller's module system.

## Source Files

| File              | Description                                      |
| ----------------- | ------------------------------------------------ |
| `src/index.ts`    | `export { run } from '@ringai/api'` (default + named) |
| `bin/ringai.cjs`| CJS entry that calls `runCLI(process.argv)`      |

## Dependencies

- `@ringai/api` — provides the `run()` function
- `@ringai/cli` — provides `runCLI()` for the CLI binary

## Related Modules

- `@ringai/api` — test execution orchestrator
- `@ringai/cli` — CLI implementation with subcommands
- `@ringai/cli-config` — configuration resolution (used internally by `run()`)
