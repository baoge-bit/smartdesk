#!/usr/bin/env bash
# Bundle Python engine as Tauri sidecar binary via PyInstaller
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENGINE_DIR="$ROOT/engine"
OUT_DIR="$ROOT/apps/alphadesk/src-tauri/binaries"
SPEC="$ENGINE_DIR/alphadesk-engine.spec"

if [ -f "$ENGINE_DIR/.venv/Scripts/activate" ]; then
  source "$ENGINE_DIR/.venv/Scripts/activate"
else
  source "$ENGINE_DIR/.venv/bin/activate"
fi
pip install -r "$ENGINE_DIR/requirements-bundle.txt" pyinstaller

cd "$ENGINE_DIR"
pyinstaller "$SPEC" --noconfirm --clean

mkdir -p "$OUT_DIR"
# Tauri expects: binaries/alphadesk-engine-<target-triple>
TARGET_TRIPLE="$(rustc -vV 2>/dev/null | sed -n 's/^host: //p' || uname -m)"
case "$TARGET_TRIPLE" in
  aarch64-apple-darwin|arm64-apple-darwin) TRIPLE="aarch64-apple-darwin" ;;
  x86_64-apple-darwin) TRIPLE="x86_64-apple-darwin" ;;
  x86_64-unknown-linux-gnu) TRIPLE="x86_64-unknown-linux-gnu" ;;
  x86_64-pc-windows-msvc) TRIPLE="x86_64-pc-windows-msvc" ;;
  *) TRIPLE="$TARGET_TRIPLE" ;;
esac
BIN="dist/alphadesk-engine"
if [ -f "${BIN}.exe" ]; then
  cp "${BIN}.exe" "$OUT_DIR/alphadesk-engine-${TRIPLE}.exe"
else
  cp "$BIN" "$OUT_DIR/alphadesk-engine-${TRIPLE}"
  chmod +x "$OUT_DIR/alphadesk-engine-${TRIPLE}"
fi

echo "Sidecar binaries copied to $OUT_DIR"
echo "Run: cd apps/alphadesk && npm run tauri:build"