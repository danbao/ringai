# @ringai/async-breakpoints

Asynchronous breakpoint system that provides pause-and-resume control over test execution flow. Built on top of Node.js `EventEmitter`, it allows one part of the framework to block execution until another part explicitly resolves the breakpoint.

## Installation

```bash
pnpm add @ringai/async-breakpoints
```

## Overview

This module provides an event-driven breakpoint mechanism used internally by the ringai framework to coordinate between the devtool debugger and test execution. It supports two breakpoint types — **before instruction** and **after instruction** — and exposes a shared singleton instance for framework-wide use.

Key capabilities:

- Set breakpoints that block execution as `Promise`s
- Resolve breakpoints from a different async context to resume execution
- Break (reject) all active breakpoints at once via `breakStack()`
- Check whether a breakpoint is currently active
- Subscribe to resolution and break events via `EventEmitter`

## API Reference

### `AsyncBreakpoints` class

The main breakpoint manager. Extends `EventEmitter` from Node.js.

```typescript
import { AsyncBreakpoints } from '@ringai/async-breakpoints';

const breakpoints = new AsyncBreakpoints();
```

Internally the class stores active breakpoints in a `Map<BreakpointsTypes, Promise<void>>`. Each breakpoint is a `Promise` that resolves when the corresponding resolver event fires, or rejects with a `BreakStackError` when `breakStack()` is called.

---

#### Before-instruction breakpoints

##### `breakpoints.addBeforeInstructionBreakpoint()`

Registers a `beforeInstruction` breakpoint. If one already exists for this type, the existing promise is returned (no duplicate is created).

##### `breakpoints.waitBeforeInstructionBreakpoint(callback?)`

Waits for the `beforeInstruction` breakpoint to resolve. If a breakpoint is active, `callback(true)` is called before waiting; if no breakpoint is set, `callback(false)` is called and the method resolves immediately.

| Parameter   | Type                                          | Default          | Description                                          |
| ----------- | --------------------------------------------- | ---------------- | ---------------------------------------------------- |
| `callback`  | `(state: boolean) => Promise<void> \| void`   | `() => undefined` | Called with `true` if a breakpoint exists, `false` otherwise |

Returns `Promise<void>` — resolves when the breakpoint is resolved or immediately if none is active.

##### `breakpoints.resolveBeforeInstructionBreakpoint()`

Resolves the active `beforeInstruction` breakpoint, allowing any `waitBeforeInstructionBreakpoint()` callers to proceed.

##### `breakpoints.isBeforeInstructionBreakpointActive()`

Returns `boolean` — `true` if a `beforeInstruction` breakpoint is currently set.

---

#### After-instruction breakpoints

##### `breakpoints.addAfterInstructionBreakpoint()`

Registers an `afterInstruction` breakpoint.

##### `breakpoints.waitAfterInstructionBreakpoint(callback?)`

Waits for the `afterInstruction` breakpoint. Signature and behavior are identical to `waitBeforeInstructionBreakpoint()`.

##### `breakpoints.resolveAfterInstructionBreakpoint()`

Resolves the active `afterInstruction` breakpoint.

##### `breakpoints.isAfterInstructionBreakpointActive()`

Returns `boolean` — `true` if an `afterInstruction` breakpoint is currently set.

---

#### `breakpoints.breakStack()`

Emits a `breakStack` event that causes **all** active breakpoints to reject with a `BreakStackError`. Use this to forcibly unblock any waiting code (e.g., on test cancellation or shutdown).

---

### `asyncBreakpoints` singleton

A pre-created `AsyncBreakpoints` instance exported for framework-wide use:

```typescript
import { asyncBreakpoints } from '@ringai/async-breakpoints';

asyncBreakpoints.addBeforeInstructionBreakpoint();
await asyncBreakpoints.waitBeforeInstructionBreakpoint();

// elsewhere:
asyncBreakpoints.resolveBeforeInstructionBreakpoint();
```

---

### `BreakStackError`

Custom error class thrown when `breakStack()` interrupts an active breakpoint. Extends `Error` with `Error.captureStackTrace` for cleaner stack traces.

```typescript
import { BreakStackError } from '@ringai/async-breakpoints';

try {
  await asyncBreakpoints.waitBeforeInstructionBreakpoint();
} catch (error) {
  if (error instanceof BreakStackError) {
    // Breakpoint was forcibly interrupted
  }
}
```

---

### `BreakpointsTypes` enum

```typescript
export enum BreakpointsTypes {
  beforeInstruction = 'beforeInstruction',
  afterInstruction = 'afterInstruction',
}
```

Used internally to key the breakpoint `Map`. The two values correspond to pausing **before** or **after** a test instruction is executed.

---

### `BreakpointEvents` enum

```typescript
export enum BreakpointEvents {
  resolverEvent = 'resolveEvent',
  breakStackEvent = 'breakStack',
}
```

These are the event names emitted on the `EventEmitter`. You can subscribe to them directly:

```typescript
import { asyncBreakpoints, BreakpointEvents } from '@ringai/async-breakpoints';

asyncBreakpoints.on(BreakpointEvents.resolverEvent, (type) => {
  console.log(`Breakpoint resolved: ${type}`);
});

asyncBreakpoints.on(BreakpointEvents.breakStackEvent, () => {
  console.log('All breakpoints broken');
});
```

## Usage Examples

### Basic flow control

```typescript
import { asyncBreakpoints } from '@ringai/async-breakpoints';

// Producer: set a breakpoint before executing an instruction
asyncBreakpoints.addBeforeInstructionBreakpoint();

// Consumer: wait until the breakpoint is resolved
async function executeInstruction() {
  await asyncBreakpoints.waitBeforeInstructionBreakpoint();
  // Execution continues after the breakpoint is resolved
  console.log('Instruction executing');
}

// Resolver: unblock the consumer from a different context
function onDebuggerContinue() {
  asyncBreakpoints.resolveBeforeInstructionBreakpoint();
}
```

### Using the callback to detect breakpoint state

```typescript
import { asyncBreakpoints } from '@ringai/async-breakpoints';

await asyncBreakpoints.waitBeforeInstructionBreakpoint(async (hasBreakpoint) => {
  if (hasBreakpoint) {
    console.log('Breakpoint is active — pausing execution');
  } else {
    console.log('No breakpoint — continuing immediately');
  }
});
```

### Forcibly breaking all breakpoints

```typescript
import { asyncBreakpoints, BreakStackError } from '@ringai/async-breakpoints';

asyncBreakpoints.addBeforeInstructionBreakpoint();
asyncBreakpoints.addAfterInstructionBreakpoint();

// In a shutdown handler:
asyncBreakpoints.breakStack();

// Both waitBeforeInstructionBreakpoint() and waitAfterInstructionBreakpoint()
// will reject with BreakStackError
```

## Source Files

| File                      | Description                                    |
| ------------------------- | ---------------------------------------------- |
| `src/async-breakpoints.ts`| `AsyncBreakpoints` class, enums                |
| `src/break-stack-error.ts`| `BreakStackError` class                        |
| `src/index.ts`            | Re-exports and singleton creation              |

## Related Modules

- `@ringai/api` — uses breakpoints for devtool-driven flow control
- `@ringai/test-worker` — uses breakpoints for process synchronization
