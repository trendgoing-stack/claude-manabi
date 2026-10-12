// 設定（文字サイズ・要約／詳細の初期表示・鮮度の警告の日数・データ管理・バージョンと収録件数・ヘルプ）
import { h, put } from '../dom.js';
import { buildExport, shareExport, downloadExport, markExported, importData } from '../io.js';
import { confirmDialog } from '../ui/dialog.js';
import { toast } from '../ui/toast.js';
import { navigate } from '../router.js';
import * as storage from '../storage.js';
import { app } from '../state.js';
import { failedNotice } from './home.js';

export const DISCLAIMER = '非公式の学習アプリです。Anthropic社とは関係ありません。正確な仕様は公式ドキュメントを参照してください。';

function radios(name, options, current, onChange) {
  return h(
    'div',
    { class: 'radio-list', role: 'radiogroup' },
    options.map(([value, label]) =>
      h('label', { class: 'radio-item' }, h('input', { type: 'radio', name, value: String(value), checked: String(current) === String(value), onChange: () => onChange(value) }), label),
    ),
  );
}

const fmt = (ms) => {
  const d = new Date(ms);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
};

/** データ管理：エクスポート／インポート（統合・置き換え）／全削除 */
function dataCard() {
  const last = storage.getMeta().lastExportAt;
  let mode = 'merge';
  const result = h('p', { class: 'small', role: 'status' });
  const file = h('input', { type: 'file', accept: 'application/json,.json', hidden: true });
  file.addEventListener('change', async () => {
    const f = file.files?.[0];
    file.value = '';
    if (!f) return;
    const text = await f.text();
    if (mode === 'replace' && !(await confirmDialog('この端末の学習記録を、ファイルの内容で置き換えます。よろしいですか？', { ok: '置き換える', danger: true }))) return;
    try {
      const r = importData(text, mode);
      result.className = 'small';
      result.textContent = `取り込みました（読んだ節 ${r.read}件・回答した問題 ${r.answers}問）。`;
      toast('取り込みました');
    } catch (e) {
      // 形式が不正なときは何も変えていない
      result.className = 'small notice warn';
      result.textContent = `取り込めませんでした：${e.message}。データは変更していません。`;
    }
  });
  const modeRadios = h(
    'div',
    { class: 'radio-list', role: 'radiogroup', 'aria-label': '取り込み方' },
    [['merge', '統合する（この端末の記録と合わせる。新しいほうを残す）'], ['replace', '置き換える（この端末の記録を消して、ファイルの内容にする）']].map(([v, label]) =>
      h('label', { class: 'radio-item' }, h('input', { type: 'radio', name: 'import-mode', value: v, checked: v === mode, onChange: () => { mode = v; } }), label),
    ),
  );
  return h(
    'section',
    { class: 'card' },
    h('h2', null, 'データ管理'),
    h('p', { class: 'muted small' }, '学習記録（読んだ節・クイズの回答・カード・やってみよう・設定）はこの端末のブラウザにだけ保存され、外部には送信されません。Safari とホーム画面のアプリでは保存先が別なので、移すときはエクスポートしたファイルを、もう一方でインポートしてください。'),
    h('p', { class: 'muted small' }, last ? `最後のエクスポート：${fmt(last)}` : 'まだエクスポートしていません。'),
    h(
      'div',
      { class: 'btn-col' },
      h('button', {
        type: 'button',
        class: 'btn big',
        onClick: async () => {
          const text = buildExport();
          const r = await shareExport(text);
          if (r === 'unavailable') downloadExport(text);
          if (r !== 'cancelled') {
            markExported();
            toast('エクスポートしました');
          }
        },
      }, 'エクスポート（ファイルに保存）'),
    ),
    h('h3', null, 'インポート'),
    modeRadios,
    h('div', { class: 'btn-col' }, h('button', { type: 'button', class: 'btn big', onClick: () => file.click() }, 'ファイルを選んでインポート'), file),
    result,
    h('h3', null, '全削除'),
    h('div', { class: 'btn-col' }, h('button', {
      type: 'button',
      class: 'btn big danger',
      onClick: async () => {
        if (!(await confirmDialog('この端末の学習記録と設定をすべて削除します。元に戻せません。先にエクスポートしておくことをおすすめします。削除しますか？', { ok: 'すべて削除', danger: true }))) return;
        storage.clearAll();
        storage.init();
        toast('すべて削除しました');
        navigate('home');
      },
    }, '学習記録をすべて削除')),
  );
}

export function settingsView(root) {
  const s = storage.getSettings();
  const m = app.data.meta;
  const c = {
    sections: app.data.texts.reduce((n, ch) => n + ch.sections.length, 0),
    quiz: app.data.quiz.length,
    dict: app.data.dict.length,
    glossary: app.data.glossary.length,
    try: app.data.tasks.length,
  };
  put(root,
    h('h1', null, '設定'),
    failedNotice(),
    h(
      'section',
      { class: 'card' },
      h('h2', null, '文字サイズ'),
      radios('font', [['normal', '標準'], ['large', '大']], s.fontSize, (v) => {
        storage.saveSettings({ fontSize: v });
        document.documentElement.dataset.font = v;
      }),
      h('h2', null, '解説の初期表示'),
      radios('mode', [['detail', '詳細'], ['summary', '要約']], s.learnMode, (v) => storage.saveSettings({ learnMode: v })),
      h('p', { class: 'muted small' }, '節の画面で切り替えると、その選択がここにも反映されます。'),
      h('h2', null, '「情報が古い可能性」の警告'),
      radios('stale', [[60, '確認から60日'], [90, '確認から90日（標準）'], [180, '確認から180日']], s.staleDays, (v) => storage.saveSettings({ staleDays: Number(v) })),
    ),
    dataCard(),
    h(
      'section',
      { class: 'card' },
      h('h2', null, 'このアプリについて'),
      h(
        'dl',
        { class: 'kv' },
        h('dt', null, 'アプリ'), h('dd', null, app.version || '—'),
        h('dt', null, 'データ'), h('dd', null, m?.dataVersion ?? '—'),
        h('dt', null, '収録'), h('dd', null, `解説 ${c.sections}節・クイズ ${c.quiz}問・辞典 ${c.dict}項目・用語 ${c.glossary}語・課題 ${c.try}件`),
      ),
      h('a', { class: 'btn big', href: '#/help' }, 'ヘルプ・注意事項'),
    ),
    h('p', { class: 'notice' }, DISCLAIMER),
  );
}
