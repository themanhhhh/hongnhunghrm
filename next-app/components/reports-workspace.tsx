"use client";

import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Filter,
  Layers,
  Play,
  Printer,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api, type ReportQueryResult } from "@/lib/api";
import {
  reportGroups,
  defaultReport,
  type ReportDefinition,
} from "@/lib/report-config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";

type ReportFilters = {
  startDate: string;
  endDate: string;
  department: string;
  departmentName: string;
  position: string;
  positionName: string;
  period: string;
  status: string;
  result: string;
  employeeId: string;
  type: string;
};

type ReportOption = { id: string; label: string };

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function lastWeekFilters(): ReportFilters {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  return {
    startDate: formatDateInput(start),
    endDate: formatDateInput(end),
    department: "ALL",
    departmentName: "Toàn công ty",
    position: "ALL",
    positionName: "Tất cả vị trí",
    period: "7 ngày gần nhất",
    status: "ALL",
    result: "ALL",
    employeeId: "ALL",
    type: "ALL",
  };
}

const fallbackDepartments = [
  { id: "fallback-engineering", label: "Khối Kỹ thuật Phần mềm" },
  { id: "fallback-erp", label: "Khối Kinh doanh ERP" },
  { id: "fallback-hr", label: "Phòng Hành chính Nhân sự" },
  { id: "fallback-board", label: "Ban Giám đốc" },
];

function filtersForPeriod(period: string, current: ReportFilters) {
  if (period === "7 ngày gần nhất")
    return {
      ...lastWeekFilters(),
      department: current.department,
      departmentName: current.departmentName,
      position: current.position,
      positionName: current.positionName,
      status: current.status,
      result: current.result,
      employeeId: current.employeeId,
      type: current.type,
    };
  if (period === "Quý I/2026")
    return {
      ...current,
      period,
      startDate: "2026-01-01",
      endDate: "2026-03-31",
    };
  if (period === "Quý II/2026")
    return {
      ...current,
      period,
      startDate: "2026-04-01",
      endDate: "2026-06-30",
    };
  if (period === "Tháng 08/2026")
    return {
      ...current,
      period,
      startDate: "2026-08-01",
      endDate: "2026-08-31",
    };
  return { ...current, period, startDate: "2026-01-01", endDate: "2026-12-31" };
}

function filtersForReport(reportId: string) {
  const current = lastWeekFilters();
  return reportId.startsWith("eval_") || reportId === "rec_candidates_interview"
    ? filtersForPeriod("Năm 2026", current)
    : current;
}

function formatValue(value: unknown, key: string) {
  if (value === null || value === undefined || value === "") return "-";
  if (key.toLowerCase().includes("date") || key === "dob" || key === "join_date") {
    return formatDate(value, String(value));
  }
  if (key.toLowerCase().includes("rate") || key === "percentage") {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? `${numeric.toFixed(2)}%` : String(value);
  }
  if (key === "movementType") {
    return { INCREASE: "Tăng", DECREASE: "Giảm" }[String(value)] ?? String(value);
  }
  if (key === "status") {
    return { WORKING: "Đang làm việc", RESIGNED: "Đã nghỉ việc" }[String(value)] ?? String(value);
  }
  if (typeof value === "number") return value.toLocaleString("vi-VN");
  return String(value);
}

function formatSummaryValue(value: unknown, format: "number" | "percent" = "number") {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return "0";
  return format === "percent" ? `${numeric.toFixed(2)}%` : numeric.toLocaleString("vi-VN");
}

function filterEnabled(report: ReportDefinition, filter: NonNullable<ReportDefinition["filters"]>[number]) {
  return report.filters?.includes(filter) ?? ["date", "department", "position"].includes(filter);
}

function csvValue(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function ReportPaper({
  report,
  filters,
  rows,
  page = 1,
  pageSize = rows.length || 1,
  totalItems = rows.length,
  preview = false,
}: {
  report: ReportDefinition;
  filters: ReportFilters;
  rows: Array<Record<string, unknown>>;
  page?: number;
  pageSize?: number;
  totalItems?: number;
  preview?: boolean;
}) {
  const displayRows = preview ? Array.from({ length: 7 }, () => null) : rows;
  const department = filters.department === "ALL" ? "Toàn công ty" : filters.departmentName || filters.department;
  const position = filters.position === "ALL" ? "Tất cả vị trí" : filters.positionName || filters.position;

  return (
    <div className="legacy-a4-preview-paper">
      {preview && <div className="legacy-watermark-text">BÁO CÁO MẪU</div>}
      <div className="legacy-preview-content">
        <div className="legacy-document-header">
          <div>
            <div className="legacy-company-name">
              ĐƠN VỊ: VĂN PHÒNG CÔNG TY CỔ PHẦN BRAVO
            </div>
            <div className="legacy-company-address">Địa chỉ: Hà Nội</div>
          </div>
          <div className="legacy-document-code">
            <div>Hệ thống Quản trị BRAVO 10 ERP</div>
            <div>Mẫu số: <b>BC-HRM/2026</b></div>
          </div>
        </div>

        <div className="legacy-report-title">
          <h2>{report.title}</h2>
          <div>Năm: {new Date().getFullYear()}</div>
        </div>

        <div className="legacy-report-meta">
          {preview ? report.sampleMeta.map((meta) => <div key={meta}>• {meta}</div>) : (
            <>
              {filterEnabled(report, "date") && <div>• Từ ngày: {filters.startDate}</div>}
              {filterEnabled(report, "date") && <div>• Đến ngày: {filters.endDate}</div>}
              {filterEnabled(report, "department") && <div>• Phòng ban: {department}</div>}
              {filterEnabled(report, "position") && <div>• Vị trí: {position}</div>}
              <div>• Số bản ghi: {totalItems}</div>
            </>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="legacy-preview-table">
            <thead>
              <tr>
                <th className="legacy-index-column">Stt</th>
                {report.columns.map((column) => <th key={column.key}>{column.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {displayRows.length > 0 ? displayRows.map((row, index) => (
                <tr key={`${report.id}-${index}`}>
                  <td className={preview ? "legacy-preview-index" : "legacy-index-column"}>
                    {preview ? index + 1 : (page - 1) * pageSize + index + 1}
                  </td>
                  {report.columns.map((column) => (
                    <td key={column.key} className={preview ? "legacy-preview-placeholder" : undefined}>
                      {preview ? "abc" : formatValue(row?.[column.key], column.key)}
                    </td>
                  ))}
                </tr>
              )) : (
                <tr>
                  <td colSpan={report.columns.length + 1} className="legacy-empty-cell">
                    Không tìm thấy dữ liệu thống kê phù hợp điều kiện lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="legacy-signatures">
          <div><b>NGƯỜI LẬP BÁO CÁO</b><span>(Ký, ghi rõ họ tên)</span></div>
          <div><b>TRƯỞNG BỘ PHẬN</b><span>(Ký, ghi rõ họ tên)</span></div>
          <div><b>GIÁM ĐỐC BRAVO</b><span>(Ký, ghi rõ họ tên)</span></div>
        </div>
      </div>
    </div>
  );
}

const chartToneClasses = {
  teal: "bg-teal-600",
  amber: "bg-amber-500",
  violet: "bg-violet-500",
  rose: "bg-rose-500",
} as const;

function ReportSummary({ report, result }: { report: ReportDefinition; result: ReportQueryResult }) {
  if (!report.summary?.length) return null;
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {report.summary.map((field) => (
        <Card key={field.key}>
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-slate-500">{field.label}</div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
              {formatSummaryValue(result.summary?.[field.key], field.format)}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ReportChart({ report, result }: { report: ReportDefinition; result: ReportQueryResult }) {
  const config = report.chart;
  const points = Array.isArray(result.chart) ? result.chart : [];
  if (!config || !points.length) return null;

  const maxValue = Math.max(
    1,
    ...points.flatMap((point) =>
      config.series.map((series) => Math.max(0, Number(point[series.key] ?? 0))),
    ),
  );

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-bold text-slate-950">Biểu đồ tổng hợp</div>
            <div className="mt-1 text-xs text-slate-500">Dùng cùng tập lọc với bảng chi tiết</div>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-slate-500">
            {config.series.map((series) => (
              <span key={series.key} className="inline-flex items-center gap-1.5">
                <span className={`size-2 rounded-full ${chartToneClasses[series.tone]}`} />
                {series.label}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-5 space-y-4">
          {points.map((point, index) => (
            <div key={`${String(point[config.labelKey] ?? "point")}-${index}`}>
              <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                <span className="min-w-0 truncate font-semibold text-slate-700">
                  {String(point[config.labelKey] ?? "Chưa xác định")}
                </span>
                <span className="shrink-0 text-slate-400">
                  {config.series.map((series) => Number(point[series.key] ?? 0).toLocaleString("vi-VN")).join(" / ")}
                </span>
              </div>
              <div className="space-y-1.5">
                {config.series.map((series) => {
                  const value = Math.max(0, Number(point[series.key] ?? 0));
                  return (
                    <div key={series.key} className="h-2 overflow-hidden rounded-full bg-slate-100" title={`${series.label}: ${value}`}>
                      <div
                        className={`h-full rounded-full ${chartToneClasses[series.tone]}`}
                        style={{ width: `${Math.min(100, (value / maxValue) * 100)}%` }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ReportPagination({
  page,
  size,
  totalItems,
  onChange,
}: {
  page: number;
  size: number;
  totalItems: number;
  onChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / size));
  if (totalPages <= 1) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
      <span className="text-slate-500">Trang {page} / {totalPages} · {totalItems.toLocaleString("vi-VN")} bản ghi</span>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Trang trước
        </Button>
        <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
          Trang sau
        </Button>
      </div>
    </div>
  );
}

export function ReportsWorkspace() {
  const [selectedReport, setSelectedReport] =
    useState<ReportDefinition>(defaultReport);
  const [filters, setFilters] = useState<ReportFilters>(() => filtersForReport(defaultReport.id));
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {
      recruitment: true,
      hr: true,
      evaluation: true,
    },
  );
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const departmentsQuery = useQuery({
    queryKey: ["report-departments"],
    queryFn: () => api.list("/reports/departments", { resource: "reports" }),
  });
  const positionsQuery = useQuery({
    queryKey: ["report-positions"],
    queryFn: () => api.list("/reports/positions", { resource: "reports" }),
  });
  const employeesQuery = useQuery({
    queryKey: ["report-employees"],
    queryFn: () => api.queryReport("hr_employees", { department: "ALL", position: "ALL", status: "ALL" }, { page: 1, size: 100 }),
  });
  const reportMutation = useMutation({
    mutationFn: (requestedPage: number) => api.queryReport(selectedReport.id, filters, { page: requestedPage, size: pageSize }),
    onSuccess: () => {
      setHasRun(true);
      setShowFilters(false);
    },
  });
  const reportData = reportMutation.data;
  const departments: ReportOption[] = departmentsQuery.data?.map((item) => ({
    id: String(item.department_id ?? item.id ?? ""),
    label: String(item.department_name ?? item.name ?? ""),
  })).filter((item) => item.id && item.label) ?? fallbackDepartments;
  const positions: ReportOption[] = positionsQuery.data?.map((item) => ({
    id: String(item.position_id ?? item.id ?? ""),
    label: String(item.position_name ?? item.name ?? ""),
  })).filter((item) => item.id && item.label) ?? [];
  const employees: ReportOption[] = employeesQuery.data?.data?.map((item) => ({
    id: String(item.employeeId ?? item.employee_id ?? ""),
    label: `${String(item.employeeCode ?? item.employee_code ?? "")} · ${String(item.fullName ?? item.full_name ?? "")}`.trim(),
  })).filter((item) => item.id && item.label) ?? [];

  const chooseReport = (report: ReportDefinition) => {
    setSelectedReport(report);
    setFilters(filtersForReport(report.id));
    setHasRun(false);
    setPage(1);
    setShowFilters(false);
    reportMutation.reset();
  };

  const runReport = () => {
    setPage(1);
    reportMutation.mutate(1);
  };

  const changePage = (nextPage: number) => {
    setPage(nextPage);
    reportMutation.mutate(nextPage);
  };

  const setDepartment = (departmentId: string) => {
    const option = departments.find((item) => item.id === departmentId);
    setFilters((current) => ({
      ...current,
      department: departmentId,
      departmentName: option?.label ?? (departmentId === "ALL" ? "Toàn công ty" : departmentId),
    }));
  };

  const setPosition = (positionId: string) => {
    const option = positions.find((item) => item.id === positionId);
    setFilters((current) => ({
      ...current,
      position: positionId,
      positionName: option?.label ?? (positionId === "ALL" ? "Tất cả vị trí" : positionId),
    }));
  };

  const exportCsv = () => {
    if (!reportData?.data) return;
    const header = selectedReport.columns
      .map((column) => csvValue(column.label))
      .join(",");
    const body = reportData.data
      .map((row) =>
        selectedReport.columns
          .map((column) => csvValue(formatValue(row[column.key], column.key)))
          .join(","),
      )
      .join("\n");
    const blob = new Blob([`\uFEFF${header}\n${body}`], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedReport.id}-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    if (!reportData?.data) return;
    const headers = selectedReport.columns
      .map((column) => `<th>${escapeHtml(column.label)}</th>`)
      .join("");
    const rows = reportData.data
      .map(
        (row) =>
          `<tr>${selectedReport.columns.map((column) => `<td>${escapeHtml(formatValue(row[column.key], column.key))}</td>`).join("")}</tr>`,
      )
      .join("");
     const html = `<html><head><meta charset="utf-8"></head><body><h2>${escapeHtml(selectedReport.title)}</h2><p>${escapeHtml(filters.startDate)} - ${escapeHtml(filters.endDate)} | ${escapeHtml(filters.department === "ALL" ? "Toàn công ty" : filters.departmentName)}</p><table border="1"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></body></html>`;
    const blob = new Blob(["\uFEFF", html], {
      type: "application/vnd.ms-excel;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedReport.id}-${Date.now()}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredGroups = reportGroups
    .map((group) => ({
      ...group,
      reports: group.reports.filter((report) =>
        report.title.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
      ),
    }))
    .filter((group) => group.reports.length > 0);

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-teal-700">
            <Layers size={15} /> Decision Intelligence
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950">
            Báo cáo & phân tích
          </h1>
          
        </div>
        <div className="flex flex-wrap gap-2">
           {hasRun && (
             <Button variant="secondary" onClick={() => setShowFilters(true)}>
               <SlidersHorizontal size={16} /> Bộ lọc
             </Button>
           )}
          <Button
            variant="secondary"
            onClick={() => window.print()}
            disabled={!hasRun}
          >
            <Printer size={16} /> In / lưu PDF
          </Button>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[290px_1fr]">
        <Card className="h-fit overflow-hidden">
          <div className="border-b border-slate-100 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Layers size={16} className="text-teal-700" /> Danh mục báo cáo
              </div>
               <Badge tone="teal">19 mẫu</Badge>
            </div>
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-3 text-slate-400"
              />
              <Input
                className="h-9 pl-9 text-xs"
                placeholder="Tìm báo cáo..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>
          <div className="max-h-[620px] overflow-y-auto p-2">
            {filteredGroups.map((group) => (
              <div key={group.id} className="mb-2">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-slate-600 hover:bg-slate-50"
                  onClick={() =>
                    setExpandedGroups((current) => ({
                      ...current,
                      [group.id]: !current[group.id],
                    }))
                  }
                >
                  {expandedGroups[group.id] ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                  {group.title}
                </button>
                {expandedGroups[group.id] &&
                  group.reports.map((report) => (
                    <button
                      type="button"
                      key={report.id}
                      onClick={() => chooseReport(report)}
                      className={`flex w-full items-start gap-2 rounded-lg px-7 py-2 text-left text-xs transition ${selectedReport.id === report.id ? "bg-teal-700 font-bold text-white" : "text-slate-600 hover:bg-teal-50 hover:text-teal-800"}`}
                    >
                      <span className="pt-0.5">
                        {selectedReport.id === report.id ? (
                          <ChevronRight size={13} />
                        ) : (
                          <span className="block size-1.5 rounded-full bg-current opacity-40" />
                        )}
                      </span>
                      <span>{report.title}</span>
                    </button>
                  ))}
              </div>
            ))}
          </div>
        </Card>

        <div className="min-w-0 space-y-5">
          <Card>
            <CardContent className="p-5">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-700">
                    Đang chọn
                  </div>
                  <h2 className="mt-1 font-display text-xl font-bold text-slate-950">
                    {selectedReport.title}
                  </h2>
                </div>
                 {!hasRun && (
                   <Button onClick={() => setShowFilters(true)}>
                     <Play size={16} /> Chạy báo cáo
                   </Button>
                 )}
                 {hasRun && !showFilters && (
                   <Button onClick={() => setShowFilters(true)}>
                     <SlidersHorizontal size={16} /> Đổi bộ lọc
                   </Button>
                 )}
              </div>
            </CardContent>
          </Card>

          {showFilters && (
            <div
              className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm"
              role="presentation"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) setShowFilters(false);
              }}
            >
              <Card
                className="max-h-[92vh] w-full max-w-4xl overflow-hidden shadow-2xl"
                role="dialog"
                aria-modal="true"
                aria-labelledby="report-filter-title"
              >
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50/80 p-6">
                  <div className="flex items-start gap-3">
                    <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-teal-100 text-teal-700">
                      <Filter size={20} />
                    </div>
                    <div>
                      <h2 id="report-filter-title" className="font-display text-xl font-bold text-slate-950">
                        Điều kiện lọc báo cáo
                      </h2>
                      <div className="mt-1 text-sm text-slate-500">{selectedReport.title}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowFilters(false)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-800"
                    aria-label="Đóng bộ lọc"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="max-h-[calc(92vh-125px)] overflow-y-auto p-6 sm:p-8">
                  <div className="grid gap-5 sm:grid-cols-2">
                    {filterEnabled(selectedReport, "date") && (
                      <>
                        <label className="text-sm font-bold text-slate-700">
                          Từ ngày
                          <Input
                            className="mt-2 h-11"
                            type="date"
                            value={filters.startDate}
                            onChange={(event) => setFilters((current) => ({ ...current, startDate: event.target.value }))}
                          />
                        </label>
                        <label className="text-sm font-bold text-slate-700">
                          Đến ngày
                          <Input
                            className="mt-2 h-11"
                            type="date"
                            value={filters.endDate}
                            onChange={(event) => setFilters((current) => ({ ...current, endDate: event.target.value }))}
                          />
                        </label>
                      </>
                    )}
                    {filterEnabled(selectedReport, "department") && (
                      <label className="text-sm font-bold text-slate-700">
                        Phòng ban
                        <select
                          className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-normal outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                          value={filters.department}
                          onChange={(event) => setDepartment(event.target.value)}
                        >
                          <option value="ALL">Toàn công ty</option>
                          {departments.map((department) => (
                            <option key={department.id} value={department.id}>{department.label}</option>
                          ))}
                        </select>
                      </label>
                    )}
                    {filterEnabled(selectedReport, "position") && (
                      <label className="text-sm font-bold text-slate-700">
                        Vị trí
                        <select
                          className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-normal outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                          value={filters.position}
                          onChange={(event) => setPosition(event.target.value)}
                        >
                          <option value="ALL">Tất cả vị trí</option>
                          {positions.map((position) => (
                            <option key={position.id} value={position.id}>{position.label}</option>
                          ))}
                        </select>
                      </label>
                    )}
                    {filterEnabled(selectedReport, "status") && (
                      <label className="text-sm font-bold text-slate-700">
                        Trạng thái
                        <select
                          className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-normal outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                          value={filters.status}
                          onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
                        >
                          <option value="ALL">Tất cả trạng thái</option>
                          <option value="tiếp nhận hồ sơ">Tiếp nhận hồ sơ</option>
                          <option value="đã sơ loại">Đã sơ loại</option>
                          <option value="đã tạo lịch">Đã tạo lịch</option>
                          <option value="đã phỏng vấn">Đã phỏng vấn</option>
                          <option value="đã quyết định loại">Đã quyết định loại</option>
                          <option value="đã quyết định tuyển">Đã quyết định tuyển</option>
                          <option value="đi làm">Đi làm</option>
                        </select>
                      </label>
                    )}
                    {filterEnabled(selectedReport, "result") && (
                      <label className="text-sm font-bold text-slate-700">
                        Kết quả
                        <select
                          className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-normal outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                          value={filters.result}
                          onChange={(event) => setFilters((current) => ({ ...current, result: event.target.value }))}
                        >
                          <option value="ALL">Tất cả kết quả</option>
                          <option value="ĐẠT">Đạt</option>
                          <option value="KHÔNG ĐẠT">Không đạt</option>
                        </select>
                      </label>
                    )}
                    {filterEnabled(selectedReport, "type") && (
                      <label className="text-sm font-bold text-slate-700">
                        Loại quyết định
                        <select
                          className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-normal outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                          value={filters.type}
                          onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}
                        >
                          <option value="ALL">Tất cả</option>
                          <option value="REWARD">Khen thưởng</option>
                          <option value="DISCIPLINE">Kỷ luật</option>
                        </select>
                      </label>
                    )}
                    {filterEnabled(selectedReport, "employee") && (
                      <label className="text-sm font-bold text-slate-700">
                        Nhân viên
                        <select
                          className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-normal outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                          value={filters.employeeId}
                          onChange={(event) => setFilters((current) => ({ ...current, employeeId: event.target.value }))}
                        >
                          <option value="ALL">Tất cả nhân viên</option>
                          {employees.map((employee) => (
                            <option key={employee.id} value={employee.id}>{employee.label}</option>
                          ))}
                        </select>
                      </label>
                    )}
                    {filterEnabled(selectedReport, "date") && (
                      <label className="text-sm font-bold text-slate-700 sm:col-span-2">
                        Kỳ báo cáo nhanh
                        <select
                          className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-normal outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                          value={filters.period}
                          onChange={(event) => setFilters((current) => filtersForPeriod(event.target.value, current))}
                        >
                          <option>7 ngày gần nhất</option>
                          <option>Năm 2026</option>
                          <option>Quý I/2026</option>
                          <option>Quý II/2026</option>
                          <option>Tháng 08/2026</option>
                        </select>
                      </label>
                    )}
                  </div>
                  <div className="mt-8 flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-5 sm:flex-row">
                    <Button size="lg" variant="secondary" onClick={() => setShowFilters(false)}>
                      Hủy
                    </Button>
                    <Button size="lg" onClick={runReport} disabled={reportMutation.isPending}>
                      <Play size={16} />{" "}
                      {reportMutation.isPending ? "Đang kết xuất..." : "Xem báo cáo"}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {reportMutation.error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {reportMutation.error instanceof Error
                ? reportMutation.error.message
                : "Không thể chạy báo cáo."}
            </div>
          )}

          <div className="report-print-sheet">
            {hasRun ? (
              <div className="legacy-report-result">
                <div className="legacy-report-toolbar">
                  <div className="legacy-report-toolbar-title">
                    <span>Kết quả báo cáo</span>
                    <strong>{selectedReport.title}</strong>
                  </div>
                  <div className="legacy-report-actions">
                    <Button variant="secondary" size="sm" onClick={exportExcel}>
                      <FileSpreadsheet size={14} /> Xuất Excel
                    </Button>
                    <Button variant="secondary" size="sm" onClick={exportCsv}>
                      <Download size={14} /> Xuất CSV
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => window.print()}>
                      <Printer size={14} /> In / Lưu PDF
                    </Button>
                  </div>
                 </div>
                 <div className="legacy-filter-banner">
                   {filterEnabled(selectedReport, "date") && <span> <b>Thời gian:</b> {filters.startDate} đến {filters.endDate}</span>}
                   {filterEnabled(selectedReport, "department") && <span> <b>Phòng ban:</b> {filters.department === "ALL" ? "Toàn công ty" : filters.departmentName}</span>}
                   {filterEnabled(selectedReport, "position") && <span> <b>Vị trí:</b> {filters.position === "ALL" ? "Tất cả vị trí" : filters.positionName}</span>}
                   {filterEnabled(selectedReport, "status") && <span> <b>Trạng thái:</b> {filters.status === "ALL" ? "Tất cả" : filters.status}</span>}
                   {filterEnabled(selectedReport, "type") && <span> <b>Loại:</b> {filters.type === "ALL" ? "Tất cả" : filters.type === "REWARD" ? "Khen thưởng" : "Kỷ luật"}</span>}
                   <span> <b>Số bản ghi:</b> {reportData?.totalItems ?? reportData?.data?.length ?? 0} kết quả</span>
                 </div>
                 {reportData && <ReportSummary report={selectedReport} result={reportData} />}
                 {reportData && <ReportChart report={selectedReport} result={reportData} />}
                 <ReportPaper
                   report={selectedReport}
                   filters={filters}
                   rows={reportData?.data ?? []}
                   page={reportData?.page ?? page}
                   pageSize={reportData?.size ?? pageSize}
                   totalItems={reportData?.totalItems ?? reportData?.data?.length ?? 0}
                 />
                 {reportData && (
                   <ReportPagination
                     page={reportData.page ?? page}
                     size={reportData.size ?? pageSize}
                     totalItems={reportData.totalItems ?? reportData.data.length}
                     onChange={changePage}
                   />
                 )}
               </div>
            ) : (
              <div className="legacy-report-preview-container">
                <ReportPaper report={selectedReport} filters={filters} rows={[]} preview />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
