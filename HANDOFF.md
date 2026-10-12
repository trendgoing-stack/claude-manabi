# HANDOFF.md — 新しいセッションで続けるための引き継ぎ

新しいセッションでは「HANDOFF.md に沿って続けて」と伝えれば再開できる。仕様の全体は PLAN.md（合意済みの実装計画）、データの決まりは CONTENT.md。

## 0. 進捗（2026-10-13 更新）

| フェーズ | 状態 |
|---|---|
| 1 最小構成と試作 | 完了（2026-10-12） |
| 2 内容の拡充 | 完了（2026-10-12） |
| 3 辞典と定着 | **完了・ユーザーの確認待ち**（確認後にフェーズ4へ） |
| 4 仕上げ（PWA・設定・公開） | 未着手 |

合意事項（2026-10-12、PLAN.md の 7 節）：章立ては19章案、出典は日本語版リンク・英語版で照合、`/help` は一度だけユーザーに出力を貼ってもらう（**フェーズ3の時点ではまだもらっていない**。スラッシュコマンドは commands.md と照合済み。もらえたら辞典 slash と突き合わせる）。リポジトリ（https://github.com/trendgoing-stack/claude-manabi 、公開・main）と GitHub Pages は 2026-10-12 に作成済み。push の前に validate を通す。

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

### フェーズ3で足したもの
- 辞典（`js/views/dict.js`・`#/dict`・`#/dict/<id>`）：種類の絞り込み、検索（`js/search.js` の正規化で `/`・`-` の有無を無視、150ms 待ち、最大50件）、詳細（Windows／Mac のキー、例のコピー、解説で読む）
- 暗記カード（`js/views/cards.js`・`js/review.js`）：範囲（用語：すべて／部／章、辞典：種類）、タップで裏返し、Pointer Events のスワイプ。カード id は `g:<用語id>`・`d:<辞典id>`。「まだ」は翌日が期限
- 今日の復習（ホーム）：期限の来た「まだ」のカード（`#/cards/review`）と、最後の回答が不正解の問題（`#/quiz/review`）。回答の記録に `lastOk` を追加
- やってみよう（`js/views/try.js`・`#/try`・`#/try/<id>`）：部・所要時間・完了で絞り込み、「やった」（日時を記録）と自分用メモ（2000文字）
- AIに聞く（`js/ui/ask-ai.js`・`js/ai-prompt.js`）：聞き方は 解説／やさしく／例え話／使いどころ／確認問題（最後の選択を設定 `aiMode` に保存）。プロンプトに出どころ・確認日・「最新の公式ドキュメントを優先して指摘して」を入れ、答え合わせ前のクイズでは正解と解説を入れない。コピーは `js/clipboard.js`（タップの中で同期的に開始）
- 鮮度の点検：`node tools/stale.mjs [日数]`、手順は `tools/RECHECK_BRIEF.md`
- 道具：`tools/DICT_BRIEF.md`・`dict-prep.mjs`・`check-dict.mjs`、`tools/TRY_BRIEF.md`・`check-try.mjs`、`tools/merge-extra.mjs`（辞典・課題の取り込みと節の dictIds・tryIds の自動作成）

### データ（全部 doc-verified）
- 解説 19章・113節（本文 約12.4万字）、クイズ 281問、用語 162語
- 辞典 131項目（スラッシュコマンド 37・キー操作 24・CLI オプション 32・設定キー 22・ファイル・パス 16）
- やってみよう 31件（第1部 16・第2部 15）。すべて検査済み

## 2. 次の作業（フェーズ4：仕上げ）

1. ユーザーのフェーズ3の確認結果を反映する。`/help` の出力をもらえたら辞典 slash と突き合わせる
2. PWA：`manifest.json`（name「Claudeまなび帳」、short_name「Claudeまなび」、start_url・scope は `./`）、`sw.js`（VERSION＝dataVersion、APP_SHELL に js/css をすべて、data/ の JSON をキャッシュファースト、古いキャッシュの削除、localhost では登録しない・`?sw=1` で有効、更新バナーはクイズの出題中に出さない）、アイコン（SVG から 180・192・512 を生成。公式ロゴに似せない。fe-manabi の `tools/make-icons.mjs` を流用済み）、apple-mobile-web-app 系の meta
3. 設定のデータ管理：エクスポート（JSON・スキーマ版付き）／インポート（統合・置き換え。不正なら何も変えずにエラー）／全削除（確認ダイアログ）。fe-manabi の `js/io.js` が参考になる
4. ヘルプの注意書きの最終化（Safari とホーム画面で保存データが別になる、エクスポートで移せる）
5. README（公開手順・ホーム画面への追加・更新の手順）、CONTENT・RECHECK_BRIEF・TESTING・HANDOFF の整備、全データの最終検証

## 3. 作業の手順（章・辞典の作成）

`node tools/chapter-prep.mjs <id>...` → 作成（Opus・CHAPTER_BRIEF）→ 検査（別の Opus・QA_BRIEF）→ 反映（Sonnet・FIX_BRIEF）→ `node tools/merge-chapter.mjs <id>...` → `node tools/validate.mjs`

- 用語の重複：取り込みは章番号の若い順に行い、`merge-chapter.mjs` が同じ id・表記の用語を自動で外し、`[[表示|id]]` と related を付け替える。共有する用語の定義は、第1部・第2部の両方の読者に通じる言い方にそろえる（今回 g-context-window・g-skill・g-mcp・g-plugin などを手でまとめた）
- 検査で多かった指摘：公式の表や例をそのまま訳す、使える場所（surfaces）を広く取りすぎる、ベータの表記漏れ（a10-06 は blocker）、安全の注意の抜け（共有の資格情報のコネクタ、worktree の削除でコミットが消える、Windows の PowerShell でフックが素通り、`--header` のトークンが設定ファイルに残る など）
- 利用上限で止まったエージェントは SendMessage で「続きから」と送ると再開できる。下書きは節ごとに保存させる

## 4. 作業上の注意

- データを変えたら `data/meta.json` の `dataVersion` を上げる（現在 2026.10.13-1。sw.js はフェーズ4で追加。追加後は `VERSION` も同じ値に）
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

| 3（辞典131・課題31） | 約92万 | 約104万 | 約50万 | 約246万 |

フェーズ2・3は利用上限で何度か止まり、止まる前の分はこの数に入っていない。
