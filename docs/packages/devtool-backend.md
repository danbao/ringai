# @testring/devtool-backend

Developer tools backend service module that serves as the core debugging and development tool for the testring framework, providing comprehensive test debugging, recording, playback, and real-time monitoring capabilities. This module integrates a web server, WebSocket communication, message proxy, and frontend interface to provide a complete solution for test development and debugging.

## Overview

The developer tools backend service module is the debugging center of the testring framework, providing:

- **Complete test debugging and recording server** for test development
- **HTTP web service and routing system** for endpoints
- **WebSocket real-time communication and message proxy** for bidirectional data flow
- **Frontend interface integration and static resource serving** for UI components
- **Test process lifecycle management** for controlling test execution
- **Multi-process coordination and message relay** for distributed testing
- **Extensible plugin system and hook mechanisms** for customization
- **Real-time monitoring of test execution state** for observability

## Installation

```bash
pnpm add @testring/devtool-backend --save-dev
```

## Core Architecture

### DevtoolServerController Class

The main class is `DevtoolServerController`, which extends `PluggableModule` and manages the devtool server lifecycle. It forks a child process for the actual HTTP/WebSocket server and proxies messages between the test framework transport and the devtool worker.

```typescript
import { PluggableModule } from '@testring/pluggable-module';

class DevtoolServerController extends PluggableModule implements IDevtoolServerController {
    constructor(transport: ITransport);

    // Initialize and start the devtool server (forks worker process)
    async init(): Promise<void>;

    // Stop the server and clean up resources
    async kill(): Promise<void>;

    // Get runtime configuration (host, ports, extensionId)
    getRuntimeConfiguration(): IDevtoolRuntimeConfiguration;
}
```

### How It Works

1. **`init()`** calls the `beforeStart` hook, then forks a child worker process via `@testring/child-process`
2. The worker process starts an HTTP server and WebSocket server
3. The controller registers the worker with the transport layer for IPC
4. Message proxying is set up for test worker events (`register`, `updateExecutionState`, `unregister`) and web application devtool events
5. The `afterStart` hook fires once the server is ready

### Configuration Types

```typescript
interface IDevtoolServerConfig {
    host: string;               // Server host address (default: 'localhost')
    httpPort: number;           // HTTP service port
    wsPort: number;             // WebSocket service port
    router: RouterConfig[];     // Route configuration
    staticRoutes: StaticRoutes; // Static route configuration
}

interface IDevtoolRuntimeConfiguration {
    extensionId: string;        // Browser extension ID (from @testring/devtool-extension)
    httpPort: number;           // HTTP service port
    wsPort: number;             // WebSocket service port
    host: string;               // Server host address
}
```

### Plugin Hooks

The controller supports four lifecycle hooks via the hookable-based `PluggableModule`:

```typescript
enum DevtoolPluginHooks {
    beforeStart = 'beforeStart',    // Before server initialization (receives config, can modify it)
    afterStart = 'afterStart',      // After server starts successfully
    beforeStop = 'beforeStop',      // Before server shutdown
    afterStop = 'afterStop',        // After server stops
}
```

## Basic Usage

### Creating a Developer Tools Server

```typescript
import { DevtoolServerController } from '@testring/devtool-backend';
import { transport } from '@testring/transport';

// Create developer tools server
const devtoolServer = new DevtoolServerController(transport);

// Initialize and start the server
try {
    await devtoolServer.init();
    console.log('Developer tools server started successfully');

    // Get runtime configuration
    const config = devtoolServer.getRuntimeConfiguration();
    console.log(`Developer Tools UI: http://${config.host}:${config.httpPort}`);
    console.log(`WebSocket Endpoint: ws://${config.host}:${config.wsPort}`);
    console.log(`Extension ID: ${config.extensionId}`);
} catch (error) {
    console.error('Failed to start developer tools server:', error);
}

// Shutdown server when appropriate
process.on('SIGINT', async () => {
    await devtoolServer.kill();
    process.exit(0);
});
```

### Integration with Test Runner

```typescript
import { DevtoolServerController } from '@testring/devtool-backend';
import { transport } from '@testring/transport';

const devtoolServer = new DevtoolServerController(transport);
await devtoolServer.init();

const config = devtoolServer.getRuntimeConfiguration();
console.log(`Devtools at http://${config.host}:${config.httpPort}`);

// The devtool server automatically proxies these transport events:
// - TestWorkerAction.register
// - TestWorkerAction.updateExecutionState
// - TestWorkerAction.unregister
// - WebApplicationDevtoolActions.register
// - WebApplicationDevtoolActions.unregister
```

## Message Proxy System

The `DevtoolServerController` acts as a message proxy between the framework's transport layer and the devtool worker process. It forwards:

- **To the worker:** Test worker registration/unregistration events, execution state updates, and web application devtool actions
- **From the worker:** Messages are either sent to a specific process (directed) or broadcast locally to all listeners

This enables the devtool frontend (served by the worker) to monitor and control test execution in real time.

## Plugin System

### Registering Hooks

```typescript
import { DevtoolServerController } from '@testring/devtool-backend';
import { DevtoolPluginHooks } from '@testring/types';
import { transport } from '@testring/transport';

const devtoolServer = new DevtoolServerController(transport);

// Modify configuration before server starts
devtoolServer.registerHook(DevtoolPluginHooks.beforeStart, async (config) => {
    return {
        ...config,
        host: process.env.DEVTOOL_HOST || config.host,
        httpPort: parseInt(process.env.DEVTOOL_HTTP_PORT || String(config.httpPort)),
    };
});

// Run custom logic after server starts
devtoolServer.registerHook(DevtoolPluginHooks.afterStart, async () => {
    console.log('Devtool server is ready');
});

// Clean up before server stops
devtoolServer.registerHook(DevtoolPluginHooks.beforeStop, async () => {
    console.log('Shutting down devtool server...');
});

await devtoolServer.init();
```

## Troubleshooting

### Common Issues

#### Server Startup Failure
```
Error: listen EADDRINUSE: address already in use
```
Solution: Check port usage, modify port numbers in configuration.

#### Child Process Communication Failure
```
Error: Worker process communication failed
```
Solution: Check transport layer configuration, child process status, and message format.

#### Frontend Resource Loading Failure
```
Error: Cannot find module '@testring/devtool-frontend'
```
Solution: Ensure the `@testring/devtool-frontend` package is installed and built.

## Dependencies

- **`@testring/pluggable-module`** — Hookable-based plugin system
- **`@testring/transport`** — Transport layer communication
- **`@testring/logger`** — Logging system
- **`@testring/child-process`** — Child process forking
- **`@testring/devtool-frontend`** — Frontend interface assets
- **`@testring/devtool-extension`** — Browser extension (provides `extensionId`)
- **`@testring/utils`** — Utility functions (`generateUniqId`)

## Related Modules

- **[@testring/devtool-frontend](devtool-frontend.md)** — Developer tools frontend interface
- **[@testring/devtool-extension](devtool-extension.md)** — Browser extension
- **[@testring/pluggable-module](../core-modules/pluggable-module.md)** — Plugin hook system
- **[@testring/transport](../core-modules/transport.md)** — Inter-process communication

## Requirements

- **Node.js:** 22+
- **pnpm:** 10+

## License

MIT License — see the [LICENSE](https://github.com/danbao/testring/blob/master/LICENSE) file for details.
