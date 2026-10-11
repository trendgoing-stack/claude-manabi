# CONTENT.md — データの形式・書き方・情報源・作成と検査の手順

このファイルは、解説・辞典・用語集・クイズ・課題のデータを作る人（作成・検査のエージェントを含む）のための決まりです。型の定義は `js/types.js`、検査は `tools/validate-core.js` にあります。

## 1. ファイル

| ファイル | 中身 |
|---|---|
| `data/meta.json` | `dataVersion`、`schemaVersion`、`parts[]`、`textFiles[]`、`dictFiles[]`、`quizFiles[]`、`glossaryFile`、`tryFile`、`counts` |
| `data/text/<章id>.json` | 章ごとの解説（例：`a04-projects.json`、`c13-context.json`） |
| `data/dict/<種類>.json` | 辞典（`slash`／`key`／`cli-flag`／`setting`／`path`） |
| `data/glossary.json` | 用語集 |
| `data/quiz/<章id>.json` | 確認クイズ（解説と同じファイル名） |
| `data/try.json` | 「やってみよう」課題 |

- 章 id の接頭辞：`a`＝第1部 Claudeアプリ、`c`＝第2部 Claude Code、`p`＝第3部 API・Agent SDK（将来）。番号は部をまたいだ通し番号（`a01`〜`a10`、`c11`〜`c19`）
- **部を足すとき**：`meta.json` の `parts[]` に `{ "id": "p", "title": "第3部 API・Agent SDK", "order": 3 }` を足し、章ファイルを置いて `textFiles[]`（クイズは `quizFiles[]`）に足す。コードの変更は要らない
- `dataVersion` は `sw.js` の `VERSION` と同じ値にする（`YYYY.MM.DD-n`）。データだけを変えたときも両方を上げる

## 2. 共通の項目（節と辞典の項目）

| フィールド | 内容 |
|---|---|
| `surfaces[]` | 使える場所：`web`／`desktop`／`mobile`／`cli`／`ide`／`chrome`。1件以上 |
| `status` | 提供状況：`ga`（一般提供）／`beta`／`preview`（リサーチプレビュー等）／`deprecated`。公式に「beta」「research preview」とあるものだけ `ga` 以外にする |
| `sources[]` | 根拠とした公式ページ `{ "title", "url" }`。1件以上必須。Claude Code のページは日本語版（`https://code.claude.com/docs/ja/...`）を載せ、照合は英語版（`/docs/en/`）で行う。ヘルプセンターは `https://support.claude.com/ja/articles/...` が開ければ日本語版、無ければ英語版 |
| `checkedAt` | 公式情報で内容を確認した日（`YYYY-MM-DD`） |
| `verification` | `{ "status": "unverified" / "doc-verified" / "tried", "note": "" }`。`doc-verified`＝作成とは別のエージェントが公式ドキュメントと照合し、指摘を反映済み。`tried`＝ユーザーが実際に操作して確認済み（ユーザーだけが付ける） |

## 3. 解説（`data/text/<章id>.json`）

```json
{ "schemaVersion": 1, "id": "a04", "part": "a", "order": 4,
  "title": "第4章 プロジェクト", "summary": "この章で学ぶこと（2〜3文）", "minutes": 12,
  "sections": [
    { "id": "a04-01", "title": "4.1 プロジェクトとは",
      "points": ["要点1", "要点2"],
      "digest": { "text": "まとめ（3〜5文・200〜400字）", "keys": ["覚える項目", "…"] },
      "blocks": [ { "type": "p", "text": "本文" } ],
      "surfaces": ["web", "desktop", "mobile"], "status": "ga",
      "sources": [ { "title": "What are projects?", "url": "https://support.claude.com/..." } ],
      "checkedAt": "2026-10-12",
      "verification": { "status": "unverified", "note": "" },
      "tryIds": [], "dictIds": [] }
  ] }
```

- 節の `id` は `<章id>-<2桁連番>`、`title` は「N.M ○○」
- `minutes`：読む時間の目安。本文（`text`・`items`・`answer`・`code` の合計）を 1分あたり 500 字として切り上げる
- `tryIds[]`・`dictIds[]`：存在する id だけを入れる（まだ無ければ空配列）

### ブロック（`blocks[].type`）

| type | 項目 | 用途 |
|---|---|---|
| `h` | `text` | 小見出し |
| `p` | `text` | 段落 |
| `list` | `items[]` | 箇条書き |
| `steps` | `items[]`、`title?` | 番号付きの手順 |
| `figure` | `figure` | 図（下の「図データ」） |
| `table` | `table: {header[], rows[][]}`、`title?` | 表 |
| `note` | `kind`（`tip`／`pitfall`／`caution`）、`text`、`title?` | コツ／つまずきやすい点／注意（安全・データ・権限に関わること） |
| `example` | `text`、`answer?`、`title?` | 使い方の例（指示の文例など）。`answer` は折りたたみで表示 |
| `code` | `code`（改行を含む文字列）、`lang?`、`caption?` | コマンド・設定例・指示の文例。コピーボタンが付く。`lang`：`shell`／`json`／`markdown`／`text`／`prompt` |

### 文章の記法

- `` `/compact` `` のようにバッククォートで囲むと、インラインのコードとして表示する（中は用語リンクしない）
- `[[用語]]` は用語集へのリンク（見出し語・別名・id のどれでもよい）。`[[表示する文字|用語id]]` も使える。用語集に無い語を `[[ ]]` に入れると validate がエラーにする
- `[[ ]]` を付けなくても、用語集の見出し語・別名に一致する語は、その節で最初の1か所が自動でリンクされる
- `^{上付き}` `_{下付き}`。HTML は使わない

### 要約（`digest`）

要約表示では、`digest`（まとめと覚える項目）と、本文のうち小見出し・注意書き・図・表・コードだけを表示する。`digest` は書き下ろし（本文のコピーではない）で、本文にない事実を足さない。

## 4. 図データ

手描きの SVG は使わない。`figure` に書いたデータから `js/render/figure.js` が SVG を作る。色は CSS 変数で、ライト／ダークに追従する。ラベルは短く（全角10字程度まで）。`caption`（任意）は図の下の説明。

### chat（チャット画面の簡略図）

実際の画面のスクリーンショットの代わりに、やり取りの形だけを示す。`role`：`user`（右寄せの吹き出し）／`claude`（左寄せ）／`tool`（破線の小箱：検索・ファイル読み込みなど）／`note`（中央の小さな注記）。`hl: true` で枠を強調、`label` は吹き出しの横の小さな注記。`title` は上部のバー、`input` は下部の入力欄（空文字なら「返信を入力…」）。文字は自動で折り返す。

```json
{ "type": "chat", "title": "プロジェクト：旅行の計画", "items": [
  { "role": "note", "text": "カスタム指示とナレッジが読み込まれる" },
  { "role": "user", "text": "3日目の予定を考えて" },
  { "role": "tool", "text": "ナレッジ「旅程メモ.md」を参照" },
  { "role": "claude", "text": "旅程メモの条件（移動は電車のみ）に合わせて…", "hl": true }
], "input": "" }
```

### terminal（ターミナルの表示例）

`lines[]`：`{ kind?, text }`。`kind`：`prompt`（先頭に「> 」を付けて強調。ユーザーの入力）／`out`（既定。出力）／`dim`（薄い文字）／`hl`（背景を付けて強調）／`ok`／`ng`。`title` を付けると上部に窓の飾りと題名を出す。実際の出力をそのまま写さず、要点だけの簡略な例にする。

```json
{ "type": "terminal", "title": "Claude Code", "lines": [
  { "kind": "prompt", "text": "/context" },
  { "kind": "dim", "text": "（コンテキストの使用状況の概要が表示される）" },
  { "kind": "hl", "text": "Memory files: CLAUDE.md" }
] }
```

### dir（フォルダ構成）

`tree[]`：`{ name, note?, hl?, children? }`。フォルダは `name` の末尾を `/` にする。`note` は右側の短い説明。

```json
{ "type": "dir", "tree": [
  { "name": "my-project/", "children": [
    { "name": "CLAUDE.md", "note": "チームで共有する指示", "hl": true },
    { "name": ".claude/", "children": [ { "name": "settings.json", "note": "共有する設定" } ] }
  ] }
] }
```

### 汎用の図種

- `layers`（階層図）：`levels[]` は上から順に `{label, note?, hl?}`。`arrow: ["優先度が高い", "低い"]` で左に縦矢印。設定の優先順位、読み込みの階層などに使う
- `flow`（流れ図）：`steps[]` は `{id, label, kind?, col?, row?, next?}`。`kind`：`process`（既定）／`decision`（ひし形）／`terminal`（角丸）。`next: [{to, label?}]` を省略すると次の要素へつなぐ。分岐は `col` を -1・1 にずらす
- `seq`（並びの図）：`rows[]` は `{title?, cells:[{text, kind?, note?}]}`。`kind`：`hl`／`dim`／`empty`。コンテキストウィンドウの中身の内訳などに使う
- `tree`（木構造）：`root: {label, children[]}`。位置は自動
- `venn`（ベン図）：`sets[]`（1〜3個）`{label, x, y, r}`（グリッド単位、1単位≒60px）、`shade: [0, 1]` で共通部分を塗る
- `bar`（棒グラフ）：`bars[]` `{label, value, kind?}`。数値を載せられない題材が多いので、使う場面は限られる
- `state`（状態遷移図）：`states[] {id, label, x, y, initial?, final?}`、`transitions[] {from, to, label?}`。権限モードの切り替えなどに使う
- `network`（構成図）：`nodes[] {id, label, kind, x, y}`（`kind`：`internet`／`router`／`switch`／`fw`／`server`／`pc`／`ap`／`cloud`）、`links[] {from, to, label?}`。MCP の接続関係などに使う

```json
{ "type": "layers", "arrow": ["優先", "後回し"], "levels": [ { "label": "管理者の設定", "note": "変更不可" }, { "label": "プロジェクトの設定", "hl": true }, { "label": "ユーザーの設定" } ] }
```

```json
{ "type": "flow", "steps": [ { "id": "a", "label": "開始", "kind": "terminal" }, { "id": "b", "label": "計画を出させる" }, { "id": "c", "label": "計画は妥当？", "kind": "decision", "next": [ { "to": "d", "label": "はい" }, { "to": "b", "label": "いいえ" } ] }, { "id": "d", "label": "実装する" } ] }
```

```json
{ "type": "seq", "rows": [ { "title": "コンテキスト", "cells": [ { "text": "システム" }, { "text": "CLAUDE.md", "kind": "hl" }, { "text": "会話" }, { "text": "空き", "kind": "empty" } ] } ] }
```

## 5. 用語集（`data/glossary.json`）

```json
{ "schemaVersion": 1, "terms": [
  { "id": "g-context-window", "term": "コンテキストウィンドウ", "reading": "こんてきすとういんどう",
    "aliases": ["context window"], "definition": "モデルが一度に参照できる情報の範囲。…",
    "related": ["g-token"] }
] }
```

- `id`：`g-` ＋英小文字とハイフン。一意・不変
- `reading`：ひらがな（英字の略語は読み方をひらがなで。例：MCP→えむしーぴー）。五十音順の並べ替えに使う
- `aliases`：本文で使う別の表記（英語名・略称）。2文字未満の表記は自動リンクに使わない
- `definition`：1〜3文。初めて見る人が分かる言い方で、製品名・機能名は公式の英語表記に合わせる
- 一般的すぎる語（「ファイル」「設定」など）は入れない。自動リンクが乱発するため

## 6. クイズ（`data/quiz/<章id>.json`）

```json
{ "schemaVersion": 1, "chapterId": "a04", "questions": [
  { "id": "a04-01-q1", "sectionId": "a04-01",
    "question": "…はどれか。",
    "choices": ["…", "…", "…", "…"], "answer": 2,
    "explanation": "正解の理由と、誤りの選択肢がなぜ違うか（2〜4文）",
    "sources": [ { "title": "…", "url": "…" } ] }
] }
```

- 1節あたり2〜3問。`id` は `<節id>-q<連番>`。`answer` は 0〜3。正解の位置は章の中でばらつかせる
- 出題対象は、所属する節の `verification.status` が `doc-verified`／`tried` の問題だけ（問題側には状態を持たない）
- 「〜はできない」「〜にしか対応していない」のように、仕様変更ですぐ誤りになる問いは避ける。仕組み・使い分け・手順・目的を問う
- 料金・上限・プラン別の提供条件を問わない
- 「すべて正しい」などの選択肢は使わない。選択肢の長さをそろえ、正解だけが長くならないようにする
- `fixedOrder: true` で選択肢を並べ替えない（順序に意味があるときだけ）

## 7. 辞典・課題

`js/types.js` の `DictItem`・`TryTask` のとおり（フェーズ3で作成）。辞典の id は種類を接頭辞にする（`slash-compact`、`key-shift-tab`、`flag-resume`、`set-permissions-allow`、`path-claude-settings-json`）。課題の id は `try-<章番号2桁>-<連番>`。

## 8. 情報源のルール

- 優先順位：①公式ドキュメント（`code.claude.com/docs`、`docs.claude.com`、`support.claude.com`）→ ②Anthropic 公式のリリースノート・ニュース → ③実際の動作（`claude --help`、`/help` などの出力）
- 記憶だけで書かない。各節・各項目は、作成時に①〜③で確認し、`sources[]` と `checkedAt` を必ず入れる
- 辞典の CLI オプション・スラッシュコマンド・キー操作は、可能な限りローカルの Claude Code の実際の出力と照合する（同梱の CLI：`claude --help`。`/help` はユーザーに出力を貼ってもらう）
- 確認できなかった記述は書かない。書く必要があるときは `verification.status: "unverified"` とし、報告に挙げる
- 料金・利用上限・プランごとの細かな提供条件など、変わりやすい数値は書かない。「プランによって異なる」とし、公式ページへのリンクで案内する（validate が「円」「$」「回/日」「時間あたり」などの表現を警告する）
- 公式の文章・図を転載しない。言い換えでもなく、初めて使う人向けに「何のための機能か → どう使うか → 注意点」の順でオリジナルに書く
- 製品名・機能名は公式の英語表記に合わせ、初出で日本語の説明を添える（例：「Projects（プロジェクト）」）。画面上のボタン名など、日本語 UI の表記が確認できないものは英語表記のまま書き、日本語訳を推測で書かない
- Claude・Anthropic のロゴ、実際の画面のスクリーンショットは使わない。画面の説明は `chat`／`terminal`／`dir` の簡略図で行う

## 9. 文章

- 文体は「です・ます」調。1文は短く。専門用語は初出で説明する
- 1章は 10〜15分（5,000〜7,500字）で読める要点中心。1章を4〜8節に分け、1節は 600〜1,200字
- 各節の構成の目安：何のための機能か（`p`）→ 図（`figure`）→ どう使うか（`steps`／`code`／`example`）→ つまずきやすい点・注意（`note`）
- 図は章全体で3つ以上。画面の操作は `chat`、Claude Code の画面は `terminal`、ファイルの置き場所は `dir`、優先順位は `layers`、作業の流れは `flow` を使う
- 「やってみよう」に関わる操作は、練習用のフォルダやリポジトリで行う前提で書く。本番のリポジトリの削除、強制 push、秘密情報（API キーなど）を扱う操作は例に使わない

## 10. 作成と検査の手順（fe-manabi と同じ方式）

1. `node tools/chapter-prep.mjs <章id>` で、作業ファイル `work/<章id>-brief.md`（節の案・参照する公式ページ・用語集の現状）を作る
2. **作成**（Opus のエージェント）：`tools/CHAPTER_BRIEF.md` に従い、公式ページを読んで `work/<章id>-draft.json`（章）と `work/<章id>-quiz.json`（クイズ）、`work/<章id>-terms.json`（追加する用語）を書く
3. **検査**（作成とは別の Opus のエージェント）：`tools/QA_BRIEF.md` に従い、全節・全問を公式情報と照合し、`work/<章id>-qa.json`（`blocker`／`major`／`minor`）を書く
4. **反映**（Sonnet のエージェント）：指摘を反映して `data/text/`・`data/quiz/`・`data/glossary.json` に書き込む。blocker・major をすべて解消した節を `doc-verified` にする。公式で確認できなかった記述は削るか、節を `unverified` のままにして報告する
5. `node tools/validate.mjs` を通す
- エージェントには必要な節と要約の一覧だけを渡し、結果はファイルに書かせる。報告は件数と重要な指摘だけ（10行以内）
- 一時ファイルは `work/`（git に含めない）に置き、担当ごとに接頭辞を分ける（`<章id>-draft-`、`<章id>-qa-`、`<章id>-fix-`）

## 11. 検証（`node tools/validate.mjs`、ブラウザでは `tools/validate.html`）

スキーマ違反、id の重複、リンク切れ（`sectionIds`・`dictIds`・`tryIds`・用語集の `related`）、用語集にない `[[用語]]`、`sources` が空、`checkedAt` がない、`dataVersion` と `sw.js` の `VERSION` の不一致、`meta.counts` と実数の不一致を**エラー**にする。未確認（`unverified`）の件数、料金・上限らしい表現、正解位置の偏りは**警告**として表示する。
