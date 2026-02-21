# Integration Tests

这个目录包含系统级集成测试，专注于测试 Testring 框架的整体集成和系统行为。

## 测试分类

### 1. 进程管理测试 (`process-*.spec.js`)
- 浏览器进程清理
- 内存泄漏检测
- 进程生命周期管理

### 2. 配置集成测试 (`config-*.spec.js`)
- 多环境配置验证
- 插件加载测试
- 配置继承和覆盖

### 3. 错误处理测试 (`error-*.spec.js`)
- 异常恢复机制
- 错误传播和报告
- 失败重试逻辑

### 4. 性能集成测试 (`performance-*.spec.js`)
- 并发执行测试
- 资源使用监控
- 超时处理

### 5. 跨平台兼容性测试 (`platform-*.spec.js`)
- 不同操作系统行为
- 路径处理
- 环境变量处理

## 运行方式

```bash
# 运行所有集成测试
pnpm run test:integration

# 运行特定类别的测试
pnpm run test:integration -- --grep "Process"
pnpm run test:integration -- --grep "Config"
```

## 设计原则

1. **独立性**：每个测试应该能够独立运行
2. **真实性**：模拟真实的使用场景
3. **稳定性**：避免依赖外部服务或网络
4. **可观测性**：提供详细的日志和错误信息
