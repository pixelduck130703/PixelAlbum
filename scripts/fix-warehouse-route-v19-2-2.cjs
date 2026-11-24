#!/usr/bin/env node
/**
 * PixelAlbum V19.2.2: fix React Router route after V19.1 cleanup.
 * Node built-ins only. --dry-run previews; apply backs up App in .pixelalbum-backups.
 * Does not touch backend, databases, .env, Marketing business logic or API credentials.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const dryRun = process.argv.includes('--dry-run');
const rel = ['src/App.jsx', 'src/App.tsx'].find(file => fs.existsSync(path.join(root,file)));
function fail(message) { console.error('❌ V19.2.2:', message); process.exit(1); }
if (!rel) fail('Không tìm thấy src/App.jsx hoặc src/App.tsx. Chưa sửa file nào.');
if (!fs.existsSync(path.join(root, 'src/features/warehouse/WarehouseDashboard.jsx')) &&
    !fs.existsSync(path.join(root, 'src/features/warehouse/WarehouseDashboard.tsx'))) {
  fail('Không tìm thấy src/features/warehouse/WarehouseDashboard.jsx (hoặc .tsx). Chưa sửa file nào.');
}
const filename = path.join(root, rel);
const original = fs.readFileSync(filename,'utf8');
let next = original;
const warehouseImport = /^([ \t]*import\s+WarehouseDashboard\s+from\s+)(['"])([^'"\r\n]+)\2\s*;?/m;
const expectedImport = "import WarehouseDashboard from './features/warehouse/WarehouseDashboard';";
if (warehouseImport.test(next)) {
  next = next.replace(warehouseImport, (full, pre, quote, spec) =>
    spec === './features/warehouse/WarehouseDashboard' ? full : `${pre}${quote}./features/warehouse/WarehouseDashboard${quote};`);
} else {
  const marketingImport = /(^[ \t]*import\s+SalesDashboard\s+from\s+(['"])[^'"\r\n]+\2\s*;?)/m;
  const matched = marketingImport.exec(next);
  if (!matched) fail('Chưa nhận diện import SalesDashboard trong App. Không sửa; cần xem file App.jsx thực tế.');
  next = next.replace(marketingImport, `$1\n${expectedImport}`);
}
// Find self-closing Route element without confusing JSX nested in element={...}.
function findSelfClosingRouteEnd(source, start) {
  let braces=0, quote='';
  for(let i=start;i<source.length-1;i++) {
    const c=source[i];
    if(quote) { if(c==='\\')i++; else if(c===quote)quote=''; continue; }
    if(c==='"'||c==="'"){quote=c;continue;}
    if(c==='{')braces++;
    if(c==='}')braces--;
    if(braces===0 && c==='/' && source[i+1]==='>')return i+2;
    if(braces===0 && c==='>')return -1;
  }
  return -1;
}
const warehousePath = /\bpath\s*=\s*(['"])\/warehouse-dashboard\1/;
if (!warehousePath.test(next)) {
  const marketingPath = /\bpath\s*=\s*(['"])\/sales-dashboard\1/;
  const match = marketingPath.exec(next);
  if (!match) fail('Không tìm thấy path="/sales-dashboard" trong App. Không sửa; cần xem cấu trúc Router.');
  const begin = next.lastIndexOf('<Route', match.index);
  if(begin<0) fail('Không tìm thấy thẻ <Route> cho Marketing. Chưa sửa.');
  const end = findSelfClosingRouteEnd(next, begin);
  if(end<0) fail('Route Marketing có cấu trúc lồng hoặc không tự đóng. Chưa sửa để tránh làm hỏng trang.');
  const marketingTag=next.slice(begin,end);
  if(!/\bSalesDashboard\b/.test(marketingTag)) fail('Route Marketing không chứa component SalesDashboard. Chưa sửa.');
  let warehouseTag=marketingTag.replace(marketingPath, 'path="/warehouse-dashboard"');
  warehouseTag=warehouseTag.replace(/\bSalesDashboard\b/g, 'WarehouseDashboard');
  // Duplicate route directly adjacent to the original; retain access guards.
  const indent=(/\n([\t ]*)[^\n]*$/.exec(next.slice(0,begin))||[])[1]||'';
  next = next.slice(0,end)+'\n'+indent+warehouseTag+next.slice(end);
}
if(next===original){console.log('✅ V19.2.2: route Kho hàng và import đã đúng. Không cần sửa.');process.exit(0);}
console.log(`V19.2.2: ${dryRun?'XEM TRƯỚC':'SỬA ROUTE'} — ${rel}`);
console.log('  - Import Kho hàng: src/features/warehouse/WarehouseDashboard');
console.log('  - Route /warehouse-dashboard: giữ cùng cấu trúc quyền truy cập Marketing');
console.log('  - Không thay đổi /sales-dashboard hoặc server.');
if(dryRun){console.log('Chưa thay đổi file. Chạy không có --dry-run để áp dụng.');process.exit(0);}
const backupDir = path.join(root,'.pixelalbum-backups', 'v19-2-2-'+new Date().toISOString().replace(/[:.]/g,'-'));
fs.mkdirSync(path.dirname(path.join(backupDir,rel)),{recursive:true});
const backupFile=path.join(backupDir,rel);
fs.copyFileSync(filename,backupFile);
try { fs.writeFileSync(filename,next,'utf8'); }
catch(error) { fs.copyFileSync(backupFile,filename);fail('Không thể ghi App: '+error.message); }
console.log('✅ Đã sửa route Kho hàng.');
console.log('📦 Bản sao lưu: '+path.relative(root,backupFile).replace(/\\/g,'/'));
console.log('Tiếp theo: npm run build; sau đó khởi động backend cổng 5000.');
