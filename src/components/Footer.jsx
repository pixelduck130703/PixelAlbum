import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="relative transform-gpu border-t border-white/90 bg-white/45 shadow-[inset_0_1px_2px_rgba(255,255,255,0.95)] backdrop-blur-2xl backdrop-saturate-150">
      {/* Vệt phản quang ánh sáng bề mặt kính trên cùng */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90" />

      <div className="mx-auto max-w-7xl px-4 py-6 text-center text-slate-600 sm:px-6">
        <div className="flex justify-center">
          <Link
            to="/"
            className="inline-block transition hover:scale-105 active:scale-95"
          >
            <img
              src="/images/Memories.png"
              alt="Memories"
              className="h-6 w-auto object-contain drop-shadow-sm"
            />
          </Link>
        </div>

        <p className="mt-2 text-xs font-medium leading-6 text-slate-600 sm:text-sm">
          <span>
            Copyright ©{" "}
            {new Date().getFullYear()} by
            Nguyễn Tuấn Hùng (Pixel)
          </span>

          <span className="hidden sm:inline">
            {" "} | {" "}
          </span>

          <span className="block sm:inline">
            Special thanks to Mai Văn Định
          </span>
        </p>
      </div>
    </footer>
  );
}

export default Footer;