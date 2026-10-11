// 使える場所・提供状況・確認日・鮮度の警告・公式ドキュメントのリンク（節と辞典の項目で共通）
import { h } from '../dom.js';
import { isStale, formatDate, ageDays } from '../freshness.js';
import { getSettings } from '../storage.js';

export const SURFACE_LABEL = { web: 'Web', desktop: 'デスクトップ', mobile: 'モバイル', cli: 'CLI', ide: 'IDE', chrome: 'Chrome拡張' };
export const STATUS_LABEL = { ga: '一般提供', beta: 'ベータ', preview: 'プレビュー', deprecated: '提供終了予定' };
export const VERIFY_LABEL = { unverified: '未確認', 'doc-verified': '公式で照合済み', tried: '操作して確認済み' };

/**
 * タイトルの下に出すバッジの行
 * @param {{surfaces?:string[], status?:string, checkedAt?:string, verification?:{status:string}}} item
 */
export function metaBadges(item) {
  return h(
    'div',
    { class: 'sec-meta' },
    (item.surfaces ?? []).map((s) => h('span', { class: 'pill', title: '使える場所' }, SURFACE_LABEL[s] ?? s)),
    item.status && item.status !== 'ga' ? h('span', { class: 'pill is-status' }, STATUS_LABEL[item.status] ?? item.status) : null,
    item.verification?.status === 'unverified' ? h('span', { class: 'pill is-unverified' }, '未確認') : null,
    h('span', { class: 'pill is-date' }, `確認日 ${formatDate(item.checkedAt)}`),
  );
}

/** checkedAt が古いときの警告（古くなければ null） */
export function staleNotice(item) {
  if (!isStale(item.checkedAt)) return null;
  const days = ageDays(item.checkedAt);
  return h(
    'p',
    { class: 'notice warn', role: 'note' },
    `情報が古い可能性があります（確認から${Number.isFinite(days) ? days : '?'}日。目安は${getSettings().staleDays}日）。操作の前に、下の公式ドキュメントで最新の情報を確認してください。`,
  );
}

/** 公式ドキュメントのリンク一覧 @param {{title:string, url:string}[]} sources */
export function sourceList(sources) {
  if (!sources?.length) return null;
  return h(
    'section',
    { class: 'sources', 'aria-label': '公式ドキュメント' },
    h('h2', null, '公式ドキュメント'),
    h('ul', null, sources.map((s) => h('li', null, h('a', { href: s.url, target: '_blank', rel: 'noopener noreferrer' }, s.title)))),
  );
}
