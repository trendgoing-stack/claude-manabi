# HANDOFF.md — 新しいセッションで続けるための引き継ぎ

新しいセッションでは「HANDOFF.md に沿って続けて」と伝えれば再開できる。仕様の全体は PLAN.md（合意済みの実装計画）、データの決まりは CONTENT.md、公開と更新の手順は README.md。

## 0. 進捗（2026-10-13 更新）

| フェーズ | 状態 |
|---|---|
| 1 最小構成と試作 | 完了（2026-10-12） |
| 2 内容の拡充 | 完了（2026-10-12） |
| 3 辞典と定着 | 完了（2026-10-13） |
| 4 仕上げ（PWA・設定・公開） | **完了・ユーザーの実機確認待ち**（TESTING.md） |

- リポジトリ：https://github.com/trendgoing-stack/claude-manabi （公開・main）。GitHub Pages：https://trendgoing-stack.github.io/claude-manabi/
- 合意事項（2026-10-12、PLAN.md の 7 節）：章立ては19章案、出典は日本語版リンク・英語版で照合、`/help` は一度だけユーザーに出力を貼ってもらう（**まだもらっていない**。スラッシュコマンドは commands.md と照合済み。もらえたら辞典 slash と突き合わせる）

## 1. できているもの

### アプリ（5タブ）
- **ホーム**（`js/views/home.js`）：続きから読む、今日の復習（期限の来た「まだ」のカード・最後に間違えた問題）、部ごとの読了率、古い可能性のある件数
- **学ぶ**：テキスト（`learn.js`。目次・章・節・前後の移動・要約／詳細・バッジ・鮮度の警告・公式ドキュメント・読んだ・用語ポップアップ・コードのコピー・関連する辞典と課題）、辞典（`dict.js`）、用語集（`glossary.js`・`term.js`）、暗記カード（`cards.js`・`js/review.js`）
- **演習**：確認クイズ（`js/quiz.js`・`views/quiz.js`。章／ランダム／苦手／今日の復習、中断と再開、出題は節が doc-verified／tried の問題だけ）、やってみよう（`try.js`）
- **記録**（`records.js`）、`#/stale`（古い可能性のある節・項目）
- **設定**（`settings.js`）：文字サイズ、解説の初期表示、鮮度の日数、データ管理（`js/io.js`：エクスポート＝共有シートまたはダウンロード、インポート＝統合／置き換え、形式が不正なら何も変えない、全削除）、版と収録件数、ヘルプ（`help.js`）、非公式の表記
- **AIに聞く**（`js/ui/ask-ai.js`・`js/ai-prompt.js`）：文字を選ぶと右下にボタン。プロンプトに出どころ・確認日・「最新の公式ドキュメントを優先して」を入れ、答え合わせ前のクイズでは正解と解説を入れない
- **PWA**：`manifest.json`、`sw.js`（アプリ本体と data/ の JSON をキャッシュファースト。`clmanabi-<VERSION>`、古いキャッシュの削除、tools/ と sw.js はキャッシュしない）、`icons/`（`node tools/make-icons.mjs` で SVG と PNG を生成）。更新は waiting で待たせ、「更新があります（タップで再読み込み）」のタップで切り替え（クイズの出題中は出さない）。localhost では登録しない（`?sw=1` で有効）
- 図種 `chat`・`terminal`・`dir`、用語の `noAutoLink`（g-project・g-memory・g-token）

### データ（全部 doc-verified、未確認なし）
- 解説 19章・113節（本文 約12.4万字）、クイズ 281問、用語 162語
- 辞典 131項目（スラッシュコマンド 37・キー操作 24・CLI オプション 32・設定キー 22・ファイル・パス 16）
- やってみよう 31件（第1部 16・第2部 15）

## 2. 次の作業

1. ユーザーの実機確認（TESTING.md）の結果を反映する
2. `/help` の出力をもらえたら、辞典 slash（`data/dict/slash.json`）と突き合わせる
3. 足すかどうかユーザーの判断待ち：辞典に `/login`・`/logout`・`/branch`・`/ide`・`/security-review`、CLI の `--max-turns` など（フェーズ3の報告で挙げた）
4. 定期的な鮮度の点検（`tools/RECHECK_BRIEF.md`。最初の目安は 2027-01 ごろ。確認日はすべて 2026-10-12〜13）
5. 将来：第3部 API・Agent SDK（`p` 接頭辞。CONTENT.md の 1 節のとおり、`meta.json` の `parts` に1行足し、章ファイルを置くだけで追加できる）

## 3. 作業の手順

- 章：`node tools/chapter-prep.mjs <id>...` → 作成（Opus・CHAPTER_BRIEF）→ `check-draft.mjs` → 検査（別の Opus・QA_BRIEF）→ 反映（Sonnet・FIX_BRIEF）→ `merge-chapter.mjs <id>...`
- 辞典：`dict-prep.mjs <種類>...` → 作成（Opus・DICT_BRIEF）→ `check-dict.mjs` → 検査（別の Opus）→ 反映（Sonnet）→ `merge-extra.mjs dict <種類>...`
- 課題：TRY_BRIEF → `check-try.mjs` → 検査 → 反映 → `merge-extra.mjs try`（節の dictIds・tryIds は `merge-extra.mjs` が自動で作る）
- 用語の重複：取り込みは章番号の若い順。`merge-chapter.mjs` が同じ id・表記の用語を外し、`[[表示|id]]` と related を付け替える。共有する用語の定義は第1部・第2部の両方に通じる言い方にする
- 検査で多かった指摘：公式の表や例をそのまま訳す、使える場所（surfaces）を広く取りすぎる、ベータ・プレビューの表記漏れ、安全の注意の抜け（権限の確認を省くモード、秘密情報、共有の資格情報、worktree の削除、Windows の PowerShell でフックが素通り、トークンが設定ファイルに平文で残る など）
- 利用上限で止まったエージェントは SendMessage で「続きから」と送ると再開できる。下書きはこまめに保存させる

## 4. 作業上の注意

- **データやコードを変えたら、`data/meta.json` の `dataVersion` と `sw.js` の `VERSION` を同じ値で上げる**（現在 2026.10.13-2）。JS・CSS を足したら `APP_SHELL` にも足す
- `node tools/validate.mjs` を通してからコミット・push する
- 一時ファイルは `work/`（git に含めない）
- 同梱の Claude Code CLI：`%APPDATA%/Claude/claude-code/2.1.295/d2e29494ec83/claude.exe --help`（PATH には無い。版が上がるとパスが変わる）
- 開発用サーバー：`.claude/launch.json` の `static`（`python tools/serve.py 8765`）。1ファイル約0.3秒かかるので初回表示が遅いのは正常。`?sw=1` で試したあと、`?sw=1` なしで開くと Service Worker が解除される
- リポジトリの git 設定（user.name／user.email）は noreply アドレスをリポジトリ単位で設定済み。**ファイルに個人のパスやユーザー名を書かない**（公開前に履歴から消した経緯がある）
- 文体は「です・ます」調

## 5. 消費（サブエージェントのトークン数）

| フェーズ | 作成（Opus） | 検査（Opus） | 反映（Sonnet） | 計 |
|---|---|---|---|---|
| 1（2章） | 38.8万 | 25.1万 | 14.3万 | 78.2万 |
| 2（17章） | 約289万 | 約240万 | 約136万 | 約664万（1章あたり約39万） |
| 3（辞典131・課題31） | 約92万 | 約104万 | 約50万 | 約246万 |
| 4 | — | — | — | サブエージェントは使っていない |

フェーズ2・3は利用上限で何度か止まり、止まる前の分はこの数に入っていない。
