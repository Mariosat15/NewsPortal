import { NextRequest, NextResponse } from 'next/server';
import { initiatePayment } from '@/lib/dimoco/client';
import { getBrandIdSync } from '@/lib/brand';
import { getArticleRepository } from '@/lib/db';

const ARTICLE_PRICE_CENTS = parseInt(process.env.ARTICLE_PRICE_CENTS || '99', 10);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const articleId = searchParams.get('articleId');
    const slug = searchParams.get('slug');
    const returnUrl = searchParams.get('returnUrl');

    if (!articleId || !slug) {
      return NextResponse.json(
        { success: false, error: 'Article ID and slug are required' },
        { status: 400 }
      );
    }

    const brandId = getBrandIdSync();
    const articleRepo = getArticleRepository(brandId);

    // Verify article exists
    const article = await articleRepo.findBySlug(slug);
    if (!article) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      );
    }

    // Initiate payment
    const response = await initiatePayment({
      articleId: article._id!.toString(),
      articleSlug: slug,
      amount: ARTICLE_PRICE_CENTS,
      currency: 'EUR',
      description: `Artikel: ${article.title.substring(0, 50)}...`,
      returnUrl: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/de/article/${slug}`,
      brandId,
    });

    if (!response.success || !response.paymentUrl) {
      return NextResponse.json(
        { success: false, error: response.error || 'Failed to initiate payment' },
        { status: 500 }
      );
    }

    // Redirect to payment page
    return NextResponse.redirect(new URL(response.paymentUrl, request.url));
  } catch (error) {
    console.error('Payment initiation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initiate payment' },
      { status: 500 }
    );
  }
}
