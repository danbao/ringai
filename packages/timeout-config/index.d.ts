declare const TIMEOUTS: {
  // Fast operations
  CLICK: number;
  HOVER: number;
  FILL: number;
  KEY: number;
  
  // Medium operations
  WAIT_FOR_ELEMENT: number;
  WAIT_FOR_VISIBLE: number;
  WAIT_FOR_CLICKABLE: number;
  WAIT_FOR_ENABLED: number;
  WAIT_FOR_STABLE: number;
  CONDITION: number;
  
  // Slow operations
  PAGE_LOAD: number;
  NAVIGATION: number;
  NETWORK_REQUEST: number;
  WAIT_FOR_VALUE: number;
  WAIT_FOR_SELECTED: number;
  
  // Very slow operations
  TEST_EXECUTION: number;
  CLIENT_SESSION: number;
  PAGE_LOAD_MAX: number;
  GLOBAL_TEST: number;
  
  // Cleanup operations
  TRACE_STOP: number;
  COVERAGE_STOP: number;
  CONTEXT_CLOSE: number;
  SESSION_CLOSE: number;
  BROWSER_CLOSE: number;
  
  // Compatibility aliases
  WAIT_TIMEOUT: number;
  TICK_TIMEOUT: number;
  
  // Utility functions
  custom: (category: string, operation: string, baseValue?: number) => number;
  isLocal: boolean;
  isCI: boolean;
  isDebug: boolean;
};

export = TIMEOUTS; 