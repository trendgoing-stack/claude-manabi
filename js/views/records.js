// 記録タブ：章ごとの読了・正答率、苦手な章、課題の完了状況、古い可能性のある節の件数
import { h, put, pct } from '../dom.js';
import * as storage from '../storage.js';
import { app } from '../state.js';
import { parts, chaptersOf, flatSections } from '../parts.js';
import { isStale } from '../freshness.js';
import { chapterPool } from '../quiz.js';

/** 章の集計：読了数、回答のべ数と正解数 */
function chapterStats(c, read, answers) {
  const { all } = chapterPool(c.id);
  let ok = 0;
  let n = 0;
  for (const q of all) {
    const a = answers[q.id];
    if (!a) continue;
    ok += a.ok;
    n += a.ok + a.ng;
  }
  return { c, read: c.sections.filter((s) => read[s.id]).length, total: c.sections.length, ok, n, answered: all.filter((q) => answers[q.id]).length, questions: all.length };
}

const bar = (label, v, count, href) =>
  h(
    href ? 'a' : 'div',
    { class: 'bar-row', href },
    h('span', { class: 'bar-label' }, label),
    h('span', { class: 'bar-track', role: 'img', 'aria-label': `${v}%` }, h('span', { class: 'bar-fill', style: `width:${v}%` })),
    h('span', { class: 'bar-value' }, `${v}%`),
    h('span', { class: 'bar-count muted small' }, count),
  );

export function recordsView(root) {
  const read = storage.getRead();
  const answers = storage.getAnswers();
  const stats = app.data.texts.map((c) => chapterStats(c, read, answers));
  // 苦手な章：5回以上答えて正答率が80%未満の章を、低い順に3つ
  const weak = stats.filter((s) => s.n >= 5 && s.ok / s.n < 0.8).sort((a, b) => a.ok / a.n - b.ok / b.n).slice(0, 3);
  const tries = storage.getTry();
  const doneTasks = app.data.tasks.filter((t) => tries[t.id]?.doneAt).length;
  const stale = flatSections().filter((x) => isStale(x.section.checkedAt)).length + app.data.dict.filter((d) => isStale(d.checkedAt)).length;
  const totalAnswers = Object.values(answers).reduce((n, a) => n + a.ok + a.ng, 0);
  const totalOk = Object.values(answers).reduce((n, a) => n + a.ok, 0);

  put(
    root,
    h('h1', null, '記録'),
    h(
      'div',
      { class: 'tiles' },
      h('div', { class: 'tile' }, h('span', { class: 'tile-label' }, '読んだ節'), h('span', { class: 'tile-value' }, `${Object.keys(read).filter((id) => flatSections().some((x) => x.section.id === id)).length}`)),
      h('div', { class: 'tile' }, h('span', { class: 'tile-label' }, 'クイズの正答率'), h('span', { class: 'tile-value' }, totalAnswers ? `${pct(totalOk, totalAnswers)}%` : '—')),
      h('div', { class: 'tile' }, h('span', { class: 'tile-label' }, '解いた問題'), h('span', { class: 'tile-value' }, `${Object.keys(answers).length}`)),
      h('div', { class: 'tile' }, h('span', { class: 'tile-label' }, 'やってみよう'), h('span', { class: 'tile-value' }, `${doneTasks}/${app.data.tasks.length}`)),
    ),
    weak.length
      ? h('section', { class: 'card' }, h('h2', null, '苦手な章'), h('p', { class: 'muted small' }, '5回以上答えた章のうち、正答率が80%未満の章です。'), weak.map((s) => bar(s.c.title.replace(/^第\d+章\s*/, ''), pct(s.ok, s.n), `${s.ok}/${s.n}`, `#/quiz/chapter/${encodeURIComponent(s.c.id)}`)))
      : null,
    parts().map((p) => {
      const chs = chaptersOf(p.id);
      if (!chs.length) return null;
      return h(
        'section',
        { class: 'card' },
        h('h2', null, p.title),
        h('p', { class: 'muted small' }, '上：読了率、下：クイズの正答率（答えた問題数／章の問題数）'),
        chs.map((c) => {
          const s = stats.find((x) => x.c === c);
          return h(
            'div',
            { class: 'record-chapter' },
            h('a', { class: 'record-title', href: `#/learn/${encodeURIComponent(c.id)}` }, c.title),
            bar('読了', pct(s.read, s.total), `${s.read}/${s.total}`),
            bar('正答率', s.n ? pct(s.ok, s.n) : 0, `${s.answered}/${s.questions}`),
          );
        }),
      );
    }),
    h(
      'section',
      { class: 'card' },
      h('h2', null, '情報の鮮度'),
      stale ? h('a', { class: 'btn big', href: '#/stale' }, `古い可能性のある節・項目 ${stale}件`) : h('p', { class: 'muted small' }, `確認から${storage.getSettings().staleDays}日を超えた節・項目はありません。`),
    ),
  );
}
