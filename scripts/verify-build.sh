#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

fail() { echo -e "${RED}✗${NC} $1"; exit 1; }
ok() { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}!${NC} $1"; }

echo "==> AlphaDesk build verification"
echo ""

# --- Prerequisites ---
command -v python3 >/dev/null || fail "python3 not found"
ok "python3 $(python3 --version 2>&1 | awk '{print $2}')"

if command -v node >/dev/null; then
  ok "node $(node -v)"
else
  fail "node not found — install Node.js ≥ 20.19"
fi

if command -v npm >/dev/null; then
  ok "npm $(npm -v)"
else
  fail "npm not found"
fi

if command -v rustc >/dev/null; then
  ok "rustc $(rustc -V | awk '{print $2}')"
else
  warn "rustc not found — web build only; install Rust for desktop packages"
fi

# --- Engine ---
if [ ! -d "engine/.venv" ]; then
  warn "engine/.venv missing — run ./scripts/setup.sh first"
else
  source engine/.venv/bin/activate
  python -c "import fastapi" >/dev/null 2>&1 && ok "Python engine deps OK" || warn "Engine deps incomplete"
  deactivate 2>/dev/null || true
fi

# --- Frontend typecheck + build ---
echo ""
echo "==> Frontend build"
cd apps/alphadesk
if [ ! -d node_modules ]; then
  warn "node_modules missing — running npm install"
  npm install
fi
npm run build
ok "Vite production build succeeded"
cd "$ROOT"

# --- Desktop bundle (optional) ---
if command -v rustc >/dev/null && command -v cargo >/dev/null; then
  echo ""
  echo "==> Tauri desktop build"
  cd apps/alphadesk
  npm run tauri:build
  ok "Tauri bundle created"
  echo ""
  echo "Installers:"
  find src-tauri/target/release/bundle -maxdepth 3 -type f \( -name '*.dmg' -o -name '*.msi' -o -name '*.exe' -o -name '*.AppImage' -o -name '*.deb' \) 2>/dev/null || true
  cd "$ROOT"
else
  warn "Skipping tauri:build (Rust toolchain not installed)"
fi

echo ""
ok "Build verification complete"