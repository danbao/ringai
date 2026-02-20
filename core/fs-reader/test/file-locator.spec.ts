/* eslint no-unused-expressions: 0 */


import * as chai from 'chai';

import {locateFiles} from '../src/file-locator';

const exactTestPath = './core/fs-reader/test/fixtures/testfiles/foo.test.js';
const globTestPath = './core/fs-reader/test/fixtures/testfiles/**/**/*.test.js';
const falseGlobTestPath = './core/fs-reader/test/fixtures/testfiles/**/**/*.spec.js';
const excludedPath = './core/fs-reader/test/fixtures/testfiles/qux.js';

describe('testFilesLocator', () => {
    it('should return empty set if no searchpath passed', async () => {
        chai.expect(await locateFiles(undefined as any)).to.be.be.an('array')
            .which.is.empty;
    });

    it('should return empty set if empty string passed as searchpath', async () => {
        chai.expect(await locateFiles('')).to.be.be.an('array').which.is.empty;
    });

    it('should return empty set if no files resolved by glob', async () => {
        chai.expect(await locateFiles(falseGlobTestPath)).to.be.be.an('array')
            .which.is.empty;
    });

    it('should return array of length 1 if searchpath references to exact file', async () => {
        chai.expect(await locateFiles(exactTestPath))
            .to.be.an('array')
            .of.length(1);
    });

    it('should return array of length 3 if passed glob searchpath', async () => {
        chai.expect(await locateFiles(globTestPath))
            .to.be.an('array')
            .of.length(3);
    });

    it("should not contain files that doesn't match glob searchpath", async () => {
        chai.expect(await locateFiles(globTestPath)).to.not.include(
            excludedPath,
        );
    });
});
