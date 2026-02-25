
import {describe, it, expect} from 'vitest';

import {MultiLock} from '../src/multi-lock';

const LockMaxAmount = 3;

describe('multi-lock', () => {
    it('should successfully lock', () => {
        const lock = new MultiLock(LockMaxAmount);
        const id = 'test';
        const acquire = lock.acquire(id);
        // eslint-disable-next-line no-unused-expressions
        expect(acquire).toBe(true);

        expect(lock.getSize(id)).toBe(1);
        expect(lock.getSize()).toBe(1);
    });

    it('should Unsuccessfully lock & clean', () => {
        const lock = new MultiLock(LockMaxAmount);
        const id = 'test';
        const id2 = 'test2';
        lock.acquire(id); // true
        expect(lock.getSize()).toBe(1);
        lock.acquire(id); // true
        expect(lock.getSize()).toBe(2);
        lock.acquire(id2); // true
        expect(lock.getSize()).toBe(3);

        const acquire = lock.acquire(id); // false
        // eslint-disable-next-line no-unused-expressions
        expect(acquire).toBe(false);

        expect(lock.getSize(id)).toBe(2);
        expect(lock.getSize(id2)).toBe(1);

        lock.clean();
        expect(lock.getSize(id)).toBe(0);
        expect(lock.getSize(id2)).toBe(0);
        expect(lock.getSize()).toBe(0);
    });

    it('should successfully lock & release', () => {
        const lock = new MultiLock(LockMaxAmount);
        const id = 'test';
        const id2 = 'test2';
        lock.acquire(id);
        lock.acquire(id);
        lock.acquire(id2);
        const acquire = lock.acquire(id);
        // eslint-disable-next-line no-unused-expressions
        expect(acquire).toBe(false);

        lock.release(id);
        expect(lock.getSize()).toBe(2);
        const acquire2 = lock.acquire(id2);
        // eslint-disable-next-line no-unused-expressions
        expect(acquire2).toBe(true);

        expect(lock.getSize(id)).toBe(1);
        expect(lock.getSize(id2)).toBe(2);
        expect(lock.getSize()).toBe(3);

        lock.clean(id2);
        expect(lock.getSize(id)).toBe(1);
        expect(lock.getSize(id2)).toBe(0);
        expect(lock.getSize()).toBe(1);

        lock.clean(id);
        expect(lock.getSize(id)).toBe(0);
        expect(lock.getSize(id2)).toBe(0);
        expect(lock.getSize()).toBe(0);
    });
});
