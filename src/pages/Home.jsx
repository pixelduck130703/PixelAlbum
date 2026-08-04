import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SearchBox from "../components/SearchBox";
import PersonCard from "../components/PersonCard";
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

const today = new Date();

const lunarToday = Solar.fromYmd(
  today.getFullYear(),
  today.getMonth() + 1,
  today.getDate()
).getLunar();

const todayHolidays = getTodayVietnamHolidays(
  today,
  lunarToday
);

const solarToday = Solar.fromYmd(
  today.getFullYear(),
  today.getMonth() + 1,
  today.getDate()
);


const heavenlyStems = {
  "甲": "Giáp", "乙": "Ất", "丙": "Bính", "丁": "Đinh", "戊": "Mậu", "己": "Kỷ", "庚": "Canh", "辛": "Tân", "壬": "Nhâm", "癸": "Quý",
};

const earthlyBranches = {
  "子": "Tý", "丑": "Sửu", "寅": "Dần", "卯": "Mão", "辰": "Thìn", "巳": "Tỵ", "午": "Ngọ", "未": "Mùi", "申": "Thân", "酉": "Dậu", "戌": "Tuất", "亥": "Hợi",
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

const yearGanZhi = lunarToday.getYearInGanZhi();
const yearGan = heavenlyStems[lunarToday.getYearGan()];
const yearZhi = earthlyBranches[lunarToday.getYearZhi()];

const weekdays = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

function Home() {
  const [people, setPeople] = useState([]);

  const [nameInput, setNameInput] = useState("");
  const [birthdayInput, setBirthdayInput] = useState("");

  // Giá trị thực sự dùng để tìm sau khi bấm nút
  const [searchName, setSearchName] = useState("");
  const [searchBirthday, setSearchBirthday] = useState("");

  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [visits, setVisits] = useState(null);

  const [announcement, setAnnouncement] = useState({
    content: "",
    updatedAt: null,
  });

  useEffect(() => {
    const loadAnnouncement = async () => {
      try {
        const response = await api.get("/announcement");

        setAnnouncement({
          content: response.data?.content || "",
          updatedAt: response.data?.updatedAt || null,
        });
      } catch (error) {
        console.error("Lỗi tải thông báo:", error);

        setAnnouncement({
          content: "",
          updatedAt: null,
        });
      }
    };

    loadAnnouncement();
  }, []);

  useEffect(() => {
    const loadVisits = async () => {
      const visited = sessionStorage.getItem("websiteVisited");

      try {
        if (!visited) {
          // Đánh dấu trước khi gọi API để tránh React gọi POST 2 lần
          sessionStorage.setItem("websiteVisited", "true");

          const response = await api.post("/visits");

          setVisits(Number(response.data.visits) || 0);
        } else {
          const response = await api.get("/visits");

          setVisits(Number(response.data.visits) || 0);
        }
      } catch (error) {
        console.error("Lỗi tải lượt truy cập:", error);

        // Nếu POST lỗi thì cho phép thử lại khi tải lại trang
        if (!visited) {
          sessionStorage.removeItem("websiteVisited");
        }

        setVisits(0);
      }
    };

    loadVisits();
  }, []);


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

        setPeople(response.data);
        setLoading(false);

        // Thành công thì không gọi lại nữa
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

        // Thất bại thì thử lại sau 5 giây
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

  const normalizeText = (value) => {
    return String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ");
  };

  const results = useMemo(() => {
    if (!hasSearched) {
      return [];
    }

    // Có ngày sinh: chỉ tìm theo ngày sinh, toàn không dùng tên.
    if (searchBirthday) {
      return people.filter(
        (person) => person.birthday === searchBirthday
      );
    }

    // Không có ngày sinh: mới được tìm theo tên.
    const normalizedName = normalizeText(searchName);

    if (normalizedName) {
      return people.filter((person) => {
        const hasNoBirthday =
          !person.birthday || person.birthday.trim() === "";

        const nameMatches = normalizeText(person.name).includes(
          normalizedName
        );

        return hasNoBirthday && nameMatches;
      });
    }

    return [];
  }, [
    people,
    searchName,
    searchBirthday,
    hasSearched,
  ]);

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

  const handleSearch = () => {
    if (!birthdayInput && !nameInput.trim()) {
      alert("Vui lòng nhập họ tên hoặc chọn ngày sinh.");
      return;
    }

    if (birthdayInput) {
      // Ngày sinh luôn được ưu tiên.
      setSearchBirthday(
        convertBirthdayToDatabaseFormat(birthdayInput)
      );
      setSearchName("");
    } else {
      setSearchBirthday("");
      setSearchName(nameInput.trim());
    }

    setHasSearched(true);
  };

  const handleClear = () => {
    setNameInput("");
    setBirthdayInput("");
    setSearchName("");
    setSearchBirthday("");
    setHasSearched(false);
  };

  const searchDescription = searchBirthday
    ? `Kết quả theo ngày sinh: ${formatDate(searchBirthday)}`
    : searchName
      ? `Kết quả theo tên: “${searchName}”`
      : "";

  const todayBirthdayPeople = useMemo(() => {
    const today = new Date();

    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return people.filter((person) => {
      if (!person.birthday) {
        return false;
      }

      return person.birthday.substring(5) === `${month}-${day}`;
    });
  }, [people]);

  const todayDeathPeople = useMemo(() => {
    const today = new Date();

    // Chuyển ngày hôm nay sang âm lịch
    const todayLunar = Solar.fromYmd(
      today.getFullYear(),
      today.getMonth() + 1,
      today.getDate()
    ).getLunar();

    const todayLunarMonth = todayLunar.getMonth();
    const todayLunarDay = todayLunar.getDay();

    return people
      .filter((person) => {
        if (!person.deathDate) {
          return false;
        }

        try {
          // Hỗ trợ cả YYYY-MM-DD và ISO từ PostgreSQL
          const normalizedDeathDate = String(
            person.deathDate
          ).slice(0, 10);

          const [year, month, day] = normalizedDeathDate
            .split("-")
            .map(Number);

          if (!year || !month || !day) {
            return false;
          }

          // Chuyển ngày mất dương lịch sang âm lịch
          const deathLunar = Solar.fromYmd(
            year,
            month,
            day
          ).getLunar();

          return (
            deathLunar.getMonth() === todayLunarMonth &&
            deathLunar.getDay() === todayLunarDay
          );
        } catch (error) {
          console.error(
            "Lỗi tính ngày giỗ âm lịch:",
            error
          );

          return false;
        }
      })
      .map((person) => {
        const normalizedDeathDate = String(
          person.deathDate
        ).slice(0, 10);

        const [year, month, day] = normalizedDeathDate
          .split("-")
          .map(Number);

        const deathLunar = Solar.fromYmd(
          year,
          month,
          day
        ).getLunar();

        return {
          ...person,
          deathLunarDate: `${String(
            deathLunar.getDay()
          ).padStart(2, "0")}/${String(
            Math.abs(deathLunar.getMonth())
          ).padStart(2, "0")}`,
        };
      });
  }, [people]);

  const homeStatistics = useMemo(() => {
    const currentMonth = new Date().getMonth() + 1;

    const totalAlbums = people.length;

    const totalAlbumViews = people.reduce((total, person) => {
      return total + (Number(person.albumViews) || 0);
    }, 0);

    const birthdaysThisMonth = people.filter((person) => {
      if (!person.birthday) {
        return false;
      }

      const normalizedBirthday = String(person.birthday).slice(0, 10);
      const [, month] = normalizedBirthday.split("-");

      return Number(month) === currentMonth;
    }).length;

    return {
      totalAlbums,
      totalAlbumViews,
      birthdaysThisMonth,
    };
  }, [people]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <Navbar />

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
        {/* Thống kê */}
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

        {/* Sự kiện hôm nay */}
        <ScrollReveal
          direction="up"
          delay={80}
          className="mt-5"
        >
          <section>
            <TodayEvents
              todayBirthdayPeople={todayBirthdayPeople}
              todayDeathPeople={todayDeathPeople}
              todayHolidays={todayHolidays}
              formatDate={formatDate}
              yearGan={yearGan}
              yearZhi={yearZhi}
            />
          </section>
        </ScrollReveal>

        {/* Thông báo */}
        {announcement.content?.trim() && (
          <ScrollReveal
            direction="up"
            delay={100}
            className="mt-6"
          >
            <section>
              <Announcement
                content={announcement.content}
                updatedAt={announcement.updatedAt}
              />
            </section>
          </ScrollReveal>
        )}

        {/* Tìm kiếm và giới thiệu */}
        <ScrollReveal
          direction="up"
          delay={120}
          className="mt-6"
        >
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

        {/* Kết quả tìm kiếm */}
        <ScrollReveal
          direction="up"
          delay={100}
          className="mt-6"
        >
          <section>
            <SearchResult
              loading={loading}
              error={error}
              hasSearched={hasSearched}
              searchDescription={searchDescription}
              results={results}
            />
          </section>
        </ScrollReveal>

        {/* Câu nói */}
        <ScrollReveal
          direction="up"
          delay={100}
          className="mt-6"
        >
          <section>
            <DailyQuote />
          </section>
        </ScrollReveal>

        {/* Giới thiệu trên mobile */}
        <ScrollReveal
          direction="up"
          delay={100}
          className="mt-6 lg:hidden"
        >
          <section>
            <AboutMe />
          </section>
        </ScrollReveal>

        {/* Góp ý và ủng hộ */}
        <ScrollReveal
          direction="up"
          delay={120}
          className="mt-8"
        >
          <section className="grid gap-6 lg:grid-cols-2">
            <FeedbackForm />
            <DonateCard />
          </section>
        </ScrollReveal>
      </main>
      
      <Footer />
    </div>
  );
}

function formatDate(value) {
  if (!value) return "";

  const [year, month, day] = value.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

export default Home;