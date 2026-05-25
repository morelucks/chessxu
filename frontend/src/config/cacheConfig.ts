/**
 * Cache Configuration
 * Settings for game history caching and synchronization
 */

export const CACHE_VERSION = 1;
export const MAX_CACHE_SIZE = 1000;
export const SYNC_INTERVAL = 3600000; // 1 hour
export const AUTO_SYNC_ENABLED = true;
export const OFFLINE_MODE_ENABLED = true;

// Cache retention policy
export const CACHE_RETENTION_DAYS = 30;
export const MAX_GAMES_PER_SYNC = 50;
export const BATCH_SIZE = 10;

// Performance settings
export const ENABLE_COMPRESSION = false;
export const ENABLE_BACKGROUND_SYNC = true;
export const DEBOUNCE_SYNC_MS = 5000;
