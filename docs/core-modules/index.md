# Core Modules

The `core/` directory contains the 18 foundational modules that make up the ringai framework. These modules follow a strict 10-layer dependency architecture — each layer may only depend on modules in the same or lower layers.

## Architecture Overview

```
Layer 9 ─ ringai              (entry point)
Layer 8 ─ cli                   (command line interface)
Layer 7 ─ test-worker           (test execution)
Layer 6 ─ sandbox, test-run-controller, reporter
Layer 5 ─ api, plugin-api
Layer 4 ─ cli-config, fs-store
Layer 3 ─ logger, fs-reader
Layer 2 ─ child-process, transport
Layer 1 ─ utils, pluggable-module
Layer 0 ─ types, async-breakpoints   (base)
```

## Module Reference

### Layer 0 — Base
- [types](./types.md) — TypeScript type definitions and interfaces shared across all modules
- [async-breakpoints](./async-breakpoints.md) — Debugging breakpoints for async test execution

### Layer 1 — Utilities
- [utils](./utils.md) — Common utility functions used throughout the framework
- [pluggable-module](./pluggable-module.md) — Base class for plugin-enabled modules

### Layer 2 — Infrastructure
- [child-process](./child-process.md) — Child process spawning and management
- [transport](./transport.md) — Inter-process communication (IPC) layer

### Layer 3 — Services
- [logger](./logger.md) — Distributed logging system with configurable log levels
- [fs-reader](./fs-reader.md) — Test file discovery and reading via glob patterns

### Layer 4 — Config & Storage
- [cli-config](./cli-config.md) — CLI argument parsing and config file resolution
- [fs-store](./fs-store.md) — File system storage for test artifacts and caching

### Layer 5 — APIs
- [api](./api.md) — Core test execution API and control interfaces
- [plugin-api](./plugin-api.md) — Plugin registration and lifecycle API

### Layer 6 — Advanced
- [sandbox](./sandbox.md) — Isolated test sandboxing environment
- [test-run-controller](./test-run-controller.md) — Orchestrates test execution, retries, and parallelism
- [reporter](./reporter.md) — Test result reporting and output formatting

### Layer 7 — Execution
- [test-worker](./test-worker.md) — Worker processes that execute individual tests

### Layer 8 — Interface
- [cli](./cli.md) — Command line interface built with citty (`ringai run`, `ringai init`, `ringai plugin`)

### Layer 9 — Entry
- [ringai](./ringai.md) — Main entry point that wires all modules together

## Quick Links

- [Getting Started](../getting-started/)
- [Configuration](../configuration/)
- [Extension Packages](../packages/)
- [Guides](../guides/)
