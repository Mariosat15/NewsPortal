import { NextRequest, NextResponse } from 'next/server';
import { runAgentPipeline } from '@/lib/agents';
import { getBrandIdSync } from '@/lib/brand';

// POST /api/agents/run - Trigger agent pipeline manually
export async function POST(request: NextRequest) {
  try {
    // Verify admin authorization
    const authHeader = request.headers.get('Authorization');
    const adminSecret = process.env.ADMIN_SECRET || process.env.DIMOCO_CALLBACK_SECRET;
    
    if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const brandId = getBrandIdSync();
    
    console.log(`Manually triggering agent pipeline for brand: ${brandId}`);
    
    const log = await runAgentPipeline(brandId);

    return NextResponse.json({
      success: true,
      data: {
        status: log.status,
        itemsProcessed: log.itemsProcessed,
        itemsSuccessful: log.itemsSuccessful,
        itemsFailed: log.itemsFailed,
        errors: log.errors,
        duration: log.completedAt
          ? log.completedAt.getTime() - log.startedAt.getTime()
          : 0,
        metadata: log.metadata,
      },
    });
  } catch (error) {
    console.error('Agent run error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to run agents' 
      },
      { status: 500 }
    );
  }
}

// GET /api/agents/run - Check agent status (health check endpoint for cron)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const trigger = searchParams.get('trigger');
  const secret = searchParams.get('secret');
  
  // If trigger parameter and valid secret, run the pipeline
  if (trigger === 'true' && secret === process.env.ADMIN_SECRET) {
    const brandId = getBrandIdSync();
    const log = await runAgentPipeline(brandId);
    
    return NextResponse.json({
      success: true,
      triggered: true,
      status: log.status,
      articlesPublished: log.itemsSuccessful,
    });
  }

  // Otherwise, just return status
  return NextResponse.json({
    success: true,
    status: 'ready',
    message: 'Agent API is operational',
    brandId: getBrandIdSync(),
  });
}
