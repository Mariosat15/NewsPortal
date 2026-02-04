/**
 * Client-side tracking script for landing pages
 * 
 * Usage:
 * import { initTracker, track } from '@/lib/tracking/tracker';
 * 
 * // Initialize on page load
 * initTracker({ landingPageSlug: 'campaign-summer-2024' });
 * 
 * // Track custom events
 * track('click_banner', { bannerId: 'hero-banner', targetUrl: '/promo' });
 */

export interface TrackerConfig {
  landingPageSlug?: string;
  landingPageId?: string;
  autoTrackPageViews?: boolean;
  autoTrackScrollDepth?: boolean;
  scrollDepthMilestones?: number[];
  identifyOnLoad?: boolean;
  debug?: boolean;
}

interface TrackerState {
  sessionId: string;
  initialized: boolean;
  config: TrackerConfig;
  scrollMilestonesReached: Set<number>;
}

const STORAGE_KEY = 'lp_session_id';
const DEFAULT_SCROLL_MILESTONES = [25, 50, 75, 90];

let state: TrackerState | null = null;

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `lp_${timestamp}_${randomPart}`;
}

/**
 * Get or create session ID from localStorage/cookie
 */
function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') {
    return generateSessionId();
  }

  // Try localStorage first
  let sessionId = localStorage.getItem(STORAGE_KEY);
  
  if (!sessionId) {
    // Try cookie
    const match = document.cookie.match(new RegExp(`${STORAGE_KEY}=([^;]+)`));
    sessionId = match ? match[1] : null;
  }

  if (!sessionId) {
    sessionId = generateSessionId();
    
    // Store in both localStorage and cookie
    try {
      localStorage.setItem(STORAGE_KEY, sessionId);
    } catch (e) {
      // localStorage might be blocked
    }
    
    // Set cookie with 30-day expiry
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${STORAGE_KEY}=${sessionId}; expires=${expires}; path=/; SameSite=Lax`;
  }

  return sessionId;
}

/**
 * Get UTM parameters from URL
 */
function getUtmParams(): Record<string, string> {
  if (typeof window === 'undefined') return {};

  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};

  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_adgroup', 'utm_creative'];
  
  for (const key of utmKeys) {
    const value = params.get(key);
    if (value) {
      utm[key.replace('utm_', '')] = value;
    }
  }

  return utm;
}

/**
 * Send request to tracking API
 */
async function sendToApi(endpoint: string, data: Record<string, unknown>, method: string = 'POST'): Promise<unknown> {
  try {
    const response = await fetch(`/api/tracking/${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    if (state?.config.debug) {
      console.error(`[Tracker] API error (${endpoint}):`, error);
    }
    throw error;
  }
}

/**
 * Initialize the tracker
 */
export async function initTracker(config: TrackerConfig = {}): Promise<string> {
  if (typeof window === 'undefined') {
    return '';
  }

  const sessionId = getOrCreateSessionId();
  const utmParams = getUtmParams();

  state = {
    sessionId,
    initialized: false,
    config: {
      autoTrackPageViews: true,
      autoTrackScrollDepth: true,
      scrollDepthMilestones: DEFAULT_SCROLL_MILESTONES,
      identifyOnLoad: true,
      debug: false,
      ...config,
    },
    scrollMilestonesReached: new Set(),
  };

  if (state.config.debug) {
    console.log('[Tracker] Initializing with session:', sessionId);
  }

  try {
    // Create/update session
    await sendToApi('session', {
      sessionId,
      landingPageId: config.landingPageId,
      landingPageSlug: config.landingPageSlug,
      referrer: document.referrer,
      utm: utmParams,
      pageUrl: window.location.href,
    });

    state.initialized = true;

    // Auto-track page view
    if (state.config.autoTrackPageViews) {
      await track('page_view', {
        pageUrl: window.location.href,
        pageTitle: document.title,
        landingPageSlug: config.landingPageSlug,
      });
    }

    // Trigger MSISDN identification
    if (state.config.identifyOnLoad) {
      await identify();
    }

    // Set up scroll tracking
    if (state.config.autoTrackScrollDepth) {
      setupScrollTracking();
    }

    // Track session start
    await track('session_start', {
      landingPageSlug: config.landingPageSlug,
    });

    if (state.config.debug) {
      console.log('[Tracker] Initialized successfully');
    }
  } catch (error) {
    if (state.config.debug) {
      console.error('[Tracker] Initialization error:', error);
    }
  }

  return sessionId;
}

/**
 * Track an event
 */
export async function track(
  type: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  if (!state) {
    console.warn('[Tracker] Not initialized. Call initTracker() first.');
    return;
  }

  try {
    await sendToApi('event', {
      sessionId: state.sessionId,
      type,
      metadata,
    });

    if (state.config.debug) {
      console.log(`[Tracker] Event tracked: ${type}`, metadata);
    }
  } catch (error) {
    if (state.config.debug) {
      console.error('[Tracker] Event tracking error:', error);
    }
  }
}

/**
 * Track multiple events at once
 */
export async function trackBatch(
  events: Array<{ type: string; metadata?: Record<string, unknown> }>
): Promise<void> {
  if (!state) {
    console.warn('[Tracker] Not initialized. Call initTracker() first.');
    return;
  }

  try {
    await sendToApi('event', {
      sessionId: state.sessionId,
      events,
    }, 'PUT');

    if (state.config.debug) {
      console.log(`[Tracker] Batch tracked: ${events.length} events`);
    }
  } catch (error) {
    if (state.config.debug) {
      console.error('[Tracker] Batch tracking error:', error);
    }
  }
}

/**
 * Trigger MSISDN identification
 */
export async function identify(): Promise<{
  detected: boolean;
  networkType: string;
}> {
  if (!state) {
    console.warn('[Tracker] Not initialized. Call initTracker() first.');
    return { detected: false, networkType: 'UNKNOWN' };
  }

  try {
    const result = await sendToApi('identify', {
      sessionId: state.sessionId,
    }) as {
      detected: boolean;
      networkType: string;
      confidence: string;
    };

    if (state.config.debug) {
      console.log('[Tracker] Identification result:', result);
    }

    return {
      detected: result.detected,
      networkType: result.networkType,
    };
  } catch (error) {
    if (state.config.debug) {
      console.error('[Tracker] Identification error:', error);
    }
    return { detected: false, networkType: 'UNKNOWN' };
  }
}

/**
 * Track banner click
 */
export function trackBannerClick(
  bannerId: string,
  targetUrl: string,
  position?: string
): void {
  track('click_banner', {
    bannerId,
    targetUrl,
    bannerPosition: position,
  });
}

/**
 * Track CTA click
 */
export function trackCtaClick(
  ctaId: string,
  targetUrl: string,
  ctaText?: string
): void {
  track('click_cta', {
    ctaId,
    targetUrl,
    elementText: ctaText,
  });
}

/**
 * Track link click
 */
export function trackLinkClick(
  targetUrl: string,
  elementId?: string,
  elementText?: string
): void {
  track('click_link', {
    targetUrl,
    elementId,
    elementText,
  });
}

/**
 * Track entering the main portal
 */
export function trackEnterPortal(targetUrl: string): void {
  track('enter_portal', {
    targetUrl,
  });
}

/**
 * Track article view
 */
export function trackArticleView(
  articleSlug: string,
  articleId?: string,
  articleTitle?: string
): void {
  track('article_view', {
    articleSlug,
    articleId,
    articleTitle,
  });
}

/**
 * Set up scroll depth tracking
 */
function setupScrollTracking(): void {
  if (typeof window === 'undefined' || !state) return;

  const milestones = state.config.scrollDepthMilestones || DEFAULT_SCROLL_MILESTONES;

  const handleScroll = () => {
    if (!state) return;

    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;

    for (const milestone of milestones) {
      if (scrollPercent >= milestone && !state.scrollMilestonesReached.has(milestone)) {
        state.scrollMilestonesReached.add(milestone);
        track('scroll_depth', {
          scrollPercent: milestone,
          actualPercent: scrollPercent,
        });
      }
    }
  };

  // Throttle scroll events
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        handleScroll();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

/**
 * Get current session ID
 */
export function getSessionId(): string | null {
  return state?.sessionId || null;
}

/**
 * Check if tracker is initialized
 */
export function isInitialized(): boolean {
  return state?.initialized || false;
}

/**
 * Get portal URL with tracking parameters
 */
export function getPortalUrl(baseUrl: string, additionalParams?: Record<string, string>): string {
  if (!state) return baseUrl;

  const url = new URL(baseUrl, window.location.origin);
  url.searchParams.set('sid', state.sessionId);
  
  if (state.config.landingPageSlug) {
    url.searchParams.set('lp', state.config.landingPageSlug);
  }

  // Add UTM params from current URL
  const utmParams = getUtmParams();
  for (const [key, value] of Object.entries(utmParams)) {
    url.searchParams.set(`utm_${key}`, value);
  }

  // Add any additional params
  if (additionalParams) {
    for (const [key, value] of Object.entries(additionalParams)) {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
}

/**
 * Navigate to portal with tracking
 */
export function navigateToPortal(targetUrl: string, options?: { 
  newTab?: boolean;
  additionalParams?: Record<string, string>;
}): void {
  const trackedUrl = getPortalUrl(targetUrl, options?.additionalParams);
  
  trackEnterPortal(targetUrl);

  if (options?.newTab) {
    window.open(trackedUrl, '_blank');
  } else {
    window.location.href = trackedUrl;
  }
}
