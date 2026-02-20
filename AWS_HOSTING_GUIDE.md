# Host PG Management on AWS (Free Tier Initially)

**Yes, this is possible.** You already have the DB schema in `backend/prisma/schema.prisma`. You will:

1. **Create PostgreSQL on AWS RDS** (free tier for 12 months).
2. **Apply your schema once** to that RDS database.
3. **Host backend** on AWS (Elastic Beanstalk or EC2).
4. **Host frontend** on AWS Amplify or Vercel.
5. **Connect everything** with env vars.

---

# Prerequisites

- AWS account ([aws.amazon.com](https://aws.amazon.com))
- Git repo with your code (GitHub recommended for Amplify/Beanstalk)
- Your Prisma schema is ready (you have it in `backend/prisma/schema.prisma`)

---

# Part 1: Create PostgreSQL on AWS RDS (Free Tier)

## 1.1 Sign in and open RDS

1. Go to [AWS Console](https://console.aws.amazon.com) → **RDS**.
2. Choose a region (e.g. **us-east-1**). Use the same region for DB, backend, and frontend later.

## 1.2 Create database

1. Click **Create database**.
2. **Engine**: PostgreSQL (e.g. **PostgreSQL 15**).
3. **Templates**: **Free tier**.
4. **Settings**:
   - **DB instance identifier**: e.g. `pg-management-db`
   - **Master username**: `postgres` (or keep default)
   - **Master password**: Choose a strong password and **save it** (e.g. in a password manager)
5. **Instance configuration** (Free tier):
   - **Burstable** → **db.t3.micro** or **db.t2.micro** (whichever is free tier in your region).
6. **Storage**: 20 GB (free tier), no autoscaling if you want to stay free.
7. **Connectivity**:
   - **VPC**: Default VPC is fine.
   - **Public access**: **Yes** (so you can run `prisma db push` from your machine and your backend can connect; if backend is in same VPC you can switch to No later).
   - **VPC security group**: Create new, e.g. `rds-pg-management-sg`.
8. **Database options**:
   - **Initial database name**: `pg_management` (must match what your app uses).
9. Click **Create database**. Wait 5–10 minutes until status is **Available**.

## 1.3 Allow access in Security Group

1. In RDS → **Databases** → click your DB identifier.
2. Under **Connectivity & security** → **VPC security groups** → click the security group link.
3. **Edit inbound rules** → **Add rule**:
   - **Type**: PostgreSQL (port **5432**).
   - **Source**:  
     - For testing from your laptop: **My IP** (so you can run Prisma from your machine).  
     - For backend on AWS: add the security group of your Elastic Beanstalk/EC2 later, or use **0.0.0.0/0** only if you accept exposure (not ideal for production; better to put backend in same VPC and use security group).
   - Save.

## 1.4 Get connection details

1. RDS → **Databases** → click your DB.
2. **Connectivity & security**:
   - **Endpoint**: e.g. `pg-management-db.xxxxxx.us-east-1.rds.amazonaws.com`
   - **Port**: 5432
3. Your **DATABASE_URL** will look like:
   ```text
   postgresql://postgres:YOUR_MASTER_PASSWORD@pg-management-db.xxxxxx.us-east-1.rds.amazonaws.com:5432/pg_management
   ```
   Replace `YOUR_MASTER_PASSWORD` and the host with your actual endpoint.

---

# Part 2: Apply your schema to RDS (one-time)

You have the schema in `backend/prisma/schema.prisma`. Apply it to the new RDS DB once from your machine.

1. **Set DATABASE_URL** (only for this step; do not commit this):
   ```bash
   cd backend
   export DATABASE_URL="postgresql://postgres:YOUR_MASTER_PASSWORD@YOUR_RDS_ENDPOINT:5432/pg_management"
   ```
   Or create a temporary `.env.production` in `backend/` with that line and run:
   ```bash
   cd backend
   cp .env .env.backup
   # Edit .env and set DATABASE_URL to the RDS URL above
   ```

2. **Push schema** (creates all tables from Prisma):
   ```bash
   npx prisma db push
   ```

3. **Optional – seed data**:
   ```bash
   npm run db:seed
   ```

4. After this, your RDS database has the same schema as in your Prisma file. You can switch `backend/.env` back to local or leave it for production; for deployment you’ll set `DATABASE_URL` in the hosting environment (e.g. Elastic Beanstalk).

---

# Part 3: Host the backend on AWS

Two simple options: **Elastic Beanstalk** (managed) or **EC2** (more control). Elastic Beanstalk is easier.

## Option A: Elastic Beanstalk (recommended)

### 3A.1 Prepare the backend for deploy

1. In `backend/`, ensure **no** `DATABASE_URL` (or secrets) are in code; they will come from env vars in Beanstalk.
2. In `backend/package.json`, **start** script should be something like:
   ```json
   "start": "node src-js/index.js"
   ```
   Beanstalk will run `npm start`. It sets `PORT`; your app should use `process.env.PORT || 9000`.

3. Optional: add `Procfile` in `backend/`:
   ```text
   web: node src-js/index.js
   ```
   Or Elastic Beanstalk will use `npm start` by default.

### 3A.2 Create Elastic Beanstalk app

1. AWS Console → **Elastic Beanstalk** → **Create application**.
2. **Application name**: e.g. `pg-management-api`.
3. **Platform**: Node.js (e.g. Node 18 or 20).
4. **Application code**: Upload your code (zip of `backend/` folder) or connect GitHub and set **Repository** and **Branch**, and set **Source** to the path that contains `backend/` (or deploy only the backend folder if your repo root is the backend).
5. If you upload a zip: zip only the contents of `backend/` (package.json, src-js, prisma, etc.) and upload.
6. **Preset**: Single instance (free tier eligible).
7. Create. Wait until environment is **Ok** (green).

### 3A.3 Configure environment variables

1. Elastic Beanstalk → your **Environment** → **Configuration** → **Software** → **Edit**.
2. **Environment properties** – add:
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = `postgresql://postgres:YOUR_MASTER_PASSWORD@YOUR_RDS_ENDPOINT:5432/pg_management`
   - `JWT_SECRET` = long random string (generate one, e.g. `openssl rand -base64 32`)
   - `ALLOWED_ORIGINS` = `https://your-frontend-domain.com` (update after you deploy frontend)
   - `PORT` = `8080` (Beanstalk often uses 8080; your app should use `process.env.PORT`)
3. Save. Beanstalk will redeploy.

### 3A.4 Allow backend port and get URL

1. **Configuration** → **Load balancer** or **Instances** (depending on tier). Ensure the listener port (e.g. 80 → 8080) is correct so traffic reaches your Node app.
2. **Environment** URL: e.g. `http://pg-management-api.us-east-1.elasticbeanstalk.com`. This is your **backend base URL**; API is at `http://.../api` if your app serves routes under `/api`.

So your backend API URL might be:
`https://pg-management-api.us-east-1.elasticbeanstalk.com/api`

(Use HTTPS if you add a custom domain and certificate later.)

---

## Option B: EC2 (alternative)

1. Launch an **Amazon Linux 2** EC2 **t2.micro** (free tier).
2. Security group: allow **22** (SSH), **80** (HTTP), **443** (HTTPS), and **9000** if you expose the app directly.
3. SSH in, install Node.js, clone your repo, install dependencies in `backend/`, set `DATABASE_URL` and other env vars (e.g. in `.env` or systemd environment).
4. Run the app with `node src-js/index.js` and set `PORT=80` or use a reverse proxy (nginx) to forward to your Node port.
5. Optionally use **PM2** for process management: `pm2 start src-js/index.js --name api`.

Your backend URL will be `http://YOUR_EC2_PUBLIC_IP:9000` (or the port you use), and API at `http://YOUR_EC2_PUBLIC_IP:9000/api`.

---

# Part 4: Host the frontend

## Option A: AWS Amplify (all on AWS)

1. AWS Console → **Amplify** → **New app** → **Host web app**.
2. Connect **GitHub** (or Git provider), select repo and branch.
3. **Build settings**: Amplify can auto-detect Next.js. Ensure:
   - **Build** command: `npm run build` (or `next build`).
   - **Output** directory: `.next` for Next.js (Amplify usually sets this).
   - **Base directory**: leave blank if your app is at repo root; or set if frontend is in a subfolder.
4. **Environment variables** (in Amplify console):
   - `NEXT_PUBLIC_API_URL` = `https://your-elastic-beanstalk-url/api` (or your EC2 URL + `/api`).
   - No trailing slash: e.g. `https://pg-management-api.us-east-1.elasticbeanstalk.com/api`
5. Save and deploy. Amplify gives you a URL like `https://main.xxxxx.amplifyapp.com`.

Then in **Elastic Beanstalk** (or EC2) set:
- `ALLOWED_ORIGINS` = `https://main.xxxxx.amplifyapp.com`
so the backend allows requests from the frontend.

## Option B: Vercel (simplest for Next.js)

1. Go to [vercel.com](https://vercel.com) → Import your Git repo.
2. **Framework**: Next.js, **Root Directory**: project root (where `app/` and `package.json` live).
3. **Environment variables**:
   - `NEXT_PUBLIC_API_URL` = `https://your-elastic-beanstalk-url/api`
4. Deploy. You get e.g. `https://your-app.vercel.app`.

Then set backend:
- `ALLOWED_ORIGINS` = `https://your-app.vercel.app`

---

# Part 5: Connect everything

| Component   | Where it runs        | What you set |
|------------|----------------------|--------------|
| Database   | AWS RDS PostgreSQL   | Endpoint, port, DB name, user, password → `DATABASE_URL` |
| Backend    | Elastic Beanstalk/EC2| `DATABASE_URL`, `JWT_SECRET`, `ALLOWED_ORIGINS` (frontend URL), `PORT` |
| Frontend   | Amplify or Vercel    | `NEXT_PUBLIC_API_URL` = backend API URL (e.g. `https://.../api`) |

- **Backend** connects to **RDS** using `DATABASE_URL`.
- **Frontend** calls **backend** using `NEXT_PUBLIC_API_URL`.
- **Backend** allows the frontend origin in **ALLOWED_ORIGINS**.

---

# Checklist

- [ ] RDS PostgreSQL created (free tier), status **Available**.
- [ ] RDS security group allows port 5432 from your IP (and from Beanstalk/EC2 SG if backend is in AWS).
- [ ] `npx prisma db push` run once with `DATABASE_URL` pointing at RDS.
- [ ] Backend deployed (Elastic Beanstalk or EC2) with `DATABASE_URL`, `JWT_SECRET`, `ALLOWED_ORIGINS`, `PORT`.
- [ ] Frontend deployed (Amplify or Vercel) with `NEXT_PUBLIC_API_URL` = backend API URL.
- [ ] `ALLOWED_ORIGINS` set to your frontend URL (no trailing slash).
- [ ] Test: open frontend URL, login or use an API call; check backend logs if something fails.

---

# Backend PORT note

Elastic Beanstalk usually assigns a port via `PORT` (e.g. 8080). In `backend/src-js/index.js` use:

```js
const PORT = process.env.PORT || 9000;
```

So it works both locally (9000) and on Beanstalk (8080).

---

# Summary

- **Yes**, you can create a Postgres DB on AWS (RDS free tier) and connect everything.
- You **do** have the DB schema (Prisma); run **`npx prisma db push`** once with `DATABASE_URL` set to RDS to create tables.
- Host **DB** on RDS, **backend** on Elastic Beanstalk (or EC2), **frontend** on Amplify or Vercel, and set the env vars above so they all talk to each other.
