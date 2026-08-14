import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");

    if (token) {
      navigate("/admin", { replace: true });
    }
  }, [navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.username.trim() || !form.password) {
      setError("Vui lòng nhập tài khoản và mật khẩu.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/admin/login", form);

      localStorage.setItem("adminToken", response.data.token);

      toast.success("Đăng nhập thành công!");

      navigate("/admin", { replace: true });
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Không thể đăng nhập. Vui lòng thử lại.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-50 flex items-center justify-center p-4">
      {/* Các khối màu pastel phía sau tạo hiệu ứng khúc xạ kính lỏng sáng */}
      <div className="pointer-events-none absolute -top-28 -left-28 h-96 w-96 rounded-full bg-blue-300/40 blur-[110px]" />
      <div className="pointer-events-none absolute -bottom-28 -right-28 h-96 w-96 rounded-full bg-cyan-300/35 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-emerald-200/40 blur-[100px]" />

      {/* Card Liquid Glass trên nền sáng */}
      <div className="relative w-full max-w-md rounded-3xl border border-white/70 bg-white/50 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.06)] backdrop-blur-2xl backdrop-saturate-150">
        <div className="text-center">
          <div>
            <Link to="/" className="inline-block">
              <img
                src="/images/Memories.png"
                alt="memories"
                className="h-20 w-auto cursor-pointer object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.08)] transition hover:scale-105 active:scale-95"
              />
            </Link>
          </div>

          <h1 className="mt-4 text-2xl font-bold text-slate-800 drop-shadow-sm">
            TRANG QUẢN TRỊ VIÊN
          </h1>

          <p className="mt-2 text-slate-500">
            Đăng nhập để quản lý Album
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Tài khoản
            </label>

            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Nhập tài khoản"
              className="w-full rounded-xl border border-white/80 bg-white/60 px-4 py-3 text-slate-800 placeholder-slate-400 shadow-inner backdrop-blur-md outline-none transition focus:border-blue-500/80 focus:bg-white/80 focus:ring-4 focus:ring-blue-400/20"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Mật khẩu
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Nhập mật khẩu"
                className="w-full rounded-xl border border-white/80 bg-white/60 px-4 py-3 pr-12 text-slate-800 placeholder-slate-400 shadow-inner backdrop-blur-md outline-none transition focus:border-blue-500/80 focus:bg-white/80 focus:ring-4 focus:ring-blue-400/20"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 transition hover:text-blue-600"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200/80 bg-red-50/70 p-3 text-sm text-red-600 backdrop-blur-md">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => navigate("/")}
              disabled={loading}
              className="w-full rounded-xl border border-white/80 bg-white/60 py-3 font-semibold text-slate-700 shadow-sm backdrop-blur-md transition hover:border-slate-200 hover:bg-white/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl border border-blue-400/30 bg-blue-600/90 py-3 font-semibold text-white shadow-lg shadow-blue-500/25 backdrop-blur-md transition hover:bg-blue-600 hover:shadow-blue-500/35 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;