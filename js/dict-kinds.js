// 辞典の種類（表示名と並び順）
export const DICT_KINDS = {
  slash: { label: 'スラッシュコマンド', short: 'コマンド', order: 1 },
  key: { label: 'キー操作', short: 'キー', order: 2 },
  'cli-flag': { label: 'CLI オプション', short: 'CLI', order: 3 },
  setting: { label: '設定キー', short: '設定', order: 4 },
  path: { label: 'ファイル・パス', short: 'パス', order: 5 },
};

export const DICT_KIND_IDS = Object.keys(DICT_KINDS);
