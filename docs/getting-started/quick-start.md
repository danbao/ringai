# Quick Start Guide

Get up and running with ringai in just a few minutes.

## Prerequisites

Make sure you have [installed ringai](./installation.md) before proceeding.

## Step 1: Initialize Your Project

Create a new directory and initialize it:

```bash
mkdir my-ringai-tests
cd my-ringai-tests
pnpm init
```

Install ringai and the Playwright driver:

```bash
pnpm add -D ringai @ringai/plugin-playwright-driver
npx playwright install
```

## Step 2: Create Your First Test

Create a test file `test/example.spec.js`:

```javascript
import { run } from 'ringai';

run(async (api) => {
    await api.application.url('https://example.com');
    const title = await api.application.getTitle();
});
```

ringai uses its own `run()` API where each test file calls `run()` with an async callback that receives the test API context.

## Step 3: Create Configuration

Create a ringai configuration file `.ringairc` in your project root:

```json
{
    "tests": "./test/**/*.spec.js",
    "plugins": [
        ["@ringai/plugin-playwright-driver", { "headless": true }],
        "@ringai/plugin-babel"
    ],
    "workerLimit": 2
}
```

## Step 4: Run Your Tests

Execute your tests:

```bash
npx ringai run
```

## Step 5: Add More Features

### Add Babel Support

For transpilation support with modern JavaScript features:

```bash
pnpm add -D @ringai/plugin-babel @babel/preset-env
```

Create a `.babelrc` file:

```json
{
    "presets": ["@babel/preset-env"]
}
```

Make sure `@ringai/plugin-babel` is listed in the `plugins` array of your `.ringairc` (as shown in Step 3).

### Add File Storage

For screenshots and test artifacts:

```bash
pnpm add -D @ringai/plugin-fs-store
```

Update `.ringairc` to include the plugin:

```json
{
    "tests": "./test/**/*.spec.js",
    "plugins": [
        "@ringai/plugin-babel",
        "@ringai/plugin-fs-store",
        ["@ringai/plugin-playwright-driver", { "headless": true }]
    ],
    "workerLimit": 2,
    "screenshots": "afterError",
    "screenshotPath": "./_tmp/"
}
```

## Next Steps

- [Configuration Guide](../configuration/index.md) — Learn about all configuration options
- [API Reference](../core-modules/api.md) — Explore the full ringai API
- [Plugin Development](../guides/plugin-development.md) — Create custom plugins
- [Best Practices](../guides/testing-best-practices.md) — Learn testing best practices

## Need Help?

- [Troubleshooting Guide](../guides/troubleshooting.md)
- [GitHub Issues](https://github.com/danbao/ringai/issues)
- [Documentation Index](../README.md)
