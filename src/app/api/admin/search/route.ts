import { NextRequest, NextResponse } from 'next/server';
import { getBrandId } from '@/lib/brand/server';
import { getCollection } from '@/lib/db/mongodb';
import { verifyAdmin } from '@/lib/auth/admin';

/**
 * GET /api/admin/search?q=query
 * Global search across articles, customers, landing pages, and transactions.
 * Returns categorized results with type, name, and link.
 */
export async function GET(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const brandId = await getBrandId();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ success: true, results: [] });
    }

    const regex = { $regex: query, $options: 'i' };
    const maxPerType = 5;

    // Search in parallel across all collections
    const [articles, customers, landingPages, sessions] = await Promise.all([
      // Articles
      getCollection(brandId, 'articles').then(col =>
        col.find({
          $or: [{ title: regex }, { slug: regex }, { category: regex }],
        })
          .project({ title: 1, slug: 1, category: 1, status: 1 })
          .limit(maxPerType)
          .toArray()
      ),

      // Customers
      getCollection(brandId, 'customers').then(col =>
        col.find({
          $or: [{ msisdn: regex }, { normalizedMsisdn: regex }, { displayName: regex }],
        })
          .project({ msisdn: 1, normalizedMsisdn: 1, displayName: 1, totalSpent: 1 })
          .limit(maxPerType)
          .toArray()
      ),

      // Landing Pages
      getCollection(brandId, 'landing_pages').then(col =>
        col.find({
          $or: [{ slug: regex }, { name: regex }, { 'config.headline': regex }],
        })
          .project({ slug: 1, name: 1, status: 1 })
          .limit(maxPerType)
          .toArray()
      ),

      // Sessions (by IP or MSISDN)
      getCollection(brandId, 'visitor_sessions').then(col =>
        col.find({
          $or: [{ ip: regex }, { msisdn: regex }, { sessionId: regex }],
        })
          .project({ sessionId: 1, ip: 1, msisdn: 1, landingPageSlug: 1 })
          .limit(maxPerType)
          .toArray()
      ),
    ]);

    // Format results into unified structure
    interface SearchResult {
      type: string;
      title: string;
      subtitle: string;
      tab: string;
      id?: string;
    }

    const results: SearchResult[] = [];

    articles.forEach(a => results.push({
      type: 'article',
      title: (a.title as string) || (a.slug as string),
      subtitle: `${a.category || 'Uncategorized'} · ${a.status || 'published'}`,
      tab: 'articles',
      id: a.slug as string,
    }));

    customers.forEach(c => results.push({
      type: 'customer',
      title: (c.displayName as string) || (c.normalizedMsisdn as string) || (c.msisdn as string),
      subtitle: `MSISDN: ${c.msisdn || 'N/A'}`,
      tab: 'users',
      id: (c.normalizedMsisdn as string) || (c.msisdn as string),
    }));

    landingPages.forEach(lp => results.push({
      type: 'landing_page',
      title: (lp.name as string) || (lp.slug as string),
      subtitle: `Slug: ${lp.slug} · ${lp.status || 'active'}`,
      tab: 'landing-pages',
      id: lp.slug as string,
    }));

    sessions.forEach(s => results.push({
      type: 'session',
      title: `Session: ${(s.sessionId as string).slice(0, 16)}...`,
      subtitle: `IP: ${s.ip || 'N/A'} · ${s.landingPageSlug || 'main-site'}`,
      tab: 'analytics',
      id: s.sessionId as string,
    }));

    return NextResponse.json({ success: true, results, query });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { success: false, error: 'Search failed' },
      { status: 500 }
    );
  }
}
