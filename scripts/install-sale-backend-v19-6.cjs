#!/usr/bin/env node
/**
 * PixelAlbum V19.6 - thêm API Sale vào server Express đã cài V19.
 * --dry-run: kiểm tra cấu trúc nhưng không sửa. Tự sao lưu 2 file trước khi sửa.
 * Không truy cập mạng, không đụng .env, PostgreSQL hoặc token.
 */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=process.cwd();
const dry=process.argv.includes('--dry-run');
const relSvc='server/services/pancakeSales.js';
const relRoute='server/routes/sales.js';
function stop(message){ console.error('V19.6:',message);process.exit(1); }
for (const f of [relSvc,relRoute,'server/services/saleReport.js','server/routes/saleReport.js']) {
  if (!fs.existsSync(path.join(root,f))) stop(`Thiếu ${f}; hãy giải nén đầy đủ ZIP vào project và chạy tại thư mục gốc.`);
}
const oldSvc=fs.readFileSync(path.join(root,relSvc),'utf8');
const oldRoute=fs.readFileSync(path.join(root,relRoute),'utf8');
let svc=oldSvc,route=oldRoute;
if (!svc.includes('async function getSaleReport(')) {
  for (const required of ['async function requestPancake(', 'function validateRankingRange(', 'function validateWarehouseId(', 'async function getEmployees(', 'async function assertWarehouse(']) {
    if(!svc.includes(required))stop('Không tìm được '+required+' trong pancakeSales.js. Không tự sửa, cần xem mã backend thực tế.');
  }
  const pos=svc.indexOf('module.exports = {');
  if(pos<0)stop('Không tìm được module.exports trong pancakeSales.js.');
  if(svc.includes('normalizeSaleReport')&&!svc.includes("require('./saleReport')"))stop('Đã có normalizeSaleReport khác. Không tự ghi đè.');
  svc="const { normalizeSaleReport } = require('./saleReport');\n"+svc;
  const fn=`\n// V19.6: doanh số Sale theo vai trò trên đơn, tách riêng Marketing.\nasync function getSaleReport(start, end, role = 'assign', warehouseId = '', now = new Date()) {\n  validateRankingRange(start, end, now);\n  if (!['assign','update','create'].includes(role)) throw new PancakeError('Cách tính Sale không hợp lệ.', 400);\n  validateWarehouseId(warehouseId);\n  if (warehouseId) await assertWarehouse(warehouseId);\n  const params = [\n    ['since', new Date(\`\${start}T00:00:00+07:00\`).toISOString()],\n    ['until', new Date(Math.min(now.getTime(), new Date(\`\${end}T23:59:59+07:00\`).getTime())).toISOString()],\n    ['split_by[]','Time.day'], ['split_by[]','User.id'],\n    ...(warehouseId ? [['split_by[]','Order.warehouse_id'], ['filter[Order.warehouse_id][]',warehouseId]] : []),\n    ['select_fields[]','price'], ['select_fields[]','order_count'],\n    ['user_type',role], ['success_status','1'], ['success_record','inserted_at']\n  ];\n  const [employees,raw] = await Promise.all([getEmployees(),requestPancake('analytics/sale',params)]);\n  return normalizeSaleReport(raw,employees,{start,end,warehouseId});\n}\n\n`;
  const insertAt=svc.indexOf('module.exports = {');
  svc=svc.slice(0,insertAt)+fn+svc.slice(insertAt);
  svc=svc.replace(/module\.exports\s*=\s*\{([^}]*)\}/,(_,body)=>`module.exports = {${body.trimEnd()}${body.trimEnd().endsWith(',')?' ':', '}getSaleReport }`);
  if(!/module\.exports\s*=\s*\{[^}]*\bgetSaleReport\b/.test(svc))stop('Không thể export getSaleReport.');
} else if (!/module\.exports\s*=\s*\{[^}]*\bgetSaleReport\b/.test(svc)) {
  stop('getSaleReport đã có nhưng chưa export, cần kiểm tra thủ công.');
}
if(!route.includes('registerSaleReportRoute(router,')) {
  const anchor='router.use(createSalesTargetsRouter(salesReadAccess));';
  if (!route.includes(anchor) || !route.includes('function salesReadAccess(') || !route.includes('function handleError(')) stop('Không nhận diện vị trí cài route sales.js.');
  if(!route.includes("require('./saleReport')")) route="const { registerSaleReportRoute } = require('./saleReport');\n"+route;
  route=route.replace(anchor,`registerSaleReportRoute(router, salesReadAccess, handleError);\n${anchor}`);
}
if(svc===oldSvc&&route===oldRoute){console.log('V19.6: API Sale đã được cài, không cần sửa.');process.exit(0);}
console.log('V19.6:',dry?'XEM TRƯỚC — chưa sửa':'CÀI API SALE');
console.log(' - Thêm GET /api/sales/sale-report, giữ middleware salesReadAccess');
console.log(' - Không thay đổi API Marketing / Kho hàng hiện tại');
if(dry)process.exit(0);
const dirname=path.join(root,'.pixelalbum-backups','v19-6-sale-'+new Date().toISOString().replace(/[:.]/g,'-'));
const changes=[[relSvc,oldSvc,svc],[relRoute,oldRoute,route]].filter(([,a,b])=>a!==b);
try {
  for (const [f,old] of changes){const backup=path.join(dirname,f);fs.mkdirSync(path.dirname(backup),{recursive:true});fs.writeFileSync(backup,old);}
  for (const [f,,next] of changes)fs.writeFileSync(path.join(root,f),next);
} catch(err) {
  for (const [f,old] of changes){try{fs.writeFileSync(path.join(root,f),old);}catch{}}
  stop('Không ghi được: '+err.message);
}
console.log('OK: Đã cài endpoint Sale. Backup trong '+path.relative(root,dirname).replace(/\\/g,'/'));
console.log('Khởi động lại backend sau khi cài.');
