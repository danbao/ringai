# @testring/plugin-babel

Babel compilation plugin for the testring framework. Hooks into the test worker's `compile` step to transform test files via `@babel/core.transformAsync()` before execution.

## Installation

```bash
pnpm add @testring/plugin-babel
```

Peer dependencies:
- `@babel/core`
- `@babel/plugin-transform-modules-commonjs`

## Export

The package exports a single default function:

```typescript
import babelPlugin from '@testring/plugin-babel';
```

## How It Works

1. `babelPlugin` receives a `PluginAPI` instance and optional Babel `TransformOptions`.
2. It calls `pluginAPI.getTestWorker()` to get the test worker.
3. It registers a `testWorker.compile()` hook — an async callback that receives `(code: string, filename: string)` and must return the transformed code string.
4. Inside the hook, it calls `babelCore.transformAsync(code, opts)` and returns the result.

### Source Code

The entire plugin is concise:

```typescript
import * as path from 'path';
import { PluginAPI } from '@testring/plugin-api';
import * as babelCore from '@babel/core';
import babelPluginCommonJS from '@babel/plugin-transform-modules-commonjs';

const babelPlugins = [
  [
    babelPluginCommonJS,
    {
      strictMode: false,
    },
  ],
];

const babelPlugin = (
  pluginAPI: PluginAPI,
  config: babelCore.TransformOptions | null = {},
): void => {
  const testWorker = pluginAPI.getTestWorker();

  testWorker.compile(async (code: string, filename: string) => {
    const opts = {
      sourceFileName: path.relative(process.cwd(), filename),
      sourceMaps: false,
      sourceRoot: process.cwd(),
      ...config,
      plugins: [...babelPlugins, ...(config?.plugins || [])],
      filename,
    };
    const result = await babelCore.transformAsync(code, opts);
    return result?.code || '';
  });
};

export default babelPlugin;
```

## Built-in Plugin: `babelPluginCommonJS`

The plugin always includes `@babel/plugin-transform-modules-commonjs` with `{ strictMode: false }` as the first Babel plugin. This converts ES module `import`/`export` statements to CommonJS `require`/`module.exports` — necessary because test code runs inside the testring sandbox which uses CommonJS module loading.

Any additional plugins provided via `config.plugins` are appended **after** the built-in CommonJS transform.

## Configuration

### Function Signature

```typescript
function babelPlugin(
  pluginAPI: PluginAPI,
  config?: babelCore.TransformOptions | null,
): void;
```

### TransformOptions

Pass any standard `@babel/core` `TransformOptions`. Key options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `sourceFileName` | `string` | Relative path from cwd | Source file name for source maps |
| `sourceMaps` | `boolean` | `false` | Whether to generate source maps |
| `sourceRoot` | `string` | `process.cwd()` | Root directory for source maps |
| `plugins` | `any[]` | `[]` | Additional Babel plugins (appended after built-in CommonJS) |
| `presets` | `any[]` | `[]` | Babel presets (e.g., `@babel/preset-env`) |
| `filename` | `string` | Set automatically | Current file being compiled |
| `compact` | `boolean` | — | Whether to compress output |
| `comments` | `boolean` | — | Whether to preserve comments |

**Note:** The `plugins` array in the final options is `[...babelPlugins, ...(config?.plugins || [])]`, so the CommonJS transform always runs first.

## Usage

### In `.testringrc` (JSON config)

```json
{
  "plugins": [
    "@testring/plugin-babel"
  ]
}
```

### With custom Babel config

```json
{
  "plugins": [
    ["@testring/plugin-babel", {
      "sourceMaps": true,
      "presets": [
        ["@babel/preset-env", { "targets": { "node": "22" } }]
      ],
      "plugins": [
        ["@babel/plugin-proposal-decorators", { "legacy": true }]
      ]
    }]
  ]
}
```

### Programmatic usage

```typescript
import babelPlugin from '@testring/plugin-babel';
import { PluginAPI } from '@testring/plugin-api';

const pluginAPI = new PluginAPI(/* ... */);

// Default — only CommonJS transform
babelPlugin(pluginAPI);

// With TypeScript support
babelPlugin(pluginAPI, {
  sourceMaps: true,
  presets: [
    ['@babel/preset-typescript', { allowNamespaces: true }],
    ['@babel/preset-env', { targets: { node: '22' } }],
  ],
});
```

## Dependencies

- `@babel/core` — Babel compiler
- `@babel/plugin-transform-modules-commonjs` — ESM → CJS transform
- `@testring/plugin-api` — Plugin API interface
