// 学ぶ：辞典（スラッシュコマンド・キー操作・CLI オプション・設定キー・ファイル・パス）
//   #/dict           一覧（種類で絞り込み・検索。最大50件）
//   #/dict/<項目id>  項目の詳細
import { h, fill, put } from '../dom.js';
import * as storage from '../storage.js';
import { app } from '../state.js';
import { learnNav } from './learn.js';
import { search, debounce } from '../search.js';
import { linked } from '../render/lesson.js';
import { richText } from '../render/text.js';
import { renderCodeBlock } from '../render/code.js';
import { metaBadges, staleNotice, sourceList } from '../render/badges.js';
import { findSection, sectionHref } from '../parts.js';
import { DICT_KINDS, DICT_KIND_IDS } from '../dict-kinds.js';
import { setAiContext } from '../ui/ask-ai.js';

const MAX = 50;

export function dictView(root, [id]) {
  return id ? itemView(root, id) : listView(root);
}

/** キー操作の表記。Windows と Mac で違うものは両方 */
export const keyLabel = (d) => (d.os ? `${d.os.win}（Mac：${d.os.mac}）` : d.name);

function listView(root) {
  const meta = storage.getMeta();
  let kind = DICT_KIND_IDS.includes(meta.dictKind) ? meta.dictKind : '';
  const input = h('input', { type: 'search', class: 'input', placeholder: '名前・説明で検索（例：compact、resume）', value: meta.dictQuery ?? '', enterkeyhint: 'search', 'aria-label': '辞典を検索' });
  const chips = h('div', { class: 'chips subnav', role: 'group', 'aria-label': '種類' });
  const list = h('div');
  const all = [...app.data.dict].sort((a, b) => DICT_KINDS[a.kind].order - DICT_KINDS[b.kind].order || a.name.localeCompare(b.name, 'ja'));

  const draw = () => {
    storage.saveMeta({ dictQuery: input.value, dictKind: kind });
    const chip = (k, label) =>
      h('button', { type: 'button', class: 'chip' + (kind === k ? ' is-on' : ''), 'aria-pressed': String(kind === k), onClick: () => { kind = k; draw(); } }, label);
    fill(chips, chip('', 'すべて'), DICT_KIND_IDS.map((k) => chip(k, DICT_KINDS[k].short)));
    const pool = all.filter((d) => !kind || d.kind === kind);
    const hits = search(pool, input.value, (d) => [d.name, d.id.replace(/^[a-z]+-/, ''), ...(d.os ? [d.os.win, d.os.mac] : [])], (d) => [d.summary, d.details, d.syntax ?? '']);
    fill(
      list,
      h('p', { class: 'muted small' }, hits.length > MAX ? `${hits.length}件中 ${MAX}件を表示` : `${hits.length}件`),
      hits.length
        ? h('section', { class: 'card' }, h('ul', { class: 'link-list' }, hits.slice(0, MAX).map((d) =>
            h('li', null, h('a', { href: `#/dict/${encodeURIComponent(d.id)}` },
              h('span', { class: 'term-name mono' }, d.kind === 'key' ? keyLabel(d) : d.name),
              h('span', { class: 'muted small link-title' }, `${DICT_KINDS[d.kind].short}・${d.summary}`))))))
        : h('p', { class: 'muted' }, app.data.dict.length ? '該当する項目がありません。' : '辞典を読み込めませんでした。'),
    );
  };
  input.addEventListener('input', debounce(draw, 150));
  put(root, h('h1', null, '学ぶ'), learnNav('dict'), input, chips, list);
  draw();
}

function itemView(root, id) {
  const d = app.data.dictById.get(id);
  const back = h('button', { type: 'button', class: 'btn small', onClick: () => history.back() }, '戻る');
  if (!d) {
    put(root, h('header', { class: 'run-head' }, back), h('p', null, '項目が見つかりません。'));
    return;
  }
  setAiContext({ kind: 'dict', item: d });
  const sections = (d.sectionIds ?? []).map(findSection).filter(Boolean);
  put(
    root,
    h('header', { class: 'run-head' }, back, h('span', { class: 'run-progress' }, DICT_KINDS[d.kind].label), h('span')),
    h('h1', { class: 'mono' }, d.name),
    d.os ? h('p', { class: 'dict-keys' }, h('span', { class: 'pill' }, `Windows・Linux：${d.os.win}`), h('span', { class: 'pill' }, `Mac：${d.os.mac}`)) : null,
    metaBadges(d),
    staleNotice(d),
    d.syntax ? h('p', null, h('code', { class: 'inline' }, d.syntax)) : null,
    h('section', { class: 'card' }, h('p', { class: 'term-def' }, richText(d.summary))),
    h('div', { class: 'lesson-body' }, h('p', null, linked(d.details))),
    d.examples?.length
      ? h('section', { class: 'related' }, h('h2', null, '使い方の例'), h('div', { class: 'lesson-body' }, d.examples.map((ex) => [renderCodeBlock({ code: ex.code, caption: ex.desc })])))
      : null,
    sections.length
      ? h('section', { class: 'related' }, h('h2', null, '解説で読む'), h('ul', { class: 'link-list' }, sections.map((x) => h('li', null, h('a', { href: sectionHref(x.chapter.id, x.section.id) }, h('span', { class: 'link-title' }, richText(x.section.title)), h('span', { class: 'muted small' }, richText(x.chapter.title)))))))
      : null,
    sourceList(d.sources),
  );
}
