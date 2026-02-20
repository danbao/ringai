# Core Modules

The `core/` directory contains the core modules of the testring testing framework, providing the foundation functionality and essential services. These modules implement key features such as test execution, process management, file system operations, logging, and more.

[![npm version](https://badge.fury.io/js/testring.svg)](https://www.npmjs.com/package/testring)
[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)
[![Node.js](https://img.shields.io/badge/Node.js->=22.0.0-brightgreen)](https://nodejs.org/)

## Overview

The core modules form the backbone of the testring framework, providing:

- **Multi-process test execution** with parallel processing capabilities
- **Plugin architecture** for extensible functionality
- **Distributed logging** system for comprehensive monitoring
- **Test result reporting** with customizable reporters
- **File system abstraction** for test discovery and management
- **Inter-process communication** for coordinated test execution
- **Configuration management** with flexible parameter handling

## Directory Structure

### Core Runtime Modules
- **`api/`** — Test API controller providing the main interface for test execution
- **`cli/`** — Command-line interface handling CLI arguments and user interaction
- **`testring/`** — Main testring entry module and framework orchestrator

### Test Execution Modules
- **`test-worker/`** — Test worker processes responsible for executing tests in isolated environments
- **`test-run-controller/`** — Test run controller managing test queues and execution flow
- **`sandbox/`** — Sandbox environment providing isolated execution contexts for tests
- **`reporter/`** — Test result reporter providing customizable test output and reporting

### Process and Communication Modules
- **`child-process/`** — Child process management providing process creation and lifecycle management
- **`transport/`** — Transport layer handling inter-process communication and message routing

### File System Modules
- **`fs-reader/`** — File system reader responsible for discovering and reading test files
- **`fs-store/`** — File system store providing file storage and caching capabilities

### Configuration and Utility Modules
- **`cli-config/`** — CLI configuration parser handling configuration files and command-line parameters
- **`logger/`** — Distributed logging system providing comprehensive logging across multiple processes
- **`types/`** — TypeScript type definitions providing type safety for the entire framework
- **`utils/`** — Collection of utility functions and helper methods

### Plugin and Extension Modules
- **`plugin-api/`** — Plugin API providing interfaces for plugin development and integration
- **`pluggable-module/`** — Pluggable module base class supporting hooks and plugin mechanisms

### Development and Debugging Modules
- **`async-breakpoints/`** — Asynchronous breakpoints for debugging and flow control

## Key Features

### 🏗️ Modular Architecture
Each core functionality is isolated into independent modules, making the framework easy to maintain, test, and extend.

### 🔌 Plugin Support
Comprehensive plugin API enables functionality extension without modifying core code.

### ⚡ Asynchronous Processing
Full support for asynchronous operations and concurrent execution across all modules.

### 🔄 Process Management
Complete child process management and communication mechanisms for reliable multi-process execution.

### ⚙️ Flexible Configuration
Support for multiple configuration methods including files, environment variables, and CLI parameters.

### 📊 Distributed Logging
Advanced logging system supporting multi-process log aggregation and real-time monitoring.

### 📋 Test Reporting
Customizable test result reporting with support for multiple output formats and destinations.

## Usage Guidelines

These core modules are primarily intended for internal framework use. Developers typically don't need to interact with these modules directly. For extending framework functionality, it's recommended to use the plugin API instead of modifying core modules.

### For Framework Users
- Use the main `testring` package for test execution
- Configure through `.testringrc` or CLI parameters
- Extend functionality through official plugins

### For Plugin Developers
- Utilize the `plugin-api` module for creating extensions
- Follow the `pluggable-module` patterns for consistency
- Reference `types` module for TypeScript definitions

## Module Dependencies and Architecture

### Architecture Overview

The core modules follow a layered architecture design with 10 distinct layers, from foundational type definitions at the bottom to the main entry module at the top, forming a clear dependency hierarchy that ensures maintainability and prevents circular dependencies.

### Detailed Layered Architecture

#### 🔷 Foundation Layer (Layer 0)
- **types** — Core TypeScript type definitions, depends only on Node.js types, provides type safety for the entire framework
- **async-breakpoints** — Asynchronous breakpoint system, standalone module for debugging and flow control

#### 🔶 Utility Layer (Layer 1)
- **utils** — Common utility functions collection, depends on `types`
- **pluggable-module** — Plugin framework foundation, depends on `types`

#### 🔷 Infrastructure Layer (Layer 2)
- **child-process** — Child process management, depends on `types` + `utils`
- **transport** — Transport layer for inter-process communication, depends on `child-process` + `types` + `utils`

#### 🔶 Service Layer (Layer 3)
- **logger** — Distributed logging system, depends on `pluggable-module` + `transport` + `types` + `utils`
- **fs-reader** — File system reader, depends on `logger` + `pluggable-module` + `types`

#### 🔷 Configuration and Storage Layer (Layer 4)
- **cli-config** — Configuration management, depends on `logger` + `types` + `utils`
- **fs-store** — File system storage, depends on `cli-config` + `logger` + `pluggable-module` + `transport` + `types` + `utils`

#### 🔶 API Layer (Layer 5)
- **api** — Test API controller, depends on `async-breakpoints` + `logger` + `transport` + `types` + `utils`
- **plugin-api** — Plugin API interface, depends on `fs-store` + `logger` + `types` + `utils`

#### 🔷 Advanced Features Layer (Layer 6)
- **sandbox** — Code sandbox environment, depends on `api` + `types` + `utils`
- **test-run-controller** — Test execution controller, depends on `fs-store` + `logger` + `pluggable-module` + `types` + `utils`
- **reporter** — Test result reporting, depends on `logger` + `pluggable-module` + `types` + `utils`

#### 🔶 Execution Layer (Layer 7)
- **test-worker** — Test worker processes (most complex package), depends on almost all other core packages:
  - `api` + `async-breakpoints` + `child-process`
  - `fs-reader` + `fs-store` + `logger` + `pluggable-module`
  - `sandbox` + `transport` + `types` + `utils`

#### 🔷 Interface Layer (Layer 8)
- **cli** — Command-line interface, integrates multiple high-level packages:
  - `cli-config` + `fs-reader` + `fs-store` + `logger` + `plugin-api`
  - `test-run-controller` + `test-worker` + `transport` + `types`

#### 🔶 Entry Layer (Layer 9)
- **testring** — Main entry package, depends on `api` + `cli`, serves as the unified framework entry point

### Key Dependency Characteristics

#### 🏗️ Strict Layering
Dependencies follow a clear layered structure where each layer only depends on lower layers, preventing circular dependencies and ensuring clean architecture.

#### 🔒 Type Safety Foundation
The `types` package serves as the foundational dependency referenced by almost all packages, ensuring type safety throughout the framework.

#### 🎯 Core Integration
The `test-worker` is the most complex package, integrating most core functionality and responsible for actual test execution.

#### 🔌 Unified Interface
The `cli` package serves as the primary interface, integrating all components needed for test execution.

#### 📦 Modular Design
Each package has a single responsibility with clear interfaces, enabling independent development, testing, and maintenance.

#### 🧩 Plugin-Friendly Architecture
Complete plugin extension mechanism provided through `pluggable-module` and `plugin-api` packages.

### Dependency Graph

```
testring (Entry Point)
├── api
└── cli
    ├── cli-config
    ├── fs-reader
    ├── fs-store
    ├── logger
    ├── plugin-api
    ├── reporter
    ├── test-run-controller
    ├── test-worker (Most Complex)
    │   ├── api
    │   ├── async-breakpoints
    │   ├── child-process
    │   ├── fs-reader
    │   ├── fs-store
    │   ├── logger
    │   ├── pluggable-module
    │   ├── sandbox
    │   ├── transport
    │   ├── types
    │   └── utils
    ├── transport
    └── types
```

## Installation and Development

### Prerequisites

- **Node.js** >= 22.0.0
- **pnpm** >= 10.0.0
- **TypeScript** >= 5.0.0 (for development)

### Development Setup

```bash
# Clone the repository
git clone https://github.com/danbao/testring.git

# Navigate to the project directory
cd testring

# Install dependencies
pnpm install

# Build all core modules
pnpm run build

# Run tests
pnpm run test:unit
```

### Building Individual Modules

```bash
# Build all core modules
pnpm run build:main

# Build with watch mode for development
pnpm run build:main:watch
```

## Testing

### Running Tests

```bash
# Run all unit tests
pnpm run test:unit

# Run tests with coverage
pnpm run test:unit:coverage

# Run a specific test file
npx vitest run path/to/file.spec.ts
```

### Test Structure

Each core module includes comprehensive tests:
- Unit tests for individual functions and classes
- Integration tests for module interactions
- Type checking tests for TypeScript definitions

## Contributing

### Development Guidelines

1. **Follow the layered architecture** — Ensure new modules respect the dependency hierarchy
2. **Maintain type safety** — All modules must include proper TypeScript definitions
3. **Write comprehensive tests** — Include unit and integration tests for new functionality
4. **Document APIs** — Provide clear documentation for public interfaces
5. **Follow coding standards** — Use ESLint configuration and formatting guidelines

### Adding New Core Modules

1. Create module directory in `core/`
2. Follow the standard package structure:
   ```
   module-name/
   ├── src/
   │   ├── index.ts
   │   └── ...
   ├── test/
   │   └── *.spec.ts
   ├── package.json
   ├── tsconfig.json
   ├── tsconfig.build.json
   └── README.md
   ```
3. Update dependency graph and documentation
4. Add appropriate tests and type definitions

This layered architecture ensures code maintainability and extensibility while preventing circular dependencies, providing a stable and reliable foundation for the testring framework.
