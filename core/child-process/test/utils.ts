/// <reference types="mocha" />

import {describe, it, expect} from 'vitest';
import {isChildProcess} from '../src/utils';

describe('isChildProcess', () => {
    it('not child args', () => {
        expect(isChildProcess([])).toBe(false);
    });
    it('child args', () => {
        expect(
            isChildProcess(['--some=argument', '--ringai-parent-pid=10']),
        ).toBe(true);
    });
});
