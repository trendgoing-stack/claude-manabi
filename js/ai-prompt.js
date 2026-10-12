// 「AIに聞く」用のプロンプトを組み立てる（外部の AI に貼り付けて使う）。
// アプリは通信しない。ここで作るのは文字列だけ。
import { plainText } from './render/text.js';
import { formatDate } from './freshness.js';
import { DICT_KINDS } from './dict-kinds.js';

export const MODES = [
  { id: 'explain', label: '解説', ask: '選択した部分の意味と、なぜそうなっているのかを解説してください。' },
  { id: 'easy', label: 'やさしく', ask: '初めて使う人にも分かるように、専門用語をかみ砕いて説明してください。用語を使うときは一言で言い換えを添えてください。' },
  { id: 'analogy', label: '例え話', ask: '身近な例え話を1つ使って説明してください。例えのどこが実際の仕組みのどこに対応するかも書いてください。' },
  { id: 'usecase', label: '使いどころ', ask: 'どんな場面で使うと役に立つか、具体的な使い方の例を2〜3個挙げてください。使わないほうがよい場面や注意点もあれば添えてください。' },
  { id: 'quiz', label: '確認問題', ask: '選択した部分の理解を確かめる四択問題を1問作ってください。正解と、各選択肢が正しい／誤りである理由も付けてください。' },
];

export const LABELS = ['ア', 'イ', 'ウ', 'エ'];

const clip = (s, n) => {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n) + '…' : t;
};

/** 出どころ（章・節、辞典の項目、問題）を文章にする。確認日も入れる */
export function describeContext(ctx) {
  if (!ctx) return { text: '', checkedAt: '' };
  if (ctx.kind === 'section') {
    return {
      text: [`学習アプリの解説（${ctx.part ?? ''}）`, `章：${plainText(ctx.chapter.title)}`, `節：${plainText(ctx.section.title)}`].join('\n'),
      checkedAt: ctx.section.checkedAt,
    };
  }
  if (ctx.kind === 'dict') {
    const d = ctx.item;
    return {
      text: [`学習アプリの辞典（${DICT_KINDS[d.kind]?.label ?? d.kind}）`, `項目：${d.name}${d.os ? `（Windows：${d.os.win}／Mac：${d.os.mac}）` : ''}`, `要約：${plainText(d.summary)}`].join('\n'),
      checkedAt: d.checkedAt,
    };
  }
  if (ctx.kind === 'question') {
    const { q, order, revealed, section } = ctx;
    const lines = ['学習アプリの確認クイズ'];
    if (section) lines.push(`出題の節：${plainText(section.title)}`);
    lines.push('問題文：', plainText(q.question), '選択肢：', order.map((ci, pos) => `${LABELS[pos]}. ${plainText(q.choices[ci])}`).join('\n'));
    // 答え合わせ前は、正解や解説を渡さない（自分で考える前に答えが見えないように）
    if (revealed) lines.push(`正解：${LABELS[order.indexOf(q.answer)]}`, '解説：' + plainText(q.explanation));
    return { text: lines.join('\n'), checkedAt: section?.checkedAt ?? '' };
  }
  return { text: '', checkedAt: '' };
}

/**
 * @param {Object} o
 * @param {string} o.selection   選択した文字列
 * @param {string} [o.around]    選択を含む段落・項目の文
 * @param {string} o.mode        MODES の id
 * @param {string} [o.extra]     追加の質問
 * @param {Object|null} o.ctx    setAiContext で渡された文脈
 */
export function buildPrompt({ selection, around, mode, extra, ctx }) {
  const m = MODES.find((x) => x.id === mode) ?? MODES[0];
  const src = describeContext(ctx);
  const out = [];
  out.push('Claude アプリと Claude Code の使い方を学んでいます。学習アプリで選択した部分について、次の依頼に答えてください。', '');
  out.push('# 依頼', m.ask);
  if (extra?.trim()) out.push(`追加の質問：${extra.trim()}`);
  out.push('', '# 選択した部分', `「${plainText(selection).trim()}」`);
  const a = clip(plainText(around), 400);
  if (a && a !== clip(plainText(selection), 400)) out.push('', '# 選択を含む文', a);
  if (src.text) out.push('', '# 出どころ（背景として使ってください）', src.text);
  if (src.checkedAt) out.push(`確認日：${formatDate(src.checkedAt)}`);
  out.push(
    '',
    '# 回答の条件',
    `- この内容は確認日${src.checkedAt ? `（${formatDate(src.checkedAt)}）` : ''}時点のものです。最新の公式ドキュメントと食い違う場合は、最新の情報を優先して、食い違いを指摘してください`,
    '- 日本語で、400字程度を目安に簡潔に書く',
    '- 確かでない点は断定せず「確実ではない」と書く。料金や利用上限は、公式ページで確かめるよう案内する',
    '- 最後に「覚えるポイント」を1行で添える',
  );
  return out.join('\n');
}
