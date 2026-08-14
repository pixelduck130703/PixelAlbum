import { useEffect, useState } from "react";

function WelcomePopup() {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const hasSeen = sessionStorage.getItem("welcomePopupSeen");

        if (!hasSeen) {
            setOpen(true);
        }
    }, []);

    const handleClose = () => {
        sessionStorage.setItem("welcomePopupSeen", "true");
        setOpen(false);
    };

    if (!open) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-md"
            onClick={handleClose}
        >
            {/* Đốm sáng khúc xạ tạo độ trong trẻo */}
            <div className="pointer-events-none absolute -top-10 -left-10 h-72 w-72 rounded-full bg-cyan-300/40 blur-[90px]" />
            <div className="pointer-events-none absolute -bottom-10 -right-10 h-72 w-72 rounded-full bg-blue-300/40 blur-[90px]" />

            <div
                className="relative w-full max-w-md transform-gpu overflow-hidden rounded-[2rem] border border-white/95 border-t-white bg-white/85 shadow-[inset_0_2px_4px_rgba(255,255,255,1),_0_24px_50px_rgba(0,0,0,0.08)] backdrop-blur-3xl backdrop-saturate-200"
                onClick={(event) => event.stopPropagation()}
            >
                {/* Vệt phản quang ánh sáng bề mặt kính đỉnh trên */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[2.5px] bg-gradient-to-r from-transparent via-white to-transparent opacity-100" />

                {/* Header kính Liquid Glass sáng tươi */}
                <div className="border-b border-white/60 bg-gradient-to-r from-blue-500/90 via-blue-600/90 to-indigo-500/90 px-6 py-5 text-white shadow-sm backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/40 bg-white/25 text-2xl shadow-[inset_0_1px_2px_rgba(255,255,255,0.8)] backdrop-blur-md">
                            🎞️
                        </div>

                        <div>
                            <h2 className="text-xl font-black drop-shadow-sm">
                                Chào mừng bạn
                            </h2>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <p className="text-sm font-medium leading-7 text-slate-700 sm:text-base">
                        Bạn có thể tìm kiếm album bằng
                        <strong className="text-slate-900">
                            {" "}ngày sinh
                        </strong>
                        {" "}hoặc
                        <strong className="text-slate-900">
                            {" "}họ tên, lớp, địa điểm
                        </strong>.
                    </p>

                    <div className="mt-5 space-y-3">
                        {/* Bật nhạc */}
                        <div className="rounded-2xl border border-blue-200/90 bg-gradient-to-r from-blue-50/90 to-cyan-50/90 p-4 shadow-[inset_0_1px_2px_rgba(255,255,255,1)] backdrop-blur-md">
                            <div className="flex items-start gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-300 bg-blue-600 text-xl text-white shadow-md shadow-blue-500/25">
                                    🔊
                                </div>

                                <div>
                                    <h3 className="text-sm font-bold text-slate-800">
                                        Bật nhạc nền
                                    </h3>

                                    <p className="mt-1 text-xs font-medium leading-5 text-slate-600">
                                        Nhấn vào biểu tượng <strong>🔊 loa ở góc dưới bên phải</strong> để
                                        phát nhạc nền và có trải nghiệm tốt hơn.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Ngày sinh */}
                        <div className="rounded-2xl border border-pink-200/90 bg-gradient-to-r from-pink-50/90 to-rose-50/90 p-4 shadow-[inset_0_1px_2px_rgba(255,255,255,1)] backdrop-blur-md">
                            <div className="flex items-start gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-pink-300 bg-pink-500 text-xl text-white shadow-md shadow-pink-500/25">
                                    🎂
                                </div>

                                <div>
                                    <h3 className="text-sm font-bold text-slate-800">
                                        Ưu tiên tìm theo ngày sinh
                                    </h3>

                                    <p className="mt-1 text-xs font-medium leading-5 text-slate-600">
                                        Nhập đúng <strong>ngày/tháng/năm</strong> để tìm kiếm nhanh và chính
                                        xác hơn.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Máy chủ */}
                        <div className="rounded-2xl border border-amber-200/90 bg-gradient-to-r from-amber-50/90 to-yellow-50/90 p-4 shadow-[inset_0_1px_2px_rgba(255,255,255,1)] backdrop-blur-md">
                            <div className="flex items-start gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-300 bg-amber-500 text-xl text-white shadow-md shadow-amber-500/25">
                                    ⏳
                                </div>

                                <div>
                                    <h3 className="text-sm font-bold text-slate-800">
                                        Máy chủ miễn phí
                                    </h3>

                                    <p className="mt-1 text-xs font-medium leading-5 text-slate-600">
                                        Lần truy cập đầu tiên có thể mất khoảng <strong>30–60 giây</strong> để
                                        khởi động.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        className="mt-6 flex min-h-[50px] w-full items-center justify-center rounded-2xl border border-blue-400/40 bg-gradient-to-r from-blue-600 to-indigo-600 px-5 font-bold text-white shadow-lg shadow-blue-500/30 backdrop-blur-md transition hover:-translate-y-0.5 hover:from-blue-600 hover:to-indigo-600 hover:shadow-blue-500/40 active:scale-[0.99]"
                    >
                        Đã hiểu
                    </button>
                </div>
            </div>
        </div>
    );
}

export default WelcomePopup;