# @testring/pluggable-module

Base module providing the plugin hook system used throughout the testring framework. Every core module that supports plugins extends `PluggableModule`, which manages named hooks and integrates with the [hookable](https://github.com/unjs/hookable) library.

## Installation

```bash
pnpm add @testring/pluggable-module
```

## Overview

This module provides two complementary systems:

- **`PluggableModule`** — base class that manages a set of named hooks and exposes both a legacy `Hook` API and a modern `hookable`-based API
- **`Hook`** — standalone class implementing write (modifier) and read (listener) hook semantics with sequential async execution

All pluggable core modules (`LoggerServer`, `FSReader`, `FSStoreServer`, etc.) extend `PluggableModule` and declare their hook names in the constructor.

## API Reference

### `PluggableModule` class

```typescript
import { PluggableModule } from '@testring/pluggable-module';
```

**Constructor:**

```typescript
new PluggableModule(hooks?: string[])
```

| Parameter | Type       | Default | Description                       |
| --------- | ---------- | ------- | --------------------------------- |
| `hooks`   | `string[]` | `[]`    | List of legacy hook names to create |

Each name in `hooks` creates a `Hook` instance accessible via `getHook()`.

#### `callHook<T>(name, ...args): Promise<T>` (protected)

Calls a hook by name. First checks the modern `hookable` registry; if no handler is found there, falls back to the legacy `Hook` instance. Throws `ReferenceError` if the hook does not exist in either registry.

```typescript
class MyModule extends PluggableModule {
  constructor() {
    super(['beforeProcess', 'afterProcess']);
  }

  async process(data: string) {
    const modified = await this.callHook<string>('beforeProcess', data);
    const result = doWork(modified);
    return this.callHook<string>('afterProcess', result);
  }
}
```

#### `getHook(name): Hook | void`

Returns the legacy `Hook` instance for the given name, or `undefined` if no hook with that name was registered in the constructor.

```typescript
const hook = module.getHook('beforeProcess');
if (hook) {
  hook.writeHook('myPlugin', (data) => transform(data));
}
```

#### `registerHook(name, handler): () => void`

Registers a handler on the modern `hookable` system. Returns an unregister function.

```typescript
const unregister = module.registerHook('customEvent', async (...args) => {
  // handle event
});

// Later, remove the handler
unregister();
```

#### `registerHooks(hooks): () => void`

Registers multiple handlers at once via the `hookable` `addHooks` API. Returns an unregister function that removes all added hooks.

```typescript
const unregister = module.registerHooks({
  beforeProcess: (data) => preprocess(data),
  afterProcess: (data) => postprocess(data),
});
```

#### `registerBeforeEach(callback): () => void`

Registers a callback that runs **before** every hook invocation on the `hookable` instance. Useful for logging or instrumentation.

```typescript
module.registerBeforeEach(({ name, args }) => {
  console.log(`Hook "${name}" called with`, args);
});
```

#### `registerAfterEach(callback): () => void`

Registers a callback that runs **after** every hook invocation on the `hookable` instance.

```typescript
module.registerAfterEach(({ name, args }) => {
  console.log(`Hook "${name}" completed`);
});
```

#### `getHookNames(): string[]`

Returns a deduplicated list of all registered hook names from both the legacy and modern registries.

```typescript
const names = module.getHookNames();
// e.g. ['beforeProcess', 'afterProcess']
```

#### `hasHook(name): boolean`

Returns `true` if a hook with the given name exists in either the legacy or modern registry.

#### `removeAllHooks(): void`

Removes all hooks from both the legacy `pluginHooks` map and the `hookable` instance.

#### `getHookable(): Hookable`

Returns the underlying `Hookable` instance for advanced usage (hook dependencies, dispose support, etc.).

---

### `createPluggableModule(hooks?)` factory

Creates a new `PluggableModule` instance without subclassing.

```typescript
import { createPluggableModule } from '@testring/pluggable-module';

const module = createPluggableModule(['onData', 'onComplete']);
```

---

### `Hook` class

Standalone hook with **write** (modifier) and **read** (listener) semantics. Write hooks are called first and can transform data; read hooks are called after and receive the final data but cannot modify it.

```typescript
import { Hook } from '@testring/pluggable-module';
```

#### `writeHook(pluginName, modifier)`

Registers a write hook. The `modifier` receives the current arguments and must return a new first argument. Write hooks execute sequentially in registration order; each receives the output of the previous write hook as its first argument.

```typescript
const hook = new Hook();

hook.writeHook('normalize', (filePath) => {
  return path.resolve(filePath);
});

hook.writeHook('addExtension', (filePath) => {
  return filePath.endsWith('.ts') ? filePath : filePath + '.ts';
});
```

#### `readHook(pluginName, reader)`

Registers a read hook. The `reader` receives the final data after all write hooks have executed. It cannot modify the data. If it throws, the error propagates.

```typescript
hook.readHook('logger', (filePath) => {
  console.log('Resolved file:', filePath);
});
```

#### `callHooks<T>(...data): Promise<T>`

Executes all write hooks in order (each can transform the first argument), then all read hooks in order (read-only). Returns the final first argument.

**Execution order:**
1. Write hooks execute sequentially — each receives `(result, ...restArgs)` where `result` is the return value of the previous write hook
2. Read hooks execute sequentially — each receives the final `(result, ...restArgs)` but cannot change the return value

```typescript
const result = await hook.callHooks('/src/test');
// Write hooks transform: '/src/test' → '/abs/src/test' → '/abs/src/test.ts'
// Read hooks observe: logs '/abs/src/test.ts'
// Returns: '/abs/src/test.ts'
```

#### `getHookNames(): string[]`

Returns all unique plugin names registered as write or read hooks.

#### `hasPlugin(pluginName): boolean`

Returns `true` if the given plugin name has a write or read hook registered.

#### `removePlugin(pluginName): boolean`

Removes both write and read hooks for the given plugin name. Returns `true` if any hook was removed.

## Usage Patterns

### Extending PluggableModule

```typescript
import { PluggableModule } from '@testring/pluggable-module';

class TestFileLoader extends PluggableModule {
  constructor() {
    super(['beforeLoad', 'afterLoad']);
  }

  async load(pattern: string) {
    const files = await glob(pattern);
    const processed = await this.callHook<string[]>('beforeLoad', files);
    const loaded = await Promise.all(processed.map(readFile));
    return this.callHook<FileContent[]>('afterLoad', loaded);
  }
}

// Register plugins via the legacy Hook API
const loader = new TestFileLoader();
const beforeHook = loader.getHook('beforeLoad');

beforeHook?.writeHook('filterIgnored', (files) => {
  return files.filter((f) => !f.includes('.ignore'));
});

beforeHook?.readHook('counter', (files) => {
  console.log(`Loading ${files.length} files`);
});
```

### Plugin Error Handling

Errors thrown inside hooks are wrapped with the plugin name for easier debugging:

```
Plugin myPlugin failed: Cannot read property 'x' of undefined
```

The original stack trace is preserved on the wrapped error.

## Dependencies

- [`hookable`](https://github.com/unjs/hookable) — Modern hook system from UnJS
- `@testring/types` — Type definitions (`IPluggableModule`)

## Related Modules

- [`@testring/plugin-api`](/docs/core-modules/plugin-api.md) — Plugin registration API that uses `getHook()` to wire plugins into core modules
- [`@testring/logger`](/docs/core-modules/logger.md) — Extends `PluggableModule` with logging hooks
- [`@testring/fs-reader`](/docs/core-modules/fs-reader.md) — Extends `PluggableModule` with file resolution hooks
