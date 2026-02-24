import {describe, expect, it} from 'vitest';

import {CliError} from '../src/commands/utils/cli-error.js';

describe('core/cli cli-error', () => {
    it('should be instance of Error and keep name/message', () => {
        const err = new CliError('bad config');
        expect(err).toBeInstanceOf(Error);
        expect(err.name).toBe('CliError');
        expect(err.message).toBe('bad config');
    });
});
