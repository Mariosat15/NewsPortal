#!/bin/bash

# ============================================
# News Portal - White Label Setup Script
# ============================================
# Usage: ./scripts/setup-whitelabel.sh <brand_id> <domain> <brand_name>
# This script creates a new white-label configuration
# ============================================

set -e

BRAND_ID=$1
DOMAIN=$2
BRAND_NAME=$3

if [ -z "$BRAND_ID" ] || [ -z "$DOMAIN" ] || [ -z "$BRAND_NAME" ]; then
    echo "Usage: ./scripts/setup-whitelabel.sh <brand_id> <domain> <brand_name>"
    echo "Example: ./scripts/setup-whitelabel.sh mybrand mynewssite.de 'My News Site'"
    exit 1
fi

echo "=========================================="
echo "Creating White-Label Configuration"
echo "Brand ID: ${BRAND_ID}"
echo "Domain: ${DOMAIN}"
echo "Name: ${BRAND_NAME}"
echo "=========================================="

# Create environment file for the brand
ENV_FILE=".env.${BRAND_ID}"

if [ -f "$ENV_FILE" ]; then
    echo "Warning: ${ENV_FILE} already exists. Creating backup..."
    cp "$ENV_FILE" "${ENV_FILE}.backup.$(date +%Y%m%d%H%M%S)"
fi

echo "Creating ${ENV_FILE}..."

cat > "$ENV_FILE" << EOF
# ============================================
# NEWS PORTAL - ${BRAND_NAME}
# Brand ID: ${BRAND_ID}
# Generated: $(date)
# ============================================

# Brand Configuration
BRAND_ID=${BRAND_ID}
BRAND_NAME="${BRAND_NAME}"
BRAND_DOMAIN=${DOMAIN}
BRAND_LOGO_URL=/images/brands/${BRAND_ID}/logo.svg
BRAND_PRIMARY_COLOR=#1a73e8
BRAND_SECONDARY_COLOR=#4285f4

# MongoDB (IMPORTANT: Create a separate database for this brand)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/newsportal_${BRAND_ID}?retryWrites=true&w=majority

# Authentication
BETTER_AUTH_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "change-this-to-a-secure-random-string")
BETTER_AUTH_URL=https://${DOMAIN}

# DIMOCO Payment
DIMOCO_API_URL=https://api.dimoco.eu
DIMOCO_API_KEY=your-dimoco-api-key
DIMOCO_MERCHANT_ID=your-merchant-id
DIMOCO_SERVICE_ID=your-service-id
DIMOCO_CALLBACK_SECRET=$(openssl rand -hex 16 2>/dev/null || echo "change-this-callback-secret")
DIMOCO_SUCCESS_URL=https://${DOMAIN}/payment/success
DIMOCO_CANCEL_URL=https://${DOMAIN}/payment/cancel

# Article pricing (in cents)
ARTICLE_PRICE_CENTS=99

# OpenAI (for AI Agents)
OPENAI_API_KEY=sk-your-openai-api-key

# BrightData (for Web Scraping)
BRIGHTDATA_API_TOKEN=your-brightdata-token
BRIGHTDATA_ZONE=web_unlocker1

# Admin Configuration
ADMIN_EMAIL=admin@${DOMAIN}
ADMIN_PASSWORD=$(openssl rand -base64 12 2>/dev/null || echo "change-this-admin-password")
ADMIN_SECRET=$(openssl rand -hex 16 2>/dev/null || echo "change-this-admin-secret")

# Agent Configuration
AGENT_CRON_SCHEDULE=0 */6 * * *
AGENT_MAX_ARTICLES_PER_RUN=5
AGENT_DEFAULT_TOPICS=news,lifestyle,technology,sports,health,finance

# Application Settings
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://${DOMAIN}
EOF

# Create brand assets directory
ASSETS_DIR="public/images/brands/${BRAND_ID}"
mkdir -p "$ASSETS_DIR"

# Create placeholder logo
echo "Creating placeholder assets in ${ASSETS_DIR}..."
cat > "${ASSETS_DIR}/logo.svg" << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 50">
  <text x="10" y="35" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#1a73e8">
    News Portal
  </text>
</svg>
EOF

echo ""
echo "=========================================="
echo "White-Label Setup Complete!"
echo "=========================================="
echo ""
echo "Created files:"
echo "  - ${ENV_FILE}"
echo "  - ${ASSETS_DIR}/logo.svg (placeholder)"
echo ""
echo "Next steps:"
echo "  1. Edit ${ENV_FILE} and update:"
echo "     - MongoDB URI (create new database)"
echo "     - DIMOCO credentials"
echo "     - OpenAI API key"
echo "     - Admin password"
echo "  2. Replace logo.svg with your brand logo"
echo "  3. Deploy with: ./scripts/deploy-hostinger.sh ${BRAND_ID}"
echo ""
