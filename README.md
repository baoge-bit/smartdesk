# AlphaDesk · 阿尔法工作台

<p align="center">
  <strong>Professional AI multi-market stock research workspace</strong><br/>
  专业 AI 多市场股票研究工作台
</p>

AlphaDesk 将开源项目 [daily_stock_analysis](https://github.com/ZhuLinsen/daily_stock_analysis) 的分析引擎，封装为跨平台的 **桌面研究工作台** —— 自选股、AI 决策看板、策略问股、历史报告、回测与持仓管理，统一在多面板界面中完成。

---

## Architecture

```
Tauri v2 Shell (Rust)  →  React + TypeScript + Tailwind UI
        ↓ localhost HTTP
Python FastAPI Engine (sidecar)  →  LLM · 数据源 · 策略 · 报告
        ↓
SQLite + 系统密钥链（设置、历史、API Key）
```

完整设计说明见 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)。

### Tech Stack

| Layer | Choice |
|-------|--------|
| Desktop shell | **Tauri v2** — 系统托盘、通知、密钥链、自动更新 |
| Frontend | **React 19 + TypeScript + Tailwind v4** |
| Engine | **Python FastAPI**（基于 daily_stock_analysis） |
| Charts | TradingView Lightweight Charts — 看板 K 线 + 实时报价 |
| Local data | SQLite（引擎）+ Tauri Secure Store（密钥） |

---

## Features

| Feature | 中文 | Status |
|---------|------|--------|
| Watchlist + autocomplete | 自选股管理 / 拼音补全 | ✅ |
| One-click / scheduled analysis | 一键 / 定时分析 | ✅ |
| AI Decision Dashboard + multi-stock compare | AI 决策看板 / 多股对比 | ✅ |
| Agent Strategy Chat (15+ strategies) | 策略问股 | ✅ |
| Agent chat SSE streaming | 策略问股流式进度 | ✅ |
| Chat session history | 问股会话历史 / 切换 | ✅ |
| Historical reports browser + compare + re-analyze | 历史报告 / 对比 / 重新分析 | ✅ |
| Backtesting | 回测 | ✅ |
| Portfolio management + allocation chart | 持仓管理 / 资产配置图 | ✅ |
| Decision signals | 决策信号 | ✅ |
| Report export (PDF / MD / PNG) | 报告导出 | ✅ |
| Settings (schema-driven, LLM, data, notify) | 系统设置（Schema 驱动） | ✅ |
| System tray + notifications | 系统托盘 / 通知 | ✅ |
| Command palette (⌘K, strategies/reports) | 命令面板（策略/报告增强） | ✅ |
| Onboarding wizard (4-step + LLM test) | 入门向导（4 步 + LLM 测试） | ✅ |
| Light / Dark themes | 浅色 / 深色主题 | ✅ |
| Bilingual UI (zh/en) | 中英双语 | ✅ |
| Legal disclaimers | 风险提示 | ✅ |
| Auto-update (Tauri) | 自动更新（启动检查 + 设置页 + 托盘） | ✅ |

> **风险提示（分析界面均会展示）：**  
> 本工具仅提供辅助分析，不构成投资建议。市场有风险，投资需谨慎。  
> This tool provides auxiliary analysis only and does not constitute investment advice.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 20.19 |
| Rust | stable（桌面版需要） |
| Python | ≥ 3.10 |
| 平台依赖 | 见 [Tauri 环境要求](https://v2.tauri.app/start/prerequisites/) |

**离线模式（推荐本地开发）：** 安装 [Ollama](https://ollama.com/) 及中文模型（如 `qwen2.5:14b`）。

---

## Quick Start

### 1. 克隆与安装

```bash
git clone https://github.com/baoge-bit/smartdesk.git
cd smartdesk
chmod +x scripts/*.sh
./scripts/setup.sh
```

`setup.sh` 会完成：创建 Python 虚拟环境、安装引擎依赖、执行 `npm install`、从 `.env.example` 生成 `engine/.env`。

### 2. 配置分析引擎

```bash
cp .env.example engine/.env   # 若 setup 已创建可跳过
# 编辑 engine/.env — 至少配置 STOCK_LIST 和一个 LLM 提供商
```

**Ollama（离线，推荐）：**

```env
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5:14b
STOCK_LIST=600519,hk00700,AAPL
```

**DeepSeek / OpenAI 兼容 API：**

```env
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.deepseek.com/v1
OPENAI_MODEL=deepseek-chat
```

### 3. 启动与打开软件

AlphaDesk 有两种使用方式：

#### 方式 A：浏览器开发模式（最快，适合改 UI）

```bash
./scripts/dev.sh
```

脚本会自动启动 Python 引擎（默认 `http://127.0.0.1:18765`）和 Vite 前端。

**打开方式：** 在浏览器访问 **http://localhost:1420**

> 这是 Web 界面，不是独立窗口，但功能与桌面版基本一致。

#### 方式 B：完整桌面应用（推荐日常使用）

```bash
cd apps/alphadesk
npm run tauri:dev
```

**打开方式：**

- 首次编译完成后，会**自动弹出** AlphaDesk 桌面窗口
- 关闭窗口后应用会**最小化到系统托盘**（macOS 菜单栏 / Windows 任务栏），点击托盘图标可再次打开
- 托盘菜单支持：快速分析、打开工作台、切换定时任务、退出

#### 方式 C：安装正式版（自行构建后）

```bash
cd apps/alphadesk
npm run tauri:build
```

构建产物位于 `apps/alphadesk/src-tauri/target/release/bundle/`：

| 平台 | 安装包 | 打开方式 |
|------|--------|----------|
| macOS | `.dmg` / `.app` | 双击 `.dmg` 安装，从「应用程序」或 Launchpad 启动 **AlphaDesk** |
| Windows | `.msi` / `.exe` | 运行安装程序，从开始菜单启动 **AlphaDesk** |
| Linux | `.AppImage` / `.deb` | 双击 AppImage，或通过包管理器安装 `.deb` |

### 4. 首次使用

1. 完成**入门向导**（配置 LLM、导入自选股、选择默认策略）
2. 在左侧**自选股**面板添加或选择股票
3. 中间**工作台**查看看板与 K 线，点击「一键分析」生成报告
4. 通过侧边栏访问：策略问股、历史报告、回测、持仓、决策信号、设置

---

## Build Verification

```bash
chmod +x scripts/*.sh
./scripts/verify-build.sh
```

Runs frontend production build and (when Rust is installed) `npm run tauri:build`.
Release signing and publishing: [docs/RELEASE.md](docs/RELEASE.md).  
**First-time publish:** [docs/FIRST_RELEASE.md](docs/FIRST_RELEASE.md) · `./scripts/release.sh v1.0.0`

---

## Building Releases

### 打包 Python 侧车（Sidecar）

```bash
./scripts/build-engine.sh
```

输出位于 `apps/alphadesk/src-tauri/binaries/`。

### PDF 报告导出

通过 `POST /api/v1/export/pdf` 导出决策报告：

- **服务端 PDF（质量最佳）：** 在引擎 venv 中安装 WeasyPrint：
  ```bash
  pip install weasyprint   # macOS: brew install pango gdk-pixbuf libffi
  ```
- **回退方案：** 返回 HTML，桌面端打开系统打印对话框另存为 PDF。

导出入口：**决策看板** 与 **历史报告** 页面的导出菜单（PDF / Markdown / PNG 图片 / 打印）。

### 许可证密钥（Premium 占位）

开发/演示用密钥格式：`ALPHA-` + 至少 16 位字母数字，可在 **设置 → 许可证** 激活高级功能门控。

### CI 发布

推送标签 `v1.0.0` 触发 [`.github/workflows/release.yml`](.github/workflows/release.yml)。

**签名更新所需 Secrets：**

- `TAURI_SIGNING_PRIVATE_KEY`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`

---

## Project Structure

```
smartdesk/
├── apps/alphadesk/          # Tauri + React 前端
│   ├── src/                 # 页面、组件、API 客户端
│   └── src-tauri/           # Rust 壳、托盘、侧车启动
├── engine/                  # Python 分析引擎
│   ├── api/                 # FastAPI 路由
│   ├── src/                 # 分析流水线
│   ├── strategies/          # 15+ Agent 策略
│   └── alphadesk_entry.py   # 桌面入口
├── docs/ARCHITECTURE.md
├── scripts/                 # setup、dev、build 脚本
└── .github/workflows/       # Release CI
```

---

## Troubleshooting

### 引擎无法启动

1. 手动测试：`source engine/.venv/bin/activate && python engine/alphadesk_entry.py --port 18765`
2. 查看日志：`data/logs/`
3. 确认端口未被占用：`lsof -i :18765`

### LLM 相关错误

| 现象 | 处理 |
|------|------|
| Ollama 连接被拒绝 | 启动 Ollama：`ollama serve` |
| 云端 API 返回 401 | 检查设置页或 `engine/.env` 中的 API Key |
| 分析超时 | 换更快模型，或减少自选股数量 |
| 中文乱码 | 使用支持中文的模型（Qwen、DeepSeek 等） |

### 数据源问题

| 提供商 | 说明 |
|--------|------|
| AkShare | 无需 Key，可能限流 |
| Tushare | 需要 `TUSHARE_TOKEN` |
| yfinance | 美股 / 港股 / 日股 / 韩股 |
| Longbridge | 需要 app key + secret + access token |

### 桌面窗口空白

```bash
cd apps/alphadesk && npm run build && npm run tauri:build
```

并检查 `data/logs/` 是否有资源包不匹配（上游 issue #1064）。

---

## Updating the Engine

`engine/` 目录来自上游 vendoring，同步方式：

```bash
cd engine
git remote add upstream https://github.com/ZhuLinsen/daily_stock_analysis.git 2>/dev/null || true
git fetch upstream && git merge upstream/main
```

或直接复制：`rsync -a --exclude='.git' upstream_repo/ engine/`

---

## License

- AlphaDesk shell（Tauri + React）：MIT
- Engine：MIT（来自 [daily_stock_analysis](https://github.com/ZhuLinsen/daily_stock_analysis)）

---

## Acknowledgments

基于 [ZhuLinsen/daily_stock_analysis](https://github.com/ZhuLinsen/daily_stock_analysis) 的优秀工作构建。