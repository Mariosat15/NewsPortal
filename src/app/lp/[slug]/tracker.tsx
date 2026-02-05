'use client';

import { useEffect, useState } from 'react';
import { initTracker } from '@/lib/tracking/tracker';

interface LandingPageTrackerProps {
  landingPageSlug: string;
  landingPageId?: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
    term?: string;
  };
}

export function LandingPageTracker({ landingPageSlug, landingPageId, utm }: LandingPageTrackerProps) {
  const [msisdnDetected, setMsisdnDetected] = useState(false);

  useEffect(() => {
    // Initialize tracker on mount
    initTracker({
      landingPageSlug,
      landingPageId,
      autoTrackPageViews: true,
      autoTrackScrollDepth: true,
      identifyOnLoad: true,
      debug: process.env.NODE_ENV === 'development',
    });

    // Store UTM in session storage for portal continuity
    if (utm) {
      try {
        sessionStorage.setItem('lp_utm', JSON.stringify(utm));
        sessionStorage.setItem('lp_slug', landingPageSlug);
      } catch (e) {
        // Session storage might be blocked
      }
    }

    // Trigger MSISDN detection on mobile networks
    detectMsisdn();
  }, [landingPageSlug, landingPageId, utm]);

  const detectMsisdn = async () => {
    // Check if already detected in this session
    try {
      const alreadyDetected = sessionStorage.getItem('msisdn_detected');
      if (alreadyDetected) {
        setMsisdnDetected(true);
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
        console.log('[MSISDN Tracker] Not on mobile network, skipping detection');
        return;
      }

      console.log('[MSISDN Tracker] On mobile network, initiating MSISDN detection...');

      // Get session ID from cookies or generate one
      const sessionId = getOrCreateSessionId();

      // Call MSISDN detection API
      const response = await fetch('/api/identify/msisdn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          landingPageSlug,
          landingPageId,
          returnUrl: window.location.href,
          utm,
          sessionId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.msisdn) {
          // MSISDN detected directly
          console.log('[MSISDN Tracker] MSISDN detected:', data.msisdn.substring(0, 6) + '****');
          setMsisdnDetected(true);
          try {
            sessionStorage.setItem('msisdn_detected', 'true');
          } catch (e) {}
        } else if (data.redirectUrl && data.requiresRedirect) {
          // Need to redirect for detection
          console.log('[MSISDN Tracker] Redirecting for MSISDN detection...');
          // Store current state before redirect
          try {
            sessionStorage.setItem('msisdn_redirect_pending', 'true');
          } catch (e) {}
          // Redirect to DIMOCO
          window.location.href = data.redirectUrl;
        }
      } else {
        console.log('[MSISDN Tracker] Detection failed:', data.error);
      }
    } catch (error) {
      console.error('[MSISDN Tracker] Error:', error);
    }
  };

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
    // Generate a new one if storage is blocked
    return 'sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  }
}
