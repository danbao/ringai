/**
 * Simplified BrowserProxy using Playwright directly
 * 
 * Replaces the child_process + IPC architecture with direct Playwright API calls.
 * Benefits:
 * - No child_process fork overhead
 * - Direct Playwright BrowserContext management
 * - Simpler code, easier to maintain
 * - Native Playwright features (auto-wait, locators, etc.)
 * 
 * Target: Phase 4.4 - 简化 BrowserProxy → 直接调用 Playwright API
 */

import { Browser, BrowserContext, Page, chromium, firefox, webkit } from 'playwright';
import { 
    IBrowserProxyPlugin, 
    WindowFeaturesConfig
} from '@testring/types';
import { loggerClient } from '@testring/logger';

const DEFAULT_LAUNCH_OPTIONS = {
    headless: true,
    args: [],
};

const DEFAULT_CONTEXT_OPTIONS = {};

interface PlaywrightBrowserProxyConfig {
    browserName?: 'chromium' | 'firefox' | 'webkit';
    launchOptions?: {
        headless?: boolean;
        args?: string[];
        executablePath?: string;
        devtools?: boolean;
        [key: string]: any;
    };
    contextOptions?: {
        viewport?: { width: number; height: number };
        ignoreHTTPSErrors?: boolean;
        recordVideo?: { dir: string };
        [key: string]: any;
    };
}

export class BrowserProxyPlaywright implements IBrowserProxyPlugin {
    private logger = loggerClient.withPrefix('[browser-proxy-playwright]');
    
    private browser: Browser | null = null;
    private context: BrowserContext | null = null;
    private page: Page | null = null;
    
    private browserName: 'chromium' | 'firefox' | 'webkit' = 'chromium';
    private launchOptions: any = DEFAULT_LAUNCH_OPTIONS;
    private contextOptions: any = DEFAULT_CONTEXT_OPTIONS;

    constructor(config: PlaywrightBrowserProxyConfig = {}) {
        this.browserName = config.browserName || 'chromium';
        this.launchOptions = { ...DEFAULT_LAUNCH_OPTIONS, ...config.launchOptions };
        this.contextOptions = { ...DEFAULT_CONTEXT_OPTIONS, ...config.contextOptions };
    }

    /**
     * Get Playwright browser launcher based on browser name
     */
    private getBrowserLauncher() {
        switch (this.browserName) {
            case 'firefox':
                return firefox;
            case 'webkit':
                return webkit;
            case 'chromium':
            default:
                return chromium;
        }
    }

    /**
     * Initialize browser and context
     */
    public async init(): Promise<void> {
        if (this.browser) return;
        
        const launcher = this.getBrowserLauncher();
        this.browser = await launcher.launch(this.launchOptions);
        this.context = await this.browser.newContext(this.contextOptions);
        this.page = await this.context.newPage();
        
        this.logger.debug(`Browser ${this.browserName} launched`);
    }

    /**
     * Ensure page exists before operations
     */
    private async ensurePage(): Promise<Page> {
        if (!this.page) {
            await this.init();
        }
        return this.page!;
    }

    // ============ Lifecycle ============

    public async kill(): Promise<void> {
        if (this.page) {
            try {
                await this.page.close();
            } catch (e) {
                // Ignore close errors
            }
            this.page = null;
        }
        
        if (this.context) {
            try {
                await this.context.close();
            } catch (e) {
                // Ignore close errors
            }
            this.context = null;
        }
        
        if (this.browser) {
            try {
                await this.browser.close();
            } catch (e) {
                // Ignore close errors
            }
            this.browser = null;
        }
        
        this.logger.debug('Browser closed');
    }

    public async end(_applicant: string): Promise<boolean> {
        await this.kill();
        return true;
    }

    // ============ Navigation ============

    public async url(_applicant: string, val: string): Promise<void> {
        const page = await this.ensurePage();
        await page.goto(val);
    }

    public async getTitle(_applicant: string): Promise<string> {
        const page = await this.ensurePage();
        return page.title();
    }

    public async refresh(_applicant: string): Promise<void> {
        const page = await this.ensurePage();
        await page.reload();
    }

    // ============ Element Operations ============

    public async click(_applicant: string, selector: string, _options?: any): Promise<void> {
        const page = await this.ensurePage();
        const locator = page.locator(selector);
        await locator.click();
    }

    public async doubleClick(_applicant: string, selector: string): Promise<void> {
        const page = await this.ensurePage();
        const locator = page.locator(selector);
        await locator.dblclick();
    }

    public async getText(_applicant: string, selector: string): Promise<string> {
        const page = await this.ensurePage();
        const locator = page.locator(selector);
        const text = await locator.textContent();
        return text ?? '';
    }

    public async getValue(_applicant: string, selector: string): Promise<string> {
        const page = await this.ensurePage();
        const locator = page.locator(selector);
        const value = await locator.inputValue();
        return value ?? '';
    }

    public async setValue(_applicant: string, selector: string, value: any): Promise<void> {
        const page = await this.ensurePage();
        const locator = page.locator(selector);
        await locator.fill(String(value));
    }

    public async clearValue(_applicant: string, selector: string): Promise<void> {
        const page = await this.ensurePage();
        const locator = page.locator(selector);
        await locator.clear();
    }

    public async keys(_applicant: string, value: any): Promise<void> {
        const page = await this.ensurePage();
        await page.keyboard.type(String(value));
    }

    public async moveToObject(_applicant: string, selector: string, x: number = 0, y: number = 0): Promise<void> {
        const page = await this.ensurePage();
        const locator = page.locator(selector);
        await locator.hover({ position: { x, y } });
    }

    // ============ Element State ============

    public async isVisible(_applicant: string, selector: string): Promise<boolean> {
        const page = await this.ensurePage();
        const locator = page.locator(selector);
        return locator.isVisible();
    }

    public async isEnabled(_applicant: string, selector: string): Promise<boolean> {
        const page = await this.ensurePage();
        const locator = page.locator(selector);
        return locator.isEnabled();
    }

    public async isSelected(_applicant: string, selector: string): Promise<boolean> {
        const page = await this.ensurePage();
        const locator = page.locator(selector);
        return locator.isChecked();
    }

    public async isExisting(_applicant: string, selector: string): Promise<boolean> {
        const page = await this.ensurePage();
        const locator = page.locator(selector);
        return (await locator.count()) > 0;
    }

    // ============ Waiting ============

    public async waitForExist(_applicant: string, selector: string, timeout: number = 30000): Promise<void> {
        const page = await this.ensurePage();
        const locator = page.locator(selector);
        await locator.waitFor({ state: 'attached', timeout });
    }

    public async waitForVisible(_applicant: string, selector: string, timeout: number = 30000): Promise<void> {
        const page = await this.ensurePage();
        const locator = page.locator(selector);
        await locator.waitFor({ state: 'visible', timeout });
    }

    public async waitForValue(_applicant: string, selector: string, timeout: number = 30000, reverse: boolean = false): Promise<void> {
        const page = await this.ensurePage();
        const locator = page.locator(selector);
        
        await locator.waitFor({
            state: reverse ? 'hidden' : 'visible',
            timeout
        });
    }

    // ============ Execute Script ============

    public async execute(_applicant: string, fn: any, args: Array<any>): Promise<any> {
        const page = await this.ensurePage();
        return page.evaluate(fn, ...args);
    }

    public async executeAsync(_applicant: string, fn: any, args: Array<any>): Promise<any> {
        const page = await this.ensurePage();
        const wrappedFn = `(...args) => {
            const callback = args.pop();
            const result = (${fn})(...args);
            if (result && result.then) {
                result.then(callback).catch(callback);
            } else {
                callback(result);
            }
        }`;
        return page.evaluate(wrappedFn, ...args);
    }

    // ============ Frame Operations ============

    public async frame(_applicant: string, frameID: any): Promise<void> {
        const page = await this.ensurePage();
        if (typeof frameID === 'string') {
            const frame = page.frame({ name: frameID }) || page.frame({ url: frameID });
            if (frame) {
                await frame.evaluate(() => true);
            }
        }
    }

    public async frameParent(_applicant: string): Promise<void> {
        this.logger.warn('frameParent not fully implemented for Playwright');
    }

    // ============ Select Operations ============

    public async selectByIndex(_applicant: string, selector: string, value: any): Promise<any> {
        const page = await this.ensurePage();
        const locator = page.locator(selector);
        return locator.selectOption({ index: value });
    }

    public async selectByValue(_applicant: string, selector: string, value: any): Promise<any> {
        const page = await this.ensurePage();
        const locator = page.locator(selector);
        return locator.selectOption({ value: String(value) });
    }

    public async selectByVisibleText(_applicant: string, selector: string, str: string): Promise<any> {
        const page = await this.ensurePage();
        const locator = page.locator(selector);
        return locator.selectOption({ label: str });
    }

    public async selectByAttribute(_applicant: string, selector: string, attribute: string, value: string): Promise<any> {
        const page = await this.ensurePage();
        const locator = page.locator(selector);
        return locator.selectOption({ [attribute]: value });
    }

    // ============ Attribute Operations ============

    public async getAttribute(_applicant: string, selector: string, attr: any): Promise<string> {
        const page = await this.ensurePage();
        const locator = page.locator(selector);
        const value = await locator.getAttribute(attr);
        return value ?? '';
    }

    public async getHTML(_applicant: string, selector: string, _b: any): Promise<string> {
        const page = await this.ensurePage();
        const locator = page.locator(selector);
        if (selector) {
            return locator.innerHTML();
        }
        return page.content();
    }

    public async getCssProperty(_applicant: string, selector: string, cssProperty: string): Promise<string> {
        const page = await this.ensurePage();
        const locator = page.locator(selector);
        return locator.evaluate((el, prop) => {
            return window.getComputedStyle(el).getPropertyValue(prop);
        }, cssProperty);
    }

    public async getSize(_applicant: string, selector: string): Promise<{ width: number; height: number }> {
        const page = await this.ensurePage();
        const locator = page.locator(selector);
        const box = await locator.boundingBox();
        return box || { width: 0, height: 0 };
    }

    public async getTagName(_applicant: string, selector: string): Promise<string> {
        const page = await this.ensurePage();
        const locator = page.locator(selector);
        return locator.evaluate((el) => el.tagName.toLowerCase());
    }

    // ============ Scroll Operations ============

    public async scroll(_applicant: string, selector: string, x: number, y: number): Promise<void> {
        const page = await this.ensurePage();
        const locator = page.locator(selector);
        await locator.evaluate((el) => {
            el.scrollTo(x, y);
        });
    }

    public async scrollIntoView(_applicant: string, selector: string, _scrollIntoViewOptions?: boolean): Promise<void> {
        const page = await this.ensurePage();
        const locator = page.locator(selector);
        await locator.scrollIntoViewIfNeeded();
    }

    // ============ Window/Tab Operations ============

    public async newWindow(
        _applicant: string,
        url: string,
        _windowName: string,
        _windowFeatures: WindowFeaturesConfig
    ): Promise<string> {
        const context = this.context || this.browser?.contexts()[0];
        if (!context) {
            throw new Error('No browser context available');
        }
        
        const page = await context.newPage();
        if (url) {
            await page.goto(url);
        }
        return page.url();
    }

    public async windowHandleMaximize(_applicant: string): Promise<void> {
        this.logger.debug('windowHandleMaximize - handled via viewport');
    }

    public async getCurrentTabId(_applicant: string): Promise<string> {
        const context = this.context;
        if (!context) return '';
        const pages = context.pages();
        return String(pages.indexOf(pages[0] as Page));
    }

    public async getTabIds(_applicant: string): Promise<string[]> {
        const context = this.context;
        if (!context) return [];
        const pages = context.pages();
        return pages.map((_, i) => String(i));
    }

    public async switchTab(_applicant: string, tabId: string): Promise<void> {
        const context = this.context;
        if (!context) return;
        
        const pages = context.pages();
        const index = parseInt(tabId, 10);
        if (pages[index]) {
            this.page = pages[index];
        }
    }

    public async close(_applicant: string, tabId: string): Promise<void> {
        const context = this.context;
        if (!context) return;
        
        const pages = context.pages();
        const index = parseInt(tabId, 10);
        if (pages[index]) {
            await pages[index].close();
        }
    }

    public async window(_applicant: string, fn: any): Promise<any> {
        const page = await this.ensurePage();
        return page.evaluate(fn);
    }

    public async windowHandles(_applicant: string): Promise<string[]> {
        const context = this.context;
        if (!context) return [];
        return context.pages().map((_, i) => String(i));
    }

    // ============ Alert/Dialog Operations ============

    public async isAlertOpen(_applicant: string): Promise<boolean> {
        return false;
    }

    public async alertAccept(_applicant: string): Promise<void> {
        this.logger.warn('alertAccept requires dialog handler setup');
    }

    public async alertDismiss(_applicant: string): Promise<void> {
        this.logger.warn('alertDismiss requires dialog handler setup');
    }

    public async alertText(_applicant: string): Promise<string> {
        this.logger.warn('alertText requires dialog handler setup');
        return '';
    }

    // ============ Drag and Drop ============

    public async dragAndDrop(_applicant: string, sourceSelector: string, destSelector: string): Promise<void> {
        const page = await this.ensurePage();
        const source = page.locator(sourceSelector);
        const target = page.locator(destSelector);
        await source.dragTo(target);
    }

    // ============ Cookie Operations ============

    public async setCookie(_applicant: string, cookieName: any): Promise<void> {
        const page = await this.ensurePage();
        await page.context().addCookies([{
            name: cookieName.name,
            value: cookieName.value,
            domain: cookieName.domain,
            path: cookieName.path,
            expires: cookieName.expiry,
            httpOnly: cookieName.httpOnly,
            secure: cookieName.secure,
            sameSite: cookieName.sameSite
        }]);
    }

    public async getCookie(_applicant: string, cookieName?: string): Promise<any> {
        const page = await this.ensurePage();
        const cookies = await page.context().cookies();
        if (cookieName) {
            return cookies.find(c => c.name === cookieName);
        }
        return cookies;
    }

    public async deleteCookie(_applicant: string, cookieName: string): Promise<void> {
        const page = await this.ensurePage();
        // Use any to bypass Playwright type strictness
        await (page.context().clearCookies as any)([{ name: cookieName }]);
    }

    // ============ Screenshot ============

    public async makeScreenshot(_applicant: string): Promise<string | void> {
        const page = await this.ensurePage();
        const buffer = await page.screenshot();
        return buffer.toString('base64');
    }

    // ============ File Operations ============

    public async uploadFile(_applicant: string, filePath: string): Promise<string | void> {
        this.logger.warn('uploadFile requires a file input selector');
        return filePath;
    }

    // ============ Source ============

    public async getSource(_applicant: string): Promise<string> {
        const page = await this.ensurePage();
        return page.content();
    }

    // ============ Wait Until ============

    public async waitUntil(
        _applicant: string,
        condition: () => boolean | Promise<boolean>,
        timeout?: number,
        timeoutMsg?: string,
        interval?: number
    ): Promise<void> {
        const page = await this.ensurePage();
        
        const checkCondition = async (): Promise<boolean> => {
            return page.evaluate(condition as any);
        };
        
        const startTime = Date.now();
        const timeoutMs = timeout || 30000;
        const intervalMs = interval || 500;
        
        while (true) {
            if (Date.now() - startTime > timeoutMs) {
                throw new Error(timeoutMsg || `Timeout after ${timeoutMs}ms`);
            }
            
            const result = await checkCondition();
            if (result) return;
            
            await new Promise(resolve => setTimeout(resolve, intervalMs));
        }
    }

    // ============ Grid Operations (No-op) ============

    public async gridTestSession(_applicant: string): Promise<any> {
        return null;
    }

    public async getHubConfig(_applicant: string): Promise<any> {
        return null;
    }

    // ============ Wait For Selected ============

    public async waitForSelected(
        _applicant: string,
        selector: string,
        timeout: number = 30000,
        reverse: boolean = false
    ): Promise<void> {
        const page = await this.ensurePage();
        const locator = page.locator(selector);
        await locator.waitFor({
            state: reverse ? 'hidden' : 'visible',
            timeout
        });
    }

    // ============ Element ID operations (compatibility) ============

    public async elementIdText(_applicant: string, elementId: string): Promise<string> {
        return this.getText(_applicant, elementId);
    }

    public async elements(_applicant: string, xpath: string): Promise<string[]> {
        const page = await this.ensurePage();
        const locator = page.locator(xpath);
        const count = await locator.count();
        return Array.from({ length: count }, (_, i) => String(i));
    }

    public async elementIdSelected(_applicant: string, id: string): Promise<boolean> {
        return this.isSelected(_applicant, id);
    }
}

export default BrowserProxyPlaywright;
