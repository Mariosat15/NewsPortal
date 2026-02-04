import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { initializeIndexes } from '@/lib/db/mongodb';
import { getBrandId } from '@/lib/brand/server';

// Verify admin authentication
async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get('admin_token')?.value;
  const validToken = process.env.ADMIN_SECRET || 'admin-secret';
  return adminToken === validToken;
}

// POST - Initialize database indexes
export async function POST() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const brandId = await getBrandId();
    const result = await initializeIndexes(brandId);

    return NextResponse.json({
      success: true,
      data: {
        message: 'Database indexes initialized',
        brandId,
        ...result,
      },
    });
  } catch (error) {
    console.error('Failed to initialize database indexes:', error);
    return NextResponse.json(
      { error: 'Failed to initialize database indexes' },
      { status: 500 }
    );
  }
}
