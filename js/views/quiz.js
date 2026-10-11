// 演習タブ：確認クイズ（メニュー・出題・結果）。「やってみよう」はフェーズ3で追加
//   #/quiz                メニュー（章を選ぶ／全体からランダム／苦手を復習、続きから）
//   #/quiz/chapter/<章id>  #/quiz/section/<節id>  #/quiz/random  #/quiz/weak   セットを作って出題へ
//   #/quiz/run            出題   #/quiz/result   結果
import { h, fill, put, pct } from '../dom.js';
import * as storage from '../storage.js';
import { app } from '../state.js';
import { navigate } from '../router.js';
import { richText } from '../render/text.js';
import { linked } from '../render/lesson.js';
import { sourceList } from '../render/badges.js';
import { parts, chaptersOf, chapterById, findSection, sectionHref } from '../parts.js';
import { confirmDialog } from '../ui/dialog.js';
import * as quiz from '../quiz.js';

const LABELS = ['ア', 'イ', 'ウ', 'エ'];

export function quizView(root, [mode, arg]) {
  if (mode === 'run') return runView(root);
  if (mode === 'result') return resultView(root);
  if (mode) return startFrom(root, mode, arg);
  return menuView(root);
}

/** 練習のサブ切り替え（確認クイズ／やってみよう） */
export const practiceNav = (current) =>
  h(
    'nav',
    { class: 'chips subnav', 'aria-label': '演習' },
    h('a', { href: '#/quiz', class: 'chip' + (current === 'quiz' ? ' is-on' : ''), 'aria-current': current === 'quiz' ? 'page' : null }, '確認クイズ'),
    h('a', { href: '#/try', class: 'chip' + (current === 'try' ? ' is-on' : ''), 'aria-current': current === 'try' ? 'page' : null }, 'やってみよう'),
  );

/** 新しいセットを始める。中断中のセットがあれば確認する。開始できなければ理由を返す */
async function start(mode, label, questions) {
  const current = storage.getQuizSession();
  if (quiz.isActive(current)) {
    const ok = await confirmDialog('中断中のクイズがあります。破棄して新しく始めますか？', { ok: '破棄して開始', danger: true });
    if (!ok) return navigate('quiz', { replace: true });
  }
  quiz.createSession(mode, label, questions);
  navigate('quiz/run', { replace: true });
}

/** ルートの指定からセットを作る。対象が0問なら理由を表示する */
function startFrom(root, mode, arg) {
  let label = '';
  let pool = [];
  let reason = '';
  if (mode === 'chapter') {
    const ch = chapterById(arg);
    const p = quiz.chapterPool(arg);
    label = ch?.title ?? arg;
    pool = quiz.shuffled(p.ok).slice(0, quiz.SET_SIZE);
    reason = !p.all.length ? 'この章のクイズはまだありません。' : 'この章の節がまだ公式情報で確認されていないため、出題できません。';
  } else if (mode === 'section') {
    const hit = findSection(arg);
    const p = quiz.sectionPool(arg);
    label = hit?.section.title ?? arg;
    pool = quiz.shuffled(p.ok);
    reason = !p.all.length ? 'この節のクイズはまだありません。' : 'この節はまだ公式情報で確認されていないため、出題できません。';
  } else if (mode === 'random') {
    label = '全体からランダム';
    pool = quiz.shuffled(quiz.eligible()).slice(0, quiz.SET_SIZE);
    reason = '出題できる問題がありません（公式情報で確認済みの節の問題だけを出します）。';
  } else if (mode === 'weak') {
    label = '苦手を復習';
    pool = quiz.weakOrder().slice(0, quiz.SET_SIZE);
    reason = 'まだ間違えた問題がありません。ほかのモードで解くと、間違えた問題がここに集まります。';
  }
  if (!pool.length) {
    put(root, h('header', { class: 'run-head' }, h('a', { class: 'btn small', href: '#/quiz' }, '演習'), h('span'), h('span')), h('h1', null, label), h('p', { class: 'notice' }, reason));
    return;
  }
  put(root, h('p', { class: 'muted center' }, '準備中…'));
  start(mode, label, pool);
}

function menuView(root) {
  const session = storage.getQuizSession();
  const answers = storage.getAnswers();
  const eligibleCount = quiz.eligible().length;
  const weakCount = quiz.weakOrder().length;
  const s = quiz.isActive(session) ? quiz.summary(session) : null;

  const chapterRow = (c) => {
    const p = quiz.chapterPool(c.id);
    const tried = p.all.filter((q) => answers[q.id]);
    const ok = tried.reduce((n, q) => n + answers[q.id].ok, 0);
    const n = tried.reduce((m, q) => m + answers[q.id].ok + answers[q.id].ng, 0);
    return h(
      'li',
      null,
      h(
        'a',
        { href: p.ok.length ? `#/quiz/chapter/${encodeURIComponent(c.id)}` : null, 'aria-disabled': p.ok.length ? null : 'true' },
        h('span', { class: 'grow' }, h('span', { class: 'term-name' }, c.title), h('br'), h('span', { class: 'muted small' }, p.ok.length ? `${p.ok.length}問${p.ok.length < p.all.length ? `（未確認の節の${p.all.length - p.ok.length}問は除く）` : ''}` : p.all.length ? '節が未確認のため出題しません' : 'クイズはまだありません')),
        h('span', { class: 'read-mark' + (n && ok / n >= 0.8 ? ' is-done' : '') }, n ? `${pct(ok, n)}%` : '—'),
      ),
    );
  };

  put(
    root,
    h('h1', null, '演習'),
    practiceNav('quiz'),
    s
      ? h(
          'section',
          { class: 'card accent' },
          h('h2', null, '中断中のクイズ'),
          h('p', { class: 'muted small' }, `${session.label}：${s.done}/${s.total}問 回答済み`),
          h('a', { class: 'btn big primary', href: '#/quiz/run' }, '続きから'),
        )
      : null,
    h(
      'section',
      { class: 'card' },
      h('h2', null, '出題のしかた'),
      h('p', { class: 'muted small' }, `1セット${quiz.SET_SIZE}問。公式情報で確認済みの節の問題（${eligibleCount}問）から出します。`),
      h(
        'div',
        { class: 'btn-col' },
        h('a', { class: 'btn big', href: '#/quiz/random' }, '全体からランダム'),
        h('a', { class: 'btn big', href: '#/quiz/weak' }, weakCount ? `苦手を復習（${weakCount}問）` : '苦手を復習'),
      ),
    ),
    parts().map((p) => {
      const chs = chaptersOf(p.id);
      return chs.length ? [h('h2', { class: 'part-heading' }, p.title), h('section', { class: 'card' }, h('ul', { class: 'lesson-chapters' }, chs.map(chapterRow)))] : null;
    }),
  );
}

/** 選択肢。order は表示位置 → choices の index */
function renderChoices(q, item, onSelect) {
  return h(
    'div',
    { class: 'choices', role: item.done ? null : 'radiogroup', 'aria-label': '選択肢' },
    item.order.map((ci, pos) => {
      let cls = 'choice';
      if (item.done) {
        if (ci === q.answer) cls += ' is-correct';
        else if (ci === item.selected) cls += ' is-wrong';
      } else if (ci === item.selected) cls += ' is-selected';
      const body = h('span', { class: 'choice-body' }, h('span', null, richText(q.choices[ci])));
      const label = h('span', { class: 'choice-label', 'aria-hidden': 'true' }, LABELS[pos]);
      return item.done
        ? h('div', { class: cls }, label, body)
        : h('button', { type: 'button', class: cls, role: 'radio', 'aria-checked': String(ci === item.selected), onClick: () => onSelect(ci) }, label, body);
    }),
  );
}

function runView(root) {
  const s = storage.getQuizSession();
  if (!s) return navigate('quiz', { replace: true });
  if (!quiz.isActive(s)) return navigate('quiz/result', { replace: true });

  // データの更新で問題が無くなったら飛ばす
  const skipMissing = () => {
    s.items = s.items.filter((it) => quiz.questionById(it.id));
    if (s.pos >= s.items.length) {
      s.pos = Math.max(0, s.items.length - 1);
      s.finished = s.items.every((i) => i.done);
    }
    storage.saveQuizSession(s);
  };

  const draw = (scrollToResult = false) => {
    skipMissing();
    if (!quiz.isActive(s)) return navigate('quiz/result', { replace: true });
    const item = s.items[s.pos];
    const q = quiz.questionById(item.id);
    const hit = findSection(q.sectionId);
    const last = s.pos === s.items.length - 1;
    const prev = s.pos > 0 ? h('button', { type: 'button', class: 'btn', onClick: () => { quiz.back(s); draw(); window.scrollTo(0, 0); } }, '前へ') : null;

    fill(
      root,
      h(
        'header',
        { class: 'run-head' },
        h('button', { type: 'button', class: 'btn small', onClick: () => navigate('quiz') }, '中断'),
        h('span', { class: 'run-progress' }, `${s.label}　${s.pos + 1} / ${s.items.length}`),
        h('span'),
      ),
      h('div', { class: 'progress' }, h('span', { style: `width:${((s.pos + (item.done ? 1 : 0)) / s.items.length) * 100}%` })),
      hit ? h('p', { class: 'q-meta muted small' }, richText(hit.section.title)) : null,
      h('p', { class: 'q-stem' }, richText(q.question)),
      item.done
        ? h(
            'div',
            { class: 'result-banner ' + (item.ok ? 'is-ok' : 'is-ng'), id: 'result-banner', role: 'status' },
            h('strong', null, item.ok ? '正解' : '不正解'),
            h('span', null, `正解は ${LABELS[item.order.indexOf(q.answer)]}`),
          )
        : null,
      renderChoices(q, item, (ci) => {
        quiz.select(s, ci);
        draw();
      }),
      item.done
        ? h(
            'div',
            { class: 'explain' },
            h('p', null, linked(q.explanation)),
            hit ? h('p', null, h('a', { href: sectionHref(hit.chapter.id, hit.section.id) }, `解説の節を読む：${hit.section.title}`)) : null,
            sourceList(q.sources),
          )
        : null,
      h(
        'div',
        { class: 'sticky-action' },
        item.done
          ? h(
              'div',
              { class: 'btn-row' },
              prev,
              h('button', {
                type: 'button',
                class: 'btn primary big grow',
                onClick: () => {
                  quiz.advance(s);
                  if (s.finished) navigate('quiz/result', { replace: true });
                  else {
                    draw();
                    window.scrollTo(0, 0);
                  }
                },
              }, last ? '結果を見る' : '次へ'),
            )
          : h(
              'div',
              { class: 'btn-row' },
              prev,
              h('button', { type: 'button', class: 'btn primary big grow', disabled: item.selected == null, onClick: () => { quiz.commit(s, q); draw(true); } }, '答え合わせ'),
            ),
      ),
    );
    if (scrollToResult) document.getElementById('result-banner')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };
  draw();
}

function resultView(root) {
  const s = storage.getQuizSession();
  if (!s) return navigate('quiz', { replace: true });
  const r = quiz.summary(s);
  const wrongQs = r.wrong.map((i) => quiz.questionById(i.id)).filter(Boolean);
  put(
    root,
    h('header', { class: 'run-head' }, h('a', { class: 'btn small', href: '#/quiz' }, '演習'), h('span', { class: 'run-progress' }, s.label), h('span')),
    h('h1', null, '結果'),
    h('section', { class: 'card' }, h('p', { class: 'score' }, `${pct(r.ok, r.done)}%`), h('p', { class: 'score-sub' }, `${r.done}問中 ${r.ok}問 正解`)),
    wrongQs.length
      ? h(
          'section',
          { class: 'card' },
          h('h2', null, '間違えた問題'),
          h('ul', { class: 'link-list' }, wrongQs.map((q) => {
            const hit = findSection(q.sectionId);
            return h('li', null, h('a', { href: hit ? sectionHref(hit.chapter.id, hit.section.id) : '#/learn' }, h('span', { class: 'link-title' }, richText(q.question)), h('span', { class: 'muted small' }, hit ? `解説：${hit.section.title}` : '')));
          })),
        )
      : h('p', { class: 'notice' }, 'すべて正解でした。'),
    h('div', { class: 'btn-col' }, wrongQs.length ? h('a', { class: 'btn big primary', href: '#/quiz/weak' }, '苦手を復習する') : null, h('a', { class: 'btn big', href: '#/quiz' }, '演習のメニューへ')),
  );
}
