# Contributing to AlphaDesk · 贡献指南

感谢你对 [AlphaDesk](https://github.com/baoge-bit/smartdesk)（阿尔法工作台）的关注！  
Thank you for your interest in AlphaDesk.

本文档说明如何搭建开发环境、提交代码与报告问题。保持简洁，便于快速上手。  
This guide covers dev setup, pull requests, code style, and issue reporting.

---

## 开发环境 / Development Setup

### 前置要求 / Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 20.19 |
| Rust | stable（桌面版） |
| Python | ≥ 3.10 |

完整桌面版推荐 **8GB+ 内存**；本地 Ollama 模式资源占用较高。  
Recommend **8GB+ RAM** for the full desktop stack; local Ollama can be resource-heavy.

### 快速开始 / Quick start

```bash
git clone https://github.com/baoge-bit/smartdesk.git
cd smartdesk
chmod +x scripts/*.sh
./scripts/setup.sh
cp .env.example engine/.env   # 若 setup 已创建可跳过
# 编辑 engine/.env — 配置 STOCK_LIST 与 LLM
```

**浏览器开发（改 UI 最快）：**

```bash
./scripts/dev.sh
# 打开 http://localhost:1420
```

**完整桌面版：**

```bash
cd apps/alphadesk
npm run tauri:dev
```

构建验证：

```bash
./scripts/verify-build.sh
```

更多细节见 [README.md](README.md) 与 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)。

---

## 如何贡献 / How to Contribute

### 报告 Bug / Report a bug

1. 在 [Issues](https://github.com/baoge-bit/smartdesk/issues) 搜索是否已有同类问题  
   Search existing issues first
2. 新建 Issue，请尽量包含：  
   Include when possible:
   - 操作系统与版本（macOS / Windows / Linux）  
     OS and version
   - AlphaDesk 版本或 commit hash  
     App version or commit
   - 复现步骤  
     Steps to reproduce
   - 期望行为 vs 实际行为  
     Expected vs actual behavior
   - 相关日志（`data/logs/`、浏览器控制台、终端输出）  
     Logs from `data/logs/`, browser console, or terminal
   - LLM 与数据源配置（**请勿粘贴真实 API Key**）  
     LLM/data config (**never paste real API keys**)

### 功能建议 / Feature requests

欢迎用 Issue 描述使用场景与预期收益，便于排期。  
Open an issue describing the use case and expected benefit.

### 提交 Pull Request

1. **Fork** 仓库并从 `main` 创建分支  
   Fork and branch from `main`  
   建议命名：`feat/xxx`、`fix/xxx`、`docs/xxx`  
   Branch names: `feat/xxx`, `fix/xxx`, `docs/xxx`
2. 保持 PR **聚焦单一主题**（一个功能或一类修复）  
   Keep each PR focused on one topic
3. 本地验证：  
   Verify locally:
   ```bash
   ./scripts/verify-build.sh          # 或至少 npm run build
   cd apps/alphadesk && npm run build # 前端改动时
   ```
4. 引擎改动请确认 FastAPI 可启动：  
   For engine changes, confirm the API starts:
   ```bash
   source engine/.venv/bin/activate
   python engine/alphadesk_entry.py --port 18765
   ```
5. 提交 PR 时说明：**改了什么、为什么、如何测试**  
   Describe what changed, why, and how to test
6. 关联相关 Issue（`Fixes #123`）  
   Link related issues when applicable

维护者会在合理时间内 Review；大型改动建议先开 Issue 讨论。  
Maintainers will review in a reasonable timeframe; discuss large changes in an issue first.

---

## 代码风格 / Code Style

### TypeScript / React（`apps/alphadesk/`）

- 使用现有 **Tailwind v4** 与组件模式，避免引入无关 UI 库  
  Follow existing Tailwind v4 and component patterns; avoid new UI libraries
- API 调用集中在 `src/api/`，类型放在 `src/types/`  
  Keep API calls in `src/api/`, types in `src/types/`
- 用户可见文案走 **i18n**（`src/i18n/`），保持中英双语  
  User-facing strings via `src/i18n/` — maintain zh/en parity
- 优先函数组件与 hooks；保持文件职责单一  
  Prefer function components and hooks; single responsibility per file

### Rust（`apps/alphadesk/src-tauri/`）

- 遵循 `cargo fmt` 默认格式  
  Run `cargo fmt`
- 错误处理使用 `Result` / `thiserror`，避免裸 `unwrap`（测试除外）  
  Use `Result` / `thiserror`; avoid bare `unwrap` outside tests
- 侧车生命周期逻辑集中在 `sidecar.rs`  
  Sidecar lifecycle stays in `sidecar.rs`

### Python（`engine/`）

- 遵循 PEP 8；类型注解在新增/修改的公共 API 上尽量完整  
  PEP 8; type hints on new/changed public APIs
- FastAPI 路由放在 `api/v1/endpoints/`，Schema 放在 `api/v1/schemas/`  
  Routes in `api/v1/endpoints/`, schemas in `api/v1/schemas/`
- 业务逻辑优先放在 `src/services/`，避免在路由层堆叠复杂逻辑  
  Business logic in `src/services/`, not bloated route handlers
- `engine/` 部分代码来自上游 [daily_stock_analysis](https://github.com/ZhuLinsen/daily_stock_analysis)；跨项目通用修复可考虑向上游贡献  
  Some engine code is vendored from upstream; consider contributing generic fixes there

### 通用 / General

- **不要提交** `.env`、API Key、签名私钥、`data/` 运行时数据  
  Never commit `.env`, API keys, signing keys, or `data/` runtime files
- 文档改动保持中英双语或中英对照，与 README 风格一致  
  Docs: bilingual or side-by-side, consistent with README
- 避免无关重构或大范围格式化（减少 Review 噪音）  
  Avoid unrelated refactors or mass formatting

---

## 发布相关 / Releases

维护者使用标签 `v*` 触发 CI 发布。贡献者通常无需操作发布流程。  
Maintainers publish via `v*` tags and CI. Contributors normally don't need release steps.

若需了解签名、Secrets 与首次发布，见：  
For signing, secrets, and first release:

- [docs/RELEASE.md](docs/RELEASE.md)
- [docs/FIRST_RELEASE.md](docs/FIRST_RELEASE.md)

本地推送标签时，GitHub Personal Access Token 需包含 **`repo`** 与 **`workflow`** scopes。  
PAT for pushing tags needs **`repo`** and **`workflow`** scopes.

---

## 行为准则 / Code of Conduct

请保持尊重、建设性的沟通。骚扰、歧视或泄露他人隐私的内容不被接受。  
Be respectful and constructive. Harassment, discrimination, and doxxing are not tolerated.

---

## 许可证 / License

提交即表示你同意你的贡献在相应组件许可证下发布（Shell：MIT；Engine：MIT）。  
By contributing, you agree your contributions are licensed under the project's licenses (Shell: MIT; Engine: MIT).