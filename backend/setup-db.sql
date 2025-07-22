-- Create database for PG Management System
CREATE DATABASE pg_management;

-- Create user for the application
CREATE USER pg_admin WITH PASSWORD 'pg_password123';

-- Grant privileges to the user
GRANT ALL PRIVILEGES ON DATABASE pg_management TO pg_admin;

-- Connect to the new database
\c pg_management;

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO pg_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO pg_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO pg_admin;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO pg_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO pg_admin; 