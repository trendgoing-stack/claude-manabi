// validate.html と同じ検査をコマンドラインで行う（開発用・Node）
// 使い方: node tools/validate.mjs
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { ROOT, loadAll } from './load-data.mjs';
import { validateAll } from './validate-core.js';

const input = await loadAll();
const r = validateAll(input);

// sw.js があれば、js/ のすべてのファイルが APP_SHELL に入っているか確かめる
if (input.swText) {
  const walk = async (dir) => (await readdir(path.join(ROOT, dir), { withFileTypes: true })).flatMap((e) => (e.isDirectory() ? [] : [`${dir}/${e.name}`]));
  const dirs = ['js', 'js/render', 'js/ui', 'js/views', 'css'];
  const files = (await Promise.all(dirs.map(walk))).flat();
  for (const f of files) if (!input.swText.includes(`'${f}'`)) r.errors.push({ where: 'sw.js', msg: `APP_SHELL に ${f} がない` });
}

const c = r.counts;
console.log(`dataVersion ${input.meta.dataVersion}`);
console.log(`解説 ${input.texts.length}章・${c.sections}節（本文 約${r.chars.toLocaleString()}字）／クイズ ${c.quiz}問（正解位置 ${r.answerPos.join('／')}）／辞典 ${c.dict}項目／用語 ${c.glossary}語／課題 ${c.try}件`);
if (r.warnings.length) {
  console.log(`\n警告 ${r.warnings.length} 件:`);
  for (const w of r.warnings) console.log(`  - ${w.where}: ${w.msg}`);
}
if (r.errors.length) {
  console.log(`\nエラー ${r.errors.length} 件:`);
  for (const e of r.errors) console.log(`  - ${e.where}: ${e.msg}`);
  process.exit(1);
}
console.log('\nエラーなし');
