import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCollection } from '@/lib/db/mongodb';
import { getArticleRepository } from '@/lib/db/repositories/article-repository';
import { getBrandId } from '@/lib/brand/server';
import { Unlock } from '@/lib/db/models/unlock';
import { ObjectId } from 'mongodb';

// Verify admin authentication
async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get('admin_token')?.value;
  const validToken = process.env.ADMIN_SECRET || 'admin-secret';
  return adminToken === validToken;
}

// GET - Get single transaction
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const brandId = await getBrandId();
    const collection = await getCollection<Unlock>(brandId, 'unlocks');
    const articleRepo = getArticleRepository(brandId);

    const unlock = await collection.findOne({ _id: new ObjectId(id) });

    if (!unlock) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Get article info
    let articleTitle, articleSlug;
    try {
      const article = await articleRepo.findById(unlock.articleId.toString());
      if (article) {
        articleTitle = article.title;
        articleSlug = article.slug;
      }
    } catch {
      // Article might be deleted
    }

    return NextResponse.json({
      success: true,
      data: {
        _id: unlock._id?.toString(),
        msisdn: unlock.msisdn,
        normalizedMsisdn: unlock.normalizedMsisdn,
        articleId: unlock.articleId.toString(),
        articleTitle,
        articleSlug,
        transactionId: unlock.transactionId,
        amount: unlock.amount,
        currency: unlock.currency,
        status: unlock.status,
        paymentProvider: unlock.paymentProvider,
        unlockedAt: unlock.unlockedAt,
        expiresAt: unlock.expiresAt,
        metadata: unlock.metadata,
      },
    });
  } catch (error) {
    console.error('Failed to fetch transaction:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction' },
      { status: 500 }
    );
  }
}

// POST - Perform action on transaction (refund, etc.)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { action } = await request.json();
    const brandId = await getBrandId();
    const collection = await getCollection<Unlock>(brandId, 'unlocks');
    const articleRepo = getArticleRepository(brandId);

    const unlock = await collection.findOne({ _id: new ObjectId(id) });

    if (!unlock) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (action === 'refund') {
      if (unlock.status !== 'completed') {
        return NextResponse.json(
          { error: 'Only completed transactions can be refunded' },
          { status: 400 }
        );
      }

      // Update status to refunded
      await collection.updateOne(
        { _id: new ObjectId(id) },
        { 
          $set: { 
            status: 'refunded',
            metadata: {
              ...unlock.metadata,
              refundedAt: new Date().toISOString(),
              refundedBy: 'admin',
            }
          } 
        }
      );

      // Decrement article unlock count
      try {
        const articlesCollection = await getCollection(brandId, 'articles');
        await articlesCollection.updateOne(
          { _id: unlock.articleId },
          { $inc: { unlockCount: -1 } }
        );
      } catch {
        console.error('Failed to decrement article unlock count');
      }

      // Get updated transaction
      const updated = await collection.findOne({ _id: new ObjectId(id) });
      
      // Get article info
      let articleTitle, articleSlug;
      try {
        const article = await articleRepo.findById(unlock.articleId.toString());
        if (article) {
          articleTitle = article.title;
          articleSlug = article.slug;
        }
      } catch {
        // Article might be deleted
      }

      return NextResponse.json({
        success: true,
        data: {
          _id: updated?._id?.toString(),
          msisdn: updated?.msisdn,
          normalizedMsisdn: updated?.normalizedMsisdn,
          articleId: updated?.articleId.toString(),
          articleTitle,
          articleSlug,
          transactionId: updated?.transactionId,
          amount: updated?.amount,
          currency: updated?.currency,
          status: updated?.status,
          paymentProvider: updated?.paymentProvider,
          unlockedAt: updated?.unlockedAt,
          expiresAt: updated?.expiresAt,
          metadata: updated?.metadata,
        },
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Failed to process transaction action:', error);
    return NextResponse.json(
      { error: 'Failed to process transaction action' },
      { status: 500 }
    );
  }
}
