import React, { useState, useEffect } from "react";

// Prompt ẩn cố định sẵn trong code
const HIDDEN_PROMPT = `Bạn là chuyên gia phân tích thiết kế thời trang nam và nữ, đồng thời là biên kịch quảng cáo chuyên nghiệp dành cho thị trường Thái Lan.

Hãy phân tích thật kỹ sản phẩm thời trang trong HÌNH ẢNH hoặc VIDEO tôi cung cấp, sau đó tạo một đoạn mô tả quảng cáo bằng tiếng Thái để chuyển trực tiếp thành giọng đọc AI Voice, thời lượng khoảng 15–20 giây.

**1. NGUYÊN TẮC ƯU TIÊN QUAN TRỌNG NHẤT**

Không mô tả sản phẩm theo thứ tự thông thường. Hãy tự xác định những chi tiết đặc trưng, nổi bật và có khả năng thu hút người mua nhất của từng thiết kế, sau đó đưa chúng lên đầu lời thoại.

Thứ tự ưu tiên khi phân tích:

1. **CHỮ IN VÀ SLOGAN:** Quan sát thật kỹ tất cả dòng chữ xuất hiện trực tiếp trên áo. Nhận diện chính xác nội dung, kiểu chữ, cách sắp xếp và vị trí. Nếu dòng chữ là điểm nhấn chính của sản phẩm, hãy ưu tiên giới thiệu ngay trong câu mở đầu.

2. **LOGO VÀ BIỂU TƯỢNG:** Phân tích hình dáng logo, các ký tự cách điệu, đường nét, cấu trúc và vị trí. Nhấn mạnh những đặc điểm giúp logo trở nên độc đáo.

3. **HỌA TIẾT VÀ CHI TIẾT THIẾT KẾ:** Phân tích các hình in, hoa văn, đường kẻ, họa tiết thêu, ren, nơ, cúc áo, chi tiết phối và những điểm nhấn tạo nên sự khác biệt của sản phẩm.

4. **KIỂU DÁNG:** Xác định chính xác loại áo, thiết kế cổ, tay áo, vai áo, form dáng, độ ôm, độ rộng, đường may và những đặc điểm nổi bật trong cấu trúc.

5. **CHẤT LIỆU:** Mô tả đặc điểm bề mặt vải, độ mềm mại, kết cấu, độ đứng form và độ rủ dựa trên những gì có thể quan sát thực tế. Không tự khẳng định thành phần hoặc tính năng vải nếu chưa có căn cứ.

6. **PHONG CÁCH:** Đặc biệt nhấn mạnh phong cách đặc trưng của sản phẩm như lịch lãm, sang trọng, tối giản, trẻ trung, cá tính, thanh lịch hoặc nữ tính tùy theo thiết kế thực tế.

LƯU Ý: Thứ tự trên chỉ là mức độ ưu tiên, không phải khuôn mẫu bắt buộc. Nếu chiếc áo nổi bật nhờ kiểu cổ, chi tiết ren, đường cắt may hoặc thiết kế đặc biệt thay vì chữ in hay logo, hãy đưa chi tiết đó lên đầu tiên.

**2. PHÂN TÍCH HÌNH ẢNH HOẶC VIDEO**

- Với hình ảnh: Quan sát kỹ toàn bộ sản phẩm và những chi tiết nhỏ nhất.
- Với video: Phân tích nhiều khung hình xuyên suốt video, đặc biệt chú ý những cảnh quay cận họa tiết, logo, chữ in, chất liệu và cấu trúc áo.
- Nếu có nhiều phiên bản của cùng một thiết kế, chỉ tập trung vào các đặc điểm thiết kế chung.
- Phân biệt chính xác chữ in trên sản phẩm với phụ đề, watermark hoặc chữ quảng cáo trong hình ảnh và video.
- Không suy đoán những chi tiết không thể quan sát rõ.

**3. QUY TẮC BẮT BUỘC**

- Tuyệt đối không đề cập đến bất kỳ màu sắc nào vì sản phẩm có thể có nhiều phiên bản màu khác nhau.
- Tự nhận diện sản phẩm dành cho nam, nữ hoặc unisex.
- Đưa chi tiết độc đáo và thu hút nhất lên ngay đầu lời thoại.
- Ưu tiên chữ in, logo và họa tiết khi chúng là điểm nhấn chính của sản phẩm.
- Nếu chữ in có thể nhận diện chính xác, hãy giữ nguyên nội dung. Nếu không rõ, chỉ mô tả hình thức trang trí, tuyệt đối không tự sáng tạo chữ.
- Không sử dụng những câu mở đầu chung chung, sáo rỗng hoặc giống nhau cho tất cả sản phẩm.
- Không cần liệt kê mọi đặc điểm; chỉ chọn những chi tiết quan trọng nhất để đảm bảo thời lượng.
- Không tự sáng tạo chất liệu, thương hiệu, công dụng, giá bán hoặc chương trình khuyến mãi.
- Không mô tả người mẫu, quần, đồng hồ, phông nền hoặc hiệu ứng video.
- Sử dụng ngôn ngữ bán hàng tiếng Thái tự nhiên, tinh tế, hấp dẫn và có sức thuyết phục.
- Phải làm nổi bật phong cách và giá trị thẩm mỹ riêng biệt của từng thiết kế.

**4. ĐỊNH DẠNG ĐẦU RA**

Chỉ xuất ra DUY NHẤT một đoạn văn tiếng Thái hoàn chỉnh, thời lượng đọc khoảng 15–20 giây.

Không có tiêu đề, emoji, hashtag, dấu gạch đầu dòng, bản dịch hay lời giải thích.

Lời thoại phải có nhịp ngắt tự nhiên, phù hợp để chuyển trực tiếp sang Text-to-Speech.

Mở đầu bằng chi tiết nổi bật nhất của sản phẩm, tiếp tục mô tả ngắn gọn những đặc điểm quan trọng còn lại, nhấn mạnh phong cách thời trang và kết thúc bằng một câu kêu gọi khách hàng nhắn tin đặt mua ngay.

MỤC TIÊU CUỐI CÙNG: Chỉ trong 15–20 giây, khách hàng phải nhận ra điểm khác biệt của sản phẩm, hình dung được thiết kế, cảm nhận được phong cách và có mong muốn đặt mua ngay.`;

export default function ImageDescriber() {
  const [apiKey, setApiKey] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [base64Data, setBase64Data] = useState("");
  const [mimeType, setMimeType] = useState("image/jpeg");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  // Tự động load API key từ localStorage
  useEffect(() => {
    const savedKey = localStorage.getItem("user_gemini_api_key");
    if (savedKey) setApiKey(savedKey);
  }, []);

  const handleKeyChange = (e) => {
    const key = e.target.value;
    setApiKey(key);
    localStorage.setItem("user_gemini_api_key", key);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setMimeType(file.type || "image/jpeg");

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      // Tách bỏ tiền tố base64 (ví dụ: data:image/png;base64,...)
      const rawBase64 = reader.result.split(",")[1];
      setBase64Data(rawBase64);
      setResult("");
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    const trimmedKey = apiKey.trim();
    if (!trimmedKey) {
      alert("Vui lòng nhập Gemini API Key của bạn!");
      return;
    }
    if (!base64Data) {
      alert("Vui lòng tải lên một bức ảnh trước!");
      return;
    }

    setLoading(true);
    setResult("");

    try {
      // Bước 1: Tự động hỏi Google xem API key này được phép dùng những model nào
      const listRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${trimmedKey}`
      );
      const listData = await listRes.json();

      if (!listRes.ok) {
        throw new Error(listData.error?.message || "Không thể kiểm tra danh sách model với API Key này.");
      }

      // Lọc các model hỗ trợ generateContent, ưu tiên các bản flash
      const availableModels = (listData.models || [])
        .filter(
          (m) =>
            m.supportedGenerationMethods &&
            m.supportedGenerationMethods.includes("generateContent") &&
            !m.name.includes("embedding") &&
            !m.name.includes("aqa")
        )
        .map((m) => m.name.replace("models/", ""));

      // Ưu tiên dòng flash trước
      availableModels.sort((a, b) => {
        if (a.includes("flash") && !b.includes("flash")) return -1;
        if (!a.includes("flash") && b.includes("flash")) return 1;
        return 0;
      });

      if (availableModels.length === 0) {
        throw new Error("Không tìm thấy model nào khả dụng cho tài khoản này.");
      }

      const requestBody = {
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data,
                },
              },
              {
                text: HIDDEN_PROMPT,
              },
            ],
          },
        ],
      };

      let success = false;
      let lastErrMessage = "";

      // Bước 2: Thử lần lượt các model hợp lệ có sẵn
      for (const model of availableModels) {
        try {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${trimmedKey}`;

          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          });

          const data = await res.json();

          if (res.ok) {
            const textOutput =
              data.candidates?.[0]?.content?.parts?.[0]?.text || "Không có phản hồi từ AI";
            setResult(textOutput);
            success = true;
            break; // Thành công, thoát vòng lặp
          } else {
            lastErrMessage = data.error?.message || `Lỗi từ model ${model}`;
            // Nếu model này bị nghẽn demand (503/429), vòng lặp sẽ tự động thử model tiếp theo
            console.warn(`Model ${model} không thành công:`, lastErrMessage);
          }
        } catch (err) {
          lastErrMessage = err.message;
        }
      }

      if (!success) {
        throw new Error(lastErrMessage || "Tất cả model đều đang bận.");
      }
    } catch (err) {
      console.error("Lỗi:", err);
      alert("Lỗi: " + (err.message || "Vui lòng kiểm tra lại kết nối mạng hoặc API Key."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 650,
        margin: "30px auto",
        padding: 24,
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#fff",
        borderRadius: 12,
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: 20, color: "#333" }}>
        Miêu tả hình ảnh bằng AI
      </h2>

      {/* 1. Ô nhập Gemini API Key */}
      <div style={{ marginBottom: 18 }}>
        <label style={{ display: "block", fontWeight: "bold", marginBottom: 6, color: "#444" }}>
          Gemini API Key:
        </label>
        <input
          type="password"
          placeholder="Dán API Key vào đây (ví dụ: AIzaSy...)"
          value={apiKey}
          onChange={handleKeyChange}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 6,
            border: "1px solid #ccc",
            boxSizing: "border-box",
            fontSize: 14,
          }}
        />
        <small style={{ color: "#777", display: "block", marginTop: 4 }}>
          * Key được lưu cục bộ trên trình duyệt (localStorage), không lưu vào file .env.
        </small>
      </div>

      {/* 2. Ô chọn ảnh */}
      <div style={{ marginBottom: 18 }}>
        <label style={{ display: "block", fontWeight: "bold", marginBottom: 6, color: "#444" }}>
          Tải ảnh lên:
        </label>
        <input type="file" accept="image/*" onChange={handleImageChange} style={{ width: "100%" }} />
      </div>

      {/* 3. Xem trước ảnh */}
      {imagePreview && (
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <img
            src={imagePreview}
            alt="Preview"
            style={{
              maxWidth: "100%",
              maxHeight: 320,
              borderRadius: 8,
              border: "1px solid #e0e0e0",
              objectFit: "contain",
            }}
          />
        </div>
      )}

      {/* 4. Nút bấm Tạo */}
      <div style={{ textAlign: "center" }}>
        <button
          onClick={handleGenerate}
          disabled={!base64Data || !apiKey.trim() || loading}
          style={{
            backgroundColor: loading || !base64Data || !apiKey.trim() ? "#9e9e9e" : "#2563eb",
            color: "#fff",
            border: "none",
            padding: "12px 28px",
            borderRadius: 6,
            cursor: loading || !base64Data || !apiKey.trim() ? "not-allowed" : "pointer",
            fontSize: 15,
            fontWeight: "bold",
          }}
        >
          {loading ? "Đang phân tích hình ảnh..." : "Tạo miêu tả"}
        </button>
      </div>

      {/* 5. Hiển thị kết quả */}
      {result && (
        <div
          style={{
            marginTop: 24,
            padding: 16,
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            whiteSpace: "pre-wrap",
            lineHeight: 1.6,
            color: "#1e293b",
          }}
        >
          <h3 style={{ marginTop: 0, color: "#0f172a", borderBottom: "1px solid #cbd5e1", paddingBottom: 8 }}>
            Kết quả miêu tả:
          </h3>
          <p style={{ margin: "12px 0 0 0" }}>{result}</p>
        </div>
      )}
    </div>
  );
}