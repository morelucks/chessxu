/* eslint-disable @typescript-eslint/no-explicit-any */
// Service worker for offline support
const CACHE_NAME = 'chessxu-cache-v1';

// Static assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
