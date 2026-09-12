"use client";

import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Filter,
  FileText,
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
  startTransition,
  useState,
  useSyncExternalStore,
  useEffect,
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
import { dateInputValue, formatDate, formatDateTime, parseDateValue } from "@/lib/utils";
import {
  CANDIDATE_STATUS_OPTIONS,
  isCandidateWorking,
} from "@/lib/candidate-status";

type Row = Record<string, unknown>;
type ModuleName = WorkspaceName | "reports";
type ScheduleLookups = {
  candidates?: Row[];
  employees?: Row[];
};
type PopupState = {
  variant: PopupVariant;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  resolve?: (confirmed: boolean) => void;
};
type EmployeeConversionState = {
  row: Row;
  employee: Record<string, string>;
  contract: Record<string, string>;
  avatarFile: File | null;
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
const contractSectionIds = [
  "contracts",
  "expiring-contracts",
];
const contractSections = [
  { id: "contracts", label: "Hợp đồng lao động" },
  { id: "expiring-contracts", label: "HĐ sắp hết hạn" },
];

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
    decisions: "Quản lý quyết định trúng tuyển",
  },
  people: {
    employees: "Quản lý hồ sơ nhân sự",
    quotas: "Quản lý định biên nhân sự",
    departments: "Quản lý danh mục bộ phận",
    positions: "Quản lý danh mục vị trí công việc",
    contracts: "Quản lý hợp đồng lao động",
    "expiring-contracts": "Theo dõi hợp đồng sắp hết hạn",
    leave: "Quản lý đơn xin nghỉ phép",
    "transfer-proposals": "Quản lý đề xuất thuyên chuyển, bổ nhiệm",
    "transfer-decisions":
      "Quản lý quyết định thuyên chuyển, bổ nhiệm, miễn nhiệm",
    "resignation-applications": "Quản lý đơn xin nghỉ việc",
    "resignation-decisions": "Quản lý quyết định nghỉ việc",
    "work-history": "Tra cứu quá trình công tác",
  },
  rewards: {
    criteria: "Quản lý tiêu chí đánh giá",
    evaluations: "Quản lý phiếu đánh giá",
    proposals: "Quản lý đề xuất thưởng phạt",
    decisions: "Quản lý quyết định khen thưởng, kỷ luật",
  },
};

const labels: Record<string, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  WORKING: "Đang làm việc",
  RESIGNED: "Nghỉ việc",
  COMPLETED: "Hoàn tất",
  KHEN_THUONG: "Khen thưởng",
  KY_LUAT: "Kỷ luật",
  REWARD: "Khen thưởng",
  DISCIPLINE: "Kỷ luật",
  CASH: "Tiền mặt",
  BANK_TRANSFER: "Chuyển khoản",
  NOT_APPLICABLE: "Không áp dụng",
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
  requested_by: "Người lập",
  full_name: "Họ và tên",
  short_name: "Tên viết tắt",
  avatar_url: "URL ảnh hồ sơ",
  employment_status: "Trạng thái làm việc",
  department_id: "Mã bộ phận",
  department_code: "Mã bộ phận",
  department_name: "Bộ phận",
  department_manager_id: "Mã quản lý bộ phận",
  department_manager_name: "Quản lý bộ phận",
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
  exam_file_url: "Đường dẫn tệp đề thi",
  answer_file: "Tệp đáp án",
  answer_file_name: "Tệp đáp án",
  answer_file_url: "Đường dẫn tệp đáp án",
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
  payment_method: "Hình thức",
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

function detailLabel(tab: WorkspaceTab, key: string, useTabConfig = true) {
  if (useTabConfig) {
    const configuredField = tab.fields.find((field) => field.name === key);
    if (configuredField) return configuredField.label.replace(/\s+\(JSON\)$/, "");
    const configuredColumn = tab.columns.find((column) => column.key === key);
    if (configuredColumn) return configuredColumn.label;
  }
  if (detailLabels[key]) return detailLabels[key];
  return key
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .split("_")
    .filter(Boolean)
    .map((term) => detailTermLabels[term.toLowerCase()] ?? term)
    .join(" ")
    .replace(/^./, (value) => value.toUpperCase());
}

function isJsonDetailKey(key: string) {
  return (
    key.endsWith("_json") ||
    key.endsWith("_details") ||
    [
      "details",
      "detail_items",
      "script",
      "criteria",
      "offer",
      "appendices",
      "attachments",
      "candidates",
      "council",
      "tests",
    ].includes(key)
  );
}

function localizeDetailObject(
  value: unknown,
  tab: WorkspaceTab,
  key = "",
  nested = false,
): unknown {
  if (Array.isArray(value))
    return value.map((item) => localizeDetailObject(item, tab, key, true));
  if (
    typeof value === "string" &&
    isJsonDetailKey(key)
  ) {
    try {
      return localizeDetailObject(JSON.parse(value), tab, key, nested);
    } catch {
      return value;
    }
  }
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, item]) => [
        detailLabel(tab, entryKey, !nested),
        localizeDetailObject(item, tab, entryKey, true),
      ]),
    );
  return value;
}

function displayDetailValue(tab: WorkspaceTab, key: string, value: unknown) {
  if (value === null || value === undefined || value === "") return displayCell(key, value);
  if (isStructuredDetailValue(key, value)) {
    const structuredValue =
      typeof value === "string" ? JSON.parse(value) : value;
    return JSON.stringify(localizeDetailObject(structuredValue, tab, key), null, 2);
  }
  return displayCell(key, value);
}

function isStructuredDetailValue(key: string, value: unknown) {
  if (value && typeof value === "object") return true;
  if (!isJsonDetailKey(key) || typeof value !== "string") return false;
  try {
    return Boolean(JSON.parse(value));
  } catch {
    return false;
  }
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
  if (["amount", "proposed_amount"].includes(key))
    return `${Number(value).toLocaleString("vi-VN")} VNĐ`;
  if (key === "weight") return `${Number(value).toLocaleString("vi-VN")} %`;
  if (
    key === "date" ||
    key.startsWith("date_") ||
    key.endsWith("_date") ||
    key.endsWith("_time") ||
    key.endsWith("_at")
  ) {
    return key.endsWith("time") ? formatDateTime(value) : formatDate(value);
  }
  return displayValue(value);
}

function parseDetailList(value: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(value)) {
    return value.filter((item): item is Record<string, unknown> =>
      Boolean(item && typeof item === "object"),
    );
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

function parseBudgetDetails(value: unknown): Row[] {
  const details = parseDetailList(value);
  if (details.length) return details;
  let parsed = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      return [];
    }
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return [];
  return Object.entries(parsed).map(([costType, estimatedCost]) => ({
    cost_type: costType,
    source: "Ngân sách tuyển dụng",
    estimated_cost: estimatedCost,
  }));
}

function QuotaDetail({ row }: { row: Row }) {
  const details = parseDetailList(row.details);
  const budgetDetails = parseBudgetDetails(row.budget_details);
  const overview: Array<[string, unknown]> = [
    ["Mã định biên", row.quota_id],
    ["Số phiếu", row.quota_code],
    ["Ngày lập phiếu", row.created_date],
    ["Ngày áp dụng", row.effective_date],
    ["Mã bộ phận", row.department_id],
    ["Bộ phận", row.department_name],
    ["Người lập", row.creator_name],
    ["Tổng định biên", quotaNumber(row.target_headcount)],
    ["Sức chứa tối đa", quotaNumber(row.max_capacity)],
    ["Số lượng hiện tại", quotaNumber(row.current_headcount)],
    ["Cần tuyển", quotaNumber(row.needed_headcount)],
    ["Ngân sách tuyển dụng", `${quotaNumber(row.budget)} VNĐ`],
    ["Trạng thái", displayValue(row.status)],
    ["Diễn giải", row.description],
  ];
  return (
    <div className="space-y-5">
      <section>
        <h3 className="mb-3 font-display text-sm font-bold text-slate-900">
          1. Thông tin chung
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {overview.map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-slate-100 bg-slate-50/70 p-3"
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {label}
              </div>
              <div className="mt-1 break-words text-sm text-slate-700">
                {label.includes("Ngày")
                  ? displayCell("date", value)
                  : value == null || value === ""
                    ? "-"
                    : String(value)}
              </div>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h3 className="mb-3 font-display text-sm font-bold text-slate-900">
          2. Chi tiết vị trí định biên
        </h3>
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full min-w-[980px] text-left text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
              <tr>
                {[
                  "STT",
                  "Mã vị trí",
                  "Tên vị trí",
                  "Định biên",
                  "Nghỉ việc dự kiến",
                  "Thai sản dự kiến",
                  "Hiện tại",
                  "Cần tuyển",
                  "Ghi chú",
                ].map((header) => (
                  <th key={header} className="px-3 py-3 font-bold">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {details.length ? (
                details.map((detail, index) => (
                  <tr
                    key={`${String(detail.position_id ?? "position")}-${index}`}
                  >
                    <td className="px-3 py-3 text-slate-400">
                      {String(index + 1).padStart(2, "0")}
                    </td>
                    <td className="px-3 py-3 font-mono font-bold text-teal-700">
                      {displayValue(detail.position_code ?? detail.position_id)}
                    </td>
                    <td className="px-3 py-3 font-semibold text-slate-700">
                      {displayValue(detail.position_name)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {quotaNumber(detail.target_headcount)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {quotaNumber(detail.resignation_count)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {quotaNumber(detail.maternity_count)}
                    </td>
                    <td className="px-3 py-3 text-center font-semibold text-emerald-700">
                      {quotaNumber(detail.current_headcount)}
                    </td>
                    <td className="px-3 py-3 text-center font-semibold text-blue-700">
                      {quotaNumber(detail.needed_headcount)}
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      {displayValue(detail.note)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={9}
                    className="px-3 py-8 text-center text-slate-400"
                  >
                    Chưa có chi tiết vị trí định biên.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <h3 className="mb-3 font-display text-sm font-bold text-slate-900">
          3. Ngân sách dự kiến
        </h3>
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full min-w-[680px] text-left text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
              <tr>
                {[
                  "STT",
                  "Loại chi phí",
                  "Nguồn tuyển dụng",
                  "Chi phí dự kiến",
                ].map((header) => (
                  <th key={header} className="px-3 py-3 font-bold">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {budgetDetails.length ? (
                budgetDetails.map((detail, index) => (
                  <tr key={`${String(detail.cost_type ?? "cost")}-${index}`}>
                    <td className="px-3 py-3 text-slate-400">
                      {String(index + 1).padStart(2, "0")}
                    </td>
                    <td className="px-3 py-3 font-semibold text-slate-700">
                      {displayValue(detail.cost_type)}
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      {displayValue(detail.source)}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-emerald-700">
                      {quotaNumber(detail.estimated_cost)} VNĐ
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-8 text-center text-slate-400"
                  >
                    Chưa có chi tiết ngân sách dự kiến.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-slate-50 font-bold text-slate-700">
              <tr>
                <td colSpan={3} className="px-3 py-3 text-right">
                  Tổng ngân sách dự kiến
                </td>
                <td className="px-3 py-3 text-right text-emerald-700">
                  {quotaNumber(
                    budgetDetails.reduce(
                      (sum, item) => sum + (Number(item.estimated_cost) || 0),
                      0,
                    ),
                  )}{" "}
                  VNĐ
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  );
}

function DetailGrid({ items }: { items: Array<[string, unknown, string?]> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map(([label, value, key]) => (
        <div
          key={label}
          className="rounded-xl border border-slate-100 bg-slate-50/70 p-3"
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {label}
          </div>
          <div className="mt-1 break-words text-sm text-slate-700">
            {displayCell(key ?? "", value)}
          </div>
        </div>
      ))}
    </div>
  );
}

function DetailTable({
  columns,
  rows,
  empty = "Chưa có chi tiết.",
}: {
  columns: Array<[string, string]>;
  rows: Array<Record<string, unknown>>;
  empty?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-100">
      <table className="w-full min-w-[760px] text-left text-xs">
        <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
          <tr>
            {columns.map(([key, label]) => (
              <th key={key} className="px-3 py-3 font-bold">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length ? (
            rows.map((row, index) => (
              <tr key={String(row.id ?? row.detail_id ?? index)}>
                {columns.map(([key]) => (
                  <td key={key} className="px-3 py-3 align-top text-slate-700">
                    {displayCell(key, row[key])}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="px-3 py-8 text-center text-slate-400"
              >
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-3 font-display text-sm font-bold text-slate-900">
        {title}
      </h3>
      {children}
    </section>
  );
}

function ScheduleFileLink({
  row,
  nameKey,
  urlKey,
  legacyKey,
}: {
  row: Row;
  nameKey: string;
  urlKey: string;
  legacyKey: string;
}) {
  const fileName = String(row[nameKey] ?? "");
  const legacyValue = String(row[legacyKey] ?? "");
  const legacyIsUrl = /^(https?:|blob:|\/uploads\/)/i.test(legacyValue);
  const fileUrl = String(row[urlKey] ?? "") || (legacyIsUrl ? legacyValue : "");
  const label = fileName || (fileUrl ? "Mở tệp" : legacyValue) || "-";
  if (!fileUrl) return <span>{label}</span>;
  return (
    <a
      href={fileUrl}
      target="_blank"
      rel="noreferrer"
      className="font-semibold text-teal-700 underline decoration-teal-200 underline-offset-2 hover:text-teal-900"
    >
      {label}
    </a>
  );
}

function InterviewScheduleTestsTable({ rows }: { rows: Array<Record<string, unknown>> }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-100">
      <table className="w-full min-w-[760px] text-left text-xs">
        <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
          <tr>
            <th className="px-3 py-3 font-bold">Tên bài thi</th>
            <th className="px-3 py-3 font-bold">Điểm yêu cầu</th>
            <th className="px-3 py-3 font-bold">Thời lượng (phút)</th>
            <th className="px-3 py-3 font-bold">Tệp đề thi</th>
            <th className="px-3 py-3 font-bold">Tệp đáp án</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length ? rows.map((row, index) => (
            <tr key={String(row.id ?? row.test_name ?? index)}>
              <td className="px-3 py-3 align-top text-slate-700">{displayCell("test_name", row.test_name)}</td>
              <td className="px-3 py-3 align-top text-slate-700">{displayCell("expected_score", row.expected_score)}</td>
              <td className="px-3 py-3 align-top text-slate-700">{displayCell("duration_minutes", row.duration_minutes)}</td>
              <td className="px-3 py-3 align-top text-slate-700">
                <ScheduleFileLink row={row} nameKey="exam_file_name" urlKey="exam_file_url" legacyKey="exam_file" />
              </td>
              <td className="px-3 py-3 align-top text-slate-700">
                <ScheduleFileLink row={row} nameKey="answer_file_name" urlKey="answer_file_url" legacyKey="answer_file" />
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan={5} className="px-3 py-8 text-center text-slate-400">
                Chưa có bài thi trong lịch.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function InterviewScheduleDetail({
  row,
  lookups,
}: {
  row: Row;
  lookups?: ScheduleLookups;
}) {
  const candidates = parseDetailList(row.candidates ?? row.candidates_json).map(
    (item) => {
      const candidateId = String(item.candidate_id ?? item.id ?? "");
      const candidate = lookups?.candidates?.find(
        (lookup) => String(lookup.candidate_id ?? lookup.id ?? "") === candidateId,
      );
      return {
        candidate_code: item.candidate_code || candidate?.candidate_code || candidateId,
        full_name: item.full_name || candidate?.full_name || "",
        apply_position_name:
          item.apply_position_name ||
          candidate?.apply_position_name ||
          candidate?.position_name ||
          "",
        note: item.note ?? "",
      };
    },
  );
  const council = parseDetailList(row.council ?? row.council_json).map((item) => {
    const employeeId = String(item.employee_id ?? item.id ?? "");
    const employee = lookups?.employees?.find(
      (lookup) => String(lookup.employee_id ?? lookup.id ?? "") === employeeId,
    );
    return {
      employee_code: item.employee_code || employee?.employee_code || employeeId,
      full_name: item.full_name || employee?.full_name || "",
      position_name: item.position_name || employee?.position_name || "",
      is_decision_maker:
        Number(item.is_decision_maker) === 1 || item.is_decision_maker === true
          ? "Có"
          : "Không",
    };
  });
  const tests = parseDetailList(row.tests ?? row.tests_json);

  return (
    <div className="space-y-3">
      <DetailGrid
        items={[
          ["Mã lịch phỏng vấn", row.schedule_id],
          ["Mã lịch", row.schedule_code],
          ["Vòng tuyển dụng", row.round_type],
          ["Hình thức", row.format_type],
          ["Thời điểm bắt đầu", row.start_time, "start_time"],
          ["Thời điểm kết thúc", row.end_time, "end_time"],
          ["Địa điểm / Link họp", row.location],
          ["Ghi chú hội đồng", row.note],
          ["Lưu ý ứng viên", row.candidate_note],
          ["Trạng thái", row.status],
        ]}
      />
      <div className="space-y-5">
        <DetailSection title="Danh sách ứng viên">
          <DetailTable
            columns={[
              ["candidate_code", "Mã ứng viên"],
              ["full_name", "Họ và tên"],
              ["apply_position_name", "Vị trí ứng tuyển"],
              ["note", "Ghi chú"],
            ]}
            rows={candidates}
            empty="Chưa có ứng viên trong lịch."
          />
        </DetailSection>
        <DetailSection title="Hội đồng tuyển dụng">
          <DetailTable
            columns={[
              ["employee_code", "Mã nhân viên"],
              ["full_name", "Họ và tên"],
              ["position_name", "Chức vụ"],
              ["is_decision_maker", "Người quyết định"],
            ]}
            rows={council}
            empty="Chưa có thành viên hội đồng."
          />
        </DetailSection>
        <DetailSection title="Bài thi và đáp án">
          <InterviewScheduleTestsTable rows={tests} />
        </DetailSection>
      </div>
    </div>
  );
}

function EmployeeRelationsDetail({ row }: { row: Row }) {
  const contracts = parseDetailList(row.contracts);
  const workHistory = parseDetailList(row.workHistory ?? row.work_history);
  const rewards = parseDetailList(row.rewards);
  const leaveBalances = parseDetailList(
    row.leaveBalances ?? row.leave_balances,
  );
  return (
    <div className="space-y-5">
      <DetailSection title="1. Thông tin nhân sự">
        <DetailGrid
          items={[
            ["Mã nhân viên", row.employee_code],
            ["Họ và tên", row.full_name],
            ["Phòng ban", row.department_name],
            ["Vị trí", row.position_name],
            ["Quản lý trực tiếp", row.manager_name],
            ["Ngày vào làm", row.join_date, "date"],
            ["Trạng thái", row.employment_status],
          ]}
        />
      </DetailSection>
      <DetailSection title="2. Danh sách hợp đồng">
        <div className="space-y-3">
          {contracts.length ? (
            contracts.map((contract, index) => (
              <div
                key={String(contract.contract_id ?? index)}
                className="rounded-xl border border-slate-100 bg-slate-50/50 p-3"
              >
                <DetailGrid
                  items={[
                    ["Mã hợp đồng", contract.contract_id],
                    ["Số hợp đồng", contract.contract_no],
                    ["Mã nhân viên", contract.employee_id],
                    ["Nhân viên", contract.employee_name ?? row.full_name],
                    ["Vị trí nhân viên", contract.employee_position],
                    ["Mã người ký", contract.signer_id],
                    ["Người ký", contract.signer_name],
                    ["Chức vụ người ký", contract.signer_position],
                    ["Loại hợp đồng", contract.contract_type],
                    ["Ngày hợp đồng", contract.contract_date, "date"],
                    ["Ngày ký", contract.sign_date, "date"],
                    ["Ngày bắt đầu", contract.start_date, "date"],
                    ["Ngày kết thúc", contract.end_date, "date"],
                    [
                      "Có thử việc",
                      Number(contract.has_probation) ? "Có" : "Không",
                    ],
                    ["Lương cơ sở", contract.base_salary, "money"],
                    [
                      "Lương đóng BHXH",
                      contract.social_insurance_salary,
                      "money",
                    ],
                    ["Mức lương", contract.salary, "money"],
                    ["Thang lương", contract.salary_scale],
                    ["Bậc lương", contract.salary_grade],
                    ["Trạng thái", contract.status],
                    ["Ghi chú", contract.note],
                  ]}
                />
                <DetailTable
                  columns={[
                    ["allowance_type", "Loại phụ cấp"],
                    ["amount", "Số tiền"],
                  ]}
                  rows={parseDetailList(contract.allowance_details)}
                  empty="Không có phụ cấp."
                />
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
              Nhân sự chưa có hợp đồng lao động.
            </div>
          )}
        </div>
      </DetailSection>
      <DetailSection title="3. Quá trình công tác">
        <DetailTable
          columns={[
            ["work_history_id", "Mã quá trình công tác"],
            ["employee_id", "Mã nhân viên"],
            ["employee_name", "Nhân viên"],
            ["department_name", "Bộ phận"],
            ["position_name", "Vị trí"],
            ["decision_type", "Loại quyết định"],
            ["effective_date", "Ngày hiệu lực"],
            ["reason", "Lý do"],
            ["note", "Ghi chú"],
          ]}
          rows={workHistory}
          empty="Chưa có quá trình công tác."
        />
      </DetailSection>
      <DetailSection title="4. Khen thưởng / Kỷ luật">
        <DetailTable
          columns={[
            ["reward_discipline_id", "Mã khen thưởng / kỷ luật"],
            ["decision_no", "Số quyết định"],
            ["decision_type", "Loại quyết định"],
            ["employee_id", "Mã nhân viên"],
            ["employee_name", "Nhân viên"],
            ["decision_date", "Ngày ban hành"],
            ["effective_date", "Ngày hiệu lực"],
            ["decision_by", "Người ký"],
            ["amount", "Số tiền"],
            ["reason", "Lý do"],
            ["content", "Nội dung"],
          ]}
          rows={rewards}
          empty="Chưa có dữ liệu khen thưởng hoặc kỷ luật."
        />
      </DetailSection>
      <DetailSection title="5. Số dư ngày phép">
        <DetailTable
          columns={[
            ["leave_balance_id", "Mã số dư phép"],
            ["leave_year", "Năm phép"],
            ["entitled_days", "Ngày phép được hưởng"],
            ["carried_forward_days", "Ngày phép chuyển kỳ"],
            ["used_days_before", "Đã dùng trước đó"],
            ["used_days", "Đã sử dụng"],
            ["remaining_days_before", "Còn lại trước đó"],
            ["remaining_days_after", "Còn lại sau đó"],
            ["remaining_days", "Ngày phép còn lại"],
          ]}
          rows={leaveBalances}
          empty="Chưa có dữ liệu phép năm."
        />
      </DetailSection>
    </div>
  );
}

function StructuredDetail({
  name,
  tab,
  row,
  lookups,
}: {
  name: WorkspaceName;
  tab: WorkspaceTab;
  row: Row;
  lookups?: ScheduleLookups;
}) {
  if (name === "recruitment" && tab.id === "schedules") {
    return <InterviewScheduleDetail row={row} lookups={lookups} />;
  }
  if (name === "people" && tab.id === "employees") {
    return <EmployeeRelationsDetail row={row} />;
  }
  if (name === "people" && tab.id === "contracts") {
    return (
      <div className="space-y-5">
        <DetailSection title="1. Thông tin HĐLĐ">
          <DetailGrid
            items={[
              ["Số HĐ", row.contract_no],
              ["Ngày HĐ", row.contract_date, "date"],
              ["Ngày ký chính thức", row.sign_date, "date"],
              ["Nhân viên", row.employee_name],
              ["Vị trí nhân viên", row.employee_position ?? row.position_name],
              ["Loại HĐLĐ", row.contract_type],
              ["Từ ngày", row.start_date, "date"],
              ["Đến ngày", row.end_date, "date"],
              ["Trạng thái", row.status],
              ["Ghi chú", row.note],
            ]}
          />
        </DetailSection>
        <DetailSection title="2. Thông tin lương">
          <DetailGrid
            items={[
              ["Lương cơ bản", row.base_salary],
              ["Lương đóng BHXH", row.social_insurance_salary],
              ["Mức lương hợp đồng", row.salary],
              ["Thang lương", row.salary_scale],
              ["Bậc lương", row.salary_grade],
              ["Có thử việc", Number(row.has_probation) ? "Có" : "Không"],
              ["Từ ngày thử việc", row.probation_from_date, "date"],
              ["Đến ngày thử việc", row.probation_to_date, "date"],
              ["Tỷ lệ lương thử việc", row.probation_salary_rate],
            ]}
          />
        </DetailSection>
        <DetailSection title="3. Phụ cấp">
          <DetailTable
            columns={[
              ["allowance_type", "Loại phụ cấp"],
              ["amount", "Tiền hưởng"],
            ]}
            rows={parseDetailList(row.allowance_details)}
            empty="Không có phụ cấp."
          />
        </DetailSection>
        <DetailSection title="4. Phụ lục hợp đồng">
          <DetailTable
            columns={[
              ["appendix_no", "Số phụ lục"],
              ["appendix_type", "Loại phụ lục"],
              ["effective_date", "Ngày hiệu lực"],
              ["description", "Nội dung"],
            ]}
            rows={parseDetailList(row.appendices)}
            empty="Không có phụ lục hợp đồng."
          />
        </DetailSection>
      </div>
    );
  }
  if (name === "people" && tab.id === "transfer-proposals") {
    const details = parseDetailList(row.detail_items);
    return (
      <div className="space-y-5">
        <DetailSection title="1. Thông tin chung">
          <DetailGrid
            items={[
              ["Số đề xuất", row.proposal_code],
              ["Ngày đề xuất", row.proposal_date, "date"],
              [
                "Ngày hiệu lực",
                row.effective_date ?? row.proposed_effective_date,
                "date",
              ],
              ["Loại quyết định", row.decision_type],
              ["Người đề xuất", row.proposer_name],
              ["Vị trí người đề xuất", row.proposer_position],
              ["Bộ phận đề xuất", row.proposer_department],
              ["Trạng thái", row.status],
              ["Diễn giải", row.description],
              ["Ghi chú", row.note],
            ]}
          />
        </DetailSection>
        <DetailSection title="2. Chi tiết nhân sự">
          <DetailTable
            columns={[
              ["employee_id", "Mã nhân viên"],
              ["employee_name", "Tên nhân viên"],
              ["current_position_name", "Vị trí hiện tại"],
              ["current_department_name", "Bộ phận hiện tại"],
              ["target_position_name", "Vị trí mới"],
              ["target_department_name", "Bộ phận mới"],
              ["note", "Ghi chú"],
            ]}
            rows={details.map((detail) => ({
              ...detail,
              employee_name: detail.employee_name ?? row.employee_name,
              current_position_name:
                detail.current_position_name ?? row.current_pos_name,
              current_department_name:
                detail.current_department_name ?? row.current_dept_name,
              target_position_name:
                detail.target_position_name ?? row.target_pos_name,
              target_department_name:
                detail.target_department_name ?? row.target_dept_name,
            }))}
          />
        </DetailSection>
      </div>
    );
  }
  if (name === "people" && tab.id === "transfer-decisions") {
    const details = parseDetailList(row.detail_items);
    return (
      <div className="space-y-5">
        <DetailSection title="1. Thông tin chung">
          <DetailGrid
            items={[
              ["Số quyết định", row.decision_number],
              ["Ngày", row.decision_date, "date"],
              ["Ngày hiệu lực", row.effective_date, "date"],
              ["Loại quyết định", row.decision_type],
              ["Người lập", row.creator_name],
              ["Vị trí", row.creator_position],
              ["Bộ phận", row.creator_department],
              ["Người ký", row.signed_by],
              ["Trạng thái", row.status],
              ["Diễn giải", row.description],
              ["Lý do", row.reason],
              ["Ghi chú", row.note],
            ]}
          />
        </DetailSection>
        <DetailSection title="2. Chi tiết nhân sự">
          <DetailTable
            columns={[
              ["employee_id", "Mã nhân viên"],
              ["employee_name", "Tên nhân viên"],
              ["current_position_name", "Vị trí hiện tại"],
              ["current_department_name", "Bộ phận hiện tại"],
              ["target_position_name", "Vị trí mới"],
              ["target_department_name", "Bộ phận mới"],
              ["manager_name", "Quản lý trực tiếp mới"],
              ["note", "Ghi chú"],
            ]}
            rows={
              details.length
                ? details.map((detail) => ({
                    ...detail,
                    employee_name: detail.employee_name ?? row.employee_name,
                    current_position_name:
                      detail.current_position_name ?? row.current_pos_name,
                    current_department_name:
                      detail.current_department_name ?? row.current_dept_name,
                    target_position_name:
                      detail.target_position_name ?? row.target_pos_name,
                    target_department_name:
                      detail.target_department_name ?? row.target_dept_name,
                    manager_name: detail.manager_name ?? row.manager_name,
                  }))
                : [
                    {
                      employee_id: row.employee_id,
                      employee_name: row.employee_name,
                      current_position_name: row.current_pos_name,
                      current_department_name: row.current_dept_name,
                      target_position_name: row.target_pos_name,
                      target_department_name: row.target_dept_name,
                      manager_name: row.manager_name,
                      note: row.note,
                    },
                  ]
            }
          />
        </DetailSection>
      </div>
    );
  }
  if (name === "rewards" && tab.id === "evaluations") {
    const details = parseDetailList(row.details);
    return (
      <div className="space-y-5">
        <DetailSection title="1. Thông tin chung">
          <DetailGrid
            items={[
              ["Mã phiếu", row.evaluation_code],
              ["Ngày đánh giá", row.evaluation_date, "date"],
              [
                "Kỳ đánh giá",
                row.evaluation_quarter ? `Quý ${row.evaluation_quarter}` : "-",
              ],
              ["Năm", row.year],
              ["Người đánh giá", row.evaluator_name],
              ["Nhân viên được đánh giá", row.employee_name],
              ["Vị trí", row.position_name],
              ["Bộ phận", row.department_name],
              ["Tổng điểm", row.total_score],
              ["Xếp loại", row.grade_result],
              ["Trạng thái", row.status],
              ["Diễn giải", row.description],
              ["Nhận xét quản lý", row.manager_comment],
              ["Đề xuất", row.recommendation],
            ]}
          />
        </DetailSection>
        <DetailSection title="2. Chi tiết tiêu chí">
          <DetailTable
            columns={[
              ["criteria_code", "Mã tiêu chí"],
              ["criteria_name", "Tên tiêu chí"],
              ["score", "Quản lý đánh giá"],
              ["weight", "Trọng số"],
              ["note", "Ý kiến, đề xuất"],
            ]}
            rows={details}
          />
        </DetailSection>
      </div>
    );
  }
  if (name === "rewards" && tab.id === "criteria") {
    const scales = parseDetailList(row.scales);
    return (
      <div className="space-y-5">
        <DetailSection title="1. Thông tin tiêu chí">
          <DetailGrid
            items={[
              ["Mã tiêu chí", row.criteria_code],
              ["Tên tiêu chí", row.criteria_name],
              ["Trọng số", row.weight],
              ["Mô tả", row.description],
              ["Trạng thái", row.status],
            ]}
          />
        </DetailSection>
        <DetailSection title="2. Thang điểm chi tiết">
          <DetailTable
            columns={[
              ["grade_name", "Xếp loại"],
              ["min_score", "Điểm từ"],
              ["max_score", "Điểm đến"],
              ["description", "Mô tả"],
            ]}
            rows={scales}
            empty="Chưa có thang điểm chi tiết."
          />
        </DetailSection>
      </div>
    );
  }
  if (name === "rewards" && tab.id === "proposals") {
    return (
      <div className="space-y-5">
        <DetailSection title="1. Thông tin đề xuất">
          <DetailGrid
            items={[
              ["Mã đề xuất", row.proposal_code],
              ["Loại", row.record_type],
              ["Nhân viên", row.employee_name],
              ["Mã nhân viên", row.employee_code],
              ["Ngày đề xuất", row.proposal_date, "date"],
              ["Người đề xuất", row.proposed_by],
              ["Số tiền", row.proposed_amount],
              ["Trạng thái", row.status],
            ]}
          />
        </DetailSection>
        <DetailSection title="2. Nội dung">
          <DetailGrid
            items={[
              ["Lý do", row.reason],
              ["Nội dung đề xuất", row.content],
              ["Tệp đính kèm", row.attachment_url],
            ]}
          />
        </DetailSection>
      </div>
    );
  }
  if (name === "rewards" && tab.id === "decisions") {
    return (
      <div className="space-y-5">
        <DetailSection title="1. Thông tin quyết định">
          <DetailGrid
            items={[
              ["Số quyết định", row.decision_no],
              ["Loại quyết định", row.decision_type],
              ["Nhân viên", row.employee_name],
              ["Mã nhân viên", row.employee_code],
              ["Đề xuất liên kết", row.proposal_id],
              ["Ngày ban hành", row.decision_date, "date"],
              ["Ngày hiệu lực", row.effective_date, "date"],
              ["Số tiền", row.amount],
              ["Người ký", row.decision_by],
              ["Trạng thái", row.status],
            ]}
          />
        </DetailSection>
        <DetailSection title="2. Nội dung">
          <DetailGrid
            items={[
              ["Lý do", row.reason],
              ["Nội dung quyết định", row.content],
              ["Tệp đính kèm", row.attachment_url],
            ]}
          />
        </DetailSection>
      </div>
    );
  }
  if (name === "recruitment" && tab.id === "screenings") {
    const details = parseDetailList(row.criteria);
    return (
      <div className="space-y-5">
        <DetailSection title="1. Thông tin ứng viên">
          <DetailGrid
            items={[
              ["Mã phiếu", row.screening_code],
              ["Ứng viên", row.candidate_name],
              ["Mã ứng viên", row.candidate_code],
              ["Vị trí", row.position_name],
              ["Bộ phận", row.department_name],
              ["Ngày nhận hồ sơ", row.received_date, "date"],
              ["Trình độ văn hóa", row.culture_level],
              ["Trình độ chuyên môn", row.education_level],
              ["Trường đào tạo", row.education_school],
            ]}
          />
        </DetailSection>
        <DetailSection title="2. Điều kiện sơ loại">
          <DetailTable
            columns={[
              ["criteria_type", "Loại tiêu chí"],
              ["required_from", "Điều kiện yêu cầu"],
              ["candidate_value", "Giá trị ứng viên"],
              ["candidate_description", "Mô tả đánh giá"],
              ["is_passed", "Đạt"],
              ["note", "Ghi chú"],
            ]}
            rows={details}
          />
        </DetailSection>
        <DetailSection title="3. Đánh giá sơ loại">
          <DetailGrid
            items={[
              ["Ngày sơ loại", row.screening_date, "date"],
              ["Mức độ phù hợp", row.level_score],
              ["Kết quả", row.screening_result],
              ["Nhận xét", row.comment],
            ]}
          />
        </DetailSection>
      </div>
    );
  }
  if (name === "recruitment" && tab.id === "interview-evaluations") {
    return (
      <div className="space-y-5">
        <DetailSection title="1. Thông tin chung">
          <DetailGrid
            items={[
              ["Số phiếu", row.eval_code],
              ["Ngày đánh giá", row.evaluation_date, "date"],
              ["Ứng viên", row.candidate_name],
              ["Lịch phỏng vấn", row.schedule_code],
              ["Người đánh giá", row.evaluator_name],
              ["Thời lượng", row.duration_minutes],
              ["Kết quả", row.overall_result],
              ["Nhận xét chung", row.overall_comment],
            ]}
          />
        </DetailSection>
        <DetailSection title="2. Kịch bản hỏi đáp">
          <DetailTable
            columns={[
              ["question", "Câu hỏi"],
              ["expectation", "Kỳ vọng"],
              ["answer", "Câu trả lời"],
            ]}
            rows={parseDetailList(row.script)}
          />
        </DetailSection>
        <DetailSection title="3. Chi tiết đánh giá">
          <DetailTable
            columns={[
              ["criteria_type", "Tiêu chí"],
              ["required_from", "Điều kiện đạt"],
              ["candidate_value", "Đánh giá ứng viên"],
              ["is_passed", "Đạt"],
              ["note", "Ghi chú"],
            ]}
            rows={parseDetailList(row.criteria)}
          />
        </DetailSection>
        <DetailSection title="4. Thông tin offer">
          <DetailGrid
            items={[
              [
                "Ngày dự kiến đi làm",
                (row.offer as Row)?.expected_start_date,
                "date",
              ],
              ["Lương thử việc", (row.offer as Row)?.probation_salary],
              ["Lương chính thức", (row.offer as Row)?.official_salary],
              ["Trạng thái", (row.offer as Row)?.offer_status],
              ["Ghi chú", (row.offer as Row)?.note],
            ]}
          />
        </DetailSection>
      </div>
    );
  }
  if (name === "recruitment" && tab.id === "decisions") {
    return (
      <div className="space-y-5">
        <DetailSection title="1. Quyết định tuyển dụng">
          <DetailGrid
            items={[
              ["Số phiếu", row.decision_number],
              ["Ngày quyết định", row.decision_date, "date"],
              ["Ứng viên", row.candidate_name],
              ["Mã ứng viên", row.candidate_code],
              [
                "Phiếu đánh giá phỏng vấn",
                row.eval_code ?? row.interview_eval_id,
              ],
              ["Kết quả", row.result],
              ["Đánh giá chung", row.overall_comment],
              ["Lý do bị loại", row.rejection_reason],
              ["Trạng thái", row.status],
            ]}
          />
        </DetailSection>
      </div>
    );
  }
  return null;
}

function formatDateValue(value: unknown) {
  return dateInputValue(value);
}

function toDisplayDate(value: unknown) {
  return parseDateValue(value) || new Date(Number.NaN);
}

function formatDateTimeValue(value: unknown) {
  if (!value) return "";
  const date = toDisplayDate(value);
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

function normalizeInterviewScore(value: unknown) {
  const score = Number(value);
  if (!Number.isFinite(score)) return "3";
  const normalized = score > 5 ? Math.round(score / 2) : Math.round(score);
  return String(Math.min(5, Math.max(1, normalized)));
}

function normalizeInterviewResult(value: unknown) {
  const result = String(value ?? "").trim().toUpperCase();
  if (["ĐẠT", "PASSED"].includes(result)) return "ĐẠT";
  if (["KHÔNG ĐẠT", "FAILED"].includes(result)) return "KHÔNG ĐẠT";
  return "";
}

function rowId(tab: WorkspaceTab, row: Row) {
  return String(row[tab.idField] ?? row.id ?? row.code ?? "");
}

function enrichCandidateReference(row: Row, candidates: Row[]) {
  const candidateId = row.candidate_id ?? row.candidateId;
  if (!candidateId) return row;
  const candidate = candidates.find(
    (item) => String(item.candidate_id ?? item.id ?? "") === String(candidateId),
  );
  if (!candidate) return row;
  const hasValue = (value: unknown) =>
    value !== null && value !== undefined && String(value).trim() !== "" && String(value).trim() !== "-";
  const fallback = (value: unknown, alternative: unknown) =>
    hasValue(value) ? value : alternative;
  return {
    ...row,
    candidate_name: fallback(row.candidate_name, candidate.full_name),
    candidate_code: fallback(row.candidate_code, candidate.candidate_code),
    position_name: fallback(row.position_name, candidate.apply_position_name ?? candidate.position_name),
    department_name: fallback(row.department_name, candidate.department_name),
  };
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

type DecisionLookups = CandidateLookups & {
  evaluations: Row[];
  criteria: Row[];
  rewardProposals: Row[];
};

type EmployeeLookups = RequestLookups & {
  candidates: Row[];
};

type ContractLookups = RequestLookups & {
  contractTypes: Row[];
};

type TransferDecisionLookups = RequestLookups & {
  transferProposals: Row[];
};

type EvaluationFormLookups = RequestLookups & {
  criteria: Row[];
};

type RewardDecisionLookups = RequestLookups & {
  rewardProposals: Row[];
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
  setValues: (
    updater: (current: Record<string, string>) => Record<string, string>,
  ) => void;
  lookups: CandidateLookups;
}) {
  const candidate = lookups.candidates.find(
    (item) => String(item.candidate_id ?? "") === values.candidate_id,
  );
  const criteria = parseDetailList(values.criteria);
  const set = (name: string, value: string) =>
    setValues((current) => ({ ...current, [name]: value }));
  const updateCriteria = (next: Array<Record<string, unknown>>) =>
    set("criteria", JSON.stringify(next));
  const updateCriterion = (index: number, name: string, value: unknown) => {
    const next = [...criteria];
    next[index] = { ...next[index], [name]: value };
    updateCriteria(next);
  };
  const criterionRow = {
    criteria_type: screeningCriteriaTypes[0],
    required_from: "",
    candidate_value: "",
    candidate_description: "",
    is_passed: true,
    note: "",
  };

  return (
    <div className="space-y-5">
      <section>
        <h3 className="mb-3 font-display text-sm font-bold text-slate-900">
          1. Thông tin ứng viên
        </h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">
              Ứng viên *
            </label>
            <select
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
              value={values.candidate_id ?? ""}
              required
              disabled={Boolean(values.candidate_id)}
              onChange={(event) => set("candidate_id", event.target.value)}
            >
              <option value="">-- Chọn ứng viên --</option>
              {lookups.candidates.map((item) => (
                <option
                  key={String(item.candidate_id)}
                  value={String(item.candidate_id)}
                >
                  {String(item.candidate_code ?? item.candidate_id)} -{" "}
                  {String(item.full_name ?? "")}
                </option>
              ))}
            </select>
            {values.candidate_id && (
              <p className="mt-1 text-[11px] text-slate-400">
                Thông tin được lấy tự động từ hồ sơ ứng viên và không chỉnh sửa
                tại phiếu sơ loại.
              </p>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              "candidate_code",
              "full_name",
              "phone",
              "email",
              "received_date",
              "culture_level",
              "education_level",
              "education_school",
              "apply_position_name",
              "department_name",
            ].map((name) => {
              const labels: Record<string, string> = {
                candidate_code: "Mã ứng viên",
                full_name: "Họ tên",
                phone: "Số điện thoại",
                email: "Email",
                received_date: "Ngày nhận hồ sơ",
                culture_level: "Trình độ văn hóa",
                education_level: "Trình độ chuyên môn",
                education_school: "Trường đào tạo",
                apply_position_name: "Vị trí ứng tuyển",
                department_name: "Bộ phận",
              };
              return (
                <div key={name}>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    {labels[name]}
                  </label>
                  <Input
                    value={String(candidate?.[name] ?? values[name] ?? "")}
                    disabled
                    className="h-10 bg-slate-100 text-slate-500"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-3 font-display text-sm font-bold text-slate-900">
          2. Điều kiện sơ loại
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => updateCriteria([...criteria, criterionRow])}
            >
              <Plus size={14} /> Thêm dòng
            </Button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full min-w-[980px] text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-3 py-3">Loại tiêu chí</th>
                  <th className="px-3 py-3">Điều kiện yêu cầu</th>
                  <th className="px-3 py-3">Giá trị ứng viên</th>
                  <th className="px-3 py-3">Mô tả đánh giá</th>
                  <th className="px-3 py-3">Đạt</th>
                  <th className="px-3 py-3">Ghi chú</th>
                  <th className="px-3 py-3">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {criteria.map((item, index) => (
                  <tr key={index}>
                    <td className="px-3 py-2">
                      <select
                        className="h-9 rounded-lg border border-slate-200 px-2"
                        value={String(
                          item.criteria_type ?? screeningCriteriaTypes[0],
                        )}
                        onChange={(event) =>
                          updateCriterion(
                            index,
                            "criteria_type",
                            event.target.value,
                          )
                        }
                      >
                        {screeningCriteriaTypes.map((type) => (
                          <option key={type}>{type}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        value={String(
                          item.required_from ?? item.required_description ?? "",
                        )}
                        onChange={(event) =>
                          updateCriterion(
                            index,
                            "required_from",
                            event.target.value,
                          )
                        }
                        className="h-9"
                        placeholder="Ví dụ: 2 năm"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        value={String(item.candidate_value ?? "")}
                        onChange={(event) =>
                          updateCriterion(
                            index,
                            "candidate_value",
                            event.target.value,
                          )
                        }
                        className="h-9"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        value={String(item.candidate_description ?? "")}
                        onChange={(event) =>
                          updateCriterion(
                            index,
                            "candidate_description",
                            event.target.value,
                          )
                        }
                        className="h-9"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={Boolean(item.is_passed)}
                        onChange={(event) =>
                          updateCriterion(
                            index,
                            "is_passed",
                            event.target.checked,
                          )
                        }
                        className="size-4 accent-teal-600"
                        aria-label={`Tiêu chí ${index + 1} đạt`}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        value={String(item.note ?? "")}
                        onChange={(event) =>
                          updateCriterion(index, "note", event.target.value)
                        }
                        className="h-9"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          updateCriteria(
                            criteria.filter(
                              (_, itemIndex) => itemIndex !== index,
                            ),
                          )
                        }
                      >
                        <Trash2 size={15} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {criteria.length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
              Chưa có tiêu chí. Nhấn “Thêm dòng” để bắt đầu.
            </p>
          )}
        </div>
      </section>

      <section>
        <h3 className="mb-3 font-display text-sm font-bold text-slate-900">
          3. Đánh giá sơ loại
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <WorkspaceInput
            field={{
              name: "screening_date",
              label: "Ngày sơ loại",
              type: "date",
              required: true,
            }}
            tabId="screenings"
            value={values.screening_date ?? ""}
            onChange={(value) => set("screening_date", value)}
          />
          <WorkspaceInput
            field={{
              name: "level_score",
              label: "Mức độ phù hợp (0-10)",
              type: "number",
              required: true,
            }}
            tabId="screenings"
            value={values.level_score ?? ""}
            onChange={(value) => set("level_score", value)}
          />
          <WorkspaceInput
            field={{
              name: "screening_result",
              label: "Kết quả",
              type: "select",
              options: [
                { value: "ĐẠT", label: "Đạt" },
                { value: "KHÔNG ĐẠT", label: "Không đạt" },
              ],
            }}
            tabId="screenings"
            value={values.screening_result ?? "ĐẠT"}
            onChange={(value) => set("screening_result", value)}
          />
          <div className="md:col-span-2">
            <WorkspaceInput
              field={{
                name: "comment",
                label: "Nhận xét tổng hợp",
                type: "textarea",
              }}
              tabId="screenings"
              value={values.comment ?? ""}
              onChange={(value) => set("comment", value)}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

const appendixTypes = [
  "Gia hạn HĐLĐ",
  "Điều chỉnh lương",
  "Điều chỉnh chức danh/vị trí",
  "Điều chỉnh phụ cấp",
  "Điều chỉnh thời gian làm việc",
  "Điều chỉnh địa điểm làm việc",
];

function ContractForm({
  values,
  setValues,
  lookups,
}: {
  values: Record<string, string>;
  setValues: (
    updater: (current: Record<string, string>) => Record<string, string>,
  ) => void;
  lookups: ContractLookups;
}) {
  const [activeTab, setActiveTab] = useState<
    "general" | "salary" | "allowances" | "appendices"
  >("general");
  const allowances = parseDetailList(values.allowance_details);
  const appendices = parseDetailList(values.appendices);
  const employee = lookups.employees.find(
    (item) => String(item.employee_id ?? "") === values.employee_id,
  );
  const signer = lookups.employees.find(
    (item) => String(item.employee_id ?? "") === values.signer_id,
  );
  const selectedType = lookups.contractTypes.find(
    (item) =>
      String(item.contract_type_code ?? item.contract_type_name ?? "") ===
      values.contract_type,
  );
  const positions = lookups.positions.filter(
    (item) =>
      !employee?.department_id ||
      String(item.department_id ?? "") === String(employee.department_id),
  );
  const set = (name: string, value: string) =>
    setValues((current) => ({ ...current, [name]: value }));
  const updateList = (name: string, next: Array<Record<string, unknown>>) =>
    set(name, JSON.stringify(next));
  const updateRow = (
    name: string,
    rows: Array<Record<string, unknown>>,
    index: number,
    key: string,
    value: unknown,
  ) => {
    const next = [...rows];
    next[index] = { ...next[index], [key]: value };
    updateList(name, next);
  };
  const selectSigner = (employeeId: string) => {
    const selected = lookups.employees.find(
      (item) => String(item.employee_id ?? "") === employeeId,
    );
    setValues((current) => ({
      ...current,
      signer_id: employeeId,
      signer_name: String(selected?.full_name ?? ""),
      signer_position: String(selected?.position_name ?? ""),
    }));
  };
  const selectEmployee = (employeeId: string) => {
    const selected = lookups.employees.find(
      (item) => String(item.employee_id ?? "") === employeeId,
    );
    setValues((current) => ({
      ...current,
      employee_id: employeeId,
      employee_position: String(selected?.position_name ?? ""),
    }));
  };
  const selectType = (typeCode: string) => {
    const type = lookups.contractTypes.find(
      (item) =>
        String(item.contract_type_code ?? item.contract_type_name ?? "") ===
        typeCode,
    );
    setValues((current) => ({
      ...current,
      contract_type: typeCode,
      has_probation:
        Number(type?.has_probation) === 1
          ? "1"
          : (current.has_probation ?? "0"),
    }));
  };
  const field = (
    name: string,
    label: string,
    type: WorkspaceField["type"] = "text",
    required = false,
    disabled = false,
  ) => (
    <WorkspaceInput
      field={{ name, label, type, required, disabled }}
      tabId="contracts"
      value={values[name] ?? ""}
      onChange={(value) => set(name, value)}
    />
  );
  const hasProbation = values.has_probation === "1";

  return (
    <div className="space-y-5">
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {[
          ["general", "1. Thông tin HĐLĐ"],
          ["salary", "2. Thông tin lương"],
          ["allowances", "3. Phụ cấp"],
          ["appendices", "4. Phụ lục hợp đồng"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key as typeof activeTab)}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-xs font-bold ${activeTab === key ? "border-teal-600 text-teal-700" : "border-transparent text-slate-400"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {activeTab === "general" && (
        <div className="grid gap-4 md:grid-cols-2">
          {field("contract_date", "Ngày HĐ", "date", true)}
          {field("contract_no", "Số HĐ")}
          {
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">
                Đại diện ký *
              </label>
              <select
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                value={values.signer_id ?? ""}
                required
                onChange={(event) => selectSigner(event.target.value)}
              >
                <option value="">-- Chọn người ký --</option>
                {lookups.employees.map((item) => (
                  <option
                    key={String(item.employee_id)}
                    value={String(item.employee_id)}
                  >
                    {String(item.employee_code ?? item.employee_id)} -{" "}
                    {String(item.full_name ?? "")}
                  </option>
                ))}
              </select>
            </div>
          }
          {field("signer_position", "Vị trí người ký", "text", false, true)}
          {
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">
                Nhân viên *
              </label>
              <select
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                value={values.employee_id ?? ""}
                required
                onChange={(event) => selectEmployee(event.target.value)}
              >
                <option value="">-- Chọn nhân viên --</option>
                {lookups.employees.map((item) => (
                  <option
                    key={String(item.employee_id)}
                    value={String(item.employee_id)}
                  >
                    {String(item.employee_code ?? item.employee_id)} -{" "}
                    {String(item.full_name ?? "")}
                  </option>
                ))}
              </select>
            </div>
          }
          {field("employee_position", "Vị trí nhân viên", "text", false, true)}
          {
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">
                Loại HĐLĐ *
              </label>
              <select
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                value={values.contract_type ?? ""}
                required
                onChange={(event) => selectType(event.target.value)}
              >
                <option value="">-- Chọn loại HĐLĐ --</option>
                {lookups.contractTypes.map((item) => (
                  <option
                    key={String(item.contract_type_id)}
                    value={String(
                      item.contract_type_code ?? item.contract_type_name,
                    )}
                  >
                    {String(item.contract_type_code ?? "")} -{" "}
                    {String(item.contract_type_name ?? "")}
                  </option>
                ))}
              </select>
            </div>
          }
          {
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">
                Thời hạn HĐ
              </label>
              <Input
                value={
                  selectedType
                    ? `${String(selectedType.duration_months ?? 0)} tháng`
                    : "Theo loại HĐLĐ"
                }
                disabled
                className="h-10 bg-slate-100 text-slate-500"
              />
            </div>
          }
          {field("start_date", "Từ ngày", "date", true)}
          {field("end_date", "Đến ngày", "date")}
          {
            <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
              <input
                id="has-probation"
                type="checkbox"
                checked={hasProbation}
                onChange={(event) =>
                  set("has_probation", event.target.checked ? "1" : "0")
                }
                className="size-4 accent-teal-600"
              />
              <label
                htmlFor="has-probation"
                className="text-sm font-semibold text-slate-700"
              >
                Có thử việc
              </label>
            </div>
          }
          {hasProbation && (
            <>
              {field("probation_from_date", "Thử việc từ ngày", "date", true)}
              {field("probation_to_date", "Thử việc đến ngày", "date", true)}
              {field(
                "probation_salary_rate",
                "Tỷ lệ lương thử việc (%)",
                "number",
                true,
              )}
            </>
          )}
          {field("job_description", "Mô tả công việc", "textarea")}
        </div>
      )}
      {activeTab === "salary" && (
        <div className="grid gap-4 md:grid-cols-2">
          {field("base_salary", "Lương cơ bản", "number", true)}
          {field(
            "social_insurance_salary",
            "Lương đóng bảo hiểm",
            "number",
            true,
          )}
          <p className="text-[11px] text-slate-400 md:col-span-2">
            Nhập số tiền VND, không nhập số lẻ.
          </p>
        </div>
      )}
      {activeTab === "allowances" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-slate-900">
              Phụ cấp
            </h3>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                updateList("allowance_details", [
                  ...allowances,
                  { allowance_type: "", amount: 0 },
                ])
              }
            >
              <Plus size={14} /> Thêm phụ cấp
            </Button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full min-w-[600px] text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-3 py-3">Loại phụ cấp</th>
                  <th className="px-3 py-3">Tiền hưởng</th>
                  <th className="px-3 py-3">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allowances.map((item, index) => (
                  <tr key={index}>
                    <td className="px-3 py-2">
                      <Input
                        value={String(item.allowance_type ?? "")}
                        onChange={(event) =>
                          updateRow(
                            "allowance_details",
                            allowances,
                            index,
                            "allowance_type",
                            event.target.value,
                          )
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        step="1"
                        value={String(item.amount ?? "")}
                        onChange={(event) =>
                          updateRow(
                            "allowance_details",
                            allowances,
                            index,
                            "amount",
                            Number(event.target.value) || 0,
                          )
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          updateList(
                            "allowance_details",
                            allowances.filter(
                              (_, itemIndex) => itemIndex !== index,
                            ),
                          )
                        }
                      >
                        <Trash2 size={15} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!allowances.length && (
            <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
              Chưa có phụ cấp.
            </p>
          )}
        </div>
      )}
      {activeTab === "appendices" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-sm font-bold text-slate-900">
                Phụ lục hợp đồng
              </h3>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                updateList("appendices", [
                  ...appendices,
                  {
                    appendix_no: "",
                    signed_date: "",
                    appendix_type: appendixTypes[0],
                    effective_date: "",
                    changed_content: "",
                    signer_id: "",
                    signer_name: "",
                    attachment_url: "",
                    note: "",
                  },
                ])
              }
            >
              <Plus size={14} /> Thêm phụ lục
            </Button>
          </div>
          {appendices.map((item, index) => (
            <div
              key={index}
              className="space-y-4 rounded-xl border border-slate-100 p-4"
            >
              <div className="flex items-center justify-between">
                <b className="text-sm text-slate-800">Phụ lục {index + 1}</b>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    updateList(
                      "appendices",
                      appendices.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                >
                  <Trash2 size={15} />
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  ["appendix_no", "Số phụ lục"],
                  ["signed_date", "Ngày ký"],
                  ["effective_date", "Ngày hiệu lực"],
                  ["attachment_url", "File đính kèm"],
                  ["changed_content", "Nội dung thay đổi"],
                  ["note", "Ghi chú"],
                ].map(([key, label]) => (
                  <div key={key}>
                    <label className="mb-1.5 block text-xs font-bold text-slate-600">
                      {label}
                    </label>
                    <Input
                      type={key.includes("date") ? "date" : "text"}
                      value={String(item[key] ?? "")}
                      onChange={(event) =>
                        updateRow(
                          "appendices",
                          appendices,
                          index,
                          key,
                          event.target.value,
                        )
                      }
                    />
                  </div>
                ))}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Loại phụ lục *
                  </label>
                  <select
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                    value={String(item.appendix_type ?? appendixTypes[0])}
                    onChange={(event) =>
                      updateRow(
                        "appendices",
                        appendices,
                        index,
                        "appendix_type",
                        event.target.value,
                      )
                    }
                  >
                    {appendixTypes.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Người ký
                  </label>
                  <select
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                    value={String(item.signer_id ?? "")}
                    onChange={(event) => {
                      const selected = lookups.employees.find(
                        (person) =>
                          String(person.employee_id ?? "") ===
                          event.target.value,
                      );
                      const next = [...appendices];
                      next[index] = {
                        ...next[index],
                        signer_id: event.target.value,
                        signer_name: selected?.full_name ?? "",
                      };
                      updateList("appendices", next);
                    }}
                  >
                    <option value="">-- Chọn người ký --</option>
                    {lookups.employees.map((person) => (
                      <option
                        key={String(person.employee_id)}
                        value={String(person.employee_id)}
                      >
                        {String(person.employee_code ?? person.employee_id)} -{" "}
                        {String(person.full_name ?? "")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
          {!appendices.length && (
            <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
              Chưa có phụ lục.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function TransferProposalForm({
  values,
  setValues,
  lookups,
  session,
}: {
  values: Record<string, string>;
  setValues: (
    updater: (current: Record<string, string>) => Record<string, string>,
  ) => void;
  lookups: RequestLookups;
  session: Session | null;
}) {
  const [activeTab, setActiveTab] = useState<"general" | "detail">("general");
  const details = parseDetailList(values.detail_items);
  const detail = details[0] ?? {};
  const proposer = lookups.employees.find(
    (item) => String(item.employee_id ?? "") === values.proposer_id,
  );
  const selectedEmployee = lookups.employees.find(
    (item) =>
      String(item.employee_id ?? "") === String(detail.employee_id ?? ""),
  );
  const currentDepartment = lookups.departments.find(
    (item) =>
      String(item.department_id ?? "") ===
      String(
        detail.current_department_id ?? selectedEmployee?.department_id ?? "",
      ),
  );
  const currentPosition = lookups.positions.find(
    (item) =>
      String(item.position_id ?? "") ===
      String(detail.current_position_id ?? selectedEmployee?.position_id ?? ""),
  );
  const targetPositions = lookups.positions.filter(
    (item) =>
      !detail.target_department_id ||
      String(item.department_id ?? "") === String(detail.target_department_id),
  );
  const set = (name: string, value: string) =>
    setValues((current) => ({ ...current, [name]: value }));
  const updateDetail = (key: string, value: unknown) =>
    setValues((current) => ({
      ...current,
      detail_items: JSON.stringify([{ ...detail, [key]: value }]),
    }));
  const selectProposer = (employeeId: string) => {
    const employee = lookups.employees.find(
      (item) => String(item.employee_id ?? "") === employeeId,
    );
    setValues((current) => ({
      ...current,
      proposer_id: employeeId,
      proposer_name: String(employee?.full_name ?? ""),
      proposer_position: String(employee?.position_name ?? ""),
      proposer_department: String(
        lookups.departments.find(
          (item) =>
            String(item.department_id ?? "") ===
            String(employee?.department_id ?? ""),
        )?.department_name ?? "",
      ),
    }));
  };
  const selectEmployee = (employeeId: string) => {
    const employee = lookups.employees.find(
      (item) => String(item.employee_id ?? "") === employeeId,
    );
    setValues((current) => ({
      ...current,
      detail_items: JSON.stringify([
        {
          ...detail,
          employee_id: employeeId,
          employee_name: employee?.full_name ?? "",
          current_department_id: employee?.department_id ?? "",
          current_position_id: employee?.position_id ?? "",
          target_department_id: "",
          target_position_id: "",
          note: detail.note ?? "",
        },
      ]),
    }));
  };
  const employeeDetail = (label: string, value: unknown) => (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </div>
      <div className="mt-1 text-sm text-slate-700">
        {String(value ?? "-") || "-"}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {[
          ["general", "1. Thông tin chung"],
          ["detail", "2. Chi tiết"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key as typeof activeTab)}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-xs font-bold ${activeTab === key ? "border-teal-600 text-teal-700" : "border-transparent text-slate-400"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {activeTab === "general" && (
        <div className="grid gap-4 md:grid-cols-2">
          {
            <WorkspaceInput
              field={{
                name: "proposal_date",
                label: "Ngày đề xuất",
                type: "date",
                required: true,
              }}
              tabId="transfer-proposals"
              value={values.proposal_date ?? ""}
              onChange={(value) => set("proposal_date", value)}
            />
          }
          {
            <WorkspaceInput
              field={{ name: "proposal_code", label: "Số đề xuất" }}
              tabId="transfer-proposals"
              value={values.proposal_code ?? ""}
              onChange={(value) => set("proposal_code", value)}
            />
          }
          {
            <WorkspaceInput
              field={{
                name: "effective_date",
                label: "Ngày hiệu lực đề xuất",
                type: "date",
                required: true,
              }}
              tabId="transfer-proposals"
              value={values.effective_date ?? ""}
              onChange={(value) => set("effective_date", value)}
            />
          }
          {
            <WorkspaceInput
              field={{
                name: "decision_type",
                label: "Loại quyết định",
                type: "select",
                options: [
                  { value: "Thuyên chuyển", label: "Thuyên chuyển" },
                  { value: "Bổ nhiệm", label: "Bổ nhiệm" },
                  { value: "Miễn nhiệm", label: "Miễn nhiệm" },
                ],
              }}
              tabId="transfer-proposals"
              value={values.decision_type ?? "Thuyên chuyển"}
              onChange={(value) => set("decision_type", value)}
            />
          }
          {
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">
                Người đề xuất *
              </label>
              <select
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                value={values.proposer_id ?? ""}
                required
                onChange={(event) => selectProposer(event.target.value)}
              >
                <option value="">-- Chọn người đề xuất --</option>
                {lookups.employees.map((item) => (
                  <option
                    key={String(item.employee_id)}
                    value={String(item.employee_id)}
                  >
                    {String(item.employee_code ?? item.employee_id)} -{" "}
                    {String(item.full_name ?? "")}
                  </option>
                ))}
              </select>
            </div>
          }
          {employeeDetail(
            "Vị trí",
            proposer?.position_name ?? values.proposer_position,
          )}
          {employeeDetail(
            "Bộ phận",
            proposer?.department_name ?? values.proposer_department,
          )}
          <div className="md:col-span-2">
            <WorkspaceInput
              field={{
                name: "description",
                label: "Diễn giải",
                type: "textarea",
              }}
              tabId="transfer-proposals"
              value={values.description ?? ""}
              onChange={(value) => set("description", value)}
            />
          </div>
        </div>
      )}
      {activeTab === "detail" && (
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">
              Mã nhân viên *
            </label>
            <select
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
              value={String(detail.employee_id ?? "")}
              required
              onChange={(event) => selectEmployee(event.target.value)}
            >
              <option value="">-- Chọn nhân viên --</option>
              {lookups.employees.map((item) => (
                <option
                  key={String(item.employee_id)}
                  value={String(item.employee_id)}
                >
                  {String(item.employee_code ?? item.employee_id)} -{" "}
                  {String(item.full_name ?? "")}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {employeeDetail(
              "Tên nhân viên",
              selectedEmployee?.full_name ?? detail.employee_name,
            )}
            {employeeDetail(
              "Vị trí hiện tại",
              currentPosition?.position_name ?? detail.current_position_name,
            )}
            {employeeDetail(
              "Bộ phận hiện tại",
              currentDepartment?.department_name ??
                detail.current_department_name,
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">
                Vị trí mới
              </label>
              <select
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                value={String(detail.target_position_id ?? "")}
                onChange={(event) =>
                  updateDetail("target_position_id", event.target.value)
                }
              >
                <option value="">-- Chọn vị trí mới --</option>
                {targetPositions.map((item) => (
                  <option
                    key={String(item.position_id)}
                    value={String(item.position_id)}
                  >
                    {String(item.position_code ?? item.position_id)} -{" "}
                    {String(item.position_name ?? "")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">
                Bộ phận mới
              </label>
              <select
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                value={String(detail.target_department_id ?? "")}
                onChange={(event) =>
                  updateDetail("target_department_id", event.target.value)
                }
              >
                <option value="">-- Chọn bộ phận mới --</option>
                {lookups.departments.map((item) => (
                  <option
                    key={String(item.department_id)}
                    value={String(item.department_id)}
                  >
                    {String(item.department_code ?? item.department_id)} -{" "}
                    {String(item.department_name ?? "")}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-xs font-bold text-slate-600">
                Ghi chú
              </label>
              <Input
                value={String(detail.note ?? "")}
                onChange={(event) => updateDetail("note", event.target.value)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TransferDecisionForm({
  values,
  setValues,
  lookups,
  session,
}: {
  values: Record<string, string>;
  setValues: (
    updater: (current: Record<string, string>) => Record<string, string>,
  ) => void;
  lookups: TransferDecisionLookups;
  session: Session | null;
}) {
  const [activeTab, setActiveTab] = useState<"general" | "detail">("general");
  const details = parseDetailList(values.detail_items);
  const detail = details[0] ?? {};
  const employee = lookups.employees.find(
    (item) =>
      String(item.employee_id ?? "") ===
      String(values.employee_id ?? detail.employee_id ?? ""),
  );
  const creator = lookups.employees.find(
    (item) =>
      String(item.employee_id ?? "") === String(values.creator_id ?? ""),
  );
  const currentDepartment = lookups.departments.find(
    (item) =>
      String(item.department_id ?? "") ===
      String(detail.current_department_id ?? employee?.department_id ?? ""),
  );
  const currentPosition = lookups.positions.find(
    (item) =>
      String(item.position_id ?? "") ===
      String(detail.current_position_id ?? employee?.position_id ?? ""),
  );
  const targetPositions = lookups.positions.filter(
    (item) =>
      !values.target_department_id ||
      String(item.department_id ?? "") === String(values.target_department_id),
  );
  const managers = lookups.employees.filter(
    (item) =>
      String(item.employee_id ?? "") !== String(employee?.employee_id ?? "") &&
      (!values.target_department_id ||
        String(item.department_id ?? "") ===
          String(values.target_department_id)),
  );
  const set = (name: string, value: string) =>
    setValues((current) => ({ ...current, [name]: value }));
  const syncDetail = (next: Record<string, unknown>) =>
    setValues((current) => ({
      ...current,
      detail_items: JSON.stringify([{ ...detail, ...next }]),
    }));
  const display = (label: string, value: unknown) => (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </div>
      <div className="mt-1 text-sm text-slate-700">
        {String(value ?? "-") || "-"}
      </div>
    </div>
  );
  const selectCreator = (employeeId: string) => {
    const selected = lookups.employees.find(
      (item) => String(item.employee_id ?? "") === employeeId,
    );
    setValues((current) => ({
      ...current,
      creator_id: employeeId,
      creator_name: String(selected?.full_name ?? ""),
      creator_position: String(selected?.position_name ?? ""),
      creator_department: String(selected?.department_name ?? ""),
    }));
  };
  const selectProposal = (proposalId: string) => {
    const proposal = lookups.transferProposals.find(
      (item) => String(item.proposal_id ?? "") === proposalId,
    );
    const proposalDetail = parseDetailList(proposal?.detail_items)[0] ?? {};
    setValues((current) => ({
      ...current,
      proposal_id: proposalId,
      employee_id: String(
        proposalDetail.employee_id ?? proposal?.employee_id ?? "",
      ),
      target_department_id: String(
        proposalDetail.target_department_id ??
          proposal?.target_department_id ??
          "",
      ),
      target_position_id: String(
        proposalDetail.target_position_id ?? proposal?.target_position_id ?? "",
      ),
      effective_date: formatDateValue(
        proposal?.effective_date ?? proposal?.proposed_effective_date,
      ),
      decision_type: String(
        proposal?.decision_type ?? current.decision_type ?? "Thuyên chuyển",
      ),
      detail_items: JSON.stringify([
        {
          ...proposalDetail,
          employee_id:
            proposalDetail.employee_id ?? proposal?.employee_id ?? "",
          current_department_id:
            proposalDetail.current_department_id ??
            proposal?.current_department_id ??
            "",
          current_position_id:
            proposalDetail.current_position_id ??
            proposal?.current_position_id ??
            "",
          target_department_id:
            proposalDetail.target_department_id ??
            proposal?.target_department_id ??
            "",
          target_position_id:
            proposalDetail.target_position_id ??
            proposal?.target_position_id ??
            "",
          manager_id: proposalDetail.manager_id ?? "",
          note: proposalDetail.note ?? "",
        },
      ]),
    }));
  };
  const selectEmployee = (employeeId: string) => {
    const selected = lookups.employees.find(
      (item) => String(item.employee_id ?? "") === employeeId,
    );
    setValues((current) => ({
      ...current,
      employee_id: employeeId,
      target_department_id: "",
      target_position_id: "",
      manager_id: "",
      detail_items: JSON.stringify([
        {
          ...detail,
          employee_id: employeeId,
          current_department_id: selected?.department_id ?? "",
          current_position_id: selected?.position_id ?? "",
          target_department_id: "",
          target_position_id: "",
          manager_id: "",
          note: detail.note ?? "",
        },
      ]),
    }));
  };
  const selectTargetDepartment = (departmentId: string) =>
    setValues((current) => ({
      ...current,
      target_department_id: departmentId,
      target_position_id: "",
      manager_id: "",
      detail_items: JSON.stringify([
        {
          ...detail,
          target_department_id: departmentId,
          target_position_id: "",
          manager_id: "",
        },
      ]),
    }));
  const selectTargetPosition = (positionId: string) => {
    set("target_position_id", positionId);
    syncDetail({ target_position_id: positionId });
  };
  const selectManager = (managerId: string) => {
    set("manager_id", managerId);
    syncDetail({ manager_id: managerId });
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {[
          ["general", "1. Thông tin chung"],
          ["detail", "2. Chi tiết"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key as typeof activeTab)}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-xs font-bold ${activeTab === key ? "border-teal-600 text-teal-700" : "border-transparent text-slate-400"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {activeTab === "general" && (
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">
              Đề xuất liên quan
            </label>
            <select
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
              value={values.proposal_id ?? ""}
              onChange={(event) => selectProposal(event.target.value)}
            >
              <option value="">-- Không chọn --</option>
              {lookups.transferProposals.map((item) => (
                <option
                  key={String(item.proposal_id)}
                  value={String(item.proposal_id)}
                >
                  {String(item.proposal_code ?? item.proposal_id)} -{" "}
                  {String(item.employee_name ?? "")}
                </option>
              ))}
            </select>
          </div>
          <WorkspaceInput
            field={{ name: "decision_number", label: "Số quyết định" }}
            tabId="transfer-decisions"
            value={values.decision_number ?? ""}
            onChange={(value) => set("decision_number", value)}
          />
          <WorkspaceInput
            field={{
              name: "decision_date",
              label: "Ngày",
              type: "date",
              required: true,
            }}
            tabId="transfer-decisions"
            value={values.decision_date ?? ""}
            onChange={(value) => set("decision_date", value)}
          />
          <WorkspaceInput
            field={{
              name: "effective_date",
              label: "Ngày hiệu lực",
              type: "date",
              required: true,
            }}
            tabId="transfer-decisions"
            value={values.effective_date ?? ""}
            onChange={(value) => set("effective_date", value)}
          />
          <WorkspaceInput
            field={{
              name: "decision_type",
              label: "Loại quyết định",
              type: "select",
              required: true,
              options: [
                { value: "Thuyên chuyển", label: "Thuyên chuyển" },
                { value: "Bổ nhiệm", label: "Bổ nhiệm" },
                { value: "Miễn nhiệm", label: "Miễn nhiệm" },
              ],
            }}
            tabId="transfer-decisions"
            value={values.decision_type ?? "Thuyên chuyển"}
            onChange={(value) => set("decision_type", value)}
          />
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">
              Người lập *
            </label>
            <select
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
              value={values.creator_id ?? session?.employeeId ?? ""}
              required
              onChange={(event) => selectCreator(event.target.value)}
            >
              <option value="">-- Chọn người lập --</option>
              {lookups.employees.map((item) => (
                <option
                  key={String(item.employee_id)}
                  value={String(item.employee_id)}
                >
                  {String(item.employee_code ?? item.employee_id)} -{" "}
                  {String(item.full_name ?? "")}
                </option>
              ))}
            </select>
          </div>
          {display("Vị trí", creator?.position_name ?? values.creator_position)}
          {display(
            "Bộ phận",
            creator?.department_name ?? values.creator_department,
          )}
          <div className="md:col-span-2">
            <WorkspaceInput
              field={{
                name: "description",
                label: "Diễn giải",
                type: "textarea",
              }}
              tabId="transfer-decisions"
              value={values.description ?? ""}
              onChange={(value) => set("description", value)}
            />
          </div>
        </div>
      )}
      {activeTab === "detail" && (
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">
              Mã nhân viên *
            </label>
            <select
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
              value={String(values.employee_id ?? detail.employee_id ?? "")}
              required
              onChange={(event) => selectEmployee(event.target.value)}
            >
              <option value="">-- Chọn nhân viên --</option>
              {lookups.employees.map((item) => (
                <option
                  key={String(item.employee_id)}
                  value={String(item.employee_id)}
                >
                  {String(item.employee_code ?? item.employee_id)} -{" "}
                  {String(item.full_name ?? "")}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {display(
              "Tên nhân viên",
              employee?.full_name ?? detail.employee_name,
            )}
            {display(
              "Vị trí hiện tại",
              currentPosition?.position_name ?? detail.current_position_name,
            )}
            {display(
              "Bộ phận hiện tại",
              currentDepartment?.department_name ??
                detail.current_department_name,
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">
                Vị trí mới
              </label>
              <select
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                value={
                  values.target_position_id ?? detail.target_position_id ?? ""
                }
                onChange={(event) => selectTargetPosition(event.target.value)}
              >
                <option value="">-- Chọn vị trí mới --</option>
                {targetPositions.map((item) => (
                  <option
                    key={String(item.position_id)}
                    value={String(item.position_id)}
                  >
                    {String(item.position_code ?? item.position_id)} -{" "}
                    {String(item.position_name ?? "")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">
                Bộ phận mới
              </label>
              <select
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                value={
                  values.target_department_id ??
                  detail.target_department_id ??
                  ""
                }
                onChange={(event) => selectTargetDepartment(event.target.value)}
              >
                <option value="">-- Chọn bộ phận mới --</option>
                {lookups.departments.map((item) => (
                  <option
                    key={String(item.department_id)}
                    value={String(item.department_id)}
                  >
                    {String(item.department_code ?? item.department_id)} -{" "}
                    {String(item.department_name ?? "")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">
                Quản lý trực tiếp mới
              </label>
              <select
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                value={values.manager_id ?? detail.manager_id ?? ""}
                onChange={(event) => selectManager(event.target.value)}
              >
                <option value="">-- Chọn quản lý trực tiếp mới --</option>
                {managers.map((item) => (
                  <option
                    key={String(item.employee_id)}
                    value={String(item.employee_id)}
                  >
                    {String(item.employee_code ?? item.employee_id)} -{" "}
                    {String(item.full_name ?? "")}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-xs font-bold text-slate-600">
                Ghi chú
              </label>
              <Input
                value={String(detail.note ?? values.note ?? "")}
                onChange={(event) => syncDetail({ note: event.target.value })}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EvaluationForm({
  values,
  setValues,
  lookups,
  session,
}: {
  values: Record<string, string>;
  setValues: (
    updater: (current: Record<string, string>) => Record<string, string>,
  ) => void;
  lookups: EvaluationFormLookups;
  session: Session | null;
}) {
  const [activeTab, setActiveTab] = useState<"general" | "detail">("general");
  const details = parseDetailList(values.details);
  const employee = lookups.employees.find(
    (item) => String(item.employee_id ?? "") === values.employee_id,
  );
  const evaluator = lookups.employees.find(
    (item) => String(item.employee_id ?? "") === values.evaluator_id,
  );
  const totalWeight = details.reduce(
    (sum, item) => sum + (Number(item.weight) || 0),
    0,
  );
  const totalScore = totalWeight
    ? details.reduce(
        (sum, item) =>
          sum + (Number(item.score) || 0) * (Number(item.weight) || 0),
        0,
      ) / totalWeight
    : 0;
  const set = (name: string, value: string) =>
    setValues((current) => ({ ...current, [name]: value }));
  const updateDetails = (next: Array<Record<string, unknown>>) =>
    set("details", JSON.stringify(next));
  const updateDetail = (index: number, key: string, value: unknown) => {
    const next = [...details];
    next[index] = { ...next[index], [key]: value };
    updateDetails(next);
  };
  const display = (label: string, value: unknown) => (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </div>
      <div className="mt-1 text-sm text-slate-700">
        {String(value ?? "-") || "-"}
      </div>
    </div>
  );
  const addCriterion = () =>
    updateDetails([
      ...details,
      {
        criteria_id: "",
        criteria_code: "",
        criteria_name: "",
        weight: 0,
        score: 0,
        note: "",
      },
    ]);
  const selectCriterion = (index: number, criteriaId: string) => {
    const criterion = lookups.criteria.find(
      (item) => String(item.criteria_id ?? "") === criteriaId,
    );
    const next = [...details];
    next[index] = {
      ...next[index],
      criteria_id: criteriaId,
      criteria_code: criterion?.criteria_code ?? "",
      criteria_name: criterion?.criteria_name ?? "",
      weight: criterion?.weight ?? 0,
    };
    updateDetails(next);
  };
  const selectEmployee = (employeeId: string) => {
    const selected = lookups.employees.find(
      (item) => String(item.employee_id ?? "") === employeeId,
    );
    setValues((current) => ({
      ...current,
      employee_id: employeeId,
      department_id: String(selected?.department_id ?? ""),
      position_id: String(selected?.position_id ?? ""),
    }));
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {[
          ["general", "1. Thông tin chung"],
          ["detail", "2. Chi tiết"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key as typeof activeTab)}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-xs font-bold ${activeTab === key ? "border-teal-600 text-teal-700" : "border-transparent text-slate-400"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {activeTab === "general" && (
        <div className="grid gap-4 md:grid-cols-2">
          <WorkspaceInput
            field={{
              name: "evaluation_date",
              label: "Ngày đánh giá",
              type: "date",
              required: true,
            }}
            tabId="evaluations"
            value={values.evaluation_date ?? ""}
            onChange={(value) => set("evaluation_date", value)}
          />
          <WorkspaceInput
            field={{
              name: "evaluation_quarter",
              label: "Kỳ đánh giá",
              type: "select",
              required: true,
              options: [
                { value: "1", label: "Quý I" },
                { value: "2", label: "Quý II" },
                { value: "3", label: "Quý III" },
                { value: "4", label: "Quý IV" },
              ],
            }}
            tabId="evaluations"
            value={values.evaluation_quarter ?? "1"}
            onChange={(value) => set("evaluation_quarter", value)}
          />
          <WorkspaceInput
            field={{
              name: "year",
              label: "Năm đánh giá",
              type: "number",
              required: true,
            }}
            tabId="evaluations"
            value={values.year ?? ""}
            onChange={(value) => set("year", value)}
          />
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">
              Người đánh giá *
            </label>
            <select
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
              value={values.evaluator_id ?? session?.employeeId ?? ""}
              required
              onChange={(event) => set("evaluator_id", event.target.value)}
            >
              <option value="">-- Chọn người đánh giá --</option>
              {lookups.employees.map((item) => (
                <option
                  key={String(item.employee_id)}
                  value={String(item.employee_id)}
                >
                  {String(item.employee_code ?? item.employee_id)} -{" "}
                  {String(item.full_name ?? "")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">
              Nhân viên được đánh giá *
            </label>
            <select
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
              value={values.employee_id ?? ""}
              required
              onChange={(event) => selectEmployee(event.target.value)}
            >
              <option value="">-- Chọn nhân viên --</option>
              {lookups.employees.map((item) => (
                <option
                  key={String(item.employee_id)}
                  value={String(item.employee_id)}
                >
                  {String(item.employee_code ?? item.employee_id)} -{" "}
                  {String(item.full_name ?? "")}
                </option>
              ))}
            </select>
          </div>
          {display("Vị trí", employee?.position_name ?? values.position_id)}
          {display(
            "Bộ phận",
            employee?.department_name ?? values.department_id,
          )}
          <div className="md:col-span-2">
            <WorkspaceInput
              field={{
                name: "description",
                label: "Diễn giải",
                type: "textarea",
              }}
              tabId="evaluations"
              value={values.description ?? ""}
              onChange={(value) => set("description", value)}
            />
          </div>
        </div>
      )}
      {activeTab === "detail" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-sm font-bold text-slate-900">
                Chi tiết tiêu chí đánh giá
              </h3>
             
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addCriterion}
            >
              <Plus size={14} /> Thêm tiêu chí
            </Button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full min-w-[1050px] text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-3 py-3">Mã tiêu chí</th>
                  <th className="px-3 py-3">Tên TC</th>
                  <th className="px-3 py-3">Quản lý đánh giá</th>
                  <th className="px-3 py-3">Trọng số (%)</th>
                  <th className="px-3 py-3">Ý kiến, đề xuất</th>
                  <th className="px-3 py-3">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {details.map((item, index) => (
                  <tr key={index}>
                    <td className="px-3 py-2">
                      <select
                        className="h-9 min-w-36 rounded-lg border border-slate-200 px-2"
                        value={String(item.criteria_id ?? "")}
                        required
                        onChange={(event) =>
                          selectCriterion(index, event.target.value)
                        }
                      >
                        <option value="">-- Chọn --</option>
                        {lookups.criteria.map((criterion) => (
                          <option
                            key={String(criterion.criteria_id)}
                            value={String(criterion.criteria_id)}
                          >
                            {String(
                              criterion.criteria_code ?? criterion.criteria_id,
                            )}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        value={String(item.criteria_name ?? "")}
                        disabled
                        className="h-9 min-w-52 bg-slate-50"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min={0}
                        max={10}
                        step="0.01"
                        value={String(item.score ?? "")}
                        required
                        onChange={(event) =>
                          updateDetail(index, "score", event.target.value)
                        }
                        className="h-9 w-28"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min={0.01}
                        value={String(item.weight ?? "")}
                        required
                        onChange={(event) =>
                          updateDetail(index, "weight", event.target.value)
                        }
                        className="h-9 w-28"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        value={String(item.note ?? "")}
                        onChange={(event) =>
                          updateDetail(index, "note", event.target.value)
                        }
                        className="h-9 min-w-64"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        className="rounded-lg p-2 text-rose-500 hover:bg-rose-50"
                        onClick={() =>
                          updateDetails(
                            details.filter(
                              (_, detailIndex) => detailIndex !== index,
                            ),
                          )
                        }
                        aria-label="Xóa tiêu chí"
                      >
                        <X size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {details.length === 0 && (
              <p className="p-6 text-center text-xs text-slate-400">
                Chưa có tiêu chí. Nhấn “Thêm tiêu chí” để bắt đầu.
              </p>
            )}
          </div>
          <div className="flex items-center justify-end rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-bold text-teal-800">
            Tổng điểm: {totalScore.toFixed(2)}
          </div>
        </div>
      )}
    </div>
  );
}

function RewardProposalForm({
  values,
  setValues,
  lookups,
  session,
}: {
  values: Record<string, string>;
  setValues: (
    updater: (current: Record<string, string>) => Record<string, string>,
  ) => void;
  lookups: RequestLookups;
  session: Session | null;
}) {
  const employee = lookups.employees.find(
    (item) => String(item.employee_id ?? "") === values.employee_id,
  );
  const set = (name: string, value: string) =>
    setValues((current) => ({ ...current, [name]: value }));
  const selectType = (value: string) =>
    setValues((current) => ({
      ...current,
      record_type: value,
      payment_method:
        value === "KY_LUAT"
          ? "NOT_APPLICABLE"
          : current.payment_method === "NOT_APPLICABLE"
            ? "CASH"
            : current.payment_method,
    }));
  const selectEmployee = (employeeId: string) =>
    setValues((current) => ({ ...current, employee_id: employeeId }));
  const selectProposer = (employeeId: string) => {
    const proposer = lookups.employees.find(
      (item) => String(item.employee_id ?? "") === employeeId,
    );
    setValues((current) => ({
      ...current,
      proposed_by_employee_id: employeeId,
      proposed_by: String(
        proposer?.full_name ?? current.proposed_by ?? session?.name ?? "",
      ),
    }));
  };
  const employeeOptions = lookups.employees.map((item) => (
    <option key={String(item.employee_id)} value={String(item.employee_id)}>
      {String(item.employee_code ?? item.employee_id)} -{" "}
      {String(item.full_name ?? "")}
    </option>
  ));
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-600">
            Loại đề xuất *
          </label>
          <select
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
            value={values.record_type ?? "KHEN_THUONG"}
            required
             onChange={(event) => selectType(event.target.value)}
          >
            <option value="KHEN_THUONG">Khen thưởng</option>
            <option value="KY_LUAT">Kỷ luật</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-600">
            Nhân viên *
          </label>
          <select
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
            value={values.employee_id ?? ""}
            required
            onChange={(event) => selectEmployee(event.target.value)}
          >
            <option value="">-- Chọn nhân viên --</option>
            {employeeOptions}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-600">
            Người đề xuất *
          </label>
          <select
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
            value={values.proposed_by_employee_id ?? ""}
            required
            onChange={(event) => selectProposer(event.target.value)}
          >
            <option value="">-- Chọn người đề xuất --</option>
            {employeeOptions}
          </select>
        </div>
        <WorkspaceInput
          field={{
            name: "proposal_date",
            label: "Ngày đề xuất",
            type: "date",
            required: true,
          }}
          tabId="proposals"
          value={values.proposal_date ?? ""}
          onChange={(value) => set("proposal_date", value)}
        />
        <WorkspaceInput
          field={{
            name: "proposed_amount",
            label: "Số tiền đề xuất",
            type: "number",
          }}
          tabId="proposals"
          value={values.proposed_amount ?? "0"}
          onChange={(value) => set("proposed_amount", value)}
        />
        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-600">
            Hình thức{values.record_type === "KHEN_THUONG" ? " *" : ""}
          </label>
          <select
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
            value={values.payment_method ?? ""}
            required={values.record_type === "KHEN_THUONG"}
            onChange={(event) => set("payment_method", event.target.value)}
          >
            <option value="">-- Chọn hình thức --</option>
            <option value="CASH">Tiền mặt</option>
            <option value="BANK_TRANSFER">Chuyển khoản</option>
            <option value="NOT_APPLICABLE">Không áp dụng</option>
          </select>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Thông tin nhân viên
          </div>
          <div className="mt-1 text-sm text-slate-700">
            {employee
              ? `${String(employee.department_name ?? "-")} - ${String(employee.position_name ?? "-")}`
              : "Chọn nhân viên để xem thông tin"}
          </div>
        </div>
        <div className="md:col-span-2">
          <WorkspaceInput
            field={{
              name: "reason",
              label: "Lý do",
              type: "textarea",
              required: true,
            }}
            tabId="proposals"
            value={values.reason ?? ""}
            onChange={(value) => set("reason", value)}
          />
        </div>
        <div className="md:col-span-2">
          <WorkspaceInput
            field={{
              name: "content",
              label: "Nội dung đề xuất",
              type: "textarea",
            }}
            tabId="proposals"
            value={values.content ?? ""}
            onChange={(value) => set("content", value)}
          />
        </div>
      </div>
    </div>
  );
}

function RewardDecisionForm({
  values,
  setValues,
  lookups,
  session,
}: {
  values: Record<string, string>;
  setValues: (
    updater: (current: Record<string, string>) => Record<string, string>,
  ) => void;
  lookups: RewardDecisionLookups;
  session: Session | null;
}) {
  const approvedProposals = lookups.rewardProposals.filter(
    (item) => String(item.status ?? "").toUpperCase() === "APPROVED",
  );
  const proposal = lookups.rewardProposals.find(
    (item) => String(item.proposal_id ?? "") === values.proposal_id,
  );
  const employee = lookups.employees.find(
    (item) =>
      String(item.employee_id ?? "") ===
      String(values.employee_id ?? proposal?.employee_id ?? ""),
  );
  const set = (name: string, value: string) =>
    setValues((current) => ({ ...current, [name]: value }));
  const selectProposal = (proposalId: string) => {
    const selected = lookups.rewardProposals.find(
      (item) => String(item.proposal_id ?? "") === proposalId,
    );
    setValues((current) => ({
      ...current,
      proposal_id: proposalId,
      employee_id: String(selected?.employee_id ?? ""),
      decision_type: String(
        selected?.record_type ?? current.decision_type ?? "KHEN_THUONG",
      ),
      amount: String(selected?.proposed_amount ?? current.amount ?? "0"),
      reason: String(selected?.reason ?? current.reason ?? ""),
    }));
  };
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-4 text-xs text-amber-800">
        Chỉ đề xuất đã được duyệt mới xuất hiện trong danh sách và được phép lập
        quyết định.
      </div>
      {approvedProposals.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-xs text-slate-500">
          Chưa có đề xuất đã duyệt. Hãy duyệt đề xuất trước khi ban hành quyết
          định.
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-1.5 block text-xs font-bold text-slate-600">
            Đề xuất đã duyệt *
          </label>
          <select
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
            value={values.proposal_id ?? ""}
            required
            onChange={(event) => selectProposal(event.target.value)}
          >
            <option value="">-- Chọn đề xuất đã duyệt --</option>
            {approvedProposals.map((item) => (
              <option
                key={String(item.proposal_id)}
                value={String(item.proposal_id)}
              >
                {String(item.proposal_code ?? item.proposal_id)} -{" "}
                {String(item.employee_name ?? "")}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-600">
            Loại quyết định *
          </label>
          <select
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
            value={values.decision_type ?? "KHEN_THUONG"}
            required
            onChange={(event) => set("decision_type", event.target.value)}
          >
            <option value="KHEN_THUONG">Khen thưởng</option>
            <option value="KY_LUAT">Kỷ luật</option>
          </select>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Nhân viên
          </div>
          <div className="mt-1 text-sm text-slate-700">
            {employee
              ? `${String(employee.employee_code ?? "")} - ${String(employee.full_name ?? "")}`
              : "Tự động theo đề xuất"}
          </div>
        </div>
        <WorkspaceInput
          field={{
            name: "decision_date",
            label: "Ngày ban hành",
            type: "date",
            required: true,
          }}
          tabId="decisions"
          value={values.decision_date ?? ""}
          onChange={(value) => set("decision_date", value)}
        />
        <WorkspaceInput
          field={{
            name: "effective_date",
            label: "Ngày hiệu lực",
            type: "date",
          }}
          tabId="decisions"
          value={values.effective_date ?? ""}
          onChange={(value) => set("effective_date", value)}
        />
        <WorkspaceInput
          field={{ name: "amount", label: "Số tiền", type: "number" }}
          tabId="decisions"
          value={values.amount ?? "0"}
          onChange={(value) => set("amount", value)}
        />
        <WorkspaceInput
          field={{
            name: "decision_by",
            label: "Người ký",
            placeholder: session?.name,
          }}
          tabId="decisions"
          value={values.decision_by ?? ""}
          onChange={(value) => set("decision_by", value)}
        />
        <div className="md:col-span-2">
          <WorkspaceInput
            field={{
              name: "reason",
              label: "Lý do",
              type: "textarea",
              required: true,
            }}
            tabId="decisions"
            value={values.reason ?? ""}
            onChange={(value) => set("reason", value)}
          />
        </div>
        <div className="md:col-span-2">
          <WorkspaceInput
            field={{
              name: "content",
              label: "Nội dung quyết định",
              type: "textarea",
            }}
            tabId="decisions"
            value={values.content ?? ""}
            onChange={(value) => set("content", value)}
          />
        </div>
        <WorkspaceInput
          field={{ name: "attachment_url", label: "Tệp đính kèm" }}
          tabId="decisions"
          value={values.attachment_url ?? ""}
          onChange={(value) => set("attachment_url", value)}
        />
      </div>
    </div>
  );
}

function LeaveForm({
  values,
  setValues,
  lookups,
  session,
}: {
  values: Record<string, string>;
  setValues: (
    updater: (current: Record<string, string>) => Record<string, string>,
  ) => void;
  lookups: RequestLookups;
  session: Session | null;
}) {
  const details = parseDetailList(values.details_json);
  const employeeOptions = lookups.employees.map((item) => ({
    value: String(item.employee_id ?? ""),
    label: `${String(item.employee_code ?? item.employee_id ?? "")} - ${String(item.full_name ?? "")}`,
  }));
  const totalDays = details.reduce((sum, item) => sum + (Number(item.days) || 0), 0);
  const set = (name: string, value: string) =>
    setValues((current) => ({ ...current, [name]: value }));
  const updateDetails = (next: Array<Record<string, unknown>>) =>
    setValues((current) => ({
      ...current,
      details_json: JSON.stringify(next),
      total_days: String(
        next.reduce((sum, item) => sum + (Number(item.days) || 0), 0),
      ),
    }));
  const updateDetail = (index: number, key: string, value: unknown) => {
    const next = [...details];
    next[index] = { ...next[index], [key]: value };
    updateDetails(next);
  };
  const addDetail = () =>
    updateDetails([
      ...details,
      { date: "", time_option: "Cả ngày", days: 1, note: "" },
    ]);
  const removeDetail = (index: number) =>
    updateDetails(details.filter((_, detailIndex) => detailIndex !== index));
  const input = (
    name: string,
    label: string,
    type: WorkspaceField["type"] = "text",
    required = false,
    disabled = false,
    options?: Array<{ value: string; label: string }>,
  ) => (
    <WorkspaceInput
      field={{ name, label, type, required, disabled, options }}
      tabId="leave"
      value={values[name] ?? ""}
      onChange={(value) => set(name, value)}
    />
  );

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        {input(
          "employee_id",
          "Nhân viên *",
          "select",
          true,
          session?.role === "Nhân viên",
          [{ value: "", label: "-- Chọn nhân viên --" }, ...employeeOptions],
        )}
        {input("start_date", "Ngày bắt đầu", "date", true)}
        {input("end_date", "Ngày kết thúc", "date", true)}
        {input("total_days", "Tổng số ngày", "number", true, true)}
        {input(
          "leave_type",
          "Loại nghỉ phép",
          "select",
          true,
          false,
          [
            { value: "ANNUAL", label: "Nghỉ phép năm" },
            { value: "SICK", label: "Nghỉ ốm" },
            { value: "MATERNITY", label: "Nghỉ thai sản" },
            { value: "UNPAID", label: "Nghỉ không lương" },
          ],
        )}
        {input(
          "approver_id",
          "Người duyệt",
          "select",
          false,
          false,
          [{ value: "", label: "-- Chọn người duyệt --" }, ...employeeOptions],
        )}
        {input(
          "related_person_id",
          "Người liên quan",
          "select",
          false,
          false,
          [{ value: "", label: "-- Không chọn --" }, ...employeeOptions],
        )}
        <div className="md:col-span-2">
          <WorkspaceInput
            field={{ name: "reason", label: "Lý do", type: "textarea", span: 2 }}
            tabId="leave"
            value={values.reason ?? ""}
            onChange={(value) => set("reason", value)}
          />
        </div>
      </div>
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-sm font-bold text-slate-900">
              Chi tiết ngày nghỉ
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Tổng số ngày: {totalDays.toLocaleString("vi-VN")}
            </p>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={addDetail}>
            <Plus size={14} /> Thêm ngày nghỉ
          </Button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-3 py-3">Ngày nghỉ</th>
                <th className="px-3 py-3">Thời gian</th>
                <th className="px-3 py-3">Số ngày</th>
                <th className="px-3 py-3">Ghi chú</th>
                <th className="px-3 py-3">Xóa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {details.length ? details.map((item, index) => (
                <tr key={index}>
                  <td className="px-3 py-2">
                    <Input
                      type="date"
                      required
                      value={formatDateValue(item.date)}
                      onChange={(event) => updateDetail(index, "date", event.target.value)}
                      className="h-9 w-40"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      required
                      value={String(item.time_option ?? "Cả ngày")}
                      onChange={(event) => updateDetail(index, "time_option", event.target.value)}
                      className="h-9 rounded-lg border border-slate-200 bg-white px-2"
                    >
                      <option value="Cả ngày">Cả ngày</option>
                      <option value="Buổi sáng">Buổi sáng</option>
                      <option value="Buổi chiều">Buổi chiều</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      min={0.5}
                      step={0.5}
                      required
                      value={String(item.days ?? "")}
                      onChange={(event) => updateDetail(index, "days", event.target.value)}
                      className="h-9 w-24"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      value={String(item.note ?? "")}
                      onChange={(event) => updateDetail(index, "note", event.target.value)}
                      className="h-9 min-w-56"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label="Xóa ngày nghỉ"
                      onClick={() => removeDetail(index)}
                    >
                      <Trash2 size={15} />
                    </Button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-slate-400">
                    Chưa có ngày nghỉ. Nhấn “Thêm ngày nghỉ” để bổ sung.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function EmployeeForm({
  values,
  setValues,
  lookups,
  avatarUrl,
  avatarFile,
  onAvatarChange,
  candidateLocked = false,
}: {
  values: Record<string, string>;
  setValues: (
    updater: (current: Record<string, string>) => Record<string, string>,
  ) => void;
  lookups: EmployeeLookups;
  avatarUrl?: string;
  avatarFile: File | null;
  onAvatarChange: (file: File | null) => void;
  candidateLocked?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<
    "general" | "contact" | "onboarding" | "additional"
  >("general");
  const set = (name: string, value: string) =>
    setValues((current) => ({ ...current, [name]: value }));
  const department = lookups.departments.find(
    (item) => String(item.department_id ?? "") === values.department_id,
  );
  const positions = lookups.positions.filter(
    (item) =>
      !values.department_id ||
      String(item.department_id ?? "") === values.department_id,
  );
  const managers = lookups.employees.filter(
    (item) =>
      String(item.department_id ?? "") === values.department_id &&
      String(item.employee_id ?? "") !== String(values.employee_id ?? ""),
  );
  const candidate = lookups.candidates.find(
    (item) => String(item.candidate_id ?? "") === values.candidate_id,
  );
  const selectCandidate = (candidateId: string) => {
    const selected = lookups.candidates.find(
      (item) => String(item.candidate_id ?? "") === candidateId,
    );
    setValues((current) => ({
      ...current,
      candidate_id: candidateId,
      full_name: String(selected?.full_name ?? current.full_name ?? ""),
      gender: String(selected?.gender ?? current.gender ?? "Nam"),
      date_of_birth: formatDateValue(
        selected?.date_of_birth ?? current.date_of_birth,
      ),
      phone: String(selected?.phone ?? current.phone ?? ""),
      personal_email: String(selected?.email ?? current.personal_email ?? ""),
      department_id: String(
        selected?.department_id ?? current.department_id ?? "",
      ),
      position_id: String(selected?.position_id ?? current.position_id ?? ""),
    }));
  };
  const input = (
    name: string,
    label: string,
    type: WorkspaceField["type"] = "text",
    required = false,
    disabled = false,
  ) => (
    <WorkspaceInput
      field={{
        name,
        label,
        type,
        required,
        disabled,
        options:
          name === "gender"
            ? [
                { value: "Nam", label: "Nam" },
                { value: "Nữ", label: "Nữ" },
              ]
            : undefined,
      }}
      tabId="employees"
      value={values[name] ?? ""}
      onChange={(value) => set(name, value)}
    />
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
        <EmployeeAvatar
          name={values.full_name || "Nhân viên"}
          avatarUrl={avatarUrl}
          className="size-16 text-base"
        />
        <div className="flex-1">
          <div className="text-xs font-bold text-slate-700">Ảnh hồ sơ</div>
          <div className="mt-1 text-[11px] text-slate-400">
            JPG, PNG hoặc WEBP. Ảnh sẽ được tải lên sau khi lưu hồ sơ.
          </div>
          <Input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="mt-2 h-9 max-w-sm py-1.5 text-xs"
            onChange={(event) =>
              onAvatarChange(event.target.files?.[0] ?? null)
            }
          />
          {avatarFile && (
            <div className="mt-1 text-[11px] text-teal-700">
              Đã chọn: {avatarFile.name}
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {[
          ["general", "1. Thông tin chung"],
          ["contact", "2. Thông tin liên hệ"],
          ["onboarding", "3. Thông tin tiếp nhận ban đầu"],
          ["additional", "4. Thông tin bổ sung"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key as typeof activeTab)}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-xs font-bold ${activeTab === key ? "border-teal-600 text-teal-700" : "border-transparent text-slate-400"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {activeTab === "general" && (
        <div className="grid gap-4 md:grid-cols-2">
          {input("employee_code", "Mã nhân viên")}
          {
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">
                Mã ứng viên
              </label>
              <select
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                value={values.candidate_id ?? ""}
                disabled={candidateLocked}
                onChange={(event) => selectCandidate(event.target.value)}
              >
                <option value="">-- Chọn ứng viên --</option>
                {lookups.candidates.map((item) => (
                  <option
                    key={String(item.candidate_id)}
                    value={String(item.candidate_id)}
                  >
                    {String(item.candidate_code ?? item.candidate_id)} -{" "}
                    {String(item.full_name ?? "")}
                  </option>
                ))}
              </select>
            </div>
          }
          {input("full_name", "Họ tên", "text", true)}
          {input("short_name", "Tên viết tắt")}
          {input("gender", "Giới tính", "select")}
          {input("date_of_birth", "Ngày sinh", "date")}
          {input("nationality", "Quốc tịch")}
          {input("marital_status", "Tình trạng hôn nhân")}
          {input("place_of_birth", "Nơi sinh")}
          {input("ethnicity", "Dân tộc")}
          {input("religion", "Tôn giáo")}
          {input("blood_type", "Nhóm máu")}
          {input("tax_code", "MST")}
          {input("resignation_date", "Ngày nghỉ việc", "date")}
        </div>
      )}
      {activeTab === "contact" && (
        <div className="grid gap-4 md:grid-cols-2">
          {input("phone", "SĐT")}
          {input("personal_email", "Email cá nhân")}
          {
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">
                Email cơ quan
              </label>
              <Input
                value={values.company_email ?? values.email ?? ""}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    company_email: event.target.value,
                    email: event.target.value,
                  }))
                }
              />
            </div>
          }
          {input("emergency_contact_name", "Người liên hệ khẩn cấp")}
          {input("emergency_contact_relationship", "Quan hệ thân nhân")}
          {input("emergency_contact_phone", "SĐT")}
        </div>
      )}
      {activeTab === "onboarding" && (
        <div className="grid gap-4 md:grid-cols-2">
          {input("join_date", "Ngày vào làm", "date", true)}
          {input("initial_contract_date", "Ngày ký hợp đồng", "date")}
          {
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">
                Vị trí *
              </label>
              <select
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                value={values.position_id ?? ""}
                required
                onChange={(event) => set("position_id", event.target.value)}
              >
                <option value="">-- Chọn vị trí --</option>
                {positions.map((item) => (
                  <option
                    key={String(item.position_id)}
                    value={String(item.position_id)}
                  >
                    {String(item.position_code ?? item.position_id)} -{" "}
                    {String(item.position_name ?? "")}
                  </option>
                ))}
              </select>
            </div>
          }
          {
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">
                Bộ phận *
              </label>
              <select
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                value={values.department_id ?? ""}
                required
                onChange={(event) => {
                  const selected = lookups.departments.find(
                    (item) =>
                      String(item.department_id ?? "") === event.target.value,
                  );
                  setValues((current) => ({
                    ...current,
                    department_id: event.target.value,
                    manager_id: String(selected?.manager_id ?? ""),
                    position_id: "",
                  }));
                }}
              >
                <option value="">-- Chọn bộ phận --</option>
                {lookups.departments.map((item) => (
                  <option
                    key={String(item.department_id)}
                    value={String(item.department_id)}
                  >
                    {String(item.department_code ?? item.department_id)} -{" "}
                    {String(item.department_name ?? "")}
                  </option>
                ))}
              </select>
            </div>
          }
          {
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">
                Quản lý trực tiếp
              </label>
              <select
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                value={values.manager_id ?? ""}
                onChange={(event) => set("manager_id", event.target.value)}
              >
                <option value="">-- Quản lý của bộ phận --</option>
                {managers.map((item) => (
                  <option
                    key={String(item.employee_id)}
                    value={String(item.employee_id)}
                  >
                    {String(item.employee_code ?? item.employee_id)} -{" "}
                    {String(item.full_name ?? "")}
                  </option>
                ))}
              </select>
              {department && (
                <p className="mt-1 text-[11px] text-slate-400">
                  Danh sách được lọc theo{" "}
                  {String(department.department_name ?? "bộ phận")}.
                </p>
              )}
            </div>
          }
        </div>
      )}
      {activeTab === "additional" && (
        <div className="space-y-5">
          <section>
            <h3 className="mb-3 font-display text-sm font-bold text-slate-900">
              CCCD và địa chỉ
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {input("citizen_id", "Số CCCD")}
              {input("citizen_issue_place", "Nơi cấp")}
              {input("citizen_issue_date", "Ngày cấp", "date")}
              {input("citizen_expiry_date", "Ngày hết hạn", "date")}
              {input("address", "Địa chỉ hiện tại", "textarea")}
            </div>
          </section>
          <section>
            <h3 className="mb-3 font-display text-sm font-bold text-slate-900">
              Ngân hàng
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {input("bank_account_number", "STK")}
              {input("bank_account_holder", "Chủ tài khoản")}
              {input("bank_name", "Tên ngân hàng")}
              {input("bank_branch", "Chi nhánh")}
            </div>
          </section>
          <section>
            <h3 className="mb-3 font-display text-sm font-bold text-slate-900">
              Trình độ
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {input("culture_level", "Trình độ văn hóa")}
              {input("education_level", "Trình độ đào tạo")}
              {input("education_school", "Nơi đào tạo")}
              {input("major", "Ngành đào tạo")}
              {input("gpa", "Xếp loại / GPA", "number")}
              {input("graduation_year", "Năm tốt nghiệp", "number")}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

type ConversionLookups = EmployeeLookups & ContractLookups;

function dateAfterMonths(value: string, months: number) {
  if (!value) return "";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  date.setMonth(date.getMonth() + months);
  return formatDateValue(date.getTime());
}

function EmployeeConversionForm({
  candidate,
  employeeValues,
  setEmployeeValues,
  contractValues,
  setContractValues,
  lookups,
  avatarFile,
  onAvatarChange,
  onClose,
  onSubmit,
  isPending,
}: {
  candidate: Row;
  employeeValues: Record<string, string>;
  setEmployeeValues: (
    updater: (current: Record<string, string>) => Record<string, string>,
  ) => void;
  contractValues: Record<string, string>;
  setContractValues: (
    updater: (current: Record<string, string>) => Record<string, string>,
  ) => void;
  lookups: ConversionLookups;
  avatarFile: File | null;
  onAvatarChange: (file: File | null) => void;
  onClose: () => void;
  onSubmit: () => void;
  isPending: boolean;
}) {
  const [activeSection, setActiveSection] = useState<"profile" | "contract">("profile");
  const setContract = (name: string, value: string) =>
    setContractValues((current) => ({ ...current, [name]: value }));
  const contractTypeOptions = Array.from(
    new Map(
      [
        { value: "Hợp đồng thử việc", label: "Hợp đồng thử việc" },
        ...lookups.contractTypes.map((item) => ({
          value: String(item.contract_type_code ?? item.contract_type_name ?? ""),
          label: `${String(item.contract_type_code ?? "")} - ${String(item.contract_type_name ?? "")}`,
        })),
      ].map((option) => [option.value, option]),
    ).values(),
  );
  const field = (
    name: string,
    label: string,
    type: WorkspaceField["type"] = "text",
    required = false,
    disabled = false,
  ) => (
    <WorkspaceInput
      field={{ name, label, type, required, disabled }}
      tabId="contracts"
      value={contractValues[name] ?? ""}
      onChange={(value) => setContract(name, value)}
    />
  );
  const selectedCandidateName = String(candidate.full_name ?? employeeValues.full_name ?? "Ứng viên");

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-5"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isPending) onClose();
      }}
    >
      <Card
        className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="employee-conversion-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50/80 p-5 sm:p-6">
          <div className="flex min-w-0 items-start gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-teal-100 text-teal-700">
              <UserRoundCheck size={21} />
            </div>
            <div className="min-w-0">
              <h2 id="employee-conversion-title" className="font-display text-lg font-bold text-slate-950 sm:text-xl">
                Tạo hồ sơ nhân viên và hợp đồng
              </h2>
              <p className="mt-1 truncate text-sm text-slate-500">
                Ứng viên: <b className="text-slate-700">{selectedCandidateName}</b>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
            aria-label="Đóng màn hình chuyển đổi"
          >
            <X size={19} />
          </button>
        </div>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7">
            <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200">
              <button
                type="button"
                onClick={() => setActiveSection("profile")}
                className={`rounded-t-lg border-b-2 px-4 py-3 text-sm font-bold ${activeSection === "profile" ? "border-teal-600 text-teal-700" : "border-transparent text-slate-400 hover:text-slate-700"}`}
              >
                1. Hồ sơ nhân viên
              </button>
              <button
                type="button"
                onClick={() => setActiveSection("contract")}
                className={`rounded-t-lg border-b-2 px-4 py-3 text-sm font-bold ${activeSection === "contract" ? "border-teal-600 text-teal-700" : "border-transparent text-slate-400 hover:text-slate-700"}`}
              >
                2. Hợp đồng lao động
              </button>
            </div>

            {activeSection === "profile" ? (
              <EmployeeForm
                values={employeeValues}
                setValues={setEmployeeValues}
                lookups={lookups}
                avatarFile={avatarFile}
                onAvatarChange={onAvatarChange}
                candidateLocked
              />
            ) : (
              <div className="space-y-6">
                <section>
                  <h3 className="mb-4 flex items-center gap-2 font-display text-base font-bold text-slate-900">
                    <FileText size={17} className="text-teal-700" /> Thông tin chung
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {field("contract_no", "Số hợp đồng")}
                    {field("contract_date", "Ngày hợp đồng", "date", true)}
                    {field("sign_date", "Ngày ký", "date", true)}
                    {field("employee_position", "Vị trí nhân viên", "text", false, true)}
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-600">Loại hợp đồng *</label>
                      <select
                        required
                        value={contractValues.contract_type ?? ""}
                        onChange={(event) => setContract("contract_type", event.target.value)}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                      >
                        <option value="">-- Chọn loại hợp đồng --</option>
                        {contractTypeOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    {field("start_date", "Ngày bắt đầu", "date", true)}
                    {field("end_date", "Ngày kết thúc")}
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-600">Người ký</label>
                      <select
                        value={contractValues.signer_id ?? ""}
                        onChange={(event) => {
                          const signer = lookups.employees.find((item) => String(item.employee_id ?? "") === event.target.value);
                          setContractValues((current) => ({
                            ...current,
                            signer_id: event.target.value,
                            signer_name: String(signer?.full_name ?? current.signer_name ?? ""),
                            signer_position: String(signer?.position_name ?? current.signer_position ?? ""),
                          }));
                        }}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                      >
                        <option value="">-- Chọn người ký --</option>
                        {lookups.employees.map((item) => (
                          <option key={String(item.employee_id)} value={String(item.employee_id)}>
                            {String(item.employee_code ?? item.employee_id)} - {String(item.full_name ?? "")}
                          </option>
                        ))}
                      </select>
                    </div>
                    {field("signer_name", "Tên người ký")}
                    {field("signer_position", "Chức vụ người ký")}
                  </div>
                </section>
                <section>
                  <h3 className="mb-4 font-display text-base font-bold text-slate-900">Thông tin thử việc và lương</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-600">Có thử việc</label>
                      <select
                        value={contractValues.has_probation ?? "0"}
                        onChange={(event) => setContract("has_probation", event.target.value)}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                      >
                        <option value="1">Có</option>
                        <option value="0">Không</option>
                      </select>
                    </div>
                    {field("probation_salary_rate", "Tỷ lệ lương thử việc (%)", "number", contractValues.has_probation === "1")}
                    {contractValues.has_probation === "1" && field("probation_from_date", "Thử việc từ ngày", "date", true)}
                    {contractValues.has_probation === "1" && field("probation_to_date", "Thử việc đến ngày", "date", true)}
                    {field("base_salary", "Lương thử việc", "number", true)}
                    {field("social_insurance_salary", "Lương đóng bảo hiểm", "number", true)}
                    {field("salary", "Lương chính thức", "number", true)}
                    <p className="text-xs leading-5 text-slate-400 md:col-span-2">Nhập số tiền VND, không nhập số lẻ.</p>
                  </div>
                </section>
                <section className="grid gap-4 md:grid-cols-2">
                  {field("job_description", "Mô tả công việc", "textarea")}
                  {field("note", "Ghi chú", "textarea")}
                </section>
              </div>
            )}
          </div>
          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/80 p-5 sm:flex-row sm:justify-end sm:p-6">
            <Button type="button" variant="secondary" size="lg" onClick={onClose} disabled={isPending}>Hủy</Button>
            {activeSection === "contract" && (
              <Button type="button" variant="secondary" size="lg" onClick={() => setActiveSection("profile")} disabled={isPending}>Quay lại hồ sơ</Button>
            )}
            {activeSection === "profile" ? (
              <Button type="button" size="lg" onClick={() => setActiveSection("contract")}>Tiếp tục nhập hợp đồng</Button>
            ) : (
              <Button type="submit" size="lg" disabled={isPending}>
                {isPending ? "Đang tạo..." : "Tạo hồ sơ & hợp đồng"}
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}

const interviewRatings = [
  { value: "1", label: "Rất kém" },
  { value: "2", label: "Kém" },
  { value: "3", label: "Trung bình" },
  { value: "4", label: "Khá" },
  { value: "5", label: "Tốt" },
];

function InterviewEvaluationForm({
  values,
  setValues,
  lookups,
  session,
  onViewCandidate,
}: {
  values: Record<string, string>;
  setValues: (
    updater: (current: Record<string, string>) => Record<string, string>,
  ) => void;
  lookups: EvaluationLookups;
  session: Session | null;
  onViewCandidate: (candidate: Row) => void;
}) {
  const [activeTab, setActiveTab] = useState<
    "general" | "script" | "criteria" | "offer" | "assessment"
  >("general");
  const selectedSchedule = lookups.schedules.find(
    (item) => String(item.schedule_id ?? "") === values.schedule_id,
  );
  const scheduleCandidateRows = parseDetailList(
    selectedSchedule?.candidates ?? selectedSchedule?.candidates_json,
  );
  const scheduleCandidateIds = scheduleCandidateRows
    .map((item) => String(item.candidate_id ?? item.id ?? ""))
    .filter(Boolean);
  const candidates = scheduleCandidateIds.length
    ? lookups.candidates.filter((item) =>
        scheduleCandidateIds.includes(String(item.candidate_id ?? "")),
      )
    : [];
  const candidate = lookups.candidates.find(
    (item) => String(item.candidate_id ?? "") === values.candidate_id,
  );
  const panelRows = parseDetailList(
    selectedSchedule?.council ?? selectedSchedule?.council_json,
  );
  const panelIds = panelRows
    .map((item) => String(item.employee_id ?? item.id ?? ""))
    .filter(Boolean);
  const panelEmployees = lookups.employees.filter((item) =>
    panelIds.includes(String(item.employee_id ?? "")),
  );
  const decisionMakerIds = panelRows
    .filter(
      (item) =>
        Number(item.is_decision_maker) === 1 || item.is_decision_maker === true,
    )
    .map((item) => String(item.employee_id ?? item.id ?? ""));
  const evaluatorOptions = panelEmployees;
  const existingOffer = lookups.offers.find(
    (item) => String(item.candidate_id ?? "") === values.candidate_id,
  );
  const offerValues = (() => {
    try {
      const parsed = JSON.parse(values.offer || "{}");
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Row)
        : (existingOffer ?? {});
    } catch {
      return existingOffer ?? {};
    }
  })();
  const scripts = parseDetailList(values.script);
  const criteria = parseDetailList(values.criteria);
  const set = (name: string, value: string) =>
    setValues((current) => ({ ...current, [name]: value }));
  const updateList = (name: string, next: Array<Record<string, unknown>>) =>
    set(name, JSON.stringify(next));
  const updateRow = (
    name: string,
    rows: Array<Record<string, unknown>>,
    index: number,
    key: string,
    value: unknown,
  ) => {
    const next = [...rows];
    next[index] = { ...next[index], [key]: value };
    updateList(name, next);
  };
  const setOffer = (key: string, value: string) =>
    setValues((current) => {
      let base: Row = existingOffer ?? {};
      try {
        const parsed = JSON.parse(current.offer || "{}");
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
          base = parsed as Row;
      } catch {
        /* use the existing offer as the edit base */
      }
      return { ...current, offer: JSON.stringify({ ...base, [key]: value }) };
    });
  const selectSchedule = (scheduleId: string) => {
    const schedule = lookups.schedules.find(
      (item) => String(item.schedule_id ?? "") === scheduleId,
    );
    const panel = parseDetailList(schedule?.council ?? schedule?.council_json);
    const decisionMaker = panel.find(
      (item) =>
        Number(item.is_decision_maker) === 1 || item.is_decision_maker === true,
    );
    setValues((current) => ({
      ...current,
      schedule_id: scheduleId,
      candidate_id: "",
      evaluator_id: String(
        decisionMaker?.employee_id ?? session?.employeeId ?? "",
      ),
    }));
  };
  const addScript = () =>
    updateList("script", [
      ...scripts,
      { question: "", expectation: "", answer: "" },
    ]);
  const addCriterion = () =>
    updateList("criteria", [
      ...criteria,
      {
        criteria_type: "Năng lực chuyên môn",
        required_from: "",
        candidate_value: "",
        candidate_description: "",
        is_passed: true,
        note: "",
      },
    ]);

  return (
    <div className="space-y-5">
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {[
          ["general", "1. Thông tin chung"],
          ["script", "2. Câu hỏi phỏng vấn"],
          ["criteria", "3. Chi tiết đánh giá"],
          ["offer", "4. Thông tin offer"],
          ["assessment", "5. Đánh giá chung"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key as typeof activeTab)}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-xs font-bold ${activeTab === key ? "border-teal-600 text-teal-700" : "border-transparent text-slate-400"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "general" && (
        <div className="grid gap-4 md:grid-cols-2">
          <WorkspaceInput
            field={{
              name: "evaluation_date",
              label: "Ngày đánh giá",
              type: "date",
              required: true,
            }}
            tabId="interview-evaluations"
            value={values.evaluation_date ?? ""}
            onChange={(value) => set("evaluation_date", value)}
          />
          <WorkspaceInput
            field={{ name: "eval_code", label: "Số phiếu", disabled: true }}
            tabId="interview-evaluations"
            value={values.eval_code ?? ""}
            onChange={() => undefined}
          />
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">
              Số lịch *
            </label>
            <select
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
              value={values.schedule_id ?? ""}
              required
              onChange={(event) => selectSchedule(event.target.value)}
            >
              <option value="">-- Chọn lịch phỏng vấn --</option>
              {lookups.schedules.map((item) => (
                <option
                  key={String(item.schedule_id)}
                  value={String(item.schedule_id)}
                >
                  {String(item.schedule_code ?? item.schedule_id)} -{" "}
                  {String(item.round_type ?? "")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">
              Người đánh giá *
            </label>
            <select
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
              value={values.evaluator_id ?? ""}
              required
              onChange={(event) => set("evaluator_id", event.target.value)}
            >
              <option value="">-- Chọn người đánh giá --</option>
              {evaluatorOptions.map((item) => (
                <option
                  key={String(item.employee_id)}
                  value={String(item.employee_id)}
                >
                  {String(item.employee_code ?? item.employee_id)} -{" "}
                  {String(item.full_name ?? "")}
                  {decisionMakerIds.includes(String(item.employee_id))
                    ? " (Người quyết định)"
                    : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">
              Ứng viên theo lịch *
            </label>
            <select
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
              value={values.candidate_id ?? ""}
              required
              onChange={(event) => set("candidate_id", event.target.value)}
            >
              <option value="">-- Chọn ứng viên --</option>
              {candidates.map((item) => (
                <option
                  key={String(item.candidate_id)}
                  value={String(item.candidate_id)}
                >
                  {String(item.candidate_code ?? item.candidate_id)} -{" "}
                  {String(item.full_name ?? "")}
                </option>
              ))}
            </select>
            {selectedSchedule && !candidates.length && (
              <p className="mt-1 text-[11px] text-amber-600">
                Lịch này chưa có ứng viên được khai báo.
              </p>
            )}
          </div>
          <WorkspaceInput
            field={{
              name: "duration_minutes",
              label: "Thời lượng (phút)",
              type: "number",
            }}
            tabId="interview-evaluations"
            value={values.duration_minutes ?? ""}
            onChange={(value) => set("duration_minutes", value)}
          />
          {candidate && (
            <div className="rounded-xl border border-teal-100 bg-teal-50/60 p-4 md:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-teal-600">
                    Hồ sơ ứng viên
                  </div>
                  <div className="mt-1 font-display text-sm font-bold text-slate-900">
                    {String(candidate.full_name ?? "")}{" "}
                    <span className="font-normal text-slate-500">
                      ({String(candidate.candidate_code ?? "")})
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    {String(candidate.phone ?? "-")} ·{" "}
                    {String(candidate.email ?? "-")} ·{" "}
                    {String(candidate.apply_position_name ?? "-")}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => onViewCandidate(candidate)}
                >
                  <Eye size={14} /> Xem thông tin ứng viên
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "script" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-sm font-bold text-slate-900">
                Câu hỏi phỏng vấn
               </h3>

            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addScript}
            >
              <Plus size={14} /> Thêm câu hỏi
            </Button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full min-w-[850px] text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-3 py-3">Câu hỏi</th>
                  <th className="px-3 py-3">Kết quả kỳ vọng</th>
                  <th className="px-3 py-3">Câu trả lời / Đánh giá</th>
                  <th className="px-3 py-3">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scripts.map((item, index) => (
                  <tr key={index}>
                    <td className="px-3 py-2">
                      <Input
                        value={String(item.question ?? "")}
                        onChange={(event) =>
                          updateRow(
                            "script",
                            scripts,
                            index,
                            "question",
                            event.target.value,
                          )
                        }
                        className="h-9"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        value={String(item.expectation ?? "")}
                        onChange={(event) =>
                          updateRow(
                            "script",
                            scripts,
                            index,
                            "expectation",
                            event.target.value,
                          )
                        }
                        className="h-9"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        value={String(item.answer ?? "")}
                        onChange={(event) =>
                          updateRow(
                            "script",
                            scripts,
                            index,
                            "answer",
                            event.target.value,
                          )
                        }
                        className="h-9"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          updateList(
                            "script",
                            scripts.filter(
                              (_, itemIndex) => itemIndex !== index,
                            ),
                          )
                        }
                      >
                        <Trash2 size={15} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!scripts.length && (
            <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
              Chưa có câu hỏi.
            </p>
          )}
        </div>
      )}

      {activeTab === "criteria" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-sm font-bold text-slate-900">
                Chi tiết đánh giá
              </h3>

            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addCriterion}
            >
              <Plus size={14} /> Thêm điều kiện
            </Button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full min-w-[980px] text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-3 py-3">Điều kiện</th>
                  <th className="px-3 py-3">Điều kiện đạt</th>
                  <th className="px-3 py-3">Đánh giá ứng viên / Điểm</th>
                  <th className="px-3 py-3">Đạt</th>
                  <th className="px-3 py-3">Ghi chú</th>
                  <th className="px-3 py-3">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {criteria.map((item, index) => (
                  <tr key={index}>
                    <td className="px-3 py-2">
                      <Input
                        value={String(item.criteria_type ?? "")}
                        onChange={(event) =>
                          updateRow(
                            "criteria",
                            criteria,
                            index,
                            "criteria_type",
                            event.target.value,
                          )
                        }
                        className="h-9"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        value={String(
                          item.required_from ?? item.required_description ?? "",
                        )}
                        onChange={(event) =>
                          updateRow(
                            "criteria",
                            criteria,
                            index,
                            "required_from",
                            event.target.value,
                          )
                        }
                        className="h-9"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        value={String(
                          item.candidate_description ??
                            item.candidate_value ??
                            "",
                        )}
                        onChange={(event) => {
                          const next = [...criteria];
                          next[index] = {
                            ...next[index],
                            candidate_description: event.target.value,
                            candidate_value: event.target.value,
                          };
                          updateList("criteria", next);
                        }}
                        className="h-9"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={Boolean(item.is_passed)}
                        onChange={(event) =>
                          updateRow(
                            "criteria",
                            criteria,
                            index,
                            "is_passed",
                            event.target.checked,
                          )
                        }
                        className="size-4 accent-teal-600"
                        aria-label={`Điều kiện ${index + 1} đạt`}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        value={String(item.note ?? "")}
                        onChange={(event) =>
                          updateRow(
                            "criteria",
                            criteria,
                            index,
                            "note",
                            event.target.value,
                          )
                        }
                        className="h-9"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          updateList(
                            "criteria",
                            criteria.filter(
                              (_, itemIndex) => itemIndex !== index,
                            ),
                          )
                        }
                      >
                        <Trash2 size={15} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!criteria.length && (
            <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
              Chưa có điều kiện đánh giá.
            </p>
          )}
        </div>
      )}

      {activeTab === "offer" && (
        <div className="grid gap-4 md:grid-cols-2">

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">
              Ngày bắt đầu đi làm
            </label>
            <Input
              type="date"
              value={formatDateValue(offerValues.expected_start_date)}
              onChange={(event) =>
                setOffer("expected_start_date", event.target.value)
              }
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">
              Mức lương chính thức
            </label>
            <Input
              type="number"
              value={String(
                offerValues.official_salary ?? offerValues.salary_offer ?? "",
              )}
              onChange={(event) =>
                setOffer("official_salary", event.target.value)
              }
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">
              Lương thử việc
            </label>
            <Input
              type="number"
              value={String(offerValues.probation_salary ?? "")}
              onChange={(event) =>
                setOffer("probation_salary", event.target.value)
              }
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-xs font-bold text-slate-600">
              Ghi chú offer
            </label>
            <Input
              value={String(offerValues.note ?? "")}
              onChange={(event) => setOffer("note", event.target.value)}
            />
          </div>
        </div>
      )}

      {activeTab === "assessment" && (
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">
              Mức độ *
            </label>
            <select
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
              value={normalizeInterviewScore(values.level_score)}
              required
              onChange={(event) => set("level_score", event.target.value)}
            >
              {interviewRatings.map((rating) => (
                <option key={rating.value} value={rating.value}>
                  {rating.label}
                </option>
              ))}
            </select>
          </div>
          <WorkspaceInput
            field={{
              name: "overall_result",
              label: "Đánh giá chung",
              type: "select",
              options: [
                { value: "", label: "-- Chọn kết quả --" },
                { value: "ĐẠT", label: "Đạt" },
                { value: "KHÔNG ĐẠT", label: "Không đạt" },
              ],
            }}
            tabId="interview-evaluations"
            value={values.overall_result ?? "ĐẠT"}
            onChange={(value) => set("overall_result", value)}
          />
          <div className="md:col-span-2">
            <WorkspaceInput
              field={{
                name: "overall_comment",
                label: "Nhận xét chung",
                type: "textarea",
              }}
              tabId="interview-evaluations"
              value={values.overall_comment ?? ""}
              onChange={(value) => set("overall_comment", value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function RecruitmentDecisionForm({
  values,
  setValues,
  lookups,
  onViewCandidate,
}: {
  values: Record<string, string>;
  setValues: (
    updater: (current: Record<string, string>) => Record<string, string>,
  ) => void;
  lookups: DecisionLookups;
  onViewCandidate: (candidate: Row) => void;
}) {
  const candidate = lookups.candidates.find(
    (item) => String(item.candidate_id ?? "") === values.candidate_id,
  );
  const evaluations = lookups.evaluations.filter(
    (item) => String(item.candidate_id ?? "") === values.candidate_id,
  );
  const selectedEvaluation =
    evaluations.find(
      (item) =>
        String(item.interview_eval_id ?? "") === values.interview_eval_id,
    ) ?? evaluations[0];
  const set = (name: string, value: string) =>
    setValues((current) => ({ ...current, [name]: value }));
  const selectCandidate = (candidateId: string) => {
    const evaluation = lookups.evaluations.find(
      (item) => String(item.candidate_id ?? "") === candidateId,
    );
    const evaluationResult = String(evaluation?.overall_result ?? "")
      .trim()
      .toUpperCase();
    const result = ["ĐẠT", "PASSED"].includes(evaluationResult)
      ? "ĐẠT"
      : ["KHÔNG ĐẠT", "FAILED"].includes(evaluationResult)
        ? "KHÔNG ĐẠT"
        : "";
    setValues((current) => ({
      ...current,
      candidate_id: candidateId,
      interview_eval_id: String(evaluation?.interview_eval_id ?? ""),
      result,
    }));
  };

  return (
    <div className="space-y-5">

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-600">
            Ứng viên *
          </label>
          <select
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
            value={values.candidate_id ?? ""}
            required
            onChange={(event) => selectCandidate(event.target.value)}
          >
            <option value="">-- Chọn từ hồ sơ ứng viên --</option>
            {lookups.candidates.map((item) => {
              const hasEvaluation = lookups.evaluations.some(
                (evaluation) =>
                  String(evaluation.candidate_id ?? "") ===
                  String(item.candidate_id ?? ""),
              );
              return (
                <option
                  key={String(item.candidate_id)}
                  value={String(item.candidate_id)}
                  disabled={!hasEvaluation}
                >
                  {String(item.candidate_code ?? item.candidate_id)} -{" "}
                  {String(item.full_name ?? "")}
                  {hasEvaluation ? "" : " - Chưa có đánh giá phỏng vấn"}
                </option>
              );
            })}
          </select>
        </div>
        <WorkspaceInput
          field={{
            name: "decision_date",
            label: "Ngày quyết định",
            type: "date",
            required: true,
          }}
          tabId="decisions"
          value={values.decision_date ?? ""}
          onChange={(value) => set("decision_date", value)}
        />
        <WorkspaceInput
          field={{
            name: "decision_number",
            label: "Số phiếu",
            placeholder: "Tự sinh khi lưu",
            disabled: true,
          }}
          tabId="decisions"
          value={values.decision_number ?? ""}
          onChange={() => undefined}
        />
        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-600">
            Phiếu đánh giá phỏng vấn *
          </label>
          <Input
            value={String(
              selectedEvaluation?.eval_code ??
                values.interview_eval_id ??
                "Chưa chọn",
            )}
            disabled
            className="h-10 bg-slate-100 text-slate-500"
          />
          {candidate && !selectedEvaluation && (
            <p className="mt-1 text-[11px] text-amber-600">
              Ứng viên chưa có Phiếu Đánh giá phỏng vấn đạt yêu cầu.
            </p>
          )}
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-600">
            Kết quả *
          </label>
          <select
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
            value={values.result ?? ""}
            required
            onChange={(event) => set("result", event.target.value)}
          >
            <option value="">-- Chọn kết quả --</option>
            <option value="ĐẠT">Đạt</option>
            <option value="KHÔNG ĐẠT">Không đạt</option>
          </select>
          {selectedEvaluation && (
            <p className="mt-1 text-[11px] text-slate-500">
              Theo đánh giá chung:{" "}
              <b>{String(selectedEvaluation.overall_result ?? "-")}</b>
            </p>
          )}
        </div>
        <div className="md:col-span-2">
          <WorkspaceInput
            field={{
              name: "rejection_reason",
              label: `Lý do bị loại${values.result === "KHÔNG ĐẠT" ? " *" : ""}`,
              type: "textarea",
              required: values.result === "KHÔNG ĐẠT",
            }}
            tabId="decisions"
            value={values.rejection_reason ?? ""}
            onChange={(value) => set("rejection_reason", value)}
          />
        </div>
        <div className="md:col-span-2">
          <WorkspaceInput
            field={{
              name: "overall_comment",
              label: "Đánh giá chung",
              type: "textarea",
              required: true,
            }}
            tabId="decisions"
            value={values.overall_comment ?? ""}
            onChange={(value) => set("overall_comment", value)}
          />
        </div>
      </div>
      {candidate && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-teal-100 bg-teal-50/60 p-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-teal-600">
              Ứng viên được chọn
            </div>
            <div className="mt-1 text-sm font-bold text-slate-900">
              {String(candidate.full_name ?? "")}{" "}
              <span className="font-normal text-slate-500">
                ({String(candidate.candidate_code ?? "")})
              </span>
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onViewCandidate(candidate)}
          >
            <Eye size={14} /> Xem hồ sơ
          </Button>
        </div>
      )}
    </div>
  );
}

const candidateSources = [
  "TopCV",
  "LinkedIn",
  "Website công ty",
  "Giới thiệu nội bộ",
  "Khác",
];

function candidateDuplicate(
  values: Record<string, string>,
  candidates: Row[],
  editingId?: string,
) {
  const fields = ["citizen_id", "phone", "email"];
  return candidates.find(
    (candidate) =>
      String(candidate.candidate_id ?? "") !== String(editingId ?? "") &&
      fields.some((field) => {
        const value = String(values[field] ?? "")
          .trim()
          .toLowerCase();
        return (
          value !== "" &&
          value ===
            String(candidate[field] ?? "")
              .trim()
              .toLowerCase()
        );
      }),
  );
}

function CandidateForm({
  values,
  setValues,
  lookups,
}: {
  values: Record<string, string>;
  setValues: (
    updater: (current: Record<string, string>) => Record<string, string>,
  ) => void;
  lookups: CandidateLookups;
}) {
  const [activeTab, setActiveTab] = useState<
    "candidate" | "application" | "attachments"
  >("candidate");
  const requests = lookups.requests;
  const selectedRequest = requests.find(
    (item) =>
      String(item.recruitment_request_id ?? "") ===
      values.recruitment_request_id,
  );
  const positions = lookups.positions.filter(
    (item) =>
      !values.department_id ||
      String(item.department_id ?? "") === values.department_id,
  );
  const selectedPosition = positions.find(
    (item) => String(item.position_id ?? "") === values.position_id,
  );
  const attachments = parseDetailList(values.attachments_json);
  const set = (name: string, value: string) =>
    setValues((current) => ({ ...current, [name]: value }));
  const setRequest = (requestId: string) => {
    const request = requests.find(
      (item) => String(item.recruitment_request_id ?? "") === requestId,
    );
    setValues((current) => ({
      ...current,
      recruitment_request_id: requestId,
      position_id: String(request?.position_id ?? ""),
      department_id: String(request?.department_id ?? ""),
    }));
  };
  const updateAttachments = (next: Array<Record<string, unknown>>) =>
    set("attachments_json", JSON.stringify(next));

  return (
    <div className="space-y-5">
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {[
          ["candidate", "1. Thông tin ứng viên"],
          ["application", "2. Thông tin ứng tuyển"],
          ["attachments", "3. Tài liệu đính kèm"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() =>
              setActiveTab(key as "candidate" | "application" | "attachments")
            }
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-xs font-bold ${activeTab === key ? "border-teal-600 text-teal-700" : "border-transparent text-slate-400"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "candidate" && (
        <div className="grid gap-4 md:grid-cols-2">
          <WorkspaceInput
            field={{ name: "candidate_code", label: "Mã ứng viên" }}
            tabId="candidates"
            value={values.candidate_code ?? ""}
            onChange={(value) => set("candidate_code", value)}
          />
          <WorkspaceInput
            field={{ name: "full_name", label: "Họ tên", required: true }}
            tabId="candidates"
            value={values.full_name ?? ""}
            onChange={(value) => set("full_name", value)}
          />
          <WorkspaceInput
            field={{ name: "citizen_id", label: "Số CCCD" }}
            tabId="candidates"
            value={values.citizen_id ?? ""}
            onChange={(value) => set("citizen_id", value)}
          />
          <WorkspaceInput
            field={{ name: "date_of_birth", label: "Ngày sinh", type: "date" }}
            tabId="candidates"
            value={values.date_of_birth ?? ""}
            onChange={(value) => set("date_of_birth", value)}
          />
          <WorkspaceInput
            field={{
              name: "gender",
              label: "Giới tính",
              type: "select",
              options: [
                { value: "Nam", label: "Nam" },
                { value: "Nữ", label: "Nữ" },
              ],
            }}
            tabId="candidates"
            value={values.gender ?? "Nam"}
            onChange={(value) => set("gender", value)}
          />
          <WorkspaceInput
            field={{ name: "phone", label: "Số điện thoại" }}
            tabId="candidates"
            value={values.phone ?? ""}
            onChange={(value) => set("phone", value)}
          />
          <WorkspaceInput
            field={{ name: "email", label: "Email" }}
            tabId="candidates"
            value={values.email ?? ""}
            onChange={(value) => set("email", value)}
          />
          <WorkspaceInput
            field={{
              name: "address",
              label: "Địa chỉ",
              type: "textarea",
              span: 2,
            }}
            tabId="candidates"
            value={values.address ?? ""}
            onChange={(value) => set("address", value)}
          />
          <WorkspaceInput
            field={{ name: "culture_level", label: "Trình độ văn hóa" }}
            tabId="candidates"
            value={values.culture_level ?? ""}
            onChange={(value) => set("culture_level", value)}
          />
          <WorkspaceInput
            field={{
              name: "education_level",
              label: "Trình độ đào tạo",
              type: "select",
              options: [
                { value: "Cao đẳng", label: "Cao đẳng" },
                { value: "Cử nhân", label: "Cử nhân" },
                { value: "Thạc sĩ", label: "Thạc sĩ" },
                { value: "Tiến sĩ", label: "Tiến sĩ" },
              ],
            }}
            tabId="candidates"
            value={values.education_level ?? "Cử nhân"}
            onChange={(value) => set("education_level", value)}
          />
          <WorkspaceInput
            field={{ name: "education_school", label: "Nơi đào tạo" }}
            tabId="candidates"
            value={values.education_school ?? ""}
            onChange={(value) => set("education_school", value)}
          />
          <WorkspaceInput
            field={{ name: "major", label: "Ngành đào tạo" }}
            tabId="candidates"
            value={values.major ?? ""}
            onChange={(value) => set("major", value)}
          />
          <WorkspaceInput
            field={{ name: "gpa", label: "Xếp loại / GPA", type: "number" }}
            tabId="candidates"
            value={values.gpa ?? ""}
            onChange={(value) => set("gpa", value)}
          />
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">
              Người giới thiệu
            </label>
            <select
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
              value={values.referrer_employee_id ?? ""}
              onChange={(event) => {
                const employee = lookups.employees.find(
                  (item) =>
                    String(item.employee_id ?? "") === event.target.value,
                );
                setValues((current) => ({
                  ...current,
                  referrer_employee_id: event.target.value,
                  referrer: String(employee?.full_name ?? ""),
                }));
              }}
            >
              <option value="">-- Chọn hồ sơ nhân sự --</option>
              {lookups.employees.map((employee) => (
                <option
                  key={String(employee.employee_id)}
                  value={String(employee.employee_id)}
                >
                  {String(employee.employee_code ?? employee.employee_id)} -{" "}
                  {String(employee.full_name ?? "")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">
              Nguồn tuyển dụng
            </label>
            <select
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
              value={values.source ?? "TopCV"}
              onChange={(event) => set("source", event.target.value)}
            >
              {candidateSources.map((source) => (
                <option key={source}>{source}</option>
              ))}
            </select>
          </div>
          <WorkspaceInput
            field={{
              name: "experience",
              label: "Kinh nghiệm làm việc",
              type: "textarea",
              span: 2,
            }}
            tabId="candidates"
            value={values.experience ?? ""}
            onChange={(value) => set("experience", value)}
          />
        </div>
      )}

      {activeTab === "application" && (
        <div className="grid gap-4 md:grid-cols-2">
          <WorkspaceInput
            field={{
              name: "status",
              label: "Trạng thái ứng viên",
              type: "select",
              options: [...CANDIDATE_STATUS_OPTIONS],
            }}
            tabId="candidates"
            value={values.status ?? "tiếp nhận hồ sơ"}
            onChange={(value) => set("status", value)}
          />
          <WorkspaceInput
            field={{
              name: "received_date",
              label: "Ngày nhận hồ sơ",
              type: "date",
              disabled: true,
            }}
            tabId="candidates"
            value={values.received_date ?? ""}
            onChange={() => undefined}
          />
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">
              Dựa trên yêu cầu
            </label>
            <select
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
              value={values.recruitment_request_id ?? ""}
              required
              onChange={(event) => setRequest(event.target.value)}
            >
              <option value="">-- Chọn yêu cầu tuyển dụng --</option>
              {requests.map((request) => (
                <option
                  key={String(request.recruitment_request_id)}
                  value={String(request.recruitment_request_id)}
                >
                  {String(
                    request.request_code ?? request.recruitment_request_id,
                  )}{" "}
                  - {String(request.position_name ?? "")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">
              Vị trí ứng tuyển
            </label>
            <Input
              value={String(
                selectedPosition?.position_name ??
                  selectedRequest?.position_name ??
                  "Tự động theo yêu cầu",
              )}
              disabled
              className="h-10 bg-slate-100 text-slate-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">
              Bộ phận
            </label>
            <Input
              value={String(
                selectedRequest?.department_name ??
                  lookups.departments.find(
                    (item) =>
                      String(item.department_id ?? "") === values.department_id,
                  )?.department_name ??
                  "Tự động theo vị trí",
              )}
              disabled
              className="h-10 bg-slate-100 text-slate-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">
              Nguồn tuyển dụng
            </label>
            <select
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
              value={values.source ?? "TopCV"}
              onChange={(event) => set("source", event.target.value)}
            >
              {candidateSources.map((source) => (
                <option key={source}>{source}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <WorkspaceInput
              field={{ name: "note", label: "Ghi chú", type: "textarea" }}
              tabId="candidates"
              value={values.note ?? ""}
              onChange={(value) => set("note", value)}
            />
          </div>
        </div>
      )}

      {activeTab === "attachments" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-slate-900">
              Tài liệu đính kèm
            </h3>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                updateAttachments([
                  ...attachments,
                  { name: "", file: "", note: "" },
                ])
              }
            >
              <Plus size={14} /> Thêm tài liệu
            </Button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-3 py-3">Tên tài liệu</th>
                  <th className="px-3 py-3">File</th>
                  <th className="px-3 py-3">Ghi chú</th>
                  <th className="px-3 py-3">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attachments.map((attachment, index) => (
                  <tr key={index}>
                    <td className="px-3 py-2">
                      <Input
                        value={String(attachment.name ?? "")}
                        onChange={(event) => {
                          const next = [...attachments];
                          next[index] = {
                            ...next[index],
                            name: event.target.value,
                          };
                          updateAttachments(next);
                        }}
                        className="h-9"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="file"
                        onChange={(event) => {
                          const next = [...attachments];
                          next[index] = {
                            ...next[index],
                            file: event.target.files?.[0]?.name ?? "",
                          };
                          updateAttachments(next);
                        }}
                        className="h-9 py-1.5 text-xs"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        value={String(attachment.note ?? "")}
                        onChange={(event) => {
                          const next = [...attachments];
                          next[index] = {
                            ...next[index],
                            note: event.target.value,
                          };
                          updateAttachments(next);
                        }}
                        className="h-9"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          updateAttachments(
                            attachments.filter(
                              (_, itemIndex) => itemIndex !== index,
                            ),
                          )
                        }
                      >
                        <Trash2 size={15} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {attachments.length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
              Chưa có tài liệu đính kèm.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function quotaCheck(values: Record<string, string>, lookups: RequestLookups) {
  const departmentId = values.department_id;
  const positionId = values.position_id;
  const quotas = lookups.quotas.filter(
    (quota) => String(quota.department_id ?? "") === departmentId,
  );
  const quota =
    quotas.find((item) => String(item.quota_id ?? "") === values.quota_id) ??
    quotas[0];
  if (!quota || !positionId) return null;
  const details = parseDetailList(quota.details);
  const detail = details.find(
    (item) => String(item.position_id ?? "") === positionId,
  );
  const current = Number(
    detail?.current_headcount ?? quota.current_headcount ?? 0,
  );
  const target = Number(
    detail?.target_headcount ?? quota.target_headcount ?? 0,
  );
  const movement =
    Number(detail?.resignation_count ?? 0) +
    Number(detail?.maternity_count ?? 0);
  const quantity = Number(values.quantity) || 0;
  return {
    current,
    target,
    movement,
    quantity,
    exceeds: current + quantity - movement > target,
  };
}

function RecruitmentRequestForm({
  values,
  setValues,
  lookups,
}: {
  values: Record<string, string>;
  setValues: (
    updater: (current: Record<string, string>) => Record<string, string>,
  ) => void;
  lookups: RequestLookups;
}) {
  const departments = lookups.departments;
  const employees = lookups.employees;
  const department = departments.find(
    (item) => String(item.department_id ?? "") === values.department_id,
  );
  const positions = lookups.positions.filter(
    (item) => String(item.department_id ?? "") === values.department_id,
  );
  const quotas = lookups.quotas.filter(
    (item) => String(item.department_id ?? "") === values.department_id,
  );
  const selectedPosition = positions.find(
    (item) => String(item.position_id ?? "") === values.position_id,
  );
  const check = quotaCheck(values, lookups);
  const outside = values.is_outside_headcount === "1";
  const set = (name: string, value: string) =>
    setValues((current) => ({ ...current, [name]: value }));
  const setRequester = (employeeId: string) => {
    const employee = employees.find(
      (item) => String(item.employee_id ?? "") === employeeId,
    );
    setValues((current) => ({
      ...current,
      requested_by: employeeId,
      department_id: String(employee?.department_id ?? ""),
      quota_id: "",
      position_id: "",
    }));
  };
  const setRequestType = (value: string) =>
    setValues((current) => ({
      ...current,
      is_outside_headcount: value,
      quota_id: value === "1" ? "" : current.quota_id,
    }));

  return (
    <div className="space-y-5">
      <section>
        <h3 className="mb-3 font-display text-sm font-bold text-slate-900">
          1. Thông tin chung
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <WorkspaceInput
            field={{
              name: "created_date",
              label: "Ngày lập phiếu",
              type: "date",
              required: true,
            }}
            tabId="requests"
            value={values.created_date ?? ""}
            onChange={(value) => set("created_date", value)}
          />
          <WorkspaceInput
            field={{ name: "request_code", label: "Số phiếu", disabled: true }}
            tabId="requests"
            value={values.request_code ?? ""}
            onChange={() => undefined}
          />
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">
              Loại yêu cầu *
            </label>
            <select
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
              value={values.is_outside_headcount ?? "0"}
              onChange={(event) => setRequestType(event.target.value)}
            >
              <option value="0">Trong định biên</option>
              <option value="1">Ngoài định biên</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">
              Phiếu định biên {outside ? "(không áp dụng)" : "*"}
            </label>
            <select
              className={`h-10 w-full rounded-xl border px-3 text-sm ${outside ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400" : "border-slate-200 bg-white"}`}
              value={values.quota_id ?? ""}
              disabled={outside}
              required={!outside}
              onChange={(event) => set("quota_id", event.target.value)}
            >
              <option value="">-- Chọn phiếu định biên --</option>
              {quotas.map((quota) => (
                <option
                  key={String(quota.quota_id)}
                  value={String(quota.quota_id)}
                >
                  {String(
                    quota.department_name ?? department?.department_name ?? "",
                  )}
                </option>
              ))}
            </select>
            {outside && (
              <p className="mt-1 text-[11px] text-slate-400">
                Phiếu ngoài định biên không được nhập phiếu định biên.
              </p>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">
              Người lập *
            </label>
            <select
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
              value={values.requested_by ?? ""}
              required
              onChange={(event) => setRequester(event.target.value)}
            >
              <option value="">-- Chọn người lập --</option>
              {employees.map((employee) => (
                <option
                  key={String(employee.employee_id)}
                  value={String(employee.employee_id)}
                >
                  {String(employee.full_name ?? "")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">
              Bộ phận
            </label>
            <Input
              value={
                  department
                   ? String(department.department_name ?? "")
                  : "Tự động theo người lập"
              }
              disabled
              className="h-10 bg-slate-100 text-slate-500"
            />
          </div>
          <div className="md:col-span-2">
            <WorkspaceInput
              field={{
                name: "reason",
                label: "Lý do",
                type: "textarea",
                required: true,
              }}
              tabId="requests"
              value={values.reason ?? ""}
              onChange={(value) => set("reason", value)}
            />
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-3 font-display text-sm font-bold text-slate-900">
          2. Chi tiết vị trí định biên
        </h3>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">
                Vị trí *
              </label>
              <select
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                value={values.position_id ?? ""}
                required
                onChange={(event) => set("position_id", event.target.value)}
              >
                <option value="">-- Chọn vị trí thuộc bộ phận --</option>
                {positions.map((position) => (
                  <option
                    key={String(position.position_id)}
                    value={String(position.position_id)}
                  >
                    {String(position.position_name ?? "")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">
                Tên vị trí
              </label>
              <Input
                value={String(
                  selectedPosition?.position_name ?? "Tự động theo mã vị trí",
                )}
                disabled
                className="h-10 bg-slate-100 text-slate-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">
                Số lượng cần tuyển *
              </label>
              <Input
                type="number"
                min={1}
                value={values.quantity ?? ""}
                required
                onChange={(event) => set("quantity", event.target.value)}
                className="h-10"
              />
            </div>
            <WorkspaceInput
              field={{
                name: "expected_date",
                label: "Ngày cần người",
                type: "date",
                required: true,
              }}
              tabId="requests"
              value={values.expected_date ?? ""}
              onChange={(value) => set("expected_date", value)}
            />
            <div className="md:col-span-2">
              <WorkspaceInput
                field={{ name: "note", label: "Ghi chú", type: "textarea" }}
                tabId="requests"
                value={values.note ?? ""}
                onChange={(value) => set("note", value)}
              />
            </div>
          </div>
          {check && (
            <div
              className={`rounded-xl border p-4 text-xs ${check.exceeds ? "border-amber-200 bg-amber-50 text-amber-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}
            >
              <b>Kiểm tra định biên:</b> Hiện tại {check.current} + Cần tuyển{" "}
              {check.quantity} - Biến động {check.movement} ={" "}
              {check.current + check.quantity - check.movement}; Định biên{" "}
              {check.target}.{" "}
              {check.exceeds
                ? outside
                  ? "Vượt định biên. Phiếu ngoài định biên vẫn được phép lưu sau khi xác nhận."
                  : "Vượt định biên. Phiếu trong định biên không được phép lưu."
                : "Không vượt định biên."}
            </div>
          )}
        </div>
      </section>
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

function quotaDetailCount(
  employees: Row[],
  positionId: string,
  departmentId: string,
) {
  return employees.filter((employee) => {
    const active =
      Number(employee.is_active) === 1 ||
      String(employee.employment_status ?? "").toUpperCase() === "WORKING";
    return (
      active &&
      String(employee.position_id ?? "") === positionId &&
      (!departmentId || String(employee.department_id ?? "") === departmentId)
    );
  }).length;
}

function quotaDetailValue(item: Row, field: string) {
  const value = Number(item[field]);
  return Number.isFinite(value) ? String(value) : "0";
}

function QuotaForm({
  values,
  setValues,
  tab,
  lookups,
}: {
  values: Record<string, string>;
  setValues: (
    updater: (current: Record<string, string>) => Record<string, string>,
  ) => void;
  tab: WorkspaceTab;
  lookups: RequestLookups;
}) {
  const parsedDetails = parseJsonList(values.details);
  const details = parsedDetails.items;
  const departmentId = String(values.department_id ?? "");
  const filteredPositions = lookups.positions.filter(
    (position) =>
      !departmentId || String(position.department_id ?? "") === departmentId,
  );
  const positionOptions = filteredPositions.length
    ? filteredPositions
    : lookups.positions;

  const updateDetails = (nextDetails: Row[]) => {
    const totals = nextDetails.reduce<{
      target: number;
      current: number;
      needed: number;
    }>(
      (result, detail) => ({
        target: result.target + (Number(detail.target_headcount) || 0),
        current: result.current + (Number(detail.current_headcount) || 0),
        needed: result.needed + (Number(detail.needed_headcount) || 0),
      }),
      { target: 0, current: 0, needed: 0 },
    );
    setValues((current) => ({
      ...current,
      details: JSON.stringify(nextDetails),
      target_headcount: String(totals.target),
      current_headcount: String(totals.current),
      needed_headcount: String(totals.needed),
    }));
  };

  const addDetail = () => {
    const position = positionOptions[0];
    const positionId = String(position?.position_id ?? "");
    const current = position
      ? quotaDetailCount(lookups.employees, positionId, departmentId)
      : 0;
    const target = 1;
    updateDetails([
      ...details,
      {
        position_id: positionId,
        position_code: String(position?.position_code ?? ""),
        position_name: String(position?.position_name ?? ""),
        target_headcount: target,
        resignation_count: 0,
        maternity_count: 0,
        current_headcount: current,
        needed_headcount: Math.max(0, target - current),
        note: "",
      },
    ]);
  };

  const updateDetail = (index: number, changes: Row) => {
    const nextDetails = details.map((detail, detailIndex) =>
      detailIndex === index ? { ...detail, ...changes } : detail,
    );
    const nextDetail = nextDetails[index];
    if (nextDetail) {
      const target = Number(nextDetail.target_headcount) || 0;
      const current = Number(nextDetail.current_headcount) || 0;
      const resignation = Number(nextDetail.resignation_count) || 0;
      const maternity = Number(nextDetail.maternity_count) || 0;
      nextDetails[index] = {
        ...nextDetail,
        needed_headcount: Math.max(
          0,
          target - current + resignation + maternity,
        ),
      };
    }
    updateDetails(nextDetails);
  };

  const selectPosition = (index: number, positionCode: string) => {
    const position = lookups.positions.find(
      (item) =>
        String(item.position_code ?? item.position_id ?? "") === positionCode,
    );
    if (!position) return;
    const positionId = String(position.position_id ?? "");
    const current = quotaDetailCount(
      lookups.employees,
      positionId,
      departmentId,
    );
    updateDetail(index, {
      position_id: positionId,
      position_code: String(position.position_code ?? positionId),
      position_name: String(position.position_name ?? ""),
      current_headcount: current,
    });
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {tab.fields.map((field) => {
        if (field.name === "details") {
          return (
            <div key={field.name} className="md:col-span-2">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600">
                    Chi tiết theo vị trí *
                  </label>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={addDetail}
                >
                  <Plus size={14} /> Thêm vị trí
                </Button>
              </div>
              {parsedDetails.error && (
                <p className="mb-2 text-xs text-rose-700">
                  {parsedDetails.error}
                </p>
              )}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-[1180px] text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
                    <tr>
                      {[
                        "STT",
                        "Mã vị trí",
                        "Tên vị trí",
                        "Định biên",
                        "Nghỉ việc dự kiến",
                        "Thai sản dự kiến",
                        "Hiện tại",
                        "Cần tuyển",
                        "Ghi chú",
                        "Thao tác",
                      ].map((header) => (
                        <th key={header} className="px-3 py-3 font-bold">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {details.length ? (
                      details.map((detail, index) => {
                        const currentCode = String(
                          detail.position_code ??
                            lookups.positions.find(
                              (item) =>
                                String(item.position_id ?? "") ===
                                String(detail.position_id ?? ""),
                            )?.position_code ??
                            "",
                        );
                        const hasCurrentOption = positionOptions.some(
                          (position) =>
                            String(
                              position.position_code ??
                                position.position_id ??
                                "",
                            ) === currentCode,
                        );
                        return (
                          <tr
                            key={`${String(detail.position_id ?? "position")}-${index}`}
                          >
                            <td className="px-3 py-3 text-slate-400">
                              {String(index + 1).padStart(2, "0")}
                            </td>
                            <td className="min-w-40 px-3 py-3">
                              <select
                                value={currentCode}
                                onChange={(event) =>
                                  selectPosition(index, event.target.value)
                                }
                                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                              >
                                <option value="">-- Chọn vị trí --</option>
                                {!hasCurrentOption && currentCode && (
                                  <option value={currentCode}>
                                    {currentCode}
                                  </option>
                                )}
                                {positionOptions.map((position) => {
                                  const code = String(
                                    position.position_code ??
                                      position.position_id ??
                                      "",
                                  );
                                  return (
                                    <option
                                      key={String(position.position_id ?? code)}
                                      value={code}
                                    >
                                      {code}
                                    </option>
                                  );
                                })}
                              </select>
                            </td>
                            <td className="min-w-48 px-3 py-3 font-semibold text-teal-700">
                              <Input
                                value={String(detail.position_name ?? "")}
                                disabled
                                className="h-9 bg-slate-100 text-xs text-slate-500"
                              />
                            </td>
                            {[
                              "target_headcount",
                              "resignation_count",
                              "maternity_count",
                            ].map((fieldName) => (
                              <td
                                key={fieldName}
                                className="min-w-32 px-3 py-3"
                              >
                                <Input
                                  type="number"
                                  min={0}
                                  step={1}
                                  value={quotaDetailValue(detail, fieldName)}
                                  onChange={(event) =>
                                    updateDetail(index, {
                                      [fieldName]:
                                        event.target.value === ""
                                          ? 0
                                          : Number(event.target.value),
                                    })
                                  }
                                  className="h-9 text-center text-xs"
                                />
                              </td>
                            ))}
                            <td className="px-3 py-3 text-center font-semibold text-emerald-700">
                              <span className="rounded-full bg-emerald-50 px-2.5 py-1">
                                {quotaDetailValue(detail, "current_headcount")}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center font-semibold text-blue-700">
                              <span className="rounded-full bg-blue-50 px-2.5 py-1">
                                {quotaDetailValue(detail, "needed_headcount")}
                              </span>
                            </td>
                            <td className="min-w-44 px-3 py-3">
                              <Input
                                value={String(detail.note ?? "")}
                                placeholder="Ghi chú..."
                                onChange={(event) =>
                                  updateDetail(index, {
                                    note: event.target.value,
                                  })
                                }
                                className="h-9 text-xs"
                              />
                            </td>
                            <td className="px-3 py-3 text-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  updateDetails(
                                    details.filter(
                                      (_, itemIndex) => itemIndex !== index,
                                    ),
                                  )
                                }
                                aria-label={`Xóa vị trí ${index + 1}`}
                              >
                                <Trash2 size={14} />
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={10}
                          className="px-3 py-8 text-center text-slate-400"
                        >
                          Chưa có dữ liệu vị trí chi tiết. Nhấn “Thêm vị trí” để
                          thêm dòng mới.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        }
        const inputField =
          field.name === "department_id"
            ? {
                ...field,
                type: "select" as const,
                options: [
                  { value: "", label: "-- Chọn bộ phận --" },
                  ...lookups.departments.map((department) => ({
                    value: String(department.department_id ?? ""),
                    label:
                      `${department.department_code ?? ""} ${department.department_name ?? department.department_id ?? ""}`.trim(),
                  })),
                ],
              }
            : field;
        return (
          <WorkspaceInput
            key={field.name}
            field={inputField}
            tabId={tab.id}
            value={values[field.name] ?? ""}
            onChange={(value) =>
              setValues((current) => ({ ...current, [field.name]: value }))
            }
          />
        );
      })}
    </div>
  );
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
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
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
          <p className="mt-2 text-xs font-medium text-rose-700">
            {uploadError}
          </p>
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
        </div>
        <Button variant="secondary" onClick={() => window.print()}>
          <Download size={16} /> In / lưu PDF
        </Button>
      </section>

      <Card>
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
                Hiển thị {pageOffset + 1}-
                {Math.min(pageOffset + pageSize, rows.length)} trên{" "}
                {rows.length} bản ghi
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
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
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
  const workspaceTabIds = new Set(workspaceTabs[name].map((item) => item.id));
  const employeePeople = name === "people" && session?.role === "Nhân viên";
  const requestedTabAllowed =
    requestedTab &&
    workspaceTabIds.has(requestedTab) &&
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
  const requestedContractTab = searchParams.get("contractTab");
  const initialContractTab = contractSectionIds.includes(
    requestedContractTab ?? "",
  )
    ? requestedContractTab!
    : contractSectionIds.includes(tabId ?? "")
      ? tabId
      : "contracts";
  const isContractWorkspace =
    name === "people" && contractSectionIds.includes(tabId ?? "");
  const contractSection = isContractWorkspace ? initialContractTab : tabId;
  const tab = getWorkspaceTab(name, contractSection);
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
  const [pendingAvatar, setPendingAvatar] = useState<File | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>(() =>
    defaultForm(firstTab),
  );
  const [conversionForm, setConversionForm] = useState<EmployeeConversionState | null>(null);
  const [popup, setPopup] = useState<PopupState | null>(null);
  const [dismissedQueryError, setDismissedQueryError] = useState<unknown>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [positionFilter, setPositionFilter] = useState("");
  const [proposalCodeFilter, setProposalCodeFilter] = useState("");
  const [proposalTypeFilter, setProposalTypeFilter] = useState("");
  const [proposalManagerFilter, setProposalManagerFilter] = useState("");
  const [proposalDateFrom, setProposalDateFrom] = useState("");
  const [proposalDateTo, setProposalDateTo] = useState("");
  const queryClient = useQueryClient();

  const selectContractSection = (nextTab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "contracts");
    if (nextTab === "contracts") params.delete("contractTab");
    else params.set("contractTab", nextTab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    setSearch("");
    setPage(1);
    setShowForm(false);
  };

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
      const endpoint =
        name === "people" &&
        tab.id === "employees" &&
        session?.role === "Nhân viên"
          ? "/hr/employees/me"
          : tab.endpoint;
      const rows = await api.list(endpoint, { resource });
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
          "quota",
          "quotas",
          "plans",
          "requests",
          "candidates",
          "screenings",
          "schedules",
          "interview-evaluations",
          "offers",
          "decisions",
        ].includes(tab.id)),
    queryFn: async () => {
      const [
        departments,
        positions,
        employees,
        contractTypes,
        requests,
        plans,
        candidates,
        schedules,
        offers,
        evaluations,
        quotas,
        screenings,
        decisions,
        contracts,
        leaveApplications,
        transferProposals,
        resignationApplications,
        criteria,
        rewardProposals,
      ] = await Promise.all([
        api.list("/admin/departments", { resource }),
        api.list("/admin/positions", { resource }),
        api.list("/hr/employees", { resource }),
        api.list("/admin/contract-types", { resource }),
        api.list("/recruitment/requests", { resource }),
        api.list("/recruitment/plans", { resource }),
        api.list("/recruitment/candidates", { resource }),
        api.list("/recruitment/interview-schedules", { resource }),
        api.list("/recruitment/offers", { resource }),
        api.list("/recruitment/interview-evaluations", { resource }),
        api.list("/hr/quotas", { resource }),
        api.list("/recruitment/pre-screenings", { resource }),
        api.list("/recruitment/decisions", { resource }),
        api.list("/hr/contracts", { resource }),
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
        contractTypes,
        requests,
        plans,
        candidates,
        schedules,
        offers,
        evaluations,
        quotas,
        screenings,
        decisions,
        contracts,
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
      const result = await api.write(endpoint, id ? "PUT" : "POST", payload, {
        resource,
        action: id ? "edit" : "create",
      });
      if (tab.id === "contracts" && !id) {
        const responseData =
          result && typeof result === "object" && "data" in result
            ? result.data
            : result;
        const contractId = String(
          (responseData as Row | null)?.id ??
            (responseData as Row | null)?.contract_id ??
            "",
        );
        if (contractId) {
          await Promise.all(
            parseDetailList(values.appendices).map((appendix) =>
              api.write(
                `/hr/contracts/${contractId}/appendices`,
                "POST",
                appendix,
                { resource, action: "create" },
              ),
            ),
          );
        }
      }
      return result;
    },
    onSuccess: async (response) => {
      if (tab.id === "employees" && pendingAvatar) {
        const responseData =
          response && typeof response === "object" && "data" in response
            ? response.data
            : response;
        const savedId = editingRow
          ? rowId(tab, editingRow)
          : String(
              (responseData as Row | null)?.id ??
                (responseData as Row | null)?.employee_id ??
                "",
            );
        if (savedId) {
          try {
            await api.uploadEmployeeAvatar(savedId, pendingAvatar);
          } catch (error) {
            showPopup(
              "warning",
              "Đã lưu hồ sơ",
              error instanceof Error
                ? `Hồ sơ đã lưu nhưng chưa tải được ảnh: ${error.message}`
                : "Hồ sơ đã lưu nhưng chưa tải được ảnh.",
            );
          }
        }
      }
      setPendingAvatar(null);
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
      conversion,
    }: {
      row: Row;
      action: "approve" | "reject" | "convert";
      conversion?: EmployeeConversionState;
    }) => {
      const id = rowId(tab, row);
      if (action === "convert") {
        const candidateId = String(
          row.candidate_id ?? row.candidateId ?? row.id ?? "",
        ).trim();
        if (!candidateId) throw new Error("Quyết định chưa có mã ứng viên.");

        return api.write(
          "/recruitment/convert-to-employee",
          "POST",
          {
            candidate_id: candidateId,
            decision_id: row.decision_id ?? row.decisionId ?? undefined,
            employee: conversion?.employee,
            contract: conversion?.contract,
          },
          { resource, action: "create" },
        );
      }
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
    onSuccess: async (response, variables) => {
      if (variables.action === "convert") {
        const responseData =
          response && typeof response === "object" && "data" in response
            ? response.data
            : response;
        const employeeId = String(
          (responseData as Row | null)?.empId ??
            (responseData as Row | null)?.employee_id ??
            "",
        );
        if (employeeId && variables.conversion?.avatarFile) {
          try {
            await api.uploadEmployeeAvatar(employeeId, variables.conversion.avatarFile);
          } catch (error) {
            showPopup(
              "warning",
              "Đã tạo hồ sơ",
              error instanceof Error
                ? `Hồ sơ và hợp đồng đã tạo nhưng chưa tải được ảnh: ${error.message}`
                : "Hồ sơ và hợp đồng đã tạo nhưng chưa tải được ảnh.",
            );
          }
        }
        setConversionForm(null);
      }
      showPopup(
        "success",
        "Thành công",
        variables.action === "convert"
          ? "Đã tạo hồ sơ và hợp đồng cho ứng viên."
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

  const lookupData = lookupQuery.data;
  const openConversionForm = (row: Row) => {
    const candidateId = String(
      row.candidate_id ?? row.candidateId ?? row.id ?? "",
    ).trim();
    const candidateRecord = (lookupData?.candidates ?? []).find(
      (item) => String(item.candidate_id ?? item.id ?? "") === candidateId,
    );
    const candidate = { ...(candidateRecord ?? {}), ...row };
    const offer = (lookupData?.offers ?? []).find(
      (item) => String(item.candidate_id ?? "") === candidateId,
    );
    const position = (lookupData?.positions ?? []).find(
      (item) => String(item.position_id ?? "") === String(candidate.position_id ?? ""),
    );
    const departmentId = String(
      candidate.department_id ?? candidate.req_dept_id ?? position?.department_id ?? "",
    );
    const positionId = String(candidate.position_id ?? candidate.req_pos_id ?? "");
    const positionName = String(
      candidate.apply_position_name ?? candidate.position_name ?? position?.position_name ?? "",
    );
    const joinDate = formatDateValue(offer?.expected_start_date);
    const today = formatDateValue(Date.now());
    const contractStartDate = joinDate || today;
    const probationToDate = dateAfterMonths(contractStartDate, 2);
    const officialSalary = String(offer?.official_salary ?? offer?.salary_offer ?? "");
    const probationSalary = String(
      offer?.probation_salary ?? (officialSalary ? Math.round(Number(officialSalary) * 0.85) : ""),
    );
    const probationRate = officialSalary && Number(officialSalary)
      ? String(Number(((Number(probationSalary) / Number(officialSalary)) * 100).toFixed(2)))
      : "85";
    const employeeTab = getWorkspaceTab("people", "employees");
    const contractTab = getWorkspaceTab("people", "contracts");
    const employee = {
      ...defaultForm(employeeTab),
      candidate_id: candidateId,
      full_name: String(candidate.full_name ?? ""),
      gender: String(candidate.gender ?? "Nam"),
      date_of_birth: formatDateValue(candidate.date_of_birth),
      citizen_id: String(candidate.citizen_id ?? ""),
      phone: String(candidate.phone ?? ""),
      email: String(candidate.email ?? ""),
      personal_email: String(candidate.email ?? ""),
      department_id: departmentId,
      position_id: positionId,
      address: String(candidate.address ?? ""),
      culture_level: String(candidate.culture_level ?? ""),
      education_level: String(candidate.education_level ?? ""),
      education_school: String(candidate.education_school ?? ""),
      major: String(candidate.major ?? ""),
      nationality: "Việt Nam",
      ethnicity: "Kinh",
      religion: "Không",
      marital_status: "Độc thân",
      level: "Nhân viên",
      employment_status: "WORKING",
      join_date: joinDate,
      initial_contract_date: joinDate,
    };
    const contract = {
      ...defaultForm(contractTab),
      contract_date: today,
      sign_date: today,
      employee_position: positionName,
      contract_type: "Hợp đồng thử việc",
      start_date: contractStartDate,
      end_date: probationToDate,
      has_probation: "1",
      probation_from_date: contractStartDate,
      probation_to_date: probationToDate,
      probation_salary_rate: probationRate,
      base_salary: probationSalary,
      social_insurance_salary: officialSalary,
      salary: officialSalary,
      signer_id: session?.employeeId ?? "",
      signer_name: session?.name ?? "",
      status: "ACTIVE",
      note: "Tạo trong quy trình tiếp nhận nhân viên.",
    };
    setConversionForm({
      row,
      employee,
      contract,
      avatarFile: null,
    });
  };
  const submitConversion = () => {
    if (!conversionForm) return;
    const { employee, contract } = conversionForm;
    const requiredValues = [
      employee.full_name,
      employee.department_id,
      employee.position_id,
      employee.join_date,
      contract.contract_type,
      contract.start_date,
      contract.base_salary,
      contract.social_insurance_salary,
      contract.salary,
    ];
    if (
      requiredValues.some((value) => !String(value ?? "").trim()) ||
      (contract.has_probation === "1" &&
        (!contract.probation_from_date ||
          !contract.probation_to_date ||
          !contract.probation_salary_rate))
    ) {
      showPopup(
        "warning",
        "Chưa đủ thông tin",
        "Vui lòng hoàn thiện các trường bắt buộc trong hồ sơ nhân viên và hợp đồng.",
      );
      return;
    }
    actionMutation.mutate({ row: conversionForm.row, action: "convert", conversion: conversionForm });
  };
  const statusField = tab.fields.find((field) => field.name === "status");
  const statusOptions = Array.from(
    new Set([
      ...(statusField?.options?.map((option) => option.value) ?? []),
      ...(rowsQuery.data ?? []).map((row) => String(row.status ?? "")).filter(Boolean),
    ]),
  );
  const selectedDepartment = lookupData?.departments.find(
    (item) => String(item.department_id ?? "") === departmentFilter,
  );
  const selectedPosition = lookupData?.positions.find(
    (item) => String(item.position_id ?? "") === positionFilter,
  );
  const isProposalTab = name === "rewards" && tab.id === "proposals";
  const departmentManagerOptions = Array.from(
    new Map(
      (lookupData?.departments ?? [])
        .filter((item) => item.manager_id || item.manager_name)
        .map((item) => [
          String(item.manager_id ?? item.manager_name),
          {
            manager_id: String(item.manager_id ?? item.manager_name ?? ""),
            manager_name: String(item.manager_name ?? item.manager_id ?? ""),
          },
        ]),
    ).values(),
  );
  const selectedProposalManager = departmentManagerOptions.find(
    (item) => item.manager_id === proposalManagerFilter,
  );
  const sourceRows = (rowsQuery.data ?? []).map((row) =>
    name === "recruitment" &&
    ["screenings", "interview-evaluations", "decisions"].includes(tab.id)
      ? enrichCandidateReference(row, lookupData?.candidates ?? [])
      : row,
  );
  const rows = sourceRows.filter((row) => {
    const rowText = Object.values(row)
      .map((value) => (typeof value === "object" ? JSON.stringify(value) : String(value ?? "")))
      .join(" ")
      .toLowerCase();
    const rowDepartments = [
      row.department_id,
      row.department_name,
      row.department,
    ].map((value) => String(value ?? ""));
    const rowPositions = [
      row.position_id,
      row.position_name,
      row.position,
    ].map((value) => String(value ?? ""));
    const detailPositions = parseDetailList(row.details).flatMap((detail) => [
      String(detail.position_id ?? ""),
      String(detail.position_code ?? ""),
      String(detail.position_name ?? ""),
    ]);
    const departmentMatches =
      !departmentFilter ||
      rowDepartments.includes(departmentFilter) ||
      rowDepartments.includes(String(selectedDepartment?.department_name ?? ""));
    const positionMatches =
      !positionFilter ||
      rowPositions.includes(positionFilter) ||
      rowPositions.includes(String(selectedPosition?.position_name ?? "")) ||
      detailPositions.includes(positionFilter) ||
      detailPositions.includes(String(selectedPosition?.position_name ?? ""));
    const proposalCodeMatches =
      !isProposalTab ||
      !proposalCodeFilter ||
      String(row.proposal_code ?? "")
        .toLowerCase()
        .includes(proposalCodeFilter.toLowerCase());
    const proposalTypeMatches =
      !isProposalTab ||
      !proposalTypeFilter ||
      String(row.record_type ?? "") === proposalTypeFilter;
    const proposalManagerMatches =
      !isProposalTab ||
      !proposalManagerFilter ||
      String(row.department_manager_id ?? "") === proposalManagerFilter ||
      String(row.department_manager_name ?? "") ===
        String(selectedProposalManager?.manager_name ?? "");
    const proposalDate = formatDateValue(row.proposal_date);
    const proposalDateFromMatches =
      !isProposalTab || !proposalDateFrom || proposalDate >= proposalDateFrom;
    const proposalDateToMatches =
      !isProposalTab || !proposalDateTo || proposalDate <= proposalDateTo;
    return (
      rowText.includes(search.toLowerCase()) &&
      (!statusFilter || String(row.status ?? "") === statusFilter) &&
      departmentMatches &&
      positionMatches &&
      proposalCodeMatches &&
      proposalTypeMatches &&
      proposalManagerMatches &&
      proposalDateFromMatches &&
      proposalDateToMatches
    );
  });
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
      "interview-evaluations",
      "decisions",
      "offers",
    ].includes(tab.id);
  const isHrOrAdmin =
    session?.role === "Administrator" || session?.role === "HR Staff";
  const canManageRewardProposal =
    name === "rewards" &&
    tab.id === "proposals" &&
    [
      "Administrator",
      "HR Staff",
      "Ban Giám Đốc",
      "Trưởng Khối",
      "Trưởng Phòng",
    ].includes(session?.role ?? "");
  const canManage = Boolean(
    session &&
    (catalogNeedsAdmin
      ? session.role === "Administrator"
      : (!restrictedRewardAction && !recruitmentHrOnly) || isHrOrAdmin),
  );
  const workflowCreate =
    name === "people" &&
    (tab.id === "leave" ||
      (tab.id === "transfer-proposals" &&
        ["Administrator", "HR Staff", "Trưởng Phòng"].includes(
          session?.role ?? "",
        )) ||
      (tab.id === "resignation-applications" && session?.role !== "Nhân viên"));
  const workflowEdit =
    name === "people" &&
    tab.id === "transfer-proposals" &&
    ["Administrator", "HR Staff", "Trưởng Phòng"].includes(session?.role ?? "");
  const canCreate = Boolean(
    session &&
    (workflowCreate ||
      (name === "recruitment" &&
        tab.id === "requests" &&
        ["Administrator", "HR Staff", "Trưởng Phòng"].includes(session.role)) ||
      (canManage && canAccess(session, resource, "create"))) &&
    !tab.readOnly &&
    tab.id !== "screenings",
  );
  const canEdit = Boolean(
    session &&
    (workflowEdit ||
      canManageRewardProposal ||
      (canManage && canAccess(session, resource, "edit"))) &&
    editableTabs.has(tab.id) &&
    !(name === "recruitment" && tab.id === "decisions"),
  );
  const canDelete = Boolean(
    session &&
    canManage &&
    canAccess(session, resource, "delete") &&
    !undeletableTabs.has(tab.id) &&
    !tab.readOnly &&
    !(name === "recruitment" && tab.id === "decisions"),
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
    setPendingAvatar(null);
    const values = defaultForm(tab);
    if (tab.id === "requests") {
      values.created_date = new Date().toISOString().slice(0, 10);
      values.is_outside_headcount = "0";
      values.quantity = "1";
      if (session?.employeeId) {
        const employee = lookupQuery.data?.employees.find(
          (item) => String(item.employee_id ?? "") === session.employeeId,
        );
        values.requested_by = session.employeeId;
        values.department_id = String(employee?.department_id ?? "");
      }
    }
    if (tab.id === "quota" || tab.id === "quotas") {
      values.details = "[]";
      values.budget_details = "[]";
      values.status = "Tạo phiếu";
      values.created_date = new Date().toISOString().slice(0, 10);
      values.effective_date = new Date().toISOString().slice(0, 10);
      values.creator_name = session?.name ?? "";
      if (session?.employeeId) {
        const employee = lookupQuery.data?.employees.find(
          (item) => String(item.employee_id ?? "") === session.employeeId,
        );
        values.department_id = String(employee?.department_id ?? "");
      }
    }
    if (tab.id === "candidates") {
      values.candidate_code = `UV/${new Date().getFullYear()}/${String((rowsQuery.data?.length ?? 0) + 1).padStart(4, "0")}`;
      values.received_date = new Date().toISOString().slice(0, 10);
      values.status = "tiếp nhận hồ sơ";
      values.source = "TopCV";
      values.attachments_json = "[]";
    }
    if (tab.id === "employees") {
      values.join_date = new Date().toISOString().slice(0, 10);
      values.gender = "Nam";
      values.employment_status = "WORKING";
      values.level = "Nhân viên";
    }
    if (tab.id === "contracts") {
      values.contract_date = new Date().toISOString().slice(0, 10);
      values.start_date = new Date().toISOString().slice(0, 10);
      values.has_probation = "0";
      values.allowance_details = "[]";
      values.appendices = "[]";
      values.status = "ACTIVE";
    }
    if (tab.id === "transfer-proposals") {
      values.proposal_date = new Date().toISOString().slice(0, 10);
      values.effective_date = new Date().toISOString().slice(0, 10);
      values.decision_type = "Thuyên chuyển";
      values.detail_items = "[]";
      if (session?.employeeId) {
        const employee = lookupQuery.data?.employees.find(
          (item) => String(item.employee_id ?? "") === session.employeeId,
        );
        values.proposer_id = session.employeeId;
        values.proposer_name = String(employee?.full_name ?? "");
        values.proposer_position = String(employee?.position_name ?? "");
        values.proposer_department = String(
          lookupQuery.data?.departments.find(
            (item) =>
              String(item.department_id ?? "") ===
              String(employee?.department_id ?? ""),
          )?.department_name ?? "",
        );
      }
    }
    if (tab.id === "transfer-decisions") {
      values.decision_date = new Date().toISOString().slice(0, 10);
      values.effective_date = new Date().toISOString().slice(0, 10);
      values.decision_type = "Thuyên chuyển";
      values.status = "EXECUTED";
      values.detail_items = "[]";
      if (session?.employeeId) {
        const employee = lookupQuery.data?.employees.find(
          (item) => String(item.employee_id ?? "") === session.employeeId,
        );
        values.creator_id = session.employeeId;
        values.creator_name = String(employee?.full_name ?? session.name ?? "");
        values.creator_position = String(employee?.position_name ?? "");
        values.creator_department = String(
          employee?.department_name ?? session.department ?? "",
        );
      }
    }
    if (tab.id === "interview-evaluations") {
      values.evaluation_date = new Date().toISOString().slice(0, 10);
      values.evaluator_id = session?.employeeId ?? "";
      values.duration_minutes = "30";
      values.level_score = "3";
      values.overall_result = "ĐẠT";
      values.script = JSON.stringify([
        { question: "", expectation: "", answer: "" },
      ]);
      values.criteria = JSON.stringify([
        {
          criteria_type: "Năng lực chuyên môn",
          required_from: "",
          candidate_value: "",
          candidate_description: "",
          is_passed: true,
          note: "",
        },
      ]);
      values.offer = "{}";
    }
    if (name === "recruitment" && tab.id === "decisions") {
      values.decision_date = new Date().toISOString().slice(0, 10);
      values.result = "";
      values.rejection_reason = "";
      values.overall_comment = "";
    }
    if (tab.id === "evaluations") {
      const currentDate = new Date();
      values.evaluation_date = currentDate.toISOString().slice(0, 10);
      values.evaluation_quarter = String(
        Math.floor(currentDate.getMonth() / 3) + 1,
      );
      values.year = String(currentDate.getFullYear());
      values.evaluator_id = session?.employeeId ?? "";
      const criteria = lookupQuery.data?.criteria ?? [];
      values.details = JSON.stringify(
        criteria.length
          ? criteria.map((item) => ({
              criteria_id: item.criteria_id,
              criteria_code: item.criteria_code,
              criteria_name: item.criteria_name,
              weight: item.weight ?? 0,
              score: 0,
              note: "",
            }))
          : [],
      );
    }
    if (name === "rewards" && tab.id === "proposals") {
      values.proposal_date = new Date().toISOString().slice(0, 10);
      values.record_type = "KHEN_THUONG";
      values.proposed_amount = "0";
      values.payment_method = "CASH";
      values.proposed_by_employee_id = session?.employeeId ?? "";
      values.proposed_by = session?.name ?? "";
    }
    if (name === "rewards" && tab.id === "decisions") {
      values.decision_date = new Date().toISOString().slice(0, 10);
      values.effective_date = new Date().toISOString().slice(0, 10);
      values.amount = "0";
      values.decision_by = session?.name ?? "";
    }
    if (name === "people" && tab.id === "leave" && session?.employeeId)
      values.employee_id = session.employeeId;
    if (name === "people" && tab.id === "leave") {
      values.leave_type = "ANNUAL";
      values.details_json = JSON.stringify([
        { date: "", time_option: "Cả ngày", days: 1, note: "" },
      ]);
      values.total_days = "1";
    }
    setFormValues(values);
    setShowForm(true);
  };

  const openEdit = async (row: Row) => {
    let editRow = row;
    if (tab.id === "contracts") {
      try {
        const [detail, appendices] = await Promise.all([
          api.list(`${tab.endpoint}/${rowId(tab, row)}`, { resource }),
          api.list(`${tab.endpoint}/${rowId(tab, row)}/appendices`, {
            resource,
          }),
        ]);
        if (detail[0]) editRow = { ...detail[0], appendices };
      } catch (error) {
        showPopup(
          "error",
          "Không thể tải chi tiết",
          error instanceof Error
            ? error.message
            : "Không thể tải chi tiết hợp đồng.",
        );
        return;
      }
    } else if (tab.id === "interview-evaluations" || tab.id === "screenings") {
      try {
        const detail = await api.list(`${tab.endpoint}/${rowId(tab, row)}`, {
          resource,
        });
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
    setPendingAvatar(null);
    const values = Object.fromEntries(
      tab.fields.map((field) => [
        field.name,
        fieldValue(field, editRow[field.name]),
      ]),
    );
    if (tab.id === "interview-evaluations") {
      values.level_score = normalizeInterviewScore(editRow.level_score);
      values.overall_result = normalizeInterviewResult(editRow.overall_result);
    }
    setFormValues(values);
    setShowForm(true);
  };

  useEffect(() => {
    const requestedEditId = searchParams.get("edit");
    if (
      !requestedEditId ||
      name !== "people" ||
      tab.id !== "employees" ||
      !rowsQuery.data?.length ||
      showForm
    )
      return;
    const row = rowsQuery.data.find(
      (item) => rowId(tab, item) === requestedEditId,
    );
    if (!row) return;
    startTransition(() => {
      void openEdit(row);
    });
    const params = new URLSearchParams(searchParams.toString());
    params.delete("edit");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    // openEdit is intentionally invoked only for the one-time edit deep link.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, pathname, router, rowsQuery.data, searchParams, showForm, tab]);

  const openScreeningForm = (candidate: Row) => {
    const screeningTab = getWorkspaceTab(name, "screenings");
    const position = lookupQuery.data?.positions.find(
      (item) =>
        String(item.position_id ?? "") === String(candidate.position_id ?? ""),
    );
    const values = Object.fromEntries(
      screeningTab.fields.map((field) => [
        field.name,
        field.options?.[0]?.value ?? "",
      ]),
    );
    Object.assign(values, {
      candidate_id: String(candidate.candidate_id ?? ""),
      received_date: fieldValue(
        { name: "received_date", label: "", type: "date" },
        candidate.received_date ?? candidate.created_date,
      ),
      culture_level: String(candidate.culture_level ?? ""),
      education_level: String(candidate.education_level ?? ""),
      education_school: String(candidate.education_school ?? ""),
      position_id: String(candidate.position_id ?? position?.position_id ?? ""),
      department_id: String(
        candidate.department_id ?? position?.department_id ?? "",
      ),
      screening_date: new Date().toISOString().slice(0, 10),
      criteria: JSON.stringify([
        {
          criteria_type: "Năng lực chuyên môn",
          required_from: "",
          candidate_value: "",
          candidate_description: "",
          is_passed: true,
          note: "",
        },
      ]),
    });
    setTabId("screenings");
    setEditingRow(null);
    setFormValues(values);
    setShowForm(true);
  };

  const openDetail = async (row: Row) => {
    if (name === "people" && tab.id === "employees") {
      router.push(`/people/employees/${rowId(tab, row)}`);
      return;
    }
    if (name === "recruitment" && tab.id === "candidates") {
      router.push(`/recruitment/candidates/${rowId(tab, row)}`);
      return;
    }
    setShowDetail(row);
    if (
      ![
        "quota",
        "quotas",
        "employees",
        "transfer-proposals",
        "transfer-decisions",
        "resignation-applications",
        "resignation-decisions",
        "work-history",
        "departments",
        "positions",
        "interview-evaluations",
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
      if (tab.id === "contracts") {
        const [contract, appendices] = await Promise.all([
          api.list(`${tab.endpoint}/${rowId(tab, row)}`, { resource }),
          api.list(`${tab.endpoint}/${rowId(tab, row)}/appendices`, {
            resource,
          }),
        ]);
        if (contract[0]) setShowDetail({ ...contract[0], appendices });
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
      const lookups = (lookupQuery.data ?? {
        departments: [],
        positions: [],
        employees: [],
        quotas: [],
        requests: [],
        plans: [],
        candidates: [],
        screenings: [],
        decisions: [],
        evaluations: [],
      }) as DecisionLookups;
      if (tab.id === "requests") {
        const missingRequestField = [
          "created_date",
          "requested_by",
          "department_id",
          "position_id",
          "quantity",
          "expected_date",
          "reason",
        ].find((field) => !String(formValues[field] ?? "").trim());
        if (
          missingRequestField ||
          (formValues.is_outside_headcount !== "1" && !formValues.quota_id)
        ) {
          showPopup(
            "error",
            "Thiếu thông tin bắt buộc",
            "Vui lòng nhập đầy đủ ngày lập, người lập, bộ phận, vị trí, số lượng, ngày cần người, lý do và phiếu định biên đối với yêu cầu trong định biên.",
          );
          return;
        }
        const check = quotaCheck(formValues, lookups);
        if (formValues.is_outside_headcount !== "1" && !formValues.quota_id) {
          showPopup(
            "error",
            "Thiếu phiếu định biên",
            "Yêu cầu trong định biên bắt buộc phải chọn phiếu định biên.",
          );
          return;
        }
        if (check?.exceeds && formValues.is_outside_headcount !== "1") {
          showPopup(
            "error",
            "Vượt định biên",
            "Số lượng tuyển vượt định biên. Không thể lưu phiếu trong định biên.",
          );
          return;
        }
        if (check?.exceeds && formValues.is_outside_headcount === "1") {
          const confirmed = await requestConfirmation(
            `Cảnh báo: nhu cầu tuyển vượt định biên (${check.current} + ${check.quantity} - ${check.movement} > ${check.target}). Phiếu ngoài định biên vẫn được phép lưu. Tiếp tục?`,
          );
          if (!confirmed) return;
        }
      }
      if (tab.id === "quota" || tab.id === "quotas") {
        const details = parseDetailList(formValues.details);
        const invalidDetail =
          details.length === 0 ||
          details.some((detail) => {
            const hasPosition = [
              "position_id",
              "position_code",
              "position_name",
            ].every((field) => String(detail[field] ?? "").trim());
            const hasValidNumbers = [
              "target_headcount",
              "resignation_count",
              "maternity_count",
              "current_headcount",
              "needed_headcount",
            ].every((field) => {
              const value = Number(detail[field]);
              return Number.isInteger(value) && value >= 0;
            });
            return !hasPosition || !hasValidNumbers;
          });
        if (invalidDetail) {
          showPopup(
            "error",
            "Chi tiết định biên chưa hợp lệ",
            "Vui lòng thêm ít nhất một vị trí, chọn mã vị trí và nhập đầy đủ các chỉ tiêu không âm trong bảng chi tiết.",
          );
          return;
        }
      }
      if (tab.id === "candidates") {
        const missingCandidateField = [
          "full_name",
          "phone",
          "email",
          "recruitment_request_id",
          "position_id",
          "department_id",
          "received_date",
        ].find((field) => !String(formValues[field] ?? "").trim());
        if (missingCandidateField) {
          showPopup(
            "error",
            "Thiếu thông tin bắt buộc",
            "Vui lòng nhập đủ thông tin ứng viên và thông tin ứng tuyển trước khi lưu.",
          );
          return;
        }
        const duplicate = candidateDuplicate(
          formValues,
          lookups.candidates,
          editingRow ? rowId(tab, editingRow) : undefined,
        );
        if (duplicate) {
          showPopup(
            "error",
            "Ứng viên bị trùng",
            `CCCD, số điện thoại hoặc email đã tồn tại ở hồ sơ ${String(duplicate.candidate_code ?? duplicate.full_name ?? "khác")}.`,
          );
          return;
        }
      }
      if (tab.id === "contracts") {
        const missingContractField = [
          "contract_date",
          "signer_id",
          "employee_id",
          "contract_type",
          "start_date",
          "base_salary",
          "social_insurance_salary",
        ].find((field) => !String(formValues[field] ?? "").trim());
        const hasProbation = formValues.has_probation === "1";
        const invalidSalary = ![
          formValues.base_salary,
          formValues.social_insurance_salary,
        ].every(
          (value) => Number.isInteger(Number(value)) && Number(value) >= 0,
        );
        if (
          missingContractField ||
          (hasProbation &&
            (!String(formValues.probation_from_date ?? "").trim() ||
              !String(formValues.probation_to_date ?? "").trim() ||
              !Number(formValues.probation_salary_rate))) ||
          invalidSalary
        ) {
          showPopup(
            "error",
            "Thiếu thông tin bắt buộc",
            "Vui lòng nhập đủ thông tin HĐLĐ, lương không có số lẻ và thông tin thử việc nếu đã tích Có thử việc.",
          );
          return;
        }
      }
      if (tab.id === "transfer-proposals") {
        const detail = parseDetailList(formValues.detail_items)[0] ?? {};
        if (
          !String(formValues.proposal_date ?? "").trim() ||
          !String(formValues.effective_date ?? "").trim() ||
          !String(formValues.decision_type ?? "").trim() ||
          !String(formValues.proposer_id ?? "").trim() ||
          !String(detail.employee_id ?? "").trim()
        ) {
          showPopup(
            "error",
            "Thiếu thông tin bắt buộc",
            "Vui lòng nhập ngày đề xuất, ngày hiệu lực, loại quyết định, người đề xuất và nhân viên cần điều chuyển.",
          );
          return;
        }
      }
      if (tab.id === "transfer-decisions") {
        const detail = parseDetailList(formValues.detail_items)[0] ?? {};
        const requiresTarget = !["Miễn nhiệm"].includes(
          String(formValues.decision_type ?? ""),
        );
        if (
          !String(formValues.decision_date ?? "").trim() ||
          !String(formValues.effective_date ?? "").trim() ||
          !String(formValues.decision_type ?? "").trim() ||
          !String(formValues.creator_id ?? "").trim() ||
          !String(formValues.employee_id ?? detail.employee_id ?? "").trim() ||
          (requiresTarget &&
            (!String(
              formValues.target_department_id ??
                detail.target_department_id ??
                "",
            ).trim() ||
              !String(
                formValues.target_position_id ??
                  detail.target_position_id ??
                  "",
              ).trim()))
        ) {
          showPopup(
            "error",
            "Thiếu thông tin bắt buộc",
            "Vui lòng nhập ngày, số quyết định, loại quyết định, người lập, nhân viên và thông tin đích phù hợp với loại quyết định.",
          );
          return;
        }
      }
      if (tab.id === "evaluations") {
        const details = parseDetailList(formValues.details);
        const missingEvaluationField = [
          "evaluation_date",
          "evaluation_quarter",
          "year",
          "evaluator_id",
          "employee_id",
        ].find((field) => !String(formValues[field] ?? "").trim());
        const invalidDetail =
          details.length === 0 ||
          details.some(
            (detail) =>
              !String(detail.criteria_id ?? "").trim() ||
              Number(detail.weight) <= 0 ||
              !Number.isFinite(Number(detail.score)) ||
              Number(detail.score) < 0 ||
              Number(detail.score) > 10,
          );
        if (missingEvaluationField || invalidDetail) {
          showPopup(
            "error",
            "Thiếu thông tin bắt buộc",
            "Vui lòng nhập đủ kỳ đánh giá, người đánh giá, nhân viên, ít nhất một tiêu chí, trọng số hợp lệ và điểm từ 0 đến 10.",
          );
          return;
        }
      }
      if (name === "people" && tab.id === "leave") {
        const details = parseDetailList(formValues.details_json);
        const invalidLeaveDetail =
          details.length === 0 ||
          details.some(
            (detail) =>
              !String(detail.date ?? "").trim() || Number(detail.days) <= 0,
          );
        if (invalidLeaveDetail) {
          showPopup(
            "error",
            "Thiếu thông tin ngày nghỉ",
            "Vui lòng nhập ít nhất một ngày nghỉ và số ngày hợp lệ cho từng dòng.",
          );
          return;
        }
      }
      if (name === "rewards" && tab.id === "proposals") {
        const missingProposalField = [
          "record_type",
          "employee_id",
          "proposal_date",
          "proposed_by",
          "reason",
        ].find((field) => !String(formValues[field] ?? "").trim());
        if (
          missingProposalField ||
          Number(formValues.proposed_amount ?? 0) < 0
        ) {
          showPopup(
            "error",
            "Thiếu thông tin bắt buộc",
            "Vui lòng chọn loại đề xuất, nhân viên, người đề xuất, ngày đề xuất, số tiền hợp lệ và lý do.",
          );
          return;
        }
      }
      if (name === "rewards" && tab.id === "decisions") {
        const missingDecisionField = [
          "proposal_id",
          "employee_id",
          "decision_type",
          "decision_date",
          "reason",
        ].find((field) => !String(formValues[field] ?? "").trim());
        const proposal = lookups.rewardProposals.find(
          (item) =>
            String(item.proposal_id ?? "") ===
            String(formValues.proposal_id ?? ""),
        );
        if (
          missingDecisionField ||
          !proposal ||
          String(proposal.status ?? "").toUpperCase() !== "APPROVED" ||
          String(proposal.employee_id ?? "") !==
            String(formValues.employee_id ?? "") ||
          String(proposal.record_type ?? "") !==
            String(formValues.decision_type ?? "") ||
          Number(formValues.amount ?? 0) < 0
        ) {
          showPopup(
            "error",
            "Không thể ban hành quyết định",
            "Quyết định phải liên kết với đề xuất đã được duyệt, đúng nhân viên, đúng loại và có số tiền hợp lệ.",
          );
          return;
        }
      }
      if (tab.id === "interview-evaluations") {
        const missingEvaluationField = [
          "evaluation_date",
          "schedule_id",
          "candidate_id",
          "evaluator_id",
          "overall_result",
        ].find((field) => !String(formValues[field] ?? "").trim());
        const score = Number(formValues.level_score);
        if (
          missingEvaluationField ||
          !Number.isFinite(score) ||
          score < 1 ||
          score > 5
        ) {
          showPopup(
            "error",
            "Thiếu thông tin bắt buộc",
            "Vui lòng nhập ngày đánh giá, lịch, ứng viên, người đánh giá và mức độ từ Rất kém đến Tốt.",
          );
          return;
        }
      }
      if (tab.id === "decisions") {
        const missingDecisionField = [
          "candidate_id",
          "interview_eval_id",
          "decision_date",
          "result",
          "overall_comment",
        ].find((field) => !String(formValues[field] ?? "").trim());
        if (
          missingDecisionField ||
          (formValues.result === "KHÔNG ĐẠT" &&
            !String(formValues.rejection_reason ?? "").trim())
        ) {
          showPopup(
            "error",
            "Thiếu thông tin bắt buộc",
            "Vui lòng chọn ứng viên có đánh giá phỏng vấn, ngày quyết định, kết quả, đánh giá chung và lý do bị loại khi kết quả Không đạt.",
          );
          return;
        }
        const evaluation = lookups.evaluations.find(
          (item) =>
            String(item.interview_eval_id ?? "") ===
              formValues.interview_eval_id &&
            String(item.candidate_id ?? "") === formValues.candidate_id,
        );
        const evaluationPassed = ["ĐẠT", "PASSED"].includes(
          String(evaluation?.overall_result ?? "")
            .trim()
            .toUpperCase(),
        );
        if (
          !evaluation ||
          evaluationPassed !==
            (String(formValues.result ?? "")
              .trim()
              .toUpperCase() ===
              "ĐẠT")
        ) {
          showPopup(
            "error",
            "Kết quả không hợp lệ",
            "Kết quả quyết định phải khớp với Đánh giá chung của Phiếu Đánh giá phỏng vấn.",
          );
          return;
        }
      }
      if (tab.id === "screenings") {
        const missingScreeningField = [
          "candidate_id",
          "screening_date",
          "level_score",
          "screening_result",
        ].find((field) => !String(formValues[field] ?? "").trim());
        const score = Number(formValues.level_score);
        if (
          missingScreeningField ||
          !Number.isFinite(score) ||
          score < 0 ||
          score > 10
        ) {
          showPopup(
            "error",
            "Thiếu thông tin bắt buộc",
            "Vui lòng chọn ứng viên, nhập ngày sơ loại, mức độ phù hợp từ 0 đến 10 và kết quả.",
          );
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
        label: String(item.department_name ?? ""),
      }));
    if (tab.id === "requests" && field.name === "position_id")
      return lookup.positions.map((item) => ({
        value: String(item.position_id ?? ""),
        label: String(item.position_name ?? ""),
      }));
    if (tab.id === "requests" && field.name === "requested_by")
      return lookup.employees.map((item) => ({
        value: String(item.employee_id ?? ""),
        label: String(item.full_name ?? ""),
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
      ["employee_id", "evaluator_id", "proposed_by_employee_id"].includes(
        field.name,
      )
    )
      return employeeOptions;
    if (
      name === "rewards" &&
      tab.id === "decisions" &&
      field.name === "proposal_id"
    )
      return lookup.rewardProposals
        .filter((item) => item.status === "APPROVED")
        .map((item) => ({
          value: String(item.proposal_id ?? ""),
          label:
            `${item.proposal_code ?? ""} ${item.employee_name ?? ""}`.trim(),
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
          {canCreate && (
            <Button onClick={openCreate}>
              <Plus size={16} /> Thêm mới {tab.label.toLowerCase()}
            </Button>
          )}
        </div>
      </section>

      {isContractWorkspace && (
        <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-100 bg-white p-2 shadow-sm">
          {contractSections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => selectContractSection(section.id)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${tab.id === section.id ? "bg-teal-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}
            >
              {section.label}
            </button>
          ))}
        </div>
      )}

      <Card>
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
              <Button
                type="button"
                variant={showFilters ? "soft" : "secondary"}
                size="sm"
                onClick={() => setShowFilters((visible) => !visible)}
              >
                <SlidersHorizontal size={14} /> Lọc
              </Button>
            </div>
          </div>
          {showFilters && (
            <div className="grid gap-3 border-b border-slate-100 bg-slate-50/60 p-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="text-xs font-bold text-slate-600">
                Trạng thái
                <select
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value);
                    setPage(1);
                  }}
                  className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-normal text-slate-700"
                >
                  <option value="">Tất cả trạng thái</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {statusField?.options?.find((option) => option.value === status)?.label ?? status}
                    </option>
                  ))}
                </select>
              </label>
              {isProposalTab && (
                <>
                  <label className="text-xs font-bold text-slate-600">
                    Mã đề xuất
                    <Input
                      value={proposalCodeFilter}
                      onChange={(event) => {
                        setProposalCodeFilter(event.target.value);
                        setPage(1);
                      }}
                      className="mt-1.5 h-10 text-xs font-normal"
                      placeholder="Nhập mã đề xuất"
                    />
                  </label>
                  <label className="text-xs font-bold text-slate-600">
                    Loại đề xuất
                    <select
                      value={proposalTypeFilter}
                      onChange={(event) => {
                        setProposalTypeFilter(event.target.value);
                        setPage(1);
                      }}
                      className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-normal text-slate-700"
                    >
                      <option value="">Tất cả loại</option>
                      <option value="KHEN_THUONG">Khen thưởng</option>
                      <option value="KY_LUAT">Kỷ luật</option>
                    </select>
                  </label>
                  <label className="text-xs font-bold text-slate-600">
                    Từ ngày đề xuất
                    <Input
                      type="date"
                      value={proposalDateFrom}
                      onChange={(event) => {
                        setProposalDateFrom(event.target.value);
                        setPage(1);
                      }}
                      className="mt-1.5 h-10 text-xs font-normal"
                    />
                  </label>
                  <label className="text-xs font-bold text-slate-600">
                    Đến ngày đề xuất
                    <Input
                      type="date"
                      value={proposalDateTo}
                      onChange={(event) => {
                        setProposalDateTo(event.target.value);
                        setPage(1);
                      }}
                      className="mt-1.5 h-10 text-xs font-normal"
                    />
                  </label>
                  <label className="text-xs font-bold text-slate-600">
                    Quản lý bộ phận
                    <select
                      value={proposalManagerFilter}
                      onChange={(event) => {
                        setProposalManagerFilter(event.target.value);
                        setPage(1);
                      }}
                      className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-normal text-slate-700"
                    >
                      <option value="">Tất cả quản lý</option>
                      {departmentManagerOptions.map((manager) => (
                        <option key={manager.manager_id} value={manager.manager_id}>
                          {manager.manager_name}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              )}
              <label className="text-xs font-bold text-slate-600">
                Bộ phận
                <select
                  value={departmentFilter}
                  onChange={(event) => {
                    setDepartmentFilter(event.target.value);
                    setPage(1);
                  }}
                  className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-normal text-slate-700"
                >
                  <option value="">Tất cả bộ phận</option>
                  {(lookupData?.departments ?? []).map((department) => (
                    <option key={String(department.department_id)} value={String(department.department_id)}>
                      {String(department.department_name ?? department.department_id ?? "")}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-bold text-slate-600">
                Vị trí
                <select
                  value={positionFilter}
                  onChange={(event) => {
                    setPositionFilter(event.target.value);
                    setPage(1);
                  }}
                  className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-normal text-slate-700"
                >
                  <option value="">Tất cả vị trí</option>
                  {(lookupData?.positions ?? []).map((position) => (
                    <option key={String(position.position_id)} value={String(position.position_id)}>
                      {String(position.position_name ?? position.position_id ?? "")}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-end justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStatusFilter("");
                    setDepartmentFilter("");
                    setPositionFilter("");
                    setProposalCodeFilter("");
                    setProposalTypeFilter("");
                    setProposalManagerFilter("");
                    setProposalDateFrom("");
                    setProposalDateTo("");
                    setPage(1);
                  }}
                >
                  Xóa bộ lọc
                </Button>
              </div>
            </div>
          )}
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
                            {column.key === "candidate_name" ? (
                              displayValue(row[column.key])
                            ) : column.key === "status" ||
                            column.key === "employment_status" ||
                            column.key === "decision_type" ||
                            column.key === "record_type" ? (
                              <Badge
                                tone={
                                  String(row[column.key]).includes("REJECT") ||
                                  String(row[column.key]).includes("KỶ") ||
                                  String(row[column.key]).includes("KY_LUAT") ||
                                  String(row[column.key]).includes("DISCIPLINE")
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
                            !(lookupQuery.data?.screenings ?? []).some(
                              (screening) =>
                                String(screening.candidate_id ?? "") ===
                                String(row.candidate_id ?? ""),
                            ) && (
                              <Button
                                variant="soft"
                                size="sm"
                                onClick={() => openScreeningForm(row)}
                                title="Mở phiếu sơ loại"
                              >
                                Sơ loại
                              </Button>
                            )}
                          {(tab.id === "candidates" ||
                            tab.id === "decisions") &&
                            canManage &&
                            canAccess(session, resource, "create") &&
                            !isCandidateWorking(row.status) &&
                            !isCandidateWorking(row.candidate_status) &&
                             (lookupQuery.data?.decisions ?? []).some(
                               (decision) =>
                                String(decision.candidate_id ?? "") ===
                                  String(row.candidate_id ?? "") &&
                                String(decision.result ?? "")
                                  .trim()
                                  .toUpperCase() === "ĐẠT" &&
                                String(decision.status ?? "COMPLETED") ===
                                  "COMPLETED",
                             ) && (
                               <Button
                                 variant="soft"
                                 size="sm"
                                 onClick={() => openConversionForm(row)}
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
                Hiển thị {pageOffset + 1}-
                {Math.min(pageOffset + pageSize, rows.length)} trên{" "}
                {rows.length} bản ghi
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
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
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
              {tab.id === "contracts" ? (
                <ContractForm
                  values={formValues}
                  setValues={setFormValues}
                  lookups={
                    (lookupQuery.data ?? {
                      departments: [],
                      positions: [],
                      employees: [],
                      quotas: [],
                      contractTypes: [],
                    }) as ContractLookups
                  }
                />
              ) : tab.id === "transfer-proposals" ? (
                <TransferProposalForm
                  values={formValues}
                  setValues={setFormValues}
                  lookups={
                    (lookupQuery.data ?? {
                      departments: [],
                      positions: [],
                      employees: [],
                      quotas: [],
                    }) as RequestLookups
                  }
                  session={session}
                />
              ) : tab.id === "transfer-decisions" ? (
                <TransferDecisionForm
                  values={formValues}
                  setValues={setFormValues}
                  lookups={
                    (lookupQuery.data ?? {
                      departments: [],
                      positions: [],
                      employees: [],
                      quotas: [],
                      transferProposals: [],
                    }) as TransferDecisionLookups
                  }
                  session={session}
                />
              ) : tab.id === "evaluations" ? (
                <EvaluationForm
                  values={formValues}
                  setValues={setFormValues}
                  lookups={
                    (lookupQuery.data ?? {
                      departments: [],
                      positions: [],
                      employees: [],
                      quotas: [],
                      criteria: [],
                    }) as EvaluationFormLookups
                  }
                  session={session}
                />
              ) : tab.id === "proposals" && name === "rewards" ? (
                <RewardProposalForm
                  values={formValues}
                  setValues={setFormValues}
                  lookups={
                    (lookupQuery.data ?? {
                      departments: [],
                      positions: [],
                      employees: [],
                      quotas: [],
                    }) as RequestLookups
                  }
                  session={session}
                />
              ) : tab.id === "decisions" && name === "rewards" ? (
                <RewardDecisionForm
                  values={formValues}
                  setValues={setFormValues}
                  lookups={
                    (lookupQuery.data ?? {
                      departments: [],
                      positions: [],
                      employees: [],
                      quotas: [],
                      rewardProposals: [],
                    }) as RewardDecisionLookups
                  }
                  session={session}
                />
              ) : tab.id === "leave" && name === "people" ? (
                <LeaveForm
                  values={formValues}
                  setValues={setFormValues}
                  lookups={
                    (lookupQuery.data ?? {
                      departments: [],
                      positions: [],
                      employees: [],
                      quotas: [],
                    }) as RequestLookups
                  }
                  session={session}
                />
              ) : tab.id === "employees" ? (
                <EmployeeForm
                  values={formValues}
                  setValues={setFormValues}
                  lookups={
                    (lookupQuery.data ?? {
                      departments: [],
                      positions: [],
                      employees: [],
                      quotas: [],
                      candidates: [],
                    }) as EmployeeLookups
                  }
                  avatarUrl={
                    typeof editingRow?.avatar_url === "string"
                      ? editingRow.avatar_url
                      : undefined
                  }
                  avatarFile={pendingAvatar}
                  onAvatarChange={setPendingAvatar}
                />
              ) : tab.id === "requests" ? (
                <RecruitmentRequestForm
                  values={formValues}
                  setValues={setFormValues}
                  lookups={
                    (lookupQuery.data ?? {
                      departments: [],
                      positions: [],
                      employees: [],
                      quotas: [],
                    }) as RequestLookups
                  }
                />
              ) : tab.id === "quota" || tab.id === "quotas" ? (
                <QuotaForm
                  values={formValues}
                  setValues={setFormValues}
                  tab={tab}
                  lookups={
                    (lookupQuery.data ?? {
                      departments: [],
                      positions: [],
                      employees: [],
                      quotas: [],
                    }) as RequestLookups
                  }
                />
              ) : tab.id === "candidates" ? (
                <CandidateForm
                  values={formValues}
                  setValues={setFormValues}
                  lookups={
                    (lookupQuery.data ?? {
                      departments: [],
                      positions: [],
                      employees: [],
                      quotas: [],
                      requests: [],
                      plans: [],
                      candidates: [],
                      screenings: [],
                      decisions: [],
                    }) as CandidateLookups
                  }
                />
              ) : tab.id === "screenings" ? (
                <ScreeningForm
                  values={formValues}
                  setValues={setFormValues}
                  lookups={
                    (lookupQuery.data ?? {
                      departments: [],
                      positions: [],
                      employees: [],
                      quotas: [],
                      requests: [],
                      plans: [],
                      candidates: [],
                      screenings: [],
                      decisions: [],
                    }) as CandidateLookups
                  }
                />
              ) : tab.id === "interview-evaluations" ? (
                <InterviewEvaluationForm
                  values={formValues}
                  setValues={setFormValues}
                  lookups={
                    (lookupQuery.data ?? {
                      departments: [],
                      positions: [],
                      employees: [],
                      quotas: [],
                      requests: [],
                      plans: [],
                      candidates: [],
                      screenings: [],
                      decisions: [],
                      schedules: [],
                      offers: [],
                    }) as EvaluationLookups
                  }
                  session={session}
                  onViewCandidate={(candidate) => {
                    setShowForm(false);
                    router.push(`/recruitment/candidates/${String(candidate.candidate_id ?? "")}`);
                  }}
                />
              ) : tab.id === "decisions" && name === "recruitment" ? (
                <RecruitmentDecisionForm
                  values={formValues}
                  setValues={setFormValues}
                  lookups={
                    (lookupQuery.data ?? {
                      departments: [],
                      positions: [],
                      employees: [],
                      quotas: [],
                      requests: [],
                      plans: [],
                      candidates: [],
                      screenings: [],
                      decisions: [],
                      evaluations: [],
                    }) as DecisionLookups
                  }
                  onViewCandidate={(candidate) => {
                    setShowForm(false);
                    router.push(`/recruitment/candidates/${String(candidate.candidate_id ?? "")}`);
                  }}
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
                        current
                          ? { ...current, avatar_url: avatarUrl }
                          : current,
                      );
                      showPopup(
                        "success",
                        "Thành công",
                        "Đã cập nhật ảnh hồ sơ trên Pinata.",
                      );
                      queryClient.invalidateQueries({
                        queryKey: ["workspace", name],
                      });
                    }}
                  />
                </div>
              )}
              {tab.id === "quota" || tab.id === "quotas" ? (
                <QuotaDetail row={showDetail} />
              ) : [
                  "employees",
                  "contracts",
                  "transfer-proposals",
                  "transfer-decisions",
                ].includes(tab.id) ||
                (name === "rewards" &&
                  [
                    "criteria",
                    "evaluations",
                    "proposals",
                    "decisions",
                  ].includes(tab.id)) ||
                (name === "recruitment" &&
                  ["screenings", "schedules", "interview-evaluations", "decisions"].includes(
                    tab.id,
                  )) ? (
                <StructuredDetail
                  name={name}
                  tab={tab}
                  row={showDetail}
                  lookups={lookupData}
                />
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
                        {isStructuredDetailValue(key, value) ? (
                          <div className="max-h-80 overflow-auto whitespace-pre-wrap break-words text-sm leading-5">
                            {displayDetailValue(tab, key, value)}
                          </div>
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
      {conversionForm && lookupData && (
        <EmployeeConversionForm
          candidate={conversionForm.row}
          employeeValues={conversionForm.employee}
          setEmployeeValues={(updater) =>
            setConversionForm((current) =>
              current
                ? { ...current, employee: updater(current.employee) }
                : current,
            )
          }
          contractValues={conversionForm.contract}
          setContractValues={(updater) =>
            setConversionForm((current) =>
              current
                ? { ...current, contract: updater(current.contract) }
                : current,
            )
          }
          lookups={lookupData as ConversionLookups}
          avatarFile={conversionForm.avatarFile}
          onAvatarChange={(file) =>
            setConversionForm((current) =>
              current ? { ...current, avatarFile: file } : current,
            )
          }
          onClose={() => setConversionForm(null)}
          onSubmit={submitConversion}
          isPending={actionMutation.isPending}
        />
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
          message={
            rowsQuery.error instanceof ApiError
              ? rowsQuery.error.message
              : "Không thể tải dữ liệu. Kiểm tra kết nối backend."
          }
          onClose={() => setDismissedQueryError(rowsQuery.error)}
        />
      )}
    </div>
  );
}

type JsonItemField = {
  key: string;
  label: string;
  type?: "text" | "number" | "checkbox" | "file";
  aliases?: string[];
  urlKey?: string;
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
      {
        key: "resignation_count",
        label: "Số lao động nghỉ việc",
        type: "number",
      },
      {
        key: "maternity_count",
        label: "Số lao động nghỉ thai sản",
        type: "number",
      },
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
      {
        key: "resignation_count",
        label: "Số lao động nghỉ việc",
        type: "number",
      },
      {
        key: "maternity_count",
        label: "Số lao động nghỉ thai sản",
        type: "number",
      },
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
      {
        key: "exam_file_name",
        label: "Tệp đề thi",
        type: "file",
        aliases: ["exam_file"],
        urlKey: "exam_file_url",
      },
      {
        key: "answer_file_name",
        label: "Tệp đáp án",
        type: "file",
        aliases: ["answer_file"],
        urlKey: "answer_file_url",
      },
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
  "transfer-decisions.detail_items": {
    itemLabel: "nhân sự",
    fields: [
      { key: "employee_id", label: "Mã nhân viên" },
      { key: "current_department_id", label: "Mã bộ phận hiện tại" },
      { key: "current_position_id", label: "Mã vị trí hiện tại" },
      { key: "target_department_id", label: "Mã bộ phận mới" },
      { key: "target_position_id", label: "Mã vị trí mới" },
      { key: "manager_id", label: "Quản lý trực tiếp mới" },
      { key: "note", label: "Ghi chú" },
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
      error:
        "Dữ liệu chi tiết cũ không hợp lệ. Vui lòng nhập lại các dòng bên dưới.",
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
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<{
    key: string;
    message: string;
  } | null>(null);
  const updateItems = (nextItems: Array<Record<string, unknown>>) =>
    onChange(JSON.stringify(nextItems));
  const itemValue = (item: Record<string, unknown>, field: JsonItemField) =>
    item[field.key] ??
    field.aliases
      ?.map((alias) => item[alias])
      .find((aliasValue) => aliasValue !== undefined && aliasValue !== null) ??
    "";
  const addItem = () =>
    updateItems([
      ...items,
      Object.fromEntries(
        schema.fields.map((itemField) => [
          itemField.key,
          itemField.type === "number"
            ? 0
            : itemField.type === "checkbox"
              ? false
              : "",
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
          <div
            key={index}
            className="rounded-xl border border-slate-200 bg-slate-50/70 p-3"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">
                {schema.itemLabel.charAt(0).toUpperCase() +
                  schema.itemLabel.slice(1)}{" "}
                {index + 1}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  updateItems(
                    items.filter((_, itemIndex) => itemIndex !== index),
                  )
                }
              >
                <Trash2 size={14} /> Xóa
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {schema.fields.map((itemField) => (
                <label
                  key={itemField.key}
                  className="block text-xs font-bold text-slate-600"
                >
                  {itemField.type === "checkbox" ? (
                    <span className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 font-medium">
                      <input
                        type="checkbox"
                        checked={Boolean(itemValue(item, itemField))}
                        onChange={(event) => {
                          const nextItems = [...items];
                          nextItems[index] = {
                            ...item,
                            [itemField.key]: event.target.checked,
                          };
                          updateItems(nextItems);
                        }}
                      />
                      {itemField.label}
                    </span>
                  ) : itemField.type === "file" ? (
                    <>
                      <span className="mb-1.5 block">{itemField.label}</span>
                      {(() => {
                        const uploadKey = `${index}:${itemField.key}`;
                        return (
                          <>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.zip"
                        disabled={uploadingKey === uploadKey}
                        onChange={async (event) => {
                          const file = event.target.files?.[0];
                          if (!file) return;
                          setUploadingKey(uploadKey);
                          setUploadError(null);
                          try {
                            const uploaded = await api.uploadInterviewFile(file);
                            const nextItems = [...items];
                            const nextItem = {
                              ...item,
                              [itemField.key]: uploaded.fileName || file.name,
                            };
                            for (const alias of itemField.aliases ?? [])
                              delete nextItem[alias];
                            if (itemField.urlKey)
                              nextItem[itemField.urlKey] = uploaded.fileUrl;
                            nextItems[index] = nextItem;
                            updateItems(nextItems);
                          } catch (error) {
                            setUploadError({
                              key: uploadKey,
                              message:
                                error instanceof Error
                                  ? error.message
                                  : "Không thể tải tệp lên.",
                            });
                          } finally {
                            setUploadingKey(null);
                          }
                        }}
                        className="block h-10 w-full rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-normal outline-none file:mr-2 file:rounded-lg file:border-0 file:bg-teal-50 file:px-2 file:py-1 file:text-xs file:font-bold file:text-teal-700 hover:file:bg-teal-100"
                      />
                      <span className="mt-1 block truncate text-[11px] font-normal text-slate-500">
                        {uploadingKey === uploadKey
                          ? "Đang tải file lên..."
                          : String(itemValue(item, itemField) || "Chưa chọn file")}
                      </span>
                      {uploadError?.key === uploadKey && (
                        <span className="mt-1 block text-[11px] font-normal text-rose-600">
                          {uploadError.message}
                        </span>
                      )}
                          </>
                        );
                      })()}
                    </>
                  ) : (
                    <>
                      <span className="mb-1.5 block">{itemField.label}</span>
                      <input
                        type={itemField.type === "number" ? "number" : "text"}
                        value={String(itemValue(item, itemField))}
                        onChange={(event) => {
                          const nextValue =
                            itemField.type === "number" &&
                            event.target.value !== ""
                              ? Number(event.target.value)
                              : event.target.value;
                          const nextItems = [...items];
                          nextItems[index] = {
                            ...item,
                            [itemField.key]: nextValue,
                          };
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
          Chưa có {schema.itemLabel}. Chọn “Thêm {schema.itemLabel}” để khai
          báo.
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
