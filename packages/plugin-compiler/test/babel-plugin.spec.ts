
import {expect} from 'vitest';
import {default as compilerPlugin} from '../src';
import {PluginAPIMock} from './plugin-api.mock';

const DEFAULT_FILENAME = 'filename.js';
const DEFAULT_INPUT = `
() => {
  console.log(1);
};`.trim();

const REQUIRE_CODE = `
import { data } from 'somewhere';
console.log(data);
`.trim();

describe('compilerPlugin', () => {
    it('should pass through code that needs no transform', async () => {
        const pluginAPIMock = new PluginAPIMock();

        compilerPlugin(pluginAPIMock as never);

        const testWorkerMock = pluginAPIMock.$getLastTestWorker();
        const result = await testWorkerMock.$compile(
            DEFAULT_INPUT,
            DEFAULT_FILENAME,
        );

        expect(result).toContain('console.log(1)');
    });

    it('should convert ESM import to CJS require', async () => {
        const pluginAPIMock = new PluginAPIMock();

        compilerPlugin(pluginAPIMock as never, {});

        const testWorkerMock = pluginAPIMock.$getLastTestWorker();
        const result = await testWorkerMock.$compile(
            REQUIRE_CODE,
            DEFAULT_FILENAME,
        );

        expect(result).toContain('require("somewhere")');
        expect(result).toContain('console.log(');
        expect(result).not.toMatch(/\bimport\b.*\bfrom\b/);
    });

    it('should handle TypeScript files', async () => {
        const pluginAPIMock = new PluginAPIMock();

        compilerPlugin(pluginAPIMock as never, {});

        const testWorkerMock = pluginAPIMock.$getLastTestWorker();
        const result = await testWorkerMock.$compile(
            'const x: number = 1; export default x;',
            'test.ts',
        );

        expect(result).toContain('const x = 1');
        expect(result).not.toContain(': number');
    });
});
