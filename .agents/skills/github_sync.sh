#!/bin/bash
# AutoDoctor AI — GitHub Auto-Sync Skill
# Commits and pushes any changes to the autodoctor-ai repo

set -e

REPO_DIR="/app/vehicle-agent"
REPO_URL="https://collins73:${AUTODOCTOR}@github.com/collins73/autodoctor-ai.git"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

cd $REPO_DIR

# Make sure remote is set correctly
git remote set-url origin $REPO_URL

# Check for any changes
if [[ -n $(git status --porcelain) ]]; then
  git add -A
  git commit -m "Auto-sync: $TIMESTAMP"
  git push origin main
  echo "✅ Changes pushed to GitHub at $TIMESTAMP"
else
  echo "⚡ No changes detected at $TIMESTAMP — repo is up to date."
fi
