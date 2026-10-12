// 本文・辞典・クイズの文字を選ぶと「AIに聞く」ボタンを出し、外部の AI に貼り付けるプロンプトを作る。
// アプリからは何も送信しない（コピーするだけ）。
// ボタンは iPhone Safari の選択メニュー（選択範囲の上下に出る）と重ならないよう、画面の右下（safe-area の内側）に出す。
import { h, fill } from '../dom.js';
import * as storage from '../storage.js';
import { openDialog } from './dialog.js';
import { toast } from './toast.js';
import { copyText } from '../clipboard.js';
import { MODES, buildPrompt } from '../ai-prompt.js';

/** 現在の画面の文脈。画面の hash と一緒に持ち、別の画面へ移ったら使わない */
let current = null;

/**
 * 画面ごとに呼ぶ。文脈がない画面ではボタンを出さない。
 * @param {{kind:'section'|'dict'|'question'} & Object} ctx
 */
export function setAiContext(ctx) {
  current = { ...ctx, hash: location.hash };
}

const getContext = () => (current && current.hash === location.hash ? current : null);

const BLOCK = 'p, li, td, th, pre, summary, h1, h2, h3, .choice, .lesson-note, .explain, .term-def';

function readSelection() {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || !sel.rangeCount) return null;
  const text = sel.toString().replace(/\s+/g, ' ').trim();
  if (text.length < 2 || text.length > 600) return null;
  const node = sel.getRangeAt(0).commonAncestorContainer;
  const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
  if (!el || !el.closest('#view') || el.closest('dialog')) return null;
  return { text, around: el.closest(BLOCK)?.textContent ?? '' };
}

function openAskDialog(picked, ctx) {
  const saved = storage.getSettings().aiMode;
  let mode = MODES.some((m) => m.id === saved) ? saved : MODES[0].id;
  const extra = h('input', { type: 'text', class: 'ai-extra', placeholder: '追加の質問（任意）', maxLength: 120, enterKeyHint: 'done' });
  const preview = h('textarea', { class: 'ai-preview', readOnly: true, rows: 9, 'aria-label': 'AIに貼り付ける文章' });
  const chips = h('div', { class: 'chips', role: 'group', 'aria-label': '聞き方' });
  const build = () => buildPrompt({ selection: picked.text, around: picked.around, mode, extra: extra.value, ctx });
  const drawPreview = () => {
    preview.value = build();
  };
  const drawChips = () =>
    fill(
      chips,
      MODES.map((m) =>
        h('button', {
          type: 'button',
          class: 'chip' + (m.id === mode ? ' is-on' : ''),
          'aria-pressed': String(m.id === mode),
          onClick: () => {
            mode = m.id;
            storage.saveSettings({ aiMode: mode });
            drawChips();
            drawPreview();
          },
        }, m.label),
      ),
    );
  extra.addEventListener('input', drawPreview);
  drawChips();
  drawPreview();

  const shown = picked.text.length > 80 ? picked.text.slice(0, 80) + '…' : picked.text;
  return openDialog((close) => [
    h('h2', null, 'AIに聞く'),
    h('p', { class: 'ai-quote' }, `「${shown}」`),
    chips,
    extra,
    h('label', { class: 'muted small' }, 'AIに貼り付ける文章（コピーするまで、どこにも送信されません）'),
    preview,
    h(
      'div',
      { class: 'btn-row' },
      h('button', {
        type: 'button',
        class: 'btn primary grow',
        // タップのハンドラの中で同期的にコピーを始める（iPhone Safari の制約）
        onClick: () =>
          copyText(build(), {
            onDone: () => toast('コピーしました。AIアプリに貼り付けてください'),
            onManual: () => {
              preview.focus();
              preview.select();
              toast('コピーできませんでした。選択された文章を長押しして、手動でコピーしてください', { error: true, ms: 5000 });
            },
          }),
      }, 'コピー'),
      h('button', { type: 'button', class: 'btn', onClick: () => close() }, '閉じる'),
    ),
    h('p', { class: 'muted small' }, 'コピーしたら、使う AI を開いて貼り付けます：', h('a', { href: 'https://claude.ai/new', target: '_blank', rel: 'noopener noreferrer' }, 'Claude')),
    h('p', { class: 'muted small' }, 'AI の回答は検証されていません。実際に操作する前に、公式ドキュメントで確かめてください。'),
  ]);
}

/** アプリの起動時に1回だけ呼ぶ */
export function initAskAi() {
  let picked = null;
  const fab = h('button', { type: 'button', class: 'ask-ai-fab', hidden: true }, 'AIに聞く');
  // ボタンを押しても選択が解除されないようにする
  fab.addEventListener('pointerdown', (e) => e.preventDefault());
  fab.addEventListener('mousedown', (e) => e.preventDefault());
  fab.addEventListener('click', async () => {
    const ctx = getContext();
    if (!picked || !ctx) return;
    const p = picked;
    fab.hidden = true;
    window.getSelection()?.removeAllRanges();
    await openAskDialog(p, ctx);
  });
  document.body.append(fab);

  let timer = 0;
  document.addEventListener('selectionchange', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      picked = getContext() ? readSelection() : null;
      fab.hidden = !picked;
    }, 150);
  });
  window.addEventListener('hashchange', () => {
    picked = null;
    fab.hidden = true;
  });
}
