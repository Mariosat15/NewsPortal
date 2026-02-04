import { NextRequest, NextResponse } from 'next/server';
import { initiatePayment } from '@/lib/dimoco/client';
import { getBrandIdSync } from '@/lib/brand/server';
import { getArticleRepository } from '@/lib/db';

const ARTICLE_PRICE_CENTS = parseInt(process.env.ARTICLE_PRICE_CENTS || '99', 10);

// Get the base URL from the request (works with any domain, tunnel, proxy)
function getBaseUrl(request: NextRequest): string {
  // Check various headers that proxies/tunnels use
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const cfHost = request.headers.get('cf-connecting-ip') ? request.headers.get('host') : null;
  const host = request.headers.get('host');
  
  // Debug logging
  console.log('[Payment] Headers:', {
    forwardedHost,
    forwardedProto,
    host,
    url: request.url,
  });
  
  // Priority: x-forwarded-host > host header > URL
  const effectiveHost = forwardedHost || host;
  const effectiveProto = forwardedProto || (effectiveHost?.includes('localhost') ? 'http' : 'https');
  
  if (effectiveHost) {
    const baseUrl = `${effectiveProto}://${effectiveHost}`;
    console.log('[Payment] Using base URL:', baseUrl);
    return baseUrl;
  }
  
  // Fallback to request URL origin
  const url = new URL(request.url);
  console.log('[Payment] Fallback to URL origin:', url.origin);
  return url.origin;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const articleId = searchParams.get('articleId');
    const slug = searchParams.get('slug');
    const returnUrl = searchParams.get('returnUrl');
    const deviceData = searchParams.get('deviceData');

    if (!articleId || !slug) {
      return NextResponse.json(
        { success: false, error: 'Article ID and slug are required' },
        { status: 400 }
      );
    }

    const brandId = getBrandIdSync();
    const articleRepo = getArticleRepository(brandId);

    // Verify article exists
    const article = await articleRepo.findBySlug(slug);
    if (!article) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      );
    }

    // Parse device data if provided
    let deviceInfo = {};
    if (deviceData) {
      try {
        deviceInfo = JSON.parse(decodeURIComponent(deviceData));
        console.log('[Payment] Device info received:', deviceInfo);
      } catch (e) {
        console.error('[Payment] Failed to parse device data:', e);
      }
    }

    // Get IP address from request headers
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                      request.headers.get('x-real-ip') || 
                      'unknown';

    // Get dynamic base URL from request
    const baseUrl = getBaseUrl(request);

    // Initiate payment with dynamic URLs and device data
    const response = await initiatePayment({
      articleId: article._id!.toString(),
      articleSlug: slug,
      amount: ARTICLE_PRICE_CENTS,
      currency: 'EUR',
      description: `Artikel: ${article.title.substring(0, 50)}...`,
      returnUrl: returnUrl || `${baseUrl}/de/article/${slug}`,
      brandId,
      baseUrl, // Pass base URL for dynamic callback URLs
      metadata: {
        ...deviceInfo,
        ipAddress,
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    if (!response.success || !response.paymentUrl) {
      return NextResponse.json(
        { success: false, error: response.error || 'Failed to initiate payment' },
        { status: 500 }
      );
    }

    // Redirect to payment page - use baseUrl (not request.url which may be localhost)
    const redirectUrl = new URL(response.paymentUrl, baseUrl);
    console.log('[Payment] Redirecting to:', redirectUrl.toString());
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Payment initiation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initiate payment' },
      { status: 500 }
    );
  }
}
