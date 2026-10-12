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

/** sw.js の VERSION をアプリのバージョンとして表示する（sw.js はフェーズ4で追加） */
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
