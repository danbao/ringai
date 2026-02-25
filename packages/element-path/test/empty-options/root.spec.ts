import {expect} from 'vitest';
import {createElementPath} from '../../src';
import {
    getDescriptor,
    getPrivateDescriptor,
    checkAccessMethods,
    checkPreventExtensions,
    checkProperty,
} from '../utils';

describe('empty options ElementPath root', () => {
    const empty = createElementPath();

    describe('basic Object methods', () => {
        it('.toString()', () => {
            expect(empty.toString()).toBe(
                "(//*[@data-test-automation-id='root'])[1]",
            );
        });

        it('to string converting', () => {
            expect(`${empty}`).toBe(
                "(//*[@data-test-automation-id='root'])[1]",
            );
        });

        it('.toString(true)', () => {
            expect(empty.toString(true)).toBe(
                "//*[@data-test-automation-id='root']",
            );
        });

        checkAccessMethods(empty);
    });

    describe('preventExtensions traps', () => {
        checkPreventExtensions(empty);
    });

    // Enum Property check
    describe('.__path property traps', () => {
        checkProperty({
            object: empty,
            key: '__path',
            valueDescriptor: getDescriptor([
                {
                    isRoot: true,
                    name: 'root',
                    xpath: "//*[@data-test-automation-id='root']",
                },
            ]),
        });
    });
    describe('.__flows property traps', () => {
        checkProperty({
            object: empty,
            key: '__flows',
            valueDescriptor: getDescriptor({}),
        });
    });

    // Private property check
    describe('.__searchOptions property traps', () => {
        checkProperty({
            object: empty,
            key: '__searchOptions',
            valueDescriptor: getPrivateDescriptor({
                exactKey: 'root',
            }),
        });
    });
    describe('.__parentPath property traps', () => {
        checkProperty({
            object: empty,
            key: '__parentPath',
            valueDescriptor: getPrivateDescriptor(null),
        });
    });

    describe('.__getReversedChain() call', () => {
        it('with root', () => {
            expect(empty.__getReversedChain()).toBe('root');
        });
        it('without root', () => {
            expect(empty.__getReversedChain(false)).toBe('');
        });
    });

    describe('.__getChildType() call', () => {
        it('return type check', () => {
            expect(typeof empty.__getChildType()).toBe('string');
        });
        it('return value check', () => {
            expect(empty.__getChildType()).toBe('root');
        });
    });
});
