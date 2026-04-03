# AWS Deployment Guide

This guide is for this repo as it exists now:

- Frontend: Next.js 15 app in `/Users/venkataraviaithinkers/Desktop/my-app`
- Backend: Express + Prisma + Socket.IO app in `/Users/venkataraviaithinkers/Desktop/my-app/backend`
- Database: PostgreSQL

## Recommended AWS setup

For this app, the best AWS fit is:

1. Frontend: AWS Amplify Hosting
2. Backend: Amazon ECS on AWS Fargate behind an Application Load Balancer
3. Database: Amazon RDS for PostgreSQL

Why this is the best fit:

- Amplify officially supports Next.js SSR apps through Next.js 15.
- Fargate is pay-as-you-go for container CPU, memory, and storage usage.
- Application Load Balancer is a strong fit for this backend because AWS documents ALB support for WebSocket workloads, which matters for your realtime notifications.
- RDS PostgreSQL is the simplest managed PostgreSQL option for this app.

If you want the database layer itself to scale more elastically with usage, Aurora Serverless v2 is the AWS-native alternative to standard RDS PostgreSQL. It is more elastic, but it is also a more advanced choice. I would start with RDS unless you already expect highly bursty traffic.

## Before you deploy

Make sure these are true first:

1. Frontend build passes: `npm run build`
2. Backend starts locally and connects to Postgres
3. Your production secrets are ready:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `ALLOWED_ORIGINS`
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_APP_URL`
   - optional `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

## Production environment values

### Backend

Set these in ECS task definition secrets/environment:

```env
NODE_ENV=production
PORT=9000
DATABASE_URL=postgresql://<user>:<password>@<rds-endpoint>:5432/<db-name>?schema=public
JWT_SECRET=<generate-a-long-random-secret>
ALLOWED_ORIGINS=https://<your-amplify-domain>,https://<your-custom-domain>
ENABLE_RATE_LIMIT=true
RATE_LIMIT_WINDOW_MS=300000
RATE_LIMIT_MAX_REQUESTS=500
ENABLE_SCHEDULER=false
LOG_LEVEL=info
TZ=Asia/Kolkata
```

### Frontend

Set these in Amplify environment variables:

```env
NEXT_PUBLIC_API_URL=https://api.<your-domain>/api
NEXT_PUBLIC_APP_URL=https://<your-frontend-domain>
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<optional>
GOOGLE_VERIFICATION_ID=<optional>
```

Important:

- `NEXT_PUBLIC_API_URL` must include `/api`
- `ALLOWED_ORIGINS` must include every frontend domain that will call the backend

## Step 1: Create the PostgreSQL database

Recommended first production setup:

1. Open AWS Console
2. Go to `RDS`
3. Create a PostgreSQL database
4. Choose:
   - deployment: `Single-AZ` for initial rollout
   - private subnets
   - automatic backups enabled
   - storage autoscaling enabled
5. Save:
   - endpoint
   - database name
   - username
   - password

Notes:

- For lowest complexity, use standard `RDS PostgreSQL`
- For more usage-elastic database scaling, use `Aurora PostgreSQL Serverless v2` instead

## Step 2: Create the backend image repository

1. Go to `Amazon ECR`
2. Create one repository:
   - `pg-management-backend`

Then authenticate Docker and push the backend image.

Example:

```bash
aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <account-id>.dkr.ecr.<region>.amazonaws.com

docker build -t pg-management-backend ./backend
docker tag pg-management-backend:latest <account-id>.dkr.ecr.<region>.amazonaws.com/pg-management-backend:latest
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/pg-management-backend:latest
```

## Step 3: Deploy the backend on ECS Fargate

1. Go to `ECS`
2. Create a cluster
   - launch type: `AWS Fargate`
3. Create a task definition
   - container image: your ECR backend image
   - container port: `9000`
   - CPU/memory starter suggestion:
     - `0.5 vCPU`
     - `1 GB` or `2 GB`
4. Add environment variables/secrets from the backend list above
5. Create a service
   - attach an `Application Load Balancer`
   - listener: `HTTPS 443`
   - target group health check path: `/health`
   - desired task count: `1` to start

Networking:

1. Put ECS tasks in private subnets
2. Put the ALB in public subnets
3. Allow:
   - ALB -> ECS service on port `9000`
   - ECS service -> RDS on port `5432`

## Step 4: Run Prisma migrations in AWS

Do this before live traffic.

Use the backend container image with production env vars and run:

```bash
npx prisma migrate deploy
```

Good ways to run it:

1. One-off ECS task using the same task definition
2. CI/CD step before service rollout

Do not skip this. The backend container start command does not automatically run migrations.

## Step 5: Deploy the frontend on Amplify

1. Go to `AWS Amplify`
2. Create a new app from your Git repository
3. Select the `main` branch
4. Keep the app root at the repo root:
   - `/Users/venkataraviaithinkers/Desktop/my-app`
5. Add frontend environment variables from the frontend list above
6. Deploy

This repo already builds with:

```bash
npm run build
```

Amplify should auto-detect the Next.js app. If needed, force Node 20 in Amplify build settings because the frontend `package.json` expects Node `>=20 <24`.

## Step 6: Connect your domain

1. Request or use an ACM certificate for your domain
2. Point frontend domain to Amplify
   - example: `app.yourdomain.com`
3. Point backend API domain to the ALB
   - example: `api.yourdomain.com`
4. Update:
   - `NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api`
   - `NEXT_PUBLIC_APP_URL=https://app.yourdomain.com`
   - `ALLOWED_ORIGINS=https://app.yourdomain.com`

## Step 7: Smoke test after deployment

Check these in order:

1. Backend health:
   - `https://api.<your-domain>/health`
2. Frontend loads:
   - `https://app.<your-domain>`
3. Signup/login works
4. Property create works
5. Floor/room/bed create works
6. Tenant create/edit/vacate works
7. Payment create/mark-paid works
8. Notices and notifications work
9. Realtime updates work between two browser tabs

## Step 8: Production hardening

Before public rollout, do these:

1. Use a strong `JWT_SECRET`
2. Restrict `ALLOWED_ORIGINS` to real domains only
3. Keep the database private, not public
4. Enable CloudWatch logs for ECS
5. Set ECS service autoscaling on CPU and memory
6. Enable RDS automated backups
7. Put the ALB behind HTTPS only
8. Add AWS WAF later if public traffic grows

## Cost guidance

Start small:

1. Frontend on Amplify
2. Backend on Fargate with one small task
3. Database on small Single-AZ RDS PostgreSQL

That is the best balance of:

- low ops overhead
- real production setup
- pay-as-you-go compute
- support for your realtime backend

If traffic becomes very bursty:

1. Keep Amplify for frontend
2. Keep Fargate or scale ECS horizontally
3. Re-evaluate the database for Aurora Serverless v2

## What I would choose for this app

If we deploy this today, I would choose:

1. Frontend: Amplify Hosting
2. Backend: ECS Fargate + ALB
3. Database: RDS PostgreSQL

Reason:

- it fits the current codebase without rewriting deployment assumptions
- it supports the realtime backend safely
- it is simpler and lower risk than a more custom AWS setup
- it is more deploy-ready for this app than trying to force everything into a single service

## Useful commands

Frontend local check:

```bash
cd /Users/venkataraviaithinkers/Desktop/my-app
npm run build
```

Backend local check:

```bash
cd /Users/venkataraviaithinkers/Desktop/my-app/backend
npm run dev
```

Backend image build:

```bash
docker build -t pg-management-backend ./backend
```

## Sources

- AWS Amplify supports SSR apps built with Next.js through Next.js 15: [https://docs.aws.amazon.com/amplify/latest/userguide/ssr-amplify-support.html](https://docs.aws.amazon.com/amplify/latest/userguide/ssr-amplify-support.html)
- AWS Amplify pricing: [https://aws.amazon.com/amplify/pricing/](https://aws.amazon.com/amplify/pricing/)
- AWS Fargate pricing: [https://aws.amazon.com/fargate/pricing/](https://aws.amazon.com/fargate/pricing/)
- Application Load Balancer feature page, including WebSockets support: [https://aws.amazon.com/elasticloadbalancing/application-load-balancer/](https://aws.amazon.com/elasticloadbalancing/application-load-balancer/)
- ECS with load balancing on Fargate: [https://docs.aws.amazon.com/AmazonECS/latest/developerguide/service-load-balancing.html](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/service-load-balancing.html)
- Amazon RDS for PostgreSQL pricing: [https://aws.amazon.com/rds/postgresql/pricing/](https://aws.amazon.com/rds/postgresql/pricing/)
- Aurora Serverless v2 overview: [https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2.html](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2.html)
