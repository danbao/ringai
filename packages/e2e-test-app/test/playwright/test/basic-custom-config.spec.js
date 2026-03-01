import {run} from 'ringai';

run(async (api) => {
    const app = api.application;
    
    // Test basic custom browser client configuration
    await app.client.setCustomBrowserClientConfig({
        hostname: 'localhost',
        port: 8080,
        headers: {
            'X-Ringai-Custom-Header': 'RingaiCustomValue',
        },
    });
    
    // Verify configuration was applied correctly
    const config = await app.client.getCustomBrowserClientConfig();
    await app.assert.equal(
        config.headers['X-Ringai-Custom-Header'],
        'RingaiCustomValue',
        'Custom header should be set correctly'
    );
    
    // Test basic page navigation
    await app.url('https://captive.apple.com');
    
    // Verify page title (basic functional check)
    const title = await app.getTitle();
    await app.assert.ok(title.length > 0, 'Page should have a title');
    
    console.log('[Test] Basic custom configuration test completed successfully');
});
