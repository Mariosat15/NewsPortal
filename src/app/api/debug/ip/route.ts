import { NextRequest, NextResponse } from 'next/server';
import { detectNetworkType } from '@/lib/services/carrier-ip-ranges';

export const dynamic = 'force-dynamic';

/**
 * Debug endpoint to show detected IP and network type
 * Only works in development mode
 */
export async function GET(request: NextRequest) {
  // Allow in development OR when bypass is enabled
  const bypassEnabled = process.env.BYPASS_NETWORK_CHECK === 'true';
  const isDev = process.env.NODE_ENV === 'development';
  
  if (!isDev && !bypassEnabled) {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  const ip = forwardedFor?.split(',')[0]?.trim() || realIp || cfConnectingIp || 'unknown';
  
  const networkResult = detectNetworkType(ip);

  return NextResponse.json({
    ip,
    headers: {
      'x-forwarded-for': forwardedFor,
      'x-real-ip': realIp,
      'cf-connecting-ip': cfConnectingIp,
      'user-agent': request.headers.get('user-agent'),
    },
    networkDetection: networkResult,
    message: networkResult.isMobileNetwork 
      ? `Mobile network detected: ${networkResult.carrier?.name}`
      : 'WiFi/Broadband detected - your carrier IP range may not be configured',
  });
}
