# Coverage Progress

> Phase 3-4 (coverage uplift)

## Packages Targets

- `packages/web-application/src/*` → target 40%+
- `packages/client-ws-transport/src/ws-transport.ts` → target 60%+

## Completed

### Phase 4 browser-proxy playwright implementation
- Added unit tests: `packages/browser-proxy/test/browser-proxy-playwright.spec.ts`
  - 4.1 init-on-demand via `url()` + `kill()` cleanup & idempotency
  - 4.2 basic request/response style delegation (`click()` → `page.locator().click()`)
  - 4.3 common errors: launch failure propagates; close errors ignored in `kill()`
- Coverage (unit, v8): `packages/browser-proxy/src` statements: **24.57%** → still below target 35% (needs more method coverage)


### 3.1 / 3.2 / 3.3 client-ws-transport ws-transport
- Added unit tests: `packages/client-ws-transport/test/ws-transport.spec.ts`
  - connect/disconnect re-entrancy + connection status
  - send queue + flush on OPEN ordering
  - message parse (JSON/non-JSON)
  - handshake resolve/reject based on payload.error
  - reconnect on error when `shouldReconnect=true`

### 3.4 web-application async-assert
- Added unit tests: `packages/web-application/test/async-assert.spec.ts`
  - hard assert success + onSuccess metadata
  - hard assert failure + onError rewrite
  - soft assert collects messages
  - unknown assertion method throws

### 3.5 web-application browser-scripts
- Added smoke/unit tests: `packages/web-application/test/browser-scripts.spec.ts`
  - exports exist
  - simulateJSFieldChangeScript error when element not found (minimal DOM stubs)

### 3.6 web-application controller transport/event dispatch
- Added unit tests: `packages/web-application/test/web-application-controller.unit.spec.ts`
  - init() registers execute handler
  - emits execute/response/afterResponse
  - send(source) vs broadcastLocal
  - error path
  - kill() prevents post-response side effects

## Notes / Issues
- No `rg` (ripgrep) installed in environment; used `grep` instead.
- Some existing plugin compatibility tests print "Failed" lines but overall suite passes.
