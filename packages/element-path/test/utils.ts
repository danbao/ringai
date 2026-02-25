import {expect} from 'vitest';
import {ElementPath} from '../src/element-path';

export function getDescriptor(value: unknown) {
    return {
        configurable: true,
        enumerable: true,
        value,
        writable: false,
    };
}

export function getPrivateDescriptor(value: unknown) {
    return {
        configurable: true,
        enumerable: false,
        value,
        writable: false,
    };
}

export function checkProperty({object, key, valueDescriptor}: {object: any; key: string | symbol; valueDescriptor: PropertyDescriptor}) {
    const value = valueDescriptor.value;

    it('get', () => {
        expect(object[key]).toEqual(value);
    });

    it('set', () => {
        const fn = () => (object[key] = {});
        expect(fn).toThrow(TypeError);
    });

    it('delete operator', () => {
        const fn = () => delete object[key];
        expect(fn).toThrow(TypeError);
    });

    it('in operator', () => {
        expect(key in object).toBe(true);
    });

    it('.hasOwnProperty()', () => {
        expect(object).toHaveProperty(key);
    });

    it('.getOwnPropertyDescriptor()', () => {
        const descriptor = Object.getOwnPropertyDescriptor(object, key);
        expect(descriptor).toEqual(valueDescriptor);
    });

    it('.defineProperty()', () => {
        const fn = () => Object.defineProperty(object, key, valueDescriptor);
        expect(fn).toThrow(TypeError);
    });
}

export function checkAccessMethods(object: ElementPath, options: {keys?: string[]} = {}) {
    const {keys} = options;

    it('.ownKey() trap', () => {
        expect(Object.keys(object)).toEqual(
            keys || ['__flows', '__path'],
        );
    });

    it('.getPrototypeOf() trap', () => {
        const proto = Object.getPrototypeOf(object);
        expect(proto).toBe(ElementPath.prototype);
    });

    it('.setPrototypeOf() trap', () => {
        const fn = () => Object.setPrototypeOf(object, Object.prototype);
        expect(fn).toThrow(TypeError);
    });

    it('.isExtensible() trap', () => {
        const fn = () => Object.isExtensible(object);
        expect(fn).toThrow(TypeError);
    });
}

export function checkPreventExtensions(object: ElementPath) {
    it('.preventExtensions()', () => {
        const fn = () => Object.preventExtensions(object);
        expect(fn).toThrow(TypeError);
    });

    it('.freeze()', () => {
        const fn = () => Object.freeze(object);
        expect(fn).toThrow(TypeError);
    });

    it('.seal()', () => {
        const fn = () => Object.seal(object);
        expect(fn).toThrow(TypeError);
    });
}
