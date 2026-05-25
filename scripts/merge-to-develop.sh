#!/bin/bash
set -e

echo "=== PR: refactor → develop ==="

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

# Check gh is installed
if ! command -v gh &> /dev/null; then
  echo "❌ gh (GitHub CLI) is not installed."
  echo "   Install: https://cli.github.com/"
  echo "   Or manually create PR at: https://github.com/ednosmab/ipu-calculator"
  exit 1
fi

# Check gh auth
if ! gh auth status &> /dev/null; then
  echo "❌ gh is not authenticated. Run: gh auth login"
  exit 1
fi

# Push refactor
echo "→ Pushing refactor..."
git push origin refactor

# Create PR
echo "→ Creating PR refactor → develop..."
PR_URL=$(gh pr create \
  --base develop \
  --head refactor \
  --title "Merge refactor into develop" \
  --body "Automated PR for staging deploy." \
  --label "staging")

echo ""
echo "✅ PR created!"
echo "   $PR_URL"
echo ""
echo "Next steps:"
echo "   1. Wait for CI to pass (check PR above)"
echo "   2. Merge on GitHub → bump.yml bumps version + builds"
echo "   Staging: https://ipu-calculator-staging.vercel.app"
