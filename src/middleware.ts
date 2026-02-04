import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getBrandIdFromDomain } from './lib/brand/config';
import { routing } from './i18n/routing';

// Create the next-intl middleware
const intlMiddleware = createMiddleware(routing);

// Paths that should skip locale handling
const publicPaths = [
  '/api',
  '/_next',
  '/images',
  '/fonts',
  '/favicon.ico',
  '/favicon.svg',
  '/robots.txt',
  '/sitemap.xml',
  '/admin',  // Admin panel doesn't need locale prefix
  '/lp',     // Landing pages don't need locale prefix
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || 'localhost:3000';

  console.log('[Middleware] Processing:', pathname);

  // Skip public paths - let them pass through without locale handling
  if (publicPaths.some(path => pathname.startsWith(path))) {
    console.log('[Middleware] Skipping locale for public path:', pathname);
    const brandId = getBrandIdFromDomain(hostname);
    const response = NextResponse.next();
    response.headers.set('x-brand-id', brandId);
    response.cookies.set('BRAND_ID', brandId, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
    });
    return response;
  }

  console.log('[Middleware] Applying locale middleware to:', pathname);

  // Get brand ID from domain
  const brandId = getBrandIdFromDomain(hostname);

  // Run the next-intl middleware for locale handling
  const response = intlMiddleware(request);
  
  // Add brand ID to the response
  response.headers.set('x-brand-id', brandId);
  response.cookies.set('BRAND_ID', brandId, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, api)
    '/((?!api|_next/static|_next/image|images|fonts|favicon.ico).*)',
  ],
};
