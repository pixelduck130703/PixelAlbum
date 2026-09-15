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
import HomeMusicManager from "../../components/admin/HomeMusicManager";
import { exportExcel } from "../../components/admin/ExportExcel";
import EventManager from "../../components/admin/EventManager";
import AlbumHistoryModal from "../../components/admin/AlbumHistoryModal";
import GraduationRsvpModal from "../../components/admin/GraduationRsvpModal";

// Hàm chuẩn hóa tiếng Việt bỏ dấu
function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function Dashboard() {
  const handleShowAlbumHistory = (person) => {
    setSelectedAlbumHistory(person);
    setShowAlbumHistoryModal(true);
  };

  const handleCloseAlbumHistory = () => {
    setShowAlbumHistoryModal(false);
    setSelectedAlbumHistory(null);
  };

  const [stats, setStats] = useState({
    totalPeople: null,
    thisMonth: null,
    album: null,
    today: null,
    totalAlbumViews: null,
  });

  const [loadingStats, setLoadingStats] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [people, setPeople] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showTodayModal, setShowTodayModal] = useState(false);
  const [showAlbumHistoryModal, setShowAlbumHistoryModal] = useState(false);

  const [selectedAlbumHistory, setSelectedAlbumHistory] = useState(null);
  const [todayPeople, setTodayPeople] = useState([]);
  const [visits, setVisits] = useState(null);

  const [visitChart, setVisitChart] = useState([]);
  const [albumViewChart, setAlbumViewChart] = useState([]);
  const [chartDays, setChartDays] = useState(7);
  const [loadingTrafficChart, setLoadingTrafficChart] = useState(true);

  const [showHomeMusicManager, setShowHomeMusicManager] = useState(false);
  const [showEventManager, setShowEventManager] = useState(false);
  const [showAnnouncementManager, setShowAnnouncementManager] = useState(false);

  // State mở Popup RSVP
  const [showRsvpModal, setShowRsvpModal] = useState(false);
  const [rsvpList, setRsvpList] = useState([]);
  const [loadingRsvp, setLoadingRsvp] = useState(false);

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
        setVisits(Number(res.data.visits) || 0);
      } catch (err) {
        console.error(err);
        setVisits(null);
      }
    };

    loadVisits();
  }, []);

  const handleShowTodayBirthday = async () => {
    try {
      const response = await api.get("/people");
      const today = new Date();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");

      const list = response.data.filter((person) => {
        if (!person.birthday || person.deathDate) {
          return false;
        }

        return (
          person.birthday.substring(5) === `${month}-${day}`
        );
      });

      setTodayPeople(list);
      setShowTodayModal(true);
    } catch (error) {
      console.error("Lỗi lấy sinh nhật hôm nay:", error);
      toast.error("Không thể tải danh sách sinh nhật hôm nay.");
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

  // Tải danh sách RSVP khi bấm vào nút
  const handleShowRsvpModal = async () => {
    setShowRsvpModal(true);
    try {
      setLoadingRsvp(true);
      const res = await api.get("/admin/graduation-rsvps");
      const list = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
          ? res.data
          : [];
      setRsvpList(list);
    } catch (err) {
      console.error("Lỗi tải RSVP:", err);
      toast.error("Không thể tải danh sách xác nhận tham dự.");
      setRsvpList([]);
    } finally {
      setLoadingRsvp(false);
    }
  };

  const handleDeleteRsvp = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa xác nhận này không?")) return;
    try {
      await api.delete(`/admin/graduation-rsvps/${id}`);
      setRsvpList((prev) => prev.filter((item) => item.id !== id));
      toast.success("Xóa xác nhận thành công!");
    } catch (err) {
      console.error("Lỗi xóa RSVP:", err);
      toast.error("Không thể xóa xác nhận.");
    }
  };

  const loadDashboard = async () => {
    try {
      setLoadingStats(true);

      const response = await api.get("/dashboard");
      setStats(response.data);
    } catch (error) {
      console.error("Lỗi tải thống kê dashboard:", error);
      setStats({
        totalPeople: null,
        thisMonth: null,
        album: null,
        today: null,
        totalAlbumViews: null,
      });
    } finally {
      setLoadingStats(false);
    }
  };

  const [showTodayAlbumViewsModal, setShowTodayAlbumViewsModal] = useState(false);
  const [todayAlbumViews, setTodayAlbumViews] = useState([]);
  const [todayAlbumViewSummary, setTodayAlbumViewSummary] = useState({
    totalAlbums: 0,
    totalViews: 0,
  });
  const [loadingTodayAlbumViews, setLoadingTodayAlbumViews] = useState(false);

  const getTodayVietnam = () => {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  };

  const [albumViewDate, setAlbumViewDate] = useState(getTodayVietnam());

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
    const trimmed = keyword.trim();
    if (!trimmed) {
      return people;
    }

    const isIdSearch = /^#?\d+$/.test(trimmed);
    const cleanId = trimmed.replace(/^#/, "");

    if (isIdSearch) {
      const exactMatch = people.filter(
        (person) => String(person.id) === cleanId
      );

      if (exactMatch.length > 0) {
        return exactMatch;
      }

      return people.filter((person) =>
        String(person.id).startsWith(cleanId)
      );
    }

    const normalizedKeyword = normalizeText(trimmed);

    return people.filter((person) => {
      const matchName = normalizeText(person.name).includes(normalizedKeyword);
      const matchAddress = normalizeText(person.address).includes(normalizedKeyword);
      const matchClass = normalizeText(person.class).includes(normalizedKeyword);

      return matchName || matchAddress || matchClass;
    });
  }, [people, keyword]);

  const [showBirthdayMonthModal, setShowBirthdayMonthModal] = useState(false);
  const [selectedBirthdayMonth, setSelectedBirthdayMonth] = useState(
    String(new Date().getMonth() + 1)
  );
  const [birthdayMonthPeople, setBirthdayMonthPeople] = useState([]);

  const loadAlbumViewsByDate = async (date) => {
    try {
      setLoadingTodayAlbumViews(true);

      const response = await api.get("/admin/album-views", {
        params: { date },
      });

      const list = Array.isArray(response.data?.data) ? response.data.data : [];

      setTodayAlbumViews(list);
      setTodayAlbumViewSummary({
        totalAlbums: Number(response.data?.totalAlbums) || 0,
        totalViews: Number(response.data?.totalViews) || 0,
      });
    } catch (error) {
      console.error("Lỗi tải lịch sử xem album:", error);
      setTodayAlbumViews([]);
      setTodayAlbumViewSummary({
        totalAlbums: 0,
        totalViews: 0,
      });
      toast.error("Không thể tải lịch sử xem album.");
    } finally {
      setLoadingTodayAlbumViews(false);
    }
  };

  const handleShowTodayAlbumViews = async () => {
    if (loadingTodayAlbumViews) return;

    const today = getTodayVietnam();
    setAlbumViewDate(today);
    setShowTodayAlbumViewsModal(true);
    await loadAlbumViewsByDate(today);
  };

  const handleAlbumViewDateChange = async (date) => {
    if (!date) return;
    setAlbumViewDate(date);
    await loadAlbumViewsByDate(date);
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

      await Promise.all([loadPeople(), loadDashboard()]);
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
      `Bạn có chắc muốn xóa ${person?.name || "album này"} khỏi hệ thống không?`
    );

    if (!confirmed) return;

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
    <Layout onShowVisits={handleShowRsvpModal}>
      {/* Thẻ thống kê */}
      <DashboardStats
        stats={stats}
        visits={visits}
        loadingStats={loadingStats}
        onShowMonthBirthday={handleShowMonthBirthday}
        onShowTodayBirthday={handleShowTodayBirthday}
        onShowVisits={handleShowRsvpModal}
      />

      {/* Biểu đồ */}
      <TrafficChart
        visitChart={visitChart}
        albumViewChart={albumViewChart}
        days={chartDays}
        setDays={setChartDays}
        loading={loadingTrafficChart}
      />

      {/* 1. KHỐI NÚT HÀNH ĐỘNG (NẰM TRÊN) */}
      <div className="mt-8 flex flex-wrap justify-end gap-3 sm:mt-10">
        <DashboardActions
          loadingTodayAlbumViews={loadingTodayAlbumViews}
          onShowTodayAlbumViews={handleShowTodayAlbumViews}
          onManageAnnouncement={() => setShowAnnouncementManager(true)}
          onManageMusic={() => setShowHomeMusicManager(true)}
          onManageEvents={() => setShowEventManager(true)}
          onExportExcel={exportExcel}
          onAdd={handleAdd}
        />
      </div>

      {/* 2. KHỐI TIÊU ĐỀ & DANH SÁCH ALBUM (NẰM DƯỚI) */}
      <div className="mt-6">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-slate-800">
            Danh sách album
          </h2>
        </div>

        {/* Ô tìm kiếm */}
        <div className="mb-5 rounded-2xl bg-white p-4 shadow-sm sm:p-5">
          <label
            htmlFor="admin-search"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Tìm kiếm
          </label>

          <div className="relative">
            <input
              id="admin-search"
              type="text"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Nhập ID, tên, quê quán hoặc địa điểm"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 text-base sm:text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />

            {keyword && (
              <button
                type="button"
                onClick={() => setKeyword("")}
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-red-500 cursor-pointer"
                aria-label="Xóa tìm kiếm"
              >
                ✕
              </button>
            )}
          </div>
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
                className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 cursor-pointer"
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
              onViewHistory={handleShowAlbumHistory}
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
          setBirthdayMonthPeople(getBirthdayPeopleByMonth(month));
        }}
        onClose={() => setShowBirthdayMonthModal(false)}
        formatDate={formatDate}
      />

      <TodayAlbumViewsModal
        open={showTodayAlbumViewsModal}
        people={todayAlbumViews}
        summary={todayAlbumViewSummary}
        selectedDate={albumViewDate}
        loading={loadingTodayAlbumViews}
        onDateChange={handleAlbumViewDateChange}
        onClose={() => setShowTodayAlbumViewsModal(false)}
      />

      <AlbumHistoryModal
        open={showAlbumHistoryModal}
        person={selectedAlbumHistory}
        onClose={handleCloseAlbumHistory}
      />

      <AnnouncementManager
        open={showAnnouncementManager}
        onClose={() => setShowAnnouncementManager(false)}
      />

      <HomeMusicManager
        open={showHomeMusicManager}
        onClose={() => setShowHomeMusicManager(false)}
      />

      <EventManager
        open={showEventManager}
        onClose={() => setShowEventManager(false)}
      />

      <GraduationRsvpModal
        open={showRsvpModal}
        onClose={() => setShowRsvpModal(false)}
        list={rsvpList}
        loading={loadingRsvp}
        onDelete={handleDeleteRsvp}
      />
    </Layout>
  );
}

export default Dashboard;