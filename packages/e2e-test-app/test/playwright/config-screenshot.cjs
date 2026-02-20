const playwrightConfig = require('./config.cjs');

module.exports = async (config) => {
    const defConfig = await playwrightConfig(config);

    const screenshotPath = './screenshots';

    const plugins = [
        ...defConfig.plugins,
        [
            'fs-store',
            {
                staticPaths: {
                    screenshot: screenshotPath,
                },
            },
        ],
    ];

    return {
        ...defConfig,
        screenshotPath,
        screenshots: 'enable',
        tests: 'test/playwright/test-screenshots/*.spec.js',
        plugins,
    };
};
