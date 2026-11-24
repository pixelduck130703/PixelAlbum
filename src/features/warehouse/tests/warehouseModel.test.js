import test from 'node:test';
import assert from 'node:assert/strict';
import { rangeForPeriod,dateRangeError,sortedWarehouses,totalWarehouses } from '../models/warehouseModel.js';
test('preset tuần tính Thứ Hai đến Chủ Nhật',()=>{
  assert.deepEqual(rangeForPeriod('thisWeek','2026-11-24'),['2026-11-23','2026-11-24']);
  assert.deepEqual(rangeForPeriod('lastWeek','2026-11-24'),['2026-11-16','2026-11-22']);
  assert.deepEqual(rangeForPeriod('lastMonth','2027-01-10'),['2026-12-01','2026-12-31']);
});
test('ngày báo cáo không được vượt 366 ngày hay ở tương lai',()=>{
  assert.equal(dateRangeError('2026-11-01','2026-11-24','2026-11-24'),'');
  assert.ok(dateRangeError('2026-11-25','2026-11-26','2026-11-24'));
  assert.ok(dateRangeError('2025-01-01','2026-11-24','2026-11-24'));
});
test('xếp hạng và tổng kho không cộng giả trường chưa được API trả',()=>{
  const a={name:'A',orders:2,returnedOrders:0,priceThb:100,discountThb:10,shippingFeeThb:0,returnedShippingFeeThb:null,salesThb:100,revenueThb:90,revenueEstimated:true};
  const b={name:'B',orders:1,returnedOrders:0,priceThb:50,discountThb:0,shippingFeeThb:0,returnedShippingFeeThb:null,salesThb:50,revenueThb:50,revenueEstimated:true};
  assert.deepEqual(sortedWarehouses([b,a],'revenueThb').map(x=>x.name),['A','B']);
  const total=totalWarehouses([a,b]);
  assert.equal(total.revenueThb,140);
  assert.equal(total.returnedShippingFeeThb,null);
});
