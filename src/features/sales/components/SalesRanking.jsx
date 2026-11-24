import { useEffect, useMemo, useRef, useState } from 'react';
import EmployeeSearch from './EmployeeSearch';
import { normalizeEmployeeSearch, progressColor, todayInBangkok } from '../models/salesDashboardModel';
import { PERIODS, rankingRange, rankingRangeError, filterRanking, rankingShowsCompletion } from '../models/salesRankingModel';
import { fetchSalesEmployees, fetchSalesRanking, salesErrorMessage } from '../../../services/salesService';
import { SALES_FILTER_KEYS, readRankingFilters, saveSalesFilters, resolveWarehouseChoice } from '../utils/salesFilterStorage';
import { fetchSaleMarketingEmployees, fetchSaleMarketingRanking } from '../../sale/saleMarketingAdapter';

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
        <div className="sd-ranking-options">{visible.length ? visible.map((p) => <label key={p.id}><input type="checkbox" disabled={disabled} checked={active.has(p.id)} onChange={() => toggle(p.id)}/><span>{p.name}</span></label>) : <p>Không tìm thấy nhân viên.</p>}</div>
        <small>{count} nhân viên được chọn · Bấm tiêu đề để đóng</small>
      </div>
    </details>
  </div>;
}

export default function SalesRanking({ warehouseOptions, refresh, rate = 780, team = 'marketing' }) {
  const isSale = team === 'sale';
  const savedRankingKey = isSale ? 'pixelalbum-sale-ranking-filters-v1' : SALES_FILTER_KEYS.ranking;
  const today = todayInBangkok();
  const [initialFilters] = useState(() => readRankingFilters(today, isSale ? {getItem: () => localStorage.getItem('pixelalbum-sale-ranking-filters-v1')} : undefined));
  const [warehouseChoice, setWarehouse] = useState(initialFilters.warehouseChoice);
  const warehouseId = resolveWarehouseChoice(warehouseChoice, warehouseOptions);
  const [savedSelection, setSelected] = useState(initialFilters.selected);
  const selected = warehouseChoice !== null && warehouseId !== warehouseChoice ? null : savedSelection;
  const [period, setPeriod] = useState(initialFilters.period);
  const [customStart, setCustomStart] = useState(initialFilters.customStart);
  const [customEnd, setCustomEnd] = useState(initialFilters.customEnd);
  const [retry, setRetry] = useState(0);
  // Mặc định là danh sách; chuyển chế độ không làm thay đổi bộ lọc hay dữ liệu API.
  const [viewMode, setViewMode] = useState('list');
  const [expanded, setExpanded] = useState(false);
  const panelRef = useRef(null);
  const expandButtonRef = useRef(null);
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
  // Chỉ hiển thị nhân viên có doanh thu thực tế dương trong khoảng ngày của bảng
  // xếp hạng. Dùng cùng dữ liệu /sales/ranking cho cả ô chọn nhiều nhân viên và
  // các dòng bảng, kể cả khi chọn "Tất cả các kho" (backend trả về toàn bộ nhân viên).
  const activeEmployees = useMemo(() => {
    if (!data) return [];
    const activeIds = new Set(data.rows.filter((row) => row.revenueThb > 0).map((row) => row.employeeId));
    return employees.filter((employee) => activeIds.has(employee.id));
  }, [data, employees]);
  const rows = useMemo(
    () => filterRanking(data?.rows || [], activeEmployees, selected).filter((row) => row.revenueThb > 0),
    [data, activeEmployees, selected],
  );
  const loading = !invalid && (!employeeReady || report.version !== version);

  // Chỉ mở toàn màn hình trên desktop; Esc hoặc nút Thu gọn để thoát.
  // Không lưu chế độ mở rộng vào localStorage để tránh chiếm màn hình lần sau.
  useEffect(() => {
    if (!expanded) return undefined;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    expandButtonRef.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setExpanded(false);
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable = Array.from(panelRef.current.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), summary, [tabindex]:not([tabindex="-1"])'
      )).filter((item) => item.getClientRects().length > 0);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const onResize = () => {
      if (window.innerWidth < 768) setExpanded(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);
    return () => {
      document.body.style.overflow = oldOverflow;
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
      expandButtonRef.current?.focus();
    };
  }, [expanded]);

  useEffect(() => {
    saveSalesFilters(savedRankingKey, { warehouseChoice, selected: savedSelection, period, customStart, customEnd });
  }, [warehouseChoice, savedSelection, period, customStart, customEnd, savedRankingKey]);

  useEffect(() => {
    if (scope === null) return;
    const controller = new AbortController();
    (isSale ? fetchSaleMarketingEmployees : fetchSalesEmployees)(warehouseId, lookupMonth, controller.signal, lookupStart, lookupEnd).then((items) => {
      if (!controller.signal.aborted) setEmployeeState({ scope, items, error: '' });
    }).catch((e) => {
      if (!controller.signal.aborted) setEmployeeState({ scope, items: [], error: salesErrorMessage(e) });
    });
    return () => controller.abort();
  }, [warehouseId, scope, lookupMonth, lookupStart, lookupEnd, refresh, retry, isSale]);

  useEffect(() => {
    if (invalid) return;
    const controller = new AbortController();
    (isSale ? fetchSaleMarketingRanking : fetchSalesRanking)(start, end, controller.signal).then((result) => {
      if (!controller.signal.aborted) setReport({ key, data: result, error: '', version });
    }).catch((e) => {
      if (!controller.signal.aborted) setReport({ key, data: null, error: salesErrorMessage(e), version });
    });
    return () => controller.abort();
  }, [start, end, invalid, key, version, isSale]);

  function changeWarehouse(value) { setWarehouse(value); setSelected(null); }
  function changeSelected(value) { setWarehouse(warehouseId); setSelected(value); }
  const maxChartRevenue = Math.max(0, ...rows.map((row) => Number(row.revenueThb) || 0));
  const measureLabel = isSale ? (data?.measureLabel || 'Doanh số') : 'Doanh số';
  const totalOrders = rows.reduce((sum, row) => sum + row.orders, 0);
  const totalRevenue = rows.reduce((sum, row) => sum + row.revenueThb, 0);
  const assignedTargets = rows.filter((row) => row.targetVnd > 0);
  const totalTarget = assignedTargets.reduce((sum, row) => sum + row.targetVnd, 0);
  return <section
    ref={panelRef}
    id="sd-ranking"
    className={`sd-panel sd-ranking-panel${expanded ? ' sd-ranking-expanded' : ''}`}
    role={expanded ? 'dialog' : 'region'}
    aria-modal={expanded ? 'true' : undefined}
    aria-label="Bảng xếp hạng nhân viên"
  >
    <div className="sd-section-heading">
      <div><h2>Bảng xếp hạng nhân viên{isSale ? ' Sale' : ''}</h2></div>
      <div className="sd-ranking-heading-actions">
        <div className="sd-ranking-view-toggle" role="group" aria-label="Chế độ xem xếp hạng">
          <button type="button" className={`sd-secondary${viewMode === 'list' ? ' is-active' : ''}`}
            aria-pressed={viewMode === 'list'} aria-controls="sd-ranking-visualization"
            onClick={() => setViewMode('list')}>☷ Danh sách</button>
          <button type="button" className={`sd-secondary${viewMode === 'chart' ? ' is-active' : ''}`}
            aria-pressed={viewMode === 'chart'} aria-controls="sd-ranking-visualization"
            onClick={() => setViewMode('chart')}>▥ Biểu đồ</button>
        </div>
        <button type="button" className="sd-secondary sd-ranking-expand-btn"
          ref={expandButtonRef}
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded} aria-controls="sd-ranking-visualization"
          title={expanded ? 'Thu nhỏ bảng về giao diện bình thường (Esc)' : 'Mở bảng xếp hạng toàn màn hình'}>
          <span aria-hidden="true">{expanded ? '⊟' : '⛶'}</span>
          {expanded ? 'Thu gọn' : 'Mở rộng'}
        </button>
        <button type="button" className="sd-secondary" onClick={() => setRetry((n) => n + 1)}>↻ Làm mới</button>
      </div>
    </div>
    <div className="sd-ranking-filters">
      <EmployeeSearch employees={warehouseOptions} value={warehouseId} onChange={changeWarehouse} label="KHO HÀNG" noun="kho" emptyLabel="VALLEY" />
      <MultiEmployees key={warehouseId} employees={activeEmployees} selected={selected} onChange={changeSelected} disabled={!employeeReady || !data || !activeEmployees.length}/>
      <label className="sd-field"><span>THỜI GIAN</span><select value={period} onChange={(e) => setPeriod(e.target.value)}>{PERIODS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      {period === 'custom' && <div className="sd-ranking-dates"><label className="sd-field"><span>TỪ NGÀY</span><input type="date" value={customStart} min="2000-01-01" max={today} onChange={(e) => setCustomStart(e.target.value)}/></label><label className="sd-field"><span>ĐẾN NGÀY</span><input type="date" value={customEnd} min="2000-01-01" max={today} onChange={(e) => setCustomEnd(e.target.value)}/></label></div>}
    </div>
    <div className="sd-ranking-meta"><span>{invalid ? 'Khoảng ngày chưa hợp lệ' : `${displayDate(start)} – ${displayDate(end)}`} · {rows.length} nhân viên</span><span role="status">{error || employeeError ? 'Lỗi tải dữ liệu' : invalid ? 'Chưa tải' : loading ? 'Đang đồng bộ...' : data ? `Cập nhật ${new Date(data.updatedAt).toLocaleTimeString('vi-VN', { timeZone: 'Asia/Bangkok' })} · Mỗi 1 phút` : ''}</span></div>
    {invalid && <p className="sd-alert" role="alert">{invalid}</p>}
    {(error || employeeError) && <p className="sd-alert" role="alert">{error || employeeError}</p>}
    {showCompletion && data?.targetError && <p className="sd-alert" role="alert">Không tải được mục tiêu từ cơ sở dữ liệu. Doanh số vẫn hiển thị.</p>}
    {warehouseId === null && <p className="sd-filter-note">Đang tìm kho VALLEY. Anh có thể chọn kho khác nếu không tìm thấy.</p>}
    {employeeReady && data && !activeEmployees.length && <p className="sd-alert sd-alert-neutral">Không có nhân viên có doanh thu dương trong khoảng ngày đã chọn tại kho này. Anh có thể chọn kỳ khác hoặc Tất cả các kho.</p>}
    <div id="sd-ranking-visualization" className="sd-ranking-visualization">
      {viewMode === 'list' ? <div className="sd-ranking-table-wrap" tabIndex={0} role="region" aria-label="Cuộn bảng xếp hạng">
      <table className={`sd-ranking-table${showCompletion ? ' sd-ranking-with-completion' : ''}`}>
        <thead><tr><th>Nhân viên</th><th>Đơn hàng</th><th aria-sort="descending">{measureLabel} (THB) ↓</th><th>{measureLabel} (VND)</th>{showCompletion && <><th>Mục tiêu (VND)</th><th>Hoàn thành</th></>}</tr></thead>
        <tbody>
          {rows.map((row, index) => {
        // Kết quả API có thể dùng tỷ giá mặc định khác; tính lại theo lựa chọn hiện tại.
        const completion = row.targetVnd > 0 ? row.revenueThb * rate / row.targetVnd : null;
        return <tr key={row.employeeId}>
            <td><span className={`sd-ranking-position sd-rank-${index + 1}`}>{String(index + 1).padStart(2, '0')}</span><strong>{row.name}</strong></td>
            <td>{format.format(row.orders)}</td>
            <td className="sd-ranking-money"><strong className="sd-ranking-revenue">฿{format.format(row.revenueThb)}</strong></td>
            <td className="sd-ranking-money"><strong className="sd-ranking-revenue-vnd">{money.format(row.revenueThb * rate)} ₫</strong></td>
            {showCompletion && <td className="sd-ranking-money">{row.targetVnd > 0 ? <strong className="sd-ranking-target">{money.format(row.targetVnd)} ₫</strong> : <span className="sd-ranking-unset">{data.targetError ? 'Không tải được' : 'Chưa đặt'}</span>}</td>}
            {showCompletion && <td>{completion === null ? <span className="sd-ranking-unset">{data.targetError ? 'Không tải được' : 'Chưa đặt'}</span> : <div className="sd-ranking-progress" title={`Mục tiêu: ${money.format(row.targetVnd)} ₫`}><span style={{ width: `${Math.max(0, Math.min(100, completion * 100))}%`, background: progressColor(completion) }}/><strong>{format.format(completion * 100)}%</strong></div>}</td>}
          </tr>; })}
          {!rows.length && <tr><td colSpan={showCompletion ? 6 : 4} className="sd-ranking-empty">{invalid || error || employeeError ? 'Chưa có dữ liệu hiển thị.' : loading ? 'Đang tải dữ liệu...' : 'Chưa chọn nhân viên hoặc không có nhân viên phù hợp.'}</td></tr>}
        </tbody>
        {rows.length > 0 && <tfoot><tr><td>TỔNG ({rows.length})</td><td>{format.format(totalOrders)}</td><td className="sd-ranking-money">฿{format.format(totalRevenue)}</td><td className="sd-ranking-money">{money.format(totalRevenue * rate)} ₫</td>{showCompletion && <><td className="sd-ranking-money">{data.targetError ? 'Không tải được' : assignedTargets.length ? <>{money.format(totalTarget)} ₫{assignedTargets.length < rows.length && <small className="sd-ranking-target-count">{assignedTargets.length}/{rows.length} đã đặt</small>}</> : 'Chưa đặt'}</td><td>—</td></>}</tr></tfoot>}
      </table>
      </div> : <div className="sd-ranking-chart-wrap" role="region" aria-label="Biểu đồ doanh số THB theo nhân viên" tabIndex={0}>
        {!rows.length ? <div className="sd-ranking-chart-empty">
          {invalid || error || employeeError ? 'Chưa có dữ liệu hiển thị.' : loading ? 'Đang tải dữ liệu...' : 'Không có nhân viên phù hợp.'}
        </div> : <>
          <div className="sd-ranking-chart-summary"><span>{measureLabel.toUpperCase()} THEO NHÂN VIÊN · THB</span><strong>Tổng ฿{format.format(totalRevenue)}</strong></div>
          <div className="sd-ranking-chart-list">
            {rows.map((row, index) => <div className="sd-ranking-chart-row" key={row.employeeId}>
              <div className="sd-ranking-chart-name" title={row.name}>
                <span className={`sd-ranking-position sd-rank-${index + 1}`}>{String(index + 1).padStart(2, '0')}</span>
                <strong>{row.name}</strong>
              </div>
              <div className="sd-ranking-chart-track" role="img" aria-label={`${row.name}: ${format.format(row.revenueThb)} baht`}>
                <span className="sd-ranking-chart-fill" style={{ width: `${maxChartRevenue > 0 ? Math.max(1, (row.revenueThb / maxChartRevenue) * 100) : 0}%` }} />
              </div>
              <strong className="sd-ranking-chart-value">฿{format.format(row.revenueThb)}</strong>
            </div>)}
          </div>
        </>}
      </div>}
    </div>
  </section>;
}
