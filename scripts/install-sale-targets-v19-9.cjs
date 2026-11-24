#!/usr/bin/env node
'use strict';
// Tương thích code backend V16 - V19.8; cài một route, không đổi authentication.
const fs=require('node:fs');const path=require('node:path');
const root=process.cwd();const dry=process.argv.includes('--dry-run');
const rel='server/routes/sales.js';
function fail(s){console.error('V19.9:',s);process.exit(1)}
for(const f of [rel,'server/routes/saleTargets.js','server/services/saleTargets.js','server/routes/salesTargets.js','server/services/salesTargets.js']) {
 if(!fs.existsSync(path.join(root,f))) fail(`Thiếu ${f}. Copy đầy đủ file ZIP vào thư mục gốc birthday-search.`);
}
const old=fs.readFileSync(path.join(root,rel),'utf8');
const importLine="const { createSaleTargetsRouter } = require('./saleTargets');";
const routeLine='router.use(createSaleTargetsRouter(salesReadAccess));';
if(old.includes(routeLine)) {console.log('V19.9: Route mục tiêu Sale đã cài. Không sửa.');process.exit(0)}
if(!old.includes('router.use(createSalesTargetsRouter(salesReadAccess));') || !old.includes('function salesReadAccess(')) fail('Không tìm được vị trí chèn route hoặc middleware đọc. Giữ nguyên backend để tránh lỗi.');
let next=old;
if(!next.includes(importLine)){
  const strict="'use strict';";
  next=next.includes(strict)?next.replace(strict,strict+'\n'+importLine):importLine+'\n'+next;
}
next=next.replace('router.use(createSalesTargetsRouter(salesReadAccess));','router.use(createSalesTargetsRouter(salesReadAccess));\n'+routeLine);
console.log('V19.9:',dry?'XEM TRƯỚC':'CÀI ROUTE', 'GET/PUT /api/sales/sale-targets (PUT admin only)');
if(dry)process.exit(0);
const backup=path.join(root,'.pixelalbum-backups','v19-9-sale-targets-'+new Date().toISOString().replace(/[:.]/g,'-'),rel);
try {fs.mkdirSync(path.dirname(backup),{recursive:true});fs.writeFileSync(backup,old);fs.writeFileSync(path.join(root,rel),next)}
catch(e){try{fs.writeFileSync(path.join(root,rel),old)}catch{}fail('Không ghi được: '+e.message)}
console.log('OK. Đã sao lưu',path.relative(root,backup));
console.log('Khởi động lại backend. Bảng sales_sale_targets được khởi tạo khi truy cập mục tiêu Sale lần đầu.');
