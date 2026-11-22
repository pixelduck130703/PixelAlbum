import { useEffect, useRef, useState } from 'react';
import {
  describeWeather,
  getVisitorLocation,
  getWeather,
  searchCities,
} from '../services/weather';
import { resolveVisitorCityName } from '../services/visitorLocation';

const value = (number, unit) =>
  Number.isFinite(number)
    ? `${Math.round(number)}${unit}`
    : '—';

const ANIMATION_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@600;700;800&display=swap');

  .wc-number-font {
    font-family: 'Outfit', system-ui, -apple-system, sans-serif;
    font-variant-numeric: tabular-nums;
  }

  @keyframes weather-rain {
    0% {
      transform: translateY(-100%) rotate(15deg);
      opacity: 0;
    }
    20% {
      opacity: 0.75;
    }
    100% {
      transform: translateY(320%) rotate(15deg);
      opacity: 0;
    }
  }

  @keyframes weather-lightning {
    0%, 92%, 96%, 100% {
      opacity: 0;
    }
    93%, 97% {
      opacity: 0.4;
    }
  }

  @keyframes weather-sun-glow {
    0%, 100% {
      transform: scale(1);
      opacity: 0.55;
    }
    50% {
      transform: scale(1.18);
      opacity: 0.85;
    }
  }

  @keyframes weather-twinkle {
    0%, 100% {
      opacity: 0.2;
      transform: scale(0.85);
    }
    50% {
      opacity: 0.95;
      transform: scale(1.15);
    }
  }

  .wc-rain {
    animation: weather-rain linear infinite;
  }

  .wc-lightning {
    animation: weather-lightning 6s infinite;
  }

  .wc-sun-glow {
    animation: weather-sun-glow 5s ease-in-out infinite;
  }

  .wc-twinkle {
    animation: weather-twinkle 3s ease-in-out infinite;
  }
`;

function getWeatherVisual(code, isDay) {
  const isStorm = code >= 95 && code <= 99;
  const isRain =
    (code >= 51 && code <= 67) || (code >= 80 && code <= 86);
  const isClear = code === 0 || code === 1;

  if (isDay === 0) {
    return {
      type: isStorm ? 'storm' : isRain ? 'rain' : 'night',
      bg: 'bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white',
      cardBg: 'bg-white/10 border-white/15 text-white',
      accentText: 'text-indigo-200',
      border: 'border-white/15',
    };
  }

  if (isClear) {
    return {
      type: 'sunny',
      bg: 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-100 text-slate-800',
      cardBg: 'bg-white/75 border-amber-200/60 text-slate-800 shadow-xs',
      accentText: 'text-amber-700',
      border: 'border-amber-200',
    };
  }

  if (isStorm || isRain) {
    return {
      type: isStorm ? 'storm' : 'rain',
      bg: isStorm
        ? 'bg-gradient-to-br from-slate-200 via-blue-100 to-indigo-200 text-slate-800'
        : 'bg-gradient-to-br from-blue-50 via-sky-100 to-indigo-100 text-slate-800',
      cardBg: 'bg-white/75 border-blue-200/70 text-slate-800 shadow-xs',
      accentText: 'text-blue-700',
      border: 'border-blue-200',
    };
  }

  return {
    type: 'cloudy',
    bg: 'bg-gradient-to-br from-sky-50 via-blue-50 to-slate-100 text-slate-800',
    cardBg: 'bg-white/75 border-sky-200/60 text-slate-800 shadow-xs',
    accentText: 'text-sky-700',
    border: 'border-sky-200',
  };
}

function WeatherEffects({ type }) {
  if (type === 'sunny') {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="wc-sun-glow absolute -right-10 -top-10 h-36 w-36 rounded-full bg-gradient-to-br from-amber-300/45 via-yellow-200/30 to-transparent blur-xl" />
        <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-amber-300/25 blur-md" />
      </div>
    );
  }

  if (type === 'rain' || type === 'storm') {
    const drops = [
      { left: '8%', delay: '0s', duration: '0.85s' },
      { left: '20%', delay: '0.35s', duration: '0.75s' },
      { left: '34%', delay: '0.15s', duration: '0.95s' },
      { left: '48%', delay: '0.5s', duration: '0.8s' },
      { left: '62%', delay: '0.2s', duration: '0.9s' },
      { left: '76%', delay: '0.45s', duration: '0.78s' },
      { left: '90%', delay: '0.1s', duration: '0.88s' },
    ];

    return (
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        {type === 'storm' && (
          <div className="wc-lightning absolute inset-0 bg-white" />
        )}

        {drops.map((drop, i) => (
          <span
            key={i}
            style={{
              left: drop.left,
              animationDelay: drop.delay,
              animationDuration: drop.duration,
            }}
            className="wc-rain absolute top-0 h-5 w-[1.5px] rounded-full bg-gradient-to-b from-transparent to-blue-500/60"
          />
        ))}
      </div>
    );
  }

  if (type === 'night') {
    const stars = [
      { top: '18%', left: '15%', delay: '0s' },
      { top: '28%', left: '42%', delay: '0.8s' },
      { top: '15%', left: '72%', delay: '1.5s' },
      { top: '45%', left: '85%', delay: '0.4s' },
      { top: '38%', left: '28%', delay: '1.2s' },
    ];

    return (
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-indigo-400/15 blur-2xl" />
        {stars.map((star, i) => (
          <span
            key={i}
            style={{
              top: star.top,
              left: star.left,
              animationDelay: star.delay,
            }}
            className="wc-twinkle absolute h-1 w-1 rounded-full bg-white"
          />
        ))}
      </div>
    );
  }

  return null;
}

export default function WeatherCard({ locationChoice, onReviewLocation }) {
  const [request, setRequest] = useState({
    location: null,
    version: 0,
  });

  const [state, setState] = useState({
    loading: true,
    error: '',
    data: null,
    label: '',
  });

  const [query, setQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const [search, setSearch] = useState({
    loading: false,
    results: [],
    error: '',
  });

  const searchController = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function load() {
      try {
        const location = request.location || (locationChoice === 'both' || locationChoice === 'weather'
          ? await getVisitorLocation() : null);
        if (!location) throw new Error('Bạn có thể chọn quyền vị trí hoặc tìm thành phố.');

        if (!active) return;

        const [data, resolvedLabel] = await Promise.all([
          getWeather(location, controller.signal),
          resolveVisitorCityName(location),
        ]);

        if (active) {
          setState({
            loading: false,
            error: '',
            data,
            label: resolvedLabel,
          });
        }
      } catch (error) {
        if (active) {
          setState({
            loading: false,
            error: error.message,
            data: null,
            label: '',
          });
        }
      }
    }

    load();

    return () => {
      active = false;
      controller.abort();
    };
  }, [request, locationChoice]);

  useEffect(() => {
    return () => searchController.current?.abort();
  }, []);

  function selectLocation(location = null) {
    if (!location) {
      if (locationChoice !== 'both' && locationChoice !== 'weather') { onReviewLocation?.(); return; }
      void getVisitorLocation({ allowPrompt: true }).catch(() => {});
    }
    setSearch({ loading: false, results: [], error: '' });
    setQuery('');
    setShowSearch(false);

    setState({
      loading: true,
      error: '',
      data: null,
      label: '',
    });

    setRequest(previous => ({
      location,
      version: previous.version + 1,
    }));
  }

  async function findCities(event) {
    event.preventDefault();
    if (!query.trim()) return;

    searchController.current?.abort();

    const controller = new AbortController();
    searchController.current = controller;

    setSearch({
      loading: true,
      results: [],
      error: '',
    });

    try {
      const results = await searchCities(
        query,
        controller.signal
      );

      if (!controller.signal.aborted) {
        setSearch({
          loading: false,
          results,
          error: results.length
            ? ''
            : 'Không tìm thấy. Thử Hanoi hoặc Da Nang.',
        });
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        setSearch({
          loading: false,
          results: [],
          error: error.message,
        });
      }
    }
  }

  const current = state.data?.current;

  const condition = describeWeather(
    current?.weather_code,
    current?.is_day
  );

  const visual = getWeatherVisual(
    current?.weather_code,
    current?.is_day
  );

  return (
    <section
      aria-label="Thời tiết địa phương"
      className={`relative mb-3 w-full overflow-hidden rounded-2xl border p-3.5 shadow-sm transition-all duration-500 sm:p-4 ${visual.bg} ${visual.border}`}
    >
      <style>{ANIMATION_STYLES}</style>

      {/* Hiệu ứng động theo thời tiết */}
      {current && <WeatherEffects type={visual.type} />}

      {/* Header: Tên thành phố thật của người truy cập */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border text-xs backdrop-blur-xs ${visual.cardBg}`}
          >
            📍
          </span>
          <h2
            className="truncate text-sm font-bold leading-snug"
            title={state.label}
          >
            {state.loading && !state.label
              ? 'Đang xác định'
              : state.label}
          </h2>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowSearch(prev => !prev)}
            title="Tìm thành phố"
            aria-label="Tìm thành phố"
            className={`flex h-7 w-7 items-center justify-center rounded-xl border text-xs backdrop-blur-xs transition hover:scale-105 active:scale-95 ${visual.cardBg}`}
          >
            🔍
          </button>

          <button
            type="button"
            disabled={state.loading}
            onClick={() => selectLocation()}
            title="Lấy lại vị trí"
            aria-label="Lấy lại vị trí và thời tiết"
            className={`flex h-7 w-7 items-center justify-center rounded-xl border text-sm backdrop-blur-xs transition hover:scale-105 active:scale-95 disabled:opacity-40 ${visual.cardBg}`}
          >
            <span className={state.loading ? 'animate-spin' : ''}>
              ↻
            </span>
          </button>
        </div>
      </div>

      {/* Thanh tìm kiếm */}
      {showSearch && (
        <div className="relative z-10 mt-2.5">
          <form onSubmit={findCities} className="flex gap-1.5">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Nhập tên thành phố..."
              autoFocus
              className={`h-8 min-w-0 flex-1 rounded-xl border px-2.5 text-xs backdrop-blur-xs focus:outline-none ${visual.cardBg}`}
            />
            <button
              type="submit"
              disabled={search.loading}
              className={`shrink-0 rounded-xl border px-3 text-xs font-medium backdrop-blur-xs transition hover:opacity-80 disabled:opacity-50 ${visual.cardBg}`}
            >
              {search.loading ? '...' : 'Tìm'}
            </button>
          </form>

          {(search.results.length > 0 || search.error) && (
            <div
              className={`mt-1.5 rounded-xl border p-1.5 backdrop-blur-md ${visual.cardBg}`}
            >
              {search.error ? (
                <p className="px-1.5 py-0.5 text-[11px] opacity-90">
                  {search.error}
                </p>
              ) : (
                <ul className="flex flex-wrap gap-1">
                  {search.results.map((city, idx) => (
                    <li key={city.id || idx}>
                      <button
                        type="button"
                        onClick={() => selectLocation(city)}
                        className={`rounded-lg border px-2 py-1 text-[11px] font-medium transition hover:opacity-80 ${visual.cardBg}`}
                      >
                        {city.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {/* Nội dung thời tiết */}
      <div
        role="status"
        aria-live="polite"
        className="relative z-10 mt-2.5"
      >
        {state.loading && !current && (
          <p className="py-2.5 text-xs opacity-80">
            Đang lấy thời tiết…
          </p>
        )}

        {state.error && (
          <p className="rounded-xl border border-amber-300 bg-amber-500/20 p-2.5 text-xs">
            {state.error}
          </p>
        )}

        {current && (
          <div className="flex items-stretch gap-2">
            {/* Khối trái: Icon trạng thái thời tiết lớn */}
            <div
              title={condition.text}
              className={`flex w-16 shrink-0 items-center justify-center rounded-xl border py-2.5 backdrop-blur-xs sm:w-20 sm:py-3 ${visual.cardBg}`}
            >
              <span
                aria-hidden="true"
                className="text-3xl leading-none sm:text-4xl"
              >
                {condition.icon}
              </span>
            </div>

            {/* Khối phải: 3 ô chỉ số ngang hàng */}
            <dl className="grid min-w-0 flex-1 grid-cols-3 gap-1.5 sm:gap-2">
              {[
                {
                  label: 'Nhiệt độ',
                  num: value(current.temperature_2m, '°C'),
                },
                {
                  label: 'Độ ẩm',
                  num: value(current.relative_humidity_2m, '%'),
                },
                {
                  label: 'Gió',
                  num: value(current.wind_speed_10m, ''),
                  unit: 'km/h',
                },
              ].map(item => (
                <div
                  key={item.label}
                  className={`flex min-w-0 items-center justify-center rounded-xl border px-1.5 py-2.5 text-center backdrop-blur-xs sm:gap-2 sm:px-3 sm:py-3.5 ${visual.cardBg}`}
                >
                  {/* Desktop: Nhãn chữ vừa phải đứng cùng hàng bên trái con số */}
                  <dt
                    className={`hidden shrink-0 text-xs font-semibold opacity-80 sm:inline ${visual.accentText}`}
                  >
                    {item.label}:
                  </dt>

                  {/* Chỉ số dùng font Outfit bo tròn hiện đại, to và sắc nét */}
                  <dd className="wc-number-font flex items-baseline justify-center gap-0.5 whitespace-nowrap font-bold leading-none tracking-tight">
                    <span className="text-xl sm:text-2xl md:text-3xl">
                      {item.num}
                    </span>
                    {item.unit && (
                      <span className="text-[11px] font-semibold opacity-75 sm:text-xs">
                        {item.unit}
                      </span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </section>
  );
}
