#!/usr/bin/env node
/*
 * PixelAlbum V19.8 - bổ sung tùy chọn đối chiếu ngày và trạng thái chốt Sale.
 * Chỉ sửa GET /api/sales/sale-report và hàm getSaleReport (không động Marketing/Kho).
 * Chạy --dry-run trước; sao lưu 2 file trước khi ghi. Không cần .env mới.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const dry = process.argv.includes('--dry-run');
const root = process.cwd();
const files = [
  'server/services/pancakeSales.js',
  'server/routes/saleReport.js',
];
function stop(msg) { console.error('V19.8:', msg); process.exit(1); }
for (const f of files) if (!fs.existsSync(path.join(root, f))) stop(`Không tìm thấy ${f}. Chạy trong thư mục birthday-search sau khi đã cài V19.7.`);
const original = files.map(f => fs.readFileSync(path.join(root, f), 'utf8'));
let [svc, route] = original;
const oldSignature = "async function getSaleReport(start, end, role = 'assign', warehouseId = '', now = new Date()) {";
const newSignature = "async function getSaleReport(start, end, role = 'assign', warehouseId = '', successStatus = '1', successRecord = 'inserted_at', now = new Date()) {";
const oldOptions = "['user_type',role], ['success_status','1'], ['success_record','inserted_at']";
const newOptions = "['user_type',role], ['success_status',successStatus], ['success_record',successRecord]";
const checks = `  if (!['1','send_to_partner'].includes(successStatus)) throw new PancakeError('Trạng thái chốt không hợp lệ.', 400);\n  if (!['inserted_at','updated_at'].includes(successRecord)) throw new PancakeError('Ngày ghi nhận không hợp lệ.', 400);\n`;
if (svc.includes(oldSignature) && svc.includes(oldOptions)) {
  svc = svc.replace(oldSignature, newSignature);
  const checkAfter = "  if (!['assign','update','create'].includes(role)) throw new PancakeError('Cách tính Sale không hợp lệ.', 400);\n";
  if (!svc.includes(checkAfter)) stop('Không tìm thấy vị trí kiểm tra quyền Sale; không tự sửa.');
  svc = svc.replace(checkAfter, checkAfter + checks);
  svc = svc.replace(oldOptions, newOptions);
} else if (!(svc.includes(newSignature) && svc.includes(newOptions) && svc.includes('successStatus'))) {
  stop('Hàm getSaleReport khác cấu trúc V19.7; giữ nguyên file để tránh ảnh hưởng hệ thống.');
}
const oldRouteArgs = "const {start,end,role='assign',warehouseId=''} = req.query;";
const newRouteArgs = "const {start,end,role='assign',warehouseId='',successStatus='1',successRecord='inserted_at'} = req.query;";
const oldRouteCall = 'getSaleReport(start,end,role,warehouseId)';
const newRouteCall = 'getSaleReport(start,end,role,warehouseId,successStatus,successRecord)';
const oldResponse = 'res.json({success:true,start,end,role,warehouseId,...result,updatedAt:new Date().toISOString()});';
const newResponse = 'res.json({success:true,start,end,role,warehouseId,successStatus,successRecord,...result,updatedAt:new Date().toISOString()});';
if (route.includes(oldRouteArgs) && route.includes(oldRouteCall) && route.includes(oldResponse)) {
  route = route.replace(oldRouteArgs, newRouteArgs).replace(oldRouteCall, newRouteCall).replace(oldResponse, newResponse);
} else if (!(route.includes(newRouteArgs) && route.includes(newRouteCall) && route.includes(newResponse))) {
  stop('Route saleReport.js khác cấu trúc V19.7; không tự sửa.');
}
const changed = [[files[0], original[0], svc], [files[1], original[1], route]].filter(([,old,next]) => old !== next);
if (!changed.length) { console.log('V19.8: Backend đã cập nhật, không cần chạy lại.'); process.exit(0); }
console.log(dry ? 'V19.8: XEM TRƯỚC (chưa thay đổi).' : 'V19.8: CẬP NHẬT BACKEND SALE.');
for (const [file] of changed) console.log(' -', file);
console.log(' - Cho phép chọn trạng thái 1 / send_to_partner và ngày inserted_at / updated_at.');
if (dry) process.exit(0);
const backupDir = path.join(root, '.pixelalbum-backups', `v19-8-sale-${new Date().toISOString().replace(/[:.]/g,'-')}`);
try {
  for (const [file,old] of changed) { const dest = path.join(backupDir,file); fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,old); }
  for (const [file,,next] of changed) fs.writeFileSync(path.join(root,file),next);
  console.log('OK. Sao lưu tại:',path.relative(root,backupDir));
  console.log('Khởi động lại backend sau khi cài.');
} catch (e) {
  for (const [file,old] of changed) { try{fs.writeFileSync(path.join(root,file),old);}catch{} }
  stop('Lỗi ghi file, đã thử khôi phục: '+e.message);
}
