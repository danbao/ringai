import {run} from 'ringai';
import {getTargetUrl} from './utils';

run(async (api) => {
    let app = api.application;
    await app.url(getTargetUrl(api, 'responsive.html'));

    // === 1. Default viewport - verify page loads and desktop layout ===
    await app.waitForExist(app.root.desktopOnly);
    await app.assert.isTrue(
        await app.isVisible(app.root.desktopOnly),
        'Desktop content should be visible at default viewport',
    );
    await app.assert.equal(
        await app.isVisible(app.root.mobileOnly),
        false,
        'Mobile content should be hidden at default viewport',
    );

    // === 2. Resize to mobile (375x667) ===
    await app.setViewportSize(375, 667);

    const mobileSize = await app.getWindowSize();
    await app.assert.equal(mobileSize.width, 375);
    await app.assert.equal(mobileSize.height, 667);

    const mobileViewportText = await app.getText(app.root.viewportInfo);
    await app.assert.equal(mobileViewportText, '375x667');

    await app.assert.equal(
        await app.isVisible(app.root.desktopOnly),
        false,
        'Desktop content should be hidden at 375px',
    );
    await app.assert.isTrue(
        await app.isVisible(app.root.mobileOnly),
        'Mobile content should be visible at 375px',
    );
    await app.assert.isTrue(
        await app.isVisible(app.root.hamburgerMenu),
        'Hamburger menu should be visible at 375px',
    );
    await app.assert.equal(
        await app.isVisible(app.root.navLinks),
        false,
        'Nav links should be hidden at 375px',
    );

    // === 3. Resize to tablet (768x1024) ===
    await app.setViewportSize(768, 1024);

    const tabletViewportText = await app.getText(app.root.viewportInfo);
    await app.assert.equal(tabletViewportText, '768x1024');

    await app.assert.isTrue(
        await app.isVisible(app.root.tabletBanner),
        'Tablet banner should be visible at 768px',
    );
    await app.assert.isTrue(
        await app.isVisible(app.root.desktopOnly),
        'Desktop content should be visible at 768px',
    );
    await app.assert.equal(
        await app.isVisible(app.root.mobileOnly),
        false,
        'Mobile content should be hidden at 768px',
    );

    // === 4. Verify resize event counter ===
    const resizeCount = await app.getText(app.root.resizeCount);
    const count = parseInt(resizeCount, 10);
    await app.assert.isTrue(count >= 2, 'Resize count should be at least 2');

    // === 5. Restore to desktop (1280x720) ===
    await app.setViewportSize(1280, 720);

    await app.assert.isTrue(
        await app.isVisible(app.root.desktopOnly),
        'Desktop content should be visible after restore',
    );
    await app.assert.equal(
        await app.isVisible(app.root.mobileOnly),
        false,
        'Mobile content should be hidden after restore',
    );
    await app.assert.equal(
        await app.isVisible(app.root.tabletBanner),
        false,
        'Tablet banner should be hidden after restore',
    );
});
