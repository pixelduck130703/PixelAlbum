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
    <nav className="relative transform-gpu border-b border-white/90 bg-white/45 shadow-[inset_0_-1px_1.5px_rgba(255,255,255,0.95),_0_8px_24px_rgba(0,0,0,0.03)] backdrop-blur-2xl backdrop-saturate-150">
      {/* Vệt phản quang ánh sáng bề mặt kính dưới cùng */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90" />

      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-5">
        {/* Logo */}
        <div className="min-w-0">
          <Link to="/" className="inline-block transition hover:scale-105 active:scale-95">
            <img
              src="/images/Memories.png"
              alt="Memories"
              className="h-6 w-auto cursor-pointer object-contain drop-shadow-sm"
            />
          </Link>

          <p className="hidden text-sm font-medium text-slate-600 sm:block">
            Tìm kiếm album của bạn
          </p>
        </div>

        {/* Đồng hồ */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <p className="text-base font-black text-slate-800 drop-shadow-sm sm:text-2xl">
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
            className="rounded-xl border border-blue-400/30 bg-blue-600/90 px-3 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-500/20 backdrop-blur-md transition hover:bg-blue-600 hover:shadow-blue-500/30 active:scale-95 sm:px-5"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;