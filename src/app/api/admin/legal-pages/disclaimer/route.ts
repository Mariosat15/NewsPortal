import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth/admin';
import { getBrandId } from '@/lib/brand/server';
import { getLegalPageRepository } from '@/lib/db';

// GET /api/admin/legal-pages/disclaimer - Get risk disclaimer
export async function GET(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const brandId = await getBrandId();
    const repo = getLegalPageRepository(brandId);

    const disclaimer = await repo.getRiskDisclaimer();

    return NextResponse.json({
      success: true,
      data: disclaimer || {
        content: { de: '', en: '' },
        isActive: false,
      },
    });
  } catch (error) {
    console.error('Error fetching disclaimer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch disclaimer' },
      { status: 500 }
    );
  }
}

// POST /api/admin/legal-pages/disclaimer - Save risk disclaimer
export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content, isActive } = body;

    if (!content || typeof content.de !== 'string' || typeof content.en !== 'string') {
      return NextResponse.json(
        { error: 'Missing required fields: content.de, content.en' },
        { status: 400 }
      );
    }

    const brandId = await getBrandId();
    const repo = getLegalPageRepository(brandId);

    const disclaimer = await repo.saveRiskDisclaimer(content, isActive ?? true);

    return NextResponse.json({
      success: true,
      data: disclaimer,
    });
  } catch (error) {
    console.error('Error saving disclaimer:', error);
    return NextResponse.json(
      { error: 'Failed to save disclaimer' },
      { status: 500 }
    );
  }
}
