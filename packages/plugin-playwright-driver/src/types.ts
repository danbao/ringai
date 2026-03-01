import { LaunchOptions, BrowserContextOptions } from 'playwright';

export interface PlaywrightPluginConfig {
    /**
     * Browser type to use: 'chromium', 'firefox', or 'webkit'
     */
    browserName?: 'chromium' | 'firefox' | 'webkit' | 'msedge';
    
    /**
     * Launch options for the browser
     */
    launchOptions?: LaunchOptions;
    
    /**
     * Context options for browser context
     */
    contextOptions?: BrowserContextOptions;
    
    /**
     * Client check interval in milliseconds
     */
    clientCheckInterval?: number;
    
    /**
     * Client timeout in milliseconds
     */
    clientTimeout?: number;
    
    /**
     * Disable client ping
     */
    disableClientPing?: boolean;
    
    /**
     * Delay after session close in milliseconds
     */
    delayAfterSessionClose?: number;
    
    /**
     * Worker limit
     */
    workerLimit?: number | 'local';
    
    /**
     * Enable coverage collection
     */
    coverage?: boolean;
    
    /**
     * Enable video recording
     */
    video?: boolean;
    
    /**
     * Video directory path
     */
    videoDir?: string;
    
    /**
     * Enable trace recording
     */
    trace?: boolean;
    
    /**
     * Trace directory path
     */
    traceDir?: string;

    /**
     * CDP endpoint URL for connecting to an existing browser via Chrome DevTools Protocol.
     * When set, the plugin connects to this endpoint instead of launching a new browser.
     */
    cdpEndpoint?: string;

    /**
     * When connecting via CDP, set to true to enable file system optimizations
     * for local CDP targets (Playwright 1.58+).
     */
    cdpIsLocal?: boolean;
}

export interface BrowserClientItem {
    context: any;
    page: any;
    initTime: number;
    coverage: any;
    currentFrame?: any;
    lastElementsSelector?: string;
    lastElementsCount?: number;
    elementIdToSelector?: Map<string, { selector: string; index: number }>;
}