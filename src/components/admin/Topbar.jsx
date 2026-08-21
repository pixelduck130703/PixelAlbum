import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

function Topbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin/login");
  };

  return (
    <nav className="border-b border-slate-200/80 bg-white/70 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link to="/admin" className="block">
          <img
            src="/images/Memories.png"
            alt="Memories"
            className="h-6 w-auto object-contain"
          />

          <p className="hidden text-sm text-slate-500 sm:block">
            Trang quản trị hệ thống
          </p>
        </Link>

        <h2 className="hidden text-2xl font-bold text-slate-700 sm:block">
          QUẢN TRỊ VIÊN
        </h2>

        <div className="flex items-center gap-3">
          {/* Nút xem thiệp mời (Cố định chuẩn min-h) */}
          <Link
            to="/invitation"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex min-h-[42px] items-center justify-center gap-1.5 overflow-hidden rounded-2xl border border-amber-300/80 bg-amber-300/20 px-4 py-2 text-sm font-bold text-amber-950 shadow-[0_8px_32px_0_rgba(245,158,11,0.15)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.03] hover:bg-amber-300/35 hover:shadow-[0_12px_40px_0_rgba(245,158,11,0.25)] active:scale-[0.98] sm:px-5 cursor-pointer"
          >
            {/* Vệt phản chiếu ánh sáng lỏng phía trên */}
            <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-2xl bg-gradient-to-b from-white/60 to-transparent" />
            <span className="relative z-10 text-base leading-none">💌</span>
            <span className="relative z-10 leading-none">Thiệp mời</span>
          </Link>

          {/* Nút đăng xuất (Cố định chuẩn min-h) */}
          <button
            type="button"
            onClick={handleLogout}
            className="group relative inline-flex min-h-[42px] items-center justify-center gap-1.5 overflow-hidden rounded-2xl border border-rose-300/80 bg-rose-500/15 px-4 py-2 text-sm font-bold text-rose-950 shadow-[0_8px_32px_0_rgba(244,63,94,0.15)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.03] hover:bg-rose-500/25 hover:shadow-[0_12px_40px_0_rgba(244,63,94,0.25)] active:scale-[0.98] sm:px-5 cursor-pointer"
          >
            {/* Vệt phản chiếu ánh sáng lỏng phía trên */}
            <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-2xl bg-gradient-to-b from-white/60 to-transparent" />
            <span className="relative z-10 leading-none">Đăng xuất</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Topbar;