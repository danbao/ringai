import { vi, type Mock } from 'vitest';
import { IBrowserProxyPlugin } from '@ringai/types';

type MockedPlugin = {
    [K in keyof IBrowserProxyPlugin]: Mock;
};

/**
 * Creates a complete mock implementation of IBrowserProxyPlugin
 * with all required methods stubbed using vitest
 */
export function createBrowserProxyPluginMock(): MockedPlugin {
    return {
        kill: vi.fn().mockResolvedValue(undefined),
        end: vi.fn().mockResolvedValue(undefined),
        refresh: vi.fn().mockResolvedValue(undefined),
        click: vi.fn().mockResolvedValue(undefined),
        url: vi.fn().mockResolvedValue('https://captive.apple.com'),
        newWindow: vi.fn().mockResolvedValue(undefined),
        waitForExist: vi.fn().mockResolvedValue(undefined),
        waitForVisible: vi.fn().mockResolvedValue(undefined),
        isVisible: vi.fn().mockResolvedValue(true),
        moveToObject: vi.fn().mockResolvedValue(undefined),
        execute: vi.fn().mockResolvedValue(4),
        executeAsync: vi.fn().mockResolvedValue(42),
        frame: vi.fn().mockResolvedValue(undefined),
        frameParent: vi.fn().mockResolvedValue(undefined),
        getTitle: vi.fn().mockResolvedValue('Test Page'),
        clearValue: vi.fn().mockResolvedValue(undefined),
        keys: vi.fn().mockResolvedValue(undefined),
        elementIdText: vi.fn().mockResolvedValue('text'),
        elements: vi.fn().mockResolvedValue([]),
        getValue: vi.fn().mockResolvedValue('value'),
        setValue: vi.fn().mockResolvedValue(undefined),
        selectByIndex: vi.fn().mockResolvedValue(undefined),
        selectByValue: vi.fn().mockResolvedValue(undefined),
        selectByVisibleText: vi.fn().mockResolvedValue(undefined),
        getAttribute: vi.fn().mockResolvedValue('attribute'),
        windowHandleMaximize: vi.fn().mockResolvedValue(undefined),
        isEnabled: vi.fn().mockResolvedValue(true),
        scroll: vi.fn().mockResolvedValue(undefined),
        scrollIntoView: vi.fn().mockResolvedValue(undefined),
        isAlertOpen: vi.fn().mockResolvedValue(false),
        alertAccept: vi.fn().mockResolvedValue(undefined),
        alertDismiss: vi.fn().mockResolvedValue(undefined),
        alertText: vi.fn().mockResolvedValue('alert text'),
        dragAndDrop: vi.fn().mockResolvedValue(undefined),
        setCookie: vi.fn().mockResolvedValue(undefined),
        getCookie: vi.fn().mockResolvedValue({}),
        deleteCookie: vi.fn().mockResolvedValue(undefined),
        getHTML: vi.fn().mockResolvedValue('<html></html>'),
        getSize: vi.fn().mockResolvedValue({ width: 100, height: 100 }),
        getCurrentTabId: vi.fn().mockResolvedValue('tab1'),
        switchTab: vi.fn().mockResolvedValue(undefined),
        close: vi.fn().mockResolvedValue(undefined),
        getTabIds: vi.fn().mockResolvedValue(['tab1']),
        window: vi.fn().mockResolvedValue(undefined),
        windowHandles: vi.fn().mockResolvedValue(['window1']),
        getTagName: vi.fn().mockResolvedValue('div'),
        isSelected: vi.fn().mockResolvedValue(false),
        getText: vi.fn().mockResolvedValue('Test'),
        elementIdSelected: vi.fn().mockResolvedValue(false),
        makeScreenshot: vi.fn().mockResolvedValue('base64screenshot'),
        uploadFile: vi.fn().mockResolvedValue(undefined),
        getCssProperty: vi.fn().mockResolvedValue('red'),
        getSource: vi.fn().mockResolvedValue('<html><body>Test</body></html>'),
        isExisting: vi.fn().mockResolvedValue(true),
        waitForValue: vi.fn().mockResolvedValue(undefined),
        waitForSelected: vi.fn().mockResolvedValue(undefined),
        waitUntil: vi.fn().mockResolvedValue(undefined),
        selectByAttribute: vi.fn().mockResolvedValue(undefined),
        gridTestSession: vi.fn().mockResolvedValue(undefined),
        getHubConfig: vi.fn().mockResolvedValue({})
    } as MockedPlugin;
}

/**
 * Creates a minimal mock that only implements basic methods
 * Useful for testing error scenarios
 */
export function createMinimalBrowserProxyPluginMock(): Partial<IBrowserProxyPlugin> {
    return {
        kill: vi.fn().mockResolvedValue(undefined),
        end: vi.fn().mockResolvedValue(undefined),
        url: vi.fn().mockResolvedValue('https://captive.apple.com'),
        getTitle: vi.fn().mockResolvedValue('Test Page')
    };
}

/**
 * Creates a mock that throws errors for testing error handling
 */
export function createFailingBrowserProxyPluginMock(): MockedPlugin {
    const mock = createBrowserProxyPluginMock();
    
    // Make some methods fail
    mock.url.mockRejectedValue(new Error('Navigation failed'));
    mock.click.mockRejectedValue(new Error('Element not found'));
    mock.execute.mockRejectedValue(new Error('Script execution failed'));
    
    return mock;
}
