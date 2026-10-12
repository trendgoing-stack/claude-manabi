# 辞典 1種類分を書くための共通の指示（作成エージェント向け）

学習アプリ「Claudeまなび帳」の「学ぶ：辞典」に載せる項目を、1種類分作る。リポジトリ：このリポジトリの直下。

## 先に読むもの

1. `CONTENT.md` の 2・7・8 節と、`js/types.js` の `DictItem`（項目の形式）
2. 作業ファイル `work/dict-<種類>-brief.md`（目安の件数、候補、解説の節の一覧、用語集の用語）
3. `work/cli-help.txt`：手元の Claude Code（同梱の CLI）の `claude --help` などの出力。CLI オプションとサブコマンドはここと照合する
4. 公式ページ：`https://code.claude.com/docs/en/<ページ>.md`（commands・cli-reference・interactive-mode・keybindings・settings・settings-reference・claude-directory・memory・permissions など）。Claude アプリの項目はヘルプセンター `https://support.claude.com/en/articles/...`

## 項目の形式

`work/dict-<種類>.json` に `{ "schemaVersion": 1, "kind": "<種類>", "items": [ … ] }` で書く。各項目：

| フィールド | 書き方 |
|---|---|
| `id` | 種類の接頭辞＋英小文字とハイフン：`slash-compact`、`key-shift-tab`、`flag-resume`、`set-permissions-allow`、`path-claude-settings-json`。全ファイルで一意 |
| `kind` | `slash`／`key`／`cli-flag`／`setting`／`path` |
| `name` | 表示名（`/compact`、`Shift+Tab`、`--resume`、`permissions.allow`、`.claude/settings.json`） |
| `syntax` | 書式（任意）：`/compact [指示]`、`claude --resume [セッション]` など。引数は `[任意]` `<必須>` |
| `summary` | 1〜2文。何のためのものか |
| `details` | 2〜5文。いつ使うか、どう動くか、注意点。初めて使う人向け。用語集にある語は `[[用語]]` で1〜2か所リンクしてよい（用語集にない語には付けない） |
| `examples` | `[{ "code": "…", "desc": "…" }]` 1〜3個。練習用のフォルダで試せる安全な例。秘密情報の値・本番リポジトリの削除・強制 push は例にしない |
| `surfaces` | 公式に書かれている場所だけ。CLI のオプションは `cli` |
| `status`・`sources`・`checkedAt`・`verification` | 節と同じ（CONTENT.md の 2 節）。`sources` には日本語版 `https://code.claude.com/docs/ja/<ページ>` を載せる。`checkedAt` は今日、`verification` は `{ "status": "unverified", "note": "" }` |
| `os` | キー操作で Windows と Mac が違うときだけ `{ "win": "Alt+P", "mac": "Option+P" }`。`name` は Windows／Linux の表記にする |
| `sectionIds` | 関連する解説の節の id（brief の一覧から。最も関係の深い1〜3個。無ければ空配列） |

## 方針

- **公式情報（とローカルの CLI の出力）で確かめたものだけを載せる**。記憶で補わない。廃止・名前の変更があったものは新しい名前で載せ、古い名前は `details` で触れる程度にする
- よく使うもの、学習者が最初に知るべきものを優先する。管理者向け（managed settings の細部、エンタープライズの認証、ゲートウェイなど）は載せない
- 公式の文章を訳して並べない。`summary`・`details` はオリジナルに短く書く
- 料金・利用上限・プランごとの条件・既定値の具体的な数値（トークン数、秒数など）は書かない
- ベータ・プレビューのものは `status` を合わせる

## 自己検査

`node tools/check-dict.mjs <種類>` を通す（エラーがなくなるまで直す）。一時ファイルは `work/dict-<種類>-draft-` で始まる名前にする。`work/` 以外は変更しない。

## 報告

10行以内：件数、公式で確認できなかったもの（載せなかったもの）、判断が分かれた点。
