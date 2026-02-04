import { NextRequest, NextResponse } from 'next/server';
import { getBrandIdSync } from '@/lib/brand/server';
import { getUserRepository } from '@/lib/db';
import { headers } from 'next/headers';

// POST /api/identify - Hidden identification endpoint
// This endpoint is used by the hidden identification page to track users
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const brandId = getBrandIdSync();
    const userRepo = getUserRepository(brandId);

    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || 
               headersList.get('x-real-ip') || 
               'unknown';
    const userAgent = headersList.get('user-agent') || '';
    const referer = headersList.get('referer') || '';

    // Extract data from request
    const {
      sessionId,
      page,
      msisdn,
      resolution,
      deviceInfo,
    } = body;

    if (msisdn) {
      // User is identified with MSISDN
      await userRepo.upsert({
        msisdn,
        ip,
        userAgent,
        referrer: referer,
        page: page || '/',
        sessionId,
      });

      // Set MSISDN cookie in response
      const response = NextResponse.json({
        success: true,
        identified: true,
        message: 'User identified',
      });

      response.cookies.set('user_msisdn', msisdn, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: '/',
      });

      return response;
    } else {
      // Anonymous tracking
      await userRepo.trackVisit(sessionId || 'unknown', {
        ip,
        userAgent,
        referrer: referer,
        page: page || '/',
      });

      return NextResponse.json({
        success: true,
        identified: false,
        message: 'Visit tracked',
      });
    }
  } catch (error) {
    console.error('Identification error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process identification' },
      { status: 500 }
    );
  }
}

// GET /api/identify - Check identification status
export async function GET(request: NextRequest) {
  try {
    const msisdn = request.cookies.get('user_msisdn')?.value;
    const sessionId = request.cookies.get('news_session')?.value;

    return NextResponse.json({
      success: true,
      identified: !!msisdn,
      hasSession: !!sessionId,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to check status' },
      { status: 500 }
    );
  }
}
