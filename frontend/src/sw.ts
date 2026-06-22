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
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      return (self as any).clients.claim();
    })
  );
});

// Fetch event: serve cached assets when offline or for speed
self.addEventListener('fetch', (event: any) => {
  const request = event.request;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // For API or RPC requests, always go network-only
  if (
    url.pathname.startsWith('/api') || 
    url.host.includes('rpc') || 
    url.host.includes('mainnet') || 
    url.host.includes('testnet') ||
    url.host.includes('infura') ||
    url.host.includes('alchemy')
  ) {
    return;
  }

  // Caching strategy:
  // For static assets, chess assets, and styles, use cache-first
  const isStaticAsset = 
    STATIC_ASSETS.includes(url.pathname) || 
    url.pathname.includes('/assets/') || 
    url.pathname.endsWith('.js') || 
    url.pathname.endsWith('.css') || 
    url.pathname.endsWith('.png') || 
    url.pathname.endsWith('.jpg') || 
    url.pathname.endsWith('.svg') || 
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.woff2');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Serve from cache, and update cache in the background
          fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
