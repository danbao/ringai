
import * as path from 'path';
import * as chai from 'chai';
import {requirePlugin} from '../src/plugin-require';

describe('requirePlugin', () => {
    it('should resolve npm modules', () => {
        const plugin = requirePlugin<Record<string, unknown>>('@ringai/types');

        chai.expect(typeof plugin).to.equal('object');
        chai.expect(plugin).to.have.property('TestStatus');
    });

    it('should resolve local node modules', () => {
        const plugin = requirePlugin(
            path.resolve(__dirname, './fixtures/node-export.cjs'),
        );

        chai.expect(plugin).to.be.equal('test');
    });

    it('should resolve local babel-style node modules', () => {
        const plugin = requirePlugin(
            path.resolve(__dirname, './fixtures/babel-export.cjs'),
        );

        chai.expect(plugin).to.be.equal('test');
    });
});
