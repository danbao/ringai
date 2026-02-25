
import {describe, it, expect} from 'vitest';
import {getArguments} from '../src/arguments-parser';

describe('argument parser', () => {
    it('should correctly work without argv', () => {
        const args = getArguments(undefined as any);

        expect(args).toBe(null);
    });

    it('should correctly get empty arguments array', () => {
        const args = getArguments([]);

        expect(args).toEqual({});
    });

    it('should correctly parse user arguments', () => {
        const customConfigPath = './customConfig.json';
        const customTestsPath = './tests/**/*.test.js';
        const pluginsSet = ['plugin1', 'plugin2', 'plugin3'];
        const customFieldSet = '#P0,#P1,#P2';
        const customField = '#P0';

        const argv = [
            '',
            // boolean
            '--debug',
            // value with assign
            `--config=${customConfigPath}`,
            `--plugins=${pluginsSet[0]}`,
            `--plugins=${pluginsSet[1]}`,
            `--plugins=${pluginsSet[2]}`,
            // value without assign
            '--tests',
            customTestsPath,
            '--custom-field',
            customFieldSet,
            '--my-namespaced.custom-field',
            customFieldSet,
            '--my-namespaced.second-custom-field',
            customField,
        ];

        const args = getArguments(argv);
        const expected = {
            debug: true,
            config: customConfigPath,
            tests: customTestsPath,
            plugins: pluginsSet,
            customField: customFieldSet,
            /* are the following needed ??? - looks like undocumented feature for early version
            // myNamespacedCustomField: customFieldSet,
            // myNamespacedSecondCustomField: customField,
            */
            myNamespaced: {
                customField: customFieldSet,
                secondCustomField: customField,
            },
        };

        expect(args).toEqual(expected);
    });
});
