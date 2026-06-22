/* eslint-disable @typescript-eslint/no-explicit-any */
// Service worker for offline support
const CACHE_NAME = 'chessxu-cache-v1';

// Static assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.png',
  '/chess-hero-bg.jpg',
  '/chess-king.jpg',
  '/chess-knight.jpg',
  '/chess-queen.jpg',
  '/chess-rook.jpg',
];

// Install event: cache static assets
self.addEventListener('install', (event: any) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      return (self as any).skipWaiting();
    })
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', (event: any) => {
  event.waitUntil(
