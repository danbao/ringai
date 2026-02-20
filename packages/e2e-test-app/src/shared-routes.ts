import { Hono, Context } from 'hono';

// 导入所有 HTML 页面函数
import { getUploadHtml } from './static-fixtures/upload';
import { getMockHtml } from './static-fixtures/mock';
import { getScrollHtml } from './static-fixtures/scroll';
import { getWaitUntilHtml } from './static-fixtures/wait-until';
import { getCookieHtml } from './static-fixtures/cookie';
import { getGetSizeHtml } from './static-fixtures/get-size';
import { getHtmlAndTextHtml } from './static-fixtures/html-and-text';
import { getIframe2Html } from './static-fixtures/iframe2';
import { getClickHtml } from './static-fixtures/click';
import { getFocusStableHtml } from './static-fixtures/focus-stable';
import { getGetSourceHtml } from './static-fixtures/get-source';
import { getDragAndDropHtml } from './static-fixtures/drag-and-drop';
import { getElementsHtml } from './static-fixtures/elements';
import { getAlertHtml } from './static-fixtures/alert';
import { getTimezoneHtml } from './static-fixtures/timezone';
import { getWaitForExistHtml } from './static-fixtures/wait-for-exist';
import { getTitleHtml } from './static-fixtures/title';
import { getWaitForVisibleHtml } from './static-fixtures/wait-for-visible';
import { getFrameHtml } from './static-fixtures/frame';
import { getCssHtml } from './static-fixtures/css';
import { getScreenshotHtml } from './static-fixtures/screenshot';
import { getFormHtml } from './static-fixtures/form';
import { getIframe1Html } from './static-fixtures/iframe1';
import { getAssertDemoHtml } from './static-fixtures/assert-demo';
import { getSimulateFieldHtml } from './static-fixtures/simulate-field';
import { getLocationSizeHtml } from './static-fixtures/location-size';
import { getTagNameHtml } from './static-fixtures/tag-name';



/**
 * 创建共享的 Hono 应用程序，包含所有通用路由
 */
export function createSharedApp(): Hono {
    const app = new Hono();

    // POST upload endpoint
    app.post('/upload', async (c: Context) => {
        try {
            const formData = await c.req.formData();
            const file = formData.get('file') as File;
            
            if (!file) {
                return c.json({ error: 'No file uploaded' }, 400);
            }

            return c.json({
                message: 'File received successfully',
                filename: file.name,
            });
        } catch (error) {
            return c.json({ error: 'Failed to process upload' }, 500);
        }
    });



    // 健康检查端点
    app.get('/health', (c: Context) => {
        const environment = getEnvironment();
        return c.json({ 
            status: 'ok', 
            timestamp: new Date().toISOString(),
            environment: environment || 'nodejs'
        });
    });

    // HTML 页面路由
    app.get('/static/upload.html', getUploadHtml);
    app.get('/static/mock.html', getMockHtml);
    app.get('/static/scroll.html', getScrollHtml);
    app.get('/static/wait-until.html', getWaitUntilHtml);
    app.get('/static/cookie.html', getCookieHtml);
    app.get('/static/get-size.html', getGetSizeHtml);
    app.get('/static/html-and-text.html', getHtmlAndTextHtml);
    app.get('/static/iframe2.html', getIframe2Html);
    app.get('/static/click.html', getClickHtml);
    app.get('/static/focus-stable.html', getFocusStableHtml);
    app.get('/static/get-source.html', getGetSourceHtml);
    app.get('/static/drag-and-drop.html', getDragAndDropHtml);
    app.get('/static/elements.html', getElementsHtml);
    app.get('/static/alert.html', getAlertHtml);
    app.get('/static/timezone.html', getTimezoneHtml);
    app.get('/static/wait-for-exist.html', getWaitForExistHtml);
    app.get('/static/title.html', getTitleHtml);
    app.get('/static/wait-for-visible.html', getWaitForVisibleHtml);
    app.get('/static/frame.html', getFrameHtml);
    app.get('/static/css.html', getCssHtml);
    app.get('/static/screenshot.html', getScreenshotHtml);
    app.get('/static/form.html', getFormHtml);
    app.get('/static/iframe1.html', getIframe1Html);
    app.get('/static/assert-demo.html', getAssertDemoHtml);
    app.get('/static/simulate-field.html', getSimulateFieldHtml);
    app.get('/static/location-size.html', getLocationSizeHtml);
    app.get('/static/tag-name.html', getTagNameHtml);

    // 首页
    app.get('/', (c: Context) => {
        const environment = getEnvironment();
        return c.json({
            message: `Mock Web Server running on ${environment || 'Node.js'}`,
            endpoints: [
                'POST /upload - File upload endpoint',
                'GET /health - Health check',
                'GET /static/* - HTML test pages (all environments)',
            ],
            environment: environment || 'nodejs'
        });
    });

    return app;
}

/**
 * 获取当前运行环境
 */
function getEnvironment(): string | undefined {
    // 检查是否在 Cloudflare Workers 环境中
    if (typeof globalThis.caches !== 'undefined' && typeof (globalThis as any).cf !== 'undefined') {
        return 'Cloudflare Workers';
    }
    
    // 检查是否在 Node.js 环境中
    if (typeof process !== 'undefined' && process.versions?.node) {
        return 'Node.js';
    }
    
    return undefined;
}

 