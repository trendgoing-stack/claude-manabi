// クリップボードへのコピー。iPhone Safari ではユーザー操作の直後にしか書き込めないため、
// タップのイベントハンドラの中から同期的に呼ぶこと（await を挟んだ後に呼ばない）。
//   1. navigator.clipboard.writeText
//   2. 失敗したら、非表示の textarea と execCommand('copy') で再試行
//   3. それも失敗したら onManual() を呼ぶ（呼び出し側でコードを選択状態にして案内する）

/** 非表示の textarea を使う古い方法。成功したら true */
function execCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  // 画面外に置き、iOS の自動ズームを避けるため文字サイズは 16px にする
  ta.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0;font-size:16px;';
  document.body.append(ta);
  let ok = false;
  try {
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, text.length);
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  ta.remove();
  return ok;
}

/**
 * @param {string} text
 * @param {{onDone:()=>void, onManual:()=>void}} cb
 */
export function copyText(text, { onDone, onManual }) {
  const fallback = () => (execCopy(text) ? onDone() : onManual());
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    let p;
    try {
      p = navigator.clipboard.writeText(text);
    } catch {
      fallback();
      return;
    }
    p.then(onDone, fallback);
  } else {
    fallback();
  }
}

/** 要素の中身を選択状態にする（手動コピーの案内用） */
export function selectContents(el) {
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}
