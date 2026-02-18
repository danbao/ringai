import assert from 'node:assert/strict';
import * as chai from 'chai';

import type {
  IAssertionOptions,
  IAssertionErrorMeta,
  IAssertionSuccessMeta,
} from '@testring/types';

const errorMessagesField = '_errorMessages' as const;

export type AsyncAssertionApi = typeof chai.assert & {
  [errorMessagesField]: string[];
};

/**
 * A tiny async wrapper around `chai.assert`.
 *
 * - Always returns Promise<void> so callers can `await`.
 * - Supports soft-assert mode by collecting error messages.
 * - Calls optional onSuccess/onError hooks.
 */
export function createAssertion(options: IAssertionOptions = {}): AsyncAssertionApi {
  const isSoft = options.isSoft === true;

  for (const plugin of options.plugins || []) {
    chai.use(plugin);
  }

  const root: AsyncAssertionApi = Object.assign({}, chai.assert, {
    [errorMessagesField]: [] as string[],
  });

  return new Proxy(root, {
    get(target, fieldName) {
      if (fieldName === errorMessagesField) {
        return target[errorMessagesField];
      }

      if (typeof fieldName !== 'string') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return (target as any)[fieldName];
      }

      const originalMethod = (chai.assert as any)[fieldName];
      assert.equal(
        typeof originalMethod,
        'function',
        `Unknown assertion method chai.assert.${fieldName}`,
      );

      // Always return an async function so callers can `await`.
      return async (...args: any[]) => {
        const successMessage = originalMethod.length === args.length ? args.pop() : '';

        const typeOfAssert = isSoft ? 'softAssert' : 'assert';
        const assertMessage = `[${typeOfAssert}] ${fieldName}`;

        try {
          originalMethod(...args);

          if (options.onSuccess) {
            await options.onSuccess({
              isSoft,
              successMessage,
              assertMessage,
              args,
              originalMethod: fieldName,
            } satisfies IAssertionSuccessMeta as any);
          }
        } catch (error) {
          const errorMessage = (error as Error).message;
          let handleError: void | Error | null = null;

          (error as Error).message = successMessage || assertMessage || errorMessage;

          if (options.onError) {
            handleError = await options.onError({
              isSoft,
              successMessage,
              assertMessage,
              errorMessage,
              error: error instanceof Error ? error : new Error(String(error)),
              args,
              originalMethod: fieldName,
            } satisfies IAssertionErrorMeta as any);
          }

          const finalError = handleError || (error as Error);

          if (isSoft) {
            target[errorMessagesField].push(finalError.message);
            return;
          }

          throw finalError;
        }
      };
    },
  });
}
