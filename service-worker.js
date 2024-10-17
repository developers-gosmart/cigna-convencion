const CACHE_NAME = 'qr-pwa-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/main.js',
    '/style.css',
];

// Instalar el Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(urlsToCache);
            })
    );
});

// Interceptar las solicitudes de red
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                return response || fetch(event.request);
            })
    );
});
