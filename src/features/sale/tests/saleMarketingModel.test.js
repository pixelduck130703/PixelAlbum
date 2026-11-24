import test from 'node:test';
import assert from 'node:assert/strict';
import { convertSaleReport, saleEmployeesFromReport, saleRankingWithTargets } from '../saleMarketingModel.js';
const report = {
  updatedAt: '2026-11-24T12:00:00.000Z',
  rows: [
    {employeeId:'staff1',name:'Sale A',orders:3,revenueThb:500,salesThb:525},
    {employeeId:'staff2',name:'Sale B',orders:0,revenueThb:0,salesThb:0},
    {employeeId:'__unassigned__',name:'Chưa phân công',orders:1,revenueThb:100,salesThb:100},
  ],
  employeeDaily:[
    {employeeId:'staff1',date:'2026-11-24',orders:3,revenueThb:500,salesThb:525},
    {employeeId:'staff2',date:'2026-11-24',orders:0,revenueThb:0,salesThb:0},
  ],
};
test('Khi API đủ phí vận chuyển, Sale dùng doanh số thay vì tiền hàng',()=>{
  const result=convertSaleReport(report);
  assert.equal(result.measureLabel,'Doanh số');
  assert.equal(result.rows[0].revenueThb,525);
  assert.equal(result.employeeDaily[0].revenueThb,525);
  assert.equal(result.rows.find(r=>r.employeeId==='__unassigned__')?.revenueThb,100); // không làm mất tổng Pancake
});
test('Thiếu doanh số thì toàn bộ báo cáo chuyển về Tiền hàng, không trộn hai chỉ số',()=>{
  const missing={...report,rows:report.rows.map(r=>({...r,salesThb:null}))};
  const result=convertSaleReport(missing);
  assert.equal(result.measureLabel,'Tiền hàng');
  assert.equal(result.rows[0].revenueThb,500);
  assert.equal(result.employeeDaily[0].revenueThb,500);
});
test('Danh sách nhân viên Sale chỉ chọn người có số liệu dương',()=>{
  const names=saleEmployeesFromReport(convertSaleReport(report));
  assert.deepEqual(names,[{id:'staff1',name:'Sale A'},{id:'__unassigned__',name:'Chưa phân công'}]);
});
test('Mục tiêu Sale nhận từ bảng Sale riêng, không lấy mục tiêu Marketing',()=>{
  const month='2026-11';
  const mapped=saleRankingWithTargets(convertSaleReport(report),{'staff1:2026-11':5_000_000},month);
  assert.equal(mapped[0].targetVnd,5_000_000);
  assert.equal(mapped[1].targetVnd,null);
});
test('Backend Sale cũ thiếu employeeDaily phải thông báo nâng backend',()=>{
  assert.throws(()=>convertSaleReport({...report,employeeDaily:undefined}),/Backend Sale/);
});
