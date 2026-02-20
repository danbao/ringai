# testring

[![license](https://img.shields.io/github/license/danbao/testring.svg)](https://github.com/danbao/testring/blob/master/LICENSE)
[![npm](https://img.shields.io/npm/v/testring.svg)](https://www.npmjs.com/package/testring)
[![CI](https://github.com/danbao/testring/actions/workflows/ci.yml/badge.svg)](https://github.com/danbao/testring/actions/workflows/ci.yml)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=danbao_testring&metric=coverage)](https://sonarcloud.io/summary/new_code?id=danbao_testring)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=danbao_testring&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=danbao_testring)

A modern, high-performance automated UI testing framework for Node.js 22+.

## Project Overview

testring is a testing framework designed for automated testing of web applications. It provides:

- 🚀 **High Performance** — Multi-process parallel test execution
- 🔧 **Extensible** — Rich plugin system architecture
- 🌐 **Multi-Browser** — Chrome, Firefox, Safari, and Edge via Playwright
- 🛠️ **Developer Friendly** — ESM-first, TypeScript-native, complete development toolchain

## Project Structure

```
testring/
├── core/              # Core modules (~20 packages) — Framework foundation
│   ├── api/           # Test API controllers
│   ├── cli/           # Command-line interface (citty)
│   ├── logger/        # Distributed logging system
│   ├── transport/     # Inter-process communication
│   ├── test-worker/   # Test worker processes
│   ├── reporter/      # Test result reporting
│   └── ...            # Other core modules
├── packages/          # Extension packages — Plugins and tools
│   ├── plugin-playwright-driver/  # Playwright browser driver
│   ├── plugin-babel/              # Babel transpilation plugin
│   ├── plugin-fs-store/           # File system store plugin
│   ├── web-application/           # Web application testing
│   ├── devtool-frontend/          # Developer tools frontend
│   └── ...                        # Other extension packages
├── docs/              # Documentation
├── utils/             # Build and maintenance utilities
└── README.md
```

### Core Modules (core/)

Core modules provide the framework's foundational functionality:

- **API Layer** — Test execution and control interfaces
- **CLI** — Command-line interface built with citty (subcommands: `run`, `init`, `plugin`)
- **Process Management** — Multi-process test execution and communication
- **File System** — Test file discovery and reading
- **Logging System** — Distributed logging and management
- **Plugin System** — Extensible plugin architecture
- **Reporter** — Test result reporting and output formatting

### Extension Packages (packages/)

Extension packages provide additional functionality:

- **Playwright Driver** — Browser automation via Playwright
- **Babel Plugin** — Test file transpilation
- **FS Store** — File system storage for test artifacts
- **Web Application** — Web application-specific testing features
- **Developer Tools** — Debugging and monitoring tools

## Quick Start

### Prerequisites

- Node.js 22 or later
- pnpm 10+

### Installation

```bash
# Install the main framework
pnpm add testring

# Install Playwright driver
pnpm add @testring/plugin-playwright-driver

# Optional: Babel plugin for transpilation
pnpm add @testring/plugin-babel

# Optional: File system store
pnpm add @testring/plugin-fs-store
```

### Basic Configuration

Create a `.testringrc` configuration file (JSON):

```json
{
  "tests": "./tests/**/*.spec.js",
  "plugins": [
    "@testring/plugin-playwright-driver"
  ],
  "workerLimit": 2,
  "retryCount": 3
}
```

Or use `.testringrc.js` / `.testringrc.cjs` for JavaScript configuration:

```js
// .testringrc.js
export default {
  tests: './tests/**/*.spec.js',
  plugins: ['@testring/plugin-playwright-driver'],
  workerLimit: 2,
  retryCount: 3,
};
```

### Writing Tests

```javascript
// tests/example.spec.js
describe('Example Test', () => {
  it('should be able to access the homepage', async () => {
    await browser.url('https://example.com');

    const title = await browser.getTitle();
    expect(title).toBe('Example Domain');
  });
});
```

### Running Tests

```bash
# Run all tests
testring run

# Run specific tests
testring run --tests "./tests/login.spec.js"

# Set parallel execution
testring run --workerLimit 4

# Debug mode
testring run --logLevel debug
```

## Key Features

### Multi-Process Parallel Execution
- Run multiple tests simultaneously across isolated worker processes
- Intelligent load balancing
- Process isolation prevents test interference

### Multi-Browser Support via Playwright
- Chrome, Firefox, Safari, Edge
- Headless mode support
- Mobile browser emulation

### Plugin System
- Official plugins for common use cases
- Simple plugin development API (`@testring/plugin-api`)
- Composable plugin architecture

### Development Tools
- Visual debugging interface
- Real-time test monitoring
- Detailed test reports

## Development

### Project Setup

```bash
# Clone the project
git clone https://github.com/danbao/testring.git
cd testring

# Install dependencies
pnpm install

# Build the project
pnpm run build:main

# Run unit tests
pnpm run test:unit

# Run all tests (unit + E2E headless)
pnpm test
```

### Build Commands

```bash
# Full build (all packages, uses turbo)
pnpm run build

# Build main packages only (excludes e2e, devtool)
pnpm run build:main
```

### Test Commands

```bash
# Unit tests (vitest)
pnpm run test:unit

# Unit tests in watch mode
pnpm run test:unit:watch

# Unit tests with coverage
pnpm run test:unit:coverage

# E2E tests with coverage
pnpm run test:e2e:coverage:lcov
```

### Linting

```bash
# Lint all files (eslint)
pnpm run lint

# Auto-fix lint issues
pnpm run lint:fix
```

### Contributing

Contributions are welcome! Please follow these steps:
1. Fork the project
2. Create a feature branch
3. Submit your changes
4. Create a Pull Request

## License

MIT License — See the [LICENSE](LICENSE) file for details.

## Support

- 📖 [Documentation](docs/)
- 🐛 [Issue Reporting](https://github.com/danbao/testring/issues)
- 💬 [Discussions](https://github.com/danbao/testring/discussions)

## 🌍 Cloudflare Worker for Test Fixtures

这个项目包含一个独立的 Cloudflare Worker，提供在线测试环境：

```
cloudflare-worker/
├── build.js          # 构建脚本
├── wrangler.toml      # Worker 配置
├── package.json       # 依赖管理
├── static-fixtures/   # 测试页面源文件 (24个)
├── worker.js          # 生成的代码 (gitignored)
└── README.md          # 详细文档
```

### 快速开始

```bash
cd cloudflare-worker
pnpm install
pnpm run build
pnpm run deploy
```

详细信息请查看 [cloudflare-worker/README.md](cloudflare-worker/README.md)
