import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUnlockRepository } from '@/lib/db/repositories/unlock-repository';
import { getArticleRepository } from '@/lib/db/repositories/article-repository';
import { getBrandId } from '@/lib/brand/server';
import { ObjectId } from 'mongodb';

// Verify admin authentication
async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get('admin_token')?.value;
  const validToken = process.env.ADMIN_SECRET || 'admin-secret';
  return adminToken === validToken;
}

// GET - List transactions with filtering and pagination
export async function GET(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const brandId = await getBrandId();
    const unlockRepo = getUnlockRepository(brandId);
    const articleRepo = getArticleRepository(brandId);
    
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const statusParam = searchParams.get('status');
    const provider = searchParams.get('provider');
    const search = searchParams.get('search');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build filter
    const options: Parameters<typeof unlockRepo.listAll>[0] = {
      page,
      limit,
    };

    if (statusParam && statusParam !== 'all') {
      options.status = statusParam as 'completed' | 'pending' | 'failed' | 'refunded';
    }

    if (dateFrom) {
      options.dateFrom = new Date(dateFrom);
    }

    if (dateTo) {
      options.dateTo = new Date(dateTo + 'T23:59:59');
    }

    if (search) {
      options.msisdn = search;
    }

    const result = await unlockRepo.listAll(options);

    // Enrich with article titles
    const articleIds = [...new Set(result.unlocks.map(u => u.articleId.toString()))];
    const articles = await Promise.all(
      articleIds.map(async (id) => {
        try {
          const article = await articleRepo.findById(id);
          return article ? { id, title: article.title, slug: article.slug } : null;
        } catch {
          return null;
        }
      })
    );
    const articleMap = new Map(articles.filter(Boolean).map(a => [a!.id, a]));

    // Filter by provider if needed (not in repository, do it here)
    let filteredUnlocks = result.unlocks;
    if (provider && provider !== 'all') {
      filteredUnlocks = filteredUnlocks.filter(u => u.paymentProvider === provider);
    }

    const transactions = filteredUnlocks.map(unlock => ({
      _id: unlock._id?.toString(),
      msisdn: unlock.msisdn,
      normalizedMsisdn: unlock.normalizedMsisdn,
      articleId: unlock.articleId.toString(),
      articleTitle: articleMap.get(unlock.articleId.toString())?.title,
      articleSlug: articleMap.get(unlock.articleId.toString())?.slug,
      transactionId: unlock.transactionId,
      amount: unlock.amount,
      currency: unlock.currency,
      status: unlock.status,
      paymentProvider: unlock.paymentProvider,
      unlockedAt: unlock.unlockedAt,
      expiresAt: unlock.expiresAt,
      metadata: unlock.metadata,
    }));

    return NextResponse.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page,
          limit,
          total: result.total,
          pages: result.pages,
        },
      },
    });
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
