# Installation Guide

This guide will help you install and set up ringai for your project.

## Prerequisites

Before installing ringai, ensure you have:

- **Node.js** 22.0 or higher
- **pnpm** 9.0 or higher
- A supported operating system (Windows, macOS, Linux)

## Installation

Install the ringai framework as a dev dependency:

```bash
pnpm add -D ringai
```

## Browser Driver Setup

### Playwright Driver (Recommended)

ringai uses Playwright for browser automation. Install the Playwright driver plugin and browser binaries:

```bash
pnpm add -D @ringai/plugin-playwright-driver
npx playwright install
```

See the [Playwright Driver Guide](../playwright-driver/installation.md) for detailed setup and configuration options.

## Optional Plugins

Install additional plugins based on your needs:

```bash
# Babel transpilation for tests
pnpm add -D @ringai/plugin-babel

# Filesystem storage for screenshots and artifacts
pnpm add -D @ringai/plugin-fs-store
```

## Verification

Verify your installation by running:

```bash
npx ringai run --help
```

You should see the ringai CLI help output with available options.

## Next Steps

1. [Quick Start Guide](./quick-start.md) — Create and run your first test
2. [Configuration](../configuration/index.md) — Configure ringai for your project
3. [API Reference](../core-modules/api.md) — Learn the ringai API

## Troubleshooting

### Common Issues

**Node.js version issues:**
```bash
node --version  # Should be 22.0+
pnpm --version  # Should be 9.0+
```

**Playwright browser installation issues:**
```bash
# Reinstall Playwright browsers
npx playwright install
```

For more help, see the [Troubleshooting Guide](../guides/troubleshooting.md).
