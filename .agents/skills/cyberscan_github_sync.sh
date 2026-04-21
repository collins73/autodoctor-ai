#!/bin/bash
# CodeGuard (CyberScan) GitHub Auto-Sync
# Commits and pushes any local changes to github.com/collins73/cyberscan

set -e

source /app/.agents/.env 2>/dev/null || true

cd /app/cyberscan

# Configure git
git config user.email "collinsd73@gmail.com"
git config user.name "Rebel AI"
git remote set-url origin https://collinsd73:${AUTODOCTOR}@github.com/collins73/cyberscan.git

# Pull latest from remote first
git pull --rebase origin main || true

# Stage all changes
git add -A

# Commit if there are changes
if git diff --cached --quiet; then
  echo "No changes to commit."
else
  git commit -m "Auto-sync: $(date -u '+%Y-%m-%d %H:%M:%S')"
  git push origin main
  echo "Pushed to github.com/collins73/cyberscan"
fi
