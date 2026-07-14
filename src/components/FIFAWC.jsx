function FIFAWC() {
  return (
    <section className="mt-10 overflow-hidden rounded-3xl bg-white shadow-xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 via-red-500 to-yellow-500 p-6 text-white">
        <div className="flex items-center gap-4">
          <img
            src="/images/WC2026.webp"
            alt="FIFA World Cup 2026"
            className="h-20 w-20 rounded-xl bg-white p-2 object-contain"
          />

          <div>
            <h2 className="text-2xl font-bold">
              FIFA World Cup 2026
            </h2>
          </div>
        </div>
      </div>

      {/* Match */}
      <div className="p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
  {/* Trận 1 */}
  <div className="group overflow-hidden rounded-3xl border border-red-100 bg-gradient-to-br from-white via-red-50/40 to-yellow-50/60 shadow-md transition duration-300 hover:-translate-y-1 hover:border-red-300 hover:shadow-xl">
    <div className="flex items-center justify-between border-b border-red-100 bg-white/70 px-5 py-4 backdrop-blur-sm">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-500">
          FIFA World Cup 2026
        </p>

        <h3 className="mt-1 text-lg font-bold text-slate-800">
          Bán kết 1
        </h3>
      </div>

      <span className="rounded-full bg-red-100 px-3 py-1.5 text-xs font-bold text-red-600">
        02:00 • 15/07/2026
      </span>
    </div>

    <div className="p-5 sm:p-6">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-5">
        {/* Pháp */}
        <div className="flex min-w-0 flex-col items-center text-center">
          <div className="rounded-full bg-white p-2 shadow-lg ring-4 ring-blue-100 transition group-hover:scale-105">
            <img
              src="https://flagcdn.com/w160/fr.png"
              alt="France"
              className="h-16 w-16 rounded-full object-cover sm:h-20 sm:w-20"
            />
          </div>

          <p className="mt-3 text-base font-bold text-slate-800 sm:text-lg">
            Pháp
          </p>
        </div>

        {/* VS */}
        <div className="text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 text-xl font-black text-white shadow-lg sm:h-20 sm:w-20 sm:text-2xl">
            VS
          </div>

          <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Bán kết
          </p>
        </div>

        {/* Tây Ban Nha */}
        <div className="flex min-w-0 flex-col items-center text-center">
          <div className="rounded-full bg-white p-2 shadow-lg ring-4 ring-yellow-100 transition group-hover:scale-105">
            <img
              src="https://flagcdn.com/w160/es.png"
              alt="Spain"
              className="h-16 w-16 rounded-full object-cover sm:h-20 sm:w-20"
            />
          </div>

          <p className="mt-3 text-base font-bold text-slate-800 sm:text-lg">
            Tây Ban Nha
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/80 p-4 text-center shadow-sm">
        <span className="text-xl">🏟️</span>

        <div>
          <p className="text-sm font-bold text-slate-700">
            Dallas Stadium
          </p>

          <p className="mt-0.5 text-xs text-slate-500">
            FIFA World Cup 2026
          </p>
        </div>
      </div>
    </div>
  </div>

  {/* Trận 2 */}
  <div className="group overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-blue-50/40 to-cyan-50/60 shadow-md transition duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl">
    <div className="flex items-center justify-between border-b border-blue-100 bg-white/70 px-5 py-4 backdrop-blur-sm">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-500">
          FIFA World Cup 2026
        </p>

        <h3 className="mt-1 text-lg font-bold text-slate-800">
          Bán kết 2
        </h3>
      </div>

      <span className="rounded-full bg-blue-100 px-3 py-1.5 text-xs font-bold text-blue-600">
        02:00 • 16/07/2026
      </span>
    </div>

    <div className="p-5 sm:p-6">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-5">
        {/* Anh */}
        <div className="flex min-w-0 flex-col items-center text-center">
          <div className="rounded-full bg-white p-2 shadow-lg ring-4 ring-red-100 transition group-hover:scale-105">
            <img
              src="https://flagcdn.com/w160/gb-eng.png"
              alt="England"
              className="h-16 w-16 rounded-full object-cover sm:h-20 sm:w-20"
            />
          </div>

          <p className="mt-3 text-base font-bold text-slate-800 sm:text-lg">
            Anh
          </p>
        </div>

        {/* VS */}
        <div className="text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 text-xl font-black text-white shadow-lg sm:h-20 sm:w-20 sm:text-2xl">
            VS
          </div>

          <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Bán kết
          </p>
        </div>

        {/* Argentina */}
        <div className="flex min-w-0 flex-col items-center text-center">
          <div className="rounded-full bg-white p-2 shadow-lg ring-4 ring-sky-100 transition group-hover:scale-105">
            <img
              src="https://flagcdn.com/w160/ar.png"
              alt="Argentina"
              className="h-16 w-16 rounded-full object-cover sm:h-20 sm:w-20"
            />
          </div>

          <p className="mt-3 text-base font-bold text-slate-800 sm:text-lg">
            Argentina
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/80 p-4 text-center shadow-sm">
        <span className="text-xl">🏟️</span>

        <div>
          <p className="text-sm font-bold text-slate-700">
            Atlanta Stadium
          </p>

          <p className="mt-0.5 text-xs text-slate-500">
            FIFA World Cup 2026
          </p>
        </div>
      </div>
    </div>
  </div>
</div>
      </div>
    </section>
  );
}

export default FIFAWC;