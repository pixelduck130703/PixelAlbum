import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import toast from "react-hot-toast";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function ChangePasswordModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [passForm, setPassForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loadingPass, setLoadingPass] = useState(false);

  // State quản lý hiển thị mật khẩu cho từng trường
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  if (!isOpen) return null;

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
      onClose();
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
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onClick={onClose}
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
          {/* Mật khẩu hiện tại */}
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
              Mật khẩu hiện tại
            </label>
            <div className="relative">
              <input
                type={showOldPass ? "text" : "password"}
                value={passForm.oldPassword}
                onChange={(e) => setPassForm({ ...passForm, oldPassword: e.target.value })}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 pr-12 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                required
              />
              <button
                type="button"
                onClick={() => setShowOldPass(!showOldPass)}
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 transition hover:text-indigo-600 cursor-pointer"
              >
                {showOldPass ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Mật khẩu mới */}
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
              Mật khẩu mới
            </label>
            <div className="relative">
              <input
                type={showNewPass ? "text" : "password"}
                value={passForm.newPassword}
                onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 pr-12 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPass(!showNewPass)}
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 transition hover:text-indigo-600 cursor-pointer"
              >
                {showNewPass ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Xác nhận mật khẩu mới */}
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
              Xác nhận mật khẩu mới
            </label>
            <div className="relative">
              <input
                type={showConfirmPass ? "text" : "password"}
                value={passForm.confirmPassword}
                onChange={(e) => setPassForm({ ...passForm, confirmPassword: e.target.value })}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 pr-12 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 transition hover:text-indigo-600 cursor-pointer"
              >
                {showConfirmPass ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
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
  );
}

export default ChangePasswordModal;