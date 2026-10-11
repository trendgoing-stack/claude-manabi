// 部・章・節の並びと索引。部の一覧は meta.json の parts[] から作り、コードには固定のリストを持たない。
import { app } from './state.js';

/** 表示順の部 @returns {import('./types.js').Part[]} */
export const parts = () => [...(app.data.meta?.parts ?? [])].sort((a, b) => a.order - b.order);

/** その部の章（章番号の順） */
export const chaptersOf = (partId) => app.data.texts.filter((c) => c.part === partId);

export const chapterById = (id) => app.data.texts.find((c) => c.id === id) ?? null;

let flatCache = null;
let flatFor = null;

/** すべての節を読む順に一列に並べたもの（前後の節への移動・索引に使う） */
export function flatSections() {
  if (flatFor !== app.data.texts) {
    const order = new Map(parts().map((p, i) => [p.id, i]));
    flatCache = [...app.data.texts]
      .sort((a, b) => (order.get(a.part) ?? 99) - (order.get(b.part) ?? 99) || a.order - b.order)
      .flatMap((chapter) => chapter.sections.map((section) => ({ chapter, section })));
    flatFor = app.data.texts;
  }
  return flatCache;
}

/** 節 id → {chapter, section} */
export const findSection = (sectionId) => flatSections().find((x) => x.section.id === sectionId) ?? null;

export const sectionHref = (chapterId, sectionId) => `#/learn/${encodeURIComponent(chapterId)}/${encodeURIComponent(sectionId)}`;

/** 部ごとの読了数 @param {Object<string, number>} read */
export function progressOf(partId, read) {
  const secs = chaptersOf(partId).flatMap((c) => c.sections);
  return { done: secs.filter((s) => read[s.id]).length, total: secs.length };
}
