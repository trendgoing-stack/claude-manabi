// コマンドや設定例のコードブロック。コピーボタン付き。
import { h } from '../dom.js';
import { copyText, selectContents } from '../clipboard.js';
import { toast } from '../ui/toast.js';

const LANG_LABEL = { shell: 'ターミナル', bash: 'ターミナル', json: 'JSON', markdown: 'Markdown', md: 'Markdown', text: 'テキスト', yaml: 'YAML', prompt: 'プロンプト' };

/**
 * @param {{code:string, lang?:string, caption?:string}} b
 */
export function renderCodeBlock(b) {
  const pre = h('pre', { tabindex: '0' }, h('code', null, b.code));
  const manual = h('p', { class: 'codebox-manual', hidden: true, role: 'status' }, 'コピーできませんでした。選択された部分を長押しして、手動でコピーしてください。');
  const btn = h('button', {
    type: 'button',
    class: 'btn small',
    'aria-label': 'コードをコピー',
    // タップのハンドラの中で同期的にコピーを始める（iPhone Safari の制約）
    onClick: () =>
      copyText(b.code, {
        onDone: () => {
          manual.hidden = true;
          toast('コピーしました');
        },
        onManual: () => {
          manual.hidden = false;
          selectContents(pre);
        },
      }),
  }, 'コピー');
  return h(
    'figure',
    { class: 'codebox' },
    h('div', { class: 'codebox-head' }, h('span', null, b.caption ?? LANG_LABEL[b.lang] ?? 'コード'), btn),
    pre,
    manual,
  );
}
