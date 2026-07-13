import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { Solar, Lunar } from "lunar-javascript";

function Detail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyAnswer, setVerifyAnswer] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const loadPerson = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(`/people/${id}`);
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
  }, [id]);

  const age = useMemo(() => {
    if (!person?.birthday) return null;

    const birthday = new Date(`${person.birthday}T00:00:00`);
    const today = new Date();

    let calculatedAge =
      today.getFullYear() - birthday.getFullYear();

    const monthDifference =
      today.getMonth() - birthday.getMonth();

    if (
      monthDifference < 0 ||
      (monthDifference === 0 &&
        today.getDate() < birthday.getDate())
    ) {
      calculatedAge--;
    }

    return calculatedAge;
  }, [person]);

  const daysLived = useMemo(() => {
    if (!person?.birthday) {
      return "";
    }

    const birthday = new Date(
      String(person.birthday).slice(0, 10)
    );

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

    const birthdayParts = person.birthday
      .split("-")
      .map(Number);

    const month = birthdayParts[1];
    const day = birthdayParts[2];

    if (!month || !day) {
      return "";
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let nextBirthday = new Date(
      today.getFullYear(),
      month - 1,
      day
    );

    nextBirthday.setHours(0, 0, 0, 0);

    if (nextBirthday < today) {
      nextBirthday = new Date(
        today.getFullYear() + 1,
        month - 1,
        day
      );
    }

    const difference = nextBirthday.getTime() - today.getTime();

    const days = Math.round(
      difference / (1000 * 60 * 60 * 24)
    );

    if (days === 0) {
      return "🎂 Hôm nay là sinh nhật!";
    }

    return `🎉 Còn ${days} ngày nữa đến sinh nhật`;
  }, [person]);

  const deathAnniversaryCountdown = useMemo(() => {
    if (!person?.deathDate) {
      return null;
    }

    try {
      // deathDate có thể là:
      // 2024-02-04
      // hoặc 2024-02-04T00:00:00.000Z
      const normalizedDeathDate = String(person.deathDate).slice(0, 10);

      const [deathYear, deathMonth, deathDay] =
        normalizedDeathDate.split("-").map(Number);

      if (!deathYear || !deathMonth || !deathDay) {
        return null;
      }

      // Chuyển ngày mất dương lịch sang âm lịch
      const deathSolar = Solar.fromYmd(
        deathYear,
        deathMonth,
        deathDay
      );

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
          return Lunar.fromYmd(
            lunarYear,
            lunarMonth,
            lunarDay
          ).getSolar();
        } catch (error) {
          /*
           * Nếu ngày mất thuộc tháng nhuận nhưng năm cần tính
           * không có tháng nhuận đó, dùng tháng thường tương ứng.
           */
          return Lunar.fromYmd(
            lunarYear,
            Math.abs(lunarMonth),
            lunarDay
          ).getSolar();
        }
      };

      let anniversarySolar =
        createAnniversaryDate(currentLunarYear);

      let anniversaryDate = new Date(
        anniversarySolar.getYear(),
        anniversarySolar.getMonth() - 1,
        anniversarySolar.getDay()
      );

      anniversaryDate.setHours(0, 0, 0, 0);

      // Nếu ngày giỗ năm nay đã qua thì tính sang năm âm tiếp theo
      if (anniversaryDate < today) {
        anniversarySolar =
          createAnniversaryDate(currentLunarYear + 1);

        anniversaryDate = new Date(
          anniversarySolar.getYear(),
          anniversarySolar.getMonth() - 1,
          anniversarySolar.getDay()
        );

        anniversaryDate.setHours(0, 0, 0, 0);
      }

      const millisecondsPerDay =
        1000 * 60 * 60 * 24;

      const days = Math.round(
        (anniversaryDate.getTime() - today.getTime()) /
        millisecondsPerDay
      );

      const lunarMonthText = Math.abs(lunarMonth);
      const isLeapMonth = lunarMonth < 0;

      const lunarDateText =
        `${String(lunarDay).padStart(2, "0")}/` +
        `${String(lunarMonthText).padStart(2, "0")} ÂL` +
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
        message: `🕯️Còn ${days} ngày nữa đến ngày giỗ (${lunarDateText})`,
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

      const chiMap = {
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

      const ganZhi = lunar.getYearInGanZhi();

      return `${ganMap[ganZhi[0]]} ${chiMap[ganZhi[1]]}`;
    } catch {
      return "";
    }
  };

  const handleOpenAlbum = () => {
    if (!person.hasAlbum && !person.album) {
      return;
    }

    if (person.securityQuestion) {
      setVerifyAnswer("");
      setVerifyError("");
      setVerifyOpen(true);
      return;
    }

    if (person.album) {
      window.open(person.album, "_blank", "noopener,noreferrer");
    }
  };

  const handleVerifyAlbum = async (event) => {
    event.preventDefault();

    if (!verifyAnswer.trim()) {
      setVerifyError("Vui lòng nhập câu trả lời.");
      return;
    }

    try {
      setVerifying(true);
      setVerifyError("");

      const response = await api.post(
        `/people/${person.id}/verify-album`,
        {
          answer: verifyAnswer,
        }
      );

      setVerifyOpen(false);
      setVerifyAnswer("");

      window.open(
        response.data.album,
        "_blank",
        "noopener,noreferrer"
      );
    } catch (error) {
      setVerifyError(
        error.response?.data?.message ||
        "Không thể xác thực câu trả lời."
      );
    } finally {
      setVerifying(false);
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
            className="mt-6 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
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
          <div className="bg-gradient-to-r from-red-400 to-indigo-400 px-6 py-10 text-center text-white">
            <img
              src={
                person.avatar ||
                "https://placehold.co/300x300?text=Avatar"
              }
              alt={person.name}
              className="mx-auto h-36 w-36 rounded-full border-4 border-white object-cover shadow-lg sm:h-44 sm:w-44"
              onError={(event) => {
                event.currentTarget.src =
                  "https://placehold.co/300x300?text=Avatar";
              }}
            />

            <h1 className="mt-5 text-3xl font-bold sm:text-4xl">
              {person.name}
            </h1>

            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {age !== null && (
                <span className="rounded-full bg-white/20 px-4 py-2 text-sm font-semibold">
                  {age} tuổi
                </span>
              )}

              {person.class && (
                <span className="rounded-full bg-white/20 px-4 py-2 text-sm font-semibold">
                  {person.class}
                </span>
              )}
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {/* Người đã mất */}
            {person.deathDate && (
              <>
                <div className="mb-7 rounded-3xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-6 text-center shadow-sm">
                  <div className="text-5xl">🕯️🎗︎</div>

                  <h2 className="mt-4 text-2xl font-bold text-slate-800 sm:text-3xl">
                    Tưởng nhớ và tri ân
                  </h2>

                  <p className="mt-4 text-lg leading-relaxed text-slate-700">
                    Xin được tưởng nhớ và trân trọng những kỷ niệm đẹp về{" "}
                    <strong className="text-slate-800">
                      {person.name}
                    </strong>
                    . Những hình ảnh, khoảnh khắc và ký ức về{" "}
                    <strong className="text-slate-800">
                      {person.name}
                    </strong>{" "}
                    sẽ luôn được lưu giữ như một phần đáng quý trong lòng gia đình,
                    bạn bè và những người thân yêu.
                  </p>

                  <div className="mx-auto mt-6 h-px max-w-md bg-amber-200" />

                  <p className="mt-6 font-medium italic text-amber-700">
                    “Kỷ niệm vẫn còn mãi theo thời gian.”
                  </p>
                </div>

                {/* Đếm ngày sinh và ngày giỗ */}
                <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {birthdayCountdown && (
                    <div className="overflow-hidden rounded-3xl border border-pink-200 bg-gradient-to-br from-pink-50 via-white to-rose-50 p-5 text-center shadow-sm">

                      <p className="mt-1 font-semibold leading-6 text-slate-700">
                        {birthdayCountdown}
                      </p>
                    </div>
                  )}

                  {deathAnniversaryCountdown && (
                    <div className="overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-5 text-center shadow-sm">

                      <p className="mt-1 font-semibold leading-6 text-slate-700">
                        {deathAnniversaryCountdown.message}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Người còn sống và hôm nay là sinh nhật */}
            {!person.deathDate &&
              birthdayCountdown === "🎂 Hôm nay là sinh nhật!" && (
                <div className="mb-7 rounded-3xl border border-pink-200 bg-gradient-to-r from-pink-50 via-rose-50 to-yellow-50 p-6 text-center shadow-sm">
                  <div className="text-6xl">
                    🎂🎉
                  </div>

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

            {/* Người còn sống và chưa đến sinh nhật */}
            {!person.deathDate &&
              birthdayCountdown &&
              birthdayCountdown !== "🎂 Hôm nay là sinh nhật!" && (
                <div className="mb-7 rounded-2xl bg-amber-50 p-4 text-center font-semibold text-amber-700">
                  {birthdayCountdown}
                </div>
              )}

            {person.deathDate ? (
              <>
                {/* Ngày sinh và ngày mất */}
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
                    value={formatBirthday(person.deathDate)}
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
                    label="Đã mất"
                    value={timeSinceDeath || "Chưa cập nhật"}
                    icon="⏳"
                  />
                  <InfoItem
                    label="Giới tính"
                    value={person.gender || "Chưa cập nhật"}
                    icon="👤"
                  />

                  <InfoItem
                    label="Quê quán"
                    value={person.address || "Chưa cập nhật"}
                    icon="📍"
                  />
                </div>
              </>
            ) : (
              /* Người còn sống: hiển thị 4 thẻ bình thường */
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <InfoItem
                  label="Ngày sinh"
                  value={
                    person.birthday
                      ? `${formatBirthday(person.birthday)} (${getCanChi(person.birthday)})`
                      : "Chưa cập nhật"
                  }
                  icon="🎁"
                />

                <InfoItem
                  label="Đã sống"
                  value={
                    daysLived
                      ? `${daysLived.toLocaleString("vi-VN")} ngày`
                      : "Chưa cập nhật"
                  }
                  icon="🌎"
                />

                <InfoItem
                  label="Giới tính"
                  value={person.gender || "Chưa cập nhật"}
                  icon="👤"
                />

                <InfoItem
                  label="Quê quán"
                  value={person.address || "Chưa cập nhật"}
                  icon="📍"
                />
              </div>
            )}

            <div className="mt-8 border-t border-slate-200 pt-4 items-center">

              {person.hasAlbum || person.album ? (
                <button
                  type="button"
                  onClick={handleOpenAlbum}
                  className="mt-5 flex w-full items-center justify-center rounded-xl bg-blue-500 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
                >
                  🖼️ Xem album ảnh
                </button>
              ) : (
                <div className="mt-5 flex w-full items-center justify-center rounded-xl bg-gray-300 px-5 py-3 font-bold text-red-500 transition hover:bg-blue-700">
                  Người này chưa có liên kết album
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mt-5 flex w-full items-center justify-center rounded-xl bg-blue-500 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              ← Quay lại
            </button>

          </div>
        </div>
      </div>

      {verifyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">

            <h2 className="text-2xl font-bold">
              Xác thực để xem album
            </h2>

            <p className="mt-3 text-gray-600">
              {person.securityQuestion}
            </p>

            <form
              onSubmit={handleVerifyAlbum}
              className="mt-6"
            >
              <input
                type="text"
                value={verifyAnswer}
                onChange={(e) => setVerifyAnswer(e.target.value)}
                placeholder="Nhập câu trả lời..."
                className="w-full rounded-xl border p-3"
              />

              {verifyError && (
                <p className="mt-3 text-red-500">
                  {verifyError}
                </p>
              )}

              <div className="mt-6 flex gap-3">

                <button
                  type="button"
                  onClick={() => setVerifyOpen(false)}
                  className="flex-1 rounded-xl bg-gray-300 py-3"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-blue-600 py-3 text-white"
                >
                  Xác nhận
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
      className={`rounded-2xl border border-slate-200 bg-slate-50 p-5 ${fullWidth ? "md:col-span-2" : ""
        }`}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-1 break-words font-semibold text-slate-800">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Detail;