
import * as path from 'path';
import {describe, it, expect} from 'vitest';
import {requirePlugin} from '../src/plugin-require';

describe('requirePlugin', () => {
    it('should resolve npm modules', async () => {
        const plugin = await requirePlugin<Record<string, unknown>>('@ringai/types');

        expect(typeof plugin).toBe('object');
        expect(plugin).toHaveProperty('TestStatus');
    });

    it('should resolve local node modules', async () => {
        const plugin = await requirePlugin(
            path.resolve(__dirname, './fixtures/node-export.cjs'),
        );

        expect(plugin).toBe('test');
    });

    it('should resolve local babel-style node modules', async () => {
        const plugin = await requirePlugin(
            path.resolve(__dirname, './fixtures/babel-export.cjs'),
        );

        expect(plugin).toBe('test');
    });
});
