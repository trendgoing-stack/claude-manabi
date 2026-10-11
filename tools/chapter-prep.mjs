// 章ごとの作業ファイル work/<章id>-brief.md を作る（作成・検査のエージェントに渡す）
// 使い方: node tools/chapter-prep.mjs <章id> [<章id> ...]
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ROOT, readJson } from './load-data.mjs';

const ids = process.argv.slice(2);
if (!ids.length) {
  console.error('使い方: node tools/chapter-prep.mjs <章id> ...');
  process.exit(1);
}
const { chapters } = await readJson('tools/chapters.json');
const glossary = await readJson('data/glossary.json').catch(() => ({ terms: [] }));
const meta = await readJson('data/meta.json');
await mkdir(path.join(ROOT, 'work'), { recursive: true });

// ほかの章の節（重複を避け、参照先として名前を出すため）
const others = [];
for (const f of meta.textFiles) {
  const ch = await readJson(`data/${f}`).catch(() => null);
  if (ch) for (const s of ch.sections) others.push(`${s.id} ${s.title}：${s.digest?.text?.slice(0, 60) ?? ''}`);
}

for (const id of ids) {
  const c = chapters.find((x) => x.id === id);
  if (!c) {
    console.error(`tools/chapters.json に ${id} がない`);
    process.exit(1);
  }
  const md = [
    `# ${c.title}（${c.id}）の作業ファイル`,
    '',
    `- 出力：\`work/${c.id}-draft.json\`（章）、\`work/${c.id}-quiz.json\`（クイズ）、\`work/${c.id}-terms.json\`（追加する用語）`,
    `- 本番のファイル名：\`data/text/${c.file}.json\`、\`data/quiz/${c.file}.json\``,
    `- 部：\`${c.part}\`、order：${Number(c.id.slice(1))}`,
    `- 使える場所の目安：${c.surfacesHint.join('、')}（節ごとに公式情報で確かめて決める）`,
    '',
    '## 節の案（目安。4〜8節に統合・分割してよい）',
    ...c.sections.map((s) => `- ${s}`),
    '',
    '## 最初に読む公式ページ（英語版で照合し、sources には日本語版があれば日本語版の URL を載せる）',
    ...c.sources.map((u) => `- ${u}`),
    '',
    '## 用語集にすでにある用語（同じ表記で書けば自動でリンクされる。重複して追加しない）',
    glossary.terms.length ? glossary.terms.map((t) => `${t.id} ${t.term}${t.aliases?.length ? `（${t.aliases.join('・')}）` : ''}`).join('\n') : '（まだない）',
    '',
    '## ほかの章（内容を重複させない。触れるときは「第N章で扱う」と書く）',
    '### 作成済みの節',
    others.length ? others.join('\n') : '（まだない）',
    '### 作成予定の章（節の案）',
    chapters.filter((x) => x.id !== c.id && !others.some((o) => o.startsWith(`${x.id}-`))).map((x) => `- ${x.title}：${x.sections.map((t) => t.replace(/（.*$/, '')).join('／')}`).join('\n'),
    '',
  ].join('\n');
  await writeFile(path.join(ROOT, 'work', `${c.id}-brief.md`), md);
  console.log(`work/${c.id}-brief.md`);
}
