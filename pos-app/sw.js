/**
 * Service Worker - Placeholder for Day 8
 * Will be implemented for offline support
 */

// Version
const CACHE_VERSION = 'v1';

self.addEventListener('install', (event) => {
    console.log('Service Worker: Installed');
    // Skip waiting to activate immediately
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activated');
});

// Placeholder for caching strategy (to be implemented in Day 8)
self.addEventListener('fetch', (event) => {
    // For now, just pass through to network
    event.respondWith(fetch(event.request));
});
