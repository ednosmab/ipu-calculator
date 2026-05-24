#!/bin/bash
set -e

echo "=== Merge refactor → develop ==="

# Ensure we're on refactor
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "refactor" ]; then
  echo "❌ You must be on refactor branch. Current: $BRANCH"
  exit 1
fi

# Check for uncommitted changes
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "❌ Uncommitted changes. Commit or stash first."
  exit 1
fi

# Bump version
echo "→ Bumping patch version..."
node scripts/bump-version.js
git add package.json
git commit -m "chore: bump version to $(node -p "require('./package.json').version")"

# Push refactor
echo "→ Pushing refactor..."
git push origin refactor

# Merge to develop
echo "→ Merging to develop..."
git checkout develop
git pull origin develop
git merge refactor --no-ff -m "chore: merge refactor into develop"
git push origin develop

# Back to refactor
git checkout refactor

echo ""
echo "✅ Done! Version bumped and merged to develop."
echo "   Staging: https://ipu-calculator-staging.vercel.app"
