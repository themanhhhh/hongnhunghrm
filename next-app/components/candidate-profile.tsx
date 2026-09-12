"use client";

import { ArrowLeft, Mail, Pencil, Phone, Trash2, UserRound } from "lucide-react";
import { useSyncExternalStore } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { canAccess, type Session } from "@/lib/permissions";
import { getStoredSession, subscribeToSession } from "@/lib/session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { normalizeCandidateStatus } from "@/lib/candidate-status";
import { formatDate } from "@/lib/utils";

type Row = Record<string, unknown>;

function valueOf(value: unknown) {
  return value === null || value === undefined || value === "" ? "-" : String(value);
}

function dateOf(value: unknown) {
  return formatDate(value, "-");
}

function statusOf(value: unknown) {
  const labels: Record<string, string> = {
    "tiếp nhận hồ sơ": "Tiếp nhận hồ sơ",
    "đã sơ loại": "Đã sơ loại",
    "đã tạo lịch": "Đã tạo lịch",
    "đã phỏng vấn": "Đã phỏng vấn",
    "đã quyết định loại": "Đã quyết định loại",
    "đã quyết định tuyển": "Đã quyết định tuyển",
    "đi làm": "Đi làm",
    PENDING: "Chờ duyệt",
    APPROVED: "Đã duyệt",
    COMPLETED: "Hoàn tất",
    ĐẠT: "Đạt",
    "KHÔNG ĐẠT": "Không đạt",
  };
  return labels[normalizeCandidateStatus(value)] ?? valueOf(value);
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(-2).map((part) => part[0]).join("").toUpperCase() || "UV";
}

function DetailGrid({ items }: { items: Array<[string, unknown, "date"?]> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map(([label, value, type]) => (
        <div key={label} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
          <div className="mt-1 break-words text-sm font-medium text-slate-700">
            {type === "date" ? dateOf(value) : valueOf(value)}
          </div>
        </div>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 border-b border-slate-100 pb-2 text-sm font-bold text-slate-900">
        <span className="size-1.5 rounded-full bg-teal-500" />
        {title}
      </h2>
      {children}
    </section>
  );
}

function DataTable({
  columns,
  rows,
  empty,
}: {
  columns: Array<[string, string, "date"?]>;
  rows: Row[];
  empty: string;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-100">
      <table className="w-full min-w-[720px] text-left text-xs">
        <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
          <tr>{columns.map(([, label]) => <th key={label} className="px-3 py-3 font-bold">{label}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length ? rows.map((row, index) => (
            <tr key={String(row.id ?? row.screening_id ?? row.interview_eval_id ?? row.offer_id ?? index)}>
              {columns.map(([key, , type]) => (
                <td key={key} className="px-3 py-3 align-top text-slate-700">
                  {type === "date" ? dateOf(row[key]) : key === "status" || key.endsWith("result") ? statusOf(row[key]) : valueOf(row[key])}
                </td>
              ))}
            </tr>
          )) : <tr><td colSpan={columns.length} className="px-3 py-8 text-center text-slate-400">{empty}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export function CandidateProfile({ candidateId }: { candidateId: string }) {
  const router = useRouter();
  const session = useSyncExternalStore(subscribeToSession, getStoredSession, () => null) as Session | null;
  const profileQuery = useQuery({
    queryKey: ["candidate-profile", candidateId],
    queryFn: async () => {
      const [candidates, screenings, evaluations, offers] = await Promise.all([
        api.list("/recruitment/candidates", { resource: "recruitment" }),
        api.list("/recruitment/pre-screenings", { resource: "recruitment" }),
        api.list("/recruitment/interview-evaluations", { resource: "recruitment" }),
        api.list("/recruitment/offers", { resource: "recruitment" }),
      ]);
      const candidate = candidates.find((item) => String(item.candidate_id ?? "") === candidateId);
      return {
        candidate,
        screenings: screenings.filter((item) => String(item.candidate_id ?? "") === candidateId),
        evaluations: evaluations.filter((item) => String(item.candidate_id ?? "") === candidateId),
        offers: offers.filter((item) => String(item.candidate_id ?? "") === candidateId),
      };
    },
  });
  const candidate = profileQuery.data?.candidate;
  const fullName = String(candidate?.full_name ?? "Ứng viên");
  const attachments = Array.isArray(candidate?.attachments_json) ? candidate.attachments_json as Row[] : [];
  const deleteMutation = useMutation({
    mutationFn: () => api.remove(`/recruitment/candidates/${candidateId}`, { resource: "recruitment", action: "delete" }),
    onSuccess: () => router.push("/recruitment?tab=candidates"),
  });

  if (profileQuery.isLoading) return <div className="grid min-h-[60vh] place-items-center text-sm text-slate-400">Đang tải hồ sơ ứng viên...</div>;
  if (profileQuery.error || !candidate) {
    return <div className="space-y-4"><Button variant="secondary" onClick={() => router.push("/recruitment?tab=candidates")}><ArrowLeft size={15} /> Quay lại</Button><Card className="p-8 text-center text-sm text-rose-600">Không thể tải hồ sơ ứng viên.</Card></div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => router.push("/recruitment?tab=candidates")}><ArrowLeft size={14} /> Quay lại</Button>
          <div className="grid size-12 shrink-0 place-items-center rounded-full bg-teal-100 text-sm font-bold text-teal-700"><UserRound size={20} /></div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Hồ sơ ứng viên: {fullName}</h1>
            <p className="mt-0.5 text-xs text-slate-400">{valueOf(candidate.candidate_code)} · {valueOf(candidate.apply_position_name ?? candidate.position_name)}</p>
          </div>
          <Badge tone="teal">{statusOf(candidate.status)}</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" disabled={!canAccess(session, "recruitment", "edit")} onClick={() => router.push(`/recruitment?tab=candidates&edit=${encodeURIComponent(candidateId)}`)}><Pencil size={14} /> Sửa</Button>
          <Button variant="destructive" size="sm" disabled={!canAccess(session, "recruitment", "delete") || deleteMutation.isPending} onClick={() => { if (window.confirm(`Xóa hồ sơ ${fullName}?`)) deleteMutation.mutate(); }}><Trash2 size={14} /> Xóa</Button>
        </div>
      </div>

      <Card className="p-5">
        <div className="space-y-6">
          <Section title="1. Thông tin cá nhân">
            <DetailGrid items={[["Mã ứng viên", candidate.candidate_code], ["Họ và tên", candidate.full_name], ["Giới tính", candidate.gender], ["Ngày sinh", candidate.date_of_birth, "date"], ["Số CCCD", candidate.citizen_id], ["Điện thoại", candidate.phone], ["Email", candidate.email], ["Địa chỉ", candidate.address]]} />
            <div className="grid gap-3 sm:grid-cols-2"><div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-sm text-slate-700"><Phone size={15} className="text-teal-600" /> {valueOf(candidate.phone)}</div><div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-sm text-slate-700"><Mail size={15} className="text-teal-600" /> {valueOf(candidate.email)}</div></div>
          </Section>
          <Section title="2. Thông tin ứng tuyển">
            <DetailGrid items={[["Vị trí ứng tuyển", candidate.apply_position_name ?? candidate.position_name], ["Bộ phận", candidate.department_name], ["Nguồn tuyển dụng", candidate.source], ["Ngày nhận hồ sơ", candidate.received_date, "date"], ["Mã yêu cầu tuyển dụng", candidate.recruitment_request_id], ["Kế hoạch tuyển dụng", candidate.plan_name], ["Người giới thiệu", candidate.referrer], ["Lý do bị loại", candidate.rejection_reason]]} />
          </Section>
          <Section title="3. Học vấn và kinh nghiệm">
            <DetailGrid items={[["Trình độ văn hóa", candidate.culture_level], ["Trình độ đào tạo", candidate.education_level], ["Trường đào tạo", candidate.education_school], ["Chuyên ngành", candidate.major], ["GPA", candidate.gpa], ["Kinh nghiệm", candidate.experience]]} />
          </Section>
          <Section title="4. Tài liệu đính kèm">
            <DataTable columns={[["name", "Tên tài liệu"], ["url", "Đường dẫn"], ["note", "Ghi chú"]]} rows={attachments} empty="Chưa có tài liệu đính kèm." />
          </Section>
          <Section title="5. Kết quả sơ loại">
            <DataTable columns={[["screening_date", "Ngày sơ loại", "date"], ["screening_result", "Kết quả"], ["level_score", "Mức độ phù hợp"], ["comment", "Nhận xét"]]} rows={profileQuery.data?.screenings ?? []} empty="Chưa có phiếu sơ loại." />
          </Section>
          <Section title="6. Đánh giá phỏng vấn">
            <DataTable columns={[["evaluation_date", "Ngày đánh giá", "date"], ["evaluator_name", "Người đánh giá"], ["level_score", "Điểm"], ["overall_result", "Kết quả"], ["overall_comment", "Nhận xét"]]} rows={profileQuery.data?.evaluations ?? []} empty="Chưa có phiếu đánh giá phỏng vấn." />
          </Section>
          <Section title="7. Offer tuyển dụng">
            <DataTable columns={[["offer_date", "Ngày Offer", "date"], ["expected_start_date", "Ngày đi làm", "date"], ["probation_salary", "Lương thử việc"], ["official_salary", "Lương chính thức"], ["offer_status", "Trạng thái"], ["note", "Ghi chú"]]} rows={profileQuery.data?.offers ?? []} empty="Chưa có Offer tuyển dụng." />
          </Section>
        </div>
      </Card>
    </div>
  );
}
