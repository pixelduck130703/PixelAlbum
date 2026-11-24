import { useEffect, useId, useRef, useState } from 'react';
import { normalizeEmployeeSearch } from '../models/salesDashboardModel';

export default function EmployeeSearch({ employees, value, onChange, label = 'NHÂN VIÊN', noun = 'nhân viên', emptyLabel = 'Chưa tải nhân viên', disabled = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrap = useRef(null);
  const trigger = useRef(null);
  const searchInput = useRef(null);
  const id = useId();
  const selected = employees.find((person) => person.id === value);
  const normalized = normalizeEmployeeSearch(query);
  const filtered = employees.filter((person) => normalizeEmployeeSearch(person.name).includes(normalized));

  useEffect(() => {
    if (!open) return;
    searchInput.current?.focus();
    const outside = (event) => {
      if (!wrap.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);

  function close() { setOpen(false); setQuery(''); }
  function choose(person) { onChange(person.id); close(); trigger.current?.focus(); }

  return <div className="sd-field sd-employee-search" ref={wrap} onBlur={(event) => { if (event.relatedTarget && !wrap.current?.contains(event.relatedTarget)) close(); }} onKeyDown={(event) => { if (event.key === 'Escape' && open) { event.preventDefault(); close(); trigger.current?.focus(); } }}>
    <span id={`${id}-label`}>{label}</span>
    <button className="sd-employee-trigger" ref={trigger} type="button" disabled={disabled || !employees.length} aria-labelledby={`${id}-label ${id}-value`} aria-expanded={open} aria-controls={`${id}-menu`} onClick={() => { setQuery(''); setOpen((v) => !v); }}>
      <span id={`${id}-value`}>{selected?.name || emptyLabel}</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
    </button>
    {open && !disabled && <div className="sd-employee-menu" id={`${id}-menu`}>
      <div className="sd-search-box"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><input ref={searchInput} type="search" aria-label={`Tìm kiếm ${noun}`} placeholder={`Gõ tên ${noun}...`} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && filtered.length === 1) { event.preventDefault(); choose(filtered[0]); } }}/></div>
      <div className="sd-employee-results" aria-label="Kết quả tìm kiếm">
        {filtered.length ? filtered.map((person) => <button key={person.id} type="button" className={person.id === value ? 'sd-employee-option sd-employee-selected' : 'sd-employee-option'} aria-pressed={person.id === value} onClick={() => choose(person)}><span>{person.name}</span>{person.id === value && <b aria-hidden="true">✓</b>}</button>) : <p>Không tìm thấy {noun}.</p>}
      </div>
      <small className="sd-employee-count">{filtered.length}/{employees.length} lựa chọn</small>
    </div>}
  </div>;
}
