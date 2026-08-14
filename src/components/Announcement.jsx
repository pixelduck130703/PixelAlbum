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
    <section className="overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-r from-yellow-50 via-white to-amber-50 shadow-md">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-amber-100 bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-white">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 text-lg">
          📢
        </div>

        <h2 className="text-base font-bold uppercase tracking-wide">
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

            <span>
              {formattedUpdatedAt}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

export default Announcement;