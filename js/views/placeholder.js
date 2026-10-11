// まだ作っていない画面（フェーズごとに置き換える）
import { h, put } from '../dom.js';
import { learnNav } from './learn.js';

/** @param {string} title @param {string} phase @param {string} [nav] 学ぶタブの切り替えを出すときのルート名 */
export const placeholder = (title, phase, nav) => (root) => {
  put(root, h('h1', null, title), nav ? learnNav(nav) : null, h('p', { class: 'placeholder muted' }, `この画面は${phase}で追加します。`));
};
