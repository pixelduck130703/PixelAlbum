import {
  FaEdit,
  FaTrash,
  FaExternalLinkAlt,
  FaEye,
} from "react-icons/fa";

function PersonTable({ people, onEdit, onDelete }) {
  const formatBirthday = (birthday) => {
    if (!birthday) {
      return "Chưa cập nhật";
    }

    const [year, month, day] = birthday.split("-");

    if (!year || !month || !day) {
      return birthday;
    }

    return `${day}/${month}/${year}`;
  };

  const formatAlbumViews = (albumViews) => {
    return Number(albumViews || 0).toLocaleString("vi-VN");
  };

  if (!people || people.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
        <div className="text-5xl">👥</div>

        <h3 className="mt-4 text-xl font-semibold text-slate-800">
          Chưa có dữ liệu
        </h3>

        <p className="mt-2 text-slate-500">
          Hiện chưa có người nào trong hệ thống.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* ================= Desktop ================= */}
      <div className="hidden overflow-hidden rounded-2xl bg-white shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px]">
            <thead className="bg-slate-100">
              <tr className="text-left text-sm font-semibold text-slate-600">
                <th className="px-6 py-4">
                  Họ và tên
                </th>

                <th className="px-6 py-4">
                  Ngày sinh
                </th>

                <th className="px-6 py-4">
                  Giới tính
                </th>

                <th className="px-6 py-4">
                  Quê quán
                </th>

                <th className="px-6 py-4 text-center">
                  Lượt xem album
                </th>

                <th className="px-6 py-4 text-center">
                  Album
                </th>

                <th className="px-6 py-4 text-center">
                  Thao tác
                </th>
              </tr>
            </thead>

            <tbody>
              {people.map((person) => (
                <tr
                  key={person.id}
                  className="border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={
                          person.avatar ||
                          "https://placehold.co/100x100?text=Avatar"
                        }
                        alt={person.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />

                      <div className="font-bold text-slate-800">
                        {person.name}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    {formatBirthday(person.birthday)}
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    {person.gender || "Chưa cập nhật"}
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    {person.address || "Chưa cập nhật"}
                  </td>

                  <td className="px-6 py-4 text-center">
                    {person.album ? (
                      <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
                        <FaEye />

                        {formatAlbumViews(
                          person.albumViews
                        )}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-400">
                        Chưa có album
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-center">
                    {person.album ? (
                      <a
                        href={person.album}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-blue-600 transition hover:bg-blue-100"
                      >
                        <FaExternalLinkAlt />

                        Album
                      </a>
                    ) : (
                      <span className="text-slate-400">
                        Chưa có
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(person)}
                        className="rounded-lg bg-amber-50 p-3 text-amber-600 transition hover:bg-amber-100"
                        title="Sửa"
                      >
                        <FaEdit />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          onDelete(person.id)
                        }
                        className="rounded-lg bg-red-50 p-3 text-red-600 transition hover:bg-red-100"
                        title="Xóa"
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

      {/* ================= Mobile ================= */}
      <div className="space-y-4 md:hidden">
        {people.map((person) => (
          <div
            key={person.id}
            className="rounded-2xl bg-white p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <img
                src={
                  person.avatar ||
                  "https://placehold.co/100x100?text=Avatar"
                }
                alt={person.name}
                className="h-16 w-16 rounded-full object-cover"
              />

              <div className="min-w-0 flex-1">
                <h3 className="truncate text-lg font-bold text-slate-800">
                  {person.name}
                </h3>

                <p className="text-sm text-slate-500">
                  {formatBirthday(person.birthday)}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <p>
                <span className="font-semibold">
                  Giới tính:
                </span>{" "}
                {person.gender || "Chưa cập nhật"}
              </p>

              <p>
                <span className="font-semibold">
                  Quê quán:
                </span>{" "}
                {person.address || "Chưa cập nhật"}
              </p>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3">
                <span className="font-semibold">
                  Lượt xem album:
                </span>

                {person.album ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 font-semibold text-blue-700">
                    <FaEye />

                    {formatAlbumViews(
                      person.albumViews
                    )}
                  </span>
                ) : (
                  <span className="text-slate-400">
                    Chưa có album
                  </span>
                )}
              </div>
            </div>

            {person.album && (
              <a
                href={person.album}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                <FaExternalLinkAlt />

                Xem album
              </a>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onEdit(person)}
                className="rounded-xl bg-amber-500 py-3 font-semibold text-white transition hover:bg-amber-600"
              >
                <FaEdit className="mr-2 inline" />
                Sửa
              </button>

              <button
                type="button"
                onClick={() =>
                  onDelete(person.id)
                }
                className="rounded-xl bg-red-600 py-3 font-semibold text-white transition hover:bg-red-700"
              >
                <FaTrash className="mr-2 inline" />
                Xóa
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default PersonTable;