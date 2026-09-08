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
import { reportGroups, defaultReport, type ReportDefinition } from "@/lib/report-config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ReportFilters = {
  startDate: string;
  endDate: string;
  department: string;
  period: string;
};

const initialFilters: ReportFilters = {
  startDate: "2026-01-01",
  endDate: "2026-12-31",
  department: "ALL",
  period: "Năm 2026",
};

const fallbackDepartments = [
  "Khối Kỹ thuật Phần mềm",
  "Khối Kinh doanh ERP",
  "Phòng Hành chính Nhân sự",
  "Ban Giám đốc",
];

function filtersForPeriod(period: string, current: ReportFilters) {
  if (period === "Quý I/2026") return { ...current, period, startDate: "2026-01-01", endDate: "2026-03-31" };
  if (period === "Quý II/2026") return { ...current, period, startDate: "2026-04-01", endDate: "2026-06-30" };
  if (period === "Tháng 08/2026") return { ...current, period, startDate: "2026-08-01", endDate: "2026-08-31" };
  return { ...current, period, startDate: "2026-01-01", endDate: "2026-12-31" };
}

function formatValue(value: unknown, key: string) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "number") return value.toLocaleString("vi-VN");
  if (key.includes("date") || key === "dob" || key === "join_date") {
    const date = typeof value === "number" ? new Date(value) : new Date(String(value));
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

export function ReportsWorkspace() {
  const [selectedReport, setSelectedReport] = useState<ReportDefinition>(defaultReport);
  const [filters, setFilters] = useState<ReportFilters>(initialFilters);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    recruitment: true,
    hr: true,
    evaluation: true,
  });
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [hasRun, setHasRun] = useState(false);
  const departmentsQuery = useQuery({
    queryKey: ["report-departments"],
    queryFn: () => api.list("/reports/departments", { resource: "reports" }),
  });
  const reportMutation = useMutation({
    mutationFn: () => api.queryReport(selectedReport.id, filters),
    onSuccess: () => setHasRun(true),
  });
  const reportData = reportMutation.data;
  const departments = departmentsQuery.data?.map((item) => String(item.department_name ?? "")).filter(Boolean) ?? fallbackDepartments;

  const chooseReport = (report: ReportDefinition) => {
    setSelectedReport(report);
    setHasRun(false);
    reportMutation.reset();
  };

  const runReport = () => reportMutation.mutate();

  const exportCsv = () => {
    if (!reportData?.data) return;
    const header = selectedReport.columns.map((column) => csvValue(column.label)).join(",");
    const body = reportData.data.map((row) => selectedReport.columns.map((column) => csvValue(formatValue(row[column.key], column.key))).join(",")).join("\n");
    const blob = new Blob([`\uFEFF${header}\n${body}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedReport.id}-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    if (!reportData?.data) return;
    const headers = selectedReport.columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join("");
    const rows = reportData.data.map((row) => `<tr>${selectedReport.columns.map((column) => `<td>${escapeHtml(formatValue(row[column.key], column.key))}</td>`).join("")}</tr>`).join("");
    const html = `<html><head><meta charset="utf-8"></head><body><h2>${escapeHtml(selectedReport.title)}</h2><p>${escapeHtml(filters.startDate)} - ${escapeHtml(filters.endDate)} | ${escapeHtml(filters.department === "ALL" ? "Toàn công ty" : filters.department)}</p><table border="1"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></body></html>`;
    const blob = new Blob(["\uFEFF", html], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedReport.id}-${Date.now()}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredGroups = reportGroups.map((group) => ({
    ...group,
    reports: group.reports.filter((report) => report.title.toLocaleLowerCase().includes(search.toLocaleLowerCase())),
  })).filter((group) => group.reports.length > 0);

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-teal-700">
            <Layers size={15} /> Decision Intelligence
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950">Báo cáo & phân tích</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Chọn một trong 18 báo cáo để lọc, xem kết quả và xuất dữ liệu quản trị.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setShowFilters((visible) => !visible)}><SlidersHorizontal size={16} /> Bộ lọc</Button>
          <Button variant="secondary" onClick={() => window.print()} disabled={!hasRun}><Printer size={16} /> In / lưu PDF</Button>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[290px_1fr]">
        <Card className="h-fit overflow-hidden">
          <div className="border-b border-slate-100 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900"><Layers size={16} className="text-teal-700" /> Danh mục báo cáo</div>
              <Badge tone="teal">18 mẫu</Badge>
            </div>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-3 text-slate-400" />
              <Input className="h-9 pl-9 text-xs" placeholder="Tìm báo cáo..." value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
          </div>
          <div className="max-h-[620px] overflow-y-auto p-2">
            {filteredGroups.map((group) => (
              <div key={group.id} className="mb-2">
                <button type="button" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-slate-600 hover:bg-slate-50" onClick={() => setExpandedGroups((current) => ({ ...current, [group.id]: !current[group.id] }))}>
                  {expandedGroups[group.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  {group.title}
                </button>
                {expandedGroups[group.id] && group.reports.map((report) => (
                  <button type="button" key={report.id} onClick={() => chooseReport(report)} className={`flex w-full items-start gap-2 rounded-lg px-7 py-2 text-left text-xs transition ${selectedReport.id === report.id ? "bg-teal-700 font-bold text-white" : "text-slate-600 hover:bg-teal-50 hover:text-teal-800"}`}>
                    <span className="pt-0.5">{selectedReport.id === report.id ? <ChevronRight size={13} /> : <span className="block size-1.5 rounded-full bg-current opacity-40" />}</span>
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
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-700">Đang chọn</div>
                  <h2 className="mt-1 font-display text-xl font-bold text-slate-950">{selectedReport.title}</h2>
                  <p className="mt-1 text-xs text-slate-500">Mã báo cáo: <span className="font-mono font-bold text-teal-700">{selectedReport.id}</span></p>
                </div>
                <Button onClick={runReport} disabled={reportMutation.isPending}><Play size={16} /> {reportMutation.isPending ? "Đang kết xuất..." : "Chạy báo cáo"}</Button>
              </div>
              {showFilters && (
                <div className="mt-5 grid gap-3 border-t border-slate-100 pt-5 md:grid-cols-2 xl:grid-cols-4">
                  <label className="text-xs font-bold text-slate-600">Từ ngày<Input className="mt-1.5 h-10" type="date" value={filters.startDate} onChange={(event) => setFilters((current) => ({ ...current, startDate: event.target.value }))} /></label>
                  <label className="text-xs font-bold text-slate-600">Đến ngày<Input className="mt-1.5 h-10" type="date" value={filters.endDate} onChange={(event) => setFilters((current) => ({ ...current, endDate: event.target.value }))} /></label>
                  <label className="text-xs font-bold text-slate-600">Phòng ban<select className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal outline-none focus:border-teal-500" value={filters.department} onChange={(event) => setFilters((current) => ({ ...current, department: event.target.value }))}><option value="ALL">Toàn công ty</option>{departments.map((department) => <option key={department} value={department}>{department}</option>)}</select></label>
                  <label className="text-xs font-bold text-slate-600">Kỳ báo cáo<select className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal outline-none focus:border-teal-500" value={filters.period} onChange={(event) => setFilters((current) => filtersForPeriod(event.target.value, current))}><option>Năm 2026</option><option>Quý I/2026</option><option>Quý II/2026</option><option>Tháng 08/2026</option></select></label>
                </div>
              )}
            </CardContent>
          </Card>

          {reportMutation.error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{reportMutation.error instanceof Error ? reportMutation.error.message : "Không thể chạy báo cáo."}</div>}

          <Card className="report-print-sheet overflow-hidden">
            <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
              <div><div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Kết quả báo cáo</div><h3 className="mt-1 font-display text-lg font-bold text-slate-950">{selectedReport.title}</h3></div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={exportExcel} disabled={!hasRun}><FileSpreadsheet size={14} /> Excel</Button>
                <Button variant="secondary" size="sm" onClick={exportCsv} disabled={!hasRun}><Download size={14} /> CSV</Button>
              </div>
            </div>
            <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-3 text-xs text-slate-500">Từ {filters.startDate} đến {filters.endDate} · {filters.department === "ALL" ? "Toàn công ty" : filters.department} · {reportData?.data?.length ?? 0} bản ghi</div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400"><tr><th className="px-5 py-3">STT</th>{selectedReport.columns.map((column) => <th key={column.key} className="px-5 py-3">{column.label}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {hasRun && reportData?.data?.length ? reportData.data.map((row, index) => <tr key={`${selectedReport.id}-${index}`} className="hover:bg-teal-50/30"><td className="px-5 py-4 text-xs text-slate-400">{index + 1}</td>{selectedReport.columns.map((column) => <td key={column.key} className="px-5 py-4 text-xs text-slate-600">{formatValue(row[column.key], column.key)}</td>)}</tr>) : <tr><td colSpan={selectedReport.columns.length + 1} className="px-5 py-16 text-center text-sm text-slate-400">{hasRun ? "Không tìm thấy dữ liệu phù hợp với điều kiện lọc." : "Chọn điều kiện và bấm Chạy báo cáo để xem dữ liệu."}</td></tr>}
                </tbody>
              </table>
            </div>
            {hasRun && reportData?.summary && Object.keys(reportData.summary).length > 0 && <div className="flex flex-wrap gap-2 border-t border-slate-100 px-5 py-4">{Object.entries(reportData.summary).map(([key, value]) => <span key={key} className="rounded-lg bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-800">{key}: {String(value)}</span>)}</div>}
            {!hasRun && <div className="border-t border-slate-100 px-5 py-4 text-xs text-slate-400">{selectedReport.sampleMeta.join(" · ")}</div>}
          </Card>
        </div>
      </div>
    </div>
  );
}
