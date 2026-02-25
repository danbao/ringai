// 导入统一的timeout配置
const TIMEOUTS = require('../../timeout-config.cjs');

module.exports = async (config) => {
    const local = !config.headless;

    const babelConfig = {
        presets: [
            [
                '@babel/preset-env',
                {
                    targets: {
                        node: 'current',
                    },
                },
            ],
        ],
    };

    if (config.debug) {
        babelConfig.presets[0][1].debug = true;
        babelConfig.sourceMaps = 'inline';
    }

    return {
        screenshotPath: './_tmp/',
        workerLimit: 'local',
        maxWriteThreadCount: 2,
        screenshots: 'disable',
        retryCount: local ? 0 : 2, // 在 CI 环境中重试失败的测试
        testTimeout: local ? 0 : (config.testTimeout || TIMEOUTS.TEST_EXECUTION),
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
            ['babel', babelConfig],
        ],
    };
};
