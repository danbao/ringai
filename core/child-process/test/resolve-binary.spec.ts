
import * as chai from 'chai';
import {resolveBinary} from '../src/resolve-binary';

describe('resolveBinary', () => {
    it('should resolve binary correctly', () => {
        const path = resolveBinary('ts-node');

        chai.expect(path).to.include('ts-node');
    });

    it('should throw, if there is no such binary', () => new Promise<void>((resolve, reject) => {
        try {
            const invalidResult = resolveBinary('some-package-without-bin');

            reject(`Resolver found something: ${invalidResult}`);
        } catch (e) {
            chai.expect(e).to.be.instanceof(Error);

            resolve();
        }
    }));

    it("should throw, if package exists, but doesn't have bin", () => new Promise<void>((resolve, reject) => {
        try {
            const invalidResult = resolveBinary('chai');

            reject(`Resolved some bin: ${invalidResult}`);
        } catch (e) {
            chai.expect(e).to.be.instanceof(Error);

            resolve();
        }
    }));
});
