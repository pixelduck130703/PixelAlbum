import { useEffect, useState } from "react";
import api from "../services/api";

function FootballScores() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMatches = async () => {
    try {
      setError("");

      const response = await api.get("/football/live", {
        timeout: 90000,
      });

      setMatches(response.data.matches || []);
    } catch (requestError) {
      console.error(
        "Lỗi tải kết quả bóng đá:",
        requestError
      );

      setError("Không thể tải kết quả bóng đá.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();

    // Tự cập nhật mỗi 60 giây
    const timer = setInterval(loadMatches, 60000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="mt-10 overflow-hidden rounded-3xl bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-7">
        <div>
          <h2 className="text-xl font-bold text-slate-800 sm:text-2xl">
            ⚽ Kết quả bóng đá trực tiếp
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Tỷ số được cập nhật tự động.
          </p>
        </div>

        <button
          type="button"
          onClick={loadMatches}
          disabled={loading}
          className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
        >
          Làm mới
        </button>
      </div>

      <div className="p-4 sm:p-6">
        {loading && (
          <div className="py-10 text-center">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-green-600" />

            <p className="mt-3 text-slate-500">
              Đang tải trận đấu...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl bg-red-50 p-5 text-center text-red-600">
            {error}
          </div>
        )}

        {!loading && !error && matches.length === 0 && (
          <div className="rounded-2xl bg-slate-50 p-8 text-center">
            <div className="text-4xl">⚽</div>

            <p className="mt-3 font-semibold text-slate-700">
              Hiện không có trận đấu đang diễn ra.
            </p>
          </div>
        )}

        {!loading && !error && matches.length > 0 && (
          <div className="space-y-4">
            {matches.map((match) => (
              <MatchCard
                key={match.fixture.id}
                match={match}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function MatchCard({ match }) {
  const home = match.teams.home;
  const away = match.teams.away;

  return (
    <div className="rounded-2xl border border-slate-200 p-4 transition hover:border-green-300 hover:shadow-md">
      <div className="mb-4 flex items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex min-w-0 items-center gap-2">
          {match.league.logo && (
            <img
              src={match.league.logo}
              alt={match.league.name}
              className="h-5 w-5 object-contain"
            />
          )}

          <span className="truncate font-medium">
            {match.league.name}
          </span>
        </div>

        <span className="shrink-0 rounded-full bg-red-50 px-3 py-1 font-semibold text-red-600">
          {getMatchStatus(match)}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <Team
          team={home}
          align="right"
        />

        <div className="min-w-[72px] text-center">
          <p className="text-2xl font-black text-slate-800">
            {match.goals.home ?? 0}
            <span className="px-2 text-slate-400">-</span>
            {match.goals.away ?? 0}
          </p>
        </div>

        <Team
          team={away}
          align="left"
        />
      </div>
    </div>
  );
}

function Team({ team, align }) {
  return (
    <div
      className={`flex min-w-0 items-center gap-2 ${
        align === "right"
          ? "flex-row-reverse text-right"
          : "text-left"
      }`}
    >
      <img
        src={team.logo}
        alt={team.name}
        className="h-9 w-9 shrink-0 object-contain sm:h-11 sm:w-11"
      />

      <p className="line-clamp-2 text-sm font-bold text-slate-800 sm:text-base">
        {team.name}
      </p>
    </div>
  );
}

function getMatchStatus(match) {
  const shortStatus = match.fixture.status.short;
  const elapsed = match.fixture.status.elapsed;

  if (
    ["1H", "2H", "ET", "P", "BT"].includes(shortStatus)
  ) {
    return elapsed ? `${elapsed}' • Trực tiếp` : "Trực tiếp";
  }

  if (shortStatus === "HT") {
    return "Hết hiệp 1";
  }

  if (shortStatus === "FT") {
    return "Kết thúc";
  }

  return match.fixture.status.long || "Đang cập nhật";
}

export default FootballScores;