# News Portal Deployment Wizard

A plug & play web-based installer that guides you through deploying the News Portal to your server.

## Features

- **Step-by-Step Wizard**: 7 easy steps to configure everything
- **SSH Connection**: Securely connects to your server
- **Auto-Configuration**: Generates all config files (.env, nginx, PM2)
- **SSL Setup**: Automatically obtains Let's Encrypt certificates
- **Real-Time Progress**: Watch the deployment in real-time

## Quick Start

1. **Install dependencies**:
   ```bash
   cd installer
   npm install
   ```

2. **Start the wizard**:
   ```bash
   npm run dev
   ```

3. **Open the wizard**: 
   Navigate to [http://localhost:3001](http://localhost:3001)

4. **Follow the steps**:
   - Step 1: Enter your server SSH credentials
   - Step 2: Configure your brand and domain
   - Step 3: Set up MongoDB connection
   - Step 4: Configure DIMOCO payment
   - Step 5: Add API keys (OpenAI, etc.)
   - Step 6: Set admin credentials
   - Step 7: Review and deploy!

## Requirements

### On Your Local Machine
- Node.js 18+
- npm

### On Your Server
The wizard will install these automatically if missing:
- Node.js 18
- npm
- PM2 (process manager)
- Nginx (web server)
- Certbot (SSL)
- Git

### Server Requirements
- Ubuntu 20.04+ or Debian 11+ (recommended)
- SSH access (root or sudo user)
- Domain pointing to server IP
- Ports 80 and 443 open

## Configuration Collected

### Server
- IP address / hostname
- SSH port
- Username
- Password or SSH key
- Deployment directory

### Domain & Branding
- Brand name and ID
- Domain name
- Primary and secondary colors

### Database
- MongoDB connection string
- Support for MongoDB Atlas or self-hosted

### Payment (DIMOCO)
- API URL (sandbox/production)
- Merchant and Service IDs
- API credentials
- Article pricing

### API Keys
- OpenAI API key (required)
- BrightData token (optional)

### Admin
- Admin email
- Admin password
- Security secrets (auto-generated)

## What Gets Deployed

1. **Application Files**: Cloned from repository
2. **Environment Config**: `.env` with all your settings
3. **Nginx Config**: Reverse proxy with SSL
4. **PM2 Config**: Process manager for auto-restart
5. **SSL Certificate**: Let's Encrypt via Certbot
6. **Brand Assets**: Logo placeholder and colors

## Troubleshooting

### Connection Failed
- Verify SSH credentials
- Check firewall allows port 22
- Ensure username has sudo access

### Build Failed
- Check server has enough RAM (1GB minimum)
- Verify Node.js version is 18+

### SSL Failed
- Ensure domain DNS points to server
- Check ports 80 and 443 are open
- Verify domain is accessible

### App Not Starting
- Check PM2 logs: `pm2 logs`
- Verify .env file exists
- Check MongoDB connection

## Manual Deployment

If you prefer manual deployment:

```bash
# On your server
git clone <repo-url> /var/www/newsportal
cd /var/www/newsportal

# Copy and edit environment
cp .env.example .env
nano .env

# Deploy
./scripts/deploy-hostinger.sh mybrand
```

## Support

For issues with the deployment wizard, check:
1. Server error logs: `/var/www/newsportal/logs/`
2. PM2 status: `pm2 status`
3. Nginx logs: `/var/log/nginx/error.log`
