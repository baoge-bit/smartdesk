#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${ALPHADESK_API_PORT:-18765}"

cleanup() {
  if [ -n "${ENGINE_PID:-}" ]; then
    kill "$ENGINE_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

echo "==> Starting AlphaDesk engine on port $PORT"
source "$ROOT/engine/.venv/bin/activate" 2>/dev/null || python3 -m venv "$ROOT/engine/.venv" && source "$ROOT/engine/.venv/bin/activate" && pip install -q -r "$ROOT/engine/requirements.txt"

export ALPHADESK_API_PORT="$PORT"
export ALPHADESK_DATA_DIR="$ROOT/data"
python "$ROOT/engine/alphadesk_entry.py" --port "$PORT" --data-dir "$ROOT/data" &
ENGINE_PID=$!

echo "==> Waiting for engine health..."
for i in $(seq 1 30); do
  if curl -sf "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1; then
    echo "Engine ready at http://127.0.0.1:$PORT"
    break
  fi
  sleep 0.5
done

export ALPHADESK_API_URL="http://127.0.0.1:$PORT"
cd "$ROOT/apps/alphadesk"
npm run dev