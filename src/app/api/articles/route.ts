import { NextRequest, NextResponse } from 'next/server';
import { getArticleRepository } from '@/lib/db';
import { getBrandIdSync } from '@/lib/brand/server';

// GET /api/articles - List published articles
export async function GET(request: NextRequest) {
  try {
    const brandId = getBrandIdSync();
    const repo = getArticleRepository(brandId);

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const category = searchParams.get('category') || undefined;
    const language = (searchParams.get('language') as 'de' | 'en') || undefined;
    const sortBy = (searchParams.get('sortBy') as 'publishDate' | 'viewCount' | 'unlockCount') || 'publishDate';
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';

    const result = await repo.listPublished({
      page,
      limit,
      category,
      language,
      sortBy,
      sortOrder,
    });

    // Remove full content from list response (only return teaser)
    const articlesWithTeaser = result.articles.map(article => ({
      ...article,
      content: undefined, // Don't expose full content in list
    }));

    return NextResponse.json({
      success: true,
      data: {
        articles: articlesWithTeaser,
        pagination: {
          page,
          limit,
          total: result.total,
          pages: result.pages,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}
