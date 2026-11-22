const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeRanking, validateRankingRange, getRanking } = require('../services/pancakeSales');
const { monthsInRange, getLeaderboard } = require('../services/salesRanking');
const now = new Date('2026-11-22T04:00:00Z');
test('ranking groups by ID, sums duplicates, converts cents to THB and preserves zero employees', () => {
  const employees = [{id:'a',name:'A'},{id:'b',name:'B'}];
  const raw = [{'User.id':'a',success:{price:10000,order_count:2}},{'User.id':{id:'a'},success:{price:2500,order_count:1}},{'User.id':'unknown',success:{price:999999,order_count:10}}];
  assert.deepEqual(normalizeRanking(raw,employees),[{employeeId:'a',name:'A',orders:3,revenueThb:125},{employeeId:'b',name:'B',orders:0,revenueThb:0}]);
  assert.throws(()=>normalizeRanking([{'User.id':'a',success:{price:100,order_count:-1}}],employees));
});
test('validate date range on server and enumerate months including year rollover', () => {
  assert.doesNotThrow(()=>validateRankingRange('2026-10-01','2026-11-22',now));
  assert.throws(()=>validateRankingRange('2026-02-30','2026-11-22',now));
  assert.throws(()=>validateRankingRange('2025-01-01','2026-11-22',now));
  assert.throws(()=>validateRankingRange('2026-11-22','2026-11-23',now));
  assert.deepEqual(monthsInRange('2025-12-31','2026-02-01'),['2025-12','2026-01','2026-02']);
});
test('completion uses summed full monthly targets and 780, never invents missing goal', async () => {
  const sales = async()=>[{employeeId:'b',name:'B',revenueThb:100,orders:1},{employeeId:'a',name:'A',revenueThb:200,orders:2}];
  const targets = {list:async month=>[{employeeId:'a',targetVnd:78000},...(month==='2026-10'?[{employeeId:'b',targetVnd:10000}]:[])]};
  const result = await getLeaderboard('2026-10-30','2026-11-03',now,sales,targets);
  assert.equal(result.rows[0].employeeId,'a');
  assert.equal(result.rows[0].targetVnd,156000);
  assert.equal(result.rows[0].completion,1);
  assert.equal(result.rows[1].completion,null);
  const failed = await getLeaderboard('2026-11-01','2026-11-03',now,sales,{list:async()=>{throw Error('DB');}});
  assert.equal(failed.targetError,true);
  assert.equal(failed.rows[0].revenueThb,200);
  assert.equal(failed.rows[0].completion,null);
});
test('rank grouped by User.id with inclusive Bangkok date range, one analytics request', async () => {
  process.env.PANCAKE_SHOP_ID = '123'; process.env.PANCAKE_API_KEY = 'test-only';
  const original = global.fetch;
  let calls = 0;
  global.fetch = async (url) => {
    const u = new URL(url);
    if (u.pathname.endsWith('/users')) return Response.json({success:true,data:[{user_id:'a',user:{name:'A'}}]});
    calls++;
    assert.ok(u.pathname.endsWith('/analytics/sale'));
    assert.equal(u.searchParams.get('since'),'2026-11-20T17:00:00.000Z');
    assert.equal(u.searchParams.get('until'),now.toISOString());
    assert.deepEqual(u.searchParams.getAll('split_by[]'),['User.id']);
    assert.deepEqual(u.searchParams.getAll('select_fields[]'),['price','order_count']);
    assert.equal(u.searchParams.get('user_type'),'marketer');
    assert.equal(u.searchParams.get('success_status'),'1');
    assert.equal(u.searchParams.get('success_record'),'inserted_at');
    assert.equal(u.searchParams.has('filter[User.id][]'),false);
    return Response.json({success:true,data:[{'User.id':'a',success:{price:12300,order_count:2}},{'User.id':null,success:{price:900,order_count:1}}]});
  };
  try { assert.deepEqual(await getRanking('2026-11-21','2026-11-22',now),[{employeeId:'a',name:'A',orders:2,revenueThb:123}]); assert.equal(calls,1); }
  finally { global.fetch = original; }
});
