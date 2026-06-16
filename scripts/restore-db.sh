#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 <backup-file> <target-database-url>"
  exit 1
fi

pg_restore --clean --if-exists --no-owner --dbname="$2" "$1"
echo "Restore complete from: $1"
