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
      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-5">
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
        <div
          className="
            absolute left-1/2 top-1/2
            -translate-x-1/2 -translate-y-1/2
            text-center
          "
        >
          <p className="text-base font-bold text-slate-800 sm:text-2xl">
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
          </Link>
          */}

          <Link
            to="/admin/login"
            className="group relative inline-flex items-center justify-center gap-1.5 overflow-hidden rounded-2xl border border-blue-300/80 bg-blue-500/15 px-4 py-2.5 text-sm font-bold text-blue-950 shadow-[0_8px_32px_0_rgba(59,130,246,0.15)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.03] hover:bg-blue-500/25 hover:shadow-[0_12px_40px_0_rgba(59,130,246,0.25)] active:scale-[0.98] sm:px-5 cursor-pointer"
          >
            {/* Vệt phản chiếu ánh sáng lỏng phía trên */}
            <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-2xl bg-gradient-to-b from-white/60 to-transparent" />
            <span className="relative z-10">Đăng nhập</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;