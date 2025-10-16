const CACHE_NAME = 'empower-checkin-pwa-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/assets/js/main4ta.js',
    '/assets/css/style4ta.css',
    '/assets/image/empower_logo.webp',
    '/assets/image/power_by.webp',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/jsqr@1.3.1/dist/jsQR.min.js'
];

// Instalar el Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Cache abierto');
                // Usar cache.add() en lugar de cache.addAll() para manejar errores individualmente
                return Promise.all(
                    urlsToCache.map(url => {
                        return cache.add(url).catch(error => {
                            console.log(`Error cacheando ${url}:`, error);
                            // Continuar aunque falle algún recurso
                        });
                    })
                );
            })
    );
});

// Interceptar las solicitudes de red
self.addEventListener('fetch', (event) => {
    // Solo manejar solicitudes GET
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Devolver desde cache si existe
                if (response) {
                    return response;
                }

                // Si no está en cache, hacer fetch y cachear
                return fetch(event.request)
                    .then((fetchResponse) => {
                        // Verificar si la respuesta es válida
                        if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
                            return fetchResponse;
                        }

                        // Clonar la respuesta
                        const responseToCache = fetchResponse.clone();

                        // Agregar a cache
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return fetchResponse;
                    })
                    .catch((error) => {
                        console.log('Error en fetch:', error);
                        // Podrías devolver una página offline personalizada aquí
                    });
            })
    );
});

// Activar el Service Worker y limpiar caches antiguos
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Eliminando cache antiguo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});