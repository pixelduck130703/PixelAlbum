// This test runs via node --experimental-default-type=module --test
import test from 'node:test';
import assert from 'node:assert/strict';
import {completeSaleDays} from '../models/saleChartModel.js';
test('fill missing days without changing sales',()=>{
  assert.deepEqual(completeSaleDays('2026-11-23','2026-11-25',[{date:'2026-11-24',orders:2,revenueThb:120}]),[
    {date:'2026-11-23',orders:0,revenueThb:0},
    {date:'2026-11-24',orders:2,revenueThb:120},
    {date:'2026-11-25',orders:0,revenueThb:0},
  ]);
});
test('invalid range empty',()=>{
  assert.deepEqual(completeSaleDays('2026-11-25','2026-11-24',[]),[]);
});
