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
            src="/src/images/Memories.png"
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
            className="rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 sm:px-5"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Topbar;