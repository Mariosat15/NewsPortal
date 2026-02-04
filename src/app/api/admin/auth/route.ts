import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// POST /api/admin/auth - Admin login
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Get admin credentials from environment
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      return NextResponse.json(
        { success: false, error: 'Admin credentials not configured' },
        { status: 500 }
      );
    }

    // Verify credentials
    if (email !== adminEmail || password !== adminPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate admin token
    const adminToken = process.env.ADMIN_SECRET || 'admin-secret';

    // Set cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set('admin_token', adminToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Admin auth error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/auth - Admin logout
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('admin_token');
  return response;
}

// GET /api/admin/auth - Check auth status
export async function GET() {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get('admin_token')?.value;
  const validToken = process.env.ADMIN_SECRET || 'admin-secret';

  return NextResponse.json({
    authenticated: adminToken === validToken,
  });
}
