# 🗄️ Database Setup Guide

## Overview

This PG Management System uses **PostgreSQL** with **Prisma ORM**. The database schema includes comprehensive relationships with proper cascade operations.

## 🔗 Database Relationships & Cascade Operations

### **Hierarchy Structure**
```
Property → Floors → Rooms → Beds → Tenants
```

### **Key Relationships**
- **Property deleted** → All floors, rooms, beds, tenants, payments, notices, documents deleted
- **Floor deleted** → All rooms and beds in that floor deleted  
- **Room deleted** → All beds in that room deleted
- **Tenant deleted** → Bed becomes available, payments remain for history
- **Bed deleted** → Tenant relationship set to null

### **Data Integrity Features**
- ✅ Unique constraints on room numbers per floor
- ✅ Unique constraints on bed numbers per room  
- ✅ Unique tenant IDs and payment IDs
- ✅ Proper foreign key relationships
- ✅ Cascade deletions where appropriate
- ✅ Set null for optional relationships

## 🚀 Setup Instructions

### Option 1: Local PostgreSQL Setup

#### Step 1: Install PostgreSQL
```bash
# macOS (using Homebrew)
brew install postgresql@15
brew services start postgresql@15

# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# CentOS/RHEL
sudo yum install postgresql-server postgresql-contrib
sudo postgresql-setup initdb
sudo systemctl start postgresql
```

#### Step 2: Create Database
```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE pgmanagement;

# Exit PostgreSQL
\q
```

#### Step 3: Configure Environment
```bash
cd backend
cp .env.example .env
```

Edit `.env` file:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/pgmanagement"
JWT_SECRET="your-super-secret-jwt-key-here"
PORT=5000
NODE_ENV=development
```

#### Step 4: Run Migrations & Seed
```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database with sample data
npm run db:seed

# Start the server
npm run dev
```

### Option 2: Remote PostgreSQL (Recommended for Production)

#### Popular Providers:
1. **Neon** (Free tier available)
   - Visit: https://neon.tech
   - Create account and database
   - Copy connection string

2. **Supabase** (Free tier available)
   - Visit: https://supabase.com
   - Create project
   - Go to Settings → Database
   - Copy connection string

3. **Railway** (Free tier available)
   - Visit: https://railway.app
   - Create PostgreSQL service
   - Copy connection string

4. **Heroku Postgres** (Free tier discontinued, paid plans available)
   - Visit: https://www.heroku.com/postgres

#### Setup with Remote Database:
1. Get connection string from provider
2. Update `.env` file:
   ```env
   DATABASE_URL="your-remote-connection-string"
   ```
3. Run migrations and seed:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

## 📊 Database Schema

### Core Tables
- **users** - System users (owners, managers, staff)
- **properties** - PG properties  
- **floors** - Floor management
- **rooms** - Room management
- **beds** - Individual bed management
- **tenants** - Tenant information
- **payments** - Payment tracking
- **notices** - Notice management
- **documents** - Document storage
- **property_settings** - Property configurations

### Additional Tables
- **reports** - Analytics and reporting
- **maintenance_requests** - Maintenance tracking

## 🎯 Sample Data

The seed script creates:
- **2 Users**: Owner and Manager
- **1 Property**: Green Valley PG (3 floors, 12 rooms, 24 beds)
- **5 Tenants**: With realistic data
- **20+ Payments**: Including deposits and rent payments
- **4 Notices**: Various types (maintenance, payment reminders, etc.)
- **5 Documents**: Agreements, policies, certificates
- **3 Maintenance Requests**: Sample work orders

### Login Credentials:
```
Owner: owner@pgmanagement.com / password123
Manager: manager@pgmanagement.com / password123
```

## 🔧 Useful Commands

```bash
# Database operations
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Run migrations  
npm run db:reset       # Reset database (WARNING: Deletes all data)
npm run db:seed        # Seed with sample data
npm run db:studio      # Open Prisma Studio (GUI)

# Server operations
npm run dev           # Start development server
npm run start         # Start production server
```

## 🛠️ Prisma Studio

Access the database GUI:
```bash
npm run db:studio
```
Opens at: http://localhost:5555

## 🔍 Database Queries Examples

### Get all tenants with their rooms and beds:
```javascript
const tenants = await prisma.tenant.findMany({
  include: {
    bed: {
      include: {
        room: {
          include: {
            floor: true
          }
        }
      }
    }
  }
});
```

### Get property with all floors, rooms, and beds:
```javascript
const property = await prisma.property.findFirst({
  include: {
    floors: {
      include: {
        rooms: {
          include: {
            beds: {
              include: {
                tenant: true
              }
            }
          }
        }
      }
    }
  }
});
```

### Get payments for a specific month:
```javascript
const payments = await prisma.payment.findMany({
  where: {
    month: "2024-01",
    paymentType: "RENT"
  },
  include: {
    tenant: true,
    bed: {
      include: {
        room: true
      }
    }
  }
});
```

## 🚨 Troubleshooting

### Common Issues:

1. **Connection Error**
   ```
   Error: Can't reach database server
   ```
   - Check if PostgreSQL is running
   - Verify connection string in `.env`
   - Check firewall settings

2. **Migration Error**
   ```
   Error: Database does not exist
   ```
   - Create database manually: `CREATE DATABASE pgmanagement;`
   - Run migrations again

3. **Permission Error**
   ```
   Error: Permission denied for database
   ```
   - Grant proper permissions to user
   - Use superuser for initial setup

4. **Seed Error**
   ```
   Error: Unique constraint violation
   ```
   - Reset database: `npm run db:reset`
   - Run seed again: `npm run db:seed`

## 🔒 Security Considerations

1. **Environment Variables**
   - Never commit `.env` file
   - Use strong passwords
   - Rotate JWT secrets regularly

2. **Database Access**
   - Create dedicated database user
   - Grant minimal required permissions
   - Use connection pooling in production

3. **Data Backup**
   - Regular database backups
   - Test restore procedures
   - Monitor database size

## 📈 Performance Tips

1. **Indexing**
   - Indexes are automatically created for foreign keys
   - Consider additional indexes for frequently queried fields

2. **Connection Pooling**
   - Configure connection pool size based on traffic
   - Monitor connection usage

3. **Query Optimization**
   - Use `select` to limit returned fields
   - Use `include` wisely to avoid N+1 queries
   - Consider pagination for large datasets

## 🔄 Migration Strategy

When modifying the schema:

1. **Development**
   ```bash
   npm run db:migrate
   ```

2. **Production**
   ```bash
   # Create migration
   npx prisma migrate dev --name your_migration_name
   
   # Deploy to production
   npx prisma migrate deploy
   ```

---

## 📞 Support

For issues or questions:
1. Check Prisma documentation: https://prisma.io/docs
2. PostgreSQL documentation: https://postgresql.org/docs
3. Create an issue in the project repository 