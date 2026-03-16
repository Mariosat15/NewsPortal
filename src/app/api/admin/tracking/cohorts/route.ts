import { NextRequest, NextResponse } from 'next/server';
import { getBrandId } from '@/lib/brand/server';
import { getCollection } from '@/lib/db/mongodb';
import { verifyAdmin } from '@/lib/auth/admin';

/**
 * GET /api/admin/tracking/cohorts?weeks=8
 * Returns a weekly cohort retention matrix.
 *
 * Cohort = the week a visitor was first seen.
 * Retention = whether that visitor returned in subsequent weeks.
 *
 * Reason: Lets the admin understand user stickiness and returning behavior.
 */
export async function GET(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const brandId = await getBrandId();
    const { searchParams } = new URL(request.url);
    const weeks = Math.min(Math.max(parseInt(searchParams.get('weeks') || '8', 10), 2), 16);

    const collection = await getCollection(brandId, 'visitor_sessions');

    // Calculate week boundaries
    const now = new Date();
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const startDate = new Date(now.getTime() - weeks * msPerWeek);

    // Fetch sessions created within the range
    const sessions = await collection.find({
      firstSeenAt: { $gte: startDate },
    }).project({
      sessionId: 1,
      ip: 1,
      normalizedMsisdn: 1,
      firstSeenAt: 1,
      lastSeenAt: 1,
    }).toArray();

    // Assign each session to a cohort week (0 = oldest, weeks-1 = newest)
    const getWeekIndex = (date: Date) => {
      const diffMs = date.getTime() - startDate.getTime();
      return Math.min(Math.floor(diffMs / msPerWeek), weeks - 1);
    };

    // Group users by a unique ID (prefer MSISDN, fallback to IP)
    const userFirstWeek = new Map<string, number>(); // userId -> first week index
    const userReturnWeeks = new Map<string, Set<number>>(); // userId -> set of weeks seen

    sessions.forEach(s => {
      const userId = (s.normalizedMsisdn as string) || (s.ip as string);
      if (!userId) return;

      const firstWeek = getWeekIndex(new Date(s.firstSeenAt as Date));
      const lastWeek = getWeekIndex(new Date(s.lastSeenAt as Date));

      if (!userFirstWeek.has(userId) || firstWeek < (userFirstWeek.get(userId) ?? Infinity)) {
        userFirstWeek.set(userId, firstWeek);
      }

      if (!userReturnWeeks.has(userId)) {
        userReturnWeeks.set(userId, new Set());
      }
      userReturnWeeks.get(userId)!.add(firstWeek);
      if (lastWeek !== firstWeek) {
        userReturnWeeks.get(userId)!.add(lastWeek);
      }
    });

    // Build cohort matrix: cohorts[cohortWeek][returnWeek] = count
    const cohorts: { weekLabel: string; users: number; retention: number[] }[] = [];

    for (let cohortWeek = 0; cohortWeek < weeks; cohortWeek++) {
      const weekStart = new Date(startDate.getTime() + cohortWeek * msPerWeek);
      const weekLabel = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;

      // Users whose first visit was in this cohort week
      const cohortUsers: string[] = [];
      userFirstWeek.forEach((week, userId) => {
        if (week === cohortWeek) cohortUsers.push(userId);
      });

      const totalUsers = cohortUsers.length;
      const retention: number[] = [];

      for (let returnOffset = 0; returnOffset < weeks - cohortWeek; returnOffset++) {
        const targetWeek = cohortWeek + returnOffset;
        let count = 0;
        cohortUsers.forEach(userId => {
          if (userReturnWeeks.get(userId)?.has(targetWeek)) {
            count++;
          }
        });
        retention.push(totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0);
      }

      cohorts.push({ weekLabel, users: totalUsers, retention });
    }

    return NextResponse.json({ success: true, cohorts, weeks });
  } catch (error) {
    console.error('Cohort analysis error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate cohort analysis' },
      { status: 500 }
    );
  }
}
