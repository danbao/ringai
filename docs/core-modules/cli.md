# @ringai/cli

Command line interface module for the ringai framework, built on [citty](https://github.com/unjs/citty).

## Overview

The CLI module serves as the command line entry point for ringai. It provides subcommands for running tests, initializing projects, and listing available plugins.

The CLI entry point is `core/ringai/bin/ringai.cjs`, which calls `runCLI()` from `@ringai/cli`. Internally, `runCLI(argv)` slices `argv[2:]` and passes the remaining arguments to citty for command routing.

## Installation

```bash
pnpm add @ringai/cli
```

## Subcommands

### `run` — Run Tests

Loads configuration via `getConfig()`, creates a `LoggerServer`, and calls `runTests()` to execute the test suite.

```bash
ringai run
ringai run --tests "./tests/**/*.spec.js"
ringai run --config ./my-config.json
ringai run --workerLimit 4
ringai run --retryCount 3
ringai run --logLevel debug
```

### `init` — Initialize a New Project

Scaffolds a new ringai project with an interactive wizard that creates configuration files, example tests, and updates `package.json`.

```bash
ringai init
```

### `plugin` — List Available Plugins

Lists official and community plugins with their descriptions and installation instructions.

```bash
ringai plugin
```

## Configuration Options

The following CLI flags are supported (can also be set in configuration files):

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--config` | `string` | `.ringairc` | Custom configuration file path |
| `--tests` | `string` | `./tests/**/*.js` | Test file glob pattern |
| `--plugins` | `array` | `[]` | Plugin list |
| `--bail` | `boolean` | `false` | Stop immediately after first test failure |
| `--workerLimit` | `number` | `1` | Number of parallel test worker processes |
| `--retryCount` | `number` | `3` | Number of test retries on failure |
| `--retryDelay` | `number` | `2000` | Delay between retries (ms) |
| `--logLevel` | `string` | `info` | Log level (`verbose`, `debug`, `info`, `warning`, `error`) |
| `--envConfig` | `string` | — | Environment configuration file path |
| `--headless` | `boolean` | — | Run browser in headless mode |
| `--screenshots` | `string` | `disable` | Screenshot mode (`disable`, `enable`, `afterError`) |
| `--screenshotPath` | `string` | `./_tmp/` | Path for saving screenshots |
| `--debug` | `boolean` | `false` | Enable debug mode |
| `--testTimeout` | `number` | `900000` | Test timeout in ms (15 min) |
| `--silent` | `boolean` | `false` | Suppress output |

## Configuration Files

ringai supports multiple configuration file formats. The default config file is `.ringairc`.

### Supported Formats

| File | Format |
|------|--------|
| `.ringairc` | JSON (no extension treated as JSON) |
| `.ringairc.js` | JavaScript (CommonJS or ESM) |
| `.ringairc.cjs` | CommonJS JavaScript |
| `ringai.config.js` | JavaScript (CommonJS or ESM) |
| `ringai.config.cjs` | CommonJS JavaScript |

### JSON Configuration (`.ringairc`)

```json
{
    "tests": "./tests/**/*.spec.js",
    "plugins": [
        ["@ringai/plugin-playwright-driver", { "headless": true }],
        "@ringai/plugin-compiler"
    ],
    "workerLimit": 2,
    "retryCount": 3,
    "retryDelay": 2000,
    "logLevel": "info",
    "bail": false
}
```

### JavaScript Configuration

```javascript
export default {
    tests: './tests/**/*.spec.js',
    plugins: [
        ['@ringai/plugin-playwright-driver', { headless: true }],
    ],
    workerLimit: 2,
    retryCount: process.env.CI ? 1 : 3,
};
```

JavaScript config files can also export a function that receives the current config and process environment:

```javascript
export default async (config, env) => {
    return {
        tests: './tests/**/*.spec.js',
        plugins: ['@ringai/plugin-playwright-driver'],
        workerLimit: env.CI ? 4 : 2,
    };
};
```

### Configuration Priority

Configuration is merged with the following priority (highest to lowest):

1. CLI arguments
2. File config (`--config`)
3. Environment config (`--envConfig`)
4. Default configuration

### Config Inheritance

Configs support an `@extend` property to inherit from a base config:

```json
{
    "@extend": "./base-config.json",
    "workerLimit": 4
}
```

## Exported API

The primary programmatic entry point:

```typescript
export async function runCLI(argv: string[]): Promise<void>
```

Slices `argv` from index 2 (skipping `node` and script path) and passes the result to citty for command dispatch.

## Dependencies

- **citty** — Lightweight CLI framework for command routing
- **kleur** — Terminal color output
- **@ringai/cli-config** — Configuration file loading and merging
- **@ringai/logger** — Logging infrastructure
- **@ringai/transport** — Inter-process communication
- **@ringai/types** — Type definitions

## Related Modules

- [@ringai/cli-config](./cli-config.md) — Configuration file handling
- [@ringai/api](./api.md) — Test API
- [@ringai/test-run-controller](./test-run-controller.md) — Test run control
- [@ringai/logger](./logger.md) — Logging system
