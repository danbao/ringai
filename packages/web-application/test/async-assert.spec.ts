import {describe, it} from 'vitest';
import {strict as assert} from 'node:assert';

import {createAssertion} from '../src/async-assert.js';

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

describe('createAssertion (async assert wrapper)', () => {
  it('supports awaiting a successful assertion and calls onSuccess with metadata', async () => {
    const successMeta: any[] = [];

    const a = createAssertion({
      onSuccess: async (meta) => {
        await wait(1);
        successMeta.push(meta);
      },
    });

    await a.equal(1, 1, 'ok');

    assert.equal(successMeta.length, 1);
    assert.equal(successMeta[0].isSoft, false);
    assert.equal(successMeta[0].originalMethod, 'equal');
    assert.equal(successMeta[0].successMessage, 'ok');
    assert.match(successMeta[0].assertMessage, /\[assert\] equal/);
  });

  it('in hard assert mode, throws and onError can rewrite the error', async () => {
    const a = createAssertion({
      onError: async (meta) => {
        assert.equal(meta.isSoft, false);
        assert.equal(meta.originalMethod, 'equal');
        return new Error(`rewritten: ${meta.errorMessage}`);
      },
    });

    await assert.rejects(() => a.equal(1, 2, 'custom msg'), /rewritten:/);
  });

  it('in soft assert mode, collects error messages and does not throw', async () => {
    const a = createAssertion({isSoft: true});

    await a.equal(1, 2, 'first');
    await a.ok(false, 'second');

    assert.deepEqual((a as any)._errorMessages, ['first', 'second']);
  });

  it('throws a helpful error when accessing unknown chai.assert method', async () => {
    const a = createAssertion();

    try {
      // Access triggers Proxy.get
      void (a as any).definitelyNotAMethod;
      assert.fail('expected proxy get to throw');
    } catch (e) {
      assert.match(String(e), /Unknown assertion method chai\.assert\.definitelyNotAMethod/);
    }
  });
});
