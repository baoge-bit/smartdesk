# AlphaDesk Release Guide

## Prerequisites

- Node.js ≥ 20.19, Rust stable, Python ≥ 3.10
- `./scripts/setup.sh` completed locally
- GitHub repo: [baoge-bit/smartdesk](https://github.com/baoge-bit/smartdesk)

## Local build verification

```bash
chmod +x scripts/*.sh
./scripts/verify-build.sh
```

This runs `npm run build` and, when Rust is installed, `npm run tauri:build`.
Installers appear under `apps/alphadesk/src-tauri/target/release/bundle/`.

## App icons

Source icon: `apps/alphadesk/assets/app-icon.png` (1024×1024).

Regenerate all platform icons after updating the source:

```bash
cd apps/alphadesk
npm run tauri:icon
```

## Updater signing (one-time setup)

```bash
./scripts/generate-tauri-signing-key.sh
```

Add these **GitHub repository secrets**:

| Secret | Value |
|--------|--------|
| `TAURI_SIGNING_PRIVATE_KEY` | Full contents of the generated `.key` file |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Key password (empty string if none) |
| `TAURI_SIGNING_PUBLIC_KEY` | Public key string printed by `tauri signer` |

The release workflow injects `TAURI_SIGNING_PUBLIC_KEY` into `tauri.conf.json` before building.

Updater endpoint (already configured):

```
https://github.com/baoge-bit/smartdesk/releases/latest/download/latest.json
```

## Publishing a release

```bash
./scripts/release.sh v1.0.0
```

Or manually:

```bash
git tag v1.0.0
git push origin v1.0.0
```

### GitHub Personal Access Token scopes

When pushing tags or `main` over HTTPS with a PAT (not SSH), the token must include:

| Scope | Why |
|-------|-----|
| `repo` | Push commits and create GitHub Releases |
| `workflow` | Trigger and update GitHub Actions workflows |

For fine-grained tokens: grant **Contents** (Read and write) and **Actions** (Read and write) on `baoge-bit/smartdesk`.

First release walkthrough: [FIRST_RELEASE.md](FIRST_RELEASE.md).

This triggers [`.github/workflows/release.yml`](../.github/workflows/release.yml), which:

1. Builds the Python sidecar with PyInstaller
2. Builds Tauri bundles for macOS (arm64 + x64), Linux, and Windows
3. Creates a **draft** GitHub Release with signed update artifacts

Publish the draft release in GitHub when smoke-tested.

## In-app update UX

The desktop app automatically checks for updates ~6 seconds after launch (production builds only). Users can also:

- Open **Settings → Software Update** to check manually
- Use the tray menu **检查更新 / Check for Updates**

When a signed newer version is found, a banner offers one-click download & install (app restarts on completion).

## Manual release (without CI)

```bash
./scripts/build-engine.sh
cd apps/alphadesk
npm run tauri:build
```