'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {createDayOrdersService,validDate,getAssignedIds,toTimestamps,bangkokDateFromMs,parseCreatedAtMs,extractReportCount}=require('../services/dayOrderDetails');
const OLD_SHOP=process.env.PANCAKE_SHOP_ID,OLD_KEY=process.env.PANCAKE_API_KEY;
process.env.PANCAKE_SHOP_ID='12345';process.env.PANCAKE_API_KEY='secret-for-tests-only';
const selectedDate='2026-11-26', employeeId='emp-one';
const NOW=()=>new Date('2026-11-27T11:00:00Z');
function order(id,time,employee=employeeId,extra={}){
  return {id,inserted_at:time,pke_mkter:employee,assigning_seller_id:employee,
    order_currency:'THB',total_price:188600,status:1,display_id:`ORDER-${id}`,total_quantity:2, ...extra};
}
function fetchMock({stats=null,pages={},requests=[],failStats=false}={}){
  return async url=>{
    const u=new URL(url);requests.push(u);
    if(u.pathname.endsWith('/analytics/sale')){
      if(failStats)throw new Error('statistics unavailable');
      return {ok:true,status:200,json:async()=>({success:true,data:stats??[{'Time.day':selectedDate,'User.id':employeeId,success:{order_count:21}}]})};
    }
    const page=Number(u.searchParams.get('page_number'));
    const val=pages[page];
    assert(val,'no mocked page '+page);
    return {ok:true,status:200,json:async()=>val};
  };
}
function page(orders,total_pages=1){return {success:true,data:orders,total_pages,total_entries:orders.length};}
test('validate dates and Bangkok timezone boundary',()=>{
  assert.equal(validDate('2026-11-31'),false);
  assert.equal(validDate(selectedDate),true);
  const {start,end}=toTimestamps(selectedDate);
  assert.equal(start,Date.parse('2026-11-26T00:00:00+07:00')/1000);
  assert.equal(end-start,86399);
  assert.equal(bangkokDateFromMs(parseCreatedAtMs('2026-11-25T17:00:00Z')),selectedDate);
});
test('does not depend on unsupported Order.id analytics grouping; shows real orders for employee/day',async()=>{
  const requests=[];
  const service=createDayOrdersService({fetchImpl:fetchMock({requests,pages:{1:page([
    order(11,'2026-11-26T14:25:00Z'),order(12,'2026-11-26T06:05:00Z'),
    order(13,'2026-11-26T03:00:00Z','different-employee'),
    order(14,'2026-11-25T15:00:00Z'),order(15,'2026-11-27T00:00:00Z'),
  ])}}),now:NOW});
  const r=await service.load({date:selectedDate,employeeId,team:'marketing'});
  assert.deepEqual(r.orders.map(o=>o.id),['11','12']);
  assert.equal(r.expectedCount,21);
  assert.equal(r.orders.length,2);
  assert.equal(r.missingCount,19);
  assert.equal(r.basis,'created_assigned');
  const analytics=requests.find(u=>u.pathname.endsWith('/analytics/sale'));
  assert(!analytics.searchParams.getAll('split_by[]').includes('Order.id'));
  assert.deepEqual(analytics.searchParams.getAll('split_by[]'),['Time.day','User.id']);
  const orders=requests.find(u=>u.pathname.endsWith('/orders'));
  assert.equal(orders.searchParams.get('updateStatus'),'inserted_at');
  assert.equal(orders.searchParams.get('option_sort'),'inserted_at_desc');
});
test('Sale role uses assigned employee and does not merge records from another employee',async()=>{
  const service=createDayOrdersService({fetchImpl:fetchMock({pages:{1:page([
    order(1,'2026-11-26T10:01:00Z','another',{assigning_seller_id:employeeId}),
    order(2,'2026-11-26T10:02:00Z','another'),
    order(3,'2026-11-26T10:03:00Z',employeeId,{status:6}),
  ])}}),now:NOW});
  const r=await service.load({date:selectedDate,employeeId,team:'sale'});
  assert.deepEqual(r.orders.map(o=>o.id),['3','1']);
  assert.equal(r.unmatchedEmployee,1);
});
test('does not hide real orders when analytics API is down',async()=>{
  const service=createDayOrdersService({fetchImpl:fetchMock({failStats:true,pages:{1:page([order(10,'2026-11-26T10:00:00Z')])}}),now:NOW});
  const r=await service.load({date:selectedDate,employeeId,team:'marketing'});
  assert.equal(r.orders.length,1);
  assert.equal(r.expectedCount,null);
});
test('reports no role matching instead of showing unrelated orders',async()=>{
  const service=createDayOrdersService({fetchImpl:fetchMock({pages:{1:page([
    order(1,'2026-11-26T10:00:00Z','other'),
    order(2,'2026-11-26T09:00:00Z',null,{pke_mkter:null,marketer:null,marketer_id:null}),
  ])}}),now:NOW});
  const r=await service.load({date:selectedDate,employeeId,team:'marketing'});
  assert.equal(r.orders.length,0);
  assert.equal(r.unassigned,1);
  assert.equal(r.unmatchedEmployee,1);
});
test('paginates all known pages in order to find matching day and employee',async()=>{
  const service=createDayOrdersService({fetchImpl:fetchMock({pages:{
    1:page([order(1,'2026-11-26T03:00:00Z','other')],2),
    2:page([order(2,'2026-11-26T10:00:00Z')],2),
  }}),now:NOW});
  const r=await service.load({date:selectedDate,employeeId,team:'marketing'});
  assert.equal(r.orders.length,1);
  assert.equal(r.orders[0].id,'2');
  assert.equal(r.truncated,false);
});
test('future date performs no API requests',async()=>{
  const svc=createDayOrdersService({fetchImpl:()=>{throw new Error('future request invalid')},now:NOW});
  const r=await svc.load({date:'2026-11-29',employeeId,team:'marketing'});
  assert.equal(r.orders.length,0);assert.equal(r.future,true);
});
test('report count extracted without Order.id and nonmatching employee ignored',()=>{
  const count=extractReportCount([
    {'Time.day':selectedDate,'User.id':employeeId,success:{order_count:2}},
    {'Time.day':selectedDate,'User.id':'someone-else',success:{order_count:10}},
  ],selectedDate,employeeId);
  assert.equal(count,2);
});
test('employee fields supported by Pancake identify marketer and seller',()=>{
  assert.deepEqual(getAssignedIds({pke_mkter:employeeId},'marketing'),[employeeId]);
  assert.deepEqual(getAssignedIds({assigning_seller_id:employeeId},'sale'),[employeeId]);
});
test.after(()=>{
  if(OLD_SHOP===undefined)delete process.env.PANCAKE_SHOP_ID;else process.env.PANCAKE_SHOP_ID=OLD_SHOP;
  if(OLD_KEY===undefined)delete process.env.PANCAKE_API_KEY;else process.env.PANCAKE_API_KEY=OLD_KEY;
});
