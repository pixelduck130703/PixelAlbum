import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

function VisitChart({
    visitChart = [],
    visitChartDays = 30,
    setVisitChartDays,
    loadingVisitChart = false,
}) {
    return (
        <div className="mt-6 rounded-3xl bg-white p-4 shadow-sm md:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-lg font-bold text-slate-800 md:text-xl">
                        Lượt truy cập theo ngày
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Thống kê số lượt truy cập website theo từng ngày
                    </p>
                </div>

                <select
                    value={visitChartDays}
                    onChange={(event) =>
                        setVisitChartDays(Number(event.target.value))
                    }
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                    <option value={7}>7 ngày gần nhất</option>
                    <option value={14}>14 ngày gần nhất</option>
                    <option value={30}>30 ngày gần nhất</option>
                    <option value={90}>90 ngày gần nhất</option>
                </select>
            </div>

            {loadingVisitChart ? (
                <div className="flex h-[300px] items-center justify-center text-sm text-slate-500">
                    Đang tải biểu đồ...
                </div>
            ) : visitChart.length === 0 ? (
                <div className="flex h-[300px] items-center justify-center text-sm text-slate-500">
                    Chưa có dữ liệu lượt truy cập
                </div>
            ) : (
                <div className="h-[300px] w-full md:h-[380px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={visitChart}
                            margin={{
                                top: 10,
                                right: 15,
                                left: -20,
                                bottom: 5,
                            }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                            />

                            <XAxis
                                dataKey="displayDate"
                                tickFormatter={(value) =>
                                    String(value || "").replace(/-/g, "/")
                                }
                                tick={{
                                    fontSize: 12,
                                }}
                                tickMargin={10}
                                minTickGap={20}
                            />

                            <YAxis
                                allowDecimals={false}
                                tick={{
                                    fontSize: 12,
                                }}
                            />

                            <Tooltip
                                labelFormatter={(_, payload) => {
                                    const item = payload?.[0]?.payload;

                                    if (!item?.date) {
                                        return "";
                                    }

                                    return new Date(
                                        `${item.date}T00:00:00`
                                    ).toLocaleDateString("vi-VN");
                                }}
                                formatter={(value) => [
                                    Number(value).toLocaleString("vi-VN"),
                                    "Lượt truy cập",
                                ]}
                                contentStyle={{
                                    borderRadius: "12px",
                                    border: "1px solid #e2e8f0",
                                }}
                            />

                            <Line
                                type="monotone"
                                dataKey="visits"
                                name="Lượt truy cập"
                                stroke="#2563eb"
                                strokeWidth={3}
                                dot={{
                                    r: 3,
                                }}
                                activeDot={{
                                    r: 6,
                                }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}

export default VisitChart;