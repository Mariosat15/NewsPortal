import { NextRequest, NextResponse } from 'next/server';
import { verifyCallbackSignature, parseAmount, type PaymentCallbackData } from '@/lib/dimoco/client';
import { getBrandIdSync } from '@/lib/brand';
import { getUnlockRepository, getArticleRepository, getUserRepository, createUnlock } from '@/lib/db';
import { normalizeMSISDN } from '@/lib/utils';

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
          originalPayload: body,
        },
      });

      // Update article unlock count
      await articleRepo.incrementUnlockCount(articleId);

      // Create or update user record
      await userRepo.upsert({
        msisdn: callbackData.msisdn,
      });

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
  
  // Convert GET params to callback data
  const body = {
    transactionId: searchParams.get('transactionId'),
    status: searchParams.get('status') || 'success',
    msisdn: searchParams.get('msisdn'),
    amount: searchParams.get('amount'),
    articleId: searchParams.get('articleId'),
  };

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
