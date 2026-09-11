import { reportDefinitions } from "./report-config";
import type { Session } from "./permissions";
import { isCandidateHiringDecisionPassed, isCandidateWorking, normalizeCandidateStatus } from "./candidate-status";

type MockRow = Record<string, unknown>;
type MockStore = Record<string, MockRow[]>;

const MOCK_STORE_KEY = "bravo_next_mock_store";

const idFields: Record<string, string> = {
  "/admin/users": "user_id",
  "/admin/roles": "role_id",
  "/admin/departments": "department_id",
  "/admin/positions": "position_id",
  "/admin/contract-types": "contract_type_id",
  "/hr/employees": "employee_id",
  "/hr/quotas": "quota_id",
  "/hr/contracts": "contract_id",
  "/hr/contract-proposals": "proposal_id",
  "/hr/contract-extensions": "extension_id",
  "/hr/expiring-contracts": "contract_id",
  "/hr/leave-applications": "leave_id",
  "/hr/transfer-proposals": "proposal_id",
  "/hr/transfer-decisions": "decision_id",
  "/hr/resignation-applications": "application_id",
  "/hr/resignation-decisions": "decision_id",
  "/hr/work-history": "work_history_id",
  "/recruitment/requests": "recruitment_request_id",
  "/recruitment/plans": "recruitment_plan_id",
  "/recruitment/candidates": "candidate_id",
  "/recruitment/pre-screenings": "pre_screening_id",
  "/recruitment/interview-schedules": "schedule_id",
  "/recruitment/interview-evaluations": "interview_eval_id",
  "/recruitment/offers": "offer_id",
  "/recruitment/decisions": "decision_id",
  "/reward-discipline/criteria": "criteria_id",
  "/reward-discipline/evaluations": "evaluation_id",
  "/reward-discipline/proposals": "proposal_id",
  "/reward-discipline": "reward_discipline_id",
};

const initialStore: MockStore = {
  "/admin/roles": [
    { role_id: "role-admin", role_name: "Administrator", description: "Quản trị toàn hệ thống" },
    { role_id: "role-hr", role_name: "HR Staff", description: "Quản lý nghiệp vụ nhân sự" },
    { role_id: "role-ceo", role_name: "Ban Giám Đốc", description: "Phê duyệt và xem báo cáo cấp cao" },
    { role_id: "role-khoi", role_name: "Trưởng Khối", description: "Quản lý phạm vi khối" },
    { role_id: "role-manager", role_name: "Trưởng Phòng", description: "Quản lý phạm vi phòng ban" },
    { role_id: "role-employee", role_name: "Nhân viên", description: "Truy cập không gian cá nhân" },
  ],
  "/admin/users": [
    { user_id: "usr-nhung", username: "admin", full_name: "Nguyễn Hồng Nhung", email: "hongnhung188888@gmail.com", phone: "0988666888", role_id: "role-admin", role_name: "Administrator", department_id: "", department_name: "Toàn hệ thống", status: 1, created_date: "2026-01-01" },
    { user_id: "usr-ceo", username: "ceo", full_name: "Bùi Xuân Thức", email: "ceo@bravo.com.vn", phone: "0988111222", role_id: "role-ceo", role_name: "Ban Giám Đốc", department_id: "dept-bgd", department_name: "Ban Giám Đốc", status: 1, created_date: "2026-01-02" },
    { user_id: "usr-mgr-kd", username: "mgr_kd", full_name: "Phạm Quốc Tuấn", email: "tuan.pq@bravo.com.vn", phone: "0977222333", role_id: "role-manager", role_name: "Trưởng Phòng", department_id: "dept-kd", department_name: "Phòng Kinh doanh", status: 1, created_date: "2026-01-03" },
    { user_id: "usr-hr", username: "HANT", full_name: "Nguyễn Thùy Linh", email: "linh.nt@bravo.com.vn", phone: "0966123456", role_id: "role-hr", role_name: "HR Staff", department_id: "dept-hr", department_name: "Phòng Nhân sự", status: 1, created_date: "2026-01-04" },
  ],
  "/admin/departments": [
    { department_id: "dept-hr", department_code: "PHR", department_name: "Phòng Nhân sự", parent_department_name: "-", manager_id: "emp-hr-01", manager_name: "Trần Thị Thu Hà", target_headcount: 8 },
    { department_id: "dept-kd", department_code: "PKD", department_name: "Phòng Kinh doanh", parent_department_name: "-", manager_id: "emp-kd-01", manager_name: "Phạm Quốc Tuấn", target_headcount: 20 },
    { department_id: "dept-cloud", department_code: "CLOUD", department_name: "Phòng Cloud và Hạ tầng", parent_department_name: "Khối Công nghệ", manager_id: "emp-cloud-manager", manager_name: "Hoàng Trọng Nghĩa", target_headcount: 10 },
  ],
  "/admin/positions": [
    { position_id: "pos-hr-emp", position_code: "PHR_EMP", position_name: "Nhân viên Nhân sự", department_id: "dept-hr", department_name: "Phòng Nhân sự", target_headcount: 5, description: "Tuyển dụng và C&B" },
    { position_id: "pos-hr-lead", position_code: "PHR_LEAD", position_name: "Trưởng phòng Nhân sự", department_id: "dept-hr", department_name: "Phòng Nhân sự", target_headcount: 1, description: "Quản lý công tác nhân sự" },
    { position_id: "pos-hr-recruiter", position_code: "PHR_REC", position_name: "Chuyên viên Tuyển dụng", department_id: "dept-hr", department_name: "Phòng Nhân sự", target_headcount: 3, description: "Tổ chức và vận hành quy trình tuyển dụng" },
    { position_id: "pos-kd-emp", position_code: "PKD_EMP", position_name: "Nhân viên Kinh doanh", department_id: "dept-kd", department_name: "Phòng Kinh doanh", target_headcount: 17, description: "Tư vấn giải pháp ERP" },
    { position_id: "pos-cloud-emp", position_code: "CLOUD_EMP", position_name: "Kỹ sư Cloud và Hạ tầng", department_id: "dept-cloud", department_name: "Phòng Cloud và Hạ tầng", target_headcount: 7, description: "Vận hành hạ tầng" },
    { position_id: "pos-cloud-lead", position_code: "CLOUD_LEAD", position_name: "Trưởng Nhóm Cloud và Hạ tầng", department_id: "dept-cloud", department_name: "Phòng Cloud và Hạ tầng", target_headcount: 2, description: "Điều phối nhóm vận hành Cloud" },
    { position_id: "pos-cloud-mgr", position_code: "CLOUD_MGR", position_name: "Trưởng Phòng Cloud và Hạ tầng", department_id: "dept-cloud", department_name: "Phòng Cloud và Hạ tầng", target_headcount: 1, description: "Quản lý hoạt động hạ tầng" },
  ],
  "/admin/contract-types": [
    { contract_type_id: "contract-type-demo-01", contract_type_code: "HDXD-12T", contract_type_name: "HĐLĐ xác định thời hạn 12 tháng", duration_months: 12, has_probation: 0, probation_days: 0, status: 1 },
    { contract_type_id: "contract-type-demo-02", contract_type_code: "HDTV", contract_type_name: "Hợp đồng thử việc", duration_months: 2, has_probation: 1, probation_days: 60, status: 1 },
  ],
  "/hr/employees": [
    { employee_id: "emp-hr-01", employee_code: "NV-2021-001", full_name: "Trần Thị Thu Hà", gender: "Nữ", department_id: "dept-hr", department_name: "Phòng Nhân sự", position_id: "pos-hr-lead", position_name: "Trưởng phòng Nhân sự", level: "Trưởng phòng", join_date: "2021-02-01", official_date: "2021-04-01", employment_status: "WORKING", email: "ha.tt@example.test", phone: "0901122334" },
    { employee_id: "emp-hr-02", employee_code: "NV-2024-005", full_name: "Nguyễn Thùy Linh", short_name: "Linh NT", gender: "Nữ", date_of_birth: "1992-03-14", place_of_birth: "Hà Nội", citizen_id: "001092012345", department_id: "dept-hr", department_name: "Phòng Nhân sự", position_id: "pos-hr-emp", position_name: "Nhân viên Nhân sự", level: "Nhân viên", manager_id: "emp-hr-01", manager_name: "Trần Thị Thu Hà", join_date: "2024-03-15", official_date: "2024-05-15", employment_status: "WORKING", email: "linh.nt@example.test", company_email: "linh.nt@bravo.com.vn", personal_email: "linh.nguyen@example.test", phone: "0966123456", address: "Tầng 5, Tòa nhà BRAVO, Hà Nội", permanent_address: "Cầu Giấy, Hà Nội", nationality: "Việt Nam", ethnicity: "Kinh", marital_status: "Độc thân", tax_code: "8123456789", bank_account_number: "1020268888", bank_account_holder: "NGUYEN THUY LINH", bank_name: "Vietcombank", note: "Nhân sự đang làm việc bình thường." },
    { employee_id: "emp-kd-01", employee_code: "NV-2024-027", full_name: "Phạm Quốc Tuấn", department_id: "dept-kd", department_name: "Phòng Kinh doanh", position_id: "pos-kd-emp", position_name: "Trưởng Phòng Kinh doanh", level: "Trưởng phòng", join_date: "2023-04-01", employment_status: "WORKING", email: "tuan.pq@example.test", phone: "0911223344" },
    { employee_id: "emp-kd-02", employee_code: "NV-2024-028", full_name: "Đặng Đình Hùng", department_id: "dept-kd", department_name: "Phòng Kinh doanh", position_id: "pos-kd-emp", position_name: "Nhân viên Kinh doanh", level: "Nhân viên", manager_id: "emp-kd-01", manager_name: "Phạm Quốc Tuấn", join_date: "2024-05-15", employment_status: "WORKING", email: "hung.dd@example.test", phone: "0933445566" },
    { employee_id: "emp-kd-03", employee_code: "NV-2025-014", full_name: "Nguyễn Minh Anh", department_id: "dept-kd", department_name: "Phòng Kinh doanh", position_id: "pos-kd-emp", position_name: "Nhân viên Kinh doanh", level: "Nhân viên", manager_id: "emp-kd-01", manager_name: "Phạm Quốc Tuấn", join_date: "2025-02-10", employment_status: "WORKING", email: "anh.nm@example.test", phone: "0908556677" },
    { employee_id: "emp-kd-04", employee_code: "NV-2025-021", full_name: "Lê Hoàng Phúc", department_id: "dept-kd", department_name: "Phòng Kinh doanh", position_id: "pos-kd-emp", position_name: "Nhân viên Kinh doanh", level: "Nhân viên", manager_id: "emp-kd-01", manager_name: "Phạm Quốc Tuấn", join_date: "2025-06-01", employment_status: "WORKING", email: "phuc.lh@example.test", phone: "0918667788" },
    { employee_id: "emp-cloud-04", employee_code: "NV-2024-100", full_name: "Đặng Việt Dũng", department_id: "dept-cloud", department_name: "Phòng Cloud và Hạ tầng", position_id: "pos-cloud-emp", position_name: "Kỹ sư Cloud và Hạ tầng", level: "Nhân viên", join_date: "2024-06-10", employment_status: "WORKING", email: "dung.dv@example.test", phone: "0966554433" },
  ],
  "/hr/quotas": [
    {
      quota_id: "quota-demo-01",
      quota_code: "DB/2026-001",
      created_date: "2026-08-01",
      effective_date: "2026-08-05",
      creator_id: "emp-hr-02",
      creator_name: "Nguyễn Thùy Linh",
      department_id: "dept-cloud",
      department_code: "CLOUD",
      department_name: "Phòng Cloud và Hạ tầng",
      target_headcount: 10,
      current_headcount: 7,
      needed_headcount: 3,
      max_capacity: 12,
      budget: 180000000,
      description: "Bổ sung nhân sự cho kế hoạch vận hành hạ tầng Cloud.",
      details: [
        { position_id: "pos-cloud-emp", position_code: "CLOUD_EMP", position_name: "Kỹ sư Cloud và Hạ tầng", target_headcount: 7, resignation_count: 0, maternity_count: 0, current_headcount: 5, needed_headcount: 2, note: "Bổ sung nhân sự trực vận hành." },
        { position_id: "pos-cloud-lead", position_code: "CLOUD_LEAD", position_name: "Trưởng Nhóm Cloud và Hạ tầng", target_headcount: 2, resignation_count: 1, maternity_count: 0, current_headcount: 1, needed_headcount: 2, note: "Dự kiến thay thế nhân sự nghỉ việc." },
        { position_id: "pos-cloud-mgr", position_code: "CLOUD_MGR", position_name: "Trưởng Phòng Cloud và Hạ tầng", target_headcount: 1, resignation_count: 0, maternity_count: 0, current_headcount: 1, needed_headcount: 0, note: "" },
      ],
      budget_details: [
        { cost_type: "Chi phí đăng tin tuyển dụng", source: "TopCV", estimated_cost: 5000000 },
        { cost_type: "Chi phí giới thiệu nhân sự nội bộ", source: "Bạn bè giới thiệu", estimated_cost: 3000000 },
      ],
      status: "Đang duyệt",
    },
    {
      quota_id: "quota-demo-02",
      quota_code: "DB/2026-002",
      created_date: "2026-08-03",
      effective_date: "2026-08-10",
      creator_id: "emp-kd-01",
      creator_name: "Phạm Quốc Tuấn",
      department_id: "dept-kd",
      department_code: "PKD",
      department_name: "Phòng Kinh doanh",
      target_headcount: 20,
      current_headcount: 17,
      needed_headcount: 3,
      max_capacity: 24,
      budget: 150000000,
      description: "Bổ sung nhân sự kinh doanh để mở rộng khách hàng doanh nghiệp trong năm 2026.",
      details: [
        { position_id: "pos-kd-emp", position_code: "PKD_EMP", position_name: "Nhân viên Kinh doanh", target_headcount: 20, resignation_count: 0, maternity_count: 0, current_headcount: 17, needed_headcount: 3, note: "Tuyển bổ sung cho kế hoạch mở rộng thị trường." },
      ],
      budget_details: [
        { cost_type: "Chi phí đăng tin tuyển dụng", source: "VietnamWorks", estimated_cost: 7000000 },
        { cost_type: "Chi phí phỏng vấn và hội nhập", source: "Ngân sách phòng Kinh doanh", estimated_cost: 3000000 },
      ],
      status: "Đã hoàn thiện",
    },
    {
      quota_id: "quota-demo-03",
      quota_code: "DB/2026-003",
      created_date: "2026-08-05",
      effective_date: "2026-08-15",
      creator_id: "emp-hr-02",
      creator_name: "Nguyễn Thùy Linh",
      department_id: "dept-hr",
      department_code: "PHR",
      department_name: "Phòng Nhân sự",
      target_headcount: 8,
      current_headcount: 6,
      needed_headcount: 2,
      max_capacity: 10,
      budget: 90000000,
      description: "Bổ sung nhân sự tuyển dụng và C&B phục vụ kế hoạch tăng trưởng.",
      details: [
        { position_id: "pos-hr-emp", position_code: "PHR_EMP", position_name: "Nhân viên Nhân sự", target_headcount: 5, resignation_count: 0, maternity_count: 0, current_headcount: 4, needed_headcount: 1, note: "Bổ sung chuyên viên C&B." },
        { position_id: "pos-hr-recruiter", position_code: "PHR_REC", position_name: "Chuyên viên Tuyển dụng", target_headcount: 3, resignation_count: 0, maternity_count: 0, current_headcount: 2, needed_headcount: 1, note: "Đáp ứng khối lượng tuyển dụng tăng." },
      ],
      budget_details: [
        { cost_type: "Chi phí đăng tin tuyển dụng", source: "TopCV", estimated_cost: 4000000 },
        { cost_type: "Chi phí đào tạo hội nhập", source: "Ngân sách HR", estimated_cost: 6000000 },
      ],
      status: "Tạo phiếu",
    },
  ],
  "/recruitment/requests": [
    { recruitment_request_id: "req-demo-01", request_code: "YCTD/2026-018", created_date: "2026-09-01", department_id: "dept-cloud", department_name: "Phòng Cloud và Hạ tầng", position_id: "pos-cloud-emp", position_name: "Kỹ sư Cloud và Hạ tầng", requested_by: "emp-cloud-04", requested_by_name: "Đặng Việt Dũng", quota_id: "quota-demo-01", quantity: 2, expected_date: "2026-10-01", is_outside_headcount: 0, status: "PENDING", reason: "Bổ sung nhân sự trực vận hành.", note: "" },
    { recruitment_request_id: "req-demo-02", request_code: "YCTD/2026-019", created_date: "2026-09-02", department_id: "dept-kd", department_name: "Phòng Kinh doanh", position_id: "pos-kd-emp", position_name: "Nhân viên Kinh doanh", requested_by: "emp-kd-01", requested_by_name: "Phạm Quốc Tuấn", quota_id: "", quantity: 2, expected_date: "2026-10-15", is_outside_headcount: 1, status: "APPROVED", reason: "Mở rộng khách hàng doanh nghiệp.", note: "" },
    { recruitment_request_id: "req-demo-03", request_code: "YCTD/2026-020", created_date: "2026-09-04", department_id: "dept-kd", department_name: "Phòng Kinh doanh", position_id: "pos-kd-emp", position_name: "Nhân viên Kinh doanh", requested_by: "emp-kd-01", requested_by_name: "Phạm Quốc Tuấn", quota_id: "quota-demo-02", quantity: 3, expected_date: "2026-10-20", is_outside_headcount: 0, status: "PENDING", reason: "Bổ sung nhân sự cho nhóm khách hàng miền Nam.", note: "Ưu tiên ứng viên có kinh nghiệm bán hàng B2B." },
    { recruitment_request_id: "req-demo-04", request_code: "YCTD/2026-021", created_date: "2026-08-25", department_id: "dept-kd", department_name: "Phòng Kinh doanh", position_id: "pos-kd-emp", position_name: "Nhân viên Kinh doanh", requested_by: "emp-kd-01", requested_by_name: "Phạm Quốc Tuấn", quota_id: "quota-demo-02", quantity: 1, expected_date: "2026-09-30", is_outside_headcount: 0, status: "IN_PROGRESS", reason: "Thay thế nhân sự điều chuyển sang bộ phận khác.", note: "" },
  ],
  "/recruitment/plans": [
    { recruitment_plan_id: "plan-demo-01", recruitment_request_id: "req-demo-01", request_code: "YCTD/2026-018", plan_name: "Kế hoạch tuyển Kỹ sư Cloud Quý IV", department_name: "Phòng Cloud và Hạ tầng", start_date: "2026-09-01", end_date: "2026-10-31", budget: 45000000, status: "IN_PROGRESS" },
  ],
  "/recruitment/candidates": [
    { candidate_id: "cand-demo-01", candidate_code: "UV-2026-001", full_name: "Lê Bảo Trâm", citizen_id: "079206001234", date_of_birth: "1998-04-12", gender: "Nữ", phone: "0909123456", email: "tram.lb@example.test", address: "Hà Nội", culture_level: "12/12", education_level: "Cử nhân", education_school: "Đại học Bách khoa", major: "Công nghệ thông tin", gpa: 8.2, experience: "3 năm vận hành Cloud", referrer: "Nguyễn Thùy Linh", referrer_employee_id: "emp-hr-02", source: "LinkedIn", created_date: "2026-08-28", received_date: "2026-08-28", recruitment_request_id: "req-demo-01", apply_position_name: "Kỹ sư Cloud và Hạ tầng", position_id: "pos-cloud-emp", department_id: "dept-cloud", department_name: "Phòng Cloud và Hạ tầng", attachments_json: [{ name: "CV_LeBaoTram.pdf", file: "CV_LeBaoTram.pdf", note: "CV bản tiếng Việt" }], status: "đã phỏng vấn" },
    { candidate_id: "cand-demo-02", candidate_code: "UV-2026-002", full_name: "Vũ Minh Khôi", citizen_id: "001203009876", date_of_birth: "1996-11-03", gender: "Nam", phone: "0903812345", email: "khoi.vm@example.test", address: "Hồ Chí Minh", culture_level: "12/12", education_level: "Thạc sĩ", education_school: "Đại học Kinh tế", major: "Quản trị kinh doanh", gpa: 8.5, experience: "5 năm kinh doanh B2B", referrer: "Phạm Quốc Tuấn", referrer_employee_id: "emp-kd-01", source: "Giới thiệu nội bộ", created_date: "2026-08-25", received_date: "2026-08-25", recruitment_request_id: "req-demo-02", apply_position_name: "Nhân viên Kinh doanh", position_id: "pos-kd-emp", department_id: "dept-kd", department_name: "Phòng Kinh doanh", attachments_json: [], status: "đã quyết định tuyển" },
    { candidate_id: "cand-demo-03", candidate_code: "UV-2026-003", full_name: "Trần Khánh Linh", citizen_id: "001198004321", date_of_birth: "1998-06-19", gender: "Nữ", phone: "0909887766", email: "linh.tk@example.test", education_level: "Cử nhân", major: "Kinh tế", experience: "2 năm kinh doanh phần mềm", referrer: "Phạm Quốc Tuấn", referrer_employee_id: "emp-kd-01", source: "VietnamWorks", created_date: "2026-09-03", received_date: "2026-09-03", recruitment_request_id: "req-demo-03", apply_position_name: "Nhân viên Kinh doanh", position_id: "pos-kd-emp", department_id: "dept-kd", department_name: "Phòng Kinh doanh", attachments_json: [], status: "tiếp nhận hồ sơ" },
    { candidate_id: "cand-demo-04", candidate_code: "UV-2026-004", full_name: "Phạm Gia Huy", citizen_id: "001198007654", date_of_birth: "1997-02-11", gender: "Nam", phone: "0908776655", email: "huy.pg@example.test", education_level: "Cử nhân", major: "Quản trị kinh doanh", experience: "3 năm bán hàng B2B", referrer: "Phạm Quốc Tuấn", referrer_employee_id: "emp-kd-01", source: "Giới thiệu nội bộ", created_date: "2026-08-30", received_date: "2026-08-30", recruitment_request_id: "req-demo-03", apply_position_name: "Nhân viên Kinh doanh", position_id: "pos-kd-emp", department_id: "dept-kd", department_name: "Phòng Kinh doanh", attachments_json: [], status: "đã phỏng vấn" },
    { candidate_id: "cand-demo-05", candidate_code: "UV-2026-005", full_name: "Ngô Tuấn Kiệt", citizen_id: "001198009999", date_of_birth: "1997-09-22", gender: "Nam", phone: "0908112233", email: "kiet.nt@example.test", education_level: "Cử nhân", major: "Kinh tế", experience: "4 năm kinh doanh doanh nghiệp", referrer: "Phạm Quốc Tuấn", referrer_employee_id: "emp-kd-01", source: "TopCV", created_date: "2026-08-20", received_date: "2026-08-20", recruitment_request_id: "req-demo-04", apply_position_name: "Nhân viên Kinh doanh", position_id: "pos-kd-emp", department_id: "dept-kd", department_name: "Phòng Kinh doanh", attachments_json: [], status: "đi làm" },
  ],
  "/recruitment/pre-screenings": [
    { pre_screening_id: "screen-demo-01", candidate_id: "cand-demo-01", screening_code: "SL/2026-001", candidate_name: "Lê Bảo Trâm", position_name: "Kỹ sư Cloud và Hạ tầng", level_score: 8, screening_result: "ĐẠT", screening_date: "2026-09-02" },
  ],
  "/recruitment/interview-schedules": [
    { schedule_id: "schedule-demo-01", schedule_code: "PV/2026-012", round_type: "Vòng phỏng vấn", format_type: "Online", start_time: "2026-09-10T09:00", location: "Microsoft Teams", candidates: [{ candidate_id: "cand-demo-02", note: "" }], council: [{ employee_id: "emp-hr-02", is_decision_maker: 1 }, { employee_id: "emp-kd-01", is_decision_maker: 0 }], status: "Đã lên lịch" },
  ],
  "/recruitment/interview-evaluations": [
    {
      interview_eval_id: "interview-demo-01",
      eval_code: "DGPV/2026-001",
      evaluation_date: "2026-09-03",
      schedule_id: "schedule-demo-01",
      evaluator_id: "emp-hr-02",
      candidate_id: "cand-demo-02",
      candidate_name: "Vũ Minh Khôi",
      schedule_code: "PV/2026-011",
      duration_minutes: 60,
      level_score: 8.5,
      overall_result: "ĐẠT",
      overall_comment: "Kỹ năng tư vấn tốt, phù hợp vị trí.",
      script: [
        {
          script_id: "script-demo-01",
          row_order: 1,
          question: "Hãy mô tả quy trình tư vấn khách hàng doanh nghiệp.",
          expectation: "Trình bày được các bước khám phá nhu cầu và đề xuất giải pháp.",
          answer: "Ứng viên trình bày rõ ràng, có ví dụ thực tế.",
        },
      ],
      criteria: [
        {
          criteria_detail_id: "criteria-detail-demo-01",
          row_order: 1,
          criteria_type: "Năng lực chuyên môn",
          required_from: "Kinh nghiệm tư vấn ERP",
          required_description: "Hiểu quy trình bán hàng giải pháp phần mềm.",
          candidate_value: "Tốt",
          candidate_description: "Có kinh nghiệm tư vấn khách hàng doanh nghiệp.",
          is_passed: 1,
          note: "Đáp ứng yêu cầu",
        },
      ],
    },
  ],
  "/recruitment/decisions": [
    { decision_id: "decision-demo-01", decision_number: "QDTD/2026-001", candidate_id: "cand-demo-02", candidate_name: "Vũ Minh Khôi", decision_date: "2026-09-05", result: "ĐẠT", status: "COMPLETED" },
  ],
  "/recruitment/offers": [
    { offer_id: "offer-demo-01", candidate_id: "cand-demo-02", candidate_code: "UV-2026-002", candidate_name: "Vũ Minh Khôi", offer_date: "2026-09-03", expected_start_date: "2026-09-15", probation_salary: 15000000, official_salary: 18000000, salary_offer: 18000000, offer_status: "Đã chấp nhận", note: "" },
  ],
  "/hr/contracts": [
    { contract_id: "contract-demo-01", contract_no: "HDLD/2026/001", contract_date: "2026-01-14", sign_date: "2026-01-14", employee_id: "emp-hr-02", employee_name: "Nguyễn Thùy Linh", employee_position: "Nhân viên Nhân sự", signer_id: "emp-hr-01", signer_name: "Trần Thị Thu Hà", signer_position: "Trưởng phòng Nhân sự", contract_type: "HĐLĐ Xác định thời hạn 12 tháng", start_date: "2026-01-15", end_date: "2027-01-14", has_probation: 0, base_salary: 18000000, social_insurance_salary: 18000000, salary: 18000000, salary_scale: "BRAVO-05", salary_grade: "Bậc 2", allowance_details: [{ allowance_type: "Ăn trưa", amount: 730000 }, { allowance_type: "Điện thoại", amount: 300000 }], job_description: "Thực hiện công tác tuyển dụng, hồ sơ và chính sách nhân sự.", status: "ACTIVE", note: "Hợp đồng đang có hiệu lực." },
    { contract_id: "contract-demo-02", contract_no: "HDTV/2026/014", employee_id: "emp-kd-03", employee_name: "Nguyễn Minh Anh", employee_position: "Nhân viên Kinh doanh", contract_type: "Hợp đồng thử việc", start_date: "2026-08-15", end_date: "2026-10-15", has_probation: 1, status: "ACTIVE", note: "Đang trong thời gian thử việc." },
  ],
  "/hr/contract-appendices": [{ appendix_id: "appendix-demo-01", contract_id: "contract-demo-01", appendix_no: "PLHD/2026/001", appendix_type: "Điều chỉnh phụ cấp", signed_date: "2026-06-30", effective_date: "2026-07-01", changed_content: "Bổ sung phụ cấp điện thoại.", note: "" }],
  "/hr/expiring-contracts": [
    { contract_id: "contract-demo-01", contract_no: "HDLD/2026/001", employee_name: "Nguyễn Thùy Linh", department_name: "Phòng Nhân sự", end_date: "2027-01-14", contract_type: "HĐLĐ Xác định thời hạn 12 tháng", status: "ACTIVE" },
  ],
  "/hr/contract-proposals": [
    { proposal_id: "proposal-demo-01", proposal_code: "DXHD/2026-001", employee_name: "Nguyễn Thùy Linh", contract_type: "HĐLĐ Xác định thời hạn 12 tháng", proposed_salary: 18000000, status: "PENDING" },
  ],
  "/hr/contract-extensions": [
    { extension_id: "extension-demo-01", extension_code: "GHD/2026-001", employee_name: "Nguyễn Thùy Linh", contract_no: "HDLD/2026/001", new_end_date: "2028-01-14", new_salary: 20000000, status: "APPROVED" },
  ],
  "/hr/leave-applications": [
    { leave_id: "leave-demo-01", leave_code: "DXNP/2026-001", employee_id: "emp-kd-01", employee_name: "Phạm Quốc Tuấn", start_date: "2026-09-08", end_date: "2026-09-09", total_days: 2, status: "PENDING", reason: "Việc gia đình" },
    { leave_id: "leave-demo-02", leave_code: "DXNP/2026-002", employee_id: "emp-hr-02", employee_name: "Nguyễn Thùy Linh", start_date: "2026-08-29", end_date: "2026-08-29", total_days: 0.5, status: "APPROVED", reason: "Khám sức khỏe" },
    { leave_id: "leave-demo-03", leave_code: "DXNP/2026-003", employee_id: "emp-kd-03", employee_name: "Nguyễn Minh Anh", department_id: "dept-kd", department_name: "Phòng Kinh doanh", start_date: "2026-09-12", end_date: "2026-09-12", total_days: 1, status: "PENDING", reason: "Giải quyết việc gia đình" },
    { leave_id: "leave-demo-04", leave_code: "DXNP/2026-004", employee_id: "emp-kd-04", employee_name: "Lê Hoàng Phúc", department_id: "dept-kd", department_name: "Phòng Kinh doanh", start_date: "2026-08-22", end_date: "2026-08-23", total_days: 2, status: "APPROVED", reason: "Về quê" },
  ],
  "/hr/transfer-proposals": [
    { proposal_id: "transfer-demo-01", proposal_code: "DXDC/2026-001", employee_id: "emp-cloud-04", employee_name: "Đặng Việt Dũng", current_department_id: "dept-cloud", current_dept_name: "Phòng Cloud và Hạ tầng", current_position_id: "pos-cloud-emp", current_pos_name: "Kỹ sư Cloud và Hạ tầng", target_department_id: "dept-kd", target_dept_name: "Phòng Kinh doanh", target_position_id: "pos-kd-emp", target_pos_name: "Nhân viên Kinh doanh", proposal_date: "2026-09-01", effective_date: "2026-10-01", decision_type: "Thuyên chuyển", proposer_id: "emp-hr-02", proposer_name: "Nguyễn Thùy Linh", proposer_position: "Nhân viên Nhân sự", proposer_department: "Phòng Nhân sự", detail_items: [{ employee_id: "emp-cloud-04", employee_name: "Đặng Việt Dũng", current_department_id: "dept-cloud", current_position_id: "pos-cloud-emp", target_department_id: "dept-kd", target_position_id: "pos-kd-emp", note: "" }], description: "Bổ sung nhân sự kinh doanh theo kế hoạch.", status: "PENDING" },
    { proposal_id: "transfer-demo-02", proposal_code: "DXDC/2026-002", employee_id: "emp-kd-04", employee_name: "Lê Hoàng Phúc", current_department_id: "dept-kd", current_dept_name: "Phòng Kinh doanh", current_position_id: "pos-kd-emp", current_pos_name: "Nhân viên Kinh doanh", target_department_id: "dept-cloud", target_dept_name: "Phòng Cloud và Hạ tầng", target_position_id: "pos-cloud-emp", proposal_date: "2026-09-05", effective_date: "2026-10-15", decision_type: "Điều chuyển", proposer_id: "emp-kd-01", proposer_name: "Phạm Quốc Tuấn", proposer_position: "Trưởng Phòng Kinh doanh", proposer_department: "Phòng Kinh doanh", detail_items: [{ employee_id: "emp-kd-04", employee_name: "Lê Hoàng Phúc", current_department_id: "dept-kd", target_department_id: "dept-cloud", target_position_id: "pos-cloud-emp", note: "" }], description: "Điều chuyển theo nhu cầu phối hợp dự án.", status: "PENDING" },
  ],
  "/hr/transfer-decisions": [
    { decision_id: "transfer-decision-demo-01", decision_number: "QĐ-TCBN/2026/001", proposal_id: "transfer-demo-01", employee_id: "emp-cloud-04", employee_name: "Đặng Việt Dũng", current_department_id: "dept-cloud", current_dept_name: "Phòng Cloud và Hạ tầng", current_position_id: "pos-cloud-emp", current_pos_name: "Kỹ sư Cloud và Hạ tầng", target_department_id: "dept-kd", target_dept_name: "Phòng Kinh doanh", target_position_id: "pos-kd-emp", target_pos_name: "Nhân viên Kinh doanh", manager_id: "emp-kd-01", manager_name: "Phạm Quốc Tuấn", decision_date: "2026-09-05", effective_date: "2026-10-01", decision_type: "Thuyên chuyển", creator_id: "emp-hr-02", creator_name: "Nguyễn Thùy Linh", creator_position: "Trưởng nhóm Tuyển dụng", creator_department: "Phòng Nhân sự", detail_items: [{ employee_id: "emp-cloud-04", current_department_id: "dept-cloud", current_position_id: "pos-cloud-emp", target_department_id: "dept-kd", target_position_id: "pos-kd-emp", manager_id: "emp-kd-01", note: "" }], description: "Điều chuyển theo nhu cầu tổ chức.", status: "EXECUTED" },
  ],
  "/hr/resignation-applications": [
    { application_id: "resign-demo-01", application_code: "DXNV/2026-001", employee_name: "Đặng Việt Dũng", desired_resign_date: "2026-10-15", reason: "Thay đổi định hướng cá nhân", status: "PENDING" },
  ],
  "/hr/resignation-decisions": [
    { decision_id: "resign-decision-demo-01", decision_number: "QDNV/2026-001", employee_name: "Đặng Việt Dũng", official_resign_date: "2026-10-15", handover_status: "PENDING", status: "DRAFT" },
  ],
  "/hr/work-history": [
    { work_history_id: "history-demo-01", employee_id: "emp-cloud-04", employee_code: "NV-2024-100", employee_name: "Đặng Việt Dũng", department_name: "Phòng Cloud và Hạ tầng", position_name: "Kỹ sư Cloud và Hạ tầng", decision_type: "Tuyển mới", effective_date: "2024-06-10" },
    { work_history_id: "history-demo-02", employee_id: "emp-hr-02", employee_code: "NV-2024-005", employee_name: "Nguyễn Thùy Linh", department_name: "Phòng Nhân sự", position_name: "Nhân viên Nhân sự", decision_type: "Tuyển mới", effective_date: "2024-03-15", reason: "Tiếp nhận nhân sự mới." },
    { work_history_id: "history-demo-03", employee_id: "emp-hr-02", employee_code: "NV-2024-005", employee_name: "Nguyễn Thùy Linh", department_name: "Phòng Nhân sự", position_name: "Nhân viên Nhân sự", decision_type: "Bổ nhiệm", effective_date: "2025-01-01", reason: "Phân công phụ trách nhóm tuyển dụng." },
  ],
  "/reward-discipline/criteria": [
    { criteria_id: "criteria-demo-01", criteria_code: "KPI_WORK", criteria_name: "Mức độ hoàn thành chỉ tiêu công việc (KPI)", weight: 40, description: "Đánh giá tiến độ, chất lượng và số lượng công việc được giao", status: 1, scales: [{ scale_id: "scale-criteria-demo-01-01", grade_name: "D - Cần cải thiện", min_score: 0, max_score: 6.49, description: "Chưa đáp ứng yêu cầu, cần kế hoạch cải thiện cụ thể." }, { scale_id: "scale-criteria-demo-01-02", grade_name: "C - Đạt yêu cầu", min_score: 6.5, max_score: 7.99, description: "Hoàn thành yêu cầu cơ bản của vị trí." }, { scale_id: "scale-criteria-demo-01-03", grade_name: "B - Tốt", min_score: 8, max_score: 8.99, description: "Hoàn thành tốt mục tiêu và chủ động trong công việc." }, { scale_id: "scale-criteria-demo-01-04", grade_name: "A - Xuất sắc", min_score: 9, max_score: 10, description: "Vượt kỳ vọng, tạo tác động tích cực rõ rệt cho đội ngũ." }] },
    { criteria_id: "criteria-demo-02", criteria_code: "SKILL_PROF", criteria_name: "Kỹ năng chuyên môn & Nghiệp vụ", weight: 20, description: "Mức độ thành thạo quy trình, kỹ thuật và xử lý vấn đề", status: 1, scales: [{ scale_id: "scale-criteria-demo-02-01", grade_name: "D - Cần cải thiện", min_score: 0, max_score: 6.49, description: "Chưa đáp ứng yêu cầu chuyên môn." }, { scale_id: "scale-criteria-demo-02-02", grade_name: "C - Đạt yêu cầu", min_score: 6.5, max_score: 7.99, description: "Đáp ứng yêu cầu cơ bản." }, { scale_id: "scale-criteria-demo-02-03", grade_name: "B - Tốt", min_score: 8, max_score: 8.99, description: "Vận dụng tốt nghiệp vụ." }, { scale_id: "scale-criteria-demo-02-04", grade_name: "A - Xuất sắc", min_score: 9, max_score: 10, description: "Làm chủ nghiệp vụ và hỗ trợ đội ngũ." }] },
    { criteria_id: "criteria-demo-03", criteria_code: "ATTITUDE", criteria_name: "Thái độ làm việc & Kỷ luật lao động", weight: 20, description: "Ý thức chấp hành nội quy, giờ giấc và tinh thần trách nhiệm", status: 1, scales: [{ scale_id: "scale-criteria-demo-03-01", grade_name: "D - Cần cải thiện", min_score: 0, max_score: 6.49, description: "Cần cải thiện tính chủ động và kỷ luật." }, { scale_id: "scale-criteria-demo-03-02", grade_name: "C - Đạt yêu cầu", min_score: 6.5, max_score: 7.99, description: "Tuân thủ các yêu cầu cơ bản." }, { scale_id: "scale-criteria-demo-03-03", grade_name: "B - Tốt", min_score: 8, max_score: 8.99, description: "Có tinh thần trách nhiệm tốt." }, { scale_id: "scale-criteria-demo-03-04", grade_name: "A - Xuất sắc", min_score: 9, max_score: 10, description: "Là tấm gương về thái độ và kỷ luật." }] },
    { criteria_id: "criteria-demo-04", criteria_code: "TEAMWORK", criteria_name: "Kỹ năng phối hợp & Làm việc nhóm", weight: 20, description: "Khả năng giao tiếp, tinh thần đồng đội và chia sẻ tri thức", status: 1, scales: [{ scale_id: "scale-criteria-demo-04-01", grade_name: "D - Cần cải thiện", min_score: 0, max_score: 6.49, description: "Cần cải thiện khả năng phối hợp." }, { scale_id: "scale-criteria-demo-04-02", grade_name: "C - Đạt yêu cầu", min_score: 6.5, max_score: 7.99, description: "Phối hợp được trong công việc thường ngày." }, { scale_id: "scale-criteria-demo-04-03", grade_name: "B - Tốt", min_score: 8, max_score: 8.99, description: "Phối hợp chủ động và hiệu quả." }, { scale_id: "scale-criteria-demo-04-04", grade_name: "A - Xuất sắc", min_score: 9, max_score: 10, description: "Kết nối đội ngũ và lan tỏa tri thức." }] },
  ],
  "/reward-discipline/evaluations": [
    { evaluation_id: "evaluation-demo-01", evaluation_code: "DG/2026-001", evaluation_date: "2026-06-30", evaluation_quarter: 2, year: 2026, evaluator_id: "emp-hr-01", evaluator_name: "Trần Thị Thu Hà", employee_id: "emp-hr-02", employee_name: "Nguyễn Thùy Linh", department_id: "dept-hr", department_name: "Phòng Nhân sự", position_id: "pos-hr-emp", position_name: "Nhân viên Nhân sự", details: [{ detail_id: "detail-evaluation-demo-01-01", criteria_id: "criteria-demo-01", criteria_code: "KPI_WORK", criteria_name: "Mức độ hoàn thành chỉ tiêu công việc (KPI)", weight: 40, score: 9.5, note: "Vượt 112% chỉ tiêu tuyển dụng quý." }, { detail_id: "detail-evaluation-demo-01-02", criteria_id: "criteria-demo-02", criteria_code: "SKILL_PROF", criteria_name: "Kỹ năng chuyên môn & Nghiệp vụ", weight: 20, score: 9, note: "Xử lý hồ sơ đúng quy trình." }, { detail_id: "detail-evaluation-demo-01-03", criteria_id: "criteria-demo-03", criteria_code: "ATTITUDE", criteria_name: "Thái độ làm việc & Kỷ luật lao động", weight: 20, score: 9, note: "Chủ động và đúng hạn." }, { detail_id: "detail-evaluation-demo-01-04", criteria_id: "criteria-demo-04", criteria_code: "TEAMWORK", criteria_name: "Kỹ năng phối hợp & Làm việc nhóm", weight: 20, score: 9.5, note: "Hỗ trợ tốt các phòng ban." }], total_score: 9.3, grade_result: "Loại A+ (Xuất sắc)", description: "Đánh giá kết quả công việc Quý II năm 2026.", manager_comment: "Tiếp tục phát huy vai trò nòng cốt trong công tác tuyển dụng.", recommendation: "Đề xuất khen thưởng Quý II.", status: "COMPLETED" },
    { evaluation_id: "evaluation-demo-02", evaluation_code: "DG/2026-002", evaluation_date: "2026-06-28", evaluation_quarter: 2, year: 2026, evaluator_id: "emp-kd-01", evaluator_name: "Phạm Quốc Tuấn", employee_id: "emp-cloud-04", employee_name: "Đặng Việt Dũng", department_id: "dept-cloud", department_name: "Phòng Cloud và Hạ tầng", position_id: "pos-cloud-emp", position_name: "Kỹ sư Cloud và Hạ tầng", details: [{ detail_id: "detail-evaluation-demo-02-01", criteria_id: "criteria-demo-01", criteria_code: "KPI_WORK", criteria_name: "Mức độ hoàn thành chỉ tiêu công việc (KPI)", weight: 40, score: 8.8, note: "Hoàn thành các nhiệm vụ vận hành trọng yếu." }, { detail_id: "detail-evaluation-demo-02-02", criteria_id: "criteria-demo-02", criteria_code: "SKILL_PROF", criteria_name: "Kỹ năng chuyên môn & Nghiệp vụ", weight: 20, score: 8.5, note: "Xử lý sự cố độc lập." }, { detail_id: "detail-evaluation-demo-02-03", criteria_id: "criteria-demo-03", criteria_code: "ATTITUDE", criteria_name: "Thái độ làm việc & Kỷ luật lao động", weight: 20, score: 8.5, note: "Tuân thủ lịch trực." }, { detail_id: "detail-evaluation-demo-02-04", criteria_id: "criteria-demo-04", criteria_code: "TEAMWORK", criteria_name: "Kỹ năng phối hợp & Làm việc nhóm", weight: 20, score: 9, note: "Phối hợp nhanh với nhóm hỗ trợ." }], total_score: 8.72, grade_result: "Loại A (Giỏi)", description: "Đánh giá kết quả công việc Quý II năm 2026.", manager_comment: "Đáp ứng tốt yêu cầu vận hành hệ thống.", recommendation: "Tiếp tục đào tạo chuyên sâu về Cloud.", status: "COMPLETED" },
    { evaluation_id: "evaluation-demo-03", evaluation_code: "DG/2026-003", evaluation_date: "2026-03-31", evaluation_quarter: 1, year: 2026, evaluator_id: "emp-hr-01", evaluator_name: "Trần Thị Thu Hà", employee_id: "emp-kd-01", employee_name: "Phạm Quốc Tuấn", department_id: "dept-kd", department_name: "Phòng Kinh doanh", position_id: "pos-kd-emp", position_name: "Trưởng Phòng Kinh doanh", details: [{ detail_id: "detail-evaluation-demo-03-01", criteria_id: "criteria-demo-01", criteria_code: "KPI_WORK", criteria_name: "Mức độ hoàn thành chỉ tiêu công việc (KPI)", weight: 40, score: 7.5, note: "Đạt mục tiêu doanh số quý." }, { detail_id: "detail-evaluation-demo-03-02", criteria_id: "criteria-demo-02", criteria_code: "SKILL_PROF", criteria_name: "Kỹ năng chuyên môn & Nghiệp vụ", weight: 20, score: 8, note: "Nắm vững quy trình bán hàng." }, { detail_id: "detail-evaluation-demo-03-03", criteria_id: "criteria-demo-03", criteria_code: "ATTITUDE", criteria_name: "Thái độ làm việc & Kỷ luật lao động", weight: 20, score: 7, note: "Cần cải thiện việc cập nhật báo cáo." }, { detail_id: "detail-evaluation-demo-03-04", criteria_id: "criteria-demo-04", criteria_code: "TEAMWORK", criteria_name: "Kỹ năng phối hợp & Làm việc nhóm", weight: 20, score: 8, note: "Phối hợp ổn định với đội ngũ." }], total_score: 7.6, grade_result: "Loại B (Tốt)", description: "Đánh giá kết quả công việc Quý I năm 2026.", manager_comment: "Hoàn thành tốt vai trò quản lý phòng kinh doanh.", recommendation: "Xây dựng kế hoạch cải thiện báo cáo định kỳ.", status: "COMPLETED" },
    { evaluation_id: "evaluation-demo-04", evaluation_code: "DG/2025-004", evaluation_date: "2025-12-31", evaluation_quarter: 4, year: 2025, evaluator_id: "emp-hr-01", evaluator_name: "Trần Thị Thu Hà", employee_id: "emp-hr-02", employee_name: "Nguyễn Thùy Linh", department_id: "dept-hr", department_name: "Phòng Nhân sự", position_id: "pos-hr-emp", position_name: "Nhân viên Nhân sự", details: [{ detail_id: "detail-evaluation-demo-04-01", criteria_id: "criteria-demo-01", criteria_code: "KPI_WORK", criteria_name: "Mức độ hoàn thành chỉ tiêu công việc (KPI)", weight: 40, score: 8.5, note: "Hoàn thành kế hoạch năm." }, { detail_id: "detail-evaluation-demo-04-02", criteria_id: "criteria-demo-02", criteria_code: "SKILL_PROF", criteria_name: "Kỹ năng chuyên môn & Nghiệp vụ", weight: 20, score: 8, note: "Đáp ứng tốt nghiệp vụ." }, { detail_id: "detail-evaluation-demo-04-03", criteria_id: "criteria-demo-03", criteria_code: "ATTITUDE", criteria_name: "Thái độ làm việc & Kỷ luật lao động", weight: 20, score: 8.5, note: "Có trách nhiệm với công việc." }, { detail_id: "detail-evaluation-demo-04-04", criteria_id: "criteria-demo-04", criteria_code: "TEAMWORK", criteria_name: "Kỹ năng phối hợp & Làm việc nhóm", weight: 20, score: 8.5, note: "Phối hợp hiệu quả." }], total_score: 8.4, grade_result: "Loại A (Giỏi)", description: "Đánh giá tổng kết năm 2025.", manager_comment: "Có tiến bộ rõ rệt so với kỳ trước.", recommendation: "Được tham gia chương trình phát triển chuyên môn.", status: "COMPLETED" },
  ],
  "/reward-discipline/proposals": [
    { proposal_id: "reward-proposal-demo-01", proposal_code: "DXKT/2026-001", record_type: "KHEN_THUONG", employee_id: "emp-hr-02", employee_name: "Nguyễn Thùy Linh", employee_code: "NV-2024-005", department_name: "Phòng Nhân sự", department_manager_id: "emp-hr-01", department_manager_name: "Trần Thị Thu Hà", position_name: "Nhân viên Nhân sự", proposed_amount: 5000000, payment_method: "BANK_TRANSFER", proposal_date: "2026-08-25", proposed_by_employee_id: "emp-hr-01", proposed_by: "Trần Thị Thu Hà", reason: "Hoàn thành vượt chỉ tiêu tuyển dụng Quý III", content: "Đề xuất khen thưởng thành tích tuyển dụng nổi bật.", attachment_url: "https://example.test/files/dxkt-2026-001.pdf", status: "APPROVED" },
    { proposal_id: "reward-proposal-demo-02", proposal_code: "DXKT/2026-002", record_type: "KHEN_THUONG", employee_id: "emp-cloud-04", employee_name: "Đặng Việt Dũng", employee_code: "NV-2024-100", department_name: "Phòng Cloud và Hạ tầng", department_manager_id: "emp-cloud-manager", department_manager_name: "Hoàng Trọng Nghĩa", position_name: "Kỹ sư Cloud và Hạ tầng", proposed_amount: 4000000, payment_method: "CASH", proposal_date: "2026-08-28", proposed_by_employee_id: "emp-kd-01", proposed_by: "Phạm Quốc Tuấn", reason: "Xử lý sự cố hạ tầng khẩn cấp ngoài giờ.", content: "Đề xuất ghi nhận đóng góp trong việc duy trì hệ thống hoạt động ổn định.", attachment_url: "https://example.test/files/dxkt-2026-002.pdf", status: "APPROVED" },
    { proposal_id: "discipline-proposal-demo-01", proposal_code: "DXKL/2026-001", record_type: "KY_LUAT", employee_id: "emp-kd-01", employee_name: "Phạm Quốc Tuấn", employee_code: "NV-2024-027", department_name: "Phòng Kinh doanh", department_manager_id: "emp-kd-01", department_manager_name: "Phạm Quốc Tuấn", position_name: "Trưởng Phòng Kinh doanh", proposed_amount: 0, payment_method: "NOT_APPLICABLE", proposal_date: "2026-08-12", proposed_by_employee_id: "emp-hr-01", proposed_by: "Trần Thị Thu Hà", reason: "Chưa cập nhật báo cáo đúng hạn nhiều lần.", content: "Đề xuất nhắc nhở bằng văn bản và theo dõi cải thiện trong kỳ tiếp theo.", status: "APPROVED" },
    { proposal_id: "reward-proposal-demo-03", proposal_code: "DXKT/2026-003", record_type: "KHEN_THUONG", employee_id: "emp-hr-02", employee_name: "Nguyễn Thùy Linh", employee_code: "NV-2024-005", department_name: "Phòng Nhân sự", department_manager_id: "emp-hr-01", department_manager_name: "Trần Thị Thu Hà", position_name: "Nhân viên Nhân sự", proposed_amount: 3000000, payment_method: "BANK_TRANSFER", proposal_date: "2026-09-05", proposed_by_employee_id: "emp-hr-01", proposed_by: "Trần Thị Thu Hà", reason: "Hoàn thành tốt kế hoạch chuẩn hóa hồ sơ nhân sự.", content: "Đề xuất xem xét trong kỳ tổng kết năm.", status: "PENDING" },
  ],
  "/reward-discipline": [
    { reward_discipline_id: "reward-demo-01", decision_no: "QĐKT/2026/001", decision_type: "KHEN_THUONG", employee_id: "emp-hr-02", employee_code: "NV-2024-005", employee_name: "Nguyễn Thùy Linh", department_name: "Phòng Nhân sự", position_name: "Nhân viên Nhân sự", decision_date: "2026-08-30", effective_date: "2026-08-30", decision_by: "Bùi Xuân Thức", proposal_id: "reward-proposal-demo-01", amount: 5000000, status: "COMPLETED", reason: "Hoàn thành vượt chỉ tiêu tuyển dụng Quý III", content: "Tặng bằng khen công ty và tiền thưởng 5.000.000 VNĐ.", attachment_url: "https://example.test/files/qdkt-2026-001.pdf" },
    { reward_discipline_id: "reward-demo-02", decision_no: "QĐKT/2026/002", decision_type: "KHEN_THUONG", employee_id: "emp-cloud-04", employee_code: "NV-2024-100", employee_name: "Đặng Việt Dũng", department_name: "Phòng Cloud và Hạ tầng", position_name: "Kỹ sư Cloud và Hạ tầng", decision_date: "2026-09-01", effective_date: "2026-09-01", decision_by: "Bùi Xuân Thức", proposal_id: "reward-proposal-demo-02", amount: 4000000, status: "COMPLETED", reason: "Xử lý sự cố hạ tầng khẩn cấp ngoài giờ.", content: "Thưởng ghi nhận đóng góp duy trì hệ thống hoạt động ổn định." },
    { reward_discipline_id: "discipline-demo-01", decision_no: "QĐKL/2026/001", decision_type: "KY_LUAT", employee_id: "emp-kd-01", employee_code: "NV-2024-027", employee_name: "Phạm Quốc Tuấn", department_name: "Phòng Kinh doanh", position_name: "Trưởng Phòng Kinh doanh", decision_date: "2026-08-20", effective_date: "2026-08-20", decision_by: "Trần Thị Thu Hà", proposal_id: "discipline-proposal-demo-01", amount: 0, status: "COMPLETED", reason: "Chưa cập nhật báo cáo đúng hạn nhiều lần.", content: "Nhắc nhở bằng văn bản và theo dõi cải thiện trong kỳ tiếp theo." },
  ],
};

function cloneInitialStore(): MockStore {
  return JSON.parse(JSON.stringify(initialStore)) as MockStore;
}

function loadStore(): MockStore {
  if (typeof window === "undefined") return cloneInitialStore();
  try {
    const saved = window.localStorage.getItem(MOCK_STORE_KEY);
    if (!saved) return cloneInitialStore();
    const store = JSON.parse(saved) as MockStore;
    for (const route of ["/admin/users", "/admin/roles", "/admin/positions", "/hr/employees", "/hr/contracts", "/hr/work-history", "/recruitment/requests", "/recruitment/candidates", "/hr/leave-applications", "/hr/transfer-proposals", "/reward-discipline", "/reward-discipline/criteria", "/reward-discipline/evaluations", "/reward-discipline/proposals"]) {
      const idField = idFields[route];
      const storedRows = store[route] ?? [];
      const seedIds = new Set((initialStore[route] ?? []).map((row) => String(row[idField] ?? "")));
      store[route] = [
        ...(initialStore[route] ?? []).map((seedRow) => {
          const storedRow = storedRows.find((row) => String(row[idField] ?? "") === String(seedRow[idField] ?? ""));
          return {
            ...seedRow,
            ...(storedRow ?? {}),
            ...(route === "/reward-discipline/evaluations" && parseDetailList(seedRow.details).length > parseDetailList(storedRow?.details).length ? { details: seedRow.details } : {}),
          };
        }),
        ...storedRows.filter((row) => !seedIds.has(String(row[idField] ?? ""))),
      ];
    }
    const employees = store["/hr/employees"] ?? [];
    const employeeFor = (row: MockRow) => employees.find((employee) => String(employee.employee_id ?? "") === String(row.employee_id ?? "") || (row.employee_code && String(employee.employee_code ?? "") === String(row.employee_code)) || (row.employee_name && String(employee.full_name ?? "") === String(row.employee_name)));
    for (const row of [...(store["/hr/work-history"] ?? []), ...(store["/reward-discipline"] ?? [])]) {
      const employee = employeeFor(row);
      if (employee && !row.employee_id) row.employee_id = employee.employee_id;
    }
    for (const evaluation of store["/reward-discipline/evaluations"] ?? []) {
      const employee = employeeFor({ employee_id: evaluation.employee_id, employee_name: evaluation.employee_name });
      const evaluator = employees.find((item) => String(item.employee_id ?? "") === String(evaluation.evaluator_id ?? ""));
      if (employee) {
        evaluation.employee_code ??= employee.employee_code;
        evaluation.employee_name ??= employee.full_name;
        evaluation.department_name ??= employee.department_name;
        evaluation.position_name ??= employee.position_name;
      }
      if (evaluator) evaluation.evaluator_name ??= evaluator.full_name;
    }
    store["/recruitment/candidates"] = (store["/recruitment/candidates"] ?? []).map((candidate) => ({
      ...candidate,
      status: normalizeCandidateStatus(candidate.status),
    }));
    const quotaDefaults = initialStore["/hr/quotas"]?.[0] ?? {};
    const storedQuotas: MockRow[] = (store["/hr/quotas"] ?? []).map((quota) => ({
      ...quotaDefaults,
      ...quota,
      details: quota.details ?? quotaDefaults.details,
      budget_details: quota.budget_details ?? quotaDefaults.budget_details,
    }));
    const storedQuotaIds = new Set(storedQuotas.map((quota) => String(quota.quota_id ?? "")));
    store["/hr/quotas"] = [
      ...storedQuotas,
      ...(initialStore["/hr/quotas"] ?? [])
        .filter((quota) => !storedQuotaIds.has(String(quota.quota_id ?? "")))
        .map((quota) => ({ ...quota })),
    ];
    return store;
  } catch {
    return cloneInitialStore();
  }
}

function saveStore(store: MockStore) {
  if (typeof window !== "undefined") window.localStorage.setItem(MOCK_STORE_KEY, JSON.stringify(store));
}

export function mockUploadEmployeeAvatar(employeeId: string, file: File) {
  const store = loadStore();
  const employee = store["/hr/employees"].find((item) => String(item.employee_id) === employeeId);
  const avatarUrl = URL.createObjectURL(file);
  if (employee) {
    employee.avatar_url = avatarUrl;
    saveStore(store);
  }
  return { avatarUrl };
}

function mockReportResult(reportId: string, filters: Record<string, string>) {
  const definition = reportDefinitions.find((item) => item.id === reportId);
  if (!definition) return { success: false, message: "Không tìm thấy mẫu báo cáo." };
  if (reportId === "rec_result") {
    const store = loadStore();
    const start = filters.startDate ? new Date(filters.startDate).getTime() : 0;
    const end = filters.endDate ? new Date(filters.endDate).getTime() + 86399999 : Number.POSITIVE_INFINITY;
    const grouped = new Map<string, { department_name: string; position_name: string; required_quantity: number; hired_quantity: number }>();
    store["/recruitment/requests"].filter((request) => {
      const date = new Date(String(request.created_date ?? "")).getTime();
      return (!Number.isNaN(date) && date >= start && date <= end) || request.created_date === undefined;
    }).forEach((request) => {
      const department = String(request.department_name ?? "");
      const position = String(request.position_name ?? "");
      if (filters.department && filters.department !== "ALL" && department !== filters.department) return;
      if (filters.position && filters.position !== "ALL" && position !== filters.position) return;
      const key = `${request.department_id ?? department}|${request.position_id ?? position}`;
      const current = grouped.get(key) ?? { department_name: department, position_name: position, required_quantity: 0, hired_quantity: 0 };
      current.required_quantity += Number(request.quantity ?? 0);
      const hired = store["/recruitment/candidates"].filter((candidate) => String(candidate.recruitment_request_id) === String(request.recruitment_request_id) && (isCandidateWorking(candidate.status) || store["/hr/employees"].some((employee) => String(employee.candidate_id) === String(candidate.candidate_id) && employee.employment_status === "WORKING"))).length;
      current.hired_quantity += hired;
      grouped.set(key, current);
    });
    const data = Array.from(grouped.values()).map((row) => ({ ...row, remaining_quantity: Math.max(0, row.required_quantity - row.hired_quantity) }));
    return { success: true, reportId, filters, data, summary: { totalRequired: data.reduce((sum, row) => sum + row.required_quantity, 0), totalHired: data.reduce((sum, row) => sum + row.hired_quantity, 0), totalRemaining: data.reduce((sum, row) => sum + row.remaining_quantity, 0), total: data.length, mock: true } };
  }
  if (reportId === "eval_detail") {
    const store = loadStore();
    const start = filters.startDate ? new Date(filters.startDate).getTime() : 0;
    const end = filters.endDate ? new Date(filters.endDate).getTime() + 86399999 : Number.POSITIVE_INFINITY;
    const data = store["/reward-discipline/evaluations"].filter((evaluation) => {
      if (String(evaluation.status ?? "COMPLETED") !== "COMPLETED") return false;
      const date = new Date(String(evaluation.evaluation_date ?? "")).getTime();
      if (!Number.isNaN(date) && (date < start || date > end)) return false;
      if (filters.department && filters.department !== "ALL" && String(evaluation.department_name ?? "") !== filters.department) return false;
      if (filters.position && filters.position !== "ALL" && String(evaluation.position_name ?? "") !== filters.position) return false;
      return true;
    }).flatMap((evaluation) => parseDetailList(evaluation.details).map((detail) => ({
      criteria_code: detail.criteria_code,
      criteria_name: detail.criteria_name,
      self_score: "-",
      manager_score: Number(detail.score) || 0,
      weight: Number(detail.weight) || 0,
      final_score: Number(detail.score) || 0,
      notes: detail.note ?? "",
      evaluation_code: evaluation.evaluation_code,
      evaluation_date: evaluation.evaluation_date,
      evaluation_quarter: evaluation.evaluation_quarter,
      year: evaluation.year,
      employee_id: evaluation.employee_id,
      employee_code: evaluation.employee_code,
      full_name: evaluation.employee_name,
      evaluator_id: evaluation.evaluator_id,
      evaluator_name: evaluation.evaluator_name,
      dept_name: evaluation.department_name,
      position_name: evaluation.position_name,
    })));
    return { success: true, reportId, filters, data, summary: { totalCriteriaScores: data.length, note: "Hệ thống hiện lưu điểm quản lý; chưa có trường tự đánh giá độc lập.", total: data.length, mock: true } };
  }
  const makeRow = (index: number) => Object.fromEntries(
    definition.columns.map((column) => {
      if (column.key.includes("date") || column.key.includes("_date") || column.key === "dob" || column.key === "join_date") return [column.key, filters.startDate || "2026-01-01"] as const;
      if (column.key.includes("count") || column.key.includes("quantity") || column.key === "weight" || column.key === "amount" || column.key === "budget") return [column.key, index === 1 ? 8 : 5] as const;
      if (column.key.includes("rate") || column.key === "percentage") return [column.key, "82%"] as const;
      if (column.key.includes("score")) return [column.key, "8.5"] as const;
      return [column.key, index === 1 ? "Dữ liệu mẫu 1" : "Dữ liệu mẫu 2"] as const;
    }),
  );
  return {
    success: true,
    reportId,
    filters,
    data: [makeRow(1), makeRow(2)],
    summary: { total: 2, mock: true },
  };
}

function routeFor(path: string) {
  return Object.keys(idFields).sort((a, b) => b.length - a.length).find((route) => path === route || path.startsWith(`${route}/`)) ?? path;
}

function payloadFor(init: RequestInit): MockRow {
  if (!init.body || typeof init.body !== "string") return {};
  try {
    return JSON.parse(init.body) as MockRow;
  } catch {
    return {};
  }
}

function parseDetailList(value: unknown): MockRow[] {
  if (Array.isArray(value)) return value.filter((item): item is MockRow => Boolean(item && typeof item === "object"));
  if (typeof value === "string") {
    try { return parseDetailList(JSON.parse(value)); } catch { return []; }
  }
  return [];
}

function envelope(data: unknown) {
  return { success: true, data };
}

function failure(message: string) {
  return { success: false, message };
}

function normalized(value: unknown) {
  return String(value ?? "").trim().toLocaleLowerCase();
}

function duplicateCandidate(
  candidates: MockRow[],
  payload: MockRow,
  candidateId?: string,
) {
  const fields = ["citizen_id", "phone", "email"];
  return candidates.find(
    (candidate) =>
      String(candidate.candidate_id) !== candidateId &&
      fields.some((field) => {
        const value = normalized(payload[field]);
        return value !== "" && normalized(candidate[field]) === value;
      }),
  );
}

function canConvertCandidate(candidate: MockRow) {
  return isCandidateHiringDecisionPassed(candidate.status);
}

export function isMockMode() {
  return process.env.NEXT_PUBLIC_USE_MOCK_API === "true";
}

export async function mockApiRequest<T>(path: string, init: RequestInit = {}, session?: Session): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, 120));

  if (path.includes("dashboard")) return dashboardResponse(session) as T;
  if (path.endsWith("/approval-history") || path.endsWith("/pathway")) return envelope([]) as T;
  if (path === "/reports/query" && (init.method ?? "GET") === "POST") {
    const payload = payloadFor(init);
    return mockReportResult(String(payload.reportId ?? ""), (payload.filters ?? {}) as Record<string, string>) as T;
  }
  if (path === "/reports/departments" && (init.method ?? "GET") === "GET") {
    return envelope(loadStore()["/admin/departments"] ?? []) as T;
  }
  if (path === "/reports/positions" && (init.method ?? "GET") === "GET") {
    return envelope(loadStore()["/admin/positions"] ?? []) as T;
  }
  if (path.includes("/employees") && path.includes("/admin/departments/")) {
    const departmentId = path.split("/")[3];
    return envelope(loadStore()["/hr/employees"].filter((employee) => employee.department_id === departmentId)) as T;
  }

  const store = loadStore();
  const method = init.method ?? "GET";
  const appendixMatch = path.match(/^\/hr\/contracts\/([^/]+)\/appendices(?:\/([^/]+))?$/);
  if (appendixMatch) {
    const contractId = appendixMatch[1];
    const appendices = store["/hr/contract-appendices"] ?? [];
    if (method === "GET") return envelope(appendices.filter((item) => String(item.contract_id) === contractId)) as T;
    if (method === "POST") {
      const appendix = { ...payloadFor(init), appendix_id: `mock-appendix-${Date.now()}`, contract_id: contractId, status: "ACTIVE" };
      appendices.unshift(appendix);
      store["/hr/contract-appendices"] = appendices;
      saveStore(store);
      return envelope(appendix) as T;
    }
  }
  const route = routeFor(path);
  const idField = idFields[route];
  const segments = path.slice(route.length).split("/").filter(Boolean);
  const id = segments[0];
  const action = segments[1];
  const rows = store[route] ?? [];

  if (path === "/hr/employees/me" && method === "GET") {
    const employee = store["/hr/employees"].find((row) => row.employee_id === "emp-kd-02") ?? store["/hr/employees"][0];
    return envelope(employee ?? null) as T;
  }

  if (path.startsWith("/hr/employees/") && id && method === "GET") {
    const employee = store["/hr/employees"].find((row) => String(row.employee_id) === id);
    if (!employee) return envelope(null) as T;
    return envelope({
      ...employee,
      contracts: store["/hr/contracts"].filter((row) => String(row.employee_id) === id),
      workHistory: store["/hr/work-history"].filter((row) => String(row.employee_id) === id),
      rewards: store["/reward-discipline"].filter((row) => String(row.employee_id) === id),
      leaveBalances: id === "emp-hr-02" ? [{ leave_year: 2026, entitled_days: 12, used_days: 4, remaining_days: 8 }] : [],
    }) as T;
  }

  if (method === "GET") {
    if (id) return envelope(rows.find((row) => String(row[idField]) === id) ?? null) as T;
    return envelope(rows) as T;
  }

  const payload = payloadFor(init);
  if (route === "/recruitment/interview-schedules" && (method === "POST" || method === "PUT")) {
    const candidateIds = parseDetailList(payload.candidates ?? payload.candidates_json)
      .map((item) => String(item.candidate_id ?? item.id ?? ""))
      .filter(Boolean);
    for (const candidate of store["/recruitment/candidates"] ?? []) {
      if (candidateIds.includes(String(candidate.candidate_id))) candidate.status = "đã tạo lịch";
    }
  }
  if (route === "/admin/users" && method === "POST") {
    const username = String(payload.username ?? "").trim();
    const fullName = String(payload.full_name ?? "").trim();
    const password = String(payload.password ?? "");
    if (!username || !fullName) return failure("Vui lòng nhập tên đăng nhập và họ tên.") as T;
    if (password.length < 6) return failure("Mật khẩu phải có ít nhất 6 ký tự.") as T;
    if (rows.some((item) => String(item.username ?? "").toLowerCase() === username.toLowerCase())) return failure(`Tên đăng nhập '${username}' đã tồn tại trong hệ thống.`) as T;
    const role = store["/admin/roles"].find((item) => String(item.role_id) === String(payload.role_id ?? "role-hr"));
    const department = store["/admin/departments"].find((item) => String(item.department_id) === String(payload.department_id ?? ""));
    const newUser = { ...payload, user_id: `mock-user-${Date.now()}`, username, full_name: fullName, role_id: role?.role_id ?? "role-hr", role_name: role?.role_name ?? "HR Staff", department_name: department?.department_name ?? "", status: 1, created_date: new Date().toISOString() };
    rows.unshift(newUser);
    store[route] = rows;
    saveStore(store);
    return envelope(newUser) as T;
  }
  if (path === "/recruitment/convert-to-employee") {
    const candidate = store["/recruitment/candidates"].find((row) => row.candidate_id === payload.candidate_id);
    if (!candidate) return failure("Không tìm thấy thông tin ứng viên.") as T;
    if (!canConvertCandidate(candidate))
      return failure("Chỉ ứng viên đã trúng tuyển mới được chuyển thành nhân viên.") as T;
    const decision = (store["/recruitment/decisions"] ?? []).find((row) => row.candidate_id === payload.candidate_id && String(row.result ?? "").trim().toUpperCase() === "ĐẠT" && row.status === "COMPLETED");
    if (!decision)
      return failure("Chỉ ứng viên có quyết định trúng tuyển kết quả Đạt mới được chuyển thành nhân viên.") as T;
    const existingEmployee = store["/hr/employees"].find((row) => String(row.candidate_id ?? "") === String(payload.candidate_id));
    if (isCandidateWorking(candidate.status) || existingEmployee)
      return failure("Ứng viên này đã được chuyển thành nhân viên.") as T;

    const now = new Date();
    const timestamp = now.getTime();
    const offer = store["/recruitment/offers"].find(
      (item) => item.candidate_id === candidate.candidate_id,
    );
    const joinDate = String(
      offer?.expected_start_date ?? now.toISOString().slice(0, 10),
    );
    const position = store["/admin/positions"].find(
      (item) => item.position_id === candidate.position_id,
    );
    const department = store["/admin/departments"].find(
      (item) => item.department_id === position?.department_id,
    );
    const employeeId = `emp-${timestamp}`;
    const contractId = `contract-${timestamp}`;
    const officialSalary = Number(offer?.official_salary ?? offer?.salary_offer ?? 0);
    const probationSalary = Number(offer?.probation_salary ?? (officialSalary || 15000000));
    const probationFrom = new Date(joinDate);
    const probationTo = new Date(probationFrom);
    probationTo.setMonth(probationTo.getMonth() + 2);
    const probationRate = officialSalary > 0 ? Number(((probationSalary / officialSalary) * 100).toFixed(2)) : 100;

    candidate.status = "đi làm";
    store["/hr/employees"].unshift({
      employee_id: employeeId,
      employee_code: `NV-${String(timestamp).slice(-6)}`,
      full_name: candidate.full_name,
      citizen_id: candidate.citizen_id,
      phone: candidate.phone,
      email: candidate.email,
      department_id: position?.department_id,
      department_name: department?.department_name,
      position_id: candidate.position_id,
      position_name: candidate.apply_position_name ?? position?.position_name,
      candidate_id: candidate.candidate_id,
      level: "Nhân viên",
      employment_status: "WORKING",
      join_date: joinDate,
    });
    store["/hr/contracts"].unshift({
      contract_id: contractId,
      contract_no: `HDTV/${now.getFullYear()}/${String(timestamp).slice(-6)}`,
      employee_id: employeeId,
      employee_name: candidate.full_name,
      employee_position: candidate.apply_position_name ?? position?.position_name,
      contract_type: "Hợp đồng thử việc",
      contract_date: joinDate,
      sign_date: now.toISOString().slice(0, 10),
      start_date: joinDate,
      end_date: probationTo.toISOString().slice(0, 10),
      has_probation: 1,
      probation_from_date: probationFrom.toISOString().slice(0, 10),
      probation_to_date: probationTo.toISOString().slice(0, 10),
      probation_salary_rate: probationRate,
      base_salary: probationSalary,
      salary: probationSalary,
      status: "ACTIVE",
      note: "Tự động tạo khi chuyển từ ứng viên.",
    });
    saveStore(store);
    return envelope({ candidate, employee_id: employeeId, contract_id: contractId }) as T;
  }

  if (route === "/recruitment/candidates" && (method === "POST" || method === "PUT")) {
    const duplicate = duplicateCandidate(rows, payload, method === "PUT" ? id : undefined);
    if (duplicate)
      return failure(
        `Thông tin ứng viên trùng với ${String(duplicate.candidate_code ?? duplicate.full_name)}.`,
      ) as T;
  }

  if (route === "/recruitment/pre-screenings" && (method === "POST" || method === "PUT")) {
    const candidate = store["/recruitment/candidates"].find((item) => String(item.candidate_id) === String(payload.candidate_id));
    if (!candidate) return failure("Không tìm thấy thông tin ứng viên.") as T;
    if (method === "POST" && rows.some((item) => String(item.candidate_id) === String(payload.candidate_id))) return failure("Ứng viên này đã có Phiếu Sơ loại.") as T;
    const screening = method === "PUT" ? rows.find((item) => String(item[idField]) === id) : undefined;
    const nextRow = {
      ...(screening ?? {}),
      ...payload,
      [idField]: String(screening?.[idField] ?? payload[idField] ?? `mock-screening-${Date.now()}`),
      screening_code: String(screening?.screening_code ?? `PSL/${new Date().getFullYear().toString().slice(-2)}-${String(rows.length + 1).padStart(3, "0")}`),
      candidate_name: candidate.full_name,
      candidate_code: candidate.candidate_code,
      position_name: candidate.apply_position_name,
      department_name: candidate.department_name,
    };
    if (method === "POST") rows.unshift(nextRow);
    else {
      const index = rows.findIndex((item) => String(item[idField]) === id);
      if (index < 0) return failure("Không tìm thấy Phiếu Sơ loại.") as T;
      rows[index] = nextRow;
    }
    candidate.status = "đã sơ loại";
    store[route] = rows;
    saveStore(store);
    return envelope(nextRow) as T;
  }

  if (route === "/recruitment/interview-evaluations" && (method === "POST" || method === "PUT")) {
    const candidate = store["/recruitment/candidates"].find((item) => String(item.candidate_id) === String(payload.candidate_id));
    const schedule = store["/recruitment/interview-schedules"].find((item) => String(item.schedule_id) === String(payload.schedule_id));
    if (!candidate || !schedule) return failure("Lịch phỏng vấn hoặc ứng viên không tồn tại.") as T;
     const scheduleCandidates = parseDetailList(schedule.candidates ?? schedule.candidates_json);
     if (!scheduleCandidates.some((item) => String(item.candidate_id ?? item.id ?? "") === String(payload.candidate_id))) return failure("Ứng viên không thuộc lịch phỏng vấn đã chọn.") as T;
     const panel = parseDetailList(schedule.council ?? schedule.council_json);
     if (!panel.some((item) => String(item.employee_id ?? item.id ?? "") === String(payload.evaluator_id ?? ""))) return failure("Người đánh giá phải thuộc Hội đồng của lịch phỏng vấn.") as T;
     const evaluation = method === "PUT" ? rows.find((item) => String(item[idField]) === id) : undefined;
    if (method === "PUT" && !evaluation) return failure("Không tìm thấy Phiếu Đánh giá phỏng vấn.") as T;
    const nextRow = {
      ...(evaluation ?? {}),
      ...payload,
      [idField]: String(evaluation?.[idField] ?? payload[idField] ?? `mock-evaluation-${Date.now()}`),
      eval_code: String(evaluation?.eval_code ?? `PDGPV/${new Date().getFullYear().toString().slice(-2)}-${String(rows.length + 1).padStart(3, "0")}`),
      candidate_name: candidate.full_name,
      candidate_code: candidate.candidate_code,
      schedule_code: schedule.schedule_code,
      evaluator_name: store["/hr/employees"].find((item) => String(item.employee_id) === String(payload.evaluator_id))?.full_name,
    };
    if (method === "POST") rows.unshift(nextRow);
    else rows[rows.findIndex((item) => String(item[idField]) === id)] = nextRow;
    candidate.status = "đã phỏng vấn";
    if (payload.offer && typeof payload.offer === "object" && !Array.isArray(payload.offer)) {
      const offer = payload.offer as MockRow;
      const existingOffer = store["/recruitment/offers"].find((item) => String(item.candidate_id) === String(payload.candidate_id));
      if (existingOffer) Object.assign(existingOffer, offer);
      else store["/recruitment/offers"].unshift({ offer_id: `mock-offer-${Date.now()}`, candidate_id: payload.candidate_id, candidate_code: candidate.candidate_code, candidate_name: candidate.full_name, ...offer });
    }
    store[route] = rows;
    saveStore(store);
    return envelope(nextRow) as T;
  }

  if (route === "/recruitment/decisions" && method === "POST") {
    const candidate = store["/recruitment/candidates"].find((item) => String(item.candidate_id) === String(payload.candidate_id));
    const evaluation = store["/recruitment/interview-evaluations"].find((item) => String(item.interview_eval_id) === String(payload.interview_eval_id) && String(item.candidate_id) === String(payload.candidate_id));
    const result = String(payload.result ?? "").trim().toUpperCase();
    if (!candidate) return failure("Không tìm thấy thông tin ứng viên.") as T;
    if (!evaluation) return failure("Quyết định phải dựa trên Phiếu Đánh giá phỏng vấn của ứng viên.") as T;
    if (!String(payload.decision_date ?? "").trim()) return failure("Phải nhập ngày quyết định.") as T;
    if (!String(payload.overall_comment ?? "").trim()) return failure("Phải nhập đánh giá chung về ứng viên.") as T;
    const evaluationPassed = ["ĐẠT", "PASSED"].includes(String(evaluation.overall_result ?? "").trim().toUpperCase());
    if (evaluationPassed !== (result === "ĐẠT")) return failure("Kết quả quyết định phải khớp với Đánh giá chung của Phiếu Đánh giá phỏng vấn.") as T;
    if (result === "KHÔNG ĐẠT" && !String(payload.rejection_reason ?? "").trim()) return failure("Phải nhập lý do bị loại khi quyết định Không đạt.") as T;
    if (rows.some((item) => String(item.candidate_id) === String(payload.candidate_id) && item.status !== "CANCELLED")) return failure("Ứng viên này đã có quyết định tuyển dụng.") as T;
    const nextRow = { ...payload, [idField]: `mock-decision-${Date.now()}`, decision_number: String(payload.decision_number ?? `QDTD/${new Date().getFullYear().toString().slice(-2)}-${String(rows.length + 1).padStart(4, "0")}`), candidate_name: candidate.full_name, candidate_code: candidate.candidate_code, eval_code: evaluation.eval_code, status: "COMPLETED" };
    rows.unshift(nextRow);
    candidate.status = result === "ĐẠT" ? "đã quyết định tuyển" : "đã quyết định loại";
    store[route] = rows;
    saveStore(store);
    return envelope(nextRow) as T;
  }

  if (route === "/hr/transfer-proposals" && (method === "POST" || method === "PUT")) {
    const details = parseDetailList(payload.detail_items);
    const detail = details[0] ?? {};
    const employee = store["/hr/employees"].find((item) => String(item.employee_id) === String(detail.employee_id ?? payload.employee_id));
    if (!employee) return failure("Không tìm thấy nhân viên cần điều chuyển.") as T;
    const currentDepartment = store["/admin/departments"].find((item) => String(item.department_id) === String(detail.current_department_id ?? employee.department_id));
    const targetDepartment = store["/admin/departments"].find((item) => String(item.department_id) === String(detail.target_department_id));
    const currentPosition = store["/admin/positions"].find((item) => String(item.position_id) === String(detail.current_position_id ?? employee.position_id));
    const targetPosition = store["/admin/positions"].find((item) => String(item.position_id) === String(detail.target_position_id));
    const existing = method === "PUT" ? rows.find((item) => String(item[idField]) === id) : undefined;
    if (method === "PUT" && !existing) return failure("Không tìm thấy đề xuất điều chuyển.") as T;
    const nextRow = {
      ...(existing ?? {}),
      ...payload,
      [idField]: String(existing?.[idField] ?? payload[idField] ?? `mock-transfer-${Date.now()}`),
      employee_id: employee.employee_id,
      employee_name: employee.full_name,
      current_department_id: detail.current_department_id ?? employee.department_id,
      current_dept_name: currentDepartment?.department_name,
      current_position_id: detail.current_position_id ?? employee.position_id,
      current_pos_name: currentPosition?.position_name,
      target_department_id: detail.target_department_id,
      target_dept_name: targetDepartment?.department_name,
      target_position_id: detail.target_position_id,
      target_pos_name: targetPosition?.position_name,
      detail_items: details,
      effective_date: payload.effective_date ?? payload.proposed_effective_date,
    };
    if (method === "POST") rows.unshift(nextRow);
    else rows[rows.findIndex((item) => String(item[idField]) === id)] = nextRow;
    store[route] = rows;
    saveStore(store);
    return envelope(nextRow) as T;
  }

  if (route === "/hr/transfer-decisions" && method === "POST") {
    const details = parseDetailList(payload.detail_items);
    const detail = details[0] ?? {};
    const employee = store["/hr/employees"].find((item) => String(item.employee_id) === String(payload.employee_id ?? detail.employee_id));
    if (!employee) return failure("Mã nhân viên không tồn tại.") as T;
    const decisionType = String(payload.decision_type ?? "Thuyên chuyển");
    const targetDepartmentId = String(payload.target_department_id ?? detail.target_department_id ?? "");
    const targetPositionId = String(payload.target_position_id ?? detail.target_position_id ?? "");
    if (decisionType !== "Miễn nhiệm" && (!targetDepartmentId || !targetPositionId)) return failure("Thuyên chuyển hoặc bổ nhiệm phải có bộ phận mới và vị trí mới.") as T;
    const managerId = String(payload.manager_id ?? detail.manager_id ?? "");
    const decision = {
      ...payload,
      decision_id: `mock-transfer-decision-${Date.now()}`,
      decision_number: String(payload.decision_number ?? `QĐ-TCBN/${new Date().getFullYear()}/${String(rows.length + 1).padStart(3, "0")}`),
      employee_id: employee.employee_id,
      employee_name: employee.full_name,
      current_department_id: employee.department_id,
      current_dept_name: employee.department_name,
      current_position_id: employee.position_id,
      current_pos_name: employee.position_name,
      target_department_id: targetDepartmentId || undefined,
      target_dept_name: store["/admin/departments"].find((item) => String(item.department_id) === targetDepartmentId)?.department_name,
      target_position_id: targetPositionId || undefined,
      target_pos_name: store["/admin/positions"].find((item) => String(item.position_id) === targetPositionId)?.position_name,
      manager_id: managerId || undefined,
      manager_name: store["/hr/employees"].find((item) => String(item.employee_id) === managerId)?.full_name,
      detail_items: [{ ...detail, employee_id: employee.employee_id, current_department_id: employee.department_id, current_position_id: employee.position_id, target_department_id: targetDepartmentId, target_position_id: targetPositionId, manager_id: managerId }],
      status: "EXECUTED",
    };
    if (targetDepartmentId) { employee.department_id = targetDepartmentId; employee.department_name = decision.target_dept_name; }
    if (targetPositionId) { employee.position_id = targetPositionId; employee.position_name = decision.target_pos_name; }
    else if (decisionType === "Miễn nhiệm") employee.position_id = undefined;
    employee.manager_id = managerId || (decisionType === "Miễn nhiệm" ? undefined : employee.manager_id);
    employee.manager_name = store["/hr/employees"].find((item) => String(item.employee_id) === String(employee.manager_id))?.full_name;
    rows.unshift(decision);
    store[route] = rows;
    saveStore(store);
    return envelope(decision) as T;
  }

  if (route === "/reward-discipline/evaluations" && (method === "POST" || method === "PUT")) {
    const details = parseDetailList(payload.details);
    if (!details.length) return failure("Phiếu đánh giá phải có ít nhất một tiêu chí.") as T;
    if (details.some((detail) => Number(detail.weight) <= 0 || !Number.isFinite(Number(detail.score)) || Number(detail.score) < 0 || Number(detail.score) > 10)) return failure("Trọng số phải lớn hơn 0 và điểm phải nằm trong khoảng 0 đến 10.") as T;
    const employee = store["/hr/employees"].find((item) => String(item.employee_id) === String(payload.employee_id));
    const evaluator = store["/hr/employees"].find((item) => String(item.employee_id) === String(payload.evaluator_id));
    if (!employee || !evaluator) return failure("Nhân viên hoặc người đánh giá không tồn tại.") as T;
    const totalWeight = details.reduce((sum, detail) => sum + Number(detail.weight), 0);
    const totalScore = Math.round(details.reduce((sum, detail) => sum + Number(detail.score) * Number(detail.weight), 0) / totalWeight * 100) / 100;
    const gradeResult = totalScore >= 9 ? "Loại A+ (Xuất sắc)" : totalScore >= 8 ? "Loại A (Giỏi)" : totalScore >= 6.5 ? "Loại B (Tốt)" : totalScore >= 5 ? "Loại C (Trung bình)" : "Loại D (Yếu)";
    const existing = method === "PUT" ? rows.find((item) => String(item[idField]) === id) : undefined;
    if (method === "PUT" && !existing) return failure("Không tìm thấy phiếu đánh giá.") as T;
    const nextRow = {
      ...(existing ?? {}),
      ...payload,
      [idField]: String(existing?.[idField] ?? payload[idField] ?? `mock-evaluation-${Date.now()}`),
      evaluation_code: String(existing?.evaluation_code ?? `PĐG-${new Date().getFullYear()}-${String(rows.length + 1).padStart(3, "0")}`),
      employee_name: employee.full_name,
      evaluator_name: evaluator.full_name,
      department_name: employee.department_name,
      position_name: employee.position_name,
      details,
      total_score: totalScore,
      grade_result: gradeResult,
      status: "COMPLETED",
    };
    if (method === "POST") rows.unshift(nextRow);
    else rows[rows.findIndex((item) => String(item[idField]) === id)] = nextRow;
    store[route] = rows;
    saveStore(store);
    return envelope(nextRow) as T;
  }

  if (route === "/reward-discipline/proposals" && !action && (method === "POST" || method === "PUT")) {
    const employee = store["/hr/employees"].find((item) => String(item.employee_id) === String(payload.employee_id));
    if (!employee || !payload.record_type || !payload.reason) return failure("Nhân viên, loại đề xuất và lý do là bắt buộc.") as T;
    const existing = method === "PUT" ? rows.find((item) => String(item[idField]) === id) : undefined;
    if (method === "PUT" && !existing) return failure("Không tìm thấy đề xuất.") as T;
    const normalizedType = payload.record_type === "REWARD" ? "KHEN_THUONG" : payload.record_type === "DISCIPLINE" ? "KY_LUAT" : String(payload.record_type);
    const paymentMethod = ["CASH", "BANK_TRANSFER", "NOT_APPLICABLE"].includes(String(payload.payment_method ?? "")) ? String(payload.payment_method) : "";
    if (normalizedType === "KHEN_THUONG" && !paymentMethod) return failure("Hình thức chi trả là bắt buộc với đề xuất khen thưởng.") as T;
    if (payload.payment_method && !paymentMethod) return failure("Hình thức chi trả không hợp lệ.") as T;
    const department = store["/admin/departments"].find((item) => String(item.department_id) === String(employee.department_id));
    const nextRow = {
      ...(existing ?? {}),
      ...payload,
      [idField]: String(existing?.[idField] ?? payload[idField] ?? `mock-proposal-${Date.now()}`),
      proposal_code: String(existing?.proposal_code ?? `${normalizedType === "KHEN_THUONG" ? "DXKT" : "DXKL"}-${new Date().getFullYear()}-${String(rows.length + 1).padStart(3, "0")}`),
      record_type: normalizedType,
      employee_name: employee.full_name,
      employee_code: employee.employee_code,
      department_name: employee.department_name,
      department_manager_id: department?.manager_id,
      department_manager_name: department?.manager_name,
      position_name: employee.position_name,
      proposed_amount: Number(payload.proposed_amount) || 0,
      status: "PENDING",
    };
    if (method === "POST") rows.unshift(nextRow);
    else rows[rows.findIndex((item) => String(item[idField]) === id)] = nextRow;
    store[route] = rows;
    saveStore(store);
    return envelope(nextRow) as T;
  }

  if (route === "/reward-discipline" && (method === "POST" || method === "PUT")) {
    const employee = store["/hr/employees"].find((item) => String(item.employee_id) === String(payload.employee_id));
    const proposal = store["/reward-discipline/proposals"].find((item) => String(item.proposal_id) === String(payload.proposal_id));
    if (!employee || !payload.decision_type || !payload.reason || !payload.proposal_id) return failure("Nhân viên, đề xuất đã duyệt, loại quyết định và lý do là bắt buộc.") as T;
    if (!proposal || proposal.status !== "APPROVED" || String(proposal.employee_id) !== String(payload.employee_id)) return failure("Đề xuất phải tồn tại, được duyệt và cùng nhân viên với quyết định.") as T;
    const existing = method === "PUT" ? rows.find((item) => String(item[idField]) === id) : undefined;
    if (method === "PUT" && !existing) return failure("Không tìm thấy quyết định.") as T;
    const normalizedType = payload.decision_type === "REWARD" ? "KHEN_THUONG" : payload.decision_type === "DISCIPLINE" ? "KY_LUAT" : String(payload.decision_type);
    const nextRow = {
      ...(existing ?? {}),
      ...payload,
      [idField]: String(existing?.[idField] ?? payload[idField] ?? `mock-decision-${Date.now()}`),
      decision_no: String(existing?.decision_no ?? `${normalizedType === "KHEN_THUONG" ? "QĐ-KT" : "QĐ-KL"}/${new Date().getFullYear()}/${String(rows.length + 1).padStart(3, "0")}`),
      decision_type: normalizedType,
      employee_name: employee.full_name,
      employee_code: employee.employee_code,
      amount: Number(payload.amount) || 0,
      status: "COMPLETED",
    };
    if (method === "POST") rows.unshift(nextRow);
    else rows[rows.findIndex((item) => String(item[idField]) === id)] = nextRow;
    store[route] = rows;
    saveStore(store);
    return envelope(nextRow) as T;
  }

  if (method === "POST") {
    const newRow = { ...payload, [idField]: String(payload[idField] ?? `mock-${Date.now()}`) };
    rows.unshift(newRow);
    store[route] = rows;
    saveStore(store);
    return envelope(newRow) as T;
  }

  const row = rows.find((item) => String(item[idField]) === id);
  if (!row) return envelope(null) as T;

  if (method === "DELETE") {
    store[route] = rows.filter((item) => String(item[idField]) !== id);
    if (route === "/recruitment/interview-evaluations") {
      const candidate = store["/recruitment/candidates"].find((item) => String(item.candidate_id) === String(row.candidate_id));
      if (candidate && !store[route].some((item) => String(item.candidate_id) === String(row.candidate_id))) candidate.status = "đã sơ loại";
    }
    if (route === "/recruitment/pre-screenings") {
      const candidate = store["/recruitment/candidates"].find((item) => String(item.candidate_id) === String(row.candidate_id));
      if (candidate && !store[route].some((item) => String(item.candidate_id) === String(row.candidate_id))) candidate.status = "tiếp nhận hồ sơ";
    }
    saveStore(store);
    return envelope(row) as T;
  }

  Object.assign(row, payload);
  if (action === "approve" || action === "status") row.status = payload.status ?? "APPROVED";
  saveStore(store);
  return envelope(row) as T;
}

function candidatePipelineStages(candidates: MockRow[]) {
  return [
    ["Tiếp nhận hồ sơ", "tiếp nhận hồ sơ"],
    ["Đã sơ loại", "đã sơ loại"],
    ["Đã tạo lịch", "đã tạo lịch"],
    ["Đã phỏng vấn", "đã phỏng vấn"],
    ["Đã quyết định loại", "đã quyết định loại"],
    ["Đã quyết định tuyển", "đã quyết định tuyển"],
    ["Đi làm", "đi làm"],
  ].map(([label, status]) => ({
    label,
    count: candidates.filter((candidate) => normalizeCandidateStatus(candidate.status) === status).length,
  }));
}

function dashboardResponse(session?: Session) {
  const store = loadStore();
  const employees = store["/hr/employees"];
  const candidates = store["/recruitment/candidates"];
  const requests = store["/recruitment/requests"];
  const pendingItems = [
    ...requests.filter((item) => item.status === "PENDING").map((item) => ({ id: item.recruitment_request_id, code: item.request_code, typeName: "Tuyển dụng", title: item.reason ?? item.position_name, deptName: item.department_name, status: "Chờ duyệt" })),
    ...store["/hr/leave-applications"].filter((item) => item.status === "PENDING").map((item) => ({ id: item.leave_id, code: item.leave_code, typeName: "Nghỉ phép", title: item.reason, employeeName: item.employee_name, status: "Chờ duyệt" })),
    ...store["/hr/transfer-proposals"].filter((item) => item.status === "PENDING").map((item) => ({ id: item.proposal_id, code: item.proposal_code, typeName: "Thuyên chuyển", title: item.decision_type, employeeName: item.employee_name, status: "Chờ duyệt" })),
  ];
  const countByDepartment = store["/admin/departments"].map((department) => ({
    department_name: department.department_name,
    count: employees.filter((employee) => employee.department_id === department.department_id && employee.employment_status === "WORKING").length,
    target: Number(department.target_headcount ?? 0),
  }));
  const role = session?.role;
  if (["Administrator", "Ban Giám Đốc", "Trưởng Khối", "Trưởng Phòng"].includes(String(role))) {
    const manager = ["Trưởng Khối", "Trưởng Phòng"].includes(String(role))
      ? employees.find((item) => String(item.employee_id) === String(session?.employeeId)) ?? employees.find((item) => item.department_id === "dept-cloud")
      : undefined;
    const scopeDepartmentIds = manager ? [String(manager.department_id)] : store["/admin/departments"].map((item) => String(item.department_id));
    const scopeEmployees = employees.filter((item) => scopeDepartmentIds.includes(String(item.department_id)));
    const workingEmployees = scopeEmployees.filter((item) => item.employment_status === "WORKING" && item.is_active !== 0);
    const scopedContracts = store["/hr/contracts"].filter((item) => scopeDepartmentIds.includes(String(employees.find((employee) => String(employee.employee_id) === String(item.employee_id))?.department_id)));
    const now = Date.now();
    const expiringContracts = scopedContracts.filter((item) => {
      const endDate = new Date(String(item.end_date)).getTime();
      return item.status === "ACTIVE" && Number.isFinite(endDate) && endDate >= now && endDate <= now + 60 * 86400000;
    }).map((item) => {
      const endDate = new Date(String(item.end_date)).getTime();
      const daysRemaining = Math.max(0, Math.ceil((endDate - now) / 86400000));
      const employee = employees.find((row) => String(row.employee_id) === String(item.employee_id));
      return { id: String(item.contract_id), employee_code: employee?.employee_code, employee_name: String(item.employee_name ?? employee?.full_name ?? "-"), position_name: String(employee?.position_name ?? item.employee_position ?? "-"), contract_type: String(item.contract_type ?? "-"), end_date: String(item.end_date), days_remaining: daysRemaining, status_label: `Còn ${daysRemaining} ngày` };
    });
    const probationEmployees = workingEmployees.filter((employee) => scopedContracts.some((contract) => String(contract.employee_id) === String(employee.employee_id) && (Number(contract.has_probation) === 1 || String(contract.contract_type ?? "").toLocaleLowerCase().includes("thử việc"))));
    const waitingForWork = candidates.filter((candidate) => scopeDepartmentIds.includes(String(candidate.department_id)) && ["đã quyết định tuyển", "S5: Trúng tuyển", "PASSED", "OFFER_ACCEPTED"].includes(String(candidate.status)) && !employees.some((employee) => String(employee.candidate_id) === String(candidate.candidate_id))).length;
    const departments = countByDepartment.filter((item) => scopeDepartmentIds.includes(String(store["/admin/departments"].find((department) => department.department_name === item.department_name)?.department_id)));
    const headcountTarget = departments.reduce((sum, department) => sum + Number(department.target ?? 0), 0);
    return {
      scopeName: manager?.department_name ?? "Toàn công ty",
      workforce: {
        currentEmployees: workingEmployees.length,
        headcountTarget,
        fulfillmentRate: headcountTarget ? Math.round((workingEmployees.length / headcountTarget) * 100) : 0,
        expiringContractsCount: expiringContracts.length,
        departments,
        statuses: [
          { code: "WORKING", label: "Đang làm việc", count: Math.max(0, workingEmployees.length - probationEmployees.length) },
          { code: "RESIGNED", label: "Đã nghỉ việc", count: scopeEmployees.filter((item) => item.employment_status === "RESIGNED" || item.is_active === 0).length },
          { code: "PROBATION", label: "Đang thử việc", count: probationEmployees.length },
          { code: "WAITING_FOR_WORK", label: "Chờ nhận việc", count: waitingForWork },
        ],
        expiringContracts,
      },
    };
  }
  if (role === "Administrator") {
    return {
      kpi: { totalUsers: 24, activeUsers: 22, lockedUsers: 2, totalDepartments: store["/admin/departments"].length, totalEmployees: employees.length, totalPositions: store["/admin/positions"].length },
      employeesByDept: countByDepartment,
    };
  }
  if (role === "HR Staff") {
    const pendingRequests = requests.filter((item) => item.status === "PENDING");
    return {
       kpi: { totalRequests: requests.length, pendingRequests: pendingRequests.length, recruitingRequests: requests.filter((item) => ["APPROVED", "IN_PROGRESS", "RECRUITING"].includes(String(item.status))).length, totalCandidates: candidates.length, processingCandidates: candidates.filter((item) => !["đi làm", "đã quyết định loại"].includes(normalizeCandidateStatus(item.status))).length, upcomingInterviews: 2, pendingOffers: store["/recruitment/offers"].filter((item) => ["SENT", "PENDING"].includes(String(item.offer_status))).length },
      charts: { deptStructure: countByDepartment },
       actionNeeded: { recruitment: { pendingRequests, candidatesToScreen: candidates.filter((item) => normalizeCandidateStatus(item.status) === "tiếp nhận hồ sơ"), upcomingInterviews: [], pendingOffers: [] } },
       pipelineStages: candidatePipelineStages(candidates),
    };
  }
  if (role === "Ban Giám Đốc") {
    const pendingApprovals = pendingItems.map((item) => ({ ...item, currentLevel: "Cấp Ban Giám Đốc" }));
    return {
      kpi: { totalEmployees: employees.length, activeEmployees: employees.filter((item) => item.employment_status === "WORKING").length, newEmployeesPeriod: 9, resignedEmployeesPeriod: 1, openPositionsCount: requests.filter((item) => ["APPROVED", "IN_PROGRESS"].includes(String(item.status))).length, pendingRequestsCount: requests.filter((item) => item.status === "PENDING").length, pendingApprovalsCount: pendingApprovals.length },
      pendingApprovals,
      deptStructure: countByDepartment,
      recruitmentOverview: { totalTarget: requests.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0), totalHired: candidates.filter((item) => normalizeCandidateStatus(item.status) === "đi làm").length, remainingShortfall: Math.max(0, requests.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0) - candidates.filter((item) => normalizeCandidateStatus(item.status) === "đi làm").length), completionRate: 60 },
    };
  }
  if (role === "Nhân viên") {
    const employee = employees.find((item) => String(item.employee_id) === String(session?.employeeId)) ?? employees[0];
    const leaves = store["/hr/leave-applications"].filter((item) => String(item.employee_id) === String(employee?.employee_id));
    const evaluation = store["/reward-discipline/evaluations"].find((item) => String(item.employee_id) === String(employee?.employee_id));
    const balance = employee?.employee_id === "emp-hr-02" ? { entitled: 12, used: 4, remaining: 8 } : { entitled: 12, used: 3, remaining: 9 };
    return { kpi: { remainingLeave: balance.remaining, pendingLeaveCount: leaves.filter((item) => item.status === "PENDING").length }, personal: { leaveYear: 2026, usedLeave: balance.used, entitledLeave: balance.entitled, latestScore: evaluation?.total_score, latestGrade: evaluation?.grade_result, contractStatus: "Hiệu lực", employmentStatus: employee?.employment_status === "WORKING" ? "Đang làm việc" : employee?.employment_status, joinDate: employee?.join_date, department: employee?.department_name, managerName: employee?.manager_name }, pendingApprovals: leaves.filter((item) => item.status === "PENDING").map((item) => ({ id: item.leave_id, code: item.leave_code, reason: item.reason, status: item.status })) };
  }
  if (role === "Trưởng Khối" || role === "Trưởng Phòng") {
    const manager = employees.find((item) => String(item.employee_id) === String(session?.employeeId)) ?? { department_id: "dept-cloud", department_name: session?.department ?? "Đơn vị", full_name: session?.name ?? "Quản lý" };
    const teamEmployees = employees.filter((item) => item.department_id === manager?.department_id && item.employment_status === "WORKING");
    const teamRequests = requests.filter((item) => item.department_id === manager?.department_id);
    const teamCandidates = candidates.filter((item) => item.department_id === manager?.department_id);
    const teamEmployeeNames = new Set(teamEmployees.map((item) => String(item.full_name ?? "")));
    const teamPending = pendingItems.filter((item) => (item as MockRow).deptName === manager?.department_name || teamEmployeeNames.has(String((item as MockRow).employeeName ?? "")));
    return { kpi: { totalEmployees: teamEmployees.length, activeEmployees: teamEmployees.length, totalRequests: teamRequests.length, pendingRequests: teamRequests.filter((item) => item.status === "PENDING").length, openPositionsCount: teamRequests.filter((item) => ["APPROVED", "IN_PROGRESS"].includes(String(item.status))).length, processingCandidates: teamCandidates.filter((item) => !["đi làm", "đã quyết định loại"].includes(normalizeCandidateStatus(item.status))).length, pendingApprovalsCount: teamPending.length }, charts: { deptStructure: [{ department_name: manager?.department_name ?? session?.department ?? "Đơn vị", count: teamEmployees.length }] }, deptStructure: [{ department_name: manager?.department_name ?? session?.department ?? "Đơn vị", count: teamEmployees.length }], pendingApprovals: teamPending, pipelineStages: candidatePipelineStages(teamCandidates) };
  }
  return {
    kpi: {
      totalEmployees: employees.length,
      activeEmployees: employees.filter((item) => item.employment_status === "WORKING").length,
      openPositionsCount: requests.filter((item) => item.status === "APPROVED" || item.status === "IN_PROGRESS").length,
       processingCandidates: candidates.filter((item) => !["đi làm", "đã quyết định loại"].includes(normalizeCandidateStatus(item.status))).length,
      pendingApprovalsCount: pendingItems.length,
    },
    charts: { deptStructure: countByDepartment },
    pendingApprovals: pendingItems,
    pipelineStages: candidatePipelineStages(candidates),
  };
}
