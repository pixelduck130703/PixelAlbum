import { useEffect, useMemo, useState } from 'react';
import DashboardHeader from '../dashboard-shared/DashboardHeader';
import { todayInBangkok, normalizeEmployeeSearch } from '../sales/models/salesDashboardModel';
import { fetchSalesWarehouses, fetchExchangeRate, salesErrorMessage } from '../../services/salesService';
import { PERIODS, rangeForPeriod, dateRangeError } from '../warehouse/models/warehouseModel';
import { fetchSaleReport } from './saleService';
import { completeSaleDays } from './models/saleChartModel';
import '../sales/SalesDashboard.css';
import './SaleDashboard.css';

const fmt = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 });
const number = value => value == null || !Number.isFinite(value) ? '—' : fmt.format(value);
const thb = value => value == null || !Number.isFinite(value) ? '—' : `${fmt.format(value)} ฿`;
const vnd = value => value == null || !Number.isFinite(value) ? '—' : `${fmt.format(Math.round(value))} đ`;
const RATE_KEY = 'pixelalbum-sales-dashboard-rate-mode';
const RATE_OPTIONS = [['750', '750'], ['online', 'Trực tuyến'], ['780', '780']];
const ROLES = [
  ['assign', 'Nhân viên được phân công'],
  ['create', 'Nhân viên tạo đơn'],
  ['update', 'Nhân viên cập nhật trạng thái'],
];
// V19.8: mặc định chỉ hiển thị cột cần thiết, các cột bổ sung mở theo nhu cầu.
const COLUMNS = [
  { key: 'name', title: 'Nhân viên' },
  { key: 'orders', title: 'Đơn chốt', hint: 'Đơn chốt theo trạng thái và thời điểm đang chọn, KHÔNG phải Đơn tạo mới.' },
  { key: 'productCount', title: 'Số SP', hint: 'Sản phẩm bán thực từ API Pancake' },
  { key: 'revenueThb', title: 'Tiền hàng', hint: 'Trường price của Pancake, chưa cộng phí VC thu của khách' },
  { key: 'discountThb', title: 'Chiết khấu' },
  { key: 'shippingFeeThb', title: 'Phí VC khách' },
  { key: 'salesThb', title: 'Doanh số (THB)', hint: 'Tiền hàng + Phí VC thu khách, khi đủ dữ liệu' },
  { key: 'revenueVnd', title: 'Doanh số (VND)' },
];
const EXTRA_COLUMNS = [
  { key: 'avgPriceThb', title: 'GTTB', hint: 'Giá bán trung bình API trả về, tính theo số đơn' },
  { key: 'returnShippingFeeThb', title: 'Phí trả hàng VC', hint: 'Chỉ hiển thị nếu API trả về' },
  { key: 'costThb', title: 'Giá vốn', hint: 'Chỉ hiển thị nếu API trả về' },
];
const SUCCESS_STATUSES = [['1','Đã xác nhận'], ['send_to_partner','Đã gửi ĐVVC']];
const SUCCESS_RECORDS = [['inserted_at','Ngày tạo đơn'], ['updated_at','Ngày cập nhật trạng thái']];
const fieldAmount = new Set(['revenueThb', 'avgPriceThb', 'discountThb', 'shippingFeeThb', 'returnShippingFeeThb', 'costThb', 'salesThb']);
const readRate = () => { try { const v = localStorage.getItem(RATE_KEY); return RATE_OPTIONS.some(([value]) => value === v) ? v : '750'; } catch { return '750'; } };
const shortDay = iso => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
const weekday = iso => ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][new Date(`${iso}T00:00:00Z`).getUTCDay()];
function safeCsv(value) { const s = String(value ?? ''); const clean = /^[=+@\-\t\r]/.test(s) ? `'${s}` : s; return `"${clean.replaceAll('"', '""')}"`; }
function downloadCsv(filename, records) {
  const csv = '\uFEFF' + records.map(row => row.map(safeCsv).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function totalFor(rows, field) {
  return rows.every(row => typeof row[field] === 'number' && Number.isFinite(row[field]))
    ? rows.reduce((sum, row) => sum + row[field], 0) : null;
}
function averageFor(rows) {
  const complete = rows.every(row => row.avgPriceThb != null && Number.isFinite(row.avgPriceThb));
  if (!complete) return null;
  const count = rows.reduce((sum, row) => sum + row.orders, 0);
  return count > 0 ? rows.reduce((sum, row) => sum + row.avgPriceThb * row.orders, 0) / count : null;
}
function TableNumber({ value, field, rate }) {
  const displayed = field === 'revenueVnd' ? vnd(value == null ? null : value * rate)
    : fieldAmount.has(field) ? thb(value) : number(value);
  return <span className={field === 'salesThb' ? 'sa-blue-number' : field === 'revenueVnd' ? 'sa-green-number' : ''}>{displayed}</span>;
}

export default function SaleDashboard() {
  const today = todayInBangkok();
  // Mặc định luôn xem Hôm nay, không ghi nhớ kỳ cũ.
  const [period, setPeriod] = useState('today');
  const [customStart, setCustomStart] = useState(today);
  const [customEnd, setCustomEnd] = useState(today);
  const [warehouseId, setWarehouseId] = useState('');
  const [warehouses, setWarehouses] = useState([]);
  const [warehouseError, setWarehouseError] = useState('');
  const [role, setRole] = useState('assign');
  const [successStatus, setSuccessStatus] = useState('1');
  const [successRecord, setSuccessRecord] = useState('inserted_at');
  const [showExtra, setShowExtra] = useState(false);
  const [rateMode, setRateMode] = useState(readRate);
  const [exchange, setExchange] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState({ key: 'salesThb', desc: true });
  const [report, setReport] = useState({ key: '', data: null, error: '', loading: true });
  const [start, end] = useMemo(() => rangeForPeriod(period, today, customStart, customEnd), [period, today, customStart, customEnd]);
  const invalid = dateRangeError(start, end, today);
  const key = `${start}:${end}:${warehouseId}:${role}:${successStatus}:${successRecord}:${refresh}`;
  const ready = !invalid && report.key === key && !report.loading && !report.error && Boolean(report.data);
  const data = ready ? report.data : null;
  const live = Number(exchange?.rate);
  const liveValid = Number.isFinite(live) && live > 0;
  const rate = rateMode === '780' ? 780 : rateMode === 'online' && liveValid ? live : 750;
  const roleLabel = ROLES.find(([id]) => id === role)?.[1] || ROLES[0][1];
  const statusLabel = SUCCESS_STATUSES.find(([id]) => id === successStatus)?.[1] || 'Đã xác nhận';
  const recordLabel = SUCCESS_RECORDS.find(([id]) => id === successRecord)?.[1] || 'Ngày tạo đơn';
  const columns = useMemo(() => showExtra ? [...COLUMNS, ...EXTRA_COLUMNS] : COLUMNS, [showExtra]);
  const rows = useMemo(() => {
    const q = normalizeEmployeeSearch(query);
    const filtered = (data?.rows || []).filter(row => !q || normalizeEmployeeSearch(row.name).includes(q));
    return filtered.sort((a, b) => {
      const get = row => sort.key === 'revenueVnd' ? (row.salesThb == null ? null : row.salesThb * rate) : row[sort.key];
      const av = get(a), bv = get(b);
      if (av == null && bv != null) return 1;
      if (bv == null && av != null) return -1;
      const diff = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av ?? '').localeCompare(String(bv ?? ''), 'vi');
      return (sort.desc ? -diff : diff) || (b.salesThb ?? b.revenueThb) - (a.salesThb ?? a.revenueThb) || a.name.localeCompare(b.name, 'vi');
    });
  }, [data, query, sort, rate]);
  // Tất cả thanh biểu đồ dùng CÙNG chỉ số; không trộn doanh số và tiền hàng.
  const hasSales = rows.length > 0 && rows.every(row => typeof row.salesThb === 'number' && Number.isFinite(row.salesThb));
  const chartField = hasSales ? 'salesThb' : 'revenueThb';
  const chartRows = useMemo(() => [...rows].sort((a, b) => b[chartField] - a[chartField]).slice(0, 12), [rows, chartField]);
  const chartMax = chartRows.reduce((max, row) => Math.max(max, row[chartField]), 0);
  const shownTotals = useMemo(() => ({
    orders: rows.reduce((sum, row) => sum + row.orders, 0),
    productCount: totalFor(rows, 'productCount'),
    revenueThb: rows.reduce((sum, row) => sum + row.revenueThb, 0),
    salesThb: totalFor(rows, 'salesThb'),
    avgPriceThb: averageFor(rows),
    discountThb: totalFor(rows, 'discountThb'),
    shippingFeeThb: totalFor(rows, 'shippingFeeThb'),
    returnShippingFeeThb: totalFor(rows, 'returnShippingFeeThb'),
    costThb: totalFor(rows, 'costThb'),
  }), [rows]);
  const daily = useMemo(() => data ? completeSaleDays(start, end, data.daily) : [], [data, start, end]);
  const dayField = ready && daily.every(day => typeof day.salesThb === 'number') ? 'salesThb' : 'revenueThb';
  const dayMax = daily.reduce((max, row) => Math.max(max, row[dayField] || 0), 0);
  const missingFields = ready && rows.length > 0 && ['productCount', 'discountThb', 'shippingFeeThb'].some(field => shownTotals[field] === null);

  useEffect(() => { try { localStorage.setItem(RATE_KEY, rateMode); } catch {} }, [rateMode]);
  useEffect(() => { const id = setInterval(() => setRefresh(n => n + 1), 60000); return () => clearInterval(id); }, []);
  useEffect(() => {
    const controller = new AbortController();
    setWarehouseError('');
    fetchSalesWarehouses(controller.signal).then(setWarehouses).catch(e => { if (!controller.signal.aborted) setWarehouseError(salesErrorMessage(e)); });
    return () => controller.abort();
  }, [refresh]);
  useEffect(() => {
    const controller = new AbortController();
    fetchExchangeRate(controller.signal).then(setExchange).catch(() => setExchange(prev => prev ? { ...prev, stale: true } : null));
    return () => controller.abort();
  }, [refresh]);
  useEffect(() => {
    if (invalid) return undefined;
    const controller = new AbortController();
    setReport({ key, data: null, error: '', loading: true });
    fetchSaleReport(start, end, role, warehouseId, controller.signal, successStatus, successRecord).then(result => {
      if (!controller.signal.aborted) setReport({ key, data: result, error: '', loading: false });
    }).catch(e => {
      if (!controller.signal.aborted) setReport({ key, data: null, error: salesErrorMessage(e), loading: false });
    });
    return () => controller.abort();
  }, [start, end, role, warehouseId, successStatus, successRecord, refresh, key, invalid]);

  function toggleSort(field) { setSort(current => ({ key: field, desc: current.key === field ? !current.desc : field !== 'name' })); }
  function csvExport() {
    if (!data) return;
    downloadCsv(`sale-${role}-${start}_${end}.csv`, [
      [...COLUMNS.map(c => c.title), ...EXTRA_COLUMNS.map(c => c.title), 'Vai trò', 'Đơn chốt theo', 'Ghi nhận ngày', 'Ngày bắt đầu', 'Ngày kết thúc'],
      ...rows.map(row => [row.name, row.orders, row.productCount, row.revenueThb, row.discountThb, row.shippingFeeThb, row.salesThb, row.salesThb == null ? null : Math.round(row.salesThb * rate), row.avgPriceThb, row.returnShippingFeeThb, row.costThb, roleLabel, statusLabel, recordLabel, start, end]),
      ['TỔNG', shownTotals.orders, shownTotals.productCount, shownTotals.revenueThb, shownTotals.discountThb, shownTotals.shippingFeeThb, shownTotals.salesThb, shownTotals.salesThb == null ? null : Math.round(shownTotals.salesThb * rate), shownTotals.avgPriceThb, shownTotals.returnShippingFeeThb, shownTotals.costThb, roleLabel, statusLabel, recordLabel, start, end],
    ]);
  }

  return <main className="sd-root sa-root">
    <DashboardHeader active="sale" />
    <div className="sd-shell sa-shell">
      <section className="sa-panel sa-report-panel" aria-label="Báo cáo bán hàng Sale">
        <div className="sa-topbar">
          <div><h1>Doanh số Sale</h1><span className="sa-report-caption">{roleLabel} · {start === end ? shortDay(start) : `${shortDay(start)} – ${shortDay(end)}`}</span></div>
          <div className="sa-toolbar-actions">
            <button type="button" className="sa-btn" onClick={() => setRefresh(n => n + 1)} disabled={report.loading && report.key === key}>↻ Làm mới</button>
            <button type="button" className="sa-btn" disabled={!ready} onClick={csvExport}>↓ Xuất CSV</button>
          </div>
        </div>
        <div className="sa-filter-row">
          <label><span>Thời gian</span><select value={period} onChange={e => setPeriod(e.target.value)} aria-label="Chọn thời gian báo cáo">{PERIODS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
          {period === 'custom' && <>
            <label><span>Từ ngày</span><input type="date" value={customStart} max={today} onChange={e => setCustomStart(e.target.value)} /></label>
            <label><span>Đến ngày</span><input type="date" value={customEnd} max={today} onChange={e => setCustomEnd(e.target.value)} /></label>
          </>}
          <label><span>Kho hàng</span><select value={warehouseId} onChange={e => setWarehouseId(e.target.value)}><option value="">Tất cả kho</option>{warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></label>
          <label><span>Tỉ giá</span><select value={rateMode} onChange={e => setRateMode(e.target.value)}>{RATE_OPTIONS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
          <label className="sa-filter-search"><span>Tìm nhân viên</span><input type="search" placeholder="Tên nhân viên..." value={query} onChange={e => setQuery(e.target.value)} /></label>
        </div>
        <details className="sa-advanced">
          <summary>Tùy chọn đối chiếu Pancake <span aria-hidden="true">⌄</span></summary>
          <div className="sa-advanced-grid">
            <label><span>Ghi nhận theo nhân viên</span><select value={role} onChange={e => setRole(e.target.value)}>{ROLES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
            <label><span>Trạng thái chốt đơn</span><select value={successStatus} onChange={e => setSuccessStatus(e.target.value)}>{SUCCESS_STATUSES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
            <label><span>Ngày ghi nhận đơn chốt</span><select value={successRecord} onChange={e => setSuccessRecord(e.target.value)}>{SUCCESS_RECORDS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
          </div>
        </details>
        {invalid && <div role="alert" className="sa-alert">{invalid}</div>}
        {warehouseError && <div role="alert" className="sa-alert">Không tải được kho: {warehouseError}</div>}
        {report.error && <div role="alert" className="sa-alert">{report.error} <button type="button" onClick={() => setRefresh(n => n + 1)}>Thử lại</button></div>}
        {rateMode === 'online' && !liveValid && <div role="status" className="sa-alert sa-warn">Không lấy được tỉ giá trực tuyến, đang sử dụng 750 VND/THB.</div>}
        {ready && <div className="sa-stat-grid" aria-label="Tổng quan doanh số Sale">
          <div className="sa-stat"><span>Đơn chốt</span><strong>{number(shownTotals.orders)}</strong></div>
          <div className="sa-stat"><span>Số SP</span><strong>{number(shownTotals.productCount)}</strong></div>
          <div className="sa-stat sa-stat-blue"><span>Doanh số THB</span><strong>{thb(shownTotals.salesThb)}</strong></div>
          <div className="sa-stat sa-stat-green"><span>Quy đổi VND</span><strong>{vnd(shownTotals.salesThb == null ? null : shownTotals.salesThb * rate)}</strong></div>
        </div>}
        <div className="sa-table-heading"><strong>Chi tiết theo nhân viên</strong><button type="button" className="sa-btn sa-details-btn" aria-pressed={showExtra} onClick={() => setShowExtra(v => !v)}>{showExtra ? 'Ẩn cột bổ sung' : 'Hiện cột bổ sung'}</button></div>
        <div className="sa-table-scroll" role="region" aria-label="Bảng doanh số Sale có cuộn ngang" tabIndex={0}>
          <table className="sa-table">
            <thead><tr>{columns.map(col => <th key={col.key} scope="col" aria-sort={sort.key === col.key ? (sort.desc ? 'descending' : 'ascending') : undefined}>
              <button type="button" className="sa-sort-button" onClick={() => toggleSort(col.key)} title={col.hint || col.title}>{col.title}<span aria-hidden="true">{sort.key === col.key ? (sort.desc ? ' ↓' : ' ↑') : ' ↕'}</span></button>
            </th>)}</tr></thead>
            <tbody>{ready && rows.map((row, i) => <tr key={row.employeeId}>
              <td className="sa-sticky-name"><span className="sa-position">{String(i + 1).padStart(2, '0')}</span><span className="sa-person-name" title={row.name}>{row.name}</span></td>
              {columns.slice(1).map(col => <td key={col.key} className={col.key === 'salesThb' ? 'sa-focus-thb' : col.key === 'revenueVnd' ? 'sa-focus-vnd' : ''}>
                <TableNumber field={col.key} value={col.key === 'revenueVnd' ? row.salesThb : row[col.key]} rate={rate} />
              </td>)}
            </tr>)}
            {(!ready || !rows.length) && <tr><td className="sa-empty" colSpan={columns.length}>{invalid ? 'Ngày báo cáo chưa hợp lệ.' : report.error ? 'Không tải được dữ liệu.' : !ready ? 'Đang tải số liệu Sale...' : 'Không có nhân viên phát sinh trong kỳ này.'}</td></tr>}</tbody>
            {ready && <tfoot><tr><th scope="row">Tổng{query ? ` (${rows.length})` : ''}</th>{columns.slice(1).map(col => <td key={col.key}><TableNumber field={col.key} value={col.key === 'revenueVnd' ? shownTotals.salesThb : shownTotals[col.key]} rate={rate} /></td>)}</tr></tfoot>}
          </table>
        </div>
        <div className="sa-table-footline"><span>{ready ? `${rows.length} nhân viên · ${statusLabel.toLowerCase()} · ${recordLabel.toLowerCase()}` : 'Đang đồng bộ...'} · Đơn chốt khác Đơn tạo mới</span><span>{missingFields || (ready && shownTotals.salesThb === null) ? '— = API chưa trả đủ chỉ số' : ''}</span></div>
      </section>
      <section className="sa-panel sa-employee-chart" aria-label="Biểu đồ doanh số Sale theo nhân viên">
        <div className="sa-section-head"><h2>{hasSales ? 'Xếp hạng doanh số Sale' : 'Xếp hạng tiền hàng'}</h2><span>Top {Math.min(chartRows.length, 12)} · THB</span></div>
        {ready && chartRows.length ? <div className="sa-ranking-bars">
          {chartRows.map((row, index) => <div className="sa-bar-row" key={row.employeeId}>
            <span className="sa-bar-name"><em>{String(index + 1).padStart(2, '0')}</em><strong title={row.name}>{row.name}</strong></span>
            <div className="sa-bar-track"><div className="sa-bar-fill" style={{ width: `${chartMax > 0 ? Math.max(0, row[chartField] / chartMax * 100) : 0}%` }} /></div>
            <strong className="sa-bar-value">{thb(row[chartField])}</strong>
          </div>)}
        </div> : <p className="sa-empty">{ready ? 'Chưa có doanh số để vẽ biểu đồ.' : 'Đang tải biểu đồ...'}</p>}
      </section>
      {start !== end && <section className="sa-panel sa-daily" aria-label="Biểu đồ doanh số theo ngày">
        <div className="sa-section-head"><h2>{dayField === 'salesThb' ? 'Doanh số theo ngày' : 'Tiền hàng theo ngày'}</h2><span>THB</span></div>
        <div className="sa-daily-body" role="region" aria-label="Cuộn biểu đồ doanh số theo ngày" tabIndex={0}>
          {ready && daily.length ? <div className="sa-day-bars">{daily.map(d => <div className="sa-day-item" key={d.date} title={`${d.date} · ${thb(d[dayField])} · ${number(d.orders)} đơn`}>
            <span className="sa-day-amount">{d[dayField] > 0 ? thb(d[dayField]) : '—'}</span>
            <div className="sa-day-track"><div className="sa-day-fill" style={{ height: `${dayMax > 0 ? Math.max(0, d[dayField] / dayMax * 100) : 0}%` }} /></div>
            <span className="sa-day-number">{d.date.slice(8, 10)}</span><span className="sa-day-weekday">{weekday(d.date)}</span>
          </div>)}</div> : <p className="sa-empty">{ready ? 'Chưa có dữ liệu theo ngày.' : 'Đang tải số liệu...'}</p>}
        </div>
      </section>}
      <p className="sa-sync-status" role="status">{ready ? `Cập nhật ${new Date(data.updatedAt).toLocaleTimeString('vi-VN', { timeZone: 'Asia/Bangkok' })} · Tự làm mới mỗi phút` : 'Báo cáo nhân viên theo Pancake POS'} · 1 THB = {decimal.format(rate)} VND</p>
    </div>
  </main>;
}
