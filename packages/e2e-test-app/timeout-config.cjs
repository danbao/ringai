/**
 * 统一的Timeout配置
 * 支持不同环境和操作类型的timeout设置
 */

const isLocal = process.env.NODE_ENV === 'development' || process.env.LOCAL === 'true';
const isCI = process.env.CI === 'true';
const isDebug = process.env.DEBUG === 'true' || process.env.PLAYWRIGHT_DEBUG === '1';

/**
 * 基础timeout配置（毫秒）
 * 与 Playwright 默认值保持完全一致
 */
const BASE_TIMEOUTS = {
  // 所有操作使用 Playwright 默认的 actionTimeout: 30000ms
  fast: {
    click: 30000,          // 点击操作 - Playwright 默认 actionTimeout
    hover: 30000,          // 悬停操作 - Playwright 默认 actionTimeout
    fill: 30000,           // 填充操作 - Playwright 默认 actionTimeout
    key: 30000,            // 键盘操作 - Playwright 默认 actionTimeout
  },

  // 等待操作使用 Playwright 默认的 actionTimeout: 30000ms
  medium: {
    waitForElement: 30000,  // 等待元素 - Playwright 默认 actionTimeout
    waitForVisible: 30000,  // 等待可见 - Playwright 默认 actionTimeout
    waitForClickable: 30000, // 等待可点击 - Playwright 默认 actionTimeout
    waitForEnabled: 30000,   // 等待可用 - Playwright 默认 actionTimeout
    waitForStable: 30000,    // 等待稳定 - Playwright 默认 actionTimeout
    condition: 30000,        // 等待条件 - Playwright 默认 actionTimeout
  },

  // 导航操作使用 Playwright 默认的 navigationTimeout: 30000ms
  slow: {
    pageLoad: 30000,        // 页面加载 - Playwright 默认 navigationTimeout
    navigation: 30000,      // 导航 - Playwright 默认 navigationTimeout
    networkRequest: 30000,  // 网络请求 - 与 actionTimeout 保持一致
    waitForValue: 30000,    // 等待值 - 与 actionTimeout 保持一致
    waitForSelected: 30000, // 等待选择 - 与 actionTimeout 保持一致
  },
  
  // 测试执行和会话管理
  verySlow: {
    testExecution: 30000,   // 单个测试执行 - 与 Playwright actionTimeout 一致
    clientSession: 900000,  // 客户端会话 (15分钟) - 保持长时间会话
    pageLoadMax: 30000,     // 页面加载最大时间 - 与 navigationTimeout 一致
    globalTest: 900000,     // 全局测试超时 (15分钟) - 保持长时间测试
  },
  
  // 清理操作 - 使用较短但合理的超时时间
  cleanup: {
    traceStop: 5000,        // 跟踪停止 - 给足够时间保存跟踪数据
    coverageStop: 5000,     // 覆盖率停止 - 给足够时间保存覆盖率数据
    contextClose: 5000,     // 上下文关闭 - 给足够时间清理上下文
    sessionClose: 5000,     // 会话关闭 - 给足够时间关闭会话
    browserClose: 5000,     // 浏览器关闭 - 给足够时间关闭浏览器
  }
};

/**
 * 环境相关的timeout倍数
 * 基于 Playwright 默认值进行微调
 */
const ENVIRONMENT_MULTIPLIERS = {
  local: isLocal ? {
    fast: 1,      // 本地环境保持 Playwright 默认值
    medium: 1,    // 本地环境保持 Playwright 默认值
    slow: 1,      // 本地环境保持 Playwright 默认值
    verySlow: 1,  // 本地环境保持不变
    cleanup: 1,   // 本地环境保持不变
  } : {},

  ci: isCI ? {
    fast: 1,      // CI环境保持 Playwright 默认值
    medium: 1,    // CI环境保持 Playwright 默认值
    slow: 1,      // CI环境保持 Playwright 默认值
    verySlow: 1,  // CI环境保持不变
    cleanup: 1,   // CI环境保持不变
  } : {},

  debug: isDebug ? {
    fast: 3,      // 调试模式适度延长到90秒
    medium: 3,    // 调试模式适度延长到90秒
    slow: 3,      // 调试模式适度延长到90秒
    verySlow: 2,  // 调试模式延长2倍
    cleanup: 2,   // 清理操作延长2倍
  } : {}
};

/**
 * 计算最终的timeout值
 */
function calculateTimeout(category, operation, baseValue = null) {
  const base = baseValue || BASE_TIMEOUTS[category][operation];
  if (!base) {
    throw new Error(`Unknown timeout: ${category}.${operation}`);
  }
  
  let multiplier = 1;
  
  // 应用环境倍数
  Object.values(ENVIRONMENT_MULTIPLIERS).forEach(envMultipliers => {
    if (envMultipliers[category]) {
      multiplier *= envMultipliers[category];
    }
  });
  
  return Math.round(base * multiplier);
}

/**
 * 导出的timeout配置
 */
const TIMEOUTS = {
  // 快速操作
  CLICK: calculateTimeout('fast', 'click'),
  HOVER: calculateTimeout('fast', 'hover'),
  FILL: calculateTimeout('fast', 'fill'),
  KEY: calculateTimeout('fast', 'key'),
  
  // 中等操作
  WAIT_FOR_ELEMENT: calculateTimeout('medium', 'waitForElement'),
  WAIT_FOR_VISIBLE: calculateTimeout('medium', 'waitForVisible'),
  WAIT_FOR_CLICKABLE: calculateTimeout('medium', 'waitForClickable'),
  WAIT_FOR_ENABLED: calculateTimeout('medium', 'waitForEnabled'),
  WAIT_FOR_STABLE: calculateTimeout('medium', 'waitForStable'),
  CONDITION: calculateTimeout('medium', 'condition'),
  
  // 慢速操作
  PAGE_LOAD: calculateTimeout('slow', 'pageLoad'),
  NAVIGATION: calculateTimeout('slow', 'navigation'),
  NETWORK_REQUEST: calculateTimeout('slow', 'networkRequest'),
  WAIT_FOR_VALUE: calculateTimeout('slow', 'waitForValue'),
  WAIT_FOR_SELECTED: calculateTimeout('slow', 'waitForSelected'),
  
  // 非常慢的操作
  TEST_EXECUTION: calculateTimeout('verySlow', 'testExecution'),
  CLIENT_SESSION: calculateTimeout('verySlow', 'clientSession'),
  PAGE_LOAD_MAX: calculateTimeout('verySlow', 'pageLoadMax'),
  GLOBAL_TEST: calculateTimeout('verySlow', 'globalTest'),
  
  // 清理操作
  TRACE_STOP: calculateTimeout('cleanup', 'traceStop'),
  COVERAGE_STOP: calculateTimeout('cleanup', 'coverageStop'),
  CONTEXT_CLOSE: calculateTimeout('cleanup', 'contextClose'),
  SESSION_CLOSE: calculateTimeout('cleanup', 'sessionClose'),
  BROWSER_CLOSE: calculateTimeout('cleanup', 'browserClose'),
  
  // 兼容性别名 - 与 Playwright 默认值保持一致
  WAIT_TIMEOUT: calculateTimeout('medium', 'waitForElement'), // 30000ms
  TICK_TIMEOUT: 100,  // 保持原始的tick timeout
  
  // 工具函数
  custom: calculateTimeout,
  isLocal,
  isCI,
  isDebug
};

module.exports = TIMEOUTS; 