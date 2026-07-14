import {
  FaFacebookF,
  FaInstagram,
  FaTiktok,
} from "react-icons/fa";

function AboutMe() {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-xl sm:p-8 lg:sticky lg:top-6">
      <div className="flex flex-col items-center text-center">
        <div className="flex items-center justify-center gap-6">
          <img
            src="/images/WC2026.webp"
            alt="FIFA World Cup 2026"
            className="h-20 w-20 rounded-xl bg-white p-2 object-contain"
          />

          <img
            src="https://res.cloudinary.com/n19bl86u/image/upload/v1783766747/IMG_20260430_114141_ygsqw1.jpg"
            alt="Nguyễn Tuấn Hùng"
            className="h-28 w-28 rounded-full border-4 border-blue-500 object-cover shadow-lg"
            onError={(event) => {
              event.currentTarget.src =
                "https://placehold.co/300x300?text=Avatar";
            }}
          />

          <img
            src="/images/ARG.png"
            alt="Argentina"
            className="h-20 w-20 rounded-xl bg-white p-2 object-contain"
          />
        </div>

        <h2 className="mt-5 text-2xl font-bold text-slate-800">
          Nguyễn Tuấn Hùng (Pixel)
        </h2>

        <p className="mt-5 text-sm leading-7 text-slate-600 sm:text-base">
          <strong className="text-slate-800">
            Nhiếp ảnh, Công nghệ, Thể thao, Du lịch
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
            className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-xl text-white transition hover:-translate-y-1 hover:bg-blue-700"
          >
            <FaFacebookF />
          </a>

          <a
            href="https://www.instagram.com/hugnpxl.jpg/"
            target="_blank"
            rel="noreferrer"
            title="Instagram"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-xl text-white transition hover:-translate-y-1"
          >
            <FaInstagram />
          </a>

          <a
            href="https://www.tiktok.com/@hugnpxl.jpg?is_from_webapp=1&sender_device=pc"
            target="_blank"
            rel="noreferrer"
            title="TikTok"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-xl text-white transition hover:-translate-y-1 hover:bg-slate-800"
          >
            <FaTiktok />
          </a>
        </div>
      </div>
    </section>
  );
}

export default AboutMe;