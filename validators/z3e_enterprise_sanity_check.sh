#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCHEMA="$ROOT/shared/schema.ts"

echo "[INFO] Z3E enterprise sanity check"
echo "[INFO] Repo root: $ROOT"

if [ -f "$SCHEMA" ]; then
  echo "[PASS] Canonical schema present: shared/schema.ts"
  exit 0
else
  echo "[CRITICAL] Canonical schema MISSING: shared/schema.ts"
  exit 1
fi