
import {expect} from 'vitest';
import {getFormattedString} from '../src/utils';

describe('utils', () => {
    it('should return the "UNKNOWN_OBJECT" if all serialize methods are overloaded', () => {
        const object = {
            toFormattedString: undefined,
            toString: null,
        };

        expect(getFormattedString(object)).toBe('UNKNOWN_OBJECT');
    });

    it('should return the "undefined" if undefined is passed', () => {
        expect(getFormattedString(undefined)).toBe('undefined');
    });

    it('should return the "null" if null is passed', () => {
        expect(getFormattedString(null)).toBe('null');
    });

    it('should return the same string if Symbol is passed', () => {
        const symbol = Symbol('@symbol');

        expect(getFormattedString(symbol)).toBe('Symbol(@symbol)');
    });

    it('should return [object Object] if called from Object', () => {
        expect(getFormattedString({})).toBe('[object Object]');
    });

    it('should return empty string if called from empty Array', () => {
        expect(getFormattedString([])).toBe('');
    });

    it('should return concatenated string if called from Array', () => {
        expect(getFormattedString([1, 2, 3])).toBe('1,2,3');
    });

    it('should return toString method call result', () => {
        class Dummy {
            private value: string;

            constructor(value: string) {
                this.value = value;
            }

            toString() {
                return this.value;
            }
        }

        expect(getFormattedString(new Dummy('foo'))).toBe('foo');
    });

    it('should return toString property call result', () => {
        const object = {
            toString: () => 'bar',
        };

        expect(getFormattedString(object)).toBe('bar');
    });

    it('should return toFormattedString method call result', () => {
        class Dummy {
            private value: string;

            constructor(value: string) {
                this.value = value;
            }

            toFormattedString() {
                return `formatted ${this.value}`;
            }

            toString() {
                return this.value;
            }
        }

        expect(getFormattedString(new Dummy('foo'))).toBe(
            'formatted foo',
        );
    });

    it('should return toFormattedString property call result', () => {
        const object = {
            value: 'bar',

            toFormattedString() {
                return `formatted ${this.value}`;
            },

            toString: () => 'test',
        };

        expect(getFormattedString(object)).toBe('formatted bar');
    });
});
