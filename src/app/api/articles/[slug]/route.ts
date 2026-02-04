import { NextRequest, NextResponse } from 'next/server';
import { getArticleRepository, getUnlockRepository } from '@/lib/db';
import { getBrandIdSync } from '@/lib/brand';
import { cookies } from 'next/headers';

// GET /api/articles/[slug] - Get a single article
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const brandId = getBrandIdSync();
    const articleRepo = getArticleRepository(brandId);
    const unlockRepo = getUnlockRepository(brandId);

    // Find article by slug
    const article = await articleRepo.findBySlug(slug);
    
    if (!article) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      );
    }

    // Check if article is published
    if (article.status !== 'published' || article.publishDate > new Date()) {
      return NextResponse.json(
        { success: false, error: 'Article not available' },
        { status: 404 }
      );
    }

    // Increment view count
    await articleRepo.incrementViewCount(article._id!);

    // Check if user has unlocked this article
    const cookieStore = await cookies();
    const msisdn = cookieStore.get('user_msisdn')?.value;
    const sessionId = cookieStore.get('news_session')?.value;
    
    let isUnlocked = false;
    
    // Check for special bypass parameter (for hidden identification page)
    const bypass = request.nextUrl.searchParams.get('bypass');
    if (bypass === process.env.DIMOCO_CALLBACK_SECRET) {
      isUnlocked = true;
    } else if (msisdn) {
      isUnlocked = await unlockRepo.hasUnlocked(msisdn, article._id!);
    }

    // Prepare response
    const response = {
      _id: article._id,
      slug: article.slug,
      title: article.title,
      teaser: article.teaser,
      thumbnail: article.thumbnail,
      category: article.category,
      tags: article.tags,
      publishDate: article.publishDate,
      language: article.language,
      viewCount: article.viewCount,
      isUnlocked,
      // Only include full content if unlocked
      content: isUnlocked ? article.content : undefined,
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error fetching article:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch article' },
      { status: 500 }
    );
  }
}
