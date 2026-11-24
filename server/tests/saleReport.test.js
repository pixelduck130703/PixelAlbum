'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {normalizeSaleReport} = require('../services/saleReport');
const people=[{id:'u1',name:'Sale A'}, {id:'u2',name:'Sale B'}];
const p={start:'2026-11-01',end:'2026-11-30'};
test('sum employees + days in THB, count positive rows only',()=>{
  const raw=[
    {'User.id':'u1','Time.day':'2026-11-01',success:{order_count:2,price:152500}},
    {'User.id':'u2','Time.day':'2026-11-01',success:{order_count:1,price:45500}},
    {'User.id':'u1','Time.day':'2026-11-02',success:{order_count:3,price:70000}}
  ];
  const r=normalizeSaleReport(raw,people,p);
  assert.equal(r.rows.length,2);
  assert.deepEqual(r.rows.map(x=>x.revenueThb),[2225,455]);
  assert.equal(r.totals.orders,6);
  assert.equal(r.totals.revenueThb,2680);
  assert.deepEqual(r.daily.map(d=>d.revenueThb),[1980,700]);
});
test('reject wrong warehouse',()=>{
  assert.throws(()=>normalizeSaleReport([{'User.id':'u1','Time.day':'2026-11-01','Order.warehouse_id':'wrong',success:{price:100,order_count:1}}],people,{...p,warehouseId:'correct'}),/ngoài kho/);
});
test('keep unassigned and departed staff transparently',()=>{
 const r=normalizeSaleReport([{'User.id':null,'Time.day':'2026-11-01',success:{price:20000,order_count:1}},{'User.id':'gone','Time.day':'2026-11-01',success:{price:10000,order_count:1}}],people,p);
 assert.equal(r.totals.revenueThb,300);
 assert.equal(r.totals.unassigned,true);
 assert.equal(r.rows.length,2);
});
test('reject missing split dimensions and invalid amounts',()=>{
 assert.throws(()=>normalizeSaleReport([{success:{price:1,order_count:1}}],people,p),/không trả nhóm/);
 assert.throws(()=>normalizeSaleReport([{'User.id':'u1','Time.day':'2026-11-01',success:{price:'123',order_count:1}}],people,p),/không hợp lệ/);
});
test('empty response does not invent sales',()=>{
 const r=normalizeSaleReport([],people,p);
 assert.deepEqual(r.rows,[]);assert.equal(r.totals.orders,0);
});
test('additional Pancake metrics are converted only when returned', () => {
  const report = normalizeSaleReport([
    {'User.id':'u1', 'Time.day':'2026-11-01', success:{order_count:2,price:152500,product_count:5,discount:1000,shipping_fee:500,avg_price:76250}},
    {'User.id':'u1', 'Time.day':'2026-11-02', success:{order_count:1,price:78000,product_count:3,discount:200,shipping_fee:0,avg_price:78000}},
  ], people, p);
  const row = report.rows[0];
  assert.equal(row.productCount, 8);
  assert.equal(row.discountThb, 12);
  assert.equal(row.shippingFeeThb, 5);
  assert.equal(row.avgPriceThb, (76250*2+78000)/3/100);
  assert.equal(row.returnShippingFeeThb, null);
  assert.equal(row.costThb, null);
});
test('do not fill absent metrics with zero', () => {
  const r = normalizeSaleReport([
    {'User.id':'u1','Time.day':'2026-11-01',success:{order_count:2,price:10000}},
  ],people,p);
  assert.equal(r.rows[0].productCount, null);
  assert.equal(r.rows[0].discountThb, null);
  assert.equal(r.rows[0].avgPriceThb, null);
});
test('partial additional metrics also remain null', () => {
  const r = normalizeSaleReport([
    {'User.id':'u1','Time.day':'2026-11-01',success:{order_count:2,price:10000,discount:300}},
    {'User.id':'u1','Time.day':'2026-11-02',success:{order_count:2,price:10000}},
  ],people,p);
  assert.equal(r.rows[0].discountThb, null);
});
test('separate price and sales when shipping fee exists', () => {
  const x=normalizeSaleReport([
    {'User.id':'u1','Time.day':'2026-11-01',success:{order_count:2,price:45000,shipping_fee:500,discount:250,product_count:3}},
    {'User.id':'u1','Time.day':'2026-11-02',success:{order_count:1,price:23000,shipping_fee:150,discount:0,product_count:1}},
  ], people, p);
  assert.equal(x.rows[0].revenueThb,680);
  assert.equal(x.rows[0].salesThb,686.5);
  assert.equal(x.totals.salesThb,686.5);
  assert.deepEqual(x.daily.map(d=>d.salesThb),[455,231.5]);
});
test('unknown shipping is not treated as zero sales',()=>{
  const x=normalizeSaleReport([
    {'User.id':'u1','Time.day':'2026-11-01',success:{order_count:1,price:12500}},
    {'User.id':'u1','Time.day':'2026-11-02',success:{order_count:1,price:20500,shipping_fee:0}},
  ],people,p);
  assert.equal(x.rows[0].revenueThb,330);
  assert.equal(x.rows[0].salesThb,null);
  assert.equal(x.totals.salesThb,null);
  assert.equal(x.daily[0].salesThb,null);
  assert.equal(x.daily[1].salesThb,205);
});
test('V19.9: employeeDaily is separated per employee and is consistent with monthly totals',()=>{
  const r=normalizeSaleReport([
    {'User.id':'u1','Time.day':'2026-11-01',success:{order_count:2,price:10000,shipping_fee:500}},
    {'User.id':'u2','Time.day':'2026-11-01',success:{order_count:1,price:8000,shipping_fee:0}},
    {'User.id':'u1','Time.day':'2026-11-02',success:{order_count:3,price:40000,shipping_fee:200}},
  ],people,p);
  const only1=r.employeeDaily.filter(x=>x.employeeId==='u1');
  assert.equal(only1.length,2);
  assert.equal(only1.reduce((sum,x)=>sum+x.orders,0),5);
  assert.equal(only1.reduce((sum,x)=>sum+x.salesThb,0),507);
  assert.equal(r.employeeDaily.reduce((sum,x)=>sum+x.revenueThb,0),r.totals.revenueThb);
  assert.equal(r.employeeDaily.reduce((sum,x)=>sum+x.salesThb,0),r.totals.salesThb);
});
test('V19.9: missing shipping fee only marks affected employee-day as incomplete',()=>{
  const r=normalizeSaleReport([
    {'User.id':'u1','Time.day':'2026-11-01',success:{order_count:1,price:10000}},
    {'User.id':'u2','Time.day':'2026-11-01',success:{order_count:1,price:20000,shipping_fee:0}}
  ],people,p);
  assert.equal(r.employeeDaily.find(x=>x.employeeId==='u1').salesThb,null);
  assert.equal(r.employeeDaily.find(x=>x.employeeId==='u2').salesThb,200);
});
