# Prisma Migrations on Elastic Beanstalk – Production Guide

## 1. Production Migration Strategy (Verified)

| Do | Don't |
|----|-------|
| `prisma migrate deploy` | `prisma migrate dev` |
| Run in postdeploy hook | Manual SSH + run |
| Idempotent (safe on every deploy) | `prisma db push` (no migration history) |
| Migrations in version control | Manual DB changes |

**Why `prisma migrate deploy`:** Applies only pending migrations, records them in `_prisma_migrations`, safe for redeploys.

---

## 2. Required Files in Repo

```
backend/
├── .platform/
│   └── hooks/
│       └── postdeploy/
│           └── 01_prisma_migrate.sh    # Must be executable (chmod +x)
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   │   ├── migration_lock.toml
│   │   └── 20250131000000_init/
│   │       └── migration.sql
│   └── seed.js
├── package.json
└── src-js/
    └── ...
```

**Exact paths:**
- `backend/.platform/hooks/postdeploy/01_prisma_migrate.sh`
- `backend/prisma/migrations/migration_lock.toml`
- `backend/prisma/migrations/<timestamp>_<name>/migration.sql`

---

## 3. Postdeploy Script (Exact Content)

**File:** `backend/.platform/hooks/postdeploy/01_prisma_migrate.sh`

```bash
#!/bin/bash
# Prisma migrate deploy - runs automatically after each EB deployment
# Idempotent: safe to run on every deploy (applies only pending migrations)
# Requires: DATABASE_URL set in EB Environment Configuration

set -e

LOG_FILE="/var/log/eb-prisma-migrate.log"
APP_DIR="/var/app/current"

echo "[$(date -Iseconds)] Starting Prisma migrate deploy" >> "$LOG_FILE" 2>&1

cd "$APP_DIR" || { echo "[$(date -Iseconds)] ERROR: Cannot cd to $APP_DIR" >> "$LOG_FILE"; exit 1; }

# DATABASE_URL is provided by Elastic Beanstalk environment variables
if [ -z "$DATABASE_URL" ]; then
  echo "[$(date -Iseconds)] ERROR: DATABASE_URL is not set" >> "$LOG_FILE"
  exit 1
fi

# Run migrations (idempotent - no-op if already applied)
npx prisma migrate deploy >> "$LOG_FILE" 2>&1

echo "[$(date -Iseconds)] Prisma migrate deploy completed successfully" >> "$LOG_FILE"
```

**Before deploy:** Ensure executable:
```bash
chmod +x backend/.platform/hooks/postdeploy/01_prisma_migrate.sh
```

---

## 4. Elastic Beanstalk Environment Variables

In **Configuration → Software → Environment properties**, set:

| Variable | Example | Required |
|----------|---------|----------|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/dbname` | Yes |
| `NODE_ENV` | `production` | Yes |
| `JWT_SECRET` | (strong random string) | Yes |
| `PORT` | `8080` (or EB-assigned) | Auto by EB |

`DATABASE_URL` must be the RDS connection string (public or private depending on your setup).

---

## 5. How to Confirm Migration Ran Successfully

### A. Check EB deployment logs

1. **EB Console** → Your environment → **Logs** → **Request Logs** → **Last 100 Lines** or **Full Logs**.
2. Or **SSH** into the instance (EB Console → **Connect**):
   ```bash
   sudo cat /var/log/eb-prisma-migrate.log
   ```
3. Success looks like:
   ```
   [2025-01-31T12:00:00+00:00] Starting Prisma migrate deploy
   [2025-01-31T12:00:05+00:00] Prisma migrate deploy completed successfully
   ```

### B. Check EB engine log

```bash
sudo cat /var/log/eb-engine.log | grep -A 20 "postdeploy"
```

Look for the hook running and exiting with 0.

---

## 6. How to Verify Tables Exist in RDS

### Option A: psql (from machine with network access to RDS)

```bash
psql "$DATABASE_URL" -c "\dt"
```

Expected: list of tables (`users`, `properties`, `floors`, `rooms`, `beds`, `tenants`, etc.).

### Option B: Prisma Studio (from your machine)

```bash
cd backend
DATABASE_URL="postgresql://user:pass@your-rds-endpoint:5432/pg_management" npx prisma studio
```

Opens browser; you can inspect tables.

### Option C: AWS RDS Query Editor (if enabled)

RDS Console → Your DB → **Query editor** → run:

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

---

## 7. Common Failure Cases

### A. DB connectivity

**Symptom:** `Can't reach database server`, `Connection refused`, `timeout`.

**Causes:**
- RDS security group does not allow inbound from EB instance (port 5432).
- Wrong `DATABASE_URL` (host, port, user, password, SSL).
- RDS in private subnet; EB instance cannot reach it (use same VPC or correct routing).

**Fix:**
- Add EB instance security group to RDS inbound rules (port 5432).
- For public RDS: allow your EB instance’s security group or its outbound IP.
- Verify `DATABASE_URL` in EB env matches RDS endpoint and credentials.

### B. Permissions

**Symptom:** `permission denied for schema public`, `relation does not exist`.

**Causes:**
- DB user lacks `CREATE`, `USAGE` on schema, or table privileges.

**Fix:**
- Use a DB user with sufficient privileges (e.g. `postgres` or a user with `CREATEDB`/schema rights).
- Ensure database exists: `CREATE DATABASE pg_management;`

### C. binaryTargets (Prisma engine)

**Symptom:** `Prisma Client engine not found`, `Query engine binary for current platform not found`.

**Cause:** Prisma engine not built for Amazon Linux 2023 (RHEL).

**Fix:** In `prisma/schema.prisma`:

```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-3.0.x"]
}
```

Already configured in this project.

### D. Hook not executable

**Symptom:** Hook does not run, or "Permission denied".

**Fix:**
```bash
chmod +x backend/.platform/hooks/postdeploy/01_prisma_migrate.sh
```
Commit and redeploy. Ensure the execute bit is preserved in your zip/Git.

### E. Wrong app directory

**Symptom:** `Cannot cd to /var/app/current`, `prisma: command not found`.

**Cause:** App deployed to a different path on your platform.

**Fix:** Check EB platform docs for the correct app path. For Node.js on AL2023 it is usually `/var/app/current`. If different, update `APP_DIR` in the script.

### F. Migration already applied / drift

**Symptom:** `Migration ... has already been applied`, or schema drift errors.

**Fix:**
- `prisma migrate deploy` is idempotent; already-applied migrations are skipped.
- For drift: resolve with `prisma migrate resolve` or fix migrations locally and redeploy.

---

## 8. Pre-Deploy Checklist

- [ ] `backend/prisma/migrations/` exists with at least one migration
- [ ] `backend/prisma/migrations/migration_lock.toml` exists
- [ ] `backend/.platform/hooks/postdeploy/01_prisma_migrate.sh` exists and is executable
- [ ] `DATABASE_URL` set in EB Environment Configuration
- [ ] RDS security group allows port 5432 from EB instance
- [ ] `prisma/schema.prisma` has `binaryTargets = ["native", "rhel-openssl-3.0.x"]`
- [ ] `package.json` has `"build": "prisma generate"` (runs during EB build)

---

## 9. Adding New Migrations (Future)

1. **Locally** (with a DB connection):
   ```bash
   cd backend
   npx prisma migrate dev --name add_new_feature
   ```
2. Commit `prisma/migrations/<new_migration>/`.
3. Deploy to EB; postdeploy will run `prisma migrate deploy` and apply the new migration.
