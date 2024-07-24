const CACHE_NAME = 'chemistry-demo-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/style.css',
    '/static/js/lensImaging.js',
    '/static/js/magneticField.js',
    '/static/js/staticElectricity.js',
    '/static/js/heatConduction.js',
    '/static/js/convection.js',
    '/static/js/colorChangeReaction.js',
    '/static/js/volcanicEruption.js',
    '/static/js/dryIceSublimation.js',
    '/static/js/lightPolarization.js',
    '/static/js/blackbodyRadiation.js',
    '/static/js/main.js'
];

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                if (response) {
                    return response;  // 如果在缓存中找到响应，则返回它
                }
                return fetch(event.request);  // 否则从网络请求
            }
        )
    );
});

self.addEventListener('activate', function(event) {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});