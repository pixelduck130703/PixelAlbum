import {
  FaReact,
  FaNodeJs,
  FaApple,
} from "react-icons/fa";

import {
  SiVite,
  SiTailwindcss,
  SiExpress,
  SiSqlite,
  SiJsonwebtokens,
  SiCloudinary,
  SiGooglephotos,
  SiGoogledrive,
  SiSamsung,
  SiXiaomi,
  SiSony,
  SiVivo,
  SiOppo,
  SiGoogle,
  SiLeica,
  SiGithub,
  SiDocker,
  SiVercel,
  SiPostgresql,
  SiNeon,
} from "react-icons/si";
import { FcGoogle } from "react-icons/fc";

function Footer() {
  return (
    <footer className="mt-20 border-t bg-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mt-8 flex flex-wrap items-start justify-center gap-10">

          {/* Thiết bị */}
          <div>
            <h3 className="mb-4 text-center text-lg font-bold text-slate-700">
              Đồng hành cùng
            </h3>

            <div className="flex flex-wrap justify-center gap-8 text-4xl">
              <a
                href="https://www.apple.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Item
                  icon={<FaApple className="text-gray-800" />}
                  text="Apple"
                />
              </a>
              <a
                href="https://www.samsung.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Item icon={<SiSamsung className="text-blue-600" />} text="Samsung" />
              </a>

              <a
                href="https://www.mi.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Item icon={<SiXiaomi className="text-orange-500" />} text="Xiaomi" />
              </a>

              <a
                href="https://leicavietnam.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Item icon={<SiLeica className="text-red-500" />} text="Leica" />
              </a>

              <a
                href="https://www.sony.com.vn"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Item icon={<SiSony className="text-black" />} text="Sony" />
              </a>

              <a
                href="https://www.tamron.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Item
                  icon={
                    <img
                      src="/images/Tamron.png"
                      alt="Tamron"
                      className="h-9 w-9 object-contain"
                    />
                  }
                  text="Tamron"
                />
              </a>

              <a
                href="https://www.oppo.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Item icon={<SiOppo className="text-green-700" />} text="Oppo" />
              </a>

              <a
                href="https://www.vivo.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Item icon={<SiVivo className="text-blue-500" />} text="Vivo" />
              </a>
              <a
                href="https://vingroup.net"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Item
                  icon={
                    <img
                      src="/images/Vsmart.webp"
                      alt="Vsmart"
                      className="h-9 w-9 object-contain"
                    />
                  }
                  text="Vsmart"
                />
              </a>
            </div>
          </div>

          {/* Dịch vụ lưu trữ */}
          <div>
            <h3 className="mb-4 text-center text-lg font-bold text-slate-700">
              Dịch vụ lưu trữ
            </h3>

            <div className="flex flex-wrap justify-center gap-8 text-4xl">
              <a
                href="https://www.google.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Item icon={<FcGoogle className="text-4xl" />} text="Google" />
              </a>

              <a
                href="https://photos.google.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Item
                  icon={<SiGooglephotos className="text-red-600" />}
                  text="Photos"
                />
              </a>

              <a
                href="https://cloudinary.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Item
                  icon={<SiCloudinary className="text-blue-500" />}
                  text="Cloudinary"
                />
              </a>

              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Item icon={<SiGithub className="text-black" />} text="Github" />
              </a>

              <a
                href="https://vercel.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Item icon={<SiVercel className="text-black" />} text="Vercel" />
              </a>

              <a
                href="https://www.docker.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Item icon={<SiDocker className="text-blue-500" />} text="Docker" />
              </a>

              <a
                href="https://www.postgresql.org"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Item
                  icon={<SiPostgresql className="text-blue-700" />}
                  text="PostgreSQL"
                />
              </a>

              <a
                href="hhttps://neon.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Item
                  icon={<SiNeon className="text-green-400" />}
                  text="Neon"
                />
              </a>
            </div>
          </div>

        </div>

        {/* Công nghệ */}
        <h3 className="mt-6 text-center text-lg font-bold text-slate-700">
          Công nghệ sử dụng
        </h3>

        <div className="mt-6 flex flex-wrap justify-center gap-8 text-4xl">

          <Item icon={<FaReact className="text-sky-500" />} text="React" />

          <Item icon={<SiVite className="text-violet-500" />} text="Vite" />

          <Item
            icon={<SiTailwindcss className="text-cyan-500" />}
            text="Tailwind"
          />

          <Item icon={<FaNodeJs className="text-green-600" />} text="Node.js" />

          <Item icon={<SiExpress />} text="Express" />

          <Item
            icon={<SiJsonwebtokens className="text-pink-500" />}
            text="JWT"
          />
        </div>

        <div className="mt-10 border-t pt-6 text-center text-gray-500">
          © 2026 <span className="font-semibold">ALBUM ẢNH</span>
          <br />
          Copyright © by Nguyễn Tuấn Hùng (Pixel)
        </div>

      </div>
    </footer>
  );
}

function Item({ icon, text }) {
  return (
    <div className="flex flex-col items-center gap-2 transition duration-200 hover:scale-110">
      {icon}
      <span className="text-sm text-gray-600">{text}</span>
    </div>
  );
}

export default Footer;