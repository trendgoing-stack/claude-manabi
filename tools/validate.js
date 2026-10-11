// validate.html の画面側（開発用。アプリ本体からはリンクしない）
import { h, fill } from '../js/dom.js';
import { validateAll } from './validate-core.js';

const root = document.getElementById('view');
// Service Worker のキャッシュを避けて、常に最新を読む
const get = async (url, type = 'json') => {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(String(res.status));
  return res[type]();
};
const tryGet = (url, type) => get(url, type).catch(() => null);
const many = (files) => Promise.all((files ?? []).map(async (file) => ({ file, json: await tryGet(`../data/${file}`) })));

async function main() {
  const meta = await tryGet('../data/meta.json');
  if (!meta) {
    fill(root, h('p', { class: 'ng' }, 'data/meta.json を読み込めません。'));
    return;
  }
  const [texts, quizzes, dicts, glossary, tryJson, swText] = await Promise.all([
    many(meta.textFiles),
    many(meta.quizFiles),
    many(meta.dictFiles),
    meta.glossaryFile ? tryGet(`../data/${meta.glossaryFile}`) : null,
    meta.tryFile ? tryGet(`../data/${meta.tryFile}`) : null,
    tryGet('../sw.js', 'text'),
  ]);
  const r = validateAll({ meta, texts, quizzes, dicts, glossary, tryJson, swText });
  const c = r.counts;
  const list = (items) => h('ul', { class: 'err-list' }, items.map((e) => h('li', null, `${e.where}: ${e.msg}`)));
  fill(
    root,
    h('h1', null, 'データ検証（開発用）'),
    h('p', null, `dataVersion ${meta.dataVersion}／解説 ${texts.length}章・${c.sections}節／クイズ ${c.quiz}問／辞典 ${c.dict}項目／用語 ${c.glossary}語／課題 ${c.try}件`),
    r.errors.length ? h('p', { class: 'ng' }, `エラー ${r.errors.length}件`) : h('p', { class: 'ok' }, 'エラーなし'),
    r.errors.length ? list(r.errors) : null,
    r.warnings.length ? h('h2', null, `警告 ${r.warnings.length}件`) : null,
    r.warnings.length ? list(r.warnings) : null,
  );
}

main();
