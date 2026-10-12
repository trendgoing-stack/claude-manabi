// 学ぶタブ：解説テキスト（目次 → 章 → 節）。辞典・用語集・暗記カードは上部の切り替えから別ルートで開く
import { h, fill, put } from '../dom.js';
import * as storage from '../storage.js';
import { app } from '../state.js';
import { richText } from '../render/text.js';
import { renderSectionBody } from '../render/lesson.js';
import { metaBadges, staleNotice, sourceList } from '../render/badges.js';
import { parts, chaptersOf, chapterById, flatSections, sectionHref, progressOf } from '../parts.js';
import { toast } from '../ui/toast.js';
import { setAiContext } from '../ui/ask-ai.js';

/** 学ぶタブの上部の切り替え（テキスト／辞典／用語集／暗記カード） */
export function learnNav(current) {
  const item = (id, label) =>
    h('a', { href: `#/${id}`, class: 'chip' + (current === id ? ' is-on' : ''), 'aria-current': current === id ? 'page' : null }, label);
  return h('nav', { class: 'chips subnav', 'aria-label': '学ぶ' }, item('learn', 'テキスト'), item('dict', '辞典'), item('terms', '用語集'), item('cards', '暗記カード'));
}

const readMark = (done, total) =>
  h('span', { class: 'read-mark' + (done === total && total ? ' is-done' : '') }, done === total && total ? '読了' : `${done}/${total}`);

export function learnView(root, [chapterId, sectionId]) {
  const chapter = chapterId ? chapterById(chapterId) : null;
  if (!chapter) return indexView(root);
  const section = sectionId ? chapter.sections.find((s) => s.id === sectionId) : null;
  return section ? sectionView(root, chapter, section) : chapterView(root, chapter);
}

function indexView(root) {
  const read = storage.getRead();
  put(root, h('h1', null, '学ぶ'), learnNav('learn'));
  if (!app.data.texts.length) {
    put(root, h('p', { class: 'notice' }, '解説テキストを読み込めませんでした。'));
    return;
  }
  for (const p of parts()) {
    const chapters = chaptersOf(p.id);
    if (!chapters.length) continue;
    const pr = progressOf(p.id, read);
    put(root,
      h('h2', { class: 'part-heading' }, p.title, h('span', { class: 'muted' }, `読了 ${pr.done}/${pr.total}節`)),
      h(
        'section',
        { class: 'card' },
        h(
          'ul',
          { class: 'lesson-chapters' },
          chapters.map((c) =>
            h(
              'li',
              null,
              h(
                'a',
                { href: `#/learn/${encodeURIComponent(c.id)}` },
                h('span', { class: 'grow' }, h('span', { class: 'term-name' }, c.title), h('br'), h('span', { class: 'muted small' }, `${c.sections.length}節・約${c.minutes}分`)),
                readMark(c.sections.filter((s) => read[s.id]).length, c.sections.length),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

function chapterView(root, chapter) {
  const read = storage.getRead();
  const part = parts().find((p) => p.id === chapter.part);
  put(root,
    h('header', { class: 'run-head' }, h('a', { class: 'btn small', href: '#/learn' }, '目次'), h('span', { class: 'run-progress' }, part?.title ?? ''), h('span')),
    h('h1', null, richText(chapter.title)),
    h('p', null, richText(chapter.summary)),
    h('p', { class: 'muted small' }, `${chapter.sections.length}節・読む時間の目安 約${chapter.minutes}分`),
    h(
      'section',
      { class: 'card' },
      h(
        'ul',
        { class: 'lesson-chapters' },
        chapter.sections.map((s) =>
          h(
            'li',
            null,
            h('a', { href: sectionHref(chapter.id, s.id) }, h('span', { class: 'grow' }, richText(s.title)), h('span', { class: 'read-mark' + (read[s.id] ? ' is-done' : '') }, read[s.id] ? '読了' : '未読')),
          ),
        ),
      ),
    ),
  );
}

/** 節の末尾：関連する辞典の項目・課題（データがあるものだけ） */
function relatedLinks(section) {
  const dict = (section.dictIds ?? []).map((id) => app.data.dictById.get(id)).filter(Boolean);
  const tasks = (section.tryIds ?? []).map((id) => app.data.tasks.find((t) => t.id === id)).filter(Boolean);
  return [
    dict.length
      ? h('section', { class: 'related' }, h('h2', null, '関連する辞典の項目'), h('div', { class: 'chips' }, dict.map((d) => h('a', { class: 'chip', href: `#/dict/${encodeURIComponent(d.id)}` }, d.name))))
      : null,
    tasks.length
      ? h('section', { class: 'related' }, h('h2', null, 'やってみよう'), h('div', { class: 'chips' }, tasks.map((t) => h('a', { class: 'chip', href: `#/try/${encodeURIComponent(t.id)}` }, t.title))))
      : null,
  ];
}

/** 「この節のクイズを解く」。出題できる問題（節が照合済み）が無ければ理由を添えて無効にする */
function quizButton(section) {
  const n = app.data.quiz.filter((q) => q.sectionId === section.id).length;
  const verified = section.verification?.status === 'doc-verified' || section.verification?.status === 'tried';
  const label = !n ? 'この節のクイズはまだありません' : !verified ? `この節のクイズ（${n}問）は、節が未確認のため出題しません` : `この節のクイズを解く（${n}問）`;
  return h('a', { class: 'btn big' + (n && verified ? '' : ' is-disabled'), href: n && verified ? `#/quiz/section/${encodeURIComponent(section.id)}` : null, 'aria-disabled': n && verified ? null : 'true' }, label);
}

function sectionView(root, chapter, section) {
  storage.touchSection(section.id);
  setAiContext({ kind: 'section', chapter, section, part: parts().find((p) => p.id === chapter.part)?.title });
  const flat = flatSections();
  const i = flat.findIndex((x) => x.section.id === section.id);
  const link = (x, label) => (x ? h('a', { class: 'btn', href: sectionHref(x.chapter.id, x.section.id) }, label) : h('span', { class: 'btn is-placeholder', 'aria-hidden': 'true' }));

  const mark = h('button', { type: 'button', class: 'btn big' });
  const drawMark = () => {
    const done = !!storage.getRead()[section.id];
    mark.className = 'btn big' + (done ? '' : ' primary');
    mark.textContent = done ? '読了を取り消す' : '読んだ';
    mark.onclick = () => {
      if (storage.setRead(section.id, !done) && !done) toast('読了にしました');
      drawMark();
    };
  };
  drawMark();

  // 要約／詳細の切り替え（最後の選択を保存する）
  let summary = storage.getSettings().learnMode === 'summary';
  const body = h('div');
  const hint = h('p', { class: 'muted small' });
  const modeBar = h('div', { class: 'chips subnav', role: 'group', 'aria-label': '表示の詳しさ' });
  const drawBody = () => {
    fill(body, !summary && section.points?.length ? h('ul', { class: 'lesson-points' }, section.points.map((p) => h('li', null, richText(p)))) : null, renderSectionBody(section, summary));
    hint.textContent = summary
      ? '要約表示：まとめ・図・表・注意書き・コードだけを表示しています。説明は「詳細」で読めます。'
      : '点線の下線がある用語をタップすると、定義を表示します。';
    const chip = (label, on, value) =>
      h('button', {
        type: 'button',
        class: 'chip' + (on ? ' is-on' : ''),
        'aria-pressed': String(on),
        onClick: () => {
          summary = value;
          storage.saveSettings({ learnMode: value ? 'summary' : 'detail' });
          drawBody();
        },
      }, label);
    fill(modeBar, chip('要約', summary, true), chip('詳細', !summary, false));
  };
  drawBody();

  put(root,
    h('header', { class: 'run-head' }, h('a', { class: 'btn small', href: `#/learn/${encodeURIComponent(chapter.id)}` }, '章'), h('span', { class: 'run-progress' }, richText(chapter.title)), h('span')),
    h('h1', null, richText(section.title)),
    metaBadges(section),
    staleNotice(section),
    modeBar,
    body,
    hint,
    sourceList(section.sources),
    h('div', { class: 'btn-col' }, mark, quizButton(section)),
    relatedLinks(section),
    h('div', { class: 'lesson-nav' }, link(flat[i - 1], '← 前の節'), link(flat[i + 1], '次の節 →')),
  );
}
