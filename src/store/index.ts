/**
 * Main Application Store
 * 
 * This is the main entry point for the application state.
 * It exports the API-based store which communicates with the backend server.
 * 
 * For backward compatibility, we keep the same export name (useStore)
 * but now it uses the API client instead of Firebase.
 */

export { useStore } from './apiStore';

/**
 * MIGRATION NOTE:
 * This file has been updated to use the API-based store (apiStore.ts).
 * The old Firebase-based store has been backed up to index.ts.old.
 * 
 * All components importing from '@/store' will now automatically use
 * the new API-based store with proper server integration.
 */
