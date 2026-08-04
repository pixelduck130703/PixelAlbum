import { useEffect, useState } from "react";

function Announcement({
  content = "",
  updatedAt = null,
}) {
  const normalizedContent = String(content || "").trim();

  const [displayText, setDisplayText] = useState("");

  useEffect(() => {
    if (!normalizedContent) {
      setDisplayText("");
      return;
    }

    let index = 0;

    const timer = setInterval(() => {
      index++;

      setDisplayText(
        normalizedContent.slice(0, index)
      );

      if (index >= normalizedContent.length) {
        clearInterval(timer);
      }
    }, 25); // tốc độ gõ (ms/ký tự)

    return () => clearInterval(timer);
  }, [normalizedContent]);

  if (!normalizedContent) {
    return null;
  }

  const formattedUpdatedAt = updatedAt
    ? new Date(updatedAt).toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "";

  return (
    <div className="overflow-hidden rounded-3xl border border-amber-300 bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-amber-200 bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3 text-white">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 text-2xl shadow">
          📢
        </div>

        <div>
          <h2 className="text-lg font-bold uppercase tracking-wide">
            Thông báo
          </h2>
        </div>
      </div>

      {/* Nội dung */}
      <div className="px-5 py-5">
        <div className="rounded-2xl border-l-4 border-amber-500 bg-white/80 p-5 shadow-sm">
          <p className="whitespace-pre-wrap break-words text-[17px] font-medium leading-8 text-slate-800">
            {displayText}

            {/* Con trỏ nhấp nháy */}
            <span className="ml-1 inline-block animate-pulse font-bold text-amber-600">
              |
            </span>
          </p>
        </div>

        {formattedUpdatedAt && (
          <div className="mt-4 flex items-center justify-end gap-2 text-xs text-slate-500">
            <span>🕒</span>

            <span>
              Cập nhật lúc <strong>{formattedUpdatedAt}</strong>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default Announcement;