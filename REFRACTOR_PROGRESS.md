# Testring v1.0 Refactor Progress

> 唯一重构计划文档：`/root/workspace/github/danbao/testring-v1.0-refactor-plan.md`

## Phase 1 — 基础设施现代化（工具链层）
- [x] 1.1 迁移到 pnpm（workspace + lockfile）
- [x] 1.2 引入 Turborepo（turbo.json + pipeline）
- [x] 1.3 迁移构建到 tsup（dual build / tsc noEmit）
- [x] 1.4 引入 Changesets（.changeset + config）
- [x] 1.5 升级 ESLint 9（flat config + working rules/plugins）
- [x] 1.6 升级 TypeScript 目标（ES2022 baseline）
- [x] 1.7 迁移内部测试到 Vitest（unit tests runnable）

## Phase 2 — 删除与替换（减法阶段）
- [ ] 2.1 删除 `core/async-assert` → 用 `node:assert` + Chai
  - [x] 2.1.1 web-application 移除对 @testring/async-assert 的依赖（改为本地 async-assert wrapper）
- [ ] 2.2 删除 `core/transport/serialize` → 用 `structuredClone`
- [ ] 2.3 删除 `packages/http-api` → 用 `fetch`
- [ ] 2.4 删除 `core/dependencies-builder` → 用 ESM 原生解析
- [ ] 2.5 废弃 `plugin-selenium-driver` → Playwright 统一
- [x] 2.6 简化 `core/fs-reader` → 用 `tinyglobby`
- [ ] 2.7 简化 `core/logger` → 用 `pino`

## Phase 3 — ESM 迁移 + Sandbox 重写
- [ ] 3.1 全量 ESM 迁移（package.json type/module + exports）
- [ ] 3.2 import 路径加 `.js` 扩展名
- [ ] 3.3 替换 CJS 特有 API（`__dirname`/`require.resolve` 等）
- [ ] 3.4 重写 Sandbox → `worker_threads` + ESM loader hooks
- [ ] 3.5 重写 Transport → `MessagePort` + `birpc`
- [ ] 3.6 简化 `child-process` → 薄封装

## Phase 4 — 核心架构现代化
- [ ] 4.1 重写插件系统 → `hookable`（生命周期 hook + 强类型）
- [ ] 4.2 重写配置系统 → `c12` + `citty`（defineConfig + TS-first）
- [ ] 4.3 重写 TestWorker → `Tinypool`（worker_threads 池）
- [ ] 4.4 简化 BrowserProxy → 直接调用 Playwright API
- [ ] 4.5 简化 WebApplication → 薄封装 Playwright Page
- [ ] 4.6 错误处理标准化（Error hierarchy + context）

## Phase 5 — 类型安全 + DX
- [ ] 5.1 类型系统强化（消除核心域 `any`/`Function` 等不安全类型）
- [ ] 5.2 强类型 EventEmitter / branded types / `using` 资源管理
- [ ] 5.3 开发者体验优化

## Phase 6 — 生态与体验（Future）
- [ ] 6.1 CLI 子命令架构与 init 向导
- [ ] 6.2 Reporter 系统
- [ ] 6.3 DevTools 现代化评估/迁移
- [ ] 6.4 文档（TypeDoc + 迁移指南 + 插件开发指南）
- [ ] 6.5 CI/CD 模板与 Docker 优化

---

## 偏离说明（旧 spec 遗留改动映射）

在计划变更前已产生但未提交的改动（不回滚）：

1) **新增开发依赖**：`eslint-plugin-sonarjs`、`eslint-plugin-import`
   - 映射到：Phase 1 / Task 1.5（ESLint 9 规则/插件补齐）

2) **调整 ESLint 配置**：`eslint.config.js` 增加 plugins 并放宽部分规则（例如 `no-extra-boolean-cast` / `prefer-const` 等）
   - 映射到：Phase 1 / Task 1.5（确保 `pnpm -w lint` 可运行）
   - 说明：此处属于“让 lint 可工作”的临时折衷；后续可在 Phase 5 再逐步收紧规则并消除遗留 warning。
