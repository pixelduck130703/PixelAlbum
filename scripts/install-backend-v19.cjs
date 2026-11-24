/*
 * PixelAlbum V19 - thêm API kho vào backend cũ, không thay thế nguyên file.
 * Chạy từ thư mục gốc project: node scripts/install-backend-v19.cjs
 * Tạo *.v19-backup trước khi sửa; nếu cấu trúc không khớp => báo lỗi, không ghi dở.
 */
const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const svcFile = path.join(root, 'server/services/pancakeSales.js');
const routeFile = path.join(root, 'server/routes/sales.js');
function fail(m) { console.error('V19:',m); process.exitCode=1; }
if (!fs.existsSync(svcFile) || !fs.existsSync(routeFile)) {
  fail('Không thấy server/services/pancakeSales.js hoặc server/routes/sales.js. Không sửa file nào.');
} else {
  const oldSvc=fs.readFileSync(svcFile,'utf8');
  const oldRoute=fs.readFileSync(routeFile,'utf8');
  let svc=oldSvc,route=oldRoute;
  if (!svc.includes('async function getWarehouseReport(')) {
    const insert=`\n// V19: thống kê theo kho thực trên đơn hàng, không dùng nhân viên để suy ra kho.\nasync function getWarehouseReport(start, end, now = new Date()) {\n  validateRankingRange(start,end,now);\n  const [warehouses, raw] = await Promise.all([getWarehouses(), requestPancake('analytics/sale', [\n    ['since', new Date(\`\${start}T00:00:00+07:00\`).toISOString()],\n    ['until', new Date(Math.min(now.getTime(), new Date(\`\${end}T23:59:59+07:00\`).getTime())).toISOString()],\n    ['split_by[]','Order.warehouse_id'], ['select_fields[]','price'], ['select_fields[]','discount'],\n    ['select_fields[]','shipping_fee'], ['select_fields[]','order_count'],\n    ['success_status','1'], ['success_record','inserted_at'], ['returned_record','inserted_at'],\n  ])]);\n  return normalizeWarehouseReport(raw,warehouses);\n}\n\n`;
    const at=svc.indexOf('module.exports = {');
    if (at<0 || !svc.includes('async function requestPancake(') || !svc.includes('function validateRankingRange(')) return fail('Không nhận diện cấu trúc pancakeSales.js, không sửa file.');
    svc="const { normalizeWarehouseReport } = require('./warehouseReport');\n"+svc.slice(0,at)+insert+svc.slice(at);
    svc=svc.replace(/(module\.exports\s*=\s*\{)([^}]*)(\})/, (full,a,b,c)=>{ const old=b.trimEnd(); return `${a}${old}${old.endsWith(',')?' ':', '}getWarehouseReport ${c}`; });
    if (!/module\.exports[\s\S]*getWarehouseReport/.test(svc)) return fail('Không thể đăng ký getWarehouseReport.');
  }
  if (!route.includes('registerWarehouseReportRoute(')) {
    if (!route.includes("const router = require('express').Router()") || !route.includes('salesReadAccess') || !route.includes('handleError')) return fail('Không nhận diện cấu trúc server/routes/sales.js, không sửa file.');
    route="const { registerWarehouseReportRoute } = require('./warehouseReport');\n"+route;
    const anchor='router.use(createSalesTargetsRouter(salesReadAccess));';
    if (!route.includes(anchor)) return fail('Thiếu chỗ đăng ký route. Không sửa file.');
    route=route.replace(anchor,`registerWarehouseReportRoute(router, salesReadAccess, handleError);\n${anchor}`);
  }
  if (svc===oldSvc && route===oldRoute) console.log('V19 backend đã được cài trước đó.');
  else {
    // đảm bảo hai file hoàn tất xử lý trước khi ghi, backup theo file thực.
    if(svc!==oldSvc) { fs.writeFileSync(svcFile+'.v19-backup',oldSvc);fs.writeFileSync(svcFile,svc); }
    if(route!==oldRoute) { fs.writeFileSync(routeFile+'.v19-backup',oldRoute);fs.writeFileSync(routeFile,route); }
    console.log('Đã thêm /api/sales/warehouse-report. Backup: *.v19-backup');
  }
}
