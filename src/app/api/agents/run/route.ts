import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { runAgentPipeline } from '@/lib/agents';
import { getBrandIdSync } from '@/lib/brand/server';

// Verify admin authentication
async function verifyAdmin(request: NextRequest): Promise<boolean> {
  // Check cookie
  const cookieStore = await cookies();
  const adminToken = cookieStore.get('admin_token')?.value;
  const validToken = process.env.ADMIN_SECRET || 'admin-secret';
  
  if (adminToken === validToken) return true;
  
  // Also check header for backward compatibility
  const authHeader = request.headers.get('Authorization');
  if (authHeader === `Bearer ${validToken}`) return true;
  
  return false;
}

// POST /api/agents/run - Trigger agent pipeline manually
export async function POST(request: NextRequest) {
  try {
    // Verify admin authorization
    if (!(await verifyAdmin(request))) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const brandId = getBrandIdSync();
    
    // Parse settings from request body if provided
    let customSettings;
    try {
      const body = await request.json();
      if (body.settings) {
        customSettings = body.settings;
        console.log('Using custom settings from request');
      }
    } catch {
      // No body or invalid JSON, use defaults
    }
    
    console.log(`Manually triggering agent pipeline for brand: ${brandId}`);
    
    const log = await runAgentPipeline(brandId, customSettings);

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
