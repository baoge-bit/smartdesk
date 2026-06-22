#!/usr/bin/env bash
set -euo pipefail

# Generate Tauri updater signing keypair for AlphaDesk releases.
# Private key → GitHub Secrets (TAURI_SIGNING_PRIVATE_KEY, TAURI_SIGNING_PRIVATE_KEY_PASSWORD)
# Public key  → GitHub Secrets (TAURI_SIGNING_PUBLIC_KEY) and/or tauri.conf.json pubkey field

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KEY_PATH="${1:-$HOME/.tauri/alphadesk-signing.key}"
APP_DIR="$ROOT/apps/alphadesk"

command -v npm >/dev/null || { echo "npm required"; exit 1; }

mkdir -p "$(dirname "$KEY_PATH")"

echo "==> Generating Tauri signing key"
echo "    Output: $KEY_PATH"
echo ""

cd "$APP_DIR"
echo "You will be prompted for an optional password."
npx tauri signer generate -w "$KEY_PATH"
echo ""
echo "Copy the public key printed above into TAURI_SIGNING_PUBLIC_KEY."

echo ""
echo "Next steps:"
echo "  1. Add GitHub repository secrets:"
echo "       TAURI_SIGNING_PRIVATE_KEY        = contents of $KEY_PATH"
echo "       TAURI_SIGNING_PRIVATE_KEY_PASSWORD = (password you chose, or empty)"
echo "       TAURI_SIGNING_PUBLIC_KEY         = public key from signer output"
echo "  2. CI injects the public key before build (see .github/workflows/release.yml)"
echo "  3. Push a tag to publish: git tag v1.0.0 && git push origin v1.0.0"
echo ""
echo "Keep the private key file safe and never commit it to git."