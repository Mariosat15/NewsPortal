import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

/**
 * DIMOCO Identify Callback
 * 
 * DIMOCO redirects here after detecting the user's MSISDN.
 * The MSISDN is provided in query parameters.
 * 
 * We store it in cookies and redirect to the article/payment page.
 */
export async function GET(request: NextRequest) {
  // Build a safe base URL — NEVER use request.url (which is localhost behind Nginx)
  const safeBase = getPublicBaseUrl(request);

  try {
    const searchParams = request.nextUrl.searchParams;
    
    // DIMOCO returns MSISDN in various possible parameter names
    const msisdn = searchParams.get('msisdn') || 
                   searchParams.get('MSISDN') || 
                   searchParams.get('phone') ||
                   searchParams.get('phoneNumber');
    
    const operator = searchParams.get('operator') || searchParams.get('OPERATOR');
    const status = searchParams.get('status') || searchParams.get('STATUS');
    
    // Article info (if passed through)
    const articleId = searchParams.get('articleId');
    const slug = searchParams.get('slug');
    const returnUrl = searchParams.get('returnUrl');

    console.log('[MSISDN Callback] Received from DIMOCO:', {
      msisdn: msisdn ? `${msisdn.substring(0, 4)}****` : 'none',
      operator,
      status,
      articleId,
      slug,
      safeBase,
    });

    if (!msisdn) {
      console.error('[MSISDN Callback] No MSISDN received from DIMOCO');
      
      // Redirect to error page
      const errorUrl = returnUrl || (slug ? `/de/article/${slug}?error=msisdn_detection_failed` : '/');
      return NextResponse.redirect(new URL(errorUrl, safeBase));
    }

    // Store MSISDN in cookie
    const cookieStore = await cookies();
    cookieStore.set('user_msisdn', msisdn, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
    });

    // Also store operator if available
    if (operator) {
      cookieStore.set('user_operator', operator, {
        httpOnly: false, // Allow client-side access for display
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      });
    }

    console.log('[MSISDN Callback] MSISDN stored in cookie:', msisdn.substring(0, 4) + '****');

    // If article info provided, redirect to payment initiation
    if (articleId && slug) {
      const paymentUrl = new URL('/api/payment/dimoco/initiate', safeBase);
      paymentUrl.searchParams.set('articleId', articleId);
      paymentUrl.searchParams.set('slug', slug);
      if (returnUrl) {
        paymentUrl.searchParams.set('returnUrl', returnUrl);
      }
      
      console.log('[MSISDN Callback] Redirecting to payment:', paymentUrl.toString());
      return NextResponse.redirect(paymentUrl);
    }

    // Otherwise, redirect to return URL or article page
    const destination = returnUrl || (slug ? `/de/article/${slug}` : '/');
    return NextResponse.redirect(new URL(destination, safeBase));

  } catch (error) {
    console.error('[MSISDN Callback] Error:', error);
    return NextResponse.redirect(new URL('/?error=callback_failed', safeBase));
  }
}

/**
 * Get the public-facing base URL — NEVER returns localhost.
 * Priority: NEXT_PUBLIC_APP_URL > X-Forwarded-Host > Host header
 */
function getPublicBaseUrl(request: NextRequest): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl && !envUrl.includes('localhost')) {
    return envUrl.replace(/\/$/, '');
  }
  
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  if (forwardedHost && !forwardedHost.includes('localhost')) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  
  const host = request.headers.get('host');
  if (host && !host.includes('localhost')) {
    return `https://${host}`;
  }
  
  // Last resort — use request.url but log a warning
  console.error('[MSISDN Callback] WARNING: Could not determine public URL. Set NEXT_PUBLIC_APP_URL.');
  return new URL(request.url).origin;
}
