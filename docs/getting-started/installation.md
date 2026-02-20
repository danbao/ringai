# Installation Guide

This guide will help you install and set up testring for your project.

## Prerequisites

Before installing testring, ensure you have:

- **Node.js** 22.0 or higher
- **pnpm** 9.0 or higher
- A supported operating system (Windows, macOS, Linux)

## Installation

Install the testring framework as a dev dependency:

```bash
pnpm add -D testring
```

## Browser Driver Setup

### Playwright Driver (Recommended)

testring uses Playwright for browser automation. Install the Playwright driver plugin and browser binaries:

```bash
pnpm add -D @testring/plugin-playwright-driver
npx playwright install
```

See the [Playwright Driver Guide](../playwright-driver/installation.md) for detailed setup and configuration options.

## Optional Plugins

Install additional plugins based on your needs:

```bash
# Babel transpilation for tests
pnpm add -D @testring/plugin-babel

# Filesystem storage for screenshots and artifacts
pnpm add -D @testring/plugin-fs-store
```

## Verification

Verify your installation by running:

```bash
npx testring run --help
```

You should see the testring CLI help output with available options.

## Next Steps

1. [Quick Start Guide](./quick-start.md) — Create and run your first test
2. [Configuration](../configuration/index.md) — Configure testring for your project
3. [API Reference](../api/index.md) — Learn the testring API

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
