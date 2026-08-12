const CACHE = 'liuheng-workbench-v3-shell-20260812-1';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './offline.html',
  './assets/app-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('liuheng-workbench-v3-shell-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  // 云端台账、潮汐、天气等 API 始终走网络，不写入离线缓存。
  if (url.origin !== self.location.origin || url.pathname.includes('/api/')) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => response).catch(() => caches.match('./offline.html')));
    return;
  }
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    const copy = response.clone();
    if (response.ok) caches.open(CACHE).then(cache => cache.put(request, copy));
    return response;
  }).catch(() => caches.match('./offline.html'))));
});

