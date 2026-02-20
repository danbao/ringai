import * as yargsHelpers from 'yargs/helpers';
import {transport} from '@testring/transport';
import {BrowserProxy} from './browser-proxy';

const Parser = (yargsHelpers as any).Parser || (yargsHelpers as any).default?.Parser;
const args = Parser(process.argv.slice(2));

const name = args['name'] as string;
const config = JSON.parse(args['config'] as string);

new BrowserProxy(transport, name, config);
