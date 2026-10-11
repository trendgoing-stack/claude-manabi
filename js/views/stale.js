// 情報が古い可能性のある節・辞典の項目の一覧。各行から公式ドキュメントを開ける
import { h, put } from '../dom.js';
import { app } from '../state.js';
import * as storage from '../storage.js';
import { richText } from '../render/text.js';
import { flatSections, sectionHref } from '../parts.js';
import { isStale, ageDays, formatDate } from '../freshness.js';

export function staleView(root) {
  const days = storage.getSettings().staleDays;
  const secs = flatSections().filter((x) => isStale(x.section.checkedAt)).sort((a, b) => ageDays(b.section.checkedAt) - ageDays(a.section.checkedAt));
  const dict = app.data.dict.filter((d) => isStale(d.checkedAt));
  const row = (title, href, item) =>
    h(
      'li',
      null,
      h('a', { href }, h('span', { class: 'link-title' }, title), h('span', { class: 'muted small' }, `確認日 ${formatDate(item.checkedAt)}（${ageDays(item.checkedAt)}日前）`)),
      item.sources?.length ? h('div', { class: 'chips' }, item.sources.map((s) => h('a', { class: 'chip small', href: s.url, target: '_blank', rel: 'noopener noreferrer' }, s.title))) : null,
    );
  put(root,
    h('header', { class: 'run-head' }, h('button', { type: 'button', class: 'btn small', onClick: () => history.back() }, '戻る'), h('span'), h('span')),
    h('h1', null, '情報が古い可能性のある節・項目'),
    h('p', { class: 'muted small' }, `公式情報で確認してから${days}日を超えたものです（日数は設定で変えられます）。公式ドキュメントで最新の内容を確かめてください。`),
    secs.length ? h('section', { class: 'card' }, h('h2', null, `解説の節 ${secs.length}件`), h('ul', { class: 'link-list' }, secs.map((x) => row(richText(x.section.title), sectionHref(x.chapter.id, x.section.id), x.section)))) : null,
    dict.length ? h('section', { class: 'card' }, h('h2', null, `辞典の項目 ${dict.length}件`), h('ul', { class: 'link-list' }, dict.map((d) => row(d.name, `#/dict/${encodeURIComponent(d.id)}`, d)))) : null,
    !secs.length && !dict.length ? h('p', { class: 'notice' }, '該当するものはありません。') : null,
  );
}
