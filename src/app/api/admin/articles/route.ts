import { NextRequest, NextResponse } from 'next/server';
import { getBrandIdSync } from '@/lib/brand/server';
import { getArticleRepository, ArticleCreateInput } from '@/lib/db';

// GET /api/admin/articles - List all articles (admin)
export async function GET(request: NextRequest) {
  try {
    const brandId = getBrandIdSync();
    const repo = getArticleRepository(brandId);

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const status = searchParams.get('status') as 'draft' | 'scheduled' | 'published' | 'archived' | undefined;

    const result = await repo.listAll({ page, limit, status });

    return NextResponse.json({
      success: true,
      data: {
        articles: result.articles,
        pagination: {
          page,
          limit,
          total: result.total,
          pages: result.pages,
        },
      },
    });
  } catch (error) {
    console.error('Admin articles error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}

// POST /api/admin/articles - Create a new article
export async function POST(request: NextRequest) {
  try {
    const brandId = getBrandIdSync();
    const repo = getArticleRepository(brandId);

    const body = await request.json();
    const articleInput: ArticleCreateInput = {
      title: body.title,
      teaser: body.teaser,
      content: body.content,
      thumbnail: body.thumbnail,
      category: body.category,
      tags: body.tags,
      status: body.status || 'draft',
      publishDate: body.publishDate ? new Date(body.publishDate) : undefined,
      language: body.language || 'de',
    };

    const article = await repo.create(articleInput);

    return NextResponse.json({
      success: true,
      data: article,
    });
  } catch (error) {
    console.error('Create article error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create article' },
      { status: 500 }
    );
  }
}
