<coding_guidelines>
# CLAUDE.md

This file provides guidance to AI coding assistants when working with code in this repository.

## Project Overview

ringai is a modern, ESM-first Node.js automated UI testing framework for web applications. It provides multi-process parallel test execution, a rich plugin system, multi-browser support (Chrome, Firefox, Safari, Edge) via Playwright, and a TypeScript-native development experience.

- **Version:** 0.8.x
- **Node.js:** 22+
- **Package Manager:** pnpm 10+
- **Module System:** ESM (`"type": "module"`)
- **TypeScript Target:** ES2022

## Architecture

### Monorepo Structure
- **`core/`** — Core modules providing framework foundations (~20 packages)
- **`packages/`** — Extension packages with plugins and tools
- **`docs/`** — Documentation files
- **`utils/`** — Build and maintenance utilities

### Build System
- **tsup** — Compiles each package (ESM-only, ES2022 target, sourcemaps)
- **turbo** — Orchestrates builds and tasks across the monorepo
- **pnpm workspaces** — Manages dependencies across packages

### Core Module Dependencies (10-Layer Architecture)
The core modules follow a strict layered architecture with clear dependency hierarchy:

**Layer 0 (Base):** `types`, `async-breakpoints`
**Layer 1 (Utils):** `utils`, `pluggable-module`
**Layer 2 (Infrastructure):** `child-process`, `transport`
**Layer 3 (Services):** `logger`, `fs-reader`
**Layer 4 (Config/Storage):** `cli-config`, `fs-store`
**Layer 5 (APIs):** `api`, `plugin-api`
**Layer 6 (Advanced):** `sandbox`, `test-run-controller`, `reporter`
**Layer 7 (Execution):** `test-worker`
**Layer 8 (Interface):** `cli`
**Layer 9 (Entry):** `ringai`

## Development Commands

### Build
```bash
# Full build (all packages, turbo-orchestrated)
pnpm run build

# Build main packages only (excludes e2e-test-app, devtool-frontend, devtool-extension)
pnpm run build:main

# Watch mode for development
pnpm run build:main:watch
```

### Testing
```bash
# Run all tests (unit + E2E headless)
pnpm test

# Run unit tests only (vitest)
pnpm run test:unit

# Run unit tests with coverage (vitest + v8 provider)
pnpm run test:unit:coverage

# Run unit tests in watch mode
pnpm run test:unit:watch

# Run a single test file
npx vitest run path/to/file.spec.ts

# Run E2E tests (headless, default)
pnpm run test:e2e

# Run E2E tests (headed, with browser visible)
pnpm run test:e2e:headed

# Run E2E tests with coverage (c8)
pnpm run test:e2e:coverage

# Run CI tests (unit coverage + E2E coverage)
pnpm run test:ci
```

### Linting and Code Quality
```bash
# Lint all files (eslint flat config)
pnpm run lint

# Fix linting issues
pnpm run lint:fix
```

### Package Management
```bash
# Clean all packages
pnpm run cleanup

# Reinstall all dependencies
pnpm run reinstall

# Check for dependency updates
pnpm run deps:find-updates

# Validate package versions
pnpm run deps:validate
```

## Key Technical Details

### TypeScript Configuration
- Target: **ES2022**
- Module: **ES2022**
- Module Resolution: **bundler**
- Strict mode enabled with all strict flags
- Composite builds enabled for incremental compilation
- All packages have individual `tsconfig.json` extending `tsconfig.base.json`

### Testing Framework
- **Vitest** for all unit and integration tests
- Coverage via **@vitest/coverage-v8** (V8 provider)
- **c8** for E2E coverage
- Tests run in parallel using Vitest's thread pool
- Root `vitest.config.ts` configures all test inclusion/exclusion patterns

### Build System
- **pnpm workspaces** for monorepo dependency management
- **tsup** compiles each package to ESM with sourcemaps
- **turbo** orchestrates build/test/lint tasks with caching
- Each package builds to its own `dist/` directory
- Base tsup config in `tsup.config.base.ts`

### CLI
- Built with **citty** (lightweight CLI framework)
- Subcommands: `run`, `init`, `plugin`
- Configuration files: `.ringairc` (JSON), `.ringairc.js` (ESM), `.ringairc.cjs` (CJS)

### Package Structure
Each package follows a consistent structure:
- `src/` — TypeScript source files
- `test/` — Test files (`.spec.ts`)
- `dist/` — Built output (ESM)
- `package.json` — Package configuration (`"type": "module"`)
- `tsconfig.json` — TypeScript config (extends `tsconfig.base.json`)
- `tsconfig.build.json` — Build-specific config
- `tsup.config.ts` — tsup build configuration

## Working with Packages

### Adding New Packages
New packages should follow the existing structure and be placed in either `core/` or `packages/` depending on their purpose. Ensure `"type": "module"` is set in `package.json` and provide a `tsup.config.ts`.

### Modifying Core Packages
When modifying core packages, be aware of the dependency hierarchy. Changes to lower-layer packages may affect multiple dependent packages. Turbo handles the build ordering automatically.

### Plugin Development
Use the `plugin-api` package for creating new plugins. Follow existing plugin patterns in the `packages/` directory (e.g., `plugin-playwright-driver`, `plugin-babel`, `plugin-fs-store`).

## Common Patterns

### Error Handling
The framework uses a `RingaiError` hierarchy with specialized error types:
- `RingaiError` — Base error class
- `TransportError` — IPC/transport errors
- `PluginError` — Plugin lifecycle errors
- `ConfigError` — Configuration validation errors
- `WorkerError` — Worker process errors

### Async Operations
All async operations use modern async/await patterns with ES2022 features.

### Inter-Process Communication
The `transport` package handles all IPC between test workers and the main process, with `serialize`/`deserialize` for message passing.

### File System Operations
Use `fs-reader` for reading test files and `fs-store` for managing test artifacts and caching.

### Key Dependencies
- **citty** — CLI framework
- **hookable** — Plugin hook system
- **tinypool** — Worker thread pool
- **tinyglobby** — Fast glob matching
- **kleur** — Terminal colors
- **@clack/prompts** — Interactive CLI prompts
</coding_guidelines>
