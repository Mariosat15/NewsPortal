import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getBrandIdSync } from '@/lib/brand/server';
import { getCollection } from '@/lib/db/mongodb';

// Verify admin authentication
async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get('admin_token')?.value;
  const validToken = process.env.ADMIN_SECRET || 'admin-secret';
  return adminToken === validToken;
}

// POST /api/admin/database/reset - Reset database (delete all data except settings)
export async function POST(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { confirmation } = body;

    // Require explicit confirmation
    if (confirmation !== 'RESET_DATABASE') {
      return NextResponse.json(
        { error: 'Invalid confirmation. Please type "RESET_DATABASE" to confirm.' },
        { status: 400 }
      );
    }

    const brandId = getBrandIdSync();
    const results = {
      deleted: [] as string[],
      errors: [] as string[],
      preserved: ['settings'] as string[],
    };

    // Collections to delete (everything except settings)
    const collectionsToDelete = [
      'users',
      'sessions',
      'transactions',
      'articles',
      'landing_pages',
      'tracking_sessions',
      'tracking_events',
      'customers',
      'purchases',
    ];

    for (const collectionName of collectionsToDelete) {
      try {
        const collection = await getCollection(brandId, collectionName);
        const result = await collection.deleteMany({});
        results.deleted.push(`${collectionName}: ${result.deletedCount} documents deleted`);
      } catch (error) {
        // Collection might not exist, which is fine
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        if (!errorMessage.includes('ns not found')) {
          results.errors.push(`${collectionName}: ${errorMessage}`);
        } else {
          results.deleted.push(`${collectionName}: collection empty or not found`);
        }
      }
    }

    console.log('[Database Reset] Completed:', results);

    return NextResponse.json({
      success: true,
      message: 'Database reset completed successfully',
      results,
    });
  } catch (error) {
    console.error('Database reset error:', error);
    return NextResponse.json(
      { error: 'Failed to reset database: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
