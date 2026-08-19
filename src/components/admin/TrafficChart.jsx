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

/* Khoảng cách chuẩn từ tâm điểm nút tới tâm con số */
const LABEL_GAP = 15;

/* =========================================================
   CUSTOM LABEL CHO LƯỢT TRUY CẬP (MÀU ĐỎ)
========================================================= */
const CustomVisitsLabel = (props) => {
  const { x, y, value, index, data } = props;
  if (value === undefined || value === null) return null;

  const currentItem = data?.[index];
  const visits = Number(currentItem?.visits) || 0;
  const views = Number(currentItem?.views) || 0;
  const diff = Math.abs(visits - views);

  // Mặc định ở trên (-LABEL_GAP); nếu gần nhau và visits < views (visits > 0) thì ở dưới (+LABEL_GAP)
  const isBottom = visits > 0 && diff > 0 && diff < 3 && visits < views;
  const yPos = isBottom ? y + LABEL_GAP : y - LABEL_GAP;

  return (
    <text
      x={x}
      y={yPos}
      fill="#FF0000"
      fontSize={11}
      fontWeight={700}
      textAnchor="middle"
      dominantBaseline="central"
    >
      {Number(value).toLocaleString("vi-VN")}
    </text>
  );
};

/* =========================================================
   CUSTOM LABEL CHO LƯỢT MỞ ALBUM (MÀU XANH)
========================================================= */
const CustomViewsLabel = (props) => {
  const { x, y, value, index, data } = props;
  if (value === undefined || value === null) return null;

  const currentItem = data?.[index];
  const visits = Number(currentItem?.visits) || 0;
  const views = Number(currentItem?.views) || 0;

  // Nếu 2 giá trị bằng nhau -> Ẩn nhãn bên Views để chỉ hiển thị 1 số duy nhất bên Visits
  if (visits === views) {
    return null;
  }

  const diff = Math.abs(visits - views);
  // Mặc định ở trên (-LABEL_GAP); nếu gần nhau và views < visits (views > 0) thì ở dưới (+LABEL_GAP)
  const isBottom = views > 0 && diff < 3 && views < visits;
  const yPos = isBottom ? y + LABEL_GAP : y - LABEL_GAP;

  return (
    <text
      x={x}
      y={yPos}
      fill="#2563eb"
      fontSize={11}
      fontWeight={700}
      textAnchor="middle"
      dominantBaseline="central"
    >
      {Number(value).toLocaleString("vi-VN")}
    </text>
  );
};

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
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:w-auto cursor-pointer"
        >
          <option value={7}>7 ngày gần nhất</option>
          <option value={14}>14 ngày gần nhất</option>
          <option value={30}>30 ngày gần nhất</option>
          <option value={90}>90 ngày gần nhất</option>
        </select>
      </div>

      {/* =====================================================
          LOADING / NO DATA / CHART
      ===================================================== */}
      {loading ? (
        <div className="flex h-[280px] items-center justify-center text-sm text-slate-500 sm:h-[320px]">
          Đang tải biểu đồ...
        </div>
      ) : mergedData.length === 0 ? (
        <div className="flex h-[280px] items-center justify-center text-sm text-slate-500 sm:h-[320px]">
          Chưa có dữ liệu thống kê
        </div>
      ) : (
        <div className="h-[300px] w-full sm:h-[340px] md:h-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={mergedData}
              margin={{
                top: 25,
                right: 12,
                left: 0,
                bottom: 15,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
              />

              <XAxis
                dataKey="displayDate"
                interval={xAxisInterval}
                tick={{ fontSize: 10, fill: "#64748b" }}
                tickMargin={8}
                minTickGap={12}
                padding={{
                  left: 12,
                  right: 12,
                }}
              />

              <YAxis
                allowDecimals={false}
                width={34}
                tick={{ fontSize: 10, fill: "#64748b" }}
              />

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
                  fontSize: "12px",
                  maxWidth: "220px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
              />

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
                  LƯỢT TRUY CẬP (ĐƯỜNG ĐỎ)
              ================================================= */}
              <Line
                type="monotone"
                dataKey="visits"
                name="Lượt truy cập"
                stroke="#FF0000"
                strokeWidth={2.5}
                dot={{
                  r: 3.5,
                  fill: "#FF0000",
                  stroke: "#FF0000",
                }}
                activeDot={{
                  r: 5.5,
                  fill: "#FF0000",
                  stroke: "#FF0000",
                }}
                label={<CustomVisitsLabel data={mergedData} />}
              />

              {/* =================================================
                  LƯỢT MỞ ALBUM (ĐƯỜNG XANH)
              ================================================= */}
              <Line
                type="monotone"
                dataKey="views"
                name="Lượt mở album"
                stroke="#2563eb"
                strokeWidth={2.5}
                dot={{
                  r: 3.5,
                  fill: "#2563eb",
                  stroke: "#2563eb",
                }}
                activeDot={{
                  r: 5.5,
                  fill: "#2563eb",
                  stroke: "#2563eb",
                }}
                label={<CustomViewsLabel data={mergedData} />}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   HIỂN THỊ NGÀY TRÊN TRỤC X (Ví dụ: 18/08)
========================================================= */
function formatDisplayDate(dateString) {
  const [, month, day] = String(dateString || "").split("-");

  return day && month
    ? `${day}/${month}`
    : String(dateString || "");
}

/* =========================================================
   HIỂN THỊ NGÀY TRONG TOOLTIP (Ví dụ: 18/08/2026)
========================================================= */
function formatFullDate(dateString) {
  const [year, month, day] = String(dateString || "").split("-");

  return day && month && year
    ? `${day}/${month}/${year}`
    : String(dateString || "");
}

export default TrafficChart;