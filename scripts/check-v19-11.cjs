#!/usr/bin/env node
// Chỉ kiểm tra, không sửa/xóa file.
const fs=require('node:fs');
const path=require('node:path');
const root=process.cwd();
let failures=0;
function check(label, rel, regexp){
  const f=path.join(root,rel);
  const ok=fs.existsSync(f)&&(!regexp||regexp.test(fs.readFileSync(f,'utf8')));
  console.log(`${ok?'[OK]':'[CHUA OK]'} ${label}: ${rel}`);
  if(!ok)failures++;
}
check('Trang Marketing dùng layout chung','src/features/sales/SalesDashboard.jsx',/team\s*=\s*'marketing'/);
check('Trang Sale dùng layout chung','src/features/sale/SaleDashboard.jsx',/SalesDashboard team="sale"/);
check('Sale adapter riêng','src/features/sale/saleMarketingAdapter.js',/fetchSaleMarketingDaily/);
check('Sale model phân biệt Doanh số/Tiền hàng','src/features/sale/saleMarketingModel.js',/measureLabel/);
check('Xếp hạng Danh sách\/Biểu đồ chung','src/features/sales/components/SalesRanking.jsx',/viewMode/);
check('Quản lý mục tiêu tách đội','src/features/sales/components/EmployeeTargetManager.jsx',/pixelalbum-sale-target-filters-v1/);
check('API frontend Sale','src/features/sale/saleService.js',/fetchSaleReport/);
check('Backend Sale từng nhân viên/ngày','server/services/saleReport.js',/employeeDaily/);
check('Backend mục tiêu Sale riêng','server/services/saleTargets.js',/sales_sale_targets/);
check('Đăng ký route frontend Sale','src/App.jsx',/sale-dashboard/);
check('Tab Sale trong header','src/features/dashboard-shared/DashboardHeader.jsx',/sale-dashboard/);
if(failures){console.error(`\nCó ${failures} mục thiếu. Đừng xóa file cũ; xem HUONG_DAN_V19_11.md.`);process.exitCode=1;}
else console.log('\nĐã có các file V19.11. Hãy chạy npm run build để kiểm tra dự án thật.');
