// 学習記録のエクスポート／インポート。データは端末内で完結し、外部へは送信しない。
// Safari で開いた場合とホーム画面から起動した場合で保存場所が別になるため、ここで移せるようにする。
import * as storage from './storage.js';
import { app } from './state.js';
import { localDate } from './date.js';

const APP_ID = 'clmanabi';
const isObj = (v) => v != null && typeof v === 'object' && !Array.isArray(v);
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** バックアップの JSON 文字列を作る（スキーマバージョン付き） */
export function buildExport() {
  return JSON.stringify({
    app: APP_ID,
    type: 'backup',
    schemaVersion: storage.STORAGE_SCHEMA,
    exportedAt: new Date().toISOString(),
    dataVersion: app.data.meta?.dataVersion ?? null,
    data: storage.exportRaw(),
  });
}

export const exportFileName = () => `claude-manabi-backup-${localDate()}.json`;

export const markExported = () => storage.saveMeta({ lastExportAt: Date.now() });

/**
 * 共有シート（Web Share API の files）で渡す。iPhone では「ファイルに保存」などを選べる
 * @returns {Promise<'shared'|'cancelled'|'unavailable'>}
 */
export async function shareExport(text) {
  const file = new File([text], exportFileName(), { type: 'application/json' });
  if (!navigator.canShare?.({ files: [file] })) return 'unavailable';
  try {
    await navigator.share({ files: [file] });
    return 'shared';
  } catch (e) {
    return e?.name === 'AbortError' ? 'cancelled' : 'unavailable';
  }
}

/** ダウンロードで保存する（PC のブラウザ向け） */
export function downloadExport(text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = exportFileName();
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/**
 * インポートするテキストを検証する。不正なら Error を投げる（この時点では何も変更しない）
 * @returns {ReturnType<typeof storage.exportRaw>}
 */
export function parseImport(text) {
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('JSON として読み取れません');
  }
  if (!isObj(json) || json.app !== APP_ID || json.type !== 'backup') throw new Error('このアプリのバックアップではありません');
  if (!Number.isInteger(json.schemaVersion) || json.schemaVersion < 1) throw new Error('スキーマバージョンがありません');
  if (json.schemaVersion > storage.STORAGE_SCHEMA) throw new Error('新しいバージョンのアプリで作られたバックアップです。アプリを更新してから取り込んでください');
  const d = json.data;
  if (!isObj(d)) throw new Error('データの形が正しくありません');

  if (d.settings != null && !isObj(d.settings)) throw new Error('設定が不正です');
  const read = d.read ?? {};
  if (!isObj(read) || !Object.values(read).every(isNum)) throw new Error('「読んだ」の記録が不正です');
  const lastView = d.lastView ?? { last: null, at: {} };
  if (!isObj(lastView) || !(lastView.last == null || typeof lastView.last === 'string') || !isObj(lastView.at ?? {}) || !Object.values(lastView.at ?? {}).every(isNum)) {
    throw new Error('最終閲覧の記録が不正です');
  }
  const answers = d.answers ?? {};
  if (!isObj(answers) || !Object.entries(answers).every(([, a]) => isObj(a) && Number.isInteger(a.ok) && a.ok >= 0 && Number.isInteger(a.ng) && a.ng >= 0 && isNum(a.last) && (a.lastOk == null || typeof a.lastOk === 'boolean'))) {
    throw new Error('クイズの回答記録が不正です');
  }
  const cards = d.cards ?? {};
  if (!isObj(cards) || !Object.values(cards).every((c) => isObj(c) && ['ok', 'ng'].includes(c.state) && (c.due == null || DATE_RE.test(c.due)) && isNum(c.at))) {
    throw new Error('暗記カードの記録が不正です');
  }
  const tries = d.try ?? {};
  if (!isObj(tries) || !Object.values(tries).every((t) => isObj(t) && (t.doneAt == null || isNum(t.doneAt)) && typeof (t.memo ?? '') === 'string' && (t.memo ?? '').length <= storage.MEMO_MAX)) {
    throw new Error('やってみよう の記録が不正です');
  }
  return { settings: d.settings ?? null, read, lastView: { last: lastView.last ?? null, at: lastView.at ?? {} }, answers, cards, try: tries };
}

/** 統合：項目ごとに新しい側を採用する。設定はこの端末の値を保つ */
export function mergeData(local, incoming) {
  const read = { ...local.read };
  for (const [id, ts] of Object.entries(incoming.read)) read[id] = Math.max(read[id] ?? 0, ts);

  const at = { ...local.lastView.at };
  for (const [id, ts] of Object.entries(incoming.lastView.at)) at[id] = Math.max(at[id] ?? 0, ts);
  const lastOf = (v) => (v.last ? v.at[v.last] ?? 0 : 0);
  const last = lastOf(incoming.lastView) > lastOf(local.lastView) ? incoming.lastView.last : local.lastView.last;

  // 回答記録は、同じバックアップを取り込み直しても二重に数えないよう、最後に答えた日時が新しい側を採用する
  const answers = { ...local.answers };
  for (const [id, a] of Object.entries(incoming.answers)) if (!answers[id] || a.last > answers[id].last) answers[id] = a;

  const cards = { ...local.cards };
  for (const [id, c] of Object.entries(incoming.cards)) if (!cards[id] || c.at > cards[id].at) cards[id] = c;

  const tries = { ...local.try };
  for (const [id, t] of Object.entries(incoming.try)) {
    const l = tries[id];
    if (!l) tries[id] = t;
    else tries[id] = { doneAt: l.doneAt || t.doneAt ? Math.max(l.doneAt ?? 0, t.doneAt ?? 0) : null, memo: l.memo || t.memo || '' };
  }
  return { settings: null, read, lastView: { last, at }, answers, cards, try: tries };
}

/**
 * @param {string} text
 * @param {'merge'|'replace'} mode
 * @returns {{read:number, answers:number}} 取り込み後の件数
 */
export function importData(text, mode) {
  const incoming = parseImport(text); // 不正ならここで例外。ここまでは何も書き込まない
  const next = mode === 'merge' ? mergeData(storage.exportRaw(), incoming) : incoming;
  if (mode === 'replace') storage.clearQuizSession();
  if (!storage.importRaw(next)) throw new Error('保存できませんでした（端末の空き容量が足りない可能性があります）');
  return { read: Object.keys(next.read).length, answers: Object.keys(next.answers).length };
}
