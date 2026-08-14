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
            className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
            onClick={handleClose}
        >
            <div
                className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 text-white">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-2xl">
                            🎞️
                        </div>

                        <div>
                            <h2 className="text-xl font-bold">
                                Chào mừng bạn
                            </h2>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <p className="text-sm leading-7 text-slate-600 sm:text-base">
                        Bạn có thể tìm kiếm album bằng
                        <strong className="text-slate-800">
                            {" "}ngày sinh
                        </strong>
                        {" "}hoặc
                        <strong className="text-slate-800">
                            {" "}họ tên, lớp, địa điểm
                        </strong>.
                    </p>


                    <div className="mt-5 space-y-3">
                        {/* Bật nhạc */}
                        <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 p-4">
                            <div className="flex items-start gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-xl text-white shadow-sm">
                                    🔊
                                </div>

                                <div>
                                    <h3 className="text-sm font-bold text-slate-800">
                                        Bật nhạc nền
                                    </h3>

                                    <p className="mt-1 text-xs leading-5 text-slate-500">
                                        Nhấn vào biểu tượng <strong>🔊 loa ở góc dưới bên phải</strong> để
                                        phát nhạc nền và có trải nghiệm tốt hơn.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Ngày sinh */}
                        <div className="rounded-2xl border border-pink-200 bg-gradient-to-r from-pink-50 to-rose-50 p-4">
                            <div className="flex items-start gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-pink-500 text-xl text-white shadow-sm">
                                    🎂
                                </div>

                                <div>
                                    <h3 className="text-sm font-bold text-slate-800">
                                        Ưu tiên tìm theo ngày sinh
                                    </h3>

                                    <p className="mt-1 text-xs leading-5 text-slate-500">
                                        Nhập đúng <strong>ngày/tháng/năm</strong> để tìm kiếm nhanh và chính
                                        xác hơn.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Máy chủ */}
                        <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 p-4">
                            <div className="flex items-start gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-xl text-white shadow-sm">
                                    ⏳
                                </div>

                                <div>
                                    <h3 className="text-sm font-bold text-slate-800">
                                        Máy chủ miễn phí
                                    </h3>

                                    <p className="mt-1 text-xs leading-5 text-slate-500">
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
                        className="mt-6 flex min-h-[50px] w-full items-center justify-center rounded-2xl bg-blue-600 px-5 font-semibold text-white shadow-md transition hover:bg-blue-700"
                    >
                        Đã hiểu
                    </button>
                </div>
            </div>
        </div>
    );
}

export default WelcomePopup;