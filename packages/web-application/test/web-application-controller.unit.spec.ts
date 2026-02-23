import {describe, it} from 'vitest';
import {strict as assert} from 'node:assert';
import {EventEmitter} from 'node:events';

import {WebApplicationController} from '../src/web-application-controller.js';
import {
  WebApplicationMessageType,
  WebApplicationControllerEventType,
} from '@ringai/types';

class FakeTransport extends EventEmitter {
  public sent: any[] = [];
  public broadcasted: any[] = [];

  send(source: string, type: string, payload: any) {
    this.sent.push({source, type, payload});
    return Promise.resolve();
  }

  broadcastLocal(type: string, payload: any) {
    this.broadcasted.push({type, payload});
    return Promise.resolve();
  }
}

class FakeBrowserProxyController {
  public executeCalls: any[] = [];
  constructor(private shouldThrow = false) {}

  async execute(applicant: string, command: any) {
    this.executeCalls.push({applicant, command});
    if (this.shouldThrow) {
      throw new Error('boom');
    }
    return {ok: true, applicant, command};
  }
}

describe('WebApplicationController transport event dispatch', () => {
  it('init() registers execute handler and emits execute/response/afterResponse + transport broadcastLocal', async () => {
    const transport = new FakeTransport();
    const browserProxy = new FakeBrowserProxyController(false);

    const controller = new WebApplicationController(browserProxy as any, transport as any);
    controller.init();

    const seen: string[] = [];
    controller.on(WebApplicationControllerEventType.execute, () => seen.push('execute'));
    controller.on(WebApplicationControllerEventType.response, () => seen.push('response'));
    controller.on(WebApplicationControllerEventType.afterResponse, () => seen.push('afterResponse'));

    const msg = {uid: '1', applicant: 'a', command: {type: 'X'}};
    transport.emit(WebApplicationMessageType.execute, msg);

    // allow microtasks
    await new Promise((r) => setTimeout(r, 0));

    assert.deepEqual(seen, ['execute', 'response', 'afterResponse']);
    assert.equal(browserProxy.executeCalls.length, 1);

    assert.equal(transport.broadcasted.length, 1);
    assert.equal(transport.broadcasted[0].type, WebApplicationMessageType.response);
    assert.equal(transport.broadcasted[0].payload.uid, '1');
    assert.equal(transport.broadcasted[0].payload.error, null);
  });

  it('when source provided, responds via transport.send instead of broadcastLocal', async () => {
    const transport = new FakeTransport();
    const browserProxy = new FakeBrowserProxyController(false);

    const controller = new WebApplicationController(browserProxy as any, transport as any);
    controller.init();

    const msg = {uid: '2', applicant: 'a', command: {type: 'X'}};
    transport.emit(WebApplicationMessageType.execute, msg, 'source-1');

    await new Promise((r) => setTimeout(r, 0));

    assert.equal(transport.sent.length, 1);
    assert.equal(transport.sent[0].source, 'source-1');
    assert.equal(transport.sent[0].type, WebApplicationMessageType.response);
    assert.equal(transport.broadcasted.length, 0);
  });

  it('error during execute sends response with error and does not emit afterResponse', async () => {
    const transport = new FakeTransport();
    const browserProxy = new FakeBrowserProxyController(true);

    const controller = new WebApplicationController(browserProxy as any, transport as any);
    controller.init();

    const seen: string[] = [];
    controller.on(WebApplicationControllerEventType.afterResponse, () => seen.push('afterResponse'));

    const msg = {uid: '3', applicant: 'a', command: {type: 'X'}};
    transport.emit(WebApplicationMessageType.execute, msg);

    await new Promise((r) => setTimeout(r, 0));

    assert.equal(seen.length, 0);
    assert.equal(transport.broadcasted.length, 1);
    assert.equal(transport.broadcasted[0].payload.uid, '3');
    assert.ok(transport.broadcasted[0].payload.error);
  });

  it('kill() prevents emitting response and transport send/broadcast after execute resolves', async () => {
    const transport = new FakeTransport();

    class SlowBrowserProxy {
      async execute() {
        await new Promise((r) => setTimeout(r, 5));
        return {ok: true};
      }
    }

    const controller = new WebApplicationController(new SlowBrowserProxy() as any, transport as any);
    controller.init();

    controller.on(WebApplicationControllerEventType.response, () => {
      throw new Error('should not emit response after kill');
    });

    transport.emit(WebApplicationMessageType.execute, {uid: '4', applicant: 'a', command: {}});
    controller.kill();

    await new Promise((r) => setTimeout(r, 10));

    assert.equal(transport.broadcasted.length, 0);
    assert.equal(transport.sent.length, 0);
  });
});
