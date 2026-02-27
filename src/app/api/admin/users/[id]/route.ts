import { NextRequest, NextResponse } from 'next/server';
import { getBrandIdSync } from '@/lib/brand/server';
import { getUserRepository } from '@/lib/db';
import { verifyAdmin } from '@/lib/auth/admin';

// GET /api/admin/users/[id] - Get single user
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
    const brandId = getBrandIdSync();
    const repo = getUserRepository(brandId);

    const user = await repo.findById(id);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[id] - Update user
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
    const brandId = getBrandIdSync();
    const repo = getUserRepository(brandId);

    const body = await request.json();
    
    const updates: {
      name?: string;
      isActive?: boolean;
      emailVerified?: boolean;
    } = {};

    if (body.name !== undefined) updates.name = body.name;
    if (body.isActive !== undefined) updates.isActive = body.isActive;
    if (body.emailVerified !== undefined) updates.emailVerified = body.emailVerified;

    const user = await repo.updateById(id, updates);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// POST /api/admin/users/[id]/ban - Ban user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const brandId = getBrandIdSync();
    const repo = getUserRepository(brandId);

    const body = await request.json();
    const action = body.action;

    let user;
    if (action === 'ban') {
      user = await repo.banUser(id);
    } else if (action === 'unban') {
      user = await repo.unbanUser(id);
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use "ban" or "unban"' },
        { status: 400 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
      message: action === 'ban' ? 'User banned successfully' : 'User unbanned successfully',
    });
  } catch (error) {
    console.error('Ban/unban user error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user status' },
      { status: 500 }
    );
  }
}
