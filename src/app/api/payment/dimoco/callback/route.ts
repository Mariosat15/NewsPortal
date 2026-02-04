import { NextRequest, NextResponse } from 'next/server';
import { verifyCallbackSignature, parseAmount, type PaymentCallbackData } from '@/lib/dimoco/client';
import { getBrandIdSync } from '@/lib/brand/server';
import { getUnlockRepository, getArticleRepository, getUserRepository, getBillingRepository, getCustomerRepository, getTrackingRepository } from '@/lib/db';
import { normalizeMSISDN } from '@/lib/utils';
import { normalizePhoneNumber } from '@/lib/utils/phone';

// POST /api/payment/dimoco/callback - DIMOCO payment callback
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const callbackData: PaymentCallbackData = {
      transactionId: body.transactionId || body.transaction_id,
      status: body.status,
      msisdn: body.msisdn || body.phone,
      amount: body.amount ? parseAmount(body.amount) : undefined,
      currency: body.currency || 'EUR',
      timestamp: body.timestamp,
      signature: body.signature,
    };

    // Verify signature if provided
    if (callbackData.signature && !verifyCallbackSignature(callbackData, callbackData.signature)) {
      console.error('Invalid callback signature');
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Get articleId from the request metadata
    const articleId = body.articleId || body.metadata?.articleId;
    
    if (!articleId) {
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

    // Process based on status
    if (callbackData.status === 'success' && callbackData.msisdn) {
      const normalizedMsisdn = normalizeMSISDN(callbackData.msisdn);
      const e164Msisdn = normalizePhoneNumber(callbackData.msisdn);

      // Parse device metadata if provided
      let deviceMetadata: Record<string, unknown> = {};
      const metadataStr = body.metadata;
      console.log('[Payment Callback] Raw metadata string:', metadataStr ? `"${metadataStr.substring(0, 100)}..."` : 'null');
      
      if (metadataStr && metadataStr !== 'null' && metadataStr !== '') {
        try {
          // Try to decode - might be URL-encoded JSON
          let decoded = metadataStr;
          // If it looks URL-encoded, decode it
          if (decoded.includes('%')) {
            decoded = decodeURIComponent(decoded);
          }
          deviceMetadata = JSON.parse(decoded);
          console.log('[Payment Callback] Parsed device metadata:', deviceMetadata);
        } catch (e) {
          console.error('[Payment Callback] Failed to parse metadata:', e, 'Raw:', metadataStr);
          // Try parsing without decoding
          try {
            deviceMetadata = JSON.parse(metadataStr);
            console.log('[Payment Callback] Parsed without decoding:', deviceMetadata);
          } catch (e2) {
            console.error('[Payment Callback] Also failed without decoding:', e2);
          }
        }
      }

      // Get user ID and email from metadata if present (for logged-in users)
      const userId = deviceMetadata.userId as string | undefined;
      const userEmail = deviceMetadata.userEmail as string | undefined;

      // Create unlock record with device fingerprint data and user link
      const unlock = await unlockRepo.create({
        msisdn: callbackData.msisdn,
        articleId,
        transactionId: callbackData.transactionId,
        amount: callbackData.amount || 99,
        currency: callbackData.currency,
        status: 'completed',
        paymentProvider: 'dimoco',
        metadata: {
          // User account link (if logged in)
          userId: userId,
          userEmail: userEmail,
          // Device fingerprint data
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
          // Original payment data
          originalPayload: body,
        },
      });

      // If user is logged in, also link purchase to their account
      if (userId) {
        try {
          const { getCollection } = await import('@/lib/db/mongodb');
          const sessionsCollection = await getCollection(brandId, 'sessions');
          
          // Find user's session and add purchase
          await sessionsCollection.updateOne(
            { userId: userId },
            { 
              $addToSet: { 
                purchasedArticles: articleId 
              },
              $set: { 
                lastPurchaseAt: new Date() 
              }
            }
          );
          console.log(`[Payment Callback] Linked purchase to user ${userId}`);
        } catch (userLinkError) {
          console.error('[Payment Callback] Error linking to user account:', userLinkError);
        }
      }

      // Update article unlock count
      await articleRepo.incrementUnlockCount(articleId);

      // Create or update user record
      await userRepo.upsert({
        msisdn: callbackData.msisdn,
      });

      // Create billing event for unified history
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

        // Update customer billing total
        await customerRepo.upsert({
          msisdn: callbackData.msisdn,
          normalizedMsisdn: e164Msisdn,
          tenantId: brandId,
        });
        await customerRepo.addBillingAmount(e164Msisdn, callbackData.amount || 99);

        // Link MSISDN to any recent landing page sessions from same IP/device
        try {
          const trackingRepo = getTrackingRepository(brandId);
          const ip = deviceMetadata.ipAddress as string;
          
          if (ip && ip !== 'unknown') {
            // Find recent sessions from this IP without MSISDN (last 24 hours)
            const recentSessions = await trackingRepo.findRecentSessionsByIp(ip, 24);
            
            for (const session of recentSessions) {
              if (!session.msisdn) {
                // Update session with MSISDN from purchase
                await trackingRepo.updateSession(session.sessionId, {
                  msisdn: callbackData.msisdn,
                  normalizedMsisdn: e164Msisdn,
                  msisdnConfidence: 'CONFIRMED',
                  purchaseCompleted: true,
                });
                console.log(`[Payment Callback] Linked MSISDN ${e164Msisdn} to session ${session.sessionId}`);
              }
            }
          }
        } catch (trackingError) {
          console.error('[Payment Callback] Error linking MSISDN to sessions:', trackingError);
        }
      } catch (billingError) {
        console.error('Error creating billing event:', billingError);
        // Don't fail the payment callback if billing event creation fails
      }

      console.log('Payment successful:', {
        transactionId: callbackData.transactionId,
        msisdn: normalizedMsisdn,
        articleId,
      });

      return NextResponse.json({ success: true, unlockId: unlock._id });
    } else {
      // Payment failed or cancelled
      console.log('Payment not successful:', callbackData);
      
      return NextResponse.json({ 
        success: false, 
        status: callbackData.status,
        message: 'Payment not completed' 
      });
    }
  } catch (error) {
    console.error('Callback processing error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process callback' },
      { status: 500 }
    );
  }
}

// GET endpoint for redirect-based callbacks
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // Convert GET params to callback data (including metadata for device fingerprint)
  const body = {
    transactionId: searchParams.get('transactionId'),
    status: searchParams.get('status') || 'success',
    msisdn: searchParams.get('msisdn'),
    amount: searchParams.get('amount'),
    articleId: searchParams.get('articleId'),
    metadata: searchParams.get('metadata'), // Device fingerprint data
  };

  console.log('[Payment Callback GET] Received params:', {
    ...body,
    metadata: body.metadata ? 'present' : 'missing',
  });

  // Process as POST
  const response = await POST(new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  }));

  // If successful, redirect to article
  const data = await response.json();
  const returnUrl = searchParams.get('returnUrl') || '/';
  
  if (data.success) {
    const url = new URL(returnUrl, request.url);
    url.searchParams.set('unlocked', 'true');
    return NextResponse.redirect(url);
  }

  // On failure, redirect with error
  const url = new URL(returnUrl, request.url);
  url.searchParams.set('error', 'payment_failed');
  return NextResponse.redirect(url);
}
