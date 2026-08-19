import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

const FALLBACK_AVATAR = "https://placehold.co/160x160?text=Avatar";

// Kho màu pastel ngẫu nhiên phong phú
const RANDOM_PASTEL_THEMES = [
  "bg-blue-50/85 border-blue-200 hover:bg-blue-100/90",
  "bg-emerald-50/85 border-emerald-200 hover:bg-emerald-100/90",
  "bg-purple-50/85 border-purple-200 hover:bg-purple-100/90",
  "bg-amber-50/85 border-amber-200 hover:bg-amber-100/90",
  "bg-rose-50/85 border-rose-200 hover:bg-rose-100/90",
  "bg-teal-50/85 border-teal-200 hover:bg-teal-100/90",
  "bg-cyan-50/85 border-cyan-200 hover:bg-cyan-100/90",
  "bg-indigo-50/85 border-indigo-200 hover:bg-indigo-100/90",
  "bg-lime-50/85 border-lime-200 hover:bg-lime-100/90",
  "bg-orange-50/85 border-orange-200 hover:bg-orange-100/90",
  "bg-fuchsia-50/85 border-fuchsia-200 hover:bg-fuchsia-100/90",
];

function PersonCard({ person }) {
  const navigate = useNavigate();

  // Random màu 1 lần duy nhất cho mỗi lượt render/mở popup
  const randomThemeClass = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * RANDOM_PASTEL_THEMES.length);
    return RANDOM_PASTEL_THEMES[randomIndex];
  }, []);

  const handleImageError = (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = FALLBACK_AVATAR;
  };

  return (
    <div
      onClick={() => navigate(`/person/${person.publicId}`)}
      className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-4 shadow-xs transition-all duration-200 hover:scale-[1.01] hover:shadow-md active:scale-[0.99] ${randomThemeClass}`}
    >
      <img
        src={person.avatar || FALLBACK_AVATAR}
        alt={person.name || "Avatar"}
        onError={handleImageError}
        className="h-16 w-16 shrink-0 rounded-full border-2 border-white object-cover shadow-sm ring-1 ring-black/10"
      />

      <div className="min-w-0 flex-1">
        {/* Hiển thị trọn vẹn họ tên, tự xuống dòng khi tên dài */}
        <h2 className="text-base font-bold leading-snug text-slate-800 break-words sm:text-lg">
          {person.name || "Chưa cập nhật"}
        </h2>

        {person.class && (
          <p className="mt-1 text-xs font-semibold text-slate-500 break-words">
            🎓 {person.class}
          </p>
        )}
      </div>
    </div>
  );
}

export default PersonCard;