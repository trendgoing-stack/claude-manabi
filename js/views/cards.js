// 学ぶ：暗記カード。表に用語または辞典の項目名、裏に定義・要約。左右スワイプまたはボタンで「覚えた／まだ」
//   #/cards          範囲を選んで始める
//   #/cards/review   今日の復習（期限の来た「まだ」のカード）
import { h, fill, put } from '../dom.js';
import * as storage from '../storage.js';
import { app } from '../state.js';
import { learnNav } from './learn.js';
import { richText } from '../render/text.js';
import { parts, chaptersOf } from '../parts.js';
import { shuffled } from '../quiz.js';
import { cardOf, cardsInScope, judgeCard, dueCards } from '../review.js';
import { DICT_KINDS, DICT_KIND_IDS } from '../dict-kinds.js';

const PER_SESSION = 20;
const SWIPE = 80; // px

/** 範囲のカードから出す順：期限の来た「まだ」→ まだ見ていない → 前回「まだ」（期限前）。「覚えた」は出さない */
function queueFor(ids) {
  const cards = storage.getCards();
  const due = dueCards();
  const dueSet = new Set(due);
  const fresh = shuffled(ids.filter((id) => !cards[id]));
  const ng = ids.filter((id) => cards[id]?.state === 'ng' && !dueSet.has(id));
  return [...due.filter((id) => ids.includes(id)), ...fresh, ...ng].slice(0, PER_SESSION);
}

export function cardsView(root, [mode]) {
  const saved = storage.getMeta().cardScope ?? {};
  let scope = { source: saved.source === 'dict' ? 'dict' : 'terms', part: saved.part ?? '', chapter: saved.chapter ?? '', kind: saved.kind ?? '' };
  let state = null; // { queue, i, flipped, ok, ng, label }

  const start = (queue, label) => {
    state = { queue, i: 0, flipped: false, ok: 0, ng: 0, label };
    drawCard();
  };

  const drawStart = () => {
    storage.saveMeta({ cardScope: scope });
    const chip = (on, label, onClick) => h('button', { type: 'button', class: 'chip' + (on ? ' is-on' : ''), 'aria-pressed': String(on), onClick }, label);
    const set = (patch) => () => {
      scope = { ...scope, ...patch };
      drawStart();
    };
    const ids = cardsInScope(scope);
    const cards = storage.getCards();
    const learned = ids.filter((id) => cards[id]?.state === 'ok').length;
    const queue = queueFor(ids);
    const due = dueCards();
    const chapterSelect = h(
      'select',
      { class: 'input', 'aria-label': '章', onChange: (e) => { scope = { ...scope, chapter: e.target.value, part: '' }; drawStart(); } },
      h('option', { value: '', selected: !scope.chapter }, '章を選ぶ（任意）'),
      parts().map((p) => chaptersOf(p.id).map((c) => h('option', { value: c.id, selected: scope.chapter === c.id }, c.title))),
    );
    fill(
      root,
      h('h1', null, '学ぶ'),
      learnNav('cards'),
      due.length
        ? h('section', { class: 'card accent' }, h('h2', null, '今日の復習'), h('p', { class: 'muted small' }, `前に「まだ」にしたカードが ${due.length}枚あります。`), h('button', { type: 'button', class: 'btn big primary', onClick: () => start(due.slice(0, PER_SESSION), '今日の復習') }, `復習する（${Math.min(due.length, PER_SESSION)}枚）`))
        : null,
      h(
        'section',
        { class: 'card' },
        h('h2', null, '範囲'),
        h('div', { class: 'chips subnav', role: 'group', 'aria-label': 'カードの種類' }, chip(scope.source === 'terms', '用語', set({ source: 'terms' })), chip(scope.source === 'dict', '辞典', set({ source: 'dict' }))),
        scope.source === 'terms'
          ? [
              h('div', { class: 'chips subnav', role: 'group', 'aria-label': '部' }, chip(!scope.part && !scope.chapter, 'すべて', set({ part: '', chapter: '' })), parts().map((p) => chip(scope.part === p.id && !scope.chapter, p.title.replace(/^第\d+部\s*/, ''), set({ part: p.id, chapter: '' })))),
              chapterSelect,
            ]
          : h('div', { class: 'chips subnav', role: 'group', 'aria-label': '辞典の種類' }, chip(!scope.kind, 'すべて', set({ kind: '' })), DICT_KIND_IDS.map((k) => chip(scope.kind === k, DICT_KINDS[k].short, set({ kind: k })))),
        h('p', { class: 'muted small' }, `${ids.length}枚（覚えた ${learned}枚）`),
        h('p', { class: 'muted small' }, 'カードをタップすると裏返ります。右へスワイプで「覚えた」、左へスワイプで「まだ」。「まだ」のカードは翌日以降の「今日の復習」に出ます。'),
        h('button', { type: 'button', class: 'btn primary big', disabled: !queue.length, onClick: () => start(queue, '暗記カード') }, queue.length ? `${queue.length}枚を始める` : 'この範囲のカードはすべて覚えました'),
      ),
    );
  };

  const judge = (ok) => {
    judgeCard(state.queue[state.i], ok);
    if (ok) state.ok++;
    else state.ng++;
    state.i++;
    state.flipped = false;
    if (state.i >= state.queue.length) drawDone();
    else drawCard();
  };

  const drawDone = () =>
    fill(
      root,
      h('h1', null, '学ぶ'),
      learnNav('cards'),
      h('section', { class: 'card center' }, h('p', { class: 'score' }, `${state.ok} / ${state.ok + state.ng}`), h('p', null, '枚を「覚えた」にしました。'), state.ng ? h('p', { class: 'muted small' }, `「まだ」の ${state.ng}枚は、明日以降の今日の復習に出ます。`) : null),
      h('div', { class: 'btn-col' }, h('button', { type: 'button', class: 'btn big', onClick: drawStart }, '戻る')),
    );

  const drawCard = () => {
    const c = cardOf(state.queue[state.i]);
    if (!c) return judge(true);
    const card = h(
      'div',
      { class: 'flashcard' + (state.flipped ? ' is-flipped' : ''), role: 'button', tabindex: '0', 'aria-label': state.flipped ? `${c.front}の説明` : `${c.front}。タップで説明を表示` },
      state.flipped
        ? [h('p', { class: 'flash-term small' }, c.front), c.keys ? h('p', { class: 'muted small' }, c.keys) : null, h('p', { class: 'flash-def' }, richText(c.back))]
        : [h('p', { class: 'muted small' }, c.sub), h('p', { class: 'flash-front' }, c.front), h('p', { class: 'muted small' }, 'タップで説明を表示')],
      h('span', { class: 'flash-hint flash-hint-ok', 'aria-hidden': 'true' }, '覚えた'),
      h('span', { class: 'flash-hint flash-hint-ng', 'aria-hidden': 'true' }, 'まだ'),
    );

    // Pointer Events でスワイプを判定する。縦スクロールはブラウザに任せる（CSS の touch-action: pan-y）
    let startX = null;
    let dx = 0;
    let moved = false;
    card.addEventListener('pointerdown', (e) => {
      startX = e.clientX;
      dx = 0;
      moved = false;
      card.setPointerCapture(e.pointerId);
      card.classList.add('is-dragging');
    });
    card.addEventListener('pointermove', (e) => {
      if (startX == null) return;
      dx = e.clientX - startX;
      if (Math.abs(dx) > 6) moved = true;
      card.style.transform = `translateX(${dx}px) rotate(${dx / 30}deg)`;
      card.classList.toggle('show-ok', dx > SWIPE);
      card.classList.toggle('show-ng', dx < -SWIPE);
    });
    const end = () => {
      if (startX == null) return;
      startX = null;
      card.classList.remove('is-dragging');
      if (dx > SWIPE) return judge(true);
      if (dx < -SWIPE) return judge(false);
      card.style.transform = '';
      card.classList.remove('show-ok', 'show-ng');
      if (!moved) {
        state.flipped = !state.flipped;
        drawCard();
      }
    };
    card.addEventListener('pointerup', end);
    card.addEventListener('pointercancel', () => {
      startX = null;
      card.classList.remove('is-dragging', 'show-ok', 'show-ng');
      card.style.transform = '';
    });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        state.flipped = !state.flipped;
        drawCard();
      }
    });

    fill(
      root,
      h('header', { class: 'run-head' }, h('button', { type: 'button', class: 'btn small', onClick: drawStart }, '終了'), h('span', { class: 'run-progress' }, `${state.label}　${state.i + 1} / ${state.queue.length}`), h('span')),
      h('div', { class: 'progress' }, h('span', { style: `width:${(state.i / state.queue.length) * 100}%` })),
      card,
      h('div', { class: 'btn-row flash-buttons' }, h('button', { type: 'button', class: 'btn grow', onClick: () => judge(false) }, '← まだ'), h('button', { type: 'button', class: 'btn primary grow', onClick: () => judge(true) }, '覚えた →')),
    );
  };

  if (mode === 'review') {
    const due = dueCards();
    if (due.length) return start(due.slice(0, PER_SESSION), '今日の復習');
  }
  drawStart();
  if (!app.data.glossary.length && !app.data.dict.length) put(root, h('p', { class: 'notice warn' }, 'カードのデータを読み込めませんでした。'));
}
