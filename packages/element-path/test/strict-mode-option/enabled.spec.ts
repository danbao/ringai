/* eslint-disable @typescript-eslint/ban-ts-comment */
import {expect} from 'vitest';
import {createElementPath} from '../../src';

describe('enabled strictMode', () => {
    const empty = createElementPath();

    describe('xpath getter', () => {
        it('call', () => {
            // @ts-ignore
            const error = () => empty.xpath('//testerror');
            expect(error).toThrow('Can not use xpath query in strict mode');
        });
    });
});
