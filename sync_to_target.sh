#!/usr/bin/env bash
# =============================================================================
# Helper: Syncs verified finalwork/ to warmup/ or main/ for Hack2skill / Vercel
# Usage: ./sync_to_target.sh [warmup | main]
# =============================================================================

TARGET="${1:-main}"

if [ "$TARGET" != "warmup" ] && [ "$TARGET" != "main" ]; then
  echo "Usage: $0 [warmup | main]"
  exit 1
fi

echo "================================================================="
echo "  SYNCING VERIFIED finalwork/ INTO $TARGET/ FOR SUBMISSION        "
echo "================================================================="

# Copy all source, server, testscript, data, and configurations
cp -R finalwork/src/ "$TARGET/src/"
cp -R finalwork/server/ "$TARGET/server/"
cp -R finalwork/testscript/ "$TARGET/testscript/"
cp -R finalwork/test_data/ "$TARGET/test_data/"
cp -R finalwork/api/ "$TARGET/api/"
cp finalwork/package.json "$TARGET/package.json"
cp finalwork/tsconfig.json "$TARGET/tsconfig.json"
cp finalwork/vite.config.ts "$TARGET/vite.config.ts"
cp finalwork/tailwind.config.js "$TARGET/tailwind.config.js"
cp finalwork/postcss.config.js "$TARGET/postcss.config.js"
cp finalwork/index.html "$TARGET/index.html"
cp finalwork/README.md "$TARGET/README.md"
cp finalwork/dev.ts "$TARGET/dev.ts"
cp finalwork/.env.example "$TARGET/.env.example"

if [ -f finalwork/vercel.json ]; then
  cp finalwork/vercel.json "$TARGET/vercel.json"
fi

echo "✅ Successfully synced finalwork/ into $TARGET/."
echo "You can now push or deploy with zero missing dependencies!"
