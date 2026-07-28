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
        displayDate: item.displayDate || formatDisplayDate(item.date),
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
          displayDate: item.displayDate || formatDisplayDate(item.date),
          visits: 0,
          views: Number(item.views) || 0,
        });
      }
    });

    return Array.from(dataMap.values()).sort((a, b) =>
      String(a.date).localeCompare(String(b.date))
    );
  })();

  return (
    <div className="mt-6 rounded-3xl bg-white p-4 shadow-sm md:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800 md:text-xl">
            Thống kê lượt truy cập
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            So sánh lượt truy cập website và lượt mở album theo ngày
          </p>
        </div>

        <select
          value={days}
          onChange={(event) => setDays(Number(event.target.value))}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        >
          <option value={7}>7 ngày gần nhất</option>
          <option value={14}>14 ngày gần nhất</option>
          <option value={30}>30 ngày gần nhất</option>
          <option value={90}>90 ngày gần nhất</option>
        </select>
      </div>

      {loading ? (
        <div className="flex h-[320px] items-center justify-center text-sm text-slate-500">
          Đang tải biểu đồ...
        </div>
      ) : mergedData.length === 0 ? (
        <div className="flex h-[320px] items-center justify-center text-sm text-slate-500">
          Chưa có dữ liệu thống kê
        </div>
      ) : (
        <div className="h-[320px] w-full md:h-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={mergedData}
              margin={{ top: 10, right: 20, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />

              <XAxis
                dataKey="displayDate"
                tick={{ fontSize: 12 }}
                tickMargin={10}
                minTickGap={20}
              />

              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />

              <Tooltip
                labelFormatter={(_, payload) => {
                  const item = payload?.[0]?.payload;
                  return item?.date ? formatFullDate(item.date) : "";
                }}
                formatter={(value, name) => [
                  Number(value).toLocaleString("vi-VN"),
                  name,
                ]}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                }}
              />

              <Legend verticalAlign="top" height={36} />

              <Line
                type="monotone"
                dataKey="visits"
                name="Lượt truy cập website"
                stroke="#FF0000"
                strokeWidth={3}
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
              />

              <Line
                type="monotone"
                dataKey="views"
                name="Lượt mở album"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function formatDisplayDate(dateString) {
  const [, month, day] = String(dateString || "").split("-");
  return day && month ? `${day}/${month}` : String(dateString || "");
}

function formatFullDate(dateString) {
  const [year, month, day] = String(dateString || "").split("-");
  return day && month && year
    ? `${day}/${month}/${year}`
    : String(dateString || "");
}

export default TrafficChart;