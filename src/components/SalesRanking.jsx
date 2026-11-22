import { useEffect, useMemo, useState } from 'react';
import EmployeeSearch from './EmployeeSearch';
import { normalizeEmployeeSearch, progressColor, todayInBangkok } from '../pages/salesDashboardModel';
import { PERIODS, rankingRange, rankingRangeError, filterRanking, rankingShowsCompletion } from '../pages/salesRankingModel';
import { fetchSalesEmployees, fetchSalesRanking, salesErrorMessage } from '../services/salesService';

const format = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 });
const money = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });
const displayDate = (d) => d.split('-').reverse().join('/');

function MultiEmployees({ employees, selected, onChange, disabled }) {
  const [query, setQuery] = useState('');
  const ids = selected === null ? employees.map((p) => p.id) : selected;
  const active = new Set(ids);
  const count = employees.filter((p) => active.has(p.id)).length;
  const visible = employees.filter((p) => normalizeEmployeeSearch(p.name).includes(normalizeEmployeeSearch(query)));
  function toggle(id) { onChange(active.has(id) ? ids.filter((v) => v !== id) : [...ids, id]); }
  return <div className="sd-field sd-ranking-people">
    <span>NHÂN VIÊN (CHỌN NHIỀU)</span>
    <details className="sd-ranking-picker" onToggle={(e) => { if (!e.currentTarget.open) setQuery(''); }}>
      <summary aria-disabled={disabled}>{disabled ? 'Chưa tải nhân viên' : selected === null ? `Tất cả nhân viên (${count})` : `Đã chọn ${count}/${employees.length} nhân viên`} <span aria-hidden="true">⌄</span></summary>
      <div className="sd-ranking-menu">
        <input type="search" placeholder="Tìm tên nhân viên..." aria-label="Tìm nhiều nhân viên" value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="sd-ranking-actions"><button type="button" disabled={disabled} onClick={() => onChange(null)}>Chọn tất cả</button><button type="button" disabled={disabled} onClick={() => onChange([])}>Bỏ chọn tất cả</button></div>
        <div className="sd-ranking-options">{visible.length ? visible.map((p) => <label key={p.id}><input type="checkbox" disabled={disabled} checked={active.has(p.id)} onChange={() => toggle(p.id)} /><span>{p.name}</span></label>) : <p>Không tìm thấy nhân viên.</p>}</div>
        <small>{count} nhân viên được chọn · Bấm tiêu đề để đóng</small>
      </div>
    </details>
  </div>;
}

export default function SalesRanking({ warehouseOptions, refresh, rate = 780 }) {
  const today = todayInBangkok();
  const [warehouseChoice, setWarehouse] = useState(null);
  const warehouseId = warehouseChoice ?? warehouseOptions.find((w) => w.name.trim().toUpperCase() === 'VALLEY')?.id ?? null;
  const [selected, setSelected] = useState(null);
  const [period, setPeriod] = useState('today');
  const [customStart, setCustomStart] = useState(today);
  const [customEnd, setCustomEnd] = useState(today);
  const [retry, setRetry] = useState(0);
  const [employeeState, setEmployeeState] = useState({ scope: null, items: [], error: '' });
  const [report, setReport] = useState({ key: '', data: null, error: '', version: '' });
  const [start, end] = rankingRange(period, today, customStart, customEnd);
  const invalid = rankingRangeError(start, end, today);
  const showCompletion = rankingShowsCompletion(period);
  const lookupMonth = !invalid && start.slice(0, 7) === end.slice(0, 7) ? start.slice(0, 7) : undefined;
  const lookupStart = lookupMonth ? undefined : start;
  const lookupEnd = lookupMonth ? undefined : end;
  const scope = warehouseId === null || invalid ? null : warehouseId ? `${warehouseId}:${lookupMonth || `${lookupStart}:${lookupEnd}`}` : 'all';
  const key = `${start}:${end}`;
  const version = `${key}:${refresh}:${retry}`;
  const employees = useMemo(() => scope !== null && employeeState.scope === scope ? employeeState.items : [], [employeeState, scope]);
  const employeeError = scope !== null && employeeState.scope === scope ? employeeState.error : '';
  const employeeReady = scope !== null && employeeState.scope === scope && !employeeError;
  const data = !invalid && report.key === key ? report.data : null;
  const error = !invalid && report.key === key ? report.error : '';
  const rows = useMemo(() => filterRanking(data?.rows || [], employees, selected), [data, employees, selected]);
  const loading = !invalid && (!employeeReady || report.version !== version);

  useEffect(() => {
    if (scope === null) return;
    const controller = new AbortController();
    fetchSalesEmployees(warehouseId, lookupMonth, controller.signal, lookupStart, lookupEnd).then((items) => {
      if (!controller.signal.aborted) setEmployeeState({ scope, items, error: '' });
    }).catch((e) => {
      if (!controller.signal.aborted) setEmployeeState({ scope, items: [], error: salesErrorMessage(e) });
    });
    return () => controller.abort();
  }, [warehouseId, scope, lookupMonth, lookupStart, lookupEnd, refresh, retry]);

  useEffect(() => {
    if (invalid) return;
    const controller = new AbortController();
    fetchSalesRanking(start, end, controller.signal).then((result) => {
      if (!controller.signal.aborted) setReport({ key, data: result, error: '', version });
    }).catch((e) => {
      if (!controller.signal.aborted) setReport({ key, data: null, error: salesErrorMessage(e), version });
    });
    return () => controller.abort();
  }, [start, end, invalid, key, version]);

  function changeWarehouse(value) { setWarehouse(value); setSelected(null); }
  const totalOrders = rows.reduce((sum, row) => sum + row.orders, 0);
  const totalRevenue = rows.reduce((sum, row) => sum + row.revenueThb, 0);
  return <section className="sd-panel sd-ranking-panel" aria-label="Bảng thống kê nhân viên">
    <div className="sd-section-heading"><div><h2>Bảng thống kê nhân viên</h2></div><button type="button" className="sd-secondary" onClick={() => setRetry((n) => n + 1)}>↻ Làm mới</button></div>
    <div className="sd-ranking-filters">
      <EmployeeSearch employees={warehouseOptions} value={warehouseId} onChange={changeWarehouse} label="KHO HÀNG" noun="kho" emptyLabel="VALLEY" />
      <MultiEmployees key={warehouseId} employees={employees} selected={selected} onChange={setSelected} disabled={!employeeReady || !employees.length} />
      <label className="sd-field"><span>THỜI GIAN</span><select value={period} onChange={(e) => setPeriod(e.target.value)}>{PERIODS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      {period === 'custom' && <div className="sd-ranking-dates"><label className="sd-field"><span>TỪ NGÀY</span><input type="date" value={customStart} min="2000-01-01" max={today} onChange={(e) => setCustomStart(e.target.value)} /></label><label className="sd-field"><span>ĐẾN NGÀY</span><input type="date" value={customEnd} min="2000-01-01" max={today} onChange={(e) => setCustomEnd(e.target.value)} /></label></div>}
    </div>
    <div className="sd-ranking-meta"><span>{invalid ? 'Khoảng ngày chưa hợp lệ' : `${displayDate(start)} – ${displayDate(end)}`} · {rows.length} nhân viên</span><span role="status">{error || employeeError ? 'Lỗi tải dữ liệu' : invalid ? 'Chưa tải' : loading ? 'Đang đồng bộ...' : data ? `Cập nhật ${new Date(data.updatedAt).toLocaleTimeString('vi-VN', { timeZone: 'Asia/Bangkok' })} · Mỗi 1 phút` : ''}</span></div>
    {invalid && <p className="sd-alert" role="alert">{invalid}</p>}
    {(error || employeeError) && <p className="sd-alert" role="alert">{error || employeeError}</p>}
    {showCompletion && data?.targetError && <p className="sd-alert" role="alert">Không tải được mục tiêu từ cơ sở dữ liệu. Doanh số vẫn hiển thị.</p>}
    {warehouseId === null && <p className="sd-filter-note">Đang tìm kho VALLEY. Anh có thể chọn kho khác nếu không tìm thấy.</p>}
    {employeeReady && !employees.length && <p className="sd-alert sd-alert-neutral">Kho chưa có nhân viên phát sinh trong kỳ lọc. Chọn kỳ khác hoặc Tất cả các kho.</p>}
    <div className="sd-ranking-table-wrap" tabIndex={0} role="region" aria-label="Cuộn bảng xếp hạng">
      <table className={`sd-ranking-table${showCompletion ? ' sd-ranking-with-completion' : ''}`}>
        <thead><tr><th>Nhân viên</th><th>Đơn hàng</th><th aria-sort="descending">Doanh số (THB) ↓</th><th>Doanh số (VND)</th>{showCompletion && <th>Hoàn thành</th>}</tr></thead>
        <tbody>
          {rows.map((row, index) => <tr key={row.employeeId}>
            <td><span className={`sd-ranking-position sd-rank-${index + 1}`}>{String(index + 1).padStart(2, '0')}</span><strong>{row.name}</strong></td>
            <td>{format.format(row.orders)}</td>
            <td className="sd-ranking-money"><strong className="sd-ranking-revenue">฿{format.format(row.revenueThb)}</strong></td>
            <td className="sd-ranking-money"><strong className="sd-ranking-revenue-vnd">{money.format(row.revenueThb * rate)} ₫</strong></td>
            {showCompletion && <td>{row.completion === null ? <span className="sd-ranking-unset">{data.targetError ? 'Không tải được' : 'Chưa đặt'}</span> : <div className="sd-ranking-progress" title={`Mục tiêu: ${money.format(row.targetVnd)} ₫`}><span style={{ width: `${Math.max(0, Math.min(100, row.completion * 100))}%`, background: progressColor(row.completion) }} /><strong>{format.format(row.completion * 100)}%</strong></div>}</td>}
          </tr>)}
          {!rows.length && <tr><td colSpan={showCompletion ? 5 : 4} className="sd-ranking-empty">{invalid || error || employeeError ? 'Chưa có dữ liệu hiển thị.' : loading ? 'Đang tải dữ liệu...' : 'Chưa chọn nhân viên hoặc không có nhân viên phù hợp.'}</td></tr>}
        </tbody>
        {rows.length > 0 && <tfoot><tr><td>TỔNG ({rows.length})</td><td>{format.format(totalOrders)}</td><td className="sd-ranking-money">฿{format.format(totalRevenue)}</td><td className="sd-ranking-money">{money.format(totalRevenue * rate)} ₫</td>{showCompletion && <td>—</td>}</tr></tfoot>}
      </table>
    </div>
    
  </section>;
}
