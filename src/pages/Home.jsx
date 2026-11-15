import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

import Navbar from "../components/Navbar";
import WeatherCard from "../components/WeatherCard";
import Footer from "../components/Footer";
import SearchBox from "../components/SearchBox";
import AboutMe from "../components/AboutMe";
import FeedbackForm from "../components/FeedbackForm";
import DonateCard from "../components/DonateCard";
import { Solar } from "lunar-javascript";
import TodayEvents from "../components/TodayEvents";
import DateHeader from "../components/DateHeader";
import SearchResult from "../components/SearchResult";
import { getTodayVietnamHolidays } from "../utils/vietnamHolidays";
import HomeStatistics from "../components/HomeStatistics";
import DailyQuote from "../components/DailyQuote";
import Announcement from "../components/Announcement";
import ScrollReveal from "../components/ScrollReveal";
import WelcomePopup from "../components/WelcomePopup";
import HomePartners from "../components/HomePartners";

const today = new Date();

const lunarToday = Solar.fromYmd(
  today.getFullYear(),
  today.getMonth() + 1,
  today.getDate()
).getLunar();

const todayHolidays = getTodayVietnamHolidays(today, lunarToday);

const heavenlyStems = {
  甲: "Giáp",
  乙: "Ất",
  丙: "Bính",
  丁: "Đinh",
  戊: "Mậu",
  己: "Kỷ",
  庚: "Canh",
  辛: "Tân",
  壬: "Nhâm",
  癸: "Quý",
};

const earthlyBranches = {
  子: "Tý",
  丑: "Sửu",
  寅: "Dần",
  卯: "Mão",
  辰: "Thìn",
  巳: "Tỵ",
  午: "Ngọ",
  未: "Mùi",
  申: "Thân",
  酉: "Dậu",
  戌: "Tuất",
  亥: "Hợi",
};

const lunarMonth = Math.abs(lunarToday.getMonth());

let monthText;

if (lunarMonth === 1) {
  monthText = "Giêng";
} else if (lunarMonth === 12) {
  monthText = "Chạp";
} else {
  monthText = String(lunarMonth).padStart(2, "0");
}

const yearGan = heavenlyStems[lunarToday.getYearGan()];
const yearZhi = earthlyBranches[lunarToday.getYearZhi()];

const weekdays = [
  "Chủ Nhật",
  "Thứ Hai",
  "Thứ Ba",
  "Thứ Tư",
  "Thứ Năm",
  "Thứ Sáu",
  "Thứ Bảy",
];

function Home() {
  const [people, setPeople] = useState([]);

  // ================================
  // TÌM KIẾM (Khởi tạo từ sessionStorage nếu có)
  // ================================

  const [nameInput, setNameInput] = useState(() => {
    return sessionStorage.getItem("home_name_input") || "";
  });
  const [birthdayInput, setBirthdayInput] = useState(() => {
    return sessionStorage.getItem("home_birthday_input") || "";
  });

  const [searchName, setSearchName] = useState(() => {
    return sessionStorage.getItem("home_search_name") || "";
  });
  const [searchBirthday, setSearchBirthday] = useState(() => {
    return sessionStorage.getItem("home_search_birthday") || "";
  });

  const [hasSearched, setHasSearched] = useState(() => {
    return sessionStorage.getItem("home_has_searched") === "true";
  });

  // Tự động lưu/xóa session theo trạng thái tìm kiếm
  useEffect(() => {
    if (hasSearched) {
      sessionStorage.setItem("home_name_input", nameInput);
      sessionStorage.setItem("home_birthday_input", birthdayInput);
      sessionStorage.setItem("home_search_name", searchName);
      sessionStorage.setItem("home_search_birthday", searchBirthday);
      sessionStorage.setItem("home_has_searched", "true");
    } else {
      sessionStorage.removeItem("home_has_searched");
    }
  }, [hasSearched, nameInput, birthdayInput, searchName, searchBirthday]);

  // ================================
  // PEOPLE
  // ================================

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ================================
  // EVENTS
  // ================================

  const [events, setEvents] = useState([]);

  // ================================
  // VISITS
  // ================================

  const [visits, setVisits] = useState(null);

  // ================================
  // ANNOUNCEMENT
  // ================================

  const [announcement, setAnnouncement] = useState({
    content: "",
    updatedAt: null,
  });

  // ================================
  // LOAD ANNOUNCEMENT
  // ================================

  useEffect(() => {
    const loadAnnouncement = async () => {
      try {
        const response = await api.get("/announcement");

        setAnnouncement({
          content: response.data?.content || "",
          updatedAt: response.data?.updatedAt || null,
        });
      } catch (err) {
        console.error("Lỗi tải thông báo:", err);

        setAnnouncement({
          content: "",
          updatedAt: null,
        });
      }
    };

    loadAnnouncement();
  }, []);

  // ================================
  // LOAD VISITS
  // ================================

  useEffect(() => {
    const loadVisits = async () => {
      const visited = sessionStorage.getItem("websiteVisited");

      try {
        if (!visited) {
          sessionStorage.setItem("websiteVisited", "true");

          const response = await api.post("/visits");

          setVisits(Number(response.data?.visits) || 0);
        } else {
          const response = await api.get("/visits");

          setVisits(Number(response.data?.visits) || 0);
        }
      } catch (err) {
        console.error("Lỗi tải lượt truy cập:", err);

        if (!visited) {
          sessionStorage.removeItem("websiteVisited");
        }

        setVisits(0);
      }
    };

    loadVisits();
  }, []);

  // ================================
  // LOAD EVENTS
  // ================================

  useEffect(() => {
    let cancelled = false;

    const loadEvents = async () => {
      try {
        const response = await api.get("/events");

        if (cancelled) return;

        const data = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.data)
            ? response.data.data
            : [];

        setEvents(data);
      } catch (err) {
        if (cancelled) return;

        console.error("Lỗi tải sự kiện:", err);
        setEvents([]);
      }
    };

    loadEvents();

    return () => {
      cancelled = true;
    };
  }, []);

  // ================================
  // LOAD PEOPLE
  // ================================

  useEffect(() => {
    let retryTimer;
    let cancelled = false;

    const loadPeople = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/people", {
          timeout: 90000,
        });

        if (cancelled) return;

        setPeople(Array.isArray(response.data) ? response.data : []);
        setLoading(false);

        if (retryTimer) {
          clearTimeout(retryTimer);
        }
      } catch (requestError) {
        if (cancelled) return;

        console.error("Lỗi tải dữ liệu:", requestError);

        setError(
          "Máy chủ đang khởi động. Website sẽ tự thử lại sau 5 giây."
        );

        setLoading(true);

        retryTimer = setTimeout(() => {
          loadPeople();
        }, 5000);
      }
    };

    loadPeople();

    return () => {
      cancelled = true;

      if (retryTimer) {
        clearTimeout(retryTimer);
      }
    };
  }, []);

  // ================================
  // NORMALIZE TEXT
  // ================================

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

  // ================================
  // SEARCH RESULTS
  // ================================

  const results = useMemo(() => {
    if (!hasSearched) {
      return [];
    }

    if (searchBirthday) {
      return people.filter(
        (person) => person.birthday === searchBirthday
      );
    }

    const normalizedName = normalizeText(searchName);

    if (normalizedName) {
      return people.filter((person) => {
        const hasNoBirthday =
          !person.birthday || person.birthday.trim() === "";

        const personWords = normalizeText(person.name).split(" ");
        const searchWords = normalizedName.split(" ");

        const nameMatches = searchWords.every((word) =>
          personWords.includes(word)
        );

        return hasNoBirthday && nameMatches;
      });
    }

    return [];
  }, [people, searchName, searchBirthday, hasSearched]);

  // ================================
  // CONVERT BIRTHDAY
  // ================================

  const convertBirthdayToDatabaseFormat = (value) => {
    if (!value) return "";

    const normalized = value.trim().replace(/-/g, "/");
    const parts = normalized.split("/");

    if (parts.length !== 3) {
      return value.trim();
    }

    const [day, month, year] = parts;

    if (!day || !month || !year) {
      return value.trim();
    }

    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  };

  // ================================
  // SEARCH
  // ================================

  const handleSearch = () => {
    if (!birthdayInput && !nameInput.trim()) {
      alert("Vui lòng nhập họ tên hoặc chọn ngày sinh.");
      return;
    }

    if (birthdayInput) {
      setSearchBirthday(convertBirthdayToDatabaseFormat(birthdayInput));
      setSearchName("");
    } else {
      setSearchBirthday("");
      setSearchName(nameInput.trim());
    }

    setHasSearched(true);
  };

  // ================================
  // CLEAR SEARCH
  // ================================

  const handleClear = () => {
    setNameInput("");
    setBirthdayInput("");
    setSearchName("");
    setSearchBirthday("");
    setHasSearched(false);

    // Xóa sạch session liên quan
    sessionStorage.removeItem("home_name_input");
    sessionStorage.removeItem("home_birthday_input");
    sessionStorage.removeItem("home_search_name");
    sessionStorage.removeItem("home_search_birthday");
    sessionStorage.removeItem("home_has_searched");
  };

  // ================================
  // SEARCH DESCRIPTION
  // ================================

  const searchDescription = searchBirthday
    ? `Kết quả theo ngày sinh: ${formatDate(searchBirthday)}`
    : searchName
      ? `Kết quả theo tên: “${searchName}”`
      : "";

  // ================================
  // SINH NHẬT HÔM NAY
  // ================================

  const todayBirthdayPeople = useMemo(() => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return people.filter((person) => {
      if (!person.birthday) return false;
      return String(person.birthday).substring(5) === `${month}-${day}`;
    });
  }, [people]);

  // ================================
  // NGÀY GIỖ HÔM NAY
  // ================================

  const todayDeathPeople = useMemo(() => {
    const now = new Date();
    const todayLunar = Solar.fromYmd(
      now.getFullYear(),
      now.getMonth() + 1,
      now.getDate()
    ).getLunar();

    const todayLunarMonth = todayLunar.getMonth();
    const todayLunarDay = todayLunar.getDay();

    return people
      .filter((person) => {
        if (!person.deathDate) return false;

        try {
          const normalizedDeathDate = String(person.deathDate).slice(0, 10);
          const [year, month, day] = normalizedDeathDate
            .split("-")
            .map(Number);

          if (!year || !month || !day) return false;

          const deathLunar = Solar.fromYmd(year, month, day).getLunar();

          return (
            deathLunar.getMonth() === todayLunarMonth &&
            deathLunar.getDay() === todayLunarDay
          );
        } catch (err) {
          console.error("Lỗi tính ngày giỗ âm lịch:", err);
          return false;
        }
      })
      .map((person) => {
        const normalizedDeathDate = String(person.deathDate).slice(0, 10);
        const [year, month, day] = normalizedDeathDate
          .split("-")
          .map(Number);

        const deathLunar = Solar.fromYmd(year, month, day).getLunar();

        return {
          ...person,
          deathLunarDate: `${String(deathLunar.getDay()).padStart(2, "0")}/${String(
            Math.abs(deathLunar.getMonth())
          ).padStart(2, "0")}`,
        };
      });
  }, [people]);

  // ================================
  // SỰ KIỆN DƯƠNG LỊCH HÔM NAY
  // ================================

  const todayEvents = useMemo(() => {
    const now = new Date();
    const todayDay = now.getDate();
    const todayMonth = now.getMonth() + 1;

    return events.filter((event) => {
      if (event.day === undefined || event.month === undefined) {
        return false;
      }
      return (
        Number(event.day) === todayDay &&
        Number(event.month) === todayMonth
      );
    });
  }, [events]);

  // ================================
  // HOME STATISTICS
  // ================================

  const homeStatistics = useMemo(() => {
    // Chưa tải xong dữ liệu people
    if (loading) {
      return {
        totalAlbums: null,
        totalAlbumViews: null,
        birthdaysThisMonth: null,
      };
    }

    const currentMonth = new Date().getMonth() + 1;

    const totalAlbums = people.length;

    const totalAlbumViews = people.reduce((total, person) => {
      return total + (Number(person.albumViews) || 0);
    }, 0);

    const birthdaysThisMonth = people.filter((person) => {
      if (!person.birthday) return false;

      const normalizedBirthday = String(person.birthday).slice(0, 10);
      const [, month] = normalizedBirthday.split("-");

      return Number(month) === currentMonth;
    }).length;

    return {
      totalAlbums,
      totalAlbumViews,
      birthdaysThisMonth,
    };
  }, [people, loading]);

  // ================================
  // RENDER
  // ================================

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <Navbar />

      {/* Popup chào mừng */}
      <WelcomePopup />

      {/* Popup kết quả tìm kiếm */}
      <SearchResult
        loading={loading}
        error={error}
        hasSearched={hasSearched}
        searchDescription={searchDescription}
        results={results}
        onClose={() => setHasSearched(false)}
      />

      {/* DATE HEADER */}
      <ScrollReveal direction="up">
        <section>
          <DateHeader
            today={today}
            weekdays={weekdays}
            lunarToday={lunarToday}
            monthText={monthText}
            yearGan={yearGan}
            yearZhi={yearZhi}
          />
        </section>
      </ScrollReveal>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-8 pt-2 sm:px-6 sm:pb-10 sm:pt-4">
        <WeatherCard />

        {/* THỐNG KÊ */}
        <ScrollReveal direction="up">
          <section>
            <HomeStatistics
              visits={visits}
              totalAlbums={homeStatistics.totalAlbums}
              totalAlbumViews={homeStatistics.totalAlbumViews}
              birthdaysThisMonth={homeStatistics.birthdaysThisMonth}
            />
          </section>
        </ScrollReveal>

        {/* SỰ KIỆN HÔM NAY */}
        <ScrollReveal direction="up" delay={80} className="mt-5">
          <section>
            <TodayEvents
              todayBirthdayPeople={todayBirthdayPeople}
              todayDeathPeople={todayDeathPeople}
              todayHolidays={todayHolidays}
              events={todayEvents}
              formatDate={formatDate}
              yearGan={yearGan}
              yearZhi={yearZhi}
            />
          </section>
        </ScrollReveal>

        {/* THÔNG BÁO */}
        {announcement.content?.trim() && (
          <ScrollReveal direction="up" delay={100} className="mt-6">
            <section>
              <Announcement
                content={announcement.content}
                updatedAt={announcement.updatedAt}
              />
            </section>
          </ScrollReveal>
        )}

        {/* TÌM KIẾM + ABOUT */}
        <ScrollReveal direction="up" delay={120} className="mt-6">
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
            <div className="min-w-0">
              <SearchBox
                name={nameInput}
                setName={setNameInput}
                birthday={birthdayInput}
                setBirthday={setBirthdayInput}
                onSearch={handleSearch}
                onClear={handleClear}
              />
            </div>

            <div className="hidden min-w-0 lg:block">
              <AboutMe />
            </div>
          </section>
        </ScrollReveal>

        {/* DAILY QUOTE */}
        <ScrollReveal direction="up" delay={100} className="mt-6">
          <section>
            <DailyQuote />
          </section>
        </ScrollReveal>

        {/* ABOUT MOBILE */}
        <ScrollReveal direction="up" delay={100} className="mt-6 lg:hidden">
          <section>
            <AboutMe />
          </section>
        </ScrollReveal>

        {/* FEEDBACK + DONATE */}
        <ScrollReveal direction="up" delay={120} className="mt-8">
          <section className="grid gap-6 lg:grid-cols-2">
            <FeedbackForm />
            <DonateCard />
          </section>
        </ScrollReveal>

        {/* PARTNERS */}
        <ScrollReveal direction="up" delay={120} className="mt-8">
          <section>
            <HomePartners />
          </section>
        </ScrollReveal>
      </main>

      <Footer />
    </div>
  );
}

// ================================
// FORMAT DATE
// ================================

function formatDate(value) {
  if (!value) return "";

  const normalized = String(value).slice(0, 10);
  const [year, month, day] = normalized.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

export default Home;