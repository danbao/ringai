import {run} from 'testring';
import {getTargetUrl} from './utils';

run(async (api) => {
    const app = api.application;
    await app.url(getTargetUrl(api, 'assert-demo.html'));

    // softAssert passes should work normally
    await app.softAssert.equal(1, 1);
    await app.softAssert.isTrue(true);
    await app.softAssert.include('hello world', 'hello');

    // Verify no errors collected so far
    await app.assert.lengthOf(app.softAssert._errorMessages, 0);

    // softAssert failures should NOT throw
    await app.softAssert.equal(1, 2);
    await app.softAssert.equal('a', 'b');

    // Verify errors were collected
    await app.assert.lengthOf(app.softAssert._errorMessages, 2);
    await app.assert.isArray(app.softAssert._errorMessages);
    await app.assert.isString(app.softAssert._errorMessages[0]);

    // Mix with hard assert — hard assert still works
    const title = await app.getTitle();
    await app.assert.equal(title, 'Assert Demo');

    // More softAssert verifications
    await app.softAssert.isNumber('not a number');
    await app.assert.lengthOf(app.softAssert._errorMessages, 3);

    // softAssert type checks that pass
    await app.softAssert.isString(title);
    await app.softAssert.isNotEmpty(title);
    await app.assert.lengthOf(app.softAssert._errorMessages, 3);
});
