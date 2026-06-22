#!/usr/bin/env bash
# Bundle Python engine as Tauri sidecar binary via PyInstaller
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENGINE_DIR="$ROOT/engine"
OUT_DIR="$ROOT/apps/alphadesk/src-tauri/binaries"
SPEC="$ENGINE_DIR/alphadesk-engine.spec"

source "$ENGINE_DIR/.venv/bin/activate"
pip install pyinstaller

cd "$ENGINE_DIR"
pyinstaller "$SPEC" --noconfirm --clean

mkdir -p "$OUT_DIR"
# Tauri expects: binaries/alphadesk-engine-<target-triple>
for bin in dist/alphadesk-engine*; do
  cp "$bin" "$OUT_DIR/"
done

echo "Sidecar binaries copied to $OUT_DIR"
echo "Run: cd apps/alphadesk && npm run tauri:build"