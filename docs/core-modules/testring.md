# testring

Main entry package for the testring framework. Provides the `testring` CLI command and re-exports the `run()` function from `@testring/api` for programmatic use.

## Installation

```bash
pnpm add testring
```

## Overview

The `testring` package is the user-facing entry point that ties together the CLI and the API:

- **CLI binary** — `bin/testring.cjs` is a CJS wrapper that calls `runCLI()` from `@testring/cli`
- **Programmatic API** — `src/index.ts` re-exports `run()` from `@testring/api`

This is the package users install to run tests. It sits at **Layer 9** (Entry) in the core architecture, depending only on `@testring/api` and `@testring/cli`.

## CLI Usage

After installing, the `testring` command is available via `npx` or in `package.json` scripts:

```bash
# Run tests with default config (.testringrc)
npx testring

# Run with explicit options
npx testring run --tests "./tests/**/*.spec.js" --worker-limit 4

# Show help
npx testring --help
```

The CLI is implemented in `@testring/cli` using [citty](https://github.com/unjs/citty). The `testring` package provides the CJS bin entry point:

```javascript
// bin/testring.cjs
#!/usr/bin/env node
const { runCLI } = require('@testring/cli');
runCLI(process.argv);
```

### Available subcommands

| Command           | Description                              |
| ----------------- | ---------------------------------------- |
| `testring run`    | Execute tests                            |
| `testring init`   | Initialize a new testring configuration  |
| `testring plugin` | Plugin management utilities              |

## Programmatic API

The default and named export is the `run()` function from `@testring/api`:

```typescript
import { run } from 'testring';

await run();
```

`run()` reads configuration (via `@testring/cli-config`), sets up the logger, loads plugins, and orchestrates test execution through the test-run-controller and test-worker modules.

## Package Structure

```
core/testring/
├── bin/
│   └── testring.cjs     # CJS CLI entry point
├── src/
│   └── index.ts          # Re-exports run() from @testring/api
├── package.json
├── tsconfig.json
└── tsup.config.ts
```

**Key `package.json` fields:**

```json
{
  "name": "testring",
  "type": "module",
  "main": "./dist/index.js",
  "bin": {
    "testring": "./bin/testring.cjs"
  },
  "dependencies": {
    "@testring/api": "workspace:*",
    "@testring/cli": "workspace:*"
  }
}
```

The bin entry uses `.cjs` to ensure compatibility when invoked by Node.js directly, since the `bin` field needs to work regardless of the caller's module system.

## Source Files

| File              | Description                                      |
| ----------------- | ------------------------------------------------ |
| `src/index.ts`    | `export { run } from '@testring/api'` (default + named) |
| `bin/testring.cjs`| CJS entry that calls `runCLI(process.argv)`      |

## Dependencies

- `@testring/api` — provides the `run()` function
- `@testring/cli` — provides `runCLI()` for the CLI binary

## Related Modules

- `@testring/api` — test execution orchestrator
- `@testring/cli` — CLI implementation with subcommands
- `@testring/cli-config` — configuration resolution (used internally by `run()`)
