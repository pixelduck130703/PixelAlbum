import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

function Topbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin/login");
  };

  return (
    <nav className="border-b border-slate-200 bg-white shadow-sm">
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


        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleLogout}
            className="group relative inline-flex items-center justify-center overflow-hidden rounded-2xl border border-white/35 bg-gradient-to-br from-rose-500/80 via-red-600/70 to-rose-700/80 px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_32px_0_rgba(225,29,72,0.37)] backdrop-blur-md transition-all duration-300 hover:scale-[1.03] hover:border-white/60 hover:from-rose-500/90 hover:to-red-600/90 hover:shadow-[0_8px_32px_0_rgba(244,63,94,0.5)] active:scale-[0.98] sm:px-5 cursor-pointer"
          >
            {/* Vệt phản chiếu ánh sáng lỏng phía trên */}
            <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-2xl bg-gradient-to-b from-white/30 to-transparent" />

            {/* Chữ hiển thị */}
            <span className="relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
              Đăng xuất
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Topbar;