const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeWarehouseReport } = require('../services/warehouseReport');
const warehouses = [{ id:'a',name:'APEX' }, {id:'b',name:'VALLEY'}];
test('thống kê doanh số và doanh thu theo công thức ảnh Pancake, chia tiền cho 100', () => {
  const { rows, totals } = normalizeWarehouseReport([
    { 'Order.warehouse_id':'a', success:{ order_count:63, price:6273000, discount:365100, shipping_fee:20000 }, returned:null },
    { 'Order.warehouse_id':'b', success:{ order_count:42, price:3400300, discount:34400, shipping_fee:0 }, returned:null },
  ], warehouses);
  assert.deepEqual(rows.map(x=>x.salesThb),[62930,34003]);
  assert.deepEqual(rows.map(x=>x.revenueThb),[59279,33659]);
  assert.equal(totals.orders,105);
  assert.equal(totals.revenueThb,92938);
  assert.equal(totals.returnedShippingFeeThb,0);
  assert.equal(totals.revenueEstimated,false);
});
test('báo cáo không giả số 0 nếu thiếu phí VC hoặc chiết khấu',()=>{
  const { rows } = normalizeWarehouseReport([{ 'Order.warehouse_id':'a', success:{order_count:1, price:50000}, returned:null }], warehouses);
  assert.equal(rows[0].revenueThb,null);
  assert.equal(rows[0].salesThb,null);
});
test('không làm mất kho không có phát sinh và kho không xác định',()=>{
  const { rows } = normalizeWarehouseReport([{ 'Order.warehouse_id': null, success:{order_count:1,price:10000,shipping_fee:0,discount:0}, returned:null }],warehouses);
  assert.equal(rows.length,3);
  assert.equal(rows.find(x=>x.name==='VALLEY').orders,0);
  assert.equal(rows.find(x=>x.warehouseId==='__unassigned__').priceThb,100);
});
test('từ chối response không được nhóm đúng kho',()=>{
  assert.throws(()=>normalizeWarehouseReport([{success:{order_count:1,price:10000}}],warehouses),/theo kho/);
});
