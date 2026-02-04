import { NextRequest, NextResponse } from 'next/server';
import { getBrandIdSync } from '@/lib/brand/server';
import { getUserRepository } from '@/lib/db';

// GET /api/admin/users - List users
export async function GET(request: NextRequest) {
  try {
    const brandId = getBrandIdSync();
    const repo = getUserRepository(brandId);

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search') || undefined;
    const minVisits = searchParams.get('minVisits') 
      ? parseInt(searchParams.get('minVisits')!, 10) 
      : undefined;
    const authProvider = searchParams.get('authProvider') as 'email' | 'msisdn' | undefined;

    const result = await repo.listUsers({ page, limit, search, minVisits, authProvider });

    return NextResponse.json({
      success: true,
      data: {
        users: result.users,
        pagination: {
          page,
          limit,
          total: result.total,
          pages: result.pages,
        },
      },
    });
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
