import { NextRequest, NextResponse } from 'next/server';
import { initiatePaymentMock, getDimocoConfig, isDimocoConfigured, buildDirectPaymentUrl } from '@/lib/dimoco/client';
import { getBrandIdSync } from '@/lib/brand/server';
import { getArticleRepository } from '@/lib/db';
import { getCollection } from '@/lib/db/mongodb';
import { detectNetworkType } from '@/lib/services/carrier-ip-ranges';
import { extractIpFromRequest } from '@/lib/services/msisdn-detection';

const ARTICLE_PRICE_CENTS = parseInt(process.env.ARTICLE_PRICE_CENTS || '99', 10);

// Get the base URL from the request (works with any domain, tunnel, proxy)
// Priority: NEXT_PUBLIC_APP_URL > X-Forwarded-Host > Host header
// NEVER returns localhost — throws instead (DIMOCO cannot redirect to localhost)
function getBaseUrl(request: NextRequest): string {
  // 1. Explicit env var — most reliable, always correct in production
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl && !envUrl.includes('localhost')) {
    console.log('[Payment] Using NEXT_PUBLIC_APP_URL:', envUrl);
    return envUrl.replace(/\/$/, ''); // strip trailing slash
  }

  // 2. Proxy headers from Nginx/Cloudflare
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const host = request.headers.get('host');
  
  console.log('[Payment] Headers for baseUrl:', {
    NEXT_PUBLIC_APP_URL: envUrl || '(not set)',
    forwardedHost,
    forwardedProto,
    host,
    url: request.url,
  });
  
  const effectiveHost = forwardedHost || host;
  const effectiveProto = forwardedProto || 'https';
  
  // Use header-derived URL if it's NOT localhost
  if (effectiveHost && !effectiveHost.includes('localhost')) {
    const baseUrl = `${effectiveProto}://${effectiveHost}`;
    console.log('[Payment] Using header-derived base URL:', baseUrl);
    return baseUrl;
  }
  
  // 3. FAIL instead of returning localhost
  // Reason: If DIMOCO receives localhost as url_return/url_callback, the user
  // gets redirected to localhost after payment, which breaks everything.
  console.error('[Payment] CRITICAL: Cannot determine public base URL!');
  console.error('[Payment] Set NEXT_PUBLIC_APP_URL in .env (e.g. https://marketplaceio.cloud)');
  console.error('[Payment] Or ensure Nginx sends X-Forwarded-Host header');
  throw new Error(
    'Cannot determine public base URL for payment. ' +
    'Set NEXT_PUBLIC_APP_URL in your .env file to your public domain.'
  );
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

    // NETWORK DETECTION — advisory logging only
    // Reason: Hardcoded IP ranges can never cover all carrier IPs (e.g. Vodafone DE
    // uses 109.40.0.0/13 which wasn't in our list, blocking real 5G users).
    // DIMOCO itself handles carrier detection — if user is on WiFi, DIMOCO will
    // fail the payment and we show a clear error. No need to pre-block here.
    const networkResult = detectNetworkType(ipAddress);
    console.log('[Payment] Network detection (advisory):', {
      ip: ipAddress,
      networkType: networkResult.networkType,
      isMobileNetwork: networkResult.isMobileNetwork,
      carrier: networkResult.carrier?.name,
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
      description: `Artikel ${article.title.substring(0, 40)}`,
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

    // ────────────────────────────────────────────────────
    // PRODUCTION: Direct browser redirect to DIMOCO userpayment endpoint
    // ────────────────────────────────────────────────────
    // Reason: When the user's browser hits DIMOCO's userpayment URL directly,
    // the mobile carrier injects MSISDN headers (header enrichment).
    // This enables automatic phone number detection — no manual entry needed.
    // Server-to-server POST (startPayment) cannot detect MSISDN because the
    // request originates from our server, not the user's device on mobile data.
    // ────────────────────────────────────────────────────
    if (!shouldUseMock) {
      console.log(`[Payment] Using DIRECT REDIRECT to DIMOCO ${config.useSandbox ? 'SANDBOX' : 'PRODUCTION'} userpayment endpoint`);
      console.log('[Payment] This allows carrier header enrichment for automatic MSISDN detection');

      try {
        const { url: directUrl, transactionId } = buildDirectPaymentUrl(paymentRequest);

        // Store pending transaction in database for callback processing
        try {
          const transactionsCollection = await getCollection(brandId, 'transactions');
          await transactionsCollection.insertOne({
            transactionId,
            articleId: article._id!.toString(),
            articleSlug: slug,
            amount: ARTICLE_PRICE_CENTS,
            currency: 'EUR',
            status: 'pending',
            createdAt: new Date(),
            metadata: paymentRequest.metadata,
            returnUrl: paymentRequest.returnUrl,
          });
          console.log('[Payment] Stored pending transaction:', transactionId);
        } catch (e) {
          console.error('[Payment] Failed to store transaction:', e);
        }

        console.log('[Payment] Redirecting browser directly to DIMOCO userpayment');
        
        // Use location.replace via an HTML page instead of 307 redirect.
        // Reason: A 307 redirect keeps this URL in browser history. If the user
        // presses "Back" from the DIMOCO page, the browser hits our /api/initiate
        // again, which re-redirects to DIMOCO — creating an infinite loop.
        // location.replace() removes the initiate URL from the history stack,
        // so "Back" takes the user back to the article page instead.
        const html = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<title>Redirecting to payment...</title>
</head><body>
<p>Redirecting to payment...</p>
<script>window.location.replace(${JSON.stringify(directUrl)});</script>
<noscript><meta http-equiv="refresh" content="0;url=${directUrl.replace(/"/g, '&quot;')}"></noscript>
</body></html>`;
        
        return new NextResponse(html, {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        });
      } catch (err) {
        console.error('[Payment] Failed to build direct redirect URL:', err);
        return NextResponse.json(
          { success: false, error: err instanceof Error ? err.message : 'Failed to build payment URL' },
          { status: 500 }
        );
      }
    }

    // ────────────────────────────────────────────────────
    // MOCK: Server-to-server flow (local development only)
    // ────────────────────────────────────────────────────
    console.log('[Payment] Using MOCK payment flow (no credentials configured)');
    const response = await initiatePaymentMock(paymentRequest);

    if (!response.success || (!response.paymentUrl && !response.redirectUrl)) {
      return NextResponse.json(
        { success: false, error: response.error || 'Failed to initiate payment' },
        { status: 500 }
      );
    }

    // Store pending transaction in database
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

    // Redirect to mock payment page
    let redirectUrl = response.redirectUrl || response.paymentUrl;
    if (redirectUrl) {
      redirectUrl = redirectUrl.replace(/&amp;/g, '&');
    }
    
    const fullRedirectUrl = redirectUrl?.startsWith('http') 
      ? redirectUrl 
      : new URL(redirectUrl!, baseUrl).toString();

    console.log('[Payment] Redirecting to mock:', fullRedirectUrl);
    return NextResponse.redirect(fullRedirectUrl);
  } catch (error) {
    console.error('Payment initiation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initiate payment' },
      { status: 500 }
    );
  }
}
