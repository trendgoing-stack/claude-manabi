// data/meta.json をたどって全データを読み込む（開発用・Node）。validate.mjs と stale.mjs から使う
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const readJson = async (rel) => JSON.parse(await readFile(path.join(ROOT, rel), 'utf8'));
const tryJson = (rel) => readJson(rel).catch(() => null);
const many = (files) => Promise.all((files ?? []).map(async (file) => ({ file, json: await tryJson(`data/${file}`) })));

export async function loadAll() {
  const meta = await readJson('data/meta.json');
  const [texts, quizzes, dicts, glossary, tryData, swText] = await Promise.all([
    many(meta.textFiles),
    many(meta.quizFiles),
    many(meta.dictFiles),
    meta.glossaryFile ? tryJson(`data/${meta.glossaryFile}`) : null,
    meta.tryFile ? tryJson(`data/${meta.tryFile}`) : null,
    readFile(path.join(ROOT, 'sw.js'), 'utf8').catch(() => null),
  ]);
  return { meta, texts, quizzes, dicts, glossary, tryJson: tryData, swText };
}
