# Claudeまなび帳

Claude アプリ（Web・デスクトップ・モバイル）と Claude Code の機能を、章立ての解説・確認クイズ・用語集で学ぶ、自分用の学習アプリ（PWA）です。

公開URL：https://trendgoing-stack.github.io/claude-manabi/

> **非公式の学習アプリです。Anthropic社とは関係ありません。正確な仕様は公式ドキュメントを参照してください。**
>
> 解説・図・問題はすべて、公式情報を確認したうえでオリジナルに書いた要約です。内容は各節の「確認日」の時点のもので、Claude の機能は頻繁に変わります。使える機能はプラン・端末・地域によって異なります。

## 特徴

- 第1部 Claudeアプリ（10章）、第2部 Claude Code（9章）。各節に、使える場所・提供状況・確認日と、根拠にした公式ドキュメントのリンクを付けています
- 確認クイズは、公式ドキュメントで照合済みの節の問題だけを出題します
- 学習記録はブラウザの localStorage にだけ保存し、外部へは送信しません。アクセス解析はありません
- ビルド不要のバニラ JavaScript（ES Modules）。外部ライブラリ・CDN・Webフォントは使いません

## 開発

```
python tools/serve.py 8765
node tools/validate.mjs
```

- データの形式と書き方：[CONTENT.md](CONTENT.md)
- 実装計画：[PLAN.md](PLAN.md)、引き継ぎ：[HANDOFF.md](HANDOFF.md)、実機確認：[TESTING.md](TESTING.md)

公開手順・ホーム画面への追加手順・更新の手順は、仕上げの段階で追記します。
