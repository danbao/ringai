/* eslint no-unused-expressions: 0 */

import {describe, it, expect} from 'vitest';

import {locateFiles} from '../src/file-locator';

const exactTestPath = './core/fs-reader/test/fixtures/testfiles/foo.test.js';
const globTestPath = './core/fs-reader/test/fixtures/testfiles/**/**/*.test.js';
const falseGlobTestPath = './core/fs-reader/test/fixtures/testfiles/**/**/*.spec.js';
const excludedPath = './core/fs-reader/test/fixtures/testfiles/qux.js';

describe('testFilesLocator', () => {
    it('should return empty set if no searchpath passed', async () => {
        const result = await locateFiles(undefined as any);
        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(0);
    });

    it('should return empty set if empty string passed as searchpath', async () => {
        const result = await locateFiles('');
        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(0);
    });

    it('should return empty set if no files resolved by glob', async () => {
        const result = await locateFiles(falseGlobTestPath);
        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(0);
    });

    it('should return array of length 1 if searchpath references to exact file', async () => {
        const result = await locateFiles(exactTestPath);
        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(1);
    });

    it('should return array of length 3 if passed glob searchpath', async () => {
        const result = await locateFiles(globTestPath);
        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(3);
    });

    it("should not contain files that doesn't match glob searchpath", async () => {
        expect(await locateFiles(globTestPath)).not.toContain(
            excludedPath,
        );
    });
});
