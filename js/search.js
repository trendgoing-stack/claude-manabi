// 検索の正規化：NFKC、英字の小文字化、カタカナ→ひらがな、「/」「-」と空白を無視する。
// 例：「compact」で「/compact」が、「resume」で「--resume」が、「ふっく」で「フック」が見つかる

/** @param {string} s */
export function normalize(s) {
  return String(s ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .replace(/[\s/\-_・]/g, '');
}

/**
 * 項目の並びから、問い合わせに一致するものを返す。名前の一致を先に、本文だけの一致を後に並べる
 * @template T
 * @param {T[]} items
 * @param {string} query
 * @param {(item:T) => string[]} names    名前・別名など（優先して一致させる）
 * @param {(item:T) => string[]} [texts]  説明文など
 * @returns {T[]}
 */
export function search(items, query, names, texts = () => []) {
  const q = normalize(query);
  if (!q) return items;
  const head = [];
  const tail = [];
  for (const it of items) {
    const ns = names(it).map(normalize);
    if (ns.some((n) => n.startsWith(q))) head.push([0, it]);
    else if (ns.some((n) => n.includes(q))) head.push([1, it]);
    else if (texts(it).some((t) => normalize(t).includes(q))) tail.push(it);
  }
  return [...head.sort((a, b) => a[0] - b[0]).map((x) => x[1]), ...tail];
}

/** 入力が止まってから ms 後に fn を呼ぶ */
export function debounce(fn, ms = 150) {
  let t = 0;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}
