import { useMemo } from "react";

const quotes = [
  "Kỷ niệm đẹp không nằm ở bức ảnh, mà nằm ở những con người trong bức ảnh.",
  "Thời gian có thể lấy đi tuổi trẻ, nhưng không thể lấy đi những ký ức đẹp.",
  "Mỗi bức ảnh là một cánh cửa mở về một khoảng thời gian đã qua.",
  "Hạnh phúc là khi có ai đó để cùng lưu giữ những khoảnh khắc đáng nhớ.",
  "Đừng chỉ chụp ảnh, hãy sống trong từng khoảnh khắc.",
  "Ngày hôm nay rồi sẽ trở thành kỷ niệm của ngày mai.",
  "Cuộc sống đẹp hơn khi biết trân trọng những điều bình dị.",
  "Một nụ cười hôm nay có thể là bức ảnh đẹp nhất của ngày mai.",
  "Ký ức là kho báu mà thời gian không thể đánh cắp.",
  "Mỗi người chúng ta đều là một câu chuyện đáng để lưu giữ.",
  "Những bức ảnh sẽ ở lại khi tất cả rời đi.",

  "Có những khoảnh khắc chỉ cần nhìn lại là đủ mỉm cười.",
  "Mỗi ngày là một trang mới trong cuốn album cuộc đời.",
  "Đừng để những kỷ niệm đẹp chỉ còn trong trí nhớ.",
  "Ảnh lưu giữ hình ảnh, trái tim lưu giữ cảm xúc.",
  "Điều quý giá nhất của cuộc đời là những người ta từng gặp.",
  "Thời gian trôi rất nhanh, hãy lưu lại những điều đáng nhớ.",
  "Không phải bức ảnh đẹp, mà là câu chuyện phía sau bức ảnh.",
  "Có những người chỉ xuất hiện trong một bức ảnh nhưng ở mãi trong tim.",
  "Một khoảnh khắc được lưu giữ có thể trở thành ký ức cả đời.",
  "Hạnh phúc đôi khi chỉ là được nhìn lại những ngày đã qua.",
  "Cuộc sống không đếm bằng năm tháng mà bằng những kỷ niệm.",
  "Những điều bình dị nhất thường là những điều đáng nhớ nhất.",
  "Một album ảnh là cuốn nhật ký không cần lời nói.",
  "Hãy lưu giữ hôm nay để mai này còn có điều để nhớ.",
  "Ký ức đẹp luôn có cách khiến chúng ta mỉm cười.",
  "Mỗi lần xem lại ảnh là một lần sống lại cảm xúc.",
  "Có những bức ảnh càng cũ lại càng quý giá.",
  "Đừng ngại chụp ảnh, hãy ngại việc không còn gì để nhớ.",
  "Thời gian không quay lại, nhưng kỷ niệm thì có.",

  "Gia đình là nơi bắt đầu của mọi kỷ niệm đẹp.",
  "Bạn bè là những người làm cho ký ức trở nên rực rỡ hơn.",
  "Mỗi chuyến đi đều đáng được lưu giữ.",
  "Tuổi trẻ rồi sẽ qua, nhưng những bức ảnh sẽ còn.",
  "Ký ức đẹp là món quà không bao giờ cũ.",
  "Điều tuyệt vời nhất của cuộc sống là được tạo nên những kỷ niệm mới.",
  "Có những khoảnh khắc chỉ cần một tấm ảnh là đủ kể cả một câu chuyện.",
  "Mỗi bức ảnh đều có một nhịp tim riêng.",
  "Không ai có thể quay ngược thời gian, nhưng ai cũng có thể nhìn lại.",
  "Ký ức là nơi thời gian dừng lại.",
  "Một ngày nào đó, hôm nay sẽ là điều bạn nhớ nhất.",
  "Chúng ta lớn lên, còn những bức ảnh thì ở lại.",
  "Ảnh cũ không cũ, chỉ là thời gian đã đi xa.",
  "Cuộc sống đáng nhớ nhờ những con người đáng quý.",
  "Hãy sống để mỗi ngày đều xứng đáng được lưu giữ.",
  "Mỗi nụ cười đều xứng đáng có một vị trí trong album.",
  "Điều đẹp nhất không phải khung cảnh, mà là người cùng ta ngắm nó.",
  "Ký ức không phai màu nếu được trân trọng.",
  "Thời gian thay đổi mọi thứ, ngoại trừ những ký ức đẹp.",
  "Một tấm ảnh có thể lưu giữ điều mà ngàn lời nói không diễn tả được.",
  "Hôm nay là khoảnh khắc của tương lai.",
  "Đừng quên lưu lại những ngày bình thường, vì một ngày nào đó chúng sẽ trở nên đặc biệt.",
  "Mỗi khoảnh khắc đều có giá trị khi được sẻ chia.",
  "Những điều giản đơn thường tạo nên những ký ức đẹp nhất.",
  "Album không chỉ lưu ảnh, mà còn lưu cả một quãng đời."
];

export default function DailyQuote() {
  const quote = useMemo(() => {
    return quotes[Math.floor(Math.random() * quotes.length)];
  }, []);

  return (
    <div className="mt-4 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 p-[1px] shadow-md">
      <div className="flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-lg">
          ✨
        </div>

        <div className="min-w-0 flex-1">

          <p className="text-sm italic leading-6 text-slate-700">
            “{quote}”
          </p>
        </div>
      </div>
    </div>
  );
}