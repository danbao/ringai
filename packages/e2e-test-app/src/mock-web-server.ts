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

    // 获取 Hono app 实例，用于 Cloudflare Workers 部署
    getApp(): Hono {
        return this.app;
    }

    private createHonoApp(): Hono {
        // 使用共享的路由（包含 HTML 路由）
        const app = createSharedApp();
        return app;
    }
}

// 导出 Hono app 实例，用于 Cloudflare Workers 部署
export const app = new MockWebServer().getApp();

// 默认导出，用于 Cloudflare Workers
export default app;

// 如果直接运行此文件，启动服务器
const isMainModule = import.meta.url === `file://${process.argv[1]}` ||
    process.argv[1]?.endsWith('mock-web-server.ts');
if (isMainModule) {
    const server = new MockWebServer();

    server.start().then(() => {
        console.log('🚀 Mock Web Server 已启动在 http://localhost:8080');
        console.log('');
        console.log('可用的端点：');
        console.log('  POST /upload - 文件上传端点');
        console.log('  GET  /grid-test - 测试页面');
        console.log('  GET  /health - 健康检查');
        console.log('  GET  /static/* - HTML 测试页面（所有环境）');
        console.log('');
        console.log('按 Ctrl+C 停止服务器');
    }).catch((error) => {
        console.error('启动服务器失败:', error);
        process.exit(1);
    });

    // 优雅关闭
    process.on('SIGINT', () => {
        console.log('\n正在关闭服务器...');
        server.stop();
        process.exit(0);
    });
}
