/* ジグソーパズル: オフラインでも起動できるようにするための仕組み(サービスワーカー)
   ・ネットにつながるときは、毎回最新のファイルを読み込みます(GitHubで更新すると、次の起動で反映)。
   ・つながらないときは、前回読み込んだファイルで起動します。
   ・画像やパズルの保存データは端末の中(ブラウザ内)にあり、ここでは扱いません。 */
const CACHE = 'jigsaw-v4';
const FILES = ['./', './jigsaw.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }) /* ブラウザの一時保存(キャッシュ)を使わず、毎回GitHubに最新のファイルを確認します */
      .then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('./jigsaw.html')))
  );
});
