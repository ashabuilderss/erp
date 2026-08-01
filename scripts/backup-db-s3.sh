#!/bin/bash
# Asha Builders ERP - Automated PostgreSQL Backup to S3
# Designed to run via cron (e.g. 0 2 * * * for 2 AM daily)
# Requires: pg_dump, aws-cli
#
# S3 Lifecycle Rule for 30-day auto-deletion should be configured 
# on the bucket using AWS Console or Terraform.

set -e

# Load environment variables
if [ -f "/etc/asha-erp/.env.production" ]; then
  source /etc/asha-erp/.env.production
fi

DB_URL=${DATABASE_URL:-"postgresql://user:password@localhost:5432/asha_erp"}
S3_BUCKET=${BACKUP_S3_BUCKET:-"s3://asha-erp-db-backups"}
BACKUP_DIR="/tmp/db_backups"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="asha_erp_backup_${TIMESTAMP}.sql.gz"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

# Create temp dir
mkdir -p "$BACKUP_DIR"

echo "Starting database backup..."
# Dump and compress
pg_dump --dbname="$DB_URL" --format=c | gzip > "$BACKUP_PATH"

echo "Backup created at $BACKUP_PATH. Uploading to S3..."
# Upload to S3
aws s3 cp "$BACKUP_PATH" "${S3_BUCKET}/${BACKUP_FILE}"

# Clean up local file
rm "$BACKUP_PATH"
echo "Backup successfully uploaded and local file removed."
