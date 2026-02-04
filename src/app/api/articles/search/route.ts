import { NextRequest, NextResponse } from 'next/server';
import { getArticleRepository } from '@/lib/db';
import { getBrandIdSync } from '@/lib/brand';

// GET /api/articles/search - Search articles
export async function GET(request: NextRequest) {
  try {
    const brandId = getBrandIdSync();
    const repo = getArticleRepository(brandId);

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const language = (searchParams.get('language') as 'de' | 'en') || undefined;

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Search query is required' },
        { status: 400 }
      );
    }

    const result = await repo.search(query, { page, limit, language });

    // Remove full content from response
    const articlesWithTeaser = result.articles.map(article => ({
      ...article,
      content: undefined,
    }));

    return NextResponse.json({
      success: true,
      data: {
        articles: articlesWithTeaser,
        total: result.total,
        query,
      },
    });
  } catch (error) {
    console.error('Error searching articles:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search articles' },
      { status: 500 }
    );
  }
}
