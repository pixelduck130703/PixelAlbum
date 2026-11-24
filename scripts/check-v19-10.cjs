#!/usr/bin/env node
'use strict';
const fs=require('node:fs');const path=require('node:path');
const root=process.cwd();let errors=0;
function check(file,needle,required=true){
 const absolute=path.join(root,file);
 if(!fs.existsSync(absolute)){console.log(`${required?'[THIEU]':'[CHUA CAI]'} ${file}`);if(required)errors++;return}
 const body=fs.readFileSync(absolute,'utf8');
 if(needle&&!body.includes(needle)){console.log(`[KIEM TRA] ${file}: chua thay ${needle}`);if(required)errors++;return}
 console.log(`[OK] ${file}`);
}
check('src/features/sale/SaleDashboard.jsx','<SaleTargetManager');
check('src/features/sale/SaleMonthlyPanel.jsx','sa-monthly-dual');
check('src/features/sale/SaleTargetManager.jsx','saveSaleTargets');
check('src/features/sales/SalesDashboard.jsx','Quản lý mục tiêu Marketing');
check('src/features/sale/SaleDashboard.css','sa-monthly-dual');
check('src/features/sale/models/saleChartModel.js','completeSaleDays');
check('src/features/dashboard-shared/DashboardHeader.jsx',null);
check('server/services/saleReport.js','employeeDaily');
check('server/routes/saleTargets.js',"'/api/sales/sale-targets'");
check('server/routes/sales.js','createSaleTargetsRouter',false);
check('src/App.jsx','sale-dashboard',false);
console.log(errors?'Có file thiếu. Vui lòng kiểm tra trước khi build.':'Đã thấy các file chính. Chạy npm run build để kiểm tra toàn dự án.');
process.exitCode=errors?1:0;
