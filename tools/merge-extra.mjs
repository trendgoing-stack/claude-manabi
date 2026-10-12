// 辞典・課題の下書きを本番の data/ に入れ、解説の節の dictIds・tryIds を辞典・課題の sectionIds から作り直す
// 使い方:
//   node tools/merge-extra.mjs dict <種類>...   work/dict-<種類>.json → data/dict/<種類>.json（meta.dictFiles に追加）
//   node tools/merge-extra.mjs try               work/try-a.json と work/try-c.json → data/try.json
//   node tools/merge-extra.mjs link              節の dictIds・tryIds を作り直すだけ
// どの場合も最後に link と meta.counts の更新を行う
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { ROOT, readJson } from './load-data.mjs';

const [what, ...args] = process.argv.slice(2);
const save = (rel, obj) => writeFile(path.join(ROOT, rel), JSON.stringify(obj, null, 2) + '\n');
const work = async (f) => JSON.parse(await readFile(path.join(ROOT, 'work', f), 'utf8'));
const meta = await readJson('data/meta.json');
const KIND_ORDER = ['slash', 'key', 'cli-flag', 'setting', 'path'];

if (what === 'dict') {
  await mkdir(path.join(ROOT, 'data/dict'), { recursive: true });
  for (const kind of args) {
    const d = await work(`dict-${kind}.json`);
    await save(`data/dict/${kind}.json`, d);
    if (!meta.dictFiles.includes(`dict/${kind}.json`)) meta.dictFiles.push(`dict/${kind}.json`);
    console.log(`dict/${kind}.json：${d.items.length}項目`);
  }
  meta.dictFiles.sort((a, b) => KIND_ORDER.indexOf(a.slice(5, -5)) - KIND_ORDER.indexOf(b.slice(5, -5)));
} else if (what === 'try') {
  const tasks = [];
  for (const p of ['a', 'c']) tasks.push(...((await work(`try-${p}.json`).catch(() => null))?.tasks ?? []));
  tasks.sort((a, b) => a.id.localeCompare(b.id));
  await save(`data/${meta.tryFile}`, { schemaVersion: 1, tasks });
  console.log(`${meta.tryFile}：${tasks.length}件`);
} else if (what !== 'link') {
  console.error('使い方: node tools/merge-extra.mjs dict <種類>... | try | link');
  process.exit(1);
}

// ---- 節の dictIds・tryIds を作り直す ----
const dicts = await Promise.all(meta.dictFiles.map((f) => readJson(`data/${f}`)));
const tryData = await readJson(`data/${meta.tryFile}`).catch(() => ({ tasks: [] }));
const dictBySection = new Map();
const tryBySection = new Map();
const push = (map, k, v) => map.set(k, [...(map.get(k) ?? []), v]);
for (const d of dicts.flatMap((x) => x.items)) for (const s of d.sectionIds ?? []) push(dictBySection, s, d.id);
for (const t of tryData.tasks) for (const s of t.sectionIds ?? []) push(tryBySection, s, t.id);
let linkedD = 0;
let linkedT = 0;
for (const f of meta.textFiles) {
  const ch = await readJson(`data/${f}`);
  for (const s of ch.sections) {
    s.dictIds = [...new Set(dictBySection.get(s.id) ?? [])];
    s.tryIds = [...new Set(tryBySection.get(s.id) ?? [])];
    linkedD += s.dictIds.length;
    linkedT += s.tryIds.length;
  }
  await save(`data/${f}`, ch);
}

// ---- counts ----
const texts = await Promise.all(meta.textFiles.map((f) => readJson(`data/${f}`)));
const quizzes = await Promise.all(meta.quizFiles.map((f) => readJson(`data/${f}`)));
const glossary = await readJson(`data/${meta.glossaryFile}`);
meta.counts = {
  sections: texts.reduce((n, c) => n + c.sections.length, 0),
  quiz: quizzes.reduce((n, q) => n + q.questions.length, 0),
  dict: dicts.reduce((n, d) => n + d.items.length, 0),
  glossary: glossary.terms.length,
  try: tryData.tasks.length,
};
await save('data/meta.json', meta);
console.log(`節へのリンク：辞典 ${linkedD}件・課題 ${linkedT}件。node tools/validate.mjs を実行してください`);
