# @testring/timeout-config

Centralized timeout configuration for the testring framework. Provides pre-calculated timeout constants organized by operation speed category, with automatic environment-based multipliers for local, CI, and debug modes.

## Installation

```bash
pnpm add @testring/timeout-config
```

## Quick Start

```typescript
import TIMEOUTS from '@testring/timeout-config';

// Use pre-calculated timeout constants
await page.waitForSelector('#element', { timeout: TIMEOUTS.WAIT_FOR_ELEMENT });

// Calculate a custom timeout with environment multipliers
const myTimeout = TIMEOUTS.custom('slow', 'pageLoad');

// Check the current environment
if (TIMEOUTS.isCI) {
  console.log('Running in CI environment');
}
```

## Exports

```typescript
import TIMEOUTS, {
  calculateTimeout,
  isLocal,
  isCI,
  isDebug,
} from '@testring/timeout-config';
```

## Environment Detection

The module detects three environment flags at import time:

| Flag | Condition | Purpose |
|------|-----------|---------|
| `isLocal` | `NODE_ENV === 'development'` or `LOCAL === 'true'` | Local development mode |
| `isCI` | `CI === 'true'` | Continuous integration mode |
| `isDebug` | `DEBUG === 'true'` or `PLAYWRIGHT_DEBUG === '1'` | Debug mode (3× multiplier for most categories) |

In debug mode, timeout values are multiplied: **3×** for fast/medium/slow categories, **2×** for verySlow and cleanup categories. Local and CI modes currently use a 1× multiplier (no change), but the infrastructure supports custom multipliers.

## TIMEOUTS Object

The `TIMEOUTS` object contains pre-calculated timeout constants (in milliseconds) for every operation type:

### Fast Operations (30 000 ms base)

| Constant | Description |
|----------|-------------|
| `TIMEOUTS.CLICK` | Click action timeout |
| `TIMEOUTS.HOVER` | Hover action timeout |
| `TIMEOUTS.FILL` | Input fill timeout |
| `TIMEOUTS.KEY` | Keyboard input timeout |

### Medium Operations (30 000 ms base)

| Constant | Description |
|----------|-------------|
| `TIMEOUTS.WAIT_FOR_ELEMENT` | Wait for element to exist in DOM |
| `TIMEOUTS.WAIT_FOR_VISIBLE` | Wait for element to become visible |
| `TIMEOUTS.WAIT_FOR_CLICKABLE` | Wait for element to become clickable |
| `TIMEOUTS.WAIT_FOR_ENABLED` | Wait for element to become enabled |
| `TIMEOUTS.WAIT_FOR_STABLE` | Wait for element to stabilize |
| `TIMEOUTS.CONDITION` | General condition wait timeout |

### Slow Operations (30 000 ms base)

| Constant | Description |
|----------|-------------|
| `TIMEOUTS.PAGE_LOAD` | Page load timeout |
| `TIMEOUTS.NAVIGATION` | Navigation timeout |
| `TIMEOUTS.NETWORK_REQUEST` | Network request timeout |
| `TIMEOUTS.WAIT_FOR_VALUE` | Wait for an input value |
| `TIMEOUTS.WAIT_FOR_SELECTED` | Wait for element to be selected |

### Very Slow Operations

| Constant | Base (ms) | Description |
|----------|-----------|-------------|
| `TIMEOUTS.TEST_EXECUTION` | 30 000 | Single test execution timeout |
| `TIMEOUTS.CLIENT_SESSION` | 900 000 | Client session lifetime (15 min) |
| `TIMEOUTS.PAGE_LOAD_MAX` | 30 000 | Maximum page load timeout |
| `TIMEOUTS.GLOBAL_TEST` | 900 000 | Global test suite timeout (15 min) |

### Cleanup Operations (5 000 ms base)

| Constant | Description |
|----------|-------------|
| `TIMEOUTS.TRACE_STOP` | Stop trace collection |
| `TIMEOUTS.COVERAGE_STOP` | Stop coverage collection |
| `TIMEOUTS.CONTEXT_CLOSE` | Close browser context |
| `TIMEOUTS.SESSION_CLOSE` | Close session |
| `TIMEOUTS.BROWSER_CLOSE` | Close browser |

### Aliases and Utilities

| Property | Value / Description |
|----------|---------------------|
| `TIMEOUTS.WAIT_TIMEOUT` | Alias for `WAIT_FOR_ELEMENT` |
| `TIMEOUTS.TICK_TIMEOUT` | `100` ms — polling tick interval |
| `TIMEOUTS.custom` | Reference to `calculateTimeout()` function |
| `TIMEOUTS.isLocal` | `boolean` — local environment flag |
| `TIMEOUTS.isCI` | `boolean` — CI environment flag |
| `TIMEOUTS.isDebug` | `boolean` — debug environment flag |

## calculateTimeout()

Computes a timeout value with environment-based multipliers applied:

```typescript
function calculateTimeout(
  category: 'fast' | 'medium' | 'slow' | 'verySlow' | 'cleanup',
  operation: string,
  baseValue?: number | null,
): number;
```

**Parameters:**

- `category` — the speed category (`'fast'`, `'medium'`, `'slow'`, `'verySlow'`, `'cleanup'`)
- `operation` — the operation name within the category (e.g. `'click'`, `'pageLoad'`, `'traceStop'`)
- `baseValue` — optional override for the base millisecond value; if omitted, uses the built-in default

**Returns:** the final timeout in milliseconds (rounded).

**Throws** if `category.operation` is not found and no `baseValue` is provided.

```typescript
import { calculateTimeout } from '@testring/timeout-config';

// Use the built-in base value
const clickTimeout = calculateTimeout('fast', 'click');

// Override with a custom base value
const customTimeout = calculateTimeout('slow', 'navigation', 60000);
```

## Framework Usage

The timeout-config package is consumed by key framework packages to ensure consistent timeout behavior:

### plugin-playwright-driver

```typescript
import TIMEOUTS from '@testring/timeout-config';

const DEFAULT_CONFIG = {
  clientTimeout: TIMEOUTS.CLIENT_SESSION,  // 15 min session lifetime
  // ...
};

// Cleanup with bounded timeouts
await Promise.race([
  Promise.all(cleanupPromises),
  new Promise(resolve => setTimeout(resolve, TIMEOUTS.PAGE_LOAD)),
]);

// Trace and coverage stop timeouts
await Promise.race([
  tracing.stop(),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Trace stop timeout')), TIMEOUTS.TRACE_STOP),
  ),
]);
```

### web-application

```typescript
import TIMEOUTS from '@testring/timeout-config';

class WebApplication {
  protected WAIT_PAGE_LOAD_TIMEOUT = TIMEOUTS.PAGE_LOAD_MAX;
  protected WAIT_TIMEOUT = TIMEOUTS.WAIT_TIMEOUT;
  protected TICK_TIMEOUT = TIMEOUTS.TICK_TIMEOUT;
}
```

## Base Timeout Categories

Under the hood, timeouts are organized into five speed categories. Each operation within a category has a base value (in milliseconds) that is multiplied by environment-specific factors:

| Category | Operations | Base (ms) |
|----------|-----------|-----------|
| `fast` | click, hover, fill, key | 30 000 |
| `medium` | waitForElement, waitForVisible, waitForClickable, waitForEnabled, waitForStable, condition | 30 000 |
| `slow` | pageLoad, navigation, networkRequest, waitForValue, waitForSelected | 30 000 |
| `verySlow` | testExecution (30 000), clientSession (900 000), pageLoadMax (30 000), globalTest (900 000) | varies |
| `cleanup` | traceStop, coverageStop, contextClose, sessionClose, browserClose | 5 000 |

## Dependencies

None — this is a plain JavaScript package with no runtime dependencies.

## Related Modules

- **`@testring/plugin-playwright-driver`** — Playwright browser driver using these timeouts
- **`@testring/web-application`** — Web application base class using these timeouts
