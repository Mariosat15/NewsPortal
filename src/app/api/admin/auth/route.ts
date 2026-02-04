import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getBrandIdSync } from '@/lib/brand/server';
import { getCollection } from '@/lib/db/mongodb';
import { seedDefaultSettings } from '@/lib/db/seed';

// POST /api/admin/auth - Admin login
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Get admin credentials from environment (these are ALWAYS the fallback)
    const envEmail = process.env.ADMIN_EMAIL || 'admin@newsportal.com';
    const envPassword = process.env.ADMIN_PASSWORD || 'admin123';

    // Check if admin settings have been changed in database
    let adminEmail = envEmail;
    let adminPassword = envPassword;
    
    try {
      const brandId = getBrandIdSync();
      
      // Seed default settings on first run (ensures DB is initialized)
      await seedDefaultSettings(brandId);
      
      const settingsCollection = await getCollection(brandId, 'settings');
      
      // Check for custom admin credentials in database
      const adminSetting = await settingsCollection.findOne({ key: 'admin' });
      if (adminSetting?.value && typeof adminSetting.value === 'object') {
        const adminSettings = adminSetting.value as { email?: string; password?: string };
        if (adminSettings.email && adminSettings.email.trim() !== '') {
          adminEmail = adminSettings.email;
        }
        // Only use database password if it was explicitly set (non-empty)
        if (adminSettings.password && adminSettings.password.trim() !== '') {
          adminPassword = adminSettings.password;
        }
      }
    } catch (e) {
      // If database check fails, use env credentials
      console.log('Using env credentials for admin auth (DB unavailable)');
    }

    // Debug: Log what credentials are being checked
    console.log('[Admin Auth] Checking credentials:');
    console.log('[Admin Auth] Expected email:', adminEmail);
    console.log('[Admin Auth] Expected password length:', adminPassword?.length || 0);
    console.log('[Admin Auth] Provided email:', email);
    console.log('[Admin Auth] Provided password length:', password?.length || 0);
    console.log('[Admin Auth] Email match:', email === adminEmail);
    console.log('[Admin Auth] Password match:', password === adminPassword);

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
