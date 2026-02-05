/**
 * Agent Worker Initialization
 * 
 * This module initializes the internal agent worker on app startup.
 * It should be imported once at the app root level.
 */

import { initializeWorker } from './worker';

// Track if already initialized
let initialized = false;

export async function initAgentWorker() {
  if (initialized) {
    return;
  }

  // Only initialize on server side
  if (typeof window !== 'undefined') {
    return;
  }

  initialized = true;
  
  // Initialize asynchronously to not block app startup
  setImmediate(async () => {
    try {
      await initializeWorker();
    } catch (error) {
      console.error('[AgentInit] Failed to initialize worker:', error);
    }
  });
}

// Auto-initialize when this module is imported on the server
if (typeof window === 'undefined') {
  initAgentWorker().catch(console.error);
}
