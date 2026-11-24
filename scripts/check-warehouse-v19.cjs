#!/usr/bin/env node
// PixelAlbum V19.2.1 - local, READ ONLY inspection of V19 warehouse wiring.
// No network requests, no .env reads, no file modification.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const file = (relative) => path.join(root, relative);
const exists = (relative) => fs.existsSync(file(relative)) && fs.statSync(file(relative)).isFile();
const contents = (relative) => exists(relative) ? fs.readFileSync(file(relative), 'utf8') : '';
let issue = false;
function check(ok, label, note) {
  console.log(`${ok ? '[OK] ' : '[CHUA OK] '} ${label}${note ? '\n         ' + note : ''}`);
  if (!ok) issue = true;
}
console.log('\nPIXELALBUM - KIEM TRA TAB KHO HANG V19 (CHI DOC)\n');
check(exists('package.json'), 'Thu muc goc du an (package.json)', 'Chay tai thu muc co package.json va src/.');
const app = contents('src/App.jsx') || contents('src/App.tsx');
check(!!app, 'Tim thay src/App.jsx hoac src/App.tsx');
check(app.includes('/warehouse-dashboard'), 'Da khai bao route /warehouse-dashboard', 'Neu thieu, can them route trong App tu V19.');
check(exists('src/features/warehouse/WarehouseDashboard.jsx'), 'Co giao dien WarehouseDashboard');
check(exists('src/features/warehouse/warehouseService.js'), 'Co file goi API warehouseService');
check(exists('src/features/warehouse/models/warehouseModel.js'), 'Co model bao cao kho');
check(exists('src/features/warehouse/models/warehouseInsights.js'), 'Co model bieu do V19.2');
check(exists('src/features/dashboard-shared/DashboardHeader.jsx'), 'Co header 2 tab');
check(exists('server/routes/warehouseReport.js'), 'Da copy route backend Kho hang');
check(exists('server/services/warehouseReport.js'), 'Da copy module backend xu ly Kho hang');
const route = contents('server/routes/sales.js');
const service = contents('server/services/pancakeSales.js');
check(route.includes('registerWarehouseReportRoute('), 'Backend da dang ky warehouse route trong server/routes/sales.js', 'Neu thieu: node scripts/install-backend-v19.cjs');
check(service.includes('async function getWarehouseReport('), 'Backend da chen ham getWarehouseReport', 'Neu thieu: node scripts/install-backend-v19.cjs');
console.log('\nLUU Y: Kiem tra tren KHONG xac nhan backend da DUOC DEPLOY len server.');
console.log('Neu code local OK nhung trang kho khong co doanh thu:');
console.log('  1) Deploy lai BACKEND V19 truoc, sau do frontend.');
console.log('  2) F12 > Network, chon Fetch/XHR, tai lai /warehouse-dashboard.');
console.log('  3) Tim request /api/sales/warehouse-report va xem HTTP status.');
console.log('     404: route backend chua deploy | 401/403: quyen truy cap');
console.log('     500/502: backend/Pancake bao loi | 200: xem data.rows.');
if (issue) {
  console.log('\nCo muc CHUA OK. Khong nen xoa file hay thay backend bang file mau.');
  process.exitCode = 1;
} else console.log('\nCode local co du module can thiet. Can kiem tra deployment va API data.');
