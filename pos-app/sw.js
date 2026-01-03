/**
 * Service Worker for Mahali POS PWA
 * Uses Network-First strategy for app files to ensure users always get latest version
 * Falls back to cache when offline
 */

const CACHE_NAME = 'mahali-pos-v12';
const urlsToCache = [
    './',
    './index.html',
    './css/style.css',
    './js/app.js',
    './js/lib/preact.js',
    './js/lib/db.js',
    './js/lib/scanner.js',
    './js/utils/helpers.js',
    './js/data/mockData.js',
    './js/hooks/useProducts.js',
    './js/hooks/useProductSearch.js',
    './js/components/Icons.js',
    './js/components/BottomNav.js',
    './js/components/HomeTab.js',
    './js/components/ProductsTab.js',
    './js/components/SellTab.js',
    './js/components/ReportsTab.js',
    './js/components/AddProductTab.js',
    './js/components/ConfirmDialog.js',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png'
];

// Files that should use network-first strategy (always get latest)
const networkFirstPatterns = [
    /\.html$/,
    /\.css$/,
    /\.js$/,
    /\.json$/
];

// Check if URL should use network-first strategy
const shouldNetworkFirst = (url) => {
    return networkFirstPatterns.some(pattern => pattern.test(url));
};

// Install event - cache all essential files
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing v12...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching files');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('Service Worker: Skip waiting, activating immediately');
                return self.skipWaiting();
            })
    );
});

// Activate event - clean up ALL old caches and take control immediately
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating v10...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker: Claiming all clients');
            return self.clients.claim();
        }).then(() => {
            // Notify all clients to reload for the new version
            return self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({ type: 'SW_UPDATED', version: CACHE_NAME });
                });
            });
        })
    );
});

// Fetch event - Network First for app files, Cache First for static assets
self.addEventListener('fetch', (event) => {
    const url = event.request.url;

    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Network-First strategy for HTML, CSS, JS, JSON files
    if (shouldNetworkFirst(url)) {
        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    // Got network response, update cache and return it
                    if (networkResponse && networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return networkResponse;
                })
                .catch(() => {
                    // Network failed, try cache
                    console.log('Service Worker: Network failed, serving from cache:', url);
                    return caches.match(event.request);
                })
        );
        return;
    }

    // Cache-First strategy for static assets (images, icons, etc.)
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                // Not in cache, fetch from network
                return fetch(event.request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return networkResponse;
                });
            })
            .catch(() => {
                console.log('Service Worker: Fetch failed for:', url);
            })
    );
});

// Listen for skip waiting message from client
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
