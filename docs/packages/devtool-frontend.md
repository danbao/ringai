# @ringai/devtool-frontend

React-based frontend debugging panel for the ringai framework that provides a graphical user interface for test monitoring and control. This package works in conjunction with `@ringai/devtool-backend` and `@ringai/devtool-extension` to enable real-time log viewing, test execution control, and browser screenshot visualization.

## Overview

The devtool frontend is a React-based UI component of the ringai framework, providing:

- **Real-time test execution monitoring** with status updates and control
- **Interactive test control panel** for pausing, resuming, and stepping through tests
- **Monaco-based code editor** for viewing and editing test scripts
- **WebSocket communication** with the devtool backend
- **Browser extension integration** for capturing page elements and screenshots
- **Popup interface** for quick test control access

## Key Features

### 🖥️ Test Monitoring Interface
- Real-time test execution status display
- Console log viewing and filtering
- Test process control (pause, resume, step)
- Visual representation of test flow

### 📝 Code Editor
- Monaco-based code editor (same as VS Code)
- Syntax highlighting for JavaScript/TypeScript
- Code navigation and search capabilities
- Real-time code editing and preview

### 🔄 WebSocket Integration
- Real-time bidirectional communication with backend
- State synchronization across components
- Event-driven architecture for responsive UI
- Automatic reconnection handling

### 🧩 Component Architecture
- React component-based UI design
- Redux state management for predictable state
- Modular design for extensibility
- Responsive layout for different screen sizes

## Installation

```bash
pnpm add @ringai/devtool-frontend --save-dev
```

## UI Components

### Main Editor Interface

The editor interface provides a full-featured code editor for test scripts:

```typescript
import React from 'react';
import MonacoEditor from 'react-monaco-editor';

export class Editor extends React.Component {
    state = {
        code: '// type your code...',
        editor: {} as any,
    };

    editorDidMount(editor, monaco) {
        editor.focus();
        this.setState({ editor, monaco });
    }

    render() {
        const { code } = this.state;
        const options = { selectOnLineNumbers: true };

        return (
            <div className="editor-wrapper">
                <MonacoEditor
                    language="javascript"
                    theme="vs-dark"
                    value={code}
                    options={options}
                    editorDidMount={this.editorDidMount.bind(this)}
                />
            </div>
        );
    }
}
```

### Popup Control Panel

The popup interface provides quick test control buttons:

```typescript
import React from 'react';
import { TestWorkerAction } from '@ringai/types';

export class ButtonsLayout extends React.Component {
    render() {
        const { workerState, executeAction } = this.props;
        const isPaused = workerState.paused || workerState.pausedTilNext;

        return (
            <div className="buttons-container">
                {isPaused ? (
                    <button onClick={() => executeAction(TestWorkerAction.resumeTestExecution)}>
                        Play
                    </button>
                ) : (
                    <button onClick={() => executeAction(TestWorkerAction.pauseTestExecution)}>
                        Pause
                    </button>
                )}
                <button onClick={() => executeAction(TestWorkerAction.runTillNextExecution)}>
                    Next
                </button>
                <button onClick={() => executeAction(TestWorkerAction.releaseTest)}>
                    Forward
                </button>
            </div>
        );
    }
}
```

## Usage

### Basic Setup

1. **Install the required packages**:
   ```bash
   pnpm add @ringai/devtool-frontend @ringai/devtool-backend --save-dev
   ```

2. **Build the frontend**:
   ```bash
   pnpm run build
   ```

3. **Start the devtool server**:
   ```typescript
   import { DevtoolServerController } from '@ringai/devtool-backend';
   import { transport } from '@ringai/transport';

   const devtoolServer = new DevtoolServerController(transport);
   await devtoolServer.init();

   const config = devtoolServer.getRuntimeConfiguration();
   console.log(`Devtools UI available at: http://${config.host}:${config.httpPort}`);
   ```

### Integration with Test Framework

```typescript
import { DevtoolServerController } from '@ringai/devtool-backend';
import { TestRunController } from '@ringai/test-run-controller';
import { transport } from '@ringai/transport';

// Start devtool server
const devtoolServer = new DevtoolServerController(transport);
await devtoolServer.init();
const config = devtoolServer.getRuntimeConfiguration();

// Configure test runner with devtools
const testRunner = new TestRunController(transport);
await testRunner.runTests({
    tests: ['./tests/**/*.spec.ts'],
    config: {
        devtool: {
            enabled: true,
            httpPort: config.httpPort,
            wsPort: config.wsPort,
        },
    },
});
```

## Development

### Project Structure

```
src/
├── components/           # React UI components
│   ├── editor/           # Code editor components
│   ├── popup-layout.tsx  # Popup control interface
│   └── EditorLayout.tsx  # Main editor layout
├── containers/           # State containers
│   └── popup-ws-provider.tsx  # WebSocket state provider
├── imgs/                 # UI images and icons
├── editor.tsx            # Editor entry point
└── popup.tsx             # Popup entry point
```

### Building the Frontend

```bash
# Development build with watch mode
pnpm run build:watch

# Production build
pnpm run build
```

### Output Structure

```
dist/
├── editor.bundle.js      # Main editor interface
├── popup.bundle.js       # Popup control interface
└── [monaco editor files] # Editor dependencies
```

## API Reference

### Exported Module

```typescript
// Main export
export const absolutePath: string;  // Absolute path to the built frontend assets
```

### Component Props

#### PopupWsProvider

```typescript
interface IPopupWsProviderProps {
    wsClient: IClientWsTransport;  // WebSocket client for communication
}

interface IPopupWsProviderState {
    initialized: boolean;  // Whether the provider is initialized
    workerState: ITestControllerExecutionState;  // Current test state
}
```

#### ButtonsLayout

```typescript
interface ButtonLayoutProps {
    workerState: ITestControllerExecutionState;  // Current test state
    executeAction: (action: TestWorkerAction) => Promise<void>;  // Action dispatcher
}
```

## Integration Examples

### With Chrome Extension

```typescript
import { absolutePath } from '@ringai/devtool-frontend';
import { extensionId } from '@ringai/devtool-extension';

// The extension will load the frontend from the backend server
console.log('Frontend assets path:', absolutePath);
console.log('Extension ID:', extensionId);
```

### With Custom Backend

```typescript
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { absolutePath } from '@ringai/devtool-frontend';

const app = new Hono();

// Serve the frontend assets
app.use('/devtools/*', serveStatic({ root: absolutePath }));

serve({ fetch: app.fetch, port: 8080 }, (info) => {
    console.log(`Custom devtools server running at http://localhost:${info.port}/devtools`);
});
```

## Troubleshooting

### Common Issues

1. **WebSocket connection failures**:
   - Ensure the devtool-backend server is running
   - Check port configurations match between frontend and backend
   - Verify network connectivity and firewall settings

2. **UI not updating**:
   - Check WebSocket connection status
   - Verify Redux state updates are propagating
   - Check browser console for errors

3. **Editor not loading**:
   - Ensure Monaco editor files are properly built
   - Check for JavaScript errors in the console
   - Verify the DOM element with ID `rcRecorderApp` exists

## Dependencies

- **`react`** — UI component library
- **`react-dom`** — React DOM rendering
- **`react-monaco-editor`** — Monaco code editor for React
- **`@ringai/client-ws-transport`** — WebSocket communication
- **`@ringai/types`** — TypeScript type definitions
- **`monaco-editor-webpack-plugin`** — Monaco editor integration
- **`webpack`** — Module bundling and build system

## Related Modules

- **[@ringai/devtool-backend](devtool-backend.md)** — Backend server for developer tools
- **[@ringai/devtool-extension](devtool-extension.md)** — Chrome extension for browser integration
- **[@ringai/test-run-controller](../core-modules/test-run-controller.md)** — Test execution controller
- **[@ringai/transport](../core-modules/transport.md)** — Inter-process communication

## Requirements

- **Node.js:** 22+
- **pnpm:** 10+

## License

MIT License — see the [LICENSE](https://github.com/danbao/ringai/blob/master/LICENSE) file for details.
