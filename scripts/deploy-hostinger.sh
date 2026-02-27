#!/bin/bash

# ============================================
# News Portal - Hostinger Deployment Script
# ============================================
# Usage: ./scripts/deploy-hostinger.sh [brand_id]
# 
# This script can be run:
# 1. Manually via SSH for updates
# 2. Automatically by the Deployment Wizard
#
# For first-time setup, use the Deployment Wizard:
#   cd installer && npm install && npm run dev
#   Then open http://localhost:3001
# ============================================

set -e

# Configuration
BRAND_ID=${1:-"default"}
DEPLOY_DIR=${2:-"/var/www/newsportal"}
NODE_VERSION="18"
PM2_APP_NAME="newsportal-${BRAND_ID}"

echo "=========================================="
echo "News Portal Deployment Script"
echo "Brand: ${BRAND_ID}"
echo "Deploy Directory: ${DEPLOY_DIR}"
echo "=========================================="

# Check if running from wizard (WIZARD_MODE env var)
if [ -n "$WIZARD_MODE" ]; then
    echo "[WIZARD] Running in wizard mode"
fi

# Check if .env file exists for the brand
# IMPORTANT: We use ONLY .env (not .env.local) to avoid precedence conflicts.
# Next.js loads .env.local > .env, so having both causes silent overrides.
ENV_FILE=".env.${BRAND_ID}"
if [ -f "$ENV_FILE" ]; then
    echo "Using brand-specific env: ${ENV_FILE}"
    cp "$ENV_FILE" .env
elif [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "Warning: No .env file found. Using .env.example as template."
        cp .env.example .env
        echo "Please update .env with your configuration."
        if [ -z "$WIZARD_MODE" ]; then
            echo ""
            echo "TIP: For easier setup, use the Deployment Wizard:"
            echo "  cd installer && npm install && npm run dev"
            echo ""
        fi
    fi
else
    echo "Using existing .env file"
fi

# Remove .env.local if it exists to prevent override conflicts
if [ -f ".env.local" ]; then
    echo "Warning: Removing .env.local to prevent config conflicts (all settings should be in .env)"
    rm -f .env.local
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check dependencies
echo ""
echo "Checking dependencies..."

if ! command_exists node; then
    echo "Installing Node.js ${NODE_VERSION}..."
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "Node.js version: $(node -v)"

if ! command_exists npm; then
    echo "Error: npm is not installed"
    exit 1
fi

if ! command_exists pm2; then
    echo "Installing PM2..."
    sudo npm install -g pm2
fi

# Install dependencies
echo ""
echo "Installing dependencies..."
npm install --production

# Build the application
echo ""
echo "Building application..."
npm run build

# Create/Update PM2 ecosystem file
echo ""
echo "Creating PM2 configuration..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '${PM2_APP_NAME}',
    script: 'npm',
    args: 'start',
    cwd: '${DEPLOY_DIR}',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: '${DEPLOY_DIR}/logs/error.log',
    out_file: '${DEPLOY_DIR}/logs/output.log',
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

# Setup PM2 to start on boot (skip in wizard mode - already configured)
if [ -z "$WIZARD_MODE" ]; then
    echo ""
    echo "Setting up PM2 startup..."
    pm2 startup || true
fi

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Application is running at: http://localhost:3000"
echo ""
echo "Useful PM2 commands:"
echo "  pm2 status                    - Check app status"
echo "  pm2 logs ${PM2_APP_NAME}      - View logs"
echo "  pm2 restart ${PM2_APP_NAME}   - Restart app"
echo "  pm2 stop ${PM2_APP_NAME}      - Stop app"
echo ""
echo "Don't forget to:"
echo "  1. Configure your domain DNS to point to this server"
echo "  2. Set up SSL certificate (use the wizard or run certbot manually)"
echo "  3. Configure Nginx as reverse proxy (use the wizard or copy nginx.conf.template)"
echo ""
echo "For complete setup, use the Deployment Wizard:"
echo "  cd installer && npm install && npm run dev"
echo "  Open http://localhost:3001"
echo ""
