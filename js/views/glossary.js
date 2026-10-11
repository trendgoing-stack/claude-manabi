// 用語集：五十音順の一覧と検索
import { h, fill, put } from '../dom.js';
import * as storage from '../storage.js';
import { app } from '../state.js';
import { learnNav } from './learn.js';
import { search, debounce, normalize } from '../search.js';
import { plainText } from '../render/text.js';

// 五十音の行（読みの先頭の文字で分ける）
const ROWS = [
  ['あ', 'ぁあぃいぅうぇえぉお'], ['か', 'かがきぎくぐけげこご'], ['さ', 'さざしじすずせぜそぞ'], ['た', 'ただちぢっつづてでとど'], ['な', 'なにぬねの'],
  ['は', 'はばぱひびぴふぶぷへべぺほぼぽ'], ['ま', 'まみむめも'], ['や', 'ゃやゅゆょよ'], ['ら', 'らりるれろ'], ['わ', 'ゎわをんゔ'],
];
const rowOf = (reading) => ROWS.find(([, chars]) => chars.includes(normalize(reading)[0] ?? ''))?.[0] ?? 'その他';

const jump = (id) => (e) => {
  e.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
};

const termItem = (t) =>
  h('li', null, h('a', { href: `#/term/${encodeURIComponent(t.id)}` }, h('span', { class: 'term-name' }, t.term), h('span', { class: 'muted small link-title' }, plainText(t.definition))));

export function glossaryView(root) {
  const all = [...app.data.glossary].sort((a, b) => a.reading.localeCompare(b.reading, 'ja'));
  const meta = storage.getMeta();
  const list = h('div');
  const input = h('input', {
    type: 'search',
    class: 'input',
    placeholder: '用語・読み・定義で検索',
    value: meta.glossaryQuery ?? '',
    enterkeyhint: 'search',
    'aria-label': '用語を検索',
  });

  const draw = () => {
    storage.saveMeta({ glossaryQuery: input.value });
    const hits = search(all, input.value, (t) => [t.term, t.reading, ...(t.aliases ?? [])], (t) => [t.definition]);
    const count = h('p', { class: 'muted small' }, input.value.trim() ? `${hits.length}語（全${all.length}語）` : `${all.length}語`);
    if (!hits.length) return fill(list, count, h('p', { class: 'muted' }, '該当する用語がありません。'));
    // 検索中は一致の強い順にそのまま並べ、検索していないときは五十音の行で分ける
    if (input.value.trim()) return fill(list, count, h('section', { class: 'card' }, h('ul', { class: 'link-list' }, hits.slice(0, 50).map(termItem))));
    const groups = [...ROWS.map(([r]) => r), 'その他'].map((r) => [r, hits.filter((t) => rowOf(t.reading) === r)]).filter(([, ts]) => ts.length);
    fill(
      list,
      count,
      h('nav', { class: 'kana-index', 'aria-label': '五十音の見出し' }, groups.map(([r]) => h('a', { href: `#kana-${r}`, onClick: jump(`kana-${r}`) }, r))),
      groups.map(([r, ts]) => h('section', { class: 'card' }, h('h2', { id: `kana-${r}` }, r === 'その他' ? r : `${r}行`), h('ul', { class: 'link-list' }, ts.map(termItem)))),
    );
  };
  input.addEventListener('input', debounce(draw, 150));

  put(root, h('h1', null, '学ぶ'), learnNav('terms'), input, list);
  if (!all.length) list.append(h('p', { class: 'notice warn' }, '用語集を読み込めませんでした。'));
  else draw();
}
