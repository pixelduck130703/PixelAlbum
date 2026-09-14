import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { Solar, Lunar } from "lunar-javascript";
import confetti from "canvas-confetti";

async function getClientHints() {
  if (!navigator.userAgentData) {
    return null;
  }

  try {
    const highEntropyValues =
      await navigator.userAgentData.getHighEntropyValues([
        "architecture",
        "bitness",
        "model",
        "platform",
        "platformVersion",
        "uaFullVersion",
        "fullVersionList",
        "wow64",
      ]);

    return {
      mobile: navigator.userAgentData.mobile ?? false,
      brands: navigator.userAgentData.brands || [],
      platform:
        navigator.userAgentData.platform ||
        highEntropyValues.platform ||
        "",
      architecture: highEntropyValues.architecture || "",
      bitness: highEntropyValues.bitness || "",
      model: highEntropyValues.model || "",
      platformVersion: highEntropyValues.platformVersion || "",
      uaFullVersion: highEntropyValues.uaFullVersion || "",
      fullVersionList: highEntropyValues.fullVersionList || [],
      wow64: highEntropyValues.wow64 ?? false,
    };
  } catch (error) {
    console.error("Không thể lấy Client Hints:", error);
    return null;
  }
}

function Detail() {
  const { publicId } = useParams();
  const navigate = useNavigate();

  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyAnswer, setVerifyAnswer] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [openingAlbum, setOpeningAlbum] = useState(false);

  useEffect(() => {
    const loadPerson = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          `/people/public/${publicId}`
        );
        setPerson(response.data);
      } catch (error) {
        console.error("Lỗi tải thông tin:", error);

        setError(
          error.response?.data?.message ||
            "Không thể tải thông tin người này."
        );
      } finally {
        setLoading(false);
      }
    };

    loadPerson();
  }, [publicId]);

  const age = useMemo(() => {
    if (!person?.birthday) return null;

    const birthday = new Date(`${person.birthday}T00:00:00`);
    const today = new Date();

    let calculatedAge = today.getFullYear() - birthday.getFullYear();
    const monthDifference = today.getMonth() - birthday.getMonth();

    if (
      monthDifference < 0 ||
      (monthDifference === 0 && today.getDate() < birthday.getDate())
    ) {
      calculatedAge--;
    }

    return calculatedAge;
  }, [person]);

  const daysLived = useMemo(() => {
    if (!person?.birthday) {
      return "";
    }

    const birthday = new Date(String(person.birthday).slice(0, 10));
    const today = person?.deathDate
      ? new Date(String(person.deathDate).slice(0, 10))
      : new Date();

    birthday.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diff = today.getTime() - birthday.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }, [person]);

  const timeSinceDeath = useMemo(() => {
    if (!person?.deathDate) {
      return "";
    }

    const death = new Date(String(person.deathDate).slice(0, 10));
    const today = new Date();

    let years = today.getFullYear() - death.getFullYear();
    let months = today.getMonth() - death.getMonth();
    let days = today.getDate() - death.getDate();

    if (days < 0) {
      months--;
      const previousMonth = new Date(
        today.getFullYear(),
        today.getMonth(),
        0
      );
      days += previousMonth.getDate();
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    return `${years} năm ${months} tháng ${days} ngày`;
  }, [person]);

  const birthdayCountdown = useMemo(() => {
    if (!person?.birthday) {
      return "";
    }

    const birthdayParts = person.birthday.split("-").map(Number);
    const month = birthdayParts[1];
    const day = birthdayParts[2];

    if (!month || !day) {
      return "";
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let nextBirthday = new Date(today.getFullYear(), month - 1, day);
    nextBirthday.setHours(0, 0, 0, 0);

    if (nextBirthday < today) {
      nextBirthday = new Date(today.getFullYear() + 1, month - 1, day);
    }

    const difference = nextBirthday.getTime() - today.getTime();
    const days = Math.round(difference / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return "🎂 Hôm nay là sinh nhật!";
    }

    return `🎉${days} ngày nữa đến sinh nhật`;
  }, [person]);

  useEffect(() => {
    if (person && birthdayCountdown === "🎂 Hôm nay là sinh nhật!") {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  }, [person, birthdayCountdown]);

  const deathAnniversaryCountdown = useMemo(() => {
    if (!person?.deathDate) {
      return null;
    }

    try {
      const normalizedDeathDate = String(person.deathDate).slice(0, 10);
      const [deathYear, deathMonth, deathDay] =
        normalizedDeathDate.split("-").map(Number);

      if (!deathYear || !deathMonth || !deathDay) {
        return null;
      }

      const deathSolar = Solar.fromYmd(deathYear, deathMonth, deathDay);
      const deathLunar = deathSolar.getLunar();

      const lunarMonth = deathLunar.getMonth();
      const lunarDay = deathLunar.getDay();

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const currentLunarYear = Solar.fromYmd(
        today.getFullYear(),
        today.getMonth() + 1,
        today.getDate()
      )
        .getLunar()
        .getYear();

      const createAnniversaryDate = (lunarYear) => {
        try {
          return Lunar.fromYmd(lunarYear, lunarMonth, lunarDay).getSolar();
        } catch (error) {
          return Lunar.fromYmd(
            lunarYear,
            Math.abs(lunarMonth),
            lunarDay
          ).getSolar();
        }
      };

      let anniversarySolar = createAnniversaryDate(currentLunarYear);
      let anniversaryDate = new Date(
        anniversarySolar.getYear(),
        anniversarySolar.getMonth() - 1,
        anniversarySolar.getDay()
      );

      anniversaryDate.setHours(0, 0, 0, 0);

      if (anniversaryDate < today) {
        anniversarySolar = createAnniversaryDate(currentLunarYear + 1);
        anniversaryDate = new Date(
          anniversarySolar.getYear(),
          anniversarySolar.getMonth() - 1,
          anniversarySolar.getDay()
        );
        anniversaryDate.setHours(0, 0, 0, 0);
      }

      const millisecondsPerDay = 1000 * 60 * 60 * 24;
      const days = Math.round(
        (anniversaryDate.getTime() - today.getTime()) / millisecondsPerDay
      );

      const lunarMonthText = Math.abs(lunarMonth);
      const isLeapMonth = lunarMonth < 0;

      const lunarDateText =
        `${String(lunarDay).padStart(2, "0")}/` +
        `${String(lunarMonthText).padStart(2, "0")} Âm lịch` +
        `${isLeapMonth ? " (tháng nhuận)" : ""}`;

      const solarDateText =
        `${String(anniversaryDate.getDate()).padStart(2, "0")}/` +
        `${String(anniversaryDate.getMonth() + 1).padStart(2, "0")}/` +
        `${anniversaryDate.getFullYear()}`;

      if (days === 0) {
        return {
          message: "Hôm nay là ngày giỗ",
          lunarDate: lunarDateText,
          solarDate: solarDateText,
          days: 0,
        };
      }

      return {
        message: `🕯️${days} ngày nữa đến ngày giỗ`,
        lunarDate: lunarDateText,
        solarDate: solarDateText,
        days,
      };
    } catch (error) {
      console.error("Lỗi tính ngày giỗ âm lịch:", error);
      return null;
    }
  }, [person]);

  const formatBirthday = (birthday) => {
    if (!birthday) return "Chưa cập nhật";
    const [year, month, day] = birthday.split("-");
    return `${day}/${month}/${year}`;
  };

  const getCanChi = (birthday) => {
    if (!birthday) return "";

    try {
      const [year, month, day] = String(birthday)
        .slice(0, 10)
        .split("-")
        .map(Number);

      const solar = Solar.fromYmd(year, month, day);
      const lunar = solar.getLunar();

      const ganMap = {
        甲: "Giáp", 乙: "Ất", 丙: "Bính", 丁: "Đinh", 戊: "Mậu",
        己: "Kỷ", 庚: "Canh", 辛: "Tân", 壬: "Nhâm", 癸: "Quý",
      };

      const chiMap = {
        子: "Tý", 丑: "Sửu", 寅: "Dần", 卯: "Mão", 辰: "Thìn", 巳: "Tỵ",
        午: "Ngọ", 未: "Mùi", 申: "Thân", 酉: "Dậu", 戌: "Tuất", 亥: "Hợi",
      };

      const ganZhi = lunar.getYearInGanZhi();
      return `${ganMap[ganZhi[0]]} ${chiMap[ganZhi[1]]}`;
    } catch {
      return "";
    }
  };

  const formatLunarDate = (date) => {
    if (!date) return "Chưa cập nhật";

    try {
      const normalizedDate = String(date).slice(0, 10);
      const [year, month, day] = normalizedDate.split("-").map(Number);

      const solar = Solar.fromYmd(year, month, day);
      const lunar = solar.getLunar();

      const lunarDay = lunar.getDay();
      const lunarMonth = Math.abs(lunar.getMonth());
      const lunarYear = lunar.getYear();

      let monthText = String(lunarMonth).padStart(2, "0");

      const can = ["Canh", "Tân", "Nhâm", "Quý", "Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ"];
      const chi = ["Thân", "Dậu", "Tuất", "Hợi", "Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi"];

      const yearCanChi = `${can[lunarYear % 10]} ${chi[lunarYear % 12]}`;

      return `${String(lunarDay).padStart(2, "0")}/${monthText}${
        lunar.getMonth() < 0 ? " (nhuận)" : ""
      }/${yearCanChi}`;
    } catch (error) {
      return "Không xác định";
    }
  };

  const normalizeAlbumUrl = (url) => {
    if (!url) return "";
    const normalizedUrl = String(url).trim();
    if (/^https?:\/\//i.test(normalizedUrl)) {
      return normalizedUrl;
    }
    return `https://${normalizedUrl}`;
  };

  const recordAlbumView = async () => {
    try {
      const clientHints = await getClientHints();
      await api.post(`/people/public/${publicId}/album-view`, {
        clientHints,
      });
    } catch (error) {
      console.error("Lỗi tăng lượt xem album:", error);
    }
  };

  const redirectToAlbum = async (albumUrl) => {
    const normalizedUrl = normalizeAlbumUrl(albumUrl);

    if (!normalizedUrl || openingAlbum) {
      return;
    }

    setOpeningAlbum(true);

    try {
      // Đảm bảo ghi nhận xong vào database rồi mới mở tab mới
      await recordAlbumView();
    } catch (err) {
      console.error(err);
    } finally {
      // Mở sang tab mới để không ngắt kết nối mạng của trang hiện tại
      window.open(normalizedUrl, "_blank", "noopener,noreferrer");
      setOpeningAlbum(false);
    }
  };

  const handleOpenAlbum = () => {
    if (openingAlbum) {
      return;
    }

    if (!person?.hasAlbum && !person?.album) {
      return;
    }

    if (person?.securityQuestion) {
      setVerifyAnswer("");
      setVerifyError("");
      setVerifyOpen(true);
      return;
    }

    redirectToAlbum(person?.album);
  };

  const handleVerifyAlbum = async (event) => {
    event.preventDefault();

    if (verifying || openingAlbum) {
      return;
    }

    const answer = verifyAnswer.trim();

    if (!answer) {
      setVerifyError("Vui lòng nhập câu trả lời.");
      return;
    }

    try {
      setVerifying(true);
      setVerifyError("");

      const response = await api.post(
        `/people/public/${publicId}/verify-album`,
        { answer }
      );

      const albumUrl = normalizeAlbumUrl(
        response.data?.album || person?.album
      );

      if (!albumUrl) {
        setVerifyError("Không tìm thấy liên kết album.");
        return;
      }

      setVerifyOpen(false);
      setVerifyAnswer("");
      setOpeningAlbum(true);

      await recordAlbumView();

      window.open(albumUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      setVerifyError(
        error.response?.data?.message ||
          "Không thể xác thực câu trả lời."
      );
    } finally {
      setVerifying(false);
      setOpeningAlbum(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-5">
        <div className="rounded-2xl bg-white px-8 py-6 text-lg font-semibold text-slate-700 shadow">
          Đang tải thông tin...
        </div>
      </div>
    );
  }

  if (error || !person) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-5">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl">
          <div className="text-5xl">😕</div>
          <h1 className="mt-4 text-2xl font-bold text-slate-800">
            Không tìm thấy thông tin
          </h1>
          <p className="mt-3 text-slate-500">
            {error || "Người này không tồn tại."}
          </p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-6 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 cursor-pointer"
          >
            Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="overflow-hidden rounded-3xl bg-white shadow-xl">
          <div className="relative overflow-hidden px-6 py-10 text-center text-white">
            <div
              className="absolute inset-0 bg-cover bg-center scale-110 blur-sm brightness-120"
              style={{
                backgroundImage: `url(${
                  person.avatar || "https://placehold.co/300x300?text=Avatar"
                })`,
              }}
            />
            <div className="absolute inset-0 bg-black/40" />

            <div className="relative z-10">
              <img
                src={
                  person.avatar || "https://placehold.co/300x300?text=Avatar"
                }
                alt={person.name}
                className="mx-auto h-36 w-36 rounded-full border-4 border-white object-cover shadow-2xl sm:h-44 sm:w-44"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src =
                    "https://placehold.co/300x300?text=Avatar";
                }}
              />

              <h1 className="mt-5 text-3xl font-bold drop-shadow-lg sm:text-4xl">
                {person.name}
              </h1>

              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {age !== null && (
                  <span className="rounded-full bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur-md">
                    🎂 {age} tuổi
                  </span>
                )}

                <span className="rounded-full bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur-md">
                  👁️ {Number(person.albumViews || 0).toLocaleString("vi-VN")} lượt xem
                </span>

                {person.class && (
                  <span className="rounded-full bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur-md">
                    🎓 {person.class}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {person.deathDate && (
              <>
                <div className="mb-7 rounded-3xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-6 text-center shadow-sm">
                  <div className="text-5xl">🕯️🎗︎</div>
                  <h2 className="mt-4 text-2xl font-bold text-slate-800 sm:text-3xl">
                    Tưởng nhớ và tri ân
                  </h2>
                  <p className="mt-4 text-lg leading-relaxed text-slate-700">
                    Xin được tưởng nhớ và trân trọng những kỷ niệm đẹp về{" "}
                    <strong className="text-slate-800">{person.name}</strong>.
                    Những hình ảnh, khoảnh khắc và ký ức về{" "}
                    <strong className="text-slate-800">{person.name}</strong>{" "}
                    sẽ luôn được lưu giữ như một phần đáng quý trong lòng gia đình,
                    bạn bè và những người thân yêu.
                  </p>
                  <div className="mx-auto mt-6 h-px max-w-md bg-amber-200" />
                  <p className="mt-6 font-medium italic text-amber-700">
                    “Kỷ niệm vẫn còn mãi theo thời gian.”
                  </p>
                </div>

                <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {birthdayCountdown && (
                    <div
                      className={`overflow-hidden rounded-3xl border border-pink-200 bg-gradient-to-br from-pink-50 via-white to-rose-50 p-5 text-center shadow-sm ${
                        !deathAnniversaryCountdown ? "sm:col-span-2" : ""
                      }`}
                    >
                      <p className="mt-1 font-semibold leading-6 text-slate-700">
                        {birthdayCountdown}
                      </p>
                    </div>
                  )}

                  {deathAnniversaryCountdown && (
                    <div
                      className={`overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-5 text-center shadow-sm ${
                        !birthdayCountdown ? "sm:col-span-2" : ""
                      }`}
                    >
                      <p className="mt-1 font-semibold leading-6 text-slate-700">
                        {deathAnniversaryCountdown.message}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {!person.deathDate &&
              birthdayCountdown === "🎂 Hôm nay là sinh nhật!" && (
                <div className="mb-7 rounded-3xl border border-pink-200 bg-gradient-to-r from-pink-50 via-rose-50 to-yellow-50 p-6 text-center shadow-sm">
                  <div className="text-6xl">🎂🎉</div>
                  <h2 className="mt-3 text-3xl font-bold text-pink-600">
                    Chúc mừng sinh nhật!
                  </h2>
                  <p className="mt-3 text-lg leading-relaxed text-slate-700">
                    Gửi những lời chúc tốt đẹp nhất đến{" "}
                    <strong>{person.name}</strong>. Mong rằng bạn luôn lạc quan để
                    đón nhận mọi điều may mắn. Chúc cuộc sống của bạn luôn ngập tràn
                    tình yêu thương, bình an trong mỗi bước đi và gặt hái được thật
                    nhiều thành công trên chặng đường phía trước.
                  </p>
                  <div className="mx-auto mt-6 h-px max-w-md bg-pink-200" />
                  <p className="mt-6 font-medium italic text-pink-600">
                    🎈 Chúc bạn có một ngày sinh nhật thật ý nghĩa! 🎈
                  </p>
                </div>
              )}

            {!person.deathDate &&
              birthdayCountdown &&
              birthdayCountdown !== "🎂 Hôm nay là sinh nhật!" && (
                <div className="mb-7 rounded-2xl bg-amber-50 p-4 text-center font-semibold text-amber-700">
                  {birthdayCountdown}
                </div>
              )}

            {person.deathDate ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <InfoItem
                  label="Ngày sinh"
                  value={
                    person.birthday
                      ? formatBirthday(person.birthday)
                      : "Chưa cập nhật"
                  }
                  icon="🎁"
                />

                <InfoItem
                  label="Ngày mất"
                  value={
                    person.deathDate
                      ? `${formatBirthday(person.deathDate)} (${formatLunarDate(
                          person.deathDate
                        )})`
                      : "Chưa cập nhật"
                  }
                  icon="🎗️"
                />

                <InfoItem
                  label="Ngày giỗ tiếp theo"
                  value={
                    deathAnniversaryCountdown
                      ? `${deathAnniversaryCountdown.solarDate} (Dương lịch)`
                      : "Chưa cập nhật"
                  }
                  icon="🕯️"
                />
                <InfoItem
                  label="Đã yên nghỉ"
                  value={timeSinceDeath || "Chưa cập nhật"}
                  icon="⏳"
                />
                <InfoItem
                  label="Giới tính"
                  value={person.gender || "Chưa cập nhật"}
                  icon="👤"
                />

                <InfoItem
                  label="Quê quán/Địa điểm"
                  value={person.address || "Chưa cập nhật"}
                  icon="📍"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <InfoItem
                  label="Ngày sinh"
                  value={
                    person.birthday
                      ? `${formatBirthday(person.birthday)} (${getCanChi(
                          person.birthday
                        )})`
                      : "Chưa cập nhật"
                  }
                  icon="🎁"
                />

                <InfoItem
                  value={
                    daysLived
                      ? `${daysLived.toLocaleString("vi-VN")} lần`
                      : "Chưa có ngày sinh"
                  }
                  label="Số lần đón bình minh 🤧"
                  icon="🌎"
                />

                <InfoItem
                  label="Giới tính"
                  value={person.gender || "Chưa cập nhật"}
                  icon="👤"
                />

                <InfoItem
                  label="Quê quán/Địa điểm"
                  value={person.address || "Chưa cập nhật"}
                  icon="📍"
                />
              </div>
            )}

            <div className="mt-8 border-t border-slate-200 pt-6">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {person.hasAlbum || person.album ? (
                  <button
                    type="button"
                    onClick={handleOpenAlbum}
                    disabled={openingAlbum}
                    style={{ touchAction: "manipulation" }}
                    className="group flex min-h-[56px] w-full select-none items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-3 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/30 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 sm:px-5 sm:text-base cursor-pointer"
                  >
                    <span className="shrink-0 text-lg transition duration-300 group-hover:scale-110 sm:text-xl">
                      {openingAlbum ? "⏳" : "🖼️"}
                    </span>

                    <span className="min-w-0 truncate">
                      {openingAlbum
                        ? "Đang mở..."
                        : person.securityQuestion
                        ? "Xem album"
                        : "Xem album"}
                    </span>
                  </button>
                ) : (
                  <div className="flex min-h-[56px] w-full items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-100 px-3 py-3 text-center text-xs font-semibold text-slate-500 sm:px-5 sm:text-sm">
                    Chưa có album
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="group flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-3 py-3 text-sm font-bold text-slate-700 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 hover:shadow-md active:translate-y-0 sm:px-5 sm:text-base cursor-pointer"
                >
                  <span className="shrink-0 text-lg transition duration-300 group-hover:-translate-x-1">
                    ←
                  </span>
                  <span>Quay lại</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {verifyOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md transition-all duration-300"
          onClick={() => {
            if (!verifying) {
              setVerifyOpen(false);
            }
          }}
        >
          <div
            className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-white/30 bg-white/75 p-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.8)] backdrop-blur-2xl ring-1 ring-black/5 sm:p-7"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="pointer-events-none absolute -left-12 -top-12 h-44 w-44 rounded-full bg-gradient-to-br from-blue-400/30 to-indigo-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-12 -right-12 h-44 w-44 rounded-full bg-gradient-to-tl from-violet-400/25 to-rose-400/20 blur-3xl" />

            <div className="relative flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/60 bg-gradient-to-b from-white/80 to-white/30 text-2xl shadow-[0_8px_20px_rgba(37,99,235,0.15),inset_0_1px_2px_rgba(255,255,255,0.9)] backdrop-blur-xl">
                  🔐
                </div>

                <div>
                  <h2 className="text-xl font-black tracking-tight text-slate-800 sm:text-2xl">
                    Xác thực album
                  </h2>
                  <p className="text-xs font-semibold text-slate-500">
                    Nhập đáp án để mở khóa nội dung
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setVerifyOpen(false)}
                disabled={verifying}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/60 bg-white/40 text-sm font-bold text-slate-500 shadow-sm backdrop-blur-md transition hover:bg-white/80 hover:text-slate-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleVerifyAlbum} className="relative mt-6 space-y-4">
              <div className="relative overflow-hidden rounded-2xl border border-blue-200/50 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-white/40 p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7)] backdrop-blur-lg">
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-blue-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                  Câu hỏi bảo mật
                </div>

                <p className="mt-1.5 text-sm font-bold leading-relaxed text-slate-800">
                  {person.securityQuestion}
                </p>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="verify-answer"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-600"
                >
                  Câu trả lời
                </label>

                <div className="relative">
                  <input
                    id="verify-answer"
                    type="text"
                    value={verifyAnswer}
                    onChange={(event) => setVerifyAnswer(event.target.value)}
                    placeholder="Nhập câu trả lời..."
                    autoFocus
                    disabled={verifying}
                    className="h-12 w-full rounded-2xl border border-white/80 bg-white/60 px-4 text-base sm:text-sm font-semibold text-slate-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)] backdrop-blur-md outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-blue-400 focus:bg-white/90 focus:ring-4 focus:ring-blue-400/20 disabled:cursor-not-allowed disabled:bg-slate-100/50"
                  />
                </div>
              </div>

              {verifyError && (
                <div className="flex items-center gap-2 rounded-2xl border border-rose-300/60 bg-rose-500/10 px-3.5 py-2.5 text-xs font-bold text-rose-700 shadow-sm backdrop-blur-md">
                  <span className="shrink-0 text-sm">⚠️</span>
                  <span className="break-words">{verifyError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setVerifyOpen(false)}
                  disabled={verifying}
                  className="flex h-11 items-center justify-center rounded-2xl border border-white/60 bg-white/40 font-bold text-slate-700 shadow-sm backdrop-blur-md transition hover:bg-white/80 hover:text-slate-900 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 text-sm cursor-pointer"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={verifying}
                  className="relative flex h-11 items-center justify-center gap-2 overflow-hidden rounded-2xl border border-blue-400/40 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 bg-[length:200%_auto] font-bold text-white shadow-[0_8px_20px_-4px_rgba(37,99,235,0.4),inset_0_1px_1px_rgba(255,255,255,0.4)] transition duration-300 hover:bg-right hover:shadow-[0_12px_24px_-4px_rgba(37,99,235,0.5)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 text-sm cursor-pointer"
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent" />

                  {verifying ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      <span className="relative">Đang xử lý...</span>
                    </>
                  ) : (
                    <span className="relative">Xác nhận</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value, icon, fullWidth = false }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-slate-50 p-5 ${
        fullWidth ? "md:col-span-2" : ""
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1 break-words font-semibold text-slate-800">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Detail;