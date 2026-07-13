import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import memoriesImage from "../images/Memories.png";

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
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <div>
          <Link to="/" className="inline-block">
            <img
              src="/images/Memories.png"
              alt="memories"
              className="h-6 w-auto cursor-pointer object-contain"
            />
          </Link>

          <p className="hidden text-sm text-slate-500 sm:block">
            Tìm kiếm album của bạn
          </p>
        </div>

        <div className=" text-center">
          <p className="text-2xl font-bold text-slate-1000">
            {currentTime.toLocaleTimeString("vi-VN")}
          </p>
        </div>

        <Link
          to="/admin/login"
          className="rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 sm:px-5"
        >
          Đăng nhập
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;