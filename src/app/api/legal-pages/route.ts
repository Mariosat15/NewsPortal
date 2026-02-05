import { NextRequest, NextResponse } from 'next/server';
import { getBrandId } from '@/lib/brand/server';
import { getLegalPageRepository } from '@/lib/db';

// GET /api/legal-pages - Get footer links and disclaimer (public)
export async function GET(request: NextRequest) {
  try {
    const brandId = await getBrandId();
    const repo = getLegalPageRepository(brandId);

    const slug = request.nextUrl.searchParams.get('slug');
    
    // If slug is provided, return single page content
    if (slug) {
      const page = await repo.findBySlug(slug);
      if (!page || !page.isActive) {
        return NextResponse.json({ error: 'Page not found' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        data: page,
      });
    }

    // Otherwise return footer links and disclaimer
    const footerLinks = await repo.getFooterLinks();
    const disclaimer = await repo.getRiskDisclaimer();

    return NextResponse.json({
      success: true,
      data: {
        footerLinks,
        disclaimer: disclaimer?.isActive ? disclaimer : null,
      },
    });
  } catch (error) {
    console.error('Error fetching legal pages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch legal pages' },
      { status: 500 }
    );
  }
}
