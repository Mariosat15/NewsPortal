# News Portal - Deployment Guide

This guide covers deploying the News Portal application using the web-based Deployment Wizard.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Deployment Wizard Steps](#deployment-wizard-steps)
4. [Configuration Reference](#configuration-reference)
5. [Post-Deployment](#post-deployment)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Server Requirements

- **Operating System**: Ubuntu 20.04+ or Debian 11+ (recommended)
- **RAM**: Minimum 1GB (2GB+ recommended)
- **Storage**: At least 10GB free space
- **Network**: Public IP address with ports 80 and 443 open

### Access Requirements

- SSH access to your server (root or sudo user)
- Domain name pointed to your server's IP address

### External Services (have these ready)

1. **MongoDB Database**
   - MongoDB Atlas (free tier available) OR
   - Self-hosted MongoDB server

2. **DIMOCO Account** (for carrier billing)
   - Merchant ID
   - Service ID
   - API Key / Shared Secret

3. **OpenAI API Key** (for AI content generation)
   - Get one at: https://platform.openai.com/api-keys

---

## Quick Start

### Step 1: Start the Deployment Wizard

```bash
# Navigate to the project
cd newsportal

# Go to installer directory
cd installer

# Install dependencies
npm install

# Start the wizard
npm run dev
```

### Step 2: Open the Wizard

Open your browser and navigate to:
```
http://localhost:3001
```

### Step 3: Follow the 7-Step Wizard

The wizard will guide you through:
1. Server connection
2. Domain configuration
3. Database setup
4. Payment configuration
5. API keys
6. Admin credentials
7. Review and deploy

---

## Deployment Wizard Steps

### Step 1: Server Configuration

Enter your SSH connection details:

| Field | Description | Example |
|-------|-------------|---------|
| Server IP | Your server's IP or hostname | `192.168.1.100` or `server.example.com` |
| SSH Port | Usually 22 | `22` |
| Username | SSH user with sudo access | `root` or `ubuntu` |
| Auth Method | Password or SSH Key | Choose based on your setup |
| Deploy Path | Where to install the app | `/var/www/newsportal` |

**Test Connection**: Always test your connection before proceeding.

### Step 2: Domain & Branding

Configure your brand identity:

| Field | Description | Example |
|-------|-------------|---------|
| Brand Name | Display name for your site | `Daily News Pro` |
| Brand ID | Unique identifier (auto-generated) | `daily-news-pro` |
| Domain | Your domain without http:// | `dailynewspro.com` |
| Primary Color | Main brand color | `#1a73e8` |
| Secondary Color | Accent color | `#4285f4` |

### Step 3: Database Setup

**Option A: MongoDB Atlas (Recommended)**

1. Create a free account at [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a new cluster (M0 free tier)
3. Create a database user
4. Add `0.0.0.0/0` to Network Access (or your server IP)
5. Get your connection string from "Connect" > "Connect your application"

Connection string format:
```
mongodb+srv://username:password@cluster.mongodb.net/newsportal_yourbrand?retryWrites=true&w=majority
```

**Option B: Self-Hosted MongoDB**

Use your existing MongoDB server:
```
mongodb://localhost:27017/newsportal_yourbrand
```

### Step 4: Payment Configuration (DIMOCO)

Configure carrier billing:

| Field | Description |
|-------|-------------|
| Environment | Sandbox (testing) or Production (live) |
| API URL | Sandbox: `https://sandbox.2pay.global/smartlink` |
| Merchant ID | Your DIMOCO merchant ID |
| Service ID | Your DIMOCO service ID |
| API Key | Your shared secret for HMAC signing |
| Article Price | Price in cents (99 = 0.99 EUR) |

### Step 5: API Keys

| Service | Required | Description |
|---------|----------|-------------|
| OpenAI | Yes | For AI-powered content generation |
| BrightData | Optional | For advanced web scraping |

### Step 6: Admin Setup

| Field | Description |
|-------|-------------|
| Admin Email | Used for login and SSL cert registration |
| Admin Password | Minimum 8 characters |

Security secrets are auto-generated. Keep them safe!

### Step 7: Review & Deploy

Review all settings and click **Deploy Now**.

The wizard will:
1. Connect to your server via SSH
2. Install Node.js 18 (if needed)
3. Install PM2 process manager
4. Install and configure Nginx
5. Clone/upload the application
6. Generate your .env file
7. Build the application
8. Obtain SSL certificate via Let's Encrypt
9. Start the application

---

## Configuration Reference

### Environment Variables

The deployment creates a `.env` file with all your settings:

```env
# Brand
BRAND_ID=your-brand
BRAND_NAME="Your Brand Name"
BRAND_DOMAIN=yourdomain.com

# Database
MONGODB_URI=mongodb+srv://...

# Authentication
BETTER_AUTH_SECRET=auto-generated-secret
BETTER_AUTH_URL=https://yourdomain.com

# DIMOCO Payment
DIMOCO_API_URL=https://sandbox.2pay.global/smartlink
DIMOCO_MERCHANT_ID=your-merchant-id
DIMOCO_SERVICE_ID=your-service-id
DIMOCO_API_KEY=your-api-key
ARTICLE_PRICE_CENTS=99

# OpenAI
OPENAI_API_KEY=sk-...

# Admin
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_SECRET=auto-generated
```

### Nginx Configuration

The wizard automatically configures Nginx with:
- HTTP to HTTPS redirect
- SSL/TLS 1.2 and 1.3
- Security headers
- Gzip compression
- Static file caching
- Reverse proxy to Node.js

### PM2 Process Manager

Your app runs under PM2 with:
- Auto-restart on crash
- Log rotation
- Memory limits (1GB max)
- Startup on server reboot

---

## Post-Deployment

### Access Your Site

After successful deployment:

- **Website**: `https://yourdomain.com`
- **Admin Panel**: `https://yourdomain.com/admin`

### Useful Commands

SSH into your server and use these commands:

```bash
# Check app status
pm2 status

# View logs
pm2 logs newsportal-yourbrand

# Restart app
pm2 restart newsportal-yourbrand

# Stop app
pm2 stop newsportal-yourbrand

# Check Nginx status
sudo systemctl status nginx

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Updating the Application

To update after deployment:

```bash
cd /var/www/newsportal
git pull
npm install --production
npm run build
pm2 restart newsportal-yourbrand
```

Or run the wizard again - it will detect the existing installation and update it.

---

## Troubleshooting

### Connection Failed

**Symptoms**: Can't connect to server during wizard

**Solutions**:
1. Verify SSH credentials
2. Check if port 22 is open: `sudo ufw status`
3. Ensure the user has SSH access
4. Try connecting manually: `ssh user@server`

### Build Failed

**Symptoms**: Error during "Building application" step

**Solutions**:
1. Check server has enough RAM (minimum 1GB)
2. View build logs on server: `cat /var/www/newsportal/logs/*.log`
3. Try building manually:
   ```bash
   cd /var/www/newsportal
   npm run build
   ```

### SSL Certificate Failed

**Symptoms**: Error during "Setting up SSL" step

**Solutions**:
1. Verify domain DNS points to server IP:
   ```bash
   dig +short yourdomain.com
   ```
2. Check ports 80 and 443 are open
3. Try manually:
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```

### App Not Starting

**Symptoms**: Site shows 502 Bad Gateway

**Solutions**:
1. Check PM2 status: `pm2 status`
2. Check logs: `pm2 logs`
3. Verify .env file exists: `cat /var/www/newsportal/.env`
4. Check MongoDB connection string is correct

### DIMOCO Payment Issues

**Symptoms**: Payments not working

**Solutions**:
1. Verify you're using the correct API URL for sandbox/production
2. Check merchant and service IDs are correct
3. Verify API key/shared secret matches DIMOCO dashboard
4. Check server logs for DIMOCO API responses

---

## Support

For issues:
1. Check the troubleshooting section above
2. Review server logs: `/var/www/newsportal/logs/`
3. Check PM2 logs: `pm2 logs`
4. Review Nginx logs: `/var/log/nginx/error.log`

---

## Manual Deployment (Alternative)

If you prefer manual deployment:

```bash
# On your server
git clone <repo-url> /var/www/newsportal
cd /var/www/newsportal

# Copy and configure environment
cp .env.example .env
nano .env  # Edit with your values

# Deploy
./scripts/deploy-hostinger.sh yourbrand
```

Then manually configure Nginx and SSL using the templates in `/scripts/`.
