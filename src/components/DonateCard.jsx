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
        <section className="h-full rounded-3xl bg-white p-6 shadow-xl sm:p-8">
            <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-pink-100 text-xl text-pink-600">
                    <FaHeart />
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-slate-800">
                        Donate
                    </h2>

                    <p className="mt-1 text-slate-500">
                        Thằng nào có tiền thì nạp vào donate cho tao. Ít thì 5 quả trứng, nhiều thì 1 tên lửa.
                    </p>
                </div>
            </div>

            <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex justify-center">
                    <img
                        src="/images/donate-qr.png"
                        alt="Mã QR ủng hộ"
                        className="h-67 w-52 rounded-2xl bg-white object-contain p-2 shadow-sm"
                    />
                </div>

                <div className="mt-6 space-y-3 text-sm">
                    <InfoRow label="Ngân hàng" value={bankName} />

                    <InfoRow
                        label="Số tài khoản"
                        value={accountNumber}
                    />

                    <InfoRow
                        label="Chủ tài khoản"
                        value={accountName}
                    />
                </div>

                <button
                    type="button"
                    onClick={handleCopyAccount}
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-pink-600 px-5 py-3 font-semibold text-white transition hover:bg-pink-700"
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
        <div className="flex items-start justify-between gap-4">
            <span className="text-slate-500">
                {label}
            </span>

            <span className="text-right font-semibold text-slate-800">
                {value}
            </span>
        </div>
    );
}

export default DonateCard;