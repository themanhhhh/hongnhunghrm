import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    Users,
    ClipboardList,
    UserCheck,
    Calendar,
    Award,
    CheckCircle2,
    Clock,
    ArrowRight,
    Building2,
    Check,
    X,
    FileText,
    AlertCircle,
    Plus,
    ChevronRight,
    UserPlus,
    FileSignature,
    Sparkles,
    Eye,
    UserMinus,
    Sliders,
    UserX,
    Layers,
    Briefcase,
    Settings,
    Lock,
    TrendingUp,
    BarChart3,
    Filter,
    CheckSquare,
    AlertTriangle
} from 'lucide-react';

// --- Shared Reusable Card & Utility Components ---
const MetricCard = ({ icon: Icon, label, value, subtext, color = '#2D6F62', onClick }) => (
    <div
        className={`card ${onClick ? 'card-hover' : ''}`}
        onClick={onClick}
        style={{
            padding: '1.25rem',
            backgroundColor: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            cursor: onClick ? 'pointer' : 'default',
            borderLeft: `4px solid ${color}`
        }}
    >
        <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            backgroundColor: `${color}15`, color, display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
            <Icon size={24} />
        </div>
        <div style={{ flex: 1 }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>{value}</div>
            <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600, marginTop: '0.2rem' }}>{label}</div>
            {subtext && <div style={{ fontSize: '0.725rem', color: '#94A3B8', marginTop: '0.1rem' }}>{subtext}</div>}
        </div>
    </div>
);

const CustomBarRow = ({ label, count, max, color = '#2D6F62', subtext }) => (
    <div style={{ marginBottom: '0.85rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
            <span style={{ fontWeight: 600, color: '#334155' }}>{label}</span>
            <span style={{ fontWeight: 700, color: '#0F172A' }}>
                {count} {subtext ? <span style={{ fontWeight: 400, color: '#64748B', fontSize: '0.75rem' }}>({subtext})</span> : ''}
            </span>
        </div>
        <div style={{ backgroundColor: '#F1F5F9', borderRadius: '6px', height: '10px', overflow: 'hidden' }}>
            <div style={{
                width: max > 0 ? `${Math.min(100, Math.max(2, (count / max) * 100))}%` : '0%',
                backgroundColor: color, height: '100%', borderRadius: '6px', transition: 'width 0.3s ease'
            }} />
        </div>
    </div>
);

const formatDashboardDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
};

const DashboardTable = ({ title, icon: Icon, rows = [], columns, emptyMessage, onRowClick }) => (
    <div className="card" style={{ padding: 0, backgroundColor: '#FFFFFF', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.25rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #E2E8F0' }}>
            <Icon size={18} color="var(--bravo-teal-dark)" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>{title}</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
            <table className="erp-table">
                <thead>
                    <tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr>
                </thead>
                <tbody>
                    {rows.length === 0 ? (
                        <tr><td colSpan={columns.length} style={{ textAlign: 'center', color: '#94A3B8' }}>{emptyMessage}</td></tr>
                    ) : rows.map((row, index) => (
                        <tr key={row.id || `${row.candidate_name}-${index}`} onClick={onRowClick ? () => onRowClick(row) : undefined} style={{ cursor: onRowClick ? 'pointer' : 'default' }}>
                            {columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : row[column.key] || '-'}</td>)}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const RecruitmentComboChart = ({ rows = [] }) => {
    const chartRows = rows.slice(0, 8).map((row) => ({
        label: row.position_name || 'Chưa xác định',
        target: Number(row.target_headcount || 0),
        hired: Number(row.hired_count || 0),
    }));
    const maxValue = Math.max(...chartRows.flatMap((row) => [row.target, row.hired]), 1);
    const axisMax = Math.max(1, Math.ceil(maxValue / 5) * 5);
    const chart = { width: 760, height: 300, left: 46, right: 20, top: 18, bottom: 64 };
    const plotWidth = chart.width - chart.left - chart.right;
    const plotHeight = chart.height - chart.top - chart.bottom;
    const groupWidth = chartRows.length ? plotWidth / chartRows.length : plotWidth;
    const getX = (index) => chart.left + groupWidth * (index + 0.5);
    const getY = (value) => chart.top + plotHeight - (value / axisMax) * plotHeight;
    const linePoints = chartRows.map((row, index) => `${getX(index)},${getY(row.hired)}`).join(' ');

    return (
        <div className="card" style={{ padding: '1.25rem', backgroundColor: '#FFFFFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <BarChart3 size={18} color="#0F766E" />
                        <span>Số lượng cần tuyển vs đã tuyển</span>
                    </h3>
                    <p style={{ margin: '0.25rem 0 0', color: '#64748B', fontSize: '0.78rem' }}>So sánh nhu cầu tuyển dụng và kết quả đã tuyển theo vị trí.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.9rem', alignItems: 'center', color: '#64748B', fontSize: '0.75rem', fontWeight: 600 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><span style={{ width: 10, height: 10, borderRadius: 2, background: '#B8DDD5' }} /> Cần tuyển</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><span style={{ width: 18, height: 3, borderRadius: 2, background: '#0F766E' }} /> Đã tuyển</span>
                </div>
            </div>
            {chartRows.length === 0 ? (
                <div style={{ minHeight: 220, display: 'grid', placeItems: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>Chưa có dữ liệu tuyển dụng theo vị trí.</div>
            ) : (
                <div style={{ width: '100%', overflowX: 'auto' }}>
                    <svg viewBox={`0 0 ${chart.width} ${chart.height}`} role="img" aria-label="Biểu đồ số lượng cần tuyển và đã tuyển theo vị trí" style={{ display: 'block', width: '100%', minWidth: 620, height: 'auto' }}>
                        {Array.from({ length: 5 }, (_, index) => {
                            const value = Math.round((axisMax / 4) * index);
                            const y = getY(value);
                            return (
                                <g key={value}>
                                    <line x1={chart.left} x2={chart.width - chart.right} y1={y} y2={y} stroke="#E2E8F0" strokeDasharray="3 4" />
                                    <text x={chart.left - 10} y={y + 4} textAnchor="end" fill="#94A3B8" fontSize="11">{value}</text>
                                </g>
                            );
                        })}
                        <line x1={chart.left} x2={chart.left} y1={chart.top} y2={chart.top + plotHeight} stroke="#CBD5E1" />
                        <line x1={chart.left} x2={chart.width - chart.right} y1={chart.top + plotHeight} y2={chart.top + plotHeight} stroke="#CBD5E1" />
                        {chartRows.map((row, index) => {
                            const centerX = getX(index);
                            const targetHeight = plotHeight - (getY(row.target) - chart.top);
                            const hiredHeight = plotHeight - (getY(row.hired) - chart.top);
                            const targetX = centerX - 19;
                            const hiredX = centerX + 3;
                            const shortLabel = row.label.length > 16 ? `${row.label.slice(0, 15)}…` : row.label;
                            return (
                                <g key={`${row.label}-${index}`}>
                                    <title>{`${row.label}: Cần tuyển ${row.target}, đã tuyển ${row.hired}`}</title>
                                    <rect x={targetX} y={getY(row.target)} width={18} height={Math.max(0, targetHeight)} rx={3} fill="#B8DDD5" />
                                    <text x={targetX + 9} y={getY(row.target) - 6} textAnchor="middle" fill="#0F766E" fontSize="10" fontWeight="700">{row.target}</text>
                                    <rect x={hiredX} y={getY(row.hired)} width={18} height={Math.max(0, hiredHeight)} rx={3} fill="#E2E8F0" />
                                    <text x={hiredX + 9} y={getY(row.hired) - 6} textAnchor="middle" fill="#475569" fontSize="10" fontWeight="700">{row.hired}</text>
                                    <text x={centerX} y={chart.top + plotHeight + 20} textAnchor="middle" fill="#475569" fontSize="10">{shortLabel}</text>
                                </g>
                            );
                        })}
                        <polyline points={linePoints} fill="none" stroke="#0F766E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        {chartRows.map((row, index) => <circle key={`point-${row.label}-${index}`} cx={getX(index)} cy={getY(row.hired)} r="4.5" fill="#FFFFFF" stroke="#0F766E" strokeWidth="3"><title>{`${row.label}: đã tuyển ${row.hired}`}</title></circle>)}
                    </svg>
                </div>
            )}
        </div>
    );
};

const RecruitmentFunnel = ({ stages = [] }) => {
    const funnelColors = ['#F3C629', '#AA5B25', '#9B6060', '#94625E', '#8E817C', '#7E8D88'];
    const maxCount = Math.max(...stages.map((stage) => Number(stage.count || 0)), 1);
    const stageWidths = stages.reduce((widths, stage, index) => {
        const valueWidth = Number(stage.count || 0) / maxCount * 100;
        const previousWidth = widths[index - 1] || 100;
        return [...widths, Math.min(previousWidth, Math.max(28, valueWidth))];
    }, []);

    return (
        <div className="card" style={{ padding: '1.25rem', backgroundColor: '#FFFFFF' }}>
            <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Layers size={18} color="#0F766E" />
                    <span>Phễu định biên</span>
                </h3>
                <p style={{ margin: '0.25rem 0 0', color: '#64748B', fontSize: '0.78rem' }}>Theo dõi tỷ lệ chuyển đổi từ ứng viên đến nhân sự chính thức.</p>
            </div>
            {stages.length === 0 ? (
                <div style={{ minHeight: 220, display: 'grid', placeItems: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>Chưa có dữ liệu phễu tuyển dụng.</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.25rem 0 0.5rem' }}>
                    {stages.map((stage, index) => (
                        <React.Fragment key={stage.code || stage.label}>
                            {index === 0 && <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', marginBottom: '0.5rem', color: '#94A3B8', fontSize: '0.65rem', fontWeight: 700 }}><span style={{ height: 1, flex: 1, background: '#E2E8F0' }} /><span>100%</span><span style={{ height: 1, flex: 1, background: '#E2E8F0' }} /></div>}
                            <div style={{ width: `${stageWidths[index]}%`, minHeight: 38, padding: '0.4rem 1rem', background: funnelColors[index % funnelColors.length], color: index === 0 ? '#4A3210' : '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', textAlign: 'center', boxShadow: '0 2px 6px rgba(71, 50, 24, 0.14)' }}>
                                <strong style={{ fontSize: '1.2rem', lineHeight: 1 }}>{Number(stage.count || 0).toLocaleString('vi-VN')}</strong>
                                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{stage.label}</span>
                                {stage.description && <span style={{ fontSize: '0.7rem', fontWeight: 500, opacity: 0.85 }}>({stage.description})</span>}
                            </div>
                        </React.Fragment>
                    ))}
                </div>
            )}
        </div>
    );
};

const ADMIN_ROLE_COLORS = {
    'Administrator': '#7C3AED',
    'Ban Giám Đốc': '#0369A1',
    'HR Staff': '#059669',
    'Trưởng Khối': '#D97706',
    'Trưởng Phòng': '#DB2777',
    'Nhân viên': '#64748B'
};

const WorkforceDashboard = ({ setCurrentTab, setActiveSubTab }) => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let mounted = true;
        api.get('/reports/dashboard/workforce')
            .then((res) => {
                if (!mounted) return;
                if (res.success) setDashboardData(res.data);
                else setError(res.message || 'Không thể tải dashboard nhân sự.');
            })
            .catch(() => mounted && setError('Không thể tải dashboard nhân sự.'))
            .finally(() => mounted && setLoading(false));
        return () => { mounted = false; };
    }, []);

    if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}><Clock size={32} className="animate-spin" style={{ margin: '0 auto 1rem', color: 'var(--bravo-teal)' }} /><div style={{ fontWeight: 600 }}>Đang tải dashboard nhân sự...</div></div>;
    if (!dashboardData?.workforce) return <div className="card" style={{ padding: '2rem', color: '#B91C1C', backgroundColor: '#FEF2F2' }}>{error || 'Chưa có dữ liệu dashboard nhân sự.'}</div>;

    const { workforce, scopeName } = dashboardData;
    const totalDepartmentEmployees = workforce.departments.reduce((sum, item) => sum + Number(item.count || 0), 0);
    const maxStatus = Math.max(...workforce.statuses.map((item) => Number(item.count || 0)), 1);
    let cursor = 0;
    const donutSegments = workforce.departments.map((item, index) => {
        const start = totalDepartmentEmployees ? cursor / totalDepartmentEmployees * 100 : 0;
        cursor += Number(item.count || 0);
        const end = totalDepartmentEmployees ? cursor / totalDepartmentEmployees * 100 : 100;
        return `${['#0F766E', '#0284C7', '#7C3AED', '#D97706', '#E11D48', '#64748B'][index % 6]} ${start}% ${end}%`;
    });
    const formatDate = (value) => {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('vi-VN');
    };
    const openContracts = () => { setCurrentTab('HRModule'); setActiveSubTab('Hợp đồng lao động'); };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {error && <div className="card" style={{ padding: '0.85rem 1rem', color: '#92400E', backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }}>{error}</div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
                <div><div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.18em', color: 'var(--bravo-teal)', textTransform: 'uppercase' }}>WORKFORCE CONTROL</div><h1 style={{ margin: '0.35rem 0 0', color: '#0F172A', fontSize: '1.75rem' }}>Tổng quan nhân sự</h1><p style={{ margin: '0.4rem 0 0', color: '#64748B', fontSize: '0.85rem' }}>Dashboard chung cho Admin, Ban Giám Đốc và cấp quản lý. Phạm vi: {scopeName}.</p></div>
                <button className="btn btn-secondary" onClick={openContracts}><FileText size={15} /> Mở quản lý hợp đồng</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
                <MetricCard icon={Users} label="Nhân sự hiện tại" value={Number(workforce.currentEmployees).toLocaleString('vi-VN')} subtext="Tổng số nhân viên đang làm việc" color="#0F766E" />
                <MetricCard icon={Building2} label="Định biên nhân sự" value={Number(workforce.headcountTarget).toLocaleString('vi-VN')} subtext="Tổng số nhân sự theo định biên" color="#7C3AED" />
                <MetricCard icon={TrendingUp} label="Tỷ lệ đáp ứng định biên" value={`${workforce.fulfillmentRate}%`} subtext="Nhân sự hiện tại / Định biên × 100%" color="#D97706" />
                <MetricCard icon={Calendar} label="HĐLĐ sắp hết hạn" value={Number(workforce.expiringContractsCount).toLocaleString('vi-VN')} subtext="Trong 60 ngày tới" color="#E11D48" onClick={openContracts} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                <div className="card" style={{ padding: '1.25rem' }}>
                    <div style={{ color: '#0F766E', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Cơ cấu nhân sự</div><h3 style={{ margin: '0.4rem 0 0.2rem', color: '#0F172A' }}>Nhân sự theo phòng ban</h3><p style={{ margin: 0, color: '#64748B', fontSize: '0.78rem' }}>Phân bổ nhân sự đang làm việc theo đơn vị.</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
                        <div style={{ width: 160, height: 160, borderRadius: '50%', background: donutSegments.length ? `conic-gradient(${donutSegments.join(', ')})` : '#E2E8F0', display: 'grid', placeItems: 'center', flexShrink: 0 }}><div style={{ width: 102, height: 102, borderRadius: '50%', background: '#FFFFFF', display: 'grid', placeItems: 'center', alignContent: 'center', boxShadow: 'inset 0 0 0 1px #E2E8F0' }}><b style={{ fontSize: '1.5rem', color: '#0F172A' }}>{totalDepartmentEmployees.toLocaleString('vi-VN')}</b><span style={{ color: '#94A3B8', fontSize: '0.65rem', fontWeight: 700 }}>NHÂN SỰ</span></div></div>
                        <div style={{ flex: 1, minWidth: 190, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>{workforce.departments.slice(0, 6).map((item, index) => <div key={item.department_name} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.78rem' }}><span style={{ width: 9, height: 9, borderRadius: '50%', background: ['#0F766E', '#0284C7', '#7C3AED', '#D97706', '#E11D48', '#64748B'][index % 6], flexShrink: 0 }} /><span style={{ flex: 1, color: '#475569', fontWeight: 600 }}>{item.department_name}</span><b style={{ color: '#0F172A' }}>{item.count}</b></div>)}</div>
                    </div>
                </div>
                <div className="card" style={{ padding: '1.25rem' }}>
                    <div style={{ color: '#7C3AED', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Trạng thái nhân sự</div><h3 style={{ margin: '0.4rem 0 0.2rem', color: '#0F172A' }}>Tình hình nhân sự theo trạng thái</h3><p style={{ margin: 0, color: '#64748B', fontSize: '0.78rem' }}>Theo dõi lực lượng đang làm việc, nghỉ việc, thử việc và chờ nhận việc.</p>
                    <div style={{ marginTop: '1.25rem' }}>{workforce.statuses.map((item) => <CustomBarRow key={item.code} label={item.label} count={Number(item.count || 0)} max={maxStatus} color={{ WORKING: '#0F766E', RESIGNED: '#E11D48', PROBATION: '#D97706', WAITING_FOR_WORK: '#7C3AED' }[item.code] || '#64748B'} />)}</div>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1.25rem 1.25rem 0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}><div><div style={{ color: '#E11D48', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>CẢNH BÁO HỢP ĐỒNG</div><h3 style={{ margin: '0.4rem 0 0.2rem', color: '#0F172A' }}>Hợp đồng lao động sắp hết hạn</h3><p style={{ margin: 0, color: '#64748B', fontSize: '0.78rem' }}>Danh sách hợp đồng còn thời hạn trong 60 ngày tới.</p></div><button className="btn btn-secondary" onClick={openContracts} style={{ whiteSpace: 'nowrap' }}>Mở danh sách <ChevronRight size={14} /></button></div>
                {workforce.expiringContracts.length === 0 ? <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>Không có hợp đồng hết hạn trong 60 ngày tới.</div> : <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', minWidth: 720, borderCollapse: 'collapse', fontSize: '0.8rem' }}><thead><tr style={{ background: '#F8FAFC', color: '#64748B' }}>{['Nhân viên', 'Vị trí', 'Loại HĐ', 'Ngày hết hạn', 'Trạng thái'].map((label) => <th key={label} style={{ textAlign: 'left', padding: '0.75rem 1.25rem', fontSize: '0.68rem', textTransform: 'uppercase' }}>{label}</th>)}</tr></thead><tbody>{workforce.expiringContracts.map((contract) => <tr key={contract.id} style={{ borderTop: '1px solid #E2E8F0' }}><td style={{ padding: '0.85rem 1.25rem', color: '#0F172A', fontWeight: 700 }}>{contract.employee_name}<div style={{ color: '#94A3B8', fontSize: '0.68rem', fontWeight: 500, marginTop: 3 }}>{contract.employee_code || '—'}</div></td><td style={{ padding: '0.85rem 1.25rem', color: '#475569' }}>{contract.position_name || '—'}</td><td style={{ padding: '0.85rem 1.25rem', color: '#475569' }}>{contract.contract_type}</td><td style={{ padding: '0.85rem 1.25rem', color: '#475569' }}>{formatDate(contract.end_date)}</td><td style={{ padding: '0.85rem 1.25rem' }}><span style={{ display: 'inline-flex', borderRadius: 999, padding: '0.35rem 0.6rem', fontWeight: 700, fontSize: '0.7rem', color: contract.days_remaining <= 7 ? '#BE123C' : '#B45309', background: contract.days_remaining <= 7 ? '#FFF1F2' : '#FFFBEB' }}>{contract.status_label}</span></td></tr>)}</tbody></table></div>}
            </div>
        </div>
    );
};

// =========================================================================
// 1. DASHBOARD ADMIN (Chỉ dành cho Administrator)
// =========================================================================
const AdminDashboard = ({ setCurrentTab, setActiveSubTab }) => {
    const [adminData, setAdminData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAdminData = async () => {
            setLoading(true);
            try {
                const res = await api.get('/reports/dashboard/admin');
                if (res.success) setAdminData(res.data);
            } catch (err) {
                console.error('Error fetching admin dashboard:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAdminData();
    }, []);

    const goToAdmin = (subTab) => {
        setCurrentTab('AdminModule');
        setActiveSubTab(subTab);
    };

    if (loading || !adminData) {
        return (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                <Clock size={32} className="animate-spin" style={{ margin: '0 auto 1rem', color: 'var(--bravo-teal)' }} />
                <div style={{ fontWeight: 600 }}>Đang tải dữ liệu Quản trị hệ thống...</div>
            </div>
        );
    }

    const { kpi, usersByRole, employeesByDept, recentUsers, lockedUserList } = adminData;
    const maxRole = Math.max(1, ...usersByRole.map(r => r.count));
    const maxDept = Math.max(1, ...employeesByDept.map(d => d.count));

    const quickActions = [
        { label: 'Tạo tài khoản mới', icon: UserPlus, sub: 'Tài khoản & Phân quyền' },
        { label: 'Quản lý tài khoản', icon: Users, sub: 'Tài khoản & Phân quyền' },
        { label: 'Phân quyền vai trò', icon: Lock, sub: 'Tài khoản & Phân quyền' },
        { label: 'Quản lý bộ phận', icon: Building2, sub: 'Danh mục Bộ phận' },
        { label: 'Quản lý vị trí', icon: Briefcase, sub: 'Danh mục Vị trí công việc' },
        { label: 'Quản lý loại HĐLĐ', icon: FileText, sub: 'Danh mục Loại HĐLĐ' }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
                <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#0F172A' }}>Dashboard Quản trị hệ thống</h2>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                    Giám sát toàn bộ tài khoản, phân quyền, sơ đồ tổ chức và hoạt động vận hành hệ thống
                </p>
            </div>

            {/* KPI Overview Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem' }}>
                <MetricCard icon={Users} label="Tổng số tài khoản" value={kpi.totalUsers} color="#2D6F62" onClick={() => goToAdmin('Tài khoản & Phân quyền')} />
                <MetricCard icon={UserCheck} label="Tài khoản đang hoạt động" value={kpi.activeUsers} color="#059669" onClick={() => goToAdmin('Tài khoản & Phân quyền')} />
                <MetricCard icon={UserX} label="Tài khoản bị khóa" value={kpi.lockedUsers} color="#DC2626" onClick={() => goToAdmin('Tài khoản & Phân quyền')} />
                <MetricCard icon={Building2} label="Tổng số phòng ban" value={kpi.totalDepartments} color="#0369A1" onClick={() => goToAdmin('Danh mục Bộ phận')} />
                <MetricCard icon={Layers} label="Tổng số nhân sự" value={kpi.totalEmployees} color="#7C3AED" />
                <MetricCard icon={Briefcase} label="Tổng số vị trí" value={kpi.totalPositions} color="#D97706" onClick={() => goToAdmin('Danh mục Vị trí công việc')} />
            </div>

            {/* User Roles & Dept Structure Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.25rem' }}>
                <div className="card" style={{ padding: '1.25rem', backgroundColor: '#FFFFFF' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Users size={18} color="#7C3AED" />
                        <span>Cơ cấu tài khoản theo vai trò</span>
                    </h3>
                    {usersByRole.map((r) => (
                        <CustomBarRow key={r.role_name} label={r.role_name} count={r.count} max={maxRole} color={ADMIN_ROLE_COLORS[r.role_name] || '#2D6F62'} />
                    ))}
                </div>

                <div className="card" style={{ padding: '1.25rem', backgroundColor: '#FFFFFF' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Building2 size={18} color="#0369A1" />
                        <span>Số lượng nhân sự theo phòng ban</span>
                    </h3>
                    <div style={{ maxHeight: '280px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                        {employeesByDept.map((d) => (
                            <CustomBarRow key={d.department_name} label={d.department_name} count={d.count} max={maxDept} color="#0369A1" />
                        ))}
                    </div>
                </div>
            </div>

            {/* Action Needed & Security Alerts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.25rem' }}>
                <div className="card" style={{ padding: '1.25rem', backgroundColor: '#FFFFFF' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <UserPlus size={18} color="#059669" />
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                            Tài khoản mới khởi tạo (30 ngày qua)
                        </h3>
                    </div>
                    {recentUsers.length === 0 ? (
                        <p style={{ fontSize: '0.825rem', color: '#94A3B8' }}>Không có tài khoản mới nào.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {recentUsers.map((u) => (
                                <div key={u.user_id} onClick={() => goToAdmin('Tài khoản & Phân quyền')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.55rem 0.8rem', backgroundColor: '#F8FAFC', borderRadius: '8px', cursor: 'pointer', border: '1px solid #E2E8F0' }}>
                                    <span style={{ fontSize: '0.825rem', fontWeight: 600, color: '#0F172A' }}>
                                        {u.full_name} <span style={{ color: '#64748B', fontWeight: 400 }}>({u.username})</span>
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{new Date(u.created_date).toLocaleDateString('vi-VN')}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="card" style={{ padding: '1.25rem', backgroundColor: '#FFFFFF' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <Lock size={18} color="#DC2626" />
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                            Tài khoản đang bị khóa
                        </h3>
                    </div>
                    {lockedUserList.length === 0 ? (
                        <p style={{ fontSize: '0.825rem', color: '#94A3B8' }}>Không có tài khoản nào bị khóa.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {lockedUserList.map((u) => (
                                <div key={u.user_id} onClick={() => goToAdmin('Tài khoản & Phân quyền')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.55rem 0.8rem', backgroundColor: '#FEF2F2', borderRadius: '8px', cursor: 'pointer', border: '1px solid #FCA5A5' }}>
                                    <span style={{ fontSize: '0.825rem', fontWeight: 600, color: '#991B1B' }}>
                                        {u.full_name} <span style={{ color: '#7F1D1D', fontWeight: 400 }}>({u.username})</span>
                                    </span>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#DC2626', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                        Mở khóa <ArrowRight size={14} />
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions Shortcuts */}
            <div className="card" style={{ padding: '1.25rem', backgroundColor: '#FFFFFF' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <Settings size={18} color="var(--bravo-teal-dark)" />
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Quick Actions - Thao tác nhanh Quản trị</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.85rem' }}>
                    {quickActions.map((qa) => (
                        <button
                            key={qa.label}
                            onClick={() => goToAdmin(qa.sub)}
                            style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                                padding: '1rem 0.75rem', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0',
                                borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s ease'
                            }}
                        >
                            <qa.icon size={22} color="var(--bravo-teal-dark)" />
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', textAlign: 'center' }}>{qa.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

// =========================================================================
// 2. DASHBOARD HR (Dành cho bộ phận HR Staff)
// =========================================================================
const HrDashboard = ({ setCurrentTab, setActiveSubTab }) => {
    const [hrData, setHrData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionTab, setActionTab] = useState('RECRUITMENT'); // RECRUITMENT | HR | LEAVES

    useEffect(() => {
        const fetchHrData = async () => {
            setLoading(true);
            try {
                const res = await api.get('/reports/dashboard/hr');
                if (res.success) setHrData(res.data);
            } catch (err) {
                console.error('Error fetching HR dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchHrData();
    }, []);

    const goTo = (module, subTab) => {
        setCurrentTab(module);
        setActiveSubTab(subTab);
    };

    if (loading || !hrData) {
        return (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                <Clock size={32} className="animate-spin" style={{ margin: '0 auto 1rem', color: 'var(--bravo-teal)' }} />
                <div style={{ fontWeight: 600 }}>Đang tải dữ liệu Nghiệp vụ Nhân sự & Tuyển dụng...</div>
            </div>
        );
    }

    const { kpi, pipelineStages, recruitmentByPosition, actionNeeded, charts } = hrData;
    const currentEmployees = Number(kpi.currentEmployees ?? charts?.deptStructure?.reduce((total, item) => total + Number(item.count || 0), 0) ?? 0);
    const headcountTarget = Number(kpi.headcountTarget ?? recruitmentByPosition?.reduce((total, item) => total + Number(item.target_headcount || 0), 0) ?? 0);
    const fulfillmentRate = Number(kpi.fulfillmentRate ?? (headcountTarget ? Math.round((currentEmployees / headcountTarget) * 100) : 0));
    const headcountDifference = headcountTarget - currentEmployees;
    const expiringContractsCount = Number(kpi.expiringContractsCount ?? actionNeeded?.hr?.expiringContracts?.length ?? 0);
    const hiredCandidates = actionNeeded?.recruitment?.hiredCandidates || [];
    const inProgressCandidates = actionNeeded?.recruitment?.inProgressCandidates || [];
    const pipelineCount = (code) => Number(pipelineStages.find((stage) => stage.code === code)?.count || 0);
    const receivedCandidates = pipelineCount('tiếp nhận hồ sơ');
    const interviewingCandidates = pipelineCount('đã tạo lịch') + pipelineCount('đã phỏng vấn') + pipelineCount('đã quyết định tuyển') + pipelineCount('đi làm');
    const selectedCandidates = pipelineCount('đã quyết định tuyển') + pipelineCount('đi làm');
    const funnelStages = hrData.pipelineFunnel?.length ? hrData.pipelineFunnel : [
        { code: 'candidates', label: 'Ứng viên', count: Number(kpi.totalCandidates || 0) },
        { code: 'screened', label: 'Sơ loại', count: Math.max(0, Number(kpi.totalCandidates || 0) - receivedCandidates) },
        { code: 'interviewing', label: 'Phỏng vấn', description: 'đang phỏng vấn', count: interviewingCandidates },
        { code: 'passed', label: 'Đạt', count: selectedCandidates },
        { code: 'selected', label: 'Nhận việc', description: 'quyết định tuyển dụng', count: selectedCandidates },
        { code: 'working', label: 'Chính thức', description: 'đi làm', count: pipelineCount('đi làm') },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
                <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#0F172A' }}>
                    Dashboard HR
                </h2>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                    Theo dõi định biên, nhân sự hiện tại, tuyển dụng và hợp đồng lao động của phòng HR
                </p>
            </div>

            {/* Các card tổng quan HR theo đặc tả dashboard */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                <MetricCard icon={Users} label="Định biên" value={headcountTarget.toLocaleString('vi-VN')} subtext="Tổng số định biên theo các vị trí" color="#7C3AED" onClick={() => goTo('HRModule', 'Định biên nhân sự')} />
                <MetricCard icon={UserCheck} label="Nhân sự hiện tại" value={currentEmployees.toLocaleString('vi-VN')} subtext="Tổng số nhân viên đang làm việc" color="#0F766E" onClick={() => goTo('HRModule', 'Hồ sơ nhân sự')} />
                <MetricCard icon={TrendingUp} label="Số lượng cần tuyển" value={`${fulfillmentRate}%`} subtext={`Nhân sự hiện tại / Định biên × 100% · ${headcountDifference > 0 ? `Thiếu ${headcountDifference}` : headcountDifference < 0 ? `Thừa ${Math.abs(headcountDifference)}` : 'Đủ nhân sự'}`} color="#D97706" onClick={() => goTo('RecruitmentModule', 'Yêu cầu tuyển dụng')} />
                <MetricCard icon={Users} label="Ứng viên đang tuyển" value={Number(kpi.processingCandidates || 0).toLocaleString('vi-VN')} subtext="Ứng viên đang trong quy trình tuyển dụng" color="#0369A1" onClick={() => goTo('RecruitmentModule', 'Hồ sơ ứng viên')} />
                <MetricCard icon={Calendar} label="HĐLĐ sắp hết hạn" value={expiringContractsCount.toLocaleString('vi-VN')} subtext="Số HĐLĐ hết hạn trong 60 ngày · Cảnh báo cần xử lý" color="#E11D48" onClick={() => goTo('HRModule', 'Hợp đồng lao động')} />
            </div>

            {/* Biểu đồ tình hình tuyển dụng (Pipeline 10 giai đoạn) */}
            <div className="card" style={{ padding: '1.25rem', backgroundColor: '#FFFFFF' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <TrendingUp size={18} color="var(--bravo-teal)" />
                        <span>Biểu đồ Tình hình Tuyển dụng (Recruitment Pipeline Stage)</span>
                    </h3>
                    <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }} onClick={() => goTo('RecruitmentModule', 'Hồ sơ ứng viên')}>
                        Xem danh sách Ứng viên <ChevronRight size={14} />
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                    {pipelineStages.map((stage) => (
                        <div
                            key={stage.code}
                            onClick={() => goTo('RecruitmentModule', 'Hồ sơ ứng viên')}
                            style={{
                                backgroundColor: '#F8FAFC',
                                border: '1px solid #E2E8F0',
                                borderRadius: '8px',
                                padding: '0.75rem 0.6rem',
                                textAlign: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', marginBottom: '0.25rem' }}>
                                {stage.label}
                            </div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: stage.count > 0 ? 'var(--bravo-teal-dark)' : '#94A3B8' }}>
                                {stage.count}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <RecruitmentFunnel stages={funnelStages} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.25rem' }}>
                <DashboardTable
                    title="Danh sách ứng viên trúng tuyển"
                    icon={UserCheck}
                    rows={hiredCandidates}
                    emptyMessage="Chưa có ứng viên trúng tuyển."
                    onRowClick={() => goTo('RecruitmentModule', 'Quyết định trúng tuyển')}
                    columns={[
                        { key: 'candidate_name', label: 'Ứng viên', render: (row) => <strong style={{ color: '#0F172A' }}>{row.candidate_name || '-'}</strong> },
                        { key: 'position_name', label: 'Vị trí' },
                        { key: 'department_name', label: 'Phòng ban' },
                        { key: 'hired_date', label: 'Ngày trúng tuyển', render: (row) => formatDashboardDate(row.hired_date) },
                        { key: 'status_label', label: 'Trạng thái', render: (row) => <span className={`badge ${row.status_label === 'Đã nhận việc' ? 'badge-green' : 'badge-yellow'}`}>{row.status_label || '-'}</span> },
                    ]}
                />
                <DashboardTable
                    title="Ứng viên đang trong quá trình tuyển dụng"
                    icon={TrendingUp}
                    rows={inProgressCandidates}
                    emptyMessage="Không có ứng viên đang trong quá trình tuyển dụng."
                    onRowClick={() => goTo('RecruitmentModule', 'Hồ sơ ứng viên')}
                    columns={[
                        { key: 'candidate_name', label: 'Ứng viên', render: (row) => <strong style={{ color: '#0F172A' }}>{row.candidate_name || '-'}</strong> },
                        { key: 'position_name', label: 'Vị trí' },
                        { key: 'current_stage', label: 'Vòng hiện tại', render: (row) => <span className="badge badge-blue">{row.current_stage || '-'}</span> },
                        { key: 'updated_date', label: 'Ngày cập nhật', render: (row) => formatDashboardDate(row.updated_date) },
                    ]}
                />
            </div>

            <RecruitmentComboChart rows={recruitmentByPosition} />

            {/* Biểu đồ/Bảng tuyển dụng theo vị trí & Khu vực công việc cần xử lý */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.25rem' }}>
                {/* Bảng tuyển dụng theo vị trí */}
                <div className="card" style={{ padding: '1.25rem', backgroundColor: '#FFFFFF' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Briefcase size={18} color="#D97706" />
                        <span>Thống kê Tuyển dụng theo Vị trí công việc</span>
                    </h3>
                    <div style={{ overflowX: 'auto', maxHeight: '340px' }}>
                        <table className="erp-table">
                            <thead>
                                <tr>
                                    <th>Vị trí tuyển dụng</th>
                                    <th style={{ textAlign: 'center' }}>Bộ phận</th>
                                    <th style={{ textAlign: 'center' }}>Cần tuyển</th>
                                    <th style={{ textAlign: 'center' }}>Đã tuyển</th>
                                    <th style={{ textAlign: 'center' }}>Còn thiếu</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recruitmentByPosition.length === 0 ? (
                                    <tr><td colSpan={5} style={{ textAlign: 'center', color: '#94A3B8' }}>Chưa có kế hoạch tuyển dụng.</td></tr>
                                ) : (
                                    recruitmentByPosition.map((row) => (
                                        <tr key={row.position_id} onClick={() => goTo('RecruitmentModule', 'Yêu cầu tuyển dụng')} style={{ cursor: 'pointer' }}>
                                            <td style={{ fontWeight: 600, color: '#0F172A' }}>{row.position_name}</td>
                                            <td style={{ textAlign: 'center', fontSize: '0.775rem', color: '#64748B' }}>{row.department_name || '-'}</td>
                                            <td style={{ textAlign: 'center', fontWeight: 700, color: '#334155' }}>{row.target_headcount}</td>
                                            <td style={{ textAlign: 'center', fontWeight: 700, color: '#059669' }}>{row.hired_count}</td>
                                            <td style={{ textAlign: 'center', fontWeight: 800, color: row.shortfall > 0 ? '#DC2626' : '#10B981' }}>
                                                {row.shortfall > 0 ? `+${row.shortfall}` : 'Đủ'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Khu vực công việc cần xử lý của HR (TABBED) */}
                <div className="card" style={{ padding: '1.25rem', backgroundColor: '#FFFFFF' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CheckSquare size={18} color="#DC2626" />
                            <span>Công việc Nhân sự cần HR xử lý</span>
                        </h3>
                        <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: '#F1F5F9', padding: '0.2rem', borderRadius: '6px' }}>
                            <button
                                onClick={() => setActionTab('RECRUITMENT')}
                                style={{
                                    padding: '0.25rem 0.55rem', borderRadius: '4px', border: 'none', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                                    backgroundColor: actionTab === 'RECRUITMENT' ? '#FFFFFF' : 'transparent',
                                    color: actionTab === 'RECRUITMENT' ? 'var(--bravo-teal-dark)' : '#64748B'
                                }}
                            >
                                Tuyển dụng
                            </button>
                            <button
                                onClick={() => setActionTab('HR')}
                                style={{
                                    padding: '0.25rem 0.55rem', borderRadius: '4px', border: 'none', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                                    backgroundColor: actionTab === 'HR' ? '#FFFFFF' : 'transparent',
                                    color: actionTab === 'HR' ? 'var(--bravo-teal-dark)' : '#64748B'
                                }}
                            >
                                Nhân sự & HĐ
                            </button>
                            <button
                                onClick={() => setActionTab('LEAVES')}
                                style={{
                                    padding: '0.25rem 0.55rem', borderRadius: '4px', border: 'none', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                                    backgroundColor: actionTab === 'LEAVES' ? '#FFFFFF' : 'transparent',
                                    color: actionTab === 'LEAVES' ? 'var(--bravo-teal-dark)' : '#64748B'
                                }}
                            >
                                Nghỉ phép
                            </button>
                        </div>
                    </div>

                    <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                        {actionTab === 'RECRUITMENT' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>YÊU CẦU TUYỂN DỤNG CẦN PHÊ DUYỆT / XỬ LÝ</div>
                                {actionNeeded.recruitment.pendingRequests.length === 0 ? (
                                    <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Không có yêu cầu nào chờ duyệt.</div>
                                ) : (
                                    actionNeeded.recruitment.pendingRequests.map(r => (
                                        <div key={r.id} onClick={() => goTo('RecruitmentModule', 'Yêu cầu tuyển dụng')} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', backgroundColor: '#F8FAFC', borderRadius: '6px', cursor: 'pointer', border: '1px solid #E2E8F0' }}>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.825rem', color: '#0F172A' }}>{r.code}: {r.positionName} ({r.quantity} NV)</div>
                                                <div style={{ fontSize: '0.725rem', color: '#64748B' }}>Đơn vị: {r.deptName}</div>
                                            </div>
                                            <span className="badge badge-yellow">Chờ xử lý</span>
                                        </div>
                                    ))
                                )}

                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', marginTop: '0.5rem' }}>OFFER CẦN THEO DÕI</div>
                                {actionNeeded.recruitment.pendingOffers.length === 0 ? (
                                    <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Không có Offer nào chờ.</div>
                                ) : (
                                    actionNeeded.recruitment.pendingOffers.map(o => (
                                        <div key={o.id} onClick={() => goTo('RecruitmentModule', 'Offer')} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', backgroundColor: '#F8FAFC', borderRadius: '6px', cursor: 'pointer', border: '1px solid #E2E8F0' }}>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.825rem', color: '#0F172A' }}>Offer: {o.candidateName}</div>
                                                <div style={{ fontSize: '0.725rem', color: '#64748B' }}>Lương: {Number(o.salary).toLocaleString('vi-VN')} VNĐ</div>
                                            </div>
                                            <span className="badge badge-teal">{o.status}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {actionTab === 'HR' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                 <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>HỢP ĐỒNG SẮP HẾT HẠN (60 NGÀY TỚI)</div>
                                {actionNeeded.hr.expiringContracts.length === 0 ? (
                                    <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Không có hợp đồng nào sắp hết hạn.</div>
                                ) : (
                                    actionNeeded.hr.expiringContracts.map(c => (
                                        <div key={c.id} onClick={() => goTo('HRModule', 'Hợp đồng lao động')} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', backgroundColor: '#FEF2F2', borderRadius: '6px', cursor: 'pointer', border: '1px solid #FCA5A5' }}>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.825rem', color: '#991B1B' }}>{c.empName} ({c.empCode})</div>
                                                <div style={{ fontSize: '0.725rem', color: '#7F1D1D' }}>{c.contractType} - Hạn: {new Date(c.endDate).toLocaleDateString('vi-VN')}</div>
                                            </div>
                                            <span className="badge badge-red">Sắp hết hạn</span>
                                        </div>
                                    ))
                                )}

                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', marginTop: '0.5rem' }}>ĐỀ XUẤT NHÂN SỰ CHỜ DUYỆT</div>
                                {actionNeeded.hr.pendingProposals.length === 0 ? (
                                    <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Không có đề xuất nào chờ.</div>
                                ) : (
                                    actionNeeded.hr.pendingProposals.map(p => (
                                        <div key={p.id} onClick={() => goTo('HRModule', 'Đề xuất thuyên chuyển, bổ nhiệm, miễn nhiệm')} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', backgroundColor: '#F8FAFC', borderRadius: '6px', cursor: 'pointer', border: '1px solid #E2E8F0' }}>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.825rem', color: '#0F172A' }}>{p.code}: {p.typeName}</div>
                                                <div style={{ fontSize: '0.725rem', color: '#64748B' }}>Ngày tạo: {new Date(p.created_date).toLocaleDateString('vi-VN')}</div>
                                            </div>
                                            <span className="badge badge-yellow">Chờ duyệt</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {actionTab === 'LEAVES' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>ĐƠN XIN NGHỈ PHÉP CHỜ HR THEO DÕI / DUYỆT</div>
                                {actionNeeded.leaves.pendingLeaves.length === 0 ? (
                                    <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Không có đơn xin nghỉ phép nào chờ.</div>
                                ) : (
                                    actionNeeded.leaves.pendingLeaves.map(l => (
                                        <div key={l.id} onClick={() => goTo('HRModule', 'Đơn xin nghỉ phép')} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', backgroundColor: '#F8FAFC', borderRadius: '6px', cursor: 'pointer', border: '1px solid #E2E8F0' }}>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.825rem', color: '#0F172A' }}>{l.empName} ({l.deptName})</div>
                                                <div style={{ fontSize: '0.725rem', color: '#64748B' }}>Nghỉ {l.totalDays} ngày - {l.reason}</div>
                                            </div>
                                            <span className="badge badge-yellow">Chờ duyệt</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Biểu đồ nhân sự HR (Cơ cấu phòng ban & Cơ cấu vị trí & Biến động) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.25rem' }}>
                <div className="card" style={{ padding: '1.25rem', backgroundColor: '#FFFFFF' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Building2 size={18} color="#0369A1" />
                        <span>Cơ cấu nhân sự theo phòng ban</span>
                    </h3>
                    <div style={{ maxHeight: '250px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                        {charts.deptStructure.map(d => (
                            <CustomBarRow key={d.department_name} label={d.department_name} count={d.count} max={Math.max(1, ...charts.deptStructure.map(x => x.count))} color="#0369A1" />
                        ))}
                    </div>
                </div>

                <div className="card" style={{ padding: '1.25rem', backgroundColor: '#FFFFFF' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Briefcase size={18} color="#7C3AED" />
                        <span>Cơ cấu nhân sự theo vị trí chức danh</span>
                    </h3>
                    <div style={{ maxHeight: '250px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                        {charts.positionStructure.map(p => (
                            <CustomBarRow key={p.position_name} label={p.position_name} count={p.count} max={Math.max(1, ...charts.positionStructure.map(x => x.count))} color="#7C3AED" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// =========================================================================
// 3. DASHBOARD BAN GIÁM ĐỐC (Dành cho C-Level Executives)
// =========================================================================
const BgdDashboard = ({ setCurrentTab, setActiveSubTab }) => {
    const [bgdData, setBgdData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [periodFilter, setPeriodFilter] = useState('MONTH'); // MONTH | QUARTER | YEAR
    const [selectedApproval, setSelectedApproval] = useState(null);
    const [approvalNote, setApprovalNote] = useState('');
    const [toastMsg, setToastMsg] = useState(null);

    useEffect(() => {
        const fetchBgdData = async () => {
            setLoading(true);
            try {
                const res = await api.get('/reports/dashboard/bgd');
                if (res.success) setBgdData(res.data);
            } catch (err) {
                console.error('Error fetching BGD dashboard:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchBgdData();
    }, []);

    const goTo = (module, subTab) => {
        setCurrentTab(module);
        setActiveSubTab(subTab);
    };

    const handleActionApproval = (item, statusAction) => {
        setBgdData(prev => ({
            ...prev,
            pendingApprovals: prev.pendingApprovals.filter(a => a.id !== item.id),
            kpi: {
                ...prev.kpi,
                pendingApprovalsCount: Math.max(0, prev.kpi.pendingApprovalsCount - 1)
            }
        }));

        setToastMsg(
            statusAction === 'APPROVED'
                ? `Đã PHÊ DUYỆT chứng từ ${item.code} của ${item.employeeName}`
                : `Đã TỪ CHỐI / YÊU CẦU ĐIỀU CHỈNH chứng từ ${item.code}`
        );
        setTimeout(() => setToastMsg(null), 4000);
        setSelectedApproval(null);
        setApprovalNote('');
    };

    if (loading || !bgdData) {
        return (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                <Clock size={32} className="animate-spin" style={{ margin: '0 auto 1rem', color: 'var(--bravo-teal)' }} />
                <div style={{ fontWeight: 600 }}>Đang tải dữ liệu Bàn làm việc Ban Giám đốc...</div>
            </div>
        );
    }

    const { kpi, pendingApprovals, deptStructure, levelStructure, movementTrend, recruitmentOverview } = bgdData;
    const maxDept = Math.max(1, ...deptStructure.map(d => d.count));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {toastMsg && (
                <div style={{
                    position: 'fixed', top: '20px', right: '20px', backgroundColor: '#0F172A', color: '#FFFFFF',
                    padding: '0.85rem 1.25rem', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                    display: 'flex', alignItems: 'center', gap: '0.75rem', zIndex: 9999, borderLeft: '5px solid var(--bravo-teal)',
                    fontSize: '0.875rem', fontWeight: 600
                }}>
                    <CheckCircle2 size={18} color="var(--bravo-teal)" />
                    <span>{toastMsg}</span>
                </div>
            )}

            <div>
                <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#0F172A' }}>
                    Dashboard Quản trị Ban Giám Đốc
                </h2>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                    Tổng quan chỉ số nhân sự toàn Tập đoàn, tình hình tuyển dụng, biến động quy mô và phê duyệt phiếu trình cấp C-Level
                </p>
            </div>

            {/* KPI Overview Ban Giám Đốc */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                <MetricCard icon={Users} label="Tổng số nhân sự" value={kpi.totalEmployees} subtext={`${kpi.activeEmployees} đang làm việc`} color="#0369A1" />
                <MetricCard icon={UserPlus} label="Nhân sự mới trong kỳ" value={kpi.newEmployeesPeriod} color="#059669" />
                <MetricCard icon={UserMinus} label="Nhân sự nghỉ việc" value={kpi.resignedEmployeesPeriod} color="#DC2626" />
                <MetricCard icon={Briefcase} label="Vị trí đang tuyển" value={kpi.openPositionsCount} subtext={`${kpi.pendingRequestsCount} yêu cầu chờ duyệt`} color="#D97706" onClick={() => goTo('RecruitmentModule', 'Yêu cầu tuyển dụng')} />
                <MetricCard icon={FileSignature} label="Phiếu chờ BGD duyệt" value={kpi.pendingApprovalsCount} color="#7C3AED" />
            </div>

            {/* PHIẾU CHỜ BAN GIÁM ĐỐC PHÊ DUYỆT (PRIORITY SECTION) */}
            <div className="card" style={{ padding: '1.25rem', backgroundColor: '#FFFFFF', borderLeft: '4px solid #7C3AED' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileSignature size={20} color="#7C3AED" />
                        <span>Phiếu & Chứng từ Chờ Ban Giám đốc Phê duyệt</span>
                        <span className="badge badge-yellow" style={{ fontSize: '0.75rem' }}>{pendingApprovals.length} phiếu</span>
                    </h3>
                </div>

                {pendingApprovals.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>
                        <CheckCircle2 size={36} color="#10B981" style={{ margin: '0 auto 0.5rem' }} />
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Tất cả các phiếu trình đã được Ban Giám đốc xử lý hoàn tất!</div>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="erp-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '130px' }}>Số / Mã phiếu</th>
                                    <th style={{ width: '170px' }}>Loại phiếu đề xuất</th>
                                    <th>Nhân sự liên quan / Nội dung trình duyệt</th>
                                    <th style={{ width: '110px' }}>Ngày gửi</th>
                                    <th style={{ width: '140px' }}>Cấp phê duyệt</th>
                                    <th style={{ width: '180px', textAlign: 'center' }}>Thao tác trực tiếp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingApprovals.map((item) => (
                                    <tr key={item.id}>
                                        <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--bravo-teal-dark)' }}>{item.code}</td>
                                        <td><span className="badge badge-teal">{item.typeName}</span></td>
                                        <td>
                                            <div style={{ fontWeight: 600, color: '#0F172A' }}>{item.employeeName}</div>
                                            <div style={{ fontSize: '0.775rem', color: '#64748B' }}>Lý do/Nội dung: {item.reason}</div>
                                        </td>
                                        <td style={{ fontSize: '0.8rem', color: '#64748B' }}>{new Date(item.created_date).toLocaleDateString('vi-VN')}</td>
                                        <td><span className="badge badge-blue">{item.currentLevel}</span></td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                                                <button
                                                    className="btn btn-primary"
                                                    style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', backgroundColor: '#10B981', borderColor: '#059669' }}
                                                    onClick={() => setSelectedApproval({ item, mode: 'APPROVE' })}
                                                >
                                                    <Check size={14} /> Duyệt
                                                </button>
                                                <button
                                                    className="btn btn-secondary"
                                                    style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', color: '#DC2626' }}
                                                    onClick={() => setSelectedApproval({ item, mode: 'REJECT' })}
                                                >
                                                    <X size={14} /> Từ chối
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Tình hình tuyển dụng tổng quan & Tỷ lệ hoàn thành */}
            <div className="card" style={{ padding: '1.25rem', backgroundColor: '#FFFFFF' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ClipboardList size={18} color="#0369A1" />
                        <span>Tình hình Tuyển dụng Tổng quan Doanh nghiệp</span>
                    </h3>
                    <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }} onClick={() => goTo('RecruitmentModule', 'Yêu cầu tuyển dụng')}>
                        Chi tiết Tuyển dụng <ChevronRight size={14} />
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>Nhu cầu tuyển dụng</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A' }}>{recruitmentOverview.totalTarget} <span style={{ fontSize: '0.85rem', color: '#64748B' }}>nhân sự</span></div>
                    </div>

                    <div style={{ backgroundColor: '#ECFDF5', padding: '1rem', borderRadius: '10px', border: '1px solid #A7F3D0', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.8rem', color: '#047857', fontWeight: 600 }}>Đã tuyển thành công</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669' }}>{recruitmentOverview.totalHired} <span style={{ fontSize: '0.85rem', color: '#047857' }}>nhân sự</span></div>
                    </div>

                    <div style={{ backgroundColor: '#FEF2F2', padding: '1rem', borderRadius: '10px', border: '1px solid #FCA5A5', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.8rem', color: '#B91C1C', fontWeight: 600 }}>Còn thiếu cần bổ sung</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#DC2626' }}>{recruitmentOverview.remainingShortfall} <span style={{ fontSize: '0.85rem', color: '#B91C1C' }}>vị trí</span></div>
                    </div>

                    <div style={{ backgroundColor: '#F0F9FF', padding: '1rem', borderRadius: '10px', border: '1px solid #BAE6FD' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: '#0369A1', marginBottom: '0.4rem' }}>
                            <span>Tỷ lệ hoàn thành kế hoạch</span>
                            <span>{recruitmentOverview.completionRate}%</span>
                        </div>
                        <div style={{ backgroundColor: '#E0F2FE', height: '10px', borderRadius: '6px', overflow: 'hidden' }}>
                            <div style={{ width: `${recruitmentOverview.completionRate}%`, backgroundColor: '#0284C7', height: '100%', borderRadius: '6px' }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Cơ cấu nhân sự & Xu hướng biến động */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.25rem' }}>
                <div className="card" style={{ padding: '1.25rem', backgroundColor: '#FFFFFF' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Building2 size={18} color="#0369A1" />
                        <span>Cơ cấu nhân sự theo Phòng ban</span>
                    </h3>
                    <div style={{ maxHeight: '250px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                        {deptStructure.map(d => (
                            <CustomBarRow key={d.department_name} label={d.department_name} count={d.count} max={maxDept} color="#0369A1" />
                        ))}
                    </div>
                </div>

                <div className="card" style={{ padding: '1.25rem', backgroundColor: '#FFFFFF' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <TrendingUp size={18} color="var(--bravo-teal)" />
                            <span>Biến động Nhân sự theo thời gian</span>
                        </h3>
                        <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: '#F1F5F9', padding: '0.2rem', borderRadius: '6px' }}>
                            <button
                                onClick={() => setPeriodFilter('MONTH')}
                                style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', border: 'none', fontSize: '0.725rem', fontWeight: 600, cursor: 'pointer', backgroundColor: periodFilter === 'MONTH' ? '#FFFFFF' : 'transparent', color: periodFilter === 'MONTH' ? 'var(--bravo-teal-dark)' : '#64748B' }}
                            >
                                Tháng
                            </button>
                            <button
                                onClick={() => setPeriodFilter('QUARTER')}
                                style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', border: 'none', fontSize: '0.725rem', fontWeight: 600, cursor: 'pointer', backgroundColor: periodFilter === 'QUARTER' ? '#FFFFFF' : 'transparent', color: periodFilter === 'QUARTER' ? 'var(--bravo-teal-dark)' : '#64748B' }}
                            >
                                Quý
                            </button>
                            <button
                                onClick={() => setPeriodFilter('YEAR')}
                                style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', border: 'none', fontSize: '0.725rem', fontWeight: 600, cursor: 'pointer', backgroundColor: periodFilter === 'YEAR' ? '#FFFFFF' : 'transparent', color: periodFilter === 'YEAR' ? 'var(--bravo-teal-dark)' : '#64748B' }}
                            >
                                Năm
                            </button>
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table className="erp-table">
                            <thead>
                                <tr>
                                    <th>Kỳ báo cáo</th>
                                    <th style={{ textAlign: 'center' }}>Tuyển mới</th>
                                    <th style={{ textAlign: 'center' }}>Thuyển chuyển</th>
                                    <th style={{ textAlign: 'center' }}>Bổ nhiệm</th>
                                    <th style={{ textAlign: 'center' }}>Nghỉ việc</th>
                                </tr>
                            </thead>
                            <tbody>
                                {movementTrend.map((row, idx) => (
                                    <tr key={idx}>
                                        <td style={{ fontWeight: 600 }}>{row.period}</td>
                                        <td style={{ textAlign: 'center', fontWeight: 700, color: '#059669' }}>+{row.newHires}</td>
                                        <td style={{ textAlign: 'center', fontWeight: 600, color: '#0369A1' }}>{row.transfers}</td>
                                        <td style={{ textAlign: 'center', fontWeight: 600, color: '#7C3AED' }}>{row.promotions}</td>
                                        <td style={{ textAlign: 'center', fontWeight: 700, color: '#DC2626' }}>-{row.resignations}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Quick Modal Approval for BGD */}
            {selectedApproval && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
                    <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 40px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
                        <div style={{ padding: '1.1rem 1.35rem', backgroundColor: selectedApproval.mode === 'APPROVE' ? '#ECFDF5' : '#FEF2F2', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                                {selectedApproval.mode === 'APPROVE' ? `Xác nhận Phê duyệt C-Level: ${selectedApproval.item.code}` : `Từ chối trình duyệt: ${selectedApproval.item.code}`}
                            </h3>
                            <button onClick={() => setSelectedApproval(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={18} /></button>
                        </div>
                        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ backgroundColor: '#F8FAFC', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.825rem' }}>
                                <div><b>Loại phiếu:</b> {selectedApproval.item.typeName}</div>
                                <div><b>Nhân sự liên quan:</b> {selectedApproval.item.employeeName}</div>
                                <div><b>Nội dung:</b> {selectedApproval.item.reason}</div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Ý kiến chỉ đạo của Ban Giám Đốc:</label>
                                <textarea rows={3} value={approvalNote} onChange={e => setApprovalNote(e.target.value)} placeholder="Nhập ý kiến chỉ đạo phê duyệt..." style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.825rem' }} />
                            </div>
                        </div>
                        <div style={{ padding: '0.85rem 1.25rem', backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button className="btn btn-secondary" onClick={() => setSelectedApproval(null)} style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>Hủy</button>
                            <button
                                className="btn btn-primary"
                                style={{ backgroundColor: selectedApproval.mode === 'APPROVE' ? '#10B981' : '#DC2626', borderColor: selectedApproval.mode === 'APPROVE' ? '#059669' : '#B91C1C', fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}
                                onClick={() => handleActionApproval(selectedApproval.item, selectedApproval.mode === 'APPROVE' ? 'APPROVED' : 'REJECTED')}
                            >
                                {selectedApproval.mode === 'APPROVE' ? 'Phê duyệt phiếu' : 'Gửi từ chối'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// =========================================================================
// 4. DASHBOARD TRƯỜNG PHÒNG / TRƯỜNG KHỐI (Department Manager)
// =========================================================================
const ManagerDashboard = ({ setCurrentTab, setActiveSubTab }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [selectedDeptId, setSelectedDeptId] = useState('dept-kd');
    const [departments, setDepartments] = useState([]);
    const [positions, setPositions] = useState([]);
    const [approvalTab, setApprovalTab] = useState('ALL');
    const [activeModal, setActiveModal] = useState(null);
    const [approvalNote, setApprovalNote] = useState('');
    const [toastMessage, setToastMessage] = useState(null);

    const [pendingApprovals, setPendingApprovals] = useState([
        { id: 'doc-rne-01', code: 'RNE/0826-0002', type: 'YCTD', typeName: 'Yêu cầu tuyển dụng', title: 'Bổ sung 3 Chuyên viên Cloud & Security', requester: 'Hoàng Trọng Nghĩa - Trưởng nhóm Cloud', deptName: 'Phòng Cloud và Hạ tầng', submittedDate: '11/08/2026', priority: 'HIGH', status: 'PENDING', details: 'Tuyển bổ sung 3 Chuyên viên Cloud cho dự án nâng cấp Hạ tầng ERP BRAVO 10.' },
        { id: 'doc-ct-01', code: 'DXHD/2026-089', type: 'CONTRACT', typeName: 'Đề xuất Hợp đồng', title: 'Đề xuất chuyển HĐLĐ Thử việc sang HĐLĐ 1 Năm', requester: 'Trần Thị Thu Hà - Chuyên viên HR', deptName: 'Phòng Kinh doanh', submittedDate: '10/08/2026', priority: 'MEDIUM', status: 'PENDING', details: 'Nhân sự Nguyễn Thu Hà hoàn thành 2 tháng thử việc xuất sắc.' }
    ]);

    const [managerSchedule, setManagerSchedule] = useState([
        { id: 'sch-01', time: '14:30 - Hôm nay', type: 'INTERVIEW', title: 'Phỏng vấn Vòng 2 (Chuyên môn & Thái độ)', candidateName: 'Nguyễn Thu Hà', positionName: 'Chuyên viên Tư vấn ERP', location: 'Phòng họp B3 (Tầng 4)', note: 'Ứng viên có 3 năm kinh nghiệm triển khai phần mềm CRM/ERP.' }
    ]);

    const [upcomingExpirations, setUpcomingExpirations] = useState([
        { id: 'exp-01', empCode: 'NV-2026-088', empName: 'Đỗ Quốc Hưng', positionName: 'Chuyên viên Kinh doanh ERP', contractType: 'Thử việc 2 tháng', expiryDate: '15/08/2026', daysLeft: 3 }
    ]);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const storedUser = JSON.parse(localStorage.getItem('bravo_hrm_user') || '{}');
            setCurrentUser(storedUser);

            const [resDepts, resPos, resReqs, resInts] = await Promise.all([
                api.get('/admin/departments'),
                api.get('/admin/positions'),
                api.get('/recruitment/requests'),
                api.get('/recruitment/interviews')
            ]);

            if (resDepts.success && Array.isArray(resDepts.data)) {
                setDepartments(resDepts.data);
                if (storedUser.deptId && resDepts.data.some(d => d.department_id === storedUser.deptId)) {
                    setSelectedDeptId(storedUser.deptId);
                } else if (resDepts.data.length > 0) {
                    setSelectedDeptId(resDepts.data[0].department_id);
                }
            }
            if (resPos.success && Array.isArray(resPos.data)) setPositions(resPos.data);
            if (resReqs.success && Array.isArray(resReqs.data) && resReqs.data.length > 0) {
                const pendingReqs = resReqs.data.filter(r => r.status === 'PENDING').map(r => ({
                    id: r.recruitment_request_id || r.id,
                    code: r.request_code,
                    type: 'YCTD',
                    typeName: 'Yêu cầu tuyển dụng',
                    title: `Bổ sung ${r.quantity} ${r.position_name || 'Nhân sự'} (${r.reason || 'Định biên'})`,
                    requester: r.requested_by_name || 'Trưởng bộ phận',
                    deptName: r.department_name,
                    submittedDate: r.created_date ? new Date(Number(r.created_date) || Date.now()).toLocaleDateString('vi-VN') : 'Mới tạo',
                    priority: r.priority || 'HIGH',
                    status: 'PENDING',
                    details: r.reason || 'Nhu cầu bổ sung nhân sự'
                }));
                if (pendingReqs.length > 0) setPendingApprovals(pendingReqs);
            }
            if (resInts.success && Array.isArray(resInts.data) && resInts.data.length > 0) {
                const mapped = resInts.data.map(i => ({
                    id: i.interview_id || i.id,
                    time: i.interview_date ? new Date(Number(i.interview_date) || Date.now()).toLocaleDateString('vi-VN') : 'Sắp diễn ra',
                    type: 'INTERVIEW',
                    title: i.round_name || 'Phỏng vấn chuyên môn',
                    candidateName: i.candidate_name || 'Ứng viên',
                    positionName: i.position_name || 'Chuyên viên ERP',
                    location: 'Phòng họp B3 (BRAVO)',
                    note: i.comment || 'Đánh giá năng lực chuyên môn'
                }));
                setManagerSchedule(mapped);
            }
        } catch (err) {
            console.error('Error loading manager dashboard:', err);
        } finally {
            setLoading(false);
        }
    };

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 4000);
    };

    const handleApproveReject = (doc, action) => {
        setActiveModal({ type: action, item: doc });
        setApprovalNote('');
    };

    const submitApprovalAction = async () => {
        if (!activeModal) return;
        const { type, item } = activeModal;
        const newStatus = type === 'APPROVE' ? 'APPROVED' : 'REJECTED';

        if (item.type === 'YCTD') {
            await api.put(`/recruitment/requests/${item.id}/approve`, { status: newStatus, note: approvalNote });
        }
        setPendingApprovals(prev => prev.filter(p => p.id !== item.id));
        showToast(type === 'APPROVE' ? `Đã PHÊ DUYỆT chứng từ ${item.code}` : `Đã TỪ CHỐI chứng từ ${item.code}`);
        setActiveModal(null);
        setApprovalNote('');
    };

    const filteredApprovals = pendingApprovals.filter(item => {
        if (approvalTab === 'ALL') return true;
        return item.type === approvalTab;
    });

    const currentDeptDetail = departments.find(d => d.department_id === selectedDeptId || d.id === selectedDeptId) || {
        department_name: currentUser?.deptName || 'Phòng Kinh doanh',
        target_headcount: 20,
        current_count: 17
    };

    const currentDeptPositions = positions.filter(
        p => p.department_id === selectedDeptId || p.department_name === currentDeptDetail.department_name
    );

    if (loading) {
        return (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                <Clock size={32} className="animate-spin" style={{ margin: '0 auto 1rem', color: 'var(--bravo-teal)' }} />
                <div style={{ fontWeight: 600 }}>Đang tải Bàn làm việc Trưởng phòng / Trưởng khối...</div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '2rem' }}>
            {toastMessage && (
                <div style={{ position: 'fixed', top: '20px', right: '20px', backgroundColor: '#0F172A', color: '#FFFFFF', padding: '0.85rem 1.25rem', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '0.75rem', zIndex: 9999, borderLeft: '5px solid var(--bravo-teal)', fontSize: '0.875rem', fontWeight: 600 }}>
                    <CheckCircle2 size={18} color="var(--bravo-teal)" />
                    <span>{toastMessage}</span>
                </div>
            )}

            <div>
                <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#0F172A' }}>
                    Bàn làm việc Quản lý - {currentDeptDetail.department_name}
                </h2>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                    Quản lý định biên, lịch phỏng vấn và chứng từ phê duyệt bộ phận
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                <MetricCard icon={Users} label="Định biên Nhân sự Đơn vị" value={`${currentDeptDetail.current_count || 17} / ${currentDeptDetail.target_headcount || 20} NV`} color="var(--bravo-teal)" />
                <MetricCard icon={Clock} label="Chứng từ Chờ tôi Phê duyệt" value={pendingApprovals.length} color="#DC2626" />
                <MetricCard icon={UserCheck} label="Lịch Phỏng vấn Chuyên môn" value={managerSchedule.length} color="#0369A1" onClick={() => { setCurrentTab('RecruitmentModule'); setActiveSubTab('Lịch Phỏng vấn'); }} />
                <MetricCard icon={Award} label="Đánh giá KPI & Thử việc" value={upcomingExpirations.length + 3} color="#15803D" onClick={() => { setCurrentTab('HRModule'); setActiveSubTab('Hợp đồng lao động'); }} />
            </div>

            {/* Pending Approvals Table */}
            <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #E2E8F0' }}>
                    <h3 style={{ fontSize: '1.05rem', color: '#0F172A', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                        <FileSignature size={20} color="var(--bravo-teal-dark)" />
                        <span>Chứng từ & Nghiệp vụ Chờ Tôi Phê duyệt</span>
                        <span className="badge badge-red" style={{ fontSize: '0.725rem' }}>{pendingApprovals.length} chứng từ</span>
                    </h3>
                </div>

                {filteredApprovals.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>
                        <CheckCircle2 size={36} color="#10B981" style={{ margin: '0 auto 0.5rem' }} />
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Không có chứng từ nào chờ duyệt trong mục này.</div>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="erp-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '115px' }}>Mã chứng từ</th>
                                    <th style={{ width: '130px' }}>Loại chứng từ</th>
                                    <th>Nội dung Đề xuất</th>
                                    <th style={{ width: '180px' }}>Người trình duyệt</th>
                                    <th style={{ width: '100px' }}>Độ ưu tiên</th>
                                    <th style={{ width: '210px', textAlign: 'center' }}>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredApprovals.map((doc) => (
                                    <tr key={doc.id}>
                                        <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--bravo-teal-dark)' }}>{doc.code}</td>
                                        <td><span className="badge badge-blue">{doc.typeName}</span></td>
                                        <td>
                                            <div style={{ fontWeight: 600, color: '#0F172A' }}>{doc.title}</div>
                                            <div style={{ fontSize: '0.775rem', color: '#64748B' }}>{doc.details}</div>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '0.825rem', fontWeight: 600 }}>{doc.requester}</div>
                                            <div style={{ fontSize: '0.725rem', color: '#94A3B8' }}>{doc.deptName}</div>
                                        </td>
                                        <td>
                                            <span className={`badge ${doc.priority === 'URGENT' ? 'badge-red' : doc.priority === 'HIGH' ? 'badge-yellow' : 'badge-blue'}`}>
                                                {doc.priority === 'URGENT' ? 'Khẩn cấp' : doc.priority === 'HIGH' ? 'Cao' : 'Thường'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.35rem' }}>
                                                <button className="btn btn-primary" style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', backgroundColor: '#10B981', borderColor: '#059669' }} onClick={() => handleApproveReject(doc, 'APPROVE')}>
                                                    <Check size={14} /> Duyệt
                                                </button>
                                                <button className="btn btn-secondary" style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', color: '#DC2626' }} onClick={() => handleApproveReject(doc, 'REJECT')}>
                                                    <X size={14} /> Từ chối
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Quick Action Modal for Manager */}
            {activeModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
                    <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 40px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
                        <div style={{ padding: '1.1rem 1.35rem', backgroundColor: activeModal.type === 'APPROVE' ? '#ECFDF5' : '#FEF2F2', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                                {activeModal.type === 'APPROVE' ? `Phê duyệt: ${activeModal.item.code}` : `Từ chối: ${activeModal.item.code}`}
                            </h3>
                            <button onClick={() => setActiveModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={18} /></button>
                        </div>
                        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ backgroundColor: '#F8FAFC', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.825rem' }}>
                                <div><b>Tiêu đề:</b> {activeModal.item.title}</div>
                                <div><b>Người trình:</b> {activeModal.item.requester}</div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Ý kiến chỉ đạo:</label>
                                <textarea rows={3} value={approvalNote} onChange={e => setApprovalNote(e.target.value)} placeholder="Nhập ghi chú ý kiến..." style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.825rem' }} />
                            </div>
                        </div>
                        <div style={{ padding: '0.85rem 1.25rem', backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button className="btn btn-secondary" onClick={() => setActiveModal(null)} style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>Hủy</button>
                            <button className="btn btn-primary" style={{ backgroundColor: activeModal.type === 'APPROVE' ? '#10B981' : '#DC2626', borderColor: activeModal.type === 'APPROVE' ? '#059669' : '#B91C1C', fontSize: '0.8rem', padding: '0.35rem 0.85rem' }} onClick={submitApprovalAction}>
                                {activeModal.type === 'APPROVE' ? 'Xác nhận Duyệt' : 'Gửi từ chối'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// =========================================================================
// MAIN DASHBOARD COMPONENT ROUTER BY USER ROLE
// =========================================================================
export const Dashboard = ({ setCurrentTab, setActiveSubTab }) => {
    const { user } = useAuth();

    // Admin, Ban Giám Đốc và cấp quản lý dùng chung một dashboard nhân sự.
    if (['Administrator', 'Ban Giám Đốc', 'Trưởng Phòng', 'Trưởng Khối'].includes(user?.roleName)) {
        return <WorkforceDashboard setCurrentTab={setCurrentTab} setActiveSubTab={setActiveSubTab} />;
    }

    // HR STAFF ROLE -> Dashboard HR
    if (user?.roleName === 'HR Staff') {
        return <HrDashboard setCurrentTab={setCurrentTab} setActiveSubTab={setActiveSubTab} />;
    }

    // NHÂN VIÊN THÔNG THƯỜNG -> KHÔNG CÓ DASHBOARD
    // Trả về thông báo chuyển hướng (mặc dù App.jsx đã tự động điều hướng sang Hồ sơ cá nhân)
    return (
        <div style={{ padding: '3rem 2rem', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', marginTop: '1rem' }}>
            <AlertCircle size={48} color="var(--bravo-teal)" style={{ marginBottom: '1rem' }} />
            <h2 style={{ color: '#0F172A', fontSize: '1.25rem', margin: '0 0 0.5rem 0' }}>
                Tài khoản Nhân viên không có Dashboard
            </h2>
            <p style={{ color: '#64748B', fontSize: '0.9rem', maxWidth: '500px', margin: '0 auto 1.5rem auto' }}>
                Hệ thống đang chuyển hướng bạn trực tiếp đến module <b>Quản lý nhân sự → Hồ sơ cá nhân</b>...
            </p>
            <button className="btn btn-primary" onClick={() => { setCurrentTab('HRModule'); setActiveSubTab('Hồ sơ nhân sự'); }}>
                Chuyển đến Hồ sơ cá nhân ngay
            </button>
        </div>
    );
};
