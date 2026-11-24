import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import EmployeeSearch from './EmployeeSearch';
import { DEFAULT_EMPLOYEE_ID, employeeTargetKey, getEmployeeTarget, normalizeEmployeeSearch, parseTargetDraft } from '../models/salesDashboardModel';
import { SALES_FILTER_KEYS, readTargetFilter, saveSalesFilters } from '../utils/salesFilterStorage';

const format = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });
const rateFormat = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 });

export default function EmployeeTargetManager({ employees, month, onMonthChange, warehouseId, warehouseOptions, onWarehouseChange, targets, legacyTargets, error, canEdit, onSave, rate, team = 'marketing' }) {
  const targetFiltersKey = team === 'sale' ? 'pixelalbum-sale-target-filters-v1' : SALES_FILTER_KEYS.targets;
  const [query, setQuery] = useState(() => readTargetFilter(team === 'sale' ? {getItem: () => localStorage.getItem('pixelalbum-sale-target-filters-v1')} : undefined));
  const [drafts, setDrafts] = useState({});
  const [notice, setNotice] = useState(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { saveSalesFilters(targetFiltersKey, { query }); }, [query, targetFiltersKey]);
  const normalized = normalizeEmployeeSearch(query);
  const visible = employees.filter((person) => normalizeEmployeeSearch(person.name).includes(normalized));
  const pending = employees.flatMap((person) => {
    const key = employeeTargetKey(person.id, month);
    return Object.hasOwn(drafts, key) ? [[key, parseTargetDraft(drafts[key])]] : [];
  });
  const invalid = pending.some(([, amount]) => amount == null);
  const [year, monthNumber] = month.split('-');
  const editable = canEdit && targets != null && !error && !saving;
  const importable = employees.flatMap((person) => {
    const key = employeeTargetKey(person.id, month);
    const amount = legacyTargets?.[key] ?? (person.id === DEFAULT_EMPLOYEE_ID ? legacyTargets?.[`hung:${month}`] : undefined);
    return targets && !Object.hasOwn(targets, key) && !Object.hasOwn(drafts, key) && Number.isSafeInteger(amount) && amount >= 0 ? [[key, format.format(amount)]] : [];
  });

  function clearMonthDrafts() {
    const keys = new Set(pending.map(([key]) => key));
    setDrafts((previous) => Object.fromEntries(Object.entries(previous).filter(([key]) => !keys.has(key))));
  }

  async function save(event) {
    event.preventDefault();
    if (!editable || !pending.length || invalid || !employees.length) return;
    setSaving(true);
    try {
      await onSave(month, Object.fromEntries(pending));
      clearMonthDrafts();
      setNotice({ month, error: false, text: `Đã lưu vào cơ sở dữ liệu mục tiêu của ${pending.length} nhân viên tháng ${Number(monthNumber)}/${year}.` });
    } catch (error) {
      setNotice({ month, error: true, text: error?.response?.data?.message || 'Không lưu được mục tiêu. Vui lòng thử lại.' });
    } finally {
      setSaving(false);
    }
  }

  return <section className="sd-panel sd-target-manager" id="sd-employee-targets" aria-labelledby="sd-target-title">
    <div className="sd-section-heading"><div><h2 id="sd-target-title">Mục tiêu từng nhân viên</h2></div><span className="sd-target-count">{employees.length} nhân viên</span></div>
    <div className="sd-target-toolbar">
      <label className="sd-field"><span>THÁNG NHẬP MỤC TIÊU</span><input type="month" value={month} onChange={(event) => event.target.value && onMonthChange(event.target.value)}/></label>
      <EmployeeSearch employees={warehouseOptions} value={warehouseId} onChange={onWarehouseChange} label="LỌC NHÂN VIÊN THEO KHO" noun="kho" emptyLabel="VALLEY" disabled={saving}/>
      <label className="sd-field"><span>TÌM NHÂN VIÊN</span><input type="search" placeholder="Nhập tên nhân viên..." value={query} onChange={(event) => setQuery(event.target.value)}/></label>
    </div>
    {error && <p className="sd-target-notice sd-target-error" role="alert">{error}{targets ? ' · Đang hiển thị mục tiêu đã tải trước đó.' : ''}</p>}
    {!error && !targets && <p className="sd-target-notice" role="status">Đang tải mục tiêu từ cơ sở dữ liệu...</p>}
    {!error && targets && !canEdit && <p className="sd-target-notice">Chế độ chỉ xem. <Link to="/admin/login" onClick={() => localStorage.removeItem('adminToken')}>Đăng nhập quản trị để sửa mục tiêu</Link>, sau đó quay lại báo cáo.</p>}
    {editable && importable.length > 0 && <p className="sd-target-notice">Tìm thấy {importable.length} mục tiêu V5 trên máy này chưa có trong CSDL. <button type="button" className="sd-secondary" onClick={() => setDrafts((previous) => ({ ...previous, ...Object.fromEntries(importable) }))}>Nhập mục tiêu cũ</button> · Kiểm tra rồi nhấn Lưu mục tiêu.</p>}
    <form onSubmit={save}>
      <div className="sd-target-table-wrap"><table className="sd-target-table">
        <thead><tr><th>Nhân viên</th><th>Mục tiêu tháng (VND)</th><th>Quy đổi THB ({rateFormat.format(rate)})</th><th>Trạng thái</th></tr></thead>
        <tbody>{visible.map((person) => {
          const key = employeeTargetKey(person.id, month);
          const saved = targets ? getEmployeeTarget(targets, person.id, month) : null;
          const edited = Object.hasOwn(drafts, key);
          const value = edited ? drafts[key] : saved > 0 ? format.format(saved) : '';
          const amount = edited ? parseTargetDraft(value) : saved;
          return <tr key={person.id}>
            <td><strong>{person.name}</strong></td>
            <td><input aria-label={`Mục tiêu ${person.name} tháng ${month}`} aria-invalid={edited && amount == null} disabled={!editable} placeholder="Chưa đặt" inputMode="numeric" value={value} onChange={(event) => { setDrafts((previous) => ({ ...previous, [key]: event.target.value })); setNotice(null); }}/></td>
            <td className="sd-target-thb">{amount > 0 ? `฿${format.format(amount / rate)}` : '—'}</td>
            <td><span className={`sd-target-badge ${edited && amount == null ? 'sd-target-invalid' : edited ? 'sd-target-pending' : !saved ? 'sd-target-unset' : ''}`}>{edited ? amount == null ? 'Không hợp lệ' : amount === 0 ? 'Bỏ mục tiêu (chưa lưu)' : 'Chưa lưu' : !targets ? 'Chưa tải' : saved > 0 ? 'Đã lưu CSDL' : 'Chưa đặt'}</span></td>
          </tr>;
        })}{!visible.length && <tr><td colSpan={4} className="sd-target-empty">{employees.length ? 'Không tìm thấy nhân viên.' : 'Chưa tải được danh sách nhân viên.'}</td></tr>}</tbody>
      </table></div>
      <div className="sd-target-actions"><div><span>{pending.length ? `${pending.length} nhân viên có thay đổi` : 'Chưa có thay đổi'}</span><small>Để trống hoặc nhập 0 rồi lưu để bỏ mục tiêu.</small></div><div><button type="button" className="sd-secondary" disabled={!pending.length || saving} onClick={() => { clearMonthDrafts(); setNotice(null); }}>Hủy thay đổi</button><button className="sd-primary" type="submit" disabled={!editable || !pending.length || invalid}>{saving ? 'Đang lưu...' : `Lưu mục tiêu${pending.length ? ` (${pending.length})` : ''}`}</button></div></div>
      {notice?.month === month && <p role="status" className={`sd-target-notice ${notice.error ? 'sd-target-error' : ''}`}>{notice.text}</p>}
    </form>
  </section>;
}
