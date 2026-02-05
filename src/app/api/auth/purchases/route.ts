import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCollection } from '@/lib/db/mongodb';
import { getArticleRepository } from '@/lib/db/repositories/article-repository';
import { getBrandId } from '@/lib/brand/server';
import { Unlock } from '@/lib/db/models/unlock';
import { normalizeMsisdn } from '@/lib/utils/phone';

// GET - Get user's purchase history by MSISDN
export async function GET() {
  try {
    const cookieStore = await cookies();
    
    // Try to get MSISDN from cookie (primary DCB method)
    const msisdnCookie = cookieStore.get('user_msisdn')?.value;
    
    // Fallback: Check for legacy user session for backward compatibility
    const userCookie = cookieStore.get('user_session')?.value;
    let userId: string | null = null;
    let userEmail: string | null = null;
    
    if (userCookie) {
      try {
        const sessionData = JSON.parse(userCookie);
        userId = sessionData.id;
        userEmail = sessionData.email;
      } catch {
        // Invalid session data
      }
    }

    // Must have either MSISDN or legacy user session
    if (!msisdnCookie && !userId) {
      return NextResponse.json({ 
        success: true,
        data: {
          purchases: [],
          summary: {
            totalPurchases: 0,
            totalSpent: 0,
            currency: 'EUR',
          },
        },
      });
    }

    const brandId = await getBrandId();
    const unlocksCollection = await getCollection<Unlock>(brandId, 'unlocks');
    const articleRepo = getArticleRepository(brandId);

    // Build query to find unlocks by MSISDN or legacy user credentials
    const queryConditions: any[] = [];
    
    // Primary: Search by MSISDN (both original and normalized)
    if (msisdnCookie) {
      const normalizedMsisdn = normalizeMsisdn(msisdnCookie);
      queryConditions.push(
        { msisdn: msisdnCookie },
        { msisdn: normalizedMsisdn },
        { normalizedMsisdn: normalizedMsisdn },
        { 'metadata.msisdn': msisdnCookie },
        { 'metadata.normalizedMsisdn': normalizedMsisdn }
      );
    }
    
    // Fallback: Search by legacy user ID/email
    if (userId) {
      queryConditions.push(
        { 'metadata.userId': userId },
        { 'metadata.userEmail': userEmail }
      );
    }

    const unlocks = await unlocksCollection
      .find({ 
        status: 'completed',
        $or: queryConditions
      })
      .sort({ unlockedAt: -1 })
      .limit(100)
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
      purchases, // Direct array for easier access
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
