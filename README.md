# Claudeまなび帳

Claude アプリ（Web・デスクトップ・モバイル）と Claude Code の機能を、章立ての解説・確認クイズ・暗記カード・辞典・用語集・「やってみよう」課題で学ぶ、自分用の学習アプリ（PWA）です。

公開URL：https://trendgoing-stack.github.io/claude-manabi/

> **非公式の学習アプリです。Anthropic社とは関係ありません。正確な仕様は公式ドキュメントを参照してください。**
>
> 解説・図・問題はすべて、公式情報を確認したうえでオリジナルに書いた要約です。内容は各節の「確認日」の時点のもので、Claude の機能は頻繁に変わります。使える機能はプラン・端末・地域によって異なります。料金や利用上限などの数値は載せていません。

## 内容

| | |
|---|---|
| 解説 | 第1部 Claudeアプリ（10章）、第2部 Claude Code（9章）。19章・113節。各節に使える場所・提供状況・確認日と、根拠にした公式ドキュメントのリンク |
| 確認クイズ | 281問。公式ドキュメントで照合済みの節の問題だけを出題。章を選ぶ／全体からランダム／苦手を復習、中断と再開 |
| 辞典 | 131項目（スラッシュコマンド・キー操作・CLI オプション・設定キー・ファイル・パス） |
| 用語集・暗記カード | 162語。カードは用語と辞典の項目から範囲を選べる |
| やってみよう | 31件。すべて練習用のフォルダ・リポジトリ・チャットで行う課題 |
| そのほか | 今日の復習、記録、情報の鮮度の警告、「AIに聞く」（プロンプトを作ってコピーするだけで、アプリからは送信しない） |

- 学習記録は端末のブラウザ（localStorage）にだけ保存し、外部へは送信しません。アクセス解析はありません
- 初回の読み込みの後は、通信がなくても全機能が動きます（Service Worker）
- ビルド不要のバニラ JavaScript（ES Modules）＋HTML＋CSS。外部ライブラリ・CDN・Webフォントは使いません
- 一部の構成とコード（ルーター、図のレンダラー、用語リンクなど）は、同じ作者の「基本情報まなび帳」から持ってきて改変しています

## ホーム画面に追加する（iPhone）

1. Safari で公開URLを開く
2. 共有ボタン →「ホーム画面に追加」
3. ホーム画面のアイコン（Claudeまなび）から起動する。一度開いた後はオフラインでも使える

Safari で開いた場合とホーム画面から起動した場合では、保存データが別になります。移すときは、設定の「データ管理」でエクスポートしたファイルを、もう一方でインポートします。

## 開発

```
python tools/serve.py 8765
```

- `http://localhost:8765/` で開く。localhost では Service Worker を登録しない（試すときは `?sw=1` を付ける）
- `?fixture=1` を付けると、表示確認用のテストデータ（`tools/fixture/data/`）を読む
- `tools/validate.html`（ブラウザ）・`tools/figures.html`（図の一覧）は開発用で、アプリからはリンクしない

### 検査

```
node tools/validate.mjs
```

スキーマ違反、id の重複、リンク切れ、用語集にない `[[用語]]`、`sources`・`checkedAt` の欠け、`dataVersion` と `sw.js` の `VERSION` の不一致、`sw.js` の `APP_SHELL` の漏れなどをエラーにします。push の前に必ず通します。

### 更新の手順

1. データやコードを直す（データの決まりは [CONTENT.md](CONTENT.md)）
2. JS や CSS のファイルを足したら、`sw.js` の `APP_SHELL` にも足す
3. **バージョンを上げる**：`data/meta.json` の `dataVersion` と `sw.js` の `VERSION` を同じ値にする（`YYYY.MM.DD-n`。同じ日の2回目は `-2`）。データだけを変えたときも両方を上げる
4. `node tools/validate.mjs` を通す
5. コミットして `main` に push する。GitHub Pages に反映され、アプリを開くと「更新があります（タップで再読み込み）」が出る（クイズの出題中は出ない）

### 公開の手順（最初の1回）

1. GitHub に公開リポジトリを作り、`main` に push する
2. リポジトリの Settings → Pages で、Source を「Deploy from a branch」、Branch を `main`・`/ (root)` にする
3. `https://<ユーザー名>.github.io/<リポジトリ名>/` で開けることを確かめる（manifest・Service Worker のパスはすべて相対なので、URL の下の階層でも動く）

### 情報の鮮度の点検

```
node tools/stale.mjs 90
```

手順は [tools/RECHECK_BRIEF.md](tools/RECHECK_BRIEF.md)。

## ドキュメント

- [CONTENT.md](CONTENT.md)：データの形式・書き方・情報源のルール・作成と検査の手順
- [PLAN.md](PLAN.md)：実装計画
- [HANDOFF.md](HANDOFF.md)：引き継ぎ（進捗・作業上の注意）
- [TESTING.md](TESTING.md)：実機確認のチェックリスト
- [tools/RECHECK_BRIEF.md](tools/RECHECK_BRIEF.md)：鮮度の点検の手順
