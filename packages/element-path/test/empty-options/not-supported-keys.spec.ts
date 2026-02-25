import {expect} from 'vitest';
import {createElementPath} from '../../src';

describe('not supported keys', () => {
    const empty = createElementPath();

    it('get [Symbol]', () => {
        const symbol = Symbol('test');
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(empty[symbol]).toBe(undefined);
    });

    it('.hasOwnProperty [Symbol]', () => {
        const symbol = Symbol('test');
        // eslint-disable-next-line no-prototype-builtins
        expect(empty.hasOwnProperty(symbol)).toBe(false);
    });

    it('Object.hasOwnProperty.call [Symbol]', () => {
        const symbol = Symbol('test');
        expect(Object.hasOwnProperty.call(empty, symbol)).toBe(false);
    });

    it('in [Symbol]', () => {
        const symbol = Symbol('test');
        expect(symbol in empty).toBe(false);
    });

    it('descriptor [Symbol]', () => {
        const symbol = Symbol('test');
        expect(Object.getOwnPropertyDescriptor(empty, symbol)).toBe(
            undefined,
        );
    });
});
