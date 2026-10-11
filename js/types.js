// 型定義（JSDoc）。実行時のコードは持たない。正式な説明は CONTENT.md。

/**
 * @typedef {'web'|'desktop'|'mobile'|'cli'|'ide'|'chrome'} Surface   使える場所
 * @typedef {'ga'|'beta'|'preview'|'deprecated'} ReleaseStatus        提供状況
 * @typedef {'unverified'|'doc-verified'|'tried'} VerificationStatus
 *   doc-verified＝公式ドキュメントで照合済み、tried＝ユーザーが実際に操作して確認済み
 */

/**
 * @typedef {Object} Source  根拠とした公式ページ
 * @property {string} title
 * @property {string} url
 */

/**
 * @typedef {Object} Verification
 * @property {VerificationStatus} status
 * @property {string} [note]
 */

/**
 * @typedef {Object} Part  部（第1部 Claudeアプリ など）。meta.json の parts[]
 * @property {string} id      章 id の接頭辞（a / c / p）
 * @property {string} title
 * @property {number} order
 */

/**
 * @typedef {Object} Meta  data/meta.json
 * @property {string} dataVersion     sw.js の VERSION と同じ値
 * @property {number} schemaVersion
 * @property {Part[]} parts
 * @property {string[]} textFiles     data/ からの相対パス
 * @property {string[]} dictFiles
 * @property {string[]} quizFiles
 * @property {string} glossaryFile
 * @property {string} tryFile
 * @property {{sections:number, quiz:number, dict:number, glossary:number, try:number}} counts
 */

/**
 * @typedef {Object} TableData
 * @property {string[]} header
 * @property {string[][]} rows
 */

/**
 * @typedef {Object} FigureData  図データ（CONTENT.md「図データ」）
 * @property {string} type   tree|state|layers|flow|venn|bar|seq|network|chat|terminal|dir など
 * @property {string} [caption]
 */

/**
 * 本文のブロック。文字列は ^{} _{} `code` [[用語]] 記法と用語の自動リンクに対応する。
 * @typedef {{type:'p', text:string}
 *   | {type:'h', text:string}
 *   | {type:'list', items:string[]}
 *   | {type:'steps', title?:string, items:string[]}
 *   | {type:'figure', figure:FigureData}
 *   | {type:'table', title?:string, table:TableData}
 *   | {type:'note', kind:'tip'|'pitfall'|'caution', title?:string, text:string}
 *   | {type:'example', title?:string, text:string, answer?:string}
 *   | {type:'code', lang?:string, caption?:string, code:string}} Block
 */

/**
 * @typedef {Object} Digest  要約表示のまとめ
 * @property {string} text      まとめ（3〜5文）
 * @property {string[]} keys    覚える項目
 */

/**
 * @typedef {Object} TextSection
 * @property {string} id            例: a04-01
 * @property {string} title         例: 4.1 プロジェクトとは
 * @property {string[]} points      この節の要点
 * @property {Digest} digest
 * @property {Block[]} blocks
 * @property {Surface[]} surfaces
 * @property {ReleaseStatus} status
 * @property {Source[]} sources     1件以上
 * @property {string} checkedAt     YYYY-MM-DD
 * @property {Verification} verification
 * @property {string[]} tryIds
 * @property {string[]} dictIds
 */

/**
 * @typedef {Object} TextChapter  data/text/<章id>.json
 * @property {number} schemaVersion
 * @property {string} id            例: a04
 * @property {string} part          parts[].id
 * @property {number} order         通し番号（章番号）
 * @property {string} title         例: 第4章 プロジェクト
 * @property {string} summary
 * @property {number} minutes       読む時間の目安（分）
 * @property {TextSection[]} sections
 */

/**
 * @typedef {'slash'|'key'|'cli-flag'|'setting'|'path'} DictKind
 */

/**
 * @typedef {Object} DictItem  data/dict/<種類>.json の items[]
 * @property {string} id
 * @property {DictKind} kind
 * @property {string} name
 * @property {string} [syntax]
 * @property {string} summary
 * @property {string} details       [[用語]] 記法で用語集にリンクする
 * @property {{code:string, desc:string}[]} examples
 * @property {Surface[]} surfaces
 * @property {ReleaseStatus} status
 * @property {Source[]} sources
 * @property {string} checkedAt
 * @property {Verification} verification
 * @property {{win:string, mac:string}} [os]   キー操作が OS で異なるとき
 * @property {string[]} sectionIds
 */

/**
 * @typedef {Object} QuizQuestion  data/quiz/<章id>.json の questions[]
 * @property {string} id            例: a04-01-q1
 * @property {string} sectionId
 * @property {string} question
 * @property {string[]} choices     長さ4
 * @property {0|1|2|3} answer       choices の index
 * @property {string} explanation
 * @property {Source[]} sources
 * @property {boolean} [fixedOrder] 選択肢を並べ替えない（「すべて」などを含むとき）
 */

/**
 * @typedef {Object} TryTask  data/try.json の tasks[]
 * @property {string} id
 * @property {string} title
 * @property {Surface} surface
 * @property {number} minutes
 * @property {string} goal
 * @property {string[]} steps
 * @property {string} expected
 * @property {string[]} cautions
 * @property {string[]} sectionIds
 */

/**
 * @typedef {Object} GlossaryTerm  data/glossary.json の terms[]
 * @property {string} id
 * @property {string} term
 * @property {string} reading       ひらがな（五十音順の並べ替え用）
 * @property {string[]} [aliases]
 * @property {string} definition
 * @property {string[]} [related]   用語 id
 */

/**
 * @typedef {Object} Settings
 * @property {'normal'|'large'} fontSize
 * @property {'summary'|'detail'} learnMode   要約／詳細の初期表示（最後の選択で上書き）
 * @property {60|90|180} staleDays            鮮度の警告の日数
 * @property {string} aiMode                  「AIに聞く」の最後の聞き方
 */

export {};
