import { NextResponse } from 'next/server';
import { getServerBrandConfig, clearSettingsCache } from '@/lib/brand/server';

// Force dynamic - never cache this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/brand - Get current brand config (with fresh data)
export async function GET() {
  // Clear cache to get fresh data
  clearSettingsCache();
  
  try {
    const brandConfig = await getServerBrandConfig();
    
    // Add cache-busting timestamp to logo URL if it exists
    const logoUrlWithCacheBuster = brandConfig.logoUrl 
      ? `${brandConfig.logoUrl}${brandConfig.logoUrl.includes('?') ? '&' : '?'}v=${Date.now()}`
      : null;
    
    const response = NextResponse.json({
      success: true,
      brand: {
        name: brandConfig.name,
        logoUrl: logoUrlWithCacheBuster,
        logoUrlRaw: brandConfig.logoUrl, // Original URL without cache buster
        primaryColor: brandConfig.primaryColor,
        secondaryColor: brandConfig.secondaryColor,
      },
    });
    
    // Prevent browser from caching this response
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error('Brand API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get brand config' },
      { status: 500 }
    );
  }
}
