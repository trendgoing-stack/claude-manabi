// Service Worker：アプリ本体と data/ の全 JSON をキャッシュファーストで返す（初回の読み込みの後は完全にオフラインで動く）。
// アプリのコードやデータを更新したら、必ず VERSION を上げる（data/meta.json の dataVersion と同じ値にする）。
// JS や CSS のファイルを足したら APP_SHELL にも足す（node tools/validate.mjs が抜けを検出する）。
const VERSION = '2026.10.13-2';
const CACHE = `clmanabi-${VERSION}`;

const APP_SHELL = [
  './',
  'index.html',
  'manifest.json',
  'css/base.css',
  'css/components.css',
  'css/views.css',
  'js/ai-prompt.js',
  'js/app.js',
  'js/clipboard.js',
  'js/date.js',
  'js/dict-kinds.js',
  'js/dom.js',
  'js/freshness.js',
  'js/io.js',
  'js/loader.js',
  'js/parts.js',
  'js/quiz.js',
  'js/review.js',
  'js/router.js',
  'js/search.js',
  'js/state.js',
  'js/storage.js',
  'js/term-index.js',
  'js/terms.js',
  'js/types.js',
  'js/render/badges.js',
  'js/render/code.js',
  'js/render/figure.js',
  'js/render/lesson.js',
  'js/render/text.js',
  'js/ui/ask-ai.js',
  'js/ui/dialog.js',
  'js/ui/term.js',
  'js/ui/toast.js',
  'js/views/cards.js',
  'js/views/dict.js',
  'js/views/glossary.js',
  'js/views/help.js',
  'js/views/home.js',
  'js/views/learn.js',
  'js/views/quiz.js',
  'js/views/records.js',
  'js/views/settings.js',
  'js/views/stale.js',
  'js/views/term.js',
  'js/views/try.js',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
];

// HTTP キャッシュを経由せず、必ずサーバーから取り直す
const fresh = (url) => new Request(url, { cache: 'reload' });

/** meta.json に書かれた data/ のファイル */
const dataFiles = (meta) => [meta.glossaryFile, meta.tryFile, ...(meta.textFiles ?? []), ...(meta.quizFiles ?? []), ...(meta.dictFiles ?? [])].filter(Boolean).map((f) => `data/${f}`);

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const metaRes = await fetch(fresh('data/meta.json'));
      const meta = await metaRes.clone().json();
      await cache.put('data/meta.json', metaRes);
      await cache.addAll([...APP_SHELL, ...dataFiles(meta)].map(fresh));
      // skipWaiting はしない。画面の更新バナーをタップしたときだけ切り替える
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith('clmanabi-') && k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (!url.href.startsWith(self.registration.scope)) return;
  // 開発用ツールと sw.js 自体はキャッシュしない
  const path = url.href.slice(self.registration.scope.length);
  if (path.startsWith('tools/') || path.startsWith('sw.js')) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(req, { ignoreSearch: true });
      if (hit) return hit;
      if (req.mode === 'navigate') {
        const shell = await cache.match('index.html');
        if (shell) return shell;
      }
      return fetch(req);
    })(),
  );
});
