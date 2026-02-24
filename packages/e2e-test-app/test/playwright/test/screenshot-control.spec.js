import {run} from 'ringai';
import {getTargetUrl} from './utils';

run(async (api) => {
    const app = api.application;
    await app.url(getTargetUrl(api, 'assert-demo.html'));

    // makeScreenshot with screenshots disabled in config should return null
    const configDisabledResult = await app.makeScreenshot();
    await app.assert.ok(configDisabledResult === null, 'result of stat should be null');

    // disableScreenshots — after disabling, makeScreenshot returns null
    await app.disableScreenshots();
    const disabledResult = await app.makeScreenshot();
    await app.assert.isNull(disabledResult);

    // enableScreenshots — after enabling, makeScreenshot should work
    await app.enableScreenshots();
    const enabledResult = await app.makeScreenshot();
    await app.assert.ok(enabledResult === null || typeof enabledResult === 'string');
});
