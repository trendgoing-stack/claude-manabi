// ホーム：続きから読む、今日の復習、部ごとの読了率、情報が古い可能性のある節の件数
import { h, put, pct } from '../dom.js';
import * as storage from '../storage.js';
import { app } from '../state.js';
import { richText } from '../render/text.js';
import { parts, progressOf, findSection, flatSections, sectionHref } from '../parts.js';
import { isStale } from '../freshness.js';

/** 読み込めなかったファイルの通知（ホームと設定で使う） */
export function failedNotice() {
  if (!app.data.failed.length) return null;
  return h('p', { class: 'notice warn', role: 'alert' }, `読み込めなかったデータがあります：${app.data.failed.join('、')}。それ以外の機能は使えます。通信できる状態で再読み込みしてください。`);
}

export function homeView(root) {
  const read = storage.getRead();
  const { last } = storage.getLastView();
  const flat = flatSections();
  const lastHit = last ? findSection(last) : null;
  // 続きから：最後に開いた節が読了済みなら、その次の未読の節
  let next = lastHit;
  if (lastHit && read[lastHit.section.id]) {
    const i = flat.indexOf(lastHit);
    next = flat.slice(i + 1).find((x) => !read[x.section.id]) ?? null;
  }
  if (!lastHit) next = flat.find((x) => !read[x.section.id]) ?? null;
  const stale = flat.filter((x) => isStale(x.section.checkedAt)).length + app.data.dict.filter((d) => isStale(d.checkedAt)).length;

  put(root,
    h('h1', null, 'Claudeまなび帳'),
    failedNotice(),
    h(
      'section',
      { class: 'card accent' },
      h('h2', null, lastHit ? '続きから読む' : 'はじめに読む'),
      next
        ? h('a', { class: 'btn big primary', href: sectionHref(next.chapter.id, next.section.id) }, richText(next.section.title))
        : h('p', { class: 'muted' }, flat.length ? 'すべての節を読み終えました。' : '解説テキストがありません。'),
      next ? h('p', { class: 'muted small' }, richText(next.chapter.title)) : null,
    ),
    h('section', { class: 'card' }, h('h2', null, '今日の復習'), h('p', { class: 'muted small' }, '間違えた問題と「まだ」のカードは、クイズと暗記カードの追加後にここへ出ます。')),
    h(
      'section',
      { class: 'card' },
      h('h2', null, '進捗'),
      parts().map((p) => {
        const pr = progressOf(p.id, read);
        if (!pr.total) return null;
        const v = pct(pr.done, pr.total);
        return h(
          'div',
          { class: 'bar-row' },
          h('span', { class: 'bar-label' }, p.title.replace(/^第\d+部\s*/, '')),
          h('span', { class: 'bar-track', role: 'img', 'aria-label': `読了率 ${v}%` }, h('span', { class: 'bar-fill', style: `width:${v}%` })),
          h('span', { class: 'bar-value' }, `${v}%`),
          h('span', { class: 'bar-count muted small' }, `${pr.done}/${pr.total}`),
        );
      }),
    ),
    h(
      'section',
      { class: 'card' },
      h('h2', null, '情報の鮮度'),
      stale
        ? h('a', { class: 'btn big', href: '#/stale' }, `古い可能性のある節・項目 ${stale}件`)
        : h('p', { class: 'muted small' }, `確認から${storage.getSettings().staleDays}日を超えた節・項目はありません。`),
    ),
  );
}
