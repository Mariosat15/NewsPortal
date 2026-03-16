import { NextRequest, NextResponse } from 'next/server';
import { getBrandId } from '@/lib/brand/server';
import { verifyAdmin } from '@/lib/auth/admin';
import { getAdminActionRepository } from '@/lib/db/repositories/admin-action-repository';

/**
 * GET /api/admin/activity-log
 * Retrieves paginated admin activity log with optional filters.
 */
export async function GET(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const brandId = await getBrandId();
    const repo = getAdminActionRepository(brandId);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const resource = searchParams.get('resource') || undefined;
    const action = searchParams.get('action') || undefined;

    const result = await repo.list({ page, limit, resource, action });

    return NextResponse.json({
      success: true,
      data: result.actions,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    });
  } catch (error) {
    console.error('Activity log error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch activity log' },
      { status: 500 }
    );
  }
}
