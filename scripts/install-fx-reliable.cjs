#!/usr/bin/env node
'use strict';
// Chỉ sửa những câu lệnh gọi tỷ giá; không thay thế route Sale, Marketing hoặc Kho.
const fs = require('node:fs');
const path = require('node:path');

const project = process.cwd();
const scriptRoot = path.resolve(__dirname, '..');
const dryRun = process.argv.includes('--dry-run');
const routePath = path.join(project, 'server', 'routes', 'sales.js');
const svcPath = path.join(project, 'src', 'services', 'salesService.js');
const newModulePath = path.join(project, 'server', 'services', 'exchangeRateReliable.js');
const sourceModule = path.join(scriptRoot, 'server', 'services', 'exchangeRateReliable.js');
const routeImport = "const { getExchangeRateReliable } = require('../services/exchangeRateReliable');";
const backupDir = path.join(project, '.backup-fx-v19-12-1');

function ensure(file, message) { if (!fs.existsSync(file)) throw new Error(`${message}: ${file}`); }
function backup(file) {
  fs.mkdirSync(backupDir, { recursive: true });
  const relative = path.relative(project, file);
  const backupFile = path.join(backupDir, relative);
  if (!fs.existsSync(backupFile)) {
    fs.mkdirSync(path.dirname(backupFile), { recursive: true });
    fs.copyFileSync(file, backupFile);
  }
}

function nextRoute(source) {
  if (source.includes('getExchangeRateReliable(getExchangeRate)') && source.includes(routeImport)) return source;
  if (!source.includes("'/api/sales/exchange-rate'")) throw new Error('Route sales.js không có /api/sales/exchange-rate. Không sửa tự động.');
  if (!source.includes('await getExchangeRate()')) throw new Error('Không tìm thấy lời gọi getExchangeRate() dự kiến. Không sửa tự động.');
  if (!source.includes("require('../services/exchangeRate')")) throw new Error('Không nhận diện được nguồn tỷ giá gốc.');
  return source
    .replace(/^(const .*require\(['"]\.\.\/services\/exchangeRate['"]\);)/m, `$1\n${routeImport}`)
    .replace('await getExchangeRate()', 'await getExchangeRateReliable(getExchangeRate)');
}
function nextService(source) {
  if (source.includes('source: typeof data.source')) return source;
  const marker = 'return { rate: data.rate, updatedAt: data.updatedAt, stale: data.stale === true };';
  if (!source.includes(marker)) throw new Error('salesService.js đã thay đổi định dạng. Giữ nguyên để tránh sửa sai, cần xử lý riêng.');
  return source.replace(marker, "return { rate: data.rate, updatedAt: data.updatedAt, stale: data.stale === true, source: typeof data.source === 'string' ? data.source : 'ExchangeRate API' };");
}
try {
  ensure(routePath, 'Không tìm thấy backend');
  ensure(svcPath, 'Không tìm thấy frontend service');
  ensure(sourceModule, 'Không tìm thấy file mới trong ZIP');
  const routeBefore = fs.readFileSync(routePath, 'utf8');
  const svcBefore = fs.readFileSync(svcPath, 'utf8');
  const routeAfter = nextRoute(routeBefore);
  const svcAfter = nextService(svcBefore);
  const planned = [
    ['Backend route', routeBefore !== routeAfter],
    ['Frontend FX service', svcBefore !== svcAfter],
    ['Thêm module dự phòng', !fs.existsSync(newModulePath)],
  ];
  for (const [name, changed] of planned) process.stdout.write(`${changed ? '[CAP NHAT]' : '[DA CO]'} ${name}\n`);
  if (dryRun) { process.stdout.write('Dry-run: chưa thay đổi file nào.\n'); process.exit(0); }
  if (routeBefore !== routeAfter) { backup(routePath); fs.writeFileSync(routePath, routeAfter); }
  if (svcBefore !== svcAfter) { backup(svcPath); fs.writeFileSync(svcPath, svcAfter); }
  if (fs.existsSync(newModulePath)) {
    // Avoid overwriting a custom implementation on subsequent runs.
    if (fs.readFileSync(newModulePath, 'utf8') !== fs.readFileSync(sourceModule, 'utf8')) {
      process.stdout.write('Module dự phòng đã có thay đổi riêng; giữ nguyên.\n');
    }
  } else {
    fs.mkdirSync(path.dirname(newModulePath), { recursive: true });
    fs.copyFileSync(sourceModule, newModulePath);
  }
  process.stdout.write(`Xong. Backup: ${backupDir}\n`);
} catch (error) {
  process.stderr.write(`[DUNG AN TOAN] ${error.message}\n`);
  process.exitCode = 1;
}
