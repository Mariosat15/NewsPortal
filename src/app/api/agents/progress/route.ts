import { NextRequest, NextResponse } from 'next/server';
import { getBrandIdSync } from '@/lib/brand/server';
import { getPipelineProgress } from '@/lib/agents/orchestrator';
import { getCollection } from '@/lib/db/mongodb';
import { verifyAdmin } from '@/lib/auth/admin';

// GET /api/agents/progress - Get current pipeline progress and recent logs
export async function GET(request: NextRequest) {
  try {
    const brandId = getBrandIdSync();
    
    // Get current progress
    const progress = getPipelineProgress();
    
    // Get recent logs from database
    let recentLogs: unknown[] = [];
    try {
      const logsCollection = await getCollection(brandId, 'pipelineLogs');
      recentLogs = await logsCollection
        .find({})
        .sort({ startedAt: -1 })
        .limit(10)
        .toArray();
    } catch (e) {
      // Logs collection might not exist yet
    }
    
    return NextResponse.json({
      success: true,
      progress,
      recentLogs,
    });
  } catch (error) {
    console.error('Progress API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get progress' },
      { status: 500 }
    );
  }
}
