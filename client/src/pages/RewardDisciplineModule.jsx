import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { StatusChip } from '../components/StatusChip';
import { useNotification } from '../context/NotificationContext';
import {
    Award,
    ShieldAlert,
    Plus,
    Search,
    Calendar,
    FileCheck,
    CheckSquare,
    Layers,
    Star,
    Eye,
    Trash2,
    FileText
} from 'lucide-react';

export const RewardDisciplineModule = ({ activeSubTab }) => {
    const { addToast } = useNotification();

    // Data states
    const [records, setRecords] = useState([]);
    const [proposals, setProposals] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [criteriaList, setCriteriaList] = useState([]);
    const [evaluations, setEvaluations] = useState([]);
    const [loading, setLoading] = useState(false);

    // Modal states
    const [modalType, setModalType] = useState(null); // 'add_criteria' | 'add_eval' | 'add_proposal' | 'add_decision' | 'detail_eval'
    const [selectedEval, setSelectedEval] = useState(null);
    const [selectedEmpId, setSelectedEmpId] = useState('');
    const [formData, setFormData] = useState({});

    // Dynamic Scale Rows in Criteria Form
    const [scaleRows, setScaleRows] = useState([
        { grade_name: 'Xuất sắc (A+)', min_score: 9.0, max_score: 10.0, description: 'Hoàn thành vượt mảng chỉ tiêu 100%' },
        { grade_name: 'Tốt (A)', min_score: 8.0, max_score: 9.0, description: 'Hoàn thành tốt đúng hạn' },
        { grade_name: 'Khá (B)', min_score: 6.5, max_score: 8.0, description: 'Đạt yêu cầu chuẩn' },
        { grade_name: 'Trung bình (C)', min_score: 5.0, max_score: 6.5, description: 'Cần cải thiện năng suất' }
    ]);

    // Dynamic Selected Criteria in Evaluation Form
    const [evalDetailRows, setEvalDetailRows] = useState([]);

    useEffect(() => {
        fetchCommonData();
        fetchSubTabData();
    }, [activeSubTab]);

    const fetchCommonData = async () => {
        try {
            const resEmp = await api.get('/hr/employees');
            const resCrit = await api.get('/reward-discipline/criteria');
            if (resEmp.success && Array.isArray(resEmp.data)) setEmployees(resEmp.data);
            if (resCrit.success && Array.isArray(resCrit.data)) {
                setCriteriaList(resCrit.data);
                if (resCrit.data.length > 0 && evalDetailRows.length === 0) {
                    setEvalDetailRows(resCrit.data.map(c => ({
                        criteria_id: c.criteria_id,
                        criteria_code: c.criteria_code,
                        criteria_name: c.criteria_name,
                        weight: c.weight || 25,
                        score: 8.5,
                        note: 'Hoàn thành nhiệm vụ'
                    })));
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchSubTabData = async () => {
        setLoading(true);
        try {
            if (!activeSubTab || activeSubTab === 'Tiêu chí đánh giá nhân viên') {
                const res = await api.get('/reward-discipline/criteria');
                if (res.success && Array.isArray(res.data)) setCriteriaList(res.data);
            } else if (activeSubTab === 'Phiếu đánh giá nhân viên' || activeSubTab === 'Phiếu đánh giá nhân sự') {
                const res = await api.get('/reward-discipline/evaluations');
                if (res.success && Array.isArray(res.data)) setEvaluations(res.data);
            } else if (activeSubTab === 'Đề xuất khen thưởng/kỷ luật') {
                const res = await api.get('/reward-discipline/proposals');
                if (res.success && Array.isArray(res.data)) setProposals(res.data);
            } else if (activeSubTab === 'Quyết định khen thưởng kỷ luật' || activeSubTab === 'Danh sách quyết định' || activeSubTab === 'Tra cứu lịch sử') {
                const resR = await api.get('/reward-discipline');
                const resE = await api.get('/reward-discipline/evaluations');
                if (resR.success && Array.isArray(resR.data)) setRecords(resR.data);
                if (resE.success && Array.isArray(resE.data)) setEvaluations(resE.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // --- HANDLERS ---
    const handleCreateCriteria = async (e) => {
        e.preventDefault();
        const res = await api.post('/reward-discipline/criteria', {
            ...formData,
            scales: scaleRows
        });
        if (res.success) {
            addToast('Thêm Tiêu chí Đánh giá thành công!', 'success');
            setModalType(null);
            fetchSubTabData();
            fetchCommonData();
        } else {
            addToast(res.message, 'error');
        }
    };

    const handleCreateEvaluation = async (e) => {
        e.preventDefault();
        const res = await api.post('/reward-discipline/evaluations', {
            ...formData,
            details: evalDetailRows
        });
        if (res.success) {
            addToast(`Lập Phiếu Đánh giá thành công! Kết quả: ${res.data.gradeResult} (${res.data.totalScore} điểm)`, 'success');
            setModalType(null);
            fetchSubTabData();
        } else {
            addToast(res.message, 'error');
        }
    };

    const handleCreateProposal = async (e) => {
        e.preventDefault();
        const res = await api.post('/reward-discipline/proposals', formData);
        if (res.success) {
            addToast('Tạo Phiếu Đề xuất Khen thưởng / Kỷ luật thành công!', 'success');
            setModalType(null);
            fetchSubTabData();
        } else {
            addToast(res.message, 'error');
        }
    };

    const handleCreateDecision = async (e) => {
        e.preventDefault();
        const res = await api.post('/reward-discipline', formData);
        if (res.success) {
            addToast(res.message, 'success');
            setModalType(null);
            fetchSubTabData();
        } else {
            addToast(res.message, 'error');
        }
    };

    const handleDeleteCriteria = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa Tiêu chí đánh giá này?')) return;
        const res = await api.delete(`/reward-discipline/criteria/${id}`);
        if (res.success) {
            addToast('Xóa Tiêu chí đánh giá thành công!', 'success');
            fetchSubTabData();
        } else {
            addToast(res.message || 'Lỗi khi xóa tiêu chí!', 'error');
        }
    };

    const handleDeleteEvaluation = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa Phiếu đánh giá này?')) return;
        const res = await api.delete(`/reward-discipline/evaluations/${id}`);
        if (res.success) {
            addToast('Xóa Phiếu đánh giá thành công!', 'success');
            fetchSubTabData();
        } else {
            addToast(res.message || 'Lỗi khi xóa phiếu đánh giá!', 'error');
        }
    };

    const handleDeleteProposal = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa Đề xuất Khen thưởng/Kỷ luật này?')) return;
        const res = await api.delete(`/reward-discipline/proposals/${id}`);
        if (res.success) {
            addToast('Xóa Đề xuất thành công!', 'success');
            fetchSubTabData();
        } else {
            addToast(res.message || 'Lỗi khi xóa đề xuất!', 'error');
        }
    };

    const handleDeleteDecision = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa Quyết định Khen thưởng/Kỷ luật này?')) return;
        const res = await api.delete(`/reward-discipline/${id}`);
        if (res.success) {
            addToast('Xóa Quyết định thành công!', 'success');
            fetchSubTabData();
        } else {
            addToast(res.message || 'Lỗi khi xóa quyết định!', 'error');
        }
    };

    // Filtered lists for History Tab
    const safeRecords = Array.isArray(records) ? records : [];
    const safeEvaluations = Array.isArray(evaluations) ? evaluations : [];
    const safeProposals = Array.isArray(proposals) ? proposals : [];
    const safeEmployees = Array.isArray(employees) ? employees : [];
    const safeCriteria = Array.isArray(criteriaList) ? criteriaList : [];

    const filteredRecords = selectedEmpId
        ? safeRecords.filter((r) => r && (r.employee_id === selectedEmpId || r.emp_id === selectedEmpId))
        : safeRecords;

    const filteredEvaluations = selectedEmpId
        ? safeEvaluations.filter((ev) => ev && ev.employee_id === selectedEmpId)
        : safeEvaluations;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* 1. DANH MỤC TIÊU CHÍ ĐÁNH GIÁ NHÂN VIÊN */}
            {(!activeSubTab || activeSubTab === 'Tiêu chí đánh giá nhân viên') && (
                <DataTable
                    loading={loading}
                    addLabel="Thêm Tiêu chí Đánh giá Mới"
                    onAdd={() => {
                        setFormData({
                            criteria_code: 'TC-0' + (safeCriteria.length + 1),
                            weight: 25
                        });
                        setModalType('add_criteria');
                    }}
                    searchPlaceholder="Tìm mã tiêu chí, tên tiêu chí..."
                    columns={[
                        { header: 'Mã tiêu chí', accessor: 'criteria_code', render: (r) => <b>{r.criteria_code}</b> },
                        { header: 'Tên Tiêu chí Đánh giá', accessor: 'criteria_name', render: (r) => <span style={{ fontWeight: 700, color: 'var(--bravo-teal-dark)' }}>{r.criteria_name}</span> },
                        { header: 'Trọng số (%)', accessor: 'weight', render: (r) => <b style={{ color: '#00BCD4' }}>{r.weight}%</b> },
                        { header: 'Mô tả diễn giải', accessor: 'description' },
                        {
                            header: 'Thang điểm chi tiết (Scale)',
                            render: (r) => (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.75rem' }}>
                                    {r.scales?.map((s, idx) => (
                                        <div key={idx} style={{ color: '#475569' }}>
                                            • <b>{s.grade_name}</b>: [{s.min_score} đến &lt; {s.max_score} điểm]
                                        </div>
                                    ))}
                                </div>
                            )
                        },
                        {
                            header: 'Thao tác',
                            render: (r) => (
                                <button
                                    className="btn btn-secondary"
                                    style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', fontWeight: 600, color: '#EF4444', borderColor: '#FCA5A5', display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}
                                    onClick={() => handleDeleteCriteria(r.criteria_id)}
                                    title="Xóa tiêu chí"
                                >
                                    <Trash2 size={14} />
                                    <span>Xóa</span>
                                </button>
                            )
                        }
                    ]}
                    data={safeCriteria}
                />
            )}

            {/* 2. PHIẾU ĐÁNH GIÁ NHÂN VIÊN */}
            {(activeSubTab === 'Phiếu đánh giá nhân viên' || activeSubTab === 'Phiếu đánh giá nhân sự') && (
                <DataTable
                    loading={loading}
                    addLabel="Lập Phiếu Đánh giá Nhân viên"
                    onAdd={() => {
                        setFormData({
                            evaluator_id: safeEmployees[0]?.employee_id || '',
                            employee_id: safeEmployees[1]?.employee_id || safeEmployees[0]?.employee_id || '',
                            year: 2026
                        });
                        setModalType('add_eval');
                    }}
                    searchPlaceholder="Tìm mã phiếu, tên nhân viên..."
                    columns={[
                        { header: 'Mã Phiếu', accessor: 'evaluation_code', render: (r) => <b>{r.evaluation_code}</b> },
                        { header: 'Ngày đánh giá', render: (r) => r.evaluation_date ? new Date(r.evaluation_date).toLocaleDateString('vi-VN') : '—' },
                        { header: 'Nhân viên được đánh giá', accessor: 'employee_name', render: (r) => <span style={{ fontWeight: 700 }}>{r.employee_name} ({r.employee_code})</span> },
                        { header: 'Bộ phận & Vị trí', render: (r) => `${r.department_name || '—'} - ${r.position_name || '—'}` },
                        { header: 'Người đánh giá', accessor: 'evaluator_name' },
                        { header: 'Điểm tổng hợp', accessor: 'total_score', render: (r) => <b style={{ fontSize: '1rem', color: 'var(--bravo-teal-dark)' }}>{r.total_score} / 10</b> },
                        {
                            header: 'Xếp loại',
                            accessor: 'grade_result',
                            render: (r) => (
                                <span className={`badge ${r.grade_result?.includes('A') ? 'badge-green' : 'badge-teal'}`}>
                                    {r.grade_result}
                                </span>
                            )
                        },
                        {
                            header: 'Chi tiết tiêu chí',
                            render: (r) => (
                                <button
                                    className="btn btn-secondary"
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                    onClick={() => {
                                        setSelectedEval(r);
                                        setModalType('detail_eval');
                                    }}
                                >
                                    <Eye size={14} />
                                    <span>Xem Chi tiết ({r.details?.length || 0} tiêu chí)</span>
                                </button>
                            )
                        },
                        {
                            header: 'Thao tác',
                            render: (r) => (
                                <button
                                    className="btn btn-secondary"
                                    style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', fontWeight: 600, color: '#EF4444', borderColor: '#FCA5A5', display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}
                                    onClick={() => handleDeleteEvaluation(r.evaluation_id)}
                                    title="Xóa phiếu đánh giá"
                                >
                                    <Trash2 size={14} />
                                    <span>Xóa</span>
                                </button>
                            )
                        }
                    ]}
                    data={safeEvaluations}
                />
            )}

            {/* 3. ĐỀ XUẤT KHEN THƯỞNG / KỶ LUẬT */}
            {activeSubTab === 'Đề xuất khen thưởng/kỷ luật' && (
                <DataTable
                    loading={loading}
                    addLabel="Lập Phiếu Đề xuất Khen thưởng / Kỷ luật"
                    onAdd={() => {
                        setFormData({
                            record_type: 'KHEN_THUONG',
                            employee_id: safeEmployees[0]?.employee_id || '',
                            proposed_amount: 5000000,
                            proposed_by: 'Bùi Xuân Thức - Giám Đốc Khối'
                        });
                        setModalType('add_proposal');
                    }}
                    searchPlaceholder="Tìm mã phiếu đề xuất, tên nhân viên..."
                    columns={[
                        { header: 'Mã Phiếu Đề xuất', accessor: 'proposal_code', render: (r) => <b>{r.proposal_code}</b> },
                        { header: 'Loại hình đề xuất', accessor: 'record_type', render: (r) => <StatusChip status={r.record_type} /> },
                        { header: 'Nhân viên đề xuất', accessor: 'employee_name', render: (r) => <span style={{ fontWeight: 700 }}>{r.employee_name} ({r.employee_code})</span> },
                        { header: 'Bộ phận & Vị trí', render: (r) => `${r.department_name || '—'} - ${r.position_name || '—'}` },
                        { header: 'Số tiền đề xuất (VNĐ)', accessor: 'proposed_amount', render: (r) => <b style={{ color: '#059669' }}>{Number(r.proposed_amount).toLocaleString('vi-VN')} VNĐ</b> },
                        { header: 'Lý do & Nội dung đề xuất', accessor: 'reason', render: (r) => <span style={{ fontWeight: 600, color: 'var(--bravo-teal-dark)' }}>{r.reason}</span> },
                        { header: 'Người đề xuất', accessor: 'proposed_by' },
                        { header: 'Trạng thái', accessor: 'status', render: (r) => <span className="badge badge-yellow">Chờ phê duyệt ban hành QĐ</span> },
                        {
                            header: 'Thao tác',
                            render: (r) => (
                                <button
                                    className="btn btn-secondary"
                                    style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', fontWeight: 600, color: '#EF4444', borderColor: '#FCA5A5', display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}
                                    onClick={() => handleDeleteProposal(r.proposal_id)}
                                    title="Xóa đề xuất"
                                >
                                    <Trash2 size={14} />
                                    <span>Xóa</span>
                                </button>
                            )
                        }
                    ]}
                    data={safeProposals}
                />
            )}

            {/* 4. QUYẾT ĐỊNH KHEN THƯỞNG KỶ LUẬT */}
            {(activeSubTab === 'Quyết định khen thưởng kỷ luật' || activeSubTab === 'Danh sách quyết định') && (
                <DataTable
                    loading={loading}
                    addLabel="Ban hành Quyết định Mới"
                    onAdd={() => {
                        setFormData({
                            employee_id: safeEmployees[0]?.employee_id || '',
                            decision_type: 'KHEN_THUONG',
                            category: 'CÁ NHÂN XUẤT SẮC',
                            amount: 5000000,
                            decision_by: 'Bùi Xuân Thức - Tổng Giám Đốc'
                        });
                        setModalType('add_decision');
                    }}
                    searchPlaceholder="Tìm số quyết định, tên nhân viên..."
                    columns={[
                        { header: 'Số Quyết định', accessor: 'decision_no', render: (r) => <b>{r.decision_no || r.decision_number}</b> },
                        { header: 'Loại quyết định', accessor: 'decision_type', render: (r) => <StatusChip status={r.decision_type} /> },
                        { header: 'Nhân viên thụ hưởng', accessor: 'employee_name', render: (r) => <span style={{ fontWeight: 700 }}>{r.employee_name} ({r.employee_code})</span> },
                        { header: 'Bộ phận & Vị trí', render: (r) => `${r.department_name || '—'} - ${r.position_name || '—'}` },
                        { header: 'Lý do / Nội dung', accessor: 'reason', render: (r) => <span style={{ fontWeight: 600, color: 'var(--bravo-teal-dark)' }}>{r.reason}</span> },
                        { header: 'Ngày ban hành', render: (r) => r.decision_date ? new Date(r.decision_date).toLocaleDateString('vi-VN') : '—' },
                        { header: 'Người ký ban hành', accessor: 'decision_by' },
                        {
                            header: 'Thao tác',
                            render: (r) => (
                                <button
                                    className="btn btn-secondary"
                                    style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', fontWeight: 600, color: '#EF4444', borderColor: '#FCA5A5', display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}
                                    onClick={() => handleDeleteDecision(r.reward_discipline_id)}
                                    title="Xóa quyết định"
                                >
                                    <Trash2 size={14} />
                                    <span>Xóa</span>
                                </button>
                            )
                        }
                    ]}
                    data={safeRecords}
                />
            )}

            {/* 5. TRA CỨU LỊCH SỬ KHEN THƯỞNG, KỶ LUẬT & ĐÁNH GIÁ */}
            {activeSubTab === 'Tra cứu lịch sử' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="card" style={{ backgroundColor: '#FFFFFF' }}>
                        <label className="form-label" style={{ fontWeight: 700 }}>Chọn nhân viên tra cứu tổng hợp:</label>
                        <select
                            className="form-select"
                            style={{ maxWidth: '450px' }}
                            value={selectedEmpId}
                            onChange={(e) => setSelectedEmpId(e.target.value)}
                        >
                            <option value="">-- Tất cả nhân viên toàn hệ thống --</option>
                            {safeEmployees.map((e) => (
                                <option key={e.employee_id} value={e.employee_id}>
                                    {e.employee_code} - {e.full_name} ({e.department_name})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                        {/* Left Box: Evaluation tickets history */}
                        <div className="card">
                            <h4 style={{ fontSize: '0.95rem', color: '#0F172A', marginBottom: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Star size={18} color="var(--bravo-teal)" />
                                <span>Lịch sử Phiếu Đánh giá Nhân viên ({filteredEvaluations.length})</span>
                            </h4>
                            {filteredEvaluations.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {filteredEvaluations.map((ev, idx) => (
                                        <div key={idx} style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.825rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                                <b>{ev.evaluation_code}</b>
                                                <span style={{ color: 'var(--bravo-teal-dark)', fontWeight: 700 }}>{ev.grade_result} ({ev.total_score} điểm)</span>
                                            </div>
                                            <div>Nhân viên: <b>{ev.employee_name}</b> • Người đánh giá: {ev.evaluator_name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.2rem' }}>
                                                Ngày lập: {ev.evaluation_date ? new Date(ev.evaluation_date).toLocaleDateString('vi-VN') : '—'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ color: '#94A3B8', fontSize: '0.85rem', textAlign: 'center', padding: '1.5rem' }}>Chưa có phiếu đánh giá.</div>
                            )}
                        </div>

                        {/* Right Box: Reward & Discipline Decisions history */}
                        <div className="card">
                            <h4 style={{ fontSize: '0.95rem', color: '#0F172A', marginBottom: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Award size={18} color="#059669" />
                                <span>Lịch sử Quyết định Khen thưởng / Kỷ luật ({filteredRecords.length})</span>
                            </h4>
                            {filteredRecords.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {filteredRecords.map((rd, idx) => (
                                        <div key={idx} style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.825rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                                <b>{rd.decision_no || rd.decision_number}</b>
                                                <StatusChip status={rd.decision_type} />
                                            </div>
                                            <div>Nhân viên: <b>{rd.employee_name}</b></div>
                                            <div style={{ color: '#0F172A', fontWeight: 600, marginTop: '0.2rem' }}>{rd.reason}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ color: '#94A3B8', fontSize: '0.85rem', textAlign: 'center', padding: '1.5rem' }}>Chưa có lịch sử quyết định.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* FORM MODALS                                          */}
            {/* ---------------------------------------------------- */}

            {/* MODAL 1: THÊM DANH MỤC TIÊU CHÍ ĐÁNH GIÁ (KÈM BẢNG THANG ĐIỂM CHI TIẾT) */}
            <Modal
                isOpen={modalType === 'add_criteria'}
                onClose={() => setModalType(null)}
                title="Thêm Danh mục Tiêu chí Đánh giá Nhân viên"
                maxWidth="680px"
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setModalType(null)}>Hủy</button>
                        <button className="btn btn-primary" onClick={handleCreateCriteria}>Lưu Tiêu chí</button>
                    </>
                }
            >
                <form onSubmit={handleCreateCriteria}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Mã tiêu chí (*)</label>
                                <input type="text" className="form-input" required defaultValue={formData.criteria_code} onChange={(e) => setFormData({ ...formData, criteria_code: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Tên Tiêu chí (*)</label>
                                <input type="text" className="form-input" required placeholder="VD: Kết quả hoàn thành chỉ tiêu KPI" onChange={(e) => setFormData({ ...formData, criteria_name: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Trọng số (%) (*)</label>
                                <input type="number" className="form-input" required defaultValue={25} onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Diễn giải nội dung tiêu chí</label>
                            <textarea className="form-textarea" rows={2} placeholder="Mô tả tiêu chí đánh giá..." onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                        </div>

                        {/* TAB CHI TIẾT THANG ĐIỂM THEO TIÊU CHÍ */}
                        <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.75rem' }}>
                                📊 Tab Chi tiết Thang điểm theo Tiêu chí (Scale Ratings)
                            </h4>
                            <table className="erp-table">
                                <thead>
                                    <tr>
                                        <th>Xếp loại</th>
                                        <th style={{ width: '90px' }}>Điểm từ (&gt;=)</th>
                                        <th style={{ width: '90px' }}>Điểm đến (&lt;)</th>
                                        <th>Diễn giải chi tiết</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {scaleRows.map((row, idx) => (
                                        <tr key={idx}>
                                            <td>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                                                    value={row.grade_name}
                                                    onChange={(e) => {
                                                        const newRows = [...scaleRows];
                                                        newRows[idx].grade_name = e.target.value;
                                                        setScaleRows(newRows);
                                                    }}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    step="0.5"
                                                    className="form-input"
                                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                                                    value={row.min_score}
                                                    onChange={(e) => {
                                                        const newRows = [...scaleRows];
                                                        newRows[idx].min_score = parseFloat(e.target.value);
                                                        setScaleRows(newRows);
                                                    }}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    step="0.5"
                                                    className="form-input"
                                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                                                    value={row.max_score}
                                                    onChange={(e) => {
                                                        const newRows = [...scaleRows];
                                                        newRows[idx].max_score = parseFloat(e.target.value);
                                                        setScaleRows(newRows);
                                                    }}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                                                    value={row.description}
                                                    onChange={(e) => {
                                                        const newRows = [...scaleRows];
                                                        newRows[idx].description = e.target.value;
                                                        setScaleRows(newRows);
                                                    }}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* MODAL 2: LẬP PHIẾU ĐÁNH GIÁ NHÂN VIÊN (KÈM TAB CHI TIẾT CHỌN NHIỀU TIÊU CHÍ) */}
            <Modal
                isOpen={modalType === 'add_eval'}
                onClose={() => setModalType(null)}
                title="Lập Phiếu Đánh giá Nhân viên"
                maxWidth="750px"
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setModalType(null)}>Hủy</button>
                        <button className="btn btn-primary" onClick={handleCreateEvaluation}>Lưu Phiếu Đánh giá</button>
                    </>
                }
            >
                <form onSubmit={handleCreateEvaluation}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Người đánh giá (*)</label>
                                <select className="form-select" onChange={(e) => setFormData({ ...formData, evaluator_id: e.target.value })}>
                                    {safeEmployees.map((e) => (
                                        <option key={e.employee_id} value={e.employee_id}>{e.employee_code} - {e.full_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Nhân viên được đánh giá (*)</label>
                                <select className="form-select" onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}>
                                    {safeEmployees.map((e) => (
                                        <option key={e.employee_id} value={e.employee_id}>{e.employee_code} - {e.full_name} ({e.department_name})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Năm đánh giá (*)</label>
                                <input type="number" className="form-input" defaultValue={2026} onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Diễn giải / Đánh giá nhận xét chung</label>
                            <textarea className="form-textarea" rows={2} placeholder="Nhận xét tổng quan..." onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                        </div>

                        {/* TAB CHI TIẾT CHỌN NHIỀU TIÊU CHÍ ĐÁNH GIÁ */}
                        <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0F172A' }}>
                                    📝 Tab Chi tiết Tiêu chí Đánh giá ({evalDetailRows.length} tiêu chí)
                                </h4>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                                    onClick={() => {
                                        setEvalDetailRows([...evalDetailRows, {
                                            criteria_id: safeCriteria[0]?.criteria_id || 'tc-new',
                                            criteria_code: 'TC-0' + (evalDetailRows.length + 1),
                                            criteria_name: 'Tiêu chí bổ sung',
                                            weight: 20,
                                            score: 8.0,
                                            note: ''
                                        }]);
                                    }}
                                >
                                    <Plus size={14} />
                                    <span>Thêm tiêu chí</span>
                                </button>
                            </div>

                            <table className="erp-table">
                                <thead>
                                    <tr>
                                        <th>Mã tiêu chí</th>
                                        <th>Tên Tiêu chí Đánh giá</th>
                                        <th style={{ width: '80px' }}>Trọng số (%)</th>
                                        <th style={{ width: '100px' }}>Điểm (0-10)</th>
                                        <th>Ghi chú</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {evalDetailRows.map((row, idx) => (
                                        <tr key={idx}>
                                            <td><b>{row.criteria_code}</b></td>
                                            <td>{row.criteria_name}</td>
                                            <td>
                                                <input
                                                    type="number"
                                                    className="form-input"
                                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                                                    value={row.weight}
                                                    onChange={(e) => {
                                                        const newRows = [...evalDetailRows];
                                                        newRows[idx].weight = parseFloat(e.target.value);
                                                        setEvalDetailRows(newRows);
                                                    }}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    step="0.5"
                                                    min="0"
                                                    max="10"
                                                    className="form-input"
                                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--bravo-teal-dark)' }}
                                                    value={row.score}
                                                    onChange={(e) => {
                                                        const newRows = [...evalDetailRows];
                                                        newRows[idx].score = parseFloat(e.target.value);
                                                        setEvalDetailRows(newRows);
                                                    }}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                                                    value={row.note}
                                                    onChange={(e) => {
                                                        const newRows = [...evalDetailRows];
                                                        newRows[idx].note = e.target.value;
                                                        setEvalDetailRows(newRows);
                                                    }}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* MODAL 3: LẬP PHIẾU ĐỀ XUẤT KHEN THƯỞNG / KỶ LUẬT */}
            <Modal
                isOpen={modalType === 'add_proposal'}
                onClose={() => setModalType(null)}
                title="Lập Phiếu Đề xuất Khen thưởng / Kỷ luật"
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setModalType(null)}>Hủy</button>
                        <button className="btn btn-primary" onClick={handleCreateProposal}>Lưu Phiếu Đề xuất</button>
                    </>
                }
            >
                <form onSubmit={handleCreateProposal}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label">Phân loại Đề xuất (*)</label>
                            <select className="form-select" onChange={(e) => setFormData({ ...formData, record_type: e.target.value })}>
                                <option value="KHEN_THUONG">Đề xuất Khen thưởng cá nhân / dự án</option>
                                <option value="KY_LUAT">Đề xuất Kỷ luật / Khiển trách</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Nhân viên được đề xuất (*)</label>
                            <select className="form-select" onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}>
                                {safeEmployees.map((e) => (
                                    <option key={e.employee_id} value={e.employee_id}>{e.employee_code} - {e.full_name} ({e.department_name})</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Mức tiền đề xuất (VNĐ)</label>
                            <input type="number" className="form-input" defaultValue={5000000} onChange={(e) => setFormData({ ...formData, proposed_amount: parseFloat(e.target.value) })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Người lập đề xuất</label>
                            <input type="text" className="form-input" defaultValue="Bùi Xuân Thức - Giám Đốc Khối" onChange={(e) => setFormData({ ...formData, proposed_by: e.target.value })} />
                        </div>
                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label className="form-label">Lý do & Nội dung đề xuất khen thưởng / kỷ luật (*)</label>
                            <textarea className="form-textarea" rows={3} placeholder="Nêu rõ thành tích đề xuất khen thưởng hoặc hành vi vi phạm đề xuất kỷ luật..." required onChange={(e) => setFormData({ ...formData, reason: e.target.value })}></textarea>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* MODAL 4: BAN HÀNH QUYẾT ĐỊNH KHEN THƯỞNG / KỶ LUẬT CHÍNH THỨC */}
            <Modal
                isOpen={modalType === 'add_decision'}
                onClose={() => setModalType(null)}
                title="Ban hành Quyết định Khen thưởng / Kỷ luật chính thức"
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setModalType(null)}>Hủy</button>
                        <button className="btn btn-primary" onClick={handleCreateDecision}>Ban hành Quyết định</button>
                    </>
                }
            >
                <form onSubmit={handleCreateDecision}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label">Phân loại Quyết định (*)</label>
                            <select className="form-select" onChange={(e) => setFormData({ ...formData, decision_type: e.target.value })}>
                                <option value="KHEN_THUONG">Quyết định Khen thưởng</option>
                                <option value="KY_LUAT">Quyết định Kỷ luật</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Nhân viên thụ hưởng (*)</label>
                            <select className="form-select" onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}>
                                {safeEmployees.map((e) => (
                                    <option key={e.employee_id} value={e.employee_id}>{e.employee_code} - {e.full_name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label className="form-label">Nội dung Quyết định (*)</label>
                            <textarea className="form-textarea" rows={3} placeholder="Nội dung quyết định..." required onChange={(e) => setFormData({ ...formData, reason: e.target.value })}></textarea>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Người ký ban hành</label>
                            <input type="text" className="form-input" defaultValue="Bùi Xuân Thức - Tổng Giám Đốc" onChange={(e) => setFormData({ ...formData, decision_by: e.target.value })} />
                        </div>
                    </div>
                </form>
            </Modal>

            {/* MODAL 5: XEM CHI TIẾT PHIẾU ĐÁNH GIÁ */}
            {modalType === 'detail_eval' && selectedEval && (
                <Modal
                    isOpen={true}
                    onClose={() => setModalType(null)}
                    title={`Chi tiết Phiếu Đánh giá Nhân viên: ${selectedEval.evaluation_code}`}
                    maxWidth="680px"
                    footer={<button className="btn btn-secondary" onClick={() => setModalType(null)}>Đóng</button>}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.85rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                <div><b>Nhân viên:</b> {selectedEval.employee_name} ({selectedEval.employee_code})</div>
                                <div><b>Người đánh giá:</b> {selectedEval.evaluator_name}</div>
                                <div><b>Bộ phận:</b> {selectedEval.department_name}</div>
                                <div><b>Điểm tổng hợp:</b> <b style={{ color: 'var(--bravo-teal-dark)', fontSize: '1rem' }}>{selectedEval.total_score} điểm</b></div>
                                <div><b>Xếp loại kết quả:</b> <span className="badge badge-green">{selectedEval.grade_result}</span></div>
                            </div>
                        </div>

                        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A' }}>Danh sách Chi tiết các Tiêu chí Đánh giá:</h4>
                        <table className="erp-table">
                            <thead>
                                <tr>
                                    <th>Mã tiêu chí</th>
                                    <th>Tên tiêu chí</th>
                                    <th>Trọng số</th>
                                    <th>Điểm số</th>
                                    <th>Ghi chú</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedEval.details?.map((d, idx) => (
                                    <tr key={idx}>
                                        <td><b>{d.criteria_code}</b></td>
                                        <td>{d.criteria_name}</td>
                                        <td>{d.weight}%</td>
                                        <td><b style={{ color: 'var(--bravo-teal-dark)' }}>{d.score} điểm</b></td>
                                        <td>{d.note || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Modal>
            )}
        </div>
    );
};