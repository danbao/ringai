import {run} from 'testring';
import {getTargetUrl} from './utils';

run(async (api) => {
    const app = api.application;
    await app.url(getTargetUrl(api, 'assert-demo.html'));

    // --- Comparison assertions ---
    const title = await app.getTitle();
    await app.assert.equal(title, 'Assert Demo');
    await app.assert.notEqual(title, 'Wrong Title');
    await app.assert.strictEqual(title, 'Assert Demo');

    const headingText = await app.getText(app.root.heading);
    await app.assert.deepEqual(headingText, 'Assert Demo Page');
    await app.assert.notDeepEqual(headingText, 'Something Else');

    // --- Boolean / truthy assertions ---
    const isVisible = await app.isVisible(app.root.heading);
    await app.assert.isTrue(isVisible);
    await app.assert.ok(isVisible);
    await app.assert.isNotOk(!isVisible);

    const isHiddenVisible = await app.isVisible(app.root.hidden);
    await app.assert.isFalse(isHiddenVisible);
    await app.assert.isNotOk(isHiddenVisible);

    // --- Type assertions ---
    await app.assert.typeOf(headingText, 'string');
    await app.assert.isString(headingText);

    const elemCount = await app.getElementsCount(app.root.item);
    await app.assert.isNumber(elemCount);
    await app.assert.typeOf(elemCount, 'number');

    await app.assert.isBoolean(isVisible);
    await app.assert.isObject({a: 1});
    await app.assert.isArray([1, 2, 3]);

    // --- Null / undefined assertions ---
    await app.assert.isNull(null);
    await app.assert.isNotNull(headingText);
    await app.assert.isUndefined(undefined);
    await app.assert.isDefined(headingText);

    // --- Include / match assertions ---
    const paragraph = await app.getText(app.root.paragraph);
    await app.assert.include(paragraph, 'Hello');
    await app.assert.notInclude(paragraph, 'Goodbye');
    await app.assert.match(paragraph, /^Hello/);

    // --- Numeric assertions ---
    await app.assert.isAbove(elemCount, 2);
    await app.assert.isBelow(elemCount, 10);
    await app.assert.isAtLeast(elemCount, 3);
    await app.assert.isAtMost(elemCount, 3);

    // --- Collection / length assertions ---
    const tabIds = await app.getTabIds();
    await app.assert.lengthOf(tabIds, 1);
    await app.assert.isNotEmpty(tabIds);
    await app.assert.isEmpty([]);

    // --- Property assertions ---
    const obj = {name: 'testring', version: '0.8.0'};
    await app.assert.property(obj, 'name');
    await app.assert.notProperty(obj, 'missing');

    // --- Exists assertions (chai) ---
    await app.assert.exists(headingText);
    await app.assert.notExists(null);

    // --- Throws assertions ---
    await app.assert.throws(() => { throw new Error('test'); });
    await app.assert.doesNotThrow(() => { return 1; });
});
