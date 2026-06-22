#!/usr/bin/env bash
set -euo pipefail

# Tag and push a GitHub Release for AlphaDesk.
# Usage: ./scripts/release.sh [v1.0.0] [--skip-verify]
#
# Prerequisites:
#   - git remote origin → https://github.com/baoge-bit/smartdesk
#   - GitHub Secrets configured (see docs/RELEASE.md)
#   - Clean working tree (or use --allow-dirty)

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

TAG="${1:-v1.0.0}"
SKIP_VERIFY=false
ALLOW_DIRTY=false

for arg in "$@"; do
  case "$arg" in
    --skip-verify) SKIP_VERIFY=true ;;
    --allow-dirty) ALLOW_DIRTY=true ;;
    v*) TAG="$arg" ;;
  esac
done

[[ "$TAG" == v* ]] || TAG="v$TAG"
VERSION="${TAG#v}"

echo "==> AlphaDesk release: $TAG"
echo ""

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "Error: not a git repository. Run:" >&2
  echo "  git init && git remote add origin https://github.com/baoge-bit/smartdesk.git" >&2
  exit 1
fi

if [[ "$ALLOW_DIRTY" != true ]] && [[ -n "$(git status --porcelain)" ]]; then
  echo "Error: working tree has uncommitted changes." >&2
  echo "Commit first, or pass --allow-dirty" >&2
  git status --short
  exit 1
fi

REMOTE_URL="$(git remote get-url origin 2>/dev/null || echo '')"
if [[ -z "$REMOTE_URL" ]]; then
  echo "Warning: no git remote 'origin'. Add with:" >&2
  echo "  git remote add origin https://github.com/baoge-bit/smartdesk.git" >&2
elif [[ "$REMOTE_URL" != *"baoge-bit/smartdesk"* ]]; then
  echo "Warning: origin is not baoge-bit/smartdesk ($REMOTE_URL)" >&2
fi

CURRENT="$(node -p "require('./apps/alphadesk/package.json').version" 2>/dev/null || echo '')"
if [[ "$CURRENT" != "$VERSION" ]]; then
  echo "Syncing version to $VERSION ..."
  "$ROOT/scripts/bump-version.sh" "$VERSION"
  echo "Version files updated — commit them before tagging if needed."
fi

if [[ "$SKIP_VERIFY" != true ]] && command -v npm >/dev/null; then
  echo ""
  echo "==> Running build verification"
  "$ROOT/scripts/verify-build.sh" || {
    echo "Build verification failed. Fix errors or use --skip-verify" >&2
    exit 1
  }
else
  echo "Skipping local build verify (npm missing or --skip-verify)"
fi

if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "Tag $TAG already exists locally."
else
  echo ""
  echo "Creating annotated tag $TAG ..."
  git tag -a "$TAG" -m "AlphaDesk $TAG"
fi

echo ""
echo "==> Push to GitHub"
echo "    git push origin main"
echo "    git push origin $TAG"
echo ""
read -r -p "Push main and tag now? [y/N] " CONFIRM
if [[ "$CONFIRM" =~ ^[Yy]$ ]]; then
  git push origin main 2>/dev/null || git push origin master 2>/dev/null || git push origin HEAD
  git push origin "$TAG"
  echo ""
  echo "Tag pushed. Monitor CI: https://github.com/baoge-bit/smartdesk/actions"
  echo "When the draft release is ready, publish it on GitHub Releases."
else
  echo "Skipped push. Run manually when ready."
fi