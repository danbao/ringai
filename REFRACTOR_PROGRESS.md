# Ringai v1.0 Refactor Progress

> 唯一重构计划文档：`/root/workspace/github/danbao/ringai-v1.0-refactor-plan.md`

## Phase 1 - 基础设施现代化（工具链层）
- [x] 1.1 迁移到 pnpm（workspace + lockfile）
- [x] 1.2 引入 Turborepo（turbo.json + pipeline）
- [x] 1.3 迁移构建到 tsup（dual build / tsc noEmit）✅ tsup ESM-only build confirmed
- [x] 1.4 引入 Changesets（.changeset + config）
- [x] 1.5 升级 ESLint 9（flat config + working rules/plugins）
- [x] 1.6 升级 TypeScript 目标（ES2022 baseline）
- [x] 1.7 迁移内部测试到 Vitest（unit tests runnable）✅ Vitest with v8 coverage provider

## Phase 2 - 删除与替换（减法阶段）
- [x] 2.1 删除 `core/async-assert` → 用 `node:assert` + Chai
- [x] 2.2 删除 `core/transport/serialize` 旧文件 → 用 `structuredClone`
- [x] 2.3 删除 `packages/http-api` → 用 `fetch`
- [x] 2.4 删除 `core/dependencies-builder` → ESM 原生解析
- [x] 2.5 完全移除 `plugin-selenium-driver` → Playwright 统一
- [x] 2.6 简化 `core/fs-reader` → 用 `tinyglobby`
- [ ] 2.7 简化 `core/logger` → 用 `pino`
  - 注意：logger 深度集成了 pluggable-module 和 transport，替换需要重写输出管线

## Phase 3 - ESM 迁移 + Sandbox 重写
- [x] 3.1 全量 ESM 迁移（package.json type/module + exports）✅ 全部 32 包已设置 `"type": "module"`
  - [x] 30/32 包已迁移到 ESM（tsup format: esm, type: module）
  - [x] tsup.config.base.ts 输出格式改为 esm
  - [x] tsconfig.base.json module 改为 ES2022, moduleResolution 改为 bundler
  - [ ] devtool-extension / devtool-frontend 保持 CJS（webpack 构建，需独立迁移 webpack→vite）
- [ ] 3.2 import 路径加 `.js` 扩展名
  - [x] 试点包已完成
  - [ ] 核心包未完成（tsup/esbuild 处理了 bundling，运行时暂不需要）
- [x] 3.3 替换 CJS 特有 API（`__dirname`/`require.resolve` 等）
  - [x] 11 处 `__dirname` → `fileURLToPath(import.meta.url)` polyfill
  - [x] 4 处 `require/require.resolve` → `createRequire(import.meta.url)`
  - [x] 3 处 `require('xxx')` → ESM `import` (nanoid, p-limit, timeout-config)
  - [x] 移除 `Module._extensions['.ts']` 检查
  - [x] 移除 webpack 兼容代码 (isWebpack)
  - [ ] sandbox.ts/sandbox-workerthreads.ts 中的 require 是 vm context 内部使用，保持不变
- [x] 3.4 重写 Sandbox → `worker_threads` + ESM loader hooks
- [ ] 3.5 重写 Transport → `MessagePort` + `birpc`
  - 注意：birpc 未集成，transport 仍用旧的 serialize + DirectTransport
- [x] 3.6 简化 `child-process` → 薄封装
  - [x] 移除 Module._extensions['.ts'] 依赖
  - [x] 使用 node: 协议导入

## Phase 4 - 核心架构现代化
- [x] 4.1 重写插件系统 → `hookable`（生命周期 hook + 强类型）
- [ ] 4.2 重写配置系统 → `c12` + `citty`（defineConfig + TS-first）
  - [x] citty CLI 框架已集成 ✅ CLI 子命令使用 citty（run, init, plugin）
  - [ ] c12 配置加载未完成（源码仍用 yargs 解析参数）
- [x] 4.3 重写 TestWorker → `Tinypool`（worker_threads 池）
- [x] 4.4 简化 BrowserProxy → 直接调用 Playwright API
- [x] 4.5 简化 WebApplication → 薄封装 Playwright Page
- [x] 4.6 错误处理标准化（Error hierarchy + context）

## Phase 5 - 类型安全 + DX
- [x] 5.1 类型系统强化（消除核心域 `any`/`Function` 等不安全类型）
- [x] 5.2 强类型 EventEmitter / branded types / `using` 资源管理
  - [x] transport: isSerializedStruct 类型守卫替代 any 断言
  - [x] transport: broadcast/direct-transport 消除所有 any
  - [x] client-ws-transport: strict mode 兼容修复
- [x] 5.3 开发者体验优化

## Phase 6 - 生态与体验（Future）
- [x] 6.1 CLI 子命令架构与 init 向导
- [x] 6.2 Reporter 系统
- [x] 6.3 DevTools 现代化评估/迁移
- [x] 6.4 文档（TypeDoc + 迁移指南 + 插件开发指南）
- [x] 6.5 CI/CD 模板与 Docker 优化

---

## 近期完成项（v0.8.0+ 提交记录）

以下项目已通过最近的提交确认完成：

| 项目 | 状态 | 提交 |
|------|------|------|
| ESM 迁移（type: "module"） | ✅ 完成 | `e74dcd53` Phase 3.1-3.3 全量 ESM 迁移 |
| tsup 构建系统 | ✅ 完成 | `5b97b955` build:main 构建通过 |
| citty CLI 框架 | ✅ 完成 | `a7aa389e` Phase 6.1 CLI 子命令 |
| Vitest 测试框架 | ✅ 完成 | `d122bf4f` 77 文件 1294 测试通过 |
| tsx TypeScript 运行器 | ✅ 完成 | `b83af275` ts-node → tsx 替换 |
| Node 20 从 CI 移除 | ✅ 完成 | `c707f230` CI 移除 Node 20 |
| Windows 兼容性修复 | ✅ 完成 | `80583c69` `58793a07` fork 测试和 turbo flags |
| SonarQube 升级到 v7 | ✅ 完成 | `7cf24a77` SonarQube v5 → v7 |
| 文档全面更新 | ✅ 完成 | `2c3117fa` 45 文件更新 |
| E2E 全覆盖测试 | ✅ 完成 | `d7b286ed` 7 新 spec，4 新 fixture，37 E2E 测试通过 |

## 构建状态

| 状态 | 说明 |
|------|------|
| ✅ 31/31 构建通过 | tsup ESM 输出，turbo 编排，全部包通过（含 devtool-*） |

## 测试状态

| 状态 | 说明 |
|------|------|
| ✅ 77/77 单元测试文件通过 | 1294 个测试用例全部通过（Vitest） |
| ✅ 37/37 E2E 测试通过 | Playwright headless Chromium（33 specs + 4 webdriver-protocol specs） |

## 待完成项汇总

| 任务 | 复杂度 | 说明 |
|------|--------|------|
| 2.7 logger → pino | 高 | 需重写 logger-server 输出管线，保持 pluggable-module hook 兼容 |
| 3.5 Transport → birpc | 高 | 需替换整个 IPC 传输层 |
| 4.2 配置系统 → c12 | 中 | citty CLI 已完成，c12 配置加载需重写 cli-config 源码从 yargs 迁移 |
| devtool webpack → vite | 中 | devtool-extension/frontend 需从 webpack 迁移到 vite |
| 测试修复 | 中 | sinon-chai → vitest spy, Vitest 4 done() 弃用, fork + ESM TypeScript |
