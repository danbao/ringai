# @testring/cli-config

Configuration management module that parses CLI arguments, reads config files, and merges everything into a single `IConfig` object for the testring framework.

## Installation

```bash
pnpm add @testring/cli-config
```

## Overview

This module is responsible for resolving the final runtime configuration from multiple sources. It:

1. Parses CLI arguments using `yargs/helpers` (with automatic kebab-case → camelCase conversion)
2. Reads config files in JSON (`.json`, no extension) or JavaScript (`.js`, `.cjs`, `.mjs`) format
3. Supports config file inheritance via the `@extend` property
4. Merges all configuration layers with a priority system, using `deepmerge` with special plugin-aware merge logic
5. Exports a `defineConfig()` helper for type-safe config files

## API Reference

### `getConfig(argv?)`

The main entry point. Resolves configuration from all sources and returns the merged result.

```typescript
import { getConfig } from '@testring/cli-config';

const config = await getConfig(process.argv.slice(2));
```

| Parameter | Type       | Default     | Description                          |
| --------- | ---------- | ----------- | ------------------------------------ |
| `argv`    | `string[]` | `undefined` | CLI arguments to parse (optional)    |

Returns `Promise<IConfig>`.

**Priority (highest to lowest):**

1. CLI arguments
2. File config (path from `--config`, defaults to `.testringrc`)
3. Environment config (path from `--env-config`)
4. Default configuration

---

### `defineConfig(config)`

Type-safe helper for writing config files. Simply returns the input — its purpose is to provide TypeScript autocompletion.

```typescript
import { defineConfig } from '@testring/cli-config';

export default defineConfig({
  tests: './tests/**/*.spec.js',
  workerLimit: 4,
  retryCount: 2,
  plugins: ['@testring/plugin-playwright-driver'],
});
```

| Parameter | Type              | Description               |
| --------- | ----------------- | ------------------------- |
| `config`  | `Partial<IConfig>` | Configuration object      |

Returns `Partial<IConfig>`.

---

### `getFileConfig(configPath, userConfig)`

Reads and parses a single configuration file. Supports JSON, JavaScript (sync or async export), and the `@extend` inheritance pattern.

```typescript
import { getFileConfig } from '@testring/cli-config';

const fileConfig = await getFileConfig('./.testringrc', defaultConfiguration);
```

| Parameter    | Type                | Description                                       |
| ------------ | ------------------- | ------------------------------------------------- |
| `configPath` | `string \| void`    | Path to the config file                           |
| `userConfig` | `IConfig`           | Base config passed to JS config functions          |

Returns `Promise<IConfig | null>` — `null` if the file doesn't exist or path is empty.

**Supported file types:**

| Extension     | Behavior                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------ |
| `.json`, none | Parsed as JSON via `JSON.parse`                                                            |
| `.js`, `.cjs`, `.mjs` | Loaded via `requirePackage`. If the export is a function, it is called with `(config, process.env)` |

---

### `defaultConfiguration`

The default configuration object used as the base layer:

```typescript
import { defaultConfiguration } from '@testring/cli-config';
```

```typescript
const defaultConfiguration: IConfig = {
  devtool: false,
  tests: './tests/**/*.js',
  restartWorker: false,
  screenshots: 'disable',
  screenshotPath: './_tmp/',
  config: '.testringrc',
  debug: false,
  silent: false,
  bail: false,
  workerLimit: 1,
  maxWriteThreadCount: 2,
  plugins: [],
  retryCount: 3,
  retryDelay: 2000,
  testTimeout: 900000, // 15 minutes
  logLevel: 'info',
  envParameters: {},
};
```

---

### `mergeConfigs(defaults, ...extensions)`

Deep-merges multiple configuration objects with special handling for the `plugins` array. Plugins are merged by name — if two config layers reference the same plugin, their options are deep-merged rather than duplicated.

```typescript
import { mergeConfigs } from '@testring/cli-config';

const merged = mergeConfigs(defaults, envConfig, fileConfig, cliArgs);
```

**Plugin merge example:**

```typescript
// Layer 1
{ plugins: ['@testring/plugin-babel'] }

// Layer 2
{ plugins: [['@testring/plugin-babel', { presets: ['@babel/preset-env'] }]] }

// Result
{ plugins: [['@testring/plugin-babel', { presets: ['@babel/preset-env'] }]] }
```

## Config File Formats

### JSON (`.testringrc` or `.testringrc.json`)

```json
{
  "tests": "./tests/**/*.spec.js",
  "workerLimit": 2,
  "retryCount": 3,
  "plugins": [
    "@testring/plugin-playwright-driver",
    ["@testring/plugin-babel", { "presets": ["@babel/preset-env"] }]
  ]
}
```

### JavaScript (`.testringrc.js`)

Static export:

```javascript
export default {
  tests: './tests/**/*.spec.js',
  workerLimit: 2,
  plugins: ['@testring/plugin-playwright-driver'],
};
```

Async function export (receives current config and `process.env`):

```javascript
export default async (config, env) => ({
  tests: './tests/**/*.spec.js',
  workerLimit: env.CI ? 1 : 4,
  retryCount: env.CI ? 1 : 3,
  envParameters: {
    baseUrl: env.BASE_URL || 'http://localhost:3000',
  },
});
```

### Config inheritance (`@extend`)

A config file can extend another by including `"@extend"`:

```json
{
  "@extend": "./base-config.json",
  "workerLimit": 4,
  "envParameters": { "baseUrl": "https://staging.example.com" }
}
```

The extended config is loaded first, then the current file's values are merged on top.

## CLI Arguments

Arguments are parsed with `yargs/helpers` Parser. Kebab-case flags are automatically converted to camelCase.

```bash
testring run \
  --tests "./tests/**/*.spec.js" \
  --worker-limit 4 \
  --retry-count 2 \
  --retry-delay 1000 \
  --log-level debug \
  --bail \
  --config ./my-config.json \
  --env-config ./env/staging.json \
  --env-parameters.baseUrl "https://api.example.com"
```

## Arguments Parser (`getArguments`)

Internal function that parses raw `argv` strings into a `Partial<IConfig>`. It:

1. Uses `yargs/helpers` `Parser` to parse arguments
2. Strips internal yargs fields (`_`, `$0`, `version`, `help`)
3. Converts kebab-case keys to camelCase
4. Removes `undefined` values

```typescript
import { getArguments } from '@testring/cli-config';

const args = getArguments(['--worker-limit', '4', '--bail']);
// { workerLimit: 4, bail: true }
```

## Source Files

| File                       | Description                                              |
| -------------------------- | -------------------------------------------------------- |
| `src/index.ts`             | `getConfig()`, `defineConfig()`, re-exports              |
| `src/arguments-parser.ts`  | CLI argument parsing and normalization                   |
| `src/config-file-reader.ts`| Config file reading (JSON, JS, `@extend` support)        |
| `src/merge-configs.ts`     | Deep merge with plugin-aware merge strategy              |
| `src/default-config.ts`    | Default configuration constant                           |

## Dependencies

- `deepmerge` — deep object merging
- `yargs` — CLI argument parsing (via `yargs/helpers`)
- `@testring/logger` — logging config file reads
- `@testring/utils` — `requirePackage` for loading JS config files
- `@testring/types` — `IConfig`, `LogLevel`

## Related Modules

- `@testring/cli` — invokes `getConfig()` to resolve configuration before running tests
- `@testring/types` — defines the `IConfig` interface
