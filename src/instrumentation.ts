/**
 * Next.js Instrumentation
 * 
 * This file is automatically loaded by Next.js when the app starts.
 * We use it to initialize the internal agent worker.
 */

export async function register() {
  // Only run on server side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[Instrumentation] Starting agent worker...');
    
    // Dynamically import to avoid issues with client-side code
    const { initializeWorker } = await import('@/lib/agents/worker');
    
    // Initialize the worker
    await initializeWorker();
  }
}
