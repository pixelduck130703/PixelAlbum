import {
    FaHeart,
    FaCopy,
    FaQrcode,
} from "react-icons/fa";
import toast from "react-hot-toast";

function DonateCard() {
    const bankName = "Vietcombank";
    const accountNumber = "9353463942";
    const accountName = "NGUYEN TUAN HUNG";

    const handleCopyAccount = async () => {
        try {
            await navigator.clipboard.writeText(accountNumber);
            toast.success("Đã sao chép số tài khoản.");
        } catch (error) {
            toast.error("Không thể sao chép số tài khoản.");
        }
    };

    return (
        <section className="relative transform-gpu overflow-hidden rounded-3xl border border-white/80 border-t-white/95 bg-white/45 p-6 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.95),_0_20px_50px_rgba(0,0,0,0.08)] backdrop-blur-2xl backdrop-saturate-150 sm:p-8">
            {/* Vệt phản quang ánh sáng bề mặt kính trên cùng */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90" />

            {/* Đốm màu khúc xạ tạo chiều sâu kính lỏng */}
            <div className="pointer-events-none absolute -top-20 -left-20 h-48 w-48 rounded-full bg-pink-300/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-48 w-48 rounded-full bg-rose-300/25 blur-3xl" />

            {/* Header */}
            <div className="relative flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-pink-300/60 bg-pink-500/15 text-xl text-pink-600 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9)] backdrop-blur-md">
                    <FaHeart />
                </div>

                <div>
                    <h2 className="text-2xl font-black text-slate-800 drop-shadow-sm">
                        Donate
                    </h2>

                    <p className="mt-1 font-medium text-slate-600">
                        Thằng nào có tiền thì nạp vào donate cho tao. Ít thì 5 quả trứng, nhiều thì 1 tên lửa.
                    </p>
                </div>
            </div>

            {/* Box thông tin & QR kính con */}
            <div className="relative mt-7 rounded-2xl border border-white/90 border-t-white bg-white/50 p-5 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.95),_0_8px_24px_rgba(0,0,0,0.04)] backdrop-blur-xl">
                {/* Khung ảnh QR */}
                <div className="flex justify-center">
                    <div className="rounded-2xl border border-white/90 bg-white/80 p-1.5 shadow-md backdrop-blur-md">
                        <img
                            src="/images/donate-qr.png"
                            alt="Mã QR ủng hộ"
                            className="h-79 w-52 rounded-xl object-contain shadow-inner"
                        />
                    </div>
                </div>

                {/* Các hàng thông tin */}
                <div className="mt-6 space-y-3 text-sm">
                    <InfoRow label="Ngân hàng" value={bankName} />
                    <InfoRow label="Số tài khoản" value={accountNumber} />
                    <InfoRow label="Chủ tài khoản" value={accountName} />
                </div>

                {/* Nút sao chép Liquid Glass */}
                <button
                    type="button"
                    onClick={handleCopyAccount}
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-pink-400/40 bg-gradient-to-r from-pink-600/95 to-rose-600/95 px-5 py-3 font-bold text-white shadow-lg shadow-pink-500/25 backdrop-blur-md transition hover:-translate-y-0.5 hover:from-pink-600 hover:to-rose-600 hover:shadow-pink-500/35 active:scale-[0.99]"
                >
                    <FaCopy />
                    Sao chép số tài khoản
                </button>
            </div>
        </section>
    );
}

function InfoRow({ label, value }) {
    return (
        <div className="flex items-start justify-between gap-4 border-b border-slate-200/50 pb-2.5 last:border-b-0 last:pb-0">
            <span className="font-semibold text-slate-500">
                {label}
            </span>

            <span className="text-right font-extrabold text-slate-800">
                {value}
            </span>
        </div>
    );
}

export default DonateCard;