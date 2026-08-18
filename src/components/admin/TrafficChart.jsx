import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function TrafficChart({
  visitChart = [],
  albumViewChart = [],
  days = 7,
  setDays,
  loading = false,
}) {
  const mergedData = (() => {
    const dataMap = new Map();

    visitChart.forEach((item) => {
      if (!item?.date) return;

      dataMap.set(item.date, {
        date: item.date,
        displayDate:
          item.displayDate || formatDisplayDate(item.date),
        visits: Number(item.visits) || 0,
        views: 0,
      });
    });

    albumViewChart.forEach((item) => {
      if (!item?.date) return;

      const currentItem = dataMap.get(item.date);

      if (currentItem) {
        currentItem.views = Number(item.views) || 0;
      } else {
        dataMap.set(item.date, {
          date: item.date,
          displayDate:
            item.displayDate || formatDisplayDate(item.date),
          visits: 0,
          views: Number(item.views) || 0,
        });
      }
    });

    return Array.from(dataMap.values()).sort((a, b) =>
      String(a.date).localeCompare(String(b.date))
    );
  })();

  const xAxisInterval =
    days <= 7 ? 0 : days <= 14 ? 1 : days <= 30 ? 4 : 9;

  return (
    <div className="mt-6 overflow-hidden rounded-3xl bg-white p-3 shadow-sm sm:p-4 md:p-6">
      {/* =====================================================
          HEADER
      ===================================================== */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-slate-800 sm:text-lg md:text-xl">
            Thống kê lượt truy cập
          </h2>
        </div>

        <select
          value={days}
          onChange={(event) =>
            setDays(Number(event.target.value))
          }
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:w-auto"
        >
          <option value={7}>7 ngày gần nhất</option>
          <option value={14}>14 ngày gần nhất</option>
          <option value={30}>30 ngày gần nhất</option>
          <option value={90}>90 ngày gần nhất</option>
        </select>
      </div>

      {/* =====================================================
          LOADING
      ===================================================== */}
      {loading ? (
        <div className="flex h-[280px] items-center justify-center text-sm text-slate-500 sm:h-[320px]">
          Đang tải biểu đồ...
        </div>
      ) : mergedData.length === 0 ? (
        /* =====================================================
            NO DATA
        ===================================================== */
        <div className="flex h-[280px] items-center justify-center text-sm text-slate-500 sm:h-[320px]">
          Chưa có dữ liệu thống kê
        </div>
      ) : (
        /* =====================================================
            CHART
        ===================================================== */
        <div className="h-[300px] w-full sm:h-[340px] md:h-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={mergedData}
              margin={{
                top: 20,
                right: 8,
                left: 0,
                bottom: 10,
              }}
            >
              {/* =================================================
                  GRID
              ================================================= */}
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
              />

              {/* =================================================
                  X AXIS
              ================================================= */}
              <XAxis
                dataKey="displayDate"
                interval={xAxisInterval}
                tick={{ fontSize: 10 }}
                tickMargin={8}
                minTickGap={12}
                padding={{
                  left: 8,
                  right: 8,
                }}
              />

              {/* =================================================
                  Y AXIS
              ================================================= */}
              <YAxis
                allowDecimals={false}
                width={34}
                tick={{ fontSize: 10 }}
              />

              {/* =================================================
                  TOOLTIP
              ================================================= */}
              <Tooltip
                labelFormatter={(_, payload) => {
                  const item = payload?.[0]?.payload;

                  return item?.date
                    ? formatFullDate(item.date)
                    : "";
                }}
                formatter={(value, name) => [
                  Number(value).toLocaleString("vi-VN"),
                  name,
                ]}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  fontSize: "12px",
                  maxWidth: "220px",
                }}
              />

              {/* =================================================
                  LEGEND
              ================================================= */}
              <Legend
                verticalAlign="top"
                align="center"
                height={48}
                iconSize={10}
                wrapperStyle={{
                  fontSize: "11px",
                  lineHeight: "20px",
                  paddingBottom: "8px",
                }}
              />

              {/* =================================================
                  LƯỢT TRUY CẬP
                  ĐƯỜNG + SỐ = MÀU ĐỎ
              ================================================= */}
              <Line
                type="monotone"
                dataKey="visits"
                name="Lượt truy cập"
                stroke="#FF0000"
                strokeWidth={2.5}
                dot={{
                  r: 3,
                  fill: "#FF0000",
                  stroke: "#FF0000",
                }}
                activeDot={{
                  r: 5,
                  fill: "#FF0000",
                  stroke: "#FF0000",
                }}
                label={{
                  position: "top",
                  offset: 10,
                  fill: "#FF0000",
                  fontSize: 11,
                  fontWeight: 700,
                  formatter: (value) =>
                    Number(value).toLocaleString("vi-VN"),
                }}
              />

              {/* =================================================
                  LƯỢT MỞ ALBUM
                  ĐƯỜNG + SỐ = MÀU XANH
              ================================================= */}
              <Line
                type="monotone"
                dataKey="views"
                name="Lượt mở album"
                stroke="#2563eb"
                strokeWidth={2.5}
                dot={{
                  r: 3,
                  fill: "#2563eb",
                  stroke: "#2563eb",
                }}
                activeDot={{
                  r: 5,
                  fill: "#2563eb",
                  stroke: "#2563eb",
                }}
                label={{
                  position: "top",
                  offset: 10,
                  fill: "#2563eb",
                  fontSize: 11,
                  fontWeight: 700,
                  formatter: (value) =>
                    Number(value).toLocaleString("vi-VN"),
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   HIỂN THỊ NGÀY TRÊN TRỤC X
   Ví dụ: 18/08
========================================================= */
function formatDisplayDate(dateString) {
  const [, month, day] = String(dateString || "").split("-");

  return day && month
    ? `${day}/${month}`
    : String(dateString || "");
}

/* =========================================================
   HIỂN THỊ NGÀY TRONG TOOLTIP
   Ví dụ: 18/08/2026
========================================================= */
function formatFullDate(dateString) {
  const [year, month, day] = String(dateString || "").split("-");

  return day && month && year
    ? `${day}/${month}/${year}`
    : String(dateString || "");
}

export default TrafficChart;