import api from "../../services/api";

export async function exportExcel() {
  const confirmed = window.confirm(
    "Bạn có chắc muốn xuất toàn bộ danh sách album ra file Excel không?"
  );

  if (!confirmed) {
    return false;
  }

  try {
    const response = await api.get("/admin/export-excel", {
      responseType: "blob",
    });

    const contentType = response.headers["content-type"] || "";

    if (
      !contentType.includes(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      )
    ) {
      const errorText = await response.data.text();

      console.error("Phản hồi không phải Excel:", errorText);

      try {
        const errorData = JSON.parse(errorText);

        alert(
          errorData.message ||
            "Máy chủ không trả về file Excel hợp lệ."
        );
      } catch {
        alert("Máy chủ không trả về file Excel hợp lệ.");
      }

      return false;
    }

    const blob = new Blob([response.data], {
      type: contentType,
    });

    const downloadUrl = window.URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = downloadUrl;
    link.download = `DanhSachAlbum-${new Date()
      .toISOString()
      .slice(0, 10)}.xlsx`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(downloadUrl);

    return true;
  } catch (error) {
    console.error("Lỗi xuất Excel:", error);

    if (error.response?.data instanceof Blob) {
      try {
        const errorText = await error.response.data.text();
        const errorData = JSON.parse(errorText);

        alert(
          errorData.message ||
            "Không thể xuất file Excel."
        );

        return false;
      } catch {
        // Phản hồi không phải JSON
      }
    }

    alert("Không thể xuất file Excel. Vui lòng thử lại.");

    return false;
  }
}