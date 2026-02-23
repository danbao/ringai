# 提升测试覆盖率计划（ringai）

> 目标：在不牺牲 CI 稳定性的前提下，系统性提升单测/集成测试覆盖率与关键路径的行为保障。
> 
> 约束（本次输出遵循）：**不改代码/不提交**，仅制定 plan。

## Phase 0 — 快速探测现状（已完成）

### 0.1 现有测试与覆盖率产物
- 仓库已存在 `coverage/tmp/*.json`（疑似历史 run 的临时覆盖率碎片），但当前并无汇总报告。
- 通过 `pnpm run test:unit:coverage` 生成了标准产物（Vitest v8 coverage）：
  - 目录：`./.coverage/`
  - `./.coverage/lcov.info`、`./.coverage/lcov-report/index.html`

### 0.2 3 分钟内的核心验证（已完成）
- 执行：`pnpm run test:unit`（约 48s）
  - 结果：**77 files / 1294 tests 全部通过**（整体 exit code 0）
  - 但测试输出中出现了“❌ Failed: ...”字样，属于 **test 内演示/样例输出**（例如 `packages/test-utils/test/plugin-compatibility-usage.spec.ts` 的示例打印），并非 Vitest 失败。
- 执行：`pnpm run test:unit:coverage`（约 50s）
  - 汇总覆盖率：
    - Statements: **37.51%** (1859/4955)
    - Branches: **40.12%** (857/2136)
    - Functions: **28.38%** (405/1427)
    - Lines: **37.79%** (1836/4858)

### 0.3 覆盖率热点/低洼（从 text-summary 读取）
覆盖率极低（接近 0%）且看起来属于关键业务/对外 API 的模块：
- `core/api/src/*`：0%
- `core/cli/src/*`：0%
- `core/reporter/src/*`：0%
- `core/test-worker/src/*`：0%
- `packages/client-ws-transport/src/ws-transport.ts`：0%
- `packages/browser-proxy/src/*`：大量 0%（其中 `browser-proxy-playwright.ts` 0%，文件体量大）
- `packages/web-application/src/*`：整体很低（`web-client.ts` 0%，`web-application*.ts` 很低）

覆盖率相对较好（可作为对照/复用测试模式）：
- `packages/element-path/src/*`：~93%+
- `core/cli-config/src/*`：~94%
- `core/fs-reader/src/*`：~91%
- `core/fs-store/src/*`：~79%

---

## 阻塞项清单 + 解决建议

### B1. 示例测试输出存在“❌ Failed”字样，容易误判
- 现象：`packages/test-utils/test/plugin-compatibility-usage.spec.ts` 会打印“❌ Failed: ...”，但 Vitest 最终统计全部通过。
- 风险：CI log/本地开发者可能误认为用例失败。
- 建议：
  1) 将示例打印统一改为中性措辞（例如 `DEMO_FAIL_EXPECTED`）或改用 `logger.debug` 并在测试中默认静默；
  2) 若必须保留“❌/✅”样式，建议在输出前加上前缀如 `[DEMO]`，并在 README/贡献指南注明。

### B2. 部分被 Vitest 配置排除的 functional specs（短期无法覆盖）
- `vitest.config.ts` exclude 中明确排除了：
  - `core/cli/test/run.functional.spec.ts`
  - `core/test-worker/test/test-worker.functional.spec.ts`
  - `core/test-worker/test/worker-controller.spec.ts`（注释：需要 ESM sandbox rework）
  - `packages/browser-proxy/test/browser-proxy-controller.functional.spec.ts`
  - `packages/web-application/test/web-application-controller.functional.spec.ts`
- 风险：关键链路的“真正集成行为”长期缺少自动回归。
- 建议（分阶段）：
  - Phase 2+ 单独建立 **integration test job**（可不走 vitest threads、可加更大 timeout），逐步解除 exclude。

---

## 分阶段计划（Phase 1/2/3/4）

> 说明：优先选择“**覆盖率低 + 业务关键 + 可纯单测模拟**”的模块；将重依赖浏览器/子进程/真实网络的部分放到后期 integration/e2e。

### Phase 1 — 低成本把 0% 的关键入口拉起来（Unit tests / Mock 为主）

**目标**
- 将整体 Statements 从 ~37.5% 提升到 **45%+**；Functions 提升到 **35%+**。
- 至少让 `core/api`、`core/cli`、`core/reporter` 中的“入口文件/主流程”不再是 0%。

**涉及包/模块**
- `core/api/src/run.ts`, `test-context.ts`, `test-api-controller.ts`
- `core/cli/src/index-new.ts` + `core/cli/src/commands/*`（重点 `runCommand.ts` 的纯逻辑分支）
- `core/reporter/src/reporter-manager.ts`, `test-reporter.ts`, `reporters/{dot,json,spec}-reporter.ts`

**测试类型**
- Unit（纯函数/类行为）
- Light integration（同进程内拼装对象，不 fork，不启浏览器）

**关键测试用例清单（建议新增/补齐）**
1) `core/api`：
   - `run()` 在不同 hook/回调存在与否时的调用顺序（beforeRun/afterRun）
   - `TestContext` 的默认值、setter/getter、生命周期（若有）
   - `TestApiController` 对 transport/logger/web-application 的调用契约（用 sinon mock/stub）
2) `core/cli`：
   - `runCommand`：参数组合（tests pattern、retry、silent 等）到内部 config 的映射
   - 错误路径：config 缺失/非法参数时的错误包装（对应 `cli-error.ts`）
   - `initCommand`：生成配置/模板时的分支（用虚拟 fs 或 stub fs 写入）
3) `core/reporter`：
   - `ReporterManager`：
     - 注册 reporter、重复注册、找不到 reporter 的错误
     - 多 reporter 同时输出的 fan-out 行为
   - `DotReporter/SpecReporter/JsonReporter`：
     - 输入 events（start/test/pass/fail/end）时输出格式稳定（snapshot 或字符串断言）

**完成标准**
- `pnpm run test:unit` 通过
- `pnpm run test:unit:coverage` 中：
  - `core/api/src/*` ≥ 60% statements（至少 run.ts/test-context.ts 不为 0）
  - `core/reporter/src/*` ≥ 60%
  - `core/cli/src/*` ≥ 40%（入口与 runCommand 覆盖到主要分支）

**预计工作量**
- 2～4 人日（取决于模块耦合与可 mock 程度）

---

### Phase 2 — 覆盖“进程/并发/IPC”核心：test-worker 与 pluggable-module（以可控的 integration 为主）

**目标**
- 将 `core/test-worker/src/*` 从 0% 拉到 **50%+**。
- 提升 `core/pluggable-module/src/*`（当前 ~32%）到 **60%+**。

**涉及包/模块**
- `core/test-worker/src/test-worker-instance.ts`
- `core/test-worker/src/test-worker-local.ts`
- `core/test-worker/src/test-worker-tinypool.ts`
- `core/pluggable-module/src/pluggable-module.ts`, `hook.ts`

**测试类型**
- Integration（同机、多线程/worker pool 的可重复测试）
- Unit（hook 系统/状态机）

**关键测试用例清单**
1) `pluggable-module`：
   - hook 注册/取消注册
   - hook 执行顺序（before/after/around）
   - hook 抛错时的传播策略（fail-fast or collect）
2) `test-worker`（尽量避免被排除的 functional spec 结构）：
   - `TestWorkerLocal`：启动/停止、重复 stop 的幂等性
   - `TestWorkerTinypool`：
     - pool 初始化参数（并发数、超时）
     - 分发任务的成功/失败/超时路径（用 stub 的 worker 实现）
   - `TestWorkerInstance`：状态转换（idle->running->stopped）

**完成标准**
- `pnpm run test:unit:coverage`：`core/test-worker/src/*` statements ≥ 50%
- flake 控制：同一分支本地连续跑 5 次均通过（可选，但建议作为验收）

**预计工作量**
- 3～6 人日

---

### Phase 3 — Web 相关但可单测的部分：web-application / client-ws-transport

**目标**
- `packages/web-application/src/*` 从 ~10% 提升到 **40%+**（优先非浏览器执行部分）
- `packages/client-ws-transport/src/ws-transport.ts` 从 0% 提升到 **60%+**

**涉及包/模块**
- `packages/web-application/src/async-assert.ts`, `utils.ts`, `browser-scripts.ts`（可解析/拼接逻辑）
- `packages/web-application/src/web-application-controller.ts`（可 stub transport）
- `packages/client-ws-transport/src/ws-transport.ts`

**测试类型**
- Unit（字符串生成/协议封装/错误处理）
- Integration（用 mock WebSocket server，或用 ws 库在 node 内起一个 server）

**关键测试用例清单**
1) `ws-transport`：
   - connect/disconnect 的状态与重入
   - message 序列化/反序列化错误
   - 断线重连（如果有）与 backoff（若在实现中）
2) `web-application`：
   - `asyncAssert`：超时/成功/错误信息
   - `browser-scripts`：生成脚本包含关键片段、参数注入正确
   - controller：收到 transport event 后的分派行为

**完成标准**
- `ws-transport.ts` 不再 0%，且关键错误分支被覆盖
- `web-client.ts` 若仍难以 mock，至少 controller + utils 覆盖显著提升

**预计工作量**
- 3～5 人日

---

### Phase 4 — 高成本高价值：browser-proxy-playwright 与真实 E2E coverage（Playwright）

**目标**
- 为 `packages/browser-proxy/src/browser-proxy-playwright.ts` 建立可维护的测试金字塔：
  - 单测：纯逻辑分支
  - 集成：最小 Playwright 启动（headless）验证关键路径
- 将 browser-proxy 整体 statements 提升到 **35%+**（该包体量大，先分段提升）

**涉及包/模块**
- `packages/browser-proxy/src/browser-proxy-playwright.ts`
- `packages/browser-proxy/src/*controller*.ts`, `*worker*.ts`

**测试类型**
- Integration（Playwright headless，尽量用 data URL/本地静态页避免外网）
- E2E（可复用 `packages/e2e-test-app` 但要控制执行时长与稳定性）

**关键测试用例清单**
- 启动浏览器、创建 context/page、关闭清理（确保无残留进程）
- 代理/worker 消息通道：基本 request/response
- 常见错误：browser launch failure、page crash、timeout

**完成标准**
- 新增一个独立的 `integration` test 脚本或 job（与 unit 分离），避免拖慢 `vitest run`
- 在 CI 环境稳定（至少连续 3 次 pipeline 通过）

**预计工作量**
- 5～10 人日（取决于 Playwright 兼容性与抽象层复杂度）

---

## 建议的度量与推进方式（贯穿各 Phase）

1) **按包设门槛**：从“全仓一个数字”转为“关键包单独门槛”，例如：
   - `core/api`、`core/test-worker`、`packages/client-ws-transport` 单独阈值
2) **分层执行**：
   - `test:unit` 快速、稳定
   - `test:integration` 允许更长 timeout、单线程/串行
   - `test:e2e` 只保留关键 happy path + 1~2 个错误路径
3) **回归清单**：每次提升覆盖率同时补一份“关键行为 checklist”，避免只追数字。

---

## 下一步（执行建议）

若你确认要开始执行：建议从 Phase 1 的 `core/api` + `core/reporter` 入手（mock 依赖成本低、覆盖率提升快），并在每完成一个模块后刷新 `.coverage/lcov-report` 对比。
