import { getCollection } from './mongodb';

/**
 * Ensures all critical MongoDB indexes exist for optimal query performance.
 * Call this once at startup or during deployment.
 * Reason: Indexes are idempotent (createIndex is a no-op if already exists),
 * so this is safe to call repeatedly.
 */
export async function ensureAllIndexes(brandId: string): Promise<void> {
  try {
    // ── Visitor Sessions ──
    const sessions = await getCollection(brandId, 'visitor_sessions');
    await Promise.all([
      sessions.createIndex({ sessionId: 1 }, { unique: true }),
      sessions.createIndex({ normalizedMsisdn: 1 }, { sparse: true }),
      sessions.createIndex({ lastSeenAt: -1 }),
      sessions.createIndex({ landingPageId: 1 }),
      sessions.createIndex({ ip: 1 }),
      // Compound indexes for analytics queries
      sessions.createIndex({ networkType: 1, lastSeenAt: -1 }),
      sessions.createIndex({ 'utm.source': 1, firstSeenAt: -1 }),
      sessions.createIndex({ 'utm.campaign': 1, firstSeenAt: -1 }),
      sessions.createIndex({ 'utm.medium': 1, firstSeenAt: -1 }),
      sessions.createIndex({ landingPageSlug: 1, firstSeenAt: -1 }),
      sessions.createIndex({ msisdn: 1 }, { sparse: true }),
    ]);

    // ── Tracking Events ──
    const events = await getCollection(brandId, 'tracking_events');
    await Promise.all([
      events.createIndex({ sessionId: 1, timestamp: -1 }),
      events.createIndex({ type: 1, timestamp: -1 }),
      events.createIndex({ normalizedMsisdn: 1, timestamp: -1 }, { sparse: true }),
      // Reason: The conversion funnel needs fast counts of paywall_shown, payment_started
      events.createIndex({ type: 1 }),
    ]);

    // ── Articles ──
    const articles = await getCollection(brandId, 'articles');
    await Promise.all([
      articles.createIndex({ slug: 1 }, { unique: true }),
      articles.createIndex({ category: 1, publishDate: -1 }),
      articles.createIndex({ status: 1, publishDate: -1 }),
      articles.createIndex({ language: 1, publishDate: -1 }),
      // Reason: Full-text search for article titles and content
      articles.createIndex({ title: 'text', teaser: 'text' }),
    ]);

    // ── Unlocks ──
    const unlocks = await getCollection(brandId, 'unlocks');
    await Promise.all([
      unlocks.createIndex({ msisdn: 1 }),
      unlocks.createIndex({ normalizedMsisdn: 1 }),
      unlocks.createIndex({ articleId: 1 }),
      unlocks.createIndex({ status: 1, unlockedAt: -1 }),
      unlocks.createIndex({ unlockedAt: -1 }),
    ]);

    // ── Customers ──
    const customers = await getCollection(brandId, 'customers');
    await Promise.all([
      customers.createIndex({ normalizedMsisdn: 1 }, { unique: true, sparse: true }),
      customers.createIndex({ msisdn: 1 }, { sparse: true }),
      customers.createIndex({ lastSeenAt: -1 }),
    ]);

    // ── Admin Actions (Activity Log) ──
    const adminActions = await getCollection(brandId, 'admin_actions');
    await Promise.all([
      adminActions.createIndex({ timestamp: -1 }),
      adminActions.createIndex({ resource: 1, timestamp: -1 }),
      adminActions.createIndex({ adminUser: 1, timestamp: -1 }),
    ]);

    // ── Landing Pages ──
    const landingPages = await getCollection(brandId, 'landing_pages');
    await Promise.all([
      landingPages.createIndex({ slug: 1 }, { unique: true }),
      landingPages.createIndex({ status: 1 }),
    ]);

    console.log('[DB] All indexes ensured for brand:', brandId);
  } catch (error) {
    console.error('[DB] Index creation error:', error);
  }
}
