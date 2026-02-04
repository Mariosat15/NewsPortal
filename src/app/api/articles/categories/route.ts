import { NextResponse } from 'next/server';
import { getArticleRepository } from '@/lib/db';
import { getBrandIdSync } from '@/lib/brand/server';

// GET /api/articles/categories - Get categories with article counts
export async function GET() {
  try {
    const brandId = getBrandIdSync();
    const repo = getArticleRepository(brandId);

    const categories = await repo.getCategories();

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
