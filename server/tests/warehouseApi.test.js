const test=require('node:test');
const assert=require('node:assert/strict');
const { getWarehouseReport }=require('../services/pancakeSales');
test('API kho gọi analytics/sale nhóm Order.warehouse_id, trả đúng tiền THB', async()=>{
  const beforeFetch=global.fetch;
  const shop=process.env.PANCAKE_SHOP_ID, key=process.env.PANCAKE_API_KEY;
  process.env.PANCAKE_SHOP_ID='123456789';process.env.PANCAKE_API_KEY='TEST_KEY_DO_NOT_USE';
  const urls=[];
  global.fetch=async (input)=>{
    const u=new URL(input);urls.push(u);
    const isWarehouse=u.pathname.endsWith('/warehouses');
    return {ok:true,json:async()=>isWarehouse?{data:[{id:'wh-a',name:'APEX'}]}:{success:true,data:[
      {'Order.warehouse_id':'wh-a',success:{order_count:3,price:100000,shipping_fee:10000,discount:5000},returned:null}
    ]}};
  };
  try{
    const r=await getWarehouseReport('2026-11-23','2026-11-23',new Date('2026-11-24T03:00:00+07:00'));
    assert.equal(r.rows.find(x=>x.warehouseId==='wh-a').revenueThb,1050);
    const analytics=urls.find(u=>u.pathname.endsWith('/analytics/sale'));
    assert.ok(analytics);
    assert.deepEqual(analytics.searchParams.getAll('split_by[]'),['Order.warehouse_id']);
    assert.equal(analytics.searchParams.get('success_status'),'1');
    assert.equal(analytics.searchParams.get('success_record'),'inserted_at');
    assert.ok(!JSON.stringify(r).includes('TEST_KEY_DO_NOT_USE'));
  }finally{
    global.fetch=beforeFetch;
    if(shop===undefined)delete process.env.PANCAKE_SHOP_ID;else process.env.PANCAKE_SHOP_ID=shop;
    if(key===undefined)delete process.env.PANCAKE_API_KEY;else process.env.PANCAKE_API_KEY=key;
  }
});
