import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getBrandIdSync } from '@/lib/brand/server';
import { getSchedulerConfig, describeSchedule } from '@/lib/agents/scheduler';
import { getWorkerStatus, triggerManualRun, updateSchedule, ensureWorkerRunning } from '@/lib/agents/worker';

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

// GET /api/agents/schedule - Get schedule status
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const triggerRun = searchParams.get('trigger') === 'true';
  const startWorker = searchParams.get('start') === 'true';
  const secret = searchParams.get('secret');
  const brandId = getBrandIdSync();
  
  try {
    const config = await getSchedulerConfig(brandId);
    let workerStatus = getWorkerStatus();
    
    // If start parameter is set, ensure worker is running
    if (startWorker) {
      const result = await ensureWorkerRunning();
      console.log('[API] Worker start requested:', result);
      workerStatus = getWorkerStatus();
    }
    
    // If trigger parameter is set with valid secret, trigger a manual run
    if (triggerRun && secret === process.env.ADMIN_SECRET) {
      if (!config.enabled) {
        return NextResponse.json({
          success: true,
          ran: false,
          reason: 'Pipeline is disabled',
        });
      }
      
      console.log(`[API] Manual pipeline trigger at ${new Date().toISOString()}`);
      const result = await triggerManualRun();
      
      return NextResponse.json({
        success: true,
        ran: true,
        result,
      });
    }
    
    // Return worker status
    return NextResponse.json({
      success: true,
      worker: {
        isActive: workerStatus.isActive,
        isRunning: workerStatus.isRunning,
        currentSchedule: workerStatus.currentSchedule,
        scheduleDescription: describeSchedule(workerStatus.currentSchedule),
        lastRun: workerStatus.lastRun,
        lastResult: workerStatus.lastResult,
      },
      config: {
        enabled: config.enabled,
        cronExpression: config.cronSchedule,
        schedule: describeSchedule(config.cronSchedule),
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
    
    // Get current config and update in database
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
    
    // Update the internal worker with new schedule
    if (cronSchedule) {
      try {
        await updateSchedule(cronSchedule);
      } catch (e) {
        console.error('Failed to update worker schedule:', e);
      }
    }
    
    const newConfig = await getSchedulerConfig(brandId);
    const workerStatus = getWorkerStatus();
    
    return NextResponse.json({
      success: true,
      data: {
        enabled: newConfig.enabled,
        schedule: describeSchedule(newConfig.cronSchedule),
        cronExpression: newConfig.cronSchedule,
        workerActive: workerStatus.isActive,
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
