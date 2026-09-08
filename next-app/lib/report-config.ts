export type ReportColumn = { key: string; label: string };

export type ReportDefinition = {
  id: string;
  title: string;
  columns: ReportColumn[];
  sampleMeta: string[];
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
): ReportDefinition => ({ id, title, columns, sampleMeta });

export const reportGroups: ReportGroup[] = [
  {
    id: "recruitment",
    title: "Báo cáo tuyển dụng",
    reports: [
      report("rec_result", "Báo cáo kết quả tuyển dụng", [
        { key: "department_name", label: "Bộ phận" },
        { key: "position_name", label: "Vị trí" },
        { key: "required_quantity", label: "Số lượng cần tuyển" },
        { key: "hired_quantity", label: "Số lượng đã tuyển" },
        { key: "remaining_quantity", label: "Còn thiếu" },
      ], ["Thời gian: Tùy chọn", "Bộ phận: Tất cả", "Vị trí: Tất cả"]),
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
      report("rec_candidates_interview", "Danh sách ứng viên tham gia phỏng vấn, thi tuyển", [
        { key: "candidate_code", label: "Mã UV" },
        { key: "full_name", label: "Họ và tên ứng viên" },
        { key: "apply_position", label: "Vị trí ứng tuyển" },
        { key: "interview_round", label: "Vòng phỏng vấn" },
        { key: "interview_date", label: "Ngày phỏng vấn" },
        { key: "interviewer_name", label: "Người phỏng vấn" },
        { key: "result", label: "Kết quả" },
      ], ["Trạng thái phỏng vấn: Tất cả", "Người phỏng vấn: Tất cả"]),
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
        { key: "period", label: "Kỳ / Tháng" },
        { key: "start_count", label: "Nhân sự đầu kỳ" },
        { key: "new_hired", label: "Nhân sự tuyển mới" },
        { key: "resigned", label: "Nhân sự nghỉ việc" },
        { key: "end_count", label: "Nhân sự cuối kỳ" },
        { key: "turnover_rate", label: "Tỷ lệ biến động (%)" },
      ], ["Thời gian: Năm 2026", "Phòng ban: Toàn công ty"]),
      report("hr_summary", "Báo cáo tổng hợp nhân sự", [
        { key: "dept_code", label: "Mã phòng" },
        { key: "dept_name", label: "Tên phòng ban / bộ phận" },
        { key: "total_emp", label: "Tổng số NV" },
        { key: "male_count", label: "Nam" },
        { key: "female_count", label: "Nữ" },
        { key: "bachelor_count", label: "Trình độ Đại học" },
        { key: "master_count", label: "Trình độ Thạc sĩ trở lên" },
      ], ["Tính đến ngày: 31/08/2026"]),
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
      ], ["Tính thâm niên đến: 31/08/2026"]),
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
      ], ["Thời điểm chốt dữ liệu: 31/08/2026"]),
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
      report("eval_reward_discipline", "Báo cáo đề xuất thưởng phạt", [
        { key: "decision_number", label: "Số quyết định" },
        { key: "title", label: "Tiêu đề / Hình thức" },
        { key: "employee_code", label: "Mã NV" },
        { key: "full_name", label: "Họ và tên" },
        { key: "dept_name", label: "Phòng ban" },
        { key: "record_type", label: "Loại hình" },
        { key: "amount", label: "Số tiền (VNĐ)" },
        { key: "effective_date", label: "Ngày hiệu lực" },
        { key: "reason", label: "Lý do" },
      ], ["Hình thức: Thưởng / Kỷ luật", "Năm: 2026"]),
    ],
  },
];

export const reportDefinitions = reportGroups.flatMap((group) => group.reports);

export const defaultReport = reportGroups[2].reports[0];
