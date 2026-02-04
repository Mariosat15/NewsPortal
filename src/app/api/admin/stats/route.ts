import { NextResponse } from 'next/server';
import { getBrandIdSync } from '@/lib/brand';
import { getArticleRepository, getUserRepository, getUnlockRepository } from '@/lib/db';

// GET /api/admin/stats - Get dashboard statistics
export async function GET() {
  try {
    const brandId = getBrandIdSync();
    const articleRepo = getArticleRepository(brandId);
    const userRepo = getUserRepository(brandId);
    const unlockRepo = getUnlockRepository(brandId);

    // Calculate dates
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get article stats
    const allArticles = await articleRepo.listAll({ limit: 1000 });
    const recentArticles = allArticles.articles.filter(
      a => new Date(a.createdAt) >= weekAgo
    ).length;

    // Get user stats
    const allUsers = await userRepo.listUsers({ limit: 1000 });
    const recentUsers = allUsers.users.filter(
      u => new Date(u.firstSeen) >= weekAgo
    ).length;

    // Get unlock stats
    const unlockStats = await unlockRepo.getStats();

    return NextResponse.json({
      success: true,
      data: {
        totalArticles: allArticles.total,
        recentArticles,
        totalUsers: allUsers.total,
        recentUsers,
        totalRevenue: unlockStats.totalRevenue,
        totalUnlocks: unlockStats.totalUnlocks,
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
