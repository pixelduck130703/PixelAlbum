import {useEffect,useMemo,useRef,useState} from 'react';
import {fetchDayOrders} from '../dayOrdersService';

const money=new Intl.NumberFormat('vi-VN',{maximumFractionDigits:2});
const labels={marketing:'Marketing',sale:'Sale'};
const noValue='—';
function displayTime(raw, ms) {
  const timestamp=Number(ms);
  if (!Number.isFinite(timestamp) || ms == null) return noValue;
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone:'Asia/Bangkok',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false,
  }).format(timestamp);
}
function displayDateTime(raw,ms) {
  if(ms==null || !Number.isFinite(Number(ms)))return noValue;
  return new Intl.DateTimeFormat('vi-VN',{
    timeZone:'Asia/Bangkok',day:'2-digit',month:'2-digit',year:'numeric',
    hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false,
  }).format(Number(ms));
}
function compareTime(a,b,ascending=false) {
  const aMs=a.createdAtMs==null?NaN:Number(a.createdAtMs);
  const bMs=b.createdAtMs==null?NaN:Number(b.createdAtMs);
  const aValid=Number.isFinite(aMs), bValid=Number.isFinite(bMs);
  if(!aValid && !bValid)return String(a.id).localeCompare(String(b.id));
  if(!aValid)return 1;
  if(!bValid)return -1;
  return (ascending?aMs-bMs:bMs-aMs)||String(a.id).localeCompare(String(b.id));
}
function toCsvValue(value){return `"${String(value??'').replace(/"/g,'""')}"`;}
function downloadCsv(date,items){
  const headers=['Mã đơn','Thời gian tạo','Giá trị đơn THB','Trạng thái','Số SP','Kho hàng','Nguồn'];
  const values=items.map(o=>[o.displayId,displayDateTime(o.createdAt,o.createdAtMs),o.amountThb,o.statusName,o.quantity,o.warehouseName,o.source]);
  const body=[headers,...values].map(row=>row.map(toCsvValue).join(',')).join('\r\n');
  const url=URL.createObjectURL(new Blob(['\uFEFF',body],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download=`chi-tiet-don-${date}.csv`;a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function errorMessage(error){
  if(error?.response?.status===401||error?.response?.status===403) return 'Chi tiết đơn hàng chỉ dành cho quản trị viên đã đăng nhập. Hãy đăng nhập lại rồi thử.';
  if(error?.response?.status===404) return 'Backend chưa được cài API chi tiết ngày V19.13. Cần deploy backend.';
  return error?.response?.data?.message || (error?.code==='ERR_NETWORK' ? 'Không thể kết nối backend.' : (error?.message||'Không tải được đơn hàng.'));
}
export default function DayOrdersDrawer({date,onClose,employeeId,employeeName,team='marketing',today,warehouseOptions=[],daySummary}) {
  const [state,setState]=useState({date:'',data:null,error:'',loading:false});
  const [retry,setRetry]=useState(0);
  const [search,setSearch]=useState('');
  const [status,setStatus]=useState('all');
  const [sort,setSort]=useState('time_desc');
  const [visibleCount,setVisibleCount]=useState(50);
  const panelRef=useRef(null);
  const closeRef=useRef(null);
  const returnRef=useRef(null);
  const isFuture=Boolean(date && today && date>today);
  useEffect(()=>{
    if(!date)return undefined;
    returnRef.current=document.activeElement;
    const oldOverflow=document.body.style.overflow;
    document.body.style.overflow='hidden';
    closeRef.current?.focus();
    const handleKey=(event)=>{
      if(event.key==='Escape') {event.preventDefault();onClose();return;}
      if(event.key!=='Tab'||!panelRef.current)return;
      const focusable=Array.from(panelRef.current.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),a[href]')).filter(x=>x.getClientRects().length);
      if(!focusable.length)return;
      if(event.shiftKey&&document.activeElement===focusable[0]){event.preventDefault();focusable[focusable.length-1].focus();}
      else if(!event.shiftKey&&document.activeElement===focusable[focusable.length-1]){event.preventDefault();focusable[0].focus();}
    };
    document.addEventListener('keydown',handleKey);
    return ()=>{
      document.body.style.overflow=oldOverflow;
      document.removeEventListener('keydown',handleKey);
      returnRef.current?.focus?.();
    };
  },[date,onClose]);
  useEffect(()=>{
    if(!date)return;
    setSearch('');setStatus('all');setSort('time_desc');setVisibleCount(50);
  },[date,employeeId,team]);
  useEffect(()=>{
    if(!date || !employeeId || isFuture)return undefined;
    const controller=new AbortController();
    setState({date,data:null,error:'',loading:true});
    fetchDayOrders({date,employeeId,team,signal:controller.signal}).then(data=>{
      if(!controller.signal.aborted)setState({date,data,error:'',loading:false});
    }).catch(error=>{
      if(!controller.signal.aborted)setState({date,data:null,error:errorMessage(error),loading:false});
    });
    return()=>controller.abort();
  },[date,employeeId,team,isFuture,retry]);
  const warehouseNames=useMemo(()=>new Map(warehouseOptions.map(w=>[w.id,w.name])),[warehouseOptions]);
  const allOrders=useMemo(()=>{
    if(!date||state.date!==date)return [];
    return (state.data?.orders||[]).map(o=>({...o,warehouseName:warehouseNames.get(o.warehouseId)||o.warehouseId||'—'}));
  },[date,state,warehouseNames]);
  const statuses=useMemo(()=>[...new Set(allOrders.map(o=>o.statusName))].filter(Boolean),[allOrders]);
  const filtered=useMemo(()=>{
    const q=search.toLocaleLowerCase('vi').trim();
    return allOrders.filter(o=>(!q||o.displayId.toLocaleLowerCase('vi').includes(q))&&(status==='all'||status===o.statusName)).sort((a,b)=>{
      if(sort==='amount_desc')return (b.amountThb??-1)-(a.amountThb??-1);
      if(sort==='amount_asc')return (a.amountThb??Infinity)-(b.amountThb??Infinity);
      return compareTime(a,b,sort==='time_asc');
    });
  },[allOrders,search,status,sort]);
  const summaryAmount=allOrders.reduce((s,o)=>s+(o.amountThb||0),0);
  const missingAmount=allOrders.some(o=>o.amountThb==null);
  if(!date)return null;
  return <div className="sd-day-drawer-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)onClose();}}>
    <aside className="sd-day-drawer" ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="sd-day-orders-title">
      <div className="sd-day-drawer-header">
        <div><small className="sd-day-drawer-eyebrow">CHI TIẾT ĐƠN TẠO TRONG NGÀY · {labels[team]||team}</small>
          <h2 id="sd-day-orders-title">Ngày {date.split('-').reverse().join('/')}</h2>
          <p>{employeeName||'Nhân viên đang chọn'} · Giờ Asia/Bangkok</p>
        </div>
        <button type="button" className="sd-day-drawer-close" ref={closeRef} onClick={onClose} aria-label="Đóng chi tiết đơn hàng">✕</button>
      </div>
      <div className="sd-day-drawer-body">
        {daySummary && <div className="sd-day-drawer-metrics">
          <div><small>Doanh số bảng ngày</small><strong>{daySummary.recorded ? `฿${money.format(daySummary.revenueThb||0)}` : '—'}</strong></div>
          <div><small>Số đơn báo cáo</small><strong>{daySummary.orders??'—'}</strong></div>
          <div><small>Đã điều chỉnh</small><strong>{daySummary.temporaryForecast ? 'Dự kiến' : daySummary.temporaryAdjusted ? 'Tạm' : 'Không'}</strong></div>
        </div>}
        {isFuture ? <div className="sd-day-drawer-empty">
          <strong>Ngày chưa tới</strong><p>Chỉ có doanh số dự kiến nếu anh đã chỉnh tạm; Pancake chưa phát sinh đơn hàng thực tế.</p>
        </div> : <>
          <p className="sd-day-drawer-explain">Danh sách lấy từ <strong>đơn tạo đúng ngày, đang gắn với nhân viên được chọn</strong> trên Pancake. Đơn đã hủy, mới tạo hoặc đổi người phụ trách có thể khiến số lượng khác báo cáo doanh số. Giờ hiển thị theo Asia/Bangkok.</p>
          {state.loading && <p className="sd-day-drawer-info" role="status">Đang lấy đơn hàng từ Pancake…</p>}
          {state.error && <div className="sd-day-drawer-error" role="alert"><p>{state.error}</p><button type="button" onClick={()=>setRetry(n=>n+1)}>Thử lại</button></div>}
          {!state.loading&&!state.error&&state.data && <>
            <div className="sd-day-drawer-metrics">
              <div><small>Đơn theo báo cáo</small><strong>{(daySummary?.orders??state.data.expectedCount??0).toLocaleString('vi-VN')}</strong></div>
              <div><small>Đơn tạo trong ngày · nhân viên</small><strong>{allOrders.length.toLocaleString('vi-VN')}</strong></div>
              <div><small>Giá trị đơn có chi tiết (THB)</small><strong>{missingAmount?'Chưa đủ dữ liệu':`฿${money.format(summaryAmount)}`}</strong></div>
            </div>
            <p className="sd-day-drawer-info" role="status">
              Số đơn từ danh sách theo ngày tạo có thể khác số đơn doanh số do trạng thái, thời điểm ghi nhận hoặc thay đổi nhân viên phụ trách. Không tự thêm hoặc xóa đơn để làm khớp số.
              {state.data.expectedCount!=null && daySummary?.orders!=null && daySummary.orders!==state.data.expectedCount && <> Báo cáo API đang ghi {state.data.expectedCount} đơn, trong khi bảng ngày ghi {daySummary.orders} đơn.</>}
            </p>
            {(state.data.truncated||state.data.outsideDate>0||state.data.unknownDate>0) && <p className="sd-day-drawer-info" role="status">
              {state.data.truncated && <>Danh sách Pancake có nhiều trang; hiện đã kiểm tra {state.data.scanned} đơn và có thể còn thiếu. </>}
              {state.data.outsideDate>0 && <>Đã loại {state.data.outsideDate} đơn có ngày tạo khác ngày đang chọn. </>}
              {state.data.unknownDate>0 && <>Đã bỏ {state.data.unknownDate} đơn thiếu giờ tạo hợp lệ.</>}
            </p>}
            {!allOrders.length && state.data.scanned>0 && <p className="sd-day-drawer-info" role="status">
              API đã trả {state.data.scanned} đơn để kiểm tra; {state.data.unmatchedEmployee||0} đơn thuộc nhân viên khác, {state.data.unassigned||0} đơn chưa có thông tin người phụ trách và {state.data.outsideDate||0} đơn ngoài ngày. Nếu vẫn thiếu đơn, cần kiểm tra quyền xem đơn hoặc trường nhân viên mà Pancake trả về.
            </p>}
            <div className="sd-day-drawer-tools">
              <input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm mã đơn…" aria-label="Tìm mã đơn" />
              <select aria-label="Lọc trạng thái đơn" value={status} onChange={e=>setStatus(e.target.value)}><option value="all">Tất cả trạng thái</option>{statuses.map(s=><option key={s} value={s}>{s}</option>)}</select>
              <select aria-label="Sắp xếp đơn hàng" value={sort} onChange={e=>setSort(e.target.value)}><option value="time_desc">Giờ tạo: mới nhất trước</option><option value="time_asc">Giờ tạo: cũ nhất trước</option><option value="amount_desc">Giá trị giảm dần</option><option value="amount_asc">Giá trị tăng dần</option></select>
              <button type="button" onClick={()=>downloadCsv(date,filtered)} disabled={!filtered.length}>Xuất CSV</button>
            </div>
            <div className="sd-day-drawer-table-scroll">
              <table className="sd-day-drawer-table">
                <thead><tr><th>Mã đơn</th><th>Thời gian tạo (Bangkok)</th><th>Giá trị THB</th><th>Trạng thái</th><th>SP</th><th>Kho</th><th>Nguồn</th></tr></thead>
                <tbody>{filtered.slice(0,visibleCount).map((o,index)=><tr key={`${o.id}:${index}`}>
                  <td><strong>{o.displayId||o.id}</strong></td>
                  <td>{displayTime(o.createdAt,o.createdAtMs)}</td>
                  <td className="sd-day-drawer-money">{o.amountThb==null?'—':`฿${money.format(o.amountThb)}`}</td>
                  <td>{o.statusName}</td><td>{o.quantity??'—'}</td><td>{o.warehouseName}</td><td>{o.source||'—'}</td>
                </tr>)}</tbody>
              </table>
            </div>
            {!filtered.length&&<p className="sd-day-drawer-empty">Không tìm thấy đơn được tạo trong ngày và gắn với nhân viên này theo dữ liệu Pancake trả về.</p>}
            {filtered.length>visibleCount&&<button type="button" className="sd-day-drawer-more" onClick={()=>setVisibleCount(n=>n+50)}>Xem thêm 50 đơn ({filtered.length-visibleCount} còn lại)</button>}
            <p className="sd-day-drawer-caption">Đang hiển thị {Math.min(filtered.length,visibleCount)} / {filtered.length} đơn theo ngày tạo và nhân viên. Không hiển thị thông tin cá nhân khách hàng; số này không phải số đơn chốt của báo cáo.</p>
          </>}
        </>}
      </div>
    </aside>
  </div>;
}
