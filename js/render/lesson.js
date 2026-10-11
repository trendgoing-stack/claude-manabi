// 解説テキストのブロックを DOM にする。innerHTML は使わない。
// 用語リンク：[[用語]]（または [[表示|用語id]]）は必ずリンクし、それ以外は用語集の見出し語・別名に
// 一致する箇所を、その節で最初に出てきた1か所だけ自動でリンクする。`コード` の中はリンクしない。
import { h } from '../dom.js';
import { richText } from './text.js';
import { renderFigure } from './figure.js';
import { renderCodeBlock } from './code.js';
import { app } from '../state.js';
import { findTerms } from '../terms.js';
import { openTermDialog } from '../ui/term.js';

const NOTE_LABEL = { tip: 'コツ', pitfall: 'つまずきやすい点', caution: '注意' };
const EXPLICIT = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

let byName = null;
let byNameFor = null;

/** 用語の表記・id → 用語 id */
export function termIdOf(name) {
  if (byNameFor !== app.data.glossary) {
    byName = new Map();
    for (const t of app.data.glossary) {
      byName.set(t.id, t.id);
      for (const n of [t.term, ...(t.aliases ?? [])]) byName.set(n.toLowerCase(), t.id);
    }
    byNameFor = app.data.glossary;
  }
  return byName.get(String(name).trim().toLowerCase()) ?? byName.get(String(name).trim()) ?? null;
}

const termButton = (id, label) => h('button', { type: 'button', class: 'term-link', onClick: () => openTermDialog(id) }, richText(label));

/** 自動リンク（`コード` の外側だけ） */
function autoLinked(text, seen, frag) {
  const parts = text.split(/(`[^`]+`)/);
  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith('`') && part.endsWith('`') && part.length > 1) {
      frag.append(richText(part));
      continue;
    }
    let last = 0;
    for (const f of findTerms(part, app.data.glossary)) {
      if (seen.has(f.id)) continue;
      seen.add(f.id);
      if (f.start > last) frag.append(richText(part.slice(last, f.start)));
      frag.append(termButton(f.id, part.slice(f.start, f.end)));
      last = f.end;
    }
    if (last < part.length) frag.append(richText(part.slice(last)));
  }
}

/**
 * 用語リンク付きの文章
 * @param {string} text
 * @param {Set<string>} [seen]  この節でリンク済みの用語 id
 */
export function linked(text, seen = new Set()) {
  text = String(text ?? '');
  const frag = document.createDocumentFragment();
  let last = 0;
  for (const m of text.matchAll(EXPLICIT)) {
    if (m.index > last) autoLinked(text.slice(last, m.index), seen, frag);
    const id = termIdOf(m[2] ?? m[1]);
    if (id) {
      seen.add(id);
      frag.append(termButton(id, m[1]));
    } else frag.append(richText(m[1]));
    last = m.index + m[0].length;
  }
  if (last < text.length) autoLinked(text.slice(last), seen, frag);
  return frag;
}

/** @param {import('../types.js').TableData} t */
export function renderTable(t) {
  return h(
    'div',
    { class: 'scroll-x', role: 'region', 'aria-label': '表', tabindex: '0' },
    h(
      'table',
      { class: 'q-table' },
      t.header?.length ? h('thead', null, h('tr', null, t.header.map((c) => h('th', { scope: 'col' }, richText(c))))) : null,
      h('tbody', null, t.rows.map((r) => h('tr', null, r.map((c) => h('td', null, richText(c)))))),
    ),
  );
}

/** @param {import('../types.js').Block} b @param {Set<string>} seen */
function renderBlock(b, seen) {
  switch (b.type) {
    case 'h':
      return h('h3', null, richText(b.text));
    case 'p':
      return h('p', null, linked(b.text, seen));
    case 'list':
      return h('ul', { class: 'lesson-steps' }, b.items.map((t) => h('li', null, linked(t, seen))));
    case 'steps':
      return h('div', null, b.title ? h('p', null, h('b', null, richText(b.title))) : null, h('ol', { class: 'lesson-steps' }, b.items.map((t) => h('li', null, linked(t, seen)))));
    case 'figure':
      return renderFigure(b.figure);
    case 'table':
      return h('div', null, b.title ? h('p', null, h('b', null, richText(b.title))) : null, renderTable(b.table));
    case 'code':
      return renderCodeBlock(b);
    case 'note': {
      const kind = b.kind in NOTE_LABEL ? b.kind : 'tip';
      return h('div', { class: `lesson-note is-${kind}` }, h('span', { class: 'note-title' }, b.title ?? NOTE_LABEL[kind]), h('span', null, linked(b.text, seen)));
    }
    case 'example':
      return h(
        'div',
        { class: 'lesson-example' },
        h('p', null, h('b', null, b.title ?? '例'), '　', linked(b.text, seen)),
        b.answer ? h('details', null, h('summary', null, '答えと考え方を見る'), h('p', null, linked(b.answer, seen))) : null,
      );
    default:
      return null;
  }
}

// 要約表示で残すブロック：小見出し、注意書き、図、表、コード
const SUMMARY_TYPES = new Set(['h', 'note', 'figure', 'table', 'code']);

/** 要約表示のブロック。中身が続かない小見出しは落とす */
export function summaryBlocks(blocks) {
  const kept = blocks.filter((b) => SUMMARY_TYPES.has(b.type));
  return kept.filter((b, i) => b.type !== 'h' || (kept[i + 1] && kept[i + 1].type !== 'h'));
}

/**
 * 節の本文。summary が true なら要約表示（digest ＋ 小見出し・注意書き・図・表・コード）
 * @param {import('../types.js').TextSection} section
 */
export function renderSectionBody(section, summary = false) {
  const seen = new Set();
  const blocks = summary ? summaryBlocks(section.blocks) : section.blocks;
  const d = summary ? section.digest : null;
  return h(
    'div',
    { class: 'lesson-body' },
    d
      ? h(
          'div',
          { class: 'lesson-digest' },
          h('p', null, linked(d.text, seen)),
          d.keys?.length ? h('ul', { class: 'lesson-keys' }, d.keys.map((k) => h('li', null, linked(k, seen)))) : null,
        )
      : null,
    blocks.map((b) => renderBlock(b, seen)),
  );
}
