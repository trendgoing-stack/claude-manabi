// 用語の詳細（用語集の一覧はフェーズ2で追加）
import { h, put } from '../dom.js';
import { app } from '../state.js';
import { richText } from '../render/text.js';
import { sectionsFor } from '../term-index.js';
import { sectionHref } from '../parts.js';

export function termView(root, [id]) {
  const t = app.data.termById.get(id);
  const back = h('button', { type: 'button', class: 'btn small', onClick: () => history.back() }, '戻る');
  if (!t) {
    put(root, h('header', { class: 'run-head' }, back), h('p', null, '用語が見つかりません。'));
    return;
  }
  const lessons = sectionsFor(t.id).slice(0, 5);
  put(root,
    h('header', { class: 'run-head' }, back, h('span'), h('span')),
    h('p', { class: 'muted small' }, t.reading),
    h('h1', null, t.term),
    t.aliases?.length ? h('p', { class: 'muted small' }, `別名：${t.aliases.join('、')}`) : null,
    h('section', { class: 'card' }, h('p', { class: 'term-def' }, richText(t.definition))),
    t.related?.length
      ? h('section', { class: 'related' }, h('h2', null, '関連する用語'), h('div', { class: 'chips' }, t.related.map((r) => app.data.termById.get(r)).filter(Boolean).map((r) => h('a', { class: 'chip', href: `#/term/${encodeURIComponent(r.id)}` }, r.term))))
      : null,
    lessons.length
      ? h('section', { class: 'related' }, h('h2', null, '解説で読む'), h('ul', { class: 'link-list' }, lessons.map((l) => h('li', null, h('a', { href: sectionHref(l.chapter.id, l.section.id) }, h('span', { class: 'link-title' }, richText(l.section.title)), h('span', { class: 'muted small' }, richText(l.chapter.title)))))))
      : null,
  );
}
