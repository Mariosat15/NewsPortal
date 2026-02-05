import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth/admin';
import { getBrandId } from '@/lib/brand/server';
import { getLegalPageRepository } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/legal-pages/[id] - Get a single legal page
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const brandId = await getBrandId();
    const repo = getLegalPageRepository(brandId);

    // Try by ID first, then by slug
    let page = await repo.findById(id);
    if (!page) {
      page = await repo.findBySlug(id);
    }

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: page,
    });
  } catch (error) {
    console.error('Error fetching legal page:', error);
    return NextResponse.json(
      { error: 'Failed to fetch legal page' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/legal-pages/[id] - Update a legal page
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const brandId = await getBrandId();
    const repo = getLegalPageRepository(brandId);

    // Get existing page
    const existing = await repo.findById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Don't allow changing slug of system pages
    if (existing.isSystem && body.slug && body.slug !== existing.slug) {
      return NextResponse.json(
        { error: 'Cannot change slug of system pages' },
        { status: 400 }
      );
    }

    const page = await repo.update(id, {
      title: body.title,
      content: body.content,
      type: body.type,
      showInFooter: body.showInFooter,
      footerOrder: body.footerOrder,
      isActive: body.isActive,
    });

    return NextResponse.json({
      success: true,
      data: page,
    });
  } catch (error) {
    console.error('Error updating legal page:', error);
    return NextResponse.json(
      { error: 'Failed to update legal page' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/legal-pages/[id] - Delete a legal page
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const brandId = await getBrandId();
    const repo = getLegalPageRepository(brandId);

    // Check if page exists and is not a system page
    const page = await repo.findById(id);
    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    if (page.isSystem) {
      return NextResponse.json(
        { error: 'Cannot delete system pages' },
        { status: 400 }
      );
    }

    const deleted = await repo.delete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Failed to delete page' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Page deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting legal page:', error);
    return NextResponse.json(
      { error: 'Failed to delete legal page' },
      { status: 500 }
    );
  }
}
