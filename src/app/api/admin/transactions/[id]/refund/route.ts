import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { refundPayment } from '@/lib/dimoco/client';
import { getBrandIdSync } from '@/lib/brand/server';
import { getCollection } from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';

// Verify admin authentication
async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get('admin_token')?.value;
  const adminSecret = process.env.ADMIN_SECRET;
  
  if (!adminToken || !adminSecret) return false;
  return adminToken === adminSecret;
}

// POST /api/admin/transactions/[id]/refund - Process refund
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { reason } = body;

    const brandId = getBrandIdSync();
    
    // Find the unlock/transaction record
    const unlocksCollection = await getCollection(brandId, 'unlocks');
    const unlock = await unlocksCollection.findOne({ _id: new ObjectId(id) });

    if (!unlock) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (unlock.status === 'refunded') {
      return NextResponse.json({ error: 'Transaction already refunded' }, { status: 400 });
    }

    console.log('[Refund] Processing refund for transaction:', unlock.transactionId);

    // Call DIMOCO refund API
    const refundResult = await refundPayment({
      transactionId: unlock.transactionId,
      amount: unlock.amount,
      reason: reason || 'Admin refund',
    });

    if (!refundResult.success) {
      console.error('[Refund] DIMOCO refund failed:', refundResult.error);
      
      // For sandbox/testing, allow manual refund even if API fails
      console.log('[Refund] Proceeding with manual refund (API failed)');
    }

    // Update unlock status to refunded
    await unlocksCollection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status: 'refunded',
          refundedAt: new Date(),
          refundReason: reason,
          refundId: refundResult.refundId,
        } 
      }
    );

    // Update transaction record if exists
    const transactionsCollection = await getCollection(brandId, 'transactions');
    await transactionsCollection.updateOne(
      { transactionId: unlock.transactionId },
      { 
        $set: { 
          status: 'refunded',
          refundedAt: new Date(),
          refundReason: reason,
        } 
      }
    );

    // Update customer billing amount (subtract refund)
    try {
      const customersCollection = await getCollection(brandId, 'customers');
      const normalizedMsisdn = unlock.normalizedMsisdn || unlock.msisdn?.replace(/\D/g, '');
      
      if (normalizedMsisdn) {
        await customersCollection.updateOne(
          { _id: normalizedMsisdn },
          { 
            $inc: { 
              totalBillingAmount: -unlock.amount,
              totalPurchases: -1,
            },
            $set: { updatedAt: new Date() }
          }
        );
      }
    } catch (e) {
      console.error('[Refund] Error updating customer:', e);
    }

    console.log('[Refund] Refund processed successfully');

    return NextResponse.json({
      success: true,
      refundId: refundResult.refundId || `manual_${id}`,
      message: refundResult.success ? 'Refund processed via DIMOCO' : 'Refund marked (manual)',
    });
  } catch (error) {
    console.error('Refund error:', error);
    return NextResponse.json(
      { error: 'Failed to process refund' },
      { status: 500 }
    );
  }
}
