import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWarehouseInsights,WAREHOUSE_CHART_COLORS } from '../models/warehouseInsights.js';
const row=(name,revenueThb,orders=1,extra={})=>({warehouseId:name,name,revenueThb,orders,...extra});
test('xếp hạng theo doanh thu và tỷ trọng tính trên tất cả kho được lọc',()=>{
 const result=buildWarehouseInsights([row('B',200),row('A',400),row('C',100),row('D',0)]);
 assert.deepEqual(result.bars.map(x=>x.name),['A','B','C','D']);
 assert.equal(result.totalThb,700);
 assert.equal(result.canShowShare,true);
 assert.equal(result.bars[0].relativePercent,100);
 assert.equal(Math.round(result.pie.reduce((s,x)=>s+x.sharePercent,0)),100);
 assert.ok(result.gradient.startsWith('conic-gradient('));
});
test('kho thiếu doanh thu làm ẩn tỷ trọng, không tính số thiếu thành 0',()=>{
 const result=buildWarehouseInsights([row('A',100),row('B',null)]);
 assert.equal(result.canShowShare,false);
 assert.equal(result.invalidCount,1);
 assert.equal(result.totalThb,null);
 assert.equal(result.gradient,null);
 assert.equal(result.bars.length,1);
});
test('doanh thu âm không tạo biểu đồ tỷ trọng 100% sai',()=>{
 const result=buildWarehouseInsights([row('A',100),row('B',-20)]);
 assert.equal(result.canShowShare,false);
 assert.equal(result.invalidCount,1);
});
test('phí trả hàng chưa đối soát hiển thị cờ tham khảo',()=>{
 const result=buildWarehouseInsights([row('A',250,1,{revenueEstimated:true})]);
 assert.equal(result.hasEstimated,true);
 assert.equal(result.canShowShare,true);
});
test('nhiều kho sẽ nhóm Kho khác nhưng vẫn cộng đủ doanh thu',()=>{
 const rows=Array.from({length:13},(_,i)=>row(`Kho ${String(i).padStart(2,'0')}`,100+i));
 const result=buildWarehouseInsights(rows);
 assert.equal(result.bars.length,12);
 assert.equal(result.hiddenBars,1);
 assert.equal(result.pie.length,8);
 assert.equal(result.pie.at(-1).name,'Kho khác (6)');
 assert.equal(result.pie.reduce((s,x)=>s+x.revenueThb,0),result.totalThb);
 assert.ok(WAREHOUSE_CHART_COLORS.length>=8);
});
test('không phát sinh và tổng bằng 0 thì không vẽ donut',()=>{
 const empty=buildWarehouseInsights([row('Kho mặc định',0,0)]);
 assert.equal(empty.activeCount,0);
 const zero=buildWarehouseInsights([row('A',0,1)]);
 assert.equal(zero.activeCount,1);
 assert.equal(zero.canShowShare,false);
});
