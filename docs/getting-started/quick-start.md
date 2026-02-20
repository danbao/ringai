# Quick Start Guide

Get up and running with testring in just a few minutes.

## Prerequisites

Make sure you have [installed testring](./installation.md) before proceeding.

## Step 1: Initialize Your Project

Create a new directory and initialize it:

```bash
mkdir my-testring-tests
cd my-testring-tests
pnpm init
```

Install testring and the Playwright driver:

```bash
pnpm add -D testring @testring/plugin-playwright-driver
npx playwright install
```

## Step 2: Create Your First Test

Create a test file `test/example.spec.js`:

```javascript
import { run } from 'testring';

run(async (api) => {
    await api.application.url('https://example.com');
    const title = await api.application.getTitle();
});
```

testring uses its own `run()` API where each test file calls `run()` with an async callback that receives the test API context.

## Step 3: Create Configuration

Create a testring configuration file `.testringrc` in your project root:

```json
{
    "tests": "./test/**/*.spec.js",
    "plugins": [
        ["@testring/plugin-playwright-driver", { "headless": true }],
        "@testring/plugin-babel"
    ],
    "workerLimit": 2
}
```

## Step 4: Run Your Tests

Execute your tests:

```bash
npx testring run
```

## Step 5: Add More Features

### Add Babel Support

For transpilation support with modern JavaScript features:

```bash
pnpm add -D @testring/plugin-babel @babel/preset-env
```

Create a `.babelrc` file:

```json
{
    "presets": ["@babel/preset-env"]
}
```

Make sure `@testring/plugin-babel` is listed in the `plugins` array of your `.testringrc` (as shown in Step 3).

### Add File Storage

For screenshots and test artifacts:

```bash
pnpm add -D @testring/plugin-fs-store
```

Update `.testringrc` to include the plugin:

```json
{
    "tests": "./test/**/*.spec.js",
    "plugins": [
        "@testring/plugin-babel",
        "@testring/plugin-fs-store",
        ["@testring/plugin-playwright-driver", { "headless": true }]
    ],
    "workerLimit": 2,
    "screenshots": "afterError",
    "screenshotPath": "./_tmp/"
}
```

## Next Steps

- [Configuration Guide](../configuration/index.md) — Learn about all configuration options
- [API Reference](../api/index.md) — Explore the full testring API
- [Plugin Development](../guides/plugin-development.md) — Create custom plugins
- [Best Practices](../guides/testing-best-practices.md) — Learn testing best practices

## Need Help?

- [Troubleshooting Guide](../guides/troubleshooting.md)
- [GitHub Issues](https://github.com/danbao/testring/issues)
- [Documentation Index](../README.md)
