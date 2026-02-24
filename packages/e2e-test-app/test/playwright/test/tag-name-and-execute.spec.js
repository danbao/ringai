import {run} from 'ringai';
import {getTargetUrl} from './utils';

run(async (api) => {
    const app = api.application;
    await app.url(getTargetUrl(api, 'tag-name.html'));

    // getTagName — returns lowercase tag name
    const divTag = await app.getTagName(app.root.divElement);
    await app.assert.equal(divTag, 'div');

    const inputTag = await app.getTagName(app.root.inputElement);
    await app.assert.equal(inputTag, 'input');

    const buttonTag = await app.getTagName(app.root.buttonElement);
    await app.assert.equal(buttonTag, 'button');

    const spanTag = await app.getTagName(app.root.resultSpan);
    await app.assert.equal(spanTag, 'span');

    // execute — run synchronous JS in browser
    const result = await app.execute(() => {
        return document.title;
    });
    await app.assert.equal(result, 'Tag Name and Execute');

    // execute with element manipulation
    await app.execute(() => {
        document.getElementById('resultSpan').textContent = 'executed';
    });
    const spanText = await app.getText(app.root.resultSpan);
    await app.assert.equal(spanText, 'executed');

    // execute with return value
    const sum = await app.execute((a, b) => a + b, [3, 7]);
    await app.assert.equal(sum, 10);

    // executeAsync — run async JS in browser
    const asyncResult = await app.executeAsync((done) => {
        setTimeout(() => done('async-done'), 100);
    });
    await app.assert.equal(asyncResult, 'async-done');
});
