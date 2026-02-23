import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Important: vi.mock is hoisted. Do NOT reference top-level vars inside the factory.
vi.mock('playwright', () => {
    return {
        chromium: { launch: vi.fn() },
        firefox: { launch: vi.fn() },
        webkit: { launch: vi.fn() },
    };
});

import { chromium } from 'playwright';
import { BrowserProxyPlaywright } from '../src/browser-proxy-playwright';

describe('BrowserProxyPlaywright', () => {
    const launchMock = () => (chromium as any).launch as any;

    const newContextMock = vi.fn();
    const newPageMock = vi.fn();
    const gotoMock = vi.fn();
    const closePageMock = vi.fn();
    const closeContextMock = vi.fn();
    const closeBrowserMock = vi.fn();

    const locatorClickMock = vi.fn();

    const pageMock: any = {
        goto: gotoMock,
        close: closePageMock,
        locator: vi.fn(() => ({ click: locatorClickMock })),
    };

    const contextMock: any = {
        newPage: newPageMock,
        close: closeContextMock,
        pages: vi.fn(() => [pageMock]),
    };

    const browserMock: any = {
        newContext: newContextMock,
        contexts: vi.fn(() => [contextMock]),
        close: closeBrowserMock,
    };

    beforeEach(() => {
        vi.clearAllMocks();

        launchMock().mockResolvedValue(browserMock);
        newContextMock.mockResolvedValue(contextMock);
        newPageMock.mockResolvedValue(pageMock);

        gotoMock.mockResolvedValue(undefined);
        closePageMock.mockResolvedValue(undefined);
        closeContextMock.mockResolvedValue(undefined);
        closeBrowserMock.mockResolvedValue(undefined);
        locatorClickMock.mockResolvedValue(undefined);
    });

    afterEach(async () => {
        // ensure no pending unhandled rejections
        await Promise.resolve();
    });

    it('4.1 should init() on first use and kill() should cleanup page/context/browser', async () => {
        const proxy = new BrowserProxyPlaywright({ browserName: 'chromium' });

        await proxy.url('app', 'https://example.com');

        expect(launchMock()).toHaveBeenCalledTimes(1);
        expect(newContextMock).toHaveBeenCalledTimes(1);
        expect(newPageMock).toHaveBeenCalledTimes(1);
        expect(gotoMock).toHaveBeenCalledWith('https://example.com');

        await proxy.kill();

        expect(closePageMock).toHaveBeenCalledTimes(1);
        expect(closeContextMock).toHaveBeenCalledTimes(1);
        expect(closeBrowserMock).toHaveBeenCalledTimes(1);

        // second kill is idempotent
        await proxy.kill();
        expect(closePageMock).toHaveBeenCalledTimes(1);
        expect(closeContextMock).toHaveBeenCalledTimes(1);
        expect(closeBrowserMock).toHaveBeenCalledTimes(1);
    });

    it('4.2 should support basic request/response style calls (click delegates to locator)', async () => {
        const proxy = new BrowserProxyPlaywright({ browserName: 'chromium' });

        await proxy.click('app', '#btn');

        expect(pageMock.locator).toHaveBeenCalledWith('#btn');
        expect(locatorClickMock).toHaveBeenCalledTimes(1);
    });

    it('4.3 should handle common errors: browser launch failure & close errors are ignored', async () => {
        const launchErr = new Error('launch failed');
        launchMock().mockRejectedValueOnce(launchErr);

        const proxy = new BrowserProxyPlaywright({ browserName: 'chromium' });

        await expect(proxy.getTitle('app')).rejects.toThrow('launch failed');

        // even if close throws, kill should not throw
        closePageMock.mockRejectedValueOnce(new Error('page close error'));
        closeContextMock.mockRejectedValueOnce(new Error('context close error'));
        closeBrowserMock.mockRejectedValueOnce(new Error('browser close error'));

        await expect(proxy.kill()).resolves.toBeUndefined();
    });
});
