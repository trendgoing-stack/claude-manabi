// 作業中の章（work/ の下書き）を、本番データに入れたつもりで検査する（作成・反映のエージェント用）
// 使い方: node tools/check-draft.mjs <章id>
//   work/<章id>-draft.json・work/<章id>-quiz.json・work/<章id>-terms.json を読み、
//   本番の data/ と合わせて validate-core の検査にかける（counts の不一致は無視する）
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ROOT, loadAll } from './load-data.mjs';
import { validateAll } from './validate-core.js';

const id = process.argv[2];
if (!id) {
  console.error('使い方: node tools/check-draft.mjs <章id>');
  process.exit(1);
}
const read = async (f) => JSON.parse(await readFile(path.join(ROOT, 'work', f), 'utf8'));
const { chapters } = JSON.parse(await readFile(path.join(ROOT, 'tools/chapters.json'), 'utf8'));
const plan = chapters.find((c) => c.id === id);
const draft = await read(`${id}-draft.json`);
const quiz = await read(`${id}-quiz.json`).catch(() => null);
const terms = await read(`${id}-terms.json`).catch(() => ({ terms: [] }));

const input = await loadAll();
const textFile = `text/${plan.file}.json`;
input.texts = [...input.texts.filter((t) => t.file !== textFile), { file: textFile, json: draft }];
if (quiz) input.quizzes = [...input.quizzes.filter((q) => q.file !== `quiz/${plan.file}.json`), { file: `quiz/${plan.file}.json`, json: quiz }];
const known = new Set((input.glossary?.terms ?? []).map((t) => t.id));
input.glossary = { schemaVersion: 1, terms: [...(input.glossary?.terms ?? []), ...(terms.terms ?? []).filter((t) => !known.has(t.id))] };
input.swText = null;

const r = validateAll(input);
const errors = r.errors.filter((e) => !(e.where === 'meta.json' && e.msg.startsWith('counts.')));
const ch = draft.sections ?? [];
// 本文の字数：text・items・answer・code・表のセル（図は数えない）
const bodyChars = (b) => [b.text, b.answer, b.code, ...(b.items ?? []), ...(b.table?.rows?.flat() ?? [])].filter(Boolean).join('').length;
const chars = ch.flatMap((s) => s.blocks ?? []).reduce((n, b) => n + bodyChars(b), 0);
const minutes = Math.ceil(chars / 500);
if (draft.minutes !== minutes) console.log(`注意 minutes（${draft.minutes}）が本文の字数から求めた値（${minutes}）と違う`);
console.log(`${id}: ${ch.length}節・本文 約${chars}字（読む時間 約${minutes}分）・図 ${ch.flatMap((s) => s.blocks ?? []).filter((b) => b.type === 'figure').length}個・クイズ ${quiz?.questions?.length ?? 0}問・追加用語 ${terms.terms?.length ?? 0}語`);
for (const w of r.warnings) console.log(`警告 ${w.where}: ${w.msg}`);
for (const e of errors) console.log(`エラー ${e.where}: ${e.msg}`);
console.log(errors.length ? `エラー ${errors.length}件` : 'OK');
process.exit(errors.length ? 1 : 0);
