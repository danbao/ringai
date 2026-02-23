# Extension Packages

The `packages/` directory contains extension packages and plugins for the ringai testing framework, providing additional functionality and integration capabilities. These packages are primarily used for browser drivers, web application testing, development tools, and other feature extensions.

[![npm](https://img.shields.io/npm/v/@ringai/plugin-playwright-driver.svg)](https://www.npmjs.com/package/@ringai/plugin-playwright-driver)
[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)

## Overview

The extension packages provide specialized functionality that extends the core ringai framework capabilities:

- **🌐 Browser Automation** — Playwright-based multi-browser support (Chromium, Firefox, WebKit)
- **🔧 Development Tools** — Comprehensive debugging and monitoring tools
- **📡 Network Communication** — WebSocket communication support
- **📁 File Management** — File upload, download, and storage capabilities
- **⚡ Modern Build Support** — ES6+ syntax transformation and modern tooling
- **🧪 Testing Utilities** — Specialized testing tools and helpers
- **⏱️ Timeout Configuration** — Flexible timeout management for test operations

## Directory Structure

### Browser Driver Packages
- **`plugin-playwright-driver/`** — Playwright driver plugin for modern browser automation (Chromium, Firefox, WebKit)
- **`browser-proxy/`** — Browser proxy service providing communication bridge between browsers and test framework

### Web Application Testing Packages
- **`web-application/`** — Web application testing package providing specialized web testing functionality
- **`element-path/`** — Element path locator providing precise DOM element location capabilities
- **`e2e-test-app/`** — End-to-end test application containing complete test cases and examples

### Development Tool Packages
- **`devtool-frontend/`** — Development tool frontend providing test debugging and monitoring interface
- **`devtool-backend/`** — Development tool backend providing backend services for development tools
- **`devtool-extension/`** — Development tool extension in browser extension format

### Network and Communication Packages
- **`client-ws-transport/`** — WebSocket transport client supporting WebSocket communication

### File and Storage Packages
- **`plugin-fs-store/`** — File system storage plugin providing file storage functionality
- **`download-collector-crx/`** — Download collector Chrome extension for collecting browser download files

### Build and Utility Packages
- **`plugin-babel/`** — Babel plugin supporting ES6+ syntax transformation
- **`test-utils/`** — Test utilities package providing testing-related utility functions

### Configuration Packages
- **`timeout-config/`** — Timeout configuration package providing configurable timeout settings for test operations

## Key Features

### 🌐 Multi-Browser Support
Support for modern browser automation through Playwright, covering Chromium, Firefox, and WebKit browsers.

### 🔧 Comprehensive Development Tools
Complete development and debugging toolchain with frontend interface, backend services, and browser extensions.

### 📡 WebSocket Communication
WebSocket-based transport for real-time communication between test components.

### 📁 Advanced File Handling
File upload, download, and storage functionality with Chrome extension integration.

### ⚡ Modern JavaScript Support
Support for modern JavaScript syntax and build tools through Babel integration.

### 🧪 Rich Testing Utilities
Comprehensive testing utilities and helper functions for enhanced test development.

### ⏱️ Configurable Timeouts
Flexible timeout configuration for managing test execution timing and retries.

## Package Categories

### 🚗 Driver Plugins
- **`plugin-playwright-driver`** — Modern Playwright driver for fast, reliable multi-browser automation

### 🔧 Functional Plugins
- **`plugin-babel`** — Code transformation plugin for ES6+ syntax support
- **`plugin-fs-store`** — File system storage plugin for persistent data management

### 🛠️ Utility Packages
- **`browser-proxy`** — Browser proxy for communication bridging
- **`element-path`** — Element locator for precise DOM targeting
- **`test-utils`** — Testing utilities and helper functions
- **`timeout-config`** — Timeout settings and configuration management

### 🔍 Development Tools
- **`devtool-frontend`** — Frontend interface for test monitoring and debugging
- **`devtool-backend`** — Backend services for development tool infrastructure
- **`devtool-extension`** — Browser extension for in-browser debugging

### 📱 Applications and Examples
- **`web-application`** — Web application testing framework
- **`e2e-test-app`** — End-to-end testing examples and sample applications

### 📦 Other Packages
- **`client-ws-transport`** — WebSocket transport client
- **`download-collector-crx`** — Chrome extension for download collection

## Installation and Usage

These packages can be installed independently via pnpm or used as plugins within the ringai framework. Each package has independent version management and release cycles.

### Installation Examples

```bash
# Install Playwright driver plugin
pnpm add @ringai/plugin-playwright-driver

# Install Web application testing package
pnpm add @ringai/web-application

# Install Babel plugin for ES6+ support
pnpm add @ringai/plugin-babel

# Install development tools
pnpm add @ringai/devtool-frontend @ringai/devtool-backend
```

### Plugin Configuration

#### Basic Configuration (.ringairc)
```json
{
  "plugins": [
    "@ringai/plugin-playwright-driver",
    "@ringai/plugin-babel"
  ],
  "playwright": {
    "browsers": ["chromium", "firefox", "webkit"],
    "headless": true
  }
}
```

#### Advanced Configuration with File Storage
```json
{
  "plugins": [
    "@ringai/plugin-playwright-driver",
    "@ringai/plugin-fs-store"
  ],
  "playwright": {
    "browsers": ["chromium", "firefox", "webkit"],
    "headless": true
  }
}
```

#### Development Tools Configuration
```json
{
  "plugins": [
    "@ringai/plugin-playwright-driver",
    "@ringai/devtool-backend"
  ],
  "devtool": {
    "enabled": true,
    "port": 8080
  }
}
```

## Development and Extension

### Creating New Packages

To develop new plugins or extension packages, follow the existing package structure and development standards:

#### Standard Package Structure
```
package-name/
├── src/
│   ├── index.ts          # Main entry point
│   ├── interfaces/       # TypeScript interfaces
│   ├── services/         # Core services
│   └── utils/           # Utility functions
├── test/
│   └── *.spec.ts        # Test files
├── dist/                # Compiled output
├── package.json         # Package configuration
├── tsconfig.json        # TypeScript configuration
├── tsconfig.build.json  # Build configuration
└── README.md           # Package documentation
```

#### Development Guidelines

1. **Follow TypeScript standards** — All packages must include proper type definitions
2. **Implement plugin interface** — Use the standard plugin API for framework integration
3. **Include comprehensive tests** — Unit and integration tests are required
4. **Document APIs** — Provide clear documentation and usage examples
5. **Version compatibility** — Ensure compatibility with core framework versions

### Plugin Development API

```typescript
import { PluginAPI } from '@ringai/plugin-api';

export class MyPlugin {
    constructor(private api: PluginAPI) {}

    async init() {
        // Plugin initialization logic
    }

    async beforeTest() {
        // Pre-test hooks
    }

    async afterTest() {
        // Post-test hooks
    }
}
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Follow the coding standards and testing requirements
4. Submit a pull request with detailed description

Each package follows unified project structure and development standards, making it easy to understand, maintain, and extend the framework capabilities.
