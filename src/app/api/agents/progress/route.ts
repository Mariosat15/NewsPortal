import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getBrandIdSync } from '@/lib/brand/server';
import { getPipelineProgress } from '@/lib/agents/orchestrator';
import { getCollection } from '@/lib/db/mongodb';

// Verify admin authentication
async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get('admin_token')?.value;
  const validToken = process.env.ADMIN_SECRET || 'admin-secret';
  
  if (adminToken === validToken) return true;
  
  const authHeader = request.headers.get('Authorization');
  if (authHeader === `Bearer ${validToken}`) return true;
  
  return false;
}

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
