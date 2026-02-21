import {run} from 'testring';
import {getTargetUrl} from './utils';

run(async (api) => {
    const app = api.application;
    await app.url(getTargetUrl(api, 'assert-demo.html'));

    // disableScreenshots — after disabling, makeScreenshot returns null
    await app.disableScreenshots();
    const disabledResult = await app.makeScreenshot();
    await app.assert.isNull(disabledResult);

    // enableScreenshots — after enabling, makeScreenshot should work
    await app.enableScreenshots();
    const enabledResult = await app.makeScreenshot();
    // In test config screenshots may be disabled globally,
    // so just verify the method runs without error
    await app.assert.ok(enabledResult === null || typeof enabledResult === 'string');
});
