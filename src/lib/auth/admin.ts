import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

/**
 * Verify admin authentication
 * Can be called with or without a request object
 */
export async function verifyAdmin(request?: NextRequest): Promise<boolean> {
  try {
    // Try to get token from cookies
    const cookieStore = await cookies();
    let adminToken = cookieStore.get('admin_token')?.value;

    // Also check request headers/cookies if provided
    if (!adminToken && request) {
      // Check cookie header
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const match = cookieHeader.match(/admin_token=([^;]+)/);
        if (match) {
          adminToken = match[1];
        }
      }
    }

    const validToken = process.env.ADMIN_SECRET || 'admin-secret';
    return adminToken === validToken;
  } catch (error) {
    console.error('Admin verification error:', error);
    return false;
  }
}

/**
 * Get admin token for API calls
 */
export async function getAdminToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get('admin_token')?.value || null;
  } catch (error) {
    return null;
  }
}
