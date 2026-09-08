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
} from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  reportGroups,
  defaultReport,
  type ReportDefinition,
} from "@/lib/report-config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ReportFilters = {
  startDate: string;
  endDate: string;
  department: string;
  position: string;
  period: string;
};

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
    position: "ALL",
    period: "7 ngày gần nhất",
  };
}

const initialFilters: ReportFilters = {
    ...lastWeekFilters(),
    department: "ALL",
    position: "ALL",
};

const fallbackDepartments = [
  "Khối Kỹ thuật Phần mềm",
  "Khối Kinh doanh ERP",
  "Phòng Hành chính Nhân sự",
  "Ban Giám đốc",
];

function filtersForPeriod(period: string, current: ReportFilters) {
  if (period === "7 ngày gần nhất")
    return { ...lastWeekFilters(), department: current.department, position: current.position };
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

function formatValue(value: unknown, key: string) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "number") return value.toLocaleString("vi-VN");
  if (key.includes("date") || key === "dob" || key === "join_date") {
    const date =
      typeof value === "number" ? new Date(value) : new Date(String(value));
    if (!Number.isNaN(date.getTime())) return date.toLocaleDateString("vi-VN");
  }
  return String(value);
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
  preview = false,
}: {
  report: ReportDefinition;
  filters: ReportFilters;
  rows: Array<Record<string, unknown>>;
  preview?: boolean;
}) {
  const displayRows = preview ? Array.from({ length: 7 }, () => null) : rows;
  const department = filters.department === "ALL" ? "Toàn công ty" : filters.department;
  const position = filters.position === "ALL" ? "Tất cả vị trí" : filters.position;

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
              <div>• Từ ngày: {filters.startDate}</div>
              <div>• Đến ngày: {filters.endDate}</div>
              <div>• Phòng ban: {department}</div>
              <div>• Vị trí: {position}</div>
              <div>• Số bản ghi: {rows.length}</div>
            </>
          )}
        </div>

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
                <td className={preview ? "legacy-preview-index" : "legacy-index-column"}>{index + 1}</td>
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

        <div className="legacy-signatures">
          <div><b>NGƯỜI LẬP BÁO CÁO</b><span>(Ký, ghi rõ họ tên)</span></div>
          <div><b>TRƯỞNG BỘ PHẬN</b><span>(Ký, ghi rõ họ tên)</span></div>
          <div><b>GIÁM ĐỐC BRAVO</b><span>(Ký, ghi rõ họ tên)</span></div>
        </div>
      </div>
    </div>
  );
}

export function ReportsWorkspace() {
  const [selectedReport, setSelectedReport] =
    useState<ReportDefinition>(defaultReport);
  const [filters, setFilters] = useState<ReportFilters>(initialFilters);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {
      recruitment: true,
      hr: true,
      evaluation: true,
    },
  );
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [hasRun, setHasRun] = useState(false);
  const departmentsQuery = useQuery({
    queryKey: ["report-departments"],
    queryFn: () => api.list("/reports/departments", { resource: "reports" }),
  });
  const positionsQuery = useQuery({
    queryKey: ["report-positions"],
    queryFn: () => api.list("/reports/positions", { resource: "reports" }),
  });
  const reportMutation = useMutation({
    mutationFn: () => api.queryReport(selectedReport.id, filters),
    onSuccess: () => setHasRun(true),
  });
  const reportData = reportMutation.data;
  const departments =
    departmentsQuery.data
      ?.map((item) => String(item.department_name ?? ""))
      .filter(Boolean) ?? fallbackDepartments;
  const positions =
    positionsQuery.data
      ?.map((item) => String(item.position_name ?? ""))
      .filter(Boolean) ?? [];

  const chooseReport = (report: ReportDefinition) => {
    setSelectedReport(report);
    setFilters(lastWeekFilters());
    setHasRun(false);
    reportMutation.reset();
  };

  const runReport = () => reportMutation.mutate();

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
    const html = `<html><head><meta charset="utf-8"></head><body><h2>${escapeHtml(selectedReport.title)}</h2><p>${escapeHtml(filters.startDate)} - ${escapeHtml(filters.endDate)} | ${escapeHtml(filters.department === "ALL" ? "Toàn công ty" : filters.department)}</p><table border="1"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></body></html>`;
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
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Chọn một trong 18 báo cáo để lọc, xem kết quả và xuất dữ liệu quản
            trị.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => setShowFilters((visible) => !visible)}
          >
            <SlidersHorizontal size={16} /> Bộ lọc
          </Button>
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
              <Badge tone="teal">18 mẫu</Badge>
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
                <Button onClick={runReport} disabled={reportMutation.isPending}>
                  <Play size={16} />{" "}
                  {reportMutation.isPending
                    ? "Đang kết xuất..."
                    : "Chạy báo cáo"}
                </Button>
              </div>
              {showFilters && (
                <div className="mt-5 grid gap-3 border-t border-slate-100 pt-5 md:grid-cols-2 xl:grid-cols-5">
                  <label className="text-xs font-bold text-slate-600">
                    Từ ngày
                    <Input
                      className="mt-1.5 h-10"
                      type="date"
                      value={filters.startDate}
                      onChange={(event) =>
                        setFilters((current) => ({
                          ...current,
                          startDate: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="text-xs font-bold text-slate-600">
                    Vị trí
                    <select
                      className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal outline-none focus:border-teal-500"
                      value={filters.position}
                      onChange={(event) =>
                        setFilters((current) => ({
                          ...current,
                          position: event.target.value,
                        }))
                      }
                    >
                      <option value="ALL">Tất cả vị trí</option>
                      {positions.map((position) => (
                        <option key={position} value={position}>
                          {position}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs font-bold text-slate-600">
                    Đến ngày
                    <Input
                      className="mt-1.5 h-10"
                      type="date"
                      value={filters.endDate}
                      onChange={(event) =>
                        setFilters((current) => ({
                          ...current,
                          endDate: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="text-xs font-bold text-slate-600">
                    Phòng ban
                    <select
                      className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal outline-none focus:border-teal-500"
                      value={filters.department}
                      onChange={(event) =>
                        setFilters((current) => ({
                          ...current,
                          department: event.target.value,
                        }))
                      }
                    >
                      <option value="ALL">Toàn công ty</option>
                      {departments.map((department) => (
                        <option key={department} value={department}>
                          {department}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs font-bold text-slate-600">
                    Kỳ báo cáo
                    <select
                      className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal outline-none focus:border-teal-500"
                      value={filters.period}
                      onChange={(event) =>
                        setFilters((current) =>
                          filtersForPeriod(event.target.value, current),
                        )
                      }
                    >
                      <option>7 ngày gần nhất</option>
                      <option>Năm 2026</option>
                      <option>Quý I/2026</option>
                      <option>Quý II/2026</option>
                      <option>Tháng 08/2026</option>
                    </select>
                  </label>
                </div>
              )}
            </CardContent>
          </Card>

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
                  <span>🗓 <b>Thời gian:</b> {filters.startDate} đến {filters.endDate}</span>
                  <span>🏢 <b>Phòng ban:</b> {filters.department === "ALL" ? "Toàn công ty" : filters.department}</span>
                  <span>💼 <b>Vị trí:</b> {filters.position === "ALL" ? "Tất cả vị trí" : filters.position}</span>
                  <span>📊 <b>Số bản ghi:</b> {reportData?.data?.length ?? 0} kết quả</span>
                </div>
                <ReportPaper report={selectedReport} filters={filters} rows={reportData?.data ?? []} />
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
