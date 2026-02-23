/**
 * Simplified WebApplication using Playwright Page directly
 * 
 * This is a thin wrapper around Playwright Page that:
 * 1. Keeps ElementPath selector syntax (ringai-specific)
 * 2. Keeps assert hooks (success/error handlers)
 * 3. Uses Playwright's native API for everything else
 * 
 * Target: Phase 4.5 - 简化 WebApplication → 薄封装 Playwright Page
 */

import { Page, Locator, BrowserContext } from 'playwright';
import { createElementPath, ElementPathProxy } from '@ringai/element-path';
import type { 
    IWebApplicationConfig, 
    IAssertionErrorMeta, 
    IAssertionSuccessMeta,
    ITransport 
} from '@ringai/types';
import { loggerClient } from '@ringai/logger';

// DEFAULT_CONFIG reserved for future use
// const DEFAULT_CONFIG: Partial<IWebApplicationConfig> = {
//     screenshotsEnabled: false,
//     screenshotPath: './_tmp/',
//     devtool: null,
// };

/**
 * Simplified WebApplication - Thin wrapper around Playwright Page
 * 
 * Benefits:
 * - Direct Playwright API access (no WebDriver command translation)
 * - Native auto-wait, locator API, network interception, etc.
 * - Keeps ElementPath selector syntax for backwards compatibility
 * - Keeps assert hooks for test integration
 */
export class WebApplicationSimplified {
    private logger = loggerClient.withPrefix('[web-application-simplified]');
    
    // ElementPath root for selector syntax
    public root = createElementPath();
    
    // Assert callbacks (can be customized)
    protected onSuccess: ((meta: IAssertionSuccessMeta) => void) | null = null;
    protected onError: ((meta: IAssertionErrorMeta) => void) | null = null;

    constructor(
        private testUID: string,
        private page: Page,
        private transport: ITransport,
        _config: Partial<IWebApplicationConfig> = {},
    ) {
        // Config is stored for potential future use
    }

    /**
     * Convert ElementPath to Playwright Locator
     * 
     * This preserves ringai's selector syntax while using Playwright's locator API
     */
    private toLocator(selector: string | ElementPathProxy): Locator {
        // If it's an ElementPathProxy, convert to string selector
        const selectorStr = typeof selector === 'string' 
            ? selector 
            : this.elementPathToString(selector);
        
        // Use Playwright's locator with the converted selector
        return this.page.locator(selectorStr);
    }

    /**
     * Convert ElementPath to CSS/XPath selector string
     */
    private elementPathToString(elementPath: ElementPathProxy): string {
        // ElementPath stores the selector in a specific format
        // For now, return the raw selector - can be enhanced later
        if (typeof elementPath === 'string') {
            return elementPath;
        }
        
        // Try to get the xpath from the element path
        const path = (elementPath as any).toString?.();
        return path || String(elementPath);
    }

    // ============ Assert Hooks ============
    
    public assert = {
        onSuccess: (handler: (meta: IAssertionSuccessMeta) => void) => {
            this.onSuccess = handler;
        },
        onError: (handler: (meta: IAssertionErrorMeta) => void) => {
            this.onError = handler;
        },
    };

    public softAssert = {
        onSuccess: (handler: (meta: IAssertionSuccessMeta) => void) => {
            // Soft assert success - could log but not fail
            this.logger.debug('Soft assert success:', handler);
            this.handleSuccess({ 
                isSoft: true,
                successMessage: '', 
                assertMessage: '',
                originalMethod: '',
                args: []
            });
        },
        onError: (handler: (meta: IAssertionErrorMeta) => void) => {
            // Soft assert error - log but don't throw
            this.logger.warn('Soft assert error:', handler);
            this.handleError({ 
                isSoft: true,
                assertMessage: '',
                successMessage: '',
                originalMethod: '',
                args: []
            });
        },
    };

    // Internal handler methods - used by assert hooks
    private async handleSuccess(meta: IAssertionSuccessMeta): Promise<void> {
        if (this.onSuccess) {
            await this.onSuccess(meta);
        }
    }

    private async handleError(meta: IAssertionErrorMeta): Promise<void> {
        if (this.onError) {
            await this.onError(meta);
        }
    }

    // ============ Navigation ============

    /**
     * Navigate to URL - wraps Playwright page.goto()
     */
    public async url(val: string): Promise<void> {
        await this.page.goto(val);
    }

    /**
     * Get page title - wraps Playwright page.title()
     */
    public async getTitle(): Promise<string> {
        return this.page.title();
    }

    /**
     * Refresh page - wraps Playwright page.reload()
     */
    public async refresh(): Promise<void> {
        await this.page.reload();
    }

    /**
     * Go back - wraps Playwright page.goBack()
     */
    public async back(): Promise<void> {
        await this.page.goBack();
    }

    /**
     * Go forward - wraps Playwright page.goForward()
     */
    public async forward(): Promise<void> {
        await this.page.goForward();
    }

    // ============ Element Operations ============

    /**
     * Click element - wraps Playwright locator.click()
     */
    public async click(selector: string | ElementPathProxy, options?: { timeout?: number }): Promise<void> {
        const locator = this.toLocator(selector);
        const clickOptions: { timeout?: number } = {};
        if (options?.timeout !== undefined) {
            clickOptions.timeout = options.timeout;
        }
        await locator.click(clickOptions);
    }

    /**
     * Double click element - wraps Playwright locator.dblclick()
     */
    public async doubleClick(selector: string | ElementPathProxy): Promise<void> {
        const locator = this.toLocator(selector);
        await locator.dblclick();
    }

    /**
     * Get element text - wraps Playwright locator.textContent()
     */
    public async getText(selector: string | ElementPathProxy): Promise<string> {
        const locator = this.toLocator(selector);
        const text = await locator.textContent();
        return text ?? '';
    }

    /**
     * Get element attribute - wraps Playwright locator.getAttribute()
     */
    public async getAttribute(selector: string | ElementPathProxy, attr: string): Promise<string> {
        const locator = this.toLocator(selector);
        const value = await locator.getAttribute(attr);
        return value ?? '';
    }

    /**
     * Get element value (alias for getAttribute('value'))
     */
    public async getValue(selector: string | ElementPathProxy): Promise<string> {
        const locator = this.toLocator(selector);
        const value = await locator.getAttribute('value');
        return value ?? '';
    }

    /**
     * Set input value - wraps Playwright locator.fill()
     */
    public async setValue(selector: string | ElementPathProxy, value: unknown): Promise<void> {
        const locator = this.toLocator(selector);
        await locator.fill(String(value));
    }

    /**
     * Clear input value - wraps Playwright locator.clear()
     */
    public async clearValue(selector: string | ElementPathProxy): Promise<void> {
        const locator = this.toLocator(selector);
        await locator.clear();
    }

    /**
     * Type into input - wraps Playwright locator.type()
     */
    public async keys(selector: string | ElementPathProxy, value: string): Promise<void> {
        const locator = this.toLocator(selector);
        await locator.type(value);
    }

    /**
     * Press key - wraps Playwright page.keyboard.press()
     */
    public async press(key: string): Promise<void> {
        await this.page.keyboard.press(key);
    }

    // ============ Element State ============

    /**
     * Check if element is visible - wraps Playwright locator.isVisible()
     */
    public async isVisible(selector: string | ElementPathProxy): Promise<boolean> {
        const locator = this.toLocator(selector);
        return locator.isVisible();
    }

    /**
     * Check if element is enabled - wraps Playwright locator.isEnabled()
     */
    public async isEnabled(selector: string | ElementPathProxy): Promise<boolean> {
        const locator = this.toLocator(selector);
        return locator.isEnabled();
    }

    /**
     * Check if element is checked/selected - wraps Playwright locator.isChecked()
     */
    public async isSelected(selector: string | ElementPathProxy): Promise<boolean> {
        const locator = this.toLocator(selector);
        return locator.isChecked();
    }

    /**
     * Check if element exists - wraps Playwright locator.count()
     */
    public async isExisting(selector: string | ElementPathProxy): Promise<boolean> {
        const locator = this.toLocator(selector);
        return (await locator.count()) > 0;
    }

    // ============ Waiting ============

    /**
     * Wait for element to exist - wraps Playwright locator.waitFor()
     */
    public async waitForExist(selector: string | ElementPathProxy, timeout?: number): Promise<void> {
        const locator = this.toLocator(selector);
        const opts: { state?: 'attached' | 'detached' | 'visible' | 'hidden'; timeout?: number } = { state: 'attached' };
        if (timeout !== undefined) {
            opts.timeout = timeout;
        }
        await locator.waitFor(opts);
    }

    /**
     * Wait for element to be visible - wraps Playwright locator.waitFor()
     */
    public async waitForVisible(selector: string | ElementPathProxy, timeout?: number): Promise<void> {
        const locator = this.toLocator(selector);
        const opts: { state?: 'attached' | 'detached' | 'visible' | 'hidden'; timeout?: number } = { state: 'visible' };
        if (timeout !== undefined) {
            opts.timeout = timeout;
        }
        await locator.waitFor(opts);
    }

    /**
     * Wait for element to be hidden - wraps Playwright locator.waitFor()
     */
    public async waitForHidden(selector: string | ElementPathProxy, timeout?: number): Promise<void> {
        const locator = this.toLocator(selector);
        const opts: { state?: 'attached' | 'detached' | 'visible' | 'hidden'; timeout?: number } = { state: 'hidden' };
        if (timeout !== undefined) {
            opts.timeout = timeout;
        }
        await locator.waitFor(opts);
    }

    /**
     * Wait for element to be stable (not animating)
     */
    public async waitForStable(selector: string | ElementPathProxy, timeout?: number): Promise<void> {
        const locator = this.toLocator(selector);
        const opts: { state?: 'attached' | 'detached' | 'visible' | 'hidden'; timeout?: number } = { state: 'visible' };
        if (timeout !== undefined) {
            opts.timeout = timeout;
        }
        // Playwright automatically waits for elements to be stable before actions
        await locator.waitFor(opts);
    }

    /**
     * Wait for element to be clickable
     */
    public async waitForClickable(selector: string | ElementPathProxy, timeout?: number): Promise<void> {
        const locator = this.toLocator(selector);
        const opts: { force?: boolean; timeout?: number } = { force: false };
        if (timeout !== undefined) {
            opts.timeout = timeout;
        }
        await locator.click(opts);
    }

    // ============ Frames ============

    /**
     * Switch to frame by name or index
     */
    public async frame(name: string): Promise<void> {
        await this.page.frameLocator(name).first();
    }

    /**
     * Switch to parent frame
     */
    public async frameParent(): Promise<void> {
        await this.page.frame({ name: '' }); // This gets the top-level frame
    }

    // ============ Tabs ============

    /**
     * Get all tab IDs
     */
    public async getTabIds(): Promise<string[]> {
        const browser = this.page.context().browser();
        if (!browser) return [];
        
        const contexts = browser.contexts() || [];
        const tabs: string[] = [];
        for (const ctx of contexts) {
            const pages = ctx.pages();
            for (let i = 0; i < pages.length; i++) {
                tabs.push(String(i));
            }
        }
        return tabs;
    }

    /**
     * Switch to tab by ID
     */
    public async switchTab(tabId: string): Promise<void> {
        const context = this.page.context();
        const pages = context.pages();
        const index = parseInt(tabId, 10);
        if (pages[index]) {
            await pages[index].bringToFront();
        }
    }

    /**
     * Close tab
     */
    public async close(tabId: string): Promise<void> {
        const context = this.page.context();
        const pages = context.pages();
        const index = parseInt(tabId, 10);
        if (pages[index] && pages[index] !== this.page) {
            await pages[index].close();
        }
    }

    /**
     * Get current tab ID
     */
    public async getCurrentTabId(): Promise<string> {
        const context = this.page.context();
        const pages = context.pages();
        return String(pages.indexOf(this.page));
    }

    // ============ Windows ============

    /**
     * Open new window
     */
    public async newWindow(url: string, _windowName?: string, _features?: string): Promise<Page> {
        const context = this.page.context();
        const newPage = await context.newPage();
        if (url) {
            await newPage.goto(url);
        }
        return newPage;
    }

    /**
     * Maximize window
     */
    public async windowHandleMaximize(): Promise<void> {
        await this.page.evaluate(() => {
            window.moveTo(0, 0);
            window.resizeTo(screen.width, screen.height);
        });
    }

    /**
     * Get window size
     */
    public async getWindowSize(): Promise<{ width: number; height: number }> {
        const viewport = this.page.viewportSize();
        return viewport || { width: 0, height: 0 };
    }

    // ============ Cookies ============

    /**
     * Set cookie
     */
    public async setCookie(cookieObj: { name: string; value: string; url?: string }): Promise<void> {
        await this.page.context().addCookies([cookieObj]);
    }

    /**
     * Get cookie
     */
    public async getCookie(cookieName?: string): Promise<unknown> {
        const cookies = await this.page.context().cookies();
        if (cookieName) {
            return cookies.find(c => c.name === cookieName);
        }
        return cookies;
    }

    /**
     * Delete cookie
     */
    public async deleteCookie(cookieName: string): Promise<void> {
        const cookies = await this.page.context().cookies();
        await this.page.context().clearCookies();
        const remaining = cookies.filter(c => c.name !== cookieName);
        if (remaining.length > 0) {
            await this.page.context().addCookies(remaining);
        }
    }

    // ============ Alerts ============

    /**
     * Check if alert is open
     */
    public async isAlertOpen(): Promise<boolean> {
        // This requires setting up a dialog handler
        // Placeholder for now
        return false;
    }

    /**
     * Accept alert
     */
    public async alertAccept(): Promise<void> {
        this.page.on('dialog', async dialog => {
            await dialog.accept();
        });
    }

    /**
     * Dismiss alert
     */
    public async alertDismiss(): Promise<void> {
        this.page.on('dialog', async dialog => {
            await dialog.dismiss();
        });
    }

    /**
     * Get alert text
     */
    public async alertText(): Promise<string> {
        let text = '';
        this.page.on('dialog', async dialog => {
            text = dialog.message();
        });
        return text;
    }

    // ============ JavaScript ============

    /**
     * Execute JavaScript - wraps Playwright page.evaluate()
     */
    public async execute(fn: (...args: unknown[]) => unknown, ...args: unknown[]): Promise<unknown> {
        return this.page.evaluate(fn, ...args);
    }

    /**
     * Execute async JavaScript - wraps Playwright page.evaluateHandle()
     */
    public async executeAsync(fn: (...args: unknown[]) => unknown, ...args: unknown[]): Promise<unknown> {
        return this.page.evaluate(async (...args: unknown[]) => {
            // Call the function and return result
            const result = await fn(...args);
            return result;
        }, ...args);
    }

    // ============ Screenshot ============

    /**
     * Take screenshot
     */
    public async makeScreenshot(): Promise<Buffer | string> {
        return this.page.screenshot();
    }

    // ============ Drag & Drop ============

    /**
     * Drag and drop
     */
    public async dragAndDrop(
        sourceSelector: string | ElementPathProxy,
        targetSelector: string | ElementPathProxy
    ): Promise<void> {
        const source = this.toLocator(sourceSelector);
        const target = this.toLocator(targetSelector);
        await source.dragTo(target);
    }

    // ============ Select ============

    /**
     * Select by index
     */
    public async selectByIndex(selector: string | ElementPathProxy, value: number): Promise<string[]> {
        const locator = this.toLocator(selector);
        return locator.selectOption({ index: value });
    }

    /**
     * Select by value
     */
    public async selectByValue(selector: string | ElementPathProxy, value: string): Promise<string[]> {
        const locator = this.toLocator(selector);
        return locator.selectOption({ value });
    }

    /**
     * Select by visible text
     */
    public async selectByVisibleText(selector: string | ElementPathProxy, text: string): Promise<string[]> {
        const locator = this.toLocator(selector);
        return locator.selectOption({ label: text });
    }

    // ============ Scroll ============

    /**
     * Scroll element into view
     */
    public async scrollIntoView(selector: string | ElementPathProxy): Promise<void> {
        const locator = this.toLocator(selector);
        await locator.scrollIntoViewIfNeeded();
    }

    /**
     * Scroll to position
     */
    public async scroll(selector: string | ElementPathProxy, _x: number, _y: number): Promise<void> {
        const locator = this.toLocator(selector);
        await locator.evaluate((el) => {
            el.scrollLeft = 0;
            el.scrollTop = 0;
        });
    }

    // ============ HTML ============

    /**
     * Get element HTML
     */
    public async getHTML(selector: string | ElementPathProxy, includeOuter?: boolean): Promise<string> {
        const locator = this.toLocator(selector);
        return locator.evaluate((el, includeOuter) => {
            return includeOuter ? el.outerHTML : el.innerHTML;
        }, includeOuter);
    }

    // ============ Elements ============

    /**
     * Get all matching elements
     */
    public async elements(selector: string | ElementPathProxy): Promise<Locator> {
        return this.toLocator(selector);
    }

    // ============ Utility ============

    /**
     * Pause execution (for debugging)
     */
    public async pause(timeout: number): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, timeout));
    }

    /**
     * Upload file to input element
     */
    public async uploadFile(selector: string | ElementPathProxy, fullPath: string): Promise<void> {
        const locator = this.toLocator(selector);
        await locator.setInputFiles(fullPath);
    }

    // ============ Additional Missing Methods ============

    /**
     * Get count of matching elements
     */
    public async getElementsCount(selector: string | ElementPathProxy): Promise<number> {
        const locator = this.toLocator(selector);
        return locator.count();
    }

    /**
     * Get page source HTML
     */
    public async getSource(): Promise<string> {
        return this.page.content();
    }

    /**
     * Wait until condition is met
     */
    public async waitUntil(
        condition: () => Promise<boolean>,
        timeout: number = 30000,
        timeoutMsg?: string,
        interval: number = 500
    ): Promise<void> {
        const startTime = Date.now();
        while (true) {
            if (Date.now() - startTime > timeout) {
                throw new Error(timeoutMsg || `waitUntil timeout after ${timeout}ms`);
            }
            const result = await condition();
            if (result) return;
            await new Promise(resolve => setTimeout(resolve, interval));
        }
    }

    /**
     * Get element size (bounding box)
     */
    public async getSize(selector: string | ElementPathProxy): Promise<{ width: number; height: number }> {
        const locator = this.toLocator(selector);
        const box = await locator.boundingBox();
        return box || { width: 0, height: 0 };
    }

    /**
     * Get CSS property value
     */
    public async getCssProperty(selector: string | ElementPathProxy, propertyName: string): Promise<string> {
        const locator = this.toLocator(selector);
        return locator.evaluate((el, prop) => {
            return window.getComputedStyle(el).getPropertyValue(prop);
        }, propertyName);
    }

    /**
     * Check if element is clickable (visible and enabled)
     */
    public async isClickable(selector: string | ElementPathProxy): Promise<boolean> {
        const locator = this.toLocator(selector);
        try {
            await locator.click({ trial: true });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Check if element is disabled
     */
    public async isDisabled(selector: string | ElementPathProxy): Promise<boolean> {
        const locator = this.toLocator(selector);
        const isEnabled = await locator.isEnabled();
        return !isEnabled;
    }

    /**
     * Scroll element into view if needed
     */
    public async scrollIntoViewIfNeeded(selector: string | ElementPathProxy): Promise<void> {
        const locator = this.toLocator(selector);
        await locator.scrollIntoViewIfNeeded();
    }

    /**
     * Select by attribute value
     */
    public async selectByAttribute(selector: string | ElementPathProxy, attribute: string, value: string): Promise<string[]> {
        const locator = this.toLocator(selector);
        return locator.selectOption({ [attribute]: value });
    }

    /**
     * Wait for element to be enabled
     */
    public async waitForEnabled(selector: string | ElementPathProxy, timeout?: number): Promise<void> {
        const locator = this.toLocator(selector);
        const opts: { state?: 'attached' | 'detached' | 'visible' | 'hidden'; timeout?: number } = { state: 'visible' };
        if (timeout !== undefined) {
            opts.timeout = timeout;
        }
        await locator.waitFor(opts);
        if (!(await locator.isEnabled())) {
            throw new Error(`Element ${selector} is not enabled`);
        }
    }

    /**
     * Wait for element to have a specific value
     */
    public async waitForValue(selector: string | ElementPathProxy, value: string, timeout?: number): Promise<void> {
        const locator = this.toLocator(selector);
        const opts: { state?: 'attached' | 'detached' | 'visible' | 'hidden'; timeout?: number } = { state: 'attached' };
        if (timeout !== undefined) {
            opts.timeout = timeout;
        }
        await locator.waitFor(opts);
        
        // Poll until value matches
        const startTime = Date.now();
        const timeoutMs = timeout || 30000;
        while (Date.now() - startTime < timeoutMs) {
            const currentValue = await locator.inputValue();
            if (currentValue === value) return;
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        throw new Error(`Element ${selector} did not have value "${value}" within ${timeoutMs}ms`);
    }

    /**
     * Get all window/tab handles
     */
    public async windowHandles(): Promise<string[]> {
        const pages = this.page.context().pages();
        return pages.map((_, i) => String(i));
    }

    /**
     * Get the active element
     */
    public async getActiveElement(): Promise<string> {
        return this.page.evaluate(() => {
            const el = document.activeElement;
            return el ? el.tagName.toLowerCase() : '';
        });
    }

    /**
     * Check if element is focused
     */
    public async isFocused(selector: string | ElementPathProxy): Promise<boolean> {
        const locator = this.toLocator(selector);
        return this.page.evaluate((el) => {
            return document.activeElement === el;
        }, await locator.elementHandle());
    }

    /**
     * Get element tag name
     */
    public async getTagName(selector: string | ElementPathProxy): Promise<string> {
        const locator = this.toLocator(selector);
        return locator.evaluate((el) => el.tagName.toLowerCase());
    }

    /**
     * Close the application
     */
    public async end(): Promise<void> {
        await this.page.context().browser()?.close();
    }

    /**
     * Get the underlying Playwright page
     * Useful for advanced operations not covered by this wrapper
     */
    public getPage(): Page {
        return this.page;
    }

    /**
     * Get the Playwright context
     */
    public getContext(): BrowserContext {
        return this.page.context();
    }

    /**
     * Get test UID
     */
    public getTestUID(): string {
        return this.testUID;
    }

    /**
     * Get transport
     */
    public getTransport(): ITransport {
        return this.transport;
    }
}

export default WebApplicationSimplified;
