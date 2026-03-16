import { NextRequest, NextResponse } from 'next/server';
import { getBrandId } from '@/lib/brand/server';
import { getCollection } from '@/lib/db/mongodb';
import { verifyAdmin } from '@/lib/auth/admin';

/**
 * GET /api/admin/notifications
 * Returns recent activity notifications (last 50) generated from
 * real data: new purchases, new subscribers, agent runs, etc.
 * Reason: No separate notifications collection needed — we derive
 * them from existing collections for zero-maintenance overhead.
 */
export async function GET(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const brandId = await getBrandId();

    // Fetch recent events in parallel
    const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const cutoff7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [recentUnlocks, recentSessions, recentArticles, adminActions] = await Promise.all([
      // Recent purchases (last 24h)
      getCollection(brandId, 'unlocks').then(col =>
        col.find({ createdAt: { $gte: cutoff24h }, status: 'completed' })
          .sort({ createdAt: -1 })
          .limit(10)
          .project({ msisdn: 1, priceInCents: 1, articleId: 1, createdAt: 1 })
          .toArray()
      ),

      // New visitors with MSISDN (last 24h)
      getCollection(brandId, 'visitor_sessions').then(col =>
        col.find({
          firstSeenAt: { $gte: cutoff24h },
          msisdnConfidence: 'CONFIRMED',
        })
          .sort({ firstSeenAt: -1 })
          .limit(10)
          .project({ msisdn: 1, carrier: 1, landingPageSlug: 1, firstSeenAt: 1 })
          .toArray()
      ),

      // Recently published articles (last 7d)
      getCollection(brandId, 'articles').then(col =>
        col.find({ createdAt: { $gte: cutoff7d }, status: 'published' })
          .sort({ createdAt: -1 })
          .limit(5)
          .project({ title: 1, slug: 1, agentGenerated: 1, createdAt: 1 })
          .toArray()
      ),

      // Recent admin actions (last 24h)
      getCollection(brandId, 'admin_actions').then(col =>
        col.find({ timestamp: { $gte: cutoff24h } })
          .sort({ timestamp: -1 })
          .limit(10)
          .project({ actionType: 1, description: 1, adminEmail: 1, timestamp: 1 })
          .toArray()
      ).catch(() => []), // Gracefully handle missing collection
    ]);

    // Build unified notification list
    interface Notification {
      id: string;
      type: 'purchase' | 'subscriber' | 'article' | 'admin';
      title: string;
      description: string;
      timestamp: Date;
      icon: string; // emoji shorthand for frontend
    }

    const notifications: Notification[] = [];

    recentUnlocks.forEach(u => notifications.push({
      id: `unlock-${u._id}`,
      type: 'purchase',
      title: 'New Purchase',
      description: `${(u.msisdn as string)?.slice(-4) || '****'} — €${((u.priceInCents as number) / 100).toFixed(2)}`,
      timestamp: u.createdAt as Date,
      icon: '💰',
    }));

    recentSessions.forEach(s => notifications.push({
      id: `sub-${s._id}`,
      type: 'subscriber',
      title: 'MSISDN Detected',
      description: `${(s.msisdn as string)?.slice(-4) || '****'} via ${s.carrier || 'unknown'} on ${s.landingPageSlug || 'main-site'}`,
      timestamp: s.firstSeenAt as Date,
      icon: '📱',
    }));

    recentArticles.forEach(a => notifications.push({
      id: `article-${a._id}`,
      type: 'article',
      title: a.agentGenerated ? 'AI Article Published' : 'Article Published',
      description: a.title as string,
      timestamp: a.createdAt as Date,
      icon: a.agentGenerated ? '🤖' : '📝',
    }));

    adminActions.forEach(a => notifications.push({
      id: `action-${a._id}`,
      type: 'admin',
      title: (a.actionType as string).replace(/_/g, ' '),
      description: a.description as string,
      timestamp: a.timestamp as Date,
      icon: '⚡',
    }));

    // Sort by timestamp descending and limit to 30
    notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const limited = notifications.slice(0, 30);

    return NextResponse.json({ success: true, notifications: limited });
  } catch (error) {
    console.error('Notifications error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}
