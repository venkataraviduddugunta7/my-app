-- PostgreSQL Database Setup for PG Management System
-- Run this script to set up the database

-- Create database (run this as postgres user or with superuser privileges)
CREATE DATABASE pgmanagement;

-- Connect to the database
\c pgmanagement;

-- Create user for the application (optional - for production)
-- CREATE USER pgmanager WITH PASSWORD 'your_secure_password';
-- GRANT ALL PRIVILEGES ON DATABASE pgmanagement TO pgmanager;

-- The tables will be created by Prisma migrations
-- This file is just for initial database setup 