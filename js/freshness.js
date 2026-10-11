// 情報の鮮度：checkedAt（公式情報で確認した日）から設定の日数を超えたものを「古い可能性がある」とする
import { today, diffDays } from './date.js';
import { getSettings } from './storage.js';

/** 確認日からの経過日数。日付が不正なら Infinity */
export function ageDays(checkedAt, now = today()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checkedAt ?? '')) return Infinity;
  return diffDays(checkedAt, now);
}

/** @param {string} checkedAt */
export const isStale = (checkedAt, days = getSettings().staleDays) => ageDays(checkedAt) > days;

/** 「2026年10月12日」形式 */
export function formatDate(ymd) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd ?? '');
  return m ? `${m[1]}年${Number(m[2])}月${Number(m[3])}日` : '不明';
}
