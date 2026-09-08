"use client";

import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Filter,
  ImageUp,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  UserRoundCheck,
  X,
  XCircle,
} from "lucide-react";
import {
  useState,
  useSyncExternalStore,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import {
  canAccess,
  type Action,
  type Resource,
  type Session,
} from "@/lib/permissions";
import { getStoredSession, subscribeToSession } from "@/lib/session";
import { moduleData } from "@/lib/mock-data";
import {
  getWorkspaceTab,
  workspaceTabs,
  type WorkspaceField,
  type WorkspaceName,
  type WorkspaceTab,
} from "@/lib/workspace-config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popup, type PopupVariant } from "@/components/ui/popup";
import { ReportsWorkspace } from "@/components/reports-workspace";

type Row = Record<string, unknown>;
type ModuleName = WorkspaceName | "reports";
type PopupState = {
  variant: PopupVariant;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  resolve?: (confirmed: boolean) => void;
};

const editableTabs = new Set([
  "quota",
  "quotas",
  "requests",
  "candidates",
  "screenings",
  "schedules",
  "interview-evaluations",
  "offers",
  "employees",
  "departments",
  "positions",
  "contracts",
  "transfer-proposals",
  "criteria",
  "evaluations",
  "proposals",
  "decisions",
]);
const undeletableTabs = new Set(["work-history"]);

const workspaceTitles: Record<WorkspaceName, Record<string, string>> = {
  recruitment: {
    quota: "Quản lý định biên nhân sự",
    plans: "Quản lý kế hoạch tuyển dụng",
    requests: "Quản lý yêu cầu tuyển dụng",
    candidates: "Quản lý hồ sơ ứng viên",
    screenings: "Quản lý sơ loại ứng viên",
    schedules: "Quản lý lịch phỏng vấn",
    "interview-evaluations": "Quản lý đánh giá phỏng vấn",
    offers: "Quản lý offer tuyển dụng",
    conversion: "Chuyển ứng viên thành nhân viên",
  },
  people: {
    employees: "Quản lý hồ sơ nhân sự",
    quotas: "Quản lý định biên nhân sự",
    departments: "Quản lý danh mục bộ phận",
    positions: "Quản lý danh mục vị trí công việc",
    "contract-proposals": "Quản lý đề xuất hợp đồng lao động",
    contracts: "Quản lý hợp đồng lao động",
    "expiring-contracts": "Theo dõi hợp đồng sắp hết hạn",
    "contract-extensions": "Quản lý gia hạn hợp đồng lao động",
    leave: "Quản lý đơn xin nghỉ phép",
    "transfer-proposals": "Quản lý đề xuất thuyên chuyển, bổ nhiệm",
    "transfer-decisions": "Quản lý quyết định thuyên chuyển, bổ nhiệm",
    "resignation-applications": "Quản lý đơn xin nghỉ việc",
    "resignation-decisions": "Quản lý quyết định nghỉ việc",
    "work-history": "Tra cứu quá trình công tác",
  },
  rewards: {
    criteria: "Quản lý tiêu chí đánh giá",
    evaluations: "Quản lý phiếu đánh giá",
    proposals: "Quản lý đề xuất thưởng phạt",
    decisions: "Quản lý quyết định khen thưởng, kỷ luật",
    history: "Tra cứu lịch sử đánh giá và ghi nhận",
  },
};

const labels: Record<string, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  WORKING: "Đang làm việc",
  RESIGNED: "Nghỉ việc",
  COMPLETED: "Hoàn tất",
};

const detailLabels: Record<string, string> = {
  id: "Mã định danh",
  created_date: "Ngày tạo",
  last_modified_date: "Ngày cập nhật",
  status: "Trạng thái",
  note: "Ghi chú",
  description: "Mô tả",
  reason: "Lý do",
  content: "Nội dung",
  employee_id: "Mã nhân viên",
  employee_code: "Mã nhân viên",
  employee_name: "Nhân viên",
  full_name: "Họ và tên",
  short_name: "Tên viết tắt",
  avatar_url: "URL ảnh hồ sơ",
  employment_status: "Trạng thái làm việc",
  department_id: "Mã bộ phận",
  department_code: "Mã bộ phận",
  department_name: "Bộ phận",
  parent_department_id: "Mã bộ phận cha",
  parent_department_name: "Bộ phận cha",
  position_id: "Mã vị trí",
  position_code: "Mã vị trí",
  position_name: "Vị trí công việc",
  manager_id: "Mã quản lý trực tiếp",
  manager_name: "Quản lý trực tiếp",
  level: "Cấp bậc",
  join_date: "Ngày vào làm",
  initial_contract_date: "Ngày hợp đồng đầu tiên",
  official_date: "Ngày chính thức",
  resignation_date: "Ngày nghỉ việc",
  date_of_birth: "Ngày sinh",
  place_of_birth: "Nơi sinh",
  hometown: "Nguyên quán",
  gender: "Giới tính",
  nationality: "Quốc tịch",
  ethnicity: "Dân tộc",
  religion: "Tôn giáo",
  marital_status: "Tình trạng hôn nhân",
  citizen_id: "Số CCCD",
  citizen_issue_date: "Ngày cấp CCCD",
  citizen_issue_place: "Nơi cấp CCCD",
  citizen_expiry_date: "Ngày hết hạn CCCD",
  phone: "Số điện thoại",
  email: "Email",
  personal_email: "Email cá nhân",
  company_email: "Email công ty",
  address: "Địa chỉ hiện tại",
  permanent_address: "Địa chỉ thường trú",
  blood_type: "Nhóm máu",
  tax_code: "Mã số thuế",
  emergency_contact_name: "Người liên hệ khẩn cấp",
  emergency_contact_relationship: "Quan hệ người liên hệ",
  emergency_contact_phone: "SĐT liên hệ khẩn cấp",
  bank_account_number: "Số tài khoản ngân hàng",
  bank_account_holder: "Chủ tài khoản",
  bank_name: "Ngân hàng",
  bank_branch: "Chi nhánh ngân hàng",
  culture_level: "Trình độ văn hóa",
  education_level: "Trình độ đào tạo",
  education_school: "Trường đào tạo",
  major: "Chuyên ngành",
  gpa: "Điểm trung bình",
  graduation_year: "Năm tốt nghiệp",
  candidate_id: "Mã ứng viên",
  candidate_code: "Mã ứng viên",
  candidate_name: "Ứng viên",
  apply_position_name: "Vị trí ứng tuyển",
  recruitment_plan_id: "Mã kế hoạch tuyển dụng",
  recruitment_request_id: "Mã yêu cầu tuyển dụng",
  request_code: "Mã yêu cầu tuyển dụng",
  plan_name: "Tên kế hoạch tuyển dụng",
  source: "Nguồn tuyển dụng",
  referrer: "Người giới thiệu",
  referrer_employee_id: "Mã nhân viên giới thiệu",
  received_date: "Ngày tiếp nhận",
  expected_date: "Ngày cần người",
  expected_start_date: "Ngày dự kiến đi làm",
  quantity: "Số lượng",
  priority: "Mức ưu tiên",
  is_outside_headcount: "Ngoài định biên",
  screening_code: "Mã phiếu sơ loại",
  pre_screening_id: "Mã phiếu sơ loại",
  criteria_detail_id: "Mã chi tiết tiêu chí",
  row_order: "Thứ tự",
  screening_date: "Ngày sơ loại",
  screening_result: "Kết quả sơ loại",
  level_score: "Điểm phù hợp",
  comment: "Nhận xét",
  required_from: "Nguồn yêu cầu",
  required_description: "Yêu cầu cần đáp ứng",
  candidate_value: "Thông tin ứng viên",
  candidate_description: "Mô tả ứng viên",
  schedule_id: "Mã lịch phỏng vấn",
  schedule_code: "Mã lịch phỏng vấn",
  schedule_candidate_id: "Mã ứng viên trong lịch",
  panel_member_id: "Mã thành viên hội đồng",
  round_type: "Vòng tuyển dụng",
  format_type: "Hình thức phỏng vấn",
  location: "Địa điểm / Link họp",
  start_time: "Thời điểm bắt đầu",
  end_time: "Thời điểm kết thúc",
  candidate_note: "Lưu ý ứng viên",
  candidates: "Danh sách ứng viên",
  candidates_json: "Danh sách ứng viên",
  council: "Hội đồng phỏng vấn",
  council_json: "Hội đồng phỏng vấn",
  tests: "Bài thi",
  tests_json: "Bài thi",
  is_decision_maker: "Người quyết định",
  test_name: "Tên bài thi",
  expected_score: "Điểm yêu cầu",
  duration_minutes: "Thời lượng (phút)",
  exam_file: "Tệp đề thi",
  exam_file_name: "Tệp đề thi",
  answer_file: "Tệp đáp án",
  answer_file_name: "Tệp đáp án",
  evaluator_id: "Mã người đánh giá",
  evaluator_name: "Người đánh giá",
  interview_eval_id: "Mã phiếu đánh giá phỏng vấn",
  evaluation_id: "Mã phiếu đánh giá",
  evaluation_code: "Mã phiếu đánh giá",
  evaluation_date: "Ngày đánh giá",
  evaluation_quarter: "Quý đánh giá",
  total_score: "Tổng điểm",
  grade_result: "Xếp loại",
  manager_comment: "Nhận xét quản lý",
  recommendation: "Đề xuất",
  criteria_id: "Mã tiêu chí",
  criteria_code: "Mã tiêu chí",
  criteria_name: "Tên tiêu chí",
  criteria_type: "Loại tiêu chí",
  weight: "Trọng số",
  score: "Điểm",
  offer_id: "Mã offer",
  offer_date: "Ngày offer",
  offer_status: "Trạng thái offer",
  probation_salary: "Lương thử việc",
  official_salary: "Lương chính thức",
  salary_offer: "Lương đề nghị",
  contract_id: "Mã hợp đồng",
  contract_no: "Số hợp đồng",
  contract_type: "Loại hợp đồng",
  contract_date: "Ngày ký hợp đồng",
  start_date: "Ngày bắt đầu",
  end_date: "Ngày kết thúc",
  signer_id: "Mã người ký",
  signer_name: "Người ký",
  signer_position: "Chức vụ người ký",
  employee_position: "Vị trí nhân viên",
  base_salary: "Lương cơ sở",
  social_insurance_salary: "Lương đóng BHXH",
  salary_scale: "Thang lương",
  salary_grade: "Bậc lương",
  allowance_details: "Chi tiết phụ cấp",
  job_description: "Mô tả công việc",
  proposal_id: "Mã đề xuất",
  proposal_code: "Mã đề xuất",
  proposal_date: "Ngày lập đề xuất",
  proposed_salary: "Lương đề xuất",
  proposed_amount: "Số tiền đề xuất",
  proposed_by: "Người đề xuất",
  proposed_by_employee_id: "Mã nhân viên đề xuất",
  effective_date: "Ngày hiệu lực",
  proposed_effective_date: "Ngày hiệu lực đề xuất",
  decision_id: "Mã quyết định",
  decision_no: "Số quyết định",
  decision_number: "Số quyết định",
  decision_date: "Ngày ban hành",
  decision_type: "Loại quyết định",
  decision_by: "Người ký quyết định",
  signed_by: "Người ký",
  target_department_id: "Mã bộ phận mới",
  target_dept_name: "Bộ phận mới",
  target_position_id: "Mã vị trí mới",
  target_pos_name: "Vị trí mới",
  transfer_type: "Loại điều chuyển",
  leave_id: "Mã đơn nghỉ phép",
  leave_code: "Mã đơn nghỉ phép",
  leave_type: "Loại nghỉ phép",
  total_days: "Tổng số ngày nghỉ",
  approver_id: "Mã người duyệt",
  approver_name: "Người duyệt",
  approver_note: "Ghi chú người duyệt",
  approval_history: "Lịch sử phê duyệt",
  related_person_id: "Mã người liên quan",
  application_id: "Mã đơn xin nghỉ việc",
  application_code: "Mã đơn xin nghỉ việc",
  desired_resign_date: "Ngày nghỉ dự kiến",
  official_resign_date: "Ngày nghỉ chính thức",
  handover_notes: "Nội dung bàn giao",
  handover_status: "Trạng thái bàn giao",
  work_history_id: "Mã quá trình công tác",
  kind: "Loại hồ sơ",
  code: "Mã / Số",
  date: "Ngày",
  quota_id: "Mã định biên",
  quota_code: "Mã phiếu định biên",
  target_headcount: "Định biên",
  current_headcount: "Nhân sự hiện tại",
  needed_headcount: "Số lượng cần tuyển",
  max_capacity: "Sức chứa tối đa",
  budget: "Ngân sách",
  budget_details: "Chi tiết ngân sách",
  detail_items: "Danh sách nhân sự",
  details: "Chi tiết",
  details_json: "Chi tiết dữ liệu",
  attachments: "Tài liệu đính kèm",
  attachments_json: "Tài liệu đính kèm",
  attachment_id: "Mã tài liệu",
  file_name: "Tên tệp",
  file_url: "Đường dẫn tệp",
  uploaded_date: "Ngày tải lên",
  is_active: "Đang hoạt động",
  is_foreign: "Nhân sự nước ngoài",
  contracts: "Danh sách hợp đồng",
  sign_date: "Ngày ký",
  has_probation: "Có thử việc",
  probation_from_date: "Bắt đầu thử việc",
  probation_to_date: "Kết thúc thử việc",
  probation_salary_rate: "Tỷ lệ lương thử việc",
  salary: "Mức lương",
  attachment_url: "Tệp đính kèm",
  workHistory: "Quá trình công tác",
  source_type: "Nguồn biến động",
  source_id: "Mã nguồn biến động",
  rewards: "Khen thưởng / kỷ luật",
  reward_discipline_id: "Mã khen thưởng / kỷ luật",
  amount: "Số tiền",
  leaveBalances: "Số dư ngày phép",
  leave_balance_id: "Mã số dư ngày phép",
  leave_year: "Năm phép",
  entitled_days: "Ngày phép được hưởng",
  carried_forward_days: "Ngày phép chuyển kỳ",
  used_days_before: "Đã dùng trước đó",
  used_days: "Đã sử dụng",
  remaining_days_before: "Còn lại trước đó",
  remaining_days_after: "Còn lại sau đó",
  remaining_days: "Ngày phép còn lại",
  calculation_note: "Ghi chú tính phép",
  last_calculated_date: "Ngày tính phép gần nhất",
};

const detailTermLabels: Record<string, string> = {
  id: "Mã",
  name: "tên",
  code: "mã",
  date: "ngày",
  time: "thời gian",
  type: "loại",
  status: "trạng thái",
  employee: "nhân viên",
  candidate: "ứng viên",
  department: "bộ phận",
  position: "vị trí",
  manager: "quản lý",
  created: "tạo",
  modified: "cập nhật",
  updated: "cập nhật",
  result: "kết quả",
  amount: "số tiền",
  count: "số lượng",
  number: "số",
  file: "tệp",
  url: "đường dẫn",
  image: "ảnh",
  avatar: "ảnh hồ sơ",
};

function detailLabel(tab: WorkspaceTab, key: string) {
  const configuredField = tab.fields.find((field) => field.name === key);
  if (configuredField)
    return configuredField.label.replace(/\s+\(JSON\)$/, "");
  const configuredColumn = tab.columns.find((column) => column.key === key);
  if (configuredColumn) return configuredColumn.label;
  if (detailLabels[key]) return detailLabels[key];
  return key
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .split("_")
    .filter(Boolean)
    .map((term) => detailTermLabels[term.toLowerCase()] ?? term)
    .join(" ")
    .replace(/^./, (value) => value.toUpperCase());
}

function localizeDetailObject(value: unknown, tab: WorkspaceTab, key = ""): unknown {
  if (Array.isArray(value))
    return value.map((item) => localizeDetailObject(item, tab));
  if (
    typeof value === "string" &&
    (key.endsWith("_json") || key.endsWith("_details"))
  ) {
    try {
      return localizeDetailObject(JSON.parse(value), tab, key);
    } catch {
      return value;
    }
  }
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        detailLabel(tab, key),
        localizeDetailObject(item, tab, key),
      ]),
    );
  return key ? displayCell(key, value) : value;
}

function displayDetailValue(tab: WorkspaceTab, key: string, value: unknown) {
  if (value && typeof value === "object")
    return JSON.stringify(localizeDetailObject(value, tab), null, 2);
  return displayCell(key, value);
}

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "object") return JSON.stringify(value);
  const text = String(value);
  return labels[text] ?? text;
}

function displayCell(key: string, value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (["is_active", "is_foreign", "has_probation"].includes(key))
    return Number(value) ? "Có" : "Không";
  if (/date|_time|_at$/i.test(key)) {
    const date =
      typeof value === "number" ? new Date(value) : new Date(String(value));
    if (!Number.isNaN(date.getTime()))
      return key.endsWith("time")
        ? date.toLocaleString("vi-VN")
        : date.toLocaleDateString("vi-VN");
  }
  return displayValue(value);
}

function parseDetailList(value: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(value)) {
    return value.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"));
  }
  if (typeof value === "string") {
    try {
      return parseDetailList(JSON.parse(value));
    } catch {
      return [];
    }
  }
  return [];
}

function quotaNumber(value: unknown) {
  return Number(value ?? 0).toLocaleString("vi-VN");
}

function QuotaDetail({ row }: { row: Row }) {
  const details = parseDetailList(row.details);
  const budgetDetails = parseDetailList(row.budget_details);
  const overview: Array<[string, unknown]> = [
    ["Mã định biên", row.quota_id], ["Số phiếu", row.quota_code],
    ["Ngày lập phiếu", row.created_date], ["Ngày áp dụng", row.effective_date],
    ["Mã bộ phận", row.department_id], ["Bộ phận", row.department_name],
    ["Người lập", row.creator_name], ["Tổng định biên", quotaNumber(row.target_headcount)],
    ["Sức chứa tối đa", quotaNumber(row.max_capacity)], ["Số lượng hiện tại", quotaNumber(row.current_headcount)],
    ["Cần tuyển", quotaNumber(row.needed_headcount)], ["Ngân sách tuyển dụng", `${quotaNumber(row.budget)} VNĐ`],
    ["Trạng thái", displayValue(row.status)], ["Diễn giải", row.description],
  ];
  return (
    <div className="space-y-5">
      <section>
        <h3 className="mb-3 font-display text-sm font-bold text-slate-900">1. Thông tin chung</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {overview.map(([label, value]) => <div key={label} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3"><div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</div><div className="mt-1 break-words text-sm text-slate-700">{label.includes("Ngày") ? displayCell("date", value) : value == null || value === "" ? "-" : String(value)}</div></div>)}
        </div>
      </section>
      <section>
        <h3 className="mb-3 font-display text-sm font-bold text-slate-900">2. Chi tiết vị trí định biên</h3>
        <div className="overflow-x-auto rounded-xl border border-slate-100"><table className="w-full min-w-[980px] text-left text-xs"><thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400"><tr>{["STT", "Mã vị trí", "Tên vị trí", "Định biên", "Nghỉ việc dự kiến", "Thai sản dự kiến", "Hiện tại", "Cần tuyển", "Ghi chú"].map((header) => <th key={header} className="px-3 py-3 font-bold">{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{details.length ? details.map((detail, index) => <tr key={`${String(detail.position_id ?? "position")}-${index}`}><td className="px-3 py-3 text-slate-400">{String(index + 1).padStart(2, "0")}</td><td className="px-3 py-3 font-mono font-bold text-teal-700">{displayValue(detail.position_code ?? detail.position_id)}</td><td className="px-3 py-3 font-semibold text-slate-700">{displayValue(detail.position_name)}</td><td className="px-3 py-3 text-center">{quotaNumber(detail.target_headcount)}</td><td className="px-3 py-3 text-center">{quotaNumber(detail.resignation_count)}</td><td className="px-3 py-3 text-center">{quotaNumber(detail.maternity_count)}</td><td className="px-3 py-3 text-center font-semibold text-emerald-700">{quotaNumber(detail.current_headcount)}</td><td className="px-3 py-3 text-center font-semibold text-blue-700">{quotaNumber(detail.needed_headcount)}</td><td className="px-3 py-3 text-slate-600">{displayValue(detail.note)}</td></tr>) : <tr><td colSpan={9} className="px-3 py-8 text-center text-slate-400">Chưa có chi tiết vị trí định biên.</td></tr>}</tbody></table></div>
      </section>
      <section>
        <h3 className="mb-3 font-display text-sm font-bold text-slate-900">3. Ngân sách dự kiến</h3>
        <div className="overflow-x-auto rounded-xl border border-slate-100"><table className="w-full min-w-[680px] text-left text-xs"><thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400"><tr>{["STT", "Loại chi phí", "Nguồn tuyển dụng", "Chi phí dự kiến"].map((header) => <th key={header} className="px-3 py-3 font-bold">{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{budgetDetails.length ? budgetDetails.map((detail, index) => <tr key={`${String(detail.cost_type ?? "cost")}-${index}`}><td className="px-3 py-3 text-slate-400">{String(index + 1).padStart(2, "0")}</td><td className="px-3 py-3 font-semibold text-slate-700">{displayValue(detail.cost_type)}</td><td className="px-3 py-3 text-slate-600">{displayValue(detail.source)}</td><td className="px-3 py-3 text-right font-semibold text-emerald-700">{quotaNumber(detail.estimated_cost)} VNĐ</td></tr>) : <tr><td colSpan={4} className="px-3 py-8 text-center text-slate-400">Chưa có chi tiết ngân sách dự kiến.</td></tr>}</tbody><tfoot className="bg-slate-50 font-bold text-slate-700"><tr><td colSpan={3} className="px-3 py-3 text-right">Tổng ngân sách dự kiến</td><td className="px-3 py-3 text-right text-emerald-700">{quotaNumber(budgetDetails.reduce((sum, item) => sum + (Number(item.estimated_cost) || 0), 0))} VNĐ</td></tr></tfoot></table></div>
      </section>
    </div>
  );
}

function formatDateValue(value: unknown) {
  if (!value) return "";
  const date =
    typeof value === "number" ? new Date(value) : new Date(String(value));
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toISOString().slice(0, 10);
}

function formatDateTimeValue(value: unknown) {
  if (!value) return "";
  const date =
    typeof value === "number" ? new Date(value) : new Date(String(value));
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toISOString().slice(0, 16);
}

function fieldValue(field: WorkspaceField, value: unknown) {
  if (field.type === "date") return formatDateValue(value);
  if (field.type === "datetime-local") return formatDateTimeValue(value);
  if (field.type === "json")
    return typeof value === "string"
      ? value
      : value
        ? JSON.stringify(value, null, 2)
        : "";
  if (value === null || value === undefined) return "";
  return String(value);
}

function rowId(tab: WorkspaceTab, row: Row) {
  return String(row[tab.idField] ?? row.id ?? row.code ?? "");
}

function defaultForm(tab: WorkspaceTab) {
  return Object.fromEntries(
    tab.fields.map((field) => [field.name, field.options?.[0]?.value ?? ""]),
  );
}

type RequestLookups = {
  departments: Row[];
  positions: Row[];
  employees: Row[];
  quotas: Row[];
};

type CandidateLookups = RequestLookups & {
  requests: Row[];
  plans: Row[];
  candidates: Row[];
  screenings: Row[];
  decisions: Row[];
};

type EvaluationLookups = CandidateLookups & {
  schedules: Row[];
  offers: Row[];
};

const screeningCriteriaTypes = [
  "Năng lực chuyên môn",
  "Kinh nghiệm",
  "Ngoại ngữ",
  "Thái độ / văn hóa",
  "Khác",
];

function ScreeningForm({
  values,
  setValues,
  lookups,
}: {
  values: Record<string, string>;
  setValues: (updater: (current: Record<string, string>) => Record<string, string>) => void;
  lookups: CandidateLookups;
}) {
  const [activeTab, setActiveTab] = useState<"candidate" | "criteria" | "assessment">("candidate");
  const candidate = lookups.candidates.find((item) => String(item.candidate_id ?? "") === values.candidate_id);
  const criteria = parseDetailList(values.criteria);
  const set = (name: string, value: string) => setValues((current) => ({ ...current, [name]: value }));
  const updateCriteria = (next: Array<Record<string, unknown>>) => set("criteria", JSON.stringify(next));
  const updateCriterion = (index: number, name: string, value: unknown) => {
    const next = [...criteria];
    next[index] = { ...next[index], [name]: value };
    updateCriteria(next);
  };
  const criterionRow = { criteria_type: screeningCriteriaTypes[0], required_from: "", candidate_value: "", candidate_description: "", is_passed: true, note: "" };

  return (
    <div className="space-y-5">
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {[["candidate", "1. Thông tin ứng viên"], ["criteria", "2. Điều kiện sơ loại"], ["assessment", "3. Đánh giá sơ loại"]].map(([key, label]) => (
          <button key={key} type="button" onClick={() => setActiveTab(key as typeof activeTab)} className={`whitespace-nowrap border-b-2 px-4 py-3 text-xs font-bold ${activeTab === key ? "border-teal-600 text-teal-700" : "border-transparent text-slate-400"}`}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === "candidate" && (
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">Ứng viên *</label>
            <select className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" value={values.candidate_id ?? ""} required disabled={Boolean(values.candidate_id)} onChange={(event) => set("candidate_id", event.target.value)}>
              <option value="">-- Chọn ứng viên --</option>
              {lookups.candidates.map((item) => <option key={String(item.candidate_id)} value={String(item.candidate_id)}>{String(item.candidate_code ?? item.candidate_id)} - {String(item.full_name ?? "")}</option>)}
            </select>
            {values.candidate_id && <p className="mt-1 text-[11px] text-slate-400">Thông tin được lấy tự động từ hồ sơ ứng viên và không chỉnh sửa tại phiếu sơ loại.</p>}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {["candidate_code", "full_name", "phone", "email", "received_date", "culture_level", "education_level", "education_school", "apply_position_name", "department_name"].map((name) => {
              const labels: Record<string, string> = { candidate_code: "Mã ứng viên", full_name: "Họ tên", phone: "Số điện thoại", email: "Email", received_date: "Ngày nhận hồ sơ", culture_level: "Trình độ văn hóa", education_level: "Trình độ chuyên môn", education_school: "Trường đào tạo", apply_position_name: "Vị trí ứng tuyển", department_name: "Bộ phận" };
              return <div key={name}><label className="mb-1.5 block text-xs font-bold text-slate-600">{labels[name]}</label><Input value={String(candidate?.[name] ?? values[name] ?? "")} disabled className="h-10 bg-slate-100 text-slate-500" /></div>;
            })}
          </div>
        </div>
      )}

      {activeTab === "criteria" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between"><div><h3 className="font-display text-sm font-bold text-slate-900">Điều kiện sơ loại</h3><p className="mt-1 text-xs text-slate-400">Khai báo từng tiêu chí và yêu cầu đạt của vị trí.</p></div><Button type="button" variant="secondary" size="sm" onClick={() => updateCriteria([...criteria, criterionRow])}><Plus size={14} /> Thêm dòng</Button></div>
          <div className="overflow-x-auto rounded-xl border border-slate-100"><table className="w-full min-w-[980px] text-left text-xs"><thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400"><tr><th className="px-3 py-3">Loại tiêu chí</th><th className="px-3 py-3">Điều kiện yêu cầu</th><th className="px-3 py-3">Giá trị ứng viên</th><th className="px-3 py-3">Mô tả đánh giá</th><th className="px-3 py-3">Đạt</th><th className="px-3 py-3">Ghi chú</th><th className="px-3 py-3">Xóa</th></tr></thead><tbody className="divide-y divide-slate-100">{criteria.map((item, index) => <tr key={index}><td className="px-3 py-2"><select className="h-9 rounded-lg border border-slate-200 px-2" value={String(item.criteria_type ?? screeningCriteriaTypes[0])} onChange={(event) => updateCriterion(index, "criteria_type", event.target.value)}>{screeningCriteriaTypes.map((type) => <option key={type}>{type}</option>)}</select></td><td className="px-3 py-2"><Input value={String(item.required_from ?? item.required_description ?? "")} onChange={(event) => updateCriterion(index, "required_from", event.target.value)} className="h-9" placeholder="Ví dụ: 2 năm" /></td><td className="px-3 py-2"><Input value={String(item.candidate_value ?? "")} onChange={(event) => updateCriterion(index, "candidate_value", event.target.value)} className="h-9" /></td><td className="px-3 py-2"><Input value={String(item.candidate_description ?? "")} onChange={(event) => updateCriterion(index, "candidate_description", event.target.value)} className="h-9" /></td><td className="px-3 py-2 text-center"><input type="checkbox" checked={Boolean(item.is_passed)} onChange={(event) => updateCriterion(index, "is_passed", event.target.checked)} className="size-4 accent-teal-600" aria-label={`Tiêu chí ${index + 1} đạt`} /></td><td className="px-3 py-2"><Input value={String(item.note ?? "")} onChange={(event) => updateCriterion(index, "note", event.target.value)} className="h-9" /></td><td className="px-3 py-2"><Button type="button" variant="ghost" size="sm" onClick={() => updateCriteria(criteria.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={15} /></Button></td></tr>)}</tbody></table></div>
          {criteria.length === 0 && <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">Chưa có tiêu chí. Nhấn “Thêm dòng” để bắt đầu.</p>}
        </div>
      )}

      {activeTab === "assessment" && <div className="grid gap-4 md:grid-cols-2"><WorkspaceInput field={{ name: "screening_date", label: "Ngày sơ loại", type: "date", required: true }} tabId="screenings" value={values.screening_date ?? ""} onChange={(value) => set("screening_date", value)} /><WorkspaceInput field={{ name: "level_score", label: "Mức độ phù hợp (0-10)", type: "number", required: true }} tabId="screenings" value={values.level_score ?? ""} onChange={(value) => set("level_score", value)} /><WorkspaceInput field={{ name: "screening_result", label: "Kết quả", type: "select", options: [{ value: "ĐẠT", label: "Đạt" }, { value: "KHÔNG ĐẠT", label: "Không đạt" }] }} tabId="screenings" value={values.screening_result ?? "ĐẠT"} onChange={(value) => set("screening_result", value)} /><div className="md:col-span-2"><WorkspaceInput field={{ name: "comment", label: "Nhận xét tổng hợp", type: "textarea" }} tabId="screenings" value={values.comment ?? ""} onChange={(value) => set("comment", value)} /></div></div>}
    </div>
  );
}

const candidateSources = ["TopCV", "LinkedIn", "Website công ty", "Giới thiệu nội bộ", "Khác"];

function candidateDuplicate(values: Record<string, string>, candidates: Row[], editingId?: string) {
  const fields = ["citizen_id", "phone", "email"];
  return candidates.find((candidate) => String(candidate.candidate_id ?? "") !== String(editingId ?? "") && fields.some((field) => {
    const value = String(values[field] ?? "").trim().toLowerCase();
    return value !== "" && value === String(candidate[field] ?? "").trim().toLowerCase();
  }));
}

function CandidateForm({
  values,
  setValues,
  lookups,
}: {
  values: Record<string, string>;
  setValues: (updater: (current: Record<string, string>) => Record<string, string>) => void;
  lookups: CandidateLookups;
}) {
  const [activeTab, setActiveTab] = useState<"candidate" | "application" | "attachments">("candidate");
  const requests = lookups.requests;
  const selectedRequest = requests.find((item) => String(item.recruitment_request_id ?? "") === values.recruitment_request_id);
  const positions = lookups.positions.filter((item) => !values.department_id || String(item.department_id ?? "") === values.department_id);
  const selectedPosition = positions.find((item) => String(item.position_id ?? "") === values.position_id);
  const attachments = parseDetailList(values.attachments_json);
  const set = (name: string, value: string) => setValues((current) => ({ ...current, [name]: value }));
  const setRequest = (requestId: string) => {
    const request = requests.find((item) => String(item.recruitment_request_id ?? "") === requestId);
    setValues((current) => ({
      ...current,
      recruitment_request_id: requestId,
      position_id: String(request?.position_id ?? ""),
      department_id: String(request?.department_id ?? ""),
    }));
  };
  const updateAttachments = (next: Array<Record<string, unknown>>) => set("attachments_json", JSON.stringify(next));

  return (
    <div className="space-y-5">
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {[['candidate', '1. Thông tin ứng viên'], ['application', '2. Thông tin ứng tuyển'], ['attachments', '3. Tài liệu đính kèm']].map(([key, label]) => (
          <button key={key} type="button" onClick={() => setActiveTab(key as "candidate" | "application" | "attachments")} className={`whitespace-nowrap border-b-2 px-4 py-3 text-xs font-bold ${activeTab === key ? "border-teal-600 text-teal-700" : "border-transparent text-slate-400"}`}>{label}</button>
        ))}
      </div>

      {activeTab === "candidate" && <div className="grid gap-4 md:grid-cols-2">
        <WorkspaceInput field={{ name: "candidate_code", label: "Mã ứng viên" }} tabId="candidates" value={values.candidate_code ?? ""} onChange={(value) => set("candidate_code", value)} />
        <WorkspaceInput field={{ name: "full_name", label: "Họ tên", required: true }} tabId="candidates" value={values.full_name ?? ""} onChange={(value) => set("full_name", value)} />
        <WorkspaceInput field={{ name: "citizen_id", label: "Số CCCD" }} tabId="candidates" value={values.citizen_id ?? ""} onChange={(value) => set("citizen_id", value)} />
        <WorkspaceInput field={{ name: "date_of_birth", label: "Ngày sinh", type: "date" }} tabId="candidates" value={values.date_of_birth ?? ""} onChange={(value) => set("date_of_birth", value)} />
        <WorkspaceInput field={{ name: "gender", label: "Giới tính", type: "select", options: [{ value: "Nam", label: "Nam" }, { value: "Nữ", label: "Nữ" }] }} tabId="candidates" value={values.gender ?? "Nam"} onChange={(value) => set("gender", value)} />
        <WorkspaceInput field={{ name: "phone", label: "Số điện thoại" }} tabId="candidates" value={values.phone ?? ""} onChange={(value) => set("phone", value)} />
        <WorkspaceInput field={{ name: "email", label: "Email" }} tabId="candidates" value={values.email ?? ""} onChange={(value) => set("email", value)} />
        <WorkspaceInput field={{ name: "address", label: "Địa chỉ", type: "textarea", span: 2 }} tabId="candidates" value={values.address ?? ""} onChange={(value) => set("address", value)} />
        <WorkspaceInput field={{ name: "culture_level", label: "Trình độ văn hóa" }} tabId="candidates" value={values.culture_level ?? ""} onChange={(value) => set("culture_level", value)} />
        <WorkspaceInput field={{ name: "education_level", label: "Trình độ đào tạo", type: "select", options: [{ value: "Cao đẳng", label: "Cao đẳng" }, { value: "Cử nhân", label: "Cử nhân" }, { value: "Thạc sĩ", label: "Thạc sĩ" }, { value: "Tiến sĩ", label: "Tiến sĩ" }] }} tabId="candidates" value={values.education_level ?? "Cử nhân"} onChange={(value) => set("education_level", value)} />
        <WorkspaceInput field={{ name: "education_school", label: "Nơi đào tạo" }} tabId="candidates" value={values.education_school ?? ""} onChange={(value) => set("education_school", value)} />
        <WorkspaceInput field={{ name: "major", label: "Ngành đào tạo" }} tabId="candidates" value={values.major ?? ""} onChange={(value) => set("major", value)} />
        <WorkspaceInput field={{ name: "gpa", label: "Xếp loại / GPA", type: "number" }} tabId="candidates" value={values.gpa ?? ""} onChange={(value) => set("gpa", value)} />
        <div><label className="mb-1.5 block text-xs font-bold text-slate-600">Người giới thiệu</label><select className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" value={values.referrer_employee_id ?? ""} onChange={(event) => { const employee = lookups.employees.find((item) => String(item.employee_id ?? "") === event.target.value); setValues((current) => ({ ...current, referrer_employee_id: event.target.value, referrer: String(employee?.full_name ?? "") })); }}><option value="">-- Chọn hồ sơ nhân sự --</option>{lookups.employees.map((employee) => <option key={String(employee.employee_id)} value={String(employee.employee_id)}>{String(employee.employee_code ?? employee.employee_id)} - {String(employee.full_name ?? "")}</option>)}</select></div>
        <div><label className="mb-1.5 block text-xs font-bold text-slate-600">Nguồn tuyển dụng</label><select className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" value={values.source ?? "TopCV"} onChange={(event) => set("source", event.target.value)}>{candidateSources.map((source) => <option key={source}>{source}</option>)}</select></div>
        <WorkspaceInput field={{ name: "experience", label: "Kinh nghiệm làm việc", type: "textarea", span: 2 }} tabId="candidates" value={values.experience ?? ""} onChange={(value) => set("experience", value)} />
      </div>}

      {activeTab === "application" && <div className="grid gap-4 md:grid-cols-2">
         <WorkspaceInput field={{ name: "status", label: "Trạng thái ứng viên", type: "select", options: [{ value: "Đã tiếp nhận hồ sơ", label: "Đã tiếp nhận hồ sơ" }, { value: "Đã sơ loại, Đạt", label: "Đã sơ loại, Đạt" }, { value: "Đã sơ loại, Không đạt", label: "Đã sơ loại, Không đạt" }, { value: "S2: Phỏng vấn", label: "Phỏng vấn" }, { value: "S5: Trúng tuyển", label: "Trúng tuyển" }, { value: "S7: Loại", label: "Loại" }, { value: "HIRED", label: "Đã chuyển thành nhân viên" }] }} tabId="candidates" value={values.status ?? "Đã tiếp nhận hồ sơ"} onChange={(value) => set("status", value)} />
        <WorkspaceInput field={{ name: "received_date", label: "Ngày nhận hồ sơ", type: "date", disabled: true }} tabId="candidates" value={values.received_date ?? ""} onChange={() => undefined} />
        <div><label className="mb-1.5 block text-xs font-bold text-slate-600">Dựa trên yêu cầu</label><select className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" value={values.recruitment_request_id ?? ""} required onChange={(event) => setRequest(event.target.value)}><option value="">-- Chọn yêu cầu tuyển dụng --</option>{requests.map((request) => <option key={String(request.recruitment_request_id)} value={String(request.recruitment_request_id)}>{String(request.request_code ?? request.recruitment_request_id)} - {String(request.position_name ?? "")}</option>)}</select></div>
        <div><label className="mb-1.5 block text-xs font-bold text-slate-600">Vị trí ứng tuyển</label><Input value={String(selectedPosition?.position_name ?? selectedRequest?.position_name ?? "Tự động theo yêu cầu")} disabled className="h-10 bg-slate-100 text-slate-500" /></div>
        <div><label className="mb-1.5 block text-xs font-bold text-slate-600">Bộ phận</label><Input value={String(selectedRequest?.department_name ?? lookups.departments.find((item) => String(item.department_id ?? "") === values.department_id)?.department_name ?? "Tự động theo vị trí")} disabled className="h-10 bg-slate-100 text-slate-500" /></div>
        <div><label className="mb-1.5 block text-xs font-bold text-slate-600">Nguồn tuyển dụng</label><select className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" value={values.source ?? "TopCV"} onChange={(event) => set("source", event.target.value)}>{candidateSources.map((source) => <option key={source}>{source}</option>)}</select></div>
        <div className="md:col-span-2"><WorkspaceInput field={{ name: "note", label: "Ghi chú", type: "textarea" }} tabId="candidates" value={values.note ?? ""} onChange={(value) => set("note", value)} /></div>
      </div>}

      {activeTab === "attachments" && <div className="space-y-3"><div className="flex items-center justify-between"><h3 className="font-display text-sm font-bold text-slate-900">Tài liệu đính kèm</h3><Button type="button" variant="secondary" size="sm" onClick={() => updateAttachments([...attachments, { name: "", file: "", note: "" }])}><Plus size={14} /> Thêm tài liệu</Button></div><div className="overflow-x-auto rounded-xl border border-slate-100"><table className="w-full min-w-[700px] text-left text-xs"><thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400"><tr><th className="px-3 py-3">Tên tài liệu</th><th className="px-3 py-3">File</th><th className="px-3 py-3">Ghi chú</th><th className="px-3 py-3">Xóa</th></tr></thead><tbody className="divide-y divide-slate-100">{attachments.map((attachment, index) => <tr key={index}><td className="px-3 py-2"><Input value={String(attachment.name ?? "")} onChange={(event) => { const next = [...attachments]; next[index] = { ...next[index], name: event.target.value }; updateAttachments(next); }} className="h-9" /></td><td className="px-3 py-2"><Input type="file" onChange={(event) => { const next = [...attachments]; next[index] = { ...next[index], file: event.target.files?.[0]?.name ?? "" }; updateAttachments(next); }} className="h-9 py-1.5 text-xs" /></td><td className="px-3 py-2"><Input value={String(attachment.note ?? "")} onChange={(event) => { const next = [...attachments]; next[index] = { ...next[index], note: event.target.value }; updateAttachments(next); }} className="h-9" /></td><td className="px-3 py-2"><Button type="button" variant="ghost" size="sm" onClick={() => updateAttachments(attachments.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={15} /></Button></td></tr>)}</tbody></table></div>{attachments.length === 0 && <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">Chưa có tài liệu đính kèm.</p>}</div>}
    </div>
  );
}

function quotaCheck(values: Record<string, string>, lookups: RequestLookups) {
  const departmentId = values.department_id;
  const positionId = values.position_id;
  const quotas = lookups.quotas.filter((quota) => String(quota.department_id ?? "") === departmentId);
  const quota = quotas.find((item) => String(item.quota_id ?? "") === values.quota_id) ?? quotas[0];
  if (!quota || !positionId) return null;
  const details = parseDetailList(quota.details);
  const detail = details.find((item) => String(item.position_id ?? "") === positionId);
  const current = Number(detail?.current_headcount ?? quota.current_headcount ?? 0);
  const target = Number(detail?.target_headcount ?? quota.target_headcount ?? 0);
  const movement = Number(detail?.resignation_count ?? 0) + Number(detail?.maternity_count ?? 0);
  const quantity = Number(values.quantity) || 0;
  return { current, target, movement, quantity, exceeds: current + quantity - movement > target };
}

function RecruitmentRequestForm({
  values,
  setValues,
  lookups,
}: {
  values: Record<string, string>;
  setValues: (updater: (current: Record<string, string>) => Record<string, string>) => void;
  lookups: RequestLookups;
}) {
  const [activeTab, setActiveTab] = useState<"general" | "detail">("general");
  const departments = lookups.departments;
  const employees = lookups.employees;
  const department = departments.find((item) => String(item.department_id ?? "") === values.department_id);
  const positions = lookups.positions.filter((item) => String(item.department_id ?? "") === values.department_id);
  const quotas = lookups.quotas.filter((item) => String(item.department_id ?? "") === values.department_id);
  const selectedPosition = positions.find((item) => String(item.position_id ?? "") === values.position_id);
  const check = quotaCheck(values, lookups);
  const outside = values.is_outside_headcount === "1";
  const set = (name: string, value: string) => setValues((current) => ({ ...current, [name]: value }));
  const setRequester = (employeeId: string) => {
    const employee = employees.find((item) => String(item.employee_id ?? "") === employeeId);
    setValues((current) => ({
      ...current,
      requested_by: employeeId,
      department_id: String(employee?.department_id ?? ""),
      quota_id: "",
      position_id: "",
    }));
  };
  const setRequestType = (value: string) => setValues((current) => ({ ...current, is_outside_headcount: value, quota_id: value === "1" ? "" : current.quota_id }));

  return (
    <div className="space-y-5">
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {[['general', '1. Thông tin chung'], ['detail', '2. Chi tiết vị trí định biên']].map(([key, label]) => (
          <button key={key} type="button" onClick={() => setActiveTab(key as "general" | "detail")} className={`whitespace-nowrap border-b-2 px-4 py-3 text-xs font-bold ${activeTab === key ? "border-teal-600 text-teal-700" : "border-transparent text-slate-400"}`}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === "general" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <WorkspaceInput field={{ name: "created_date", label: "Ngày lập phiếu", type: "date", required: true }} tabId="requests" value={values.created_date ?? ""} onChange={(value) => set("created_date", value)} />
          <WorkspaceInput field={{ name: "request_code", label: "Số phiếu", disabled: true }} tabId="requests" value={values.request_code ?? ""} onChange={() => undefined} />
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">Loại yêu cầu *</label>
            <select className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" value={values.is_outside_headcount ?? "0"} onChange={(event) => setRequestType(event.target.value)}>
              <option value="0">Trong định biên</option><option value="1">Ngoài định biên</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">Phiếu định biên {outside ? "(không áp dụng)" : "*"}</label>
            <select className={`h-10 w-full rounded-xl border px-3 text-sm ${outside ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400" : "border-slate-200 bg-white"}`} value={values.quota_id ?? ""} disabled={outside} required={!outside} onChange={(event) => set("quota_id", event.target.value)}>
              <option value="">-- Chọn phiếu định biên --</option>
              {quotas.map((quota) => <option key={String(quota.quota_id)} value={String(quota.quota_id)}>{String(quota.quota_code ?? quota.quota_id)} - {String(quota.department_name ?? department?.department_name ?? "")}</option>)}
            </select>
            {outside && <p className="mt-1 text-[11px] text-slate-400">Phiếu ngoài định biên không được nhập phiếu định biên.</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">Người lập *</label>
            <select className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" value={values.requested_by ?? ""} required onChange={(event) => setRequester(event.target.value)}>
              <option value="">-- Chọn hồ sơ nhân sự --</option>
              {employees.map((employee) => <option key={String(employee.employee_id)} value={String(employee.employee_id)}>{String(employee.employee_code ?? employee.employee_id)} - {String(employee.full_name ?? "")}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">Bộ phận</label>
            <Input value={department ? `${String(department.department_code ?? department.department_id)} - ${String(department.department_name ?? "")}` : "Tự động theo người lập"} disabled className="h-10 bg-slate-100 text-slate-500" />
          </div>
          <div className="md:col-span-2"><WorkspaceInput field={{ name: "reason", label: "Lý do", type: "textarea", required: true }} tabId="requests" value={values.reason ?? ""} onChange={(value) => set("reason", value)} /></div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">Mã vị trí *</label>
              <select className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" value={values.position_id ?? ""} required onChange={(event) => set("position_id", event.target.value)}>
                <option value="">-- Chọn vị trí thuộc bộ phận --</option>
                {positions.map((position) => <option key={String(position.position_id)} value={String(position.position_id)}>{String(position.position_code ?? position.position_id)} - {String(position.position_name ?? "")}</option>)}
              </select>
            </div>
            <div><label className="mb-1.5 block text-xs font-bold text-slate-600">Tên vị trí</label><Input value={String(selectedPosition?.position_name ?? "Tự động theo mã vị trí")} disabled className="h-10 bg-slate-100 text-slate-500" /></div>
            <div><label className="mb-1.5 block text-xs font-bold text-slate-600">Số lượng cần tuyển *</label><Input type="number" min={1} value={values.quantity ?? ""} required onChange={(event) => set("quantity", event.target.value)} className="h-10" /></div>
            <WorkspaceInput field={{ name: "expected_date", label: "Ngày cần người", type: "date", required: true }} tabId="requests" value={values.expected_date ?? ""} onChange={(value) => set("expected_date", value)} />
            <div className="md:col-span-2"><WorkspaceInput field={{ name: "note", label: "Ghi chú", type: "textarea" }} tabId="requests" value={values.note ?? ""} onChange={(value) => set("note", value)} /></div>
          </div>
          {check && <div className={`rounded-xl border p-4 text-xs ${check.exceeds ? "border-amber-200 bg-amber-50 text-amber-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}><b>Kiểm tra định biên:</b> Hiện tại {check.current} + Cần tuyển {check.quantity} - Biến động {check.movement} = {check.current + check.quantity - check.movement}; Định biên {check.target}. {check.exceeds ? outside ? "Vượt định biên. Phiếu ngoài định biên vẫn được phép lưu sau khi xác nhận." : "Vượt định biên. Phiếu trong định biên không được phép lưu." : "Không vượt định biên."}</div>}
        </div>
      )}
    </div>
  );
}

function toPayload(tab: WorkspaceTab, values: Record<string, string>) {
  const payload: Record<string, unknown> = {};
  for (const field of tab.fields) {
    const value = values[field.name];
    if (value === undefined || value === "") continue;
    if (field.type === "number") payload[field.name] = Number(value);
    else if (field.type === "json") {
      try {
        payload[field.name] = JSON.parse(value);
      } catch {
        throw new Error(`Trường ${field.label} phải là JSON hợp lệ.`);
      }
    } else payload[field.name] = value;
  }
  return payload;
}

function employeeInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function EmployeeAvatar({
  name,
  avatarUrl,
  className = "size-9 text-xs",
}: {
  name: string;
  avatarUrl?: string;
  className?: string;
}) {
  if (avatarUrl)
    return (
      // Pinata gateway hosts are configured at runtime, so they cannot be predeclared for next/image.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={`Ảnh hồ sơ ${name}`}
        className={`${className} shrink-0 rounded-full border border-slate-200 object-cover bg-slate-100`}
      />
    );
  return (
    <div
      className={`${className} grid shrink-0 place-items-center rounded-full bg-teal-100 font-bold text-teal-800`}
      aria-label={`Chưa có ảnh hồ sơ ${name}`}
    >
      {employeeInitials(name) || "NV"}
    </div>
  );
}

function EmployeeAvatarUploader({
  employeeId,
  name,
  avatarUrl,
  canUpload,
  onUploaded,
}: {
  employeeId: string;
  name: string;
  avatarUrl?: string;
  canUpload: boolean;
  onUploaded: (avatarUrl: string) => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(avatarUrl);
  const [uploadError, setUploadError] = useState("");
  const uploadMutation = useMutation({
    mutationFn: (file: File) => api.uploadEmployeeAvatar(employeeId, file),
    onSuccess: ({ avatarUrl: nextAvatarUrl }) => {
      setPreviewUrl(nextAvatarUrl);
      setUploadError("");
      onUploaded(nextAvatarUrl);
    },
    onError: (error) => {
      setPreviewUrl(avatarUrl);
      setUploadError(
        error instanceof Error ? error.message : "Không thể tải ảnh hồ sơ.",
      );
    },
  });

  const selectAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setUploadError("Chỉ chấp nhận ảnh JPEG, PNG hoặc WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Ảnh hồ sơ không được vượt quá 5 MB.");
      return;
    }
    setPreviewUrl(URL.createObjectURL(file));
    setUploadError("");
    uploadMutation.mutate(file);
  };

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-teal-100 bg-teal-50/60 p-4 sm:flex-row sm:items-center">
      <EmployeeAvatar
        name={name}
        avatarUrl={previewUrl}
        className="size-20 text-xl"
      />
      <div className="min-w-0 flex-1">
        <div className="font-display text-base font-bold text-slate-950">
          Ảnh hồ sơ
        </div>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          JPEG, PNG hoặc WebP, tối đa 5 MB. Ảnh được lưu trên Pinata/IPFS.
        </p>
        {uploadError && (
          <p className="mt-2 text-xs font-medium text-rose-700">{uploadError}</p>
        )}
      </div>
      {canUpload && (
        <label className="inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-teal-200 bg-white px-3 text-xs font-bold text-teal-800 transition hover:border-teal-400 hover:bg-teal-100">
          <ImageUp size={15} />
          {uploadMutation.isPending ? "Đang tải ảnh..." : "Chọn ảnh"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={selectAvatar}
            disabled={uploadMutation.isPending}
          />
        </label>
      )}
    </div>
  );
}

function LegacyReportsWorkspace() {
  const { data, isLoading } = useQuery({
    queryKey: ["reports-workspace"],
    queryFn: () => api.module("reports"),
  });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  if (isLoading || !data)
    return (
      <div className="grid min-h-[500px] place-items-center text-sm text-slate-400">
        Đang tải báo cáo...
      </div>
    );
  const rows = data.rows.filter((row) =>
    row.join(" ").toLowerCase().includes(search.toLowerCase()),
  );
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageOffset = (currentPage - 1) * pageSize;
  const visibleRows = rows.slice(pageOffset, pageOffset + pageSize);
  return (
    <div className="space-y-7">
      <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <div className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-teal-700">
            {data.eyebrow}
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950">
            {data.title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {data.description}
          </p>
        </div>
        <Button variant="secondary" onClick={() => window.print()}>
          <Download size={16} /> In / lưu PDF
        </Button>
      </section>
      
      <Card>
        <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-4 pt-3">
          {data.tabs.map((item) => (
            <button
              key={item}
              className="whitespace-nowrap rounded-t-lg border-b-2 border-teal-600 px-4 py-3 text-xs font-bold text-teal-700"
            >
              {item}
            </button>
          ))}
        </div>
        <CardContent className="p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
            <div className="relative w-full max-w-sm">
              <Search
                size={16}
                className="absolute left-3 top-3 text-slate-400"
              />
              <Input
                className="h-10 pl-9"
                placeholder="Tìm kiếm báo cáo..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm">
                <SlidersHorizontal size={14} /> Bộ lọc ngày
              </Button>
              <Button variant="secondary" size="sm">
                <Filter size={14} /> Xuất CSV
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50/70 text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-3">STT</th>
                  {[
                    "Mã báo cáo",
                    "Tên báo cáo",
                    "Kỳ báo cáo",
                    "Phạm vi",
                    "Dữ liệu",
                    "Trạng thái",
                  ].map((header) => (
                    <th key={header} className="px-5 py-3">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleRows.map((row, index) => (
                  <tr
                    key={`${row[0]}-${index}`}
                    className="hover:bg-teal-50/30"
                  >
                    <td className="px-5 py-4 text-xs text-slate-400">
                      {String(pageOffset + index + 1).padStart(2, "0")}
                    </td>
                    {row.map((cell, cellIndex) => (
                      <td
                        key={`${row[0]}-${cellIndex}`}
                        className={`px-5 py-4 ${cellIndex === 0 ? "font-mono text-xs font-bold text-teal-700" : cellIndex === 1 ? "font-semibold text-slate-800" : "text-xs text-slate-500"}`}
                      >
                        {cellIndex === row.length - 1 ? (
                          <Badge tone="teal">{cell}</Badge>
                        ) : (
                          cell
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-xs sm:flex-row sm:items-center sm:justify-between">
              <span className="text-slate-500">
                Hiển thị {pageOffset + 1}-{Math.min(pageOffset + pageSize, rows.length)} trên {rows.length} bản ghi
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={14} /> Trước
                </Button>
                <span className="min-w-20 text-center font-bold text-slate-700">
                  Trang {currentPage} / {totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={currentPage === totalPages}
                >
                  Sau <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function OperationalWorkspace({
  name,
  resource,
}: {
  name: WorkspaceName;
  resource: Resource;
}) {
  const session = useSyncExternalStore(
    subscribeToSession,
    getStoredSession,
    () => null,
  ) as Session | null;
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const employeePeople = name === "people" && session?.role === "Nhân viên";
  const requestedTabAllowed =
    requestedTab &&
    (!employeePeople || ["employees", "leave"].includes(requestedTab));
  const firstTab = getWorkspaceTab(
    name,
    requestedTabAllowed ? requestedTab : "",
  );
  const tabId = requestedTabAllowed
    ? requestedTab
    : employeePeople
      ? "employees"
      : firstTab.id;
  const setTabId = (nextTab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", nextTab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };
  const tab = getWorkspaceTab(name, tabId);
  const visibleTabs = employeePeople
    ? workspaceTabs[name].filter((item) =>
        ["employees", "leave"].includes(item.id),
      )
    : workspaceTabs[name];
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState<Row | null>(null);
  const [editingRow, setEditingRow] = useState<Row | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>(() =>
    defaultForm(firstTab),
  );
  const [popup, setPopup] = useState<PopupState | null>(null);
  const [dismissedQueryError, setDismissedQueryError] = useState<unknown>(null);
  const [historyEmployeeId, setHistoryEmployeeId] = useState("");
  const queryClient = useQueryClient();

  const showPopup = (variant: PopupVariant, title: string, message: string) =>
    setPopup({ variant, title, message });
  const requestConfirmation = (message: string) =>
    new Promise<boolean>((resolve) =>
      setPopup({
        variant: "warning",
        title: "Xác nhận thao tác",
        message,
        confirmLabel: "Xác nhận",
        resolve,
      }),
    );
  const closePopup = (confirmed = false) => {
    const resolve = popup?.resolve;
    setPopup(null);
    resolve?.(confirmed);
  };

  const rowsQuery = useQuery({
    queryKey: ["workspace", name, tab.id],
    enabled: Boolean(session),
    queryFn: async () => {
      if (tab.query === "history") {
        const [records, evaluations, proposals] = await Promise.all([
          api.list("/reward-discipline", { resource }),
          api.list("/reward-discipline/evaluations", { resource }),
          api.list("/reward-discipline/proposals", { resource }),
        ]);
        return [
          ...evaluations.map((item) => ({
            ...item,
            kind: "Đánh giá",
            code: item.evaluation_code,
            score: `${item.total_score ?? 0} / 10 - ${item.grade_result ?? ""}`,
            reason: item.description,
            date: item.evaluation_date,
          })),
          ...records.map((item) => ({
            ...item,
            kind: item.decision_type === "KY_LUAT" ? "Kỷ luật" : "Khen thưởng",
            code: item.decision_no,
            score: "-",
            reason: item.reason ?? item.content,
            date: item.decision_date,
          })),
          ...proposals.map((item) => ({
            ...item,
            kind: "Đề xuất",
            code: item.proposal_code,
            score: item.proposed_amount ?? 0,
            reason: item.reason ?? item.content,
            date: item.proposal_date ?? item.created_date,
          })),
        ] as Row[];
      }
      const endpoint =
        name === "people" &&
        tab.id === "employees" &&
        session?.role === "Nhân viên"
          ? "/hr/employees/me"
          : tab.endpoint;
      const rows = await api.list(endpoint, { resource });
      if (tab.id === "conversion")
        return rows.filter((item) =>
          ["S5: Trúng tuyển", "PASSED", "ĐẠT"].includes(String(item.status)),
        );
      return rows;
    },
  });

  const lookupQuery = useQuery({
    queryKey: ["workspace-lookups", name, tab.id],
    enabled:
      Boolean(session && session.role !== "Nhân viên") &&
      (name === "people" ||
        name === "rewards" ||
        [
          "plans",
          "requests",
          "candidates",
          "screenings",
          "schedules",
          "interview-evaluations",
          "offers",
          "conversion",
        ].includes(tab.id)),
    queryFn: async () => {
      const [
        departments,
        positions,
        employees,
        requests,
        plans,
         candidates,
         schedules,
         offers,
         quotas,
        screenings,
        decisions,
        contracts,
        contractProposals,
        leaveApplications,
         transferProposals,
         resignationApplications,
         criteria,
         rewardProposals,
      ] = await Promise.all([
        api.list("/admin/departments", { resource }),
        api.list("/admin/positions", { resource }),
        api.list("/hr/employees", { resource }),
        api.list("/recruitment/requests", { resource }),
        api.list("/recruitment/plans", { resource }),
        api.list("/recruitment/candidates", { resource }),
         api.list("/recruitment/interview-schedules", { resource }),
         api.list("/recruitment/offers", { resource }),
         api.list("/hr/quotas", { resource }),
        api.list("/recruitment/pre-screenings", { resource }),
        api.list("/recruitment/decisions", { resource }),
        api.list("/hr/contracts", { resource }),
        api.list("/hr/contract-proposals", { resource }),
        api.list("/hr/leave-applications", { resource }),
        api.list("/hr/transfer-proposals", { resource }),
         api.list("/hr/resignation-applications", { resource }),
         api.list("/reward-discipline/criteria", { resource }),
         api.list("/reward-discipline/proposals", { resource }),
      ]);
      return {
        departments,
        positions,
        employees,
        requests,
        plans,
        candidates,
         schedules,
         offers,
         quotas,
        screenings,
        decisions,
        contracts,
        contractProposals,
        leaveApplications,
        transferProposals,
         resignationApplications,
         criteria,
         rewardProposals,
      };
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: Record<string, string>) => {
      const payload = toPayload(tab, values);
      const id = editingRow ? rowId(tab, editingRow) : "";
      const endpoint = id ? `${tab.endpoint}/${id}` : tab.endpoint;
      return api.write(endpoint, id ? "PUT" : "POST", payload, {
        resource,
        action: id ? "edit" : "create",
      });
    },
    onSuccess: () => {
      setShowForm(false);
      setEditingRow(null);
      showPopup("success", "Thành công", "Đã lưu dữ liệu thành công.");
      queryClient.invalidateQueries({ queryKey: ["workspace", name] });
    },
    onError: (error) =>
      showPopup(
        "error",
        "Không thể lưu dữ liệu",
        error instanceof Error ? error.message : "Không thể lưu dữ liệu.",
      ),
  });

  const removeMutation = useMutation({
    mutationFn: (row: Row) =>
      api.remove(`${tab.endpoint}/${rowId(tab, row)}`, {
        resource,
        action: "delete",
      }),
    onSuccess: () => {
      showPopup("success", "Thành công", "Đã xóa bản ghi.");
      queryClient.invalidateQueries({ queryKey: ["workspace", name] });
    },
    onError: (error) =>
      showPopup(
        "error",
        "Không thể xóa bản ghi",
        error instanceof Error ? error.message : "Không thể xóa bản ghi.",
      ),
  });

  const actionMutation = useMutation({
    mutationFn: async ({
      row,
      action,
    }: {
      row: Row;
      action: "approve" | "reject" | "convert";
    }) => {
      const id = rowId(tab, row);
      if (action === "convert")
        return api.write(
          "/recruitment/convert-to-employee",
          "POST",
          { candidate_id: id },
          { resource, action: "create" },
        );
      const status = action === "reject" ? "REJECTED" : "APPROVED";
      if (tab.id === "requests")
        return api.write(
          `/recruitment/requests/${id}/approve`,
          "PUT",
          {
            status,
            note:
              action === "reject"
                ? "Từ chối trên workspace"
                : "Đã duyệt trên workspace",
          },
          { resource, action: "approve" },
        );
      if (tab.id === "leave")
        return api.write(
          `/hr/leave-applications/${id}/approve`,
          "PUT",
          {
            status,
            approver_note:
              action === "reject"
                ? "Từ chối trên workspace"
                : "Đã duyệt trên workspace",
          },
          { resource, action: "approve" },
        );
      if (tab.id === "quota" || tab.id === "quotas")
        return api.write(
          `/hr/quotas/${id}/status`,
          "PUT",
          { status: action === "reject" ? "Từ chối" : "Đã hoàn thiện" },
          { resource, action: "approve" },
        );
      if (tab.id === "transfer-proposals")
        return api.write(
          `/hr/transfer-proposals/${id}/status`,
          "PUT",
          { status },
          { resource, action: "approve" },
        );
      if (tab.id === "resignation-applications")
        return api.write(
          `/hr/resignation-applications/${id}/status`,
          "PUT",
          { status },
          { resource, action: "approve" },
        );
      if (tab.id === "proposals")
        return api.write(
          `/reward-discipline/proposals/${id}/status`,
          "PUT",
          { status },
          { resource, action: "approve" },
        );
      return api.write(
        `${tab.endpoint}/${id}`,
        "PUT",
        { status },
        { resource, action: "approve" },
      );
    },
    onSuccess: (_, variables) => {
      showPopup(
        "success",
        "Thành công",
        variables.action === "convert"
          ? "Đã chuyển ứng viên thành nhân viên và tạo hợp đồng thử việc."
          : variables.action === "reject"
            ? "Đã từ chối bản ghi."
            : "Đã thực hiện phê duyệt.",
      );
      queryClient.invalidateQueries({ queryKey: ["workspace", name] });
      queryClient.invalidateQueries({ queryKey: ["people"] });
    },
    onError: (error) =>
      showPopup(
        "error",
        "Không thể thực hiện thao tác",
        error instanceof Error
          ? error.message
          : "Không thể thực hiện thao tác.",
      ),
  });

  const rows = (rowsQuery.data ?? []).filter(
    (row) =>
      Object.values(row)
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (!historyEmployeeId ||
        tab.id !== "history" ||
        String(row.employee_id) === historyEmployeeId),
  );
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageOffset = (currentPage - 1) * pageSize;
  const visibleRows = rows.slice(pageOffset, pageOffset + pageSize);
  const catalogNeedsAdmin = tab.id === "departments" || tab.id === "positions";
  const restrictedRewardAction =
    name === "rewards" &&
    ["criteria", "evaluations", "decisions"].includes(tab.id);
  const recruitmentHrOnly =
    name === "recruitment" &&
    [
      "quota",
      "plans",
      "candidates",
      "screenings",
      "offers",
      "conversion",
    ].includes(tab.id);
  const isHrOrAdmin =
    session?.role === "Administrator" || session?.role === "HR Staff";
  const canManage = Boolean(
    session &&
      (catalogNeedsAdmin
        ? session.role === "Administrator"
        : (!restrictedRewardAction && !recruitmentHrOnly) || isHrOrAdmin),
  );
  const workflowCreate =
    name === "people" &&
    (tab.id === "leave" ||
      (tab.id === "transfer-proposals" && session?.role !== "Nhân viên") ||
      (tab.id === "resignation-applications" && session?.role !== "Nhân viên"));
  const workflowEdit =
    name === "people" &&
    tab.id === "transfer-proposals" &&
    session?.role !== "Nhân viên";
  const canCreate = Boolean(
    session &&
    (workflowCreate || (name === "recruitment" && tab.id === "requests" && ["Administrator", "HR Staff", "Trưởng Phòng"].includes(session.role)) || (canManage && canAccess(session, resource, "create"))) &&
    !tab.readOnly &&
    !tab.convert &&
    tab.id !== "screenings",
  );
  const canEdit = Boolean(
    session &&
    (workflowEdit || (canManage && canAccess(session, resource, "edit"))) &&
    editableTabs.has(tab.id),
  );
  const canDelete = Boolean(
    session &&
    canManage &&
    canAccess(session, resource, "delete") &&
    !undeletableTabs.has(tab.id) &&
    !tab.readOnly,
  );
  const canApprove = Boolean(
    session && tab.approve && canAccess(session, resource, "approve"),
  );
  const needsApproval = (row: Row) =>
    !["APPROVED", "REJECTED", "Đã hoàn thiện", "Từ chối"].includes(
      String(row.status),
    );

  const openCreate = () => {
    setEditingRow(null);
    const values = defaultForm(tab);
    if (tab.id === "requests") {
      values.created_date = new Date().toISOString().slice(0, 10);
      values.is_outside_headcount = "0";
      values.quantity = "1";
      if (session?.employeeId) {
        const employee = lookupQuery.data?.employees.find((item) => String(item.employee_id ?? "") === session.employeeId);
        values.requested_by = session.employeeId;
        values.department_id = String(employee?.department_id ?? "");
      }
    }
    if (tab.id === "candidates") {
      values.candidate_code = `UV/${new Date().getFullYear()}/${String((rowsQuery.data?.length ?? 0) + 1).padStart(4, "0")}`;
      values.received_date = new Date().toISOString().slice(0, 10);
      values.status = "Đã tiếp nhận hồ sơ";
      values.source = "TopCV";
      values.attachments_json = "[]";
    }
    if (name === "people" && tab.id === "leave" && session?.employeeId)
      values.employee_id = session.employeeId;
    setFormValues(values);
    setShowForm(true);
  };

  const openEdit = async (row: Row) => {
    let editRow = row;
    if (tab.id === "interview-evaluations" || tab.id === "screenings") {
      try {
        const detail = await api.list(
          `${tab.endpoint}/${rowId(tab, row)}`,
          { resource },
        );
        if (detail[0]) editRow = detail[0];
      } catch (error) {
        showPopup(
          "error",
          "Không thể tải chi tiết",
          error instanceof Error
            ? error.message
            : "Không thể tải chi tiết bản ghi.",
        );
        return;
      }
    }
    setEditingRow(row);
    setFormValues(
      Object.fromEntries(
        tab.fields.map((field) => [
          field.name,
          fieldValue(field, editRow[field.name]),
        ]),
      ),
    );
    setShowForm(true);
  };

  const openScreeningForm = (candidate: Row) => {
    const screeningTab = getWorkspaceTab(name, "screenings");
    const position = lookupQuery.data?.positions.find((item) => String(item.position_id ?? "") === String(candidate.position_id ?? ""));
    const values = Object.fromEntries(screeningTab.fields.map((field) => [field.name, field.options?.[0]?.value ?? ""]));
    Object.assign(values, {
      candidate_id: String(candidate.candidate_id ?? ""),
      received_date: fieldValue({ name: "received_date", label: "", type: "date" }, candidate.received_date ?? candidate.created_date),
      culture_level: String(candidate.culture_level ?? ""),
      education_level: String(candidate.education_level ?? ""),
      education_school: String(candidate.education_school ?? ""),
      position_id: String(candidate.position_id ?? position?.position_id ?? ""),
      department_id: String(candidate.department_id ?? position?.department_id ?? ""),
      screening_date: new Date().toISOString().slice(0, 10),
       criteria: JSON.stringify([{ criteria_type: "Năng lực chuyên môn", required_from: "", candidate_value: "", candidate_description: "", is_passed: true, note: "" }]),
    });
    setTabId("screenings");
    setEditingRow(null);
    setFormValues(values);
    setShowForm(true);
  };

  const openDetail = async (row: Row) => {
    setShowDetail(row);
    if (
      ![
        "quota",
        "quotas",
        "screenings",
        "schedules",
        "interview-evaluations",
        "employees",
        "leave",
        "contract-proposals",
        "contracts",
        "contract-extensions",
        "transfer-proposals",
        "transfer-decisions",
        "resignation-applications",
        "resignation-decisions",
        "work-history",
        "departments",
        "positions",
      ].includes(tab.id)
    )
      return;
    try {
      if (tab.id === "employees") {
        const detail = await api.list(`/hr/employees/${rowId(tab, row)}`, {
          resource,
        });
        if (detail[0]) setShowDetail(detail[0]);
        return;
      }
      if (tab.id === "leave") {
        const history = await api.list(
          `/hr/leave-applications/${rowId(tab, row)}/approval-history`,
          { resource },
        );
        setShowDetail({ ...row, approval_history: history });
        return;
      }
      if (tab.id === "departments") {
        const employees = await api.list(
          `/admin/departments/${rowId(tab, row)}/employees`,
          { resource },
        );
        setShowDetail({ ...row, employees });
        return;
      }
      if (tab.id === "positions") {
        const pathway = await api.list(
          `/admin/positions/${rowId(tab, row)}/pathway`,
          { resource },
        );
        setShowDetail({ ...row, contract_pathway: pathway });
        return;
      }
      const detail = await api.list(`${tab.endpoint}/${rowId(tab, row)}`, {
        resource,
      });
      if (detail[0]) setShowDetail(detail[0]);
    } catch (error) {
      showPopup(
        "error",
        "Không thể tải chi tiết",
        error instanceof Error
          ? error.message
          : "Không thể tải chi tiết hồ sơ.",
      );
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      toPayload(tab, formValues);
      const lookups = (lookupQuery.data ?? { departments: [], positions: [], employees: [], quotas: [], requests: [], plans: [], candidates: [], screenings: [], decisions: [] }) as RequestLookups & CandidateLookups;
      if (tab.id === "requests") {
        const missingRequestField = ["created_date", "requested_by", "department_id", "position_id", "quantity", "expected_date", "reason"].find((field) => !String(formValues[field] ?? "").trim());
        if (missingRequestField || (formValues.is_outside_headcount !== "1" && !formValues.quota_id)) {
          showPopup("error", "Thiếu thông tin bắt buộc", "Vui lòng nhập đầy đủ ngày lập, người lập, bộ phận, vị trí, số lượng, ngày cần người, lý do và phiếu định biên đối với yêu cầu trong định biên.");
          return;
        }
        const check = quotaCheck(formValues, lookups);
        if (formValues.is_outside_headcount !== "1" && !formValues.quota_id) {
          showPopup("error", "Thiếu phiếu định biên", "Yêu cầu trong định biên bắt buộc phải chọn phiếu định biên.");
          return;
        }
        if (check?.exceeds && formValues.is_outside_headcount !== "1") {
          showPopup("error", "Vượt định biên", "Số lượng tuyển vượt định biên. Không thể lưu phiếu trong định biên.");
          return;
        }
        if (check?.exceeds && formValues.is_outside_headcount === "1") {
          const confirmed = await requestConfirmation(`Cảnh báo: nhu cầu tuyển vượt định biên (${check.current} + ${check.quantity} - ${check.movement} > ${check.target}). Phiếu ngoài định biên vẫn được phép lưu. Tiếp tục?`);
          if (!confirmed) return;
        }
      }
      if (tab.id === "candidates") {
        const missingCandidateField = ["full_name", "phone", "email", "recruitment_request_id", "position_id", "department_id", "received_date"].find((field) => !String(formValues[field] ?? "").trim());
        if (missingCandidateField) {
          showPopup("error", "Thiếu thông tin bắt buộc", "Vui lòng nhập đủ thông tin ứng viên và thông tin ứng tuyển trước khi lưu.");
          return;
        }
        const duplicate = candidateDuplicate(formValues, lookups.candidates, editingRow ? rowId(tab, editingRow) : undefined);
        if (duplicate) {
          showPopup("error", "Ứng viên bị trùng", `CCCD, số điện thoại hoặc email đã tồn tại ở hồ sơ ${String(duplicate.candidate_code ?? duplicate.full_name ?? "khác")}.`);
          return;
        }
      }
      if (tab.id === "screenings") {
        const missingScreeningField = ["candidate_id", "screening_date", "level_score", "screening_result"].find((field) => !String(formValues[field] ?? "").trim());
        const score = Number(formValues.level_score);
        if (missingScreeningField || !Number.isFinite(score) || score < 0 || score > 10) {
          showPopup("error", "Thiếu thông tin bắt buộc", "Vui lòng chọn ứng viên, nhập ngày sơ loại, mức độ phù hợp từ 0 đến 10 và kết quả.");
          return;
        }
      }
      const actionLabel = editingRow ? "cập nhật" : "tạo mới";
      const confirmed = await requestConfirmation(
        `Bạn có chắc chắn muốn ${actionLabel} ${tab.label.toLowerCase()} với thông tin đã nhập không?`,
      );
      if (!confirmed) return;
      saveMutation.mutate(formValues);
    } catch (error) {
      showPopup(
        "error",
        "Dữ liệu không hợp lệ",
        error instanceof Error ? error.message : "Dữ liệu không hợp lệ.",
      );
    }
  };

  const fieldOptions = (field: WorkspaceField) => {
    const lookup = lookupQuery.data;
    if (!lookup) return field.options;
    const employeeOptions = lookup.employees.map((item) => ({
      value: String(item.employee_id ?? ""),
      label:
        `${item.employee_code ?? ""} ${item.full_name ?? item.employee_id ?? ""}`.trim(),
    }));
    const departmentOptions = lookup.departments.map((item) => ({
      value: String(item.department_id ?? ""),
      label:
        `${item.department_code ?? ""} ${item.department_name ?? item.department_id ?? ""}`.trim(),
    }));
    const positionOptions = lookup.positions.map((item) => ({
      value: String(item.position_id ?? ""),
      label:
        `${item.position_code ?? ""} ${item.position_name ?? item.position_id ?? ""}`.trim(),
    }));
    if (tab.id === "requests" && field.name === "department_id")
      return lookup.departments.map((item) => ({
        value: String(item.department_id ?? ""),
        label:
          `${item.department_code ?? ""} ${item.department_name ?? item.department_id ?? ""}`.trim(),
      }));
    if (tab.id === "requests" && field.name === "position_id")
      return lookup.positions.map((item) => ({
        value: String(item.position_id ?? ""),
        label:
          `${item.position_code ?? ""} ${item.position_name ?? item.position_id ?? ""}`.trim(),
      }));
    if (tab.id === "requests" && field.name === "requested_by")
      return lookup.employees.map((item) => ({
        value: String(item.employee_id ?? ""),
        label:
          `${item.employee_code ?? ""} ${item.full_name ?? item.employee_id ?? ""}`.trim(),
      }));
    if (tab.id === "plans" && field.name === "recruitment_request_id")
      return lookup.requests.map((item) => ({
        value: String(item.recruitment_request_id ?? ""),
        label: `${item.request_code ?? ""} ${item.position_name ?? ""}`.trim(),
      }));
    if (tab.id === "candidates" && field.name === "recruitment_plan_id")
      return lookup.plans.map((item) => ({
        value: String(item.recruitment_plan_id ?? ""),
        label: `${item.plan_name ?? ""} ${item.request_code ?? ""}`.trim(),
      }));
    if (tab.id === "candidates" && field.name === "position_id")
      return lookup.positions.map((item) => ({
        value: String(item.position_id ?? ""),
        label:
          `${item.position_code ?? ""} ${item.position_name ?? item.position_id ?? ""}`.trim(),
      }));
    if (tab.id === "screenings" && field.name === "candidate_id")
      return lookup.candidates.map((item) => ({
        value: String(item.candidate_id ?? ""),
        label:
          `${item.candidate_code ?? ""} ${item.full_name ?? item.candidate_id ?? ""}`.trim(),
      }));
    if (tab.id === "screenings" && field.name === "position_id")
      return lookup.positions.map((item) => ({
        value: String(item.position_id ?? ""),
        label:
          `${item.position_code ?? ""} ${item.position_name ?? item.position_id ?? ""}`.trim(),
      }));
    if (tab.id === "screenings" && field.name === "department_id")
      return lookup.departments.map((item) => ({
        value: String(item.department_id ?? ""),
        label:
          `${item.department_code ?? ""} ${item.department_name ?? item.department_id ?? ""}`.trim(),
      }));
    if (tab.id === "interview-evaluations" && field.name === "candidate_id")
      return lookup.candidates.map((item) => ({
        value: String(item.candidate_id ?? ""),
        label:
          `${item.candidate_code ?? ""} ${item.full_name ?? item.candidate_id ?? ""}`.trim(),
      }));
    if (tab.id === "interview-evaluations" && field.name === "schedule_id")
      return lookup.schedules.map((item) => ({
        value: String(item.schedule_id ?? ""),
        label: `${item.schedule_code ?? ""} ${item.round_type ?? ""}`.trim(),
      }));
    if (tab.id === "offers" && field.name === "candidate_id")
      return lookup.candidates.map((item) => ({
        value: String(item.candidate_id ?? ""),
        label:
          `${item.candidate_code ?? ""} ${item.full_name ?? item.candidate_id ?? ""}`.trim(),
      }));
    if (
      name === "people" &&
      ["employees", "quotas", "positions", "work-history"].includes(tab.id) &&
      field.name === "department_id"
    )
      return departmentOptions;
    if (
      name === "people" &&
      tab.id === "departments" &&
      field.name === "parent_department_id"
    )
      return departmentOptions;
    if (
      name === "people" &&
      tab.id === "departments" &&
      field.name === "manager_id"
    )
      return employeeOptions;
    if (
      name === "people" &&
      [
        "employees",
        "contracts",
        "contract-proposals",
        "contract-extensions",
        "leave",
        "transfer-proposals",
        "transfer-decisions",
        "resignation-applications",
        "resignation-decisions",
        "work-history",
      ].includes(tab.id) &&
      [
        "employee_id",
        "manager_id",
        "signer_id",
        "approver_id",
        "related_person_id",
        "proposer_id",
      ].includes(field.name)
    )
      return employeeOptions;
    if (
      name === "people" &&
      ["employees", "contracts", "transfer-decisions", "work-history"].includes(
        tab.id,
      ) &&
      field.name === "position_id"
    )
      return positionOptions;
    if (
      name === "people" &&
      tab.id === "contracts" &&
      field.name === "employee_id"
    )
      return employeeOptions;
    if (
      name === "people" &&
      tab.id === "contract-extensions" &&
      field.name === "contract_id"
    )
      return lookup.contracts.map((item) => ({
        value: String(item.contract_id ?? ""),
        label: `${item.contract_no ?? ""} ${item.employee_name ?? ""}`.trim(),
      }));
    if (
      name === "people" &&
      tab.id === "transfer-decisions" &&
      field.name === "proposal_id"
    )
      return lookup.transferProposals.map((item) => ({
        value: String(item.proposal_id ?? ""),
        label: `${item.proposal_code ?? ""} ${item.employee_name ?? ""}`.trim(),
      }));
    if (
      name === "people" &&
      tab.id === "transfer-decisions" &&
      field.name === "target_department_id"
    )
      return departmentOptions;
    if (
      name === "people" &&
      tab.id === "transfer-decisions" &&
      field.name === "target_position_id"
    )
      return positionOptions;
    if (
      name === "people" &&
      tab.id === "resignation-decisions" &&
      field.name === "application_id"
    )
      return lookup.resignationApplications.map((item) => ({
        value: String(item.application_id ?? ""),
        label:
          `${item.application_code ?? ""} ${item.employee_name ?? ""}`.trim(),
      }));
    if (
      name === "rewards" &&
      ["evaluations", "proposals", "decisions"].includes(tab.id) &&
      ["employee_id", "evaluator_id"].includes(field.name)
    )
      return employeeOptions;
    if (name === "rewards" && tab.id === "decisions" && field.name === "proposal_id")
      return lookup.rewardProposals
        .filter((item) => item.status === "APPROVED")
        .map((item) => ({
          value: String(item.proposal_id ?? ""),
          label: `${item.proposal_code ?? ""} ${item.employee_name ?? ""}`.trim(),
        }));
    return field.options;
  };
  const pageTitle =
    workspaceTitles[name][tab.id] ?? `Quản lý ${tab.label.toLowerCase()}`;

  return (
    <div className="operational-workspace space-y-7">
      <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <div className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-teal-700">
            {name === "recruitment"
              ? "TALENT ACQUISITION"
              : name === "people"
                ? "PEOPLE OPERATIONS"
                : "PERFORMANCE & RECOGNITION"}
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950">
            {pageTitle}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => window.print()}>
            <Download size={16} /> In / xuất dữ liệu
          </Button>
          {canCreate && (
            <Button onClick={openCreate}>
              <Plus size={16} /> Tạo {tab.label.toLowerCase()}
            </Button>
          )}
        </div>
      </section>

      

      <Card>
        <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-4 pt-3">
          {visibleTabs.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setTabId(item.id);
                setSearch("");
                setPage(1);
                setPopup(null);
                setHistoryEmployeeId("");
              }}
              className={`whitespace-nowrap rounded-t-lg border-b-2 px-4 py-3 text-xs font-bold transition ${tab.id === item.id ? "border-teal-600 text-teal-700" : "border-transparent text-slate-400 hover:text-slate-700"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <CardContent className="p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
            <div>
              <div className="font-display text-base font-bold text-slate-950">
                {tab.label}
              </div>
              {/* <div className="mt-1 text-xs text-slate-400">
                Các thao tác trên tab được kết nối với quy trình cũ và
                permission matrix.
              </div> */}
            </div>
            <div className="flex w-full gap-2 sm:w-auto">
              <div className="relative min-w-0 flex-1 sm:w-72">
                <Search
                  size={16}
                  className="absolute left-3 top-3 text-slate-400"
                />
                <Input
                  className="h-10 pl-9"
                  placeholder="Tìm kiếm trong danh sách..."
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                />
              </div>
              {tab.id === "history" && (
                <select
                  className="h-10 max-w-xs rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-600"
                  value={historyEmployeeId}
                  onChange={(event) => {
                    setHistoryEmployeeId(event.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">Tất cả nhân viên</option>
                  {lookupQuery.data?.employees.map((employee) => (
                    <option
                      key={String(employee.employee_id)}
                      value={String(employee.employee_id)}
                    >
                      {String(employee.employee_code ?? "")} -{" "}
                      {String(employee.full_name ?? "")}
                    </option>
                  ))}
                </select>
              )}
              <Button variant="secondary" size="sm">
                <SlidersHorizontal size={14} /> Lọc
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-slate-50/70 text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-bold">STT</th>
                  {tab.columns.map((column) => (
                    <th key={column.key} className="px-5 py-3 font-bold">
                      {column.label}
                    </th>
                  ))}
                  <th className="px-5 py-3 text-right font-bold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rowsQuery.isLoading ? (
                  <tr>
                    <td
                      colSpan={tab.columns.length + 2}
                      className="px-5 py-14 text-center text-sm text-slate-400"
                    >
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={tab.columns.length + 2}
                      className="px-5 py-14 text-center text-sm text-slate-400"
                    >
                      Chưa có dữ liệu phù hợp.
                    </td>
                  </tr>
                ) : (
                  visibleRows.map((row, index) => (
                    <tr
                      key={`${rowId(tab, row)}-${index}`}
                      className="group hover:bg-teal-50/30"
                    >
                      <td className="px-5 py-4 text-xs text-slate-400">
                        {String(pageOffset + index + 1).padStart(2, "0")}
                      </td>
                      {tab.columns.map((column) => (
                        <td
                          key={column.key}
                          className={`max-w-[260px] px-5 py-4 ${column.key === tab.columns[0]?.key ? "font-mono text-xs font-bold text-teal-700" : "text-xs text-slate-600"}`}
                        >
                          <div className="line-clamp-2">
                            {column.key === "status" ||
                            column.key === "employment_status" ||
                            column.key === "decision_type" ? (
                              <Badge
                                tone={
                                  String(row[column.key]).includes("REJECT") ||
                                  String(row[column.key]).includes("KỶ")
                                    ? "rose"
                                    : String(row[column.key]).includes(
                                          "PENDING",
                                        ) ||
                                        String(row[column.key]).includes("Chờ")
                                      ? "amber"
                                      : "teal"
                                }
                              >
                                {displayValue(row[column.key])}
                              </Badge>
                            ) : name === "people" &&
                              tab.id === "employees" &&
                              column.key === "full_name" ? (
                              <div className="flex min-w-[170px] items-center gap-3">
                                <EmployeeAvatar
                                  name={String(row.full_name ?? "Nhân viên")}
                                  avatarUrl={
                                    typeof row.avatar_url === "string"
                                      ? row.avatar_url
                                      : undefined
                                  }
                                />
                                <span className="font-semibold text-slate-800">
                                  {displayCell(column.key, row[column.key])}
                                </span>
                              </div>
                            ) : (
                              displayCell(column.key, row[column.key])
                            )}
                          </div>
                        </td>
                      ))}
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDetail(row)}
                            title="Xem chi tiết"
                          >
                            <Eye size={15} />
                          </Button>
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEdit(row)}
                              title="Sửa"
                            >
                              <Pencil size={15} />
                            </Button>
                          )}
                          {canApprove && needsApproval(row) && (
                            <>
                              <Button
                                variant="soft"
                                size="sm"
                                onClick={() =>
                                  requestConfirmation(
                                    "Bạn có chắc chắn muốn duyệt bản ghi này?",
                                  ).then((confirmed) => {
                                    if (confirmed)
                                      actionMutation.mutate({
                                        row,
                                        action: "approve",
                                      });
                                  })
                                }
                                disabled={actionMutation.isPending}
                                title="Duyệt"
                              >
                                <CheckCircle2 size={15} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  requestConfirmation(
                                    "Bạn có chắc chắn muốn từ chối bản ghi này?",
                                  ).then((confirmed) => {
                                    if (confirmed)
                                      actionMutation.mutate({
                                        row,
                                        action: "reject",
                                      });
                                  })
                                }
                                disabled={actionMutation.isPending}
                                title="Từ chối"
                              >
                                <XCircle size={15} />
                              </Button>
                            </>
                          )}
                          {tab.id === "candidates" &&
                            canManage &&
                            !(lookupQuery.data?.screenings ?? []).some((screening) => String(screening.candidate_id ?? "") === String(row.candidate_id ?? "")) && (
                              <Button
                                variant="soft"
                                size="sm"
                                onClick={() => openScreeningForm(row)}
                                title="Mở phiếu sơ loại"
                              >
                                Sơ loại
                              </Button>
                            )}
                          {(tab.convert || tab.id === "candidates") &&
                            canManage &&
                            canAccess(session, resource, "create") &&
                            String(row.status) !== "HIRED" &&
                            (lookupQuery.data?.decisions ?? []).some((decision) => String(decision.candidate_id ?? "") === String(row.candidate_id ?? "") && String(decision.result ?? "").trim().toUpperCase() === "ĐẠT") && (
                              <Button
                                variant="soft"
                                size="sm"
                                onClick={() =>
                                  requestConfirmation(
                                    "Bạn có chắc chắn muốn chuyển ứng viên này thành nhân viên?",
                                  ).then((confirmed) => {
                                    if (confirmed)
                                      actionMutation.mutate({
                                        row,
                                        action: "convert",
                                      });
                                  })
                                }
                                disabled={actionMutation.isPending}
                                title="Chuyển thành nhân viên"
                              >
                                <UserRoundCheck size={15} />
                              </Button>
                            )}
                          {canDelete && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  requestConfirmation(
                                    "Bạn có chắc chắn muốn xóa bản ghi này?",
                                  ).then((confirmed) => {
                                    if (confirmed) removeMutation.mutate(row);
                                  })
                                }
                              title="Xóa"
                            >
                              <Trash2 size={15} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {rows.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-xs sm:flex-row sm:items-center sm:justify-between">
              <span className="text-slate-500">
                Hiển thị {pageOffset + 1}-{Math.min(pageOffset + pageSize, rows.length)} trên {rows.length} bản ghi
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={currentPage === 1}
                  aria-label="Trang trước"
                >
                  <ChevronLeft size={14} /> Trước
                </Button>
                <span className="min-w-20 text-center font-bold text-slate-700">
                  Trang {currentPage} / {totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Trang sau"
                >
                  Sau <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {showForm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <Card className="max-h-[92vh] w-full max-w-4xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <div className="font-display text-lg font-bold text-slate-950">
                  {editingRow ? "Cập nhật" : "Tạo mới"}{" "}
                  {tab.label.toLowerCase()}
                </div>
                {/* <div className="mt-1 text-xs text-slate-400">
                  Nhập đủ thông tin bắt buộc. Các trường JSON giữ nguyên cấu
                  trúc chi tiết của giao diện cũ.
                </div> */}
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-800"
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>
            <form
              onSubmit={handleSubmit}
              className="max-h-[calc(92vh-150px)] overflow-y-auto p-5"
            >
              {tab.id === "requests" ? (
                <RecruitmentRequestForm
                  values={formValues}
                  setValues={setFormValues}
                  lookups={(lookupQuery.data ?? { departments: [], positions: [], employees: [], quotas: [] }) as RequestLookups}
                />
              ) : tab.id === "candidates" ? (
                <CandidateForm
                  values={formValues}
                  setValues={setFormValues}
                  lookups={(lookupQuery.data ?? { departments: [], positions: [], employees: [], quotas: [], requests: [], plans: [], candidates: [], screenings: [], decisions: [] }) as CandidateLookups}
                />
              ) : tab.id === "screenings" ? (
                <ScreeningForm
                  values={formValues}
                  setValues={setFormValues}
                  lookups={(lookupQuery.data ?? { departments: [], positions: [], employees: [], quotas: [], requests: [], plans: [], candidates: [], screenings: [], decisions: [] }) as CandidateLookups}
                />
              ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {tab.fields.map((field) => {
                  const options = fieldOptions(field);
                  const inputField =
                    options &&
                    options.length > 0 &&
                    [
                       "department_id",
                       "parent_department_id",
                      "position_id",
                      "requested_by",
                      "recruitment_request_id",
                      "recruitment_plan_id",
                      "candidate_id",
                      "schedule_id",
                      "manager_id",
                      "signer_id",
                      "approver_id",
                      "related_person_id",
                      "proposer_id",
                      "evaluator_id",
                      "employee_id",
                      "contract_id",
                      "proposal_id",
                      "application_id",
                      "target_department_id",
                      "target_position_id",
                    ].includes(field.name)
                      ? {
                          ...field,
                          type: "select" as const,
                          options: [
                            { value: "", label: "-- Chọn --" },
                            ...options,
                          ],
                        }
                      : field;
                  const scopedInputField =
                    tab.id === "leave" &&
                    field.name === "employee_id" &&
                    session?.role === "Nhân viên"
                      ? { ...inputField, disabled: true }
                      : inputField;
                  return (
                    <WorkspaceInput
                      key={field.name}
                      field={scopedInputField}
                      tabId={tab.id}
                      value={formValues[field.name] ?? ""}
                      onChange={(value) =>
                        setFormValues((current) => ({
                          ...current,
                          [field.name]: value,
                        }))
                      }
                    />
                  );
                })}
              </div>
              )}
              <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowForm(false)}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Đang lưu..." : "Lưu dữ liệu"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
      {showDetail && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <Card className="max-h-[90vh] w-full max-w-3xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <div className="font-display text-lg font-bold text-slate-950">
                  Chi tiết {tab.label.toLowerCase()}
                </div>
                {/* <div className="mt-1 text-xs text-slate-400">
                  {rowId(tab, showDetail)}
                </div> */}
              </div>
              <button
                onClick={() => setShowDetail(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[calc(90vh-105px)] overflow-y-auto p-5">
              {tab.id === "employees" && (
                <div className="mb-5">
                  <EmployeeAvatarUploader
                    employeeId={rowId(tab, showDetail)}
                    name={String(showDetail.full_name ?? "Nhân viên")}
                    avatarUrl={
                      typeof showDetail.avatar_url === "string"
                        ? showDetail.avatar_url
                        : undefined
                    }
                    canUpload={canEdit}
                    onUploaded={(avatarUrl) => {
                      setShowDetail((current) =>
                        current ? { ...current, avatar_url: avatarUrl } : current,
                      );
                      showPopup("success", "Thành công", "Đã cập nhật ảnh hồ sơ trên Pinata.");
                      queryClient.invalidateQueries({
                        queryKey: ["workspace", name],
                      });
                    }}
                  />
                </div>
              )}
              {tab.id === "quota" || tab.id === "quotas" ? (
                <QuotaDetail row={showDetail} />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {Object.entries(showDetail).map(([key, value]) => (
                    <div
                      key={key}
                      className="rounded-xl border border-slate-100 bg-slate-50/70 p-3"
                    >
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {detailLabel(tab, key)}
                      </div>
                      <div className="mt-1 break-words text-sm text-slate-700">
                        {typeof value === "object" ? (
                          <pre className="whitespace-pre-wrap text-xs">
                            {displayDetailValue(tab, key, value)}
                          </pre>
                        ) : (
                          displayDetailValue(tab, key, value)
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
      {popup && (
        <Popup
          variant={popup.variant}
          title={popup.title}
          message={popup.message}
          confirmLabel={popup.confirmLabel}
          cancelLabel={popup.cancelLabel}
          onClose={() => closePopup(false)}
          onConfirm={popup.resolve ? () => closePopup(true) : undefined}
        />
      )}
      {!popup && rowsQuery.error && dismissedQueryError !== rowsQuery.error && (
        <Popup
          variant="error"
          title="Không thể tải dữ liệu"
          message={rowsQuery.error instanceof ApiError ? rowsQuery.error.message : "Không thể tải dữ liệu. Kiểm tra kết nối backend."}
          onClose={() => setDismissedQueryError(rowsQuery.error)}
        />
      )}
    </div>
  );
}

type JsonItemField = {
  key: string;
  label: string;
  type?: "text" | "number" | "checkbox";
};

type JsonListSchema = {
  itemLabel: string;
  fields: JsonItemField[];
};

const jsonListSchemas: Record<string, JsonListSchema> = {
  "quota.details": {
    itemLabel: "vị trí",
    fields: [
      { key: "position_id", label: "Mã vị trí" },
      { key: "target_headcount", label: "Định biên", type: "number" },
      { key: "resignation_count", label: "Số lao động nghỉ việc", type: "number" },
      { key: "maternity_count", label: "Số lao động nghỉ thai sản", type: "number" },
      { key: "note", label: "Ghi chú" },
    ],
  },
  "quota.budget_details": {
    itemLabel: "khoản ngân sách",
    fields: [
      { key: "cost_type", label: "Loại chi phí" },
      { key: "source", label: "Nguồn chi" },
      { key: "estimated_cost", label: "Chi phí dự kiến", type: "number" },
    ],
  },
  "quotas.details": {
    itemLabel: "vị trí",
    fields: [
      { key: "position_id", label: "Mã vị trí" },
      { key: "target_headcount", label: "Định biên", type: "number" },
      { key: "resignation_count", label: "Số lao động nghỉ việc", type: "number" },
      { key: "maternity_count", label: "Số lao động nghỉ thai sản", type: "number" },
      { key: "note", label: "Ghi chú" },
    ],
  },
  "quotas.budget_details": {
    itemLabel: "khoản ngân sách",
    fields: [
      { key: "cost_type", label: "Loại chi phí" },
      { key: "source", label: "Nguồn chi" },
      { key: "estimated_cost", label: "Chi phí dự kiến", type: "number" },
    ],
  },
  "candidates.attachments_json": {
    itemLabel: "tài liệu",
    fields: [
      { key: "name", label: "Tên tài liệu" },
      { key: "url", label: "Đường dẫn tài liệu" },
    ],
  },
  "screenings.criteria": {
    itemLabel: "tiêu chí",
    fields: [
      { key: "criteria_type", label: "Tiêu chí" },
      { key: "required_from", label: "Nguồn yêu cầu" },
      { key: "required_description", label: "Yêu cầu cần đáp ứng" },
      { key: "candidate_value", label: "Thông tin ứng viên" },
      { key: "candidate_description", label: "Mô tả ứng viên" },
      { key: "is_passed", label: "Đạt yêu cầu", type: "checkbox" },
      { key: "note", label: "Ghi chú" },
    ],
  },
  "schedules.candidates": {
    itemLabel: "ứng viên",
    fields: [
      { key: "candidate_id", label: "Mã ứng viên" },
      { key: "note", label: "Lưu ý" },
    ],
  },
  "schedules.council": {
    itemLabel: "thành viên hội đồng",
    fields: [
      { key: "employee_id", label: "Mã nhân viên" },
      { key: "is_decision_maker", label: "Người quyết định", type: "checkbox" },
    ],
  },
  "schedules.tests": {
    itemLabel: "bài thi",
    fields: [
      { key: "test_name", label: "Tên bài thi" },
      { key: "expected_score", label: "Điểm yêu cầu", type: "number" },
      { key: "duration_minutes", label: "Thời lượng (phút)", type: "number" },
      { key: "exam_file", label: "Tệp đề thi" },
      { key: "answer_file", label: "Tệp đáp án" },
    ],
  },
  "interview-evaluations.script": {
    itemLabel: "câu hỏi",
    fields: [
      { key: "question", label: "Câu hỏi" },
      { key: "expectation", label: "Kỳ vọng" },
      { key: "answer", label: "Câu trả lời" },
    ],
  },
  "interview-evaluations.criteria": {
    itemLabel: "tiêu chí",
    fields: [
      { key: "criteria_type", label: "Tiêu chí" },
      { key: "required_from", label: "Nguồn yêu cầu" },
      { key: "required_description", label: "Yêu cầu cần đáp ứng" },
      { key: "candidate_value", label: "Đánh giá ứng viên" },
      { key: "candidate_description", label: "Mô tả ứng viên" },
      { key: "is_passed", label: "Đạt yêu cầu", type: "checkbox" },
      { key: "note", label: "Ghi chú" },
    ],
  },
  "contracts.allowance_details": {
    itemLabel: "phụ cấp",
    fields: [
      { key: "allowance_type", label: "Loại phụ cấp" },
      { key: "amount", label: "Số tiền", type: "number" },
    ],
  },
  "leave.details_json": {
    itemLabel: "ngày nghỉ",
    fields: [
      { key: "date", label: "Ngày nghỉ" },
      { key: "time_option", label: "Buổi nghỉ" },
      { key: "days", label: "Số ngày", type: "number" },
      { key: "note", label: "Ghi chú" },
    ],
  },
  "transfer-proposals.detail_items": {
    itemLabel: "nhân sự",
    fields: [
      { key: "employee_id", label: "Mã nhân viên" },
      { key: "current_department_id", label: "Mã bộ phận hiện tại" },
      { key: "current_position_id", label: "Mã vị trí hiện tại" },
      { key: "target_department_id", label: "Mã bộ phận mới" },
      { key: "target_position_id", label: "Mã vị trí mới" },
      { key: "manager_id", label: "Mã quản lý mới" },
    ],
  },
  "criteria.scales": {
    itemLabel: "mức xếp loại",
    fields: [
      { key: "grade_name", label: "Tên mức xếp loại" },
      { key: "min_score", label: "Điểm tối thiểu", type: "number" },
      { key: "max_score", label: "Điểm tối đa", type: "number" },
      { key: "description", label: "Mô tả" },
    ],
  },
  "evaluations.details": {
    itemLabel: "tiêu chí đánh giá",
    fields: [
      { key: "criteria_id", label: "Mã tiêu chí" },
      { key: "criteria_code", label: "Mã tiêu chí" },
      { key: "criteria_name", label: "Tên tiêu chí" },
      { key: "weight", label: "Trọng số", type: "number" },
      { key: "score", label: "Điểm", type: "number" },
      { key: "note", label: "Ghi chú" },
    ],
  },
};

function parseJsonList(value: string) {
  if (!value.trim()) return { items: [] as Array<Record<string, unknown>> };
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) throw new Error();
    return {
      items: parsed.filter(
        (item): item is Record<string, unknown> =>
          Boolean(item) && typeof item === "object" && !Array.isArray(item),
      ),
    };
  } catch {
    return {
      items: [] as Array<Record<string, unknown>>,
      error: "Dữ liệu chi tiết cũ không hợp lệ. Vui lòng nhập lại các dòng bên dưới.",
    };
  }
}

function JsonListInput({
  field,
  value,
  onChange,
  schema,
}: {
  field: WorkspaceField;
  value: string;
  onChange: (value: string) => void;
  schema: JsonListSchema;
}) {
  const { items, error } = parseJsonList(value);
  const updateItems = (nextItems: Array<Record<string, unknown>>) =>
    onChange(JSON.stringify(nextItems));
  const addItem = () =>
    updateItems([
      ...items,
      Object.fromEntries(
        schema.fields.map((itemField) => [
          itemField.key,
          itemField.type === "number" ? 0 : itemField.type === "checkbox" ? false : "",
        ]),
      ),
    ]);

  return (
    <div className={field.span === 2 ? "md:col-span-2" : ""}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="text-xs font-bold text-slate-600">
          {field.label.replace(/\s+\(JSON\)$/, "")}
          {field.required ? " *" : ""}
        </label>
        <Button type="button" variant="secondary" size="sm" onClick={addItem}>
          <Plus size={14} /> Thêm {schema.itemLabel}
        </Button>
      </div>
      {error && <p className="mb-2 text-xs text-rose-700">{error}</p>}
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">
                {schema.itemLabel.charAt(0).toUpperCase() + schema.itemLabel.slice(1)} {index + 1}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => updateItems(items.filter((_, itemIndex) => itemIndex !== index))}
              >
                <Trash2 size={14} /> Xóa
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {schema.fields.map((itemField) => (
                <label key={itemField.key} className="block text-xs font-bold text-slate-600">
                  {itemField.type === "checkbox" ? (
                    <span className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 font-medium">
                      <input
                        type="checkbox"
                        checked={Boolean(item[itemField.key])}
                        onChange={(event) => {
                          const nextItems = [...items];
                          nextItems[index] = { ...item, [itemField.key]: event.target.checked };
                          updateItems(nextItems);
                        }}
                      />
                      {itemField.label}
                    </span>
                  ) : (
                    <>
                      <span className="mb-1.5 block">{itemField.label}</span>
                      <input
                        type={itemField.type === "number" ? "number" : "text"}
                        value={String(item[itemField.key] ?? "")}
                        onChange={(event) => {
                          const nextValue =
                            itemField.type === "number" && event.target.value !== ""
                              ? Number(event.target.value)
                              : event.target.value;
                          const nextItems = [...items];
                          nextItems[index] = { ...item, [itemField.key]: nextValue };
                          updateItems(nextItems);
                        }}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                      />
                    </>
                  )}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      {items.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-400">
          Chưa có {schema.itemLabel}. Chọn “Thêm {schema.itemLabel}” để khai báo.
        </div>
      )}
    </div>
  );
}

function WorkspaceInput({
  field,
  tabId,
  value,
  onChange,
}: {
  field: WorkspaceField;
  tabId: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const jsonSchema = jsonListSchemas[`${tabId}.${field.name}`];
  if (field.type === "json" && jsonSchema)
    return (
      <JsonListInput
        field={field}
        value={value}
        onChange={onChange}
        schema={jsonSchema}
      />
    );
  const onInputChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => onChange(event.target.value);
  const common = {
    value,
    required: field.required,
    disabled: field.disabled,
    placeholder: field.placeholder,
    onChange: onInputChange,
  };
  const inputType =
    field.type === "number" ||
    field.type === "date" ||
    field.type === "datetime-local"
      ? field.type
      : "text";
  return (
    <div className={field.span === 2 ? "md:col-span-2" : ""}>
      <label className="mb-1.5 block text-xs font-bold text-slate-600">
        {field.label}
        {field.required ? " *" : ""}
      </label>
      {field.type === "textarea" || field.type === "json" ? (
        <textarea
          {...common}
          rows={field.type === "json" ? 5 : 3}
          className="min-h-0 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
        />
      ) : field.type === "select" ? (
        <select
          {...common}
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
        >
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <Input {...common} type={inputType} className="h-10" />
      )}
      {field.type === "json" && (
        <p className="mt-1 text-[11px] text-slate-400">
          Nhập một mảng JSON. Ví dụ: [{`{"name":"CV.pdf"}`}]
        </p>
      )}
    </div>
  );
}

export function ModuleWorkspace({
  name,
  resource,
}: {
  name: ModuleName;
  resource: Resource;
}) {
  return name === "reports" ? (
    <ReportsWorkspace />
  ) : (
    <OperationalWorkspace name={name} resource={resource} />
  );
}
