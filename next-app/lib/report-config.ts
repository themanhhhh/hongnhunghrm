export type ReportColumn = { key: string; label: string };

export type ReportFilter = "date" | "department" | "position" | "status" | "result" | "employee" | "type";

export type ReportSummaryField = {
  key: string;
  label: string;
  format?: "number" | "percent";
};

export type ReportChartSeries = {
  key: string;
  label: string;
  tone: "teal" | "amber" | "violet" | "rose";
};

export type ReportChartConfig = {
  labelKey: string;
  series: ReportChartSeries[];
};

export type ReportDefinition = {
  id: string;
  title: string;
  columns: ReportColumn[];
  sampleMeta: string[];
  endpoint?: string;
  filters?: ReportFilter[];
  summary?: ReportSummaryField[];
  chart?: ReportChartConfig;
};

export type ReportGroup = {
  id: string;
  title: string;
  reports: ReportDefinition[];
};

const report = (
  id: string,
  title: string,
  columns: ReportColumn[],
  sampleMeta: string[],
  options: Omit<ReportDefinition, "id" | "title" | "columns" | "sampleMeta"> = {},
): ReportDefinition => ({ id, title, columns, sampleMeta, ...options });

export const reportGroups: ReportGroup[] = [
  {
    id: "recruitment",
    title: "Báo cáo tuyển dụng",
    reports: [
      report("rec_result", "Báo cáo kết quả tuyển dụng", [
        { key: "departmentName", label: "Bộ phận" },
        { key: "positionName", label: "Vị trí" },
        { key: "requiredCount", label: "Cần tuyển" },
        { key: "appliedCount", label: "Ứng tuyển" },
        { key: "passedCount", label: "Trúng tuyển" },
        { key: "onboardedCount", label: "Đi làm" },
        { key: "passRate", label: "% Trúng tuyển" },
        { key: "onboardRate", label: "% Đi làm" },
        { key: "fulfillmentRate", label: "% Hoàn thành" },
      ], ["Thời gian: Ngày lập yêu cầu tuyển dụng", "Bộ phận: Tất cả", "Vị trí: Tất cả"], {
        endpoint: "/reports/recruitment-result",
        filters: ["date", "department", "position"],
        summary: [
          { key: "requiredCount", label: "Cần tuyển" },
          { key: "appliedCount", label: "Ứng tuyển" },
          { key: "passedCount", label: "Trúng tuyển" },
          { key: "onboardedCount", label: "Đi làm" },
          { key: "passRate", label: "Tỷ lệ trúng tuyển", format: "percent" },
          { key: "onboardRate", label: "Tỷ lệ nhận việc", format: "percent" },
          { key: "fulfillmentRate", label: "Tỷ lệ hoàn thành", format: "percent" },
        ],
        chart: {
          labelKey: "positionName",
          series: [
            { key: "requiredCount", label: "Cần tuyển", tone: "teal" },
            { key: "appliedCount", label: "Ứng tuyển", tone: "violet" },
            { key: "passedCount", label: "Trúng tuyển", tone: "amber" },
            { key: "onboardedCount", label: "Đi làm", tone: "rose" },
          ],
        },
      }),
      report("rec_efficiency", "Hiệu quả tuyển dụng theo tin theo nguồn", [
        { key: "source_name", label: "Nguồn tuyển dụng" },
        { key: "post_count", label: "Số tin đăng" },
        { key: "total_cv", label: "Tổng CV nhận" },
        { key: "qualified_cv", label: "CV đạt yêu cầu" },
        { key: "interview_count", label: "Số ứng viên phỏng vấn" },
        { key: "hired_count", label: "Số nhân sự nhận việc" },
        { key: "cost", label: "Chi phí (VNĐ)" },
        { key: "cost_per_hired", label: "Chi phí / nhân sự (VNĐ)" },
      ], ["Kênh tuyển dụng: Tất cả", "Kỳ báo cáo: Quý I & Quý II 2026"]),
      report("rec_source_quality", "Đánh giá chất lượng nguồn tuyển dụng", [
        { key: "source_name", label: "Nguồn tuyển dụng" },
        { key: "pass_probation_rate", label: "Tỷ lệ đạt thử việc (%)" },
        { key: "avg_kpi_score", label: "Điểm KPI trung bình" },
        { key: "retention_1year", label: "Tỷ lệ gắn bó > 1 năm" },
        { key: "overall_rating", label: "Đánh giá tổng quan" },
      ], ["Phạm vi đánh giá: Toàn công ty", "Năm: 2026"]),
      report("rec_candidates_interview", "Bảng kê đánh giá tuyển dụng", [
        { key: "candidateCode", label: "Mã ứng viên" },
        { key: "fullName", label: "Họ và tên" },
        { key: "positionName", label: "Vị trí ứng tuyển" },
        { key: "departmentName", label: "Bộ phận" },
        { key: "candidateStatus", label: "Trạng thái" },
        { key: "evaluationDate", label: "Ngày đánh giá" },
        { key: "result", label: "Kết quả" },
        { key: "comment", label: "Nhận xét" },
        { key: "evaluatorName", label: "Người đánh giá" },
        { key: "recruitmentRequestCode", label: "Yêu cầu tuyển dụng" },
      ], ["Thời gian: Ngày đánh giá phỏng vấn", "Trạng thái: Tất cả", "Kết quả: Tất cả"], {
        endpoint: "/reports/recruitment-evaluations",
        filters: ["date", "department", "position", "status", "result"],
        summary: [
          { key: "totalEvaluations", label: "Tổng phiếu đánh giá" },
          { key: "passedCount", label: "Đạt" },
          { key: "failedCount", label: "Không đạt" },
          { key: "otherCount", label: "Chưa kết luận" },
        ],
        chart: {
          labelKey: "result",
          series: [{ key: "count", label: "Số phiếu", tone: "teal" }],
        },
      }),
      report("rec_candidates_offer", "Danh sách ứng viên trúng offer", [
        { key: "candidate_code", label: "Mã UV" },
        { key: "full_name", label: "Họ và tên" },
        { key: "apply_position", label: "Vị trí nhận việc" },
        { key: "offer_code", label: "Mã Offer" },
        { key: "offered_salary", label: "Mức lương đề xuất (VNĐ)" },
        { key: "start_date", label: "Ngày nhận việc dự kiến" },
        { key: "offer_status", label: "Trạng thái Offer" },
      ], ["Trạng thái Offer: Đã đồng ý / Chờ phản hồi"]),
      report("rec_candidates_hired", "Danh sách ứng viên đi làm", [
        { key: "candidate_code", label: "Mã UV" },
        { key: "emp_code", label: "Mã NV mới" },
        { key: "full_name", label: "Họ và tên" },
        { key: "dept_name", label: "Phòng ban nhận việc" },
        { key: "position_name", label: "Vị trí công tác" },
        { key: "onboard_date", label: "Ngày vào làm" },
        { key: "mentor_name", label: "Người hướng dẫn" },
        { key: "status", label: "Trạng thái" },
      ], ["Tháng tiếp nhận: 08/2026"]),
    ],
  },
  {
    id: "hr",
    title: "Báo cáo nhân sự",
    reports: [
      report("hr_turnover", "Báo cáo biến động nhân sự", [
        { key: "employeeCode", label: "Mã NV" },
        { key: "fullName", label: "Họ và tên" },
        { key: "departmentName", label: "Bộ phận" },
        { key: "positionName", label: "Vị trí" },
        { key: "movementType", label: "Loại biến động" },
        { key: "movementDate", label: "Ngày biến động" },
      ], ["Thời gian: Từ ngày - Đến ngày", "Bộ phận: Tất cả", "Vị trí: Tất cả"], {
        endpoint: "/reports/headcount-movement",
        filters: ["date", "department", "position"],
        summary: [
          { key: "beginning", label: "Đầu kỳ" },
          { key: "increased", label: "Tăng trong kỳ" },
          { key: "decreased", label: "Giảm trong kỳ" },
          { key: "ending", label: "Cuối kỳ" },
          { key: "averageHeadcount", label: "Nhân sự bình quân" },
          { key: "turnoverRate", label: "Tỷ lệ biến động", format: "percent" },
        ],
        chart: {
          labelKey: "metric",
          series: [{ key: "count", label: "Nhân sự", tone: "teal" }],
        },
      }),
      report("hr_summary", "Báo cáo cơ cấu nhân sự hiện tại", [
        { key: "departmentName", label: "Bộ phận" },
        { key: "positionName", label: "Vị trí" },
        { key: "totalEmployees", label: "Tổng nhân viên" },
        { key: "maleCount", label: "Nam" },
        { key: "femaleCount", label: "Nữ" },
        { key: "otherCount", label: "Khác / Chưa xác định" },
        { key: "averageAge", label: "Tuổi trung bình" },
      ], ["Mốc thời gian: Tại thời điểm chạy báo cáo", "Trạng thái: Đang làm việc"], {
        endpoint: "/reports/headcount-structure",
        filters: ["department", "position"],
        summary: [
          { key: "totalEmployees", label: "Tổng nhân viên" },
          { key: "maleCount", label: "Nam" },
          { key: "femaleCount", label: "Nữ" },
          { key: "otherCount", label: "Khác / Chưa xác định" },
          { key: "averageAge", label: "Tuổi trung bình" },
        ],
        chart: {
          labelKey: "departmentName",
          series: [{ key: "totalEmployees", label: "Nhân viên", tone: "teal" }],
        },
      }),
      report("hr_employees", "Danh sách hồ sơ nhân sự", [
        { key: "employeeCode", label: "Mã NV" },
        { key: "fullName", label: "Họ và tên" },
        { key: "departmentName", label: "Bộ phận" },
        { key: "positionName", label: "Vị trí" },
        { key: "joinDate", label: "Ngày vào làm" },
        { key: "status", label: "Trạng thái" },
        { key: "resignationDate", label: "Ngày nghỉ việc" },
      ], ["Bộ phận: Tất cả", "Vị trí: Tất cả", "Trạng thái: Tất cả"], {
        endpoint: "/reports/employees",
        filters: ["department", "position", "status"],
        summary: [
          { key: "totalEmployees", label: "Tổng hồ sơ" },
          { key: "workingCount", label: "Đang làm việc" },
          { key: "resignedCount", label: "Đã nghỉ việc" },
          { key: "otherCount", label: "Khác" },
        ],
        chart: {
          labelKey: "status",
          series: [{ key: "count", label: "Hồ sơ", tone: "teal" }],
        },
      }),
      report("hr_contracts", "Báo cáo danh sách nhân viên theo hợp đồng lao động", [
        { key: "employee_code", label: "Mã NV" },
        { key: "full_name", label: "Họ và tên" },
        { key: "dept_name", label: "Phòng ban" },
        { key: "position_name", label: "Chức danh" },
        { key: "contract_code", label: "Số HĐLĐ" },
        { key: "contract_type", label: "Loại hợp đồng" },
        { key: "sign_date", label: "Ngày ký" },
        { key: "start_date", label: "Ngày hiệu lực" },
        { key: "contract_status", label: "Trạng thái HĐ" },
      ], ["Loại hợp đồng: Tất cả", "Tình trạng: Đang có hiệu lực"]),
      report("hr_seniority", "Báo cáo thâm niên làm việc", [
        { key: "employee_code", label: "Mã NV" },
        { key: "full_name", label: "Họ và tên" },
        { key: "dept_name", label: "Phòng ban" },
        { key: "position_name", label: "Chức danh" },
        { key: "join_date", label: "Ngày vào công ty" },
        { key: "seniority_years", label: "Thâm niên làm việc" },
        { key: "seniority_group", label: "Nhóm thâm niên" },
      ], ["Tính thâm niên đến: 31-08-2026"]),
      report("hr_birthdays", "Danh sách CBNV sinh nhật", [
        { key: "employee_code", label: "Mã NV" },
        { key: "full_name", label: "Họ và tên CBNV" },
        { key: "dept_name", label: "Phòng ban" },
        { key: "position_name", label: "Chức danh" },
        { key: "dob", label: "Ngày sinh (DoB)" },
        { key: "phone", label: "Số điện thoại" },
        { key: "email", label: "Email công ty" },
      ], ["Sinh nhật trong tháng: Tháng 08"]),
      report("hr_contract_terminated", "Danh sách nhân viên chấm dứt hợp đồng lao động", [
        { key: "employee_code", label: "Mã NV" },
        { key: "full_name", label: "Họ và tên" },
        { key: "dept_name", label: "Phòng ban" },
        { key: "position_name", label: "Chức danh" },
        { key: "resign_date", label: "Ngày kết thúc HĐ" },
        { key: "resign_reason", label: "Lý do chấm dứt" },
        { key: "handoff_status", label: "Bàn giao tài sản" },
      ], ["Kỳ báo cáo: Năm 2026"]),
      report("hr_resigned", "Danh sách nhân viên nghỉ việc", [
        { key: "employee_code", label: "Mã NV" },
        { key: "full_name", label: "Họ và tên" },
        { key: "dept_name", label: "Phòng ban" },
        { key: "position_name", label: "Chức danh" },
        { key: "resign_date", label: "Ngày nghỉ việc" },
        { key: "resign_reason", label: "Lý do nghỉ việc" },
        { key: "handoff_status", label: "Trạng thái bàn giao" },
      ], ["Trạng thái: Đã quyết toán thủ tục nghỉ"]),
      report("hr_asof_date", "Báo cáo nhân sự quản lý theo thời điểm", [
        { key: "dept_name", label: "Tên bộ phận / khối" },
        { key: "active_emp_asof", label: "Nhân sự chính thức" },
        { key: "manager_count", label: "Nhân sự quản lý / lãnh đạo" },
        { key: "intern_count", label: "Thực tập sinh / thử việc" },
        { key: "total_headcount", label: "Tổng định biên" },
      ], ["Thời điểm chốt dữ liệu: 31-08-2026"]),
    ],
  },
  {
    id: "evaluation",
    title: "Báo cáo đánh giá nhân sự",
    reports: [
      report("eval_detail", "Đánh giá chi tiết nhân viên", [
        { key: "criteria_code", label: "Mã tiêu chí" },
        { key: "criteria_name", label: "Tiêu chí đánh giá" },
        { key: "self_score", label: "Tự đánh giá" },
        { key: "manager_score", label: "Quản lý đánh giá" },
        { key: "weight", label: "Trọng số" },
        { key: "final_score", label: "Điểm tổng hợp" },
        { key: "notes", label: "Ghi chú" },
      ], ["Người đánh giá: Tất cả", "Nhân viên: Tất cả", "Kỳ đánh giá: Năm 2026"]),
      report("eval_summary", "Báo cáo tổng hợp đánh giá nhân viên", [
        { key: "employee_code", label: "Mã NV" },
        { key: "full_name", label: "Họ và tên" },
        { key: "dept_name", label: "Phòng ban" },
        { key: "period", label: "Kỳ đánh giá" },
        { key: "self_score", label: "Điểm tự đánh giá" },
        { key: "manager_score", label: "Điểm quản lý" },
        { key: "final_grade", label: "Xếp loại chung" },
        { key: "rank", label: "Thứ hạng" },
      ], ["Kỳ đánh giá: Đánh giá định kỳ năm 2026"]),
      report("eval_ranking", "Báo cáo tổng hợp xếp loại nhân viên", [
        { key: "grade_name", label: "Xếp loại (Grade)" },
        { key: "criteria", label: "Tiêu chuẩn xếp loại" },
        { key: "count", label: "Số lượng CBNV" },
        { key: "percentage", label: "Tỷ lệ (%)" },
        { key: "bonus_proposed", label: "Mức thưởng đề xuất" },
      ], ["Phạm vi: Toàn hệ thống BRAVO"]),
      report("eval_reward_discipline", "Báo cáo khen thưởng - kỷ luật", [
        { key: "decisionNo", label: "Số quyết định" },
        { key: "employeeCode", label: "Mã NV" },
        { key: "fullName", label: "Họ và tên" },
        { key: "departmentName", label: "Phòng ban" },
        { key: "positionName", label: "Vị trí" },
        { key: "typeLabel", label: "Loại hình" },
        { key: "amount", label: "Số tiền (VNĐ)" },
        { key: "decisionDate", label: "Ngày quyết định" },
        { key: "description", label: "Nội dung / Lý do" },
        { key: "decisionMaker", label: "Người quyết định" },
      ], ["Ngày quyết định: Từ ngày - Đến ngày", "Loại: Tất cả", "Nhân viên: Tất cả"], {
        endpoint: "/reports/reward-discipline",
        filters: ["date", "department", "position", "employee", "type"],
        summary: [
          { key: "totalDecisions", label: "Tổng quyết định" },
          { key: "rewardCount", label: "Khen thưởng" },
          { key: "disciplineCount", label: "Kỷ luật" },
        ],
        chart: {
          labelKey: "type",
          series: [{ key: "count", label: "Quyết định", tone: "teal" }],
        },
      }),
    ],
  },
];

export const reportDefinitions = reportGroups.flatMap((group) => group.reports);

export const defaultReport = reportGroups[0].reports[0];
