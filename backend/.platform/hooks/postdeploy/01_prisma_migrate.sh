#!/bin/bash
# Prisma db push - runs automatically after each EB deployment
# Safe for environments where migrations history may not be fully linear
# Requires: DATABASE_URL set in EB Environment Configuration

set -e

LOG_FILE="/var/log/eb-prisma-sync.log"
APP_DIR="/var/app/current"

echo "[$(date -Iseconds)] Starting Prisma schema sync (db push)" >> "$LOG_FILE" 2>&1

cd "$APP_DIR" || { echo "[$(date -Iseconds)] ERROR: Cannot cd to $APP_DIR" >> "$LOG_FILE"; exit 1; }

# DATABASE_URL is provided by Elastic Beanstalk environment variables
if [ -z "$DATABASE_URL" ]; then
  echo "[$(date -Iseconds)] ERROR: DATABASE_URL is not set" >> "$LOG_FILE"
  exit 1
fi

# Sync schema to DB (idempotent for existing schema, creates missing objects)
npx prisma db push >> "$LOG_FILE" 2>&1

echo "[$(date -Iseconds)] Prisma schema sync completed successfully" >> "$LOG_FILE"
