// localStorage の読み書きはここに集約する。画面側から localStorage を直接触らない。
// 学習記録は端末内にだけ保存し、外部へは送信しない。

export const PREFIX = 'clmanabi:';
export const STORAGE_SCHEMA = 1;
export const MEMO_MAX = 2000;

/** @type {import('./types.js').Settings} */
export const DEFAULT_SETTINGS = {
  fontSize: 'normal',
  learnMode: 'detail',
  staleDays: 90,
  aiMode: 'explain',
};

const cache = new Map();
let onWriteError = () => {};

/** 書き込み失敗（容量超過など）時に呼ぶ関数を登録する */
export function setWriteErrorHandler(fn) {
  onWriteError = fn;
}

function read(key, fallback) {
  if (cache.has(key)) return cache.get(key);
  let value = fallback;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw != null) value = JSON.parse(raw);
  } catch {
    // 壊れた値や読み取り不可は初期値で続行する
  }
  cache.set(key, value);
  return value;
}

function write(key, value) {
  cache.set(key, value);
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch (e) {
    onWriteError(e);
    return false;
  }
}

function remove(key) {
  cache.delete(key);
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // 無視
  }
}

/** 起動時に1回呼ぶ。スキーマバージョンの記録と、将来のマイグレーションの入口 */
export function init() {
  const v = read('schema', null);
  if (v == null) write('schema', STORAGE_SCHEMA);
  // v < STORAGE_SCHEMA のときはここで順に変換する（現在は v1 のみ）
  if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});
}

// ---- 設定 ----

/** @returns {import('./types.js').Settings} */
export const getSettings = () => ({ ...DEFAULT_SETTINGS, ...read('settings', {}) });

/** @param {Partial<import('./types.js').Settings>} patch */
export const saveSettings = (patch) => write('settings', { ...getSettings(), ...patch });

// ---- 読んだ節・最終閲覧 ----

/** @returns {Object<string, number>} 節 id → 読んだ時刻 */
export const getRead = () => read('read', {});

export function setRead(sectionId, done) {
  const m = { ...getRead() };
  if (done) m[sectionId] = Date.now();
  else delete m[sectionId];
  return write('read', m);
}

/** @returns {{last:string|null, at:Object<string, number>}} 最後に開いた節と、節ごとの最終閲覧時刻 */
export const getLastView = () => ({ last: null, at: {}, ...read('lastView', {}) });

export function touchSection(sectionId) {
  const v = getLastView();
  return write('lastView', { last: sectionId, at: { ...v.at, [sectionId]: Date.now() } });
}

// ---- クイズの回答記録（問題 id → 正解数・不正解数・最終回答日時） ----

/** @returns {Object<string, {ok:number, ng:number, last:number, lastOk:boolean}>} */
export const getAnswers = () => read('answers', {});

export function recordAnswer(questionId, correct) {
  const m = { ...getAnswers() };
  const p = m[questionId] ?? { ok: 0, ng: 0, last: 0 };
  m[questionId] = { ok: p.ok + (correct ? 1 : 0), ng: p.ng + (correct ? 0 : 1), last: Date.now(), lastOk: !!correct };
  return write('answers', m);
}

// ---- 中断中のクイズ ----

export const getQuizSession = () => read('quizSession', null);
export const saveQuizSession = (s) => write('quizSession', s);
export const clearQuizSession = () => remove('quizSession');

// ---- 暗記カード（カード id → 状態） ----

/** @returns {Object<string, {state:'ok'|'ng', due:string|null, at:number}>} カード id（g:用語id／d:辞典id）→ 状態 */
export const getCards = () => read('cards', {});

export function recordCard(cardId, state, due) {
  return write('cards', { ...getCards(), [cardId]: { state, due, at: Date.now() } });
}

// ---- やってみよう（課題 id → 完了日時・メモ） ----

/** @returns {Object<string, {doneAt:number|null, memo:string}>} */
export const getTry = () => read('try', {});

export function saveTry(taskId, patch) {
  const m = { ...getTry() };
  const next = { doneAt: null, memo: '', ...m[taskId], ...patch };
  next.memo = String(next.memo ?? '').slice(0, MEMO_MAX);
  if (!next.doneAt && !next.memo) delete m[taskId];
  else m[taskId] = next;
  return write('try', m);
}

// ---- その他 ----

export const getMeta = () => read('meta', {});
export const saveMeta = (patch) => write('meta', { ...getMeta(), ...patch });

// ---- バックアップ（エクスポート／インポート。形式の検証は io.js） ----

/** バックアップに含めるデータ。中断中のクイズは端末固有なので含めない */
export function exportRaw() {
  return {
    settings: getSettings(),
    read: getRead(),
    lastView: getLastView(),
    answers: getAnswers(),
    cards: getCards(),
    try: getTry(),
  };
}

/** 検証済みのデータをまとめて書き込む @returns {boolean} すべて書き込めたか */
export function importRaw(data) {
  let ok = true;
  if (data.settings) ok = write('settings', { ...DEFAULT_SETTINGS, ...data.settings }) && ok;
  for (const key of ['read', 'lastView', 'answers', 'cards', 'try']) ok = write(key, data[key]) && ok;
  return ok;
}

/** このアプリのキーをすべて削除する */
export function clearAll() {
  cache.clear();
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(PREFIX)) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {
    // 無視
  }
}
