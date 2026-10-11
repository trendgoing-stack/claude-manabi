// 画面間で共有する状態（読み込んだデータとアプリのバージョン）

export const app = {
  data: {
    /** @type {import('./types.js').Meta|null} */
    meta: null,
    /** @type {Set<string>} 読み込みを終えた種類 */
    loaded: new Set(),
    /** @type {string[]} 読み込めなかったファイル名 */
    failed: [],
    /** @type {import('./types.js').TextChapter[]} 章番号の順 */
    texts: [],
    /** @type {import('./types.js').GlossaryTerm[]} */
    glossary: [],
    /** @type {Map<string, import('./types.js').GlossaryTerm>} */
    termById: new Map(),
    /** @type {import('./types.js').QuizQuestion[]} */
    quiz: [],
    /** @type {import('./types.js').DictItem[]} */
    dict: [],
    /** @type {Map<string, import('./types.js').DictItem>} */
    dictById: new Map(),
    /** @type {import('./types.js').TryTask[]} */
    tasks: [],
  },
  version: '',
};
