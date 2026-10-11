// データの読み込み。meta.json を先に読み、画面が必要とする種類を優先して取得し、残りは後から読む。
// 1ファイルが失敗しても残りで動かし、失敗したファイル名を app.data.failed に記録する。
import { app } from './state.js';

/** @typedef {'texts'|'glossary'|'quiz'|'dict'|'try'} Kind */

const getJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
};

// 開発・実機確認用：?fixture=1 で tools/fixture/data/ のテストデータを読む（TESTING.md の鮮度の警告など）
const BASE = new URLSearchParams(location.search).has('fixture') ? 'tools/fixture/data/' : 'data/';

/** @type {Map<Kind, Promise<void>>} */
const pending = new Map();

/** 種類ごとの読み込み方。files は data/ からの相対パス、put は成功したファイルを app.data に入れる */
const KINDS = {
  texts: {
    files: (m) => m.textFiles ?? [],
    ok: (j) => Array.isArray(j?.sections),
    put: (list) => {
      app.data.texts = list.sort((a, b) => a.order - b.order);
    },
  },
  glossary: {
    files: (m) => (m.glossaryFile ? [m.glossaryFile] : []),
    ok: (j) => Array.isArray(j?.terms),
    put: ([g]) => {
      app.data.glossary = g?.terms ?? [];
      app.data.termById = new Map(app.data.glossary.map((t) => [t.id, t]));
    },
  },
  quiz: {
    files: (m) => m.quizFiles ?? [],
    ok: (j) => Array.isArray(j?.questions),
    put: (list) => {
      app.data.quiz = list.flatMap((f) => f.questions);
    },
  },
  dict: {
    files: (m) => m.dictFiles ?? [],
    ok: (j) => Array.isArray(j?.items),
    put: (list) => {
      app.data.dict = list.flatMap((f) => f.items);
      app.data.dictById = new Map(app.data.dict.map((d) => [d.id, d]));
    },
  },
  try: {
    files: (m) => (m.tryFile ? [m.tryFile] : []),
    ok: (j) => Array.isArray(j?.tasks),
    put: ([t]) => {
      app.data.tasks = t?.tasks ?? [];
    },
  },
};

export const ALL_KINDS = /** @type {Kind[]} */ (Object.keys(KINDS));

/** meta.json を読む。失敗したら false */
export async function loadMeta() {
  try {
    app.data.meta = await getJson(`${BASE}meta.json`);
    return true;
  } catch {
    app.data.failed.push('meta.json');
    return false;
  }
}

/** @param {Kind} kind */
function loadKind(kind) {
  if (!pending.has(kind)) {
    const k = KINDS[kind];
    const files = app.data.meta ? k.files(app.data.meta) : [];
    const p = Promise.allSettled(files.map((f) => getJson(`${BASE}${f}`))).then((results) => {
      const okList = [];
      results.forEach((r, i) => {
        if (r.status === 'fulfilled' && k.ok(r.value)) okList.push(r.value);
        else app.data.failed.push(files[i]);
      });
      k.put(okList);
      app.data.loaded.add(kind);
    });
    pending.set(kind, p);
  }
  return pending.get(kind);
}

/** 指定した種類がそろうまで待つ @param {Kind[]} kinds */
export const ensure = (kinds) => Promise.all(kinds.map(loadKind));

export const isLoaded = (kinds) => kinds.every((k) => app.data.loaded.has(k));
