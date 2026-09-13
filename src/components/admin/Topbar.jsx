import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import api from "../../services/api";
import toast from "react-hot-toast";

function Topbar() {
  const navigate = useNavigate();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passForm, setPassForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loadingPass, setLoadingPass] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin/login");
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!passForm.oldPassword || !passForm.newPassword || !passForm.confirmPassword) {
      toast.error("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    if (passForm.newPassword !== passForm.confirmPassword) {
      toast.error("Mật khẩu mới không khớp.");
      return;
    }

    if (passForm.newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    try {
      setLoadingPass(true);
      await api.put("/admin/change-password", {
        oldPassword: passForm.oldPassword,
        newPassword: passForm.newPassword,
      });

      toast.success("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.");
      setShowPasswordModal(false);
      setPassForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      
      // Đăng xuất sau khi đổi mật khẩu thành công để bảo mật
      localStorage.removeItem("adminToken");
      navigate("/admin/login");
    } catch (error) {
      console.error("Lỗi đổi mật khẩu:", error);
      const msg = error.response?.data?.message || "Không thể đổi mật khẩu.";
      toast.error(msg);
    } finally {
      setLoadingPass(false);
    }
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

      {/* MODAL ĐỔI MẬT KHẨU */}
      {showPasswordModal && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={() => setShowPasswordModal(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-3xl shadow-inner">
                🔑
              </div>
              <h3 className="mt-4 text-2xl font-black text-slate-900">
                Đổi mật khẩu quản trị
              </h3>
            </div>

            <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4 text-left">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Mật khẩu hiện tại
                </label>
                <input
                  type="password"
                  value={passForm.oldPassword}
                  onChange={(e) => setPassForm({ ...passForm, oldPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  value={passForm.newPassword}
                  onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  value={passForm.confirmPassword}
                  onChange={(e) => setPassForm({ ...passForm, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  required
                />
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 rounded-2xl bg-slate-100 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-200 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loadingPass}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-indigo-700 disabled:opacity-60 cursor-pointer"
                >
                  {loadingPass ? "Đang xử lý..." : "Xác nhận đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default Topbar;