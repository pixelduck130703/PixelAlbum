import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 text-center text-gray-500 sm:px-6">
        <div className="flex justify-center">
          <Link
            to="/"
            className="inline-block"
          >
            <img
              src="/images/Memories.png"
              alt="Memories"
              className="h-6 w-auto object-contain"
            />
          </Link>
        </div>

        <p className="mt-2 text-xs leading-6 sm:text-sm">
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