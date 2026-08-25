import {
  FaBirthdayCake,
  FaEdit,
  FaExternalLinkAlt,
  FaEye,
  FaHashtag,
  FaHistory,
  FaMapMarkerAlt,
  FaTrash,
} from "react-icons/fa";

const FALLBACK_AVATAR =
  "https://placehold.co/160x160?text=Avatar";

// Bảng màu: Desktop giữ mức nhẹ dịu (50/50), Mobile nhận tông đậm rõ (100/90)
const PASTEL_THEMES = [
  {
    // Xanh dương
    tableRowBg: "bg-blue-50/50",
    tableHoverBg: "hover:bg-blue-100/50",
    mobileCardBg: "bg-blue-100/90 border-blue-300",
    mobileHeaderBorder: "border-blue-300/80",
  },
  {
    // Xanh ngọc
    tableRowBg: "bg-emerald-50/50",
    tableHoverBg: "hover:bg-emerald-100/50",
    mobileCardBg: "bg-emerald-100/90 border-emerald-300",
    mobileHeaderBorder: "border-emerald-300/80",
  },
  {
    // Tím
    tableRowBg: "bg-purple-50/50",
    tableHoverBg: "hover:bg-purple-100/50",
    mobileCardBg: "bg-purple-100/90 border-purple-300",
    mobileHeaderBorder: "border-purple-300/80",
  },
  {
    // Vàng cam
    tableRowBg: "bg-amber-50/50",
    tableHoverBg: "hover:bg-amber-100/50",
    mobileCardBg: "bg-amber-100/90 border-amber-300",
    mobileHeaderBorder: "border-amber-300/80",
  },
  {
    // Hồng
    tableRowBg: "bg-rose-50/50",
    tableHoverBg: "hover:bg-rose-100/50",
    mobileCardBg: "bg-rose-100/90 border-rose-300",
    mobileHeaderBorder: "border-rose-300/80",
  },
  {
    // Xanh mòng két
    tableRowBg: "bg-teal-50/50",
    tableHoverBg: "hover:bg-teal-100/50",
    mobileCardBg: "bg-teal-100/90 border-teal-300",
    mobileHeaderBorder: "border-teal-300/80",
  },
];

function getCardPastelTheme(index) {
  return PASTEL_THEMES[index % PASTEL_THEMES.length];
}

function PersonTable({
  people = [],
  onEdit,
  onDelete,
  onViewHistory,
}) {
  const formatBirthday = (birthday) => {
    if (!birthday) {
      return "Chưa cập nhật";
    }

    const normalized = String(birthday).slice(0, 10);
    const [year, month, day] = normalized.split("-");

    if (!year || !month || !day) {
      return birthday;
    }

    return `${day}/${month}/${year}`;
  };

  const formatAlbumViews = (albumViews) => {
    return Number(albumViews || 0).toLocaleString("vi-VN");
  };

  const handleImageError = (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = FALLBACK_AVATAR;
  };

  const getGenderStyle = (gender) => {
    if (gender === "Nam") {
      return "bg-blue-100 text-blue-800 ring-blue-300";
    }

    if (gender === "Nữ") {
      return "bg-pink-100 text-pink-800 ring-pink-300";
    }

    return "bg-slate-200 text-slate-700 ring-slate-300";
  };

  if (people.length === 0) {
    return (
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-4xl">
            🖼️
          </div>

          <h3 className="mt-5 text-xl font-bold text-slate-800">
            Chưa có album
          </h3>

          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
            Danh sách hiện chưa có dữ liệu phù hợp với nội dung tìm kiếm.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ================= Desktop ================= */}
      <div className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm md:block">
        <div className="overflow-x-auto">
          <div className="max-h-[680px] overflow-y-auto">
            <table className="w-full min-w-[1100px] table-fixed border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
                <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <th className="w-[5%] px-1 py-4 text-center">
                    ID
                  </th>

                  <th className="w-[28%] px-6 py-4 text-left">
                    Thông tin album
                  </th>

                  <th className="w-[13%] px-4 py-4 text-center">
                    Ngày sinh
                  </th>

                  <th className="w-[10%] px-4 py-4 text-center">
                    Giới tính
                  </th>

                  <th className="w-[15%] px-5 py-4 text-center">
                    Quê quán/Địa điểm
                  </th>

                  <th className="w-[10%] px-4 py-4 text-center">
                    Lượt xem
                  </th>

                  <th className="w-[9%] px-4 py-4 text-center">
                    Liên kết
                  </th>

                  <th className="w-[10%] px-4 py-4 text-center">
                    Thao tác
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200/70">
                {people.map((person, index) => {
                  const theme = getCardPastelTheme(index);

                  return (
                    <tr
                      key={person.id}
                      className={`group transition-colors duration-150 ${theme.tableRowBg} ${theme.tableHoverBg}`}
                    >
                      {/* Cột ID */}
                      <td className="px-1 py-4 text-center align-middle">
                        <span className="inline-flex min-w-[28px] items-center justify-center rounded-lg bg-white/95 border border-slate-200/90 px-1.5 py-1 text-xs font-mono font-black text-slate-700 shadow-2xs">
                          {person.id}
                        </span>
                      </td>

                      {/* Thông tin album */}
                      <td className="px-6 py-4 align-middle">
                        <div className="flex min-w-0 items-center gap-4">
                          <div className="relative shrink-0">
                            <img
                              src={person.avatar || FALLBACK_AVATAR}
                              alt={person.name || "Avatar"}
                              onError={handleImageError}
                              className="h-14 w-14 rounded-full border border-slate-200 object-cover shadow-xs"
                            />
                          </div>

                          <div className="min-w-0 flex-1 py-1">
                            <p
                              title={person.name || "Chưa cập nhật"}
                              className="text-[17px] font-bold leading-snug text-slate-800 break-words transition group-hover:text-blue-700"
                            >
                              {person.name || "Chưa cập nhật"}
                            </p>

                            {person.class && (
                              <span className="mt-2 inline-flex max-w-full truncate rounded-full bg-white/90 border border-slate-200/80 px-2.5 py-1 text-[11px] font-medium text-slate-600 shadow-2xs">
                                🎓 {person.class}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Ngày sinh */}
                      <td className="px-4 py-4 text-center align-middle">
                        <span className="inline-flex min-w-[110px] items-center justify-center gap-1.5 whitespace-nowrap text-sm text-slate-600">
                          <FaBirthdayCake className="shrink-0 text-pink-400" />

                          {formatBirthday(person.birthday)}
                        </span>
                      </td>

                      {/* Giới tính */}
                      <td className="px-4 py-4 text-center align-middle">
                        <span
                          className={`inline-flex min-w-[68px] items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${getGenderStyle(
                            person.gender
                          )}`}
                        >
                          {person.gender || "Khác"}
                        </span>
                      </td>

                      {/* Quê quán */}
                      <td className="px-5 py-4 text-center align-middle">
                        <div className="mx-auto flex max-w-[170px] items-center justify-center gap-2 text-sm text-slate-600">
                          <FaMapMarkerAlt className="shrink-0 text-red-400" />

                          <span
                            title={person.address || "Chưa cập nhật"}
                            className="block min-w-0 truncate font-medium"
                          >
                            {person.address || "Chưa cập nhật"}
                          </span>
                        </div>
                      </td>

                      {/* Lượt xem */}
                      <td className="px-4 py-4 text-center align-middle">
                        {person.album ? (
                          <span className="inline-flex h-9 w-[92px] items-center justify-center gap-2 rounded-full bg-white/90 border border-indigo-100 px-3 text-xs font-bold text-indigo-700 shadow-2xs">
                            <FaEye className="shrink-0 text-indigo-500" />

                            {formatAlbumViews(person.albumViews)}
                          </span>
                        ) : (
                          <span className="inline-flex min-h-9 items-center justify-center text-xs text-slate-400">
                            Chưa có album
                          </span>
                        )}
                      </td>

                      {/* Liên kết album (Nút Mở chuẩn Liquid Glass) */}
                      <td className="px-4 py-4 text-center align-middle">
                        {person.album ? (
                          <a
                            href={person.album}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative inline-flex min-h-[38px] w-[82px] items-center justify-center gap-1.5 overflow-hidden rounded-xl border border-blue-300/80 bg-blue-500/15 px-3 py-1.5 text-xs font-bold text-blue-950 shadow-[0_4px_16px_0_rgba(59,130,246,0.15)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.03] hover:bg-blue-500/25 hover:shadow-[0_6px_20px_0_rgba(59,130,246,0.25)] active:scale-[0.98] cursor-pointer"
                          >
                            <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-xl bg-gradient-to-b from-white/60 to-transparent" />
                            <FaExternalLinkAlt className="relative z-10 shrink-0 text-[10px]" />
                            <span className="relative z-10">Mở</span>
                          </a>
                        ) : (
                          <span className="inline-flex h-9 w-[82px] items-center justify-center rounded-full bg-white/80 border border-slate-200/60 px-3 text-xs font-medium text-slate-400">
                            Chưa có
                          </span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="px-4 py-4 text-center align-middle">
                        <div className="flex items-center justify-center gap-2">

                          {/* Lịch sử */}
                          {person.album && (
                            <button
                              type="button"
                              onClick={() => onViewHistory(person)}
                              className="flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-100 bg-white/90 text-indigo-600 shadow-2xs transition hover:bg-indigo-50 hover:shadow-sm active:scale-95 cursor-pointer"
                              title="Xem lịch sử"
                              aria-label={`Xem lịch sử ${person.name}`}
                            >
                              <FaHistory />
                            </button>
                          )}

                          {/* Sửa */}
                          <button
                            type="button"
                            onClick={() => onEdit(person)}
                            className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-100 bg-white/90 text-amber-600 shadow-2xs transition hover:bg-amber-50 hover:shadow-sm active:scale-95 cursor-pointer"
                            title="Sửa album"
                            aria-label={`Sửa ${person.name}`}
                          >
                            <FaEdit />
                          </button>

                          {/* Xóa */}
                          <button
                            type="button"
                            onClick={() => onDelete(person.id)}
                            className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-100 bg-white/90 text-red-600 shadow-2xs transition hover:bg-red-50 hover:shadow-sm active:scale-95 cursor-pointer"
                            title="Xóa album"
                            aria-label={`Xóa ${person.name}`}
                          >
                            <FaTrash />
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ================= Mobile ================= */}
      <div className="space-y-3.5 md:hidden">
        {people.map((person, index) => {
          const theme = getCardPastelTheme(index);

          return (
            <article
              key={person.id}
              className={`overflow-hidden rounded-2xl border ${theme.mobileCardBg} shadow-xs`}
            >
              {/* Header Thẻ */}
              <div className={`border-b ${theme.mobileHeaderBorder} p-4`}>
                <div className="flex items-center gap-3">
                  {/* Avatar tròn */}
                  <img
                    src={person.avatar || FALLBACK_AVATAR}
                    alt={person.name || "Avatar"}
                    onError={handleImageError}
                    className="h-16 w-16 shrink-0 rounded-full border-2 border-white object-cover shadow-sm ring-1 ring-black/10"
                  />

                  {/* Thông tin chính */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3
                        title={person.name}
                        className="truncate text-[17px] font-bold text-slate-900"
                      >
                        {person.name || "Chưa cập nhật"}
                      </h3>

                      {/* Giới tính */}
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${getGenderStyle(
                          person.gender
                        )}`}
                      >
                        {person.gender || "Khác"}
                      </span>
                    </div>

                    <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-700">
                      <FaBirthdayCake className="shrink-0 text-pink-500" />

                      <span className="truncate">
                        {formatBirthday(person.birthday)}
                      </span>
                    </p>

                    {person.class && (
                      <div className="mt-2">
                        <span className="inline-flex max-w-[170px] truncate rounded-full bg-white/95 border border-black/10 px-2.5 py-1 text-[11px] font-medium text-slate-700 shadow-2xs">
                          🎓 {person.class}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Nội dung Thẻ */}
              <div className="p-4">
                <div className="grid grid-cols-5 gap-2.5">
                  {/* Quê quán (3 cột - Căn giữa toàn bộ) */}
                  <div className="col-span-3 flex flex-col items-center justify-between rounded-xl bg-white/95 border border-black/10 p-2.5 shadow-2xs text-center">
                    <p className="w-full truncate text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      Quê quán/Địa điểm
                    </p>

                    <p className="mt-1.5 flex w-full items-center justify-center gap-1.5 line-clamp-2 text-sm font-semibold leading-5 text-slate-800">
                      <FaMapMarkerAlt className="shrink-0 text-red-500 text-xs" />
                      <span className="truncate">{person.address || "Chưa cập nhật"}</span>
                    </p>
                  </div>

                  {/* 2 cột còn lại: ID & Lượt xem */}
                  <div className="col-span-2 grid grid-cols-[1.3fr_0.7fr] gap-1.5">
                    {/* Thẻ Lượt xem (Căn giữa) */}
                    <div className="flex flex-col items-center justify-between rounded-xl bg-white/95 border border-black/10 p-2 shadow-2xs text-center">
                      <p className="w-full truncate text-[9px] font-bold uppercase tracking-wide text-indigo-600">
                        Lượt xem
                      </p>

                      <p className="mt-1 flex w-full items-center justify-center gap-1 text-sm font-extrabold text-indigo-700">
                        <span className="truncate">
                          {person.album
                            ? formatAlbumViews(person.albumViews)
                            : "0"}
                        </span>
                      </p>
                    </div>

                    {/* Thẻ ID (Căn giữa) */}
                    <div className="flex flex-col items-center justify-between rounded-xl bg-white/95 border border-black/10 p-2 shadow-2xs text-center">
                      <p className="w-full truncate text-[9px] font-bold uppercase tracking-wide text-indigo-600">
                        ID
                      </p>

                      <p className="mt-1 flex w-full items-center justify-center gap-1 text-sm font-extrabold text-indigo-700">
                        <span className="truncate">{person.id}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Xem album (Nút Mở chuẩn Liquid Glass trên Mobile) */}
                {person.album ? (
                  <a
                    href={person.album}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 overflow-hidden rounded-xl border border-blue-300/80 bg-blue-500/15 px-4 py-3 text-sm font-bold text-blue-950 shadow-[0_6px_24px_0_rgba(59,130,246,0.15)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-blue-500/25 active:scale-[0.98] cursor-pointer"
                  >
                    <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-xl bg-gradient-to-b from-white/60 to-transparent" />
                    <FaExternalLinkAlt className="relative z-10 shrink-0 text-xs" />
                    <span className="relative z-10">Xem album</span>
                  </a>
                ) : (
                  <div className="mt-4 flex min-h-[48px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/60 px-4 text-center text-sm font-medium text-slate-500">
                    Chưa có liên kết album
                  </div>
                )}

                {/* Thao tác */}
                <div className="mt-3 grid grid-cols-3 gap-2">

                  {/* Lịch sử */}
                  {person.album ? (
                    <button
                      type="button"
                      onClick={() => onViewHistory(person)}
                      className="flex min-h-[46px] items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-white/95 px-2 py-3 text-sm font-semibold text-indigo-700 shadow-2xs transition active:bg-indigo-50 cursor-pointer"
                    >
                      <FaHistory />
                      Lịch sử
                    </button>
                  ) : (
                    <div className="flex min-h-[46px] items-center justify-center rounded-xl bg-white/40 px-2 py-3 text-xs font-medium text-slate-400">
                      Lịch sử
                    </div>
                  )}

                  {/* Sửa */}
                  <button
                    type="button"
                    onClick={() => onEdit(person)}
                    className="flex min-h-[46px] items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-white/95 px-2 py-3 text-sm font-semibold text-amber-700 shadow-2xs transition active:bg-amber-50 cursor-pointer"
                  >
                    <FaEdit />
                    Sửa
                  </button>

                  {/* Xóa */}
                  <button
                    type="button"
                    onClick={() => onDelete(person.id)}
                    className="flex min-h-[46px] items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-white/95 px-2 py-3 text-sm font-semibold text-red-700 shadow-2xs transition active:bg-red-50 cursor-pointer"
                  >
                    <FaTrash />
                    Xóa
                  </button>

                </div>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}

export default PersonTable;