// 鮮度の点検：checkedAt（公式情報で確認した日）から指定の日数を超えた節と辞典の項目を一覧にする
// 使い方: node tools/stale.mjs [日数（既定 90）] [--all]
//   --all を付けると、日数に関係なく全件を確認日の古い順に出す
import { loadAll } from './load-data.mjs';

const args = process.argv.slice(2);
const all = args.includes('--all');
const days = Number(args.find((a) => /^\d+$/.test(a)) ?? 90);
const today = new Date();
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const age = (checkedAt) => Math.round((Date.parse(ymd(today)) - Date.parse(checkedAt)) / 86400000);

const { texts, dicts } = await loadAll();
const rows = [];
for (const { json: ch } of texts) for (const s of ch?.sections ?? []) rows.push({ id: s.id, title: s.title, checkedAt: s.checkedAt, sources: s.sources });
for (const { json } of dicts) for (const d of json?.items ?? []) rows.push({ id: d.id, title: d.name, checkedAt: d.checkedAt, sources: d.sources });

const hits = rows.filter((r) => all || !(age(r.checkedAt) <= days)).sort((a, b) => a.checkedAt.localeCompare(b.checkedAt));
console.log(all ? `全 ${rows.length}件（確認日の古い順）` : `確認から${days}日を超えたもの：${hits.length}件／全 ${rows.length}件（今日 ${ymd(today)}）`);
for (const r of hits) {
  console.log(`${r.checkedAt}（${age(r.checkedAt)}日前） ${r.id} ${r.title}`);
  for (const s of r.sources ?? []) console.log(`    ${s.url.replace('/docs/ja/', '/docs/en/').replace('/ja/articles/', '/en/articles/')}`);
}
