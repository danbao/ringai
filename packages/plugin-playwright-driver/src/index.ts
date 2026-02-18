import * as path from 'path';
import { fileURLToPath } from 'url';
import { PlaywrightPluginConfig } from './types.js';
import { PluginAPI } from '@testring/plugin-api';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function playwrightPlugin(
    pluginAPI: PluginAPI,
    userConfig: PlaywrightPluginConfig,
): void {
    const pluginPath = path.join(__dirname, './plugin');
    const browserProxy = pluginAPI.getBrowserProxy();

    browserProxy.proxyPlugin(pluginPath, userConfig || {});
}