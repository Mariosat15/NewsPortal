import { NextRequest, NextResponse } from 'next/server';
import { getBrandIdSync } from '@/lib/brand/server';
import { getCollection } from '@/lib/db/mongodb';
import { verifyAdmin } from '@/lib/auth/admin';

// POST /api/admin/database/reset - Reset database (delete user data, preserve articles and settings)
export async function POST(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { confirmation, resetType } = body;

    // Determine reset type
    const isArticleReset = resetType === 'RESET_ARTICLES';
    const isDatabaseReset = confirmation === 'RESET_DATABASE';

    if (!isArticleReset && !isDatabaseReset) {
      return NextResponse.json(
        { error: 'Invalid confirmation. Please type "RESET_DATABASE" or use resetType: "RESET_ARTICLES".' },
        { status: 400 }
      );
    }

    const brandId = getBrandIdSync();
    const results = {
      deleted: [] as string[],
      errors: [] as string[],
      preserved: [] as string[],
    };

    if (isArticleReset) {
      // Reset ONLY articles
      try {
        const collection = await getCollection(brandId, 'articles');
        const result = await collection.deleteMany({});
        results.deleted.push(`articles: ${result.deletedCount} documents deleted`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        if (!errorMessage.includes('ns not found')) {
          results.errors.push(`articles: ${errorMessage}`);
        } else {
          results.deleted.push(`articles: collection empty or not found`);
        }
      }

      results.preserved = ['settings', 'users', 'customers', 'transactions', 'unlocks', 'billing_events'];

      console.log('[Articles Reset] Completed:', results);

      return NextResponse.json({
        success: true,
        message: 'Articles reset completed successfully',
        results,
      });
    }

    // Database reset - delete user/transaction data but PRESERVE articles
    results.preserved = ['settings', 'articles', 'categories'];

    // Collections to delete (user data, transactions, unlocks, etc.)
    const collectionsToDelete = [
      'users',
      'sessions',
      'transactions',
      'unlocks',          // Added
      'billing_events',   // Added
      'landing_pages',
      'tracking_sessions',
      'tracking_events',
      'customers',
      'purchases',
      'visitor_sessions',
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
      message: 'Database reset completed successfully (articles preserved)',
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
