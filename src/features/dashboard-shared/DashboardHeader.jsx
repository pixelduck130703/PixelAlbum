import { NavLink, Link } from 'react-router-dom';
import './DashboardHeader.css';

export default function DashboardHeader({ active = 'marketing' }) {
  return <header className="sd-topbar sd-dashboard-topbar">
    <div className="sd-brand sd-dashboard-brand">
      <span className="sd-brand-mark" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m7 14 4-4 4 3 5-7"/></svg></span>
      <div><strong>Sales Dashboard</strong><small>PIXELALBUM · BÁO CÁO</small></div>
    </div>
    <nav className="sd-dashboard-tabs" aria-label="Chuyển tab báo cáo">
      <NavLink to="/sales-dashboard" end className={({ isActive }) => `sd-dashboard-tab ${isActive || (active === 'marketing' && typeof window === 'undefined') ? 'is-active' : ''}`}>
        <span className="sd-tab-icon" aria-hidden="true">◫</span> Marketing
      </NavLink>
      <NavLink to="/warehouse-dashboard" end className={({ isActive }) => `sd-dashboard-tab ${isActive || (active === 'warehouse' && typeof window === 'undefined') ? 'is-active' : ''}`}>
        <span className="sd-tab-icon" aria-hidden="true">▤</span> Kho hàng
      </NavLink>
      <NavLink to="/sale-dashboard" end className={({ isActive }) => `sd-dashboard-tab ${isActive || (active === 'sale' && typeof window === 'undefined') ? 'is-active' : ''}`}>
        <span className="sd-tab-icon" aria-hidden="true">▥</span> Sale
      </NavLink>
    </nav>
    <Link className="sd-back sd-dashboard-back" to="/admin"><span aria-hidden="true">←</span> Quản trị</Link>
  </header>;
}
