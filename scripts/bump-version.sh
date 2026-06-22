#!/usr/bin/env bash
set -euo pipefail

# Sync AlphaDesk version across package.json, tauri.conf.json, and Cargo.toml
# Usage: ./scripts/bump-version.sh 1.0.0

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="${1:-}"

if [[ -z "$VERSION" ]]; then
  echo "Usage: $0 <version>" >&2
  echo "Example: $0 1.0.0" >&2
  exit 1
fi

# Strip leading v if provided
VERSION="${VERSION#v}"

PKG_JSON="$ROOT/apps/alphadesk/package.json"
TAURI_CONF="$ROOT/apps/alphadesk/src-tauri/tauri.conf.json"
CARGO_TOML="$ROOT/apps/alphadesk/src-tauri/Cargo.toml"

for f in "$PKG_JSON" "$TAURI_CONF" "$CARGO_TOML"; do
  [[ -f "$f" ]] || { echo "Missing $f" >&2; exit 1; }
done

PKG_JSON="$PKG_JSON" TAURI_CONF="$TAURI_CONF" CARGO_TOML="$CARGO_TOML" VERSION="$VERSION" node <<'NODE'
const fs = require('fs');
const version = process.env.VERSION;
const files = [
  [process.env.PKG_JSON, (raw) => { const j = JSON.parse(raw); j.version = version; return JSON.stringify(j, null, 2) + '\n'; }],
  [process.env.TAURI_CONF, (raw) => { const j = JSON.parse(raw); j.version = version; return JSON.stringify(j, null, 2) + '\n'; }],
  [process.env.CARGO_TOML, (raw) => raw.replace(/^version = ".*"/m, `version = "${version}"`)],
];
for (const [path, transform] of files) {
  const next = transform(fs.readFileSync(path, 'utf8'));
  fs.writeFileSync(path, next);
  console.log('Updated', path, '→', version);
}
NODE

echo ""
echo "Version bumped to $VERSION"
echo "Review diff, then commit and tag: git tag v$VERSION"