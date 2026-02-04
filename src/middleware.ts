import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getBrandIdFromDomain } from './lib/brand/config';

// Supported locales
const locales = ['de', 'en'];
const defaultLocale = 'de';

// Get locale from request
function getLocale(request: NextRequest): string {
  // Check for locale in cookie
  const localeCookie = request.cookies.get('NEXT_LOCALE');
  if (localeCookie && locales.includes(localeCookie.value)) {
    return localeCookie.value;
  }

  // Check Accept-Language header
  const acceptLanguage = request.headers.get('Accept-Language');
  if (acceptLanguage) {
    const preferredLocale = acceptLanguage
      .split(',')
      .map(lang => lang.split(';')[0].trim().split('-')[0])
      .find(lang => locales.includes(lang));
    if (preferredLocale) {
      return preferredLocale;
    }
  }

  return defaultLocale;
}

// Paths that should skip locale redirection
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
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || 'localhost:3000';

  // Skip public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Get brand ID from domain
  const brandId = getBrandIdFromDomain(hostname);

  // Check if pathname already has a locale
  const pathnameHasLocale = locales.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // If no locale in pathname, redirect to localized version
  if (!pathnameHasLocale) {
    const locale = getLocale(request);
    const newUrl = new URL(`/${locale}${pathname}`, request.url);
    
    // Preserve query parameters
    newUrl.search = request.nextUrl.search;

    const response = NextResponse.redirect(newUrl);
    
    // Set brand ID header for downstream use
    response.headers.set('x-brand-id', brandId);
    
    return response;
  }

  // Add brand ID header to response
  const response = NextResponse.next();
  response.headers.set('x-brand-id', brandId);
  
  // Also set as cookie for client-side access
  response.cookies.set('BRAND_ID', brandId, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });

  return response;
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, api)
    '/((?!api|_next/static|_next/image|images|fonts|favicon.ico).*)',
  ],
};
