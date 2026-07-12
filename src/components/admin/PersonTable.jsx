import { FaEdit, FaTrash, FaExternalLinkAlt } from "react-icons/fa";

function PersonTable({ people, onEdit, onDelete }) {
  const formatBirthday = (birthday) => {
    if (!birthday) return "Chưa cập nhật";

    const [year, month, day] = birthday.split("-");

    if (!year || !month || !day) {
      return birthday;
    }

    return `${day}/${month}/${year}`;
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
          <table className="w-full min-w-[900px]">
            <thead className="bg-slate-100">
              <tr className="text-left text-sm font-semibold text-slate-600">
                <th className="px-6 py-4">Họ và tên</th>
                <th className="px-6 py-4">Ngày sinh</th>
                <th className="px-6 py-4">Giới tính</th>
                <th className="px-6 py-4">Quê quán</th>
                <th className="px-6 py-4">Album</th>
                <th className="px-6 py-4 text-center">Thao tác</th>
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

                      <div className="font-bold">
                        {person.name}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    {formatBirthday(person.birthday)}
                  </td>

                  <td className="px-6 py-4">
                    {person.gender || "Chưa cập nhật"}
                  </td>

                  <td className="px-6 py-4">
                    {person.address || "Chưa cập nhật"}
                  </td>

                  <td className="px-6 py-4">
                    {person.album ? (
                      <a
                        href={person.album}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-blue-600"
                      >
                        <FaExternalLinkAlt />
                        Album
                      </a>
                    ) : (
                      "Chưa có"
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => onEdit(person)}
                        className="rounded-lg bg-amber-50 p-3 text-amber-600 hover:bg-amber-100"
                      >
                        <FaEdit />
                      </button>

                      <button
                        onClick={() => onDelete(person.id)}
                        className="rounded-lg bg-red-50 p-3 text-red-600 hover:bg-red-100"
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
                <h3 className="truncate text-lg font-bold">
                  {person.name}
                </h3>

                <p className="text-sm text-slate-500">
                  {formatBirthday(person.birthday)}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm">

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

            </div>

            {person.album && (
              <a
                href={person.album}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-white"
              >
                <FaExternalLinkAlt />
                Xem album
              </a>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3">

              <button
                onClick={() => onEdit(person)}
                className="rounded-xl bg-amber-500 py-3 font-semibold text-white"
              >
                <FaEdit className="mr-2 inline" />
                Sửa
              </button>

              <button
                onClick={() => onDelete(person.id)}
                className="rounded-xl bg-red-600 py-3 font-semibold text-white"
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