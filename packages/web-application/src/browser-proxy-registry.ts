import {IBrowserProxyController} from '@ringai/types';

let instance: IBrowserProxyController | null = null;

export function setBrowserProxy(proxy: IBrowserProxyController): void {
    instance = proxy;
}

export function getBrowserProxy(): IBrowserProxyController {
    if (!instance) {
        throw new Error('BrowserProxyController not initialized. Call setBrowserProxy() first.');
    }
    return instance;
}
