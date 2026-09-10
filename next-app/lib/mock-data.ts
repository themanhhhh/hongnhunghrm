export const dashboardData = {
  kpis: [
    { label: "Nhân sự đang làm việc", value: 146, trend: "+8.4%", tone: "teal" as const, detail: "So với đầu năm" },
    { label: "Vị trí đang tuyển", value: 18, trend: "6 chờ duyệt", tone: "amber" as const, detail: "Theo kế hoạch định biên" },
    { label: "Ứng viên đang xử lý", value: 64, trend: "+12 hồ sơ", tone: "violet" as const, detail: "Trong pipeline tuyển dụng" },
    { label: "Phiếu chờ phê duyệt", value: 9, trend: "Cần xử lý", tone: "rose" as const, detail: "Trên toàn doanh nghiệp" },
  ],
  departments: [
    { name: "Khối Kỹ thuật triển khai", count: 42, target: 48 },
    { name: "Phòng Kinh doanh", count: 31, target: 36 },
    { name: "Phòng Nhân sự", count: 8, target: 8 },
    { name: "Phòng Phát triển sản phẩm", count: 27, target: 30 },
    { name: "Khối Công nghệ", count: 24, target: 28 },
  ],
  approvals: [
    { code: "DX/TCBN-26012", type: "Thuyên chuyển", title: "Bổ nhiệm Nguyễn Quang Huy", owner: "Phòng Phát triển sản phẩm", age: "2 giờ trước", priority: "Cao" },
    { code: "YCTD/26-018", type: "Tuyển dụng", title: "Bổ sung 3 chuyên viên Cloud", owner: "Phòng Cloud và Hạ tầng", age: "Hôm qua", priority: "Khẩn" },
    { code: "DXNP/26-077", type: "Nghỉ phép", title: "Đơn nghỉ phép của Trần Đức Thắng", owner: "Phòng Kinh doanh", age: "Hôm qua", priority: "Thường" },
    { code: "DXKT-2026-008", type: "Khen thưởng", title: "Khen thưởng dự án ERP quý II", owner: "Khối Kỹ thuật", age: "2 ngày trước", priority: "Thường" },
  ],
  pipeline: [
    { label: "Mới tiếp nhận", count: 28 },
    { label: "Sơ loại", count: 19 },
    { label: "Phỏng vấn", count: 11 },
    { label: "Đã nhận Offer", count: 4 },
    { label: "Đã đi làm", count: 2 },
  ],
};

export const moduleData = {
  recruitment: {
    title: "Quản lý tuyển dụng",
    eyebrow: "TALENT ACQUISITION",
    description: "Điều phối nhu cầu nhân sự từ định biên đến ngày đầu tiên đi làm.",
    tabs: ["Định biên nhân sự", "Yêu cầu tuyển dụng", "Hồ sơ ứng viên", "Sơ loại", "Lịch phỏng vấn", "Đánh giá phỏng vấn", "Offer", "Quyết định trúng tuyển"],
    stats: [{ label: "Yêu cầu tuyển dụng", value: "24", meta: "6 chờ duyệt" }, { label: "Ứng viên", value: "184", meta: "64 đang xử lý" }, { label: "Lịch phỏng vấn", value: "12", meta: "7 lịch tuần này" }, { label: "Tỷ lệ nhận việc", value: "82%", meta: "+6% so với Q1" }],
    rows: [
      ["YCTD/26-018", "Chuyên viên Cloud & Security", "Phòng Cloud", "3", "Ngoài định biên", "Chờ duyệt"],
      ["YCTD/26-017", "Chuyên viên Tư vấn ERP", "Phòng Kinh doanh", "5", "Trong định biên", "Đang tuyển"],
      ["YCTD/26-016", "Kỹ sư triển khai ERP", "KTTK 1", "4", "Trong định biên", "Đã duyệt"],
    ],
  },
  people: {
    title: "Quản lý nhân sự",
    eyebrow: "PEOPLE OPERATIONS",
    description: "Một nguồn dữ liệu chuẩn cho hồ sơ, hợp đồng, biến động và các đề xuất nhân sự.",
    tabs: ["Hồ sơ nhân sự", "Hợp đồng lao động", "Đơn xin nghỉ phép", "Điều chuyển & bổ nhiệm", "Quá trình công tác"],
    stats: [{ label: "Nhân sự chính thức", value: "146", meta: "8 đơn vị" }, { label: "Hợp đồng hiệu lực", value: "139", meta: "5 sắp hết hạn" }, { label: "Đơn nghỉ phép", value: "17", meta: "9 chờ duyệt" }, { label: "Biến động quý này", value: "+12", meta: "Tuyển mới ròng" }],
    rows: [
      ["NV-2024-027", "Phạm Quốc Tuấn", "Phòng Kinh doanh", "Trưởng phòng", "01/04/2024", "Đang làm việc"],
      ["NV-2024-028", "Đặng Đình Hùng", "Phòng Kinh doanh", "Trưởng nhóm", "15/05/2024", "Đang làm việc"],
      ["NV-2024-086", "Phạm Đức Anh", "Phát triển sản phẩm", "Trưởng nhóm", "01/08/2024", "Đang làm việc"],
    ],
  },
  rewards: {
    title: "Khen thưởng & Kỷ luật",
    eyebrow: "PERFORMANCE & RECOGNITION",
    description: "Đánh giá minh bạch, ghi nhận đúng lúc và quản lý lịch sử quyết định tập trung.",
    tabs: ["Tiêu chí đánh giá", "Phiếu đánh giá", "Đề xuất thưởng phạt", "Quyết định", "Tra cứu lịch sử"],
    stats: [{ label: "Phiếu đánh giá", value: "142", meta: "Năm 2026" }, { label: "Xếp loại A/A+", value: "48", meta: "33.8% tổng số" }, { label: "Đề xuất chờ duyệt", value: "7", meta: "4 khen thưởng" }, { label: "Quyết định trong kỳ", value: "29", meta: "8.4 triệu đồng" }],
    rows: [
      ["PĐG-2026-089", "Nguyễn Thu Trang", "Phân tích nghiệp vụ", "9.2 / 10", "A+ Xuất sắc", "Đã hoàn tất"],
      ["PĐG-2026-088", "Lê Thị Yến", "Phát triển sản phẩm", "8.7 / 10", "A Giỏi", "Đã hoàn tất"],
      ["DXKT-2026-008", "Đội dự án ERP", "Khối Kỹ thuật", "5.000.000 đ", "Khen thưởng", "Chờ duyệt"],
    ],
  },
  reports: {
    title: "Báo cáo & phân tích",
    eyebrow: "DECISION INTELLIGENCE",
    description: "Biến dữ liệu nhân sự thành báo cáo quản trị có thể hành động ngay.",
    tabs: ["Tổng quan", "Báo cáo tuyển dụng", "Báo cáo nhân sự", "Đánh giá nhân sự", "Xuất dữ liệu"],
    stats: [{ label: "Mẫu báo cáo", value: "18", meta: "3 nhóm nghiệp vụ" }, { label: "Báo cáo tháng này", value: "46", meta: "12 người dùng" }, { label: "Tỷ lệ hoàn tất", value: "98%", meta: "Đúng hạn" }, { label: "Dữ liệu cập nhật", value: "08:42", meta: "Hôm nay" }],
    rows: [
      ["BC-HR-08", "Báo cáo biến động nhân sự", "Tháng 08/2026", "Toàn công ty", "146 nhân sự", "Sẵn sàng"],
      ["BC-REC-12", "Hiệu quả nguồn tuyển dụng", "Quý II/2026", "Tuyển dụng", "51 nhân sự", "Sẵn sàng"],
      ["BC-EV-04", "Tổng hợp xếp loại nhân viên", "Năm 2026", "Toàn công ty", "142 phiếu", "Sẵn sàng"],
    ],
  },
};
