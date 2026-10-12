// データ検証の本体。ブラウザ（validate.html）と Node（validate.mjs）の両方から使う。
// エラー：スキーマ違反、id の重複、リンク切れ、用語集にない [[用語]]、sources が空、checkedAt がない、
//         dataVersion と sw.js の不一致、meta.counts の不一致
// 警告：未確認の件数、料金・上限らしい表現、正解位置の偏り

const SURFACES = ['web', 'desktop', 'mobile', 'cli', 'ide', 'chrome'];
const STATUSES = ['ga', 'beta', 'preview', 'deprecated'];
const VERIFY = ['unverified', 'doc-verified', 'tried'];
const DICT_KINDS = ['slash', 'key', 'cli-flag', 'setting', 'path'];
const BLOCK_TYPES = ['h', 'p', 'list', 'steps', 'figure', 'table', 'note', 'example', 'code'];
const NOTE_KINDS = ['tip', 'pitfall', 'caution'];
const CODE_LANGS = ['shell', 'bash', 'json', 'markdown', 'md', 'text', 'yaml', 'prompt'];
const FIG_TYPES = ['tree', 'state', 'arrow', 'gantt', 'network', 'er', 'logic', 'layers', 'flow', 'venn', 'bar', 'seq', 'chat', 'terminal', 'dir'];
const NET_KINDS = ['internet', 'router', 'switch', 'fw', 'server', 'pc', 'ap', 'cloud'];
const CHAT_ROLES = ['user', 'claude', 'tool', 'note'];
const TERM_KINDS = ['prompt', 'out', 'dim', 'hl', 'ok', 'ng'];

const isStr = (v) => typeof v === 'string' && v.trim() !== '';
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const isStrArr = (v, min = 0) => Array.isArray(v) && v.length >= min && v.every(isStr);
const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const isDate = (v) => typeof v === 'string' && DATE_RE.test(v) && !Number.isNaN(Date.parse(v));
const HTML_RE = /<\/?[a-zA-Z!][^>]*>/;
const EXPLICIT_RE = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
// 変わりやすい数値（料金・利用上限）らしい表現
const PRICE_RE = /(\d[\d,]*\s*円|[$＄]\s*\d|\d+\s*ドル|月額|年額|回\s*\/\s*(日|時間|週)|1日あたり\s*\d|\d+\s*時間あたり|\d+\s*(回|メッセージ)まで)/;

/** 図データの形と参照の整合性 */
export function checkFigure(f) {
  const e = [];
  if (!f || !FIG_TYPES.includes(f.type)) return [`figure.type「${f?.type}」は未対応`];
  const ids = (arr) => new Set((arr ?? []).map((x) => x.id));
  const posOk = (arr) => (arr ?? []).every((x) => isNum(x.x) && isNum(x.y));
  if (f.type === 'tree') {
    const walk = (n) => n === null || (isStr(String(n?.label ?? '')) && (n.children ?? []).every(walk));
    if (!f.root || !walk(f.root)) e.push('figure(tree): root の形が不正');
  } else if (f.type === 'state') {
    const s = ids(f.states);
    if (!posOk(f.states)) e.push('figure(state): 座標がない状態がある');
    for (const t of f.transitions ?? []) if (!s.has(t.from) || !s.has(t.to)) e.push(`figure(state): 遷移 ${t.from}→${t.to} の参照先がない`);
  } else if (f.type === 'network') {
    const s = ids(f.nodes);
    if (!posOk(f.nodes) || !(f.nodes ?? []).every((n) => NET_KINDS.includes(n.kind))) e.push('figure(network): nodes の座標か kind が不正');
    for (const l of f.links ?? []) if (!s.has(l.from) || !s.has(l.to)) e.push(`figure(network): 接続 ${l.from}-${l.to} の参照先がない`);
  } else if (f.type === 'layers') {
    if (!Array.isArray(f.levels) || !f.levels.length || !f.levels.every((l) => isStr(l.label))) e.push('figure(layers): levels の形が不正');
  } else if (f.type === 'flow') {
    const s = ids(f.steps);
    if (!Array.isArray(f.steps) || !f.steps.every((x) => isStr(x.id) && isStr(x.label) && (x.kind == null || ['process', 'decision', 'terminal'].includes(x.kind)))) e.push('figure(flow): steps の形が不正');
    for (const st of f.steps ?? []) for (const n of st.next ?? []) if (!s.has(n.to)) e.push(`figure(flow): ${st.id} の next「${n.to}」の参照先がない`);
  } else if (f.type === 'venn') {
    if (!Array.isArray(f.sets) || f.sets.length < 1 || f.sets.length > 3 || !f.sets.every((x) => isStr(x.label) && isNum(x.x) && isNum(x.y) && isNum(x.r))) e.push('figure(venn): sets の形が不正（1〜3個）');
  } else if (f.type === 'bar') {
    if (!Array.isArray(f.bars) || !f.bars.length || !f.bars.every((b) => isStr(String(b.label ?? '')) && isNum(b.value))) e.push('figure(bar): bars の形が不正');
  } else if (f.type === 'seq') {
    if (!Array.isArray(f.rows) || !f.rows.length || !f.rows.every((r) => Array.isArray(r.cells) && r.cells.length && r.cells.every((c) => typeof (c.text ?? '') === 'string'))) e.push('figure(seq): rows の形が不正');
  } else if (f.type === 'chat') {
    if (!Array.isArray(f.items) || !f.items.length || !f.items.every((it) => CHAT_ROLES.includes(it.role ?? 'claude') && isStr(it.text))) e.push('figure(chat): items の形が不正（role は user／claude／tool／note、text は必須）');
  } else if (f.type === 'terminal') {
    if (!Array.isArray(f.lines) || !f.lines.length || !f.lines.every((l) => (l.kind == null || TERM_KINDS.includes(l.kind)) && typeof l.text === 'string')) e.push('figure(terminal): lines の形が不正');
  } else if (f.type === 'dir') {
    const walk = (n) => isStr(n?.name) && (n.children ?? []).every(walk);
    if (!Array.isArray(f.tree) || !f.tree.length || !f.tree.every(walk)) e.push('figure(dir): tree の形が不正');
  } else {
    e.push(`figure(${f.type}): この図種は解説では使わない`);
  }
  return e;
}

/** オブジェクトの中のすべての文字列を (パス, 値) で列挙する */
function* strings(v, path = '') {
  if (typeof v === 'string') yield [path, v];
  else if (Array.isArray(v)) for (let i = 0; i < v.length; i++) yield* strings(v[i], `${path}[${i}]`);
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) yield* strings(x, path ? `${path}.${k}` : k);
}

/** 用語集の表記・id の索引（[[用語]] の解決用） */
function termIndex(terms) {
  const m = new Map();
  for (const t of terms) {
    m.set(t.id, t.id);
    for (const n of [t.term, ...(t.aliases ?? [])]) if (isStr(n)) m.set(n.trim().toLowerCase(), t.id);
  }
  return m;
}

/** 節と辞典の項目に共通する項目 */
function checkCommon(x, where, err) {
  if (!Array.isArray(x.surfaces) || !x.surfaces.length || !x.surfaces.every((s) => SURFACES.includes(s))) err(where, `surfaces は ${SURFACES.join('／')} から1つ以上`);
  if (!STATUSES.includes(x.status)) err(where, `status は ${STATUSES.join('／')}`);
  if (!Array.isArray(x.sources) || !x.sources.length) err(where, 'sources が空');
  else
    x.sources.forEach((s, i) => {
      if (!isStr(s?.title) || !/^https:\/\/[^\s]+$/.test(s?.url ?? '')) err(where, `sources[${i}] は {title, url(https)} が必要`);
    });
  if (!isDate(x.checkedAt)) err(where, 'checkedAt（YYYY-MM-DD）がない／不正');
  if (!VERIFY.includes(x.verification?.status)) err(where, `verification.status は ${VERIFY.join('／')}`);
}

/** ブロックの形 */
function checkBlock(b, where, err) {
  if (!b || !BLOCK_TYPES.includes(b.type)) return err(where, `block.type「${b?.type}」は未対応`);
  if ((b.type === 'h' || b.type === 'p') && !isStr(b.text)) err(where, `${b.type} に text がない`);
  if ((b.type === 'list' || b.type === 'steps') && !isStrArr(b.items, 1)) err(where, `${b.type} の items が空`);
  if (b.type === 'figure') for (const m of checkFigure(b.figure)) err(where, m);
  if (b.type === 'table' && !(Array.isArray(b.table?.rows) && b.table.rows.length && b.table.rows.every((r) => Array.isArray(r) && r.every((c) => typeof c === 'string')) && (b.table.header == null || isStrArr(b.table.header)) && (!b.table.header || b.table.rows.every((r) => r.length === b.table.header.length)))) err(where, 'table の形が不正（header と各行の列数をそろえる）');
  if (b.type === 'note' && (!NOTE_KINDS.includes(b.kind) || !isStr(b.text))) err(where, `note は kind（${NOTE_KINDS.join('／')}）と text が必要`);
  if (b.type === 'example' && !isStr(b.text)) err(where, 'example に text がない');
  if (b.type === 'code' && (!isStr(b.code) || (b.lang != null && !CODE_LANGS.includes(b.lang)))) err(where, `code は code（文字列）が必要。lang は ${CODE_LANGS.join('／')}`);
}

/**
 * @param {{meta:object, texts:{file:string, json:object|null}[], quizzes:{file:string, json:object|null}[], dicts:{file:string, json:object|null}[], glossary:object|null, tryJson:object|null, swText:string|null}} input
 */
export function validateAll({ meta, texts, quizzes, dicts, glossary, tryJson, swText }) {
  const errors = [];
  const warnings = [];
  const err = (where, msg) => errors.push({ where, msg });
  const warn = (where, msg) => warnings.push({ where, msg });

  // ---- meta ----
  if (!/^\d{4}\.\d{2}\.\d{2}-\d+$/.test(meta.dataVersion ?? '')) err('meta.json', 'dataVersion は YYYY.MM.DD-n');
  if (meta.schemaVersion !== 1) err('meta.json', 'schemaVersion は 1');
  const partIds = new Set();
  for (const p of meta.parts ?? []) {
    if (!/^[a-z]$/.test(p.id ?? '') || !isStr(p.title) || !isNum(p.order)) err('meta.json', `parts の形が不正：${JSON.stringify(p)}`);
    if (partIds.has(p.id)) err('meta.json', `parts の id「${p.id}」が重複`);
    partIds.add(p.id);
  }
  if (!partIds.size) err('meta.json', 'parts が空');
  if (swText != null) {
    const v = swText.match(/const VERSION = '([^']+)'/)?.[1];
    if (v !== meta.dataVersion) err('sw.js', `VERSION（${v}）が dataVersion（${meta.dataVersion}）と違う`);
  }

  // ---- 用語集 ----
  const terms = glossary?.terms ?? [];
  if (!glossary) err(meta.glossaryFile ?? 'glossary.json', '読み込めない');
  const termIds = new Set();
  const names = new Map();
  for (const t of terms) {
    const where = `glossary:${t.id}`;
    if (!/^g-[a-z0-9]+(-[a-z0-9]+)*$/.test(t.id ?? '')) err(where, 'id は g- ＋英小文字・数字・ハイフン');
    if (termIds.has(t.id)) err(where, 'id が重複');
    termIds.add(t.id);
    if (!isStr(t.term) || !isStr(t.definition)) err(where, 'term と definition が必要');
    if (!/^[ぁ-ゖー・\s]+$/.test(t.reading ?? '')) err(where, 'reading はひらがな');
    if (t.aliases != null && !isStrArr(t.aliases)) err(where, 'aliases は文字列の配列');
    if (t.noAutoLink != null && typeof t.noAutoLink !== 'boolean') err(where, 'noAutoLink は true／false');
    for (const n of [t.term, ...(t.aliases ?? [])]) {
      const k = String(n).trim().toLowerCase();
      if (names.has(k) && names.get(k) !== t.id) err(where, `表記「${n}」が ${names.get(k)} と重複`);
      names.set(k, t.id);
    }
    if (HTML_RE.test(t.definition ?? '')) err(where, 'HTML を使わない');
  }
  for (const t of terms) for (const r of t.related ?? []) if (!termIds.has(r)) err(`glossary:${t.id}`, `related「${r}」が用語集にない`);
  const tIndex = termIndex(terms);

  const checkStrings = (obj, where) => {
    for (const [path, s] of strings(obj)) {
      if (path.endsWith('url')) continue;
      // コードブロック・図・`インラインのコード` の中は <引数> のような書き方を許す
      if (!/(^|\.)code$/.test(path) && !path.includes('figure') && HTML_RE.test(s.replace(/`[^`]*`/g, ''))) err(where, `HTML のような記述（${path}）。<…> はバッククォートで囲む`);
      if (path.includes('figure') && EXPLICIT_RE.test(s)) err(where, `図の中では [[ ]] を使えない（${path}）`);
      EXPLICIT_RE.lastIndex = 0;
      for (const m of s.matchAll(EXPLICIT_RE)) {
        const key = (m[2] ?? m[1]).trim();
        if (!tIndex.has(key) && !tIndex.has(key.toLowerCase())) err(where, `[[${m[0].slice(2, -2)}]] が用語集にない`);
      }
      if (PRICE_RE.test(s)) warn(where, `料金・上限らしい表現（${path}）：「${s.match(PRICE_RE)[0]}」`);
    }
  };

  // ---- 解説 ----
  const sectionIds = new Set();
  const sectionVerified = new Map();
  const chapterIds = new Set();
  const pendingLinks = []; // [where, kind, id]
  let sectionCount = 0;
  let chars = 0;
  for (const { file, json: ch } of texts) {
    if (!ch) {
      err(file, '読み込めない');
      continue;
    }
    const where = `text:${ch.id}`;
    if (ch.schemaVersion !== 1) err(where, 'schemaVersion は 1');
    if (!/^[a-z]\d{2}$/.test(ch.id ?? '')) err(where, 'id は 英小文字1字＋2桁');
    if (chapterIds.has(ch.id)) err(where, '章 id が重複');
    chapterIds.add(ch.id);
    if (!partIds.has(ch.part) || ch.id?.[0] !== ch.part) err(where, `part「${ch.part}」が parts に無いか、id の接頭辞と違う`);
    if (!file.startsWith(`text/${ch.id}-`)) err(where, `ファイル名は text/${ch.id}-<名前>.json`);
    if (!Number.isInteger(ch.order) || Number(ch.id.slice(1)) !== ch.order) err(where, 'order は章番号（id の数字）と同じ整数');
    if (!isStr(ch.title) || !isStr(ch.summary)) err(where, 'title と summary が必要');
    if (!Number.isInteger(ch.minutes) || ch.minutes < 1) err(where, 'minutes は1以上の整数');
    if (!Array.isArray(ch.sections) || !ch.sections.length) {
      err(where, 'sections が空');
      continue;
    }
    ch.sections.forEach((s, si) => {
      const sw = `text:${s.id ?? `${ch.id}[${si}]`}`;
      sectionCount++;
      if (!new RegExp(`^${ch.id}-\\d{2}$`).test(s.id ?? '')) err(sw, `id は ${ch.id}-NN`);
      if (sectionIds.has(s.id)) err(sw, '節 id が重複');
      sectionIds.add(s.id);
      sectionVerified.set(s.id, s.verification?.status === 'doc-verified' || s.verification?.status === 'tried');
      if (!isStr(s.title)) err(sw, 'title がない');
      if (!isStrArr(s.points, 1)) err(sw, 'points が空');
      if (!isStr(s.digest?.text) || !isStrArr(s.digest?.keys, 1)) err(sw, 'digest（text と keys[]）が必要');
      if (!Array.isArray(s.blocks) || !s.blocks.length) err(sw, 'blocks が空');
      (s.blocks ?? []).forEach((b, bi) => checkBlock(b, `${sw} blocks[${bi}]`, err));
      checkCommon(s, sw, err);
      for (const id of s.tryIds ?? []) pendingLinks.push([sw, 'try', id]);
      for (const id of s.dictIds ?? []) pendingLinks.push([sw, 'dict', id]);
      if (!Array.isArray(s.tryIds) || !Array.isArray(s.dictIds)) err(sw, 'tryIds と dictIds は配列（空でよい）');
      checkStrings({ title: s.title, points: s.points, digest: s.digest, blocks: s.blocks }, sw);
      for (const b of s.blocks ?? []) for (const [, v] of strings(b.type === 'figure' ? {} : b)) chars += v.length;
    });
  }

  // ---- 辞典 ----
  const dictIds = new Set();
  let dictCount = 0;
  for (const { file, json } of dicts) {
    if (!json) {
      err(file, '読み込めない');
      continue;
    }
    for (const d of json.items ?? []) {
      const where = `dict:${d.id}`;
      dictCount++;
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(d.id ?? '')) err(where, 'id は英小文字・数字・ハイフン');
      if (dictIds.has(d.id)) err(where, 'id が重複（全ファイルで一意）');
      dictIds.add(d.id);
      if (!DICT_KINDS.includes(d.kind)) err(where, `kind は ${DICT_KINDS.join('／')}`);
      if (!isStr(d.name) || !isStr(d.summary) || !isStr(d.details)) err(where, 'name・summary・details が必要');
      if (!Array.isArray(d.examples) || !d.examples.every((x) => isStr(x.code) && isStr(x.desc))) err(where, 'examples は {code, desc} の配列');
      if (d.os != null && !(isStr(d.os.win) && isStr(d.os.mac))) err(where, 'os は {win, mac}');
      checkCommon(d, where, err);
      for (const id of d.sectionIds ?? []) if (!sectionIds.has(id)) err(where, `sectionIds「${id}」の節がない`);
      checkStrings({ summary: d.summary, details: d.details }, where);
    }
  }

  // ---- 課題 ----
  const tryIds = new Set();
  for (const t of tryJson?.tasks ?? []) {
    const where = `try:${t.id}`;
    if (!/^try-\d{2}-\d{2}$/.test(t.id ?? '')) err(where, 'id は try-NN-NN');
    if (tryIds.has(t.id)) err(where, 'id が重複');
    tryIds.add(t.id);
    if (!isStr(t.title) || !isStr(t.goal) || !isStr(t.expected)) err(where, 'title・goal・expected が必要');
    if (!SURFACES.includes(t.surface)) err(where, 'surface が不正');
    if (!Number.isInteger(t.minutes) || t.minutes < 1) err(where, 'minutes は1以上の整数');
    if (!isStrArr(t.steps, 1) || !isStrArr(t.cautions)) err(where, 'steps（1件以上）と cautions は文字列の配列');
    for (const id of t.sectionIds ?? []) if (!sectionIds.has(id)) err(where, `sectionIds「${id}」の節がない`);
    checkStrings(t, where);
  }

  for (const [where, kind, id] of pendingLinks) {
    if (kind === 'try' && !tryIds.has(id)) err(where, `tryIds「${id}」の課題がない`);
    if (kind === 'dict' && !dictIds.has(id)) err(where, `dictIds「${id}」の項目がない`);
  }

  // ---- クイズ ----
  const quizIds = new Set();
  const answerPos = [0, 0, 0, 0];
  let quizCount = 0;
  let quizOut = 0;
  for (const { file, json } of quizzes) {
    if (!json) {
      err(file, '読み込めない');
      continue;
    }
    if (!chapterIds.has(json.chapterId) || !file.startsWith(`quiz/${json.chapterId}-`)) err(file, `chapterId「${json.chapterId}」の章がないか、ファイル名が quiz/<章id>-… でない`);
    for (const q of json.questions ?? []) {
      const where = `quiz:${q.id}`;
      quizCount++;
      if (!sectionIds.has(q.sectionId)) err(where, `sectionId「${q.sectionId}」の節がない`);
      else if (!sectionVerified.get(q.sectionId)) quizOut++;
      if (!new RegExp(`^${q.sectionId}-q\\d+$`).test(q.id ?? '')) err(where, 'id は <節id>-qN');
      if (quizIds.has(q.id)) err(where, 'id が重複');
      quizIds.add(q.id);
      if (!isStr(q.question) || !isStr(q.explanation)) err(where, 'question と explanation が必要');
      if (!isStrArr(q.choices) || q.choices.length !== 4 || new Set(q.choices).size !== 4) err(where, 'choices は重複のない4つの文字列');
      if (![0, 1, 2, 3].includes(q.answer)) err(where, 'answer は 0〜3');
      else answerPos[q.answer]++;
      if (!Array.isArray(q.sources) || !q.sources.length || !q.sources.every((s) => isStr(s?.title) && /^https:\/\//.test(s?.url ?? ''))) err(where, 'sources が空か不正');
      checkStrings({ question: q.question, choices: q.choices, explanation: q.explanation }, where);
    }
  }
  if (quizCount >= 8 && Math.max(...answerPos) > quizCount * 0.4) warn('quiz', `正解の位置が偏っている：${answerPos.join('／')}`);

  // ---- 件数 ----
  const counts = { sections: sectionCount, quiz: quizCount, dict: dictCount, glossary: terms.length, try: tryIds.size };
  for (const [k, v] of Object.entries(counts)) if ((meta.counts?.[k] ?? -1) !== v) err('meta.json', `counts.${k}（${meta.counts?.[k]}）が実数（${v}）と違う`);

  // ---- 未確認 ----
  const unverified = [];
  for (const { json: ch } of texts) for (const s of ch?.sections ?? []) if (s.verification?.status === 'unverified') unverified.push(s.id);
  for (const { json } of dicts) for (const d of json?.items ?? []) if (d.verification?.status === 'unverified') unverified.push(d.id);
  if (unverified.length) warn('verification', `未確認 ${unverified.length}件：${unverified.join(' ')}`);
  if (quizOut) warn('quiz', `節が未確認のため出題しない問題 ${quizOut}問`);

  return { errors, warnings, counts, chars, unverified, answerPos, quizOut };
}
