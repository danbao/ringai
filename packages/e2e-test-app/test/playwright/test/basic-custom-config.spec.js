import {run} from 'ringai';

run(async (api) => {
    const app = api.application;
    
    // 测试基本的自定义浏览器客户端配置功能
    await app.client.setCustomBrowserClientConfig({
        hostname: 'localhost',
        port: 8080,
        headers: {
            'X-Ringai-Custom-Header': 'RingaiCustomValue',
        },
    });
    
    // 验证配置是否正确设置
    const config = await app.client.getCustomBrowserClientConfig();
    await app.assert.equal(
        config.headers['X-Ringai-Custom-Header'],
        'RingaiCustomValue',
        'Custom header should be set correctly'
    );
    
    // 测试基本的页面访问功能
    await app.url('https://captive.apple.com');
    
    // 验证页面标题（简单的功能验证）
    const title = await app.getTitle();
    await app.assert.ok(title.length > 0, 'Page should have a title');
    
    console.log('[Test] Basic custom configuration test completed successfully');
});
