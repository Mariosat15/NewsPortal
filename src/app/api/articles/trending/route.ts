import { NextRequest, NextResponse } from 'next/server';
import { getArticleRepository } from '@/lib/db';
import { getBrandIdSync } from '@/lib/brand/server';

// GET /api/articles/trending - Get trending articles
export async function GET(request: NextRequest) {
  try {
    const brandId = getBrandIdSync();
    const repo = getArticleRepository(brandId);

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const articles = await repo.getTrending(limit);

    // Remove full content from response
    const articlesWithTeaser = articles.map(article => ({
      ...article,
      content: undefined,
    }));

    return NextResponse.json({
      success: true,
      data: articlesWithTeaser,
    });
  } catch (error) {
    console.error('Error fetching trending articles:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trending articles' },
      { status: 500 }
    );
  }
}
