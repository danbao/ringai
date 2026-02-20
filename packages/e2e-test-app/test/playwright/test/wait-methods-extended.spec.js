import {run} from 'testring';
import {getTargetUrl} from './utils';

run(async (api) => {
    const app = api.application;
    await app.url(getTargetUrl(api, 'wait-for-visible.html'));

    // waitForRoot — should resolve immediately (root always present)
    await app.waitForRoot();
    const rootExists = await app.isExisting(app.root.container);
    await app.assert.isTrue(rootExists);

    // isBecomeVisible — element transitions from hidden to visible
    const initiallyHidden = await app.isVisible(app.root.infoSection);
    await app.assert.isFalse(initiallyHidden);

    await app.click(app.root.appearButton);
    const becameVisible = await app.isBecomeVisible(app.root.infoSection);
    await app.assert.isTrue(becameVisible);

    // isBecomeHidden — element transitions from visible to hidden
    await app.click(app.root.disappearButton);
    const becameHidden = await app.isBecomeHidden(app.root.infoSection);
    await app.assert.isTrue(becameHidden);

    // waitForAlert + alert operations
    await app.url(getTargetUrl(api, 'alert.html'));
    await app.click(app.root.delayAlertButton);
    await app.waitForAlert();
    const isOpen = await app.isAlertOpen();
    await app.assert.isTrue(isOpen);
    await app.alertAccept();
});
