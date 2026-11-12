/* ツッコミ写真館 Service Worker（PWAのオフライン対応）
   ゲームのシェル（HTML・ロゴ・アイコン）だけをキャッシュする。
   写真は index.html に base64 で埋め込まれているので、シェルを
   キャッシュすればオフラインでも遊べる。 */
var CACHE = 'tsukkomi-v2';
var SHELL = [
  './',
  'index.html',
  'logo-1.png',
  'icon-192.png',
  'icon-512.png',
  'apple-touch-icon.png',
  'manifest.json',
  'privacy.html'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(SHELL); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (ks) {
        return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(function (hit) {
      var update = fetch(e.request).then(function (res) {
        if (res && res.ok && new URL(e.request.url).origin === self.location.origin) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        }
        return res;
      });
      if (hit) {
        /* stale-while-revalidate：キャッシュを即返し、裏で更新する */
        update.catch(function () {});
        return hit;
      }
      return update.catch(function () {
        if (e.request.mode === 'navigate') return caches.match('index.html');
        return new Response('', { status: 504 });
      });
    })
  );
});
