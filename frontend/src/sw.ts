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
// Open target cache and add all static assets
// Skip waiting to activate immediately
// Set up activate event listener
// Retrieve all cache keys
// Delete any cache that doesn't match current CACHE_NAME
// Claim clients to start controlling them immediately
// Set up fetch event listener
// Filter request method to only handle GET requests
// Filter request destination to bypass API and RPC nodes
// Avoid caching third party RPC networks
// Bypass Alchemy RPC endpoint
// Bypass Infura RPC endpoint
// Bypass Celo mainnet/testnet RPC endpoints
// Bypass Stacks mainnet/testnet RPC endpoints
// Determine if request is for a static asset
// Check if URL is in static assets list
// Check if URL path includes compiled assets
// Check if file extension is .js
// Check if file extension is .css
// Check if file extension is .png
// Check if file extension is .jpg
// Check if file extension is .svg
// Check if file extension is .ico
// Check if file extension is .woff
// Check if file extension is .woff2
// Caching strategy: Cache-First for static assets
// Serve from cache if available
// If cache hit, update cache in background
// If cache miss, fetch from network
// Cache successful network responses
// Clone response before saving to cache
// Handle network failure offline
// Fallback to index.html for navigation requests when offline
// Caching strategy: Network-First for documents and routes
// Fetch from network first
// If network successful, update cache
