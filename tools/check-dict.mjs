// 辞典の下書き（work/dict-<種類>.json）を、本番データに入れたつもりで検査する
// 使い方: node tools/check-dict.mjs <種類>
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ROOT, loadAll } from './load-data.mjs';
import { validateAll } from './validate-core.js';

const kind = process.argv[2];
if (!kind) {
  console.error('使い方: node tools/check-dict.mjs <種類>');
  process.exit(1);
}
const draft = JSON.parse(await readFile(path.join(ROOT, 'work', `dict-${kind}.json`), 'utf8'));
const input = await loadAll();
const file = `dict/${kind}.json`;
input.dicts = [...input.dicts.filter((d) => d.file !== file), { file, json: draft }];
input.swText = null;
const r = validateAll(input);
const errors = r.errors.filter((e) => !(e.where === 'meta.json' && e.msg.startsWith('counts.')));
const items = draft.items ?? [];
if (draft.kind !== kind) errors.push({ where: file, msg: `kind が「${kind}」でない` });
for (const d of items) {
  if (d.kind !== kind) errors.push({ where: `dict:${d.id}`, msg: `kind が「${kind}」でない` });
  const prefix = { slash: 'slash-', key: 'key-', 'cli-flag': 'flag-', setting: 'set-', path: 'path-' }[kind];
  if (!d.id?.startsWith(prefix)) errors.push({ where: `dict:${d.id}`, msg: `id は ${prefix} で始める` });
}
console.log(`${kind}: ${items.length}項目（sectionIds あり ${items.filter((d) => d.sectionIds?.length).length}件）`);
for (const w of r.warnings.filter((w) => w.where.startsWith('dict:') || w.where === 'verification')) console.log(`警告 ${w.where}: ${w.msg}`);
for (const e of errors) console.log(`エラー ${e.where}: ${e.msg}`);
console.log(errors.length ? `エラー ${errors.length}件` : 'OK');
process.exit(errors.length ? 1 : 0);
