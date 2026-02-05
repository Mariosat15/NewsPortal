import { NextRequest, NextResponse } from 'next/server';
import { detectNetworkType } from '@/lib/services/carrier-ip-ranges';
import { extractIpFromRequest } from '@/lib/services/msisdn-detection';

export const dynamic = 'force-dynamic';

/**
 * GET /api/network/detect
 * Detects network type (Mobile Data vs WiFi) from client IP
 * Used by frontend to show appropriate UI (allow purchase on mobile, block on WiFi)
 */
export async function GET(request: NextRequest) {
  try {
    // Extract IP from request headers
    const ip = extractIpFromRequest(request);
    
    // Log headers for debugging
    const cfIp = request.headers.get('cf-connecting-ip');
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    
    console.log('[Network Detection] Headers:', {
      'cf-connecting-ip': cfIp,
      'x-forwarded-for': forwardedFor,
      'x-real-ip': realIp,
      extractedIp: ip,
    });
    
    // Detect network type using carrier IP ranges
    const networkResult = detectNetworkType(ip);
    
    console.log('[Network Detection] Result:', {
      ip,
      networkType: networkResult.networkType,
      isMobileNetwork: networkResult.isMobileNetwork,
      carrier: networkResult.carrier?.name,
    });
    
    return NextResponse.json({
      success: true,
      networkType: networkResult.networkType,
      isMobileNetwork: networkResult.isMobileNetwork,
      carrier: networkResult.carrier ? {
        name: networkResult.carrier.name,
        code: networkResult.carrier.code,
        country: networkResult.carrier.country,
      } : undefined,
      ip: process.env.NODE_ENV === 'development' ? ip : undefined, // Only show IP in dev
    });
  } catch (error) {
    console.error('[Network Detection] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to detect network type',
      networkType: 'UNKNOWN',
      isMobileNetwork: false,
    }, { status: 500 });
  }
}
