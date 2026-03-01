// Example configuration for using @ringai/plugin-playwright-driver
// 
// Browser Mode Control:
// - Default: Runs in headless mode for performance and consistency
// - Set PLAYWRIGHT_DEBUG=1 environment variable to run in non-headless mode with slow motion for debugging
//
// Usage examples:
// - pnpm test (headless mode)
// - PLAYWRIGHT_DEBUG=1 pnpm test (non-headless mode for debugging)

module.exports = {
    plugins: [
        // Basic configuration - default headless mode (controlled by PLAYWRIGHT_DEBUG environment)
        ['@ringai/plugin-playwright-driver', {
            browserName: 'chromium',
            launchOptions: {
                // Note: headless is automatically set to true by default
                // Only PLAYWRIGHT_DEBUG=1 environment variable can override this to false
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            },
            contextOptions: {
                viewport: { width: 1280, height: 720 }
            }
        }],
        
        // Advanced configuration with other features
        /*
        ['@ringai/plugin-playwright-driver', {
            browserName: 'chromium', // or 'firefox', 'webkit'
            launchOptions: {
                // headless mode is controlled by PLAYWRIGHT_DEBUG environment variable only
                // Do not set headless: false here - use PLAYWRIGHT_DEBUG=1 instead
                slowMo: 100 // Custom slow motion (PLAYWRIGHT_DEBUG=1 sets this to 500ms automatically)
            },
            contextOptions: {
                viewport: { width: 1920, height: 1080 },
                locale: 'en-US',
                timezoneId: 'America/New_York'
            },
            // Enable debugging features
            coverage: true, // Enable code coverage
            video: true,    // Record video of tests
            videoDir: './test-results/videos',
            trace: true,    // Record execution trace
            traceDir: './test-results/traces',
            // Timeout settings
            clientTimeout: 15 * 60 * 1000, // 15 minutes
            clientCheckInterval: 5 * 1000   // 5 seconds
        }]
        */
    ],
    
    // Test files
    tests: './**/*.spec.js',
    
    // Other ringai configuration...
};