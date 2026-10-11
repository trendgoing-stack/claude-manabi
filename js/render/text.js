// 文章記法を DOM にする。textContent だけで組み立てる。
//   ^{上付き} _{下付き} `インラインのコード`
// 用語リンク（[[用語]] と自動リンク）は render/lesson.js の linked() が担当する。

const TOKEN = /`([^`]+)`|([\^_])\{([^{}]*)\}/g;

/**
 * @param {string} text
 * @returns {DocumentFragment}
 */
export function richText(text) {
  text = String(text ?? '');
  const frag = document.createDocumentFragment();
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    if (m.index > last) frag.append(text.slice(last, m.index));
    let el;
    if (m[1] != null) {
      el = document.createElement('code');
      el.className = 'inline';
      el.textContent = m[1];
    } else {
      el = document.createElement(m[2] === '^' ? 'sup' : 'sub');
      el.textContent = m[3];
    }
    frag.append(el);
    last = m.index + m[0].length;
  }
  if (last < text.length) frag.append(text.slice(last));
  return frag;
}

/** 記法を取り除いた素の文字列（検索・プロンプト用） */
export const plainText = (text) =>
  String(text ?? '')
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$1')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[\^_]\{([^{}]*)\}/g, '$1');
