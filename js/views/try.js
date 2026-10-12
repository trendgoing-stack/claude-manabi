// 演習：やってみよう（実際に手を動かす課題）
//   #/try         一覧（部・所要時間・完了状況で絞り込み）
//   #/try/<課題id> 詳細（目的・手順・期待する結果・注意、「やった」のチェックと自分用メモ）
import { h, fill, put } from '../dom.js';
import * as storage from '../storage.js';
import { app } from '../state.js';
import { practiceNav } from './quiz.js';
import { linked } from '../render/lesson.js';
import { richText } from '../render/text.js';
import { SURFACE_LABEL } from '../render/badges.js';
import { parts, findSection, sectionHref } from '../parts.js';
import { debounce } from '../search.js';
import { toast } from '../ui/toast.js';

const partOf = (t) => (Number(t.id.slice(4, 6)) <= 10 ? 'a' : 'c');
const fmt = (ms) => {
  const d = new Date(ms);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export function tryView(root, [id]) {
  return id ? detailView(root, id) : listView(root);
}

function listView(root) {
  const saved = storage.getMeta().tryFilter ?? {};
  let f = { part: saved.part ?? '', time: saved.time ?? 0, done: saved.done ?? '' };
  const body = h('div');
  const draw = () => {
    storage.saveMeta({ tryFilter: f });
    const done = storage.getTry();
    const chip = (on, label, patch) => h('button', { type: 'button', class: 'chip' + (on ? ' is-on' : ''), 'aria-pressed': String(on), onClick: () => { f = { ...f, ...patch }; draw(); } }, label);
    const hits = app.data.tasks.filter((t) => (!f.part || partOf(t) === f.part) && (!f.time || t.minutes <= f.time) && (!f.done || (f.done === 'done') === !!done[t.id]?.doneAt));
    fill(
      body,
      h('div', { class: 'chips subnav', role: 'group', 'aria-label': '部' }, chip(!f.part, 'すべて', { part: '' }), parts().map((p) => chip(f.part === p.id, p.title.replace(/^第\d+部\s*/, ''), { part: p.id }))),
      h('div', { class: 'chips subnav', role: 'group', 'aria-label': '所要時間' }, chip(!f.time, '時間：すべて', { time: 0 }), chip(f.time === 10, '10分以内', { time: 10 }), chip(f.time === 20, '20分以内', { time: 20 })),
      h('div', { class: 'chips subnav', role: 'group', 'aria-label': '完了状況' }, chip(!f.done, 'すべて', { done: '' }), chip(f.done === 'todo', 'まだ', { done: 'todo' }), chip(f.done === 'done', 'やった', { done: 'done' })),
      h('p', { class: 'muted small' }, `${hits.length}件（やった ${app.data.tasks.filter((t) => done[t.id]?.doneAt).length}/${app.data.tasks.length}件）`),
      hits.length
        ? h('section', { class: 'card' }, h('ul', { class: 'lesson-chapters' }, hits.map((t) =>
            h('li', null, h('a', { href: `#/try/${encodeURIComponent(t.id)}` },
              h('span', { class: 'grow' }, h('span', { class: 'term-name' }, t.title), h('br'), h('span', { class: 'muted small' }, `${SURFACE_LABEL[t.surface] ?? t.surface}・約${t.minutes}分`)),
              h('span', { class: 'read-mark' + (done[t.id]?.doneAt ? ' is-done' : '') }, done[t.id]?.doneAt ? 'やった' : 'まだ'))))))
        : h('p', { class: 'muted' }, app.data.tasks.length ? '該当する課題がありません。' : '課題を読み込めませんでした。'),
    );
  };
  put(root, h('h1', null, '演習'), practiceNav('try'), h('p', { class: 'notice' }, '課題はすべて、練習用のフォルダ・リポジトリ・チャットで行ってください。'), body);
  draw();
}

function detailView(root, id) {
  const t = app.data.tasks.find((x) => x.id === id);
  const back = h('a', { class: 'btn small', href: '#/try' }, '一覧');
  if (!t) {
    put(root, h('header', { class: 'run-head' }, back), h('p', null, '課題が見つかりません。'));
    return;
  }
  const status = h('p', { class: 'muted small', role: 'status' });
  const check = h('input', { type: 'checkbox', class: 'switch', id: 'try-done' });
  const memo = h('textarea', { class: 'input', rows: 4, maxLength: storage.MEMO_MAX, placeholder: '自分用のメモ（最大2000文字。この端末にだけ保存されます）', 'aria-label': '自分用のメモ' });
  const rec = storage.getTry()[t.id];
  check.checked = !!rec?.doneAt;
  memo.value = rec?.memo ?? '';
  const drawStatus = () => {
    const r = storage.getTry()[t.id];
    status.textContent = r?.doneAt ? `やった：${fmt(r.doneAt)}` : 'まだ';
  };
  check.addEventListener('change', () => {
    if (storage.saveTry(t.id, { doneAt: check.checked ? Date.now() : null }) && check.checked) toast('「やった」にしました');
    drawStatus();
  });
  memo.addEventListener('input', debounce(() => storage.saveTry(t.id, { memo: memo.value }), 400));
  drawStatus();
  const sections = (t.sectionIds ?? []).map(findSection).filter(Boolean);
  put(
    root,
    h('header', { class: 'run-head' }, back, h('span', { class: 'run-progress' }, `${SURFACE_LABEL[t.surface] ?? t.surface}・約${t.minutes}分`), h('span')),
    h('h1', null, richText(t.title)),
    h('section', { class: 'card accent' }, h('h2', null, '目的'), h('p', null, linked(t.goal))),
    h('section', { class: 'card' }, h('h2', null, '手順'), h('ol', { class: 'lesson-steps' }, t.steps.map((s) => h('li', null, linked(s))))),
    h('section', { class: 'card' }, h('h2', null, '期待する結果'), h('p', null, linked(t.expected))),
    t.cautions?.length ? h('div', { class: 'lesson-note is-caution' }, h('span', { class: 'note-title' }, '注意'), h('ul', { class: 'lesson-steps' }, t.cautions.map((c) => h('li', null, linked(c))))) : null,
    h('section', { class: 'card' }, h('label', { class: 'setting-row', for: 'try-done' }, h('span', null, h('b', null, 'やった'), h('br'), status), check), memo),
    sections.length
      ? h('section', { class: 'related' }, h('h2', null, '解説で読む'), h('ul', { class: 'link-list' }, sections.map((x) => h('li', null, h('a', { href: sectionHref(x.chapter.id, x.section.id) }, h('span', { class: 'link-title' }, richText(x.section.title)), h('span', { class: 'muted small' }, richText(x.chapter.title)))))))
      : null,
  );
}
