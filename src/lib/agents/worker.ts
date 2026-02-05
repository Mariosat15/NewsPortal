/**
 * Internal Agent Worker
 * 
 * This module provides internal scheduled execution of the content pipeline.
 * It uses node-cron to run jobs based on the configured schedule.
 * 
 * The worker starts automatically when the app starts and runs in the background.
 */

import cron, { ScheduledTask } from 'node-cron';
import { runAgentPipeline } from './orchestrator';
import { getCollection } from '@/lib/db/mongodb';

// Singleton state
let scheduledTask: ScheduledTask | null = null;
let isRunning = false;
let lastRun: Date | null = null;
let lastResult: { success: boolean; articlesPublished: number; error?: string } | null = null;
let currentSchedule = '0 */6 * * *'; // Default: every 6 hours

// Get brand ID (simplified for worker)
function getBrandId(): string {
  return process.env.BRAND_ID || 'default';
}

// Load schedule from database
async function loadScheduleFromDB(): Promise<string> {
  try {
    const brandId = getBrandId();
    const collection = await getCollection(brandId, 'settings');
    const agentConfig = await collection.findOne({ key: 'agentConfig' });
    
    if (agentConfig?.value?.cronSchedule) {
      return agentConfig.value.cronSchedule;
    }
  } catch (error) {
    console.log('[Worker] Using default schedule (DB not available)');
  }
  return '0 */6 * * *';
}

// Check if agents are enabled
async function areAgentsEnabled(): Promise<boolean> {
  try {
    const brandId = getBrandId();
    const collection = await getCollection(brandId, 'settings');
    const agentConfig = await collection.findOne({ key: 'agentConfig' });
    
    // Default to enabled if not set
    return agentConfig?.value?.enabled !== false;
  } catch (error) {
    return true; // Default to enabled
  }
}

// Run the pipeline
async function runPipeline() {
  if (isRunning) {
    console.log('[Worker] Pipeline already running, skipping...');
    return;
  }

  // Check if enabled
  const enabled = await areAgentsEnabled();
  if (!enabled) {
    console.log('[Worker] Agents disabled, skipping run');
    return;
  }

  isRunning = true;
  console.log(`[Worker] Starting scheduled pipeline run at ${new Date().toISOString()}`);

  try {
    const brandId = getBrandId();
    const log = await runAgentPipeline(brandId);
    
    lastRun = new Date();
    lastResult = {
      success: log.status === 'completed',
      articlesPublished: log.itemsSuccessful,
      error: log.errors.length > 0 ? log.errors.join(', ') : undefined,
    };

    console.log(`[Worker] Pipeline completed: ${log.itemsSuccessful} articles published`);
    
    // Save last run to database
    try {
      const collection = await getCollection(brandId, 'settings');
      await collection.updateOne(
        { key: 'workerLastRun' },
        { 
          $set: { 
            key: 'workerLastRun', 
            value: { 
              timestamp: lastRun,
              result: lastResult,
            },
            updatedAt: new Date(),
          } 
        },
        { upsert: true }
      );
    } catch (e) {
      console.error('[Worker] Failed to save last run:', e);
    }
  } catch (error) {
    console.error('[Worker] Pipeline error:', error);
    lastResult = {
      success: false,
      articlesPublished: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  } finally {
    isRunning = false;
  }
}

// Start the worker with the given schedule
function startWorker(schedule: string) {
  // Stop existing task if any
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
  }

  // Validate cron expression
  if (!cron.validate(schedule)) {
    console.error(`[Worker] Invalid cron expression: ${schedule}, using default`);
    schedule = '0 */6 * * *';
  }

  currentSchedule = schedule;
  
  scheduledTask = cron.schedule(schedule, runPipeline, {
    scheduled: true,
    timezone: 'Europe/Berlin', // Default timezone
  });

  console.log(`[Worker] Started with schedule: ${schedule}`);
  console.log(`[Worker] Next runs will be based on cron: ${schedule}`);
}

// Stop the worker
function stopWorker() {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log('[Worker] Stopped');
  }
}

// Restart with new schedule
async function restartWithNewSchedule() {
  const newSchedule = await loadScheduleFromDB();
  if (newSchedule !== currentSchedule) {
    console.log(`[Worker] Schedule changed from "${currentSchedule}" to "${newSchedule}"`);
    startWorker(newSchedule);
  }
}

// Initialize the worker
export async function initializeWorker() {
  // Only run on server side
  if (typeof window !== 'undefined') {
    return;
  }

  // Don't run in development with hot reload (optional - remove if you want it in dev)
  // if (process.env.NODE_ENV === 'development') {
  //   console.log('[Worker] Skipping in development mode');
  //   return;
  // }

  console.log('[Worker] Initializing...');

  try {
    const schedule = await loadScheduleFromDB();
    startWorker(schedule);

    // Check for schedule changes every 5 minutes
    setInterval(restartWithNewSchedule, 5 * 60 * 1000);
    
    // Load last run info from DB
    try {
      const brandId = getBrandId();
      const collection = await getCollection(brandId, 'settings');
      const lastRunDoc = await collection.findOne({ key: 'workerLastRun' });
      if (lastRunDoc?.value) {
        lastRun = new Date(lastRunDoc.value.timestamp);
        lastResult = lastRunDoc.value.result;
      }
    } catch (e) {
      // Ignore
    }

    console.log('[Worker] Initialized successfully');
  } catch (error) {
    console.error('[Worker] Failed to initialize:', error);
  }
}

// Get worker status
export function getWorkerStatus() {
  return {
    isActive: scheduledTask !== null,
    isRunning,
    currentSchedule,
    lastRun,
    lastResult,
  };
}

// Ensure worker is running (can be called from API)
export async function ensureWorkerRunning() {
  if (scheduledTask !== null) {
    return { started: false, message: 'Worker already running' };
  }
  
  console.log('[Worker] Starting worker via API...');
  const schedule = await loadScheduleFromDB();
  startWorker(schedule);
  
  return { started: true, message: 'Worker started', schedule };
}

// Trigger a manual run
export async function triggerManualRun() {
  await runPipeline();
  return lastResult;
}

// Update schedule (called from admin)
export async function updateSchedule(newSchedule: string) {
  if (!cron.validate(newSchedule)) {
    throw new Error(`Invalid cron expression: ${newSchedule}`);
  }
  startWorker(newSchedule);
  return { success: true, schedule: newSchedule };
}

// Export for testing
export { stopWorker, startWorker };
