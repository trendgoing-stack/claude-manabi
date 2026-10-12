# HANDOFF.md — 新しいセッションで続けるための引き継ぎ

新しいセッションでは「HANDOFF.md に沿って続けて」と伝えれば再開できる。仕様の全体は PLAN.md（合意済みの実装計画）、データの決まりは CONTENT.md。

## 0. 進捗（2026-10-12 更新）

| フェーズ | 状態 |
|---|---|
| 1 最小構成と試作 | 完了（2026-10-12） |
| 2 内容の拡充 | **完了・ユーザーの確認待ち**（確認後にフェーズ3へ） |
| 3 辞典と定着 | 未着手 |
| 4 仕上げ（PWA・設定・公開） | 未着手 |

合意事項（2026-10-12、PLAN.md の 7 節）：章立ては19章案、出典は日本語版リンク・英語版で照合、`/help` はフェーズ3で一度だけユーザーに出力を貼ってもらう。**push はまだしていない**（GitHub のリポジトリ作成と push はユーザーの了承待ち）。

## 1. できているもの

### アプリ
- 5タブ（ホーム／学ぶ／演習／記録／設定）。辞典・暗記カード・やってみよう は「準備中」の仮画面（`js/views/placeholder.js`）
- 学ぶ：テキスト（`js/views/learn.js`）。目次・章・節・前後の移動・要約／詳細（設定 `learnMode`）・バッジ・鮮度の警告・公式ドキュメント・読んだ・用語ポップアップ・コードのコピー（`js/clipboard.js`）
- 学ぶ：用語集（`js/views/glossary.js`、五十音の行・検索 150ms 待ち）、用語の詳細（`js/views/term.js`）。検索の正規化は `js/search.js`（辞典でも使う）
- 演習：確認クイズ（`js/quiz.js`・`js/views/quiz.js`）。`#/quiz`（メニュー）・`#/quiz/chapter|section/<id>`・`#/quiz/random`・`#/quiz/weak`・`#/quiz/run`・`#/quiz/result`。中断と再開、苦手は不正解率の高い順・同率は最終回答の古い順。出題は節が doc-verified／tried の問題だけ
- 記録（`js/views/records.js`）：読了率・正答率・苦手な章（5回以上・80%未満）・課題の件数・鮮度
- ホーム（続きから読む・進捗・鮮度）、`#/stale`、設定（文字サイズ・初期表示・鮮度の日数・版・非公式の表記）、ヘルプ
- 図種 `chat`・`terminal`・`dir` を追加。流れ図の列幅は箱の幅に合わせる
- 用語の `noAutoLink: true`：一般的な語と同じ表記の用語は自動リンクせず `[[ ]]` のときだけリンク。現在 g-project・g-memory・g-token

### データ（全部 doc-verified）
- 解説 19章・113節（本文 約12.4万字。1章 10〜16分）、クイズ 281問、用語 162語
- 辞典・課題は 0（フェーズ3）

## 2. 次の作業（フェーズ3：辞典と定着）

1. ユーザーのフェーズ2の確認結果を反映する
2. 辞典（約120項目、`data/dict/<種類>.json`）：スラッシュコマンド・キー操作・CLI オプション・設定キー・ファイル・パス。CLI オプションは同梱 CLI の `--help` と照合、スラッシュコマンドは `commands.md` と照合し、**ユーザーに一度だけ `/help` の出力を貼ってもらう**。作成と検査は章と同じ方式（ブリーフを辞典用に作る）。節の `dictIds` を埋める
3. 辞典の画面（種類の絞り込み・検索。`js/search.js` の normalize で `/`・`-` の有無を無視）
4. 暗記カード（用語・辞典の項目。範囲を選ぶ、左右スワイプ（Pointer Events、`touch-action: pan-y`）、覚えた／まだ）、ホームの「今日の復習」
5. やってみよう（約30件、`data/try.json`）：一覧（部・所要時間・完了で絞り込み）・詳細・やったのチェックとメモ。節の `tryIds` を埋める
6. 鮮度：`tools/stale.mjs` と `tools/RECHECK_BRIEF.md`
7. 「AIに聞く」を fe-manabi（`js/ui/ask-ai.js`・`js/ai-prompt.js`）から移植。確認日と「最新の公式ドキュメントを優先して指摘して」の一文を入れる。答え合わせ前のクイズでは正解と解説を入れない

## 3. 作業の手順（章・辞典の作成）

`node tools/chapter-prep.mjs <id>...` → 作成（Opus・CHAPTER_BRIEF）→ 検査（別の Opus・QA_BRIEF）→ 反映（Sonnet・FIX_BRIEF）→ `node tools/merge-chapter.mjs <id>...` → `node tools/validate.mjs`

- 用語の重複：取り込みは章番号の若い順に行い、`merge-chapter.mjs` が同じ id・表記の用語を自動で外し、`[[表示|id]]` と related を付け替える。共有する用語の定義は、第1部・第2部の両方の読者に通じる言い方にそろえる（今回 g-context-window・g-skill・g-mcp・g-plugin などを手でまとめた）
- 検査で多かった指摘：公式の表や例をそのまま訳す、使える場所（surfaces）を広く取りすぎる、ベータの表記漏れ（a10-06 は blocker）、安全の注意の抜け（共有の資格情報のコネクタ、worktree の削除でコミットが消える、Windows の PowerShell でフックが素通り、`--header` のトークンが設定ファイルに残る など）
- 利用上限で止まったエージェントは SendMessage で「続きから」と送ると再開できる。下書きは節ごとに保存させる

## 4. 作業上の注意

- データを変えたら `data/meta.json` の `dataVersion` を上げる（現在 2026.10.12-2。sw.js はフェーズ4で追加。追加後は `VERSION` も同じ値に）
- `node tools/validate.mjs` を通してからコミットする
- 一時ファイルは `work/`（git に含めない）
- 同梱の Claude Code CLI：`%APPDATA%/Claude/claude-code/2.1.295/d2e29494ec83/claude.exe --help`（PATH には無い。版が上がるとパスが変わる）
- 開発用サーバー：`.claude/launch.json` の `static`（`python tools/serve.py 8765`）。1ファイル約0.3秒かかるので初回表示が遅いのは正常
- リポジトリの git 設定（user.name／user.email）は fe-manabi と同じ noreply アドレスをリポジトリ単位で設定済み
- 文体は「です・ます」調

## 5. 消費（サブエージェントのトークン数）

| フェーズ | 作成（Opus） | 検査（Opus） | 反映（Sonnet） | 計 |
|---|---|---|---|---|
| 1（2章） | 38.8万 | 25.1万 | 14.3万 | 78.2万 |
| 2（17章） | 約289万 | 約240万 | 約136万 | 約664万（1章あたり約39万） |

フェーズ2は利用上限で3回止まり、止まる前の分はこの数に入っていない。
