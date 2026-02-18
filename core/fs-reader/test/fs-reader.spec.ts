/* eslint no-unused-expressions: 0 */


import * as path from 'path';
import * as chai from 'chai';
import {FSReader} from '../src/fs-reader';

const glob = path.resolve(__dirname, './fixtures/testfiles/**/**/*.test.js');
const falseGlob = path.resolve(
    __dirname,
    './fixtures/testfiles/**/**/*.spec.ts',
);

describe('TestsFinder', () => {
    it('should throw error if no path passed', () => new Promise<void>((resolve, reject) => {
        const fsReader = new FSReader();

        fsReader
            .find(undefined as any)
            .then(() => {
                reject("it didn't throw");
            })
            .catch(() => {
                resolve();
            });
    }));

    it('should throw error if no files to passed glob', () => new Promise<void>((resolve, reject) => {
        const fsReader = new FSReader();

        fsReader
            .find(falseGlob)
            .then(() => {
                reject("it didn't throw");
            })
            .catch(() => {
                resolve();
            });
    }));

    it('should resolve files from glob', async () => {
        const fsReader = new FSReader();
        const tests = await fsReader.find(glob);

        chai.expect(tests).to.be.an('array').that.not.empty;
    });
});
