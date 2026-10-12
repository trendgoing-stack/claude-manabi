// 暗記カードと「今日の復習」
//   カード id：用語集は「g:<用語id>」、辞典は「d:<項目id>」
//   「まだ」にしたカードは翌日を期限にし、期限が来たら今日の復習に出す。「覚えた」は期限なし
//   クイズは、最後の回答が不正解だった問題を今日の復習に出す
import * as storage from './storage.js';
import { app } from './state.js';
import { today, addDays } from './date.js';
import { eligible } from './quiz.js';
import { sectionsFor } from './term-index.js';
import { plainText } from './render/text.js';
import { DICT_KINDS } from './dict-kinds.js';

/** カードの表と裏 @returns {{id:string, front:string, sub:string, back:string, keys?:string}} */
export function cardOf(id) {
  if (id.startsWith('g:')) {
    const t = app.data.termById.get(id.slice(2));
    return t ? { id, front: t.term, sub: '用語', back: t.definition } : null;
  }
  const d = app.data.dictById.get(id.slice(2));
  if (!d) return null;
  return { id, front: d.name, sub: DICT_KINDS[d.kind]?.label ?? '辞典', back: d.summary, keys: d.os ? `Windows：${d.os.win}／Mac：${d.os.mac}` : '' };
}

/**
 * 範囲に入るカード id
 * @param {{source:'terms'|'dict', part?:string, chapter?:string, kind?:string}} scope
 */
export function cardsInScope(scope) {
  if (scope.source === 'dict') {
    return app.data.dict.filter((d) => !scope.kind || d.kind === scope.kind).map((d) => `d:${d.id}`);
  }
  return app.data.glossary
    .filter((t) => {
      if (!scope.part && !scope.chapter) return true;
      // その用語が出てくる節の章で絞る
      return sectionsFor(t.id).some(({ chapter }) => (scope.chapter ? chapter.id === scope.chapter : chapter.part === scope.part));
    })
    .map((t) => `g:${t.id}`);
}

/** 「覚えた／まだ」を記録する。まだは翌日以降に復習へ */
export const judgeCard = (id, ok) => storage.recordCard(id, ok ? 'ok' : 'ng', ok ? null : addDays(today(), 1));

/** 今日の復習に出すカード（期限が今日以前の「まだ」） */
export function dueCards() {
  const t = today();
  return Object.entries(storage.getCards())
    .filter(([id, c]) => c.state === 'ng' && c.due && c.due <= t && cardOf(id))
    .sort((a, b) => a[1].due.localeCompare(b[1].due))
    .map(([id]) => id);
}

/** 今日の復習に出す問題（最後の回答が不正解。出題できる問題だけ） */
export function reviewQuestions() {
  const answers = storage.getAnswers();
  return eligible()
    .filter((q) => answers[q.id] && answers[q.id].lastOk === false)
    .sort((a, b) => answers[a.id].last - answers[b.id].last);
}

/** 用語・辞典のカードの、プロンプト用の説明 */
export const cardText = (c) => `${c.front}：${plainText(c.back)}`;
