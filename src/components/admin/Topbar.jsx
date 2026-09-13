import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import ChangePasswordModal from "./ChangePasswordModal"; // Import modal vừa tách

function Topbar() {
  const navigate = useNavigate();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin/login");
  };

  return (
    <>
      <nav className="w-full border-b border-slate-200/80 bg-white/70 backdrop-blur-md shadow-sm">
        <div className="grid w-full grid-cols-3 items-center px-6 py-4">
          {/* Cột 1: Logo & Tiêu đề phụ */}
          <div className="flex items-center justify-start">
            <Link to="/" className="block">
              <img
                src="/images/Memories.png"
                alt="Memories"
                className="h-6 w-auto object-contain cursor-pointer transition hover:scale-105"
              />
              <p className="hidden text-sm text-slate-500 sm:block">
                Trang quản trị hệ thống
              </p>
            </Link>
          </div>

          {/* Cột 2: Tiêu đề chính căn giữa tuyệt đối */}
          <div className="flex justify-center">
            <h2 className="hidden text-2xl font-bold text-slate-700 sm:block">
              QUẢN TRỊ VIÊN
            </h2>
          </div>

          {/* Cột 3: Các nút chức năng căn phải */}
          <div className="flex items-center justify-end gap-3">
            {/* Nút về trang chủ */}
            <Link
              to="/"
              className="group relative inline-flex min-h-[42px] items-center justify-center gap-1.5 overflow-hidden rounded-2xl border border-blue-300/80 bg-blue-500/15 px-4 py-2 text-sm font-bold text-blue-950 shadow-[0_8px_32px_0_rgba(59,130,246,0.15)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.03] hover:bg-blue-500/25 hover:shadow-[0_12px_40px_0_rgba(59,130,246,0.25)] active:scale-[0.98] sm:px-5 cursor-pointer"
              title="Trang chủ"
            >
              <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-2xl bg-gradient-to-b from-white/60 to-transparent" />
              <span className="relative z-10 text-base leading-none">🏠</span>
            </Link>

            {/* Nút xem thiệp mời */}
            <Link
              to="/invitation"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative inline-flex min-h-[42px] items-center justify-center gap-1.5 overflow-hidden rounded-2xl border border-amber-300/80 bg-amber-300/20 px-4 py-2 text-sm font-bold text-amber-950 shadow-[0_8px_32px_0_rgba(245,158,11,0.15)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.03] hover:bg-amber-300/35 hover:shadow-[0_12px_40px_0_rgba(245,158,11,0.25)] active:scale-[0.98] sm:px-5 cursor-pointer"
              title="Thiệp mời"
            >
              <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-2xl bg-gradient-to-b from-white/60 to-transparent" />
              <span className="relative z-10 text-base leading-none">💌</span>
            </Link>

            {/* Nút đổi mật khẩu */}
            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              className="group relative inline-flex min-h-[42px] items-center justify-center gap-1.5 overflow-hidden rounded-2xl border border-indigo-300/80 bg-indigo-500/15 px-4 py-2 text-sm font-bold text-indigo-950 shadow-[0_8px_32px_0_rgba(99,102,241,0.15)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.03] hover:bg-indigo-500/25 hover:shadow-[0_12px_40px_0_rgba(99,102,241,0.25)] active:scale-[0.98] sm:px-5 cursor-pointer"
              title="Đổi mật khẩu"
            >
              <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-2xl bg-gradient-to-b from-white/60 to-transparent" />
              <span className="relative z-10 text-base leading-none">🔑</span>
            </button>

            {/* Nút đăng xuất */}
            <button
              type="button"
              onClick={handleLogout}
              className="group relative inline-flex min-h-[42px] items-center justify-center gap-1.5 overflow-hidden rounded-2xl border border-rose-300/80 bg-rose-500/15 px-4 py-2 text-sm font-bold text-rose-950 shadow-[0_8px_32px_0_rgba(244,63,94,0.15)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.03] hover:bg-rose-500/25 hover:shadow-[0_12px_40px_0_rgba(244,63,94,0.25)] active:scale-[0.98] sm:px-5 cursor-pointer"
              title="Đăng xuất"
            >
              <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-2xl bg-gradient-to-b from-white/60 to-transparent" />
              <span className="relative z-10 text-base leading-none">⏻</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Gọi Modal Đổi Mật Khẩu */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </>
  );
}

export default Topbar;