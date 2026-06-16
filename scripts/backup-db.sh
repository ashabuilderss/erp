#!/usr/bin/env bash
set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups"
FILE="$BACKUP_DIR/dashboard_$TIMESTAMP.dump"

mkdir -p "$BACKUP_DIR"
pg_dump --format=custom --no-owner --file="$FILE" "$@"
echo "Backup saved: $FILE"
