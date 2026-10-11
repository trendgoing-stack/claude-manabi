// ヘルプ・注意事項
import { h, put } from '../dom.js';
import { DISCLAIMER } from './settings.js';

const NOTES = [
  'このアプリは非公式の学習アプリです。解説・図・問題は、公式情報を確認したうえでオリジナルに書いた要約で、内容は各節の「確認日」の時点のものです。',
  'Claude の機能は頻繁に変わります。実際に操作する前に、各節の末尾にある公式ドキュメントで最新の情報を確認してください。',
  '使える機能は、プラン・端末・地域によって異なります。料金や利用上限などの数値は、このアプリには載せていません。',
  '「やってみよう」の課題は、練習用のフォルダやリポジトリで行ってください。',
  '学習記録はこの端末のブラウザの中にだけ保存し、外部には送信しません。',
  'Safari で開いた場合とホーム画面から起動した場合では、保存データが別になります。設定のエクスポート／インポートで移せます（フェーズ4で追加）。',
];

export function helpView(root) {
  put(root,
    h('header', { class: 'run-head' }, h('a', { class: 'btn small', href: '#/settings' }, '設定'), h('span'), h('span')),
    h('h1', null, 'ヘルプ・注意事項'),
    h('section', { class: 'card' }, h('ul', { class: 'help-list' }, NOTES.map((n) => h('li', null, n)))),
    h('section', { class: 'card' }, h('h2', null, '使い方'), h('ul', { class: 'help-list' },
      h('li', null, '学ぶ：章の目次から節を開いて読みます。「要約／詳細」で詳しさを切り替えられます。'),
      h('li', null, '点線の下線がある用語をタップすると、定義を表示します。'),
      h('li', null, 'コマンドや設定例の「コピー」で、内容をクリップボードにコピーできます。'),
      h('li', null, 'タイトルの下のバッジは、使える場所・提供状況（一般提供以外のとき）・公式情報で確認した日です。'),
    )),
    h('p', { class: 'notice' }, DISCLAIMER),
  );
}
