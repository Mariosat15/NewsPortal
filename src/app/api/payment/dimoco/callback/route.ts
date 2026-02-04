import { NextRequest, NextResponse } from 'next/server';
import { verifyCallbackSignature, parseAmount, type PaymentCallbackData } from '@/lib/dimoco/client';
import { getBrandIdSync } from '@/lib/brand/server';
import { getUnlockRepository, getArticleRepository, getUserRepository, getBillingRepository, getCustomerRepository, getTrackingRepository } from '@/lib/db';
import { getCollection } from '@/lib/db/mongodb';
import { normalizeMSISDN } from '@/lib/utils';
import { normalizePhoneNumber } from '@/lib/utils/phone';

// POST /api/payment/dimoco/callback - DIMOCO payment callback (server-to-server)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[Payment Callback POST] Received:', body);
    
    return await processCallback(body);
  } catch (error) {
    console.error('Callback processing error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process callback' },
      { status: 500 }
    );
  }
}

// GET /api/payment/dimoco/callback - DIMOCO redirect callback (user browser)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  console.log('[Payment Callback GET] Received params:', Object.fromEntries(searchParams.entries()));

  // DIMOCO returns various parameters - map them to our format
  const body = {
    transactionId: searchParams.get('tid') || searchParams.get('transactionId'),
    status: mapDimocoStatus(searchParams.get('status') || searchParams.get('result')),
    msisdn: searchParams.get('msisdn') || searchParams.get('MSISDN'),
    amount: searchParams.get('amount'),
    articleId: searchParams.get('custom1') || searchParams.get('articleId'),
    brandId: searchParams.get('custom2'),
    metadata: searchParams.get('custom3') || searchParams.get('metadata'),
    returnUrl: searchParams.get('returnurl') || searchParams.get('returnUrl'),
    operator: searchParams.get('operator'),
    errorCode: searchParams.get('errorcode'),
    errorMessage: searchParams.get('errormessage'),
  };

  console.log('[Payment Callback GET] Mapped body:', {
    ...body,
    metadata: body.metadata ? 'present' : 'missing',
  });

  // Process the callback
  const result = await processCallback(body);
  const data = await result.json();

  // Determine redirect URL
  let redirectUrl = body.returnUrl || '/';
  
  // Try to get returnUrl from stored transaction
  if (!redirectUrl || redirectUrl === '/') {
    try {
      const brandId = getBrandIdSync();
      const transactionsCollection = await getCollection(brandId, 'transactions');
      const transaction = await transactionsCollection.findOne({ transactionId: body.transactionId });
      if (transaction?.returnUrl) {
        redirectUrl = transaction.returnUrl;
      }
    } catch (e) {
      console.error('[Payment Callback] Error fetching transaction:', e);
    }
  }

  // Redirect user
  if (data.success) {
    const url = new URL(redirectUrl, request.url);
    url.searchParams.set('unlocked', 'true');
    url.searchParams.set('tid', body.transactionId || '');
    console.log('[Payment Callback] Success - redirecting to:', url.toString());
    return NextResponse.redirect(url);
  }

  // Payment failed
  const url = new URL(redirectUrl, request.url);
  url.searchParams.set('error', 'payment_failed');
  url.searchParams.set('message', body.errorMessage || 'Payment was not completed');
  console.log('[Payment Callback] Failed - redirecting to:', url.toString());
  return NextResponse.redirect(url);
}

// Map DIMOCO status to our format
function mapDimocoStatus(status: string | null): 'success' | 'failed' | 'cancelled' {
  if (!status) return 'failed';
  
  const s = status.toLowerCase();
  if (s === 'ok' || s === 'success' || s === 'completed' || s === 'billed') {
    return 'success';
  }
  if (s === 'cancelled' || s === 'canceled' || s === 'aborted') {
    return 'cancelled';
  }
  return 'failed';
}

// Process callback data
async function processCallback(body: Record<string, unknown>) {
  const callbackData: PaymentCallbackData = {
    transactionId: (body.transactionId || body.tid) as string,
    status: body.status as 'success' | 'failed' | 'cancelled',
    msisdn: body.msisdn as string,
    amount: body.amount ? parseAmount(body.amount as string) : undefined,
    currency: (body.currency as string) || 'EUR',
    timestamp: body.timestamp as string,
    signature: body.signature as string,
  };

  // Verify signature if provided (production security)
  if (callbackData.signature && !verifyCallbackSignature(callbackData, callbackData.signature)) {
    console.error('Invalid callback signature');
    return NextResponse.json(
      { success: false, error: 'Invalid signature' },
      { status: 401 }
    );
  }

  // Get articleId - from body directly or from custom1
  const articleId = (body.articleId || body.custom1) as string;
  
  if (!articleId || articleId === 'null' || articleId === 'undefined') {
    console.error('Article ID missing from callback');
    return NextResponse.json(
      { success: false, error: 'Article ID missing' },
      { status: 400 }
    );
  }

  const brandId = getBrandIdSync();
  const unlockRepo = getUnlockRepository(brandId);
  const articleRepo = getArticleRepository(brandId);
  const userRepo = getUserRepository(brandId);

  // Check if transaction already processed
  const existingUnlock = await unlockRepo.findByTransactionId(callbackData.transactionId);
  if (existingUnlock) {
    console.log('Transaction already processed:', callbackData.transactionId);
    return NextResponse.json({ success: true, message: 'Already processed' });
  }

  // Update transaction status in database
  try {
    const transactionsCollection = await getCollection(brandId, 'transactions');
    await transactionsCollection.updateOne(
      { transactionId: callbackData.transactionId },
      { 
        $set: { 
          status: callbackData.status === 'success' ? 'completed' : callbackData.status,
          msisdn: callbackData.msisdn,
          processedAt: new Date(),
        } 
      }
    );
  } catch (e) {
    console.error('[Payment Callback] Error updating transaction:', e);
  }

  // Process based on status
  if (callbackData.status === 'success' && callbackData.msisdn) {
    const normalizedMsisdn = normalizeMSISDN(callbackData.msisdn);
    const e164Msisdn = normalizePhoneNumber(callbackData.msisdn);

    // Parse device metadata if provided
    let deviceMetadata: Record<string, unknown> = {};
    const metadataStr = (body.metadata || body.custom3) as string;
    
    if (metadataStr && metadataStr !== 'null' && metadataStr !== '') {
      try {
        let decoded = metadataStr;
        if (decoded.includes('%')) {
          decoded = decodeURIComponent(decoded);
        }
        deviceMetadata = JSON.parse(decoded);
        console.log('[Payment Callback] Parsed device metadata:', deviceMetadata);
      } catch (e) {
        console.error('[Payment Callback] Failed to parse metadata:', e);
        try {
          deviceMetadata = JSON.parse(metadataStr);
        } catch (e2) {
          console.error('[Payment Callback] Also failed without decoding:', e2);
        }
      }
    }

    // Get user ID and email from metadata
    const userId = deviceMetadata.userId as string | undefined;
    const userEmail = deviceMetadata.userEmail as string | undefined;

    // Create unlock record
    const unlock = await unlockRepo.create({
      msisdn: callbackData.msisdn,
      articleId,
      transactionId: callbackData.transactionId,
      amount: callbackData.amount || 99,
      currency: callbackData.currency,
      status: 'completed',
      paymentProvider: 'dimoco',
      metadata: {
        userId,
        userEmail,
        operator: body.operator,
        browser: deviceMetadata.browser,
        browserVersion: deviceMetadata.browserVersion,
        os: deviceMetadata.os,
        osVersion: deviceMetadata.osVersion,
        screenResolution: deviceMetadata.screen,
        timezone: deviceMetadata.tz,
        language: deviceMetadata.lang,
        ipAddress: deviceMetadata.ipAddress,
        userAgent: deviceMetadata.userAgent,
        gpu: deviceMetadata.gpu,
        deviceFingerprint: deviceMetadata.fp,
        originalPayload: body,
      },
    });

    // If user is logged in, link purchase to their account
    if (userId) {
      try {
        const sessionsCollection = await getCollection(brandId, 'sessions');
        await sessionsCollection.updateOne(
          { userId: userId },
          { 
            $addToSet: { purchasedArticles: articleId },
            $set: { lastPurchaseAt: new Date() }
          }
        );
        console.log(`[Payment Callback] Linked purchase to user ${userId}`);
      } catch (userLinkError) {
        console.error('[Payment Callback] Error linking to user account:', userLinkError);
      }
    }

    // Update article unlock count
    await articleRepo.incrementUnlockCount(articleId);

    // Create or update user record (MSISDN-based)
    await userRepo.upsert({
      msisdn: callbackData.msisdn,
    });

    // Create billing event and customer record
    try {
      const billingRepo = getBillingRepository(brandId);
      const customerRepo = getCustomerRepository(brandId);
      const article = await articleRepo.findById(articleId);

      await billingRepo.createBillingEvent({
        billingEventId: `dimoco_${callbackData.transactionId}`,
        msisdn: callbackData.msisdn,
        normalizedMsisdn: e164Msisdn,
        tenantId: brandId,
        source: 'PORTAL_PURCHASE',
        amount: callbackData.amount || 99,
        currency: callbackData.currency,
        productCode: 'article_unlock',
        serviceName: 'Article Purchase',
        description: article ? `Purchased: ${article.title}` : 'Article unlock',
        eventTime: new Date(),
        status: 'billed',
        transactionId: callbackData.transactionId,
        articleId,
        articleSlug: article?.slug,
        rawRowJson: body,
      });

      // Update customer with user link
      await customerRepo.upsert({
        msisdn: callbackData.msisdn,
        normalizedMsisdn: e164Msisdn,
        tenantId: brandId,
        userId: userId,
        userEmail: userEmail,
      });
      await customerRepo.addBillingAmount(e164Msisdn, callbackData.amount || 99, {
        userId: userId,
        userEmail: userEmail,
      });

      // Link MSISDN to any recent tracking sessions
      try {
        const trackingRepo = getTrackingRepository(brandId);
        const ip = deviceMetadata.ipAddress as string;
        
        if (ip && ip !== 'unknown') {
          const recentSessions = await trackingRepo.findRecentSessionsByIp(ip, 24);
          for (const session of recentSessions) {
            if (!session.msisdn) {
              await trackingRepo.updateSession(session.sessionId, {
                msisdn: callbackData.msisdn,
                normalizedMsisdn: e164Msisdn,
                msisdnConfidence: 'CONFIRMED',
                purchaseCompleted: true,
              });
              console.log(`[Payment Callback] Linked MSISDN to session ${session.sessionId}`);
            }
          }
        }
      } catch (trackingError) {
        console.error('[Payment Callback] Error linking MSISDN to sessions:', trackingError);
      }
    } catch (billingError) {
      console.error('Error creating billing event:', billingError);
    }

    console.log('Payment successful:', {
      transactionId: callbackData.transactionId,
      msisdn: normalizedMsisdn,
      articleId,
      operator: body.operator,
    });

    return NextResponse.json({ success: true, unlockId: unlock._id });
  } else {
    // Payment failed or cancelled
    console.log('Payment not successful:', {
      status: callbackData.status,
      errorCode: body.errorCode,
      errorMessage: body.errorMessage,
    });
    
    return NextResponse.json({ 
      success: false, 
      status: callbackData.status,
      message: (body.errorMessage as string) || 'Payment not completed' 
    });
  }
}
