import {describe, it} from 'vitest';
import {strict as assert} from 'node:assert';

import {
  simulateJSFieldChangeScript,
  getOptionsPropertyScript,
  scrollIntoViewCallScript,
} from '../src/browser-scripts.js';

// Basic smoke tests that scripts are functions and contain expected behavior.
// These scripts are meant to be executed in browser context; here we only validate
// that they are callable and have stable structure.

describe('browser-scripts', () => {
  it('exports expected scripts as functions', () => {
    assert.equal(typeof simulateJSFieldChangeScript, 'function');
    assert.equal(typeof getOptionsPropertyScript, 'function');
    assert.equal(typeof scrollIntoViewCallScript, 'function');
  });

  it('simulateJSFieldChangeScript should call done with error when element not found (using minimal DOM stubs)', async () => {
    // minimal DOM/XPath stubs
    (globalThis as any).XPathResult = {ORDERED_NODE_SNAPSHOT_TYPE: 7};
    (globalThis as any).document = {
      evaluate: () => ({snapshotLength: 0, snapshotItem: () => null}),
      scrollingElement: null,
      body: {},
    };

    (globalThis as any).CustomEvent = class {
      constructor(public type: string, public init: any) {}
    };

    (globalThis as any).KeyboardEvent = class {
      constructor(public type: string, public init: any) {}
    };

    let err: any;
    await new Promise<void>((resolve) => {
      simulateJSFieldChangeScript('//input', 'x', (e) => {
        err = e;
        resolve();
      });
    });

    assert.equal(typeof err, 'string');
    assert.match(err, /not found/);
  });

  it('getOptionsPropertyScript should throw when xpath is not select', () => {
    (globalThis as any).XPathResult = {ORDERED_NODE_SNAPSHOT_TYPE: 7};
    (globalThis as any).document = {
      evaluate: () => ({snapshotLength: 1, snapshotItem: () => ({tagName: 'div'})}),
    };

    assert.throws(
      () => getOptionsPropertyScript('//div', 'text', () => {}),
      /Element not found/, // wrapped with xpath in error
    );
  });
});
