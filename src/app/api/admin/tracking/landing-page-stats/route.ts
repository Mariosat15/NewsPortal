import { NextResponse } from 'next/server';
import { getBrandId } from '@/lib/brand/server';
import { getCollection } from '@/lib/db/mongodb';
import { verifyAdmin } from '@/lib/auth/admin';

// GET /api/admin/tracking/landing-page-stats - Get aggregated stats per landing page
export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const brandId = await getBrandId();
    const sessionsCollection = await getCollection(brandId, 'visitor_sessions');
    const landingPagesCollection = await getCollection(brandId, 'landing_pages');
    
    // Get all landing pages
    const landingPages = await landingPagesCollection.find({}).toArray();
    
    // Get all landing page slugs for filtering main site
    const allLpSlugs = landingPages.map(lp => lp.slug);
    
    // Aggregate stats per landing page
    const lpStats = await Promise.all(
      landingPages.map(async (lp) => {
        const sessions = await sessionsCollection.find({ 
          $or: [
            { landingPageId: lp._id },
            { landingPageId: lp._id.toString() },
            { landingPageSlug: lp.slug }
          ]
        }).toArray();
        
        const uniqueIps = new Set(sessions.map(s => s.ip)).size;
        // Count unique MSISDNs, not session count
        const uniqueMsisdns = new Set(sessions.filter(s => s.msisdn).map(s => s.msisdn)).size;
        // Sum pageViews from sessions with each network type (consistent with visitor list)
        const mobileDataVisits = sessions
          .filter(s => s.networkType === 'MOBILE_DATA')
          .reduce((sum: number, s) => sum + (s.pageViews || 1), 0);
        const wifiVisits = sessions
          .filter(s => s.networkType === 'WIFI')
          .reduce((sum: number, s) => sum + (s.pageViews || 1), 0);
        // Total visits = sum of all pageViews across sessions
        const totalVisits = sessions.reduce((sum: number, s) => sum + (s.pageViews || 1), 0);
        
        // Find top source
        const sourceCounts: Record<string, number> = {};
        sessions.forEach(s => {
          const source = s.utm?.source || 'direct';
          sourceCounts[source] = (sourceCounts[source] || 0) + 1;
        });
        const topSource = Object.entries(sourceCounts)
          .sort((a, b) => b[1] - a[1])[0]?.[0];

        return {
          slug: lp.slug,
          name: lp.name,
          type: 'landing_page',
          totalVisits,
          uniqueVisitors: uniqueIps,
          msisdnCaptured: uniqueMsisdns,
          mobileDataVisits,
          wifiVisits,
          conversionRate: uniqueIps > 0 ? (uniqueMsisdns / uniqueIps) * 100 : 0,
          topSource: topSource || 'direct',
        };
      })
    );

    // Get main site visits (sessions without landing page)
    const mainSiteSessions = await sessionsCollection.find({
      $and: [
        { landingPageSlug: { $exists: false } },
        { landingPageId: { $exists: false } }
      ]
    }).toArray();

    // Also include sessions with null/empty landing page
    const mainSiteSessionsAlt = await sessionsCollection.find({
      $or: [
        { landingPageSlug: null },
        { landingPageSlug: '' },
        { landingPageSlug: { $nin: allLpSlugs } }
      ]
    }).toArray();

    // Combine and dedupe by sessionId
    const allMainSiteSessions = [...mainSiteSessions, ...mainSiteSessionsAlt];
    const seenSessionIds = new Set<string>();
    const uniqueMainSiteSessions = allMainSiteSessions.filter(s => {
      if (seenSessionIds.has(s.sessionId)) return false;
      seenSessionIds.add(s.sessionId);
      return true;
    });

    const mainSiteUniqueIps = new Set(uniqueMainSiteSessions.map(s => s.ip)).size;
    // Count unique MSISDNs, not session count
    const mainSiteUniqueMsisdns = new Set(
      uniqueMainSiteSessions.filter(s => s.msisdn).map(s => s.msisdn)
    ).size;
    // Sum pageViews from sessions with each network type (consistent with visitor list)
    const mainSiteMobile = uniqueMainSiteSessions
      .filter(s => s.networkType === 'MOBILE_DATA')
      .reduce((sum: number, s) => sum + (s.pageViews || 1), 0);
    const mainSiteWifi = uniqueMainSiteSessions
      .filter(s => s.networkType === 'WIFI')
      .reduce((sum: number, s) => sum + (s.pageViews || 1), 0);
    // Total visits = sum of all pageViews
    const mainSiteTotalVisits = uniqueMainSiteSessions
      .reduce((sum: number, s) => sum + (s.pageViews || 1), 0);

    // Main site source counts
    const mainSourceCounts: Record<string, number> = {};
    uniqueMainSiteSessions.forEach(s => {
      const source = s.utm?.source || 'direct';
      mainSourceCounts[source] = (mainSourceCounts[source] || 0) + 1;
    });
    const mainTopSource = Object.entries(mainSourceCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0];

    const mainSiteStats = {
      slug: 'main-site',
      name: 'Main Site (Direct)',
      type: 'main_site',
      totalVisits: mainSiteTotalVisits,
      uniqueVisitors: mainSiteUniqueIps,
      msisdnCaptured: mainSiteUniqueMsisdns,
      mobileDataVisits: mainSiteMobile,
      wifiVisits: mainSiteWifi,
      conversionRate: mainSiteUniqueIps > 0 ? (mainSiteUniqueMsisdns / mainSiteUniqueIps) * 100 : 0,
      topSource: mainTopSource || 'direct',
    };

    // Combine all stats - main site first, then landing pages sorted by visits
    const allStats = [mainSiteStats, ...lpStats.sort((a, b) => b.totalVisits - a.totalVisits)];

    return NextResponse.json({
      success: true,
      stats: allStats,
    });
  } catch (error) {
    console.error('Error fetching landing page stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
