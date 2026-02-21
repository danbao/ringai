# Async Assertions

> **Note:** The standalone `@testring/async-assert` package was removed in v0.8.0. The assertion system now lives inside `@testring/web-application` as `src/async-assert.ts` and is accessed through `app.assert` and `app.softAssert`.

## Overview

The async assertion system wraps `chai.assert` in an asynchronous Proxy, providing:

- All `chai.assert` methods as async functions (return `Promise<void>`)
- **Hard assert** mode — throws on first failure (default)
- **Soft assert** mode — collects errors, test continues
- Optional `onSuccess`/`onError` callbacks for screenshot capture and logging
- Chai plugin support

## API

### `createAssertion(options?): AsyncAssertionApi`

Creates an assertion instance. Located in `@testring/web-application/src/async-assert.ts`.

```typescript
import { createAssertion, type AsyncAssertionApi } from '@testring/web-application';

interface IAssertionOptions {
    isSoft?: boolean;
    plugins?: Array<ChaiPlugin>;
    onSuccess?: (meta: IAssertionSuccessMeta) => Promise<void>;
    onError?: (meta: IAssertionErrorMeta) => Promise<Error | void>;
}
```

### Hard Assert (via `app.assert`)

Throws immediately on failure. In `WebApplication`, failures also trigger `makeScreenshot()`.

```javascript
run(async (api) => {
    const app = api.application;

    await app.assert.equal(actual, expected);
    await app.assert.isTrue(condition);
    await app.assert.include('hello world', 'hello');
    await app.assert.throws(() => { throw new Error('test'); });
});
```

### Soft Assert (via `app.softAssert`)

Collects failures without stopping the test:

```javascript
run(async (api) => {
    const app = api.application;

    await app.softAssert.equal(1, 2);       // does NOT throw
    await app.softAssert.isNumber('nope');   // does NOT throw

    // Check collected errors
    const errors = app.softAssert._errorMessages; // string[]
    await app.assert.lengthOf(errors, 2);
});
```

## Supported Methods

All `chai.assert` methods are available as async functions. The most commonly used:

### Equality
```typescript
await assert.equal(actual, expected)
await assert.notEqual(actual, expected)
await assert.strictEqual(actual, expected)
await assert.deepEqual(actual, expected)
await assert.notDeepEqual(actual, expected)
```

### Boolean / Truthiness
```typescript
await assert.isTrue(value)
await assert.isFalse(value)
await assert.ok(value)             // truthy
await assert.isNotOk(value)        // falsy
```

### Type Checks
```typescript
await assert.typeOf(value, 'string')
await assert.isString(value)
await assert.isNumber(value)
await assert.isBoolean(value)
await assert.isArray(value)
await assert.isObject(value)
await assert.isNull(value)
await assert.isNotNull(value)
await assert.isUndefined(value)
await assert.isDefined(value)
```

### Inclusion / Pattern
```typescript
await assert.include(haystack, needle)
await assert.notInclude(haystack, needle)
await assert.match(string, /regex/)
```

### Numeric
```typescript
await assert.isAbove(value, threshold)
await assert.isBelow(value, threshold)
await assert.isAtLeast(value, min)
await assert.isAtMost(value, max)
```

### Collections
```typescript
await assert.lengthOf(array, length)
await assert.isEmpty(value)
await assert.isNotEmpty(value)
```

### Properties
```typescript
await assert.property(object, key)
await assert.notProperty(object, key)
```

### Existence
```typescript
await assert.exists(value)       // not null/undefined
await assert.notExists(value)    // null or undefined
```

### Exceptions
```typescript
await assert.throws(fn)
await assert.doesNotThrow(fn)
```

## Callback Hooks

`WebApplication` configures `onSuccess` and `onError` callbacks to trigger screenshots:

```typescript
const assert = createAssertion({
    onSuccess: async (meta) => {
        // meta: { isSoft, successMessage, assertMessage, args, originalMethod }
        await makeScreenshot();
    },
    onError: async (meta) => {
        // meta: { isSoft, successMessage, assertMessage, errorMessage, error, args, originalMethod }
        await makeScreenshot();
        return meta.error; // or return custom error
    },
});
```

## Plugin Support

Extend with Chai plugins:

```typescript
const assert = createAssertion({
    plugins: [myChaiPlugin],
});
```

## Related

- [`@testring/web-application`](../packages/web-application.md) — Where `app.assert` and `app.softAssert` are created
- [`@testring/types`](types.md) — `IAssertionOptions`, `IAssertionSuccessMeta`, `IAssertionErrorMeta`
