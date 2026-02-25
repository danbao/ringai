/* eslint no-unused-expressions: 0 */

import * as path from 'path';
import {describe, it, expect, beforeAll, afterAll} from 'vitest';
import {FSReader} from '../src/fs-reader';
import process from 'node:process';
import * as fs from 'node:fs';

const runPerformanceTests =
    process.env['PERFORMANCE_TESTS'] === 'true' ||
    process.argv.includes('--performance');
const glob = path.resolve(__dirname, './fixtures/testfiles/**/**/*.test.js');

const writeTestFiles = async (count: number) => {
    const dir = path.resolve(__dirname, './fixtures/testfiles/performance');

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }

    for (let i = 0; i < count; i++) {
        const file = path.resolve(dir, `test${i}.test.js`);
        await fs.promises.writeFile(file, `console.log('test${i}');`);
    }
};

const removeTestFiles = async () => {
    const dir = path.resolve(__dirname, './fixtures/testfiles/performance');

    if (fs.existsSync(dir)) {
        await fs.promises.rm(dir, {recursive: true, force: true});
    }
};

describe('Performance', () => {
    if (!runPerformanceTests) {
        it('Performance tests are disabled. To enable them set PERFORMANCE_TESTS=true environment variable', () => {
            expect(true).toBe(true);
        });
    } else {
        describe('FSReader', () => {
            beforeAll(async () => {
                await writeTestFiles(15000);
            });

            afterAll(async () => {
                await removeTestFiles();
            });

            it('should resolve files from glob up to 5 seconds', async () => {
                const fsReader = new FSReader();
                const start = Date.now();
                const tests = await fsReader.find(glob);
                const end = Date.now();
                const duration = end - start;
                expect(duration).toBeLessThan(5000);
                expect(Array.isArray(tests)).toBe(true);
                expect(tests.length).toBeGreaterThan(0);
                expect(tests).toHaveLength(15003);
            });
        });
    }
});
