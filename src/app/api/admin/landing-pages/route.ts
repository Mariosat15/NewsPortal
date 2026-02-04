import { NextRequest, NextResponse } from 'next/server';
import { getLandingPageRepository } from '@/lib/db';
import { getBrandId } from '@/lib/brand/server';
import { verifyAdmin } from '@/lib/auth/admin';
import { LandingPageCreateInput, LandingPageStatus, LandingPageLayout } from '@/lib/db/models/landing-page';

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const brandId = await getBrandId();
    const repo = getLandingPageRepository(brandId);

    const status = request.nextUrl.searchParams.get('status') as LandingPageStatus | null;
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');

    const result = await repo.list({
      tenantId: brandId,
      status: status || undefined,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      pages: result.pages,
      total: result.total,
      page,
      limit,
    });
  } catch (error) {
    console.error('[Admin Landing Pages] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const brandId = await getBrandId();
    const repo = getLandingPageRepository(brandId);
    const body = await request.json();

    const { slug, name, layout, config, trackingDefaults, status } = body;

    if (!slug || !name || !layout) {
      return NextResponse.json(
        { error: 'slug, name, and layout are required' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existing = await repo.findBySlug(slug, brandId);
    if (existing) {
      return NextResponse.json(
        { error: 'A landing page with this slug already exists' },
        { status: 409 }
      );
    }

    const input: LandingPageCreateInput = {
      tenantId: brandId,
      slug,
      name,
      layout: layout as LandingPageLayout,
      config: config || {
        banners: [],
        categoryBlocks: [],
        ctaButtons: [],
      },
      trackingDefaults: trackingDefaults || {},
      status: status || 'draft',
    };

    const page = await repo.create(input);

    return NextResponse.json({
      success: true,
      page,
    });
  } catch (error) {
    console.error('[Admin Landing Pages] POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
