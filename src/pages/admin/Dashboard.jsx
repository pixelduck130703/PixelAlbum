import { useEffect, useMemo, useState } from "react";
import Layout from "../../components/admin/Layout";
import PersonTable from "../../components/admin/PersonTable";
import api from "../../services/api";
import PersonForm from "../../components/admin/PersonForm";
import toast from "react-hot-toast";

function Dashboard() {
  const [stats, setStats] = useState({
    totalPeople: 0,
    thisMonth: 0,
    album: 0,
    today: 0,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [people, setPeople] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showMonthModal, setShowMonthModal] = useState(false);
  const [monthPeople, setMonthPeople] = useState([]);
  const [showTodayModal, setShowTodayModal] = useState(false);
  const [todayPeople, setTodayPeople] = useState([]);

const handleShowTodayBirthday = async () => {
  try {
    const response = await api.get("/people");

    const today = new Date();

    const month = String(
      today.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      today.getDate()
    ).padStart(2, "0");

    const list = response.data.filter((person) => {
      if (!person.birthday || person.deathDate) {
        return false;
      }

      return (
        person.birthday.substring(5) ===
        `${month}-${day}`
      );
    });

    setTodayPeople(list);
    setShowTodayModal(true);
  } catch (error) {
    console.error(
      "Lỗi lấy sinh nhật hôm nay:",
      error
    );

    toast.error(
      "Không thể tải danh sách sinh nhật hôm nay."
    );
  }
};

const handleShowMonthBirthday = async () => {
  try {
    const response = await api.get("/people");

    const currentMonth = String(
      new Date().getMonth() + 1
    ).padStart(2, "0");

    const list = response.data.filter((person) => {
      if (!person.birthday || person.deathDate) {
        return false;
      }

      return (
        person.birthday.substring(5, 7) ===
        currentMonth
      );
    });

    setMonthPeople(list);
    setShowMonthModal(true);
  } catch (error) {
    console.error(
      "Lỗi lấy sinh nhật tháng này:",
      error
    );

    toast.error(
      "Không thể tải danh sách sinh nhật tháng này."
    );
  }
};

  const loadDashboard = async () => {
    try {
      const response = await api.get("/dashboard");
      setStats(response.data);
    } catch (error) {
      console.error("Lỗi lấy thống kê:", error);
    }
  };

  const loadPeople = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/people");
      setPeople(response.data);
    } catch (error) {
      console.error("Lỗi lấy danh sách người:", error);
      setError("Không thể tải danh sách người.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    loadPeople();
  }, []);

  const filteredPeople = useMemo(() => {
    const searchValue = keyword.trim().toLowerCase();

    if (!searchValue) {
      return people;
    }

    return people.filter((person) => {
      const name = person.name?.toLowerCase() || "";
      const birthday = person.birthday?.toLowerCase() || "";
      const address = person.address?.toLowerCase() || "";
      const className = person.class?.toLowerCase() || "";
      const phone = person.phone?.toLowerCase() || "";

      return (
        name.includes(searchValue) ||
        birthday.includes(searchValue) ||
        address.includes(searchValue) ||
        className.includes(searchValue) ||
        phone.includes(searchValue)
      );
    });
  }, [people, keyword]);

  const handleAdd = () => {
  setEditingPerson(null);
  setFormOpen(true);
};

  const handleEdit = (person) => {
  setEditingPerson(person);
  setFormOpen(true);
};

const formatDate = (date) => {
  if (!date) return "Chưa cập nhật";

  const [year, month, day] = date.split("-");

  return `${day}/${month}/${year}`;
};

const handleCloseForm = () => {
  if (submitting) return;

  setFormOpen(false);
  setEditingPerson(null);
};

const handleSubmitForm = async (formData) => {
  try {
    setSubmitting(true);

    if (editingPerson) {
      await api.put(`/people/${editingPerson.id}`, formData);
      toast.success("Cập nhật người thành công!");
    } else {
      await api.post("/people", formData);
      toast.success("Thêm người thành công!");
    }

    setFormOpen(false);
    setEditingPerson(null);

    await Promise.all([
      loadPeople(),
      loadDashboard(),
    ]);
  } catch (error) {
    console.error("Lỗi lưu dữ liệu:", error);

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      "Không thể lưu dữ liệu.";

    toast.error(message);
  } finally {
    setSubmitting(false);
  }
};

  const handleDelete = async (id) => {
  const person = people.find((item) => item.id === id);

  const confirmed = window.confirm(
    `Bạn có chắc muốn xóa ${
      person?.name || "người này"
    } khỏi hệ thống không?`
  );

  if (!confirmed) {
    return;
  }

  try {
    await api.delete(`/people/${id}`);

    setPeople((currentPeople) =>
      currentPeople.filter((item) => item.id !== id)
    );

    await loadDashboard();

    toast.success("Xóa người thành công!");
  } catch (error) {
    console.error("Lỗi xóa người:", error);

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      "Không thể xóa dữ liệu.";

    toast.error(message);
  }
};

  return (
    <Layout>
      

      {/* Thẻ thống kê */}
      <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
        <div className="w-full rounded-2xl bg-white p-4 sm:p-6 shadow-sm transition hover:scale-[1.02] hover:shadow-lg">
          <p className="text-sm font-medium text-slate-500">
            Tổng số người
          </p>

          <div className="mt-4 flex items-end justify-between">
            <h2 className="text-3xl font-bold sm:text-4xl text-blue-600">
              {stats.totalPeople}
            </h2>

            <span className="text-2xl sm:text-3xl">👥</span>
          </div>
        </div>

        <div className="w-full rounded-2xl bg-white p-4 sm:p-6 shadow-sm transition hover:scale-[1.02] hover:shadow-lg">
          <p className="text-sm font-medium text-slate-500">
            Có liên kết album
          </p>

          <div className="mt-4 flex items-end justify-between">
            <h2 className="text-3xl font-bold sm:text-4xl text-purple-600">
              {stats.album}
            </h2>

            <span className="text-2xl sm:text-3xl">🖼️</span>
          </div>
        </div>

        <button onClick={handleShowMonthBirthday}
            className="w-full rounded-2xl bg-white p-4 sm:p-6 shadow-sm transition hover:scale-[1.02] hover:shadow-lg">
          <p className="text-left text-sm font-medium text-slate-500">
            Sinh nhật tháng này
          </p>

          <div className="mt-4 flex items-end justify-between">
            <h2 className="text-3xl font-bold sm:text-4xl text-red-500">
              {stats.thisMonth}
            </h2>

            <span className="text-2xl sm:text-3xl">📅</span>
          </div>
        </button> 

        <button onClick={handleShowTodayBirthday}
           className="w-full rounded-2xl bg-white p-4 sm:p-6 shadow-sm transition hover:scale-[1.02] hover:shadow-lg">
          <p className="text-left text-sm font-medium text-slate-500">
            Sinh nhật hôm nay
          </p>

          <div className="mt-4 flex items-end justify-between">
            <h2 className="text-3xl font-bold sm:text-4xl text-red-500">
              {stats.today}
            </h2>

            <span className="text-2xl sm:text-3xl">🎂</span>
          </div>
        </button>
      </div>

      {/* Khối quản lý người */}
      <div className="mt-8 sm:mt-10">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Danh sách album
            </h2>
          </div>

          <button
  type="button"
  onClick={handleAdd}
  className="w-full rounded-xl bg-blue-500 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 sm:w-auto"
>
  + Thêm người
</button>
        </div>

        {/* Ô tìm kiếm */}
        <div className="mb-5 rounded-2xl bg-white p-4 shadow-sm sm:p-5">
          <label
            htmlFor="admin-search"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Tìm kiếm
          </label>

          <input
            id="admin-search"
            type="text"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Nhập tên, ngày sinh, hoặc địa chỉ"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        {loading && (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <div className="text-lg font-semibold text-slate-700">
              Đang tải dữ liệu...
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
            {error}

            <div>
              <button
                type="button"
                onClick={loadPeople}
                className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
              >
                Tải lại
              </button>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="mb-3 text-sm text-slate-500">
              Hiển thị {filteredPeople.length} / {people.length} người
            </div>

            <PersonTable
              people={filteredPeople}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </>
        )}
      </div>

      <PersonForm
  open={formOpen}
  person={editingPerson}
  submitting={submitting}
  onClose={handleCloseForm}
  onSubmit={handleSubmitForm}
/>
{showTodayModal && (
  <div
    className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
    onClick={() => setShowTodayModal(false)}
  >
    <div
      className="max-h-[88vh] w-full overflow-hidden rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-2xl sm:rounded-3xl sm:p-6"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 sm:text-2xl">
            🎂 Sinh nhật hôm nay
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Có {todayPeople.length} người
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowTodayModal(false)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-600 hover:bg-slate-200"
          aria-label="Đóng"
        >
          ✕
        </button>
      </div>

      {todayPeople.length === 0 ? (
        <div className="rounded-2xl bg-slate-100 p-8 text-center text-slate-500">
          Hôm nay không có ai sinh nhật.
        </div>
      ) : (
        <div className="max-h-[65vh] space-y-3 overflow-y-auto pr-1">
          {todayPeople.map((person) => (
            <a
              key={person.id}
              href={`/person/${person.id}`}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3 transition hover:border-blue-300 hover:bg-blue-50 sm:gap-4 sm:p-4"
            >
              <img
                src={
                  person.avatar ||
                  "https://placehold.co/100x100?text=Avatar"
                }
                alt={person.name}
                className="h-12 w-12 shrink-0 rounded-full object-cover sm:h-14 sm:w-14"
                onError={(event) => {
                  event.currentTarget.src =
                    "https://placehold.co/100x100?text=Avatar";
                }}
              />

              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-slate-800">
                  {person.name}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {formatDate(person.birthday)}
                </p>
              </div>

              <span className="shrink-0 text-slate-400">→</span>
            </a>
          ))}
        </div>
      )}
    </div>
  </div>
)}

{showMonthModal && (
  <div
    className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
    onClick={() => setShowMonthModal(false)}
  >
    <div
      className="max-h-[88vh] w-full overflow-hidden rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-2xl sm:rounded-3xl sm:p-6"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 sm:text-2xl">
            📅 Sinh nhật tháng này
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Có {monthPeople.length} người
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowMonthModal(false)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-600 hover:bg-slate-200"
          aria-label="Đóng"
        >
          ✕
        </button>
      </div>

      {monthPeople.length === 0 ? (
        <div className="rounded-2xl bg-slate-100 p-8 text-center text-slate-500">
          Không có ai sinh trong tháng này.
        </div>
      ) : (
        <div className="max-h-[65vh] space-y-3 overflow-y-auto pr-1">
          {monthPeople.map((person) => (
            <a
              key={person.id}
              href={`/person/${person.id}`}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3 transition hover:border-blue-300 hover:bg-blue-50 sm:gap-4 sm:p-4"
            >
              <img
                src={
                  person.avatar ||
                  "https://placehold.co/100x100?text=Avatar"
                }
                alt={person.name}
                className="h-12 w-12 shrink-0 rounded-full object-cover sm:h-14 sm:w-14"
                onError={(event) => {
                  event.currentTarget.src =
                    "https://placehold.co/100x100?text=Avatar";
                }}
              />

              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-slate-800">
                  {person.name}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {formatDate(person.birthday)}
                </p>
              </div>

              <span className="shrink-0 text-slate-400">→</span>
            </a>
          ))}
        </div>
      )}
    </div>
  </div>
)}
    </Layout>
    
  );
}

export default Dashboard;