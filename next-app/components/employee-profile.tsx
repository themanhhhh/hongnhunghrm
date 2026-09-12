"use client";

import { ArrowLeft, BriefcaseBusiness, CalendarDays, FileText, Pencil, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { api } from "@/lib/api";
import { canAccess, type Session } from "@/lib/permissions";
import { getStoredSession, subscribeToSession } from "@/lib/session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

type Row = Record<string, unknown>;
type ProfileTab = "basic" | "onboarding" | "contact" | "contracts" | "history" | "rewards";

function valueOf(value: unknown) {
  return value === null || value === undefined || value === "" ? "-" : String(value);
}

function dateOf(value: unknown) {
  return formatDate(value, "-");
}

function moneyOf(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  return `${Number(value).toLocaleString("vi-VN")} VNĐ`;
}

function mappedValue(key: string, value: unknown) {
  const labels: Record<string, string> = {
    ACTIVE: "Đang hiệu lực",
    COMPLETED: "Hoàn tất",
    WORKING: "Đang làm việc",
    RESIGNED: "Nghỉ việc",
    KHEN_THUONG: "Khen thưởng",
    KY_LUAT: "Kỷ luật",
    REWARD: "Khen thưởng",
    DISCIPLINE: "Kỷ luật",
  };
  return labels[String(value)] ?? valueOf(value);
}

function cellOf(key: string, value: unknown, type?: "date" | "money") {
  if (type === "date") return dateOf(value);
  if (type === "money") return moneyOf(value);
  return mappedValue(key, value);
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(-2).map((part) => part[0]).join("").toUpperCase() || "NV";
}

function InfoGrid({ items }: { items: Array<[string, unknown, ("date" | "money")?]> }) {
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{items.map(([label, value, type]) => <div key={label} className="rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2.5"><div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</div><div className="mt-1 break-words text-xs font-medium text-slate-700">{type === "date" ? dateOf(value) : type === "money" ? moneyOf(value) : valueOf(value)}</div></div>)}</div>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="space-y-3"><div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-bold text-slate-800"><span className="size-1.5 rounded-full bg-teal-500" />{title}</div>{children}</section>;
}

function DataTable({ columns, rows, empty }: { columns: Array<[string, string, ("date" | "money")?]>; rows: Row[]; empty: string }) {
  return <div className="overflow-x-auto rounded-lg border border-slate-100"><table className="w-full min-w-[720px] text-left text-xs"><thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400"><tr>{columns.map(([key, label]) => <th key={key} className="px-3 py-2.5 font-bold">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{rows.length ? rows.map((row, index) => <tr key={String(row.id ?? row.contract_id ?? row.work_history_id ?? row.reward_discipline_id ?? index)}>{columns.map(([key, , type]) => <td key={key} className="px-3 py-3 align-top text-slate-700">{cellOf(key, row[key], type)}</td>)}</tr>) : <tr><td colSpan={columns.length} className="px-3 py-8 text-center text-slate-400">{empty}</td></tr>}</tbody></table></div>;
}

export function EmployeeProfile({ employeeId }: { employeeId: string }) {
  const router = useRouter();
  const session = useSyncExternalStore(subscribeToSession, getStoredSession, () => null) as Session | null;
  const [activeTab, setActiveTab] = useState<ProfileTab>("basic");
  const employeeQuery = useQuery({
    queryKey: ["employee-profile", employeeId],
    queryFn: async () => (await api.list(`/hr/employees/${employeeId}`, { resource: "people" }))[0] as Row | undefined,
  });
  const employee = employeeQuery.data;
  const contracts = Array.isArray(employee?.contracts) ? employee.contracts as Row[] : [];
  const workHistory = Array.isArray(employee?.workHistory) ? employee.workHistory as Row[] : [];
  const rewards = Array.isArray(employee?.rewards) ? employee.rewards as Row[] : [];
  const leaveBalances = Array.isArray(employee?.leaveBalances) ? employee.leaveBalances as Row[] : [];
  const fullName = String(employee?.full_name ?? "Nhân viên");
  const deleteMutation = useMutation({
    mutationFn: () => api.remove(`/hr/employees/${employeeId}`, { resource: "people", action: "delete" }),
    onSuccess: () => router.push("/people?tab=employees"),
  });
  const tabs: Array<[ProfileTab, string, typeof UserRound]> = [["basic", "1. Thông tin cơ bản", UserRound], ["onboarding", "2. Thông tin tiếp nhận ban đầu", CalendarDays], ["contact", "3. Thông tin liên hệ", BriefcaseBusiness], ["contracts", "4. Hợp đồng lao động", FileText], ["history", "5. Quá trình công tác", CalendarDays], ["rewards", "6. Khen thưởng / Kỷ luật", ShieldCheck]];

  if (employeeQuery.isLoading) return <div className="grid min-h-[60vh] place-items-center text-sm text-slate-400">Đang tải hồ sơ nhân sự...</div>;
  if (employeeQuery.error || !employee) return <div className="space-y-4"><Button variant="secondary" onClick={() => router.push("/people?tab=employees")}><ArrowLeft size={15} /> Quay lại</Button><Card className="p-8 text-center text-sm text-rose-600">Không thể tải hồ sơ nhân sự.</Card></div>;

  return <div className="space-y-4"><div className="flex flex-col justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center"><div className="flex items-center gap-3"><Button variant="secondary" size="sm" onClick={() => router.push("/people?tab=employees")}><ArrowLeft size={14} /> Quay lại</Button><div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-teal-100 text-sm font-bold text-teal-700">{employee.avatar_url ? <Image src={String(employee.avatar_url)} alt={`Ảnh ${fullName}`} width={40} height={40} unoptimized className="size-full object-cover" /> : initials(fullName)}</div><div><h1 className="text-sm font-bold text-slate-900">Chi tiết hồ sơ nhân sự: {fullName} <span className="font-mono text-slate-500">({valueOf(employee.employee_code)})</span></h1><p className="mt-0.5 text-[10px] text-slate-400">Quản lý thông tin định danh, cá nhân, phòng ban, chức vụ và trạng thái làm việc</p></div><Badge tone="teal">{employee.employment_status === "WORKING" ? "Đang làm việc" : valueOf(employee.employment_status)}</Badge></div><div className="flex gap-2"><Button variant="secondary" size="sm" disabled={!canAccess(session, "people", "edit")} onClick={() => router.push(`/people?tab=employees&edit=${encodeURIComponent(employeeId)}`)}><Pencil size={14} /> Sửa</Button><Button variant="destructive" size="sm" disabled={!canAccess(session, "people", "delete")} onClick={() => { if (window.confirm(`Xóa hồ sơ ${fullName}?`)) deleteMutation.mutate(); }}><Trash2 size={14} /> {deleteMutation.isPending ? "Đang xóa..." : "Xóa hồ sơ"}</Button></div></div>
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm"><div className="flex min-w-max gap-1 p-1.5">{tabs.map(([key, label, Icon]) => <button key={key} type="button" onClick={() => setActiveTab(key)} className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-[10px] font-bold transition ${activeTab === key ? "bg-teal-50 text-teal-700 ring-1 ring-teal-200" : "text-slate-500 hover:bg-slate-50"}`}><Icon size={12} />{label}</button>)}</div></div>
    <Card className="p-4 sm:p-5">{activeTab === "basic" && <div className="space-y-5"><Section title="Thông tin cá nhân"><InfoGrid items={[["Mã nhân viên", employee.employee_code], ["Họ và tên", employee.full_name], ["Tên viết tắt", employee.short_name], ["Giới tính", employee.gender], ["Ngày sinh", employee.date_of_birth, "date"], ["Nơi sinh", employee.place_of_birth], ["Dân tộc", employee.ethnicity], ["Quốc tịch", employee.nationality], ["Tình trạng hôn nhân", employee.marital_status], ["Số CCCD", employee.citizen_id], ["Ngày cấp CCCD", employee.citizen_issue_date, "date"], ["Nơi cấp CCCD", employee.citizen_issue_place]]} /></Section><Section title="Thông tin công việc"><InfoGrid items={[["Phòng ban", employee.department_name], ["Vị trí", employee.position_name], ["Quản lý trực tiếp", employee.manager_name], ["Cấp bậc", employee.level], ["Trạng thái làm việc", employee.employment_status], ["Ngày vào làm", employee.join_date, "date"], ["Ngày chính thức", employee.official_date, "date"], ["Ngày nghỉ việc", employee.resignation_date, "date"]]} /></Section></div>}
      {activeTab === "onboarding" && <div className="space-y-5"><Section title="Thông tin tiếp nhận ban đầu"><InfoGrid items={[["Ngày vào làm", employee.join_date, "date"], ["Ngày ký hợp đồng đầu tiên", employee.initial_contract_date, "date"], ["Mã ứng viên", employee.candidate_id], ["Phòng ban tiếp nhận", employee.department_name], ["Vị trí tiếp nhận", employee.position_name], ["Quản lý trực tiếp", employee.manager_name], ["Trạng thái", employee.employment_status]]} /></Section><Section title="Tình trạng phép năm"><DataTable columns={[["leave_year", "Năm"], ["entitled_days", "Được hưởng"], ["used_days", "Đã dùng"], ["remaining_days", "Còn lại"]]} rows={leaveBalances} empty="Chưa có dữ liệu phép năm." /></Section></div>}
      {activeTab === "contact" && <div className="space-y-5"><Section title="Thông tin liên hệ"><InfoGrid items={[["Điện thoại", employee.phone], ["Email công ty", employee.company_email ?? employee.email], ["Email cá nhân", employee.personal_email], ["Địa chỉ hiện tại", employee.address], ["Địa chỉ thường trú", employee.permanent_address], ["Người liên hệ khẩn cấp", employee.emergency_contact_name], ["Quan hệ", employee.emergency_contact_relationship], ["Số điện thoại khẩn cấp", employee.emergency_contact_phone]]} /></Section><Section title="Thông tin tài chính và bảo hiểm"><InfoGrid items={[["Mã số thuế", employee.tax_code], ["Số tài khoản", employee.bank_account_number], ["Chủ tài khoản", employee.bank_account_holder], ["Ngân hàng", employee.bank_name], ["Chi nhánh", employee.bank_branch]]} /></Section></div>}
      {activeTab === "contracts" && <Section title="Toàn bộ hợp đồng lao động đã ký"><DataTable columns={[["contract_id", "Mã hợp đồng"], ["contract_no", "Số hợp đồng"], ["employee_id", "Mã nhân viên"], ["employee_name", "Nhân viên"], ["contract_type", "Loại hợp đồng"], ["contract_date", "Ngày hợp đồng", "date"], ["sign_date", "Ngày ký", "date"], ["start_date", "Ngày bắt đầu", "date"], ["end_date", "Ngày kết thúc", "date"], ["status", "Trạng thái"]]} rows={contracts} empty="Nhân sự chưa có hợp đồng lao động." /></Section>}
      {activeTab === "history" && <Section title="Toàn bộ quá trình công tác"><DataTable columns={[["effective_date", "Ngày hiệu lực", "date"], ["decision_type", "Loại biến động"], ["department_name", "Bộ phận"], ["position_name", "Vị trí"], ["reason", "Lý do"], ["note", "Ghi chú"]]} rows={workHistory} empty="Chưa có dữ liệu quá trình công tác." /></Section>}
      {activeTab === "rewards" && <Section title="Khen thưởng / Kỷ luật"><DataTable columns={[["decision_no", "Số quyết định"], ["decision_type", "Loại"], ["decision_date", "Ngày", "date"], ["amount", "Số tiền", "money"], ["reason", "Lý do"], ["decision_by", "Người ký"]]} rows={rewards} empty="Chưa có dữ liệu khen thưởng hoặc kỷ luật." /></Section>}
    </Card>
  </div>;
}
