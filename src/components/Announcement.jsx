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
    }, 20);

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
    <section className="relative transform-gpu overflow-hidden rounded-2xl border border-amber-200/80 border-t-white/95 bg-gradient-to-r from-yellow-50/70 via-white/80 to-amber-50/70 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.95),_0_16px_40px_rgba(0,0,0,0.06)] backdrop-blur-2xl backdrop-saturate-150">
      {/* Vệt phản quang ánh sáng bề mặt kính trên cùng */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90" />

      {/* Header giữ nguyên màu */}
      <div className="flex items-center gap-3 border-b border-amber-100/80 bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-white shadow-sm">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/20 text-lg shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] backdrop-blur-md">
          📢
        </div>

        <h2 className="text-base font-bold uppercase tracking-wide drop-shadow-sm">
          Thông báo
        </h2>
      </div>

      {/* Nội dung */}
      <div className="px-4 py-4">
        <p className="whitespace-pre-wrap break-words text-[15px] leading-7 text-slate-700">
          {displayText}

          <span className="ml-0.5 animate-pulse font-bold text-amber-500">
            |
          </span>
        </p>

        {formattedUpdatedAt && (
          <div className="mt-3 flex items-center justify-end gap-1 text-[11px] text-slate-400">
            <span>🕒</span>
            <span>{formattedUpdatedAt}</span>
          </div>
        )}
      </div>
    </section>
  );
}

export default Announcement;