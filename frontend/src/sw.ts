/* eslint-disable @typescript-eslint/no-explicit-any */
// Progressive Web App Offline Service Worker Implementation
// This service worker enables offline capability for Chessxu.
// It works in tandem with the offline-first IndexedDB database.
// Goals:
// 1. Cache static assets such as HTML, JS, CSS, and main assets.
// 2. Cache chess specific images used across game screens.
// 3. Cache styles and styling files.
// 4. Bypass dynamic API/RPC endpoints.
// 5. Provide offline fallback for client-side routing.
// Lifecycle steps:
// - Install: Pre-cache core shell resources.
// - Activate: Clean up outdated caches from previous versions.
// - Fetch: Intercept requests, serve from cache or network.
// Define Cache Name for versioning
// Static shell assets listing
// Include root, index.html, favicon, and chess images
// Chess hero background image
// Chess king image
// Chess knight image
// Chess queen image
// Chess rook image
// Set up install event listener
