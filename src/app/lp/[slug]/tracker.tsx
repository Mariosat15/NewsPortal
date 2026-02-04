'use client';

import { useEffect } from 'react';
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
  }, [landingPageSlug, landingPageId, utm]);

  return null;
}
