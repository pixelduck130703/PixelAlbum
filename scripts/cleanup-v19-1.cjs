#!/usr/bin/env node
/**
 * PixelAlbum V19.1 — safe removal of V19 compatibility wrappers.
 * Uses only Node built-ins. Does NOT change business logic, server or database.
 * `--dry-run` previews changes. `--rollback` restores latest cleanup backup.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const SRC = path.join(root, 'src');
const BACKUP = path.join(root, '.pixelalbum-backups');
const slash = (p) => p.replace(/\\/g, '/');
const maps = [
  ['pages/SalesDashboard.jsx', 'features/sales/SalesDashboard.jsx'],
  ['pages/SalesDashboard.css', 'features/sales/SalesDashboard.css'],
  ['pages/WarehouseDashboard.jsx', 'features/warehouse/WarehouseDashboard.jsx'],
  ['pages/salesDashboardModel.js', 'features/sales/models/salesDashboardModel.js'],
  ['pages/salesFilterStorage.js', 'features/sales/utils/salesFilterStorage.js'],
  ['pages/salesRankingModel.js', 'features/sales/models/salesRankingModel.js'],
  ['pages/salesTemporaryRevenue.js', 'features/sales/utils/salesTemporaryRevenue.js'],
  ['components/EmployeeSearch.jsx', 'features/sales/components/EmployeeSearch.jsx'],
  ['components/EmployeeTargetManager.jsx', 'features/sales/components/EmployeeTargetManager.jsx'],
  ['components/SalesRanking.jsx', 'features/sales/components/SalesRanking.jsx'],
].map(([old, target]) => ({ old, target, oldAbs: path.join(SRC, old), newAbs: path.join(SRC, target) }));
const tests = [
  ['salesDashboardModel.test.js', 'features/sales/tests/salesDashboardModel.test.js'],
  ['salesFilterStorage.test.js', 'features/sales/tests/salesFilterStorage.test.js'],
  ['salesRankingModel.test.js', 'features/sales/tests/salesRankingModel.test.js'],
].map(([name, target]) => ({ old: `pages/${name}`, target, oldAbs: path.join(SRC, 'pages', name), newAbs: path.join(SRC, target) }));
function die(message) { console.error(`❌ V19.1: ${message}`); process.exit(1); }
function exists(f) { return fs.existsSync(f) && fs.statSync(f).isFile(); }
function listCodeFiles(directory, out = []) {
  if (!fs.existsSync(directory)) return out;
  for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
    if (item.name.startsWith('.') || ['node_modules', 'dist', 'build', 'coverage', '__snapshots__', 'public', 'uploads', 'assets', 'scripts', '.pixelalbum-backups'].includes(item.name)) continue;
    const full = path.join(directory, item.name);
    if (item.isDirectory()) listCodeFiles(full, out);
    else if (/\.(?:jsx?|tsx?|css|scss|sass|less|mjs|cjs)$/.test(item.name)) out.push(full);
  }
  return out;
}
function normalizedWrapper(content) {
  return content.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/[^\n]*(?:\r?\n|$)/gm, '').trim();
}
function isV19Wrapper(m) {
  if (!exists(m.oldAbs) || !exists(m.newAbs)) return false;
  const source = normalizedWrapper(fs.readFileSync(m.oldAbs, 'utf8'));
  const rel = slash(path.relative(path.dirname(m.oldAbs), m.newAbs)).replace(/\.[^.\/]+$/, '');
  const spec = rel.startsWith('.') ? rel : './' + rel;
  if (m.old.endsWith('.css')) {
    return source === `@import url('${spec}.css');` || source === `@import url("${spec}.css");` || source === `@import '${spec}.css';` || source === `@import "${spec}.css";`;
  }
  const quoted = `(?:['"]${spec.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"])`;
  return new RegExp(`^export\\s+(?:\\{\\s*default\\s*\\}|\\*)\\s+from\\s+${quoted};?$`).test(source);
}
function normalizeTest(s) {
  return s.replace(/(['"])\.(?:\/|\.\/)(?:models\/|utils\/)?(salesDashboardModel|salesFilterStorage|salesRankingModel)\.js\1/g, (m, q, name) => `'<${name}>'`).replace(/\r\n/g, '\n').trim();
}
function isDuplicateTest(t) {
  return exists(t.oldAbs) && exists(t.newAbs) && normalizeTest(fs.readFileSync(t.oldAbs,'utf8')) === normalizeTest(fs.readFileSync(t.newAbs,'utf8'));
}
function resolveSpecifier(spec, file) {
  const parts = /^(.*?)([?#].*)?$/.exec(spec);
  const raw = parts[1], suffix = parts[2] || '';
  if (raw.startsWith('.')) return { abs: path.resolve(path.dirname(file), raw), mode: 'relative', suffix };
  if (raw.startsWith('@/')) return { abs: path.join(SRC, raw.slice(2)), mode: '@/', suffix };
  if (raw.startsWith('~/')) return { abs: path.join(SRC, raw.slice(2)), mode: '~/', suffix };
  if (raw.startsWith('src/')) return { abs: path.join(SRC, raw.slice(4)), mode: 'src/', suffix };
  if (raw.startsWith('/src/')) return { abs: path.join(SRC, raw.slice(5)), mode: '/src/', suffix };
  return null;
}
function replaceSpecifier(spec, file, byOld) {
  const info = resolveSpecifier(spec, file);
  if (!info) return spec;
  const ext = path.extname(info.abs);
  const absWithExt = ext ? info.abs : info.abs;
  const srcRel = slash(path.relative(SRC, absWithExt));
  const record = byOld.get(srcRel) || (!ext && [...byOld.values()].find((v) => /\.(?:jsx?|tsx?)$/.test(v.old) && v.old.replace(/\.[^.]+$/, '') === srcRel));
  if (!record) return spec;
  const resolvedTarget = ext ? record.newAbs : record.newAbs.replace(/\.[^.]+$/, '');
  if (info.mode === 'relative') {
    let next = slash(path.relative(path.dirname(file), resolvedTarget));
    if (!next.startsWith('.')) next = './' + next;
    return next + info.suffix;
  }
  const nextRel = slash(path.relative(SRC, resolvedTarget));
  return info.mode + nextRel + info.suffix;
}
// Supported import forms: ES import/export from, side-effect import, dynamic import,
// require/require.resolve, jest/vi mock and CSS @import.
const moduleSpecifier = /((?:\bfrom\s*|\bimport\s*\(\s*|\brequire(?:\.resolve)?\s*\(\s*|\bimport\s+|\b(?:jest|vi)\.(?:mock|doMock)\s*\(\s*|@import\s+(?:url\(\s*)?))(['"])([^'"\r\n]+)\2/g;
function rewriteImports(text, file, byOld) {
  return text.replace(moduleSpecifier, (match, prefix, q, spec) => `${prefix}${q}${replaceSpecifier(spec, file, byOld)}${q}`);
}
function hasOldReference(code, m, currentFile) {
  // Scan quoted literals after updating all recognized import forms.
  // Resolve paths instead of comparing basenames: `./SalesDashboard.css`
  // inside features/sales is NOT the old `pages/SalesDashboard.css`.
  const quoted = /'([^'\r\n]+)'|"([^"\r\n]+)"|`([^`\r\n]+)`/g;
  for (const match of code.matchAll(quoted)) {
    const spec = match[1] || match[2] || match[3];
    const info = resolveSpecifier(spec, currentFile);
    if (!info) {
      // Unknown custom alias: do not remove a wrapper potentially referenced
      // through paths such as '@pages/SalesDashboard'.
      if (spec.includes(m.old.replace(/\.[^.]+$/, '')) && !spec.includes('features/')) return true;
      continue;
    }
    const resolved = path.normalize(info.abs);
    const expected = path.normalize(m.oldAbs);
    if (resolved === expected || resolved === expected.replace(/\.[^.\\/]+$/, '')) return true;
    // Glob imports can dynamically import every page in a folder.
    // They are uncommon, so keep the wrapper rather than risk breakage.
    if (spec.includes('*') && resolved.replace(/\*/g, '') &&
        path.dirname(resolved) === path.dirname(expected)) return true;
  }
  return false;
}

function restore(backupDir) {
  const folder = backupDir || (fs.existsSync(BACKUP) ? fs.readdirSync(BACKUP).filter(n => n.startsWith('v19-1-')).sort().at(-1) : null);
  if (!folder) die('Không tìm thấy bản sao lưu V19.1.');
  const dir = path.isAbsolute(folder) ? folder : path.join(BACKUP, folder);
  const manifestPath = path.join(dir, 'manifest.json');
  if (!exists(manifestPath)) die(`Không thấy manifest: ${manifestPath}`);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.root !== root) die(`Thư mục dự án không khớp. Bản sao lưu thuộc: ${manifest.root}`);
  for (const rel of manifest.files) {
    const source = path.join(dir, 'files', rel);
    const destination = path.join(root, rel);
    if (!exists(source)) die(`Bản sao lưu thiếu: ${rel}`);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(source, destination);
  }
  console.log(`✅ Khôi phục ${manifest.files.length} file từ ${dir}`);
  console.log('Hãy chạy npm run build để kiểm tra lại.');
}
if (process.argv.includes('--rollback')) {
  const idx = process.argv.indexOf('--rollback');
  restore(process.argv[idx + 1]);
  process.exit(0);
}
if (!exists(path.join(SRC, 'features/sales/SalesDashboard.jsx')) || !exists(path.join(SRC, 'features/warehouse/WarehouseDashboard.jsx'))) {
  die('Chưa phát hiện đầy đủ V19. Hãy cài V19 và chắc chắn 2 tab chạy trước khi dọn.');
}
const dryRun = process.argv.includes('--dry-run');
const candidates = maps.filter(isV19Wrapper);
const skipped = maps.filter(m => exists(m.oldAbs) && !candidates.includes(m));
const duplicateTests = tests.filter(isDuplicateTest);
const keptTests = tests.filter(t => exists(t.oldAbs) && !duplicateTests.includes(t));
const byOld = new Map(candidates.map(m => [m.old, m]));
const files = listCodeFiles(root);
const newContents = new Map();
for (const file of files) {
  if (candidates.some(m => m.oldAbs === file) || duplicateTests.some(t => t.oldAbs === file)) continue;
  const original = fs.readFileSync(file, 'utf8');
  const rewritten = rewriteImports(original, file, byOld);
  newContents.set(file, rewritten);
}
const deletable = [];
const retained = [];
for (const item of candidates) {
  let references = [];
  for (const [file, content] of newContents) {
    if (hasOldReference(content, item, file)) references.push(slash(path.relative(root,file)));
  }
  if (references.length) retained.push({ item, references });
  else deletable.push(item);
}
// Don't rewrite to new module when the old file must remain because of an
// unrecognized reference? Rewritten imports are equivalent for V19 wrappers.
// However existing raw references still work because we retain the wrapper.
const changed = [...newContents].filter(([file, content]) => content !== fs.readFileSync(file,'utf8'));
const deleted = [...deletable.map(x => x.oldAbs), ...duplicateTests.map(x => x.oldAbs)];
const pretty = (f) => slash(path.relative(root, f));
console.log('\nPixelAlbum V19.1 — DỌN THƯ MỤC');
console.log(`  Sửa import: ${changed.length} file`);
console.log(`  Xóa wrapper an toàn: ${deletable.length} file`);
console.log(`  Xóa test trùng bản mới: ${duplicateTests.length} file`);
if (changed.length) console.log('  Những file thay import:\n   - ' + changed.map(x => pretty(x[0])).join('\n   - '));
if (deleted.length) console.log('  File sẽ dọn:\n   - ' + deleted.map(pretty).join('\n   - '));
for (const x of skipped) console.warn(`  ⚠ Giữ nguyên file đã sửa/không đúng mẫu V19: ${x.old}`);
for (const x of keptTests) console.warn(`  ⚠ Giữ test riêng vì nội dung khác bản mới: ${x.old}`);
for (const x of retained) console.warn(`  ⚠ Giữ ${x.item.old} vì còn tham chiếu: ${x.references.slice(0, 5).join(', ')}`);
if (dryRun) { console.log('\nChỉ xem trước (--dry-run), chưa sửa file nào.'); process.exit(0); }
if (!changed.length && !deleted.length) { console.log('✅ Không có gì cần dọn thêm.'); process.exit(0); }
const timestamp = new Date().toISOString().replace(/[:.]/g,'-');
const backupDir = path.join(BACKUP, `v19-1-${timestamp}`);
const originalFiles = [...new Set([...changed.map(x=>x[0]), ...deleted])];
try {
  for (const file of originalFiles) {
    const rel = pretty(file);
    const output = path.join(backupDir, 'files', rel);
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.copyFileSync(file, output);
  }
  fs.writeFileSync(path.join(backupDir, 'manifest.json'), JSON.stringify({ version: 'V19.1', root, files: originalFiles.map(pretty), timestamp }, null, 2));
  for (const [file, content] of changed) fs.writeFileSync(file, content, 'utf8');
  for (const file of deleted) fs.unlinkSync(file);
  console.log(`\n✅ Đã dọn ${deleted.length} file và cập nhật ${changed.length} file import.`);
  console.log(`📦 Sao lưu: ${slash(path.relative(root, backupDir))}`);
  console.log('🔎 Bước tiếp theo: npm run build');
  console.log('↩  Nếu cần quay lại: node scripts/cleanup-v19-1.cjs --rollback');
} catch (error) {
  console.error('Gặp lỗi, đang khôi phục các file đã sao lưu:', error.message);
  for (const file of originalFiles) {
    const src = path.join(backupDir,'files',pretty(file));
    if (exists(src)) {fs.mkdirSync(path.dirname(file),{recursive:true});fs.copyFileSync(src,file);}
  }
  die('Đã khôi phục file, không tiếp tục để tránh hỏng dự án.');
}
