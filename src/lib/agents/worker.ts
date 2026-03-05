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
let cronFireCount = 0;

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

// Load full agent config from database for diagnostics
async function loadAgentConfigFromDB(): Promise<Record<string, unknown> | null> {
  try {
    const brandId = getBrandId();
    const collection = await getCollection(brandId, 'settings');
    const agentConfig = await collection.findOne({ key: 'agentConfig' });
    return (agentConfig?.value as Record<string, unknown>) || null;
  } catch {
    return null;
  }
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
  cronFireCount++;
  const fireTime = new Date().toISOString();
  console.log(`[Worker] ⏰ Cron fired (#${cronFireCount}) at ${fireTime} (schedule: ${currentSchedule})`);

  if (isRunning) {
    console.log('[Worker] ⚠️ Pipeline already running, skipping this trigger');
    return;
  }

  // Check if enabled
  const enabled = await areAgentsEnabled();
  if (!enabled) {
    console.log('[Worker] ⚠️ Agents DISABLED in settings, skipping run. Enable in Admin → AI Agents → toggle "Enable Agents"');
    return;
  }

  // Check OPENAI_API_KEY before starting
  if (!process.env.OPENAI_API_KEY) {
    console.error('[Worker] ❌ OPENAI_API_KEY not set! Cannot generate articles. Set it in your .env file.');
    lastResult = {
      success: false,
      articlesPublished: 0,
      error: 'OPENAI_API_KEY is not configured',
    };
    return;
  }

  isRunning = true;
  console.log(`[Worker] 🚀 Starting scheduled pipeline run at ${fireTime}`);
  console.log(`[Worker] Brand: ${getBrandId()}, Schedule: ${currentSchedule}`);

  try {
    const brandId = getBrandId();
    const log = await runAgentPipeline(brandId);
    
    lastRun = new Date();
    lastResult = {
      success: log.status === 'completed',
      articlesPublished: log.itemsSuccessful,
      error: log.errors.length > 0 ? log.errors.join(', ') : undefined,
    };

    if (log.itemsSuccessful > 0) {
      console.log(`[Worker] ✅ Pipeline completed: ${log.itemsSuccessful} articles published`);
    } else {
      console.log(`[Worker] ⚠️ Pipeline completed but 0 articles published. Errors: ${log.errors.join(', ') || 'none'}`);
      console.log(`[Worker] Metadata:`, JSON.stringify(log.metadata, null, 2));
    }
    
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
    console.error('[Worker] ❌ Pipeline error:', error);
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
    console.error(`[Worker] ❌ Invalid cron expression: "${schedule}", falling back to default "0 */6 * * *"`);
    schedule = '0 */6 * * *';
  }

  currentSchedule = schedule;
  
  scheduledTask = cron.schedule(schedule, runPipeline, {
    scheduled: true,
    timezone: 'Europe/Berlin', // Default timezone
  });

  console.log(`[Worker] ✅ Cron started: "${schedule}" (timezone: Europe/Berlin)`);
  console.log(`[Worker] ${describeScheduleHuman(schedule)}`);
}

// Human-readable schedule description
function describeScheduleHuman(cronExpression: string): string {
  const parts = cronExpression.split(' ');
  if (parts.length !== 5) return `Next run: based on cron "${cronExpression}"`;
  
  const [minute, hour] = parts;
  
  if (minute === '*' && hour === '*') return 'Next run: every minute';
  if (minute.startsWith('*/')) {
    const mins = parseInt(minute.slice(2), 10);
    return `Next run: every ${mins} minute${mins > 1 ? 's' : ''}`;
  }
  if (minute === '0' && hour.startsWith('*/')) {
    const hours = parseInt(hour.slice(2), 10);
    return `Next run: every ${hours} hour${hours > 1 ? 's' : ''} at :00`;
  }
  if (minute === '0' && hour === '*') return 'Next run: every hour at :00';
  if (minute === '0' && !hour.includes('*')) {
    return `Next run: daily at ${hour}:00`;
  }
  
  return `Next run: based on cron "${cronExpression}"`;
}

// Stop the worker
function stopWorker() {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log('[Worker] 🛑 Stopped');
  }
}

// Periodic sync: checks enabled state AND schedule from DB
async function syncFromDBPeriodic() {
  try {
    const enabled = await areAgentsEnabled();
    const newSchedule = await loadScheduleFromDB();
    
    if (!enabled && scheduledTask) {
      console.log('[Worker] 🛑 Periodic sync: agents disabled, stopping worker');
      stopWorker();
      return;
    }
    
    if (enabled && !scheduledTask) {
      console.log('[Worker] ✅ Periodic sync: agents enabled, starting worker');
      startWorker(newSchedule);
      return;
    }
    
    if (enabled && newSchedule !== currentSchedule) {
      console.log(`[Worker] 🔄 Periodic sync: schedule changed "${currentSchedule}" → "${newSchedule}"`);
      startWorker(newSchedule);
    }
  } catch {
    // Ignore periodic sync errors
  }
}

// Initialize the worker
export async function initializeWorker() {
  // Only run on server side
  if (typeof window !== 'undefined') {
    return;
  }

  console.log('[Worker] 🔧 Initializing...');

  try {
    // --- Startup Health Check ---
    const brandId = getBrandId();
    console.log(`[Worker] Brand ID: ${brandId}`);

    // Check OPENAI_API_KEY
    if (process.env.OPENAI_API_KEY) {
      console.log(`[Worker] ✅ OPENAI_API_KEY: configured (${process.env.OPENAI_API_KEY.slice(0, 8)}...)`);
    } else {
      console.error('[Worker] ❌ OPENAI_API_KEY: NOT SET — articles cannot be generated!');
    }

    // Load and display DB config
    const dbConfig = await loadAgentConfigFromDB();
    if (dbConfig) {
      console.log(`[Worker] DB Config → enabled: ${dbConfig.enabled}, schedule: "${dbConfig.cronSchedule}", language: ${dbConfig.defaultLanguage || 'de'}, maxArticles: ${dbConfig.maxArticlesPerRun}`);
      if (dbConfig.enabled === false) {
        console.log('[Worker] ⚠️ Agents are DISABLED in the database. The cron will fire but skip execution.');
        console.log('[Worker] To enable: go to Admin → AI Agents → toggle "Enable Agents" → Save Settings');
      }
    } else {
      console.log('[Worker] No agent config found in DB, using defaults');
    }

    // Only start the cron if agents are enabled
    const agentsEnabled = dbConfig?.enabled !== false;
    const schedule = await loadScheduleFromDB();
    
    if (agentsEnabled) {
      startWorker(schedule);
    } else {
      currentSchedule = schedule; // Remember schedule but don't start cron
      console.log('[Worker] ⏸️ Agents disabled — cron NOT started. Enable in Admin → AI Agents to begin.');
    }

    // Check for config changes every 2 minutes (syncs enabled state + schedule)
    setInterval(syncFromDBPeriodic, 2 * 60 * 1000);
    
    // Load last run info from DB
    try {
      const collection = await getCollection(brandId, 'settings');
      const lastRunDoc = await collection.findOne({ key: 'workerLastRun' });
      if (lastRunDoc?.value) {
        lastRun = new Date(lastRunDoc.value.timestamp);
        lastResult = lastRunDoc.value.result;
        console.log(`[Worker] Last run: ${lastRun.toISOString()}, result: ${lastResult?.success ? 'success' : 'failed'} (${lastResult?.articlesPublished || 0} articles)`);
      } else {
        console.log('[Worker] No previous run recorded');
      }
    } catch (e) {
      // Ignore
    }

    console.log('[Worker] ✅ Initialized successfully');
  } catch (error) {
    console.error('[Worker] ❌ Failed to initialize:', error);
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
    cronFireCount,
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

// Update schedule immediately (called from admin API)
export async function updateSchedule(newSchedule: string) {
  if (!cron.validate(newSchedule)) {
    throw new Error(`Invalid cron expression: ${newSchedule}`);
  }
  console.log(`[Worker] 🔄 Schedule update requested: "${currentSchedule}" → "${newSchedule}"`);
  startWorker(newSchedule);
  return { success: true, schedule: newSchedule };
}

// Sync worker with DB config (call after admin saves agentConfig)
// This is the KEY function: it starts or stops the worker based on the enabled flag
export async function syncWorkerFromDB() {
  console.log('[Worker] 🔄 Syncing with DB config...');
  
  const enabled = await areAgentsEnabled();
  const newSchedule = await loadScheduleFromDB();
  
  if (!enabled) {
    // === AGENTS DISABLED → STOP the cron job completely ===
    if (scheduledTask) {
      console.log('[Worker] 🛑 Agents DISABLED — stopping cron job');
      stopWorker();
    } else {
      console.log('[Worker] Agents disabled, worker already stopped');
    }
    return { 
      synced: true, 
      schedule: newSchedule, 
      enabled: false,
      workerActive: false,
    };
  }
  
  // === AGENTS ENABLED → ensure worker is running with correct schedule ===
  if (newSchedule !== currentSchedule || scheduledTask === null) {
    console.log(`[Worker] ✅ Agents ENABLED — starting cron "${newSchedule}"`);
    startWorker(newSchedule);
  } else {
    console.log(`[Worker] Agents enabled, worker already running with schedule "${currentSchedule}"`);
  }
  
  return { 
    synced: true, 
    schedule: newSchedule, 
    enabled: true,
    workerActive: scheduledTask !== null,
  };
}

// Export for testing
export { stopWorker, startWorker };
