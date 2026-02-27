# DIMOCO MSISDN Detection Guide

## Overview

DIMOCO's MSISDN detection works through **carrier header enrichment** - when a user is on mobile data (4G/5G), the mobile carrier automatically adds the user's phone number to HTTP headers.

## How It Works

### The Flow

```
User on 4G/5G → Clicks "Unlock Article"
                      ↓
            Request goes through carrier network
                      ↓
            Carrier adds MSISDN to headers
            (e.g., x-msisdn: +491234567890)
                      ↓
            DIMOCO reads the header
                      ↓
            DIMOCO returns phone number
                      ↓
            We store it and process payment
```

### Why This Works

- **Mobile carriers know the phone number** of devices using their network
- **Header enrichment** is automatic when on mobile data
- **DIMOCO has partnerships** with carriers to access these headers
- **No IP ranges needed** - works with any carrier that supports DIMOCO

## Implementation

### 1. API Endpoints

We've created three endpoints:

#### `/api/payment/dimoco/identify`
- **Purpose**: Initiates MSISDN detection
- **When**: Before payment, to detect user's phone number
- **Result**: Redirects to DIMOCO for detection

#### `/api/payment/dimoco/identify-callback`
- **Purpose**: Receives MSISDN from DIMOCO
- **When**: DIMOCO redirects back after detection
- **Result**: Stores MSISDN in cookie, proceeds to payment

#### `/api/debug/ip`
- **Purpose**: Debug network detection (dev only)
- **When**: Testing to see detected IP and network type
- **Result**: Returns IP, network type, carrier info

### 2. DIMOCO Configuration

#### Sandbox Credentials (Testing)
```env
DIMOCO_API_URL=https://sandbox-dcb.dimoco.at/sph/payment
DIMOCO_MERCHANT_ID=8000
DIMOCO_PASSWORD=GsD8UxfCtGwK3
DIMOCO_ORDER_ID=8000
BYPASS_NETWORK_CHECK=true
```

#### Production Credentials (Live)
```env
DIMOCO_API_URL=https://dcb.dimoco.at/sph/payment
DIMOCO_MERCHANT_ID=<your-real-merchant-id>
DIMOCO_PASSWORD=<your-real-password>
DIMOCO_ORDER_ID=<your-real-order-id>
BYPASS_NETWORK_CHECK=false
```

### 3. Sandbox vs Production Behavior

| Feature | Sandbox | Production |
|---------|---------|------------|
| API URL | `sandbox-dcb.dimoco.at` | `dcb.dimoco.at` |
| MSISDN returned | Always `436763602302` | Real user phone number |
| Operator returned | Always `AT_SANDBOX` | Real carrier name |
| Identify works on WiFi | Yes (always succeeds) | No (requires 4G/5G) |
| `redirect=1` in start | Required | Not needed |
| Real charges | No | Yes |

⚠️ **Important**: DIMOCO Sandbox always returns the same test MSISDN regardless of device. Real carrier detection only works in production.

## Testing

### With Bypass (Current Setup)

Since `BYPASS_NETWORK_CHECK=true` in your `.env`:
- ✅ You can test payments on WiFi
- ✅ No MSISDN required for testing
- ✅ Payment flow works end-to-end

### Testing MSISDN Detection

1. **Check your network**:
   ```
   Visit: http://localhost:3000/api/debug/ip
   ```
   
2. **Try identify flow**:
   ```
   Visit: http://localhost:3000/api/payment/dimoco/identify?articleId=123&slug=test-article
   ```

3. **Sandbox result**:
   - DIMOCO will return `436763602302`
   - Cookie will be set
   - You'll be redirected to payment

## Production Setup

### Requirements

1. **Production DIMOCO Account**
   - Production API URL: `https://dcb.dimoco.at/sph/payment`
   - Your assigned Merchant ID, Password, and Order ID
   - Carrier partnerships activated for target countries

2. **Environment Variables** (update `.env` on server)
   ```env
   NODE_ENV=production
   DIMOCO_API_URL=https://dcb.dimoco.at/sph/payment
   DIMOCO_MERCHANT_ID=<your-merchant-id>
   DIMOCO_PASSWORD=<your-password>
   DIMOCO_ORDER_ID=<your-order-id>
   BYPASS_NETWORK_CHECK=false
   ```

3. **Key Differences from Sandbox**
   - `redirect=1` is NOT sent in production (auto-handled by the app)
   - Callback digest verification is ENABLED (HMAC-SHA256)
   - Mock payment fallback is DISABLED
   - WiFi bypass is DISABLED

4. **Carrier Support**
   - Works with carriers that have DIMOCO partnerships
   - Germany: Deutsche Telekom, Vodafone, O2
   - Austria: A1, Magenta, Drei
   - Others: Check with DIMOCO

### Production Payment Flow

```
User on mobile 4G/5G → Clicks "Unlock Article"
                              ↓
                  App calls DIMOCO 'start' action
                              ↓
                  DIMOCO redirects to carrier payment page
                              ↓
                  Carrier identifies user by MSISDN
                              ↓
                  User confirms → charged on phone bill
                              ↓
                  DIMOCO sends POST callback to our server
                              ↓
                  App verifies digest + creates unlock record
                              ↓
                  User redirected back → article unlocked
```

### Switching from Sandbox to Production

Simply update these 4 env vars on your server:
```bash
# Edit .env file
DIMOCO_API_URL=https://dcb.dimoco.at/sph/payment
DIMOCO_MERCHANT_ID=<your-production-merchant-id>
DIMOCO_PASSWORD=<your-production-password>
DIMOCO_ORDER_ID=<your-production-order-id>
```
Then rebuild and restart:
```bash
npm run build && pm2 restart all
```
No code changes needed - the app auto-detects sandbox vs production from the URL.

## Header Enrichment Details

### Common Headers

DIMOCO and carriers use various headers:
- `x-msisdn`
- `x-up-calling-line-id`
- `x-nokia-msisdn`
- `x-wap-network-client-msisdn`
- And more (see `src/lib/services/msisdn-detection.ts`)

### Automatic Detection

Our middleware (`src/lib/middleware/msisdn-detector.ts`) checks these headers on every request and stores the MSISDN in cookies.

## Benefits vs IP Range Detection

### IP Range Method (Current Fallback)
❌ Requires maintaining huge IP lists
❌ Only works for configured carriers
❌ Can be inaccurate
❌ High maintenance

### DIMOCO Header Enrichment
✅ No IP lists needed
✅ Works with any DIMOCO-supported carrier
✅ 100% accurate (direct from carrier)
✅ Zero maintenance
✅ Production-ready

## Current Status

- ✅ **DIMOCO integration complete**
- ✅ **Identify endpoints created**
- ✅ **Callback handling implemented**
- ✅ **Cookie management working**
- ✅ **Sandbox testing available**
- ⚠️ **Bypass enabled** (for development)
- 🔜 **Production deployment** (requires real DIMOCO account)

## Next Steps

### For Development
1. Keep `BYPASS_NETWORK_CHECK=true`
2. Test payment flow on any network
3. Sandbox will return test MSISDN

### For Production
1. Get production DIMOCO credentials
2. Update `.env` with production values
3. Set `BYPASS_NETWORK_CHECK=false`
4. Deploy to production
5. Real MSISDN detection will work automatically!

## Troubleshooting

### "WiFi detected" on mobile
- **Cause**: Your carrier's IP ranges not in our list
- **Solution**: Use `BYPASS_NETWORK_CHECK=true` for testing
- **Production**: DIMOCO header enrichment doesn't rely on IP ranges!

### Sandbox always returns same MSISDN
- **Expected**: Sandbox returns `436763602302` for testing
- **Production**: Will return real user phone numbers

### No MSISDN detected
- **Check**: User must be on mobile data (4G/5G), not WiFi
- **Check**: Carrier must support DIMOCO
- **Check**: Production account must have carrier partnerships activated

## Support

Contact DIMOCO support for:
- Production account setup
- Carrier partnership activation
- Technical integration questions
- Testing credentials
