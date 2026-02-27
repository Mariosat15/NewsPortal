import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getBrandIdSync } from '@/lib/brand/server';
import { getCollection } from '@/lib/db/mongodb';
import { seedDefaultSettings } from '@/lib/db/seed';
import { verifyAdmin } from '@/lib/auth/admin';

// POST /api/admin/auth - Admin login
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // SECURITY: Admin credentials MUST be set in env vars. No hardcoded defaults.
    const envEmail = process.env.ADMIN_EMAIL;
    const envPassword = process.env.ADMIN_PASSWORD;
    const adminSecret = process.env.ADMIN_SECRET;

    if (!envEmail || !envPassword || !adminSecret) {
      console.error('[Admin Auth] ADMIN_EMAIL, ADMIN_PASSWORD, or ADMIN_SECRET env vars not set');
      return NextResponse.json(
        { success: false, error: 'Admin authentication is not configured' },
        { status: 503 }
      );
    }

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
      console.log('[Admin Auth] Using env credentials (DB unavailable)');
    }

    // Verify credentials (no debug logging of sensitive data)
    if (email !== adminEmail || password !== adminPassword) {
      console.log('[Admin Auth] Login failed for:', email);
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    console.log('[Admin Auth] Login successful for:', email);

    // Set cookie with the admin secret
    const response = NextResponse.json({ success: true });
    response.cookies.set('admin_token', adminSecret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[Admin Auth] Error:', error instanceof Error ? error.message : 'Unknown error');
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
  const isAuthenticated = await verifyAdmin();
  return NextResponse.json({
    authenticated: isAuthenticated,
  });
}
