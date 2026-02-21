# Playwright Driver Plugin

A modern browser automation plugin for Testring that provides powerful Playwright-based testing capabilities with Selenium compatibility.

## Overview

The `@testring/plugin-playwright-driver` plugin offers:

- **Modern Browser Automation** - Built on Playwright's latest browser automation technology
- **Selenium Compatibility** - Supports Selenium Grid and Selenium-style configuration
- **Multi-Browser Support** - Chromium, Firefox, WebKit (Safari), Microsoft Edge
- **Advanced Features** - Video recording, trace recording, code coverage, debugging
- **CI/CD Ready** - Optimized for continuous integration environments

## Quick Start

### Installation

```bash
# Install with automatic browser download
pnpm add -D @testring/plugin-playwright-driver

# Skip browser installation (for CI/CD)
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 pnpm add -D @testring/plugin-playwright-driver
```

### Basic Configuration

```javascript
// testring.config.js
module.exports = {
    plugins: [
        ['@testring/plugin-playwright-driver', {
            browserName: 'chromium',
            launchOptions: {
                headless: true,
                args: ['--no-sandbox']
            },
            contextOptions: {
                viewport: { width: 1280, height: 720 }
            }
        }]
    ],
    tests: './**/*.spec.js'
};
```

## Documentation

### Setup and Configuration
- [Installation Guide](installation.md) - Browser installation and setup
- [Configuration Guide](configuration.md) - Complete configuration options
- [Selenium Grid Integration](selenium-grid-guide.md) - Using with Selenium Grid

### Migration and Compatibility
- [Compatibility Guide](compatibility.md) - Selenium compatibility and migration

### Development and Debugging
- [Advanced Features](advanced-features.md) - Video, trace, coverage, debugging, and more

## Key Features

### Browser Support
- **Chromium** - Chrome, Edge, and Chromium-based browsers
- **Firefox** - Mozilla Firefox
- **WebKit** - Safari and WebKit-based browsers  
- **Microsoft Edge** - Native Edge support

### Advanced Capabilities
- **Network Interception** - Request/response modification
- **Video Recording** - Test execution videos
- **Trace Recording** - Detailed execution traces
- **Code Coverage** - JavaScript code coverage
- **Screenshot Capture** - Automatic and manual screenshots
- **PDF Generation** - Page to PDF conversion

### Selenium Compatibility
- **Selenium Grid Support** - Distributed testing
- **Selenium-style Config** - Familiar configuration options
- **WebDriver Protocol** - WebDriver compatibility layer
- **Capabilities Mapping** - Automatic Selenium to Playwright mapping

## Configuration Examples

### Basic Setup
```javascript
['@testring/plugin-playwright-driver', {
    browserName: 'chromium',
    launchOptions: {
        headless: true
    }
}]
```

### Selenium Grid
```javascript
['@testring/plugin-playwright-driver', {
    browserName: 'chromium',
    seleniumGrid: {
        gridUrl: 'http://selenium-hub:4444',
        gridCapabilities: {
            browserName: 'chrome',
            platformName: 'linux'
        }
    }
}]
```

### Advanced Features
```javascript
['@testring/plugin-playwright-driver', {
    browserName: 'chromium',
    coverage: true,
    video: true,
    trace: true,
    contextOptions: {
        viewport: { width: 1920, height: 1080 },
        locale: 'en-US'
    }
}]
```

## Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `PLAYWRIGHT_DEBUG` | Enable debug mode | `false` |
| `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` | Skip browser installation | `false` |
| `PLAYWRIGHT_BROWSERS` | Specify browsers to install | `chromium,firefox,webkit,msedge` |

## Quick Links

- [Package Documentation](../packages/plugin-playwright-driver.md)
- [Configuration Reference](../configuration/)
- [Plugin Development Guide](../guides/plugin-development.md)
- [GitHub Repository](https://github.com/ringcentral/testring)
