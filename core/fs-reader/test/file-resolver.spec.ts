/* eslint no-unused-expressions: 0 */

import * as path from 'path';
import {describe, it, expect} from 'vitest';

import {resolveFiles} from '../src/file-resolver';

const testPaths = [
    path.resolve(__dirname, './fixtures/testfiles/foo.test.js'),
    path.resolve(__dirname, './fixtures/testfiles/bar.test.js'),
    path.resolve(__dirname, './fixtures/testfiles/sub/baz.test.js'),
];

const falsePaths = [
    path.resolve(__dirname, './fixtures/testfiles/_FOO.test.js'),
    path.resolve(__dirname, './fixtures/testfiles/_BAR.test.js'),
    path.resolve(__dirname, './fixtures/testfiles/_BAZ.test.js'),
];

describe('resolve tests', () => {
    it('should throw error if no argument passed', () => new Promise<void>((resolve, reject) => {
        resolveFiles(undefined as any)
            .then(() => {
                reject("resolveTests did't throw");
            })
            .catch(() => {
                resolve();
            });
    }));

    it('should throw error if empty array passed', () => new Promise<void>((resolve, reject) => {
        resolveFiles([])
            .then(() => {
                reject("resolveTests did't throw");
            })
            .catch(() => {
                resolve();
            });
    }));

    it('should resolve array of objects that contain ', async () => {
        const res = await resolveFiles(testPaths);

        res.forEach((file) => {
            expect(file).toHaveProperty('path');
            expect(file).toHaveProperty('content');
        });
    });

    it('should resolve array of same length for array of valid files', async () => {
        const result = await resolveFiles(testPaths);
        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(testPaths.length);
    });

    it('should resolve only existing files', async () => {
        const files = [...testPaths, ...falsePaths];
        const resolvedTests = await resolveFiles(files);

        expect(Array.isArray(resolvedTests)).toBe(true);
        expect(resolvedTests).toHaveLength(testPaths.length);
    });

    it('should throw error if none of files passed to it was read', () => new Promise<void>((resolve, reject) => {
        resolveFiles(falsePaths)
            .then(() => {
                reject("resolveTests did't throw");
            })
            .catch(() => {
                resolve();
            });
    }));
});
