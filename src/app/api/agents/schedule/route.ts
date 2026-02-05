import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { runAgentPipeline } from '@/lib/agents';
import { getBrandIdSync } from '@/lib/brand/server';
import { getSchedulerConfig, updateLastRun, shouldRunNow, describeSchedule } from '@/lib/agents/scheduler';

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

// GET /api/agents/schedule - Get schedule status or trigger check
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const checkAndRun = searchParams.get('check') === 'true';
  const secret = searchParams.get('secret');
  const brandId = getBrandIdSync();
  
  try {
    const config = await getSchedulerConfig(brandId);
    
    // If check parameter is set with valid secret, check if we should run
    if (checkAndRun && secret === process.env.ADMIN_SECRET) {
      if (!config.enabled) {
        return NextResponse.json({
          success: true,
          shouldRun: false,
          reason: 'Pipeline is disabled',
          schedule: describeSchedule(config.cronSchedule),
        });
      }
      
      const shouldRun = shouldRunNow(config.cronSchedule, config.lastRun);
      
      if (shouldRun) {
        // Run the pipeline
        console.log(`Scheduled run triggered at ${new Date().toISOString()}`);
        await updateLastRun(brandId);
        const log = await runAgentPipeline(brandId);
        
        return NextResponse.json({
          success: true,
          shouldRun: true,
          ran: true,
          status: log.status,
          articlesPublished: log.itemsSuccessful,
          errors: log.errors,
        });
      }
      
      return NextResponse.json({
        success: true,
        shouldRun: false,
        reason: 'Not scheduled to run at this time',
        schedule: describeSchedule(config.cronSchedule),
        lastRun: config.lastRun,
        nextRun: config.nextRun,
      });
    }
    
    // Otherwise return status
    return NextResponse.json({
      success: true,
      enabled: config.enabled,
      schedule: describeSchedule(config.cronSchedule),
      cronExpression: config.cronSchedule,
      lastRun: config.lastRun,
      nextRun: config.nextRun,
      endpoints: {
        manualRun: '/api/agents/run (POST)',
        scheduledCheck: '/api/agents/schedule?check=true&secret=YOUR_ADMIN_SECRET',
        cronEndpoint: '/api/agents/run?trigger=true&secret=YOUR_ADMIN_SECRET',
      },
    });
  } catch (error) {
    console.error('Schedule API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get schedule status' },
      { status: 500 }
    );
  }
}

// POST /api/agents/schedule - Update schedule settings
export async function POST(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  try {
    const { enabled, cronSchedule } = await request.json();
    const brandId = getBrandIdSync();
    
    // Get current config and update
    const { getCollection } = await import('@/lib/db/mongodb');
    const collection = await getCollection(brandId, 'settings');
    
    const currentConfig = await collection.findOne({ key: 'agentConfig' });
    const updatedConfig = {
      ...(currentConfig?.value || {}),
      enabled: enabled ?? true,
      cronSchedule: cronSchedule ?? '0 */6 * * *',
    };
    
    await collection.updateOne(
      { key: 'agentConfig' },
      { $set: { key: 'agentConfig', value: updatedConfig, updatedAt: new Date() } },
      { upsert: true }
    );
    
    const newConfig = await getSchedulerConfig(brandId);
    
    return NextResponse.json({
      success: true,
      data: {
        enabled: newConfig.enabled,
        schedule: describeSchedule(newConfig.cronSchedule),
        cronExpression: newConfig.cronSchedule,
        nextRun: newConfig.nextRun,
      },
    });
  } catch (error) {
    console.error('Update schedule error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update schedule' },
      { status: 500 }
    );
  }
}
