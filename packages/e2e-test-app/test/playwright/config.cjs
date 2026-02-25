// 导入统一的timeout配置
const TIMEOUTS = require('../../timeout-config.cjs');

module.exports = async (config) => {
    const local = !config.headless;

    const compilerConfig = {
        target: 'es2022',
    };

    if (config.debug) {
        compilerConfig.sourceMap = true;
    }

    return {
        screenshotPath: './_tmp/',
        workerLimit: 5,
        maxWriteThreadCount: 2,
        screenshots: 'disable',
        retryCount: local ? 0 : 2,
        testTimeout: local ? 0 : 90000,
        tests: 'test/playwright/test/**/*.spec.js',
        plugins: [
            [
                'playwright-driver',
                {
                    browserName: 'chromium',
                    launchOptions: {
                        headless: !local,
                        slowMo: local ? 500 : 0, // Add slow motion for local debugging
                        args: local ? [] : ['--no-sandbox']
                    },
                    clientTimeout: local ? 0 : (config.testTimeout || TIMEOUTS.CLIENT_SESSION),
                },
            ],
            ['compiler', compilerConfig],
        ],
    };
};
