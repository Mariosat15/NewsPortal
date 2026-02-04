import { NextRequest, NextResponse } from 'next/server';
import { getBrandIdSync } from '@/lib/brand';
import { getArticleRepository, ArticleUpdateInput } from '@/lib/db';

// GET /api/admin/articles/[id] - Get single article
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const brandId = getBrandIdSync();
    const repo = getArticleRepository(brandId);

    const article = await repo.findById(id);

    if (!article) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: article,
    });
  } catch (error) {
    console.error('Get article error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch article' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/articles/[id] - Update article
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const brandId = getBrandIdSync();
    const repo = getArticleRepository(brandId);

    const body = await request.json();
    const updateInput: ArticleUpdateInput = {
      title: body.title,
      teaser: body.teaser,
      content: body.content,
      thumbnail: body.thumbnail,
      category: body.category,
      tags: body.tags,
      status: body.status,
      publishDate: body.publishDate ? new Date(body.publishDate) : undefined,
    };

    const article = await repo.update(id, updateInput);

    if (!article) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: article,
    });
  } catch (error) {
    console.error('Update article error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update article' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/articles/[id] - Delete article
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const brandId = getBrandIdSync();
    const repo = getArticleRepository(brandId);

    const deleted = await repo.delete(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Article deleted',
    });
  } catch (error) {
    console.error('Delete article error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete article' },
      { status: 500 }
    );
  }
}
