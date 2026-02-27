# Direct Carrier Billing (DCB) System Guide

This guide explains how the MSISDN-based authentication and carrier billing system works.

## Table of Contents

1. [Overview](#overview)
2. [How It Works](#how-it-works)
3. [MSISDN Detection](#msisdn-detection)
4. [Payment Flow](#payment-flow)
5. [Visitor Analytics](#visitor-analytics)
6. [Admin Dashboard](#admin-dashboard)
7. [DIMOCO Integration](#dimoco-integration)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The News Portal uses **Direct Carrier Billing (DCB)** instead of traditional payment methods. Users pay through their mobile carrier, and their phone number (MSISDN) serves as their identity.

### Key Features

- **No Registration Required**: Users are automatically identified by their mobile number
- **4G/5G Only Payments**: Ensures carrier can identify the user for billing
- **Automatic User Creation**: First purchase creates the user account
- **Persistent Access**: Users retain access to purchased articles

---

## How It Works

### Traditional vs DCB Authentication

| Traditional | DCB (This System) |
|-------------|-------------------|
| User registers with email/password | User visits on mobile data |
| User logs in to purchase | System detects MSISDN |
| Pay with credit card | Pay through carrier |
| Email-based account | MSISDN-based account |

### User Journey

```
1. User visits site on 4G/5G
         ↓
2. System detects MSISDN via DIMOCO
         ↓
3. User browses free content
         ↓
4. User wants premium article → Click Unlock
         ↓
5. Payment request sent to carrier
         ↓
6. Carrier charges user's mobile bill
         ↓
7. User created/updated with MSISDN
         ↓
8. Article unlocked permanently
```

---

## MSISDN Detection

### Detection Methods

The system uses multiple methods to detect the user's mobile number:

1. **DIMOCO Identify API** (Most Reliable)
   - Works when user is on carrier network (4G/5G)
   - Carrier provides MSISDN directly
   - Highest confidence level

2. **Header Enrichment** (Carrier-Dependent)
   - Some carriers inject MSISDN into HTTP headers
   - Headers checked: `x-msisdn`, `msisdn`, `x-up-calling-line-id`

3. **Carrier IP Detection**
   - System maintains database of carrier IP ranges
   - Detects if user is on mobile data vs WiFi

### Network Detection

```javascript
// System checks IP against carrier ranges
detectNetworkType(userIP) → {
  isMobileNetwork: true/false,
  networkType: 'MOBILE_DATA' | 'WIFI',
  carrier: 'PrimeTel' | 'Cyta' | etc.
}
```

### WiFi vs 4G/5G

| WiFi | Mobile Data (4G/5G) |
|------|---------------------|
| Cannot detect MSISDN | MSISDN detected via carrier |
| Payment blocked | Payment allowed |
| User sees "Switch to mobile data" | User can unlock articles |

---

## Payment Flow

### Step-by-Step Process

1. **User clicks "Unlock Article"**
   - System checks network type
   - If WiFi: Show "Switch to mobile data" message
   - If 4G/5G: Proceed to payment

2. **Initiate Payment**
   ```
   POST /api/payment/dimoco/initiate
   {
     articleId: "...",
     articleSlug: "...",
     amount: 99  // cents
   }
   ```

3. **DIMOCO Redirect**
   - User redirected to DIMOCO payment page
   - Carrier authenticates user by MSISDN
   - User confirms payment

4. **Callback Processing**
   ```
   POST /api/payment/dimoco/callback
   - Transaction status
   - MSISDN from carrier
   - Payment confirmation
   ```

5. **Article Unlocked**
   - User record created/updated with MSISDN
   - Unlock record created
   - User redirected to article

### Transaction States

| State | Description |
|-------|-------------|
| `PENDING` | Payment initiated |
| `COMPLETED` | Successfully charged |
| `FAILED` | Payment failed |
| `REFUNDED` | Payment reversed |

---

## Visitor Analytics

### Tracking System

Every visitor is tracked from first touch:

```
Landing Page Visit → Session Created → MSISDN Detected → Customer Converted
```

### Data Captured

For each visitor:
- Session ID
- IP Address
- Network Type (WiFi/Mobile)
- Carrier (if mobile)
- MSISDN (if detected)
- Referrer URL
- UTM Parameters
- Device Info
- All pages visited

### Visitor Statuses

| Status | Description |
|--------|-------------|
| `visitor` | First visit, no MSISDN detected |
| `identified` | MSISDN detected but no purchase |
| `customer` | Made at least one purchase |

---

## Admin Dashboard

### Visitor Analytics

Access at: `/admin` → "Visitor Analytics" tab

Features:
- **Page Performance**: Compare main site vs landing pages
- **Visitor Sessions**: View all sessions grouped by MSISDN
- **Mobile/WiFi Filter**: Toggle to show only mobile visitors
- **Export CSV**: Download filtered data

### Key Metrics

| Metric | Description |
|--------|-------------|
| Total Visitors | Unique visitors by session |
| MSISDN Captured | Visitors with detected number |
| Mobile Data Visits | Visitors on 4G/5G |
| WiFi Visits | Visitors on WiFi |
| Conversions | Visitors who purchased |

### Filtering Options

- **Search**: By MSISDN, referrer, carrier, UTM params
- **Date Range**: Filter by date
- **Network Type**: Mobile only or all
- **Page Filter**: Click on page name to filter

### Export Data

1. Set your filters
2. Click "Export CSV"
3. Data includes all visible columns
4. Phone numbers formatted as text (not scientific notation)

---

## DIMOCO Integration

### Configuration

Set in `.env`:

```env
# Sandbox
DIMOCO_API_URL=https://sandbox-dcb.dimoco.at/sph/payment
DIMOCO_MERCHANT_ID=8000
DIMOCO_PASSWORD=GsD8UxfCtGwK3
DIMOCO_ORDER_ID=8000
ARTICLE_PRICE_CENTS=99

# Production (per pay:smart specification v2.1)
# DIMOCO_API_URL=https://services.dimoco.at/smart/payment
# DIMOCO_MERCHANT_ID=<your-merchant-id>
# DIMOCO_PASSWORD=<your-password>
# DIMOCO_ORDER_ID=<your-order-id>
```

### API Actions

1. **Identify** - Detect MSISDN
   ```
   POST /api/identify/msisdn
   → Calls DIMOCO identify action
   → Returns user's MSISDN
   ```

2. **Start** - Initiate payment
   ```
   POST /api/payment/dimoco/initiate
   → Calls DIMOCO start action
   → Returns redirect URL
   ```

3. **Refund** - Reverse payment
   ```
   POST /api/admin/transactions/[id]/refund
   → Calls DIMOCO refund action
   → Credits user's carrier
   ```

### Security

All DIMOCO API calls use HMAC-SHA256 signing:

```javascript
// Parameters sorted alphabetically
const sortedValues = Object.values(params).sort().join('');
const digest = crypto.createHmac('sha256', apiKey)
  .update(sortedValues)
  .digest('hex');
```

### Sandbox vs Production

| Setting | Sandbox | Production |
|---------|---------|------------|
| API URL | `sandbox-dcb.dimoco.at/sph/payment` | `services.dimoco.at/smart/payment` |
| Real charges | No | Yes |
| Test MSISDN | Always `436763602302` | Real user phone numbers |
| `redirect=1` | Required in start action | Not needed |
| Callback digest | Not verified | HMAC-SHA256 verified |
| WiFi identify | Always succeeds | Requires 4G/5G |

---

## Troubleshooting

### MSISDN Not Detected

**Symptoms**: User on 4G but MSISDN shows as null

**Causes**:
1. Carrier not supported by DIMOCO
2. User using VPN
3. User on WiFi calling (WiFi icon shown but using WiFi)

**Solutions**:
- Check `/api/debug/ip` for network detection
- Verify carrier is in DIMOCO's supported list
- User should turn off WiFi completely

### Payment Blocked

**Symptoms**: "Switch to mobile data" shown on 4G

**Causes**:
1. IP not recognized as mobile carrier
2. Carrier IP range not in database

**Solutions**:
- Check detected carrier in `/api/network/detect`
- Add carrier IP range to `carrier-ip-ranges.ts`
- User can try toggling airplane mode

### Article Still Locked After Payment

**Symptoms**: Payment succeeded but article shows paywall

**Causes**:
1. MSISDN mismatch between payment and access
2. Cookie not set properly
3. Session expired

**Solutions**:
- Check `user_msisdn` cookie is set
- Verify transaction record in database
- Check unlock record exists for article

### "Unknown Carrier" on Mobile

**Symptoms**: Network shows as WiFi but user is on mobile

**Causes**:
1. Carrier IP range not configured
2. Carrier using unexpected IP block

**Solutions**:
1. Get user's IP from `/api/debug/ip`
2. Identify carrier (RIPE, ipinfo.io)
3. Add IP range to `carrier-ip-ranges.ts`

Example:
```typescript
// In carrier-ip-ranges.ts
{
  name: 'New Carrier',
  ipRanges: ['203.0.113.0/24'],
  country: 'CY',
}
```

---

## Supported Carriers

### Cyprus

| Carrier | Status | IP Detection |
|---------|--------|--------------|
| PrimeTel | Supported | Yes |
| Cyta | Supported | Yes |
| Epic | Supported | Yes |

### Adding New Carriers

1. Get carrier's IP ranges (RIPE database, ipinfo.io)
2. Add to `src/lib/services/carrier-ip-ranges.ts`:
   ```typescript
   {
     name: 'Carrier Name',
     ipRanges: ['IP/CIDR', 'IP/CIDR'],
     country: 'XX',
   }
   ```
3. Test with user on that carrier

---

## API Reference

### Public Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/identify/msisdn` | POST | Detect user's MSISDN |
| `/api/network/detect` | GET | Check network type |
| `/api/payment/dimoco/initiate` | POST | Start payment |
| `/api/tracking/session` | POST | Create/update session |
| `/api/tracking/identify` | POST | Log identified page view |

### Admin Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/tracking/sessions` | GET | List visitor sessions |
| `/api/admin/tracking/landing-page-stats` | GET | Page performance |
| `/api/admin/transactions` | GET | List transactions |
| `/api/admin/transactions/[id]/refund` | POST | Refund transaction |
| `/api/admin/customers` | GET | List customers |
