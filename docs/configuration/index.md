# Configuration

Testring provides a flexible configuration system with support for config files, environment configs, and CLI arguments. All three levels share the same set of options, with a clear priority order:

```
CLI arguments > environment config > config file > defaults
```

CLI arguments have the highest priority and override everything. The environment config extends and overrides the base config file. The config file has the lowest priority.

## Configuration Files

Testring supports the following config file formats:

| File | Format |
|------|--------|
| `.testringrc` | JSON (default) |
| `.testringrc.js` | ESM JavaScript |
| `.testringrc.cjs` | CommonJS JavaScript |
| `testring.config.js` | ESM JavaScript |
| `testring.config.cjs` | CommonJS JavaScript |

::: tip
Since testring packages use `"type": "module"`, any CommonJS config files must use the `.cjs` extension.
:::

### JSON Config

```json
{
  "tests": "./tests/**/*.spec.js",
  "workerLimit": 4,
  "bail": true,
  "logLevel": "info"
}
```

### JavaScript Config (ESM)

JavaScript config files can export a config object, a function returning a config object, or an async function returning a config object:

```js
// .testringrc.js or testring.config.js
export default {
  tests: './tests/**/*.spec.js',
  workerLimit: 4,
  bail: true,
  logLevel: 'info',
};
```

```js
// Async config (e.g., load secrets or dynamic values)
export default async function () {
  const secrets = await loadSecrets();
  return {
    tests: './tests/**/*.spec.js',
    envParameters: {
      apiKey: secrets.apiKey,
    },
  };
}
```

### CommonJS Config

```js
// .testringrc.cjs or testring.config.cjs
module.exports = {
  tests: './tests/**/*.spec.js',
  workerLimit: 4,
  bail: true,
  logLevel: 'info',
};
```

## Config Options

### `config`

**Default:** `.testringrc`

Path to the config file, relative to the project root. Works only as a CLI argument.

```bash
testring run --config ./my-custom-config.json
```

### `envConfig`

**Default:** `undefined`

Path to an environment config file, relative to the project root. Works only as a CLI argument. The environment config extends and overrides the base config — useful for decomposing configuration by environment (e.g., CI, staging, local).

```bash
testring run --config ./base.json --envConfig ./ci.json
```

### `tests`

**Default:** `"./tests/**/*.js"`

Glob pattern for test file discovery, relative to the project root. All matching files are added to the test run queue.

```bash
testring run --tests "./src/**/test/*.spec.js"
```

```json
{
  "tests": "./src/**/test/*.spec.js"
}
```

### `plugins`

**Default:** `[]`

Array of plugins to load. Plugins can be specified as a string (module name) or a tuple of `[moduleName, pluginConfig]`. See the [Plugin Development Guide](../guides/plugin-development.md) for details.

```bash
testring run --plugins my-plugin-1 --plugins my-plugin-2
```

```json
{
  "plugins": [
    "my-plugin-1",
    ["my-plugin-2", { "userConfig": true }]
  ]
}
```

### `workerLimit`

**Default:** `1`

Maximum number of tests to run in parallel. Increase carefully — too many workers may overwhelm the browser driver. Pass `"local"` to run tests in the same process as the runner (useful for debugging).

```bash
testring run --worker-limit 4
```

```json
{
  "workerLimit": 4
}
```

### `bail`

**Default:** `false`

Stop the test run on the first failure instead of continuing.

```bash
testring run --bail
```

```json
{
  "bail": true
}
```

### `retryCount`

**Default:** `3`

Number of times to retry a failed test before marking it as failed.

```bash
testring run --retry-count 5
```

```json
{
  "retryCount": 5
}
```

### `retryDelay`

**Default:** `2000`

Delay in milliseconds between test retries.

```bash
testring run --retry-delay 10000
```

```json
{
  "retryDelay": 10000
}
```

### `testTimeout`

**Default:** `900000`

Maximum time in milliseconds for a single test execution before it is terminated.

```bash
testring run --test-timeout 30000
```

```json
{
  "testTimeout": 30000
}
```

### `logLevel`

**Default:** `"info"`

Controls the verbosity of log output.

Available levels (from most to least verbose):
- `verbose`
- `debug`
- `info`
- `warning`
- `error`
- `silent`

```bash
testring run --log-level debug
```

```json
{
  "logLevel": "debug"
}
```

### `silent`

**Default:** `false`

Shorthand for `--logLevel silent`. Suppresses all log output.

```bash
testring run --silent
```

```json
{
  "silent": true
}
```

### `debug`

**Default:** `false`

Enable debug mode. Provides additional diagnostic output useful during test development.

```bash
testring run --debug
```

```json
{
  "debug": true
}
```

### `devtool`

**Default:** `false`

Enable the devtool interface for interactive debugging and inspection.

```bash
testring run --devtool
```

```json
{
  "devtool": true
}
```

### `headless`

**Default:** `false`

Run browsers in headless mode (no visible UI). Commonly used in CI environments.

```bash
testring run --headless
```

```json
{
  "headless": true
}
```

### `screenshots`

**Default:** `"disable"`

Controls when screenshots are captured during test execution.

Available values:
- `disable` — no screenshots
- `enable` — capture screenshots
- `afterError` — capture screenshots only after errors (on retry runs)

```bash
testring run --screenshots afterError
```

```json
{
  "screenshots": "afterError"
}
```

### `screenshotPath`

**Default:** `undefined`

Directory path where screenshots are saved.

```json
{
  "screenshotPath": "./test-screenshots"
}
```

### `maxWriteThreadCount`

**Default:** `undefined`

Maximum number of concurrent write threads for file operations (e.g., saving screenshots or artifacts).

```json
{
  "maxWriteThreadCount": 4
}
```

### `restartWorker`

**Default:** `"never"`

Controls whether worker processes are restarted after each test execution.

Available values:
- `always` — restart worker after every test
- `never` — keep workers alive

```bash
testring run --restartWorker always
```

```json
{
  "restartWorker": "always"
}
```

### `envParameters`

**Default:** `{}`

A custom object passed into every test. Retrieve it inside tests with `api.getEnvironment()`.

```json
{
  "envParameters": {
    "baseUrl": "https://example.com",
    "credentials": {
      "user": "test-user",
      "pass": "test-pass"
    }
  }
}
```

## Full Example

```json
{
  "tests": "./tests/**/*.spec.js",
  "plugins": [
    "@aspect/plugin-playwright-driver",
    ["@aspect/plugin-babel", { "presets": ["@babel/preset-env"] }]
  ],
  "workerLimit": 4,
  "bail": false,
  "retryCount": 2,
  "retryDelay": 1000,
  "testTimeout": 60000,
  "logLevel": "info",
  "screenshots": "afterError",
  "screenshotPath": "./screenshots",
  "headless": true,
  "restartWorker": "never",
  "envParameters": {
    "baseUrl": "https://staging.example.com"
  }
}
```
