function FIFAWC() {
  return (
    <section className="mt-10 overflow-hidden rounded-3xl bg-white shadow-xl">
      {/* Header */}
      <div
        className="relative overflow-hidden rounded-3xl bg-cover bg-center p-6 text-white"
        style={{
          backgroundImage: "url('/images/wc-bg.jpg')",
        }}
      >
        {/* Lớp phủ để chữ dễ đọc */}
        <div className="absolute inset-0 bg-black/30"></div>

        <div className="relative z-10 flex items-center gap-4">
          <img
            src="/images/WC2026.webp"
            alt="FIFA World Cup 2026"
            className="h-25 w-20 rounded-xl bg-white p-2 object-contain"
          />

          <div>
            <h2 className="text-2xl font-bold drop-shadow-lg">
              FIFA World Cup 2026
            </h2>

            <p className="mt-1 text-white/90 drop-shadow">
              United States • Canada • Mexico
            </p>
          </div>
        </div>
      </div>

      {/* Match */}
      <div className="p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Bán kết 1 */}
          <div className="group overflow-hidden rounded-3xl border border-red-100 bg-gradient-to-br from-white via-red-50/40 to-yellow-50/60 shadow-md transition duration-300 hover:-translate-y-1 hover:border-red-300 hover:shadow-xl">
            <div className="flex items-center justify-between border-b border-red-100 bg-white/70 px-4 py-4 backdrop-blur-sm sm:px-5">
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
                <div className="flex flex-col items-center text-center">
                  <img
                    src="https://flagcdn.com/w160/fr.png"
                    alt="France"
                    className="h-16 w-16 object-contain transition-transform duration-300 group-hover:scale-110 sm:h-20 sm:w-20"
                  />

                </div>

                {/* Tỷ số */}
                <div className="text-center">
                  <div className="rounded-2xl bg-slate-900 px-5 py-3 shadow-lg">
                    <p className="text-2xl font-black text-white sm:text-4xl">
                      0 - 2
                    </p>
                  </div>

                </div>

                {/* Tây Ban Nha */}
                <div className="flex flex-col items-center text-center">
                  <img
                    src="https://flagcdn.com/w160/es.png"
                    alt="Spain"
                    className="h-16 w-16 object-contain transition-transform duration-300 group-hover:scale-110 sm:h-20 sm:w-20"
                  />

                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-700">
                    🏟️ Dallas Stadium
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bán kết 2 */}
          <div className="group overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-blue-50/40 to-cyan-50/60 shadow-md transition duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl">
            <div className="flex items-center justify-between border-b border-blue-100 bg-white/70 px-4 py-4 backdrop-blur-sm sm:px-5">
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
                <div className="flex flex-col items-center text-center">
                  <img
                    src="https://flagcdn.com/w160/gb-eng.png"
                    alt="England"
                    className="h-16 w-16 object-contain transition-transform duration-300 group-hover:scale-110 sm:h-20 sm:w-20"
                  />

                </div>

                {/* VS */}
                <div className="rounded-2xl bg-slate-900 px-5 py-3 shadow-lg">
                  <p className="text-2xl font-black text-white sm:text-4xl">
                    1 - 2
                  </p>
                </div>

                {/* Argentina */}
                <div className="flex flex-col items-center text-center">
                  <img
                    src="https://flagcdn.com/w160/ar.png"
                    alt="Argentina"
                    className="h-16 w-16 object-contain transition-transform duration-300 group-hover:scale-110 sm:h-20 sm:w-20"
                  />
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-white/80 p-4 text-center shadow-sm">
                <p className="text-sm font-bold text-slate-700">
                  🏟️ Atlanta Stadium
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FIFAWC;