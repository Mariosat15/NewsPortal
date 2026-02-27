import { NextRequest, NextResponse } from 'next/server';
import { startPayment, initiatePaymentMock, getDimocoConfig, isDimocoConfigured } from '@/lib/dimoco/client';
import { getBrandIdSync } from '@/lib/brand/server';
import { getArticleRepository } from '@/lib/db';
import { getCollection } from '@/lib/db/mongodb';
import { detectNetworkType } from '@/lib/services/carrier-ip-ranges';
import { extractIpFromRequest } from '@/lib/services/msisdn-detection';

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

    // Get IP address from request headers (supports Cloudflare, standard proxies)
    const ipAddress = extractIpFromRequest(request) || 'unknown';
    
    // Get session ID from cookie for linking purchases
    const sessionId = request.cookies.get('news_session')?.value;

    // VALIDATE NETWORK TYPE - Block WiFi purchases
    // Only bypass if explicitly set in .env (for local testing when needed)
    const bypassNetworkCheck = process.env.BYPASS_NETWORK_CHECK === 'true';
    
    const networkResult = detectNetworkType(ipAddress);
    if (!networkResult.isMobileNetwork && !bypassNetworkCheck) {
      console.log('[Payment] Blocked - Not on mobile network:', networkResult.networkType);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Mobile data required',
          errorCode: 'WIFI_NOT_ALLOWED',
          message: 'Please switch to mobile data (4G/5G) to make a purchase. WiFi purchases are not supported.',
          networkType: networkResult.networkType
        },
        { status: 403 }
      );
    }

    if (bypassNetworkCheck && !networkResult.isMobileNetwork) {
      console.log('[Payment] ⚠️ BYPASS_NETWORK_CHECK enabled: Allowing WiFi purchase for testing');
    }

    console.log('[Payment] Network validation passed:', {
      networkType: networkResult.networkType,
      carrier: networkResult.carrier?.name,
      bypassed: bypassNetworkCheck && !networkResult.isMobileNetwork,
    });

    // Get dynamic base URL from request
    const baseUrl = getBaseUrl(request);

    // Determine whether to use real DIMOCO API or mock
    const config = getDimocoConfig();
    const configured = isDimocoConfigured();
    
    // PRODUCTION-READY LOGIC:
    // - If credentials are configured → use REAL DIMOCO API (sandbox or production)
    // - If no credentials → use mock (local development only)
    // - If ?mock=true → force mock (admin testing)
    const shouldUseMock = useMock || !configured;

    console.log('[Payment] DIMOCO config:', {
      configured,
      apiUrl: config.apiUrl,
      merchantId: config.merchantId,
      isSandbox: config.useSandbox,
      shouldUseMock,
      mode: shouldUseMock ? 'MOCK' : config.useSandbox ? 'SANDBOX' : 'PRODUCTION',
    });

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
        sessionId, // For cross-browser unlock verification
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    };

    let response;

    if (shouldUseMock) {
      console.log('[Payment] Using MOCK payment flow (no credentials configured)');
      response = await initiatePaymentMock(paymentRequest);
    } else {
      console.log(`[Payment] Using REAL DIMOCO ${config.useSandbox ? 'SANDBOX' : 'PRODUCTION'} API`);
      if (config.useSandbox) {
        console.log('[Payment] Sandbox mode: MSISDN=436763602302, operator=AT_SANDBOX');
      }
      
      try {
        response = await startPayment(paymentRequest);
        console.log('[Payment] DIMOCO response:', JSON.stringify(response));
        
        if (!response.success) {
          console.error('[Payment] DIMOCO API Error:', response.error);
          // In production/sandbox: do NOT fall back to mock - show the real error
        }
      } catch (dimocoError) {
        console.error('[Payment] DIMOCO API exception:', dimocoError);
        response = {
          success: false,
          transactionId: '',
          error: dimocoError instanceof Error ? dimocoError.message : 'DIMOCO API call failed',
        };
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
    let redirectUrl = response.redirectUrl || response.paymentUrl;
    
    // DIMOCO returns HTML-encoded ampersands (&amp;) which need to be decoded
    if (redirectUrl) {
      redirectUrl = redirectUrl.replace(/&amp;/g, '&');
    }
    
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
