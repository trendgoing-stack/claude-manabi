// 「やってみよう」の下書き（work/try-<部>.json）を検査する。work/try-a.json と work/try-c.json をまとめて本番に入れたつもりで調べる
// 使い方: node tools/check-try.mjs [a|c]   （省略時は両方）
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ROOT, loadAll } from './load-data.mjs';
import { validateAll } from './validate-core.js';

const read = (p) => readFile(path.join(ROOT, 'work', `try-${p}.json`), 'utf8').then(JSON.parse).catch(() => null);
const parts = process.argv[2] ? [process.argv[2]] : ['a', 'c'];
const drafts = (await Promise.all(['a', 'c'].map(read))).filter(Boolean);
const input = await loadAll();
input.tryJson = { schemaVersion: 1, tasks: drafts.flatMap((d) => d.tasks ?? []) };
input.swText = null;
const r = validateAll(input);
const errors = r.errors.filter((e) => !(e.where === 'meta.json' && e.msg.startsWith('counts.')) && !/^text:.*tryIds/.test(e.where + e.msg));
for (const p of parts) {
  const d = await read(p);
  console.log(`try-${p}: ${d?.tasks?.length ?? 0}件`);
  for (const t of d?.tasks ?? []) {
    const ch = Number(t.id?.slice(4, 6));
    if (p === 'a' && !(ch >= 1 && ch <= 10)) errors.push({ where: `try:${t.id}`, msg: '第1部は try-01〜try-10' });
    if (p === 'c' && !(ch >= 11 && ch <= 19)) errors.push({ where: `try:${t.id}`, msg: '第2部は try-11〜try-19' });
  }
}
for (const w of r.warnings.filter((w) => w.where.startsWith('try:'))) console.log(`警告 ${w.where}: ${w.msg}`);
for (const e of errors.filter((e) => e.where.startsWith('try:'))) console.log(`エラー ${e.where}: ${e.msg}`);
const n = errors.filter((e) => e.where.startsWith('try:')).length;
console.log(n ? `エラー ${n}件` : 'OK');
process.exit(n ? 1 : 0);
