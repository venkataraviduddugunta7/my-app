# PG Management – Setup & Deployment Guide

## Why you see “Can’t reach database server at localhost:5432”

The backend is **correctly configured** (DATABASE_URL is set). The error means **PostgreSQL is not running** on your machine at `localhost:5432`. The app tries to connect and nothing is listening there.

Fix: start PostgreSQL (see below), then run the backend again.

---

# Part 1: Run locally (development)

## Option A: PostgreSQL with Docker (recommended)

1. **Install Docker**  
   [Docker Desktop](https://www.docker.com/products/docker-desktop/) for Mac/Windows, or Docker Engine on Linux.

2. **Start only PostgreSQL** (from project root):
   ```bash
   cd /path/to/my-app
   docker compose up -d postgres
   ```
   This starts Postgres on `localhost:5432` with user `postgres`, password `postgres`, database `pg_management`.

3. **Root `.env`** (for Docker Compose):  
   If you don’t have a `.env` in the project root:
   ```bash
   cp env.example .env
   ```
   Then run step 2 again if needed.

4. **Backend env**  
   You already have `backend/.env` with:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pg_management
   ```
   No change needed for local Docker Postgres.

5. **Create DB schema** (first time only):
   ```bash
   cd backend
   npx prisma db push
   ```
   Optional: seed data:
   ```bash
   npm run db:seed
   ```

6. **Start backend**:
   ```bash
   cd backend
   npm run dev
   ```
   Backend runs at **http://localhost:9000**.

7. **Start frontend** (new terminal):
   ```bash
   cd /path/to/my-app
   npm install
   npm run dev
   ```
   Frontend runs at **http://localhost:3000**.

8. **Frontend env (optional)**  
   For Next.js, create `.env.local` in project root if you want to override API URL:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:9000/api
   ```
   Your code already falls back to `http://localhost:9000/api` if this is not set.

---

## Option B: PostgreSQL installed on your machine

1. **Install PostgreSQL**  
   - Mac: `brew install postgresql@15` then `brew services start postgresql@15`  
   - Or use [Postgres.app](https://postgresapp.com/) (Mac).

2. **Create database and user** (if not already):
   ```bash
   psql postgres
   CREATE USER postgres WITH PASSWORD 'postgres' SUPERUSER;
   CREATE DATABASE pg_management OWNER postgres;
   \q
   ```

3. **Backend `.env`**  
   Keep in `backend/.env`:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pg_management
   ```
   Adjust host/port/user/password/database if your Postgres is different.

4. **Then**: same as Option A from step 5 (Prisma push → seed → backend → frontend).

---

# Part 2: Deploy and host (production)

You need three things live:

1. **PostgreSQL** (hosted database)  
2. **Backend** (Node/Express API)  
3. **Frontend** (Next.js)

Two practical ways: **all-in-one platform** or **split (DB + backend on one, frontend on another)**.

---

## Strategy 1: Railway (backend + DB in one place)

Good for getting one URL for the API and DB quickly.

1. **Railway**  
   Sign up at [railway.app](https://railway.app).

2. **New project → Add PostgreSQL**  
   Railway creates a Postgres service and gives you `DATABASE_URL`.

3. **Deploy backend**  
   - New Service → “Deploy from GitHub repo” (connect your repo).  
   - Root: set to **backend** folder (e.g. `backend` or `/backend` in Railway settings).  
   - Add variable:
     - `DATABASE_URL` = (paste from Postgres service).  
   - Add others as needed:
     - `NODE_ENV=production`
     - `JWT_SECRET=<strong-random-secret>`
     - `PORT=9000` (or whatever Railway assigns)
     - `ALLOWED_ORIGINS=https://your-frontend-domain.com`
   - Build: no custom build; start command: `node src-js/index.js` (and set `PORT` from Railway).  
   - Deploy. Note the backend URL (e.g. `https://your-backend.up.railway.app`).

4. **Database schema**  
   One-time, from your machine:
   ```bash
   cd backend
   DATABASE_URL="<railway-postgres-url>" npx prisma db push
   DATABASE_URL="<railway-postgres-url>" npm run db:seed   # optional
   ```

5. **Frontend**  
   Deploy to **Vercel** (see below). Set:
   ```env
   NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app/api
   ```

6. **Backend CORS**  
   In Railway, set `ALLOWED_ORIGINS` to your Vercel URL, e.g. `https://your-app.vercel.app`.

---

## Strategy 2: Render (backend + DB) + Vercel (frontend)

1. **Render**  
   [render.com](https://render.com).

2. **PostgreSQL**  
   Create a new PostgreSQL instance. Copy “Internal Database URL” or “External Database URL” (use External if you run Prisma from your laptop).

3. **Backend**  
   - New → Web Service.  
   - Connect repo, set root to **backend**.  
   - Build: `npm install && npx prisma generate`  
   - Start: `node src-js/index.js`  
   - Env:
     - `DATABASE_URL` = (from Render Postgres)
     - `NODE_ENV=production`
     - `JWT_SECRET=<strong-secret>`
     - `ALLOWED_ORIGINS=https://your-frontend.vercel.app`
   - Deploy. Note backend URL.

4. **Schema** (one-time):
   ```bash
   cd backend
   DATABASE_URL="<render-postgres-url>" npx prisma db push
   ```

5. **Frontend on Vercel** (see below), with `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api`.

---

## Frontend: Vercel (Next.js)

1. **Vercel**  
   [vercel.com](https://vercel.com) → Import your Git repo.

2. **Project settings**  
   - Framework: Next.js.  
   - Root: project root (where `package.json` and `app/` live).

3. **Environment variables** (Production + Preview):
   ```env
   NEXT_PUBLIC_API_URL=https://your-backend-url/api
   ```
   Replace `your-backend-url` with your Railway or Render backend URL (no trailing `/api` in the base URL; the app adds `/api`).

4. **Deploy**  
   Vercel builds and gives you `https://your-app.vercel.app`. Use this URL in backend `ALLOWED_ORIGINS`.

---

## Strategy 3: Single VPS with Docker (full control)

On a Linux server (DigitalOcean, AWS EC2, etc.):

1. **Install Docker and Docker Compose** on the server.

2. **Clone repo** on the server.

3. **Root `.env`** (production values):
   ```env
   NODE_ENV=production
   DATABASE_NAME=pg_management
   DATABASE_USER=postgres
   DATABASE_PASSWORD=<strong-password>
   DATABASE_PORT=5432
   JWT_SECRET=<strong-secret>
   BACKEND_PORT=9000
   FRONTEND_PORT=3000
   ALLOWED_ORIGINS=https://your-domain.com
   NEXT_PUBLIC_API_URL=https://api.your-domain.com/api
   ```

4. **Run everything**:
   ```bash
   docker compose up -d
   ```
   This starts Postgres, Redis, backend, frontend (and nginx if you use the production profile).

5. **Point DNS**  
   - `your-domain.com` → server IP (frontend/nginx).  
   - `api.your-domain.com` → same IP, nginx or load balancer routes to backend.

6. **Schema** (one-time, from server or with `DATABASE_URL` pointing at the container):
   ```bash
   cd backend && DATABASE_URL="postgresql://postgres:<password>@postgres:5432/pg_management" npx prisma db push
   ```
   (Here `postgres` is the Docker service name.)

---

# Checklist

**Local**

- [ ] PostgreSQL running (Docker or native) at `localhost:5432`
- [ ] `backend/.env` has `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pg_management`
- [ ] `cd backend && npx prisma db push` (and optional `npm run db:seed`)
- [ ] Backend: `cd backend && npm run dev` → http://localhost:9000
- [ ] Frontend: `npm run dev` → http://localhost:3000
- [ ] Frontend uses `NEXT_PUBLIC_API_URL=http://localhost:9000/api` (default or in `.env.local`)

**Production**

- [ ] Hosted Postgres (Railway, Render, or VPS)
- [ ] Backend deployed with correct `DATABASE_URL`, `JWT_SECRET`, `ALLOWED_ORIGINS`
- [ ] `npx prisma db push` (or migrations) run once against production DB
- [ ] Frontend deployed with `NEXT_PUBLIC_API_URL=https://your-backend-url/api`
- [ ] Backend CORS includes your frontend origin

---

# Quick reference – env vars

**Backend (`backend/.env`)**  
- `DATABASE_URL` – **required**  
- `JWT_SECRET` – **required** in production  
- `NODE_ENV` – `development` / `production`  
- `ALLOWED_ORIGINS` – in production, your frontend URL(s), comma-separated  
- `PORT` – server port (e.g. 9000)

**Frontend (`.env.local` or Vercel env)**  
- `NEXT_PUBLIC_API_URL` – backend API base URL, e.g. `https://api.example.com/api`

Once PostgreSQL is running and `DATABASE_URL` points to it, the “Can’t reach database server” error goes away. Use the sections above for local run and for hosting.
