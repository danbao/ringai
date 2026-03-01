import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { createSharedApp } from './shared-routes';

const port = 8080;

export class MockWebServer {
    private httpServerInstance: any;
    private app: Hono;

    constructor() {
        this.app = this.createHonoApp();
    }

    start(): Promise<void> {
        return new Promise<void>((resolve) => {
            this.httpServerInstance = serve({
                fetch: this.app.fetch,
                port,
            }, () => {
                resolve();
            });
        });
    }

    stop(): void {
        this.httpServerInstance.close();
    }

    // Get Hono app instance for Cloudflare Workers deployment
    getApp(): Hono {
        return this.app;
    }

    private createHonoApp(): Hono {
        // Use shared routes (includes HTML routes)
        const app = createSharedApp();
        return app;
    }
}

// Export Hono app instance for Cloudflare Workers deployment
export const app = new MockWebServer().getApp();

// Default export for Cloudflare Workers
export default app;

// Start server when this file is run directly
const isMainModule = import.meta.url === `file://${process.argv[1]}` ||
    process.argv[1]?.endsWith('mock-web-server.ts');
if (isMainModule) {
    const server = new MockWebServer();

    server.start().then(() => {
        console.log('Mock Web Server started at http://localhost:8080');
        console.log('');
        console.log('Available endpoints:');
        console.log('  POST /upload - File upload endpoint');
        console.log('  GET  /grid-test - Test page');
        console.log('  GET  /health - Health check');
        console.log('  GET  /static/* - HTML test pages (all environments)');
        console.log('');
        console.log('Press Ctrl+C to stop the server');
    }).catch((error) => {
        console.error('Failed to start server:', error);
        process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\nShutting down server...');
        server.stop();
        process.exit(0);
    });
}
