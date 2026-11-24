import { Component, useEffect, useMemo, useState } from 'react';
import DashboardHeader from '../dashboard-shared/DashboardHeader';
import { todayInBangkok } from '../sales/models/salesDashboardModel';
import { fetchExchangeRate } from '../../services/salesService';
import { fetchWarehouseReport, warehouseReportErrorMessage } from './warehouseService';
import { PERIODS, rangeForPeriod, dateRangeError, sortedWarehouses, totalWarehouses } from './models/warehouseModel';
import { buildWarehouseInsights } from './models/warehouseInsights';
import '../sales/SalesDashboard.css';
import './WarehouseDashboard.css';

// Bỏ kho cũ chỉ khi KHÔNG có đơn hoặc tiền phát sinh. Nếu có doanh thu,
// giữ dòng để không làm sai tổng và CSV khi đối soát với Pancake.
function isInactiveOrphanWarehouse(row) {
  if (!/^Kho không còn trong danh sách\s*\(/i.test(String(row?.name || ''))) return false;
  const amounts = ['orders','returnedOrders','priceThb','discountThb','shippingFeeThb','returnedShippingFeeThb','salesThb','revenueThb'];
  return amounts.every((field) => row[field] == null || Number(row[field]) === 0);
}

const moneyFormatter = new Intl.NumberFormat('vi-VN',{maximumFractionDigits:0});
const RATE_KEY = 'pixelalbum-sales-dashboard-rate-mode';
const number = (n) => n == null ? '—' : moneyFormatter.format(n);
const thb = (n) => n == null ? '—' : `${number(n)} ฿`;
const vnd = (n) => n == null ? '—' : `${number(n)} đ`;
const displayDate = (iso) => /^\d{4}-\d{2}-\d{2}$/.test(iso || '') ? `${iso.slice(8,10)}/${iso.slice(5,7)}/${iso.slice(0,4)}` : iso;
function savedRate() { try {const v=localStorage.getItem(RATE_KEY);return ['750','780','online'].includes(v)?v:'750';} catch{return '750';} }
function quoteCsv(value) { let s=String(value??''); if(/^[=+@\-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"'; }
function downloadCsv(filename, table) {
  const csv='\uFEFF'+table.map(row=>row.map(quoteCsv).join(',')).join('\r\n');
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=filename;link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
const columns=[
  ['orders','Đơn chốt','count'],['returnedOrders','Đơn hoàn','count'],
  ['priceThb','Tiền hàng','thb'],['discountThb','Chiết khấu','thb'],
  ['shippingFeeThb','Phí VC thu khách','thb'],['returnedShippingFeeThb','Phí trả hàng VC','thb'],
  ['salesThb','Doanh số','thb'],['revenueThb','Doanh thu','thb'],
];

class WarehouseErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error, info) { console.error('[Kho hàng] Không dựng được giao diện:', error, info); }
  render() {
    if (!this.state.failed) return this.props.children;
    return <main className="sd-root wh-root">
      <DashboardHeader active="warehouse" />
      <div className="sd-shell wh-shell"><section className="wh-panel" style={{padding:24}}>
        <h2>Không mở được giao diện Kho hàng</h2>
        <p>Đã phát hiện lỗi khi hiển thị trang, không phải dữ liệu bằng 0. Anh nhấn Ctrl + F5 hoặc kiểm tra Console (F12) để xem lỗi JavaScript.</p>
        <button className="sd-primary" type="button" onClick={() => window.location.reload()}>Tải lại trang</button>
      </section></div>
    </main>;
  }
}

export default function WarehouseDashboard() {
  return <WarehouseErrorBoundary><WarehouseDashboardContent /></WarehouseErrorBoundary>;
}

function WarehouseDashboardContent(){
  const today=todayInBangkok();
  const [period,setPeriod]=useState('today');
  const [start,setStart]=useState(today);
  const [end,setEnd]=useState(today);
  const [warehouseId,setWarehouseId]=useState('all');
  const [sortBy,setSortBy]=useState('revenueThb');
  const [descending,setDescending]=useState(true);
  const [rateMode,setRateMode]=useState(savedRate);
  const [exchange,setExchange]=useState(null);
  const [refresh,setRefresh]=useState(0);
  const [report,setReport]=useState({key:'',rows:[],updatedAt:null,incomplete:false,error:'',loading:true});
  const [from,to]=useMemo(()=>rangeForPeriod(period,today,start,end),[period,today,start,end]);
  const rangeError=dateRangeError(from,to,today);
  const key=`${from}:${to}`;
  const ready=report.key===key&&!report.loading&&!report.error;
  const live=Number(exchange?.rate);
  const rate=rateMode==='780'?780:rateMode==='online'&&Number.isFinite(live)&&live>0?live:750;

  useEffect(()=>{try{localStorage.setItem(RATE_KEY,rateMode);}catch{}},[rateMode]);
  useEffect(()=>{const t=setInterval(()=>setRefresh(n=>n+1),60000);return()=>clearInterval(t);},[]);
  useEffect(()=>{
    const controller=new AbortController();
    fetchExchangeRate(controller.signal).then(setExchange).catch(()=>setExchange(prev=>prev?{...prev,stale:true}:null));
    return()=>controller.abort();
  },[refresh]);
  useEffect(()=>{
    if(rangeError)return;
    const controller=new AbortController();
    setReport(prev=>({...prev,loading:true,error:''}));
    fetchWarehouseReport(from,to,controller.signal).then(data=>{
      if(!controller.signal.aborted)setReport({key,rows:data.rows,updatedAt:data.updatedAt,incomplete:data.incomplete===true,error:'',loading:false});
    }).catch(e=>{
      if(!controller.signal.aborted)setReport({key,rows:[],updatedAt:null,incomplete:false,error:warehouseReportErrorMessage(e),loading:false});
    });
    return()=>controller.abort();
  },[from,to,key,rangeError,refresh]);

  const reportRows = useMemo(() => report.rows.filter((row) => !isInactiveOrphanWarehouse(row)), [report.rows]);
  const warehouseOptions=useMemo(()=>reportRows.map(({warehouseId:id,name})=>({id,name})).sort((a,b)=>a.name.localeCompare(b.name,'vi')),[reportRows]);
  const visible=useMemo(()=>sortedWarehouses(reportRows.filter(r=>warehouseId==='all'||r.warehouseId===warehouseId),sortBy,descending),[reportRows,warehouseId,sortBy,descending]);
  const totals=useMemo(()=>totalWarehouses(visible),[visible]);
  const insights=useMemo(()=>buildWarehouseInsights(visible),[visible]);
  const reportRange = from === to ? displayDate(from) : `${displayDate(from)} – ${displayDate(to)}`;
  function toggleSort(field){if(field===sortBy)setDescending(v=>!v);else{setSortBy(field);setDescending(true);}}
  function exportCsv(){
    const headers=['Kho hàng','Đơn chốt','Đơn hoàn','Tiền hàng THB','Chiết khấu THB','Phí VC thu khách THB','Phí trả hàng VC THB','Doanh số THB','Doanh thu THB','Doanh thu VND'];
    const fields=['name',...columns.map(([id])=>id)];
    const rows=[...visible.map(r=>[...fields.map(k=>r[k]??''),r.revenueThb==null?'':Math.round(r.revenueThb*rate)]),
      ['TỔNG',...columns.map(([id])=>totals[id]??''),totals.revenueThb==null?'':Math.round(totals.revenueThb*rate)]];
    downloadCsv(`bao-cao-kho-${from}_${to}.csv`,[headers,...rows]);
  }
  return <main className="sd-root wh-root">
    <DashboardHeader active="warehouse"/>
    <div className="sd-shell wh-shell">
      <div className="wh-heading">
        <div className="wh-heading-copy"><h1>Doanh thu theo kho</h1><span className="wh-date-meta">{reportRange}</span></div>
        <div className="wh-toolbar">
          <button type="button" className="wh-outline-btn" disabled={!ready} onClick={exportCsv}>↓ Xuất CSV</button>
          <button type="button" className="sd-primary" disabled={report.loading||!!rangeError} onClick={()=>setRefresh(n=>n+1)}>{report.loading?'Đang tải...':'↻ Làm mới'}</button>
        </div>
      </div>
      <section className={`wh-filters${period==='custom'?' wh-filters-custom':''}`} aria-label="Bộ lọc báo cáo kho">
        <label className="wh-field"><span>THỜI GIAN</span><select value={period} onChange={e=>setPeriod(e.target.value)}>{PERIODS.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
        {period==='custom'&& <><label className="wh-field"><span>TỪ NGÀY</span><input type="date" max={today} value={start} onChange={e=>setStart(e.target.value)}/></label><label className="wh-field"><span>ĐẾN NGÀY</span><input type="date" max={today} value={end} onChange={e=>setEnd(e.target.value)}/></label></>}
        <label className="wh-field"><span>KHO HÀNG</span><select value={warehouseId} onChange={e=>setWarehouseId(e.target.value)}><option value="all">Tất cả kho</option>{warehouseOptions.map(wh=><option value={wh.id} key={wh.id}>{wh.name}</option>)}</select></label>
        <label className="wh-field"><span>TỈ GIÁ (VND/THB)</span><select value={rateMode} onChange={e=>setRateMode(e.target.value)}><option value="750">750</option><option value="online">Trực tuyến</option><option value="780">780</option></select></label>
      </section>
      {rangeError&&<div className="sd-alert" role="alert">{rangeError}</div>}
      {report.error&&<div className="sd-alert" role="alert" style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
        <span><strong>Không tải được báo cáo Kho hàng.</strong> {report.error}</span>
        <button type="button" onClick={()=>setRefresh(n=>n+1)}>Thử lại</button>
      </div>}
      {rateMode==='online'&&(!Number.isFinite(live)||live<=0)&&<div className="wh-warning" role="status">Chưa tải được tỉ giá trực tuyến; tạm quy đổi theo 750 VND/THB.</div>}
      {(report.incomplete||totals.revenueEstimated)&&<div className="wh-warning" role="status">Dữ liệu tài chính chưa đầy đủ. Các ô thiếu hiển thị “—”; doanh thu ước tính cần đối chiếu với Pancake.</div>}
      <section className="wh-kpis" aria-label="Tổng quan kho">
        <div className="wh-kpi"><span>Kho có phát sinh</span><strong>{ready?number(totals.activeCount):'—'}</strong></div>
        <div className="wh-kpi"><span>Tổng đơn chốt</span><strong>{ready?number(totals.orders):'—'}</strong></div>
        <div className="wh-kpi wh-kpi-blue"><span>Tổng doanh số</span><strong>{ready?thb(totals.salesThb):'—'}</strong></div>
        <div className="wh-kpi wh-kpi-green"><span>Doanh thu VND <span className="wh-kpi-rate">({rateMode==='online'?'trực tuyến':rateMode})</span></span><strong>{ready&&totals.revenueThb!==null?vnd(Math.round(totals.revenueThb*rate)):'—'}</strong></div>
      </section>
      <section className="wh-panel" aria-label="Bảng thống kê kho">
        <div className="wh-panel-heading"><h2>Chi tiết theo kho</h2><span className="wh-updated" role="status">{ready&&report.updatedAt?`Cập nhật ${new Date(report.updatedAt).toLocaleTimeString('vi-VN',{timeZone:'Asia/Bangkok',hour:'2-digit',minute:'2-digit'})}`:report.loading?'Đang đồng bộ…':''}</span></div>
        <div className="wh-table-scroll" role="region" aria-label="Bảng doanh thu theo kho có thể cuộn ngang" tabIndex={0}>
          <table className="wh-table">
            <thead><tr><th scope="col" className="wh-name">Kho hàng</th>{columns.map(([id,label])=><th key={id} scope="col" aria-sort={sortBy===id?(descending?'descending':'ascending'):'none'}><button type="button" onClick={()=>toggleSort(id)}>{label}<span aria-hidden="true">{sortBy===id?(descending?' ↓':' ↑'):' ↕'}</span></button></th>)}<th scope="col" className="wh-vnd-header">Doanh thu VND</th></tr></thead>
            <tbody>
              {ready&&visible.map(r=><tr key={r.warehouseId}><th scope="row" className="wh-name">{r.name}</th>{columns.map(([id,,unit])=><td key={id} className={id==='revenueThb'?'wh-strong':''}>{unit==='count'?number(r[id]):thb(r[id])}{r.revenueEstimated&&id==='revenueThb'&&<sup title="Doanh thu ước tính do thiếu phí trả hàng">*</sup>}</td>)}<td className="wh-vnd">{vnd(r.revenueThb===null?null:Math.round(r.revenueThb*rate))}</td></tr>)}
              {ready&&!visible.length&&<tr><td colSpan={10} className="wh-empty">Chưa có dữ liệu kho trong khoảng ngày đã chọn.{period==='today'&&<> <button type="button" className="wh-outline-btn" onClick={()=>setPeriod('thisMonth')}>Thử xem Tháng này</button></>}</td></tr>}
              {!ready&&<tr><td colSpan={10} className="wh-empty">{report.error?'Có lỗi kết nối. Xem thông báo phía trên.':'Đang đồng bộ số liệu...'}</td></tr>}
            </tbody>
            <tfoot><tr><th scope="row" className="wh-name">TỔNG CỘNG</th>{columns.map(([id,,unit])=><td key={id}>{ready?(unit==='count'?number(totals[id]):thb(totals[id])):'—'}</td>)}<td>{ready&&totals.revenueThb!==null?vnd(Math.round(totals.revenueThb*rate)):'—'}</td></tr></tfoot>
          </table>
        </div>
      </section>
      {ready && <section className="wh-analytics" aria-label="Phân tích doanh thu theo kho">
        <div className="wh-analytics-topline">
          <h2>Phân tích doanh thu</h2>
          {insights.activeCount > 0 && <span className="wh-analysis-count">{insights.activeCount} kho phát sinh</span>}
        </div>
        {insights.activeCount === 0 ? <div className="wh-analytics-empty">Chưa có kho phát sinh doanh thu trong khoảng thời gian này.</div> :
          <div className="wh-analysis-columns">
            <div className="wh-analysis-ranking">
              <div className="wh-analysis-section-head"><h3>Xếp hạng kho</h3><span>THB</span></div>
              {insights.invalidCount > 0 && <p className="wh-chart-notice">Có {insights.invalidCount} kho thiếu hoặc có doanh thu âm; biểu đồ chỉ hiển thị giá trị hợp lệ.</p>}
              <div className="wh-bar-list">
                {insights.bars.map((row,index)=><div className={`wh-bar-row${index < 3 ? ' wh-bar-top' : ''}`} key={row.warehouseId}>
                  <span className="wh-bar-rank">{String(index + 1).padStart(2, '0')}</span>
                  <span className="wh-bar-name" title={row.name}>{row.name}</span>
                  <div className="wh-bar-track" role="img" aria-label={`${row.name}: ${thb(row.revenueThb)}`}>
                    <div className="wh-bar-fill" style={{width:`${row.relativePercent}%`}} />
                  </div>
                  <strong className="wh-bar-value">{thb(row.revenueThb)}</strong>
                </div>)}
                {insights.bars.length === 0 && <div className="wh-chart-notice">Chưa có số doanh thu hợp lệ để lập biểu đồ.</div>}
              </div>
              {insights.hiddenBars > 0 && <p className="wh-chart-bottom-note">Còn {insights.hiddenBars} kho khác trong bảng phía trên.</p>}
            </div>
            <div className="wh-analysis-share">
              <div className="wh-analysis-section-head"><h3>Tỷ trọng doanh thu</h3><span>%</span></div>
              {insights.canShowShare ? <div className="wh-share-body">
                <div className="wh-donut-wrap">
                  <div className="wh-donut" role="img" aria-label="Biểu đồ tỷ trọng doanh thu giữa các kho" style={{background:insights.gradient}}>
                    <div className="wh-donut-hole"><span>TỔNG DOANH THU</span><strong>{thb(insights.totalThb)}</strong></div>
                  </div>
                </div>
                <div className="wh-donut-legend">
                  {insights.pie.map((row,index)=><div className="wh-legend-row" key={index}>
                    <span className="wh-legend-dot" style={{background:row.color}} aria-hidden="true" />
                    <span className="wh-legend-name" title={row.name}>{row.name}</span>
                    <strong>{row.sharePercent.toLocaleString('vi-VN',{maximumFractionDigits:1})}%</strong>
                  </div>)}
                </div>
              </div> : <div className="wh-donut-unavailable">
                <strong>Chưa thể tính tỷ trọng chính xác</strong>
                <span>{insights.invalidCount ? `Có ${insights.invalidCount} kho chưa có doanh thu hợp lệ.` : 'Tổng doanh thu của các kho đang bằng 0.'}</span>
              </div>}
            </div>
          </div>}
      </section>}
    </div>
  </main>;
}
