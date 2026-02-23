# Advanced Features and Debugging

The `@ringai/plugin-playwright-driver` plugin provides advanced capabilities for comprehensive testing and debugging.

## Debug Mode

### Enable Debug Mode

```bash
# Enable debug mode with environment variable
PLAYWRIGHT_DEBUG=1 pnpm test
```

When `PLAYWRIGHT_DEBUG=1` is set:
- `headless` is automatically set to `false`
- `slowMo` is set to `500ms`
- DevTools are opened automatically
- Extended timeouts (30 seconds instead of 8 seconds)

### Debug Configuration

```javascript
// Debug mode configuration
{
    browserName: 'chromium',
    launchOptions: {
        headless: false,  // Visible browser for debugging
        slowMo: 100,      // Slow down for visibility
        devtools: true    // Open DevTools
    }
}
```

### Debug Tips

1. **Focus on specific tests**: Use `--grep "pattern"` to run only the tests you're debugging
2. **Browser windows**: The browser windows will be visible and actions will be slowed down
3. **Extended timeouts**: Tests have 30-second timeouts in debug mode
4. **Console output**: Look for the "🐛 Playwright Debug Mode" message to confirm debug mode is active

## Video Recording

### Basic Video Recording

```javascript
{
    video: true,
    videoDir: './test-results/videos'
}
```

### Advanced Video Configuration

```javascript
{
    video: true,
    videoDir: './test-results/videos',
    videoSize: { width: 1280, height: 720 },
    videoMode: 'retain-on-failure' // 'off', 'on', 'retain-on-failure'
}
```

### Video Recording Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `'off'` | No video recording | Performance-critical tests |
| `'on'` | Record all tests | Comprehensive debugging |
| `'retain-on-failure'` | Record only failed tests | CI/CD optimization |

## Trace Recording

### Basic Trace Recording

```javascript
{
    trace: true,
    traceDir: './test-results/traces'
}
```

### Advanced Trace Configuration

```javascript
{
    trace: true,
    traceDir: './test-results/traces',
    traceMode: 'retain-on-failure',
    traceScreenshots: true,
    traceSnapshots: true
}
```

### Trace Analysis

Traces can be analyzed using Playwright's trace viewer:

```bash
# Open trace file in browser
npx playwright show-trace test-results/traces/trace.zip
```

## Code Coverage

### Basic Coverage

```javascript
{
    coverage: true,
    coverageDir: './test-results/coverage'
}
```

### Advanced Coverage Configuration

```javascript
{
    coverage: true,
    coverageDir: './test-results/coverage',
    coverageInclude: ['**/*.js', '**/*.ts'],
    coverageExclude: ['**/node_modules/**', '**/test/**'],
    coverageReporters: ['html', 'text', 'lcov']
}
```

### Coverage Reports

The plugin generates multiple coverage report formats:

- **HTML Report**: Interactive coverage visualization
- **Text Report**: Console output with coverage summary
- **LCOV Report**: Standard format for CI/CD integration

## Screenshot Capture

### Automatic Screenshots

```javascript
{
    screenshot: 'only-on-failure', // 'off', 'on', 'only-on-failure'
    screenshotDir: './test-results/screenshots'
}
```

### Manual Screenshots

```javascript
// In your test code
await page.screenshot({ path: 'custom-screenshot.png' });
await page.screenshot({ path: 'full-page.png', fullPage: true });
```

## PDF Generation

### Page to PDF

```javascript
// Generate PDF of current page
await page.pdf({ path: 'page.pdf' });

// Generate PDF with custom options
await page.pdf({
    path: 'custom.pdf',
    format: 'A4',
    printBackground: true,
    margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
    }
});
```

## Network Interception

### Request/Response Modification

```javascript
// Intercept and modify requests
await page.route('**/*.js', route => {
    route.continue({
        url: route.request().url().replace('old.js', 'new.js')
    });
});

// Mock API responses
await page.route('**/api/users', route => {
    route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ users: [] })
    });
});
```

### Network Monitoring

```javascript
// Monitor network requests
page.on('request', request => {
    console.log('Request:', request.url());
});

page.on('response', response => {
    console.log('Response:', response.url(), response.status());
});
```

## Geolocation and Permissions

### Custom Geolocation

```javascript
contextOptions: {
    geolocation: { longitude: 10.0, latitude: 10.0 },
    permissions: ['geolocation']
}
```

### Permission Management

```javascript
// Grant permissions
await page.grantPermissions(['geolocation', 'notifications']);

// Revoke permissions
await page.clearPermissions();
```

## Device Emulation

### Mobile Device Emulation

```javascript
contextOptions: {
    viewport: { width: 375, height: 667 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
}
```

### Custom Device Profiles

```javascript
// iPhone 12
contextOptions: {
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true
}

// iPad
contextOptions: {
    viewport: { width: 768, height: 1024 },
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)',
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
}
```

## File Upload and Download

### File Upload

```javascript
// Upload single file
await page.setInputFiles('input[type="file"]', 'path/to/file.pdf');

// Upload multiple files
await page.setInputFiles('input[type="file"]', [
    'path/to/file1.pdf',
    'path/to/file2.jpg'
]);
```

### File Download

```javascript
// Handle file downloads
const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('a[href*="download"]')
]);

await download.saveAs('downloaded-file.pdf');
```

## Keyboard and Mouse Events

### Advanced Keyboard Input

```javascript
// Type with modifiers
await page.keyboard.press('Control+A');
await page.keyboard.type('Hello World');

// Special keys
await page.keyboard.press('ArrowDown');
await page.keyboard.press('Enter');
```

### Mouse Interactions

```javascript
// Click with modifiers
await page.click('button', { button: 'right' });
await page.click('button', { modifiers: ['Control'] });

// Drag and drop
await page.dragAndDrop('#source', '#target');
```

## Frame and Popup Handling

### Frame Navigation

```javascript
// Switch to frame
const frame = page.frame({ name: 'my-frame' });
await frame.click('button');

// Switch to frame by URL
const frame = page.frame({ url: /.*domain\.com/ });
```

### Popup Handling

```javascript
// Handle new page/popup
const [newPage] = await Promise.all([
    page.context().waitForEvent('page'),
    page.click('a[target="_blank"]')
]);

await newPage.waitForLoadState();
```

## Performance Monitoring

### Performance Metrics

```javascript
// Get performance metrics
const metrics = await page.evaluate(() => {
    const perfEntries = performance.getEntriesByType('navigation');
    return perfEntries[0];
});

console.log('Page load time:', metrics.loadEventEnd - metrics.loadEventStart);
```

### Memory Usage

```javascript
// Monitor memory usage
const memoryInfo = await page.evaluate(() => {
    return performance.memory;
});

console.log('Memory usage:', memoryInfo);
```

## Accessibility Testing

### Accessibility Checks

```javascript
// Check for accessibility issues
const accessibility = await page.accessibility.snapshot();
console.log('Accessibility tree:', accessibility);
```

### Screen Reader Testing

```javascript
// Test with screen reader
await page.evaluate(() => {
    // Simulate screen reader interactions
    document.querySelector('button').setAttribute('aria-label', 'Submit form');
});
```

## Complete Advanced Configuration

### Development with Debugging

```javascript
module.exports = {
    plugins: [
        ['@ringai/plugin-playwright-driver', {
            browserName: 'chromium',
            launchOptions: {
                headless: false,
                slowMo: 100,
                devtools: true
            },
            contextOptions: {
                viewport: { width: 1920, height: 1080 },
                locale: 'en-US',
                timezoneId: 'America/New_York',
                geolocation: { longitude: -74.0, latitude: 40.7 },
                permissions: ['geolocation', 'notifications']
            },
            // Advanced features
            video: true,
            videoDir: './test-results/videos',
            trace: true,
            traceDir: './test-results/traces',
            coverage: true,
            coverageDir: './test-results/coverage',
            screenshot: 'only-on-failure',
            screenshotDir: './test-results/screenshots'
        }]
    ],
    tests: './**/*.spec.js'
};
```

### CI/CD with Full Features

```javascript
module.exports = {
    plugins: [
        ['@ringai/plugin-playwright-driver', {
            browserName: 'chromium',
            launchOptions: {
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            },
            contextOptions: {
                viewport: { width: 1920, height: 1080 }
            },
            // CI/CD optimized features
            video: 'retain-on-failure',
            videoDir: './test-results/videos',
            trace: 'retain-on-failure',
            traceDir: './test-results/traces',
            coverage: true,
            coverageDir: './test-results/coverage',
            screenshot: 'only-on-failure',
            screenshotDir: './test-results/screenshots'
        }]
    ],
    tests: './**/*.spec.js',
    workerLimit: 4,
    retryCount: 2
};
```

## Best Practices

### Performance Optimization

1. **Use `retain-on-failure` modes** for video and trace recording
2. **Limit coverage scope** to relevant files only
3. **Use headless mode** in CI/CD environments
4. **Optimize viewport size** for your use case

### Debugging Best Practices

1. **Enable video recording** for failed tests
2. **Use trace recording** for complex debugging scenarios
3. **Take screenshots** on failures for quick analysis
4. **Monitor performance metrics** for optimization

### CI/CD Integration

1. **Upload artifacts** (videos, traces, screenshots) to storage
2. **Generate coverage reports** for code quality monitoring
3. **Use parallel execution** with appropriate worker limits
4. **Implement retry logic** for flaky tests 