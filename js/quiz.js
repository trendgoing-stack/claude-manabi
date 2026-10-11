// 確認クイズ：出題の対象と選び方、出題中の状態（中断しても続きから再開できる）
import * as storage from './storage.js';
import { app } from './state.js';
import { findSection } from './parts.js';

export const SET_SIZE = 10;

/** @template T @param {T[]} arr @returns {T[]} */
export function shuffled(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 節が公式情報で照合済み（doc-verified／tried）か */
export const sectionVerified = (sectionId) => {
  const st = findSection(sectionId)?.section.verification?.status;
  return st === 'doc-verified' || st === 'tried';
};

/** 出題の対象：所属する節が照合済みの問題だけ（unverified の節の問題は出さない） */
export const eligible = () => app.data.quiz.filter((q) => sectionVerified(q.sectionId));

export const questionById = (id) => app.data.quiz.find((q) => q.id === id) ?? null;

/** 章の問題（対象外も含めた総数と、出題できる問題） */
export function chapterPool(chapterId) {
  const all = app.data.quiz.filter((q) => q.sectionId.startsWith(`${chapterId}-`));
  return { all, ok: all.filter((q) => sectionVerified(q.sectionId)) };
}

export function sectionPool(sectionId) {
  const all = app.data.quiz.filter((q) => q.sectionId === sectionId);
  return { all, ok: all.filter((q) => sectionVerified(q.sectionId)) };
}

/** 苦手：一度でも間違えた問題を、不正解率の高い順、同率なら最終回答日時の古い順に並べる */
export function weakOrder(questions = eligible(), answers = storage.getAnswers()) {
  return questions
    .map((q) => ({ q, a: answers[q.id] }))
    .filter(({ a }) => a && a.ng > 0)
    .sort((x, y) => y.a.ng / (y.a.ok + y.a.ng) - x.a.ng / (x.a.ok + x.a.ng) || x.a.last - y.a.last)
    .map(({ q }) => q);
}

/**
 * 新しいセットを作って保存する
 * @param {'chapter'|'section'|'random'|'weak'} mode
 * @param {string} label
 * @param {import('./types.js').QuizQuestion[]} questions  出題順
 */
export function createSession(mode, label, questions) {
  const s = {
    mode,
    label,
    startedAt: Date.now(),
    pos: 0,
    finished: false,
    items: questions.map((q) => {
      const base = [0, 1, 2, 3];
      // 表示位置 → choices の index。正誤は常に choices の index で判定する
      return { id: q.id, order: q.fixedOrder ? base : shuffled(base), selected: null, done: false, ok: null };
    }),
  };
  storage.saveQuizSession(s);
  return s;
}

export const isActive = (s) => !!s && !s.finished && s.items.length > 0;

export function select(s, choiceIndex) {
  const item = s.items[s.pos];
  if (item.done) return;
  item.selected = choiceIndex;
  storage.saveQuizSession(s);
}

/** 答え合わせ。回答を記録する */
export function commit(s, q) {
  const item = s.items[s.pos];
  if (item.done || item.selected == null) return item;
  item.ok = item.selected === q.answer;
  item.done = true;
  storage.recordAnswer(q.id, item.ok);
  storage.saveQuizSession(s);
  return item;
}

export function advance(s) {
  if (s.pos < s.items.length - 1) s.pos++;
  else s.finished = true;
  storage.saveQuizSession(s);
}

export function back(s) {
  if (s.pos > 0) s.pos--;
  storage.saveQuizSession(s);
}

export function summary(s) {
  const done = s.items.filter((i) => i.done);
  return { total: s.items.length, done: done.length, ok: done.filter((i) => i.ok).length, wrong: done.filter((i) => !i.ok) };
}
