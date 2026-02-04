import { NextRequest, NextResponse } from 'next/server';
import { startPayment, initiatePaymentMock, getDimocoConfig } from '@/lib/dimoco/client';
import { getBrandIdSync } from '@/lib/brand/server';
import { getArticleRepository } from '@/lib/db';
import { getCollection } from '@/lib/db/mongodb';

const ARTICLE_PRICE_CENTS = parseInt(process.env.ARTICLE_PRICE_CENTS || '99', 10);

// Get the base URL from the request (works with any domain, tunnel, proxy)
function getBaseUrl(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const host = request.headers.get('host');
  
  console.log('[Payment] Headers:', {
    forwardedHost,
    forwardedProto,
    host,
    url: request.url,
  });
  
  const effectiveHost = forwardedHost || host;
  const effectiveProto = forwardedProto || (effectiveHost?.includes('localhost') ? 'http' : 'https');
  
  if (effectiveHost) {
    const baseUrl = `${effectiveProto}://${effectiveHost}`;
    console.log('[Payment] Using base URL:', baseUrl);
    return baseUrl;
  }
  
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
    const useMock = searchParams.get('mock') === 'true';

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
    let deviceInfo: Record<string, unknown> = {};
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

    // Check if we should use mock or real DIMOCO
    const config = getDimocoConfig();
    const shouldUseMock = useMock || !config.password || config.password === '';

    // Prepare payment request
    const paymentRequest = {
      articleId: article._id!.toString(),
      articleSlug: slug,
      amount: ARTICLE_PRICE_CENTS,
      currency: 'EUR',
      description: `Artikel: ${article.title.substring(0, 40)}...`,
      returnUrl: returnUrl || `${baseUrl}/de/article/${slug}`,
      brandId,
      baseUrl,
      metadata: {
        ...deviceInfo,
        ipAddress,
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    };

    let response;

    if (shouldUseMock) {
      console.log('[Payment] Using MOCK payment flow');
      response = await initiatePaymentMock(paymentRequest);
    } else {
      console.log('[Payment] Using REAL DIMOCO API');
      response = await startPayment(paymentRequest);
    }

    if (!response.success) {
      console.error('[Payment] Failed:', response.error);
      
      // Fallback to mock if real API fails
      if (!shouldUseMock) {
        console.log('[Payment] Falling back to mock...');
        response = await initiatePaymentMock(paymentRequest);
      }
    }

    if (!response.success || (!response.paymentUrl && !response.redirectUrl)) {
      return NextResponse.json(
        { success: false, error: response.error || 'Failed to initiate payment' },
        { status: 500 }
      );
    }

    // Store pending transaction in database for callback processing
    try {
      const transactionsCollection = await getCollection(brandId, 'transactions');
      await transactionsCollection.insertOne({
        transactionId: response.transactionId,
        articleId: article._id!.toString(),
        articleSlug: slug,
        amount: ARTICLE_PRICE_CENTS,
        currency: 'EUR',
        status: 'pending',
        createdAt: new Date(),
        metadata: paymentRequest.metadata,
        returnUrl: paymentRequest.returnUrl,
      });
      console.log('[Payment] Stored pending transaction:', response.transactionId);
    } catch (e) {
      console.error('[Payment] Failed to store transaction:', e);
    }

    // Redirect to payment page
    const redirectUrl = response.redirectUrl || response.paymentUrl;
    const fullRedirectUrl = redirectUrl?.startsWith('http') 
      ? redirectUrl 
      : new URL(redirectUrl!, baseUrl).toString();

    console.log('[Payment] Redirecting to:', fullRedirectUrl);
    return NextResponse.redirect(fullRedirectUrl);
  } catch (error) {
    console.error('Payment initiation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initiate payment' },
      { status: 500 }
    );
  }
}
