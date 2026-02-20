# @testring/element-path

XPath/locator builder for the testring framework. Provides a Proxy-wrapped `ElementPath` class that generates XPath expressions via fluent chaining and dynamic property access.

## Installation

```bash
pnpm add @testring/element-path
```

## Exports

```typescript
import {
  ElementPath,
  createElementPath,
  type ElementPathProxy,
} from '@testring/element-path';
```

## Quick Start

```typescript
import { createElementPath } from '@testring/element-path';

const root = createElementPath();

// Simple property chaining → XPath
root.header.navigation.userMenu.toString();
// → "(//*[@data-test-automation-id='root']//*[@data-test-automation-id='header']//*[@data-test-automation-id='navigation']//*[@data-test-automation-id='userMenu'])[1]"

// Text search
root['button{Submit}'].toString();
// → "(//*[@data-test-automation-id='button' and contains(., \"Submit\")])[1]"

// Index access
root.listItem[2].toString();
// → "(//*[@data-test-automation-id='root']//*[@data-test-automation-id='listItem'])[3]"
```

## createElementPath()

Factory function that creates a Proxy-wrapped `ElementPath` root:

```typescript
function createElementPath(options?: {
  flows?: FlowsObject;     // custom flow functions keyed by element name
  strictMode?: boolean;     // if true, disables xpath() method
}): ElementPathProxy;
```

Returns an `ElementPathProxy` — a `Proxy` around `ElementPath` that intercepts property access to build child paths.

## ElementPathProxy Type

```typescript
type ElementPathProxy = ElementPath & {
  // Custom XPath
  xpath(id: string, xpath: string): ElementPathProxy;
  xpathByLocator(element: XpathLocatorProxified): ElementPathProxy;
  xpathByElement(element: XpathLocatorProxified): ElementPathProxy;

  // Internals
  __getInstance(): ElementPath;          // unwrap the raw ElementPath
  __getReversedChain: ElementPath['getReversedChain'];
  __findChildren(searchOptions: SearchObject, withoutParent?: boolean): ElementPathProxy;
  __getChildType: ElementPath['getElementType'];

  // Dynamic property access — any string/number key generates a child ElementPath
  [key: string]: ElementPathProxy;
  [key: number]: ElementPathProxy;
};
```

The Proxy is **immutable** — `set`, `delete`, and `setPrototypeOf` all throw `TypeError`.

## ElementPath Class

Core class that stores search options, parent chain, and generates XPath:

```typescript
class ElementPath {
  constructor(options?: {
    flows?: FlowsObject;
    searchMask?: SearchMaskPrimitive | null;
    searchOptions?: SearchObject;
    attributeName?: string;           // default: 'data-test-automation-id'
    parent?: ElementPath | null;
  })

  // XPath generation
  toString(allowMultipleNodesInResult?: boolean): string;
  getElementPathChain(): NodePath[];
  getReversedChain(withRoot?: boolean): string;

  // Child generation
  generateChildElementsPath(key: string | number): ElementPath;
  generateChildByXpath(element: { id: string; xpath: string }): ElementPath;
  generateChildElementPathByOptions(searchOptions: SearchObject, withoutParent?: boolean): ElementPath;

  // Query info
  getSearchOptions(): SearchObject;
  getElementType(): string | symbol;

  // Flows
  hasFlow(key: string | number): boolean;
  getFlow(key: string | number): FlowFn | undefined;
  getFlows(): FlowsFnObject;
}
```

### Default attribute

All selectors target `data-test-automation-id` by default. Override via the `attributeName` constructor option:

```typescript
const custom = new ElementPath({ attributeName: 'data-qa' });
// generates: //*[@data-qa='...']
```

## Search Query Syntax

When you access a property on an `ElementPathProxy`, the key string is parsed through `parseQueryKey()` using the regex `^(\*?[^{(=]*\*?)?(=?{([^}]*)})?(\(([^)]*)\))?$`.

### Mask patterns

| Pattern | Example | XPath condition |
|---------|---------|----------------|
| Exact | `root.button` | `@attr='button'` |
| Prefix | `root['btn*']` | `starts-with(@attr, 'btn')` |
| Suffix | `root['*button']` | `substring(@attr, ...) = 'button'` |
| Contains | `root['*menu*']` | `contains(@attr, 'menu')` |
| Wildcard | `root['*']` | `@attr` (attribute exists) |
| Parts | `root['user*panel']` | starts-with + ends-with + length check |

### Text matching

| Pattern | Example | XPath condition |
|---------|---------|----------------|
| Contains text | `root['button{Submit}']` | `contains(., "Submit")` |
| Exact text | `root['button={Login}']` | `. = "Login"` |
| Text only | `root['{Click here}']` | `contains(., "Click here")` with anyKey |

### Sub-queries

Parenthesized sub-queries add a `descendant::` condition:

```typescript
root['form(button{Submit})'].toString();
// → (//*[@attr='form' and descendant::*[@attr='button' and contains(., "Submit")]])[1]
```

### Index access

Numeric property access selects a specific match (0-based, rendered as 1-based XPath position):

```typescript
root.button[0].toString();  // → (//*[@attr='root']//*[@attr='button'])[1]
root.button[2].toString();  // → (//*[@attr='root']//*[@attr='button'][position() = 3])[1]
```

**Rules:**
- Index can only be applied once per element (double-indexing throws an error)
- Root element is not indexable

### Custom XPath

```typescript
root.xpath('my-id', '//div[@class="special"]').toString();
// → (//div[@class="special"])[1]
```

### Multiple results

By default, `toString()` wraps in `(xpath)[1]`. Pass `true` to get all matches:

```typescript
root.button.toString(true);
// → //*[@data-test-automation-id='root']//*[@data-test-automation-id='button']
```

## Proxy Internals

The `proxify()` function (`proxify.ts`) wraps an `ElementPath` in a `Proxy.revocable()` with these traps:

- **`get`** — For any string/number key not in `PROXY_PROPS`, calls `generateChildElementsPath(key)` and re-proxifies. Special keys:
  - `__getInstance` → returns unwrapped `ElementPath`
  - `__getReversedChain` → returns human-readable chain like `root.header.nav`
  - `xpath` / `xpathByLocator` / `xpathByElement` → custom XPath entry points
  - If the key matches a registered flow function, returns that function
- **`set` / `delete` / `setPrototypeOf`** — throw `TypeError` (immutable)
- **`has`** — returns `true` for any valid key type (enables `'button' in root`)
- **`ownKeys`** — returns `['__flows', '__path']` plus flow function keys

## Flows

Flows are named functions attached to specific element keys:

```typescript
const root = createElementPath({
  flows: {
    loginForm: {
      quickLogin: () => { /* ... */ },
      socialLogin: () => { /* ... */ },
    },
  },
});

// Check & call
root.loginForm.__getInstance().hasFlow('quickLogin'); // true
const fn = root.loginForm.__getInstance().getFlow('quickLogin');
fn?.();

// Or access directly (proxy intercepts the key)
root.loginForm.quickLogin; // returns the flow function (not a child ElementPath)
```

## Types

```typescript
type SearchMaskPrimitive = number | string;

type SearchObject = {
  anyKey?: boolean;
  prefix?: string;
  suffix?: string;
  exactKey?: string;
  containsKey?: string;
  parts?: string[];
  containsText?: string;
  equalsText?: string;
  subQuery?: SearchMaskObject & SearchTextObject;
  index?: number;
  xpath?: string;
  id?: string;
};

type NodePath = {
  query?: SearchObject;
  name?: string;
  xpath: string;
  isRoot: boolean;
};

type FlowFn = () => any;
type FlowsFnObject = { [method: string]: FlowFn };
type FlowsObject = { [key: string]: FlowsFnObject };
```

## Debugging

```typescript
const path = root.header.navigation.userMenu;

// Human-readable chain
path.__getReversedChain();          // "root.header.navigation.userMenu"
path.__getReversedChain(false);     // ".header.navigation.userMenu"

// Full path chain array
path.__getInstance().getElementPathChain();
// [{ isRoot: true, name: 'root', xpath: '...' }, { isRoot: false, query: {...}, xpath: '...' }, ...]

// Search options for the last segment
path.__getInstance().getSearchOptions();
// { exactKey: 'userMenu' }

// Element type
path.__getInstance().getElementType();
// 'userMenu'
```

## Dependencies

- `@testring/types` — TypeScript type definitions
- `@testring/utils` — Utility helpers (`hasOwn`, `isInteger`, `isGenKeyType`, `keysCount`)
