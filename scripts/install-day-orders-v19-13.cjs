#!/usr/bin/env node
'use strict';
// Dry-run, sao luu truoc khi can thiep, chay lai khong chen trung.
const fs=require('node:fs');
const path=require('node:path');
const root=process.cwd();
const dry=process.argv.includes('--dry-run');
const rel='server/routes/sales.js';
const target=path.join(root,rel);
function die(message) {console.error('V19.13:',message);process.exit(1);}
for(const f of [rel,'server/routes/dayOrderDetails.js','server/services/dayOrderDetails.js']) {
  if(!fs.existsSync(path.join(root,f)))die(`Thiếu ${f}. Hãy copy đầy đủ ZIP V19.13 vào project.`);
}
const original=fs.readFileSync(target,'utf8');
if(original.includes('registerDayOrderDetailsRoute(router,')) {
  console.log('V19.13: API chi tiết ngày đã cài; không sửa lần nữa.');process.exit(0);
}
const anchor='router.use(createSalesTargetsRouter(salesReadAccess));';
if (!original.includes(anchor) || !original.includes('const verifyAdminToken') || !original.includes('module.exports'))die('Không khớp cấu trúc server/routes/sales.js; không sửa để tránh lỗi.');
const imp="const { registerDayOrderDetailsRoute } = require('./dayOrderDetails');\n";
const next=(original.includes("require('./dayOrderDetails')") ? original : imp+original)
  .replace(anchor,`registerDayOrderDetailsRoute(router, verifyAdminToken);\n${anchor}`);
console.log('V19.13:',dry?'Xem trước (chưa ghi file)':'Cài API chi tiết ngày');
console.log(' + GET /api/sales/day-orders: chỉ tài khoản quản trị có JWT; không mở công khai');
console.log(' + Giữ nguyên mọi route Marketing, Sale, Kho hàng và Tỉ giá');
if(dry)process.exit(0);
const backup=path.join(root,'.pixelalbum-backups',`v19-13-${new Date().toISOString().replace(/[:.]/g,'-')}`,rel);
try {
 fs.mkdirSync(path.dirname(backup),{recursive:true});fs.writeFileSync(backup,original);
 fs.writeFileSync(target,next);
} catch(e) {
 try{fs.writeFileSync(target,original);}catch{}
 die('Không cài được: '+e.message);
}
console.log('Đã cài. Backup:',path.relative(root,backup));
console.log('Cần deploy lại frontend và backend.');
