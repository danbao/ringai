# Configuration Guide

Complete configuration options for the `@testring/plugin-playwright-driver` plugin.

## Basic Configuration

### Minimal Setup

```javascript
module.exports = {
    plugins: [
        ['@testring/plugin-playwright-driver', {
            browserName: 'chromium'
        }]
    ],
    tests: './**/*.spec.js'
};
```

### Standard Configuration

```javascript
module.exports = {
    plugins: [
        ['@testring/plugin-playwright-driver', {
            browserName: 'chromium',
            launchOptions: {
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            },
            contextOptions: {
                viewport: { width: 1280, height: 720 }
            }
        }]
    ],
    tests: './**/*.spec.js'
};
```

## Browser Configuration

### Supported Browsers

| Browser | `browserName` | Description |
|---------|---------------|-------------|
| Chromium | `'chromium'` | Chrome, Edge, and Chromium-based browsers |
| Firefox | `'firefox'` | Mozilla Firefox |
| WebKit | `'webkit'` | Safari and WebKit-based browsers |
| Microsoft Edge | `'msedge'` | Native Microsoft Edge |

### Browser Selection

```javascript
// Chromium (default)
browserName: 'chromium'

// Firefox
browserName: 'firefox'

// WebKit (Safari)
browserName: 'webkit'

// Microsoft Edge
browserName: 'msedge'
```

## Launch Options

### Basic Launch Configuration

```javascript
launchOptions: {
    headless: true,                    // Run in headless mode
    slowMo: 0,                        // Slow down operations (ms)
    devtools: false,                   // Open DevTools
    args: ['--no-sandbox'],           // Browser arguments
    executablePath: '/path/to/browser' // Custom browser path
}
```

### Debug Mode

```bash
# Enable debug mode with environment variable
PLAYWRIGHT_DEBUG=1 pnpm test
```

When `PLAYWRIGHT_DEBUG=1` is set:
- `headless` is automatically set to `false`
- `slowMo` is set to `500ms`
- DevTools are opened automatically

### Advanced Launch Options

```javascript
launchOptions: {
    headless: true,
    slowMo: 100,
    devtools: true,
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
    ],
    ignoreDefaultArgs: ['--disable-extensions'],
    timeout: 30000,
    protocolTimeout: 30000,
    handleSIGINT: true,
    handleSIGTERM: true,
    handleSIGHUP: true
}
```

## Context Options

### Viewport and Screen

```javascript
contextOptions: {
    viewport: { width: 1920, height: 1080 },
    screen: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false
}
```

### Locale and Timezone

```javascript
contextOptions: {
    locale: 'en-US',
    timezoneId: 'America/New_York',
    geolocation: { longitude: 10.0, latitude: 10.0 },
    permissions: ['geolocation']
}
```

### User Agent and Extra Headers

```javascript
contextOptions: {
    userAgent: 'Custom User Agent String',
    extraHTTPHeaders: {
        'X-Custom-Header': 'custom-value'
    }
}
```

## Selenium Grid Configuration

### Basic Selenium Grid

```javascript
seleniumGrid: {
    gridUrl: 'http://selenium-hub:4444',
    gridCapabilities: {
        browserName: 'chrome',
        browserVersion: 'latest',
        platformName: 'linux'
    }
}
```

### Advanced Selenium Grid

```javascript
seleniumGrid: {
    gridUrl: 'https://your-selenium-grid.com:4444',
    gridCapabilities: {
        browserName: 'chrome',
        browserVersion: '120.0',
        platformName: 'linux',
        'se:options': {
            args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
        },
        'custom:testName': 'My Test Suite',
        'custom:buildNumber': process.env.BUILD_NUMBER || 'local'
    },
    gridHeaders: {
        'Authorization': 'Bearer your-auth-token',
        'X-Custom-Header': 'custom-value'
    }
}
```

### Environment Variables for Selenium Grid

```bash
# Set Selenium Grid URL
export SELENIUM_REMOTE_URL=http://selenium-hub:4444

# Set capabilities as JSON
export SELENIUM_REMOTE_CAPABILITIES='{"browserName":"chrome","browserVersion":"latest","platformName":"linux"}'

# Set custom headers
export SELENIUM_REMOTE_HEADERS='{"Authorization":"Bearer token","X-Test-Type":"e2e"}'
```

## Advanced Features

### Video Recording

```javascript
{
    video: true,
    videoDir: './test-results/videos',
    videoSize: { width: 1280, height: 720 }
}
```

### Trace Recording

```javascript
{
    trace: true,
    traceDir: './test-results/traces',
    traceMode: 'retain-on-failure' // 'off', 'on', 'retain-on-failure'
}
```

### Code Coverage

```javascript
{
    coverage: true,
    coverageDir: './test-results/coverage'
}
```

### Screenshots

```javascript
{
    screenshot: 'only-on-failure', // 'off', 'on', 'only-on-failure'
    screenshotDir: './test-results/screenshots'
}
```

## Timeout Configuration

### Client Timeouts

```javascript
{
    clientTimeout: 15 * 60 * 1000,        // 15 minutes
    clientCheckInterval: 5 * 1000,         // 5 seconds
    disableClientPing: false,
    delayAfterSessionClose: 1000
}
```

### Browser Timeouts

```javascript
launchOptions: {
    timeout: 30000,                        // Launch timeout
    protocolTimeout: 30000                 // Protocol timeout
}
```

## Complete Configuration Examples

### Development Configuration

```javascript
module.exports = {
    plugins: [
        ['@testring/plugin-playwright-driver', {
            browserName: 'chromium',
            launchOptions: {
                headless: false,  // Visible browser for debugging
                slowMo: 100,      // Slow down for visibility
                devtools: true    // Open DevTools
            },
            contextOptions: {
                viewport: { width: 1280, height: 720 },
                locale: 'en-US'
            }
        }]
    ],
    tests: './**/*.spec.js'
};
```

### CI/CD Configuration

```javascript
module.exports = {
    plugins: [
        ['@testring/plugin-playwright-driver', {
            browserName: 'chromium',
            launchOptions: {
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            },
            contextOptions: {
                viewport: { width: 1920, height: 1080 }
            },
            video: true,
            trace: 'retain-on-failure',
            screenshot: 'only-on-failure'
        }]
    ],
    tests: './**/*.spec.js',
    workerLimit: 4,
    retryCount: 2
};
```

### Selenium Grid Configuration

```javascript
module.exports = {
    plugins: [
        ['@testring/plugin-playwright-driver', {
            browserName: 'chromium',
            seleniumGrid: {
                gridUrl: 'http://selenium-hub:4444',
                gridCapabilities: {
                    browserName: 'chrome',
                    browserVersion: 'latest',
                    platformName: 'linux'
                }
            },
            contextOptions: {
                viewport: { width: 1920, height: 1080 }
            },
            video: true,
            trace: true
        }]
    ],
    tests: './**/*.spec.js',
    workerLimit: 4
};
```

## Configuration Validation

The plugin validates your configuration and will show warnings for:

- Deprecated Selenium-style parameters
- Invalid browser names
- Missing required parameters
- Conflicting options

### Common Warnings

```javascript
// These will show warnings but still work:
{
    host: 'localhost',           // ⚠️ Use seleniumGrid.gridUrl
    port: 4444,                 // ⚠️ Include in seleniumGrid.gridUrl
    cdpCoverage: true,          // ⚠️ Use coverage instead
    capabilities: { ... }       // ⚠️ Use browserName and launchOptions
}
```

## Environment Variables Reference

| Variable | Purpose | Default | Example |
|----------|---------|---------|---------|
| `PLAYWRIGHT_DEBUG` | Enable debug mode | `false` | `PLAYWRIGHT_DEBUG=1` |
| `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` | Skip browser installation | `false` | `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` |
| `PLAYWRIGHT_BROWSERS` | Specify browsers to install | `chromium,firefox,webkit,msedge` | `PLAYWRIGHT_BROWSERS=chromium,firefox` |
| `SELENIUM_REMOTE_URL` | Selenium Grid URL | - | `SELENIUM_REMOTE_URL=http://selenium-hub:4444` |
| `SELENIUM_REMOTE_CAPABILITIES` | Grid capabilities (JSON) | - | `SELENIUM_REMOTE_CAPABILITIES='{"browserName":"chrome"}'` |
| `SELENIUM_REMOTE_HEADERS` | Grid headers (JSON) | - | `SELENIUM_REMOTE_HEADERS='{"Authorization":"Bearer token"}'` | 