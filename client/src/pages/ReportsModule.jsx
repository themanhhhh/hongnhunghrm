import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
    BarChart3,
    FileText,
    Filter,
    Printer,
    Download,
    ArrowLeft,
    ChevronDown,
    ChevronRight,
    Play,
    Calendar,
    Building2,
    Users,
    Search,
    RefreshCw,
    CheckCircle,
    Award,
    Layers
} from 'lucide-react';

// --- ALL 18 REPORTS DEFINITIONS ---
const REPORT_GROUPS = [
    {
        id: 'recruitment',
        title: 'Báo cáo tuyển dụng',
        icon: Users,
        reports: [
            {
                id: 'rec_result',
                title: 'Báo cáo kết quả tuyển dụng',
                columns: ['Mã KHTD', 'Tên Kế hoạch tuyển dụng', 'Chỉ tiêu (Người)', 'Ngân sách (VNĐ)', 'Số HĐ tiếp nhận', 'Đạt PV', 'Nhận Offer', 'Đã đi làm'],
                sampleMeta: ['Từ ngày: 01/01/2026', 'Đến ngày: 31/12/2026', 'Đợt tuyển dụng: Tất cả']
            },
            {
                id: 'rec_efficiency',
                title: 'Hiệu quả tuyển dụng theo tin theo nguồn',
                columns: ['Nguồn tuyển dụng', 'Số tin đăng', 'Tổng CV nhận', 'CV đạt yêu cầu', 'Số ứng viên PV', 'Số NV nhận việc', 'Chi phí (VNĐ)', 'Chi phí/Nhân sự (VNĐ)'],
                sampleMeta: ['Kênh tuyển dụng: Tất cả', 'Kỳ báo cáo: Quý I & Quý II 2026']
            },
            {
                id: 'rec_source_quality',
                title: 'Đánh giá chất lượng nguồn tuyển dụng',
                columns: ['Nguồn tuyển dụng', 'Tỷ lệ đạt thử việc (%)', 'Điểm KPI trung bình', 'Tỷ lệ gắn bó > 1 năm', 'Đánh giá tổng quan'],
                sampleMeta: ['Phạm vi đánh giá: Toàn công ty', 'Năm: 2026']
            },
            {
                id: 'rec_candidates_interview',
                title: 'Danh sách ứng viên tham gia phỏng vấn, thi tuyển',
                columns: ['Mã UV', 'Họ và tên ứng viên', 'Vị trí ứng tuyển', 'Vòng phỏng vấn', 'Ngày phỏng vấn', 'Người phỏng vấn', 'Kết quả'],
                sampleMeta: ['Trạng thái phỏng vấn: Tất cả', 'Người PV: Tất cả']
            },
            {
                id: 'rec_candidates_offer',
                title: 'Danh sách ứng viên trúng offer',
                columns: ['Mã UV', 'Họ và tên ứng viên', 'Vị trí nhận việc', 'Mã Offer', 'Mức lương đề xuất (VNĐ)', 'Ngày nhận việc dự kiến', 'Trạng thái Offer'],
                sampleMeta: ['Trạng thái Offer: Đã đồng ý / Chờ phản hồi']
            },
            {
                id: 'rec_candidates_hired',
                title: 'Danh sách ứng viên đi làm',
                columns: ['Mã UV', 'Mã NV mới', 'Họ và tên', 'Phòng ban nhận việc', 'Vị trí công tác', 'Ngày vào làm', 'Người hướng dẫn', 'Trạng thái'],
                sampleMeta: ['Tháng tiếp nhận: 08/2026']
            }
        ]
    },
    {
        id: 'hr',
        title: 'Báo cáo nhân sự',
        icon: Building2,
        reports: [
            {
                id: 'hr_turnover',
                title: 'Báo cáo biến động nhân sự',
                columns: ['Kỳ / Tháng', 'Số nhân sự đầu kỳ', 'Số nhân sự tuyển mới', 'Số nhân sự nghỉ việc', 'Số nhân sự cuối kỳ', 'Tỷ lệ biến động (%)'],
                sampleMeta: ['Thời gian: Năm 2026', 'Phòng ban: Toàn công ty']
            },
            {
                id: 'hr_summary',
                title: 'Báo cáo tổng hợp nhân sự',
                columns: ['Mã phòng', 'Tên Phòng ban / Bộ phận', 'Tổng số NV', 'Nam', 'Nữ', 'Trình độ Đại học', 'Trình độ Thạc sĩ trở lên'],
                sampleMeta: ['Tính đến ngày: 31/08/2026']
            },
            {
                id: 'hr_contracts',
                title: 'Báo cáo danh sách nhân viên theo hợp đồng lao động',
                columns: ['Mã NV', 'Họ và tên', 'Phòng ban', 'Chức danh', 'Số HĐLĐ', 'Loại hợp đồng', 'Ngày ký', 'Ngày hiệu lực', 'Trạng thái HĐ'],
                sampleMeta: ['Loại hợp đồng: Tất cả', 'Tình trạng: Đang có hiệu lực']
            },
            {
                id: 'hr_seniority',
                title: 'Báo cáo thâm niên làm việc',
                columns: ['Mã NV', 'Họ và tên', 'Phòng ban', 'Chức danh', 'Ngày vào công ty', 'Thâm niên làm việc', 'Nhóm thâm niên'],
                sampleMeta: ['Tính thâm niên đến: 31/08/2026']
            },
            {
                id: 'hr_birthdays',
                title: 'Danh sách CBNV sinh nhật',
                columns: ['Mã NV', 'Họ và tên CBNV', 'Phòng ban', 'Chức danh', 'Ngày sinh (DoB)', 'Số điện thoại', 'Email công ty'],
                sampleMeta: ['Sinh nhật trong tháng: Tháng 08']
            },
            {
                id: 'hr_contract_terminated',
                title: 'Danh sách nhân viên chấm dứt hợp đồng lao động',
                columns: ['Mã NV', 'Họ và tên', 'Phòng ban', 'Chức danh', 'Ngày kết thúc HĐ', 'Lý do chấm dứt', 'Bàn giao tài sản'],
                sampleMeta: ['Kỳ báo cáo: Năm 2026']
            },
            {
                id: 'hr_resigned',
                title: 'Danh sách nhân viên nghỉ việc',
                columns: ['Mã NV', 'Họ và tên', 'Phòng ban', 'Chức danh', 'Ngày nghỉ việc', 'Lý do nghỉ việc', 'Trạng thái bàn giao'],
                sampleMeta: ['Trạng thái: Đã quyết toán thủ tục nghỉ']
            },
            {
                id: 'hr_asof_date',
                title: 'Báo cáo nhân sự quản lý theo thời điểm',
                columns: ['Tên Bộ phận / Khối', 'Nhân sự chính thức', 'Nhân sự quản lý / Lãnh đạo', 'Thực tập sinh / Thử việc', 'Tổng định biên'],
                sampleMeta: ['Thời điểm chốt dữ liệu: 31/08/2026']
            }
        ]
    },
    {
        id: 'evaluation',
        title: 'Báo cáo đánh giá nhân sự',
        icon: Award,
        reports: [
            {
                id: 'eval_detail',
                title: 'Đánh giá chi tiết nhân viên',
                columns: ['Stt', 'Mã tiêu chí', 'Tiêu chí đánh giá', 'Tự đánh giá', 'Quản lý đánh giá', 'Trọng số', 'Điểm tổng hợp', 'Ghi chú'],
                sampleMeta: ['Người đánh giá: [ReviewerName]', 'Nhân viên: [EmployeeName]', 'Bộ phận: [Department]', 'Kỳ đánh giá: [EvaluationTermName]']
            },
            {
                id: 'eval_summary',
                title: 'Báo cáo tổng hợp đánh giá nhân viên',
                columns: ['Mã NV', 'Họ và tên', 'Phòng ban', 'Kỳ đánh giá', 'Điểm tự đánh giá', 'Điểm quản lý', 'Xếp loại chung', 'Thứ hạng'],
                sampleMeta: ['Kỳ đánh giá: Đánh giá định kỳ Năm 2026']
            },
            {
                id: 'eval_ranking',
                title: 'Báo cáo tổng hợp xếp loại nhân viên',
                columns: ['Xếp loại (Grade)', 'Tiêu chuẩn xếp loại', 'Số lượng CBNV', 'Tỷ lệ (%)', 'Mức thưởng đề xuất'],
                sampleMeta: ['Phạm vi: Toàn hệ thống BRAVO']
            },
            {
                id: 'eval_reward_discipline',
                title: 'Báo cáo đề xuất thưởng phạt',
                columns: ['Số quyết định', 'Tiêu đề / Hình thức', 'Mã NV', 'Họ và tên', 'Phòng ban', 'Loại hình (Thưởng/Phạt)', 'Số tiền (VNĐ)', 'Ngày hiệu lực', 'Lý do khen thưởng/kỷ luật'],
                sampleMeta: ['Hình thức: Thưởng / Kỷ luật', 'Năm: 2026']
            }
        ]
    }
];

export const ReportsModule = ({ activeSubTab }) => {
    // State Management
    const [expandedGroups, setExpandedGroups] = useState({
        recruitment: true,
        hr: true,
        evaluation: true
    });
    const [selectedReport, setSelectedReport] = useState(REPORT_GROUPS[2].reports[0]); // Default to 'eval_detail' as in screenshot
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [isExecutingReport, setIsExecutingReport] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);

    // Filter criteria state
    const [filterCriteria, setFilterCriteria] = useState({
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        department: 'ALL',
        status: 'ALL',
        period: 'Năm 2026'
    });

    const toggleGroup = (groupId) => {
        setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
    };

    // Single click: Select preview report
    const handleSelectReport = (report) => {
        setSelectedReport(report);
    };

    // Double click: Open Filter Criteria Modal
    const handleDoubleClickReport = (report) => {
        setSelectedReport(report);
        setShowFilterModal(true);
    };

    // Run/Execute Report API Call
    const handleRunReport = async () => {
        setLoading(true);
        setShowFilterModal(false);
        setIsExecutingReport(true);

        try {
            const res = await api.post('/reports/query', {
                reportId: selectedReport.id,
                filters: filterCriteria
            });
            if (res.success) {
                setReportData(res);
            } else {
                // Fallback mock data
                setReportData({
                    success: true,
                    reportId: selectedReport.id,
                    data: [
                        { id: 1, code: 'NV-2026-001', name: 'Nguyễn Văn Admin', dept: 'Khối Kỹ thuật', val1: '9.2', val2: '9.5', result: 'A+ (Xuất sắc)' },
                        { id: 2, code: 'NV-2026-002', name: 'Trần Thị Trưởng Phòng', dept: 'Phòng Nhân sự', val1: '9.0', val2: '9.2', result: 'A (Xuất sắc)' }
                    ],
                    summary: { total: 2 }
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Export to a properly formatted Excel file (.xls) matching the on-screen letterhead template
    const handleExportExcel = () => {
        if (!reportData || !reportData.data) return;

        const rowsHtml = reportData.data.map((row, idx) => {
            const values = Object.values(row);
            const cells = values.slice(0, selectedReport.columns.length).map(val => {
                const display = typeof val === 'number' && val > 1000 ? val.toLocaleString('vi-VN') : (val ?? '');
                return `<td style="border:1px solid #94A3B8;padding:6px 8px;font-size:13px;">${display}</td>`;
            }).join('');
            return `<tr><td style="border:1px solid #94A3B8;padding:6px 8px;text-align:center;font-size:13px;">${idx + 1}</td>${cells}</tr>`;
        }).join('');

        const headerCells = selectedReport.columns.map(col =>
            `<th style="border:1px solid #94A3B8;padding:6px 8px;background:#F1F5F9;font-size:13px;">${col}</th>`
        ).join('');

        const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8" /></head>
      <body style="font-family: Arial, sans-serif;">
        <table style="border-collapse:collapse;width:100%;">
          <tr><td colspan="${selectedReport.columns.length + 1}" style="font-weight:bold;font-size:13px;">ĐƠN VỊ: VĂN PHÒNG CÔNG TY CỔ PHẦN BRAVO</td></tr>
          <tr><td colspan="${selectedReport.columns.length + 1}" style="font-size:12px;color:#475569;">Địa chỉ: Hà Nội — Hệ thống Quản trị BRAVO 10 ERP — Mẫu số: BC-HRM/2026</td></tr>
          <tr><td colspan="${selectedReport.columns.length + 1}">&nbsp;</td></tr>
          <tr><td colspan="${selectedReport.columns.length + 1}" style="text-align:center;font-weight:bold;font-size:16px;">${selectedReport.title.toUpperCase()}</td></tr>
          <tr><td colspan="${selectedReport.columns.length + 1}" style="font-size:12px;color:#475569;">Từ ngày: ${filterCriteria.startDate} — Đến ngày: ${filterCriteria.endDate} — Phòng ban: ${filterCriteria.department === 'ALL' ? 'Toàn công ty' : filterCriteria.department} — Số bản ghi: ${reportData.data.length}</td></tr>
          <tr><td colspan="${selectedReport.columns.length + 1}">&nbsp;</td></tr>
          <tr><th style="border:1px solid #94A3B8;padding:6px 8px;background:#F1F5F9;font-size:13px;">Stt</th>${headerCells}</tr>
          ${rowsHtml}
        </table>
      </body>
      </html>`;

        const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${selectedReport.id}_${Date.now()}.xls`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Export to Excel CSV helper
    const handleExportCSV = () => {
        if (!reportData || !reportData.data) return;
        const headers = selectedReport.columns.join(',');
        const rows = reportData.data.map(r => Object.values(r).join(',')).join('\n');
        const blob = new Blob([`\uFEFF${headers}\n${rows}`], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${selectedReport.id}_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Print Handler
    const handlePrint = () => {
        window.print();
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* ---------------------------------------------------- */}
            {/* VIEW MODE 1: EXECUTED REPORT RESULTS VIEW           */}
            {/* ---------------------------------------------------- */}
            {isExecutingReport ? (
                <div className="printable-area" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* Top Action Bar */}
                    <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <button className="btn btn-secondary" onClick={() => setIsExecutingReport(false)}>
                                <ArrowLeft size={16} />
                                <span>Quay lại Danh sách Báo cáo</span>
                            </button>
                            <h3 style={{ fontSize: '1.1rem', color: '#0F172A', fontWeight: 700, borderLeft: '3px solid var(--bravo-teal)', paddingLeft: '0.75rem' }}>
                                {selectedReport.title}
                            </h3>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button className="btn btn-secondary" onClick={() => setShowFilterModal(true)}>
                                <Filter size={16} />
                                <span>Đổi bộ lọc</span>
                            </button>
                            <button className="btn btn-secondary" onClick={handleExportExcel}>
                                <Download size={16} />
                                <span>Xuất Excel</span>
                            </button>
                            <button className="btn btn-secondary" onClick={handleExportCSV}>
                                <Download size={16} />
                                <span>Xuất CSV</span>
                            </button>
                            <button className="btn btn-primary" onClick={handlePrint}>
                                <Printer size={16} />
                                <span>In / Lưu PDF</span>
                            </button>
                        </div>
                    </div>

                    {/* Filter Info Banner */}
                    <div style={{ background: '#F8FAFC', padding: '0.75rem 1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.85rem', color: '#475569', display: 'flex', gap: '1.5rem' }}>
                        <span>🗓 <b>Thời gian:</b> {filterCriteria.startDate} đến {filterCriteria.endDate}</span>
                        <span>🏢 <b>Phòng ban:</b> {filterCriteria.department === 'ALL' ? 'Toàn công ty' : filterCriteria.department}</span>
                        <span>📊 <b>Số bản ghi:</b> <b style={{ color: 'var(--bravo-teal-dark)' }}>{reportData?.data?.length || 0} kết quả</b></span>
                    </div>

                    {/* Report Result - dùng chung mẫu công văn với phần xem trước để khi in/xuất file luôn đẹp và nhất quán */}
                    <div className="a4-preview-paper printable-area">
                        <div className="preview-content">
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0F172A', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F172A', textTransform: 'uppercase' }}>
                                        ĐƠN VỊ: VĂN PHÒNG CÔNG TY CỔ PHẦN BRAVO
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#475569' }}>Địa chỉ: Hà Nội</div>
                                </div>
                                <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#64748B' }}>
                                    <div>Hệ thống Quản trị BRAVO 10 ERP</div>
                                    <div>Mẫu số: <b>BC-HRM/2026</b></div>
                                </div>
                            </div>

                            <div style={{ textAlign: 'center', margin: '2rem 0 1.5rem 0' }}>
                                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                                    {selectedReport.title}
                                </h2>
                            </div>

                            <div style={{
                                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 2rem', fontSize: '0.825rem', color: '#334155',
                                marginBottom: '1.5rem', background: '#F8FAFC', padding: '1rem', borderRadius: '6px', border: '1px solid #E2E8F0'
                            }}>
                                <div>• Từ ngày: {filterCriteria.startDate}</div>
                                <div>• Đến ngày: {filterCriteria.endDate}</div>
                                <div>• Phòng ban: {filterCriteria.department === 'ALL' ? 'Toàn công ty' : filterCriteria.department}</div>
                                <div>• Số bản ghi: {reportData?.data?.length || 0}</div>
                            </div>

                            <table className="preview-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '40px' }}>Stt</th>
                                        {selectedReport.columns.map((col, idx) => (
                                            <th key={idx}>{col}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={selectedReport.columns.length + 1} style={{ textAlign: 'center', padding: '2rem' }}>
                                                <RefreshCw size={24} className="spin" style={{ color: 'var(--bravo-teal)' }} />
                                                <div style={{ marginTop: '0.5rem', color: '#64748B' }}>Đang kết xuất dữ liệu báo cáo...</div>
                                            </td>
                                        </tr>
                                    ) : reportData?.data && reportData.data.length > 0 ? (
                                        reportData.data.map((row, rIdx) => {
                                            const values = Object.values(row);
                                            return (
                                                <tr key={rIdx}>
                                                    <td style={{ textAlign: 'center', color: '#64748B' }}>{rIdx + 1}</td>
                                                    {values.slice(0, selectedReport.columns.length).map((val, cIdx) => (
                                                        <td key={cIdx}>
                                                            {typeof val === 'number' && val > 1000 ? val.toLocaleString('vi-VN') : val}
                                                        </td>
                                                    ))}
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={selectedReport.columns.length + 1} style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8' }}>
                                                Không tìm thấy dữ liệu thống kê phù hợp điều kiện lọc.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            {/* Signatures Footer */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', textAlign: 'center', marginTop: '3.5rem', fontSize: '0.8rem', color: '#475569' }}>
                                <div>
                                    <b>NGƯỜI LẬP BÁO CÁO</b>
                                    <div style={{ fontSize: '0.725rem', fontStyle: 'italic', marginTop: '0.25rem' }}>(Ký, ghi rõ họ tên)</div>
                                </div>
                                <div>
                                    <b>TRƯỞNG BỘ PHẬN</b>
                                    <div style={{ fontSize: '0.725rem', fontStyle: 'italic', marginTop: '0.25rem' }}>(Ký, ghi rõ họ tên)</div>
                                </div>
                                <div>
                                    <b>GIÁM ĐỐC BRAVO</b>
                                    <div style={{ fontSize: '0.725rem', fontStyle: 'italic', marginTop: '0.25rem' }}>(Ký, ghi rõ họ tên)</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* ---------------------------------------------------- */
                /* VIEW MODE 2: SPLIT SCREEN TREE & A4 PAPER PREVIEW    */
                /* ---------------------------------------------------- */
                <div className="reports-layout">
                    {/* Left Column: Report Groups Tree Sidebar */}
                    <div className="reports-tree-sidebar">
                        <div className="reports-tree-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Layers size={18} color="var(--bravo-teal)" />
                                <span style={{ fontWeight: 700, fontSize: '0.925rem', color: '#0F172A' }}>Danh mục Báo cáo</span>
                            </div>
                            <span style={{ fontSize: '0.725rem', background: 'var(--bravo-teal-light)', color: 'var(--bravo-teal-dark)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                                18 báo cáo
                            </span>
                        </div>

                        <div className="reports-tree-body">
                            {REPORT_GROUPS.map((group) => {
                                const GroupIcon = group.icon;
                                const isExpanded = expandedGroups[group.id];

                                return (
                                    <div key={group.id} style={{ marginBottom: '0.5rem' }}>
                                        {/* Collapsible Group Title Header */}
                                        <div className="tree-group-header" onClick={() => toggleGroup(group.id)}>
                                            {isExpanded ? <ChevronDown size={16} color="#64748B" /> : <ChevronRight size={16} color="#64748B" />}
                                            <GroupIcon size={16} color="var(--bravo-teal)" />
                                            <span>{group.title}</span>
                                        </div>

                                        {/* Report Tree Items */}
                                        {isExpanded && (
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                {group.reports.map((rep) => {
                                                    const isSelected = selectedReport.id === rep.id;
                                                    return (
                                                        <div
                                                            key={rep.id}
                                                            className={`tree-item ${isSelected ? 'active' : ''}`}
                                                            onClick={() => handleSelectReport(rep)}
                                                            onDoubleClick={() => handleDoubleClickReport(rep)}
                                                            title="Click để chọn xem mẫu, Click đúp để chạy báo cáo"
                                                        >
                                                            <span>{rep.title}</span>
                                                            {isSelected && <ChevronRight size={14} className="tree-arrow" color="#FFFFFF" />}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* User Interaction Hint */}
                        <div style={{ padding: '0.75rem 1rem', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ background: '#00BCD4', color: 'white', borderRadius: '50%', width: '16px', height: '16px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700 }}>i</span>
                            <span>Click đúp chuột vào báo cáo để mở điều kiện lọc & chạy báo cáo</span>
                        </div>
                    </div>

                    {/* Right Column: A4 Paper Report Template Preview */}
                    <div className="report-preview-container">
                        {/* Top Toolbar Action Bar */}
                        <div style={{
                            width: '100%',
                            maxWidth: '820px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '1rem',
                            background: '#FFFFFF',
                            padding: '0.75rem 1.25rem',
                            borderRadius: '8px',
                            border: '1px solid #CBD5E1',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}>
                            <div>
                                <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Đang chọn xem mẫu:</span>
                                <h4 style={{ fontSize: '1rem', color: 'var(--bravo-teal-dark)', fontWeight: 700 }}>{selectedReport.title}</h4>
                            </div>
                            <button
                                className="btn btn-primary"
                                onClick={() => setShowFilterModal(true)}
                                style={{ backgroundColor: '#00BCD4', borderColor: '#00BCD4', fontWeight: 700 }}
                            >
                                <Play size={16} fill="white" />
                                <span>Chạy báo cáo</span>
                            </button>
                        </div>

                        {/* A4 Paper Printable Preview Sheet */}
                        <div className="a4-preview-paper">
                            {/* Background Watermark matching screenshot */}
                            <div className="watermark-text">BÁO CÁO MẪU</div>

                            {/* Document Header */}
                            <div className="preview-content">
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0F172A', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F172A', textTransform: 'uppercase' }}>
                                            ĐƠN VỊ: VĂN PHÒNG CÔNG TY CỔ PHẦN BRAVO
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#475569' }}>Địa chỉ: Hà Nội</div>
                                    </div>
                                    <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#64748B' }}>
                                        <div>Hệ thống Quản trị BRAVO 10 ERP</div>
                                        <div>Mẫu số: <b>BC-HRM/2026</b></div>
                                    </div>
                                </div>

                                {/* Report Title */}
                                <div style={{ textAlign: 'center', margin: '2rem 0 1.5rem 0' }}>
                                    <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                                        {selectedReport.title}
                                    </h2>
                                    <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.25rem', fontStyle: 'italic' }}>
                                        Năm: 2026
                                    </div>
                                </div>

                                {/* Report Metadata Block matching screenshot */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '0.5rem 2rem',
                                    fontSize: '0.825rem',
                                    color: '#334155',
                                    marginBottom: '1.5rem',
                                    background: '#F8FAFC',
                                    padding: '1rem',
                                    borderRadius: '6px',
                                    border: '1px solid #E2E8F0'
                                }}>
                                    {selectedReport.sampleMeta ? selectedReport.sampleMeta.map((meta, mIdx) => (
                                        <div key={mIdx}>• {meta}</div>
                                    )) : (
                                        <>
                                            <div><b>Người lập:</b> [ReviewerName]</div>
                                            <div><b>Bộ phận:</b> [Department]</div>
                                        </>
                                    )}
                                </div>

                                {/* Sample Grid Table matching screenshot */}
                                <table className="preview-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '40px' }}>Stt</th>
                                            {selectedReport.columns.map((col, idx) => (
                                                <th key={idx}>{col}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                                            <tr key={num}>
                                                <td style={{ textAlign: 'center', color: '#94A3B8' }}>{num}</td>
                                                {selectedReport.columns.map((_, cIdx) => (
                                                    <td key={cIdx} style={{ color: '#CBD5E1' }}>abc</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Signatures Footer */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', textAlign: 'center', marginTop: '3.5rem', fontSize: '0.8rem', color: '#475569' }}>
                                    <div>
                                        <b>NGƯỜI LẬP BÁO CÁO</b>
                                        <div style={{ fontSize: '0.725rem', fontStyle: 'italic', marginTop: '0.25rem' }}>(Ký, ghi rõ họ tên)</div>
                                    </div>
                                    <div>
                                        <b>TRƯỞNG BỘ PHẬN</b>
                                        <div style={{ fontSize: '0.725rem', fontStyle: 'italic', marginTop: '0.25rem' }}>(Ký, ghi rõ họ tên)</div>
                                    </div>
                                    <div>
                                        <b>GIÁM ĐỐC BRAVO</b>
                                        <div style={{ fontSize: '0.725rem', fontStyle: 'italic', marginTop: '0.25rem' }}>(Ký, đóng dấu)</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* FILTER CRITERIA MODAL DIALOG (MOUNTED ON DOUBLE CLICK) */}
            {/* ---------------------------------------------------- */}
            {showFilterModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '560px' }}>
                        {/* Modal Header */}
                        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Filter size={20} color="var(--bravo-teal)" />
                                <h3 style={{ fontSize: '1.1rem', color: '#0F172A', fontWeight: 700 }}>Điều kiện lọc Báo cáo</h3>
                            </div>
                            <button
                                onClick={() => setShowFilterModal(false)}
                                style={{ background: 'none', border: 'none', fontSize: '1.25rem', color: '#64748B', cursor: 'pointer' }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: '1.5rem' }}>
                            <div style={{ marginBottom: '1.25rem', padding: '0.75rem 1rem', background: '#E0F2FE', borderRadius: '6px', color: '#0369A1', fontSize: '0.85rem' }}>
                                📌 <b>Báo cáo:</b> {selectedReport.title}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Từ ngày</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={filterCriteria.startDate}
                                        onChange={(e) => setFilterCriteria({ ...filterCriteria, startDate: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Đến ngày</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={filterCriteria.endDate}
                                        onChange={(e) => setFilterCriteria({ ...filterCriteria, endDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Chọn Phòng ban / Khối bộ phận</label>
                                <select
                                    className="form-select"
                                    value={filterCriteria.department}
                                    onChange={(e) => setFilterCriteria({ ...filterCriteria, department: e.target.value })}
                                >
                                    <option value="ALL">-- Tất cả Phòng ban --</option>
                                    <option value="Khối Kỹ thuật Phần mềm">Khối Kỹ thuật Phần mềm</option>
                                    <option value="Khối Kinh doanh ERP">Khối Kinh doanh ERP</option>
                                    <option value="Phòng Hành chính Nhân sự">Phòng Hành chính Nhân sự</option>
                                    <option value="Ban Giám đốc">Ban Giám đốc</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Kỳ / Đợt thống kê</label>
                                <select
                                    className="form-select"
                                    value={filterCriteria.period}
                                    onChange={(e) => setFilterCriteria({ ...filterCriteria, period: e.target.value })}
                                >
                                    <option value="Năm 2026">Cả năm 2026</option>
                                    <option value="Quý I/2026">Quý I / 2026</option>
                                    <option value="Quý II/2026">Quý II / 2026</option>
                                    <option value="Tháng 08/2026">Tháng 08 / 2026</option>
                                </select>
                            </div>
                        </div>

                        {/* Modal Footer Actions */}
                        <div style={{ padding: '1.rem 1.5rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', background: '#F8FAFC' }}>
                            <button className="btn btn-secondary" onClick={() => setShowFilterModal(false)}>
                                Hủy bỏ
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleRunReport}
                                style={{ backgroundColor: '#00BCD4', borderColor: '#00BCD4', fontWeight: 700, padding: '0.5rem 1.25rem' }}
                            >
                                <Play size={16} fill="white" />
                                <span>Xem Báo cáo (Chạy)</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};