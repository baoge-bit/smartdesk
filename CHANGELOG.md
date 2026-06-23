# Changelog

All notable changes to **AlphaDesk** (阿尔法工作台) are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- Windows release CI: commit `icons/icon.ico` required by `tauri-build` for Windows Resource generation
- macOS x86_64 release CI: set `TAURI_BUNDLER_DMG_IGNORE_CI=false` so DMG bundling skips Finder AppleScript on headless runners
- App icons converted to RGBA PNG (fixes Tauri `generate_context!` build failure on all platforms)
- macOS x86_64 sidecar: use `setup-python` `architecture: x64` instead of Rosetta `arch` prefix
- macOS x86_64 Tauri build: install `x86_64-apple-darwin` Rust target and configure cross-linker
- macOS CI bundles: ad-hoc code signing (`signingIdentity: "-"`) for unsigned GitHub Actions builds
- Rust `Emitter` trait imports for Tauri v2 tray and engine-ready events
- Release CI: Windows bash steps, per-architecture PyInstaller sidecar builds, exclude `longbridge` from bundle deps
- Committed `Cargo.lock` for reproducible Rust dependency resolution in releases

### Planned

- Replace upstream demo GIF with AlphaDesk-specific screenshots
- Expand automated test coverage (frontend + engine API)
- Full License Key validation and premium feature gating

---

## [1.0.0] - 2026-06-22

First public release of AlphaDesk — a cross-platform desktop research workspace built on the [daily_stock_analysis](https://github.com/ZhuLinsen/daily_stock_analysis) engine.

### Added

#### Desktop shell (Tauri v2 + React)

- Cross-platform desktop app (macOS arm64/x64, Windows, Linux) with system tray and notifications
- React 19 + TypeScript + Tailwind v4 UI with light/dark themes and bilingual (zh/en) interface
- Resizable multi-panel workspace: watchlist, AI decision dashboard, charts (TradingView Lightweight Charts)
- Onboarding wizard (4-step flow with engine health check and LLM connectivity test)
- Command palette (⌘K) with strategy and report shortcuts
- Schema-driven Settings page with LLM, data source, and notification configuration
- Secure credential storage via Tauri Secure Store; SQLite for engine data
- Auto-update foundation (startup check, settings page, tray menu; requires signing secrets for production)
- Premium License Key placeholder (`ALPHA-` + 16+ alphanumeric) for feature gating demo

#### Research & analysis features (inherited from engine + desktop integration)

- Watchlist management with symbol autocomplete and pinyin search
- One-click and scheduled stock analysis across A-share, HK, US, JP, KR markets
- AI decision dashboard with K-line charts, multi-stock compare, and decision signals
- Agent strategy chat with 15+ strategies, SSE streaming progress, and session history
- Historical reports browser with compare view, re-analyze, and export (PDF / Markdown / PNG)
- Backtesting with results table and performance metrics
- Portfolio management with allocation chart
- Report export via WeasyPrint (server-side PDF) with HTML print fallback

#### Tooling & CI/CD

- `scripts/setup.sh`, `dev.sh`, `verify-build.sh`, `release.sh`, `build-engine.sh`
- GitHub Actions: `verify.yml` (frontend build + engine import) and `release.yml` (4-platform Tauri bundles)
- PyInstaller sidecar packaging (`alphadesk-engine.spec`) for bundled Python engine
- Tauri updater signing key generation script and release note template

### Changed

- Vendored `daily_stock_analysis` engine adapted for AlphaDesk desktop entry (`alphadesk_entry.py`) and FastAPI sidecar mode
- Engine configuration surfaced through desktop Settings UI instead of CLI-only workflow

### Fixed

- TypeScript strict-build errors blocking `npm run build` in CI (unused imports, type narrowing)
- `release.yml` workflow validation failure when `secrets` were referenced in `if` conditions
- `setup-node` cache failure when `package-lock.json` was missing
- `release.sh` version read fallback when Node.js is not installed

### Documentation

- README: Demo/Screenshots, Architecture, Features table, Quick Start, First Run guide, Roadmap / Known Limitations
- `CONTRIBUTING.md` (bilingual contributor guide)
- `docs/ARCHITECTURE.md`, `docs/RELEASE.md`, `docs/FIRST_RELEASE.md`
- GitHub PAT `repo` + `workflow` scope warnings for HTTPS tag pushes

---

## Engine lineage

AlphaDesk bundles the analysis engine from [daily_stock_analysis](https://github.com/ZhuLinsen/daily_stock_analysis) (MIT).
Core engine capabilities at vendoring time include:

- Multi-market data sources (AkShare, Tushare, yfinance, Longbridge, etc.)
- LLM-powered analysis pipeline (Ollama, OpenAI-compatible APIs)
- 15+ agent investment strategies
- Scheduled analysis and notification hooks
- FastAPI REST API for desktop and automation integration

See [README — Updating the Engine](README.md#updating-the-engine) for sync instructions.

[Unreleased]: https://github.com/baoge-bit/smartdesk/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/baoge-bit/smartdesk/releases/tag/v1.0.0