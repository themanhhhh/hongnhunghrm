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
  endpoint: string;
  filters: ReportFilter[];
  summary: ReportSummaryField[];
  chart: ReportChartConfig;
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
  endpoint: string,
  filters: ReportFilter[],
  summary: ReportSummaryField[],
  chart: ReportChartConfig,
): ReportDefinition => ({ id, title, columns, sampleMeta, endpoint, filters, summary, chart });

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
      ], ["Thời gian: Ngày lập yêu cầu tuyển dụng", "Bộ phận: Tất cả", "Vị trí: Tất cả"], "/reports/recruitment-result", ["date", "department", "position"], [
        { key: "requiredCount", label: "Cần tuyển" },
        { key: "appliedCount", label: "Ứng tuyển" },
        { key: "passedCount", label: "Trúng tuyển" },
        { key: "onboardedCount", label: "Đi làm" },
        { key: "passRate", label: "Tỷ lệ trúng tuyển", format: "percent" },
        { key: "onboardRate", label: "Tỷ lệ nhận việc", format: "percent" },
        { key: "fulfillmentRate", label: "Tỷ lệ hoàn thành", format: "percent" },
      ], {
        labelKey: "positionName",
        series: [
          { key: "requiredCount", label: "Cần tuyển", tone: "teal" },
          { key: "appliedCount", label: "Ứng tuyển", tone: "violet" },
          { key: "passedCount", label: "Trúng tuyển", tone: "amber" },
          { key: "onboardedCount", label: "Đi làm", tone: "rose" },
        ],
      }),
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
      ], ["Thời gian: Ngày đánh giá phỏng vấn", "Trạng thái: Tất cả", "Kết quả: Tất cả"], "/reports/recruitment-evaluations", ["date", "department", "position", "status", "result"], [
        { key: "totalEvaluations", label: "Tổng phiếu đánh giá" },
        { key: "passedCount", label: "Đạt" },
        { key: "failedCount", label: "Không đạt" },
        { key: "otherCount", label: "Chưa kết luận" },
      ], {
        labelKey: "result",
        series: [{ key: "count", label: "Số phiếu", tone: "teal" }],
      }),
    ],
  },
  {
    id: "hr",
    title: "Báo cáo nhân sự",
    reports: [
      report("hr_summary", "Báo cáo cơ cấu nhân sự hiện tại", [
        { key: "departmentName", label: "Bộ phận" },
        { key: "positionName", label: "Vị trí" },
        { key: "totalEmployees", label: "Tổng nhân viên" },
        { key: "maleCount", label: "Nam" },
        { key: "femaleCount", label: "Nữ" },
        { key: "otherCount", label: "Khác / Chưa xác định" },
        { key: "averageAge", label: "Tuổi trung bình" },
      ], ["Mốc thời gian: Tại thời điểm chạy báo cáo", "Trạng thái: Đang làm việc"], "/reports/headcount-structure", ["department", "position"], [
        { key: "totalEmployees", label: "Tổng nhân viên" },
        { key: "maleCount", label: "Nam" },
        { key: "femaleCount", label: "Nữ" },
        { key: "otherCount", label: "Khác / Chưa xác định" },
        { key: "averageAge", label: "Tuổi trung bình" },
      ], {
        labelKey: "departmentName",
        series: [{ key: "totalEmployees", label: "Nhân viên", tone: "teal" }],
      }),
      report("hr_turnover", "Báo cáo biến động nhân sự", [
        { key: "employeeCode", label: "Mã NV" },
        { key: "fullName", label: "Họ và tên" },
        { key: "departmentName", label: "Bộ phận" },
        { key: "positionName", label: "Vị trí" },
        { key: "movementType", label: "Loại biến động" },
        { key: "movementDate", label: "Ngày biến động" },
      ], ["Thời gian: Từ ngày - Đến ngày", "Bộ phận: Tất cả", "Vị trí: Tất cả"], "/reports/headcount-movement", ["date", "department", "position"], [
        { key: "beginning", label: "Đầu kỳ" },
        { key: "increased", label: "Tăng trong kỳ" },
        { key: "decreased", label: "Giảm trong kỳ" },
        { key: "ending", label: "Cuối kỳ" },
        { key: "averageHeadcount", label: "Nhân sự bình quân" },
        { key: "turnoverRate", label: "Tỷ lệ biến động", format: "percent" },
      ], {
        labelKey: "metric",
        series: [{ key: "count", label: "Nhân sự", tone: "teal" }],
      }),
      report("hr_employees", "Danh sách hồ sơ nhân sự", [
        { key: "employeeCode", label: "Mã NV" },
        { key: "fullName", label: "Họ và tên" },
        { key: "departmentName", label: "Bộ phận" },
        { key: "positionName", label: "Vị trí" },
        { key: "joinDate", label: "Ngày vào làm" },
        { key: "status", label: "Trạng thái" },
        { key: "resignationDate", label: "Ngày nghỉ việc" },
      ], ["Bộ phận: Tất cả", "Vị trí: Tất cả", "Trạng thái: Tất cả"], "/reports/employees", ["department", "position", "status"], [
        { key: "totalEmployees", label: "Tổng hồ sơ" },
        { key: "workingCount", label: "Đang làm việc" },
        { key: "resignedCount", label: "Đã nghỉ việc" },
        { key: "otherCount", label: "Khác" },
      ], {
        labelKey: "status",
        series: [{ key: "count", label: "Hồ sơ", tone: "teal" }],
      }),
    ],
  },
  {
    id: "reward-discipline",
    title: "Báo cáo khen thưởng - kỷ luật",
    reports: [
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
      ], ["Ngày quyết định: Từ ngày - Đến ngày", "Loại: Tất cả", "Nhân viên: Tất cả"], "/reports/reward-discipline", ["date", "department", "position", "employee", "type"], [
        { key: "totalDecisions", label: "Tổng quyết định" },
        { key: "rewardCount", label: "Khen thưởng" },
        { key: "disciplineCount", label: "Kỷ luật" },
      ], {
        labelKey: "type",
        series: [{ key: "count", label: "Quyết định", tone: "teal" }],
      }),
    ],
  },
];

export const reportDefinitions = reportGroups.flatMap((group) => group.reports);

export const defaultReport = reportGroups[0].reports[0];
