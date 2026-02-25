/* eslint-disable @typescript-eslint/ban-ts-comment */
import {expect} from 'vitest';
import {createElementPath} from '../../src';

describe('flows option function context behavior', () => {
    function getContext(this: any) {
        return this;
    }

    const root = createElementPath({
        flows: {
            foo: {
                getContext,
            },
        },
    });
    const childFoo = root['foo'];
    if (!childFoo) {throw new Error('Element not found');}

    it('Call chidlFoo.getContext()', () => {
        // @ts-ignore
        expect(childFoo.getContext()).toBe(childFoo.__proxy);
        // @ts-ignore
        expect(childFoo.getContext().__getInstance()).toBe(
            childFoo.__getInstance(),
        );
    });

    it('Call childFoo.getContext.apply(obj)', () => {
        const obj = {};
        // @ts-ignore
        expect(childFoo.getContext.apply(obj)).toBe(obj);
    });

    it('Call getContext()', () => {
        // eslint-disable-next-line @typescript-eslint/no-shadow
        const {getContext} = childFoo;
        // @ts-ignore
        expect(getContext()).toBe(undefined);
    });
});
