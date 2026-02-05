import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { runAgentPipeline } from '@/lib/agents';
import { getBrandIdSync } from '@/lib/brand/server';
import { getPipelineProgress } from '@/lib/agents/orchestrator';

export const dynamic = 'force-dynamic';

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

// Store for async pipeline results
let lastPipelineResult: {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  completedAt?: Date;
} | null = null;

// POST /api/agents/run - Trigger agent pipeline (runs async, returns immediately)
export async function POST(request: NextRequest) {
  console.log('[API] Agent pipeline POST request received');
  
  try {
    if (!(await verifyAdmin(request))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check if already running
    const progress = getPipelineProgress();
    if (progress.isRunning) {
      return NextResponse.json({
        success: true,
        message: 'Pipeline already running',
        running: true,
        progress,
      });
    }

    const brandId = getBrandIdSync();
    
    // Parse settings
    let customSettings;
    try {
      const body = await request.json();
      if (body.settings) customSettings = body.settings;
    } catch {
      // Use defaults
    }
    
    console.log(`[API] Starting async pipeline for brand: ${brandId}`);
    
    // Start pipeline ASYNC - don't await, return immediately
    runAgentPipeline(brandId, customSettings)
      .then((log) => {
        console.log(`[API] Pipeline completed: ${log.status}`);
        lastPipelineResult = {
          success: log.status === 'completed',
          data: {
            status: log.status,
            itemsProcessed: log.itemsProcessed,
            itemsSuccessful: log.itemsSuccessful,
            itemsFailed: log.itemsFailed,
            errors: log.errors,
            metadata: log.metadata,
          },
          completedAt: new Date(),
        };
      })
      .catch((error) => {
        console.error('[API] Pipeline failed:', error);
        lastPipelineResult = {
          success: false,
          error: error instanceof Error ? error.message : 'Pipeline failed',
          completedAt: new Date(),
        };
      });

    // Return immediately - pipeline runs in background
    return NextResponse.json({
      success: true,
      message: 'Pipeline started',
      running: true,
    });
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to start pipeline' },
      { status: 500 }
    );
  }
}

// GET /api/agents/run - Check progress and status
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const trigger = searchParams.get('trigger');
  const secret = searchParams.get('secret');
  
  // If trigger parameter and valid secret, start the pipeline async
  if (trigger === 'true' && secret === process.env.ADMIN_SECRET) {
    const brandId = getBrandIdSync();
    
    // Start async
    runAgentPipeline(brandId).catch(console.error);
    
    return NextResponse.json({
      success: true,
      triggered: true,
      message: 'Pipeline started in background',
    });
  }

  // Return current progress
  const progress = getPipelineProgress();
  
  return NextResponse.json({
    success: true,
    running: progress.isRunning,
    progress,
    lastResult: lastPipelineResult,
    brandId: getBrandIdSync(),
  });
}
