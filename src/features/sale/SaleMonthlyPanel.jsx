import { useEffect, useMemo, useState } from 'react';
import {
  todayInBangkok, shiftMonth, buildRows, calculateSummary, groupWeeklyRows,
  formatChartRevenue, getEmployeeTarget,
} from '../sales/models/salesDashboardModel';
import {
  readTemporaryRevenue, writeTemporaryRevenue, normalizeTemporaryRevenue,
  applyTemporaryRevenue, parseTemporaryThb,
} from '../sales/utils/salesTemporaryRevenue';
import { fetchSaleReport, fetchSaleTargets } from './saleService';
import { salesErrorMessage } from '../../services/salesService';
const vi=new Intl.NumberFormat('vi-VN',{maximumFractionDigits:0});
const money=(n,unit='฿')=>n==null||!Number.isFinite(n)?'—':unit==='฿'?`฿${vi.format(n)}`:`${vi.format(Math.round(n))} đ`;
const shortWeekdays=['CN','T2','T3','T4','T5','T6','T7'];
const WEEK_COLORS=['#6b98ba','#36a4a0','#9a86c6','#d69d54','#cf7187','#6886ca'];
const monthEnd=month=>`${month}-${String(new Date(Number(month.slice(0,4)),Number(month.slice(5,7)),0).getDate()).padStart(2,'0')}`;
const showPercent=ratio=>Number.isFinite(ratio)?`${(ratio*100).toLocaleString('vi-VN',{maximumFractionDigits:2})}%`:'—';
const csvCell=value=>{const clean=String(value??'');const safe=/^[=+@\-\t\r]/.test(clean)?`'${clean}`:clean;return `"${safe.replaceAll('"','""')}"`};
function saveCsv(filename,rows){
  const csv='\uFEFF'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  const link=document.createElement('a');link.href=url;link.download=filename;link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

export default function SaleMonthlyPanel({ warehouseId, onWarehouseChange, warehouses = [], rate, rateMode, onRateChange, refresh, role, successStatus, successRecord, month, onMonthChange, targetRevision = 0, exchange = null }) {
  const today=todayInBangkok();
  const [employeeId,setEmployeeId]=useState('');
  const [report,setReport]=useState({key:'',data:null,error:'',loading:true});
  const [goal,setGoal]=useState({month:'',targets:null,canEdit:false,error:''});
  const [savedEntries,setSavedEntries]=useState({scope:'',entries:{}});
  const [editing,setEditing]=useState(false);
  const [drafts,setDrafts]=useState({});
  const [notice,setNotice]=useState('');
  const start=`${month}-01`;
  const end=month===today.slice(0,7)?today:month<today.slice(0,7)?monthEnd(month):'';
  const queryKey=`${start}:${end}:${warehouseId}:${role}:${successStatus}:${successRecord}:${refresh}`;
  const data=report.key===queryKey?report.data:null;
  const employees=data?.rows.filter(row=>row.revenueThb>0)||[];
  const selected=employees.find(row=>row.employeeId===employeeId);
  const scope=`sale-${role}-${employeeId}:${month}`;
  const ready=Boolean(data)&&!report.loading&&!report.error;
  const hasEmployeeDaily=Array.isArray(data?.employeeDaily);
  const personDays=useMemo(()=>data?.employeeDaily?.filter(row=>row.employeeId===employeeId)||[],[data,employeeId]);
  const usingSales=personDays.every(row=>typeof row.salesThb==='number'&&Number.isFinite(row.salesThb));
  const measure=usingSales?'salesThb':'revenueThb';
  const recordedDays=useMemo(()=>personDays.map(row=>({date:row.date,orders:row.orders,revenueThb:row[measure]})),[personDays,measure]);
  const originalRows=useMemo(()=>buildRows(month,recordedDays),[month,recordedDays]);
  const saved=scope===savedEntries.scope?savedEntries.entries:{};
  const applied=useMemo(()=>applyTemporaryRevenue(originalRows,saved,today),[originalRows,saved,today]);
  // Mục tiêu được thiết lập cho Sale phân công, toàn shop, trạng thái xác nhận.
  const targetComparable=role==='assign'&&!warehouseId&&successStatus==='1'&&successRecord==='inserted_at';
  const targetVnd=goal.month===month&&employeeId&&targetComparable?getEmployeeTarget(goal.targets,employeeId,month):null;
  const summary=useMemo(()=>calculateSummary(applied,targetVnd,rate,today),[applied,targetVnd,rate,today]);
  const groups=useMemo(()=>groupWeeklyRows(applied,rate),[applied,rate]);
  const maxRevenue=Math.max(1,...applied.map(row=>row.revenueThb||0));
  const canEdit=goal.month===month&&goal.canEdit&&!goal.error&&ready&&hasEmployeeDaily&&Boolean(employeeId);
  const adjustedCount=Object.keys(saved).length;

  useEffect(()=>{
    if(!end){setReport({key:queryKey,data:null,error:'Không xem được tháng tương lai.',loading:false});return}
    const controller=new AbortController();
    setReport({key:queryKey,data:null,error:'',loading:true});
    fetchSaleReport(start,end,role,warehouseId,controller.signal,successStatus,successRecord)
      .then(data=>{if(!controller.signal.aborted)setReport({key:queryKey,data,error:'',loading:false})})
      .catch(error=>{if(!controller.signal.aborted)setReport({key:queryKey,data:null,error:salesErrorMessage(error),loading:false})});
    return ()=>controller.abort();
  },[queryKey,start,end,role,warehouseId,successStatus,successRecord]);
  useEffect(()=>{
    const controller=new AbortController();
    fetchSaleTargets(month,controller.signal)
      .then(result=>{if(!controller.signal.aborted)setGoal({month,...result,error:''})})
      .catch(error=>{if(!controller.signal.aborted)setGoal({month,targets:null,canEdit:false,error:salesErrorMessage(error)})});
    return ()=>controller.abort();
  },[month,refresh,targetRevision]);
  useEffect(()=>{
    if(!employeeId)return;
    if(data&&!data.rows.some(row=>row.employeeId===employeeId))setEmployeeId('');
  },[data,employeeId]);
  useEffect(()=>{
    setSavedEntries({scope,entries:employeeId?readTemporaryRevenue(`sale-${role}-${employeeId}`,month):{}});
    setDrafts({});setEditing(false);setNotice('');
  },[scope,month,employeeId,role]);

  function saveDrafts() {
    if(!canEdit||!editing)return;
    const {entries,invalidDates}=normalizeTemporaryRevenue(drafts,originalRows,today);
    if(invalidDates.length){setNotice(`Số THB không hợp lệ vào ngày ${invalidDates.map(d=>d.slice(-2)).join(', ')}.`);return}
    try {
      writeTemporaryRevenue(`sale-${role}-${employeeId}`,month,entries);
      setSavedEntries({scope,entries});setEditing(false);
      setNotice('Đã lưu chỉnh sửa tạm trên trình duyệt. Dữ liệu Pancake không bị thay đổi.');
    } catch(error){setNotice(`Không lưu được: ${error.message}`)}
  }
  function resetDrafts(){
    if(!canEdit)return;
    try{writeTemporaryRevenue(`sale-${role}-${employeeId}`,month,{});setSavedEntries({scope,entries:{}});setEditing(false);setNotice('Đã khôi phục doanh số gốc từ Pancake.')}catch(error){setNotice(error.message)}
  }
  function csvExport(){
    if(!ready||!selected||!hasEmployeeDaily)return;
    saveCsv(`sale-${employeeId}-${month}.csv`,[
      ['Ngày','Thứ','Số đơn','Doanh số THB hiển thị','Doanh số VND','THB Pancake gốc','Điều chỉnh tạm','Tỉ giá','Vai trò'],
      ...applied.map((row)=>[
        row.date,shortWeekdays[row.weekday],row.orders??'',row.recorded?row.revenueThb:'',
        row.recorded?Math.round(row.revenueThb*rate):'',
        originalRows.find(original=>original.date===row.date)?.revenueThb??'',
        row.temporaryAdjusted?'Có':'Không',rate,role,
      ])
    ]);
  }
  function beginEdit(){
    const initial={};
    originalRows.filter(row=>row.date<=today).forEach(row=>{
      initial[row.date]=Object.hasOwn(saved,row.date)?vi.format(saved[row.date]):row.recorded?vi.format(row.revenueThb):'';
    });
    setDrafts(initial);setNotice('');setEditing(true);
  }
  const draftValues=editing?drafts:{};
  return <section className="sa-panel sa-monthly-panel" id="sa-monthly" aria-labelledby="sa-monthly-title">
    <div className="sa-section-head sa-monthly-head">
      <div><h2 id="sa-monthly-title">Doanh thu Sale theo tháng</h2><small>Nhân viên {role==='assign'?'được phân công':role==='create'?'tạo đơn':'cập nhật trạng thái'} · {usingSales?'Doanh số':'Tiền hàng'} THB</small></div>
      <a className="sa-btn" href="#sa-goal-center">Đặt mục tiêu Sale ↓</a>
    </div>
    <div className="sa-monthly-filters sa-marketing-filters">
      <label><span>Kho hàng</span><select value={warehouseId} onChange={e=>onWarehouseChange(e.target.value)}><option value="">Tất cả kho</option>{warehouses.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select></label>
      <label><span>Nhân viên Sale</span><select value={selected?employeeId:''} onChange={e=>setEmployeeId(e.target.value)}><option value="">Chọn nhân viên</option>{employees.map(person=><option key={person.employeeId} value={person.employeeId}>{person.name}</option>)}</select></label>
      <label><span>Tháng báo cáo</span><input type="month" value={month} max={today.slice(0,7)} onChange={e=>e.target.value&&onMonthChange(e.target.value)}/></label>
      <div className="sa-filter-target"><span>Mục tiêu Sale (VND)</span><a href="#sa-goal-center" title="Đi đến phần quản lý mục tiêu Sale">{!targetComparable?'Không so sánh':targetVnd>0?money(targetVnd,'đ'):'Chưa đặt'} <small>Chỉnh sửa ↓</small></a></div>
      <label><span>Tỉ giá</span><select value={rateMode} onChange={e=>onRateChange(e.target.value)}><option value="750">750</option><option value="online">Trực tuyến</option><option value="780">780</option></select></label>
      <div className="sa-month-arrows"><button className="sa-btn" type="button" aria-label="Tháng trước" onClick={()=>onMonthChange(shiftMonth(month,-1))}>‹</button><button className="sa-btn" type="button" aria-label="Tháng sau" disabled={month>=today.slice(0,7)} onClick={()=>onMonthChange(shiftMonth(month,1))}>›</button></div>
    </div>
    {report.error&&<p className="sa-alert" role="alert">{report.error}</p>}
    {goal.month===month&&goal.error&&<p className="sa-alert sa-warn" role="alert">Không tải được mục tiêu Sale: {goal.error}</p>}
    {!ready&&!report.error&&<p className="sa-monthly-empty">Đang tải doanh số theo tháng...</p>}
    {ready&&!employeeId&&<p className="sa-monthly-empty">Chọn nhân viên để xem doanh số từng ngày, tổng tuần và tiến độ mục tiêu.</p>}
    {ready&&employeeId&&!hasEmployeeDaily&&<p className="sa-alert" role="alert">Backend chưa trả doanh số theo từng nhân viên/ngày. Cập nhật file <code>server/services/saleReport.js</code> của V19.9 rồi khởi động lại server để hiển thị bảng này.</p>}
    {ready&&selected&&hasEmployeeDaily&&<>
      <div className="sa-monthly-stat-grid">
        <div><span>{usingSales?'Doanh số':'Tiền hàng'} tháng (THB)</span><strong>{money(summary.revenueThb)}</strong></div>
        <div><span>Quy đổi tháng (VND)</span><strong>{money(summary.revenueVnd,'đ')}</strong></div>
        <div><span>Mục tiêu Sale (VND)</span><strong>{!targetComparable?'—':goal.error?'Chưa tải':targetVnd>0?money(targetVnd,'đ'):'Chưa đặt'}</strong></div>
        <div><span>Hoàn thành</span><strong>{showPercent(summary.ratio)}</strong><small>{summary.remainingVnd!=null?`Cần thêm ${money(summary.remainingVnd,'đ')}`:''}</small></div>
      </div>
      {targetVnd>0&&<div className="sa-monthly-target-detail"><span>Còn thiếu: <strong>{money(summary.remainingVnd,'đ')}</strong></span><span>Mỗi ngày cần: <strong>{money(summary.needPerDay,'đ')}</strong></span><span>Đơn tháng: <strong>{summary.orders==null?'—':vi.format(summary.orders)}</strong></span></div>}
      <div className="sa-monthly-progress-card" aria-label="Tiến độ mục tiêu Sale">
        <div className="sa-progress-title"><span>Tiến độ mục tiêu Sale</span><strong>{showPercent(summary.ratio)}</strong></div>
        <div className="sa-monthly-progress"><span style={{width:`${Math.min(100,Math.max(0,(summary.ratio||0)*100))}%`}} /></div>
        <div className="sa-progress-foot"><span>Đã đạt <strong>{money(summary.revenueVnd,'đ')}</strong></span><span>Còn thiếu <strong>{targetComparable?money(summary.remainingVnd,'đ'):'—'}</strong></span></div>
      </div>
      <div className="sa-monthly-dual">
        <section className="sa-monthly-dual-left" aria-label="Doanh số Sale từng ngày">
      <div className="sa-monthly-section-title"><strong>Doanh số từng ngày</strong><div className="sa-monthly-action-buttons">
        <button type="button" className="sa-btn" onClick={csvExport}>↓ Xuất CSV tháng</button>
        {adjustedCount>0&&<span className="sa-adjusted-label">Đã điều chỉnh {adjustedCount} ngày</span>}
        {canEdit&&(editing?<><button type="button" className="sa-btn" onClick={()=>{setEditing(false);setNotice('')}}>Hủy</button><button type="button" className="sa-btn sa-btn-primary" onClick={saveDrafts}>Lưu tạm</button></>:<button type="button" className="sa-btn" onClick={beginEdit}>Chỉnh doanh số tạm</button>)}
        {canEdit&&adjustedCount>0&&<button type="button" className="sa-btn" onClick={resetDrafts}>Khôi phục gốc</button>}
      </div></div>
      {notice&&<p role="status" className="sa-adjusted-notice">{notice}</p>}
      <div className="sa-monthly-table-wrap"><table className="sa-monthly-table"><thead><tr><th>Ngày</th><th>Số đơn</th><th>Doanh số THB</th><th>Doanh số VND</th><th>Tổng tuần VND</th></tr></thead><tbody>
        {groups.flatMap(group=>group.rows.map((row,index)=><tr key={row.date} className={row.temporaryAdjusted?'sa-overridden-day':''}>
          <td><strong>{row.day}</strong><span>{shortWeekdays[row.weekday]}{row.date===today?' · Hôm nay':''}</span></td>
          <td>{row.orders==null?'—':vi.format(row.orders)}</td>
          <td>{editing&&row.date<=today?<input aria-label={`Doanh thu THB ngày ${row.date}`} inputMode="numeric" value={draftValues[row.date]??''} onChange={e=>setDrafts(prev=>({...prev,[row.date]:e.target.value}))} aria-invalid={draftValues[row.date]!==''&&parseTemporaryThb(draftValues[row.date])===null}/>:money(row.recorded?row.revenueThb:null)}</td>
          <td>{money(row.recorded?row.revenueThb*rate:null,'đ')}</td>
          {index===0&&<td rowSpan={group.rows.length} className="sa-monthly-week-total">{money(group.totalVnd,'đ')}</td>}
        </tr>))}</tbody><tfoot><tr><th>TỔNG THÁNG</th><td>{summary.orders==null?'—':vi.format(summary.orders)}</td><td>{money(summary.revenueThb)}</td><td>{money(summary.revenueVnd,'đ')}</td><td>{money(summary.revenueVnd,'đ')}</td></tr></tfoot></table></div>
        </section>
        <aside className="sa-monthly-dual-right" aria-label="Thống kê mục tiêu Sale">
      <div className="sa-target-stats" aria-label="Thống kê mục tiêu Sale">
        <div className="sa-target-stats-head"><h3>Thống kê mục tiêu</h3><small>1 THB = {rate.toLocaleString('vi-VN',{maximumFractionDigits:2})} VND</small></div>
        <div className="sa-target-columns"><strong>Chỉ số</strong><strong>THB</strong><strong>VND</strong></div>
        {[
          ['Tỷ giá','฿1',money(rate,'đ')],
          ['Mục tiêu',targetComparable?money(summary.targetThb):'—',!targetComparable?'Không so sánh':targetVnd>0?money(targetVnd,'đ'):'Chưa đặt'],
          ['Tổng doanh số',money(summary.revenueThb),money(summary.revenueVnd,'đ')],
          ['Cần thêm',targetComparable?money(summary.remainingThb):'—',targetComparable?money(summary.remainingVnd,'đ'):'—'],
          ['Mỗi ngày cần',targetComparable?money(summary.needThbPerDay):'—',targetComparable?money(summary.needPerDay,'đ'):'—'],
        ].map(([label,left,right])=><div className="sa-target-row" key={label}><span>{label}</span><strong>{left}</strong><strong>{right}</strong></div>)}
        <div className="sa-target-conversions">
          <div><span>Doanh số (780)</span><strong>{summary.revenueThb==null?'—':money(summary.revenueThb*780,'đ')}</strong></div>
          <div><span>Doanh số (trực tuyến)</span><strong>{summary.revenueThb!=null&&Number(exchange?.rate)>0?money(summary.revenueThb*exchange.rate,'đ'):'—'}</strong></div>
        </div>
        {!targetComparable&&<small className="sa-target-warning">Tiến độ mục tiêu chỉ áp dụng khi chọn Tất cả kho và đối chiếu mặc định: nhân viên được phân công, đơn đã xác nhận, ngày tạo đơn.</small>}
      </div>
        </aside>
      </div>
      <div className="sa-monthly-section-title"><strong>Biểu đồ doanh số theo ngày</strong><small>THB</small></div>
      <div className="sa-monthly-chart-scroll" id="sa-monthly-chart" role="region" tabIndex={0} aria-label="Biểu đồ doanh số Sale theo ngày">
        <div className="sa-monthly-chart">{groups.flatMap((group,weekIndex)=>group.rows.map(row=><div key={row.date} className="sa-monthly-column" title={`${row.date} · ${money(row.revenueThb)}`}>
          <div className="sa-monthly-chart-track"><div className="sa-monthly-column-bar" style={{height:`${row.recorded?Math.max(0,row.revenueThb/maxRevenue*100):0}%`,background:WEEK_COLORS[weekIndex%WEEK_COLORS.length]}}><span>{row.recorded&&row.revenueThb>0?formatChartRevenue(row.revenueThb):''}</span></div></div>
          <span>{row.day}</span><small>{shortWeekdays[row.weekday]}</small>
        </div>))}</div>
      </div>
      {!usingSales&&<p className="sa-monthly-caution">API chưa trả đủ phí vận chuyển thu khách; bảng tháng đang hiển thị Tiền hàng thay vì Doanh số.</p>}
    </>}
  </section>;
}
