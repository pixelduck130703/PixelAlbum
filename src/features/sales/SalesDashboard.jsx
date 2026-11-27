import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import EmployeeSearch from './components/EmployeeSearch';
import EmployeeTargetManager from './components/EmployeeTargetManager';
import SalesRanking from './components/SalesRanking';
import DayOrdersDrawer from './components/DayOrdersDrawer';
import {
  PROGRESS_COLORS, todayInBangkok, shiftMonth, daysInMonth, progressColor,
  buildRows, calculateSummary, groupWeeklyRows, formatChartRevenue, getEmployeeTarget,
} from './models/salesDashboardModel';
import { fetchSalesEmployees, fetchSalesWarehouses, fetchSalesRanking, fetchDailySales, fetchExchangeRate, fetchEmployeeTargets, saveEmployeeTargets, salesErrorMessage } from '../../services/salesService';
import { SALES_FILTER_KEYS, readPersonalFilters, saveSalesFilters, resolveWarehouseChoice } from './utils/salesFilterStorage';
import {
  readTemporaryRevenue, writeTemporaryRevenue, normalizeTemporaryRevenue,
  applyTemporaryRevenue, parseTemporaryThb, temporaryRevenueStorageKey,
} from './utils/salesTemporaryRevenue';
import { calculateSalesChartGuides } from './models/salesChartGuides';
import './SalesDashboard.css';
import './V19_10_GOAL_MARKETING.css';
import DashboardHeader from '../dashboard-shared/DashboardHeader';
import { fetchSaleMarketingEmployees, fetchSaleMarketingRanking, fetchSaleMarketingDaily, fetchSaleMarketingTargets, saveSaleMarketingTargets } from '../sale/saleMarketingAdapter';

const vi = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });
const rateFormat = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 });
const DEFAULT_RATE_MODE = '750';
const RATE_MODE_KEY = 'pixelalbum-sales-dashboard-rate-mode';
function storedRateMode() {
  try {
    const stored = localStorage.getItem(RATE_MODE_KEY);
    return ['750', 'online', '780'].includes(stored) ? stored : DEFAULT_RATE_MODE;
  } catch { return DEFAULT_RATE_MODE; }
}
const number = (value) => value == null ? '—' : vi.format(value);
const thb = (value) => value == null ? '—' : `฿${number(value)}`;
const vnd = (value) => value == null ? '—' : `${number(value)} ₫`;
const percent = (value) => value == null ? '—' : `${(value * 100).toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const shortWeekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
// Cùng cách chia tuần thứ Hai–Chủ Nhật như bảng doanh số từng ngày.
const WEEK_CHART_COLORS = ['#759BB8', '#45A199', '#9784BD', '#D29A50', '#C9757B', '#6489BD'];
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
    pencil: <><path d="m16 4 4 4-12 12H4v-4L16 4z"/><path d="m14 6 4 4"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    undo: <><path d="M3 7v6h6"/><path d="M3 13a9 9 0 1 1 3 6"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[type]}</svg>;
}

function Metric({ label, value, note, icon, tone }) {
  return <article className={`sd-metric ${tone || ''}`}>
    <div className="sd-metric-head"><span>{label}</span><span className="sd-icon"><Icon type={icon}/></span></div>
    <strong className="sd-metric-value">{value}</strong>{note && <span className="sd-metric-note">{note}</span>}
  </article>;
}

function StatsRow({ title, left, right, tone = '' }) {
  return <div className={`sd-stats-row ${tone ? `sd-stats-${tone}` : ''}`}>
    <span className="sd-stats-label">{title}</span><strong className="sd-stats-thb">{left}</strong><strong className="sd-stats-vnd">{right}</strong>
  </div>;
}

export default function SalesDashboard({ team = 'marketing' }) {
  const isSale = team === 'sale';
  const personFiltersKey = isSale ? 'pixelalbum-sale-personal-filters-v1' : SALES_FILTER_KEYS.personal;
  const today = todayInBangkok();
  const [initialFilters] = useState(() => readPersonalFilters(today, isSale ? {getItem: () => localStorage.getItem('pixelalbum-sale-personal-filters-v1')} : undefined));
  const [month, setMonth] = useState(() => {
    try { const value=new URLSearchParams(window.location.search).get('goalMonth'); return value&&/^20\d{2}-(0[1-9]|1[0-2])$/.test(value)?value:initialFilters.month; }
    catch { return initialFilters.month; }
  });
  const [chosenEmployee, setEmployee] = useState(initialFilters.chosenEmployee);
  const [warehouseChoice, setWarehouseChoice] = useState(initialFilters.warehouseChoice);
  const [warehouseState, setWarehouseState] = useState({ items: [], error: '', loaded: false });
  const [legacySettings] = useState(readSettings);
  const [targetState, setTargetState] = useState({ month: '', targets: null, canEdit: false, error: '' });
  const targetRequest = useRef(null);
  const [refresh, setRefresh] = useState(0);
  const [employeeState, setEmployeeState] = useState({ scope: '', items: [], error: '', version: -1 });
  const [activeSalesState, setActiveSalesState] = useState({ month: '', ids: null, error: '', version: -1 });
  const [salesState, setSalesState] = useState({ key: '', requestKey: '', rows: [], error: '', updatedAt: null, measureLabel: 'Doanh số' });
  const [exchange, setExchange] = useState(null);
  const [fxRetry, setFxRetry] = useState(0);
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedRateMode, setSelectedRateMode] = useState(storedRateMode);
  const [temporaryRevenue, setTemporaryRevenue] = useState({ scope: '', entries: {} });
  const [revenueDrafts, setRevenueDrafts] = useState({ scope: '', values: {} });
  const [editingRevenueScope, setEditingRevenueScope] = useState('');
  const [temporaryNotice, setTemporaryNotice] = useState(null);
  const warehouseOptions = [{ id: '', name: 'Tất cả các kho' }, ...warehouseState.items];
  const warehouseId = resolveWarehouseChoice(warehouseChoice, warehouseOptions);
  const lookupMonth = month > today.slice(0, 7) ? today.slice(0, 7) : month;
  const scope = warehouseId === null ? '' : warehouseId ? `${warehouseId}:${lookupMonth}` : 'all';
  const employees = employeeState.scope === scope ? employeeState.items : [];
  // Danh sách kho (và phần đặt mục tiêu) vẫn giữ dữ liệu gốc từ Pancake.
  // Riêng bộ lọc nhân viên chỉ cho chọn người có doanh thu DƯƠNG trong tháng báo cáo.
  const activeIds = activeSalesState.month === month ? activeSalesState.ids : null;
  const activeReady = activeSalesState.month === month && activeSalesState.version === refresh;
  const activeError = activeReady ? activeSalesState.error : '';
  const selectableEmployees = useMemo(() => {
    if (activeIds === null) return [];
    const ids = new Set(activeIds);
    return employees.filter((person) => ids.has(person.id));
  }, [employees, activeIds]);
  const employee = (warehouseChoice === null || warehouseChoice === warehouseId) && selectableEmployees.some((u) => u.id === chosenEmployee) ? chosenEmployee : '';
  const listReady = warehouseId !== null && employeeState.scope === scope && employeeState.version === refresh;
  const noEmployees = listReady && activeReady && !employeeState.error && !activeError && !selectableEmployees.length;
  const key = `${isSale ? 'sale:' : ''}${employee}:${month}`;
  const monthTargets = targetState.month === month ? targetState.targets : null;
  const targetError = targetState.month === month ? targetState.error : '';
  const targetVnd = monthTargets && employee ? getEmployeeTarget(monthTargets, employee, month) : null;
  const hasGoal = targetVnd > 0;
  const noGoal = Boolean(monthTargets && employee && !hasGoal);
  const goalLabel = hasGoal ? vnd(targetVnd) : noGoal ? 'Chưa đặt' : '—';
  const liveRate = Number(exchange?.rate);
  const hasLiveRate = Number.isFinite(liveRate) && liveRate > 0;
  const rate = selectedRateMode === '780' ? 780 : selectedRateMode === 'online' && hasLiveRate ? liveRate : 750;
  const onlineRateOffline = selectedRateMode === 'online' && !hasLiveRate;
  const requestKey = `${key}:${refresh}`;
  const ready = Boolean(employee) && salesState.requestKey === requestKey && !salesState.error;
  const hasCurrentData = Boolean(employee) && salesState.key === key && !salesState.error;
  const canEditTemporaryRevenue = Boolean(employee && hasCurrentData && targetState.month === month && targetState.canEdit && !targetError);
  const isEditingRevenue = canEditTemporaryRevenue && editingRevenueScope === key;
  const storedOverrides = canEditTemporaryRevenue && temporaryRevenue.scope === key ? temporaryRevenue.entries : {};
  const currentDrafts = revenueDrafts.scope === key ? revenueDrafts.values : {};
  const adjustedDates = Object.keys(storedOverrides).length;
  const error = (listReady ? employeeState.error : '') || activeError || (salesState.requestKey === requestKey ? salesState.error : '');
  const loading = !error && !noEmployees && (warehouseId === null ? !warehouseState.loaded && !warehouseState.error : !listReady || !activeReady || (!!employee && !ready));

  useEffect(() => {
    saveSalesFilters(personFiltersKey, { month, warehouseChoice, chosenEmployee });
  }, [month, warehouseChoice, chosenEmployee, personFiltersKey]);

  useEffect(() => {
    try { localStorage.setItem(RATE_MODE_KEY, selectedRateMode); } catch { /* private browsing */ }
  }, [selectedRateMode]);

  // Các điều chỉnh là dữ liệu riêng tại trình duyệt, tách theo nhân viên/tháng.
  // Đọc lại khi thay nhân viên hoặc tháng; không ghi vào API/backend.
  useEffect(() => {
    const [employeeId, selectedMonth] = [employee, month];
    const localEmployeeId = isSale ? `sale-assign-${employeeId}` : employeeId;
    const load = () => setTemporaryRevenue({ scope: key, entries: readTemporaryRevenue(localEmployeeId, selectedMonth) });
    load();
    const onStorage = (event) => {
      if (event.key === temporaryRevenueStorageKey(localEmployeeId, selectedMonth)) load();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [key, employee, month, isSale]);

  useEffect(() => {
    const timer = setInterval(() => setRefresh((n) => n + 1), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchSalesWarehouses(controller.signal).then((items) => {
      if (controller.signal.aborted) return;
      setWarehouseState({ items, error: '', loaded: true });
    }).catch((e) => {
      if (!controller.signal.aborted) setWarehouseState((previous) => ({ ...previous, error: salesErrorMessage(e) }));
    });
    return () => controller.abort();
  }, [refresh]);

  useEffect(() => {
    if (warehouseId === null) return;
    const controller = new AbortController();
    (isSale ? fetchSaleMarketingEmployees : fetchSalesEmployees)(warehouseId, lookupMonth, controller.signal).then((items) => {
      if (!controller.signal.aborted) setEmployeeState({ scope, items, error: '', version: refresh });
    }).catch((e) => {
      if (!controller.signal.aborted) setEmployeeState({ scope, items: [], error: salesErrorMessage(e), version: refresh });
    });
    return () => controller.abort();
  }, [warehouseId, lookupMonth, scope, refresh, isSale]);

  // Một truy vấn thống kê theo tháng, không kiểm tra từng nhân viên riêng lẻ.
  // /sales/ranking đã có sẵn từ V12 và trả revenueThb theo nhân viên trên tất cả các kho.
  useEffect(() => {
    if (month > today.slice(0, 7)) {
      setActiveSalesState({ month, ids: [], error: '', version: refresh });
      return undefined;
    }
    const controller = new AbortController();
    const start = `${month}-01`;
    const last = `${month}-${String(daysInMonth(month)).padStart(2, '0')}`;
    const end = last < today ? last : today;
    (isSale ? fetchSaleMarketingRanking : fetchSalesRanking)(start, end, controller.signal).then(({ rows }) => {
      if (!controller.signal.aborted) {
        setActiveSalesState({ month, ids: rows.filter((row) => row.revenueThb > 0).map((row) => row.employeeId), error: '', version: refresh });
      }
    }).catch((cause) => {
      if (!controller.signal.aborted) {
        // Nếu làm mới thất bại, giữ danh sách đã xác minh của cùng tháng, không hiện lại 316 tài khoản.
        setActiveSalesState((previous) => ({
          month, ids: previous.month === month ? previous.ids : null,
          error: salesErrorMessage(cause), version: refresh,
        }));
      }
    });
    return () => controller.abort();
  }, [month, today, refresh, isSale]);

  useEffect(() => {
    const controller = new AbortController();
    targetRequest.current = controller;
    (isSale ? fetchSaleMarketingTargets : fetchEmployeeTargets)(month, controller.signal).then((result) => {
      if (!controller.signal.aborted) setTargetState({ month, ...result, error: '' });
    }).catch((error) => {
      if (!controller.signal.aborted) setTargetState((previous) => ({ month, targets: previous.month === month ? previous.targets : null, canEdit: false, error: error?.response?.data?.message || 'Không tải được mục tiêu từ cơ sở dữ liệu.' }));
    });
    return () => { controller.abort(); if (targetRequest.current === controller) targetRequest.current = null; };
  }, [month, refresh, isSale]);

  useEffect(() => {
    const controller = new AbortController();
    fetchExchangeRate(controller.signal).then((result) => {
      if (!controller.signal.aborted) setExchange(result);
    }).catch(() => {
      if (!controller.signal.aborted) setExchange((previous) => previous ? { ...previous, stale: true } : { unavailable: true });
    });
    return () => controller.abort();
  }, [refresh, fxRetry]);

  useEffect(() => {
    if (!employee) return;
    const controller = new AbortController();
    (isSale ? fetchSaleMarketingDaily : fetchDailySales)(month, employee, controller.signal).then((result) => {
      if (!controller.signal.aborted) setSalesState({ key, requestKey, rows: result.rows, error: '', updatedAt: result.updatedAt, measureLabel: result.measureLabel || 'Doanh số' });
    }).catch((e) => {
      if (!controller.signal.aborted) setSalesState({ key, requestKey, rows: [], error: salesErrorMessage(e), updatedAt: null });
    });
    return () => controller.abort();
  }, [month, employee, key, requestKey, isSale]);

  function changeWarehouse(value) {
    if (value !== warehouseId || (warehouseChoice !== null && warehouseChoice !== warehouseId)) setEmployee('');
    setWarehouseChoice(value);
  }

  function changeEmployee(value) {
    setWarehouseChoice(warehouseId);
    setEmployee(value);
  }

  async function saveTargets(targetMonth, changes) {
    const result = await (isSale ? saveSaleMarketingTargets : saveEmployeeTargets)(targetMonth, changes);
    targetRequest.current?.abort();
    setTargetState((previous) => previous.month === targetMonth ? { ...previous, targets: { ...previous.targets, ...result.targets } } : previous);
    setRefresh((previous) => previous + 1);
  }

  const originalRows = useMemo(() => buildRows(month, hasCurrentData && !error ? salesState.rows : []), [month, hasCurrentData, error, salesState.rows]);
  const normalizedDrafts = useMemo(() => normalizeTemporaryRevenue(currentDrafts, originalRows), [currentDrafts, originalRows]);
  const activeOverrides = isEditingRevenue ? normalizedDrafts.entries : storedOverrides;
  const rows = useMemo(() => applyTemporaryRevenue(originalRows, canEditTemporaryRevenue ? activeOverrides : {}, today), [originalRows, activeOverrides, canEditTemporaryRevenue, today]);
  const hasAdjustedRevenue = rows.some((row) => row.temporaryAdjusted);
  const futureForecastDays = rows.filter((row) => row.temporaryForecast).length;
  const summary = useMemo(() => calculateSummary(rows, targetVnd, rate, today), [rows, targetVnd, rate, today]);
  const weekGroups = useMemo(() => groupWeeklyRows(rows, rate), [rows, rate]);
  const weeks = useMemo(() => new Map(weekGroups.map((week) => [week.endDate, week.totalVnd])), [weekGroups]);
  const chartGuides = useMemo(
    () => calculateSalesChartGuides(rows, today, targetVnd, rate),
    [rows, today, targetVnd, rate],
  );
  const chartScale = Math.max(
    1,
    ...rows.map((row) => row.revenueThb ?? 0),
    chartGuides.averageThb ?? 0,
    chartGuides.neededThb ?? 0,
  ) * 1.12;
  const chartHeight = (value) => Math.max(0, Math.min(100, ((value ?? 0) / chartScale) * 100));
  const fillWidth = Math.max(0, Math.min(100, (summary.ratio ?? 0) * 100));
  const color = summary.ratio == null ? '#e9eef4' : progressColor(summary.ratio);
  const [year, monthNumber] = month.split('-');
  const detailRow = rows.find(row => row.date === selectedDay) || null;
  const detailEmployee = selectableEmployees.find(person => person.id === employee);
  const closeDayOrders = useCallback(() => setSelectedDay(''), []);
  const openDayOrders = useCallback((date) => { if (employee && hasCurrentData) setSelectedDay(date); }, [employee, hasCurrentData]);
  useEffect(() => { setSelectedDay(''); }, [key]);

  function beginTemporaryEdit() {
    if (!canEditTemporaryRevenue) return;
    setRevenueDrafts({ scope: key, values: Object.fromEntries(Object.entries(storedOverrides).map(([date, value]) => [date, String(value)])) });
    setEditingRevenueScope(key);
    setTemporaryNotice(null);
  }

  function updateTemporaryDraft(date, value) {
    if (!isEditingRevenue) return;
    setRevenueDrafts((previous) => ({ scope: key, values: { ...(previous.scope === key ? previous.values : {}), [date]: value } }));
    setTemporaryNotice(null);
  }

  function saveTemporaryEdits() {
    if (!isEditingRevenue || normalizedDrafts.invalidDates.length) return;
    try {
      writeTemporaryRevenue(isSale ? `sale-assign-${employee}` : employee, month, normalizedDrafts.entries);
      setTemporaryRevenue({ scope: key, entries: normalizedDrafts.entries });
      setEditingRevenueScope('');
      setTemporaryNotice({ scope: key, error: false, message: Object.keys(normalizedDrafts.entries).length
        ? `Đã lưu tạm ${Object.keys(normalizedDrafts.entries).length} ngày trên trình duyệt này.`
        : 'Đã trở về doanh thu thực từ Pancake POS.' });
    } catch {
      setTemporaryNotice({ scope: key, error: true, message: 'Không lưu được điều chỉnh trên trình duyệt này. Hãy kiểm tra chế độ riêng tư hoặc bộ nhớ trình duyệt.' });
    }
  }

  function discardTemporaryEdits() {
    setEditingRevenueScope('');
    setTemporaryNotice(null);
  }

  function resetTemporaryRevenue() {
    if (!canEditTemporaryRevenue || (!adjustedDates && !hasAdjustedRevenue)) return;
    if (!window.confirm(`Khôi phục doanh thu Pancake gốc cho nhân viên đang chọn, tháng ${month}? Điều chỉnh tạm của tháng này sẽ bị xóa.`)) return;
    try {
      writeTemporaryRevenue(isSale ? `sale-assign-${employee}` : employee, month, {});
      setTemporaryRevenue({ scope: key, entries: {} });
      setRevenueDrafts({ scope: key, values: {} });
      setEditingRevenueScope('');
      setTemporaryNotice({ scope: key, error: false, message: 'Đã khôi phục doanh số gốc. Các lần đồng bộ tiếp theo vẫn lấy từ Pancake POS.' });
    } catch {
      setTemporaryNotice({ scope: key, error: true, message: 'Không thể xóa điều chỉnh đã lưu. Vui lòng kiểm tra quyền lưu trữ trình duyệt.' });
    }
  }

  function renderRevenueCell(row, mobile = false) {
    const amount = thb(row.revenueThb);
    if (!isEditingRevenue) {
      return <span className={row.temporaryAdjusted ? 'sd-temp-value' : ''}>{amount}{row.temporaryAdjusted && <small className="sd-temp-asterisk" title="Doanh số đã chỉnh tạm"> •</small>}</span>;
    }
    const entered = Object.hasOwn(currentDrafts, row.date) ? currentDrafts[row.date] : originalRows.find((original) => original.date === row.date)?.revenueThb ?? '';
    const invalid = String(entered).trim() !== '' && parseTemporaryThb(entered) === null;
    return <span className={`sd-revenue-edit-cell ${mobile ? 'sd-revenue-edit-mobile' : ''}`}>
      <input type="text" inputMode="numeric" className="sd-revenue-input" value={entered}
        aria-label={`Doanh số THB ngày ${row.date}`} aria-invalid={invalid}
        title="Nhập THB nguyên, ví dụ 10240 hoặc 10.240"
        onChange={(event) => updateTemporaryDraft(row.date, event.target.value)}/>
      {row.temporaryAdjusted && <button type="button" className="sd-revenue-day-reset" title="Trả về doanh số gốc của ngày" aria-label={`Khôi phục ngày ${row.date}`} onClick={() => updateTemporaryDraft(row.date, '')}>↺</button>}
    </span>;
  }

  function exportCsv() {
    const metric = isSale && salesState.measureLabel === 'Tiền hàng' ? 'Tiền hàng' : 'Doanh số';
    const headers = ['Ngày', 'Số đơn', `${metric} THB`, `${metric} VND`, 'Tổng tuần VND'];
    if (hasAdjustedRevenue) headers.push('Doanh số THB gốc (Pancake)', 'Nguồn doanh số');
    const originalByDate = new Map(originalRows.map((row) => [row.date, row]));
    const lines = [headers, ...rows.map((r) => {
      const cells = [r.date, r.orders ?? '', r.revenueThb ?? '', r.recorded ? Math.round(r.revenueThb * rate) : '', weeks.get(r.date) == null ? '' : Math.round(weeks.get(r.date))];
      if (hasAdjustedRevenue) cells.push(originalByDate.get(r.date)?.revenueThb ?? '', r.temporaryAdjusted ? (r.temporaryForecast ? 'Dự kiến - điều chỉnh tạm' : 'Điều chỉnh tạm') : 'Pancake POS');
      return cells;
    })];
    const blob = new Blob(['\uFEFF', lines.map((line) => line.join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = `${isSale ? 'sale-' : ''}doanh-so-${hasAdjustedRevenue ? 'dieu-chinh-' : ''}${month}-${employee}.csv`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <main className="sd-root">
    <DashboardHeader active={team}/>
    <div className="sd-shell">
      <div className="sd-heading">
        <div><div className="sd-overline">{isSale ? 'DOANH SỐ SALE' : 'BÁO CÁO DOANH SỐ'}</div><h1>Tổng quan tháng {Number(monthNumber)}/{year}</h1></div>
        <button type="button" className="sd-primary" disabled={loading} onClick={() => setRefresh((n) => n + 1)}><Icon type="refresh"/> {loading ? 'Đang tải...' : 'Đồng bộ ngay'}</button>
      </div>
      <nav className="sd-mobile-only sd-mobile-nav" aria-label="Đi nhanh đến báo cáo">
        <a href="#sd-summary">Thống kê</a><a href="#sd-daily">Theo ngày</a><a href="#sd-chart">Biểu đồ</a><a href="#sd-ranking">Xếp hạng</a><a href="#sd-goal-center">Mục tiêu</a>
      </nav>
      <div className="sd-filterbar">
        <EmployeeSearch employees={warehouseOptions} value={warehouseId} onChange={changeWarehouse} label="KHO HÀNG" noun="kho" emptyLabel="VALLEY" disabled={!warehouseState.loaded && !warehouseState.error}/>
        <EmployeeSearch employees={selectableEmployees} value={employee} onChange={changeEmployee} emptyLabel={activeError ? 'Lỗi lọc nhân viên' : noEmployees ? 'Không có doanh thu tháng này' : listReady && activeReady ? 'Chọn nhân viên' : 'Đang lọc nhân viên...'}/>
        <label className="sd-field"><span>THÁNG BÁO CÁO</span><div className="sd-month"><button aria-label="Tháng trước" type="button" onClick={() => setMonth(shiftMonth(month, -1))}><Icon type="left"/></button><input aria-label="Tháng báo cáo" type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)}/><button aria-label="Tháng sau" type="button" onClick={() => setMonth(shiftMonth(month, 1))}><Icon type="right"/></button></div></label>
        <div className="sd-field"><span>MỤC TIÊU (VND)</span><a className="sd-target-link" href="#sd-goal-center"><span>{goalLabel}</span><small>Chỉnh sửa ↓</small></a></div>
        <label className="sd-field sd-rate-group"><span>TỈ GIÁ (VND/THB)</span><select aria-label="Chọn tỉ giá quy đổi" value={selectedRateMode} onChange={(event) => setSelectedRateMode(event.target.value)}><option value="750">750</option><option value="online">Trực tuyến</option><option value="780">780</option></select>{onlineRateOffline && <small className="sd-fx-inline-status" role="status">{exchange?.unavailable ? 'Mất kết nối tỉ giá · đang tạm tính 750' : 'Đang tải tỉ giá · tạm tính 750'}</small>}{selectedRateMode === 'online' && hasLiveRate && exchange?.stale && <small className="sd-fx-inline-status" role="status">Đang dùng tỉ giá cũ đã lưu</small>}</label>
        <div className={`sd-status ${error ? 'sd-status-error' : ready ? 'sd-status-ok' : ''}`} role="status"><span className="sd-dot"/> {error ? 'Lỗi kết nối' : loading ? 'Đang đồng bộ' : 'Pancake POS'}<small>{hasCurrentData && !error && salesState.updatedAt ? new Date(salesState.updatedAt).toLocaleString('vi-VN', {timeZone:'Asia/Bangkok'}) : 'Tự tải mỗi 1 phút'}</small></div>
      </div>
      {onlineRateOffline && exchange?.unavailable && <div className="sd-alert" role="alert">Không kết nối được nguồn tỉ giá THB/VND. Lúc này lựa chọn “Trực tuyến” đang tạm quy đổi bằng 750, KHÔNG phải tỉ giá thị trường. <button type="button" onClick={() => { setExchange(null); setFxRetry((n) => n + 1); }}>Thử lại tỉ giá</button></div>}
      {error && <div className="sd-alert" role="alert">{error} <button type="button" onClick={() => setRefresh((n) => n + 1)}>Thử lại</button></div>}
      {warehouseState.error && <div className="sd-alert" role="alert">Không tải được danh sách kho: {warehouseState.error}</div>}
      {warehouseState.loaded && warehouseId === null && <div className="sd-alert" role="alert">Không tìm thấy kho VALLEY. Hãy chọn một kho trong danh sách.</div>}
      {noEmployees && <div className="sd-alert sd-alert-neutral">Không có nhân viên đạt doanh thu dương trong tháng {month} với kho đang chọn. Anh có thể chọn tháng hoặc kho khác.</div>}
      {listReady && activeReady && selectableEmployees.length > 0 && !employee && <div className="sd-alert sd-alert-neutral">Hãy chọn nhân viên có doanh thu trong tháng để xem báo cáo cá nhân.</div>}
      {warehouseId && <p className="sd-filter-note">Kho chỉ lọc danh sách nhân viên; doanh số và mục tiêu vẫn tính trên tất cả các kho.</p>}
      {targetError && <div className="sd-alert" role="alert">{targetError}{monthTargets ? ' · Mục tiêu đang hiển thị là dữ liệu đã tải trước đó.' : ''} <button type="button" onClick={() => setRefresh((n) => n + 1)}>Thử lại</button></div>}
      {ready && !error && !salesState.rows.length && <div className="sd-alert sd-alert-neutral">Pancake chưa trả bản ghi cho nhân viên và tháng này. Các ngày chưa có dữ liệu được giữ trống.</div>}
      {hasAdjustedRevenue && <div className="sd-temp-banner" role="status"><strong>Doanh thu đang được điều chỉnh tạm</strong><span>{isEditingRevenue ? 'Đang xem trước số liệu nhập.' : 'Đang dùng số đã lưu trên trình duyệt này.'} {futureForecastDays > 0 ? `${futureForecastDays} ngày tương lai là doanh số DỰ KIẾN, đã được cộng vào các tổng hiển thị.` : ''} Dữ liệu Pancake và bảng xếp hạng nhân viên không thay đổi.</span></div>}

      {isSale && salesState.measureLabel === 'Tiền hàng' && hasCurrentData && <div className="sd-alert sd-alert-neutral" role="status">Pancake chưa trả đủ phí vận chuyển thu khách. Các chỉ số Sale ở đây đang là <strong>Tiền hàng</strong>, chưa phải Doanh số đầy đủ.</div>}

      <section className="sd-metrics" aria-label="Chỉ số tổng quan">
        <Metric label={`${isSale && salesState.measureLabel === 'Tiền hàng' ? 'Tổng tiền hàng' : 'Tổng doanh số'}${futureForecastDays ? ' (có dự kiến)' : ''}`} value={vnd(summary.revenueVnd)} note={thb(summary.revenueThb)} icon="chart" tone="sd-blue"/>
        <Metric label="Mục tiêu tháng" value={goalLabel} note={noGoal ? 'Chưa đặt mục tiêu' : hasGoal ? thb(summary.targetThb) : ''} icon="target" tone="sd-purple"/>
        <Metric label="Tổng số đơn" value={number(summary.orders)} note={null} icon="bag" tone="sd-green"/>
        <Metric label="Số ngày còn lại" value={summary.daysLeft === 0 ? 'HẾT THÁNG' : `${summary.daysLeft} ngày`} note={null} icon="calendar" tone="sd-orange"/>
      </section>

      <section className="sd-progress-card">
        <div className="sd-section-heading"><div><h2>Tiến độ hoàn thành mục tiêu</h2></div><span className="sd-progress-tag" style={{ backgroundColor: `${color}45` }}>{summary.ratio == null ? (noGoal ? 'Chưa đặt mục tiêu' : 'Chưa có dữ liệu') : summary.ratio >= 1 ? 'Đã đạt mục tiêu' : 'Đang thực hiện'}</span></div>
        <div className="sd-progress-track" role="progressbar" aria-label="Tiến độ doanh số" aria-valuenow={summary.ratio == null ? undefined : Math.round(fillWidth)} aria-valuemin={0} aria-valuemax={100} aria-valuetext={noGoal ? 'Chưa đặt mục tiêu' : percent(summary.ratio)}>
          <div className="sd-progress-fill" style={{ width: `${fillWidth}%`, background: color }}/><strong>{percent(summary.ratio)}</strong>
        </div>
        <div className="sd-progress-details"><span>Đã đạt <b>{vnd(summary.revenueVnd)}</b></span><span>Còn thiếu <b>{vnd(summary.remainingVnd)}</b></span></div>
        <div className="sd-legend" aria-label="Thang 11 màu tiến độ">{PROGRESS_COLORS.map((c, i) => <div key={c}><span style={{ background: c }}/><small>{i * 10}%{i === 10 ? '+' : ''}</small></div>)}</div>
      </section>

      <div className="sd-main-grid">
        <section className="sd-panel sd-table-panel" id="sd-daily">
          <div className="sd-section-heading sd-revenue-header"><div><h2>{isSale && salesState.measureLabel === 'Tiền hàng' ? 'Tiền hàng từng ngày' : 'Doanh số từng ngày'}</h2>{(isEditingRevenue || adjustedDates > 0) && <small className="sd-temporary-subtitle">{isEditingRevenue ? 'Đang nhập thử · chưa lưu' : `${adjustedDates} ngày đã chỉnh tạm`}</small>}</div>
            <div className="sd-revenue-actions">
              {canEditTemporaryRevenue && (isEditingRevenue ? <>
                <button type="button" className="sd-primary sd-revenue-save" disabled={normalizedDrafts.invalidDates.length > 0} onClick={saveTemporaryEdits}><Icon type="check" size={16}/> Lưu tạm</button>
                <button type="button" className="sd-secondary" onClick={discardTemporaryEdits}>Hủy</button>
              </> : <button type="button" className="sd-secondary sd-edit-toggle" onClick={beginTemporaryEdit}><Icon type="pencil" size={16}/> Chỉnh tạm</button>)}
              {canEditTemporaryRevenue && (adjustedDates > 0 || (isEditingRevenue && hasAdjustedRevenue)) && <button type="button" className="sd-secondary sd-revenue-reset" onClick={resetTemporaryRevenue}><Icon type="undo" size={16}/> Khôi phục gốc</button>}
              <button type="button" className="sd-secondary" disabled={!ready || !!error || !summary.recordedDays || (isEditingRevenue && normalizedDrafts.invalidDates.length > 0)} onClick={exportCsv}><Icon type="download"/> Xuất CSV</button>
            </div>
          </div>
          {isEditingRevenue && <p className="sd-revenue-edit-note">Có thể nhập THB cho <strong>mọi ngày trong tháng</strong>, kể cả ngày chưa tới. Ngày tương lai là <strong>dự kiến</strong> và được cộng vào các thống kê tạm; không sửa dữ liệu Pancake. Để trống để bỏ điều chỉnh, nhập 0 để đặt doanh số bằng 0.</p>}
          {isEditingRevenue && normalizedDrafts.invalidDates.length > 0 && <p className="sd-revenue-validation" role="alert">{normalizedDrafts.invalidDates.length} ô THB chưa hợp lệ. Chỉ nhập số nguyên không âm (ví dụ: 10.240).</p>}
          {temporaryNotice?.scope === key && <p className={`sd-revenue-feedback ${temporaryNotice.error ? 'sd-revenue-validation' : ''}`} role="status">{temporaryNotice.message}</p>}
          <div className="sd-table-wrap"><table className="sd-table sd-table-desktop">
            <colgroup>
              <col className="sd-daily-col-date" />
              <col className="sd-daily-col-orders" />
              <col className="sd-daily-col-thb" />
              <col className="sd-daily-col-vnd" />
              <col className="sd-daily-col-week" />
            </colgroup>
            <thead><tr><th>Ngày</th><th>Số đơn</th><th>Doanh số THB</th><th>Doanh số VND</th><th>Tổng tuần VND</th></tr></thead>
            {weekGroups.map((week, weekIndex) => <tbody key={week.startDate} className={`sd-week-group ${weekIndex % 2 ? 'sd-week-alt' : ''}`}>
              {week.rows.map((r, index) => <tr key={r.date} className={`${r.date === today ? 'sd-today' : ''} ${!r.recorded ? 'sd-future' : ''} ${r.temporaryAdjusted ? 'sd-temp-row' : ''} {r.temporaryForecast ? 'sd-forecast-row' : ''}`}>
                <td><div className="sd-date"><b><button type="button" className="sd-day-details-btn" disabled={!employee || !hasCurrentData} onClick={() => openDayOrders(r.date)} title={`Xem đơn hàng ngày ${r.date}`} aria-label={`Xem chi tiết đơn hàng ngày ${r.date}`}>{String(r.day).padStart(2, '0')}</button></b><span>{dayNames[r.weekday]}{r.date === today && <small>Hôm nay</small>}</span></div></td>
                <td className={r.recorded ? 'sd-daily-orders' : ''}>{number(r.orders)}</td>
                <td className={r.temporaryAdjusted ? 'sd-temp-thb-cell' : ''}>{renderRevenueCell(r)}</td><td className={r.recorded ? 'sd-daily-vnd' : ''}>{vnd(r.recorded ? r.revenueThb * rate : null)}</td>
                {index === 0 && <td rowSpan={week.rows.length} className={`sd-week-total ${week.totalVnd == null ? 'sd-week-empty' : ''}`}>
                  <div className="sd-week-content"><small>{shortDate(week.startDate)}{week.startDate !== week.endDate ? ` – ${shortDate(week.endDate)}` : ''}</small><strong>{vnd(week.totalVnd)}</strong></div>
                </td>}
              </tr>)}
            </tbody>)}
          <tfoot><tr><td>TỔNG THÁNG{hasAdjustedRevenue && <small className="sd-total-temporary-label">{futureForecastDays ? 'Có số dự kiến' : 'Đã chỉnh tạm'}</small>}</td><td>{number(summary.orders)}</td><td>{thb(summary.revenueThb)}</td><td className="sd-month-total">{vnd(summary.revenueVnd)}</td><td>{vnd(summary.revenueVnd)}</td></tr></tfoot></table>
          <table className="sd-table sd-table-mobile sd-mobile-only" aria-label="Doanh số từng ngày trên điện thoại">
            <colgroup><col className="sd-mobile-col-day"/><col className="sd-mobile-col-thb"/><col className="sd-mobile-col-week"/></colgroup>
            <thead><tr><th scope="col">Ngày</th><th scope="col">Doanh số THB</th><th scope="col">Tổng tuần VND</th></tr></thead>
            {weekGroups.map((week, weekIndex) => <tbody key={week.startDate} className={`sd-week-group ${weekIndex % 2 ? 'sd-week-alt' : ''}`}>
              {week.rows.map((r, index) => <tr key={r.date} className={`${r.date === today ? 'sd-today' : ''} ${!r.recorded ? 'sd-future' : ''} ${r.temporaryAdjusted ? 'sd-temp-row' : ''} {r.temporaryForecast ? 'sd-forecast-row' : ''}`}>
                <td><div className="sd-date"><b><button type="button" className="sd-day-details-btn" disabled={!employee || !hasCurrentData} onClick={() => openDayOrders(r.date)} aria-label={`Xem chi tiết đơn hàng ngày ${r.date}`}>{String(r.day).padStart(2, '0')}</button></b></div></td>
                <td className="sd-mobile-daily-thb">{renderRevenueCell(r, true)}</td>
                {index === 0 && <td rowSpan={week.rows.length} className={`sd-week-total ${week.totalVnd == null ? 'sd-week-empty' : ''}`}><div className="sd-week-content"><small>{shortDate(week.startDate)}{week.startDate !== week.endDate ? ` – ${shortDate(week.endDate)}` : ''}</small><strong>{vnd(week.totalVnd)}</strong></div></td>}
              </tr>)}
            </tbody>)}
            <tfoot><tr><td>TỔNG THÁNG{hasAdjustedRevenue && <small className="sd-total-temporary-label">{futureForecastDays ? 'Có dự kiến' : 'Đã chỉnh'}</small>}</td><td>{thb(summary.revenueThb)}</td><td>{vnd(summary.revenueVnd)}</td></tr></tfoot>
          </table></div>
        </section>

          <section className="sd-panel sd-summary" id="sd-summary"><div className="sd-section-heading"><div><h2>Thống kê mục tiêu</h2>{hasAdjustedRevenue && <small className="sd-temporary-subtitle">Dữ liệu đã điều chỉnh</small>}</div></div>
            <div className="sd-summary-stats">
              <div className="sd-stats-header"><span>Chỉ số</span><span>THB</span><span>VND</span></div>
              <StatsRow title="Tỷ giá" left="฿1" right={`${rateFormat.format(rate)} ₫`} tone="rate"/>
              <StatsRow title="Mục tiêu" left={thb(summary.targetThb)} right={goalLabel} tone="target"/>
              <StatsRow title={`${isSale && salesState.measureLabel === 'Tiền hàng' ? 'Tổng tiền hàng' : 'Tổng doanh số'}${futureForecastDays ? ' (có dự kiến)' : ''}`} left={thb(summary.revenueThb)} right={vnd(summary.revenueVnd)} tone="revenue"/>
              <StatsRow title="Cần thêm" left={thb(summary.remainingThb)} right={vnd(summary.remainingVnd)} tone={summary.remainingVnd === 0 ? 'revenue' : 'remaining'}/>
              <StatsRow title="Mỗi ngày cần" left={summary.daysLeft ? thb(summary.needThbPerDay) : '—'} right={summary.daysLeft ? vnd(summary.needPerDay) : '—'} tone="daily"/>
            </div>
            <div className="sd-completion" style={{ background: color }}><span>HOÀN THÀNH</span><strong>{percent(summary.ratio)}</strong></div>
            <div className="sd-converted">
              <div><span>Doanh số (780)</span><strong>{vnd(summary.revenue780)}</strong><small>1 THB = 780 VND</small></div>
              <div><span>Doanh số (trực tuyến)</span><strong>{vnd(summary.revenueThb != null && exchange?.rate ? summary.revenueThb * exchange.rate : null)}</strong><small>{exchange?.rate ? `1 THB = ${rateFormat.format(exchange.rate)} VND` : exchange?.unavailable ? 'Không lấy được tỷ giá' : 'Đang tải tỷ giá...'}</small>{exchange?.rate && <small>{exchange.stale ? 'Dữ liệu cũ · ' : 'Cập nhật · '}{new Date(exchange.updatedAt).toLocaleString('vi-VN', { timeZone: 'Asia/Bangkok' })}</small>}</div>
            </div>
            <div className="sd-rate-source">Nguồn tỉ giá trực tuyến: {exchange?.source === 'Frankfurter' ? <a href="https://frankfurter.dev/" target="_blank" rel="noreferrer">Frankfurter</a> : exchange?.source === 'Currency API' ? <a href="https://github.com/fawazahmed0/exchange-api" target="_blank" rel="noreferrer">Currency API</a> : <a href="https://www.exchangerate-api.com" target="_blank" rel="noreferrer">ExchangeRate API</a>}{exchange?.stale ? ' · Dữ liệu cũ' : ''}</div>
          </section>
      </div>
      <section className="sd-panel sd-chart-panel" id="sd-chart">
        <div className="sd-section-heading"><div><h2>{isSale && salesState.measureLabel === 'Tiền hàng' ? 'Biểu đồ tiền hàng' : 'Biểu đồ doanh số'}</h2></div><span className="sd-chart-unit">฿</span></div>
        <div className="sd-chart-guides" aria-label="Đường tham chiếu biểu đồ (THB)">
          {chartGuides.averageThb !== null && <span className="sd-chart-guide-key"><i className="sd-chart-guide-swatch sd-chart-guide-average"/><span>Trung bình doanh số/ngày</span><strong>{thb(Math.round(chartGuides.averageThb))}</strong></span>}
          {chartGuides.neededThb !== null && <span className="sd-chart-guide-key"><i className="sd-chart-guide-swatch sd-chart-guide-needed"/><span>Mỗi ngày cần</span><strong>{thb(Math.round(chartGuides.neededThb))}</strong></span>}
          {futureForecastDays > 0 && <span className="sd-chart-guide-key sd-chart-guide-planned">Cột có sọc: dự kiến</span>}
        </div>
        <p className="sd-mobile-only sd-mobile-chart-hint">Vuốt ngang để xem đủ các ngày trong tháng →</p>
        <div className="sd-chart-scroller" tabIndex={0} role="region" aria-label="Cuộn biểu đồ doanh số theo ngày">
          <div className="sd-chart" aria-label="Biểu đồ doanh số theo ngày, mỗi tuần một màu, có đường trung bình và mục tiêu mỗi ngày">
            {weekGroups.flatMap((week, weekIndex) => week.rows.map((r, dayIndex) => (
              <button type="button" key={r.date} onClick={() => openDayOrders(r.date)} disabled={!employee || !hasCurrentData}
                aria-label={`Xem đơn hàng ngày ${r.date}, ${thb(r.revenueThb)}${r.temporaryForecast ? ', dự kiến' : ''}`}
                className={`sd-bar-col ${dayIndex === 0 && weekIndex > 0 ? 'sd-bar-col-week-start' : ''}`}
                style={{ '--sd-chart-week-color': WEEK_CHART_COLORS[weekIndex % WEEK_CHART_COLORS.length] }}
                title={`Tuần ${weekIndex + 1} · ${r.date} (${shortWeekdays[r.weekday]}): ${thb(r.revenueThb)}${r.temporaryForecast ? ' · Dự kiến' : ''}`}>
                <div className="sd-bar-space">
                  <div className={`sd-bar ${r.date === today ? 'sd-bar-current' : ''} ${r.temporaryForecast ? 'sd-bar-forecast' : ''}`}
                    style={{ height: `${r.recorded && r.revenueThb > 0 ? Math.max(2, chartHeight(r.revenueThb)) : 0}%` }}>
                    {r.recorded && <span className="sd-bar-label">{formatChartRevenue(r.revenueThb)}</span>}
                  </div>
                </div>
                <small className="sd-chart-day"><span className="sd-chart-day-number">{r.day}</span><span className="sd-chart-weekday">{shortWeekdays[r.weekday]}</span></small>
              </button>
            )))}
            <div className="sd-chart-reference-overlay" aria-hidden="true">
              {chartGuides.averageThb !== null && <div className="sd-chart-reference-line sd-chart-reference-average" style={{ bottom: `${chartHeight(chartGuides.averageThb)}%` }} />}
              {chartGuides.neededThb !== null && <div className="sd-chart-reference-line sd-chart-reference-needed" style={{ bottom: `${chartHeight(chartGuides.neededThb)}%` }} />}
            </div>
          </div>
        </div>
      </section>
      <SalesRanking key={team} team={team} warehouseOptions={warehouseOptions} refresh={refresh} rate={rate}/>
      <div className="sd-goal-center" id="sd-goal-center">
        <div className="sd-goal-center-top"><strong>Quản lý mục tiêu {isSale ? 'Sale' : 'Marketing'}</strong></div>
        <EmployeeTargetManager key={team} team={team} employees={isSale ? employees.filter((person) => person.id !== '__unassigned__') : employees} month={month} onMonthChange={setMonth}
          warehouseId={warehouseId} warehouseOptions={warehouseOptions} onWarehouseChange={changeWarehouse}
          targets={monthTargets} legacyTargets={isSale ? {} : legacySettings.targets} error={targetError}
          canEdit={targetState.month === month && targetState.canEdit && !targetError}
          onSave={saveTargets} rate={rate}/>
      </div>
    </div>
    <DayOrdersDrawer date={selectedDay} onClose={closeDayOrders} employeeId={employee} employeeName={detailEmployee?.name || ''}
      team={team} today={today} warehouseOptions={warehouseOptions} daySummary={detailRow}/>
  </main>;
}
