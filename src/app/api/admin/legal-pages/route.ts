import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth/admin';
import { getBrandId } from '@/lib/brand/server';
import { getLegalPageRepository } from '@/lib/db';

// GET /api/admin/legal-pages - List all legal pages
export async function GET(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const brandId = await getBrandId();
    const repo = getLegalPageRepository(brandId);

    const footerOnly = request.nextUrl.searchParams.get('footerOnly') === 'true';
    const activeOnly = request.nextUrl.searchParams.get('activeOnly') === 'true';

    const pages = await repo.findAll({ footerOnly, activeOnly });

    return NextResponse.json({
      success: true,
      data: {
        pages,
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

// POST /api/admin/legal-pages - Create a new legal page
export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { slug, title, content, type, showInFooter, footerOrder, isActive } = body;

    if (!slug || !title || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: slug, title, content' },
        { status: 400 }
      );
    }

    const brandId = await getBrandId();
    const repo = getLegalPageRepository(brandId);

    // Check if slug already exists
    const existing = await repo.findBySlug(slug);
    if (existing) {
      return NextResponse.json(
        { error: 'A page with this slug already exists' },
        { status: 400 }
      );
    }

    const page = await repo.create({
      slug,
      title,
      content,
      type: type || 'legal',
      showInFooter: showInFooter ?? false,
      footerOrder: footerOrder ?? 99,
      isActive: isActive ?? true,
      isSystem: false,
    });

    return NextResponse.json({
      success: true,
      data: page,
    });
  } catch (error) {
    console.error('Error creating legal page:', error);
    return NextResponse.json(
      { error: 'Failed to create legal page' },
      { status: 500 }
    );
  }
}
