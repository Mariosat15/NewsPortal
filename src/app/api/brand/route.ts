import { NextResponse } from 'next/server';
import { getServerBrandConfig, clearSettingsCache } from '@/lib/brand/server';

// GET /api/brand - Get current brand config (with fresh data)
export async function GET() {
  // Clear cache to get fresh data
  clearSettingsCache();
  
  try {
    const brandConfig = await getServerBrandConfig();
    
    return NextResponse.json({
      success: true,
      brand: {
        name: brandConfig.name,
        logoUrl: brandConfig.logoUrl,
        faviconUrl: brandConfig.faviconUrl,
        primaryColor: brandConfig.primaryColor,
        secondaryColor: brandConfig.secondaryColor,
      },
    });
  } catch (error) {
    console.error('Brand API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get brand config' },
      { status: 500 }
    );
  }
}
