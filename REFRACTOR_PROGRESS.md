# Testring v1.0 Refactor Progress

> 唯一重构计划文档：`/root/workspace/github/danbao/testring-v1.0-refactor-plan.md`

## Phase 1 - 基础设施现代化（工具链层）
- [x] 1.1 迁移到 pnpm（workspace + lockfile）
- [x] 1.2 引入 Turborepo（turbo.json + pipeline）
- [x] 1.3 迁移构建到 tsup（dual build / tsc noEmit）
- [x] 1.4 引入 Changesets（.changeset + config）
- [x] 1.5 升级 ESLint 9（flat config + working rules/plugins）
- [x] 1.6 升级 TypeScript 目标（ES2022 baseline）
- [x] 1.7 迁移内部测试到 Vitest（unit tests runnable）

## Phase 2 - 删除与替换（减法阶段）
- [x] 2.1 删除 `core/async-assert` → 用 `node:assert` + Chai
  - [x] web-application 已有本地 async-assert wrapper，类型保留在 core/types
- [x] 2.2 删除 `core/transport/serialize` 旧文件 → 用 `structuredClone`
  - [x] index.ts 已改用 structuredClone，旧 helper 文件已清理
- [x] 2.3 删除 `packages/http-api` → 用 `fetch`
  - [x] 删除 http-api 包、http-server plugin-api 模块、httpThrottle 配置
  - [x] 删除 IPluginModules 中 httpClientInstance/httpServer
- [x] 2.4 删除 `core/dependencies-builder` → ESM 原生解析
  - [x] 删除包及类型定义，sandbox 使用内联类型
  - [x] test-worker 不再构建依赖字典，传空 {}
- [x] 2.5 完全移除 `plugin-selenium-driver` → Playwright 统一
  - [x] 删除整个 plugin-selenium-driver 包
  - [x] 删除 playwright-driver 中所有 Selenium 兼容代码（handleSeleniumCompatibility, SeleniumGridConfig, cdpCoverage 等）
  - [x] 删除所有 Selenium e2e 测试、grid 脚本、兼容性测试
  - [x] 清理 web-application、cli、types 中的 selenium 引用
- [x] 2.6 简化 `core/fs-reader` → 用 `tinyglobby`
- [ ] 2.7 简化 `core/logger` → 用 `pino`
  - 注意：logger 深度集成了 pluggable-module 和 transport，替换需要重写输出管线

## Phase 3 - ESM 迁移 + Sandbox 重写
- [ ] 3.1 全量 ESM 迁移（package.json type/module + exports）
  - [x] 3.1.1 迁移 `packages/element-path` → ESM（试点包）
  - [x] 3.1.2 迁移 `packages/download-collector-crx` → ESM
  - [x] 3.1.3 迁移 `packages/plugin-playwright-driver` → ESM
  - [x] 3.1.4 迁移 `packages/plugin-babel` → ESM
  - [ ] 其余 ~29 个包待迁移
- [ ] 3.2 import 路径加 `.js` 扩展名
  - [x] 试点包已完成
  - [ ] 核心包未完成
- [ ] 3.3 替换 CJS 特有 API（`__dirname`/`require.resolve` 等）
  - [x] 部分包已替换
  - [ ] 40+ 处 `__dirname`、12+ 处 `require.resolve` 仍在使用
- [x] 3.4 重写 Sandbox → `worker_threads` + ESM loader hooks
  - [x] sandbox-workerthreads.ts + esm-loader-hooks.ts 实现完成
  - 注意：仍为可选实现，vm 作为默认
- [ ] 3.5 重写 Transport → `MessagePort` + `birpc`
  - 注意：birpc 未集成，transport 仍用旧的 serialize + DirectTransport
- [ ] 3.6 简化 `child-process` → 薄封装
  - 注意：fork.ts 仍使用 Module._extensions['.ts']

## Phase 4 - 核心架构现代化
- [x] 4.1 重写插件系统 → `hookable`（生命周期 hook + 强类型）
- [ ] 4.2 重写配置系统 → `c12` + `citty`（defineConfig + TS-first）
  - 注意：c12/citty 已在 package.json 但源码仍用 yargs
- [x] 4.3 重写 TestWorker → `Tinypool`（worker_threads 池）
- [x] 4.4 简化 BrowserProxy → 直接调用 Playwright API
- [x] 4.5 简化 WebApplication → 薄封装 Playwright Page
- [x] 4.6 错误处理标准化（Error hierarchy + context）

## Phase 5 - 类型安全 + DX
- [x] 5.1 类型系统强化（消除核心域 `any`/`Function` 等不安全类型）
  - [x] test-worker-instance.ts parameters/envParameters → Record<string, unknown>
  - [x] api/run.ts TestFunction 返回类型改进
  - [x] utils/package-require.ts, plugin-require.ts 返回类型 unknown 泛型
- [x] 5.2 强类型 EventEmitter / branded types / `using` 资源管理
  - [x] WorkerEvents 泛型、IWorkerEmitter 改进
- [x] 5.3 开发者体验优化
  - [x] vitest threads pool + turbo cache 配置

## Phase 6 - 生态与体验（Future）
- [x] 6.1 CLI 子命令架构与 init 向导
- [x] 6.2 Reporter 系统
- [x] 6.3 DevTools 现代化评估/迁移
- [x] 6.4 文档（TypeDoc + 迁移指南 + 插件开发指南）
- [x] 6.5 CI/CD 模板与 Docker 优化

---

## 待完成项汇总

| 任务 | 复杂度 | 说明 |
|------|--------|------|
| 2.7 logger → pino | 高 | 需重写 logger-server 输出管线，保持 pluggable-module hook 兼容 |
| 3.1 全量 ESM 迁移 | 高 | ~29 个包需添加 type:module + exports，逐包迁移 |
| 3.2 import 路径加 .js | 中 | 需修改所有核心包的相对 import |
| 3.3 替换 CJS API | 中 | 40+ 处 __dirname，12+ 处 require.resolve |
| 3.5 Transport → birpc | 高 | 需替换整个 IPC 传输层 |
| 3.6 child-process 简化 | 中 | 移除 Module._extensions 依赖 |
| 4.2 配置系统 → c12+citty | 高 | 需重写 cli-config 源码从 yargs 迁移 |
