
import {expect} from 'vitest';
import {default as babelPlugin} from '../src';
import {PluginAPIMock} from './plugin-api.mock';

const DEFAULT_FILENAME = 'filename.js';
const DEFAULT_INPUT = `
() => {
  console.log(1);
};`.trim();
const TRANSFORMED_INPUT = `
() => {
  console.log(1);
};`.trim();

const REQUIRE_CODE = `
import { data } from 'somewhere';
console.log(data);
`.trim();
const REQUIRE_OUTPUT = `
var _somewhere = require("somewhere");
console.log(_somewhere.data);
`.trim();

describe('babelPlugin', () => {
    it('should not convert code, if there is no config', async () => {
        const pluginAPIMock = new PluginAPIMock();

        babelPlugin(pluginAPIMock as never, null);

        const testWorkerMock = pluginAPIMock.$getLastTestWorker();
        const result = await testWorkerMock.$compile(
            DEFAULT_INPUT,
            DEFAULT_FILENAME,
        );

        expect(result).toBe(TRANSFORMED_INPUT);
    });

    it('should convert code with given preset', async () => {
        const pluginAPIMock = new PluginAPIMock();

        babelPlugin(pluginAPIMock as never, {});

        const testWorkerMock = pluginAPIMock.$getLastTestWorker();
        const result = await testWorkerMock.$compile(
            DEFAULT_INPUT,
            DEFAULT_FILENAME,
        );

        expect(result).toBe(TRANSFORMED_INPUT);
    });

    it('import convert check', async () => {
        const pluginAPIMock = new PluginAPIMock();

        babelPlugin(pluginAPIMock as never, {});

        const testWorkerMock = pluginAPIMock.$getLastTestWorker();
        const result = await testWorkerMock.$compile(
            REQUIRE_CODE,
            DEFAULT_FILENAME,
        );

        expect(result).toBe(REQUIRE_OUTPUT);
    });
});
