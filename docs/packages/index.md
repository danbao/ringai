# Packages

This directory contains documentation for all ringai extension packages.

## Package Categories

### Browser Automation
- [plugin-playwright-driver.md](plugin-playwright-driver.md) - Playwright browser driver
- [browser-proxy.md](browser-proxy.md) - Browser proxy functionality (direct Playwright + legacy controller)

### Web Application Support
- [web-application.md](web-application.md) - Web application testing API (WebApplication + WebApplicationSimplified)
- [element-path.md](element-path.md) - DOM element path utilities

### Build and Transform
- [plugin-compiler.md](plugin-compiler.md) - esbuild-based compiler plugin
- [plugin-fs-store.md](plugin-fs-store.md) - File system storage plugin

### Configuration and Utilities
- [timeout-config.md](timeout-config.md) - Centralized timeout constants

### Testing Utilities
- [test-utils.md](test-utils.md) - Testing utility mocks and helpers
- [e2e-test-app.md](e2e-test-app.md) - End-to-end test application (37 Playwright specs)

## Installation

Most packages can be installed individually:

```bash
pnpm add --save-dev @ringai/package-name
```

Or install the complete framework:

```bash
pnpm add --save-dev ringai
```

## Quick Links

- [Main Documentation](../README.md)
- [Core Modules](../core-modules/index.md)
- [Playwright Driver Details](../playwright-driver/index.md)
