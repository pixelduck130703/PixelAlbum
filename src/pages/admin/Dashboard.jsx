import { useEffect, useMemo, useState } from "react";
import Layout from "../../components/admin/Layout";
import PersonTable from "../../components/admin/PersonTable";
import PersonForm from "../../components/admin/PersonForm";
import TrafficChart from "../../components/admin/TrafficChart";
import api from "../../services/api";
import toast from "react-hot-toast";
import TodayBirthdayModal from "../../components/admin/TodayBirthdayModal";
import BirthdayMonthModal from "../../components/admin/BirthdayMonthModal";
import TodayAlbumViewsModal from "../../components/admin/TodayAlbumViewsModal";
import DashboardStats from "../../components/admin/DashboardStats";
import DashboardActions from "../../components/admin/DashboardActions";
import AnnouncementManager from "../../components/admin/AnnouncementManager";

function Dashboard() {
  const [stats, setStats] = useState({
    totalPeople: 0,
    thisMonth: 0,
    album: 0,
    today: 0,
    totalAlbumViews: 0,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [people, setPeople] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showTodayModal, setShowTodayModal] = useState(false);
  const [todayPeople, setTodayPeople] = useState([]);
  const [visits, setVisits] = useState(null);

  const [visitChart, setVisitChart] = useState([]);
  const [albumViewChart, setAlbumViewChart] = useState([]);
  const [chartDays, setChartDays] = useState(7);
  const [loadingTrafficChart, setLoadingTrafficChart] = useState(true);

  const [
    showAnnouncementManager,
    setShowAnnouncementManager,
  ] = useState(false);

  const formatChartDate = (dateString) => {
    if (!dateString) return "";

    const [, month, day] = String(dateString).split("-");

    return day && month ? `${day}/${month}` : String(dateString);
  };

  const loadTrafficChart = async () => {
    try {
      setLoadingTrafficChart(true);

      const [visitResponse, albumResponse] = await Promise.all([
        api.get(`/admin/visit-chart?days=${chartDays}`),
        api.get(`/admin/album-view-chart?days=${chartDays}`),
      ]);

      const visitData = Array.isArray(visitResponse.data?.data)
        ? visitResponse.data.data
        : [];

      const albumData = Array.isArray(albumResponse.data?.data)
        ? albumResponse.data.data
        : [];

      setVisitChart(
        visitData.map((item) => ({
          date: item.date,
          displayDate: formatChartDate(item.date),
          visits: Number(item.visits) || 0,
        }))
      );

      setAlbumViewChart(
        albumData.map((item) => ({
          date: item.date,
          displayDate: formatChartDate(item.date),
          views: Number(item.views) || 0,
        }))
      );
    } catch (error) {
      console.error(
        "Lỗi tải biểu đồ thống kê:",
        error.response?.data || error
      );

      setVisitChart([]);
      setAlbumViewChart([]);
      toast.error("Không thể tải dữ liệu biểu đồ.");
    } finally {
      setLoadingTrafficChart(false);
    }
  };

  useEffect(() => {
    loadTrafficChart();
  }, [chartDays]);

  useEffect(() => {
    const loadVisits = async () => {
      try {
        const res = await api.get("/visits");
        console.log(res.data); // kiểm tra
        setVisits(Number(res.data.visits) || 0);
      } catch (err) {
        console.error(err);
        setVisits(0);
      }
    };

    loadVisits();
  }, []);

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

  const getBirthdayPeopleByMonth = (selectedMonth) => {
    const month = String(selectedMonth).padStart(2, "0");

    return people
      .filter((person) => {
        if (!person.birthday || person.deathDate) {
          return false;
        }

        return String(person.birthday).slice(5, 7) === month;
      })
      .sort((a, b) => {
        const birthdayA = String(a.birthday).slice(0, 10);
        const birthdayB = String(b.birthday).slice(0, 10);

        const [yearA, , dayA] = birthdayA.split("-").map(Number);
        const [yearB, , dayB] = birthdayB.split("-").map(Number);

        if (dayA !== dayB) {
          return dayA - dayB;
        }

        return yearA - yearB;
      });
  };

  const handleShowMonthBirthday = () => {
    const currentMonth = String(new Date().getMonth() + 1);

    setSelectedBirthdayMonth(currentMonth);
    setBirthdayMonthPeople(getBirthdayPeopleByMonth(currentMonth));
    setShowBirthdayMonthModal(true);
  };

  const loadDashboard = async () => {
    try {
      const response = await api.get("/dashboard");
      setStats(response.data);
    } catch (error) {
      //Xóa thông báo lỗi
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await api.get("/admin/export-excel", {
        responseType: "blob",
      });

      const contentType = response.headers["content-type"] || "";

      if (
        !contentType.includes(
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
      ) {
        const errorText = await response.data.text();

        console.error("Phản hồi không phải Excel:", errorText);

        alert("Máy chủ không trả về file Excel hợp lệ.");
        return;
      }

      const blob = new Blob([response.data], {
        type: contentType,
      });

      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = downloadUrl;
      link.download = `DanhSachAlbum-${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Lỗi xuất Excel:", error);

      if (error.response?.data instanceof Blob) {
        try {
          const errorText = await error.response.data.text();
          const errorData = JSON.parse(errorText);

          alert(errorData.message || "Không thể xuất file Excel.");
          return;
        } catch {
          // Bỏ qua nếu phản hồi không phải JSON.
        }
      }

      alert("Không thể xuất file Excel. Vui lòng thử lại.");
    }
  };

  const [
    showTodayAlbumViewsModal,
    setShowTodayAlbumViewsModal,
  ] = useState(false);

  const [todayAlbumViews, setTodayAlbumViews] =
    useState([]);

  const [
    todayAlbumViewSummary,
    setTodayAlbumViewSummary,
  ] = useState({
    totalAlbums: 0,
    totalViews: 0,
  });

  const [
    loadingTodayAlbumViews,
    setLoadingTodayAlbumViews,
  ] = useState(false);

  const loadPeople = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/people");
      setPeople(response.data);
    } catch (error) {
      console.error("Lỗi lấy danh sách album:", error);
      setError("Không thể tải danh sách album.");
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

  const [showBirthdayMonthModal, setShowBirthdayMonthModal] =
    useState(false);

  const [selectedBirthdayMonth, setSelectedBirthdayMonth] =
    useState(String(new Date().getMonth() + 1));

  const [birthdayMonthPeople, setBirthdayMonthPeople] =
    useState([]);

  const handleShowTodayAlbumViews = async () => {
    if (loadingTodayAlbumViews) {
      return;
    }

    try {
      setLoadingTodayAlbumViews(true);

      const response = await api.get(
        "/admin/today-album-views"
      );

      const list = Array.isArray(response.data?.data)
        ? response.data.data
        : [];

      setTodayAlbumViews(list);

      setTodayAlbumViewSummary({
        totalAlbums:
          Number(response.data?.totalAlbums) || 0,

        totalViews:
          Number(response.data?.totalViews) || 0,
      });

      setShowTodayAlbumViewsModal(true);
    } catch (error) {
      //xóa thông báo
    } finally {
      setLoadingTodayAlbumViews(false);
    }
  };

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
        toast.success("Cập nhật album thành công!");
      } else {
        await api.post("/people", formData);
        toast.success("Thêm album thành công!");
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
      `Bạn có chắc muốn xóa ${person?.name || "album này"
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

      toast.success("Xóa album thành công!");
    } catch (error) {
      console.error("Lỗi xóa album:", error);

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
      <DashboardStats
        stats={stats}
        visits={visits}
        onShowMonthBirthday={handleShowMonthBirthday}
        onShowTodayBirthday={handleShowTodayBirthday}
      />

      {/* Biểu đồ */}
      <TrafficChart
        visitChart={visitChart}
        albumViewChart={albumViewChart}
        days={chartDays}
        setDays={setChartDays}
        loading={loadingTrafficChart}
      />

      {/* Khối quản lý album */}
      <div className="mt-8 sm:mt-10">
        <div className="mb-5 flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Danh sách album
            </h2>
          </div>

          <DashboardActions
            loadingTodayAlbumViews={loadingTodayAlbumViews}
            onShowTodayAlbumViews={handleShowTodayAlbumViews}
            onManageAnnouncement={() =>
              setShowAnnouncementManager(true)
            }
            onExportExcel={handleExportExcel}
            onAdd={handleAdd}
          />
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
            placeholder="Nhập tên, quê quán hoặc địa điểm"
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
              Hiển thị {filteredPeople.length} / {people.length} Album
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

      <TodayBirthdayModal
        open={showTodayModal}
        people={todayPeople}
        onClose={() => setShowTodayModal(false)}
        formatDate={formatDate}
      />

      <BirthdayMonthModal
        open={showBirthdayMonthModal}
        selectedMonth={selectedBirthdayMonth}
        people={birthdayMonthPeople}
        onChangeMonth={(month) => {
          setSelectedBirthdayMonth(month);

          setBirthdayMonthPeople(
            getBirthdayPeopleByMonth(month)
          );
        }}
        onClose={() =>
          setShowBirthdayMonthModal(false)
        }
        formatDate={formatDate}
      />

      <TodayAlbumViewsModal
        open={showTodayAlbumViewsModal}
        people={todayAlbumViews}
        summary={todayAlbumViewSummary}
        onClose={() =>
          setShowTodayAlbumViewsModal(false)
        }
      />

      <AnnouncementManager
        open={showAnnouncementManager}
        onClose={() =>
          setShowAnnouncementManager(false)
        }
      />
    </Layout>

  );
}

export default Dashboard;