import { NextRequest, NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { getSessionRepository } from '@/lib/db/repositories/session-repository';
import { getBrandId } from '@/lib/brand/server';

// Get base URL from request headers (works with proxies/tunnels)
async function getBaseUrl(): Promise<string> {
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const proto = headersList.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;
    
    // Delete session from database if token exists
    if (sessionToken) {
      try {
        const brandId = await getBrandId();
        const sessionRepo = getSessionRepository(brandId);
        await sessionRepo.delete(sessionToken);
      } catch (e) {
        console.error('Failed to delete session from DB:', e);
      }
    }
    
    // Delete all session cookies
    cookieStore.delete('session_token');
    cookieStore.delete('user_session');

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;
    
    // Delete session from database if token exists
    if (sessionToken) {
      try {
        const brandId = await getBrandId();
        const sessionRepo = getSessionRepository(brandId);
        await sessionRepo.delete(sessionToken);
      } catch (e) {
        console.error('Failed to delete session from DB:', e);
      }
    }
    
    // Delete all session cookies
    cookieStore.delete('session_token');
    cookieStore.delete('user_session');

    // Redirect to home page (use dynamic base URL)
    const baseUrl = await getBaseUrl();
    return NextResponse.redirect(new URL('/', baseUrl));

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}
