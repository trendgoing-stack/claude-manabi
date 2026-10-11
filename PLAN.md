# Claudeまなび帳 実装計画（案）

作成日：2026-10-12　状態：承認済み（2026-10-12）。フェーズ1完了・確認待ち（HANDOFF.md）

## 0. 事前に確認したこと

- 土台：`../fe-manabi`（約5,200行・ES Modules・ビルドなし）。ルーター、storage、ダイアログ、トースト、図のレンダラー（12種）、用語リンク、「AIに聞く」（方式C）、validate（Node とブラウザの共通コア `validate-core.js`）、serve.py、make-icons.mjs、作成・検査のブリーフ（CHAPTER_BRIEF／QA_BRIEF／DIGEST_BRIEF）がそのまま流用できる
- 公式ドキュメント：Claude Code は `code.claude.com/docs`（約220ページ。日本語版あり）、アプリ側は `support.claude.com`（コレクション：Claude／Cowork／Desktop／Mobile／Connectors／Claude in Chrome など）
- ローカルの Claude Code：PATH には無いが、デスクトップアプリ同梱の CLI（2.1.295）で `claude --help` を取得できる。`/help` は対話画面の出力なので、`commands.md` との照合を基本とし、必要ならユーザーに `/help` の出力を貼ってもらう
- 目安の章立てから変わった点：アプリ側に **Claude Cowork**（長時間タスク・予約・どこからでも依頼）が独立した製品群としてあり、Claude Code 側は **クラウド実行・routines・agent view・Remote Control** の比重が大きい（→ 3章の章立てに反映）

## 1. 章立て（案：19章・約115節）

接頭辞 `a`＝第1部 Claudeアプリ、`c`＝第2部 Claude Code、将来の `p`＝第3部 API・Agent SDK。番号は通し。

### 第1部 Claudeアプリ（10章）
| id | 章 | 主な節（目安） |
|---|---|---|
| a01-overview | Claudeの全体像 | モデルの種類と選び方／提供形態（Web・デスクトップ・モバイル・Claude Code・API）／プランの考え方（数値は書かない）／チャットと Cowork の関係／ベータ・プレビューの扱い |
| a02-chat | チャットの基本 | 指示の書き方／ファイル・画像の添付／編集と再生成／スタイル・個人設定／会話の整理 |
| a03-research | ウェブ検索とリサーチ | web search／extended thinking／Research／使い分け |
| a04-projects | プロジェクト | 何のためか／ナレッジ（RAG の考え方）／カスタム指示／チャットの整理・共有 |
| a05-artifacts | アーティファクトとファイル作成 | アーティファクトとは／ファイルの作成・編集／図や対話的な表示／共有と書き出し／Docs・Dashboards・Design の位置づけ |
| a06-memory | メモリと過去のチャット | 記憶の仕組み／過去チャットの検索／確認・削除・オンオフ／シークレットな使い方 |
| a07-connectors | コネクタと連携 | MCP の考え方／コネクタの追加／Google Workspace などとの連携／権限と注意 |
| a08-skills | スキルとプラグイン | スキルとは／使い方／自作スキル／プラグインとディレクトリ |
| a09-devices | デスクトップ・モバイル・音声・ブラウザ | デスクトップアプリ／モバイル・音声／Claude in Chrome／コンピュータ操作 |
| a10-cowork | Cowork と予約・お任せ（旧案「任せる・予約する」） | Cowork とは／安全な使い方／予約タスク／どこからでも依頼／Cowork のプロジェクト |

### 第2部 Claude Code（9章）
| id | 章 | 主な節（目安） |
|---|---|---|
| c11-start | 全体像と始め方 | 仕組み（エージェントループ）／CLI・デスクトップ・Web・IDE・モバイル／インストールと認証／最初の一歩 |
| c12-basics | 基本操作 | 対話の流れ／`@` 参照／`!` 実行／中断・Esc／再開と履歴（sessions）／キー操作の基本 |
| c13-context | CLAUDE.md とコンテキスト管理 | CLAUDE.md の役割／階層と読み込み順／`.claude/` の中身／コンテキストウィンドウ／compact・clear／コンテキストの確認 |
| c14-safety | 権限・プランモード・巻き戻し | 権限の仕組み／permission modes／プランモード／チェックポイントと巻き戻し／サンドボックス／安全な使い方 |
| c15-settings | 設定とカスタマイズ | settings.json の階層と優先順位／モデルの選択／出力スタイル／ステータスライン／キー割り当て |
| c16-extend | 自作コマンド・サブエージェント・スキル | 拡張の全体像／スキル（コマンド含む）／サブエージェント／使い分け |
| c17-hooks-mcp | フック・MCP・プラグイン | フック／MCP サーバーの接続／プラグインの導入／プラグインの安全性 |
| c18-parallel | 並列作業とクラウド（**新設・旧18章を分割**） | worktree／並列エージェント・agent view／クラウドで動かす（Web）／Remote Control とモバイル |
| c19-automation | 自動化と実践 | ヘッドレス実行（`-p`）／GitHub Actions／routines・予約実行／「仕様書 → 実装計画 → フェーズ」の進め方 |

- 扱わない（または1段落の紹介に留める）：管理者向け（managed settings、SSO、ゲートウェイ、Bedrock 等）、mods、Agent SDK（第3部へ）
- 分量の目安：1節 600〜1,000字＋図表、1章 10〜15分

## 2. ファイル構成

```
index.html  manifest.json  sw.js  .nojekyll  .gitignore  .gitattributes
README.md  CONTENT.md  HANDOFF.md  TESTING.md  PLAN.md
css/  base.css  components.css  views.css
icons/ icon.svg  apple-touch-icon.png  icon-192.png  icon-512.png
js/
  app.js          起動・ルート登録・タブ・SW 更新バナー
  router.js       ハッシュルーター（fe-manabi そのまま）
  state.js        読み込み済みデータの保持
  loader.js       meta → 現在の画面に必要な JSON → 残りを後から。失敗ファイルを記録
  storage.js      localStorage の唯一の窓口（clmanabi: 接頭辞、スキーマ版、書き込み失敗の通知）
  io.js           エクスポート／インポート（統合・置き換え・検証）
  types.js        JSDoc 型定義
  dom.js date.js  小物（流用）
  parts.js        部・章の並びと索引（meta.parts から生成）
  search.js       正規化（NFKC・小文字・カナ→かな・/ と - を無視）と検索
  freshness.js    checkedAt と設定日数から「古い可能性」を判定
  clipboard.js    コピー3段構え（writeText → execCommand → 選択して案内）
  quiz-select.js  出題の選び方（章／ランダム／苦手順）と出題対象の絞り込み
  quiz-session.js 出題中の状態と中断復帰
  srs.js          暗記カードの「まだ」→翌日以降に出す
  terms.js term-index.js ai-prompt.js   流用・改変
  render/  text.js（richText＋[[用語]]） lesson.js（節の描画） figure.js（＋新図種）
           code.js（コピーボタン付き） badges.js（使える場所・提供状況・確認日・鮮度） quiz.js
  ui/      dialog.js toast.js term.js ask-ai.js swipe.js（Pointer Events）
  views/   home learn dict glossary cards quiz quiz-run quiz-result try records stale settings help
data/
  meta.json  glossary.json  try.json
  text/<章id>.json   dict/<種類>.json   quiz/<章id>.json
tools/
  validate-core.js validate.mjs validate.html validate.js   stale.mjs   serve.py
  figures.html（図の確認ページ）  make-icons.mjs  chapter-prep.mjs
  CHAPTER_BRIEF.md  QA_BRIEF.md  DIGEST_BRIEF.md  RECHECK_BRIEF.md
work/   作成・検査の一時ファイル（.gitignore。担当ごとに接頭辞を分ける）
```

- fe-manabi から外すもの：模擬試験、科目B のトレース、擬似言語インタプリタ、カテゴリ固定リスト、フラグ機能、問題を探す
- 実行時に fe-manabi を参照しない。コピーした各ファイルの先頭に由来は書かない（独立リポジトリとして整える）

## 3. ルーティング

| ハッシュ | 画面 | タブ |
|---|---|---|
| `#/home` | ホーム | ホーム |
| `#/learn` `#/learn/<章>` `#/learn/<章>/<節>` | 目次／章／節 | 学ぶ |
| `#/dict` `#/dict/<項目>` | 辞典 | 学ぶ |
| `#/terms` `#/term/<用語>` | 用語集 | 学ぶ |
| `#/cards` | 暗記カード | 学ぶ |
| `#/quiz` `#/quiz/run` `#/quiz/result` | 演習メニュー／出題／結果 | 演習 |
| `#/try` `#/try/<課題>` | やってみよう | 演習 |
| `#/records` `#/stale` | 記録／古い可能性のある節・項目 | 記録 |
| `#/settings` `#/help` | 設定／ヘルプ | 設定 |

「学ぶ」の上部切り替え（テキスト／辞典／用語集／暗記カード）はそれぞれ別ルートにして、戻る操作で切り替え前に戻れるようにする。`#/quiz/run` ではタブバーと更新バナーを隠す（fe-manabi の BUSY_ROUTES）。

## 4. データスキーマ（要点。正式版は types.js と CONTENT.md）

### meta.json
```json
{
  "dataVersion": "2026.10.xx-1", "schemaVersion": 1,
  "parts": [ { "id": "a", "title": "第1部 Claudeアプリ", "order": 1 },
             { "id": "c", "title": "第2部 Claude Code", "order": 2 } ],
  "textFiles": ["text/a04-projects.json", "text/c13-context.json"],
  "dictFiles": ["dict/slash.json", "dict/key.json", "dict/cli-flag.json", "dict/setting.json", "dict/path.json"],
  "quizFiles": ["quiz/a04-projects.json"],
  "glossaryFile": "glossary.json", "tryFile": "try.json",
  "counts": { "sections": 0, "quiz": 0, "dict": 0, "glossary": 0, "try": 0 }
}
```
- 仕様にない `quizFiles` を追加（クイズを章ごとのファイルにするため）
- 第3部の追加は「`parts` に1行足す＋`p20-*.json` を置いて `textFiles` に足す」だけで済む。章の所属は章ファイルの `part` で決め、コードに部の固定リストを持たない

### 章 `data/text/<章id>.json`
`{ schemaVersion, id: "a04", part: "a", order: 4, title, summary, minutes, sections[] }`

### 節
fe-manabi の `{ id, title, points[], digest{text, keys[]}, blocks[] }` に、仕様の `surfaces[] / status / sources[] / checkedAt / verification{status, note} / tryIds[] / dictIds[]` を追加。
- 節 id：`a04-01` 形式
- ブロック：`p` `h` `list` `figure` `table` `steps` `note{kind: tip|pitfall|caution}` `example` `code{lang, lines[] または text, caption}`
- 用語リンク：本文は fe-manabi と同じ自動リンク（用語集の見出し語・別名で一致）、辞典の `details` は `[[用語]]` 記法。`[[ ]]` は本文でも使える（自動リンクより優先）

### 新しい図種（すべてデータから SVG を生成）
| type | 用途 | データの例 |
|---|---|---|
| `chat` | チャット画面の簡略図 | `{ items: [{role: "user"｜"claude"｜"tool", text}], sidebar?: [...], hl?: index }` |
| `terminal` | ターミナルの表示例 | `{ lines: [{kind: "prompt"｜"out"｜"dim"｜"hl", text}] }` |
| `dir` | フォルダ構成（`.claude/` など） | `{ tree: [{name, note?, children?}] }` |

既存の `layers`（設定の優先順位）、`flow`（作業の流れ）、`seq`（ツール呼び出しの往復）、`tree` もそのまま使う。

### 辞典・クイズ・課題
仕様のとおり。補足：
- 辞典 id は種類を接頭辞に（`slash-compact`、`key-shift-tab`、`flag-resume`、`set-permissions-allow`、`path-claude-settings-json`）
- キー操作は `os: { win: "Alt+M", mac: "Option+M" }` の形にして両方表示
- クイズ id：`<節id>-q1`。`choices` は表示時にシャッフル（`fixedOrder: true` で固定）。出題対象は「所属する節の verification が doc-verified／tried」の問題だけ（問題側に状態は持たせない）
- 課題 id：`try-<章番号>-<連番>`。`surface` は節の surfaces と同じ値

### localStorage（`clmanabi:` 接頭辞、`clmanabi:schema` に版）
| キー | 中身 |
|---|---|
| `settings` | 文字サイズ、要約／詳細の初期表示、鮮度の日数、AIに聞くの聞き方 |
| `read` | `{ 節id: 読んだ日時 }` |
| `lastView` | `{ 節id: 最終閲覧日時 }` と「続きから」の節 |
| `answers` | `{ 問題id: { ok, ng, last } }` |
| `quizSession` | 中断中のセット |
| `cards` | `{ カードid: { state, due } }` |
| `try` | `{ 課題id: { doneAt, memo } }`（memo は 2000 字で切る） |
| `meta` | 最後に見たバージョンなど |

## 5. フェーズ分け

### フェーズ1：最小構成と試作（今回の承認範囲）
1. `git init`、fe-manabi からの移植（router、storage、dom、dialog、toast、figure、term、richText、validate の仕組み、serve.py）
2. 5タブの枠組み（未実装のタブは「準備中」）、学ぶ：テキスト（目次・章・節・前後移動・要約／詳細・バッジ・確認日・出典リンク・「読んだ」・code のコピー・用語ポップアップ）
3. 新図種 `chat` `terminal` `dir` と `tools/figures.html`
4. types.js、validate（節・辞典・クイズ・課題のスキーマ、id 重複、リンク切れ、`[[用語]]`、sources／checkedAt、未確認件数）
5. 試作2章：**a04 プロジェクト**、**c13 CLAUDE.md とコンテキスト管理**。作成（Opus）→ 検査（別の Opus：blocker／major／minor を JSON でファイルへ）→ 反映（Sonnet）→ doc-verified。2章分の用語集とクイズ（各節2〜3問）も作り、検査する
6. 報告：1章の分量・読む時間、作成と検査の消費量（セッションの使用量の差分で計測）、公式で確認できなかった点
→ **ここで止めて確認をもらう**

### フェーズ2：内容の拡充
残り17章（2〜3章ずつ並列に作成・検査）、用語集（約150語）、確認クイズ（約250問）、演習タブ（章／ランダム／苦手、中断と再開、結果）、記録タブ

### フェーズ3：辞典と定着
辞典（約120項目。CLI オプションは同梱 CLI の `--help` と照合）、暗記カード、今日の復習、やってみよう（約30件）、鮮度の警告と `#/stale`、`tools/stale.mjs`、「AIに聞く」

### フェーズ4：仕上げ
PWA（manifest・sw.js・アイコン・更新バナー）、設定とデータ管理、ヘルプと非公式の表記、README／CONTENT／RECHECK_BRIEF／TESTING／HANDOFF、全データの最終検証、GitHub Pages への公開

各フェーズの終わりに、変更内容・件数・未確認一覧・仕様との食い違い・実機確認点を報告し、HANDOFF.md を更新する。

## 6. 作成と検査の進め方（CONTENT.md・ブリーフに記載）

- `tools/chapter-prep.mjs` で、章ごとに「節の一覧・要約・参照すべき公式ページ・用語集の現状」を `work/<章id>-brief.json` に出す
- 作成エージェント（Opus）：ブリーフと公式ページを読み、`work/<章id>-draft.json` を書く。報告は10行以内
- 検査エージェント（別の Opus）：全節を公式ページと照合し、`work/<章id>-qa.json`（blocker／major／minor・該当箇所・根拠 URL）を書く
- 反映（Sonnet）：指摘を反映して `data/text/<章id>.json` へ。blocker・major が無くなった節を doc-verified に
- 確認できない記述は書かないか、unverified にして報告に挙げる
- 料金・上限・プラン別の提供条件は書かない（validate で「円」「$」「回／日」等の表現を警告）

## 7. 確認していただきたい点

1. **章立て**：19章（旧18章を「並列作業とクラウド」「自動化と実践」に分割、第10章を Cowork 中心に）でよいか
2. **出典リンクの言語**：Claude Code のドキュメントは日本語版（`/docs/ja/`）があるので、リンクは日本語版、照合は英語版で行う案でよいか
3. **リポジトリ**：この作業フォルダで `git init` し、GitHub の `claude-manabi` リポジトリへの push はフェーズ1の報告後（承認を得てから）行う案でよいか
4. **`/help` の照合**：対話画面の出力は自動で取れないため、フェーズ3で一度だけ `/help` の出力を貼ってもらう案でよいか
