import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCollection } from '@/lib/db/mongodb';
import { getArticleRepository } from '@/lib/db/repositories/article-repository';
import { getBrandId } from '@/lib/brand/server';
import { Unlock } from '@/lib/db/models/unlock';

// GET - Get user's purchase history
export async function GET() {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get('user_session')?.value;
    
    if (!userCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const sessionData = JSON.parse(userCookie);
    const brandId = await getBrandId();
    
    // Get user's unlocks
    const unlocksCollection = await getCollection<Unlock>(brandId, 'unlocks');
    const articleRepo = getArticleRepository(brandId);

    // For now, we'll get unlocks by email since MSISDN-based unlocks 
    // might be from a different auth flow
    // In a real system, you'd link the user account to their MSISDN
    const unlocks = await unlocksCollection
      .find({ status: 'completed' })
      .sort({ unlockedAt: -1 })
      .limit(50)
      .toArray();

    // Enrich with article data
    const purchases = await Promise.all(
      unlocks.map(async (unlock) => {
        let article = null;
        try {
          article = await articleRepo.findById(unlock.articleId.toString());
        } catch {
          // Article might be deleted
        }

        return {
          id: unlock._id?.toString(),
          transactionId: unlock.transactionId,
          articleId: unlock.articleId.toString(),
          articleTitle: article?.title || 'Deleted Article',
          articleSlug: article?.slug,
          articleThumbnail: article?.thumbnail,
          amount: unlock.amount,
          currency: unlock.currency,
          purchasedAt: unlock.unlockedAt,
          status: unlock.status,
        };
      })
    );

    // Calculate totals
    const totalSpent = unlocks.reduce((sum, u) => sum + u.amount, 0);
    const totalPurchases = unlocks.length;

    return NextResponse.json({
      success: true,
      data: {
        purchases,
        summary: {
          totalPurchases,
          totalSpent,
          currency: 'EUR',
        },
      },
    });
  } catch (error) {
    console.error('Failed to fetch purchases:', error);
    return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 });
  }
}
