import {
  FaReact,
  FaNodeJs,
  FaApple,
} from "react-icons/fa";

import {
  SiTailwindcss,
  SiExpress,
  SiJsonwebtokens,
  SiCloudinary,
  SiSamsung,
  SiXiaomi,
  SiSony,
  SiVivo,
  SiOppo,
  SiLeica,
  SiGithub,
  SiDocker,
  SiVercel,
  SiPostgresql,
  SiNeon,
  SiDji,
} from "react-icons/si";

function HomePartners() {
  return (
    <section className="mt-8 overflow-hidden rounded-3xl border border-white/80 border-t-white/95 bg-white/45 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.95),_0_20px_50px_rgba(0,0,0,0.08)] backdrop-blur-2xl backdrop-saturate-150">
      <div className="px-4 py-6 sm:px-6 sm:py-8">

        {/* =========================
            ĐỒNG HÀNH CÙNG TÔI
        ========================= */}
        <div>
          <h2 className="text-center text-lg font-black text-slate-800 sm:text-xl">
            Đồng hành cùng tôi
          </h2>

          <div className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-5 sm:gap-x-6 lg:gap-x-8">
            <ExternalItem
              href="https://www.apple.com"
              icon={
                <FaApple className="text-slate-800" />
              }
              text="Apple"
            />

            <ExternalItem
              href="https://www.samsung.com"
              icon={
                <SiSamsung className="text-blue-600" />
              }
              text="Samsung"
            />

            <ExternalItem
              href="https://www.mi.com"
              icon={
                <SiXiaomi className="text-orange-500" />
              }
              text="Xiaomi"
            />

            <ExternalItem
              href="https://leicavietnam.com/"
              icon={
                <SiLeica className="text-red-500" />
              }
              text="Leica"
            />

            <ExternalItem
              href="https://www.sony.com.vn"
              icon={
                <SiSony className="text-black" />
              }
              text="Sony"
            />

            <ExternalItem
              href="https://alphauniverse.com/"
              icon={
                <img
                  src="/images/SonyAlpha.webp"
                  alt="Alpha"
                  className="h-8 w-8 object-contain sm:h-9 sm:w-9"
                />
              }
              text="Alpha"
            />

            <ExternalItem
              href="https://www.tamron.com"
              icon={
                <img
                  src="/images/Tamron.png"
                  alt="Tamron"
                  className="h-8 w-8 object-contain sm:h-9 sm:w-9"
                />
              }
              text="Tamron"
            />

            <ExternalItem
              href="https://www.oppo.com"
              icon={
                <SiOppo className="text-green-700" />
              }
              text="Oppo"
            />

            <ExternalItem
              href="https://www.vivo.com"
              icon={
                <SiVivo className="text-blue-500" />
              }
              text="Vivo"
            />

            <ExternalItem
              href="https://vingroup.net"
              icon={
                <img
                  src="/images/Vsmart.webp"
                  alt="Vsmart"
                  className="h-8 w-8 object-contain sm:h-9 sm:w-9"
                />
              }
              text="Vsmart"
            />

            <ExternalItem
              href="https://www.djivietnam.com.vn"
              icon={
                <SiDji className="text-black" />
              }
              text="DJI"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="my-7 h-px bg-slate-100" />

        {/* =========================
            DỊCH VỤ LƯU TRỮ
        ========================= */}
        <div>
          <h2 className="text-center text-lg font-black text-slate-800 sm:text-xl">
            Dịch vụ lưu trữ
          </h2>

          <div className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-5 sm:gap-x-6 lg:gap-x-8">
            <ExternalItem
              href="https://photos.google.com/"
              icon={
                <img
                  src="/images/Photos.webp"
                  alt="Photos"
                  className="h-8 w-8 object-contain sm:h-9 sm:w-9"
                />
              }
              text="Photos"
            />

            <ExternalItem
              href="https://cloudinary.com"
              icon={
                <SiCloudinary className="text-blue-500" />
              }
              text="Cloudinary"
            />

            <ExternalItem
              href="https://github.com"
              icon={
                <SiGithub className="text-black" />
              }
              text="Github"
            />

            <ExternalItem
              href="https://vercel.com"
              icon={
                <SiVercel className="text-black" />
              }
              text="Vercel"
            />

            <ExternalItem
              href="https://www.docker.com"
              icon={
                <SiDocker className="text-blue-500" />
              }
              text="Docker"
            />

            <ExternalItem
              href="https://www.postgresql.org"
              icon={
                <SiPostgresql className="text-blue-700" />
              }
              text="PostgreSQL"
            />

            <ExternalItem
              href="https://neon.com/"
              icon={
                <SiNeon className="text-emerald-500" />
              }
              text="Neon"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="my-7 h-px bg-slate-100" />

        {/* =========================
            CÔNG NGHỆ SỬ DỤNG
        ========================= */}
        <div>
          <h2 className="text-center text-lg font-black text-slate-800 sm:text-xl">
            Công nghệ sử dụng
          </h2>

          <div className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-5 sm:gap-x-6 lg:gap-x-8">
            <Item
              icon={
                <FaReact className="text-sky-500" />
              }
              text="React"
            />

            <Item
              icon={
                <SiTailwindcss className="text-cyan-500" />
              }
              text="Tailwind"
            />

            <Item
              icon={
                <FaNodeJs className="text-green-600" />
              }
              text="Node.js"
            />

            <Item
              icon={
                <SiExpress className="text-slate-800" />
              }
              text="Express"
            />

            <Item
              icon={
                <SiJsonwebtokens className="text-pink-500" />
              }
              text="JWT"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function ExternalItem({
  href,
  icon,
  text,
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="shrink-0"
    >
      <Item
        icon={icon}
        text={text}
      />
    </a>
  );
}

function Item({
  icon,
  text,
}) {
  return (
    <div className="flex w-[64px] shrink-0 flex-col items-center justify-center gap-1.5 text-center transition duration-200 hover:-translate-y-1 sm:w-[72px]">
      <div className="flex h-10 w-10 items-center justify-center text-3xl sm:h-11 sm:w-11 sm:text-4xl">
        {icon}
      </div>

      <span className="w-full truncate text-center text-[10px] font-medium text-slate-500 sm:text-xs">
        {text}
      </span>
    </div>
  );
}

export default HomePartners;