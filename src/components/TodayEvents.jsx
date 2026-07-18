function TodayEvents({
  todayBirthdayPeople = [],
  todayDeathPeople = [],
  todayHolidays = [],
  formatDate = (date) => date || "",
}) {
  const safeBirthdayPeople = Array.isArray(todayBirthdayPeople)
    ? todayBirthdayPeople
    : [];

  const safeDeathPeople = Array.isArray(todayDeathPeople)
    ? todayDeathPeople
    : [];

  const safeHolidays = Array.isArray(todayHolidays)
    ? todayHolidays
    : [];

  return (
    <>
      {/* Ngày lễ Việt Nam */}
      {safeHolidays.length > 0 && (
        <div className="mb-8 overflow-hidden rounded-3xl border border-red-200 bg-gradient-to-br from-red-50 via-white to-yellow-50 p-6 shadow-lg sm:p-8">
          <div className="text-center">
            <h2 className="mt-2 text-2xl font-bold text-red-600 sm:text-3xl">
               Sự kiện hôm nay
            </h2>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-4">
            {safeHolidays.map((holiday, index) => (
              <div
                key={`${holiday.type}-${holiday.month}-${holiday.day}-${index}`}
                className="relative overflow-hidden rounded-3xl border border-red-200 bg-gradient-to-r from-red-50 via-white to-yellow-50 p-5 shadow-md ring-2 ring-red-100 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-red-300 sm:p-6"
              >
                <div className="relative z-10 flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white text-4xl shadow-md ring-4 ring-red-100 sm:h-20 sm:w-20 sm:text-5xl">
                    {holiday.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          holiday.type === "lunar"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {holiday.type === "lunar"
                          ? "Âm lịch"
                          : "Dương lịch"}
                      </span>

                      <span className="text-sm font-semibold text-slate-500">
                        {holiday.dateText}
                      </span>
                    </div>

                    <h3 className="mt-2 break-words text-lg font-bold leading-tight text-slate-800 sm:text-2xl">
                      {holiday.title}
                    </h3>

                  </div>

                  <div className="hidden shrink-0 text-6xl sm:block">
                    🎉
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sinh nhật hôm nay */}
      {safeBirthdayPeople.length > 0 && (
        <div className="mb-8 overflow-hidden rounded-3xl border border-pink-200 bg-gradient-to-br from-pink-50 via-white to-yellow-50 p-6 shadow-lg sm:p-8">
          <div className="text-center">
            <h2 className="mt-1 text-2xl font-bold text-pink-600">
              🎂 Chúc mừng sinh nhật! 🎉
            </h2>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-4">
            {safeBirthdayPeople.map((person) => (
              <div
                key={person.id}
                className="relative overflow-hidden rounded-3xl border border-pink-200 bg-gradient-to-r from-pink-50 via-white to-yellow-50 p-4 shadow-xl ring-2 ring-pink-100 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-pink-300 sm:p-5"
              >
                <div className="relative z-10 flex items-center gap-4">
                  <div className="relative shrink-0">
                    <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-pink-400 via-yellow-300 to-purple-400 opacity-70 blur-sm" />

                    <img
                      src={
                        person.avatar ||
                        "https://placehold.co/100x100?text=Avatar"
                      }
                      alt={person.name || "Avatar"}
                      className="relative h-16 w-16 rounded-full border-4 border-white object-cover shadow-lg sm:h-20 sm:w-20"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src =
                          "https://placehold.co/100x100?text=Avatar";
                      }}
                    />

                    <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg shadow">
                      🎂
                    </span>
                  </div>

                  <div className="min-w-0 flex-1 px-1 text-center sm:px-0 sm:text-left">
                    <p className="text-xs font-semibold uppercase tracking-wider text-pink-500">
                      Happy Birthday
                    </p>

                    <h3 className="mt-1 break-words text-lg font-bold leading-tight text-slate-800 sm:text-2xl">
                      {person.name}
                    </h3>
                  </div>

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

      {/* Ngày giỗ hôm nay */}
      {safeDeathPeople.length > 0 && (
        <div className="mb-8 overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-6 shadow-lg sm:p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-amber-700">
              🕯️ Hôm nay là ngày giỗ
            </h2>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-4">
            {safeDeathPeople.map((person) => (
              <div
                key={person.id}
                className="relative overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-orange-50 p-4 shadow-xl ring-2 ring-amber-100 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-amber-300 sm:p-5"
              >
                <div className="relative z-10 flex items-center gap-4 px-0 py-2 sm:px-10">
                  <div className="relative shrink-0">
                    <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 opacity-70 blur-sm" />

                    <img
                      src={
                        person.avatar ||
                        "https://placehold.co/100x100?text=Avatar"
                      }
                      alt={person.name || "Avatar"}
                      className="relative h-16 w-16 rounded-full border-4 border-white object-cover shadow-lg sm:h-20 sm:w-20"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
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

                    <h3 className="mt-1 break-words text-xl font-bold text-slate-800 sm:text-2xl">
                      {person.name}
                    </h3>

                    <p className="mt-2 break-words text-sm text-slate-500">
                      Ngày mất: {formatDate(person.deathDate)} (DL)
                      {person.deathLunarDate
                        ? ` - ${person.deathLunarDate} (ÂL)`
                        : ""}
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
    </>
  );
}

export default TodayEvents;