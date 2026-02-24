import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import {fork} from '@ringai/child-process';
import {ITransport, IChildProcessForkOptions} from '@ringai/types';
import {BrowserProxyController} from './browser-proxy-controller';
import {BrowserProxyPlaywright} from './browser-proxy-playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKER_PATH = path.join(__dirname, './browser-proxy');

/**
 * Create BrowserProxyController using child_process fork (legacy)
 * @deprecated Use createBrowserProxyPlaywright for simplified Playwright-only implementation
 */
const browserProxyControllerFactory = (transport: ITransport) => {
    return new BrowserProxyController(transport, (pluginName, config = {}) => {
        const forkOptions: Partial<IChildProcessForkOptions> = {};

        if (config && config.debug) {
            forkOptions.debug = true;
        }

        return fork(
            WORKER_PATH,
            ['--name', pluginName, '--config', JSON.stringify(config)],
            forkOptions,
        );
    });
};

/**
 * Create a simplified BrowserProxy using Playwright directly
 * 
 * Benefits:
 * - No child_process fork overhead
 * - Direct Playwright BrowserContext management
 * - Simpler architecture, easier to maintain
 * - Native Playwright auto-wait, locators, etc.
 * 
 * @param config Playwright configuration options
 * @returns BrowserProxyPlaywright instance
 */
const createBrowserProxyPlaywright = (config?: {
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
}) => {
    return new BrowserProxyPlaywright(config);
};

export {BrowserProxyController, browserProxyControllerFactory, BrowserProxyPlaywright, createBrowserProxyPlaywright};
