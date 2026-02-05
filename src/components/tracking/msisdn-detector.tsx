'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';

interface MsisdnDetectorProps {
  /**
   * If true, detection happens automatically on mount
   * If false, you need to call detect manually
   */
  autoDetect?: boolean;
  /**
   * Callback when MSISDN is detected
   */
  onDetected?: (msisdn: string) => void;
  /**
   * Debug mode
   */
  debug?: boolean;
}

/**
 * Global MSISDN detector component
 * Add this to your main layout to detect MSISDNs across all pages
 * 
 * Works on:
 * - Landing pages (/lp/*)
 * - Main site pages (homepage, articles, etc.)
 */
export function MsisdnDetector({ 
  autoDetect = true, 
  onDetected,
  debug = false,
}: MsisdnDetectorProps) {
  const [detected, setDetected] = useState(false);
  const [msisdn, setMsisdn] = useState<string | null>(null);
  const pathname = usePathname();
  const sessionCreated = useRef(false);

  // Create/update session on mount - this tracks ALL visitors (WiFi and Mobile)
  useEffect(() => {
    if (!sessionCreated.current) {
      sessionCreated.current = true;
      createSession();
    }
  }, []);

  useEffect(() => {
    if (autoDetect && !detected) {
      detectMsisdn();
    }
  }, [autoDetect, detected]);

  // Track page views for identified users
  useEffect(() => {
    if (msisdn) {
      trackPageView();
    }
  }, [pathname, msisdn]);

  // Create or update visitor session
  const createSession = async () => {
    try {
      const sessionId = getOrCreateSessionId();
      const isLandingPage = pathname?.startsWith('/lp/');
      const landingPageSlug = isLandingPage ? pathname?.split('/')[2] : undefined;
      const utm = getUtmParams();

      await fetch('/api/tracking/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          landingPageSlug,
          referrer: typeof document !== 'undefined' ? document.referrer : undefined,
          utm,
          pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
        }),
      });

      if (debug) console.log('[MSISDN Detector] Session created/updated:', sessionId.substring(0, 15) + '...');
    } catch (error) {
      if (debug) console.error('[MSISDN Detector] Session creation error:', error);
    }
  };

  const detectMsisdn = async () => {
    // Check if already detected in this session
    try {
      const alreadyDetected = sessionStorage.getItem('msisdn_detected');
      if (alreadyDetected) {
        setDetected(true);
        const storedMsisdn = sessionStorage.getItem('detected_msisdn');
        if (storedMsisdn) {
          setMsisdn(storedMsisdn);
        }
        return;
      }
    } catch (e) {
      // Session storage might be blocked
    }

    try {
      // First check network type
      const networkResponse = await fetch('/api/network/detect');
      const networkData = await networkResponse.json();

      if (!networkData.isMobileNetwork) {
        if (debug) console.log('[MSISDN Detector] Not on mobile network, skipping');
        return;
      }

      if (debug) console.log('[MSISDN Detector] On mobile network, initiating detection...');

      // Get session ID
      const sessionId = getOrCreateSessionId();

      // Determine context (landing page or main site)
      const isLandingPage = pathname?.startsWith('/lp/');
      const landingPageSlug = isLandingPage ? pathname?.split('/')[2] : undefined;

      // Get UTM params from URL
      const utm = getUtmParams();

      // Call MSISDN detection API
      const response = await fetch('/api/identify/msisdn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          landingPageSlug,
          returnUrl: window.location.href,
          utm,
          sessionId,
          page: pathname,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.msisdn) {
          // MSISDN detected directly
          if (debug) console.log('[MSISDN Detector] Detected:', data.msisdn.substring(0, 6) + '****');
          setDetected(true);
          setMsisdn(data.msisdn);
          
          try {
            sessionStorage.setItem('msisdn_detected', 'true');
            sessionStorage.setItem('detected_msisdn', data.msisdn);
          } catch (e) {}
          
          onDetected?.(data.msisdn);
        } else if (data.redirectUrl && data.requiresRedirect) {
          // Need to redirect for detection - only do this once per session
          try {
            const redirected = sessionStorage.getItem('msisdn_redirect_attempted');
            if (!redirected) {
              if (debug) console.log('[MSISDN Detector] Redirecting for detection...');
              sessionStorage.setItem('msisdn_redirect_attempted', 'true');
              window.location.href = data.redirectUrl;
            }
          } catch (e) {
            // If session storage blocked, skip redirect to avoid loops
          }
        }
      } else {
        if (debug) console.log('[MSISDN Detector] Detection failed:', data.error);
      }
    } catch (error) {
      if (debug) console.error('[MSISDN Detector] Error:', error);
    }
  };

  const trackPageView = async () => {
    if (!msisdn) return;

    try {
      const sessionId = getOrCreateSessionId();
      const isLandingPage = pathname?.startsWith('/lp/');
      const landingPageSlug = isLandingPage ? pathname?.split('/')[2] : undefined;
      const utm = getUtmParams();

      await fetch('/api/tracking/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          msisdn,
          sessionId,
          page: pathname,
          landingPageSlug,
          utm,
        }),
      });
    } catch (error) {
      // Silent fail for tracking
    }
  };

  // Component doesn't render anything visible
  return null;
}

// Helper to get or create a session ID
function getOrCreateSessionId(): string {
  try {
    let sessionId = sessionStorage.getItem('tracker_session_id');
    if (!sessionId) {
      sessionId = 'sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      sessionStorage.setItem('tracker_session_id', sessionId);
    }
    return sessionId;
  } catch (e) {
    return 'sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  }
}

// Helper to extract UTM params from URL
function getUtmParams(): Record<string, string> | undefined {
  if (typeof window === 'undefined') return undefined;
  
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  for (const key of utmKeys) {
    const value = params.get(key);
    if (value) {
      utm[key.replace('utm_', '')] = value;
    }
  }
  
  return Object.keys(utm).length > 0 ? utm : undefined;
}

export default MsisdnDetector;
