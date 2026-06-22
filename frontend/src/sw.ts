/* eslint-disable @typescript-eslint/no-explicit-any */
// Progressive Web App Offline Service Worker Implementation
// This service worker enables offline capability for Chessxu.
// It works in tandem with the offline-first IndexedDB database.
// Goals:
// 1. Cache static assets such as HTML, JS, CSS, and main assets.
// 2. Cache chess specific images used across game screens.
// 3. Cache styles and styling files.
// 4. Bypass dynamic API/RPC endpoints.
