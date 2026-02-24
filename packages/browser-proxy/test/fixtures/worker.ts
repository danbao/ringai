import * as path from 'path';
import {Transport} from '@ringai/transport';
import {BrowserProxy} from '../../src/browser-proxy/browser-proxy';

const pluginName = path.resolve(__dirname, './sync-plugin.cjs');
const pluginConfig = {};

new BrowserProxy(new Transport(), pluginName, pluginConfig);
