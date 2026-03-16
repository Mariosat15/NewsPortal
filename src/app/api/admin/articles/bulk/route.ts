import { NextRequest, NextResponse } from 'next/server';
import { getBrandIdSync } from '@/lib/brand/server';
import { getArticleRepository } from '@/lib/db';
import { verifyAdmin } from '@/lib/auth/admin';
import { ObjectId } from 'mongodb';
import { getCollection } from '@/lib/db/mongodb';

/**
 * POST /api/admin/articles/bulk
 * Bulk operations on articles: delete, status change, category change.
 *
 * Body:
 *   action: 'delete' | 'changeStatus' | 'changeCategory'
 *   ids: string[]   – article IDs to act on
 *   value?: string   – new status or category (required for changeStatus/changeCategory)
 */
export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const brandId = getBrandIdSync();
    const body = await request.json();

    const { action, ids, value } = body as {
      action: 'delete' | 'changeStatus' | 'changeCategory';
      ids: string[];
      value?: string;
    };

    if (!action || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'action and ids[] are required' },
        { status: 400 }
      );
    }

    if (ids.length > 200) {
      return NextResponse.json(
        { success: false, error: 'Maximum 200 articles per batch' },
        { status: 400 }
      );
    }

    const objectIds = ids.map(id => new ObjectId(id));
    const collection = await getCollection(brandId, 'articles');

    let modifiedCount = 0;

    switch (action) {
      case 'delete': {
        const result = await collection.deleteMany({ _id: { $in: objectIds } });
        modifiedCount = result.deletedCount;
        break;
      }

      case 'changeStatus': {
        const validStatuses = ['draft', 'scheduled', 'published', 'archived'];
        if (!value || !validStatuses.includes(value)) {
          return NextResponse.json(
            { success: false, error: `value must be one of: ${validStatuses.join(', ')}` },
            { status: 400 }
          );
        }
        const updateFields: Record<string, unknown> = {
          status: value,
          updatedAt: new Date(),
        };
        // If publishing, set publishDate to now if not already set
        if (value === 'published') {
          updateFields.publishDate = new Date();
        }
        const result = await collection.updateMany(
          { _id: { $in: objectIds } },
          { $set: updateFields }
        );
        modifiedCount = result.modifiedCount;
        break;
      }

      case 'changeCategory': {
        if (!value || value.trim() === '') {
          return NextResponse.json(
            { success: false, error: 'value (category) is required' },
            { status: 400 }
          );
        }
        const result = await collection.updateMany(
          { _id: { $in: objectIds } },
          { $set: { category: value.trim(), updatedAt: new Date() } }
        );
        modifiedCount = result.modifiedCount;
        break;
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      requested: ids.length,
      modified: modifiedCount,
    });
  } catch (error) {
    console.error('Bulk articles error:', error);
    return NextResponse.json(
      { success: false, error: 'Bulk operation failed' },
      { status: 500 }
    );
  }
}
