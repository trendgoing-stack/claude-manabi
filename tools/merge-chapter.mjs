// 反映済みの下書き（work/<章id>-draft.json・-quiz.json・-terms.json）を本番の data/ に入れる
// 使い方: node tools/merge-chapter.mjs <章id> [<章id> ...]
//   - data/text/<file>.json と data/quiz/<file>.json を書き、meta.json の textFiles・quizFiles（章番号の順）と counts を更新する
//   - 用語は data/glossary.json に足す。id か表記が既存の用語と同じものは足さずに一覧で知らせる
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { ROOT, readJson } from './load-data.mjs';

const ids = process.argv.slice(2);
if (!ids.length) {
  console.error('使い方: node tools/merge-chapter.mjs <章id> ...');
  process.exit(1);
}
const save = (rel, obj) => writeFile(path.join(ROOT, rel), JSON.stringify(obj, null, 2) + '\n');
const work = async (f) => JSON.parse(await readFile(path.join(ROOT, 'work', f), 'utf8'));
const { chapters } = await readJson('tools/chapters.json');
const meta = await readJson('data/meta.json');
const glossary = await readJson('data/glossary.json');
await mkdir(path.join(ROOT, 'data/text'), { recursive: true });
await mkdir(path.join(ROOT, 'data/quiz'), { recursive: true });

const byOrder = (a, b) => Number(a.match(/\/[a-z](\d+)-/)[1]) - Number(b.match(/\/[a-z](\d+)-/)[1]);
for (const id of ids) {
  const plan = chapters.find((c) => c.id === id);
  const draft = await work(`${id}-draft.json`);
  await save(`data/text/${plan.file}.json`, draft);
  if (!meta.textFiles.includes(`text/${plan.file}.json`)) meta.textFiles.push(`text/${plan.file}.json`);
  const quiz = await work(`${id}-quiz.json`).catch(() => null);
  if (quiz) {
    await save(`data/quiz/${plan.file}.json`, quiz);
    if (!meta.quizFiles.includes(`quiz/${plan.file}.json`)) meta.quizFiles.push(`quiz/${plan.file}.json`);
  }
  const terms = (await work(`${id}-terms.json`).catch(() => ({ terms: [] }))).terms ?? [];
  const names = new Map(glossary.terms.flatMap((t) => [t.term, ...(t.aliases ?? [])].map((n) => [n.toLowerCase(), t.id])));
  const skipped = [];
  const rename = new Map(); // 追加しなかった用語の id → 既存の用語の id（章の中の参照を付け替える）
  for (const t of terms) {
    const clash = glossary.terms.find((g) => g.id === t.id)?.id ?? [t.term, ...(t.aliases ?? [])].map((n) => names.get(n.toLowerCase())).find(Boolean);
    if (clash) {
      skipped.push(`${t.id}（${t.term}）→ 既存の ${clash}`);
      if (clash !== t.id) rename.set(t.id, clash);
      continue;
    }
    glossary.terms.push(t);
    for (const n of [t.term, ...(t.aliases ?? [])]) names.set(n.toLowerCase(), t.id);
  }
  if (rename.size) {
    // 章・クイズの [[表示|id]] と、用語の related を既存の id に付け替える
    const swap = (str) => str.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, (m, x, y) => (rename.has(y) ? `[[${x}|${rename.get(y)}]]` : m));
    await save(`data/text/${plan.file}.json`, JSON.parse(swap(JSON.stringify(draft))));
    if (quiz) await save(`data/quiz/${plan.file}.json`, JSON.parse(swap(JSON.stringify(quiz))));
    for (const g of glossary.terms) if (g.related) g.related = [...new Set(g.related.map((r) => rename.get(r) ?? r))].filter((r) => r !== g.id);
  }
  console.log(`${id}: ${draft.sections.length}節・クイズ ${quiz?.questions?.length ?? 0}問・用語 ${terms.length - skipped.length}語を追加`);
  for (const s of skipped) console.log(`  用語を追加しなかった：${s}`);
}
meta.textFiles.sort(byOrder);
meta.quizFiles.sort(byOrder);
glossary.terms.sort((a, b) => a.reading.localeCompare(b.reading, 'ja'));

// counts を実数に合わせる
const texts = await Promise.all(meta.textFiles.map((f) => readJson(`data/${f}`)));
const quizzes = await Promise.all(meta.quizFiles.map((f) => readJson(`data/${f}`)));
const dicts = await Promise.all(meta.dictFiles.map((f) => readJson(`data/${f}`)));
const tryData = await readJson(`data/${meta.tryFile}`).catch(() => ({ tasks: [] }));
meta.counts = {
  sections: texts.reduce((n, c) => n + c.sections.length, 0),
  quiz: quizzes.reduce((n, q) => n + q.questions.length, 0),
  dict: dicts.reduce((n, d) => n + d.items.length, 0),
  glossary: glossary.terms.length,
  try: tryData.tasks.length,
};
await save('data/meta.json', meta);
await save('data/glossary.json', glossary);
console.log('meta.json と glossary.json を更新しました。node tools/validate.mjs を実行してください');
