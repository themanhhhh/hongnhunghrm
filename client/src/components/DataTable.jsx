import React, { useState } from 'react';
import { Search, Plus, ChevronLeft, ChevronRight, Download, Printer } from 'lucide-react';
import { formatDate, formatDateTime } from '../utils/date';

const exportText = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const csvValue = (value) => `"${exportText(value).replaceAll('"', '""')}"`;

const getExportValue = (row, column) => {
  if (typeof column.exportValue === 'function') return column.exportValue(row);
  const key = column.accessor || column.key;
  const value = key ? row[key] : '';
  if (isDateColumn(column)) return isDateTimeColumn(column) ? formatDateTime(value, '') : formatDate(value, '');
  if (key) return value;
  return '';
};

const isDateColumn = (column) => {
  const key = String(column.accessor || column.key || '').toLowerCase();
  const header = String(column.header || '').toLowerCase();
  return /(^|_)(date|time|at)$/.test(key) || key === 'date_of_birth' || header.includes('ngày');
};

const isDateTimeColumn = (column) => /(^|_)(time|at)$/.test(String(column.accessor || column.key || '').toLowerCase());

const renderCellValue = (row, column) => {
  if (column.render) return typeof column.render === 'function' ? column.render(row) : '—';
  const key = column.accessor || column.key;
  const value = key ? row[key] : undefined;
  if (value === undefined || value === null || value === '') return '—';
  if (isDateColumn(column)) return isDateTimeColumn(column) ? formatDateTime(value) : formatDate(value);
  return String(value);
};

export const DataTable = ({
  columns,
  data,
  onAdd,
  addLabel = 'Thêm mới',
  searchPlaceholder = 'Tìm kiếm dữ liệu...',
  filterOptions = [],
  onFilterChange,
  loading = false,
  groupBy = null, // e.g. 'plan_name' or 'request_code'
  groupTitleFunc = null,
  onRowDoubleClick = null
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Filter & Search Logic
  const safeData = Array.isArray(data) ? data.filter(item => item !== null && item !== undefined) : [];
  const filteredData = safeData.filter((item) => {
    if (!item) return false;
    if (!searchTerm) return true;
    return Object.values(item).some(
      (val) => val !== null && val !== undefined && String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const exportRows = () => filteredData.map((row, index) => [
    index + 1,
    ...columns.map((column) => getExportValue(row, column))
  ]);

  const handleExportCsv = () => {
    const header = ['STT', ...columns.map((column) => column.header)].map(csvValue).join(',');
    const body = exportRows().map((row) => row.map(csvValue).join(',')).join('\n');
    const blob = new Blob([`\uFEFF${header}\n${body}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bravo-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) return;
    const header = ['STT', ...columns.map((column) => column.header)]
      .map((value) => `<th>${exportText(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;')}</th>`)
      .join('');
    const body = exportRows().map((row) => `<tr>${row.map((value) => `<td>${exportText(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;')}</td>`).join('')}</tr>`).join('');
    printWindow.document.write(`<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Danh sách dữ liệu BRAVO</title><style>body{font-family:"Segoe UI",Arial,sans-serif;color:#0f172a;padding:24px}h1{font-size:20px}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #cbd5e1;padding:8px;text-align:left;vertical-align:top}th{background:#0f766e;color:#fff}@media print{body{padding:0}}</style></head><body><h1>Danh sách dữ liệu BRAVO</h1><table><thead><tr>${header}</tr></thead><tbody>${body || '<tr><td colspan="99">Không có dữ liệu</td></tr>'}</tbody></table></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  // Helper for grouping data
  const renderGroupedTableBody = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>
            Đang tải dữ liệu từ máy chủ BRAVO...
          </td>
        </tr>
      );
    }

    if (paginatedData.length === 0) {
      return (
        <tr>
          <td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: '2.5rem', color: '#94A3B8' }}>
            Không tìm thấy bản ghi nào tương ứng.
          </td>
        </tr>
      );
    }

    if (groupBy) {
      // Group items by key
      const groups = {};
      paginatedData.forEach((row) => {
        if (!row) return;
        const key = row[groupBy] || 'Khác';
        if (!groups[key]) groups[key] = [];
        groups[key].push(row);
      });

      let globalIndex = (currentPage - 1) * itemsPerPage;

      return Object.keys(groups).map((groupKey) => {
        const groupRows = groups[groupKey];
        const sampleRow = groupRows[0];
        const groupHeaderTitle = groupTitleFunc
          ? groupTitleFunc(sampleRow)
          : `⊟ ${groupKey}`;

        return (
          <React.Fragment key={groupKey}>
            {/* Bold Group Header Row matching BRAVO ERP Image 1 */}
            <tr style={{ backgroundColor: '#FFFBEB', borderBottom: '1px solid #FDE68A' }}>
              <td
                colSpan={columns.length + 1}
                style={{
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color: '#92400E',
                  padding: '0.6rem 1rem',
                  letterSpacing: '0.01em'
                }}
              >
                {groupHeaderTitle} ({groupRows.length} hồ sơ)
              </td>
            </tr>

            {/* Child Data Rows */}
            {groupRows.map((row, rIdx) => {
              if (!row) return null;
              globalIndex++;
              const rowKey = row.id || row.candidate_id || row.employee_id || row.leave_id || row.quota_id || rIdx;
              return (
                <tr
                  key={rowKey}
                  onDoubleClick={() => onRowDoubleClick && onRowDoubleClick(row)}
                  style={{
                    cursor: onRowDoubleClick ? 'pointer' : 'default',
                    userSelect: 'none'
                  }}
                  title={onRowDoubleClick ? 'Double-click để xem chi tiết' : ''}
                >
                  <td style={{ fontWeight: 600, color: '#64748B', whiteSpace: 'nowrap' }}>
                    {globalIndex}
                  </td>
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} style={{ whiteSpace: 'nowrap' }}>
                      {renderCellValue(row, col)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </React.Fragment>
        );
      });
    }

    // Normal non-grouped table rows
    return paginatedData.map((row, rIdx) => {
      if (!row) return null;
      const rowKey = row.id || row.candidate_id || row.employee_id || row.leave_id || row.quota_id || rIdx;
      return (
        <tr
          key={rowKey}
          onDoubleClick={() => onRowDoubleClick && onRowDoubleClick(row)}
          style={{
            cursor: onRowDoubleClick ? 'pointer' : 'default'
          }}
          title={onRowDoubleClick ? 'Double-click để xem chi tiết' : ''}
        >
          <td style={{ fontWeight: 600, color: '#64748B', whiteSpace: 'nowrap' }}>
            {(currentPage - 1) * itemsPerPage + rIdx + 1}
          </td>
          {columns.map((col, cIdx) => (
                    <td key={cIdx} style={{ whiteSpace: 'nowrap' }}>
                      {renderCellValue(row, col)}
            </td>
          ))}
        </tr>
      );
    });
  };

  return (
    <div className="table-container">
      {/* Top Toolbar: Search, Filters & Action Button */}
      <div style={{
        padding: '1rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: '#FFFFFF'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '280px' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
            />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.25rem', height: '38px', borderRadius: '6px' }}
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Dynamic Filter Dropdowns */}
          {filterOptions.map((f, idx) => (
            <select
              key={idx}
              className="form-select"
              style={{ width: 'auto', height: '38px', borderRadius: '6px', fontSize: '0.85rem' }}
              onChange={(e) => onFilterChange && onFilterChange(f.key, e.target.value)}
            >
              <option value="">-- Tất cả {f.label} --</option>
              {f.options.map((opt, oIdx) => (
                <option key={oIdx} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={handleExportCsv} style={{ height: '38px' }} title="Xuất dữ liệu CSV">
            <Download size={15} />
            <span>Xuất CSV</span>
          </button>
          <button className="btn btn-secondary" onClick={handlePrint} style={{ height: '38px' }} title="In bảng dữ liệu">
            <Printer size={15} />
            <span>In bảng</span>
          </button>
          {onAdd && (
            <button className="btn btn-primary" onClick={onAdd} style={{ height: '38px' }}>
              <Plus size={16} />
              <span>{addLabel}</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Area */}
      <div style={{ overflowX: 'auto' }}>
        <table className="erp-table">
          <thead>
            <tr>
              <th style={{ width: '50px', whiteSpace: 'nowrap' }}>STT</th>
              {columns.map((col, idx) => (
                <th key={idx} style={{ width: col.width || 'auto', whiteSpace: 'nowrap' }}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {renderGroupedTableBody()}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div style={{
        padding: '0.75rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTop: '1px solid var(--border-color)',
        backgroundColor: '#F8FAFC',
        fontSize: '0.85rem',
        color: '#64748B'
      }}>
        <span>
          Hiển thị <b>{filteredData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</b> - <b>{Math.min(currentPage * itemsPerPage, filteredData.length)}</b> trên tổng số <b>{filteredData.length}</b> kết quả
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            className="btn btn-secondary"
            style={{ padding: '0.35rem 0.65rem' }}
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          >
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontWeight: 600, color: '#0F172A' }}>
            Trang {currentPage} / {totalPages}
          </span>
          <button
            className="btn btn-secondary"
            style={{ padding: '0.35rem 0.65rem' }}
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
