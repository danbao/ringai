# Coverage Progress (Phase 1)

## Completed

- ✅ 1.1 core/api run() 调用顺序测试 (commit b0c72b7d)
- ✅ 1.2 TestContext 测试 (commit af96a250)
- ✅ 1.3 TestApiController 测试 (commit 63c6015b)
- ✅ 1.4 core/cli runCommand 参数组合到内部 config 的映射 (commit 6e79b128)
- ✅ 1.5 core/cli cli-error.ts 错误包装 (commit b8fb267c)
- ✅ 1.6 core/cli initCommand.ts 分支覆盖（受限：交互式 readline/require 难以在 vitest ESM 中稳定 mock，已改为 smoke 测试以提升覆盖） (commit 534fe5bb)
- ✅ 1.7 core/reporter reporter-manager.ts 行为覆盖：注册 reporter、未知 reporter 错误、fan-out、多 reporter close (commit 9823e380)
- ✅ 1.8 core/reporter reporters 输出稳定性：dot/spec/json reporters (commit 90a60660)
