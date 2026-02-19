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
}

export interface BrowserClientItem {
    context: any;
    page: any;
    initTime: number;
    coverage: any;
    currentFrame?: any;
}