#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> AlphaDesk setup"

# Python engine venv
if [ ! -d "engine/.venv" ]; then
  echo "Creating Python virtual environment..."
  python3 -m venv engine/.venv
fi

source engine/.venv/bin/activate
pip install --upgrade pip
pip install -r engine/requirements.txt

# Frontend deps
if command -v npm >/dev/null 2>&1; then
  echo "Installing frontend dependencies..."
  cd apps/alphadesk
  npm install
  cd "$ROOT"
else
  echo "WARN: npm not found — install Node.js 20+ and re-run setup"
fi

# Env file
if [ ! -f "engine/.env" ] && [ -f ".env.example" ]; then
  cp .env.example engine/.env
  echo "Created engine/.env from .env.example"
fi

mkdir -p data logs

echo ""
echo "Setup complete. Next steps:"
echo "  ./scripts/dev.sh          # Start engine + frontend (web dev)"
echo "  cd apps/alphadesk && npm run tauri:dev   # Full desktop app"