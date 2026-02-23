import {run} from 'ringai';
import {getTargetUrl} from './utils';

run(async (api) => {
    const app = api.application;
    await app.url(getTargetUrl(api, 'location-size.html'));

    // getLocation — returns {x, y} coordinates
    const location = await app.getLocation(app.root.positioned);
    await app.assert.isObject(location);
    await app.assert.isNumber(location.x);
    await app.assert.isNumber(location.y);
    await app.assert.isAbove(location.x, 0);
    await app.assert.isAbove(location.y, 0);

    // getWindowSize — returns {width, height}
    const windowSize = await app.getWindowSize();
    await app.assert.isObject(windowSize);
    await app.assert.isNumber(windowSize.width);
    await app.assert.isNumber(windowSize.height);
    await app.assert.isAbove(windowSize.width, 0);
    await app.assert.isAbove(windowSize.height, 0);

    // getActiveElement — returns the focused element info
    await app.click(app.root.focusInput);
    const activeElement = await app.getActiveElement();
    await app.assert.ok(activeElement);

    // maximizeWindow
    await app.maximizeWindow();
    const afterMaxSize = await app.getWindowSize();
    await app.assert.isAtLeast(afterMaxSize.width, windowSize.width);
});
