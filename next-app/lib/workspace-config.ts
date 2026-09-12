import { CANDIDATE_STATUS_OPTIONS } from "./candidate-status";

export type WorkspaceName = "recruitment" | "people" | "rewards";
export type FieldType = "text" | "number" | "date" | "datetime-local" | "textarea" | "select" | "json";

export type FieldOption = { value: string; label: string };
export type WorkspaceField = {
  name: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  options?: FieldOption[];
  span?: 1 | 2;
};

export type WorkspaceColumn = { key: string; label: string };
export type WorkspaceTab = {
  id: string;
  label: string;
  endpoint: string;
  idField: string;
  columns: WorkspaceColumn[];
  fields: WorkspaceField[];
  readOnly?: boolean;
  approve?: boolean;
};

const select = (name: string, label: string, options: FieldOption[], required = false): WorkspaceField => ({ name, label, type: "select", options, required });
const text = (name: string, label: string, placeholder?: string, required = false, span: 1 | 2 = 1): WorkspaceField => ({ name, label, placeholder, required, span });
const date = (name: string, label: string, required = false): WorkspaceField => ({ name, label, type: "date", required });
const datetime = (name: string, label: string, required = false): WorkspaceField => ({ name, label, type: "datetime-local", required });
const number = (name: string, label: string, required = false): WorkspaceField => ({ name, label, type: "number", required });
const area = (name: string, label: string, placeholder?: string, span: 1 | 2 = 2): WorkspaceField => ({ name, label, type: "textarea", placeholder, span });
const json = (name: string, label: string, placeholder: string): WorkspaceField => ({ name, label, type: "json", placeholder, span: 2 });

const employeeFields: WorkspaceField[] = [
  text("full_name", "Họ và tên", "Nguyễn Văn A", true, 2),
  text("employee_code", "Mã nhân viên", "Tự sinh nếu bỏ trống"),
  text("short_name", "Tên viết tắt"),
  select("gender", "Giới tính", [{ value: "Nam", label: "Nam" }, { value: "Nữ", label: "Nữ" }]),
  date("date_of_birth", "Ngày sinh"),
  text("citizen_id", "Số CCCD"),
  text("phone", "Số điện thoại"),
  text("email", "Email công ty", "name@bravo.com.vn"),
  text("personal_email", "Email cá nhân"),
  text("company_email", "Email cơ quan", "name@bravo.com.vn"),
  text("address", "Địa chỉ hiện tại", undefined, false, 2),
  text("permanent_address", "Địa chỉ thường trú", undefined, false, 2),
  text("department_id", "Mã phòng ban", "Ví dụ: dept-hr", true),
  text("position_id", "Mã vị trí", "Ví dụ: pos-hr-emp", true),
  text("manager_id", "Mã quản lý trực tiếp"),
  select("level", "Cấp bậc", [{ value: "Nhân viên", label: "Nhân viên" }, { value: "Trưởng nhóm", label: "Trưởng nhóm" }, { value: "Trưởng phòng", label: "Trưởng phòng" }, { value: "Ban Giám Đốc", label: "Ban Giám Đốc" }]),
  date("join_date", "Ngày vào làm", true),
  date("official_date", "Ngày chính thức"),
  select("employment_status", "Trạng thái", [{ value: "WORKING", label: "Đang làm việc" }, { value: "RESIGNED", label: "Nghỉ việc" }]),
  text("place_of_birth", "Nơi sinh"),
  text("hometown", "Nguyên quán"),
  text("nationality", "Quốc tịch"),
  text("ethnicity", "Dân tộc"),
  text("religion", "Tôn giáo"),
  text("marital_status", "Tình trạng hôn nhân"),
  select("is_foreign", "Nhân sự nước ngoài", [{ value: "0", label: "Không" }, { value: "1", label: "Có" }]),
  text("citizen_issue_place", "Nơi cấp CCCD"),
  date("citizen_issue_date", "Ngày cấp CCCD"),
  date("citizen_expiry_date", "Ngày hết hạn CCCD"),
  date("resignation_date", "Ngày nghỉ việc"),
  date("initial_contract_date", "Ngày hợp đồng đầu tiên"),
  text("blood_type", "Nhóm máu"),
  text("tax_code", "Mã số thuế"),
  text("emergency_contact_name", "Người liên hệ khẩn cấp"),
  text("emergency_contact_relationship", "Quan hệ liên hệ khẩn cấp"),
  text("emergency_contact_phone", "SĐT liên hệ khẩn cấp"),
  text("bank_account_number", "Số tài khoản"),
  text("bank_account_holder", "Chủ tài khoản"),
  text("bank_name", "Ngân hàng"),
  text("bank_branch", "Chi nhánh ngân hàng"),
  text("culture_level", "Trình độ văn hóa"),
  text("education_level", "Trình độ đào tạo"),
  text("education_school", "Trường đào tạo"),
  text("major", "Chuyên ngành"),
  number("gpa", "Điểm trung bình"),
  number("graduation_year", "Năm tốt nghiệp"),
  text("candidate_id", "Mã ứng viên"),
  area("note", "Ghi chú"),
];

const recruitmentTabs: WorkspaceTab[] = [
  {
    id: "quota", label: "Định biên nhân sự", endpoint: "/hr/quotas", idField: "quota_id", approve: true,
    columns: [{ key: "quota_code", label: "Số phiếu" }, { key: "department_name", label: "Bộ phận" }, { key: "target_headcount", label: "Tổng định biên" }, { key: "current_headcount", label: "Hiện tại" }, { key: "needed_headcount", label: "Cần tuyển" }, { key: "status", label: "Trạng thái" }],
    fields: [date("created_date", "Ngày lập phiếu"), date("effective_date", "Ngày áp dụng", true), text("department_id", "Mã bộ phận", "dept-hr", true), text("creator_name", "Người lập", undefined, true), number("target_headcount", "Tổng định biên", true), number("max_capacity", "Sức chứa tối đa", true), number("current_headcount", "Số lượng hiện tại"), number("needed_headcount", "Cần tuyển"), number("budget", "Ngân sách tuyển dụng"), select("status", "Trạng thái", [{ value: "Tạo phiếu", label: "Tạo phiếu" }, { value: "Đang duyệt", label: "Đang duyệt" }, { value: "Đã hoàn thiện", label: "Đã hoàn thiện" }, { value: "Từ chối", label: "Từ chối" }]), json("details", "Chi tiết theo vị trí", '[{"position_id":"pos-hr-emp","position_code":"PHR_EMP","position_name":"Nhân viên Nhân sự","target_headcount":2,"resignation_count":0,"maternity_count":0,"current_headcount":1,"needed_headcount":1,"note":""}]'), json("budget_details", "Phân rã ngân sách (JSON)", '[{"cost_type":"Đăng tin tuyển dụng","source":"TopCV","estimated_cost":5000000}]'), area("description", "Diễn giải")],
  },
  {
    id: "plans", label: "Kế hoạch tuyển dụng", endpoint: "/recruitment/plans", idField: "recruitment_plan_id",
    columns: [{ key: "plan_name", label: "Tên kế hoạch" }, { key: "request_code", label: "Yêu cầu" }, { key: "department_name", label: "Bộ phận" }, { key: "start_date", label: "Từ ngày" }, { key: "end_date", label: "Đến ngày" }, { key: "status", label: "Trạng thái" }],
    fields: [text("recruitment_request_id", "Mã yêu cầu tuyển dụng", "req-...", true), text("plan_name", "Tên kế hoạch", undefined, true, 2), date("start_date", "Ngày bắt đầu", true), date("end_date", "Ngày kết thúc", true), number("budget", "Ngân sách"), area("note", "Ghi chú")],
  },
  {
    id: "requests", label: "Yêu cầu tuyển dụng", endpoint: "/recruitment/requests", idField: "recruitment_request_id", approve: true,
    columns: [{ key: "request_code", label: "Mã yêu cầu" }, { key: "position_name", label: "Vị trí" }, { key: "department_name", label: "Bộ phận" }, { key: "quantity", label: "SL" }, { key: "priority", label: "Ưu tiên" }, { key: "status", label: "Trạng thái" }],
    fields: [text("request_code", "Số phiếu"), date("created_date", "Ngày lập phiếu", true), select("is_outside_headcount", "Loại yêu cầu", [{ value: "0", label: "Trong định biên" }, { value: "1", label: "Ngoài định biên" }], true), text("quota_id", "Phiếu định biên"), text("requested_by", "Người lập", "Chọn người lập", true), text("department_id", "Bộ phận", "Chọn bộ phận", true), text("position_id", "Vị trí", "Chọn vị trí", true), number("quantity", "Số lượng cần tuyển", true), date("expected_date", "Ngày cần người", true), area("reason", "Lý do cần tuyển", undefined, 2), area("note", "Ghi chú", undefined, 2)],
  },
  {
    id: "candidates", label: "Hồ sơ ứng viên", endpoint: "/recruitment/candidates", idField: "candidate_id",
    columns: [{ key: "candidate_code", label: "Mã ứng viên" }, { key: "full_name", label: "Họ tên" }, { key: "apply_position_name", label: "Vị trí ứng tuyển" }, { key: "phone", label: "Điện thoại" }, { key: "source", label: "Nguồn" }, { key: "status", label: "Trạng thái" }],
    fields: [text("candidate_code", "Mã ứng viên"), text("full_name", "Họ và tên", undefined, true, 2), select("gender", "Giới tính", [{ value: "Nam", label: "Nam" }, { value: "Nữ", label: "Nữ" }]), date("date_of_birth", "Ngày sinh"), text("citizen_id", "Số CCCD"), text("phone", "Số điện thoại", undefined, true), text("email", "Email", undefined, true), text("address", "Địa chỉ", undefined, false, 2), text("culture_level", "Trình độ văn hóa"), select("education_level", "Trình độ đào tạo", [{ value: "Cao đẳng", label: "Cao đẳng" }, { value: "Cử nhân", label: "Cử nhân" }, { value: "Thạc sĩ", label: "Thạc sĩ" }, { value: "Tiến sĩ", label: "Tiến sĩ" }]), text("education_school", "Nơi đào tạo"), text("major", "Ngành đào tạo"), number("gpa", "Xếp loại / GPA"), text("referrer", "Người giới thiệu"), text("referrer_employee_id", "Mã người giới thiệu"), text("experience", "Kinh nghiệm làm việc", undefined, false, 2), date("received_date", "Ngày nhận hồ sơ"), text("recruitment_request_id", "Dựa trên yêu cầu"), text("position_id", "Mã vị trí"), text("department_id", "Mã bộ phận"), text("source", "Nguồn tuyển dụng"), select("status", "Trạng thái ứng viên", [...CANDIDATE_STATUS_OPTIONS]), area("note", "Ghi chú"), json("attachments_json", "Tài liệu đính kèm (JSON)", '[{"name":"CV.pdf","url":"","note":""}]')],
  },
  {
    id: "screenings", label: "Sơ loại", endpoint: "/recruitment/pre-screenings", idField: "pre_screening_id",
    columns: [{ key: "screening_code", label: "Mã phiếu" }, { key: "candidate_name", label: "Ứng viên" }, { key: "received_date", label: "Ngày nhận hồ sơ" }, { key: "position_name", label: "Vị trí" }, { key: "department_name", label: "Bộ phận" }, { key: "screening_result", label: "Kết quả" }, { key: "screening_date", label: "Ngày sơ loại" }],
    fields: [text("candidate_id", "Mã ứng viên", "cand-...", true), date("received_date", "Ngày nhận hồ sơ"), text("culture_level", "Trình độ văn hóa"), text("education_level", "Trình độ chuyên môn"), text("education_school", "Trường đào tạo"), text("position_id", "Mã vị trí"), text("department_id", "Mã bộ phận"), date("screening_date", "Ngày sơ loại", true), number("level_score", "Mức độ phù hợp (0-10)", true), select("screening_result", "Kết quả", [{ value: "ĐẠT", label: "Đạt" }, { value: "KHÔNG ĐẠT", label: "Không đạt" }]), area("comment", "Ghi chú đánh giá"), json("criteria", "Tiêu chí sơ loại (JSON)", '[{"criteria_type":"Năng lực chuyên môn","required_from":"","candidate_value":"","candidate_description":"","is_passed":true,"note":""}]')],
  },
  {
    id: "schedules", label: "Lịch phỏng vấn", endpoint: "/recruitment/interview-schedules", idField: "schedule_id",
    columns: [{ key: "schedule_code", label: "Mã lịch" }, { key: "round_type", label: "Vòng" }, { key: "format_type", label: "Hình thức" }, { key: "start_time", label: "Bắt đầu" }, { key: "location", label: "Địa điểm / Link" }, { key: "status", label: "Trạng thái" }],
    fields: [text("schedule_code", "Mã lịch"), select("round_type", "Vòng tuyển dụng", [{ value: "Vòng phỏng vấn", label: "Vòng phỏng vấn" }, { value: "Vòng thi tuyển", label: "Vòng thi tuyển" }]), select("format_type", "Hình thức", [{ value: "Offline", label: "Offline" }, { value: "Online", label: "Online" }]), text("location", "Địa điểm / Link họp", undefined, true, 2), datetime("start_time", "Thời điểm bắt đầu", true), datetime("end_time", "Thời điểm kết thúc", true), area("note", "Ghi chú hội đồng"), area("candidate_note", "Lưu ý ứng viên"), json("candidates", "Danh sách ứng viên (JSON)", '[{"candidate_id":"cand-...","note":""}]'), json("council", "Hội đồng tuyển dụng (JSON)", '[{"employee_id":"emp-...","is_decision_maker":1}]'), json("tests", "Bài thi và đáp án (JSON)", '[{"test_name":"Bài thi chuyên môn","expected_score":80,"duration_minutes":45,"exam_file_name":""}]')],
  },
  {
    id: "interview-evaluations", label: "Đánh giá phỏng vấn", endpoint: "/recruitment/interview-evaluations", idField: "interview_eval_id",
    columns: [{ key: "eval_code", label: "Mã phiếu" }, { key: "candidate_name", label: "Ứng viên" }, { key: "schedule_code", label: "Lịch" }, { key: "level_score", label: "Điểm" }, { key: "overall_result", label: "Kết quả" }, { key: "overall_comment", label: "Nhận xét" }],
     fields: [text("eval_code", "Số phiếu"), date("evaluation_date", "Ngày đánh giá", true), text("schedule_id", "Số lịch", undefined, true), text("candidate_id", "Mã ứng viên", undefined, true), text("evaluator_id", "Người đánh giá"), number("duration_minutes", "Thời lượng (phút)"), number("level_score", "Điểm phỏng vấn (1-5)", true), select("overall_result", "Kết quả", [{ value: "ĐẠT", label: "Đạt" }, { value: "KHÔNG ĐẠT", label: "Không đạt" }]), area("overall_comment", "Nhận xét chung", undefined, 2), json("script", "Kịch bản hỏi đáp (JSON)", '[{"question":"","expectation":"","answer":""}]'), json("criteria", "Tiêu chí đánh giá (JSON)", '[{"criteria_type":"Năng lực chuyên môn","required_from":"","candidate_value":"","candidate_description":"","is_passed":true,"note":""}]'), json("offer", "Thông tin offer (JSON)", '{}')],
  },
  {
    id: "offers", label: "Offer", endpoint: "/recruitment/offers", idField: "offer_id",
    columns: [{ key: "candidate_code", label: "Mã ứng viên" }, { key: "candidate_name", label: "Ứng viên" }, { key: "offer_date", label: "Ngày Offer" }, { key: "expected_start_date", label: "Ngày đi làm" }, { key: "salary_offer", label: "Lương chính thức" }, { key: "offer_status", label: "Trạng thái" }],
    fields: [text("candidate_id", "Mã ứng viên", "cand-...", true), date("offer_date", "Ngày Offer", true), date("expected_start_date", "Ngày dự kiến đi làm", true), number("probation_salary", "Lương thử việc", true), number("official_salary", "Lương chính thức", true), select("offer_status", "Trạng thái Offer", [{ value: "Đã phát hành", label: "Đã phát hành" }, { value: "Đã chấp nhận", label: "Đã chấp nhận" }, { value: "Từ chối", label: "Từ chối" }]), area("note", "Ghi chú")],
  },
  {
    id: "decisions", label: "Quyết định trúng tuyển", endpoint: "/recruitment/decisions", idField: "decision_id",
    columns: [{ key: "decision_number", label: "Số phiếu" }, { key: "candidate_name", label: "Ứng viên" }, { key: "decision_date", label: "Ngày quyết định" }, { key: "result", label: "Kết quả" }, { key: "overall_comment", label: "Đánh giá chung" }],
    fields: [text("decision_number", "Số phiếu"), date("decision_date", "Ngày quyết định", true), text("candidate_id", "Ứng viên", undefined, true), text("interview_eval_id", "Phiếu đánh giá phỏng vấn", undefined, true), select("result", "Kết quả", [{ value: "ĐẠT", label: "Đạt" }, { value: "KHÔNG ĐẠT", label: "Không đạt" }], true), area("rejection_reason", "Lý do bị loại"), area("overall_comment", "Đánh giá chung", undefined, 2)],
  },
];

const peopleTabs: WorkspaceTab[] = [
  {
    id: "employees", label: "Hồ sơ nhân sự", endpoint: "/hr/employees", idField: "employee_id",
    columns: [{ key: "employee_code", label: "Mã NV" }, { key: "full_name", label: "Họ tên" }, { key: "department_name", label: "Bộ phận" }, { key: "position_name", label: "Vị trí" }, { key: "join_date", label: "Ngày vào làm" }, { key: "employment_status", label: "Trạng thái" }],
    fields: employeeFields,
  },
  {
    id: "contracts", label: "Hợp đồng lao động", endpoint: "/hr/contracts", idField: "contract_id",
    columns: [{ key: "contract_no", label: "Số hợp đồng" }, { key: "employee_name", label: "Nhân viên" }, { key: "contract_type", label: "Loại hợp đồng" }, { key: "start_date", label: "Từ ngày" }, { key: "end_date", label: "Đến ngày" }, { key: "status", label: "Trạng thái" }],
    fields: [text("contract_no", "Số HĐ"), date("contract_date", "Ngày HĐ", true), date("sign_date", "Ngày ký chính thức"), text("signer_id", "Mã người ký"), text("signer_name", "Người ký"), text("signer_position", "Vị trí người ký"), text("employee_id", "Mã nhân viên", undefined, true), text("employee_position", "Vị trí nhân viên"), text("contract_type", "Loại HĐLĐ", undefined, true), date("start_date", "Từ ngày", true), date("end_date", "Đến ngày"), select("has_probation", "Có thử việc", [{ value: "0", label: "Không" }, { value: "1", label: "Có" }]), date("probation_from_date", "Bắt đầu thử việc"), date("probation_to_date", "Kết thúc thử việc"), number("probation_salary_rate", "Tỷ lệ lương thử việc"), text("salary_scale", "Thang lương"), text("salary_grade", "Bậc lương"), number("base_salary", "Lương cơ bản"), number("social_insurance_salary", "Lương đóng BHXH"), number("salary", "Mức lương hợp đồng"), select("status", "Trạng thái", [{ value: "ACTIVE", label: "Đang hiệu lực" }, { value: "TERMINATED", label: "Đã chấm dứt" }]), json("allowance_details", "Phụ cấp (JSON)", '[{"allowance_type":"Ăn trưa","amount":500000}]'), area("job_description", "Mô tả công việc"), text("attachment_url", "Tệp đính kèm"), area("note", "Ghi chú"), json("appendices", "Phụ lục hợp đồng (JSON)", '[]')],
  },
  {
    id: "expiring-contracts", label: "HĐ sắp hết hạn", endpoint: "/hr/expiring-contracts", idField: "contract_id", readOnly: true,
    columns: [{ key: "contract_no", label: "Số hợp đồng" }, { key: "employee_name", label: "Nhân viên" }, { key: "department_name", label: "Bộ phận" }, { key: "end_date", label: "Ngày hết hạn" }, { key: "contract_type", label: "Loại hợp đồng" }, { key: "status", label: "Trạng thái" }],
    fields: [],
  },
  {
    id: "leave", label: "Đơn xin nghỉ phép", endpoint: "/hr/leave-applications", idField: "leave_id", approve: true,
    columns: [{ key: "leave_code", label: "Mã đơn" }, { key: "employee_name", label: "Nhân viên" }, { key: "start_date", label: "Từ ngày" }, { key: "end_date", label: "Đến ngày" }, { key: "total_days", label: "Số ngày" }, { key: "status", label: "Trạng thái" }],
    fields: [text("employee_id", "Mã nhân viên", undefined, true), date("start_date", "Ngày bắt đầu", true), date("end_date", "Ngày kết thúc", true), number("total_days", "Tổng số ngày", true), select("leave_type", "Loại nghỉ phép", [{ value: "ANNUAL", label: "Nghỉ phép năm" }, { value: "SICK", label: "Nghỉ ốm" }, { value: "MATERNITY", label: "Nghỉ thai sản" }, { value: "UNPAID", label: "Nghỉ không lương" }], true), text("approver_id", "Mã người duyệt"), text("related_person_id", "Người liên quan"), area("reason", "Lý do", undefined, 2), json("details_json", "Chi tiết ngày nghỉ (JSON)", '[{"date":"2026-01-01","time_option":"Cả ngày","days":1,"note":""}]')],
  },
  {
    id: "transfer-proposals", label: "Đề xuất thuyên chuyển, bổ nhiệm", endpoint: "/hr/transfer-proposals", idField: "proposal_id", approve: true,
    columns: [{ key: "proposal_code", label: "Mã đề xuất" }, { key: "employee_name", label: "Nhân viên" }, { key: "decision_type", label: "Loại quyết định" }, { key: "effective_date", label: "Ngày hiệu lực" }, { key: "status", label: "Trạng thái" }],
    fields: [text("proposal_code", "Số đề xuất"), date("proposal_date", "Ngày đề xuất", true), date("effective_date", "Ngày hiệu lực đề xuất", true), select("decision_type", "Loại quyết định", [{ value: "Thuyên chuyển", label: "Thuyên chuyển" }, { value: "Bổ nhiệm", label: "Bổ nhiệm" }, { value: "Miễn nhiệm", label: "Miễn nhiệm" }], true), text("proposer_id", "Mã người đề xuất"), text("proposer_name", "Người đề xuất"), text("proposer_position", "Vị trí người đề xuất"), text("proposer_department", "Bộ phận đề xuất"), json("detail_items", "Chi tiết nhân sự (JSON)", '[{"employee_id":"emp-...","target_department_id":"dept-...","target_position_id":"pos-...","note":""}]'), area("description", "Diễn giải"), area("note", "Ghi chú")],
  },
  {
    id: "transfer-decisions", label: "Quyết định thuyên chuyển, bổ nhiệm, miễn nhiệm", endpoint: "/hr/transfer-decisions", idField: "decision_id",
    columns: [{ key: "decision_number", label: "Số quyết định" }, { key: "employee_name", label: "Nhân viên" }, { key: "target_dept_name", label: "Bộ phận mới" }, { key: "target_pos_name", label: "Vị trí mới" }, { key: "effective_date", label: "Ngày hiệu lực" }, { key: "status", label: "Trạng thái" }],
    fields: [text("proposal_id", "Đề xuất liên quan"), text("decision_number", "Số quyết định"), date("decision_date", "Ngày quyết định", true), date("effective_date", "Ngày hiệu lực", true), select("decision_type", "Loại quyết định", [{ value: "Thuyên chuyển", label: "Thuyên chuyển" }, { value: "Bổ nhiệm", label: "Bổ nhiệm" }, { value: "Miễn nhiệm", label: "Miễn nhiệm" }], true), text("creator_id", "Mã người lập"), text("creator_name", "Người lập"), text("creator_position", "Vị trí người lập"), text("creator_department", "Bộ phận người lập"), text("employee_id", "Mã nhân viên", undefined, true), text("target_department_id", "Bộ phận mới"), text("target_position_id", "Vị trí mới"), text("manager_id", "Quản lý trực tiếp mới"), json("detail_items", "Chi tiết quyết định (JSON)", '[{"employee_id":"emp-...","current_department_id":"dept-...","current_position_id":"pos-...","target_department_id":"dept-...","target_position_id":"pos-...","manager_id":"emp-...","note":""}]'), area("description", "Diễn giải"), text("signed_by", "Người ký"), area("reason", "Lý do"), area("note", "Ghi chú")],
  },
];

const rewardTabs: WorkspaceTab[] = [
  {
    id: "criteria", label: "Tiêu chí đánh giá", endpoint: "/reward-discipline/criteria", idField: "criteria_id",
    columns: [{ key: "criteria_code", label: "Mã tiêu chí" }, { key: "criteria_name", label: "Tên tiêu chí" }, { key: "weight", label: "Trọng số (%)" }, { key: "description", label: "Mô tả" }],
    fields: [text("criteria_code", "Mã tiêu chí", undefined, true), text("criteria_name", "Tên tiêu chí", undefined, true, 2), number("weight", "Trọng số (%)", true), area("description", "Mô tả", undefined, 2), json("scales", "Thang điểm chi tiết (JSON)", '[{"grade_name":"Xuất sắc (A+)","min_score":9,"max_score":10,"description":""}]')],
  },
  {
    id: "evaluations", label: "Phiếu đánh giá", endpoint: "/reward-discipline/evaluations", idField: "evaluation_id",
    columns: [{ key: "evaluation_code", label: "Mã phiếu" }, { key: "employee_name", label: "Nhân viên" }, { key: "evaluator_name", label: "Người đánh giá" }, { key: "evaluation_quarter", label: "Kỳ đánh giá" }, { key: "year", label: "Năm" }, { key: "total_score", label: "Tổng điểm" }, { key: "grade_result", label: "Xếp loại" }],
    fields: [date("evaluation_date", "Ngày đánh giá", true), select("evaluation_quarter", "Kỳ đánh giá", [{ value: "1", label: "Quý I" }, { value: "2", label: "Quý II" }, { value: "3", label: "Quý III" }, { value: "4", label: "Quý IV" }], true), number("year", "Năm đánh giá", true), text("evaluator_id", "Mã người đánh giá", undefined, true), text("employee_id", "Mã nhân viên được đánh giá", undefined, true), text("position_id", "Mã vị trí"), text("department_id", "Mã bộ phận"), area("description", "Diễn giải", undefined, 2), json("details", "Chi tiết tiêu chí (JSON)", '[{"criteria_id":"tc-...","criteria_code":"TC-01","criteria_name":"Kết quả KPI","weight":25,"score":8,"note":""}]')],
  },
  {
    id: "proposals", label: "Đề xuất thưởng phạt", endpoint: "/reward-discipline/proposals", idField: "proposal_id", approve: true,
    columns: [{ key: "proposal_code", label: "Mã đề xuất" }, { key: "record_type", label: "Loại" }, { key: "employee_name", label: "Nhân viên" }, { key: "department_name", label: "Bộ phận" }, { key: "department_manager_name", label: "Quản lý bộ phận" }, { key: "proposal_date", label: "Ngày đề xuất" }, { key: "payment_method", label: "Hình thức" }, { key: "proposed_amount", label: "Số tiền" }, { key: "reason", label: "Lý do" }, { key: "status", label: "Trạng thái" }],
    fields: [select("record_type", "Loại đề xuất", [{ value: "KHEN_THUONG", label: "Khen thưởng" }, { value: "KY_LUAT", label: "Kỷ luật" }], true), text("employee_id", "Mã nhân viên", undefined, true), number("proposed_amount", "Số tiền"), select("payment_method", "Hình thức", [{ value: "CASH", label: "Tiền mặt" }, { value: "BANK_TRANSFER", label: "Chuyển khoản" }, { value: "NOT_APPLICABLE", label: "Không áp dụng" }]), date("proposal_date", "Ngày đề xuất"), text("proposed_by_employee_id", "Mã người đề xuất"), text("proposed_by", "Người đề xuất", undefined, true), text("attachment_url", "Tệp đính kèm"), area("reason", "Lý do", undefined, 2), area("content", "Nội dung đề xuất", undefined, 2)],
  },
  {
    id: "decisions", label: "Quyết định", endpoint: "/reward-discipline", idField: "reward_discipline_id",
    columns: [{ key: "decision_no", label: "Số quyết định" }, { key: "decision_type", label: "Loại quyết định" }, { key: "employee_name", label: "Nhân viên" }, { key: "decision_date", label: "Ngày ban hành" }, { key: "amount", label: "Số tiền" }, { key: "decision_by", label: "Người ký" }, { key: "status", label: "Trạng thái" }],
    fields: [select("decision_type", "Loại quyết định", [{ value: "KHEN_THUONG", label: "Khen thưởng" }, { value: "KY_LUAT", label: "Kỷ luật" }], true), text("proposal_id", "Đề xuất đã duyệt", undefined, true), text("employee_id", "Mã nhân viên", undefined, true), number("amount", "Số tiền"), date("decision_date", "Ngày ban hành", true), date("effective_date", "Ngày hiệu lực"), text("decision_by", "Người ký"), text("attachment_url", "Tệp đính kèm"), text("reason", "Lý do", undefined, true, 2), area("content", "Nội dung quyết định", undefined, 2)],
  },
];

export const workspaceTabs: Record<WorkspaceName, WorkspaceTab[]> = {
  recruitment: recruitmentTabs,
  people: peopleTabs,
  rewards: rewardTabs,
};

export function getWorkspaceTab(name: WorkspaceName, id: string) {
  return workspaceTabs[name].find((tab) => tab.id === id) ?? workspaceTabs[name][0];
}

export function getTabTitle(tab: WorkspaceTab) {
  return tab.label;
}
