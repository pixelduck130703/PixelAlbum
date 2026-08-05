import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

function Navbar() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <nav className="border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-5">
        {/* Logo */}
        <div className="min-w-0">
          <Link to="/" className="inline-block">
            <img
              src="/images/Memories.png"
              alt="Memories"
              className="h-6 w-auto cursor-pointer object-contain"
            />
          </Link>

          <p className="hidden text-sm text-slate-500 sm:block">
            Tìm kiếm album của bạn
          </p>
        </div>

        {/* Đồng hồ */}
        <div className="hidden text-center sm:block">
          <p className="text-2xl font-bold text-slate-800">
            {currentTime.toLocaleTimeString("vi-VN")}
          </p>
        </div>

        {/* Nút chức năng */}
        <div className="flex shrink-0 items-center gap-2">
          {/*
          <Link
            to="/invitation"
            className="rounded-xl bg-pink-500 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pink-600 hover:shadow-md sm:px-5"
          >
            💌 Thiệp mời
          </Link> */}

          <Link
            to="/admin/login"
            className="rounded-xl bg-blue-500 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md sm:px-5"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;