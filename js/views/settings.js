// 設定（文字サイズ・要約／詳細の初期表示・鮮度の警告の日数・バージョンと収録件数）
// データ管理（エクスポート／インポート／全削除）はフェーズ4で追加する
import { h, put } from '../dom.js';
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
