// 辞典の作業ファイル work/dict-<種類>-brief.md を作る（作成・検査のエージェントに渡す）
// 使い方: node tools/dict-prep.mjs <種類> [<種類> ...]   種類：slash key cli-flag setting path
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ROOT, loadAll } from './load-data.mjs';

export const DICT_PLAN = {
  slash: { label: 'スラッシュコマンド', count: '30〜38', hint: '対話画面で `/` から使うコマンド。会話の管理（/clear・/compact・/context・/resume）、設定（/model・/config・/permissions・/statusline）、拡張（/agents・/skills・/hooks・/mcp・/plugin）、その他（/init・/memory・/rewind・/help・/doctor など）。スキルとして入っているものも含めてよい', pages: ['commands', 'interactive-mode'] },
  key: { label: 'キー操作', count: '18〜24', hint: '対話画面のキー操作。中断（Esc）、巻き戻し（Esc 2回）、モードの切り替え（Shift+Tab）、改行、履歴、`@`・`!`・`#` などの入力の頭の記号、画像の貼り付け、モデル切り替えなど。Windows と Mac で違うものは os に両方', pages: ['interactive-mode', 'keybindings', 'terminal-config'] },
  'cli-flag': { label: 'CLI オプション', count: '26〜32', hint: '`claude` コマンドのオプションとよく使うサブコマンド（`claude mcp`・`claude plugin`・`claude agents` など）。`work/cli-help.txt` に無いものは載せない。危険なオプション（権限の確認を省くものなど）は注意を必ず書く', pages: ['cli-reference', 'headless'] },
  setting: { label: '設定キー', count: '18〜22', hint: 'settings.json のキー。permissions（allow・ask・deny・defaultMode・additionalDirectories）、model、env、hooks、statusLine、outputStyle、enabledPlugins など、学習者が自分で書くもの。管理者専用のキーは載せない', pages: ['settings', 'settings-reference', 'permissions'] },
  path: { label: 'ファイル・パス', count: '12〜16', hint: '`CLAUDE.md`・`CLAUDE.local.md`・`.claude/settings.json`・`.claude/settings.local.json`・`~/.claude/settings.json`・`.claude/skills/`・`.claude/agents/`・`.mcp.json`・`~/.claude.json`・`.claude/rules/`・`.worktreeinclude` など。何を置く場所か、git に含めるか', pages: ['claude-directory', 'memory', 'settings'] },
};

const kinds = process.argv.slice(2);
if (!kinds.length || kinds.some((k) => !DICT_PLAN[k])) {
  console.error(`使い方: node tools/dict-prep.mjs <種類>...  種類：${Object.keys(DICT_PLAN).join(' ')}`);
  process.exit(1);
}
const data = await loadAll();
await mkdir(path.join(ROOT, 'work'), { recursive: true });
const sections = data.texts.flatMap(({ json }) => (json?.sections ?? []).map((s) => `${s.id} ${s.title}`));
const terms = (data.glossary?.terms ?? []).map((t) => `${t.id} ${t.term}${t.aliases?.length ? `（${t.aliases.join('・')}）` : ''}`);
const existing = data.dicts.flatMap(({ json }) => (json?.items ?? []).map((d) => `${d.id} ${d.name}`));

for (const kind of kinds) {
  const p = DICT_PLAN[kind];
  const md = [
    `# 辞典：${p.label}（${kind}）の作業ファイル`,
    '',
    `- 出力：\`work/dict-${kind}.json\`（本番のファイル名：\`data/dict/${kind}.json\`）`,
    `- 目安の件数：${p.count}件`,
    `- 範囲：${p.hint}`,
    `- 最初に読む公式ページ：${p.pages.map((x) => `https://code.claude.com/docs/en/${x}.md`).join('、')}`,
    '- CLI の出力：`work/cli-help.txt`',
    '',
    '## 解説の節（sectionIds に使う）',
    ...sections,
    '',
    '## 用語集の用語（details の [[ ]] に使える）',
    ...terms,
    '',
    '## ほかの種類ですでにある項目（重複させない）',
    existing.length ? existing.join('\n') : '（まだない）',
    '',
  ].join('\n');
  await writeFile(path.join(ROOT, 'work', `dict-${kind}-brief.md`), md);
  console.log(`work/dict-${kind}-brief.md`);
}
