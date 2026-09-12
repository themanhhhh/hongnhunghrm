"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  Layers,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";
import {
  api,
  type DashboardData,
  type WorkforceDashboardData,
} from "@/lib/api";
import { type Role, type Session } from "@/lib/permissions";
import { getStoredSession, subscribeToSession } from "@/lib/session";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatDate, formatNumber } from "@/lib/utils";

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

type DashboardLink = { href: string; label: string; description: string };
type DashboardRoleConfig = {
  eyebrow: string;
  title: string;
  description: string;
  primaryAction: DashboardLink;
  showPipeline: boolean;
  pipelineTitle: string;
  pipelineDescription: string;
  departmentTitle: string;
  departmentDescription: string;
  approvalTitle: string;
  approvalDescription: string;
  approvalHref: string;
  links: DashboardLink[];
};

const roleDashboardConfig: Record<Role, DashboardRoleConfig> = {
  Administrator: {
    eyebrow: "SYSTEM CONTROL",
    title: "Trung tâm điều hành hệ thống",
    description:
      "Theo dõi sức khỏe tài khoản, danh mục và cấu trúc tổ chức trong toàn hệ thống.",
    primaryAction: {
      href: "/admin",
      label: "Quản trị hệ thống",
      description: "Tài khoản, phòng ban và danh mục dùng chung.",
    },
    showPipeline: false,
    pipelineTitle: "",
    pipelineDescription: "",
    departmentTitle: "Cấu trúc tổ chức",
    departmentDescription: "Phân bổ nhân sự theo các đơn vị đang hoạt động.",
    approvalTitle: "Hoạt động cần chú ý",
    approvalDescription: "Rà soát các thiết lập và danh mục quản trị hệ thống.",
    approvalHref: "/admin",
    links: [
      {
        href: "/admin?tab=users",
        label: "Quản lý tài khoản",
        description: "Phân quyền và trạng thái truy cập",
      },
      {
        href: "/admin?tab=departments",
        label: "Cơ cấu phòng ban",
        description: "Cập nhật sơ đồ tổ chức",
      },
      {
        href: "/reports",
        label: "Báo cáo hệ thống",
        description: "Kiểm tra dữ liệu vận hành",
      },
    ],
  },
  "HR Staff": {
    eyebrow: "HR OPERATIONS",
    title: "Bảng điều phối nhân sự",
    description:
      "Ưu tiên tuyển dụng, hồ sơ nhân sự và các tác vụ cần xử lý trong ngày.",
    primaryAction: {
      href: "/recruitment?tab=requests",
      label: "Mở công việc HR",
      description: "Tuyển dụng và xử lý hồ sơ nhân sự.",
    },
    showPipeline: true,
    pipelineTitle: "Pipeline tuyển dụng",
    pipelineDescription: "Ứng viên theo từng điểm chạm tuyển dụng.",
    departmentTitle: "Cơ cấu nhân sự",
    departmentDescription: "Phân bổ nhân sự đang làm việc theo đơn vị.",
    approvalTitle: "Tác vụ HR cần xử lý",
    approvalDescription: "Các hồ sơ đang chờ HR rà soát và cập nhật.",
    approvalHref: "/recruitment?tab=requests",
    links: [
      {
        href: "/recruitment?tab=requests",
        label: "Yêu cầu tuyển dụng",
        description: "Rà soát nhu cầu và phê duyệt",
      },
      {
        href: "/people?tab=contracts",
        label: "Hợp đồng sắp hết hạn",
        description: "Theo dõi hồ sơ lao động",
      },
      {
        href: "/reports",
        label: "Báo cáo nhân sự",
        description: "Xem biến động và hiệu quả tuyển dụng",
      },
    ],
  },
  "Ban Giám Đốc": {
    eyebrow: "EXECUTIVE VIEW",
    title: "Trung tâm điều hành nhân sự",
    description:
      "Nắm quy mô, biến động, tiến độ tuyển dụng và các quyết định cần phê duyệt.",
    primaryAction: {
      href: "/reports",
      label: "Mở báo cáo quản trị",
      description: "Phân tích dữ liệu nhân sự toàn doanh nghiệp.",
    },
    showPipeline: false,
    pipelineTitle: "",
    pipelineDescription: "",
    departmentTitle: "Quy mô theo đơn vị",
    departmentDescription:
      "Cơ cấu nhân sự đang làm việc trong toàn doanh nghiệp.",
    approvalTitle: "Quyết định cần phê duyệt",
    approvalDescription: "Các đề xuất đang chờ Ban Giám Đốc xem xét.",
    approvalHref: "/reports",
    links: [
      {
        href: "/reports",
        label: "Báo cáo quản trị",
        description: "Theo dõi chỉ số và xu hướng nhân sự",
      },
      {
        href: "/people?tab=transfer-proposals",
        label: "Điều chuyển & bổ nhiệm",
        description: "Xem các quyết định tổ chức",
      },
      {
        href: "/rewards?tab=proposals",
        label: "Đề xuất khen thưởng",
        description: "Ghi nhận thành tích và kỷ luật",
      },
    ],
  },
  "Trưởng Khối": {
    eyebrow: "DIVISION MANAGEMENT",
    title: "Tình hình trong khối",
    description:
      "Theo dõi nguồn lực, nhu cầu tuyển dụng và công việc đang chờ trong phạm vi khối.",
    primaryAction: {
      href: "/people?tab=employees",
      label: "Xem nhân sự trong khối",
      description: "Danh sách nhân sự thuộc phạm vi quản lý.",
    },
    showPipeline: true,
    pipelineTitle: "Pipeline của khối",
    pipelineDescription: "Ứng viên theo các nhu cầu tuyển dụng thuộc khối.",
    departmentTitle: "Cơ cấu trong khối",
    departmentDescription: "Phân bổ nhân sự tại các đơn vị trực thuộc.",
    approvalTitle: "Phiếu chờ xử lý",
    approvalDescription: "Các đề xuất thuộc phạm vi khối đang chờ xem xét.",
    approvalHref: "/people?tab=leave",
    links: [
      {
        href: "/people?tab=employees",
        label: "Nhân sự trong khối",
        description: "Theo dõi quy mô và hồ sơ",
      },
      {
        href: "/recruitment?tab=requests",
        label: "Nhu cầu tuyển dụng",
        description: "Xem tiến độ bổ sung nhân sự",
      },
      {
        href: "/reports",
        label: "Báo cáo của khối",
        description: "Đánh giá tình hình đơn vị",
      },
    ],
  },
  "Trưởng Phòng": {
    eyebrow: "TEAM MANAGEMENT",
    title: "Tình hình trong phòng",
    description:
      "Quản lý nhân sự, tuyển dụng và các phiếu cần phê duyệt trong phòng ban của bạn.",
    primaryAction: {
      href: "/people?tab=employees",
      label: "Xem nhân sự trong phòng",
      description: "Danh sách nhân sự thuộc phòng ban.",
    },
    showPipeline: true,
    pipelineTitle: "Pipeline của phòng",
    pipelineDescription: "Ứng viên theo các vị trí phòng ban đang tuyển.",
    departmentTitle: "Nhân sự trong phòng",
    departmentDescription: "Quy mô và phân bổ nhân sự của phòng ban.",
    approvalTitle: "Phiếu cần phê duyệt",
    approvalDescription: "Các đề xuất và đơn từ đang chờ Trưởng Phòng xử lý.",
    approvalHref: "/people?tab=leave",
    links: [
      {
        href: "/people?tab=employees",
        label: "Nhân sự phòng ban",
        description: "Xem hồ sơ và tình trạng làm việc",
      },
      {
        href: "/people?tab=leave",
        label: "Đơn nghỉ phép",
        description: "Xử lý đề nghị của nhân viên",
      },
      {
        href: "/rewards?tab=evaluations",
        label: "Đánh giá nhân sự",
        description: "Theo dõi kết quả đội ngũ",
      },
    ],
  },
  "Nhân viên": {
    eyebrow: "MY WORKSPACE",
    title: "Không gian làm việc cá nhân",
    description:
      "Theo dõi ngày phép, đánh giá và hồ sơ lao động của chính bạn.",
    primaryAction: {
      href: "/people?tab=leave",
      label: "Gửi đơn nghỉ phép",
      description: "Tạo và theo dõi đề nghị nghỉ phép.",
    },
    showPipeline: false,
    pipelineTitle: "",
    pipelineDescription: "",
    departmentTitle: "",
    departmentDescription: "",
    approvalTitle: "Trạng thái đơn của bạn",
    approvalDescription: "Theo dõi các đề nghị nghỉ phép đang chờ xử lý.",
    approvalHref: "/people?tab=leave",
    links: [
      {
        href: "/people?tab=employees",
        label: "Hồ sơ cá nhân",
        description: "Kiểm tra thông tin và hồ sơ lao động",
      },
      {
        href: "/people?tab=leave",
        label: "Nghỉ phép",
        description: "Xem số dư và tạo đơn nghỉ phép",
      },
      {
        href: "/rewards?tab=evaluations",
        label: "Kết quả đánh giá",
        description: "Xem lịch sử đánh giá cá nhân",
      },
    ],
  },
};

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
    return "/people?tab=contracts";
  if (normalized.includes("thưởng") || normalized.includes("kỷ luật"))
    return "/rewards?tab=proposals";
  return "/recruitment?tab=requests";
}

function isKnownApprovalTone(type: string): type is keyof typeof approvalTones {
  return type in approvalTones;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-label="Đang tải tổng quan">
      <div className="h-36 animate-pulse rounded-2xl bg-slate-200/70" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-44 animate-pulse rounded-2xl bg-white"
          />
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

function FocusPanel({ focus }: { focus: NonNullable<DashboardData["focus"]> }) {
  return (
    <Card className="overflow-hidden border-teal-100 bg-white">
      <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-teal-50/70 to-white">
        <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-teal-700">
          <span className="size-1.5 rounded-full bg-teal-500" /> {focus.eyebrow}
        </div>
        <CardTitle>{focus.title}</CardTitle>
        <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
          {focus.description}
        </p>
      </CardHeader>
      <CardContent className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
        {focus.items.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4"
          >
            <div
              className={cn("mb-4 size-2 rounded-full", {
                "bg-teal-500": item.tone === "teal",
                "bg-amber-500": item.tone === "amber",
                "bg-violet-500": item.tone === "violet",
                "bg-rose-500": item.tone === "rose",
              })}
            />
            <div className="font-display text-2xl font-bold tracking-tight text-slate-950">
              {typeof item.value === "number"
                ? formatNumber(item.value)
                : item.value}
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-700">
              {item.label}
            </div>
            <div className="mt-2 text-xs text-slate-400">{item.detail}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function QuickLinks({ links }: { links: DashboardLink[] }) {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {links.map((link, index) => {
        const Icon =
          [ClipboardCheck, Building2, BarChart3][index] ?? ArrowUpRight;
        return (
          <Link
            key={link.href}
            href={link.href}
            className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md"
          >
            <Icon
              className="mb-5 text-teal-700 transition group-hover:text-teal-500"
              size={23}
            />
            <h2 className="font-display text-lg font-bold text-slate-950">
              {link.label}
            </h2>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              {link.description}
            </p>
            <span className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-teal-700">
              Mở chức năng <ArrowUpRight size={14} />
            </span>
          </Link>
        );
      })}
    </section>
  );
}

function Pipeline({
  data,
  config,
}: {
  data: DashboardData;
  config: DashboardRoleConfig;
}) {
  const highestCount = Math.max(...data.pipeline.map((item) => item.count), 1);
  const totalCandidates = data.pipeline.reduce(
    (total, item) => total + item.count,
    0,
  );
  const completedCount =
    data.pipeline.find((item) =>
      item.label.toLocaleLowerCase().includes("tiếp nhận"),
    )?.count ?? 0;
  const conversionRate = totalCandidates
    ? Math.round((completedCount / totalCandidates) * 100)
    : 0;

  return (
    <Card>
      
    </Card>
  );
}

function RecruitmentFunnel({
  stages,
}: {
  stages: NonNullable<DashboardData["pipelineFunnel"]>;
}) {
  const colors = [
    "#f3c629",
    "#aa5b25",
    "#9b6060",
    "#94625e",
    "#8e817c",
    "#7e8d88",
  ];
  const maxCount = Math.max(
    ...stages.map((stage) => Number(stage.count ?? 0)),
    1,
  );
  const stageWidths = stages.reduce<number[]>((widths, stage, index) => {
    const valueWidth = (Number(stage.count ?? 0) / maxCount) * 100;
    const previousWidth = widths[index - 1] ?? 100;
    return [...widths, Math.min(previousWidth, Math.max(28, valueWidth))];
  }, []);
  return (
    <Card>
      <CardHeader>
        <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-teal-700">
          <span className="size-1.5 rounded-full bg-teal-500" /> Tuyển dụng
        </div>
        <CardTitle>Phễu định biên</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-0 p-5">
        {stages.length === 0 ? (
          <div className="grid min-h-56 place-items-center text-sm text-slate-400">
            Chưa có dữ liệu phễu tuyển dụng.
          </div>
        ) : (
          stages.map((stage, index) => (
            <div
              key={stage.code || stage.label}
              className="flex w-full flex-col items-center"
            >
              {index === 0 && (
                <div className="mb-2 flex w-full items-center justify-center gap-2 text-[10px] font-bold text-slate-400">
                  <span className="h-px flex-1 bg-slate-200" />
                  <span>100%</span>
                  <span className="h-px flex-1 bg-slate-200" />
                </div>
              )}
              <div
                className="flex min-h-10 items-center justify-center gap-2 px-4 py-1.5 text-center shadow-sm"
                style={{
                  width: `${stageWidths[index]}%`,
                  backgroundColor: colors[index % colors.length],
                  color: index === 0 ? "#4a3210" : "#fff",
                }}
              >
                <strong className="font-display text-lg leading-none">
                  {formatNumber(stage.count)}
                </strong>
                <span className="text-[11px] font-bold">{stage.label}</span>
                
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function RecruitmentComparison({
  rows,
}: {
  rows: NonNullable<DashboardData["recruitmentByPosition"]>;
}) {
  const chartRows = rows.slice(0, 8);
  const maxValue = Math.max(
    ...chartRows.flatMap((row) => [row.target_headcount, row.hired_count]),
    1,
  );
  const axisMax = Math.max(1, Math.ceil(maxValue / 5) * 5);
  const chart = {
    width: 760,
    height: 300,
    left: 46,
    right: 20,
    top: 18,
    bottom: 64,
  };
  const plotWidth = chart.width - chart.left - chart.right;
  const plotHeight = chart.height - chart.top - chart.bottom;
  const groupWidth = chartRows.length
    ? plotWidth / chartRows.length
    : plotWidth;
  const getX = (index: number) => chart.left + groupWidth * (index + 0.5);
  const getY = (value: number) =>
    chart.top + plotHeight - (value / axisMax) * plotHeight;
  const linePoints = chartRows
    .map((row, index) => `${getX(index)},${getY(row.hired_count)}`)
    .join(" ");

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-teal-700">
            <span className="size-1.5 rounded-full bg-teal-500" /> Tuyển dụng
          </div>
          <CardTitle>Số lượng cần tuyển vs đã tuyển</CardTitle>
          
        </div>
        <div className="flex shrink-0 gap-3 text-[11px] font-bold text-slate-500">
          <span className="inline-flex items-center gap-1">
            <i className="size-2.5 rounded-sm bg-teal-200" /> Cần tuyển
          </span>
          <span className="inline-flex items-center gap-1">
            <i className="h-0.5 w-4 bg-teal-700" /> Đã tuyển
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        {chartRows.length === 0 ? (
          <div className="grid min-h-56 place-items-center text-sm text-slate-400">
            Chưa có dữ liệu tuyển dụng theo vị trí.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <svg
              viewBox={`0 0 ${chart.width} ${chart.height}`}
              role="img"
              aria-label="Biểu đồ số lượng cần tuyển và đã tuyển theo vị trí"
              className="block min-w-[620px] w-full"
            >
              {Array.from({ length: 5 }, (_, index) => {
                const value = Math.round((axisMax / 4) * index);
                const y = getY(value);
                return (
                  <g key={value}>
                    <line
                      x1={chart.left}
                      x2={chart.width - chart.right}
                      y1={y}
                      y2={y}
                      stroke="#e2e8f0"
                      strokeDasharray="3 4"
                    />
                    <text
                      x={chart.left - 10}
                      y={y + 4}
                      textAnchor="end"
                      fill="#94a3b8"
                      fontSize="11"
                    >
                      {value}
                    </text>
                  </g>
                );
              })}
              <line
                x1={chart.left}
                x2={chart.left}
                y1={chart.top}
                y2={chart.top + plotHeight}
                stroke="#cbd5e1"
              />
              <line
                x1={chart.left}
                x2={chart.width - chart.right}
                y1={chart.top + plotHeight}
                y2={chart.top + plotHeight}
                stroke="#cbd5e1"
              />
              {chartRows.map((row, index) => {
                const centerX = getX(index);
                const targetY = getY(row.target_headcount);
                const hiredY = getY(row.hired_count);
                const label =
                  row.position_name.length > 16
                    ? `${row.position_name.slice(0, 15)}...`
                    : row.position_name;
                return (
                  <g key={`${row.position_name}-${index}`}>
                    <title>{`${row.position_name}: Cần tuyển ${row.target_headcount}, đã tuyển ${row.hired_count}`}</title>
                    <rect
                      x={centerX - 19}
                      y={targetY}
                      width="18"
                      height={Math.max(0, chart.top + plotHeight - targetY)}
                      rx="3"
                      fill="#b8ddd5"
                    />
                    <text
                      x={centerX - 10}
                      y={targetY - 6}
                      textAnchor="middle"
                      fill="#0f766e"
                      fontSize="10"
                      fontWeight="700"
                    >
                      {row.target_headcount}
                    </text>
                    <rect
                      x={centerX + 3}
                      y={hiredY}
                      width="18"
                      height={Math.max(0, chart.top + plotHeight - hiredY)}
                      rx="3"
                      fill="#e2e8f0"
                    />
                    <text
                      x={centerX + 12}
                      y={hiredY - 6}
                      textAnchor="middle"
                      fill="#475569"
                      fontSize="10"
                      fontWeight="700"
                    >
                      {row.hired_count}
                    </text>
                    <text
                      x={centerX}
                      y={chart.top + plotHeight + 20}
                      textAnchor="middle"
                      fill="#475569"
                      fontSize="10"
                    >
                      {label}
                    </text>
                  </g>
                );
              })}
              <polyline
                points={linePoints}
                fill="none"
                stroke="#0f766e"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {chartRows.map((row, index) => (
                <circle
                  key={`point-${row.position_name}-${index}`}
                  cx={getX(index)}
                  cy={getY(row.hired_count)}
                  r="4.5"
                  fill="#fff"
                  stroke="#0f766e"
                  strokeWidth="3"
                />
              ))}
            </svg>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function HRRecruitmentVisuals({ data }: { data: DashboardData }) {
  return (
    <section className="grid gap-5 xl:grid-cols-2">
      <RecruitmentFunnel stages={data.pipelineFunnel ?? []} />
      <RecruitmentComparison rows={data.recruitmentByPosition ?? []} />
    </section>
  );
}

function formatDashboardShortDate(value: string | number) {
  return formatDate(value, "-");
}

function HRCandidateTables({ data }: { data: DashboardData }) {
  const hiredCandidates = data.hiredCandidates ?? [];
  const inProgressCandidates = data.inProgressCandidates ?? [];
  return (
    <section className="grid gap-5 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Danh sách ứng viên trúng tuyển</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-bold">Ứng viên</th>
                  <th className="px-5 py-3 font-bold">Vị trí</th>
                  <th className="px-5 py-3 font-bold">Phòng ban</th>
                  <th className="px-5 py-3 font-bold">Ngày trúng tuyển</th>
                  <th className="px-5 py-3 font-bold">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {hiredCandidates.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-8 text-center text-slate-400"
                    >
                      Chưa có ứng viên trúng tuyển.
                    </td>
                  </tr>
                ) : (
                  hiredCandidates.map((candidate) => (
                    <tr key={candidate.id} className="hover:bg-teal-50/30">
                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {candidate.candidate_name}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {candidate.position_name}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {candidate.department_name}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {formatDashboardShortDate(candidate.hired_date)}
                      </td>
                      <td className="px-5 py-4">
                        <Badge
                          tone={
                            candidate.status_label === "Đã nhận việc"
                              ? "teal"
                              : "amber"
                          }
                        >
                          {candidate.status_label}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Ứng viên đang trong quá trình tuyển dụng</CardTitle>
          
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-bold">Ứng viên</th>
                  <th className="px-5 py-3 font-bold">Vị trí</th>
                  <th className="px-5 py-3 font-bold">Vòng hiện tại</th>
                  <th className="px-5 py-3 font-bold">Ngày cập nhật</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inProgressCandidates.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-8 text-center text-slate-400"
                    >
                      Không có ứng viên đang trong quá trình tuyển dụng.
                    </td>
                  </tr>
                ) : (
                  inProgressCandidates.map((candidate) => (
                    <tr key={candidate.id} className="hover:bg-teal-50/30">
                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {candidate.candidate_name}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {candidate.position_name}
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone="blue">{candidate.current_stage}</Badge>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {formatDashboardShortDate(candidate.updated_date)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function DepartmentStructure({
  data,
  config,
}: {
  data: DashboardData;
  config: DashboardRoleConfig;
}) {
  const total = data.departments.reduce((sum, item) => sum + item.count, 0);
  const largestCount = Math.max(
    ...data.departments.map((item) => item.count),
    1,
  );

  return (
    <Card>
      <CardHeader>
        <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-700">
          <span className="size-1.5 rounded-full bg-violet-500" /> Tổ chức
        </div>
        <CardTitle>{config.departmentTitle}</CardTitle>
        <p className="mt-1 text-xs text-slate-400">
          {config.departmentDescription}
        </p>
      </CardHeader>
      {data.departments.length === 0 ? (
        <EmptyPanel
          icon={Building2}
          title="Chưa có dữ liệu đơn vị"
          description="Khai báo phòng ban và hồ sơ nhân sự để xem phân bổ tổ chức."
          href="/admin?tab=departments"
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

function ApprovalQueue({
  data,
  config,
}: {
  data: DashboardData;
  config: DashboardRoleConfig;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-rose-700">
            <span className="size-1.5 rounded-full bg-rose-500" /> Workflow
          </div>
          <CardTitle>{config.approvalTitle}</CardTitle>
          <p className="mt-1 text-xs text-slate-400">
            {config.approvalDescription}
          </p>
        </div>
        <Link
          href={config.approvalHref}
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
          href={config.approvalHref}
          action="Mở danh sách"
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
                      {item.owner}{" "}
                      <span className="mx-1 text-slate-300">/</span> {item.age}
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

const workforceStatusColors: Record<string, string> = {
  WORKING: "#0f766e",
  RESIGNED: "#f43f5e",
  PROBATION: "#f59e0b",
  WAITING_FOR_WORK: "#8b5cf6",
};

function formatWorkforceDate(value: string | number) {
  return formatDate(value, "-");
}

function WorkforceDashboard({
  workforce,
  error,
  isFetching,
  refetch,
  session,
}: {
  workforce: WorkforceDashboardData;
  error: unknown;
  isFetching: boolean;
  refetch: () => void;
  session: Session | null;
}) {
  const departmentTotal = workforce.departments.reduce(
    (sum, item) => sum + item.count,
    0,
  );
  const departmentSegments = workforce.departments.map((item, index) => {
    const previousCount = workforce.departments
      .slice(0, index)
      .reduce((sum, department) => sum + department.count, 0);
    const currentCount = previousCount + item.count;
    const start = departmentTotal ? (previousCount / departmentTotal) * 100 : 0;
    const end = departmentTotal ? (currentCount / departmentTotal) * 100 : 100;
    return `${["#0f766e", "#0ea5e9", "#8b5cf6", "#f59e0b", "#f43f5e", "#64748b"][index % 6]} ${start}% ${end}%`;
  });
  const maxStatus = Math.max(
    ...workforce.statuses.map((item) => item.count),
    1,
  );
  const cardItems = [
    {
      label: "Nhân sự hiện tại",
      value: workforce.currentEmployees,
      detail: "Tổng số nhân viên đang làm việc",
      trend: workforce.scopeName,
      tone: "teal",
      icon: UsersRound,
    },
    {
      label: "Định biên nhân sự",
      value: workforce.headcountTarget,
      detail: "Tổng số nhân sự theo định biên",
      trend: "Được phê duyệt",
      tone: "violet",
      icon: Building2,
    },
    {
      label: "Tỷ lệ đáp ứng định biên",
      value: `${workforce.fulfillmentRate}%`,
      detail: "Nhân sự hiện tại / định biên",
      trend: "Mức độ đáp ứng nguồn lực",
      tone: "amber",
      icon: TrendingUp,
    },
    {
      label: "HĐLĐ sắp hết hạn",
      value: workforce.expiringContractsCount,
      detail: "Cần rà soát trong 60 ngày",
      trend: "Cảnh báo cần xử lý",
      tone: "rose",
      icon: CalendarDays,
    },
  ] as const;

  return (
    <div className="space-y-6 lg:space-y-8">
      {Boolean(error) && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800">
          <CircleAlert size={16} /> Đang hiển thị dữ liệu gần nhất. Không thể
          đồng bộ phiên tải này.
        </div>
      )}
      <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <div className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-teal-700">
            WORKFORCE CONTROL
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950">
            Tổng quan nhân sự
          </h1>
          
        </div>
        <button
          type="button"
          className={cn(
            buttonVariants({ variant: "secondary", size: "sm" }),
            "shrink-0",
          )}
          onClick={() => void refetch()}
          disabled={isFetching}
        >
          <RefreshCw
            size={15}
            className={isFetching ? "animate-spin" : undefined}
          />{" "}
          Cập nhật dữ liệu
        </button>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cardItems.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="group relative overflow-hidden">
              <div className="absolute -right-5 -top-5 size-24 rounded-full bg-slate-50 transition group-hover:scale-125" />
              <CardContent className="relative p-5">
                <div className="mb-6 flex items-start justify-between gap-3">
                  <div
                    className={cn(
                      "grid size-10 place-items-center rounded-xl ring-1",
                      tones[item.tone],
                    )}
                  >
                    <Icon size={18} />
                  </div>
                  <span className="max-w-36 text-right text-[11px] font-bold leading-4 text-slate-500">
                    {item.trend}
                  </span>
                </div>
                <div className="font-display text-3xl font-bold tracking-tight text-slate-950">
                  {typeof item.value === "number"
                    ? formatNumber(item.value)
                    : item.value}
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-700">
                  {item.label}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-teal-700">
              <span className="size-1.5 rounded-full bg-teal-500" /> Cơ cấu nhân
              sự
            </div>
            <CardTitle>Nhân sự theo phòng ban</CardTitle>
           
          </CardHeader>
          <CardContent className="flex flex-col gap-6 p-5 sm:flex-row sm:items-center">
            <div
              className="mx-auto grid size-44 shrink-0 place-items-center rounded-full"
              style={{
                background: departmentSegments.length
                  ? `conic-gradient(${departmentSegments.join(", ")})`
                  : "#e2e8f0",
              }}
            >
              <div className="grid size-28 place-items-center rounded-full bg-white text-center shadow-inner">
                <strong className="font-display text-2xl text-slate-950">
                  {formatNumber(departmentTotal)}
                </strong>
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  nhân sự
                </span>
              </div>
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              {workforce.departments.slice(0, 6).map((department, index) => (
                <div
                  key={department.department_name}
                  className="flex items-center gap-2 text-xs"
                >
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: [
                        "#0f766e",
                        "#0ea5e9",
                        "#8b5cf6",
                        "#f59e0b",
                        "#f43f5e",
                        "#64748b",
                      ][index % 6],
                    }}
                  />
                  <span className="min-w-0 flex-1 truncate font-semibold text-slate-600">
                    {department.department_name}
                  </span>
                  <strong className="text-slate-950">
                    {formatNumber(department.count)}
                  </strong>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-700">
              <span className="size-1.5 rounded-full bg-violet-500" /> Trạng
              thái nhân sự
            </div>
            <CardTitle>Tình hình nhân sự theo trạng thái</CardTitle>
            
          </CardHeader>
          <CardContent className="space-y-5 p-5">
            {workforce.statuses.map((status) => (
              <div key={status.code}>
                <div className="mb-1.5 flex items-start justify-between gap-3 text-xs">
                  <span className="font-semibold text-slate-600">
                    {status.label}
                  </span>
                  <strong className="shrink-0 text-slate-950">
                    {formatNumber(status.count)}
                  </strong>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full transition-[width] duration-500"
                    style={{
                      width: `${status.count ? Math.max(4, (status.count / maxStatus) * 100) : 0}%`,
                      backgroundColor:
                        workforceStatusColors[status.code] ?? "#64748b",
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-rose-700">
              <span className="size-1.5 rounded-full bg-rose-500" /> Cảnh báo
              hợp đồng
            </div>
            <CardTitle>Hợp đồng lao động sắp hết hạn</CardTitle>
            
          </div>
          <Link
            href="/people?tab=expiring-contracts"
            className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-800"
          >
            Mở danh sách <ArrowUpRight size={14} />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {workforce.expiringContracts.length === 0 ? (
            <div className="grid min-h-40 place-items-center px-5 py-8 text-center text-sm text-slate-400">
              Không có hợp đồng hết hạn trong 60 ngày tới.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-5 py-3 font-bold">Nhân viên</th>
                    <th className="px-5 py-3 font-bold">Vị trí</th>
                    <th className="px-5 py-3 font-bold">Loại HĐ</th>
                    <th className="px-5 py-3 font-bold">Ngày hết hạn</th>
                    <th className="px-5 py-3 font-bold">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {workforce.expiringContracts.map((contract) => (
                    <tr key={contract.id} className="hover:bg-teal-50/30">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-800">
                          {contract.employee_name}
                        </div>
                        <div className="mt-1 font-mono text-[10px] text-slate-400">
                          {contract.employee_code ?? "-"}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {contract.position_name ?? "-"}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {contract.contract_type}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {formatWorkforceDate(contract.end_date)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold",
                            contract.days_remaining <= 7
                              ? "bg-rose-50 text-rose-700"
                              : contract.days_remaining <= 30
                                ? "bg-amber-50 text-amber-700"
                                : "bg-teal-50 text-teal-700",
                          )}
                        >
                          {contract.status_label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      <div className="text-xs text-slate-400">
        Đang đăng nhập: {session?.name ?? "Người dùng"} · Dữ liệu được phân
        quyền theo vai trò.
      </div>
    </div>
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
    queryFn: () => api.dashboard(),
  });
  const now = new Date();
  const welcome = greetingHour(now.getHours());
  const today = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(now);
  const role = session?.role ?? "HR Staff";
  const config = roleDashboardConfig[role];

  if (isLoading && !data) return <DashboardSkeleton />;
  if (!data)
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
        {error instanceof Error
          ? error.message
          : "Không thể tải dữ liệu tổng quan."}
      </div>
    );

  if (
    ["Administrator", "Ban Giám Đốc", "Trưởng Khối", "Trưởng Phòng"].includes(
      role,
    ) &&
    data.workforce
  ) {
    return (
      <WorkforceDashboard
        workforce={data.workforce}
        error={error}
        isFetching={isFetching}
        refetch={refetch}
        session={session}
      />
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800">
          <CircleAlert size={16} /> Đang hiển thị dữ liệu gần nhất. Không thể
          đồng bộ phiên tải này.
        </div>
      )}

      <section
        className={cn(
          "grid gap-4 md:grid-cols-2",
          role === "HR Staff" ? "xl:grid-cols-5" : "xl:grid-cols-4",
        )}
      >
        {data.kpis.map((kpi, index) => {
          const Icon =
            [UsersRound, BriefcaseBusiness, TrendingUp, ClipboardCheck][
              index
            ] ?? ShieldCheck;
          return (
            <Card key={kpi.label} className="group relative overflow-hidden">
              <div className="absolute -right-5 -top-5 size-24 rounded-full bg-slate-50 transition group-hover:scale-125" />
              <CardContent className="relative p-5">
                <div className="mb-6 flex items-start justify-between gap-3">
                  <div
                    className={cn(
                      "grid size-10 place-items-center rounded-xl ring-1",
                      tones[kpi.tone],
                    )}
                  >
                    <Icon size={18} />
                  </div>
                  <span className="max-w-32 text-right text-[11px] font-bold leading-4 text-slate-500">
                    {kpi.trend}
                  </span>
                </div>
                <div className="font-display text-3xl font-bold tracking-tight text-slate-950">
                  {typeof kpi.value === "number"
                    ? formatNumber(kpi.value)
                    : kpi.value}
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-700">
                  {kpi.label}
                </div>
              
              </CardContent>
            </Card>
          );
        })}
      </section>

      {data.focus && <FocusPanel focus={data.focus} />}

      {role === "HR Staff" && <HRRecruitmentVisuals data={data} />}

      {role === "HR Staff" && <HRCandidateTables data={data} />}

    

      <ApprovalQueue data={data} config={config} />

      <QuickLinks links={config.links} />
    </div>
  );
}
