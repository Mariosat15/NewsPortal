#!/bin/bash

# ============================================
# News Portal - Hostinger Deployment Script
# ============================================
# Usage: ./scripts/deploy-hostinger.sh [brand_id]
# This script deploys a white-label instance of the news portal
# ============================================

set -e

# Configuration
BRAND_ID=${1:-"default"}
DEPLOY_DIR="/home/u123456789/public_html"  # Update with your Hostinger path
NODE_VERSION="18"
PM2_APP_NAME="newsportal-${BRAND_ID}"

echo "=========================================="
echo "News Portal Deployment Script"
echo "Brand: ${BRAND_ID}"
echo "=========================================="

# Check if .env file exists for the brand
ENV_FILE=".env.${BRAND_ID}"
if [ ! -f "$ENV_FILE" ]; then
    echo "Warning: ${ENV_FILE} not found. Using .env.example as template."
    cp .env.example "$ENV_FILE"
    echo "Please update ${ENV_FILE} with your configuration."
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check dependencies
echo ""
echo "Checking dependencies..."

if ! command_exists node; then
    echo "Error: Node.js is not installed"
    exit 1
fi

if ! command_exists npm; then
    echo "Error: npm is not installed"
    exit 1
fi

if ! command_exists pm2; then
    echo "Installing PM2..."
    npm install -g pm2
fi

# Install dependencies
echo ""
echo "Installing dependencies..."
npm install --production

# Build the application
echo ""
echo "Building application..."
npm run build

# Copy environment file
echo ""
echo "Setting up environment..."
cp "$ENV_FILE" .env.local

# Create/Update PM2 ecosystem file
echo ""
echo "Creating PM2 configuration..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '${PM2_APP_NAME}',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: 'logs/error.log',
    out_file: 'logs/output.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
EOF

# Create logs directory
mkdir -p logs

# Start/Restart PM2 app
echo ""
echo "Starting application with PM2..."
pm2 stop "${PM2_APP_NAME}" 2>/dev/null || true
pm2 delete "${PM2_APP_NAME}" 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

# Setup PM2 to start on boot
echo ""
echo "Setting up PM2 startup..."
pm2 startup || true

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Application is running at: http://localhost:3000"
echo ""
echo "Useful PM2 commands:"
echo "  pm2 status        - Check app status"
echo "  pm2 logs ${PM2_APP_NAME}  - View logs"
echo "  pm2 restart ${PM2_APP_NAME} - Restart app"
echo "  pm2 stop ${PM2_APP_NAME}    - Stop app"
echo ""
echo "Don't forget to:"
echo "  1. Configure your domain DNS to point to this server"
echo "  2. Set up SSL certificate (Let's Encrypt recommended)"
echo "  3. Configure Nginx/Apache as reverse proxy"
echo ""
