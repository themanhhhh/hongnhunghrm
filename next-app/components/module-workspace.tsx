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

function ReportsWorkspace() {
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
        const [records, evaluations] = await Promise.all([
          api.list("/reward-discipline", { resource }),
          api.list("/reward-discipline/evaluations", { resource }),
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
        contracts,
        contractProposals,
        leaveApplications,
        transferProposals,
        resignationApplications,
        criteria,
      ] = await Promise.all([
        api.list("/admin/departments", { resource }),
        api.list("/admin/positions", { resource }),
        api.list("/hr/employees", { resource }),
        api.list("/recruitment/requests", { resource }),
        api.list("/recruitment/plans", { resource }),
        api.list("/recruitment/candidates", { resource }),
        api.list("/recruitment/interview-schedules", { resource }),
        api.list("/hr/contracts", { resource }),
        api.list("/hr/contract-proposals", { resource }),
        api.list("/hr/leave-applications", { resource }),
        api.list("/hr/transfer-proposals", { resource }),
        api.list("/hr/resignation-applications", { resource }),
        api.list("/reward-discipline/criteria", { resource }),
      ]);
      return {
        departments,
        positions,
        employees,
        requests,
        plans,
        candidates,
        schedules,
        contracts,
        contractProposals,
        leaveApplications,
        transferProposals,
        resignationApplications,
        criteria,
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
    (workflowCreate || (canManage && canAccess(session, resource, "create"))) &&
    !tab.readOnly &&
    !tab.convert,
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
    if (name === "people" && tab.id === "leave" && session?.employeeId)
      values.employee_id = session.employeeId;
    setFormValues(values);
    setShowForm(true);
  };

  const openEdit = async (row: Row) => {
    let editRow = row;
    if (tab.id === "interview-evaluations") {
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
            : "Không thể tải chi tiết đánh giá phỏng vấn.",
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
                          {tab.convert &&
                            canManage &&
                            canAccess(session, resource, "create") && (
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
