# 🚀 Production Deployment Guide

This guide will help you deploy the PostgreSQL Management System to production with optimal performance, security, and scalability.

## 📋 Prerequisites

- Docker & Docker Compose
- Domain name (for SSL/HTTPS)
- SSL certificates (Let's Encrypt recommended)
- Minimum 2GB RAM, 2 CPU cores
- 20GB+ disk space

## 🛠️ Quick Start

### 1. Clone and Setup

```bash
git clone <your-repo>
cd my-pg

# Copy environment configuration
cp env.example .env

# Edit environment variables
nano .env
```

### 2. Configure Environment Variables

**Critical Variables to Update:**

```env
NODE_ENV=production
JWT_SECRET=your-super-secure-jwt-secret-256-bits-minimum
DATABASE_PASSWORD=your-secure-database-password
REDIS_PASSWORD=your-secure-redis-password
ALLOWED_ORIGINS=https://yourdomain.com
ENABLE_SCHEDULER=true
ENABLE_RATE_LIMIT=true
```

### 3. Deploy with Docker Compose

```bash
# Production deployment
docker-compose --profile production up -d

# With monitoring (optional)
docker-compose --profile production --profile monitoring up -d
```

### 4. Initialize Database

```bash
# Run database migrations
docker-compose exec backend npx prisma migrate deploy

# Seed initial data (optional)
docker-compose exec backend npm run db:seed
```

## 🔒 Security Configuration

### SSL/HTTPS Setup

1. **Obtain SSL certificates** (Let's Encrypt example):

```bash
# Install certbot
sudo apt install certbot

# Get certificates
sudo certbot certonly --standalone -d yourdomain.com

# Copy certificates to ssl directory
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./ssl/key.pem
```

2. **Update nginx.conf** - Uncomment SSL configuration block

3. **Update environment variables**:

```env
COOKIE_SECURE=true
ALLOWED_ORIGINS=https://yourdomain.com
```

### Firewall Configuration

```bash
# Allow only necessary ports
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

## 📊 Monitoring & Logging

### Built-in Monitoring

The system includes comprehensive monitoring:

- **Health Checks**: `/health` endpoint for all services
- **Real-time Logs**: Structured logging with Winston
- **Performance Metrics**: Request timing and resource usage
- **Business Analytics**: Revenue, occupancy, tenant metrics

### Optional Monitoring Stack

Enable with `--profile monitoring`:

- **Prometheus**: Metrics collection (Port 9090)
- **Grafana**: Visualization dashboards (Port 3001)

### Log Management

```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Log rotation is configured automatically
# Logs are stored in named volumes for persistence
```

## ⚡ Performance Optimization

### Database Optimization

```sql
-- Create indexes for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenants_property_status 
ON tenants(property_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_property_status_due 
ON payments(property_id, status, due_date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_beds_room_status 
ON beds(room_id, status);
```

### Caching Strategy

- **Redis**: Session storage and API caching
- **Application Cache**: Analytics data (5-minute TTL)
- **Browser Cache**: Static assets (30 days)
- **CDN**: Recommended for static assets in production

### Resource Allocation

**Recommended Docker resource limits:**

```yaml
# In docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1.0'
        reservations:
          memory: 512M
          cpus: '0.5'
```

## 🔄 Backup & Recovery

### Automated Backups

Backups are scheduled automatically:

- **Database**: Daily at 3:00 AM
- **File Uploads**: Included in backup
- **Retention**: 30 days (configurable)

### Manual Backup

```bash
# Database backup
docker-compose exec postgres pg_dump -U postgres pg_management > backup.sql

# Full backup with docker volumes
docker run --rm -v pg_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz /data
```

### Recovery

```bash
# Restore database
docker-compose exec -T postgres psql -U postgres pg_management < backup.sql

# Restore volumes
docker run --rm -v pg_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres_backup.tar.gz -C /
```

## 🚀 Scaling

### Horizontal Scaling

1. **Load Balancer**: Add multiple backend instances
2. **Database**: Read replicas for analytics queries
3. **File Storage**: Use cloud storage (AWS S3, Google Cloud)

### Vertical Scaling

```bash
# Update resource limits in docker-compose.yml
# Restart services
docker-compose up -d --force-recreate
```

## 📈 Maintenance

### Regular Tasks

```bash
# Update containers
docker-compose pull
docker-compose up -d

# Clean up old images
docker system prune -f

# Monitor disk usage
df -h
docker system df
```

### Health Monitoring

```bash
# Check all services
docker-compose ps

# Health check endpoints
curl http://localhost/health
curl http://localhost:9000/health
```

## 🛡️ Security Checklist

- [ ] Strong passwords for all services
- [ ] JWT secret is 256+ bits
- [ ] SSL/HTTPS enabled
- [ ] Firewall configured
- [ ] Regular security updates
- [ ] Database access restricted
- [ ] File upload restrictions in place
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Security headers enabled

## 🔧 Troubleshooting

### Common Issues

**Database Connection Error:**
```bash
# Check database status
docker-compose logs postgres

# Verify connection
docker-compose exec backend npx prisma db push
```

**WebSocket Connection Failed:**
```bash
# Check nginx configuration
docker-compose logs nginx

# Verify WebSocket proxy settings
```

**High Memory Usage:**
```bash
# Monitor resource usage
docker stats

# Check application logs
docker-compose logs backend | grep -i memory
```

### Performance Issues

```bash
# Check slow queries
docker-compose exec postgres psql -U postgres -c "SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# Monitor API response times
docker-compose logs backend | grep -i "api request"
```

## 📞 Support

For production support:

1. **Logs**: Always include relevant logs
2. **Environment**: Specify your deployment environment
3. **Steps**: Provide reproduction steps
4. **Monitoring**: Include metrics if available

## 🔄 Updates

### Rolling Updates

```bash
# Pull latest images
docker-compose pull

# Update services one by one
docker-compose up -d --no-deps backend
docker-compose up -d --no-deps frontend
```

### Database Migrations

```bash
# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Verify migration status
docker-compose exec backend npx prisma migrate status
```

---

## 🎯 Production Checklist

Before going live:

- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Database migrations applied
- [ ] Backups configured and tested
- [ ] Monitoring setup complete
- [ ] Security measures implemented
- [ ] Performance testing completed
- [ ] Documentation updated
- [ ] Team training completed
- [ ] Rollback plan prepared

**Your PostgreSQL Management System is now ready for production! 🚀**
