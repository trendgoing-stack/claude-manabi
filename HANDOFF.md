# HANDOFF.md — 新しいセッションで続けるための引き継ぎ

新しいセッションでは「HANDOFF.md に沿って続けて」と伝えれば再開できる。仕様の全体は PLAN.md（合意済みの実装計画）、データの決まりは CONTENT.md。

## 0. 進捗（2026-10-12 更新）

| フェーズ | 状態 |
|---|---|
| 1 最小構成と試作 | **完了・ユーザーの確認待ち**（確認後にフェーズ2へ） |
| 2 内容の拡充 | 未着手 |
| 3 辞典と定着 | 未着手 |
| 4 仕上げ（PWA・設定・公開） | 未着手 |

合意事項（2026-10-12、PLAN.md の 7 節）：章立ては19章案、出典は日本語版リンク・英語版で照合、push はフェーズ1の報告後にユーザーの了承を得てから、`/help` はフェーズ3で一度だけユーザーに出力を貼ってもらう。

## 1. フェーズ1でできたもの

- fe-manabi から移植：router、dom、date、dialog、toast、figure（図のレンダラー）、terms（用語の検出）、serve.py。storage・loader・lesson・term は作り直し
- 5タブ（ホーム／学ぶ／演習／記録／設定）。演習・記録・辞典・用語集の一覧・暗記カード・やってみよう は「準備中」の仮画面（`js/views/placeholder.js`）
- 学ぶ：テキスト（`js/views/learn.js`）：部ごとの目次・章・節・前後の移動・要約／詳細（設定 `learnMode` に保存）・使える場所／提供状況／確認日のバッジ・鮮度の警告・公式ドキュメントのリンク・読んだ・用語ポップアップ・コードのコピー（`js/clipboard.js`）
- ホーム（続きから読む・部ごとの進捗・古い可能性のある件数）、`#/stale`（古い可能性のある節の一覧）、`#/term/<id>`、設定（文字サイズ・初期表示・鮮度の日数・バージョン・非公式の表記）、ヘルプ
- 新しい図種：`chat`・`terminal`・`dir`（`js/render/figure.js` の末尾）。`tools/figures.html` で一覧できる
- 読み込み（`js/loader.js`）：meta → 現在の画面が必要な種類 → 残りを後から。失敗したファイル名をホーム・設定・トーストに出す。`?fixture=1` で `tools/fixture/data/` のテストデータを読む
- 検査：`tools/validate-core.js`（Node：`node tools/validate.mjs`、ブラウザ：`tools/validate.html`）
- 作成と検査の道具：`tools/chapters.json`（章の設計）、`tools/chapter-prep.mjs`（作業ファイル）、`tools/CHAPTER_BRIEF.md`・`QA_BRIEF.md`・`FIX_BRIEF.md`、`tools/check-draft.mjs`（下書きの検査）、`tools/merge-chapter.mjs`（本番への取り込み）
- 試作2章：a04 プロジェクト（6節・5,305字・11分・図5・15問）、c13 CLAUDE.md とコンテキスト管理（6節・6,201字・13分・図5・17問）。全12節 doc-verified。用語集 19語

## 2. 次の作業（フェーズ2）

1. ユーザーのフェーズ1の確認結果を反映する（分量・文体・図・UI）
2. `tools/chapters.json` に残り17章の設計（節の案・最初に読む公式ページ）を足す。公式の目次：`https://code.claude.com/docs/llms.txt`、ヘルプセンターのコレクション（`https://support.claude.com/en/collections/...`）
3. 2〜3章ずつ並行で：`node tools/chapter-prep.mjs <id>...` → 作成（Opus・CHAPTER_BRIEF）→ 検査（別の Opus・QA_BRIEF）→ 反映（Sonnet・FIX_BRIEF）→ `node tools/merge-chapter.mjs <id>...` → `node tools/validate.mjs`
   - 並行で作るときは用語の重複に注意（今回 g-context-window・g-skill が重なった）。反映の担当には重複分を terms から外させ、定義は呼び出し元が両章向けにまとめる。または、先に取り込んだ章の後で次の章の chapter-prep をやり直す
4. 用語集の一覧（五十音順・検索）、演習タブ（章を選ぶ／ランダム／苦手、中断と再開、結果）、記録タブ
5. TESTING.md にフェーズ2の項目を足す、HANDOFF.md を更新

## 3. 作業上の注意

- データを変えたら `data/meta.json` の `dataVersion` を上げる（sw.js はフェーズ4で追加。追加後は `VERSION` も同じ値に）
- `node tools/validate.mjs` を通してからコミットする。push はユーザーの了承を得てから
- 一時ファイルは `work/`（git に含めない）。担当ごとに接頭辞を分ける
- 同梱の Claude Code CLI：`%APPDATA%/Claude/claude-code/2.1.295/d2e29494ec83/claude.exe --help`（PATH には無い。版が上がるとパスが変わる）
- 開発用サーバー：`.claude/launch.json` の `static`（`python tools/serve.py 8765`）。ローカルの Python サーバーは1ファイル約0.3秒かかるので、初回表示が遅く見えるのは正常
- リポジトリの git 設定（user.name／user.email）は fe-manabi と同じ noreply アドレスをリポジトリ単位で設定済み
- 文体は「です・ます」調（fe-manabi は「だ・である」調だったが、アプリの使い方の解説なので変えた）

## 4. フェーズ1の消費（サブエージェントのトークン数・時間）

| 章 | 作成（Opus） | 検査（Opus） | 反映（Sonnet） | 計 |
|---|---|---|---|---|
| a04 | 12.2万・7分 | 10.4万・4分 | 6.1万・0.5分 | 28.7万 |
| c13 | 26.6万・8分 | 14.7万・4分 | 8.2万・0.5分 | 49.4万 |
