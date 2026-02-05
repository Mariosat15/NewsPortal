import { NextRequest, NextResponse } from 'next/server';
import { verifyCallbackSignature, parseAmount, type PaymentCallbackData } from '@/lib/dimoco/client';
import { getBrandIdSync } from '@/lib/brand/server';
import { getUnlockRepository, getArticleRepository, getUserRepository, getBillingRepository, getCustomerRepository, getTrackingRepository } from '@/lib/db';
import { getCollection } from '@/lib/db/mongodb';
import { normalizeMSISDN } from '@/lib/utils';
import { normalizePhoneNumber } from '@/lib/utils/phone';

// POST /api/payment/dimoco/callback - DIMOCO payment callback (server-to-server)
// DIMOCO sends callbacks as: digest=xxx&data=<XML payload>
export async function POST(request: NextRequest) {
  try {
    // Get the raw text to determine format
    const contentType = request.headers.get('content-type') || '';
    let mappedBody: Record<string, string | null | undefined>;
    
    if (contentType.includes('application/json')) {
      // JSON format (from mock or other sources)
      const body = await request.json();
      console.log('[Payment Callback POST] Received JSON:', body);
      mappedBody = {
        transactionId: body.transactionId || body.tid,
        status: mapDimocoStatusCode(body.status),
        msisdn: body.msisdn,
        amount: body.amount,
        currency: body.currency || 'EUR',
        operator: body.operator,
        articleId: body.articleId,
        brandId: body.brandId,
        metadata: body.metadata,
        errorCode: body.errorCode,
        errorMessage: body.errorMessage,
      };
    } else {
      // URL-encoded form data (from real DIMOCO)
      // Format: digest=xxx&data=<URL-encoded XML>
      const text = await request.text();
      console.log('[Payment Callback POST] Received form data:', text.substring(0, 500));
      
      // Parse URL-encoded form data
      const params = new URLSearchParams(text);
      const digest = params.get('digest');
      const xmlData = params.get('data');
      
      console.log('[Payment Callback POST] Has digest:', !!digest);
      console.log('[Payment Callback POST] Has XML data:', !!xmlData);
      
      if (xmlData) {
        // Parse the XML data field
        mappedBody = parseXmlCallback(xmlData);
        mappedBody.digest = digest;
      } else {
        // Fallback: try direct field mapping (older format)
        const body: Record<string, string | null> = {};
        for (const [key, value] of params.entries()) {
          body[key] = value;
        }
        mappedBody = {
          transactionId: body.transaction || body.transactionId || body.tid || body.cp_transactionId,
          status: mapDimocoStatusCode(body.status),
          msisdn: body.msisdn || body.MSISDN,
          amount: body.amount,
          currency: body.currency || 'EUR',
          operator: body.operator,
          articleId: body.cp_articleId || body.articleId || body.custom1,
          brandId: body.cp_brandId || body.brandId || body.custom2,
          metadata: body.cp_metadata || body.metadata || body.custom3,
          errorCode: body.errorcode || body.code,
          errorMessage: body.errormessage || body.detail,
          requestId: body.request_id,
          digest: body.digest,
        };
      }
    }
    
    console.log('[Payment Callback POST] Mapped body:', {
      ...mappedBody,
      metadata: mappedBody.metadata ? 'present' : 'missing',
      digest: mappedBody.digest ? 'present' : 'missing',
    });
    
    return await processCallback(mappedBody);
  } catch (error) {
    console.error('Callback processing error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process callback' },
      { status: 500 }
    );
  }
}

/**
 * Parse DIMOCO XML callback data
 * Extracts: status, msisdn, amount, transaction ID, custom parameters, etc.
 */
function parseXmlCallback(xml: string): Record<string, string | null | undefined> {
  console.log('[Payment Callback] Parsing XML callback...');
  
  const result: Record<string, string | null | undefined> = {
    currency: 'EUR',
  };
  
  // Extract status code from <status>X</status> inside <action_result>
  const statusMatch = xml.match(/<action_result>[\s\S]*?<status>(\d+)<\/status>[\s\S]*?<\/action_result>/);
  if (statusMatch) {
    result.status = mapDimocoStatusCode(statusMatch[1]);
  }
  
  // Extract error code and message
  const codeMatch = xml.match(/<code>(\d+)<\/code>/);
  if (codeMatch) result.errorCode = codeMatch[1];
  
  const detailMatch = xml.match(/<detail>([^<]+)<\/detail>/);
  if (detailMatch) result.errorMessage = detailMatch[1];
  
  // Extract MSISDN from <customer><msisdn>xxx</msisdn></customer>
  const msisdnMatch = xml.match(/<customer>[\s\S]*?<msisdn>([^<]+)<\/msisdn>[\s\S]*?<\/customer>/);
  if (msisdnMatch) result.msisdn = msisdnMatch[1];
  
  // Extract operator
  const operatorMatch = xml.match(/<operator>([^<]+)<\/operator>/);
  if (operatorMatch) result.operator = operatorMatch[1];
  
  // Extract transaction ID from <transaction><id>xxx</id></transaction>
  const txnIdMatch = xml.match(/<transaction>[\s\S]*?<id>([^<]+)<\/id>[\s\S]*?<\/transaction>/);
  if (txnIdMatch) result.dimocoTransactionId = txnIdMatch[1];
  
  // Extract amount from transaction
  const amountMatch = xml.match(/<transaction>[\s\S]*?<amount>([^<]+)<\/amount>[\s\S]*?<\/transaction>/);
  if (amountMatch) result.amount = amountMatch[1];
  
  // Extract billed amount
  const billedMatch = xml.match(/<billed_amount>([^<]+)<\/billed_amount>/);
  if (billedMatch) result.billedAmount = billedMatch[1];
  
  // Extract currency
  const currencyMatch = xml.match(/<currency>([^<]+)<\/currency>/);
  if (currencyMatch) result.currency = currencyMatch[1];
  
  // Extract request_id
  const requestIdMatch = xml.match(/<request_id>([^<]+)<\/request_id>/);
  if (requestIdMatch) result.requestId = requestIdMatch[1];
  
  // Extract reference
  const referenceMatch = xml.match(/<reference>([^<]+)<\/reference>/);
  if (referenceMatch) result.reference = referenceMatch[1];
  
  // Extract custom parameters (our data)
  // Format: <custom_parameter><key>cp_xxx</key><value>yyy</value></custom_parameter>
  const customParamRegex = /<custom_parameter>\s*<key>([^<]+)<\/key>\s*<value>([^<]*)<\/value>\s*<\/custom_parameter>/g;
  let match;
  while ((match = customParamRegex.exec(xml)) !== null) {
    const key = match[1];
    const value = match[2];
    
    if (key === 'cp_articleId') result.articleId = value;
    else if (key === 'cp_brandId') result.brandId = value;
    else if (key === 'cp_transactionId') result.transactionId = value;
    else if (key === 'cp_metadata') result.metadata = value;
  }
  
  console.log('[Payment Callback] Parsed XML result:', {
    status: result.status,
    msisdn: result.msisdn ? result.msisdn.substring(0, 6) + '****' : undefined,
    transactionId: result.transactionId,
    articleId: result.articleId,
    errorCode: result.errorCode,
    errorMessage: result.errorMessage,
    amount: result.amount,
    billedAmount: result.billedAmount,
  });
  
  return result;
}

// Map DIMOCO status code to our status
// DIMOCO: 0 = success, other values = error
function mapDimocoStatusCode(status: string | null): 'success' | 'failed' | 'cancelled' {
  if (!status) return 'failed';
  
  // DIMOCO uses numeric status: 0 = success
  if (status === '0' || status === 'ok' || status === 'OK' || status === 'success' || status === 'billed') {
    return 'success';
  }
  if (status === 'cancelled' || status === 'canceled' || status === 'aborted') {
    return 'cancelled';
  }
  return 'failed';
}

// GET /api/payment/dimoco/callback - DIMOCO redirect callback (user browser)
// This is called when DIMOCO redirects the user back after payment
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  console.log('[Payment Callback GET] Received params:', Object.fromEntries(searchParams.entries()));

  // Get the final redirect URL (where to send user after setting cookie)
  const finalRedirect = searchParams.get('finalRedirect');
  
  // DIMOCO returns various parameters - map them to our format
  const amountCents = searchParams.get('amountCents');
  const amountEuros = searchParams.get('amount');
  
  // Get MSISDN from URL params (DIMOCO may or may not include it)
  let msisdn = searchParams.get('msisdn') || searchParams.get('MSISDN');
  let transactionId = searchParams.get('tid') || searchParams.get('transactionId');
  
  // Try to get transaction info from database (the POST callback already processed the payment)
  const brandId = getBrandIdSync();
  let transaction = null;
  
  // If we don't have MSISDN in URL, look it up from the processed transaction
  if (!msisdn || !transactionId) {
    try {
      const transactionsCollection = await getCollection(brandId, 'transactions');
      
      // Try to find recent completed transaction
      // Look for transaction by various identifiers that DIMOCO might send
      const reference = searchParams.get('sph-r') || searchParams.get('reference');
      
      if (reference) {
        // DIMOCO sends sph-r parameter which we can use to find the transaction
        transaction = await transactionsCollection.findOne({ 
          status: 'completed',
          createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) } // Last 10 minutes
        }, { sort: { createdAt: -1 } });
      }
      
      if (!transaction && transactionId) {
        transaction = await transactionsCollection.findOne({ transactionId });
      }
      
      // Get the most recent completed transaction if still not found
      if (!transaction) {
        transaction = await transactionsCollection.findOne({
          status: 'completed',
          createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // Last 5 minutes
        }, { sort: { createdAt: -1 } });
      }
      
      if (transaction) {
        console.log('[Payment Callback GET] Found transaction:', {
          transactionId: transaction.transactionId,
          msisdn: transaction.msisdn?.substring(0, 6) + '****',
          status: transaction.status,
        });
        
        msisdn = msisdn || transaction.msisdn;
        transactionId = transactionId || transaction.transactionId;
      }
    } catch (e) {
      console.error('[Payment Callback GET] Error fetching transaction:', e);
    }
  }

  const body = {
    transactionId,
    status: mapDimocoStatus(searchParams.get('status') || searchParams.get('result') || (transaction?.status === 'completed' ? 'success' : null)),
    msisdn,
    amountCents: amountCents ? parseInt(amountCents, 10) : (amountEuros ? parseAmount(amountEuros) : undefined),
    articleId: searchParams.get('custom1') || searchParams.get('articleId') || transaction?.articleId,
    brandId: searchParams.get('custom2') || transaction?.brandId,
    metadata: searchParams.get('custom3') || searchParams.get('metadata'),
    returnUrl: finalRedirect || searchParams.get('returnurl') || searchParams.get('returnUrl') || transaction?.returnUrl,
    operator: searchParams.get('operator'),
    errorCode: searchParams.get('errorcode'),
    errorMessage: searchParams.get('errormessage'),
  };

  console.log('[Payment Callback GET] Mapped body:', {
    ...body,
    msisdn: body.msisdn ? body.msisdn.substring(0, 6) + '****' : 'missing',
    metadata: body.metadata ? 'present' : 'missing',
  });

  // Determine redirect URL
  let redirectUrl = body.returnUrl || '/';
  
  // If we have a completed transaction, consider it successful (POST callback already processed)
  const isSuccess = body.status === 'success' || transaction?.status === 'completed';

  // Redirect user
  if (isSuccess) {
    const url = new URL(redirectUrl, request.url);
    url.searchParams.set('unlocked', 'true');
    url.searchParams.set('tid', body.transactionId || '');
    console.log('[Payment Callback] Success - redirecting to:', url.toString());
    
    const response = NextResponse.redirect(url);
    
    // IMPORTANT: Set MSISDN cookie so user can access the article
    if (body.msisdn) {
      response.cookies.set('user_msisdn', body.msisdn as string, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: '/',
      });
      console.log('[Payment Callback] Set MSISDN cookie:', (body.msisdn as string).substring(0, 4) + '****');
    }
    
    return response;
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
  // Handle amount - prefer amountCents (already in cents) over amount (needs parsing)
  let amountInCents: number | undefined;
  if (body.amountCents !== undefined) {
    amountInCents = typeof body.amountCents === 'number' ? body.amountCents : parseInt(body.amountCents as string, 10);
  } else if (body.amount) {
    amountInCents = parseAmount(body.amount as string);
  }
  
  console.log('[Payment Callback] Amount processing:', { 
    rawAmountCents: body.amountCents, 
    rawAmount: body.amount, 
    parsedCents: amountInCents 
  });
  
  const callbackData: PaymentCallbackData = {
    transactionId: (body.transactionId || body.tid) as string,
    status: body.status as 'success' | 'failed' | 'cancelled',
    msisdn: body.msisdn as string,
    amount: amountInCents,
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
        sessionId: deviceMetadata.sessionId, // For cross-browser verification
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

      // Update customer - convert to customer status and add billing
      // First ensure customer record exists (might have been created during MSISDN detection)
      await customerRepo.upsert({
        msisdn: callbackData.msisdn,
        normalizedMsisdn: e164Msisdn,
        tenantId: brandId,
        userId: userId,
        userEmail: userEmail,
      });
      
      // Convert to customer and add purchase amount
      await customerRepo.convertToCustomer(e164Msisdn, callbackData.amount || 99);
      
      // Also update user record if exists
      try {
        const userRepo = getUserRepository(brandId);
        await userRepo.convertToCustomer(e164Msisdn, callbackData.amount || 99);
      } catch (userUpdateError) {
        console.error('[Payment Callback] Error updating user:', userUpdateError);
      }

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
