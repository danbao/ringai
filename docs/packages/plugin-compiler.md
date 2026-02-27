# @ringai/plugin-compiler

esbuild-based compiler plugin for the ringai framework. Transforms TypeScript, TSX, JSX, and modern JavaScript into CJS format at runtime, enabling test files written in these languages to be executed by the ringai test worker. This plugin replaces the legacy Babel-based compiler with a significantly faster esbuild-powered alternative.

## Installation

```bash
pnpm add --save-dev @ringai/plugin-compiler
```

## Export

The package exports a single default plugin function and the `CompilerPluginOptions` interface:

```typescript
import compilerPlugin from '@ringai/plugin-compiler';
import type { CompilerPluginOptions } from '@ringai/plugin-compiler';
```

## How It Works

### Plugin Registration

```typescript
import { PluginAPI } from '@ringai/plugin-api';

const compilerPlugin = (pluginAPI: PluginAPI, config: CompilerPluginOptions = {}) => {
  const testWorker = pluginAPI.getTestWorker();

  testWorker.compile(async (code: string, filename: string) => {
    // Determines loader based on file extension, then transforms with esbuild
  });
};

export default compilerPlugin;
```

1. Gets the `TestWorker` via `pluginAPI.getTestWorker()`.
2. Registers a `compile` hook that intercepts source code before execution.
3. Determines the appropriate esbuild loader from the file extension.
4. Transforms the code using esbuild's `transform` API, converting ESM imports to CJS `require()` calls.

### Loader Selection

The plugin selects an esbuild loader based on the file extension:

| Extension | Loader | Description |
|-----------|--------|-------------|
| `.ts`     | `ts`   | TypeScript (strips type annotations) |
| `.tsx`    | `ts`   | TypeScript with JSX |
| `.jsx`    | `jsx`  | JavaScript with JSX |
| `.js`     | `js`   | Standard JavaScript (ESM to CJS conversion) |

All other extensions fall back to the `js` loader.

### Transform Behavior

The esbuild transform performs the following:

- **ESM to CJS** -- Converts `import`/`export` syntax to `require()`/`module.exports` (output format is `cjs`).
- **TypeScript stripping** -- Removes type annotations, interfaces, and other TypeScript-only syntax for `.ts` and `.tsx` files.
- **JSX transformation** -- Compiles JSX syntax for `.tsx` and `.jsx` files.
- **Source maps** -- Optionally generates inline source maps for debugging.
- **Target downleveling** -- Transpiles syntax to the configured target (default: `es2022`).

## Configuration

### CompilerPluginOptions

```typescript
interface CompilerPluginOptions {
  sourceMap?: boolean;
  target?: string;
  esbuild?: Omit<TransformOptions, 'format' | 'sourcefile'>;
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `sourceMap` | `boolean` | `false` | Enable inline source maps in compiled output |
| `target` | `string` | `'es2022'` | JavaScript/TypeScript target version (e.g., `'es2020'`, `'esnext'`) |
| `esbuild` | `object` | `{}` | Additional esbuild `TransformOptions` (except `format` and `sourcefile`, which are managed by the plugin) |

### In `.ringairc`

```json
{
  "plugins": [
    ["@ringai/plugin-compiler", {
      "sourceMap": true,
      "target": "es2022"
    }]
  ]
}
```

### With Custom esbuild Options

```json
{
  "plugins": [
    ["@ringai/plugin-compiler", {
      "sourceMap": true,
      "target": "es2020",
      "esbuild": {
        "jsx": "automatic",
        "jsxImportSource": "react",
        "keepNames": true
      }
    }]
  ]
}
```

### In `ringai.config.js`

```javascript
module.exports = {
  plugins: [
    ['@ringai/plugin-compiler', {
      sourceMap: true,
      target: 'es2022',
    }]
  ]
};
```

## Usage Examples

### Basic Setup (Zero Config)

The plugin works out of the box with sensible defaults:

```json
{
  "plugins": [
    "@ringai/plugin-compiler"
  ]
}
```

This enables TypeScript and JSX compilation with `es2022` target and no source maps.

### TypeScript with Source Maps

For easier debugging with stack traces that point to original source lines:

```json
{
  "plugins": [
    ["@ringai/plugin-compiler", {
      "sourceMap": true
    }]
  ]
}
```

### React JSX (Automatic Runtime)

For projects using React 17+ automatic JSX transform:

```json
{
  "plugins": [
    ["@ringai/plugin-compiler", {
      "esbuild": {
        "jsx": "automatic",
        "jsxImportSource": "react"
      }
    }]
  ]
}
```

## Dependencies

- **`esbuild`** -- High-performance JavaScript/TypeScript bundler and transformer
- **`@ringai/plugin-api`** -- Plugin API interface

## Related Modules

- **`@ringai/test-worker`** -- Test worker that invokes the compile hook
- **`@ringai/plugin-api`** -- Plugin API providing access to framework modules
