/**
 * Unified timeout configuration
 * Supports timeout settings for different environments and operation types
 */

const isLocal = process.env.NODE_ENV === 'development' || process.env.LOCAL === 'true';
const isCI = process.env.CI === 'true';
const isDebug = process.env.DEBUG === 'true' || process.env.PLAYWRIGHT_DEBUG === '1';

/**
 * Base timeout configuration (milliseconds)
 * Aligned with Playwright defaults
 */
const BASE_TIMEOUTS = {
  fast: {
    click: 30000,
    hover: 30000,
    fill: 30000,
    key: 30000,
  },

  medium: {
    waitForElement: 30000,
    waitForVisible: 30000,
    waitForClickable: 30000,
    waitForEnabled: 30000,
    waitForStable: 30000,
    condition: 30000,
  },

  slow: {
    pageLoad: 30000,
    navigation: 30000,
    networkRequest: 30000,
    waitForValue: 30000,
    waitForSelected: 30000,
  },
  
  verySlow: {
    testExecution: 30000,
    clientSession: 900000,
    pageLoadMax: 30000,
    globalTest: 900000,
  },
  
  cleanup: {
    traceStop: 5000,
    coverageStop: 5000,
    contextClose: 5000,
    sessionClose: 5000,
    browserClose: 5000,
  }
};

/**
 * Environment-specific timeout multipliers
 */
const ENVIRONMENT_MULTIPLIERS = {
  local: isLocal ? {
    fast: 1, medium: 1, slow: 1, verySlow: 1, cleanup: 1,
  } : {},

  ci: isCI ? {
    fast: 1, medium: 1, slow: 1, verySlow: 1, cleanup: 1,
  } : {},

  debug: isDebug ? {
    fast: 3, medium: 3, slow: 3, verySlow: 2, cleanup: 2,
  } : {}
};

/**
 * Calculate final timeout value
 */
function calculateTimeout(category, operation, baseValue = null) {
  const base = baseValue || BASE_TIMEOUTS[category][operation];
  if (!base) {
    throw new Error(`Unknown timeout: ${category}.${operation}`);
  }
  
  let multiplier = 1;
  
  Object.values(ENVIRONMENT_MULTIPLIERS).forEach(envMultipliers => {
    if (envMultipliers[category]) {
      multiplier *= envMultipliers[category];
    }
  });
  
  return Math.round(base * multiplier);
}

/**
 * Exported timeout configuration
 */
const TIMEOUTS = {
  CLICK: calculateTimeout('fast', 'click'),
  HOVER: calculateTimeout('fast', 'hover'),
  FILL: calculateTimeout('fast', 'fill'),
  KEY: calculateTimeout('fast', 'key'),
  
  WAIT_FOR_ELEMENT: calculateTimeout('medium', 'waitForElement'),
  WAIT_FOR_VISIBLE: calculateTimeout('medium', 'waitForVisible'),
  WAIT_FOR_CLICKABLE: calculateTimeout('medium', 'waitForClickable'),
  WAIT_FOR_ENABLED: calculateTimeout('medium', 'waitForEnabled'),
  WAIT_FOR_STABLE: calculateTimeout('medium', 'waitForStable'),
  CONDITION: calculateTimeout('medium', 'condition'),
  
  PAGE_LOAD: calculateTimeout('slow', 'pageLoad'),
  NAVIGATION: calculateTimeout('slow', 'navigation'),
  NETWORK_REQUEST: calculateTimeout('slow', 'networkRequest'),
  WAIT_FOR_VALUE: calculateTimeout('slow', 'waitForValue'),
  WAIT_FOR_SELECTED: calculateTimeout('slow', 'waitForSelected'),
  
  TEST_EXECUTION: calculateTimeout('verySlow', 'testExecution'),
  CLIENT_SESSION: calculateTimeout('verySlow', 'clientSession'),
  PAGE_LOAD_MAX: calculateTimeout('verySlow', 'pageLoadMax'),
  GLOBAL_TEST: calculateTimeout('verySlow', 'globalTest'),
  
  TRACE_STOP: calculateTimeout('cleanup', 'traceStop'),
  COVERAGE_STOP: calculateTimeout('cleanup', 'coverageStop'),
  CONTEXT_CLOSE: calculateTimeout('cleanup', 'contextClose'),
  SESSION_CLOSE: calculateTimeout('cleanup', 'sessionClose'),
  BROWSER_CLOSE: calculateTimeout('cleanup', 'browserClose'),
  
  WAIT_TIMEOUT: calculateTimeout('medium', 'waitForElement'),
  TICK_TIMEOUT: 100,
  
  custom: calculateTimeout,
  isLocal,
  isCI,
  isDebug
};

export default TIMEOUTS;
export { TIMEOUTS, calculateTimeout, isLocal, isCI, isDebug };
