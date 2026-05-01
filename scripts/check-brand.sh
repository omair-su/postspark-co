#!/usr/bin/env bash
# Fails if any legacy brand name ("RepurposeAI" or "Repurpose AI") remains.
# Scans the repo while excluding generated/vendored files and this script.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PATTERN='RepurposeAI|Repurpose AI'

EXCLUDES=(
  --glob '!node_modules'
  --glob '!dist'
  --glob '!build'
  --glob '!.output'
  --glob '!.vinxi'
  --glob '!.lovable'
  --glob '!bun.lockb'
  --glob '!package-lock.json'
  --glob '!src/routeTree.gen.ts'
  --glob '!scripts/check-brand.sh'
)

if rg -n --hidden "${EXCLUDES[@]}" -e "$PATTERN" .; then
  echo ""
  echo "❌ Legacy brand name found. Replace with 'PostSpark'."
  exit 1
fi

echo "✅ No occurrences of 'RepurposeAI' or 'Repurpose AI' found."
