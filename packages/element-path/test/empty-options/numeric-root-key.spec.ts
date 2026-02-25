import {expect} from 'vitest';
import {createElementPath} from '../../src';

describe('empty options ElementPath root[0]', () => {
    const empty = createElementPath();

    it('error handling for root numeric path', () => {
        const getter = () => empty[0];
        expect(getter).toThrow('Root Element is not enumerable');
    });

    it('error handling for root string numeric path', () => {
        const getter = () => empty['0'];
        expect(getter).toThrow('Root Element is not enumerable');
    });
});
