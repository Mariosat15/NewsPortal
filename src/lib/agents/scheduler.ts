/**
 * Agent Pipeline Scheduler
 * 
 * This module provides scheduled execution of the content pipeline.
 * It can be triggered via:
 * 1. Internal polling (for self-hosted environments)
 * 2. External cron services (Vercel Cron, server cron, etc.)
 * 
 * The schedule is stored in the database and can be changed via admin panel.
 */

import { getCollection } from '@/lib/db/mongodb';

export interface SchedulerConfig {
  enabled: boolean;
  cronSchedule: string;
  lastRun?: Date;
  nextRun?: Date;
}

// Parse cron expression to get interval in milliseconds
export function cronToInterval(cronExpression: string): number {
  const parts = cronExpression.split(' ');
  if (parts.length !== 5) return 60 * 60 * 1000; // Default: 1 hour
  
  const [minute, hour] = parts;
  
  // Every X minutes
  if (minute.startsWith('*/') && hour === '*') {
    const mins = parseInt(minute.slice(2), 10);
    return mins * 60 * 1000;
  }
  
  // Every minute
  if (minute === '*' && hour === '*') {
    return 60 * 1000;
  }
  
  // Every X hours
  if (minute === '0' && hour.startsWith('*/')) {
    const hours = parseInt(hour.slice(2), 10);
    return hours * 60 * 60 * 1000;
  }
  
  // Every hour
  if (minute === '0' && hour === '*') {
    return 60 * 60 * 1000;
  }
  
  // Default: check every hour for complex schedules
  return 60 * 60 * 1000;
}

// Check if it's time to run based on cron expression
export function shouldRunNow(cronExpression: string, lastRun?: Date): boolean {
  const now = new Date();
  const parts = cronExpression.split(' ');
  if (parts.length !== 5) return false;
  
  const [minuteCron, hourCron, dayOfMonthCron, monthCron, dayOfWeekCron] = parts;
  
  // Check minute
  if (minuteCron !== '*' && !minuteCron.startsWith('*/')) {
    if (!matchesCronPart(now.getMinutes(), minuteCron)) return false;
  }
  
  // Check hour
  if (hourCron !== '*' && !hourCron.startsWith('*/')) {
    if (!matchesCronPart(now.getHours(), hourCron)) return false;
  }
  
  // Check day of month
  if (dayOfMonthCron !== '*') {
    if (!matchesCronPart(now.getDate(), dayOfMonthCron)) return false;
  }
  
  // Check month (1-12 in cron, 0-11 in JS)
  if (monthCron !== '*') {
    if (!matchesCronPart(now.getMonth() + 1, monthCron)) return false;
  }
  
  // Check day of week (0-6 for both, 0 = Sunday)
  if (dayOfWeekCron !== '*') {
    if (!matchesCronPart(now.getDay(), dayOfWeekCron)) return false;
  }
  
  // Check interval-based expressions
  if (minuteCron.startsWith('*/')) {
    const interval = parseInt(minuteCron.slice(2), 10);
    if (now.getMinutes() % interval !== 0) return false;
  }
  
  if (hourCron.startsWith('*/')) {
    const interval = parseInt(hourCron.slice(2), 10);
    if (now.getHours() % interval !== 0) return false;
    // For hourly intervals, only run at minute 0
    if (minuteCron === '0' && now.getMinutes() !== 0) return false;
  }
  
  // Don't run again if we ran within the last minute
  if (lastRun) {
    const timeSinceLastRun = now.getTime() - lastRun.getTime();
    if (timeSinceLastRun < 60 * 1000) return false;
  }
  
  return true;
}

function matchesCronPart(value: number, cronPart: string): boolean {
  // Exact match
  if (cronPart === String(value)) return true;
  
  // Range (e.g., 1-5)
  if (cronPart.includes('-')) {
    const [start, end] = cronPart.split('-').map(Number);
    return value >= start && value <= end;
  }
  
  // List (e.g., 1,3,5)
  if (cronPart.includes(',')) {
    return cronPart.split(',').includes(String(value));
  }
  
  return false;
}

// Get the next run time (approximate)
export function getNextRunTime(cronExpression: string): Date {
  const interval = cronToInterval(cronExpression);
  const now = new Date();
  return new Date(now.getTime() + interval);
}

// Human-readable description of the schedule
export function describeSchedule(cronExpression: string): string {
  const parts = cronExpression.split(' ');
  if (parts.length !== 5) return 'Invalid schedule';
  
  const [minute, hour] = parts;
  
  if (minute === '*' && hour === '*') return 'Every minute';
  if (minute.startsWith('*/')) {
    const mins = parseInt(minute.slice(2), 10);
    return `Every ${mins} minute${mins > 1 ? 's' : ''}`;
  }
  if (minute === '0' && hour.startsWith('*/')) {
    const hours = parseInt(hour.slice(2), 10);
    return `Every ${hours} hour${hours > 1 ? 's' : ''}`;
  }
  if (minute === '0' && hour === '*') return 'Every hour';
  if (minute === '0' && !hour.includes('*')) {
    return `Daily at ${hour}:00`;
  }
  
  return cronExpression;
}

// Update last run time in database
export async function updateLastRun(brandId: string): Promise<void> {
  try {
    const collection = await getCollection(brandId, 'settings');
    await collection.updateOne(
      { key: 'schedulerLastRun' },
      { $set: { key: 'schedulerLastRun', value: new Date(), updatedAt: new Date() } },
      { upsert: true }
    );
  } catch (error) {
    console.error('Failed to update last run time:', error);
  }
}

// Get last run time from database
export async function getLastRunTime(brandId: string): Promise<Date | undefined> {
  try {
    const collection = await getCollection(brandId, 'settings');
    const result = await collection.findOne({ key: 'schedulerLastRun' });
    return result?.value ? new Date(result.value as Date) : undefined;
  } catch (error) {
    console.error('Failed to get last run time:', error);
    return undefined;
  }
}

// Get scheduler config from database
export async function getSchedulerConfig(brandId: string): Promise<SchedulerConfig> {
  try {
    const collection = await getCollection(brandId, 'settings');
    const agentConfig = await collection.findOne({ key: 'agentConfig' });
    const lastRunDoc = await collection.findOne({ key: 'schedulerLastRun' });
    
    const config = agentConfig?.value as Record<string, unknown> || {};
    const lastRun = lastRunDoc?.value ? new Date(lastRunDoc.value as Date) : undefined;
    
    return {
      enabled: config.enabled as boolean ?? true,
      cronSchedule: config.cronSchedule as string || '0 */6 * * *',
      lastRun,
      nextRun: getNextRunTime(config.cronSchedule as string || '0 */6 * * *'),
    };
  } catch (error) {
    console.error('Failed to get scheduler config:', error);
    return {
      enabled: true,
      cronSchedule: '0 */6 * * *',
    };
  }
}
