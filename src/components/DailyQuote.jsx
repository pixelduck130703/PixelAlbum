import { useState } from "react";

const quotes = [+
  "Máy ảnh ghi lại hiện tại, nhưng là bằng chứng của quá khứ.",
  "Chụp mất một giây, nhưng giữ lại cả đời.",
  "Giá trị của bức ảnh nằm ở cảm xúc khi xem lại sau mười năm.",
  "Ảnh có thể chụp vội, nhưng câu chuyện phía sau là trọn vẹn nhất.",
  "Đừng chỉ để ảnh trong máy, hãy mở ra để nhớ mình từng có những ngày như thế.",
  "Bộ nhớ đầy có thể xóa, mất đi một gương mặt thì chẳng tìm lại được.",
  "Ống kính nhìn thấy hình bóng, nhưng trái tim mới cảm nhận được ký ức.",
  "Mỗi lần bấm máy là một lần giữ lại thời gian không cho trôi mất.",
  "Ảnh có thể phai màu, nhưng câu chuyện bên trong thì không bao giờ cũ.",
  "Đừng đợi khi thật đẹp mới chụp, nụ cười chân thật mới là thứ vô giá.",
  "Điện thoại có thể đổi mới, nhưng bức ảnh năm ấy thì không thể mua lại.",
  "Bố mẹ không trẻ lại lần hai, hãy chụp cùng họ khi còn có thể.",
  "Bức ảnh đắt giá nhất là bức ảnh có đủ mặt mọi người.",
  "Ảnh xưa có thể vụng về, nhưng bao nhiêu tiền cũng không mua lại được.",
  "Có những người ta chỉ còn được nhìn thấy nụ cười qua những tấm hình cũ.",
  "Hồi đi học chụp ảnh để đùa vui, sau này mới biết tấm hình quý đến nhường nào.",
  "Cảnh đẹp rồi sẽ quên, người đi cùng trong ảnh thì ở lại mãi.",
  "Ta không thể quay lại tuổi 20, nhưng bức ảnh sẽ giữ lại cả thời thanh xuân.",
  "Tấm ảnh chụp chung là bằng chứng ta từng có một thời rực rỡ bên nhau.",
  "Bạn bè rồi mỗi đứa một phương, chỉ có bức ảnh kỷ yếu là ngồi lại bên nhau.",
  "Tuổi trẻ trôi nhanh như chớp mắt, may nhờ có ảnh giữ lại nét ngây ngô.",
  "Đi đâu không quan trọng, quan trọng là ai cùng ta đứng chung một khung hình.",
  "Những chuyến đi rồi sẽ kết thúc, nhưng tấm ảnh chụp cùng nhau là vô tận.",
  "Một bức ảnh thời đi học đủ để mở ra cả bầu trời ký ức.",
  "Thanh xuân không trở lại, nhưng tấm hình năm ấy vẫn vẹn nguyên nụ cười.",
  "Sau này gặp lại, mở ảnh cũ ra là thấy chúng ta chưa từng xa cách.",
  "Đừng ngại chụp ảnh cùng bạn bè, vì họp mặt đông đủ ngày càng khó khăn.",
  "Ký ức rồi sẽ phai, may mắn có bức ảnh giữ lại từng mảnh ghép chân thực.",
  "Nhiếp ảnh là nghệ thuật đóng băng khoảnh khắc thành hoài niệm.",
  "Không có cỗ máy thời gian nào tốt hơn một cuốn album cũ.",
  "Bức ảnh đẹp nhất là bức ảnh khiến bạn mỉm cười khi nhìn lại.",
  "Bạn thân là đứa luôn có mặt trong những tấm ảnh 'dìm' của bạn.",
  "Bạn bè thời đi học là những người xuất hiện trong album nhiều nhất một thời.",
  "Tấm ảnh kỷ yếu là lời chào tạm biệt đẹp nhất của thời áo trắng.",
  "Sau này mỗi đứa một ngả, chỉ còn bức ảnh cũ chứng minh ta từng bên nhau.",
  "Hãy cứ chụp ảnh hôm nay, vì ngày mai nó đã là kỷ niệm vô giá.",
  "Có những ngày tưởng chừng bình thường, sau này nhìn lại mới thấy thật diệu kỳ.",
  "Thời gian lấy đi nhiều thứ, nhưng để lại cho ta những bức ảnh đầy ắp kỷ niệm.",
  "Xem lại ảnh cũ như được bước qua cánh cửa trở về quá khứ một lần nữa.",
  "Mỗi bức ảnh là một chiếc vé một chiều đưa ta tìm lại chính mình ngày xưa.",
  "Đừng để những khoảnh khắc đẹp chỉ còn trơ trọi trong trí nhớ lãng quên.",
  "Ký ức đẹp giống như ngọn đèn sưởi ấm tâm hồn những ngày mỏi mệt.",
  "Một tấm ảnh nhỏ có thể cất giấu cả một khoảng trời thương nhớ.",
  "Cuộc sống bận rộn trôi qua nhanh, hãy bấm máy để giữ lại những phút giây bình yên.",
  "Ảnh chụp hôm nay là món quà vô giá gửi tặng cho chính bạn của tương lai.",
  "Chụp lại căn nhà cũ, góc phố xưa, vì chẳng mấy chốc chúng sẽ đổi thay.",
  "Người ta già đi theo năm tháng, nhưng ký ức trong ảnh thì trẻ mãi không già.",
  "Tấm ảnh đẹp không cần máy đắt tiền, chỉ cần đong đầy tình cảm chân thành.",
  "Giữ lại một bức ảnh là giữ lại một phần linh hồn của khoảnh khắc ấy.",
  "Mỗi bức ảnh cũ là một lời nhắc nhở: ta đã từng hạnh phúc và trọn vẹn đến thế.",
  "Đừng tiếc vài giây giơ máy, vì có những nụ cười chẳng lặp lại lần thứ hai.",
  "Thời gian trôi không chờ đợi ai, hãy để máy ảnh thay bạn cất giữ yêu thương.",
  "Ảnh là nơi thời gian ngừng trôi và yêu thương được giữ lại mãi mãi.",
  "Hôm nay rồi sẽ thành ngày hôm qua, hãy chụp lại để ký ức không bao giờ mất."
];

export default function DailyQuote() {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * quotes.length));
  const [isRotating, setIsRotating] = useState(false);

  // Đổi câu nói ngẫu nhiên (không trùng câu hiện tại)
  const handleChangeQuote = () => {
    setIsRotating(true);
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * quotes.length);
    } while (nextIndex === index && quotes.length > 1);

    setIndex(nextIndex);
    setTimeout(() => setIsRotating(false), 500);
  };

  return (
    <div className="mt-4 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 p-[1px] shadow-md">
      <div className="flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-3">
        {/* Icon trang trí */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-lg shadow-xs">
          ✨
        </div>

        {/* Nội dung câu trích dẫn ngắn gọn */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium italic leading-relaxed text-slate-700 transition-all duration-300">
            “{quotes[index]}”
          </p>
        </div>

        {/* Nút đổi câu trích dẫn */}
        <button
          type="button"
          onClick={handleChangeQuote}
          title="Đổi câu nói khác"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100/80 text-slate-500 transition-all hover:bg-indigo-50 hover:text-indigo-600 active:scale-95 cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className={`h-4 w-4 transition-transform duration-500 ${
              isRotating ? "rotate-180" : ""
            }`}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}