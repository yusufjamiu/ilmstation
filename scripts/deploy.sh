#!/usr/bin/env bash
# IlmStation deploy: build check → commit → push → wait until Vercel is live.
# Use:  ./scripts/deploy.sh "what you changed"
set -u
cd "$(dirname "$0")/.."
SITE="https://ilmstation.com"
MSG="${1:-Update}"

echo "① Checking the build (stops here if anything is broken)…"
if ! npm run build > /tmp/ilmstation-build.log 2>&1; then
  tail -25 /tmp/ilmstation-build.log
  echo; echo "❌ Build failed. Nothing was pushed. Send the lines above to Claude."; exit 1
fi
echo "   ✓ Build OK"

echo "② Files that changed:"
git status --short
if [ -z "$(git status --porcelain)" ]; then echo "   (no changes to save)"; else
  read -r -p "   Push these changes? (y/n) " ok
  [ "$ok" = "y" ] || { echo "Stopped. Nothing was pushed."; exit 0; }
  git add -A && git commit -q -m "$MSG" && echo "   ✓ Saved: $MSG"
fi

echo "③ Pushing to GitHub…"
git push -q || { echo "❌ Push failed (check your internet or GitHub login)."; exit 1; }
SHA="$(git rev-parse HEAD)"
echo "   ✓ Pushed ${SHA:0:7}"

echo "④ Waiting for Vercel to put it live (up to 10 minutes)…"
for i in $(seq 1 60); do
  LIVE="$(curl -s "$SITE/api/version?t=$(date +%s)" | sed -n 's/.*"sha":"\([^"]*\)".*/\1/p')"
  if [ "$LIVE" = "$SHA" ]; then echo; echo "✅ Live on $SITE (${SHA:0:7})"; exit 0; fi
  printf "."; sleep 10
done
echo; echo "⚠️ Not live after 10 minutes. Open Vercel → Deployments and check the top one."
