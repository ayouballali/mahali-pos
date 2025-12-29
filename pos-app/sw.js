/**
 * Service Worker for Mahali POS PWA
 * Enables offline functionality and app installation
 */

const CACHE_NAME = 'mahali-pos-v4';
const urlsToCache = [
    './',
    './index.html',
    './css/style.css',
    './js/app.js',
    './js/lib/preact.js',
    './js/lib/db.js',
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

// Install event - cache all essential files
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching files');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
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
        }).then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                return response || fetch(event.request);
            })
            .catch(() => {
                // If both cache and network fail, could return offline page
                console.log('Service Worker: Fetch failed for:', event.request.url);
            })
    );
});
