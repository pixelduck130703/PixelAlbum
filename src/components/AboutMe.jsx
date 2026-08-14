import {
  FaFacebookF,
  FaInstagram,
  FaTiktok,
} from "react-icons/fa";

function AboutMe() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/80 border-t-white/95 bg-white/40 p-6 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.95),_0_20px_50px_rgba(0,0,0,0.08)] backdrop-blur-2xl backdrop-saturate-150 sm:p-8 lg:sticky lg:top-6">
      {/* Vệt phản quang ánh sáng bề mặt kính trên cùng */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90" />

      {/* Đốm màu khúc xạ tạo chiều sâu kính lỏng */}
      <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-blue-300/30 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-emerald-300/25 blur-2xl" />

      <div className="relative flex flex-col items-center text-center">
        <div className="flex justify-center">
          <img
            src="https://res.cloudinary.com/n19bl86u/image/upload/v1783766747/IMG_20260430_114141_ygsqw1.jpg"
            alt="Nguyễn Tuấn Hùng"
            className="h-28 w-28 rounded-full border-4 border-blue-500 object-cover shadow-lg transition-transform duration-300 hover:scale-105"
            onError={(event) => {
              event.currentTarget.src =
                "https://placehold.co/300x300?text=Avatar";
            }}
          />
        </div>

        <h2 className="mt-5 text-2xl font-bold text-slate-800 drop-shadow-sm">
          Nguyễn Tuấn Hùng (Pixel)
        </h2>

        <p className="mt-5 text-sm leading-7 text-slate-600 sm:text-base">
          <strong className="text-slate-800">
            a b c d x y z n m a s a d = {") )"}
          </strong>
          <br />
          <br />
          Mình xây dựng website này nhằm lưu giữ và chia sẻ những bức ảnh,
          khoảnh khắc và kỷ niệm của bạn bè và người thân theo cách đơn giản, dễ dàng tìm kiếm. Những bức ảnh sẽ ở lại khi tất cả đã rời đi!!!
        </p>

        <div className="mt-8 flex items-center justify-center gap-4">
          <a
            href="https://www.facebook.com/tuanhungpixel42"
            target="_blank"
            rel="noreferrer"
            title="Facebook"
            className="flex h-12 w-12 items-center justify-center rounded-full border border-blue-400/40 bg-blue-600/90 text-xl text-white shadow-lg shadow-blue-500/25 backdrop-blur-md transition hover:-translate-y-1 hover:border-blue-300 hover:bg-blue-600 hover:shadow-blue-500/40 active:scale-95"
          >
            <FaFacebookF />
          </a>

          <a
            href="https://www.instagram.com/hugnpxl.jpg/"
            target="_blank"
            rel="noreferrer"
            title="Instagram"
            className="flex h-12 w-12 items-center justify-center rounded-full border border-pink-300/40 bg-gradient-to-br from-purple-600/90 via-pink-500/90 to-orange-400/90 text-xl text-white shadow-lg shadow-pink-500/25 backdrop-blur-md transition hover:-translate-y-1 hover:border-pink-200 hover:shadow-pink-500/40 active:scale-95"
          >
            <FaInstagram />
          </a>

          <a
            href="https://www.tiktok.com/@hugnpxl.jpg?is_from_webapp=1&sender_device=pc"
            target="_blank"
            rel="noreferrer"
            title="TikTok"
            className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/90 text-xl text-white shadow-lg shadow-slate-900/25 backdrop-blur-md transition hover:-translate-y-1 hover:border-white/40 hover:bg-black hover:shadow-slate-900/40 active:scale-95"
          >
            <FaTiktok />
          </a>
        </div>
      </div>
    </section>
  );
}

export default AboutMe;