import { NextRequest, NextResponse } from 'next/server';
import { getLandingPageRepository } from '@/lib/db';
import { getBrandId } from '@/lib/brand/server';
import { verifyAdmin } from '@/lib/auth/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const brandId = await getBrandId();
    const repo = getLandingPageRepository(brandId);

    const page = await repo.findById(id);

    if (!page) {
      return NextResponse.json({ error: 'Landing page not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      page,
    });
  } catch (error) {
    console.error('[Admin Landing Pages] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const brandId = await getBrandId();
    const repo = getLandingPageRepository(brandId);
    const body = await request.json();

    const existing = await repo.findById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Landing page not found' }, { status: 404 });
    }

    const { slug, name, layout, config, trackingDefaults, status } = body;

    // If changing slug, check it doesn't conflict
    if (slug && slug !== existing.slug) {
      const conflict = await repo.findBySlug(slug, brandId);
      if (conflict && conflict._id?.toString() !== id) {
        return NextResponse.json(
          { error: 'A landing page with this slug already exists' },
          { status: 409 }
        );
      }
    }

    const updated = await repo.update(id, {
      slug,
      name,
      layout,
      config,
      trackingDefaults,
      status,
    });

    return NextResponse.json({
      success: true,
      page: updated,
    });
  } catch (error) {
    console.error('[Admin Landing Pages] PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const brandId = await getBrandId();
    const repo = getLandingPageRepository(brandId);

    const deleted = await repo.delete(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Landing page not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Landing page deleted',
    });
  } catch (error) {
    console.error('[Admin Landing Pages] DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Publish/Unpublish actions
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const brandId = await getBrandId();
    const repo = getLandingPageRepository(brandId);
    const body = await request.json();

    const { action } = body;

    let updated;
    if (action === 'publish') {
      updated = await repo.publish(id);
    } else if (action === 'unpublish') {
      updated = await repo.unpublish(id);
    } else if (action === 'duplicate') {
      const { newSlug, newName } = body;
      if (!newSlug || !newName) {
        return NextResponse.json(
          { error: 'newSlug and newName are required for duplication' },
          { status: 400 }
        );
      }
      updated = await repo.duplicate(id, newSlug, newName);
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use: publish, unpublish, or duplicate' },
        { status: 400 }
      );
    }

    if (!updated) {
      return NextResponse.json({ error: 'Landing page not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      page: updated,
    });
  } catch (error) {
    console.error('[Admin Landing Pages] PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
