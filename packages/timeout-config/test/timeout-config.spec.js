import { expect } from 'chai';
import TIMEOUTS from '../index.js';

describe('@ringai/timeout-config', () => {
  it('should export timeout configuration', () => {
    expect(TIMEOUTS).to.be.an('object');
  });

  it('should have basic timeout values', () => {
    expect(TIMEOUTS.WAIT_TIMEOUT).to.be.a('number');
    expect(TIMEOUTS.TICK_TIMEOUT).to.be.a('number');
    expect(TIMEOUTS.PAGE_LOAD_MAX).to.be.a('number');
  });

  it('should have environment flags', () => {
    expect(TIMEOUTS.isLocal).to.be.a('boolean');
    expect(TIMEOUTS.isCI).to.be.a('boolean');
    expect(TIMEOUTS.isDebug).to.be.a('boolean');
  });

  it('should have custom function', () => {
    expect(TIMEOUTS.custom).to.be.a('function');
  });

  it('should calculate custom timeout', () => {
    const customTimeout = TIMEOUTS.custom('fast', 'click');
    expect(customTimeout).to.be.a('number');
    expect(customTimeout).to.be.greaterThan(0);
  });
});
