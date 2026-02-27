import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

/**
 * Verify admin authentication
 * Can be called with or without a request object
 * 
 * SECURITY: Fails CLOSED — if ADMIN_SECRET env var is not set,
 * all admin access is denied. No hardcoded fallback.
 */
export async function verifyAdmin(request?: NextRequest): Promise<boolean> {
  try {
    const validToken = process.env.ADMIN_SECRET;

    // SECURITY: If ADMIN_SECRET is not configured, deny all access
    if (!validToken || validToken.trim() === '') {
      console.error('[Security] ADMIN_SECRET env var is not set — admin access denied');
      return false;
    }

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

      // Check Authorization: Bearer header (for programmatic API access)
      if (!adminToken) {
        const authHeader = request.headers.get('Authorization');
        if (authHeader?.startsWith('Bearer ')) {
          adminToken = authHeader.slice(7);
        }
      }
    }

    if (!adminToken) {
      return false;
    }

    // Constant-time comparison to prevent timing attacks
    if (adminToken.length !== validToken.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < adminToken.length; i++) {
      result |= adminToken.charCodeAt(i) ^ validToken.charCodeAt(i);
    }
    return result === 0;
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
