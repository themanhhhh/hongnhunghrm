"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";
import { api, type DashboardData } from "@/lib/api";
import { type Session } from "@/lib/permissions";
import { getStoredSession, subscribeToSession } from "@/lib/session";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatNumber } from "@/lib/utils";

const tones = {
  teal: "bg-teal-50 text-teal-700 ring-teal-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  violet: "bg-violet-50 text-violet-700 ring-violet-100",
  rose: "bg-rose-50 text-rose-700 ring-rose-100",
};

const approvalTones = {
  "Tuyển dụng": "teal",
  "Nghỉ phép": "blue",
  "Thuyên chuyển": "violet",
  "Khen thưởng": "violet",
} as const;

function greetingHour(hour: number) {
  if (hour < 11) return "Chào buổi sáng";
  if (hour < 14) return "Chào buổi trưa";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

function actionLink(type: string) {
  const normalized = type.toLocaleLowerCase();
  if (normalized.includes("nghỉ")) return "/people?tab=leave";
  if (normalized.includes("thuyên") || normalized.includes("transfer"))
    return "/people?tab=transfer-proposals";
  if (normalized.includes("hợp đồng") || normalized.includes("contract"))
    return "/people?tab=contract-proposals";
  if (normalized.includes("thưởng") || normalized.includes("kỷ luật"))
    return "/rewards?tab=proposals";
  return "/recruitment?tab=requests";
}

function primaryAction(session: Session | null) {
  if (session?.role === "Administrator")
    return { href: "/admin", label: "Quản trị hệ thống" };
  if (session?.role === "Ban Giám Đốc")
    return { href: "/reports", label: "Mở báo cáo quản trị" };
  return { href: "/recruitment?tab=requests", label: "Mở tuyển dụng" };
}

function isKnownApprovalTone(
  type: string,
): type is keyof typeof approvalTones {
  return type in approvalTones;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-label="Đang tải tổng quan">
      <div className="h-36 animate-pulse rounded-2xl bg-slate-200/70" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-44 animate-pulse rounded-2xl bg-white" />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="h-80 animate-pulse rounded-2xl bg-white" />
        <div className="h-80 animate-pulse rounded-2xl bg-white" />
      </div>
    </div>
  );
}

function EmptyPanel({
  icon: Icon,
  title,
  description,
  href,
  action,
}: {
  icon: typeof ClipboardCheck;
  title: string;
  description: string;
  href: string;
  action: string;
}) {
  return (
    <div className="grid min-h-56 place-items-center px-5 py-8 text-center">
      <div>
        <div className="mx-auto grid size-11 place-items-center rounded-2xl bg-slate-100 text-slate-500">
          <Icon size={20} />
        </div>
        <h4 className="mt-3 font-display text-base font-bold text-slate-900">
          {title}
        </h4>
        <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-slate-500">
          {description}
        </p>
        <Link
          href={href}
          className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-800"
        >
          {action} <ArrowUpRight size={14} />
        </Link>
      </div>
    </div>
  );
}

function Pipeline({ data }: { data: DashboardData }) {
  const highestCount = Math.max(...data.pipeline.map((item) => item.count), 1);
  const totalCandidates = data.pipeline.reduce((total, item) => total + item.count, 0);
  const completedCount = data.pipeline.find((item) =>
    item.label.toLocaleLowerCase().includes("tiếp nhận"),
  )?.count ?? 0;
  const conversionRate = totalCandidates
    ? Math.round((completedCount / totalCandidates) * 100)
    : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-teal-700">
            <span className="size-1.5 rounded-full bg-teal-500" /> Tuyển dụng
          </div>
          <CardTitle>Nhịp tuyển dụng</CardTitle>
          <p className="mt-1 text-xs text-slate-400">
            Ứng viên theo từng điểm chạm của pipeline.
          </p>
        </div>
        <Link
          href="/recruitment?tab=candidates"
          className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-800"
        >
          Mở pipeline <ArrowUpRight size={14} />
        </Link>
      </CardHeader>
      {data.pipeline.length === 0 ? (
        <EmptyPanel
          icon={BriefcaseBusiness}
          title="Chưa có dữ liệu pipeline"
          description="Tạo yêu cầu tuyển dụng và tiếp nhận ứng viên để theo dõi tiến độ tại đây."
          href="/recruitment?tab=requests"
          action="Mở tuyển dụng"
        />
      ) : (
        <CardContent className="pt-3">
          <div className="space-y-4">
            {data.pipeline.map((stage, index) => (
              <div key={stage.label}>
                <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                  <span className="truncate font-semibold text-slate-600">
                    {stage.label}
                  </span>
                  <span className="shrink-0 font-display font-bold text-slate-950">
                    {formatNumber(stage.count)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-700 to-teal-400 transition-[width] duration-500"
                    style={{
                      width: `${Math.max(5, (stage.count / highestCount) * 100)}%`,
                      opacity: 1 - index * 0.08,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 rounded-2xl bg-[#edf8f6] p-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide text-teal-800">
                Hồ sơ theo dõi
              </div>
              <div className="mt-1 font-display text-2xl font-bold text-teal-950">
                {formatNumber(totalCandidates)}
              </div>
            </div>
            <div className="border-l border-teal-200 pl-4">
              <div className="text-[11px] font-bold uppercase tracking-wide text-teal-800">
                Đã tiếp nhận
              </div>
              <div className="mt-1 font-display text-2xl font-bold text-teal-950">
                {conversionRate}%
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function DepartmentStructure({ data }: { data: DashboardData }) {
  const total = data.departments.reduce((sum, item) => sum + item.count, 0);
  const largestCount = Math.max(...data.departments.map((item) => item.count), 1);

  return (
    <Card>
      <CardHeader>
        <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-700">
          <span className="size-1.5 rounded-full bg-violet-500" /> Tổ chức
        </div>
        <CardTitle>Cơ cấu nhân sự</CardTitle>
        <p className="mt-1 text-xs text-slate-400">
          Phân bổ nhân sự đang hoạt động theo đơn vị.
        </p>
      </CardHeader>
      {data.departments.length === 0 ? (
        <EmptyPanel
          icon={Building2}
          title="Chưa có dữ liệu đơn vị"
          description="Khai báo phòng ban và hồ sơ nhân sự để xem phân bổ tổ chức."
          href="/people?tab=departments"
          action="Mở danh mục"
        />
      ) : (
        <CardContent className="pt-3">
          <div className="space-y-4">
            {data.departments.slice(0, 6).map((department) => {
              const hasTarget = department.target !== undefined;
              const basis = hasTarget
                ? Math.max(department.target ?? 1, 1)
                : largestCount;
              const meta = hasTarget
                ? `${department.count}/${department.target} định biên`
                : `${total ? Math.round((department.count / total) * 100) : 0}% tổng nhân sự`;
              return (
                <div key={department.name}>
                  <div className="mb-1.5 flex justify-between gap-3 text-xs">
                    <span className="truncate font-semibold text-slate-600">
                      {department.name}
                    </span>
                    <span className="shrink-0 font-bold text-slate-900">
                      {meta}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        hasTarget ? "bg-violet-500" : "bg-violet-400",
                      )}
                      style={{
                        width: `${Math.min(100, Math.max(4, (department.count / basis) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <Link
            href="/people?tab=employees"
            className="mt-6 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-800"
          >
            <span>{formatNumber(total)} nhân sự đang được phân bổ</span>
            <ChevronRight size={16} />
          </Link>
        </CardContent>
      )}
    </Card>
  );
}

function ApprovalQueue({ data }: { data: DashboardData }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-rose-700">
            <span className="size-1.5 rounded-full bg-rose-500" /> Workflow
          </div>
          <CardTitle>Hàng đợi phê duyệt</CardTitle>
          <p className="mt-1 text-xs text-slate-400">
            Các chứng từ đang chờ được xử lý trong luồng công việc.
          </p>
        </div>
        <Link
          href="/recruitment?tab=requests"
          className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-800"
        >
          Mở danh sách <ArrowUpRight size={14} />
        </Link>
      </CardHeader>
      {data.approvals.length === 0 ? (
        <EmptyPanel
          icon={CheckCircle2}
          title="Không có phiếu chờ xử lý"
          description="Các chứng từ trong phạm vi của bạn đã được xử lý hoặc chưa phát sinh."
          href="/reports"
          action="Xem báo cáo"
        />
      ) : (
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {data.approvals.slice(0, 5).map((item, index) => {
              const tone = isKnownApprovalTone(item.type)
                ? approvalTones[item.type]
                : "slate";
              return (
                <div
                  key={`${item.code}-${index}`}
                  className="flex flex-col gap-3 px-5 py-4 transition hover:bg-teal-50/35 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-teal-700">
                        {item.code}
                      </span>
                      <Badge tone={tone}>{item.type}</Badge>
                    </div>
                    <div className="mt-2 truncate text-sm font-semibold text-slate-800">
                      {item.title}
                    </div>
                    <div className="mt-1 truncate text-xs text-slate-400">
                      {item.owner} <span className="mx-1 text-slate-300">/</span>{" "}
                      {item.age}
                    </div>
                  </div>
                  <Link
                    href={actionLink(item.type)}
                    className={cn(
                      buttonVariants({ variant: "secondary", size: "sm" }),
                      "shrink-0 self-start sm:self-auto",
                    )}
                  >
                    Xử lý <ChevronRight size={14} />
                  </Link>
                </div>
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export function DashboardOverview() {
  const session = useSyncExternalStore(
    subscribeToSession,
    getStoredSession,
    () => null,
  ) as Session | null;
  const { data, error, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["dashboard", session?.role],
    queryFn: api.dashboard,
  });
  const now = new Date();
  const welcome = greetingHour(now.getHours());
  const today = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(now);
  const action = primaryAction(session);

  if (isLoading && !data) return <DashboardSkeleton />;
  if (!data)
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
        {error instanceof Error
          ? error.message
          : "Không thể tải dữ liệu tổng quan."}
      </div>
    );

  const pendingCount = data.approvals.length;
  const topDepartment = [...data.departments].sort((a, b) => b.count - a.count)[0];

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-[#0c2429] px-6 py-7 text-white shadow-[0_18px_45px_rgba(12,36,41,0.18)] lg:px-8 lg:py-8">
        <div className="absolute -right-20 -top-28 size-80 rounded-full border-[30px] border-teal-300/10" />
        <div className="absolute bottom-0 right-28 size-32 rounded-t-full bg-teal-400/10" />
        <div className="relative flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-teal-200">
              <span className="size-1.5 rounded-full bg-teal-300" />{" "}
              <span suppressHydrationWarning>{today}</span>
            </div>
            <h1
              className="max-w-2xl font-display text-3xl font-bold tracking-tight lg:text-4xl"
              suppressHydrationWarning
            >
              {welcome}, {session?.name?.split(/\s+/).at(-1) ?? "bạn"}.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Theo dõi vận hành nhân sự, tiến độ tuyển dụng và các chứng từ
              đang chờ trong cùng một không gian.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className={cn(
                buttonVariants({ variant: "secondary" }),
                "border-white/15 bg-white/10 text-white hover:border-teal-200 hover:bg-white/15 hover:text-white",
              )}
            >
              <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
              Làm mới
            </button>
            <Link
              href={action.href}
              className={cn(
                buttonVariants({ size: "default" }),
                "bg-teal-300 text-[#092027] hover:bg-teal-200",
              )}
            >
              {action.label} <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800">
          <CircleAlert size={16} /> Đang hiển thị dữ liệu gần nhất. Không thể
          đồng bộ phiên tải này.
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.kpis.map((kpi, index) => {
          const Icon = [UsersRound, BriefcaseBusiness, TrendingUp, ClipboardCheck][index] ?? ShieldCheck;
          return (
            <Card key={kpi.label} className="group relative overflow-hidden">
              <div className="absolute -right-5 -top-5 size-24 rounded-full bg-slate-50 transition group-hover:scale-125" />
              <CardContent className="relative p-5">
                <div className="mb-6 flex items-start justify-between gap-3">
                  <div className={cn("grid size-10 place-items-center rounded-xl ring-1", tones[kpi.tone])}>
                    <Icon size={18} />
                  </div>
                  <span className="max-w-32 text-right text-[11px] font-bold leading-4 text-slate-500">
                    {kpi.trend}
                  </span>
                </div>
                <div className="font-display text-3xl font-bold tracking-tight text-slate-950">
                  {typeof kpi.value === "number" ? formatNumber(kpi.value) : kpi.value}
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-700">
                  {kpi.label}
                </div>
                <div className="mt-3 text-xs text-slate-400">{kpi.detail}</div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Pipeline data={data} />
        <DepartmentStructure data={data} />
      </section>

      <ApprovalQueue data={data} />

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="border-teal-700 bg-teal-700 text-white shadow-[0_14px_35px_rgba(15,118,110,0.22)]">
          <CardContent className="p-5">
            <ClipboardCheck className="mb-5 text-teal-200" size={23} />
            <h2 className="font-display text-lg font-bold">Hàng đợi của bạn</h2>
            <p className="mt-2 text-xs leading-5 text-teal-100">
              {pendingCount
                ? `${formatNumber(pendingCount)} chứng từ cần được mở và xử lý theo đúng luồng phê duyệt.`
                : "Không có chứng từ tồn trong phạm vi hiện tại."}
            </p>
            <Link
              href="/recruitment?tab=requests"
              className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-white hover:text-teal-100"
            >
              Xem công việc <ArrowUpRight size={14} />
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <Building2 className="mb-5 text-violet-600" size={23} />
            <h2 className="font-display text-lg font-bold text-slate-950">
              {topDepartment ? topDepartment.name : "Cơ cấu tổ chức"}
            </h2>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              {topDepartment
                ? `Đơn vị có quy mô lớn nhất với ${formatNumber(topDepartment.count)} nhân sự đang hoạt động.`
                : "Dữ liệu phân bổ phòng ban sẽ xuất hiện khi có hồ sơ nhân sự."}
            </p>
            <Link
              href="/people?tab=employees"
              className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-800"
            >
              Xem nhân sự <ArrowUpRight size={14} />
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <ShieldCheck className="mb-5 text-amber-600" size={23} />
            <h2 className="font-display text-lg font-bold text-slate-950">
              Phạm vi {session?.role ?? "người dùng"}
            </h2>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Số liệu và thao tác được giới hạn theo vai trò và quyền truy cập
              của phiên đăng nhập hiện tại.
            </p>
            <Link
              href="/reports"
              className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-800"
            >
              Mở báo cáo <ArrowUpRight size={14} />
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
