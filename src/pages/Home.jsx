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
import FIFAWC from "../components/FIFAWC";
import FootballScores from "../components/FootballScores";

const today = new Date();

const solarToday = Solar.fromYmd(
  today.getFullYear(),
  today.getMonth() + 1,
  today.getDate()
);

const lunarToday = solarToday.getLunar();

const heavenlyStems = {
  "甲": "Giáp",
  "乙": "Ất",
  "丙": "Bính",
  "丁": "Đinh",
  "戊": "Mậu",
  "己": "Kỷ",
  "庚": "Canh",
  "辛": "Tân",
  "壬": "Nhâm",
  "癸": "Quý",
};

const earthlyBranches = {
  "子": "Tý",
  "丑": "Sửu",
  "寅": "Dần",
  "卯": "Mão",
  "辰": "Thìn",
  "巳": "Tỵ",
  "午": "Ngọ",
  "未": "Mùi",
  "申": "Thân",
  "酉": "Dậu",
  "戌": "Tuất",
  "亥": "Hợi",
};

const yearGanZhi = lunarToday.getYearInGanZhi();
const yearGan = heavenlyStems[yearGanZhi[0]];
const yearZhi = earthlyBranches[yearGanZhi[1]];

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

    // Có ngày sinh: chỉ tìm theo ngày sinh,
    // hoàn toàn không dùng tên.
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

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <Navbar />

      <div className="mx-auto mt-6 flex w-full max-w-7xl flex-col gap-4 px-4 sm:flex-row sm:items-stretch sm:px-6">
        {/* Ngày dương lịch */}
        <div className="flex flex-1 items-center justify-center rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-white p-4 text-center shadow-sm">
          <p className="text-base font-bold text-slate-800 sm:text-xl">
            {weekdays[today.getDay()]},{" "}
            {`Ngày ${String(today.getDate()).padStart(2, "0")} Tháng ${String(
              today.getMonth() + 1
            ).padStart(2, "0")} Năm ${today.getFullYear()}`}
          </p>
        </div>

        {/* Ngày âm lịch */}
        <div className="flex flex-1 items-center justify-center rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50 to-white p-4 text-center shadow-sm">
          <p className="text-base font-bold text-slate-800 sm:text-xl">
            {weekdays[today.getDay()]},{" "}
            Ngày {String(lunarToday.getDay()).padStart(2, "0")} {" "}
            Tháng {String(Math.abs(lunarToday.getMonth())).padStart(2, "0")} Năm{" "}
            {yearGan} {yearZhi}
          </p>
        </div>
      </div>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-6">
        {todayBirthdayPeople.length > 0 && (
          <div className="mb-8 overflow-hidden rounded-3xl border border-pink-200 bg-gradient-to-br from-pink-50 via-white to-yellow-50 p-6 shadow-lg sm:p-8">
            <div className="text-center">
              <h2 className="mt-1 text-2xl font-bold text-pink-600">
                🎂Chúc mừng sinh nhật!🎉
              </h2>
            </div>

            <div className="mt-7 grid grid-cols-1 gap-4">
              {todayBirthdayPeople.map((person) => (
                <div
                  key={person.id}
                  className="relative overflow-hidden rounded-3xl border border-pink-200 bg-gradient-to-r from-pink-50 via-white to-yellow-50 p-4 shadow-xl ring-2 ring-pink-100 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-pink-300 sm:p-5"
                >
                  <div className="relative z-10 flex items-center gap-4">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-pink-400 via-yellow-300 to-purple-400 opacity-70 blur-sm" />

                      <img
                        src={
                          person.avatar ||
                          "https://placehold.co/100x100?text=Avatar"
                        }
                        alt={person.name}
                        className="relative h-16 w-16 rounded-full border-4 border-white object-cover shadow-lg sm:h-20 sm:w-20"
                        onError={(event) => {
                          event.currentTarget.src =
                            "https://placehold.co/100x100?text=Avatar";
                        }}
                      />

                      <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg shadow">
                        🎂
                      </span>
                    </div>

                    {/* Thông tin */}
                    <div className="min-w-0 flex-1 px-1 text-center sm:px-0 sm:text-left">
                      <p className="text-xs font-semibold uppercase tracking-wider text-pink-500">
                        Happy Birthday
                      </p>

                      <h3 className="mt-1 break-words text-lg font-bold leading-tight text-slate-800 sm:text-2xl">
                        {person.name}
                      </h3>
                    </div>

                    {/* Icon quà - chỉ hiển thị trên tablet và desktop */}
                    <div className="hidden shrink-0 text-center sm:block">
                      <div className="animate-bounce text-6xl">
                        🎁🎉
                      </div>

                      <p className="mt-2 text-xs font-semibold text-pink-500">
                        Sinh nhật vui vẻ
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-6 text-center font-semibold italic text-pink-600">
              ❤️ Chúc bạn có ngày sinh nhật thật ý nghĩa!
            </p>
          </div>
        )}
        {todayDeathPeople.length > 0 && (
          <div className="mb-8 overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-6 shadow-lg sm:p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-amber-700">
                🕯️ Hôm nay là ngày giỗ
              </h2>
            </div>

            <div className="mt-7 grid grid-cols-1 gap-4">
              {todayDeathPeople.map((person) => (
                <div
                  key={person.id}
                  className="relative overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-orange-50 p-4 shadow-xl ring-2 ring-amber-100 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-amber-300 sm:p-5"
                >
                  <div className="relative z-10 flex items-center gap-4 px-7 py-2 sm:px-10">
                    <div className="relative shrink-0">
                      <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 opacity-70 blur-sm" />

                      <img
                        src={
                          person.avatar ||
                          "https://placehold.co/100x100?text=Avatar"
                        }
                        alt={person.name}
                        className="relative h-16 w-16 rounded-full border-4 border-white object-cover shadow-lg sm:h-20 sm:w-20"
                        onError={(event) => {
                          event.currentTarget.src =
                            "https://placehold.co/100x100?text=Avatar";
                        }}
                      />

                      <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-white text-xl shadow">
                        🕯️
                      </span>
                    </div>

                    <div className="min-w-0 flex-1 text-center sm:text-left">
                      <p className="text-sm font-semibold uppercase tracking-wider text-amber-600">
                        Ngày tưởng niệm
                      </p>

                      <h3 className="mt-1 truncate text-xl font-bold text-slate-800 sm:text-2xl">
                        {person.name}
                      </h3>

                      <p className="mt-2 text-sm text-slate-500">
                        Ngày mất: {formatDate(person.deathDate)} (DL) - {person.deathLunarDate} (ÂL)
                      </p>
                    </div>

                    <div className="hidden shrink-0 text-center sm:block">
                      <div className="animate-bounce text-6xl">
                        🕯️🎗︎
                      </div>

                      <p className="mt-1 text-xs font-semibold text-amber-600">
                        Thành kính tưởng nhớ
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-6 text-center font-semibold italic text-amber-700">
              🌿 Thành kính tưởng nhớ và tri ân.
            </p>
          </div>
        )}
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
          {/* Bên trái: Tìm kiếm */}
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

          {/* Desktop: Giới thiệu bên phải */}
          <div className="hidden min-w-0 lg:block">
            <AboutMe />
          </div>
        </div>

        {/* Kết quả tìm kiếm */}
        <div className="mt-8">
          {loading && (
            <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500" />

              <p className="mt-4 text-lg font-semibold text-slate-700">
                Đang tải dữ liệu...
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Máy chủ đang khởi động. Website sẽ tự thử lại sau mỗi 5 giây.
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
              {error}
            </div>
          )}

          {!loading && !error && !hasSearched && (
            <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
              <div className="text-4xl">🔎</div>

              <p className="mt-2 text-slate-500">
                Chọn ngày sinh hoặc nhập họ tên của người cần tìm.
              </p>
            </div>
          )}

          {!loading && !error && hasSearched && (
            <>
              <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    Kết quả tìm kiếm
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {searchDescription}
                  </p>
                </div>

                <span className="text-sm font-semibold text-blue-600">
                  Tìm thấy {results.length} người
                </span>
              </div>

              {results.length === 0 ? (
                <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
                  <div className="text-5xl">😕</div>

                  <h3 className="mt-4 text-xl font-bold text-slate-800">
                    Không tìm thấy kết quả
                  </h3>

                  <p className="mt-2 text-slate-500">
                    Hãy xóa tìm kiếm và tìm kiếm theo cách còn lại.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {results.map((person) => (
                    <PersonCard
                      key={person.id}
                      person={person}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Mobile: Giới thiệu nằm sau kết quả */}
        <div className="mt-8 lg:hidden">
          <AboutMe />
        </div>

        {/* Gửi kiến nghị */}
        {/* Gửi kiến nghị và ủng hộ */}
        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-stretch">
          <FeedbackForm />

          <DonateCard />
        </div>
        {/*<FootballScores />*/}
        
        {/*<FIFAWC /> */}
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