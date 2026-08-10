import {
  FaBirthdayCake,
  FaEdit,
  FaExternalLinkAlt,
  FaEye,
  FaMapMarkerAlt,
  FaTrash,
} from "react-icons/fa";

const FALLBACK_AVATAR =
  "https://placehold.co/160x160?text=Avatar";

function PersonTable({
  people = [],
  onEdit,
  onDelete,
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
      return "bg-blue-50 text-blue-700 ring-blue-100";
    }

    if (gender === "Nữ") {
      return "bg-pink-50 text-pink-700 ring-pink-100";
    }

    return "bg-slate-100 text-slate-600 ring-slate-200";
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
            <table className="w-full min-w-[1100px] table-fixed">
              <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
                <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <th className="w-[30%] px-6 py-4 text-left">
                    Thông tin album
                  </th>

                  <th className="w-[14%] px-4 py-4 text-center">
                    Ngày sinh
                  </th>

                  <th className="w-[10%] px-4 py-4 text-center">
                    Giới tính
                  </th>

                  <th className="w-[16%] px-5 py-4 text-center">
                    Quê quán
                  </th>

                  <th className="w-[11%] px-4 py-4 text-center">
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

              <tbody className="divide-y divide-slate-100">
                {people.map((person) => (
                  <tr
                    key={person.id}
                    className="group h-[84px] transition duration-200 hover:bg-blue-50/40"
                  >
                    {/* Thông tin album */}
                    <td className="px-6 py-4 align-middle">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="relative shrink-0">
                          <img
                            src={person.avatar || FALLBACK_AVATAR}
                            alt={person.name || "Avatar"}
                            onError={handleImageError}
                            className="h-14 w-14 rounded-full border border-slate-200 object-cover shadow-sm"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p
                            title={person.name || "Chưa cập nhật"}
                            className="truncate text-[18px] font-bold text-slate-800 transition group-hover:text-blue-700"
                          >
                            {person.name || "Chưa cập nhật"}
                          </p>

                          {person.class && (
                            <span className="mt-2 inline-flex max-w-full truncate rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
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
                          className="block min-w-0 truncate"
                        >
                          {person.address || "Chưa cập nhật"}
                        </span>
                      </div>
                    </td>

                    {/* Lượt xem */}
                    <td className="px-4 py-4 text-center align-middle">
                      {person.album ? (
                        <span className="inline-flex h-9 w-[92px] items-center justify-center gap-2 rounded-full bg-indigo-50 px-3 text-xs font-bold text-indigo-700">
                          <FaEye className="shrink-0" />

                          {formatAlbumViews(person.albumViews)}
                        </span>
                      ) : (
                        <span className="inline-flex min-h-9 items-center justify-center text-xs text-slate-400">
                          Chưa có album
                        </span>
                      )}
                    </td>

                    {/* Liên kết album */}
                    <td className="px-4 py-4 text-center align-middle">
                      {person.album ? (
                        <a
                          href={person.album}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-10 w-[82px] items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md"
                        >
                          <FaExternalLinkAlt className="shrink-0 text-xs" />

                          Mở
                        </a>
                      ) : (
                        <span className="inline-flex h-9 w-[82px] items-center justify-center rounded-full bg-slate-100 px-3 text-xs font-medium text-slate-400">
                          Chưa có
                        </span>
                      )}
                    </td>

                    {/* Thao tác */}
                    <td className="px-4 py-4 text-center align-middle">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => onEdit(person)}
                          className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition hover:bg-amber-100 hover:shadow-sm"
                          title="Sửa album"
                          aria-label={`Sửa ${person.name}`}
                        >
                          <FaEdit />
                        </button>

                        <button
                          type="button"
                          onClick={() => onDelete(person.id)}
                          className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600 transition hover:bg-red-100 hover:shadow-sm"
                          title="Xóa album"
                          aria-label={`Xóa ${person.name}`}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ================= Mobile ================= */}
<div className="space-y-3 md:hidden">
  {people.map((person) => (
    <article
      key={person.id}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      {/* Header */}
      <div className="border-b border-slate-100 bg-gradient-to-r from-white to-blue-50/50 p-4">
        <div className="flex items-center gap-3">
          {/* Avatar tròn */}
          <img
            src={person.avatar || FALLBACK_AVATAR}
            alt={person.name || "Avatar"}
            onError={handleImageError}
            className="h-16 w-16 shrink-0 rounded-full border-2 border-white object-cover shadow-md ring-1 ring-slate-200"
          />

          {/* Thông tin chính */}
          <div className="min-w-0 flex-1">
            <h3
              title={person.name}
              className="truncate text-[17px] font-bold text-slate-800"
            >
              {person.name || "Chưa cập nhật"}
            </h3>

            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <FaBirthdayCake className="shrink-0 text-pink-400" />

              <span className="truncate">
                {formatBirthday(person.birthday)}
              </span>
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              <span
                className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${getGenderStyle(
                  person.gender
                )}`}
              >
                {person.gender || "Khác"}
              </span>

              {person.class && (
                <span className="max-w-[150px] truncate rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                  🎓 {person.class}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Nội dung */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3">
          {/* Quê quán */}
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Quê quán
            </p>

            <p className="mt-2 line-clamp-2 text-sm font-medium leading-5 text-slate-700">
              <FaMapMarkerAlt className="mr-1 inline text-red-400" />

              {person.address || "Chưa cập nhật"}
            </p>
          </div>

          {/* Lượt xem */}
          <div className="rounded-xl bg-indigo-50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-400">
              Lượt xem
            </p>

            <p className="mt-2 flex items-center gap-2 text-lg font-bold text-indigo-700">
              <FaEye className="shrink-0" />

              {person.album
                ? formatAlbumViews(person.albumViews)
                : "0"}
            </p>
          </div>
        </div>

        {/* Xem album */}
        {person.album ? (
          <a
            href={person.album}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition active:bg-blue-700"
          >
            <FaExternalLinkAlt />
            Xem album
          </a>
        ) : (
          <div className="mt-4 flex min-h-[48px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 text-center text-sm font-medium text-slate-400">
            Chưa có liên kết album
          </div>
        )}

        {/* Thao tác */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onEdit(person)}
            className="flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 transition active:bg-amber-100"
          >
            <FaEdit />
            Sửa
          </button>

          <button
            type="button"
            onClick={() => onDelete(person.id)}
            className="flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition active:bg-red-100"
          >
            <FaTrash />
            Xóa
          </button>
        </div>
      </div>
    </article>
  ))}
</div>
    </>
  );
}

export default PersonTable;