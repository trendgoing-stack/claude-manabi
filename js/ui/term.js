// 用語の定義をポップアップで表示する
import { h } from '../dom.js';
import { openDialog } from './dialog.js';
import { app } from '../state.js';
import { navigate } from '../router.js';
import { richText } from '../render/text.js';
import { sectionsFor } from '../term-index.js';
import { sectionHref } from '../parts.js';

/** @param {string} id 用語の id */
export function openTermDialog(id) {
  const t = app.data.termById.get(id);
  if (!t) return;
  const lessons = sectionsFor(t.id).slice(0, 3);
  openDialog((close) => [
    h('p', { class: 'muted small' }, t.reading),
    h('h2', null, t.term),
    t.aliases?.length ? h('p', { class: 'muted small' }, `別名：${t.aliases.join('、')}`) : null,
    h('p', null, richText(t.definition)),
    t.related?.length
      ? h(
          'div',
          { class: 'chips' },
          t.related
            .map((rid) => app.data.termById.get(rid))
            .filter(Boolean)
            .map((r) =>
              h('button', { type: 'button', class: 'chip', onClick: () => { close(); openTermDialog(r.id); } }, r.term),
            ),
        )
      : null,
    lessons.length
      ? h(
          'div',
          null,
          h('p', { class: 'muted small' }, '解説で読む'),
          h('div', { class: 'chips' }, lessons.map((l) => h('a', { class: 'chip', href: sectionHref(l.chapter.id, l.section.id), onClick: () => close() }, richText(l.section.title)))),
        )
      : null,
    h(
      'div',
      { class: 'btn-row' },
      h('button', { type: 'button', class: 'btn', onClick: () => { close(); navigate(`term/${encodeURIComponent(t.id)}`); } }, '用語集で見る'),
      h('button', { type: 'button', class: 'btn primary', onClick: () => close() }, '閉じる'),
    ),
  ]);
}
