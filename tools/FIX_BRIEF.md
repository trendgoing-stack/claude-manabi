# 検査の指摘を反映する（反映エージェント向けの共通の指示）

リポジトリ：このリポジトリの直下。決まりは `CONTENT.md`。

## 入力

- `work/<章id>-draft.json`・`work/<章id>-quiz.json`・`work/<章id>-terms.json`（作成者の下書き）
- `work/<章id>-qa.json`（検査の結果。`sections[]` と `findings[]`）

## 作業

1. `findings` を上から順に反映する。blocker と major はすべて反映する。minor は妥当なものを反映する。`fix` の文言は目安で、前後の文とつながるように直してよい。ただし**公式情報にない事実を新しく足さない**（足す必要があると思ったら、報告に書く）
2. 公式情報で確かめられなかった記述（`unverifiable` の節の中心の記述、「確認できなかった」とある指摘）は、削るか、確かめられた範囲の書き方に弱める。それでも節が成り立たない場合は、その節の `verification` を `{ "status": "unverified", "note": "理由" }` のままにする
3. blocker・major をすべて解消した節は、`verification` を `{ "status": "doc-verified", "note": "<検査日> 公式ドキュメントと照合（検査：別エージェント）" }` にし、`checkedAt` を検査日にする
4. 本文の字数が変わったら `minutes` を直す（本文の字数 ÷ 500 を切り上げ）
5. 反映した結果を、同じ `work/<章id>-draft.json`・`-quiz.json`・`-terms.json` に上書きする。クイズの指摘で問題を削った場合は、その節の問題が2問以上残るようにする（残らなければ報告する）
6. `node tools/check-draft.mjs <章id>` を実行し、エラーがなくなるまで直す

`work/` 以外のファイルは変更しない。一時ファイルは `work/<章id>-fix-` で始まる名前にする。

## 報告

10行以内：反映した指摘の件数（severity 別）、反映しなかった指摘とその理由、`doc-verified` にした節と `unverified` のまま残した節。
