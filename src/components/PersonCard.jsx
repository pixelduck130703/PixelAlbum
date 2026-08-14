import { useNavigate } from "react-router-dom";

const FALLBACK_AVATAR = "https://placehold.co/160x160?text=Avatar";

function PersonCard({ person }) {
  const navigate = useNavigate();

  const handleImageError = (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = FALLBACK_AVATAR;
  };

  return (
    <div
      onClick={() => navigate(`/person/${person.publicId}`)}
      className="group relative flex cursor-pointer items-center gap-4 overflow-hidden rounded-2xl border border-white/80 border-t-white/95 bg-white/40 p-3.5 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),_0_8px_20px_rgba(0,0,0,0.06)] backdrop-blur-xl transition-all duration-300 hover:border-white hover:bg-white/65 hover:shadow-[inset_0_1.5px_3px_rgba(255,255,255,1),_0_12px_28px_rgba(0,0,0,0.1)] active:scale-[0.98] sm:p-4"
    >
      {/* Vệt phản quang ánh sáng quét qua thẻ khi hover */}
      <div className="pointer-events-none absolute -left-full top-0 h-full w-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12 transition-all duration-700 group-hover:left-[150%]" />

      {/* Khung avatar hiệu ứng viên ngọc kính */}
      <div className="relative shrink-0">
        <img
          src={person.avatar || FALLBACK_AVATAR}
          alt={person.name || "Avatar"}
          onError={handleImageError}
          className="h-14 w-14 rounded-full border-2 border-white/90 object-cover shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-transform duration-300 group-hover:scale-105 sm:h-16 sm:w-16"
        />
        <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-black/5" />
      </div>

      {/* Thông tin tên */}
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-base font-extrabold text-slate-800 transition-colors group-hover:text-blue-600 sm:text-lg">
          {person.name || "Chưa cập nhật"}
        </h2>
        
        {person.nickname && (
          <p className="truncate text-xs font-semibold text-slate-500">
            @{person.nickname}
          </p>
        )}
      </div>

      {/* Mũi tên chỉ hướng phong cách kính mờ */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/80 bg-white/50 text-xs font-black text-slate-500 shadow-sm backdrop-blur-md transition-all group-hover:translate-x-0.5 group-hover:border-blue-200 group-hover:bg-blue-500/20 group-hover:text-blue-600 sm:h-9 sm:w-9">
        →
      </div>
    </div>
  );
}

export default PersonCard;