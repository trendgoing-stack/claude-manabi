// 起動処理
import * as storage from './storage.js';
import { loadMeta, ensure, isLoaded, ALL_KINDS } from './loader.js';
import { route, start, render, parseHash } from './router.js';
import { app } from './state.js';
import { h } from './dom.js';
import { toast } from './ui/toast.js';
import { homeView } from './views/home.js';
import { learnView } from './views/learn.js';
import { termView } from './views/term.js';
import { staleView } from './views/stale.js';
import { settingsView } from './views/settings.js';
import { helpView } from './views/help.js';
import { glossaryView } from './views/glossary.js';
import { quizView } from './views/quiz.js';
import { recordsView } from './views/records.js';
import { dictView } from './views/dict.js';
import { cardsView } from './views/cards.js';
import { tryView } from './views/try.js';
import { initAskAi } from './ui/ask-ai.js';

// ルート名 → 下部タブ
const TAB_OF = {
  home: 'home',
  learn: 'learn', dict: 'learn', terms: 'learn', term: 'learn', cards: 'learn',
  quiz: 'quiz', try: 'quiz',
  records: 'records', stale: 'records',
  settings: 'settings', help: 'settings',
};
// 出題中はタブバーを隠し、Service Worker の更新もかけない
const BUSY_ROUTES = new Set(['quiz-run']);
const busyName = () => {
  const { name, params } = parseHash();
  return name === 'quiz' && params[0] === 'run' ? 'quiz-run' : name;
};

function applySettings() {
  document.documentElement.dataset.font = storage.getSettings().fontSize;
}

function onRouteChange(name) {
  const tab = TAB_OF[name];
  for (const a of document.querySelectorAll('#tabbar a')) {
    if (a.dataset.tab === tab) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  }
  document.body.classList.toggle('is-busy', BUSY_ROUTES.has(busyName()));
  applySettings();
  showUpdateBanner();
}

// ---- Service Worker ----

let waitingWorker = null;

/** 新しい版があれば「更新があります」を出す。クイズの出題中には出さない */
function showUpdateBanner() {
  const banner = document.getElementById('update-banner');
  banner.hidden = !waitingWorker || BUSY_ROUTES.has(busyName());
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  // 開発中（localhost）はキャッシュが邪魔になるので登録しない。?sw=1 を付けたときだけ有効にする
  const isLocal = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  if (isLocal && !new URLSearchParams(location.search).has('sw')) {
    for (const reg of await navigator.serviceWorker.getRegistrations()) reg.unregister();
    return;
  }
  try {
    const reg = await navigator.serviceWorker.register('./sw.js', { scope: './' });
    const track = (worker) => {
      if (!worker) return;
      const check = () => {
        // 既に制御中のワーカーがいる状態で installed になったものが「更新」
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          waitingWorker = worker;
          showUpdateBanner();
        }
      };
      worker.addEventListener('statechange', check);
      check();
    };
    track(reg.waiting);
    reg.addEventListener('updatefound', () => track(reg.installing));

    let reloading = false;
    // 新しいワーカーは waiting で待たせ、バナーのタップでだけ切り替える
    document.getElementById('update-banner').addEventListener('click', () => {
      const w = waitingWorker;
      if (!w) return;
      // 新しいワーカーが有効になったら再読み込みする（controllerchange が届かない環境の備え）
      w.addEventListener('statechange', () => {
        if (w.state === 'activated' && !reloading) {
          reloading = true;
          location.reload();
        }
      });
      w.postMessage({ type: 'SKIP_WAITING' });
    });
    // 初回インストール時の controllerchange では再読み込みしない
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloading || !hadController) return;
      reloading = true;
      location.reload();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') reg.update().catch(() => {});
    });
  } catch {
    // file:// や非対応環境では何もしない
  }
}

/**
 * 画面が必要とするデータがそろってから描く。まだなら「読み込み中」を出し、そろったら描き直す。
 * @param {import('./loader.js').Kind[]} kinds
 * @param {import('./router.js').View} view
 */
const needs = (kinds, view) => (root, params) => {
  if (isLoaded(kinds)) return view(root, params);
  const hash = location.hash;
  root.append(h('p', { class: 'muted center' }, '読み込み中…'));
  ensure(kinds).then(() => {
    if (location.hash === hash) render();
  });
  return undefined;
};

/** 現在のルートが先に必要とするデータ */
const ROUTE_NEEDS = {
  home: ['texts', 'glossary', 'quiz', 'dict'],
  dict: ['texts', 'glossary', 'dict'],
  cards: ['texts', 'glossary', 'dict'],
  try: ['texts', 'glossary', 'try'],
  learn: ['texts', 'glossary', 'quiz', 'dict', 'try'],
  term: ['texts', 'glossary'],
  terms: ['texts', 'glossary'],
  quiz: ['texts', 'glossary', 'quiz'],
  records: ['texts', 'quiz', 'dict', 'try'],
  stale: ['texts', 'dict'],
  settings: ALL_KINDS,
};

/** sw.js の VERSION をアプリのバージョンとして表示する */
async function readAppVersion() {
  try {
    const res = await fetch('./sw.js');
    if (!res.ok) return '';
    return (await res.text()).match(/const VERSION = '([^']+)'/)?.[1] ?? '';
  } catch {
    return '';
  }
}

async function main() {
  storage.setWriteErrorHandler(() => toast('保存できませんでした。端末の空き容量を確認してください', { error: true, ms: 6000 }));
  storage.init();
  applySettings();

  const [metaOk, version] = await Promise.all([loadMeta(), readAppVersion()]);
  app.version = version || app.data.meta?.dataVersion || '';

  const n = (k) => ROUTE_NEEDS[k] ?? [];
  route('home', needs(n('home'), homeView));
  route('learn', needs(n('learn'), learnView));
  route('dict', needs(n('dict'), dictView));
  route('terms', needs(n('terms'), glossaryView));
  route('term', needs(n('term'), termView));
  route('cards', needs(n('cards'), cardsView));
  route('quiz', needs(n('quiz'), quizView));
  route('try', needs(n('try'), tryView));
  route('records', needs(n('records'), recordsView));
  route('stale', needs(n('stale'), staleView));
  route('settings', needs(n('settings'), settingsView));
  route('help', helpView);

  if (metaOk) await ensure(ROUTE_NEEDS[parseHash().name] ?? []);
  start(onRouteChange);
  initAskAi();
  registerServiceWorker();
  if (metaOk) {
    // 残りは後から読む
    ensure(ALL_KINDS).then(() => {
      if (app.data.failed.length) toast(`読み込めなかったデータ：${app.data.failed.join('、')}`, { error: true, ms: 6000 });
    });
  } else {
    toast('データ（meta.json）を読み込めませんでした。通信できる状態で再読み込みしてください', { error: true, ms: 8000 });
  }
}

main();
