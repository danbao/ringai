import {run} from 'ringai';
import {getTargetUrl} from './utils';

run(async (api) => {
    let app = api.application;
    await app.url(getTargetUrl(api, 'wait-for-visible.html'));

    // waitForRoot
    await app.waitForRoot();
    const rootExists = await app.isExisting(app.root.container);
    await app.assert.isTrue(rootExists);

    // waitForVisible / waitForNotVisible
    let isInfoSectionVisible = await app.isVisible(app.root.infoSection.infoText);
    await app.assert.equal(isInfoSectionVisible, false);

    await app.click(app.root.appearButton);
    await app.waitForVisible(app.root.infoSection.infoText);
    isInfoSectionVisible = await app.isVisible(app.root.infoSection.infoText);
    await app.assert.equal(isInfoSectionVisible, true);

    await app.click(app.root.disappearButton);
    let isInfoSectionVisibleBefore = await app.isVisible(app.root.infoSection.infoText);
    await app.waitForNotVisible(app.root.infoSection.infoText);
    let isInfoSectionVisibleAfter = await app.isVisible(app.root.infoSection.infoText);
    await app.assert.equal(isInfoSectionVisibleBefore, true);
    await app.assert.equal(isInfoSectionVisibleAfter, false);

    // isBecomeVisible / isBecomeHidden
    const initiallyHidden = await app.isVisible(app.root.infoSection);
    await app.assert.isFalse(initiallyHidden);

    await app.click(app.root.appearButton);
    const becameVisible = await app.isBecomeVisible(app.root.infoSection);
    await app.assert.isTrue(becameVisible);

    await app.click(app.root.disappearButton);
    const becameHidden = await app.isBecomeHidden(app.root.infoSection);
    await app.assert.isTrue(becameHidden);
});