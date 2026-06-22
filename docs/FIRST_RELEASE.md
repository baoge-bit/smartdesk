# AlphaDesk 首次 GitHub Release 清单

目标仓库：[baoge-bit/smartdesk](https://github.com/baoge-bit/smartdesk)

## 1. 本地准备

```bash
chmod +x scripts/*.sh
./scripts/setup.sh
./scripts/verify-build.sh          # 可选但推荐
```

生成 lockfile（CI 推荐）：

```bash
cd apps/alphadesk && npm install   # 生成 package-lock.json 后提交
```

## 2. 初始化 Git 并首次推送

```bash
git init
git add .
git commit -m "feat: AlphaDesk v1.0.0 initial release"
git branch -M main
git remote add origin https://github.com/baoge-bit/smartdesk.git
git push -u origin main
```

## 3. 配置 GitHub Secrets

仓库 **Settings → Secrets and variables → Actions**：

| Secret | 说明 |
|--------|------|
| `TAURI_SIGNING_PRIVATE_KEY` | `./scripts/generate-tauri-signing-key.sh` 生成的私钥全文 |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | 私钥密码（无密码可留空字符串） |
| `TAURI_SIGNING_PUBLIC_KEY` | 签名 CLI 输出的公钥 |

> 未配置签名时 CI 仍可构建，但自动更新签名会不可用。

## 4. 打标签触发 Release

```bash
./scripts/release.sh v1.0.0
```

或手动：

```bash
./scripts/bump-version.sh 1.0.0    # 同步版本号
git add -A && git commit -m "chore: release v1.0.0"
git tag v1.0.0
git push origin main
git push origin v1.0.0
```

## 5. CI 完成后

1. 打开 [Actions](https://github.com/baoge-bit/smartdesk/actions) 确认 4 个平台构建成功
2. 打开 [Releases](https://github.com/baoge-bit/smartdesk/releases) 找到 **Draft** 发布
3. 检查安装包：`.dmg` / `.msi` / `.AppImage` 等
4. 点击 **Publish release** 正式发布

## 6. 验证自动更新

- 安装旧版或当前版桌面应用
- 将 Release 版本号提高到 `v1.0.1` 并重复发布流程
- 启动应用 → 设置 → 软件更新，或等待启动横幅提示

## 故障排查

| 问题 | 处理 |
|------|------|
| `npm ci` 失败 | 提交 `apps/alphadesk/package-lock.json` |
| PyInstaller 失败 | 检查 `engine/requirements.txt` 与 `alphadesk-engine.spec` |
| Linux 构建失败 | workflow 已装 webkit2gtk 依赖 |
| 更新检查失败 | 确认 `TAURI_SIGNING_PUBLIC_KEY` 与 Release 中 `latest.json` 存在 |