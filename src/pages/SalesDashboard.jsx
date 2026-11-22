import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import EmployeeSearch from '../components/EmployeeSearch';
import EmployeeTargetManager from '../components/EmployeeTargetManager';
import SalesRanking from '../components/SalesRanking';
import {
  PROGRESS_COLORS, todayInBangkok, shiftMonth, progressColor,
  buildRows, calculateSummary, groupWeeklyRows, formatChartRevenue, getEmployeeTarget,
} from './salesDashboardModel';
import { fetchSalesEmployees, fetchSalesWarehouses, fetchDailySales, fetchExchangeRate, fetchEmployeeTargets, saveEmployeeTargets, salesErrorMessage } from '../services/salesService';
import './SalesDashboard.css';

const vi = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });
const rateFormat = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 });
const FIXED_RATE = 780;
const number = (value) => value == null ? '—' : vi.format(value);
const thb = (value) => value == null ? '—' : `฿${number(value)}`;
const vnd = (value) => value == null ? '—' : `${number(value)} ₫`;
const percent = (value) => value == null ? '—' : `${(value * 100).toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const shortDate = (date) => `${date.slice(8, 10)}/${date.slice(5, 7)}`;

function readSettings() {
  try { return JSON.parse(localStorage.getItem('pixelalbum-sales-dashboard-v1')) || {}; }
  catch { return {}; }
}

function Icon({ type, size = 19 }) {
  const paths = {
    chart: <><path d="M3 3v18h18"/><path d="m7 14 4-4 4 3 5-7"/></>,
    target: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></>,
    bag: <><rect x="4" y="7" width="16" height="14" rx="2"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    arrow: <path d="m14 7-5 5 5 5M9 12h12"/>,
    left: <path d="m14 6-6 6 6 6"/>,
    right: <path d="m9 6 6 6-6 6"/>,
    refresh: <><path d="M20 11a8 8 0 1 0-2 6M20 4v7h-7"/></>,
    download: <><path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[type]}</svg>;
}

function Metric({ label, value, note, icon, tone }) {
  return <article className={`sd-metric ${tone || ''}`}>
    <div className="sd-metric-head"><span>{label}</span><span className="sd-icon"><Icon type={icon}/></span></div>
    <strong className="sd-metric-value">{value}</strong><span className="sd-metric-note">{note}</span>
  </article>;
}

function StatsRow({ title, left, right, tone = '' }) {
  return <div className={`sd-stats-row ${tone ? `sd-stats-${tone}` : ''}`}>
    <span>{title}</span><strong>{left}</strong><strong>{right}</strong>
  </div>;
}

export default function SalesDashboard() {
  const today = todayInBangkok();
  const [month, setMonth] = useState(today.slice(0, 7));
  const [chosenEmployee, setEmployee] = useState('');
  const [warehouseId, setWarehouseId] = useState(null);
  const [warehouseState, setWarehouseState] = useState({ items: [], error: '', loaded: false });
  const [legacySettings] = useState(readSettings);
  const [targetState, setTargetState] = useState({ month: '', targets: null, canEdit: false, error: '' });
  const targetRequest = useRef(null);
  const [refresh, setRefresh] = useState(0);
  const [employeeState, setEmployeeState] = useState({ scope: '', items: [], error: '', version: -1 });
  const [salesState, setSalesState] = useState({ key: '', requestKey: '', rows: [], error: '', updatedAt: null });
  const [exchange, setExchange] = useState(null);
  const lookupMonth = month > today.slice(0, 7) ? today.slice(0, 7) : month;
  const scope = warehouseId === null ? '' : warehouseId ? `${warehouseId}:${lookupMonth}` : 'all';
  const employees = employeeState.scope === scope ? employeeState.items : [];
  const employee = employees.some((u) => u.id === chosenEmployee) ? chosenEmployee : '';
  const warehouseOptions = [{ id: '', name: 'Tất cả các kho' }, ...warehouseState.items];
  const listReady = warehouseId !== null && employeeState.scope === scope && employeeState.version === refresh;
  const noEmployees = listReady && !employeeState.error && !employees.length;
  const key = `${employee}:${month}`;
  const monthTargets = targetState.month === month ? targetState.targets : null;
  const targetError = targetState.month === month ? targetState.error : '';
  const targetVnd = monthTargets && employee ? getEmployeeTarget(monthTargets, employee, month) : null;
  const hasGoal = targetVnd > 0;
  const noGoal = Boolean(monthTargets && employee && !hasGoal);
  const goalLabel = hasGoal ? vnd(targetVnd) : noGoal ? 'Chưa đặt' : '—';
  const rate = FIXED_RATE;
  const name = employees.find((person) => person.id === employee)?.name || 'Chưa chọn nhân viên';
  const requestKey = `${key}:${refresh}`;
  const ready = Boolean(employee) && salesState.requestKey === requestKey && !salesState.error;
  const hasCurrentData = Boolean(employee) && salesState.key === key && !salesState.error;
  const error = (listReady ? employeeState.error : '') || (salesState.requestKey === requestKey ? salesState.error : '');
  const loading = !error && !noEmployees && (warehouseId === null ? !warehouseState.loaded && !warehouseState.error : !listReady || (!!employee && !ready));

  useEffect(() => {
    const timer = setInterval(() => setRefresh((n) => n + 1), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchSalesWarehouses(controller.signal).then((items) => {
      if (controller.signal.aborted) return;
      setWarehouseState({ items, error: '', loaded: true });
      setWarehouseId((previous) => previous !== null ? previous : (items.find((w) => w.name.trim().toUpperCase() === 'VALLEY')?.id ?? null));
    }).catch((e) => {
      if (!controller.signal.aborted) setWarehouseState((previous) => ({ ...previous, error: salesErrorMessage(e) }));
    });
    return () => controller.abort();
  }, [refresh]);

  useEffect(() => {
    if (warehouseId === null) return;
    const controller = new AbortController();
    fetchSalesEmployees(warehouseId, lookupMonth, controller.signal).then((items) => {
      if (!controller.signal.aborted) setEmployeeState({ scope, items, error: '', version: refresh });
    }).catch((e) => {
      if (!controller.signal.aborted) setEmployeeState({ scope, items: [], error: salesErrorMessage(e), version: refresh });
    });
    return () => controller.abort();
  }, [warehouseId, lookupMonth, scope, refresh]);

  useEffect(() => {
    const controller = new AbortController();
    targetRequest.current = controller;
    fetchEmployeeTargets(month, controller.signal).then((result) => {
      if (!controller.signal.aborted) setTargetState({ month, ...result, error: '' });
    }).catch((error) => {
      if (!controller.signal.aborted) setTargetState((previous) => ({ month, targets: previous.month === month ? previous.targets : null, canEdit: false, error: error?.response?.data?.message || 'Không tải được mục tiêu từ cơ sở dữ liệu.' }));
    });
    return () => { controller.abort(); if (targetRequest.current === controller) targetRequest.current = null; };
  }, [month, refresh]);

  useEffect(() => {
    const controller = new AbortController();
    fetchExchangeRate(controller.signal).then((result) => {
      if (!controller.signal.aborted) setExchange(result);
    }).catch(() => {
      if (!controller.signal.aborted) setExchange((previous) => previous ? { ...previous, stale: true } : { unavailable: true });
    });
    return () => controller.abort();
  }, [refresh]);

  useEffect(() => {
    if (!employee) return;
    const controller = new AbortController();
    fetchDailySales(month, employee, controller.signal).then((result) => {
      if (!controller.signal.aborted) setSalesState({ key, requestKey, rows: result.rows, error: '', updatedAt: result.updatedAt });
    }).catch((e) => {
      if (!controller.signal.aborted) setSalesState({ key, requestKey, rows: [], error: salesErrorMessage(e), updatedAt: null });
    });
    return () => controller.abort();
  }, [month, employee, key, requestKey]);

  function changeWarehouse(value) {
    if (value !== warehouseId) setEmployee('');
    setWarehouseId(value);
  }

  async function saveTargets(targetMonth, changes) {
    const result = await saveEmployeeTargets(targetMonth, changes);
    targetRequest.current?.abort();
    setTargetState((previous) => previous.month === targetMonth ? { ...previous, targets: { ...previous.targets, ...result.targets } } : previous);
    setRefresh((previous) => previous + 1);
  }

  const rows = useMemo(() => buildRows(month, hasCurrentData && !error ? salesState.rows : []), [month, hasCurrentData, error, salesState.rows]);
  const summary = useMemo(() => calculateSummary(rows, targetVnd, rate, today), [rows, targetVnd, rate, today]);
  const weekGroups = useMemo(() => groupWeeklyRows(rows, rate), [rows, rate]);
  const weeks = useMemo(() => new Map(weekGroups.map((week) => [week.endDate, week.totalVnd])), [weekGroups]);
  const maxRevenue = Math.max(1, ...rows.map((row) => row.revenueThb ?? 0));
  const fillWidth = Math.max(0, Math.min(100, (summary.ratio ?? 0) * 100));
  const color = summary.ratio == null ? '#e9eef4' : progressColor(summary.ratio);
  const [year, monthNumber] = month.split('-');

  function exportCsv() {
    const lines = [['Ngày', 'Số đơn', 'Doanh số THB', 'Doanh số VND', 'Tổng tuần VND'], ...rows.map((r) => [r.date, r.orders ?? '', r.revenueThb ?? '', r.recorded ? Math.round(r.revenueThb * rate) : '', weeks.get(r.date) == null ? '' : Math.round(weeks.get(r.date))])];
    const blob = new Blob(['\uFEFF', lines.map((line) => line.join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = `doanh-so-${month}-${employee}.csv`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <main className="sd-root">
    <header className="sd-topbar">
      <div className="sd-brand"><span className="sd-brand-mark"><Icon type="chart" size={22}/></span><div><strong>Dashboard</strong></div></div>
      <Link className="sd-back" to="/admin"><Icon type="arrow" size={17}/> Quản trị</Link>
    </header>
    <div className="sd-shell">
      <div className="sd-heading">
        <div><div className="sd-overline">BÁO CÁO DOANH SỐ</div><h1>Tổng quan tháng {Number(monthNumber)}/{year}</h1></div>
        <button type="button" className="sd-primary" disabled={loading} onClick={() => setRefresh((n) => n + 1)}><Icon type="refresh"/> {loading ? 'Đang tải...' : 'Đồng bộ ngay'}</button>
      </div>
      <div className="sd-filterbar">
        <EmployeeSearch employees={warehouseOptions} value={warehouseId} onChange={changeWarehouse} label="KHO HÀNG" noun="kho" emptyLabel="VALLEY" disabled={!warehouseState.loaded && !warehouseState.error}/>
        <EmployeeSearch employees={employees} value={employee} onChange={setEmployee} emptyLabel={listReady ? 'Chọn nhân viên' : 'Chưa tải nhân viên'}/>
        <label className="sd-field"><span>THÁNG BÁO CÁO</span><div className="sd-month"><button aria-label="Tháng trước" type="button" onClick={() => setMonth(shiftMonth(month, -1))}><Icon type="left"/></button><input aria-label="Tháng báo cáo" type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)}/><button aria-label="Tháng sau" type="button" onClick={() => setMonth(shiftMonth(month, 1))}><Icon type="right"/></button></div></label>
        <div className="sd-field"><span>MỤC TIÊU (VND)</span><a className="sd-target-link" href="#sd-employee-targets"><span>{goalLabel}</span><small>Chỉnh sửa ↓</small></a></div>
        <div className={`sd-status ${error ? 'sd-status-error' : ready ? 'sd-status-ok' : ''}`} role="status"><span className="sd-dot"/> {error ? 'Lỗi kết nối' : loading ? 'Đang đồng bộ' : 'Pancake POS'}<small>{hasCurrentData && !error && salesState.updatedAt ? new Date(salesState.updatedAt).toLocaleString('vi-VN', {timeZone:'Asia/Bangkok'}) : 'Tự tải mỗi 1 phút'}</small></div>
      </div>
      {error && <div className="sd-alert" role="alert">{error} <button type="button" onClick={() => setRefresh((n) => n + 1)}>Thử lại</button></div>}
      {warehouseState.error && <div className="sd-alert" role="alert">Không tải được danh sách kho: {warehouseState.error}</div>}
      {warehouseState.loaded && warehouseId === null && <div className="sd-alert" role="alert">Không tìm thấy kho VALLEY. Hãy chọn một kho trong danh sách.</div>}
      
      {listReady && employees.length > 0 && !employee && <div className="sd-alert sd-alert-neutral">Hãy chọn nhân viên để xem báo cáo cá nhân.</div>}
      {warehouseId && <p className="sd-filter-note">Kho chỉ lọc nhân viên có phát sinh trong báo cáo tháng {lookupMonth}. Doanh số và mục tiêu vẫn tính theo nhân viên trên tất cả các kho.</p>}
      {targetError && <div className="sd-alert" role="alert">{targetError}{monthTargets ? ' · Mục tiêu đang hiển thị là dữ liệu đã tải trước đó.' : ''} <button type="button" onClick={() => setRefresh((n) => n + 1)}>Thử lại</button></div>}
      {ready && !error && !salesState.rows.length && <div className="sd-alert sd-alert-neutral">Pancake chưa trả bản ghi cho nhân viên và tháng này. Các ngày chưa có dữ liệu được giữ trống.</div>}

      <section className="sd-metrics" aria-label="Chỉ số tổng quan">
        <Metric label="Tổng doanh số" value={vnd(summary.revenueVnd)} note={`${thb(summary.revenueThb)} · tỷ giá ${number(rate)}`} icon="chart" tone="sd-blue"/>
        <Metric label="Mục tiêu tháng" value={goalLabel} note={noGoal ? 'Thiết lập ở cuối trang' : hasGoal ? `${thb(summary.targetThb)} tương đương` : 'Chưa tải mục tiêu'} icon="target" tone="sd-purple"/>
        <Metric label="Tổng số đơn" value={number(summary.orders)} note={`${summary.recordedDays} ngày có dữ liệu`} icon="bag" tone="sd-green"/>
        <Metric label="Số ngày còn lại" value={summary.daysLeft === 0 ? 'HẾT THÁNG' : `${summary.daysLeft} ngày`} note={summary.daysLeft === 0 ? 'Kỳ báo cáo đã kết thúc' : summary.needPerDay == null ? 'Chưa có dữ liệu' : `${vnd(summary.needPerDay)} cần/ngày`} icon="calendar" tone="sd-orange"/>
      </section>

      <section className="sd-progress-card">
        <div className="sd-section-heading"><div><h2>Tiến độ hoàn thành mục tiêu</h2><p>{name} · tháng {Number(monthNumber)}/{year}</p></div><span className="sd-progress-tag" style={{ backgroundColor: `${color}45` }}>{summary.ratio == null ? (noGoal ? 'Chưa đặt mục tiêu' : 'Chưa có dữ liệu') : summary.ratio >= 1 ? 'Đã đạt mục tiêu' : 'Đang thực hiện'}</span></div>
        <div className="sd-progress-track" role="progressbar" aria-label="Tiến độ doanh số" aria-valuenow={summary.ratio == null ? undefined : Math.round(fillWidth)} aria-valuemin={0} aria-valuemax={100} aria-valuetext={noGoal ? 'Chưa đặt mục tiêu' : percent(summary.ratio)}>
          <div className="sd-progress-fill" style={{ width: `${fillWidth}%`, background: color }}/><strong>{percent(summary.ratio)}</strong>
        </div>
        <div className="sd-progress-details"><span>Đã đạt <b>{vnd(summary.revenueVnd)}</b></span><span>Còn thiếu <b>{vnd(summary.remainingVnd)}</b></span></div>
        <div className="sd-legend" aria-label="Thang 11 màu tiến độ">{PROGRESS_COLORS.map((c, i) => <div key={c}><span style={{ background: c }}/><small>{i * 10}%{i === 10 ? '+' : ''}</small></div>)}</div>
      </section>

      <div className="sd-main-grid">
        <section className="sd-panel sd-table-panel">
          <div className="sd-section-heading"><div><h2>Doanh số từng ngày</h2><p>Chi tiết theo lịch tháng · THB và VND</p></div><button type="button" className="sd-secondary" disabled={!ready || !!error || !summary.recordedDays} onClick={exportCsv}><Icon type="download"/> Xuất CSV</button></div>
          <div className="sd-table-wrap"><table className="sd-table"><thead><tr><th>Ngày</th><th>Số đơn</th><th>Doanh số THB</th><th>Doanh số VND</th><th>Tổng tuần VND</th></tr></thead>
            {weekGroups.map((week, weekIndex) => <tbody key={week.startDate} className={`sd-week-group ${weekIndex % 2 ? 'sd-week-alt' : ''}`}>
              {week.rows.map((r, index) => <tr key={r.date} className={`${r.date === today ? 'sd-today' : ''} ${!r.recorded ? 'sd-future' : ''}`}>
                <td><div className="sd-date"><b>{String(r.day).padStart(2, '0')}</b><span>{dayNames[r.weekday]}{r.date === today && <small>Hôm nay</small>}</span></div></td>
                <td className={r.recorded ? 'sd-daily-orders' : ''}>{number(r.orders)}</td>
                <td>{thb(r.revenueThb)}</td><td className={r.recorded ? 'sd-daily-vnd' : ''}>{vnd(r.recorded ? r.revenueThb * rate : null)}</td>
                {index === 0 && <td rowSpan={week.rows.length} className={`sd-week-total ${week.totalVnd == null ? 'sd-week-empty' : ''}`}>
                  <div className="sd-week-content"><small>{shortDate(week.startDate)}{week.startDate !== week.endDate ? ` – ${shortDate(week.endDate)}` : ''}</small><strong>{vnd(week.totalVnd)}</strong></div>
                </td>}
              </tr>)}
            </tbody>)}
          <tfoot><tr><td>TỔNG THÁNG</td><td>{number(summary.orders)}</td><td>{thb(summary.revenueThb)}</td><td className="sd-month-total">{vnd(summary.revenueVnd)}</td><td>{vnd(summary.revenueVnd)}</td></tr></tfoot></table></div>
        </section>

          <section className="sd-panel sd-summary"><div className="sd-section-heading"><div><h2>Thống kê mục tiêu</h2><p>Quy đổi theo tỷ giá cố định 780</p></div></div>
            <div className="sd-summary-stats">
              <div className="sd-stats-header"><span>Chỉ số</span><span>THB</span><span>VND</span></div>
              <StatsRow title="Tỷ giá" left="฿1" right={vnd(rate)}/>
              <StatsRow title="Mục tiêu" left={thb(summary.targetThb)} right={goalLabel} tone="target"/>
              <StatsRow title="Tổng doanh số" left={thb(summary.revenueThb)} right={vnd(summary.revenueVnd)} tone="revenue"/>
              <StatsRow title="Cần thêm" left={thb(summary.remainingThb)} right={vnd(summary.remainingVnd)} tone={summary.remainingVnd === 0 ? 'revenue' : 'remaining'}/>
              <StatsRow title="Mỗi ngày cần" left={summary.daysLeft ? thb(summary.needThbPerDay) : 'HẾT THÁNG'} right={summary.daysLeft ? vnd(summary.needPerDay) : 'HẾT THÁNG'} tone="daily"/>
            </div>
            <div className="sd-completion" style={{ background: color }}><span>HOÀN THÀNH</span><strong>{percent(summary.ratio)}</strong></div>
            <div className="sd-converted">
              <div><span>Doanh số (750)</span><strong>{vnd(summary.revenue750)}</strong><small>1 THB = 750 VND</small></div>
              <div><span>Doanh số (trực tuyến)</span><strong>{vnd(summary.revenueThb != null && exchange?.rate ? summary.revenueThb * exchange.rate : null)}</strong><small>{exchange?.rate ? `1 THB = ${rateFormat.format(exchange.rate)} VND` : exchange?.unavailable ? 'Không lấy được tỷ giá' : 'Đang tải tỷ giá...'}</small>{exchange?.rate && <small>{exchange.stale ? 'Dữ liệu cũ · ' : 'Cập nhật · '}{new Date(exchange.updatedAt).toLocaleString('vi-VN', { timeZone: 'Asia/Bangkok' })}</small>}</div>
            </div>
            <div className="sd-rate-source"><a href="https://www.exchangerate-api.com" target="_blank" rel="noreferrer">Rates By Exchange Rate API</a> · Tỷ giá tham khảo, cập nhật hằng ngày</div>
          </section>
      </div>
      <section className="sd-panel sd-chart-panel"><div className="sd-section-heading"><div><h2>Biểu đồ doanh số</h2><p>Doanh số ngày · THB</p></div><span className="sd-chart-unit">฿</span></div>
        <div className="sd-chart" aria-label="Biểu đồ doanh số theo ngày">{rows.map((r) => <div key={r.date} className="sd-bar-col" title={`${r.date}: ${thb(r.revenueThb)}`}><div className="sd-bar-space"><div className={`sd-bar ${r.date === today ? 'sd-bar-current' : ''}`} style={{ height: `${r.recorded && r.revenueThb > 0 ? Math.max(2, r.revenueThb / maxRevenue * 100) : 0}%` }}>{r.recorded && <span className="sd-bar-label">{formatChartRevenue(r.revenueThb)}</span>}</div></div><small>{r.day}</small></div>)}</div>
      </section>
      <SalesRanking warehouseOptions={warehouseOptions} refresh={refresh} rate={rate}/>
      <EmployeeTargetManager employees={employees} month={month} onMonthChange={setMonth} warehouseId={warehouseId} warehouseOptions={warehouseOptions} onWarehouseChange={changeWarehouse} targets={monthTargets} legacyTargets={legacySettings.targets} error={targetError} canEdit={targetState.month === month && targetState.canEdit && !targetError} onSave={saveTargets} rate={rate}/>
      <footer className="sd-footer">Pancake POS · Đồng bộ mỗi 1 phút khi dashboard mở · Múi giờ Asia/Bangkok · Mục tiêu lưu trong cơ sở dữ liệu</footer>
    </div>
  </main>;
}
