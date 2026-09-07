import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { StatusChip } from '../components/StatusChip';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import {
    ClipboardList,
    UserPlus,
    Calendar,
    Award,
    CheckCircle2,
    XCircle,
    FileText,
    UserCheck,
    Sparkles,
    Eye,
    Edit,
    Building2,
    Users,
    AlertTriangle,
    Trash2,
    Edit3,
    X,
    Save,
    ArrowLeft,
    Filter,
    Plus
} from 'lucide-react';

export const RecruitmentModule = ({ activeSubTab }) => {
    const { user, hasPermission } = useAuth();
    const { addToast } = useNotification();

    // Data states
    const [requests, setRequests] = useState([]);
    const [plans, setPlans] = useState([]);
    const [rounds, setRounds] = useState([]);
    const [candidates, setCandidates] = useState([]);
    const [preScreenings, setPreScreenings] = useState([]);
    const [psCriteriaRows, setPsCriteriaRows] = useState([]);
    const [interviewEvaluations, setInterviewEvaluations] = useState([]);
    const [ievScriptRows, setIevScriptRows] = useState([]);
    const [ievCriteriaRows, setIevCriteriaRows] = useState([]);
    const [interviews, setInterviews] = useState([]);
    const [offers, setOffers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [positions, setPositions] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);

    // Modals
    const [modalType, setModalType] = useState(null); // 'req' | 'plan' | 'cand' | 'cand_detail' | 'interview' | 'offer'
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [formData, setFormData] = useState({});

    // --- States for Định biên nhân sự (Headcount Quota Management) ---
    const [quotas, setQuotas] = useState([]);
    const [filterQuotaDept, setFilterQuotaDept] = useState('ALL');
    const [filterQuotaStatus, setFilterQuotaStatus] = useState('ALL');
    const [selectedQuota, setSelectedQuota] = useState(null);
    const [isEditingQuota, setIsEditingQuota] = useState(false);
    const [editQuotaData, setEditQuotaData] = useState({});
    const [quotaDetails, setQuotaDetails] = useState([]);
    const [createQuotaDetails, setCreateQuotaDetails] = useState([]);
    const [quotaFormErrors, setQuotaFormErrors] = useState({});
    const [deleteQuotaConfirmModal, setDeleteQuotaConfirmModal] = useState(false);

    // --- States for Yêu cầu tuyển dụng (Recruitment Request Management) ---
    const [isEditingRequest, setIsEditingRequest] = useState(false);
    const [requestFormData, setRequestFormData] = useState({
        request_id: null,
        request_date: new Date().toISOString().split('T')[0],
        request_code: '',
        is_outside_headcount: 0,
        requested_by: '',
        department_id: '',
        department_name: '',
        reason: '',
        internal_note: '',
        priority: 'MEDIUM',
        status: 'PENDING'
    });
    const [requestPositionDetails, setRequestPositionDetails] = useState([]);

    // --- States for Lịch phỏng vấn & Thi tuyển ---
    const [interviewSchedules, setInterviewSchedules] = useState([]);
    const [isEditingSchedule, setIsEditingSchedule] = useState(false);
    const [scheduleModalTab, setScheduleModalTab] = useState('candidates'); // 'candidates' | 'council' | 'tests'
    const [scheduleFormData, setScheduleFormData] = useState({
        schedule_id: null,
        created_date: new Date().toISOString().split('T')[0],
        schedule_code: '',
        round_type: 'Vòng phỏng vấn',
        format_type: 'Offline',
        location: '',
        start_time: '',
        end_time: '',
        note: '',
        candidate_note: '',
        status: 'Đã lên lịch'
    });
    const [scheduleCandidates, setScheduleCandidates] = useState([]);
    const [scheduleCouncil, setScheduleCouncil] = useState([]);
    const [scheduleTests, setScheduleTests] = useState([]);

    // Offer Form State
    const [offerFormData, setOfferFormData] = useState({
        isEdit: false,
        offer_id: null,
        candidate_id: '',
        candidate_code: '',
        candidate_name: '',
        department_name: '',
        position_name: '',
        offer_date: new Date().toISOString().split('T')[0],
        expected_start_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        probation_salary: 16000000,
        official_salary: 18000000,
        note: '',
        offer_status: 'Đã phát hành'
    });

    // Budget details breakdown state for Quota section 3
    const [budgetDetails, setBudgetDetails] = useState([
        { id: 'b-1', cost_type: 'Chi phí đăng tin tuyển dụng trang việc làm', source: 'TopCV', estimated_cost: 5000000 },
        { id: 'b-2', cost_type: 'Chi phí giới thiệu nhân sự nội bộ', source: 'Bạn bè giới thiệu', estimated_cost: 3000000 }
    ]);

    const handleAddBudgetDetailRow = () => {
        setBudgetDetails(prev => [
            ...prev,
            { id: 'b-' + Date.now(), cost_type: '', source: 'TopCV', estimated_cost: 0 }
        ]);
    };

    const handleRemoveBudgetDetailRow = (index) => {
        setBudgetDetails(prev => {
            const updated = prev.filter((_, idx) => idx !== index);
            const total = updated.reduce((sum, item) => sum + (Number(item.estimated_cost) || 0), 0);
            setEditQuotaData(q => ({ ...q, budget: total }));
            return updated;
        });
    };

    const handleBudgetDetailChange = (index, field, value) => {
        setBudgetDetails(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            const total = updated.reduce((sum, item) => sum + (Number(item.estimated_cost) || 0), 0);
            setEditQuotaData(q => ({ ...q, budget: total }));
            return updated;
        });
    };

    // Budget details breakdown state for Create Quota Modal
    const [createBudgetDetails, setCreateBudgetDetails] = useState([
        { id: 'cb-1', cost_type: 'Chi phí đăng tin tuyển dụng trang việc làm', source: 'TopCV', estimated_cost: 5000000 },
        { id: 'cb-2', cost_type: 'Chi phí giới thiệu nhân sự nội bộ', source: 'Bạn bè giới thiệu', estimated_cost: 3000000 }
    ]);

    const handleAddCreateBudgetDetailRow = () => {
        setCreateBudgetDetails(prev => [
            ...prev,
            { id: 'cb-' + Date.now(), cost_type: '', source: 'TopCV', estimated_cost: 0 }
        ]);
    };

    const handleRemoveCreateBudgetDetailRow = (index) => {
        setCreateBudgetDetails(prev => {
            const updated = prev.filter((_, idx) => idx !== index);
            const total = updated.reduce((sum, item) => sum + (Number(item.estimated_cost) || 0), 0);
            setCreateQuotaData(q => ({ ...q, budget: total }));
            return updated;
        });
    };

    const handleCreateBudgetDetailChange = (index, field, value) => {
        setCreateBudgetDetails(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            const total = updated.reduce((sum, item) => sum + (Number(item.estimated_cost) || 0), 0);
            setCreateQuotaData(q => ({ ...q, budget: total }));
            return updated;
        });
    };

    // --- CANDIDATE FORM & TAB STATES ---
    const [activeCandTab, setActiveCandTab] = useState('info'); // 'info' | 'recruitment' | 'attachments'

    const [candidateFormData, setCandidateFormData] = useState({
        isEdit: false,
        candidate_id: null,
        candidate_code: '',
        full_name: '',
        citizen_id: '',
        date_of_birth: '',
        gender: 'Nam',
        phone: '',
        email: '',
        address: '',
        culture_level: 'Đại học',
        education_level: 'Cử nhân',
        education_school: '',
        major: '',
        source: 'TopCV',
        referrer: '',
        experience: '',
        status: 'Đã tiếp nhận hồ sơ',
        received_date: new Date().toISOString().split('T')[0],
        recruitment_plan_id: '',
        position_id: '',
        attachments_json: []
    });

    const [createQuotaData, setCreateQuotaData] = useState({
        effective_date: new Date().toISOString().split('T')[0],
        quota_code: '',
        department_id: '',
        creator_name: user?.full_name || 'HR Test 01',
        target_headcount: 0,
        max_capacity: 10,
        budget: 100000000,
        description: '',
        status: 'Tạo phiếu'
    });
    const [createQuotaErrors, setCreateQuotaErrors] = useState({});
    const [isSubmittingQuota, setIsSubmittingQuota] = useState(false);

    useEffect(() => {
        fetchData();
    }, [activeSubTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            let resDept = await api.get('/admin/departments');
            if (!resDept.success || !Array.isArray(resDept.data) || resDept.data.length === 0) {
                resDept = await api.get('/hr/departments');
            }
            const resPos = await api.get('/admin/positions');
            const resEmp = await api.get('/hr/employees');
            const resQuota = await api.get('/hr/quotas');

            if (resDept.success && Array.isArray(resDept.data)) setDepartments(resDept.data);
            if (resPos.success && Array.isArray(resPos.data)) setPositions(resPos.data);
            if (resEmp.success && Array.isArray(resEmp.data)) setEmployees(resEmp.data);
            if (resQuota.success && Array.isArray(resQuota.data)) setQuotas(resQuota.data);

            if (!activeSubTab || activeSubTab === 'Định biên nhân sự') {
                const res = await api.get('/hr/quotas');
                if (res.success && Array.isArray(res.data)) setQuotas(res.data);
            } else if (activeSubTab === 'Yêu cầu tuyển dụng') {
                const res = await api.get('/recruitment/requests');
                if (res.success) setRequests(res.data);
            } else if (activeSubTab === 'Kế hoạch tuyển dụng') {
                const res = await api.get('/recruitment/plans');
                if (res.success) setPlans(res.data);
            } else if (activeSubTab === 'Hồ sơ ứng viên' || activeSubTab === 'Chuyển thành nhân viên') {
                const res = await api.get('/recruitment/candidates');
                const resPlan = await api.get('/recruitment/plans');
                if (res.success) setCandidates(res.data);
                if (resPlan.success) setPlans(resPlan.data);
            } else if (activeSubTab === 'Sơ loại') {
                const res = await api.get('/recruitment/pre-screenings');
                const resCand = await api.get('/recruitment/candidates');
                if (res.success && Array.isArray(res.data)) setPreScreenings(res.data);
                if (resCand.success && Array.isArray(resCand.data)) setCandidates(resCand.data);
            } else if (activeSubTab === 'Lịch Phỏng vấn') {
                const resSch = await api.get('/recruitment/interview-schedules');
                const resInt = await api.get('/recruitment/interviews');
                const resCand = await api.get('/recruitment/candidates');
                if (resSch.success && Array.isArray(resSch.data)) setInterviewSchedules(resSch.data);
                if (resInt.success && Array.isArray(resInt.data)) setInterviews(resInt.data);
                if (resCand.success && Array.isArray(resCand.data)) setCandidates(resCand.data);
            } else if (activeSubTab === 'Đánh giá phỏng vấn') {
                const res = await api.get('/recruitment/interview-evaluations');
                const resSch = await api.get('/recruitment/interview-schedules');
                const resCand = await api.get('/recruitment/candidates');
                if (res.success && Array.isArray(res.data)) setInterviewEvaluations(res.data);
                if (resSch.success && Array.isArray(resSch.data)) setInterviewSchedules(resSch.data);
                if (resCand.success && Array.isArray(resCand.data)) setCandidates(resCand.data);
            } else if (activeSubTab === 'Offer') {
                const res = await api.get('/recruitment/offers');
                if (res.success) setOffers(res.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Combine master departments & unique departments from quota data for dropdowns
    const availableDepartments = React.useMemo(() => {
        const map = new Map();
        if (Array.isArray(departments)) {
            departments.forEach(d => {
                if (d && d.department_id) {
                    map.set(d.department_id, d.department_name || d.department_id);
                }
            });
        }
        if (Array.isArray(quotas)) {
            quotas.forEach(q => {
                if (q && q.department_id && !map.has(q.department_id)) {
                    map.set(q.department_id, q.department_name || q.department_id);
                }
            });
        }
        return Array.from(map.entries()).map(([id, name]) => ({
            department_id: id,
            department_name: name
        }));
    }, [departments, quotas]);

    // --- QUOTA MASTER-DETAIL HANDLERS ---
    const handleViewQuotaDetail = async (quotaId) => {
        try {
            const res = await api.get(`/hr/quotas/${quotaId}`);
            if (res.success && res.data) {
                const qData = res.data;
                setSelectedQuota(qData);
                setEditQuotaData({
                    ...qData,
                    effective_date: qData.effective_date ? new Date(qData.effective_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
                });
                setQuotaDetails(Array.isArray(qData.details) ? qData.details : []);
                if (qData.budget_details) {
                    try {
                        const parsed = typeof qData.budget_details === 'string' ? JSON.parse(qData.budget_details) : qData.budget_details;
                        if (Array.isArray(parsed) && parsed.length > 0) setBudgetDetails(parsed);
                    } catch (e) { }
                }
                setIsEditingQuota(false);
                setQuotaFormErrors({});
            } else {
                const fallback = quotas.find(item => item.quota_id === quotaId || item.id === quotaId);
                if (fallback) {
                    setSelectedQuota(fallback);
                    setEditQuotaData({
                        ...fallback,
                        effective_date: fallback.effective_date ? new Date(fallback.effective_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
                    });
                    setQuotaDetails([]);
                    setIsEditingQuota(false);
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleOpenCreateQuotaModal = async () => {
        const firstDept = departments[0]?.department_id || 'dept-hr';
        const today = new Date().toISOString().split('T')[0];

        try {
            const resCode = await api.get(`/hr/quotas/next-code?date=${today}`);
            const code = resCode.success && resCode.code ? resCode.code : `ĐB/${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getFullYear()).slice(-2)}-0001`;
            const empCount = employees.filter(e => e.department_id === firstDept && (e.is_active === 1 || e.employment_status === 'WORKING')).length;

            // Auto generate initial detail rows for selected department
            const deptPositions = positions.filter(p => p.department_id === firstDept);
            const initialDetails = deptPositions.map(p => {
                const currCount = employees.filter(e => e.department_id === firstDept && e.position_id === p.position_id && (e.is_active === 1 || e.employment_status === 'WORKING')).length;
                const target = p.target_headcount || 1;
                return {
                    detail_id: 'temp-' + crypto.randomUUID(),
                    position_id: p.position_id,
                    position_code: p.position_code,
                    position_name: p.position_name,
                    target_headcount: target,
                    resignation_count: 0,
                    maternity_count: 0,
                    current_headcount: currCount,
                    needed_headcount: Math.max(0, target - currCount),
                    note: ''
                };
            });

            const totalTarget = initialDetails.reduce((sum, d) => sum + d.target_headcount, 0);

            setCreateQuotaData({
                effective_date: today,
                quota_code: code,
                department_id: firstDept,
                creator_name: user?.full_name || 'HR Test 01',
                target_headcount: totalTarget || 10,
                max_capacity: (totalTarget || 10) + 5,
                current_headcount: empCount,
                budget: 150000000,
                description: '',
                status: 'Tạo phiếu'
            });
            setCreateQuotaDetails(initialDetails);
            setCreateQuotaErrors({});
            setIsSubmittingQuota(false);
            setModalType('quota');
        } catch (err) {
            console.error(err);
        }
    };

    const handleDepartmentChangeForCreateQuota = (deptId) => {
        const count = employees.filter(emp => emp.department_id === deptId && (emp.is_active === 1 || emp.employment_status === 'WORKING')).length;
        const deptPositions = positions.filter(p => p.department_id === deptId);
        const initialDetails = deptPositions.map(p => {
            const currCount = employees.filter(e => e.department_id === deptId && e.position_id === p.position_id && (e.is_active === 1 || e.employment_status === 'WORKING')).length;
            const target = p.target_headcount || 1;
            return {
                detail_id: 'temp-' + crypto.randomUUID(),
                position_id: p.position_id,
                position_code: p.position_code,
                position_name: p.position_name,
                target_headcount: target,
                resignation_count: 0,
                maternity_count: 0,
                current_headcount: currCount,
                needed_headcount: Math.max(0, target - currCount),
                note: ''
            };
        });

        const totalTarget = initialDetails.reduce((sum, d) => sum + d.target_headcount, 0);

        setCreateQuotaData(prev => ({
            ...prev,
            department_id: deptId,
            current_headcount: count,
            target_headcount: totalTarget,
            max_capacity: totalTarget + 5
        }));
        setCreateQuotaDetails(initialDetails);
    };

    const handleCreateQuotaDetailChange = (index, field, value) => {
        const updated = [...createQuotaDetails];
        const item = { ...updated[index], [field]: value };

        if (field === 'position_id') {
            const pos = positions.find(p => p.position_id === value);
            if (pos) {
                item.position_code = pos.position_code;
                item.position_name = pos.position_name;
                item.current_headcount = employees.filter(e => e.department_id === createQuotaData.department_id && e.position_id === pos.position_id && (e.is_active === 1 || e.employment_status === 'WORKING')).length;
            }
        }

        const target = Number(item.target_headcount) || 0;
        const curr = Number(item.current_headcount) || 0;
        const resign = Number(item.resignation_count) || 0;
        const mat = Number(item.maternity_count) || 0;
        item.needed_headcount = Math.max(0, target - curr + resign + mat);

        updated[index] = item;
        setCreateQuotaDetails(updated);

        const totalTarget = updated.reduce((sum, d) => sum + (Number(d.target_headcount) || 0), 0);
        setCreateQuotaData(prev => ({ ...prev, target_headcount: totalTarget }));
    };

    const handleAddCreateQuotaDetailRow = () => {
        const pos = positions.find(p => !createQuotaData.department_id || p.department_id === createQuotaData.department_id) || positions[0];
        const currCount = pos ? employees.filter(e => e.department_id === createQuotaData.department_id && e.position_id === pos.position_id && (e.is_active === 1 || e.employment_status === 'WORKING')).length : 0;

        const newRow = {
            detail_id: 'temp-' + Date.now(),
            position_id: pos ? pos.position_id : '',
            position_code: pos ? pos.position_code : '',
            position_name: pos ? pos.position_name : '',
            target_headcount: 1,
            resignation_count: 0,
            maternity_count: 0,
            current_headcount: currCount,
            needed_headcount: Math.max(0, 1 - currCount),
            note: ''
        };
        const updated = [...createQuotaDetails, newRow];
        setCreateQuotaDetails(updated);

        const totalTarget = updated.reduce((sum, d) => sum + (Number(d.target_headcount) || 0), 0);
        setCreateQuotaData(prev => ({ ...prev, target_headcount: totalTarget }));
    };

    const handleRemoveCreateQuotaDetailRow = (index) => {
        const updated = createQuotaDetails.filter((_, idx) => idx !== index);
        setCreateQuotaDetails(updated);

        const totalTarget = updated.reduce((sum, d) => sum + (Number(d.target_headcount) || 0), 0);
        setCreateQuotaData(prev => ({ ...prev, target_headcount: totalTarget }));
    };

    const handleCreateQuotaSubmit = async (e) => {
        if (e) e.preventDefault();

        const errors = {};
        if (!createQuotaData.effective_date) errors.effective_date = 'Vui lòng chọn Ngày áp dụng.';
        if (!createQuotaData.department_id) errors.department_id = 'Vui lòng chọn Bộ phận / Phòng ban.';

        if (Object.keys(errors).length > 0) {
            setCreateQuotaErrors(errors);
            addToast('Vui lòng kiểm tra lại thông tin bắt buộc.', 'error');
            return;
        }

        setIsSubmittingQuota(true);
        try {
            const totalTarget = createQuotaDetails.reduce((sum, d) => sum + (Number(d.target_headcount) || 0), 0);
            const calculatedBudget = createBudgetDetails.reduce((sum, b) => sum + (Number(b.estimated_cost) || 0), 0);
            const payload = {
                effective_date: createQuotaData.effective_date,
                department_id: createQuotaData.department_id,
                creator_name: createQuotaData.creator_name,
                target_headcount: totalTarget || Number(createQuotaData.target_headcount) || 0,
                max_capacity: Number(createQuotaData.max_capacity) || totalTarget || 0,
                budget: calculatedBudget || Number(createQuotaData.budget) || 0,
                budget_details: JSON.stringify(createBudgetDetails),
                description: createQuotaData.description,
                status: createQuotaData.status || 'Tạo phiếu',
                details: createQuotaDetails
            };

            const res = await api.post('/hr/quotas', payload);
            if (res.success) {
                addToast('Tạo phiếu định biên nhân sự thành công!', 'success');
                setModalType(null);
                fetchData();
            } else {
                addToast(res.message || 'Tạo phiếu định biên thất bại.', 'error');
            }
        } catch (err) {
            console.error(err);
            addToast('Đã xảy ra lỗi kết nối máy chủ.', 'error');
        } finally {
            setIsSubmittingQuota(false);
        }
    };

    const handleAddQuotaDetailRow = () => {
        const deptId = editQuotaData.department_id || selectedQuota?.department_id;
        const pos = positions.find(p => !deptId || p.department_id === deptId) || positions[0];
        const currCount = pos ? employees.filter(e => e.department_id === deptId && e.position_id === pos.position_id && (e.is_active === 1 || e.employment_status === 'WORKING')).length : 0;

        const newRow = {
            detail_id: 'temp-' + Date.now(),
            position_id: pos ? pos.position_id : '',
            position_code: pos ? pos.position_code : '',
            position_name: pos ? pos.position_name : '',
            target_headcount: 1,
            resignation_count: 0,
            maternity_count: 0,
            current_headcount: currCount,
            needed_headcount: Math.max(0, 1 - currCount),
            note: ''
        };
        const updated = [...quotaDetails, newRow];
        setQuotaDetails(updated);

        const totalTarget = updated.reduce((sum, d) => sum + (Number(d.target_headcount) || 0), 0);
        setEditQuotaData(prev => ({ ...prev, target_headcount: totalTarget }));
    };

    const handleRemoveQuotaDetailRow = (index) => {
        const updated = quotaDetails.filter((_, idx) => idx !== index);
        setQuotaDetails(updated);

        const totalTarget = updated.reduce((sum, d) => sum + (Number(d.target_headcount) || 0), 0);
        setEditQuotaData(prev => ({ ...prev, target_headcount: totalTarget }));
    };

    const handleQuotaDetailChange = (index, field, value) => {
        const updated = [...quotaDetails];
        const item = { ...updated[index], [field]: value };
        const deptId = editQuotaData.department_id || selectedQuota?.department_id;

        if (field === 'position_id') {
            const pos = positions.find(p => p.position_id === value);
            if (pos) {
                item.position_code = pos.position_code;
                item.position_name = pos.position_name;
                item.current_headcount = employees.filter(e => e.department_id === deptId && e.position_id === pos.position_id && (e.is_active === 1 || e.employment_status === 'WORKING')).length;
            }
        }

        const target = Number(item.target_headcount) || 0;
        const curr = Number(item.current_headcount) || 0;
        const resign = Number(item.resignation_count) || 0;
        const mat = Number(item.maternity_count) || 0;
        item.needed_headcount = Math.max(0, target - curr + resign + mat);

        updated[index] = item;
        setQuotaDetails(updated);

        const totalTarget = updated.reduce((sum, d) => sum + (Number(d.target_headcount) || 0), 0);
        setEditQuotaData(prev => ({ ...prev, target_headcount: totalTarget }));
    };

    const handleSaveQuotaEdit = async () => {
        const errors = {};
        if (!editQuotaData.effective_date) errors.effective_date = 'Vui lòng chọn Ngày áp dụng.';
        if (!editQuotaData.department_id) errors.department_id = 'Vui lòng chọn Bộ phận.';

        if (Object.keys(errors).length > 0) {
            setQuotaFormErrors(errors);
            addToast('Vui lòng kiểm tra lại dữ liệu nhập hợp lệ.', 'error');
            return;
        }

        try {
            const totalTarget = quotaDetails.reduce((sum, d) => sum + (Number(d.target_headcount) || 0), 0);
            const calculatedBudget = budgetDetails.reduce((sum, b) => sum + (Number(b.estimated_cost) || 0), 0);
            const qId = selectedQuota.quota_id || selectedQuota.id;
            const payload = {
                effective_date: editQuotaData.effective_date,
                department_id: editQuotaData.department_id,
                creator_name: editQuotaData.creator_name,
                target_headcount: totalTarget || Number(editQuotaData.target_headcount) || 0,
                max_capacity: Number(editQuotaData.max_capacity) || totalTarget || 0,
                budget: calculatedBudget || Number(editQuotaData.budget) || 0,
                budget_details: JSON.stringify(budgetDetails),
                description: editQuotaData.description,
                status: editQuotaData.status || selectedQuota.status || 'Tạo phiếu',
                details: quotaDetails
            };

            const res = await api.put(`/hr/quotas/${qId}`, payload);
            if (res.success) {
                addToast('Cập nhật phiếu định biên nhân sự thành công!', 'success');
                setIsEditingQuota(false);
                handleViewQuotaDetail(qId);
                fetchData();
            } else {
                addToast(res.message || 'Cập nhật phiếu định biên thất bại.', 'error');
            }
        } catch (err) {
            console.error(err);
            addToast('Đã xảy ra lỗi kết nối máy chủ.', 'error');
        }
    };

    const handleUpdateQuotaStatus = async (newStatus) => {
        if (!selectedQuota) return;
        try {
            const qId = selectedQuota.quota_id || selectedQuota.id;
            const res = await api.put(`/hr/quotas/${qId}/status`, { status: newStatus });
            if (res.success) {
                addToast(`Đã chuyển trạng thái phiếu sang '${newStatus}'`, 'success');
                handleViewQuotaDetail(qId);
                fetchData();
            } else {
                addToast(res.message || 'Cập nhật trạng thái thất bại.', 'error');
            }
        } catch (err) {
            console.error(err);
            addToast('Đã xảy ra lỗi kết nối máy chủ.', 'error');
        }
    };

    const handleDeleteQuotaConfirm = async () => {
        if (!selectedQuota) return;
        try {
            const res = await api.delete(`/hr/quotas/${selectedQuota.quota_id || selectedQuota.id}`);
            if (res.success) {
                addToast('Đã xóa phiếu định biên nhân sự thành công!', 'success');
                setDeleteQuotaConfirmModal(false);
                setSelectedQuota(null);
                fetchData();
            } else {
                addToast(res.message || 'Xóa phiếu định biên thất bại.', 'error');
            }
        } catch (err) {
            console.error(err);
            addToast('Đã xảy ra lỗi kết nối máy chủ.', 'error');
        }
    };


    const formatDate = (ts) => {
        if (!ts) return '—';
        if (typeof ts === 'string' && ts.includes('-')) return ts;
        const date = new Date(Number(ts));
        return isNaN(date.getTime()) ? '—' : date.toLocaleDateString('vi-VN');
    };

    const formatDateForInput = (ts) => {
        if (!ts) return '';
        const date = typeof ts === 'number' ? new Date(ts) : new Date(ts);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
    };

    // --- Handlers for Yêu cầu tuyển dụng (Recruitment Request) ---
    const handleRequestedByChange = (employeeId) => {
        const emp = employees.find(e => e.employee_id === employeeId || e.id === employeeId);
        const deptId = emp ? emp.department_id : (departments[0]?.department_id || '');
        const deptObj = departments.find(d => d.department_id === deptId);
        const deptName = deptObj ? deptObj.department_name : (emp?.department_name || '');

        setRequestFormData(prev => ({
            ...prev,
            requested_by: employeeId,
            department_id: deptId,
            department_name: deptName
        }));
    };

    const handlePositionDetailCodeChange = (index, posId) => {
        const posObj = positions.find(p => p.position_id === posId || p.id === posId);
        const posCode = posObj ? (posObj.position_code || posObj.code || '') : '';
        const posName = posObj ? (posObj.position_name || posObj.name || '') : '';

        setRequestPositionDetails(prev => {
            const updated = [...prev];
            updated[index] = {
                ...updated[index],
                position_id: posId,
                position_code: posCode,
                position_name: posName
            };
            return updated;
        });
    };

    const handlePositionDetailFieldChange = (index, field, value) => {
        setRequestPositionDetails(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const handleAddPositionDetailRow = () => {
        const pos = positions[0] || {};
        const expDateStr = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
        setRequestPositionDetails(prev => [
            ...prev,
            {
                id: 'detail-' + Date.now(),
                position_id: pos.position_id || '',
                position_code: pos.position_code || '',
                position_name: pos.position_name || '',
                quantity: 1,
                expected_date: expDateStr,
                note: ''
            }
        ]);
    };

    const handleRemovePositionDetailRow = (index) => {
        if (requestPositionDetails.length <= 1) return;
        setRequestPositionDetails(prev => prev.filter((_, idx) => idx !== index));
    };

    const handleOpenCreateRequestModal = () => {
        const yy = String(new Date().getFullYear()).slice(-2);
        const nextNum = String(requests.length + 1).padStart(3, '0');
        const code = `YCTD/${yy}-${nextNum}`;
        const todayStr = new Date().toISOString().split('T')[0];
        const firstEmp = employees[0] || {};
        const empDeptId = firstEmp.department_id || departments[0]?.department_id || '';
        const deptObj = departments.find(d => d.department_id === empDeptId);

        const deptPositions = positions.filter(p => !empDeptId || p.department_id === empDeptId);
        const firstPos = deptPositions[0] || positions[0] || {};
        const expDateStr = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

        setIsEditingRequest(false);
        setRequestFormData({
            request_id: null,
            request_date: todayStr,
            request_code: code,
            is_outside_headcount: 0,
            requested_by: firstEmp.employee_id || firstEmp.id || '',
            department_id: empDeptId,
            department_name: deptObj ? deptObj.department_name : (firstEmp.department_name || ''),
            reason: '',
            internal_note: '',
            priority: 'MEDIUM',
            status: 'PENDING'
        });

        setRequestPositionDetails([
            {
                id: 'd-1',
                position_id: firstPos.position_id || '',
                position_code: firstPos.position_code || '',
                position_name: firstPos.position_name || '',
                quantity: 1,
                expected_date: expDateStr,
                note: ''
            }
        ]);

        setModalType('req');
    };

    const handleOpenEditRequestModal = (reqRow) => {
        if (!reqRow) return;
        const reqId = reqRow.recruitment_request_id || reqRow.id;
        const reqDate = reqRow.created_date ? formatDateForInput(reqRow.created_date) : new Date().toISOString().split('T')[0];
        const expDate = reqRow.expected_date ? formatDateForInput(reqRow.expected_date) : new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

        const empObj = employees.find(e => e.employee_id === reqRow.requested_by || e.id === reqRow.requested_by);
        const deptObj = departments.find(d => d.department_id === reqRow.department_id);
        const posObj = positions.find(p => p.position_id === reqRow.position_id);

        setIsEditingRequest(true);
        setRequestFormData({
            request_id: reqId,
            request_date: reqDate,
            request_code: reqRow.request_code || 'YCTD/26-001',
            is_outside_headcount: reqRow.is_outside_headcount || 0,
            requested_by: reqRow.requested_by || (empObj ? empObj.employee_id : ''),
            department_id: reqRow.department_id || (empObj ? empObj.department_id : ''),
            department_name: deptObj ? deptObj.department_name : (reqRow.department_name || ''),
            reason: reqRow.reason || '',
            internal_note: reqRow.note || '',
            priority: reqRow.priority || 'MEDIUM',
            status: reqRow.status || 'PENDING'
        });

        setRequestPositionDetails([
            {
                id: 'd-' + reqId,
                position_id: reqRow.position_id || (posObj ? posObj.position_id : ''),
                position_code: posObj ? posObj.position_code : (reqRow.position_code || ''),
                position_name: reqRow.position_name || (posObj ? posObj.position_name : ''),
                quantity: reqRow.quantity || 1,
                expected_date: expDate,
                note: reqRow.note || ''
            }
        ]);

        setModalType('req');
    };

    const handleSaveRequest = async (e) => {
        if (e) e.preventDefault();

        if (!hasPermission(isEditingRequest ? 'UPDATE' : 'CREATE', 'RECRUITMENT_REQUEST')) {
            addToast(`Tài khoản của bạn không có quyền ${isEditingRequest ? 'cập nhật' : 'tạo'} Yêu cầu tuyển dụng!`, 'error');
            return;
        }

        if (!requestFormData.requested_by) {
            addToast('Vui lòng chọn Người lập (từ Hồ sơ nhân sự)!', 'error');
            return;
        }
        if (!requestFormData.reason || requestFormData.reason.trim() === '') {
            addToast('Vui lòng nhập Lý do cần tuyển!', 'error');
            return;
        }
        if (requestPositionDetails.length === 0 || !requestPositionDetails[0].position_id) {
            addToast('Vui lòng chọn ít nhất một Vị trí tuyển dụng chi tiết!', 'error');
            return;
        }

        const firstPosDetail = requestPositionDetails[0];
        const payload = {
            request_code: requestFormData.request_code,
            created_date: requestFormData.request_date,
            department_id: requestFormData.department_id,
            position_id: firstPosDetail.position_id,
            requested_by: requestFormData.requested_by,
            quantity: Number(firstPosDetail.quantity) || 1,
            reason: requestFormData.reason,
            expected_date: firstPosDetail.expected_date,
            priority: requestFormData.priority || 'MEDIUM',
            is_outside_headcount: Number(requestFormData.is_outside_headcount) || 0,
            note: requestFormData.internal_note || '',
            status: requestFormData.status || 'PENDING'
        };

        let res;
        if (isEditingRequest && requestFormData.request_id) {
            res = await api.put(`/recruitment/requests/${requestFormData.request_id}`, payload);
        } else {
            res = await api.post('/recruitment/requests', payload);
        }

        if (res.success) {
            addToast(isEditingRequest ? 'Cập nhật Yêu cầu tuyển dụng thành công!' : 'Đề xuất Yêu cầu tuyển dụng thành công!', 'success');
            setModalType(null);
            fetchData();
        } else {
            addToast(res.message || 'Có lỗi xảy ra khi lưu Yêu cầu tuyển dụng!', 'error');
        }
    };

    // Approve Request
    const handleApproveRequest = async (id, status) => {
        if (!hasPermission('APPROVE', 'RECRUITMENT_REQUEST')) {
            addToast('Tài khoản của bạn không có quyền phê duyệt Yêu cầu tuyển dụng!', 'error');
            return;
        }
        const res = await api.put(`/recruitment/requests/${id}/approve`, {
            status,
            note: 'HR đã rà soát chỉ tiêu định biên'
        });
        if (res.success) {
            addToast(`Đã ${status === 'APPROVED' ? 'phê duyệt' : 'từ chối'} yêu cầu tuyển dụng!`, 'success');
            fetchData();
        }
    };

    const handleDeleteRequest = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa Yêu cầu tuyển dụng này?')) return;
        const res = await api.delete(`/recruitment/requests/${id}`);
        if (res.success) {
            addToast('Xóa Yêu cầu tuyển dụng thành công!', 'success');
            fetchData();
        } else {
            addToast(res.message || 'Lỗi khi xóa yêu cầu tuyển dụng!', 'error');
        }
    };

    const handleDeleteCandidate = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa hồ sơ Ứng viên này?')) return;
        const res = await api.delete(`/recruitment/candidates/${id}`);
        if (res.success) {
            addToast('Xóa hồ sơ ứng viên thành công!', 'success');
            fetchData();
        } else {
            addToast(res.message || 'Lỗi khi xóa hồ sơ ứng viên!', 'error');
        }
    };

    const handleDeleteInterview = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa kết quả Phỏng vấn này?')) return;
        const res = await api.delete(`/recruitment/interviews/${id}`);
        if (res.success) {
            addToast('Xóa kết quả phỏng vấn thành công!', 'success');
            fetchData();
        } else {
            addToast(res.message || 'Lỗi khi xóa kết quả phỏng vấn!', 'error');
        }
    };

    // --- Handlers for Lịch phỏng vấn & Thi tuyển (Interview Schedule Management) ---
    const handleOpenCreateScheduleModal = () => {
        const yy = String(new Date().getFullYear()).slice(-2);
        const nextNum = String(interviewSchedules.length + 1).padStart(3, '0');
        const code = `PVTT/${yy}-${nextNum}`;
        const todayStr = new Date().toISOString().split('T')[0];
        const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

        const firstCand = candidates[0] || {};
        const firstEmp = employees[0] || {};

        setIsEditingSchedule(false);
        setScheduleModalTab('candidates');
        setScheduleFormData({
            schedule_id: null,
            created_date: todayStr,
            schedule_code: code,
            round_type: 'Vòng phỏng vấn',
            format_type: 'Offline',
            location: 'Phòng họp Tầng 3 - Tòa nhà BRAVO Building, Hà Nội',
            start_time: `${tomorrowStr}T09:00`,
            end_time: `${tomorrowStr}T11:00`,
            note: 'Chuẩn bị phòng họp, máy chiếu và tài liệu phỏng vấn',
            candidate_note: 'Ứng viên có mặt trước 15 phút, mang theo CCCD bản gốc',
            status: 'Đã lên lịch'
        });

        setScheduleCandidates([
            {
                id: 'sc-1',
                candidate_id: firstCand.candidate_id || firstCand.id || '',
                candidate_code: firstCand.candidate_code || 'UV-2024-001',
                full_name: firstCand.full_name || '—',
                apply_position_name: firstCand.apply_position_name || 'Nhân viên Kinh doanh',
                note: 'Đã gọi điện xác nhận tham gia'
            }
        ]);

        setScheduleCouncil([
            {
                id: 'scl-1',
                employee_id: firstEmp.employee_id || firstEmp.id || '',
                employee_code: firstEmp.employee_code || firstEmp.code || 'NV-2024-001',
                full_name: firstEmp.full_name || firstEmp.name || '—',
                position_name: firstEmp.position_name || firstEmp.level || 'Trưởng phòng',
                is_decision_maker: 1
            }
        ]);

        setScheduleTests([
            {
                id: 'st-1',
                test_name: 'Bài thi Kỹ năng Nghiệp vụ ERP',
                expected_score: 80,
                duration_minutes: 45,
                exam_file_name: 'De_thi_NghiepVu_V1.pdf',
                answer_file_name: 'Dap_an_NghiepVu_V1.pdf'
            }
        ]);

        setModalType('interview_schedule');
    };

    const handleOpenEditScheduleModal = (row) => {
        if (!row) return;
        const schId = row.schedule_id || row.id;
        const createdDate = row.created_date ? formatDateForInput(row.created_date) : new Date().toISOString().split('T')[0];

        let candsArr = [];
        let councilArr = [];
        let testsArr = [];

        try {
            candsArr = typeof row.candidates_json === 'string' ? JSON.parse(row.candidates_json || '[]') : (row.candidates_json || []);
        } catch (e) { candsArr = []; }

        try {
            councilArr = typeof row.council_json === 'string' ? JSON.parse(row.council_json || '[]') : (row.council_json || []);
        } catch (e) { councilArr = []; }

        try {
            testsArr = typeof row.tests_json === 'string' ? JSON.parse(row.tests_json || '[]') : (row.tests_json || []);
        } catch (e) { testsArr = []; }

        if (!Array.isArray(candsArr) || candsArr.length === 0) {
            const firstCand = candidates[0] || {};
            candsArr = [{
                id: 'sc-1',
                candidate_id: firstCand.candidate_id || firstCand.id || '',
                candidate_code: firstCand.candidate_code || 'UV-2024-001',
                full_name: firstCand.full_name || '—',
                apply_position_name: firstCand.apply_position_name || 'Nhân viên Kinh doanh',
                note: ''
            }];
        }

        if (!Array.isArray(councilArr) || councilArr.length === 0) {
            const firstEmp = employees[0] || {};
            councilArr = [{
                id: 'scl-1',
                employee_id: firstEmp.employee_id || firstEmp.id || '',
                employee_code: firstEmp.employee_code || firstEmp.code || 'NV-2024-001',
                full_name: firstEmp.full_name || firstEmp.name || '—',
                position_name: firstEmp.position_name || 'Trưởng phòng',
                is_decision_maker: 1
            }];
        }

        if (!Array.isArray(testsArr) || testsArr.length === 0) {
            testsArr = [{
                id: 'st-1',
                test_name: 'Bài thi Kỹ năng Nghiệp vụ ERP',
                expected_score: 80,
                duration_minutes: 45,
                exam_file_name: 'De_thi_NghiepVu_V1.pdf',
                answer_file_name: 'Dap_an_NghiepVu_V1.pdf'
            }];
        }

        setIsEditingSchedule(true);
        setScheduleModalTab('candidates');
        setScheduleFormData({
            schedule_id: schId,
            created_date: createdDate,
            schedule_code: row.schedule_code || 'PVTT/26-001',
            round_type: row.round_type || 'Vòng phỏng vấn',
            format_type: row.format_type || 'Offline',
            location: row.location || '',
            start_time: row.start_time ? (typeof row.start_time === 'number' ? new Date(row.start_time).toISOString().slice(0, 16) : row.start_time) : '',
            end_time: row.end_time ? (typeof row.end_time === 'number' ? new Date(row.end_time).toISOString().slice(0, 16) : row.end_time) : '',
            note: row.note || '',
            candidate_note: row.candidate_note || '',
            status: row.status || 'Đã lên lịch'
        });

        setScheduleCandidates(candsArr);
        setScheduleCouncil(councilArr);
        setScheduleTests(testsArr);
        setModalType('interview_schedule');
    };

    // Candidate Sub-tab manipulators
    const handleScheduleCandidateCodeChange = (index, candId) => {
        const candObj = candidates.find(c => c.candidate_id === candId || c.id === candId);
        const candCode = candObj ? candObj.candidate_code : '';
        const name = candObj ? candObj.full_name : '';
        const posName = candObj ? (candObj.apply_position_name || candObj.position_name || '') : '';

        setScheduleCandidates(prev => {
            const updated = [...prev];
            updated[index] = {
                ...updated[index],
                candidate_id: candId,
                candidate_code: candCode,
                full_name: name,
                apply_position_name: posName
            };
            return updated;
        });
    };

    const handleScheduleCandidateFieldChange = (index, field, value) => {
        setScheduleCandidates(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const handleAddScheduleCandidateRow = () => {
        const firstCand = candidates[0] || {};
        setScheduleCandidates(prev => [
            ...prev,
            {
                id: 'sc-' + Date.now(),
                candidate_id: firstCand.candidate_id || firstCand.id || '',
                candidate_code: firstCand.candidate_code || '',
                full_name: firstCand.full_name || '',
                apply_position_name: firstCand.apply_position_name || '',
                note: ''
            }
        ]);
    };

    const handleRemoveScheduleCandidateRow = (index) => {
        if (scheduleCandidates.length <= 1) return;
        setScheduleCandidates(prev => prev.filter((_, idx) => idx !== index));
    };

    // Council Sub-tab manipulators
    const handleScheduleCouncilEmployeeChange = (index, empId) => {
        const empObj = employees.find(e => e.employee_id === empId || e.id === empId);
        const empCode = empObj ? (empObj.employee_code || empObj.code || '') : '';
        const name = empObj ? (empObj.full_name || empObj.name || '') : '';
        const posName = empObj ? (empObj.position_name || empObj.department_name || '') : '';

        setScheduleCouncil(prev => {
            const updated = [...prev];
            updated[index] = {
                ...updated[index],
                employee_id: empId,
                employee_code: empCode,
                full_name: name,
                position_name: posName
            };
            return updated;
        });
    };

    const handleScheduleCouncilFieldChange = (index, field, value) => {
        setScheduleCouncil(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const handleAddScheduleCouncilRow = () => {
        const firstEmp = employees[0] || {};
        setScheduleCouncil(prev => [
            ...prev,
            {
                id: 'scl-' + Date.now(),
                employee_id: firstEmp.employee_id || firstEmp.id || '',
                employee_code: firstEmp.employee_code || firstEmp.code || '',
                full_name: firstEmp.full_name || firstEmp.name || '',
                position_name: firstEmp.position_name || '',
                is_decision_maker: 0
            }
        ]);
    };

    const handleRemoveScheduleCouncilRow = (index) => {
        if (scheduleCouncil.length <= 1) return;
        setScheduleCouncil(prev => prev.filter((_, idx) => idx !== index));
    };

    // Test Sub-tab manipulators
    const handleScheduleTestFieldChange = (index, field, value) => {
        setScheduleTests(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const handleAddScheduleTestRow = () => {
        setScheduleTests(prev => [
            ...prev,
            {
                id: 'st-' + Date.now(),
                test_name: '',
                expected_score: 75,
                duration_minutes: 60,
                exam_file_name: '',
                answer_file_name: ''
            }
        ]);
    };

    const handleRemoveScheduleTestRow = (index) => {
        if (scheduleTests.length <= 1) return;
        setScheduleTests(prev => prev.filter((_, idx) => idx !== index));
    };

    // Save Schedule API Handler
    const handleSaveSchedule = async (e) => {
        if (e) e.preventDefault();

        if (!scheduleFormData.schedule_code || scheduleFormData.schedule_code.trim() === '') {
            addToast('Vui lòng nhập Lịch số!', 'error');
            return;
        }

        const payload = {
            schedule_code: scheduleFormData.schedule_code,
            created_date: scheduleFormData.created_date,
            round_type: scheduleFormData.round_type || 'Vòng phỏng vấn',
            format_type: scheduleFormData.format_type || 'Offline',
            location: scheduleFormData.location || '',
            start_time: scheduleFormData.start_time,
            end_time: scheduleFormData.end_time,
            note: scheduleFormData.note || '',
            candidate_note: scheduleFormData.candidate_note || '',
            candidates: scheduleCandidates,
            council: scheduleCouncil,
            tests: scheduleTests,
            status: scheduleFormData.status || 'Đã lên lịch'
        };

        let res;
        if (isEditingSchedule && scheduleFormData.schedule_id) {
            res = await api.put(`/recruitment/interview-schedules/${scheduleFormData.schedule_id}`, payload);
        } else {
            res = await api.post('/recruitment/interview-schedules', payload);
        }

        if (res.success) {
            addToast(isEditingSchedule ? 'Cập nhật Lịch phỏng vấn - thi tuyển thành công!' : 'Tạo Lịch phỏng vấn - thi tuyển thành công!', 'success');
            setModalType(null);
            fetchData();
        } else {
            addToast(res.message || 'Có lỗi xảy ra khi lưu Lịch phỏng vấn - thi tuyển!', 'error');
        }
    };

    // Delete Schedule API Handler
    const handleDeleteSchedule = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa Lịch phỏng vấn - thi tuyển này?')) return;
        const res = await api.delete(`/recruitment/interview-schedules/${id}`);
        if (res.success) {
            addToast('Xóa Lịch phỏng vấn - thi tuyển thành công!', 'success');
            fetchData();
        } else {
            addToast(res.message || 'Lỗi khi xóa lịch!', 'error');
        }
    };

    // --- OFFER TUYỂN DỤNG HANDLERS ---
    const handleOpenCreateOfferModal = () => {
        const firstCand = candidates[0] || {};
        setOfferFormData({
            isEdit: false,
            offer_id: null,
            candidate_id: firstCand.candidate_id || firstCand.id || '',
            candidate_code: firstCand.candidate_code || '',
            candidate_name: firstCand.full_name || firstCand.candidate_name || '',
            department_name: firstCand.department_name || '',
            position_name: firstCand.apply_position_name || firstCand.position_name || '',
            offer_date: new Date().toISOString().split('T')[0],
            expected_start_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
            probation_salary: 16000000,
            official_salary: 18000000,
            note: 'Dự kiến thử việc 2 tháng theo quy định công ty',
            offer_status: 'Đã phát hành'
        });
        setModalType('offer');
    };

    const handleOpenEditOfferModal = (off) => {
        const matchedCand = candidates.find(c => c.candidate_id === off.candidate_id || c.id === off.candidate_id) || {};
        const oDateStr = off.offer_date ? (typeof off.offer_date === 'string' && off.offer_date.includes('-') ? off.offer_date : new Date(off.offer_date).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0];
        const sDateStr = off.expected_start_date ? (typeof off.expected_start_date === 'string' && off.expected_start_date.includes('-') ? off.expected_start_date : new Date(off.expected_start_date).toISOString().split('T')[0]) : new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

        setOfferFormData({
            isEdit: true,
            offer_id: off.offer_id || off.id,
            candidate_id: off.candidate_id || '',
            candidate_code: off.candidate_code || matchedCand.candidate_code || '',
            candidate_name: off.candidate_name || matchedCand.full_name || '',
            department_name: off.department_name || matchedCand.department_name || '',
            position_name: off.position_name || matchedCand.apply_position_name || '',
            offer_date: oDateStr,
            expected_start_date: sDateStr,
            probation_salary: off.probation_salary || Math.round((off.salary_offer || 18000000) * 0.85),
            official_salary: off.official_salary || off.salary_offer || 18000000,
            note: off.note || '',
            offer_status: off.offer_status || 'Đã phát hành'
        });
        setModalType('offer');
    };

    const handleSaveOffer = async (e) => {
        if (e) e.preventDefault();
        if (!offerFormData.candidate_id) {
            addToast('Vui lòng chọn Ứng viên nhận Offer!', 'error');
            return;
        }

        try {
            if (offerFormData.isEdit) {
                const res = await api.put(`/recruitment/offers/${offerFormData.offer_id}`, offerFormData);
                if (res.success) {
                    addToast(res.message || 'Cập nhật Offer thành công!', 'success');
                    setModalType(null);
                    fetchData();
                } else {
                    addToast(res.message || 'Lỗi khi cập nhật Offer', 'error');
                }
            } else {
                const res = await api.post('/recruitment/offers', offerFormData);
                if (res.success) {
                    addToast(res.message || 'Phát hành Offer thành công!', 'success');
                    setModalType(null);
                    fetchData();
                } else {
                    addToast(res.message || 'Lỗi khi phát hành Offer', 'error');
                }
            }
        } catch (err) {
            addToast(err.message || 'Lỗi hệ thống khi lưu Offer', 'error');
        }
    };

    const handleDeleteOffer = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa Offer này?')) return;
        try {
            const res = await api.delete(`/recruitment/offers/${id}`);
            if (res.success) {
                addToast(res.message || 'Đã xóa Offer thành công!', 'success');
                fetchData();
            } else {
                addToast(res.message || 'Lỗi khi xóa Offer', 'error');
            }
        } catch (err) {
            addToast(err.message || 'Lỗi hệ thống khi xóa Offer', 'error');
        }
    };

    // 2. Create Plan
    const handleCreatePlan = async (e) => {
        e.preventDefault();
        if (!hasPermission('CREATE', 'RECRUITMENT_PLAN')) {
            addToast('Tài khoản của bạn không có quyền tạo Kế hoạch tuyển dụng!', 'error');
            return;
        }
        const res = await api.post('/recruitment/plans', formData);
        if (res.success) {
            addToast('Lập kế hoạch tuyển dụng & Vòng tuyển dụng thành công!', 'success');
            setModalType(null);
            fetchData();
        } else {
            addToast(res.message, 'error');
        }
    };

    // --- CANDIDATE CODE GENERATOR & HANDLERS ---
    const generateCandidateCode = (fullName) => {
        if (!fullName || !fullName.trim()) return 'UV-';
        const removeAccents = (str) => {
            return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
        };
        const words = fullName.trim().split(/\s+/);
        let shortName = '';
        if (words.length === 1) {
            const w = removeAccents(words[0]);
            shortName = w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
        } else {
            const lastName = removeAccents(words[words.length - 1]);
            const capitalizedLastName = lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase();
            const initials = words.slice(0, words.length - 1)
                .map(w => removeAccents(w).charAt(0).toUpperCase())
                .join('');
            shortName = capitalizedLastName + initials;
        }

        const baseCode = `UV-${shortName}`;
        const matches = candidates.filter(c => c.candidate_code && c.candidate_code.startsWith(baseCode));
        if (matches.length === 0) return baseCode;

        let maxNum = 1;
        matches.forEach(c => {
            const suffix = c.candidate_code.replace(baseCode, '');
            if (suffix && !isNaN(suffix)) {
                const n = parseInt(suffix, 10);
                if (n >= maxNum) maxNum = n + 1;
            } else if (suffix === '') {
                if (maxNum === 1) maxNum = 2;
            }
        });
        return `${baseCode}${maxNum}`;
    };

    const PRE_SCREENING_CRITERIA_OPTIONS = ['Năng lực chuyên môn', 'Kỹ năng mềm', 'Ngoại ngữ', 'Kinh nghiệm làm việc'];

    const buildDefaultPsCriteriaRows = () => PRE_SCREENING_CRITERIA_OPTIONS.map(c => ({
        criteria_type: c, required_from: '', required_description: '', candidate_value: '', candidate_description: '', is_passed: false, note: ''
    }));

    const handleOpenCreatePreScreeningModal = () => {
        const defaultCand = candidates[0] || {};
        const defaultPos = positions.find(p => p.position_id === defaultCand.position_id);
        setFormData({
            isEdit: false,
            pre_screening_id: null,
            candidate_id: defaultCand.candidate_id || '',
            received_date: defaultCand.received_date ? new Date(defaultCand.received_date).toISOString().split('T')[0] : '',
            culture_level: defaultCand.culture_level || '',
            education_level: defaultCand.education_level || '',
            education_school: defaultCand.education_school || '',
            position_id: defaultCand.position_id || '',
            department_id: defaultPos?.department_id || defaultCand.req_dept_id || '',
            screening_date: new Date().toISOString().split('T')[0],
            level_score: 5,
            screening_result: 'ĐẠT',
            comment: ''
        });
        setPsCriteriaRows(buildDefaultPsCriteriaRows());
        setModalType('pre_screening');
    };

    const handleSelectCandidateForScreening = (candidateId) => {
        const c = candidates.find(x => x.candidate_id === candidateId);
        if (!c) { setFormData({ ...formData, candidate_id: candidateId }); return; }
        const pos = positions.find(p => p.position_id === c.position_id);
        setFormData({
            ...formData,
            candidate_id: candidateId,
            received_date: c.received_date ? new Date(c.received_date).toISOString().split('T')[0] : '',
            culture_level: c.culture_level || '',
            education_level: c.education_level || '',
            education_school: c.education_school || '',
            position_id: c.position_id || '',
            department_id: pos?.department_id || c.req_dept_id || ''
        });
    };

    const handleAddPsCriteriaRow = () => {
        setPsCriteriaRows([...psCriteriaRows, { criteria_type: 'Năng lực chuyên môn', required_from: '', required_description: '', candidate_value: '', candidate_description: '', is_passed: false, note: '' }]);
    };

    const handleRemovePsCriteriaRow = (idx) => {
        setPsCriteriaRows(psCriteriaRows.filter((_, i) => i !== idx));
    };

    const handlePsCriteriaChange = (idx, field, value) => {
        const updated = [...psCriteriaRows];
        updated[idx] = { ...updated[idx], [field]: value };
        setPsCriteriaRows(updated);
    };

    const handleSubmitPreScreening = async (e) => {
        e.preventDefault();
        if (!formData.candidate_id) {
            addToast('Vui lòng chọn Ứng viên!', 'error');
            return;
        }
        const payload = { ...formData, criteria: psCriteriaRows };
        const res = formData.isEdit
            ? await api.put(`/recruitment/pre-screenings/${formData.pre_screening_id}`, payload)
            : await api.post('/recruitment/pre-screenings', payload);
        if (res.success) {
            addToast(res.message, 'success');
            setModalType(null);
            fetchData();
        } else {
            addToast(res.message || 'Lỗi khi lưu Phiếu Sơ loại!', 'error');
        }
    };

    const handleOpenEditPreScreeningModal = async (item) => {
        const detailRes = await api.get(`/recruitment/pre-screenings/${item.pre_screening_id}`);
        if (!detailRes.success) {
            addToast('Không tải được chi tiết Phiếu Sơ loại!', 'error');
            return;
        }
        const d = detailRes.data;
        setFormData({
            isEdit: true,
            pre_screening_id: d.pre_screening_id,
            candidate_id: d.candidate_id,
            received_date: d.received_date ? new Date(d.received_date).toISOString().split('T')[0] : '',
            culture_level: d.culture_level || '',
            education_level: d.education_level || '',
            education_school: d.education_school || '',
            position_id: d.position_id || '',
            department_id: d.department_id || '',
            screening_date: d.screening_date ? new Date(d.screening_date).toISOString().split('T')[0] : '',
            level_score: d.level_score || 5,
            screening_result: d.screening_result || 'ĐẠT',
            comment: d.comment || ''
        });
        setPsCriteriaRows(
            Array.isArray(d.criteria) && d.criteria.length > 0
                ? d.criteria.map(c => ({ ...c, is_passed: !!c.is_passed }))
                : buildDefaultPsCriteriaRows()
        );
        setModalType('pre_screening');
    };

    const handleDeletePreScreening = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa Phiếu Sơ loại này?')) return;
        const res = await api.delete(`/recruitment/pre-screenings/${id}`);
        if (res.success) {
            addToast('Xóa Phiếu Sơ loại thành công!', 'success');
            fetchData();
        } else {
            addToast(res.message || 'Lỗi khi xóa!', 'error');
        }
    };

    const getCandidatesInSchedule = (scheduleId) => {
        const sch = interviewSchedules.find(s => (s.schedule_id || s.id) === scheduleId);
        if (!sch) return [];
        let candsArr = [];
        try {
            candsArr = typeof sch.candidates_json === 'string' ? JSON.parse(sch.candidates_json || '[]') : (sch.candidates_json || []);
        } catch (e) { }
        return candsArr;
    };

    const handleOpenCreateInterviewEvalModal = () => {
        const defaultSch = interviewSchedules[0] || {};
        const schCands = getCandidatesInSchedule(defaultSch.schedule_id || defaultSch.id);
        setFormData({
            isEdit: false,
            interview_eval_id: null,
            evaluation_date: new Date().toISOString().split('T')[0],
            schedule_id: defaultSch.schedule_id || defaultSch.id || '',
            candidate_id: schCands[0]?.candidate_id || '',
            duration_minutes: 30,
            level_score: 5,
            overall_result: 'ĐẠT',
            overall_comment: ''
        });
        setIevScriptRows([{ question: '', expectation: '', answer: '' }]);
        setIevCriteriaRows(buildDefaultPsCriteriaRows());
        setModalType('interview_eval');
    };

    const handleSelectScheduleForEval = (scheduleId) => {
        const schCands = getCandidatesInSchedule(scheduleId);
        setFormData({ ...formData, schedule_id: scheduleId, candidate_id: schCands[0]?.candidate_id || '' });
    };

    const handleAddScriptRow = () => setIevScriptRows([...ievScriptRows, { question: '', expectation: '', answer: '' }]);
    const handleRemoveScriptRow = (idx) => setIevScriptRows(ievScriptRows.filter((_, i) => i !== idx));
    const handleScriptChange = (idx, field, value) => {
        const updated = [...ievScriptRows];
        updated[idx] = { ...updated[idx], [field]: value };
        setIevScriptRows(updated);
    };

    const handleAddIevCriteriaRow = () => {
        setIevCriteriaRows([...ievCriteriaRows, { criteria_type: 'Năng lực chuyên môn', required_from: '', required_description: '', candidate_value: '', candidate_description: '', is_passed: false, note: '' }]);
    };
    const handleRemoveIevCriteriaRow = (idx) => setIevCriteriaRows(ievCriteriaRows.filter((_, i) => i !== idx));
    const handleIevCriteriaChange = (idx, field, value) => {
        const updated = [...ievCriteriaRows];
        updated[idx] = { ...updated[idx], [field]: value };
        setIevCriteriaRows(updated);
    };

    const handleSubmitInterviewEvaluation = async (e) => {
        e.preventDefault();
        if (!formData.candidate_id) {
            addToast('Vui lòng chọn Lịch phỏng vấn và Ứng viên!', 'error');
            return;
        }
        const payload = { ...formData, script: ievScriptRows, criteria: ievCriteriaRows };
        const res = formData.isEdit
            ? await api.put(`/recruitment/interview-evaluations/${formData.interview_eval_id}`, payload)
            : await api.post('/recruitment/interview-evaluations', payload);
        if (res.success) {
            addToast(res.message, 'success');
            setModalType(null);
            fetchData();
        } else {
            addToast(res.message || 'Lỗi khi lưu Phiếu Đánh giá phỏng vấn!', 'error');
        }
    };

    const handleOpenEditInterviewEvalModal = async (item) => {
        const detailRes = await api.get(`/recruitment/interview-evaluations/${item.interview_eval_id}`);
        if (!detailRes.success) {
            addToast('Không tải được chi tiết Phiếu Đánh giá phỏng vấn!', 'error');
            return;
        }
        const d = detailRes.data;
        setFormData({
            isEdit: true,
            interview_eval_id: d.interview_eval_id,
            evaluation_date: d.evaluation_date ? new Date(d.evaluation_date).toISOString().split('T')[0] : '',
            schedule_id: d.schedule_id || '',
            candidate_id: d.candidate_id,
            duration_minutes: d.duration_minutes || 30,
            level_score: d.level_score || 5,
            overall_result: d.overall_result || 'ĐẠT',
            overall_comment: d.overall_comment || ''
        });
        setIevScriptRows(Array.isArray(d.script) && d.script.length > 0 ? d.script : [{ question: '', expectation: '', answer: '' }]);
        setIevCriteriaRows(Array.isArray(d.criteria) && d.criteria.length > 0 ? d.criteria.map(c => ({ ...c, is_passed: !!c.is_passed })) : buildDefaultPsCriteriaRows());
        setModalType('interview_eval');
    };

    const handleDeleteInterviewEvaluation = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa Phiếu Đánh giá phỏng vấn này?')) return;
        const res = await api.delete(`/recruitment/interview-evaluations/${id}`);
        if (res.success) {
            addToast('Xóa Phiếu Đánh giá phỏng vấn thành công!', 'success');
            fetchData();
        } else {
            addToast(res.message || 'Lỗi khi xóa!', 'error');
        }
    };

    const handleOpenCreateCandidateModal = () => {
        setActiveCandTab('info');
        const defaultPlan = plans[0] || {};
        const defaultPos = positions[0] || {};

        setCandidateFormData({
            isEdit: false,
            candidate_id: null,
            candidate_code: 'UV-',
            full_name: '',
            citizen_id: '',
            date_of_birth: '',
            gender: 'Nam',
            phone: '',
            email: '',
            address: '',
            culture_level: 'Đại học',
            education_level: 'Cử nhân',
            education_school: '',
            major: '',
            source: 'TopCV',
            referrer: '',
            experience: '',
            status: 'Đã tiếp nhận hồ sơ',
            received_date: new Date().toISOString().split('T')[0],
            recruitment_plan_id: defaultPlan.recruitment_plan_id || '',
            position_id: defaultPos.position_id || '',
            attachments_json: [
                { doc_type: 'CV', doc_name: 'CV_UngVien.pdf', is_required: true, description: 'CV bản PDF chuẩn', note: '', file_name: 'CV_UngVien.pdf' }
            ]
        });
        setModalType('cand');
    };

    const handleCandidateDoubleClick = (c) => {
        setActiveCandTab('info');
        setCandidateFormData({
            isEdit: true,
            candidate_id: c.candidate_id,
            candidate_code: c.candidate_code || '',
            full_name: c.full_name || '',
            citizen_id: c.citizen_id || '',
            date_of_birth: c.date_of_birth ? (typeof c.date_of_birth === 'string' && c.date_of_birth.includes('-') ? c.date_of_birth : new Date(c.date_of_birth).toISOString().split('T')[0]) : '',
            gender: c.gender || 'Nam',
            phone: c.phone || '',
            email: c.email || '',
            address: c.address || '',
            culture_level: c.culture_level || 'Đại học',
            education_level: c.education_level || 'Cử nhân',
            education_school: c.education_school || '',
            major: c.major || '',
            source: c.source || 'TopCV',
            referrer: c.referrer || '',
            experience: c.experience || '',
            status: c.status || 'Đã tiếp nhận hồ sơ',
            received_date: c.received_date ? (typeof c.received_date === 'string' && c.received_date.includes('-') ? c.received_date : new Date(c.received_date).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
            recruitment_plan_id: c.recruitment_plan_id || plans[0]?.recruitment_plan_id || '',
            position_id: c.position_id || positions[0]?.position_id || '',
            attachments_json: Array.isArray(c.attachments_json) ? c.attachments_json : []
        });
        setModalType('cand');
    };

    const handleAddAttachmentRow = () => {
        setCandidateFormData(prev => ({
            ...prev,
            attachments_json: [
                ...(prev.attachments_json || []),
                { doc_type: 'CV', doc_name: '', is_required: true, description: '', note: '', file_name: '' }
            ]
        }));
    };

    const handleRemoveAttachmentRow = (idx) => {
        setCandidateFormData(prev => ({
            ...prev,
            attachments_json: (prev.attachments_json || []).filter((_, i) => i !== idx)
        }));
    };

    const handleAttachmentChange = (idx, field, value) => {
        setCandidateFormData(prev => {
            const updated = [...(prev.attachments_json || [])];
            updated[idx] = { ...updated[idx], [field]: value };
            return { ...prev, attachments_json: updated };
        });
    };

    const handleSaveCandidateSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!candidateFormData.full_name || !candidateFormData.full_name.trim()) {
            addToast('Vui lòng nhập Họ tên ứng viên.', 'error');
            return;
        }

        try {
            let res;
            if (candidateFormData.isEdit) {
                res = await api.put(`/recruitment/candidates/${candidateFormData.candidate_id}`, candidateFormData);
            } else {
                res = await api.post('/recruitment/candidates', candidateFormData);
            }

            if (res.success) {
                addToast(candidateFormData.isEdit ? 'Cập nhật hồ sơ ứng viên thành công!' : 'Tiếp nhận hồ sơ ứng viên thành công!', 'success');
                setModalType(null);
                fetchData();
            } else {
                addToast(res.message || 'Lưu hồ sơ ứng viên thất bại.', 'error');
            }
        } catch (err) {
            console.error(err);
            addToast('Đã xảy ra lỗi kết nối máy chủ.', 'error');
        }
    };

    // 4. Create Interview
    const handleCreateInterview = async (e) => {
        e.preventDefault();
        if (!hasPermission('CREATE', 'INTERVIEW')) {
            addToast('Tài khoản của bạn không có quyền lên lịch/ghi nhận đánh giá phỏng vấn!', 'error');
            return;
        }
        const res = await api.post('/recruitment/interviews', formData);
        if (res.success) {
            addToast('Ghi nhận kết quả phỏng vấn thành công!', 'success');
            setModalType(null);
            fetchData();
        } else {
            addToast(res.message, 'error');
        }
    };

    // 5. Create Offer
    const handleCreateOffer = async (e) => {
        e.preventDefault();
        if (!hasPermission('CREATE', 'OFFER')) {
            addToast('Tài khoản của bạn không có quyền tạo Offer!', 'error');
            return;
        }
        const res = await api.post('/recruitment/offers', formData);
        if (res.success) {
            addToast('Tạo Offer thành công!', 'success');
            setModalType(null);
            fetchData();
        } else {
            addToast(res.message, 'error');
        }
    };

    // 6. Convert Candidate to Employee
    const handleConvertToEmployee = async (candId) => {
        if (!hasPermission('CREATE', 'EMPLOYEE')) {
            addToast('Tài khoản của bạn không có quyền chuyển ứng viên thành nhân viên chính thức!', 'error');
            return;
        }
        const res = await api.post('/recruitment/convert-to-employee', { candidate_id: candId });
        if (res.success) {
            addToast(res.message, 'success', '🎉 Tuyển dụng thành công!');
            fetchData();
        } else {
            addToast(res.message, 'error');
        }
    };

    return (
        <div>
            {/* 0. ĐỊNH BIÊN NHÂN SỰ (HEADCOUNT QUOTA PLANNING) */}
            {(!activeSubTab || activeSubTab === 'Định biên nhân sự') && (
                selectedQuota ? (
                    /* DETAILED QUOTA DOCUMENT VIEW (Matching Image 1 & 2) */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {/* Top Header Bar & Action Controls */}
                        <div className="card" style={{ padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', backgroundColor: '#FFFFFF', borderLeft: '4px solid var(--bravo-teal)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => { setSelectedQuota(null); setIsEditingQuota(false); }}
                                    style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}
                                >
                                    <ArrowLeft size={16} />
                                    <span>Quay ra</span>
                                </button>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
                                            Định biên nhân sự: <span style={{ color: 'var(--bravo-teal-dark)' }}>{selectedQuota.quota_code}</span>
                                        </h2>
                                        <span className={`badge ${selectedQuota.status === 'Đã hoàn thiện' || selectedQuota.status === 'Đã duyệt' ? 'badge-green' :
                                                selectedQuota.status === 'Đang duyệt' ? 'badge-blue' :
                                                    selectedQuota.status === 'Từ chối' ? 'badge-red' : 'badge-yellow'
                                            }`} style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem', fontWeight: 800 }}>
                                            {selectedQuota.status || 'Tạo phiếu'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons based on Status and Read-Only/Edit mode */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {!isEditingQuota ? (
                                    <>
                                        {/* Sửa: Allowed if status is 'Tạo phiếu' or 'Từ chối' */}
                                        {(selectedQuota.status === 'Tạo phiếu' || selectedQuota.status === 'Từ chối') && (
                                            <button
                                                className="btn btn-secondary"
                                                onClick={() => setIsEditingQuota(true)}
                                                style={{ padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--bravo-teal-dark)', borderColor: 'var(--bravo-teal)' }}
                                            >
                                                <Edit3 size={15} />
                                                <span>Sửa</span>
                                            </button>
                                        )}

                                        {/* Gửi duyệt */}
                                        {(selectedQuota.status === 'Tạo phiếu' || selectedQuota.status === 'Từ chối') && (
                                            <button
                                                className="btn btn-primary"
                                                onClick={() => handleUpdateQuotaStatus('Đang duyệt')}
                                                style={{ padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, backgroundColor: 'var(--bravo-teal)' }}
                                            >
                                                <CheckCircle2 size={15} />
                                                <span>Gửi duyệt</span>
                                            </button>
                                        )}

                                        {/* Duyệt & Từ chối: If status is 'Đang duyệt' */}
                                        {selectedQuota.status === 'Đang duyệt' && (
                                            <>
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={() => handleUpdateQuotaStatus('Đã hoàn thiện')}
                                                    style={{ padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, backgroundColor: '#10B981' }}
                                                >
                                                    <CheckCircle2 size={15} />
                                                    <span>Phê duyệt</span>
                                                </button>
                                                <button
                                                    className="btn btn-secondary"
                                                    onClick={() => handleUpdateQuotaStatus('Từ chối')}
                                                    style={{ padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: '#EF4444', borderColor: '#FCA5A5' }}
                                                >
                                                    <XCircle size={15} />
                                                    <span>Từ chối</span>
                                                </button>
                                            </>
                                        )}

                                        {/* Xóa: Allowed if 'Tạo phiếu' or 'Từ chối' */}
                                        {(selectedQuota.status === 'Tạo phiếu' || selectedQuota.status === 'Từ chối') && (
                                            <button
                                                className="btn btn-secondary"
                                                onClick={() => setDeleteQuotaConfirmModal(true)}
                                                style={{ padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: '#EF4444', borderColor: '#FCA5A5' }}
                                            >
                                                <Trash2 size={15} />
                                                <span>Xóa</span>
                                            </button>
                                        )}

                                        <button
                                            className="btn btn-secondary"
                                            onClick={() => setSelectedQuota(null)}
                                            style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem', fontWeight: 600 }}
                                        >
                                            <span>Quay ra</span>
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            className="btn btn-secondary"
                                            onClick={() => { setIsEditingQuota(false); setEditQuotaData(selectedQuota); setQuotaFormErrors({}); }}
                                            style={{ padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}
                                        >
                                            <X size={15} />
                                            <span>Hủy</span>
                                        </button>
                                        <button
                                            className="btn btn-primary"
                                            onClick={handleSaveQuotaEdit}
                                            style={{ padding: '0.45rem 1.1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, backgroundColor: 'var(--bravo-teal)' }}
                                        >
                                            <Save size={15} />
                                            <span>Lưu</span>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* General Information Header matching Image 2 */}
                        <div className="card" style={{ padding: '1.25rem 1.5rem', backgroundColor: '#FFFFFF' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>1. Ngày áp dụng (*)</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={editQuotaData.effective_date || ''}
                                        disabled={!isEditingQuota}
                                        onChange={(e) => setEditQuotaData({ ...editQuotaData, effective_date: e.target.value })}
                                        style={{ backgroundColor: !isEditingQuota ? '#F8FAFC' : '#FFFFFF', color: '#0F172A', fontWeight: 600 }}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>2. Số phiếu (*)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={selectedQuota.quota_code}
                                        disabled
                                        readOnly
                                        style={{ backgroundColor: '#F1F5F9', color: 'var(--bravo-teal-dark)', fontWeight: 800, cursor: 'not-allowed' }}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>3. Người lập (*)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={editQuotaData.creator_name || ''}
                                        disabled={!isEditingQuota}
                                        onChange={(e) => setEditQuotaData({ ...editQuotaData, creator_name: e.target.value })}
                                        style={{ backgroundColor: !isEditingQuota ? '#F8FAFC' : '#FFFFFF', color: '#0F172A', fontWeight: 600 }}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>4. Bộ phận (*)</label>
                                    <select
                                        className="form-select"
                                        value={editQuotaData.department_id || ''}
                                        disabled={!isEditingQuota}
                                        onChange={(e) => setEditQuotaData({ ...editQuotaData, department_id: e.target.value })}
                                        style={{ backgroundColor: !isEditingQuota ? '#F8FAFC' : '#FFFFFF', color: '#0F172A', fontWeight: 600 }}
                                    >
                                        {departments.map(d => (
                                            <option key={d.department_id} value={d.department_id}>{d.department_name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>5. Tổng định biên</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={editQuotaData.target_headcount || 0}
                                        disabled={!isEditingQuota}
                                        onChange={(e) => setEditQuotaData({ ...editQuotaData, target_headcount: e.target.value })}
                                        style={{ textAlign: 'right', fontWeight: 800, backgroundColor: '#F8FAFC', color: '#0F172A' }}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>6. Sức chứa tối đa</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={editQuotaData.max_capacity || 0}
                                        disabled={!isEditingQuota}
                                        onChange={(e) => setEditQuotaData({ ...editQuotaData, max_capacity: e.target.value })}
                                        style={{ textAlign: 'right', fontWeight: 700, backgroundColor: !isEditingQuota ? '#F8FAFC' : '#FFFFFF' }}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>7. Số lượng hiện tại</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={selectedQuota.current_headcount || 0}
                                        disabled
                                        readOnly
                                        style={{ textAlign: 'right', fontWeight: 800, backgroundColor: '#F1F5F9', color: '#15803D' }}
                                    />
                                </div>

                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>7. Diễn giải</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={editQuotaData.description || ''}
                                        disabled={!isEditingQuota}
                                        onChange={(e) => setEditQuotaData({ ...editQuotaData, description: e.target.value })}
                                        placeholder="Diễn giải nội dung định biên..."
                                        style={{ backgroundColor: !isEditingQuota ? '#F8FAFC' : '#FFFFFF' }}
                                    />
                                </div>
                            </div>

                            {/* MỤC 3: NGÂN SÁCH DỰ KIẾN KÈM BẢNG CHI TIẾT */}
                            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '2px solid #E2E8F0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--bravo-teal-dark)' }}>
                                        3. Ngân sách dự kiến
                                    </h3>
                                    {isEditingQuota && (
                                        <button
                                            className="btn btn-secondary"
                                            onClick={handleAddBudgetDetailRow}
                                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem', borderColor: 'var(--bravo-teal)', color: 'var(--bravo-teal-dark)', fontWeight: 700 }}
                                        >
                                            <Plus size={14} />
                                            <span>Thêm dòng chi phí</span>
                                        </button>
                                    )}
                                </div>

                                <div style={{ overflowX: 'auto', border: '1px solid #CBD5E1', borderRadius: '6px' }}>
                                    <table className="erp-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: '50px' }}>STT</th>
                                                <th>Loại chi phí</th>
                                                <th style={{ width: '220px' }}>Nguồn tuyển dụng</th>
                                                <th style={{ textAlign: 'right', width: '180px' }}>Chi phí dự kiến</th>
                                                {isEditingQuota && <th style={{ width: '50px' }}>Thao tác</th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {budgetDetails.length === 0 ? (
                                                <tr>
                                                    <td colSpan={isEditingQuota ? 5 : 4} style={{ textAlign: 'center', padding: '1.5rem', color: '#94A3B8' }}>
                                                        Chưa có chi tiết ngân sách dự kiến. {isEditingQuota && "Bấm '+ Thêm dòng chi phí' để bổ sung."}
                                                    </td>
                                                </tr>
                                            ) : (
                                                budgetDetails.map((bRow, idx) => (
                                                    <tr key={bRow.id || idx}>
                                                        <td>{idx + 1}</td>
                                                        <td>
                                                            {isEditingQuota ? (
                                                                <input
                                                                    type="text"
                                                                    className="form-input"
                                                                    value={bRow.cost_type || ''}
                                                                    placeholder="Nhập loại chi phí (VD: Đăng tin, Giới thiệu...)"
                                                                    onChange={(e) => handleBudgetDetailChange(idx, 'cost_type', e.target.value)}
                                                                    style={{ fontSize: '0.85rem' }}
                                                                />
                                                            ) : (
                                                                <span style={{ fontWeight: 600 }}>{bRow.cost_type}</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            {isEditingQuota ? (
                                                                <select
                                                                    className="form-select"
                                                                    value={bRow.source || 'TopCV'}
                                                                    onChange={(e) => handleBudgetDetailChange(idx, 'source', e.target.value)}
                                                                    style={{ fontSize: '0.85rem' }}
                                                                >
                                                                    <option value="Bạn bè giới thiệu">Bạn bè giới thiệu</option>
                                                                    <option value="MXH">MXH</option>
                                                                    <option value="LinkedIn">LinkedIn</option>
                                                                    <option value="TopCV">TopCV</option>
                                                                    <option value="Trang web">Trang web</option>
                                                                </select>
                                                            ) : (
                                                                <span className="badge badge-teal" style={{ fontWeight: 600 }}>{bRow.source}</span>
                                                            )}
                                                        </td>
                                                        <td style={{ textAlign: 'right' }}>
                                                            {isEditingQuota ? (
                                                                <input
                                                                    type="number"
                                                                    min={0}
                                                                    className="form-input"
                                                                    value={bRow.estimated_cost || 0}
                                                                    onChange={(e) => handleBudgetDetailChange(idx, 'estimated_cost', e.target.value)}
                                                                    style={{ textAlign: 'right', fontWeight: 700, color: '#047857', fontSize: '0.85rem' }}
                                                                />
                                                            ) : (
                                                                <span style={{ fontWeight: 800, color: '#047857' }}>
                                                                    {Number(bRow.estimated_cost || 0).toLocaleString('vi-VN')}
                                                                </span>
                                                            )}
                                                        </td>
                                                        {isEditingQuota && (
                                                            <td style={{ textAlign: 'center' }}>
                                                                <button
                                                                    className="btn btn-secondary"
                                                                    style={{ padding: '0.2rem 0.4rem', color: '#EF4444', borderColor: '#FCA5A5' }}
                                                                    onClick={() => handleRemoveBudgetDetailRow(idx)}
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </td>
                                                        )}
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                        {budgetDetails.length > 0 && (
                                            <tfoot>
                                                <tr style={{ backgroundColor: '#F8FAFC', fontWeight: 800 }}>
                                                    <td colSpan={3} style={{ textAlign: 'right' }}>Tổng ngân sách dự kiến:</td>
                                                    <td style={{ textAlign: 'right', color: '#047857', fontSize: '0.95rem' }}>
                                                        {budgetDetails.reduce((sum, item) => sum + (Number(item.estimated_cost) || 0), 0).toLocaleString('vi-VN')}
                                                    </td>
                                                    {isEditingQuota && <td></td>}
                                                </tr>
                                            </tfoot>
                                        )}
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* TAB 1: CHI TIẾT (SINGLE TAB PER SPEC SECTION 6) */}
                        <div className="card" style={{ padding: '0', overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', padding: '0.5rem 1rem' }}>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <div style={{ padding: '0.4rem 1rem', borderRadius: '6px 6px 0 0', backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderBottom: 'none', fontWeight: 800, fontSize: '0.85rem', color: 'var(--bravo-teal-dark)' }}>
                                        Chi tiết
                                    </div>
                                </div>
                                {isEditingQuota && (
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => handleAddQuotaDetailRow()}
                                        style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem', backgroundColor: 'var(--bravo-teal)' }}
                                    >
                                        <Plus size={14} />
                                        <span>Thêm vị trí</span>
                                    </button>
                                )}
                            </div>

                            {/* Position Quotas Table matching Image 1 & 2 */}
                            <div style={{ overflowX: 'auto' }}>
                                <table className="erp-table" style={{ width: '100%', minWidth: '950px', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#F8FAFC' }}>
                                            <th style={{ width: '50px', textAlign: 'center', whiteSpace: 'nowrap' }}>STT</th>
                                            <th style={{ width: '160px', whiteSpace: 'nowrap' }}>MÃ VỊ TRÍ</th>
                                            <th style={{ minWidth: '170px', whiteSpace: 'nowrap' }}>TÊN VỊ TRÍ</th>
                                            <th style={{ textAlign: 'center', width: '110px', whiteSpace: 'nowrap' }}>ĐỊNH BIÊN</th>
                                            <th style={{ textAlign: 'center', width: '95px', whiteSpace: 'nowrap' }}>NGHỈ VIỆC</th>
                                            <th style={{ textAlign: 'center', width: '95px', whiteSpace: 'nowrap' }}>THAI SẢN</th>
                                            <th style={{ textAlign: 'center', width: '95px', whiteSpace: 'nowrap' }}>HIỆN TẠI</th>
                                            <th style={{ textAlign: 'center', width: '95px', whiteSpace: 'nowrap' }}>CẦN TUYỂN</th>
                                            <th style={{ minWidth: '140px', whiteSpace: 'nowrap' }}>GHI CHÚ</th>
                                            {isEditingQuota && <th style={{ width: '55px', textAlign: 'center', whiteSpace: 'nowrap' }}>THAO TÁC</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {quotaDetails.length === 0 ? (
                                            <tr>
                                                <td colSpan={isEditingQuota ? 10 : 9} style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8' }}>
                                                    Chưa có dữ liệu vị trí chi tiết. {isEditingQuota && "Nhấn '+ Thêm vị trí' để thêm dòng mới."}
                                                </td>
                                            </tr>
                                        ) : (
                                            quotaDetails.map((row, idx) => (
                                                <tr key={row.detail_id || idx}>
                                                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{idx + 1}</td>
                                                    <td>
                                                        {isEditingQuota ? (
                                                            <select
                                                                className="form-select"
                                                                value={row.position_id || ''}
                                                                onChange={(e) => handleQuotaDetailChange(idx, 'position_id', e.target.value)}
                                                                style={{ fontSize: '0.8rem', padding: '0.3rem 0.4rem', width: '100%', borderRadius: '6px' }}
                                                            >
                                                                <option value="">-- Chọn vị trí --</option>
                                                                {positions
                                                                    .filter(p => !editQuotaData.department_id || p.department_id === editQuotaData.department_id)
                                                                    .map(p => (
                                                                        <option key={p.position_id} value={p.position_id}>{p.position_code}</option>
                                                                    ))}
                                                            </select>
                                                        ) : (
                                                            <b style={{ color: 'var(--bravo-teal-dark)' }}>{row.position_code}</b>
                                                        )}
                                                    </td>
                                                    <td style={{ fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap', color: 'var(--bravo-teal-dark)' }}>
                                                        {row.position_name || '—'}
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        {isEditingQuota ? (
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                className="form-input"
                                                                value={row.target_headcount || 0}
                                                                onChange={(e) => handleQuotaDetailChange(idx, 'target_headcount', e.target.value)}
                                                                style={{ textAlign: 'center', padding: '0.3rem 0.4rem', fontSize: '0.85rem', fontWeight: 700, borderRadius: '6px' }}
                                                            />
                                                        ) : (
                                                            <span style={{ fontWeight: 700 }}>{row.target_headcount}</span>
                                                        )}
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        {isEditingQuota ? (
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                className="form-input"
                                                                value={row.resignation_count || 0}
                                                                onChange={(e) => handleQuotaDetailChange(idx, 'resignation_count', e.target.value)}
                                                                style={{ textAlign: 'center', padding: '0.3rem 0.4rem', fontSize: '0.85rem', borderRadius: '6px' }}
                                                            />
                                                        ) : (
                                                            row.resignation_count || 0
                                                        )}
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        {isEditingQuota ? (
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                className="form-input"
                                                                value={row.maternity_count || 0}
                                                                onChange={(e) => handleQuotaDetailChange(idx, 'maternity_count', e.target.value)}
                                                                style={{ textAlign: 'center', padding: '0.3rem 0.4rem', fontSize: '0.85rem', borderRadius: '6px' }}
                                                            />
                                                        ) : (
                                                            row.maternity_count || 0
                                                        )}
                                                    </td>
                                                    <td style={{ textAlign: 'center', fontWeight: 800, fontSize: '0.9rem', color: '#15803D' }}>
                                                        <span style={{ backgroundColor: '#DCFCE7', padding: '0.2rem 0.55rem', borderRadius: '12px', display: 'inline-block' }}>
                                                            {row.current_headcount || 0}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: 'center', fontWeight: 800, fontSize: '0.9rem', color: (row.needed_headcount || 0) > 0 ? '#2563EB' : '#475569' }}>
                                                        <span style={{ backgroundColor: (row.needed_headcount || 0) > 0 ? '#DBEAFE' : '#F1F5F9', padding: '0.2rem 0.55rem', borderRadius: '12px', display: 'inline-block' }}>
                                                            {row.needed_headcount || 0}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {isEditingQuota ? (
                                                            <input
                                                                type="text"
                                                                className="form-input"
                                                                value={row.note || ''}
                                                                onChange={(e) => handleQuotaDetailChange(idx, 'note', e.target.value)}
                                                                placeholder="Ghi chú..."
                                                                style={{ padding: '0.3rem 0.5rem', fontSize: '0.825rem', width: '100%', borderRadius: '6px' }}
                                                            />
                                                        ) : (
                                                            row.note || '—'
                                                        )}
                                                    </td>
                                                    {isEditingQuota && (
                                                        <td style={{ textAlign: 'center' }}>
                                                            <button
                                                                className="btn btn-secondary"
                                                                onClick={() => handleRemoveQuotaDetailRow(idx)}
                                                                style={{ padding: '0.25rem 0.45rem', color: '#EF4444', borderColor: '#FCA5A5', borderRadius: '6px' }}
                                                                title="Xóa dòng"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* TABLE LIST OF QUOTAS (Section 2 & 3 per User Request) */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* Filter Area */}
                        <div className="card" style={{ padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Filter size={18} color="var(--bravo-teal-dark)" />
                                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>Bộ lọc tìm kiếm:</h3>
                            </div>

                            {/* Bộ phận Lookup Dropdown */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.85rem', color: '#0F172A', fontWeight: 700 }}>Bộ phận:</span>
                                <select
                                    value={filterQuotaDept}
                                    onChange={(e) => setFilterQuotaDept(e.target.value)}
                                    style={{
                                        padding: '0.45rem 0.85rem',
                                        borderRadius: '6px',
                                        border: '1px solid #CBD5E1',
                                        fontSize: '0.85rem',
                                        outline: 'none',
                                        backgroundColor: '#FFFFFF',
                                        color: '#0F172A',
                                        fontWeight: 700,
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="ALL">Tất cả bộ phận</option>
                                    {availableDepartments.map((d) => (
                                        <option key={d.department_id} value={d.department_id} style={{ color: '#0F172A', fontWeight: 600 }}>
                                            {d.department_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Trạng thái Dropdown */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.85rem', color: '#0F172A', fontWeight: 700 }}>Trạng thái:</span>
                                <select
                                    value={filterQuotaStatus}
                                    onChange={(e) => setFilterQuotaStatus(e.target.value)}
                                    style={{
                                        padding: '0.45rem 0.85rem',
                                        borderRadius: '6px',
                                        border: '1px solid #CBD5E1',
                                        fontSize: '0.85rem',
                                        outline: 'none',
                                        backgroundColor: '#FFFFFF',
                                        color: '#0F172A',
                                        fontWeight: 700,
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="ALL">Tất cả trạng thái</option>
                                    <option value="Tạo phiếu">Tạo phiếu</option>
                                    <option value="Đang duyệt">Đang duyệt</option>
                                    <option value="Đã hoàn thiện">Đã hoàn thiện</option>
                                    <option value="Từ chối">Từ chối</option>
                                </select>
                            </div>

                            {/* Clear Filter */}
                            {(filterQuotaDept !== 'ALL' || filterQuotaStatus !== 'ALL') && (
                                <button
                                    className="btn btn-secondary"
                                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', color: '#EF4444', borderColor: '#EF4444', fontWeight: 700, backgroundColor: '#FEF2F2' }}
                                    onClick={() => { setFilterQuotaDept('ALL'); setFilterQuotaStatus('ALL'); }}
                                >
                                    <X size={14} />
                                    <span>Xóa bộ lọc</span>
                                </button>
                            )}
                        </div>

                        {/* DataTable Quotas */}
                        <DataTable
                            loading={loading}
                            addLabel="Thêm mới"
                            onAdd={handleOpenCreateQuotaModal}
                            onRowDoubleClick={(row) => handleViewQuotaDetail(row.quota_id || row.id)}
                            searchPlaceholder="Tìm kiếm theo bộ phận"
                            columns={[
                                { header: 'Số phiếu', accessor: 'quota_code', render: (r) => <b style={{ color: 'var(--bravo-teal-dark)' }}>{r.quota_code}</b> },
                                { header: 'Ngày áp dụng', accessor: 'effective_date', render: (r) => r.effective_date ? new Date(r.effective_date).toLocaleDateString('vi-VN') : '' },
                                {
                                    header: 'Bộ phận',
                                    accessor: 'department_name',
                                    render: (r) => {
                                        const deptObj = departments.find(d => d.department_id === r.department_id);
                                        const name = deptObj ? deptObj.department_name : (r.department_name || r.department_id || '—');
                                        return <span style={{ fontWeight: 700, color: '#0F172A' }}>{name}</span>;
                                    }
                                },
                                { header: 'Người lập', accessor: 'creator_name' },
                                { header: 'Tổng định biên', accessor: 'target_headcount', render: (r) => <span style={{ fontWeight: 700 }}>{r.target_headcount}</span> },
                                { header: 'Sức chứa tối đa', accessor: 'max_capacity', render: (r) => <span style={{ fontWeight: 700, color: '#475569' }}>{r.max_capacity}</span> },
                                {
                                    header: 'Số lượng hiện tại',
                                    render: (r) => {
                                        const count = employees.filter(e => e.department_id === r.department_id && (e.is_active === 1 || e.employment_status === 'WORKING')).length;
                                        return <span style={{ fontWeight: 700 }}>{count}</span>;
                                    }
                                },
                                { header: 'Ngân sách', accessor: 'budget', render: (r) => <span style={{ fontWeight: 700, color: '#047857' }}>{Number(r.budget || 0).toLocaleString('vi-VN')}</span> },
                                {
                                    header: 'Trạng thái',
                                    accessor: 'status',
                                    render: (r) => (
                                        <span className={`badge ${r.status === 'Đã hoàn thiện' || r.status === 'Đã duyệt' ? 'badge-green' :
                                                r.status === 'Đang duyệt' ? 'badge-blue' :
                                                    r.status === 'Từ chối' ? 'badge-red' : 'badge-yellow'
                                            }`} style={{ fontWeight: 700 }}>
                                            {r.status || 'Tạo phiếu'}
                                        </span>
                                    )
                                }
                            ]}
                            data={quotas.filter(q => {
                                if (filterQuotaDept !== 'ALL' && q.department_id !== filterQuotaDept) return false;
                                if (filterQuotaStatus !== 'ALL' && q.status !== filterQuotaStatus) return false;
                                return true;
                            })}
                        />
                    </div>
                )
            )}


            {/* 1. YÊU CẦU TUYỂN DỤNG */}
            {activeSubTab === 'Yêu cầu tuyển dụng' && (
                <DataTable
                    loading={loading}
                    addLabel="Thêm mới Yêu cầu Tuyển dụng"
                    onAdd={handleOpenCreateRequestModal}
                    onRowDoubleClick={(row) => handleOpenEditRequestModal(row)}
                    searchPlaceholder="Tìm kiếm theo mã YCTD, người lập, lý do..."
                    columns={[
                        { header: 'Mã YCTD', accessor: 'request_code', render: (r) => <b style={{ color: 'var(--bravo-teal-dark)', whiteSpace: 'nowrap' }}>{r.request_code}</b> },
                        { header: 'Ngày lập', render: (r) => <span style={{ whiteSpace: 'nowrap' }}>{r.created_date ? formatDate(r.created_date) : '—'}</span> },
                        {
                            header: 'Loại yêu cầu',
                            render: (r) => (
                                <span className={`badge ${r.is_outside_headcount === 1 ? 'badge-yellow' : 'badge-teal'}`} style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                                    {r.is_outside_headcount === 1 ? 'Ngoài định biên' : 'Trong định biên'}
                                </span>
                            )
                        },
                        {
                            header: 'Người lập',
                            render: (r) => {
                                const emp = employees.find(e => e.employee_id === r.requested_by || e.id === r.requested_by);
                                const name = r.requested_by_name || (emp ? emp.full_name : '—');
                                return <span style={{ fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap' }}>{name}</span>;
                            }
                        },
                        { header: 'Bộ phận đề xuất', accessor: 'department_name', render: (r) => <span style={{ fontWeight: 600, color: 'var(--bravo-teal-dark)', whiteSpace: 'nowrap' }}>{r.department_name}</span> },
                        {
                            header: 'Mã / Vị trí tuyển',
                            render: (r) => (
                                <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                                    <b style={{ color: '#0369A1' }}>{r.position_code || ''}</b> {r.position_name ? `(${r.position_name})` : ''}
                                </span>
                            )
                        },
                        { header: 'Số lượng', accessor: 'quantity', render: (r) => <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{r.quantity} người</span> },
                        { header: 'Ngày cần người', render: (r) => <span style={{ whiteSpace: 'nowrap' }}>{formatDate(r.expected_date)}</span> },
                        { header: 'Lý do cần tuyển', accessor: 'reason', render: (r) => <span style={{ fontSize: '0.825rem', color: '#475569' }}>{r.reason}</span> },
                        { header: 'Trạng thái', accessor: 'status', render: (r) => <StatusChip status={r.status} /> },
                        {
                            header: 'Thao tác',
                            render: (r) => (
                                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', whiteSpace: 'nowrap' }}>
                                    <button
                                        className="btn btn-secondary"
                                        style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                                        onClick={() => handleOpenEditRequestModal(r)}
                                        title="Chỉnh sửa Yêu cầu"
                                    >
                                        <Edit3 size={13} />
                                        <span>Sửa</span>
                                    </button>
                                    {r.status === 'PENDING' && (user?.roleName === 'Administrator' || user?.roleName === 'HR Staff') && (
                                        <>
                                            <button className="btn btn-success" style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem', fontWeight: 700 }} onClick={() => handleApproveRequest(r.recruitment_request_id, 'APPROVED')}>
                                                Duyệt
                                            </button>
                                            <button className="btn btn-danger" style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem', fontWeight: 700 }} onClick={() => handleApproveRequest(r.recruitment_request_id, 'REJECTED')}>
                                                Từ chối
                                            </button>
                                        </>
                                    )}
                                    <button
                                        className="btn btn-secondary"
                                        style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem', fontWeight: 600, color: '#EF4444', borderColor: '#FCA5A5', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                                        onClick={() => handleDeleteRequest(r.recruitment_request_id)}
                                        title="Xóa Yêu cầu"
                                    >
                                        <Trash2 size={13} />
                                        <span>Xóa</span>
                                    </button>
                                </div>
                            )
                        }
                    ]}
                    data={requests}
                />
            )}



            {/* 3. HỒ SƠ ỨNG VIÊN - GOM NHÓM THEO VỊ TRÍ DỰ TUYỂN */}
            {activeSubTab === 'Hồ sơ ứng viên' && (
                <div>
                    <div style={{
                        fontSize: '0.8rem',
                        color: '#059669',
                        backgroundColor: '#ECFDF5',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        marginBottom: '0.75rem',
                        border: '1px solid #A7F3D0',
                        fontWeight: 600
                    }}>
                        💡 Mẹo BRAVO ERP: Hồ sơ ứng viên được <b>gom nhóm theo vị trí ứng tuyển (chữ in đậm)</b>. Hiển thị đầy đủ 9 trường dữ liệu. Click đúp (Double-Click) vào dòng bất kỳ để mở Form chi tiết!
                    </div>

                    <DataTable
                        loading={loading}
                        addLabel="Tiếp nhận Hồ sơ Ứng viên"
                        onAdd={handleOpenCreateCandidateModal}
                        searchPlaceholder="Tìm tên ứng viên, mã hồ sơ, vị trí, email..."
                        groupBy="request_code"
                        groupTitleFunc={(r) => `⊟ ${r.request_code || 'RNE/0726-0001'}: ${r.apply_position_name || 'Nhân viên tuyển dụng'}`}
                        onRowDoubleClick={handleCandidateDoubleClick}
                        columns={[
                            { header: 'Ngày nhận HS', render: (r) => formatDate(r.received_date) },
                            { header: 'Mã ứng viên', accessor: 'candidate_code', render: (r) => <b style={{ color: 'var(--bravo-teal-dark)', whiteSpace: 'nowrap' }}>{r.candidate_code}</b> },
                            { header: 'Họ và tên', accessor: 'full_name', render: (r) => <span style={{ fontWeight: 600, color: 'var(--bravo-teal-dark)', whiteSpace: 'nowrap' }}>{r.full_name}</span> },
                            { header: 'Ngày sinh', render: (r) => <span style={{ whiteSpace: 'nowrap' }}>{formatDate(r.date_of_birth)}</span> },
                            { header: 'Giới tính', accessor: 'gender', render: (r) => <span style={{ whiteSpace: 'nowrap' }}>{r.gender}</span> },
                            { header: 'Điện thoại', accessor: 'phone', render: (r) => <span style={{ whiteSpace: 'nowrap' }}>{r.phone}</span> },
                            { header: 'Email', accessor: 'email', render: (r) => <span style={{ whiteSpace: 'nowrap' }}>{r.email}</span> },
                            { header: 'Vị trí dự tuyển', accessor: 'apply_position_name', render: (r) => <span style={{ fontWeight: 600, color: '#0369A1', whiteSpace: 'nowrap' }}>{r.apply_position_name || '—'}</span> },
                            { header: 'Bộ phận dự tuyển', accessor: 'department_name', render: (r) => <span style={{ color: '#475569', whiteSpace: 'nowrap' }}>{r.department_name || '—'}</span> },
                            { header: 'Trạng thái', accessor: 'status', render: (r) => <StatusChip status={r.status} /> },
                            {
                                header: 'Thao tác',
                                render: (r) => (
                                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', whiteSpace: 'nowrap' }}>
                                        <button
                                            className="btn btn-secondary"
                                            style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}
                                            onClick={() => handleCandidateDoubleClick(r)}
                                        >
                                            <Edit3 size={14} />
                                            <span>Sửa</span>
                                        </button>
                                        {r.status !== 'HIRED' && (
                                            <button
                                                className="btn btn-secondary"
                                                style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', fontWeight: 600, color: '#EF4444', borderColor: '#FCA5A5', display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}
                                                onClick={() => handleDeleteCandidate(r.candidate_id)}
                                                title="Xóa hồ sơ ứng viên"
                                            >
                                                <Trash2 size={14} />
                                                <span>Xóa</span>
                                            </button>
                                        )}
                                    </div>
                                )
                            }
                        ]}
                        data={candidates}
                    />
                </div>
            )}

            {/* 3B. SƠ LOẠI ỨNG VIÊN */}
            {activeSubTab === 'Sơ loại' && (
                <DataTable
                    loading={loading}
                    addLabel="Lập Phiếu Sơ loại Ứng viên"
                    onAdd={handleOpenCreatePreScreeningModal}
                    onRowDoubleClick={(row) => handleOpenEditPreScreeningModal(row)}
                    searchPlaceholder="Tìm mã phiếu, tên ứng viên..."
                    columns={[
                        { header: 'Mã phiếu', accessor: 'screening_code', render: (r) => <b style={{ color: 'var(--bravo-teal-dark)', whiteSpace: 'nowrap' }}>{r.screening_code}</b> },
                        { header: 'Ứng viên', accessor: 'candidate_name', render: (r) => <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{r.candidate_name} ({r.candidate_code})</span> },
                        { header: 'Vị trí dự tuyển', accessor: 'position_name', render: (r) => <span style={{ whiteSpace: 'nowrap' }}>{r.position_name || '—'}</span> },
                        { header: 'Bộ phận', accessor: 'department_name', render: (r) => <span style={{ whiteSpace: 'nowrap' }}>{r.department_name || '—'}</span> },
                        { header: 'Ngày sơ loại', render: (r) => <span style={{ whiteSpace: 'nowrap' }}>{r.screening_date ? new Date(r.screening_date).toLocaleDateString('vi-VN') : '—'}</span> },
                        { header: 'Mức độ', render: (r) => <b style={{ color: '#0284C7' }}>{r.level_score}/10</b> },
                        {
                            header: 'Đánh giá sơ loại',
                            render: (r) => (
                                <span className={`badge ${r.screening_result === 'ĐẠT' ? 'badge-green' : 'badge-red'}`} style={{ whiteSpace: 'nowrap' }}>
                                    {r.screening_result}
                                </span>
                            )
                        },
                        {
                            header: 'Thao tác',
                            render: (r) => (
                                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', whiteSpace: 'nowrap' }}>
                                    <button
                                        className="btn btn-secondary"
                                        style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}
                                        onClick={() => handleOpenEditPreScreeningModal(r)}
                                    >
                                        <Edit3 size={14} />
                                        <span>Sửa</span>
                                    </button>
                                    <button
                                        className="btn btn-secondary"
                                        style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', fontWeight: 600, color: '#EF4444', borderColor: '#FCA5A5', display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}
                                        onClick={() => handleDeletePreScreening(r.pre_screening_id)}
                                        title="Xóa phiếu sơ loại"
                                    >
                                        <Trash2 size={14} />
                                        <span>Xóa</span>
                                    </button>
                                </div>
                            )
                        }
                    ]}
                    data={preScreenings}
                />
            )}

            {/* 3C. ĐÁNH GIÁ PHỎNG VẤN */}
            {activeSubTab === 'Đánh giá phỏng vấn' && (
                <DataTable
                    loading={loading}
                    addLabel="Lập Phiếu Đánh giá phỏng vấn"
                    onAdd={handleOpenCreateInterviewEvalModal}
                    onRowDoubleClick={(row) => handleOpenEditInterviewEvalModal(row)}
                    searchPlaceholder="Tìm mã phiếu, tên ứng viên, lịch số..."
                    columns={[
                        { header: 'Số phiếu', accessor: 'eval_code', render: (r) => <b style={{ color: 'var(--bravo-teal-dark)', whiteSpace: 'nowrap' }}>{r.eval_code}</b> },
                        { header: 'Ngày đánh giá', render: (r) => <span style={{ whiteSpace: 'nowrap' }}>{r.evaluation_date ? new Date(r.evaluation_date).toLocaleDateString('vi-VN') : '—'}</span> },
                        { header: 'Lịch số', accessor: 'schedule_code', render: (r) => <span style={{ whiteSpace: 'nowrap' }}>{r.schedule_code || '—'}</span> },
                        { header: 'Ứng viên', accessor: 'candidate_name', render: (r) => <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{r.candidate_name} ({r.candidate_code})</span> },
                        { header: 'Thời lượng', render: (r) => <span style={{ whiteSpace: 'nowrap' }}>{r.duration_minutes} phút</span> },
                        { header: 'Mức độ', render: (r) => <b style={{ color: '#0284C7' }}>{r.level_score}/10</b> },
                        {
                            header: 'Đánh giá chung',
                            render: (r) => (
                                <span className={`badge ${r.overall_result === 'ĐẠT' ? 'badge-green' : 'badge-red'}`} style={{ whiteSpace: 'nowrap' }}>
                                    {r.overall_result}
                                </span>
                            )
                        },
                        {
                            header: 'Thao tác',
                            render: (r) => (
                                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', whiteSpace: 'nowrap' }}>
                                    <button
                                        className="btn btn-secondary"
                                        style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}
                                        onClick={() => handleOpenEditInterviewEvalModal(r)}
                                    >
                                        <Edit3 size={14} />
                                        <span>Sửa</span>
                                    </button>
                                    <button
                                        className="btn btn-secondary"
                                        style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', fontWeight: 600, color: '#EF4444', borderColor: '#FCA5A5', display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}
                                        onClick={() => handleDeleteInterviewEvaluation(r.interview_eval_id)}
                                        title="Xóa phiếu đánh giá"
                                    >
                                        <Trash2 size={14} />
                                        <span>Xóa</span>
                                    </button>
                                </div>
                            )
                        }
                    ]}
                    data={interviewEvaluations}
                />
            )}

            {/* 4. LỊCH PHỎNG VẤN & THI TUYỂN */}
            {activeSubTab === 'Lịch Phỏng vấn' && (
                <DataTable
                    loading={loading}
                    addLabel="Thêm mới Lịch phỏng vấn - thi tuyển"
                    onAdd={handleOpenCreateScheduleModal}
                    onRowDoubleClick={(row) => handleOpenEditScheduleModal(row)}
                    searchPlaceholder="Tìm kiếm theo lịch số, địa điểm, ứng viên, hội đồng..."
                    columns={[
                        {
                            header: 'Lịch số',
                            accessor: 'schedule_code',
                            render: (r) => <b style={{ color: 'var(--bravo-teal-dark)', whiteSpace: 'nowrap' }}>{r.schedule_code}</b>
                        },
                        {
                            header: 'Ngày lập',
                            render: (r) => <span style={{ whiteSpace: 'nowrap' }}>{r.created_date ? formatDate(r.created_date) : '—'}</span>
                        },
                        {
                            header: 'Vòng tuyển dụng',
                            accessor: 'round_type',
                            render: (r) => (
                                <span className={`badge ${r.round_type === 'Vòng thi tuyển' ? 'badge-purple' : 'badge-green'}`} style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                                    {r.round_type}
                                </span>
                            )
                        },
                        {
                            header: 'Hình thức',
                            accessor: 'format_type',
                            render: (r) => (
                                <span className={`badge ${r.format_type === 'Online' ? 'badge-yellow' : 'badge-blue'}`} style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                                    {r.format_type}
                                </span>
                            )
                        },
                        {
                            header: 'Thời gian bắt đầu',
                            render: (r) => {
                                if (!r.start_time) return '—';
                                const str = typeof r.start_time === 'number' ? new Date(r.start_time).toLocaleString('vi-VN') : r.start_time;
                                return <span style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{str}</span>;
                            }
                        },
                        {
                            header: 'Thời gian kết thúc',
                            render: (r) => {
                                if (!r.end_time) return '—';
                                const str = typeof r.end_time === 'number' ? new Date(r.end_time).toLocaleString('vi-VN') : r.end_time;
                                return <span style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{str}</span>;
                            }
                        },
                        {
                            header: 'Địa điểm',
                            accessor: 'location',
                            render: (r) => <span style={{ fontSize: '0.825rem', color: '#334155' }}>{r.location || '—'}</span>
                        },
                        {
                            header: 'Danh sách Ứng viên',
                            render: (r) => {
                                let cands = [];
                                try {
                                    cands = typeof r.candidates_json === 'string' ? JSON.parse(r.candidates_json || '[]') : (r.candidates_json || []);
                                } catch (e) { cands = []; }
                                return (
                                    <div style={{ whiteSpace: 'nowrap' }}>
                                        <span className="badge badge-teal" style={{ fontWeight: 700, marginRight: '0.35rem' }}>{cands.length} UV</span>
                                        <span style={{ fontSize: '0.825rem', fontWeight: 600 }}>
                                            {cands.map(c => c.full_name).filter(Boolean).join(', ') || '—'}
                                        </span>
                                    </div>
                                );
                            }
                        },
                        {
                            header: 'Hội đồng tuyển dụng',
                            render: (r) => {
                                let council = [];
                                try {
                                    council = typeof r.council_json === 'string' ? JSON.parse(r.council_json || '[]') : (r.council_json || []);
                                } catch (e) { council = []; }
                                return (
                                    <div style={{ whiteSpace: 'nowrap', fontSize: '0.825rem' }}>
                                        {council.map((mem, idx) => (
                                            <span key={idx} style={{ marginRight: '0.4rem', fontWeight: mem.is_decision_maker ? 700 : 500, color: mem.is_decision_maker ? 'var(--bravo-teal-dark)' : '#475569' }}>
                                                {mem.full_name}{mem.is_decision_maker ? ' (Người QĐ)' : ''}
                                                {idx < council.length - 1 ? ',' : ''}
                                            </span>
                                        ))}
                                    </div>
                                );
                            }
                        },
                        {
                            header: 'Trạng thái',
                            accessor: 'status',
                            render: (r) => <StatusChip status={r.status || 'Đã lên lịch'} />
                        },
                        {
                            header: 'Thao tác',
                            render: (r) => (
                                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', whiteSpace: 'nowrap' }}>
                                    <button
                                        className="btn btn-secondary"
                                        style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                                        onClick={() => handleOpenEditScheduleModal(r)}
                                        title="Chỉnh sửa Lịch"
                                    >
                                        <Edit3 size={13} />
                                        <span>Sửa</span>
                                    </button>
                                    <button
                                        className="btn btn-secondary"
                                        style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem', fontWeight: 600, color: '#EF4444', borderColor: '#FCA5A5' }}
                                        onClick={() => handleDeleteSchedule(r.schedule_id || r.id)}
                                        title="Xóa Lịch"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            )
                        }
                    ]}
                    data={interviewSchedules}
                />
            )}

            {/* 5. OFFER TUYỂN DỤNG */}
            {activeSubTab === 'Offer' && (
                <DataTable
                    loading={loading}
                    addLabel="Tạo Thư mời Nhận việc (Offer)"
                    onAdd={handleOpenCreateOfferModal}
                    searchPlaceholder="Tìm ứng viên nhận offer, vị trí..."
                    columns={[
                        { header: 'Ứng viên nhận Offer', accessor: 'candidate_name', render: (r) => <span style={{ fontWeight: 700 }}>{r.candidate_name} ({r.candidate_code || '—'})</span> },
                        { header: 'Ngày trao đổi', render: (r) => <span style={{ whiteSpace: 'nowrap' }}>{formatDate(r.offer_date)}</span> },
                        { header: 'Ngày bắt đầu đi làm', render: (r) => <span style={{ whiteSpace: 'nowrap' }}>{formatDate(r.expected_start_date)}</span> },
                        { header: 'Lương thử việc', accessor: 'probation_salary', render: (r) => <b style={{ color: '#047857' }}>{Number(r.probation_salary || Math.round((r.salary_offer || 0) * 0.85)).toLocaleString('vi-VN')} VNĐ</b> },
                        { header: 'Lương chính thức', accessor: 'official_salary', render: (r) => <b style={{ color: '#2D6F62' }}>{Number(r.official_salary || r.salary_offer || 0).toLocaleString('vi-VN')} VNĐ</b> },
                        { header: 'Ghi chú', accessor: 'note', render: (r) => <span style={{ color: '#475569' }}>{r.note || '—'}</span> },
                        { header: 'Trạng thái Offer', accessor: 'offer_status', render: (r) => <StatusChip status={r.offer_status} /> },
                        {
                            header: 'Thao tác',
                            render: (r) => (
                                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', whiteSpace: 'nowrap' }}>
                                    <button
                                        className="btn btn-secondary"
                                        style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                                        onClick={() => handleOpenEditOfferModal(r)}
                                        title="Chỉnh sửa Offer"
                                    >
                                        <Edit3 size={13} />
                                        <span>Sửa</span>
                                    </button>
                                    <button
                                        className="btn btn-secondary"
                                        style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem', fontWeight: 600, color: '#EF4444', borderColor: '#FCA5A5' }}
                                        onClick={() => handleDeleteOffer(r.offer_id || r.id)}
                                        title="Xóa Offer"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            )
                        }
                    ]}
                    data={offers}
                />
            )}

            {/* 6. WORKFLOW: CHUYỂN ỨNG VIÊN THÀNH NHÂN VIÊN */}
            {activeSubTab === 'Chuyển thành nhân viên' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="card" style={{ borderLeft: '5px solid var(--bravo-teal)', backgroundColor: '#F0F8F6' }}>
                        <h3 style={{ fontSize: '1rem', color: 'var(--bravo-teal-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Sparkles size={18} />
                            <span>Chuyển Ứng viên Đã Đạt thành Nhân viên Chính thức BRAVO Software</span>
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.25rem' }}>
                            Khi ứng viên chấp nhận Offer, nhấn nút <b>"Chuyển thành Nhân viên"</b> bên dưới để tự động tạo Hồ sơ Nhân sự (`Employee`) và Hợp đồng Lao động (`EmployeeContract`).
                        </p>
                    </div>

                    <DataTable
                        loading={loading}
                        searchPlaceholder="Tìm ứng viên..."
                        columns={[
                            { header: 'Mã Ứng viên', accessor: 'candidate_code', render: (r) => <b>{r.candidate_code}</b> },
                            { header: 'Họ và tên ứng viên', accessor: 'full_name', render: (r) => <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{r.full_name}</span> },
                            { header: 'Vị trí dự tuyển', accessor: 'apply_position_name', render: (r) => <span style={{ color: 'var(--bravo-teal-dark)', fontWeight: 600 }}>{r.apply_position_name}</span> },
                            { header: 'Bộ phận dự tuyển', accessor: 'department_name', render: (r) => <span style={{ color: '#475569' }}>{r.department_name}</span> },
                            { header: 'Email & Số điện thoại', render: (r) => `${r.email} • ${r.phone}` },
                            { header: 'Trạng thái ứng viên', accessor: 'status', render: (r) => <StatusChip status={r.status} /> },
                            {
                                header: 'Thao tác chuyển đổi',
                                render: (r) => (
                                    r.status === 'HIRED' ? (
                                        <span className="badge badge-green">✓ Đã thành Nhân viên</span>
                                    ) : (
                                        <button
                                            className="btn btn-primary"
                                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                                            onClick={() => handleConvertToEmployee(r.candidate_id)}
                                        >
                                            <UserPlus size={16} />
                                            <span>Chuyển thành Nhân viên</span>
                                        </button>
                                    )
                                )
                            }
                        ]}
                        data={candidates.filter((c) => ['OFFERED', 'INTERVIEWING', 'HIRED', 'S5: Trúng tuyển'].includes(c.status))}
                    />
                </div>
            )}

            {/* MODAL CHI TIẾT ỨNG VIÊN CHUẨN FORM BRAVO ERP (KHỚP 100% ẢNH 2) */}
            {modalType === 'cand_detail' && formData && (
                <Modal
                    isOpen={true}
                    onClose={() => setModalType(null)}
                    title={`Chi tiết Hồ sơ Ứng viên (BRAVO ERP): ${formData.full_name} [${formData.candidate_code}]`}
                    maxWidth="850px"
                    footer={
                        <>
                            <button className="btn btn-secondary" onClick={() => setModalType(null)}>Hủy bỏ</button>
                            <button className="btn btn-primary" onClick={handleUpdateCandidate}>Cập nhật thông tin</button>
                        </>
                    }
                >
                    <form onSubmit={handleUpdateCandidate}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '0.75rem',
                            backgroundColor: '#F8FAFC',
                            padding: '1.25rem',
                            borderRadius: '8px',
                            border: '1px solid #E2E8F0',
                            fontSize: '0.85rem'
                        }}>
                            {/* Row 1 */}
                            <div className="form-group">
                                <label className="form-label">1. Mã (*)</label>
                                <input type="text" className="form-input" value={formData.candidate_code || ''} onChange={(e) => setFormData({ ...formData, candidate_code: e.target.value })} />
                            </div>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="form-label">2. Họ tên (*)</label>
                                <input type="text" className="form-input" value={formData.full_name || ''} required onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} />
                            </div>

                            {/* Row 2 */}
                            <div className="form-group">
                                <label className="form-label">3. Số CMT/CCCD</label>
                                <input type="text" className="form-input" value={formData.citizen_id || ''} onChange={(e) => setFormData({ ...formData, citizen_id: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">4. Ngày sinh</label>
                                <input type="date" className="form-input" value={formatDateForInput(formData.date_of_birth)} onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">5. Giới tính</label>
                                <select className="form-select" value={formData.gender || 'Nam'} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                                    <option value="Nam">1: Nam</option>
                                    <option value="Nữ">0: Nữ</option>
                                </select>
                            </div>

                            {/* Row 3 */}
                            <div className="form-group">
                                <label className="form-label">6. Số điện thoại</label>
                                <input type="text" className="form-input" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="form-label">7. Email</label>
                                <input type="email" className="form-input" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                            </div>

                            {/* Row 4 */}
                            <div className="form-group" style={{ gridColumn: 'span 3' }}>
                                <label className="form-label">8. Địa chỉ</label>
                                <input type="text" className="form-input" value={formData.address || ''} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                            </div>

                            {/* Row 5 */}
                            <div className="form-group">
                                <label className="form-label">9. Trình độ văn hóa</label>
                                <input type="text" className="form-input" value={formData.culture_level || '12/12'} onChange={(e) => setFormData({ ...formData, culture_level: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">a. Trình độ chuyên môn</label>
                                <input type="text" className="form-input" value={formData.education_level || 'Đại học'} onChange={(e) => setFormData({ ...formData, education_level: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">b. Bậc trình độ nghề</label>
                                <input type="text" className="form-input" value={formData.skill_level || '1'} onChange={(e) => setFormData({ ...formData, skill_level: e.target.value })} />
                            </div>

                            {/* Row 6 */}
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="form-label">c. Đơn vị đào tạo</label>
                                <input type="text" className="form-input" value={formData.education_school || ''} onChange={(e) => setFormData({ ...formData, education_school: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">d. Ngành đào tạo</label>
                                <input type="text" className="form-input" value={formData.major || ''} onChange={(e) => setFormData({ ...formData, major: e.target.value })} />
                            </div>

                            {/* Row 7 */}
                            <div className="form-group">
                                <label className="form-label">e. Nguồn tuyển dụng</label>
                                <select className="form-select" value={formData.source || 'TopCV'} onChange={(e) => setFormData({ ...formData, source: e.target.value })}>
                                    <option value="TopCV">TopCV</option>
                                    <option value="LinkedIn">LinkedIn</option>
                                    <option value="Website BRAVO">Website BRAVO</option>
                                    <option value="Referral">Giới thiệu (Referral)</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">f. Đơn vị tuyển dụng</label>
                                <input type="text" className="form-input" value={formData.recruitment_unit || 'Công ty CP Phần mềm BRAVO'} onChange={(e) => setFormData({ ...formData, recruitment_unit: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">g. Người giới thiệu</label>
                                <input type="text" className="form-input" value={formData.referrer || ''} onChange={(e) => setFormData({ ...formData, referrer: e.target.value })} />
                            </div>

                            {/* Row 8 Status & Evaluation */}
                            <div className="form-group">
                                <label className="form-label">i. Trạng thái (*)</label>
                                <select className="form-select" value={formData.status || 'S1: Mới'} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                                    <option value="S1: Mới">S1: Mới tiếp nhận</option>
                                    <option value="S2: Phỏng vấn">S2: Đang phỏng vấn</option>
                                    <option value="S5: Trúng tuyển">S5: Trúng tuyển (Offer)</option>
                                    <option value="S7: Loại">S7: Loại / Không đạt</option>
                                    <option value="HIRED">HIRED - Đã thành nhân viên</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">j. Lý do bị loại</label>
                                <input type="text" className="form-input" value={formData.rejection_reason || ''} onChange={(e) => setFormData({ ...formData, rejection_reason: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">l. Ngày nhận hồ sơ</label>
                                <input type="date" className="form-input" value={formatDateForInput(formData.received_date)} onChange={(e) => setFormData({ ...formData, received_date: e.target.value })} />
                            </div>

                            {/* Row 9 Demand Info */}
                            <div className="form-group">
                                <label className="form-label">m. Tin tuyển dụng</label>
                                <input type="text" className="form-input" value={formData.request_code || ''} disabled />
                            </div>
                            <div className="form-group">
                                <label className="form-label">n. Vị trí dự tuyển</label>
                                <input type="text" className="form-input" value={formData.apply_position_name || ''} disabled />
                            </div>
                            <div className="form-group">
                                <label className="form-label">o. Bộ phận dự tuyển</label>
                                <input type="text" className="form-input" value={formData.department_name || ''} disabled />
                            </div>
                        </div>
                    </form>
                </Modal>
            )}

            {/* MODAL 3-TAB: HỒ SƠ ỨNG VIÊN */}
            {modalType === 'cand' && (
                <Modal
                    isOpen={true}
                    onClose={() => setModalType(null)}
                    title={candidateFormData.isEdit ? `Chỉnh sửa Hồ sơ Ứng viên: ${candidateFormData.candidate_code}` : "Tiếp nhận Hồ sơ Ứng viên Mới"}
                    maxWidth="900px"
                    footer={
                        <>
                            <button className="btn btn-secondary" onClick={() => setModalType(null)}>Hủy bỏ</button>
                            <button className="btn btn-primary" onClick={handleSaveCandidateSubmit} style={{ backgroundColor: 'var(--bravo-teal)' }}>
                                {candidateFormData.isEdit ? "Cập nhật Hồ sơ" : "Lưu Hồ sơ Ứng viên"}
                            </button>
                        </>
                    }
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* TABS NAVIGATION */}
                        <div style={{ display: 'flex', borderBottom: '2px solid #CBD5E1', gap: '0.5rem' }}>
                            <button
                                type="button"
                                className={`tab-item ${activeCandTab === 'info' ? 'active' : ''}`}
                                onClick={() => setActiveCandTab('info')}
                                style={{
                                    padding: '0.6rem 1.2rem',
                                    fontWeight: 700,
                                    fontSize: '0.875rem',
                                    border: 'none',
                                    backgroundColor: activeCandTab === 'info' ? 'var(--bravo-teal)' : '#F1F5F9',
                                    color: activeCandTab === 'info' ? '#FFFFFF' : '#475569',
                                    borderRadius: '6px 6px 0 0',
                                    cursor: 'pointer'
                                }}
                            >
                                1. Thông tin ứng viên
                            </button>

                            <button
                                type="button"
                                className={`tab-item ${activeCandTab === 'recruitment' ? 'active' : ''}`}
                                onClick={() => setActiveCandTab('recruitment')}
                                style={{
                                    padding: '0.6rem 1.2rem',
                                    fontWeight: 700,
                                    fontSize: '0.875rem',
                                    border: 'none',
                                    backgroundColor: activeCandTab === 'recruitment' ? 'var(--bravo-teal)' : '#F1F5F9',
                                    color: activeCandTab === 'recruitment' ? '#FFFFFF' : '#475569',
                                    borderRadius: '6px 6px 0 0',
                                    cursor: 'pointer'
                                }}
                            >
                                2. Thông tin tuyển dụng
                            </button>

                            <button
                                type="button"
                                className={`tab-item ${activeCandTab === 'attachments' ? 'active' : ''}`}
                                onClick={() => setActiveCandTab('attachments')}
                                style={{
                                    padding: '0.6rem 1.2rem',
                                    fontWeight: 700,
                                    fontSize: '0.875rem',
                                    border: 'none',
                                    backgroundColor: activeCandTab === 'attachments' ? 'var(--bravo-teal)' : '#F1F5F9',
                                    color: activeCandTab === 'attachments' ? '#FFFFFF' : '#475569',
                                    borderRadius: '6px 6px 0 0',
                                    cursor: 'pointer'
                                }}
                            >
                                3. Chi tiết hồ sơ đính kèm
                            </button>
                        </div>

                        {/* TAB CONTENT 1: THÔNG TIN ỨNG VIÊN */}
                        {activeCandTab === 'info' && (
                            <div style={{ backgroundColor: '#F8FAFC', padding: '1.25rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                    {/* Họ tên */}
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                        <label className="form-label" style={{ fontWeight: 700 }}>Họ và tên ứng viên (*)</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="Nhập họ và tên..."
                                            required
                                            value={candidateFormData.full_name}
                                            onChange={(e) => {
                                                const name = e.target.value;
                                                const code = candidateFormData.isEdit ? candidateFormData.candidate_code : generateCandidateCode(name);
                                                setCandidateFormData({ ...candidateFormData, full_name: name, candidate_code: code });
                                            }}
                                        />
                                    </div>

                                    {/* Mã ứng viên */}
                                    <div className="form-group">
                                        <label className="form-label" style={{ fontWeight: 700 }}>Mã ứng viên (UV-ShortName)</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={candidateFormData.candidate_code}
                                            onChange={(e) => setCandidateFormData({ ...candidateFormData, candidate_code: e.target.value })}
                                            style={{ fontWeight: 700, color: 'var(--bravo-teal-dark)' }}
                                        />
                                    </div>

                                    {/* Số CCCD */}
                                    <div className="form-group">
                                        <label className="form-label">Số CCCD (nếu có)</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="VD: 001201008899"
                                            value={candidateFormData.citizen_id}
                                            onChange={(e) => setCandidateFormData({ ...candidateFormData, citizen_id: e.target.value })}
                                        />
                                    </div>

                                    {/* Ngày sinh */}
                                    <div className="form-group">
                                        <label className="form-label">Ngày sinh</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={candidateFormData.date_of_birth}
                                            onChange={(e) => setCandidateFormData({ ...candidateFormData, date_of_birth: e.target.value })}
                                        />
                                    </div>

                                    {/* Giới tính */}
                                    <div className="form-group">
                                        <label className="form-label" style={{ fontWeight: 700 }}>Giới tính (*)</label>
                                        <select
                                            className="form-select"
                                            value={candidateFormData.gender}
                                            onChange={(e) => setCandidateFormData({ ...candidateFormData, gender: e.target.value })}
                                        >
                                            <option value="Nam">Nam</option>
                                            <option value="Nữ">Nữ</option>
                                        </select>
                                    </div>

                                    {/* SĐT */}
                                    <div className="form-group">
                                        <label className="form-label" style={{ fontWeight: 700 }}>Số điện thoại (*)</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="0912345678"
                                            value={candidateFormData.phone}
                                            onChange={(e) => setCandidateFormData({ ...candidateFormData, phone: e.target.value })}
                                        />
                                    </div>

                                    {/* Email */}
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                        <label className="form-label" style={{ fontWeight: 700 }}>Email (*)</label>
                                        <input
                                            type="email"
                                            className="form-input"
                                            placeholder="ungvien@gmail.com"
                                            value={candidateFormData.email}
                                            onChange={(e) => setCandidateFormData({ ...candidateFormData, email: e.target.value })}
                                        />
                                    </div>

                                    {/* Địa chỉ */}
                                    <div className="form-group" style={{ gridColumn: 'span 3' }}>
                                        <label className="form-label">Địa chỉ (Hiện tại)</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="Nhập địa chỉ tạm trú/thường trú..."
                                            value={candidateFormData.address}
                                            onChange={(e) => setCandidateFormData({ ...candidateFormData, address: e.target.value })}
                                        />
                                    </div>

                                    {/* Trình độ văn hóa */}
                                    <div className="form-group">
                                        <label className="form-label">Trình độ văn hóa</label>
                                        <select
                                            className="form-select"
                                            value={candidateFormData.culture_level}
                                            onChange={(e) => setCandidateFormData({ ...candidateFormData, culture_level: e.target.value })}
                                        >
                                            <option value="12/12">12/12</option>
                                            <option value="Đại học">Đại học</option>
                                            <option value="Thạc sĩ">Thạc sĩ</option>
                                            <option value="Tiến sĩ">Tiến sĩ</option>
                                        </select>
                                    </div>

                                    {/* Trình độ chuyên môn */}
                                    <div className="form-group">
                                        <label className="form-label">Trình độ chuyên môn</label>
                                        <select
                                            className="form-select"
                                            value={candidateFormData.education_level}
                                            onChange={(e) => setCandidateFormData({ ...candidateFormData, education_level: e.target.value })}
                                        >
                                            <option value="Cử nhân">Cử nhân</option>
                                            <option value="Kỹ sư">Kỹ sư</option>
                                            <option value="Thạc sĩ">Thạc sĩ</option>
                                            <option value="Cao đẳng">Cao đẳng</option>
                                            <option value="Trung cấp">Trung cấp</option>
                                        </select>
                                    </div>

                                    {/* Đơn vị đào tạo */}
                                    <div className="form-group">
                                        <label className="form-label">Đơn vị đào tạo</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="VD: ĐH Bách Khoa..."
                                            value={candidateFormData.education_school}
                                            onChange={(e) => setCandidateFormData({ ...candidateFormData, education_school: e.target.value })}
                                        />
                                    </div>

                                    {/* Ngành đào tạo */}
                                    <div className="form-group">
                                        <label className="form-label">Ngành đào tạo</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="VD: Công nghệ thông tin..."
                                            value={candidateFormData.major}
                                            onChange={(e) => setCandidateFormData({ ...candidateFormData, major: e.target.value })}
                                        />
                                    </div>

                                    {/* Nguồn tuyển dụng */}
                                    <div className="form-group">
                                        <label className="form-label">Nguồn tuyển dụng</label>
                                        <select
                                            className="form-select"
                                            value={candidateFormData.source}
                                            onChange={(e) => setCandidateFormData({ ...candidateFormData, source: e.target.value })}
                                        >
                                            <option value="TopCV">TopCV</option>
                                            <option value="LinkedIn">LinkedIn</option>
                                            <option value="Website BRAVO">Website BRAVO</option>
                                            <option value="MXH">MXH</option>
                                            <option value="Bạn bè giới thiệu">Bạn bè giới thiệu</option>
                                            <option value="Headhunter">Headhunter</option>
                                        </select>
                                    </div>

                                    {/* Người giới thiệu */}
                                    <div className="form-group">
                                        <label className="form-label">Người giới thiệu</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="Họ tên người giới thiệu..."
                                            value={candidateFormData.referrer}
                                            onChange={(e) => setCandidateFormData({ ...candidateFormData, referrer: e.target.value })}
                                        />
                                    </div>

                                    {/* Kinh nghiệm */}
                                    <div className="form-group" style={{ gridColumn: 'span 3' }}>
                                        <label className="form-label">Kinh nghiệm làm việc</label>
                                        <textarea
                                            className="form-textarea"
                                            rows={2}
                                            placeholder="Tóm tắt kinh nghiệm làm việc trước đây..."
                                            value={candidateFormData.experience}
                                            onChange={(e) => setCandidateFormData({ ...candidateFormData, experience: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB CONTENT 2: THÔNG TIN TUYỂN DỤNG */}
                        {activeCandTab === 'recruitment' && (
                            <div style={{ backgroundColor: '#F8FAFC', padding: '1.25rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                                    {/* Trạng thái */}
                                    <div className="form-group">
                                        <label className="form-label" style={{ fontWeight: 700 }}>Trạng thái hồ sơ (*)</label>
                                        <select
                                            className="form-select"
                                            value={candidateFormData.status}
                                            onChange={(e) => setCandidateFormData({ ...candidateFormData, status: e.target.value })}
                                            style={{ fontWeight: 700, color: 'var(--bravo-teal-dark)' }}
                                        >
                                            <option value="Đã tiếp nhận hồ sơ">Đã tiếp nhận hồ sơ</option>
                                            <option value="Đã sơ loại">Đã sơ loại</option>
                                            <option value="Đã phỏng vấn">Đã phỏng vấn</option>
                                            <option value="Đã trao đổi offer">Đã trao đổi offer</option>
                                            <option value="Đi làm">Đi làm</option>
                                            <option value="Loại">Loại</option>
                                            <option value="Đã gửi kết quả vòng tuyển dụng">Đã gửi kết quả vòng tuyển dụng</option>
                                        </select>
                                    </div>

                                    {/* Ngày nhận hồ sơ */}
                                    <div className="form-group">
                                        <label className="form-label" style={{ fontWeight: 700 }}>Ngày nhận hồ sơ (*)</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={candidateFormData.received_date}
                                            onChange={(e) => setCandidateFormData({ ...candidateFormData, received_date: e.target.value })}
                                            required
                                        />
                                    </div>

                                    {/* Tin tuyển dụng */}
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                        <label className="form-label" style={{ fontWeight: 700 }}>Tin tuyển dụng (*)</label>
                                        <select
                                            className="form-select"
                                            value={candidateFormData.recruitment_plan_id}
                                            onChange={(e) => {
                                                const pId = e.target.value;
                                                const plan = plans.find(p => p.recruitment_plan_id === pId);
                                                setCandidateFormData({
                                                    ...candidateFormData,
                                                    recruitment_plan_id: pId,
                                                    position_id: plan?.position_id || candidateFormData.position_id
                                                });
                                            }}
                                        >
                                            {plans.map((p) => (
                                                <option key={p.recruitment_plan_id} value={p.recruitment_plan_id}>
                                                    {p.plan_name} ({p.request_code || 'Tin đợt tuyển dụng'})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Vị trí dự tuyển */}
                                    <div className="form-group">
                                        <label className="form-label" style={{ fontWeight: 700 }}>Vị trí ứng tuyển (*)</label>
                                        <select
                                            className="form-select"
                                            value={candidateFormData.position_id}
                                            onChange={(e) => setCandidateFormData({ ...candidateFormData, position_id: e.target.value })}
                                        >
                                            {positions.map((pos) => (
                                                <option key={pos.position_id} value={pos.position_id}>
                                                    {pos.position_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Bộ phận tuyển dụng (Auto-binding according to Position) */}
                                    <div className="form-group">
                                        <label className="form-label">Bộ phận tương ứng</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={positions.find(p => p.position_id === candidateFormData.position_id)?.department_name || departments[0]?.department_name || '—'}
                                            readOnly
                                            disabled
                                            style={{ backgroundColor: '#F1F5F9', color: '#475569', fontWeight: 600 }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB CONTENT 3: CHI TIẾT HỒ SƠ ĐÍNH KÈM */}
                        {activeCandTab === 'attachments' && (
                            <div style={{ backgroundColor: '#F8FAFC', padding: '1.25rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F172A' }}>Danh sách tài liệu & Hồ sơ đính kèm:</span>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={handleAddAttachmentRow}
                                        style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', color: 'var(--bravo-teal-dark)', borderColor: 'var(--bravo-teal)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                                    >
                                        <Plus size={14} />
                                        <span>Thêm dòng hồ sơ</span>
                                    </button>
                                </div>

                                <div style={{ overflowX: 'auto' }}>
                                    <table className="erp-table" style={{ width: '100%', backgroundColor: '#FFFFFF' }}>
                                        <thead>
                                            <tr>
                                                <th style={{ width: '40px', textAlign: 'center', whiteSpace: 'nowrap' }}>STT</th>
                                                <th style={{ minWidth: '140px', whiteSpace: 'nowrap' }}>Loại hồ sơ</th>
                                                <th style={{ minWidth: '160px', whiteSpace: 'nowrap' }}>Tên hồ sơ</th>
                                                <th style={{ width: '80px', textAlign: 'center', whiteSpace: 'nowrap' }}>Bắt buộc</th>
                                                <th style={{ minWidth: '140px', whiteSpace: 'nowrap' }}>Mô tả</th>
                                                <th style={{ minWidth: '120px', whiteSpace: 'nowrap' }}>Ghi chú</th>
                                                <th style={{ minWidth: '160px', whiteSpace: 'nowrap' }}>File đính kèm</th>
                                                <th style={{ width: '60px', textAlign: 'center', whiteSpace: 'nowrap' }}>Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(candidateFormData.attachments_json || []).length === 0 ? (
                                                <tr>
                                                    <td colSpan={8} style={{ textAlign: 'center', padding: '1.25rem', color: '#94A3B8', fontSize: '0.85rem' }}>
                                                        Chưa có tệp đính kèm. Bấm "+ Thêm dòng hồ sơ" để bổ sung CV hoặc Sơ yếu lý lịch.
                                                    </td>
                                                </tr>
                                            ) : (
                                                candidateFormData.attachments_json.map((att, idx) => (
                                                    <tr key={idx}>
                                                        <td style={{ textAlign: 'center', fontWeight: 700 }}>{idx + 1}</td>

                                                        {/* Loại hồ sơ */}
                                                        <td>
                                                            <select
                                                                className="form-select"
                                                                value={att.doc_type || 'CV'}
                                                                onChange={(e) => handleAttachmentChange(idx, 'doc_type', e.target.value)}
                                                                style={{ padding: '0.3rem 0.5rem', fontSize: '0.825rem' }}
                                                            >
                                                                <option value="CV">CV</option>
                                                                <option value="Sơ yếu lý lịch">Sơ yếu lý lịch</option>
                                                                <option value="Bằng cấp/Chứng chỉ">Bằng cấp/Chứng chỉ</option>
                                                                <option value="Bảng điểm">Bảng điểm</option>
                                                                <option value="Giấy khám sức khỏe">Giấy khám sức khỏe</option>
                                                                <option value="Khác">Khác</option>
                                                            </select>
                                                        </td>

                                                        {/* Tên hồ sơ */}
                                                        <td>
                                                            <input
                                                                type="text"
                                                                className="form-input"
                                                                placeholder="Tên hồ sơ..."
                                                                value={att.doc_name || ''}
                                                                onChange={(e) => handleAttachmentChange(idx, 'doc_name', e.target.value)}
                                                                style={{ padding: '0.3rem 0.5rem', fontSize: '0.825rem' }}
                                                            />
                                                        </td>

                                                        {/* Bắt buộc */}
                                                        <td style={{ textAlign: 'center' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={!!att.is_required}
                                                                onChange={(e) => handleAttachmentChange(idx, 'is_required', e.target.checked)}
                                                                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                                            />
                                                        </td>

                                                        {/* Mô tả */}
                                                        <td>
                                                            <input
                                                                type="text"
                                                                className="form-input"
                                                                placeholder="Mô tả..."
                                                                value={att.description || ''}
                                                                onChange={(e) => handleAttachmentChange(idx, 'description', e.target.value)}
                                                                style={{ padding: '0.3rem 0.5rem', fontSize: '0.825rem' }}
                                                            />
                                                        </td>

                                                        {/* Ghi chú */}
                                                        <td>
                                                            <input
                                                                type="text"
                                                                className="form-input"
                                                                placeholder="Ghi chú..."
                                                                value={att.note || ''}
                                                                onChange={(e) => handleAttachmentChange(idx, 'note', e.target.value)}
                                                                style={{ padding: '0.3rem 0.5rem', fontSize: '0.825rem' }}
                                                            />
                                                        </td>

                                                        {/* File đính kèm */}
                                                        <td>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                                <input
                                                                    type="file"
                                                                    id={`att-file-${idx}`}
                                                                    style={{ display: 'none' }}
                                                                    onChange={(e) => {
                                                                        const file = e.target.files[0];
                                                                        if (file) {
                                                                            handleAttachmentChange(idx, 'file_name', file.name);
                                                                            handleAttachmentChange(idx, 'doc_name', att.doc_name || file.name);
                                                                        }
                                                                    }}
                                                                />
                                                                <label
                                                                    htmlFor={`att-file-${idx}`}
                                                                    className="btn btn-secondary"
                                                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                                                                >
                                                                    <span>Tải file lên</span>
                                                                </label>
                                                                <span style={{ fontSize: '0.775rem', color: '#0F172A', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100px' }}>
                                                                    {att.file_name || 'Chưa chọn file'}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        {/* Thao tác */}
                                                        <td style={{ textAlign: 'center' }}>
                                                            <button
                                                                type="button"
                                                                className="btn btn-secondary"
                                                                onClick={() => handleRemoveAttachmentRow(idx)}
                                                                style={{ padding: '0.25rem', color: '#EF4444', borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' }}
                                                                title="Xóa hồ sơ"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </Modal>
            )}

            {/* MODAL THÊM MỚI / CHỈNH SỬA LỊCH PHỎNG VẤN - THI TUYỂN */}
            {modalType === 'interview_schedule' && (
                <Modal
                    isOpen={true}
                    onClose={() => setModalType(null)}
                    title={isEditingSchedule ? "Chỉnh sửa Lịch phỏng vấn - thi tuyển" : "Thêm mới Lịch phỏng vấn - thi tuyển"}
                    width="950px"
                    footer={
                        <>
                            <button type="button" className="btn btn-secondary" onClick={() => setModalType(null)}>Hủy</button>
                            <button type="button" className="btn btn-primary" onClick={handleSaveSchedule} style={{ backgroundColor: 'var(--bravo-teal)' }}>
                                {isEditingSchedule ? 'Cập nhật Lịch' : 'Lưu Lịch'}
                            </button>
                        </>
                    }
                >
                    <form onSubmit={handleSaveSchedule} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {/* 1. THÔNG TIN CHUNG LỊCH PHỎNG VẤN - THI TUYỂN */}
                        <div style={{ backgroundColor: '#F8FAFC', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.85rem', color: 'var(--bravo-teal-dark)', fontWeight: 800, fontSize: '0.9rem', borderBottom: '1px solid #CBD5E1', paddingBottom: '0.4rem' }}>
                                <Calendar size={16} />
                                <span>1. THÔNG TIN CHUNG LỊCH PHỎNG VẤN - THI TUYỂN</span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                {/* Ngày lập */}
                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: 700 }}>Ngày lập (*)</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={scheduleFormData.created_date}
                                        onChange={(e) => setScheduleFormData({ ...scheduleFormData, created_date: e.target.value })}
                                        required
                                    />
                                </div>

                                {/* Lịch số: PVTT/26-000 */}
                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: 700 }}>Lịch số (*)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={scheduleFormData.schedule_code}
                                        onChange={(e) => setScheduleFormData({ ...scheduleFormData, schedule_code: e.target.value })}
                                        placeholder="VD: PVTT/26-001"
                                        style={{ backgroundColor: '#F1F5F9', color: 'var(--bravo-teal-dark)', fontWeight: 800 }}
                                        required
                                    />
                                </div>

                                {/* Vòng tuyển dụng */}
                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: 700 }}>Vòng tuyển dụng (*)</label>
                                    <select
                                        className="form-select"
                                        value={scheduleFormData.round_type}
                                        onChange={(e) => setScheduleFormData({ ...scheduleFormData, round_type: e.target.value })}
                                        style={{ fontWeight: 700 }}
                                    >
                                        <option value="Vòng phỏng vấn">Vòng phỏng vấn</option>
                                        <option value="Vòng thi tuyển">Vòng thi tuyển</option>
                                    </select>
                                </div>

                                {/* Hình thức */}
                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: 700 }}>Hình thức (*)</label>
                                    <select
                                        className="form-select"
                                        value={scheduleFormData.format_type}
                                        onChange={(e) => setScheduleFormData({ ...scheduleFormData, format_type: e.target.value })}
                                        style={{ fontWeight: 700 }}
                                    >
                                        <option value="Offline">Offline</option>
                                        <option value="Online">Online</option>
                                    </select>
                                </div>

                                {/* Địa điểm */}
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label className="form-label" style={{ fontWeight: 700 }}>Địa điểm tổ chức / Link họp (*)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={scheduleFormData.location}
                                        onChange={(e) => setScheduleFormData({ ...scheduleFormData, location: e.target.value })}
                                        placeholder="Nhập phòng họp (với Offline) hoặc link Zoom/Google Meet (với Online)..."
                                        required
                                    />
                                </div>

                                {/* Thời gian bắt đầu */}
                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: 700 }}>Thời gian bắt đầu (*)</label>
                                    <input
                                        type="datetime-local"
                                        className="form-input"
                                        value={scheduleFormData.start_time}
                                        onChange={(e) => setScheduleFormData({ ...scheduleFormData, start_time: e.target.value })}
                                        required
                                    />
                                </div>

                                {/* Thời gian kết thúc */}
                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: 700 }}>Thời gian kết thúc (*)</label>
                                    <input
                                        type="datetime-local"
                                        className="form-input"
                                        value={scheduleFormData.end_time}
                                        onChange={(e) => setScheduleFormData({ ...scheduleFormData, end_time: e.target.value })}
                                        required
                                    />
                                </div>

                                {/* Ghi chú khác */}
                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: 700 }}>Ghi chú khác</label>
                                    <textarea
                                        className="form-input"
                                        rows={2}
                                        value={scheduleFormData.note}
                                        onChange={(e) => setScheduleFormData({ ...scheduleFormData, note: e.target.value })}
                                        placeholder="Ghi chú nội bộ cho buổi phỏng vấn / thi tuyển..."
                                        style={{ resize: 'vertical' }}
                                    />
                                </div>

                                {/* Lưu ý cho ứng viên */}
                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: 700 }}>Lưu ý cho ứng viên</label>
                                    <textarea
                                        className="form-input"
                                        rows={2}
                                        value={scheduleFormData.candidate_note}
                                        onChange={(e) => setScheduleFormData({ ...scheduleFormData, candidate_note: e.target.value })}
                                        placeholder="Nội dung nhắc nhở ứng viên trước khi tham gia..."
                                        style={{ resize: 'vertical' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 2. CÁC TAB DANH SÁCH CHI TIẾT */}
                        <div style={{ backgroundColor: '#F8FAFC', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                            {/* Tab Navigation Header */}
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '2px solid #E2E8F0', paddingBottom: '0.5rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setScheduleModalTab('candidates')}
                                    className={`btn ${scheduleModalTab === 'candidates' ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{ fontSize: '0.825rem', padding: '0.4rem 0.85rem', fontWeight: 700, backgroundColor: scheduleModalTab === 'candidates' ? 'var(--bravo-teal)' : '#FFFFFF' }}
                                >
                                    <Users size={15} style={{ marginRight: '0.35rem' }} />
                                    Tab Danh sách ứng viên ({scheduleCandidates.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setScheduleModalTab('council')}
                                    className={`btn ${scheduleModalTab === 'council' ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{ fontSize: '0.825rem', padding: '0.4rem 0.85rem', fontWeight: 700, backgroundColor: scheduleModalTab === 'council' ? 'var(--bravo-teal)' : '#FFFFFF' }}
                                >
                                    <UserCheck size={15} style={{ marginRight: '0.35rem' }} />
                                    Tab Hội đồng tuyển dụng ({scheduleCouncil.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setScheduleModalTab('tests')}
                                    className={`btn ${scheduleModalTab === 'tests' ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{ fontSize: '0.825rem', padding: '0.4rem 0.85rem', fontWeight: 700, backgroundColor: scheduleModalTab === 'tests' ? 'var(--bravo-teal)' : '#FFFFFF' }}
                                >
                                    <FileText size={15} style={{ marginRight: '0.35rem' }} />
                                    Tab Chi tiết bài thi ({scheduleTests.length})
                                </button>
                            </div>

                            {/* TAB 1: DANH SÁCH ỨNG VIÊN */}
                            {scheduleModalTab === 'candidates' && (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                                            Ứng viên tham gia lịch phỏng vấn / thi tuyển:
                                        </span>
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            onClick={handleAddScheduleCandidateRow}
                                            style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', backgroundColor: 'var(--bravo-teal)' }}
                                        >
                                            <Plus size={14} />
                                            <span>Thêm ứng viên</span>
                                        </button>
                                    </div>

                                    <div style={{ overflowX: 'auto', backgroundColor: '#FFFFFF', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
                                        <table className="erp-table" style={{ width: '100%', minWidth: '750px' }}>
                                            <thead>
                                                <tr style={{ backgroundColor: '#F8FAFC' }}>
                                                    <th style={{ width: '50px', textAlign: 'center', whiteSpace: 'nowrap' }}>STT</th>
                                                    <th style={{ width: '180px', whiteSpace: 'nowrap' }}>MÃ HỒ SƠ</th>
                                                    <th style={{ minWidth: '180px', whiteSpace: 'nowrap' }}>TÊN ỨNG VIÊN</th>
                                                    <th style={{ minWidth: '180px', whiteSpace: 'nowrap' }}>VỊ TRÍ ỨNG TUYỂN</th>
                                                    <th style={{ minWidth: '150px', whiteSpace: 'nowrap' }}>GHI CHÚ</th>
                                                    <th style={{ width: '55px', textAlign: 'center', whiteSpace: 'nowrap' }}>XÓA</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {scheduleCandidates.map((row, idx) => (
                                                    <tr key={row.id || idx}>
                                                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{idx + 1}</td>
                                                        <td>
                                                            <select
                                                                className="form-select"
                                                                value={row.candidate_id || ''}
                                                                onChange={(e) => handleScheduleCandidateCodeChange(idx, e.target.value)}
                                                                style={{ fontSize: '0.825rem', padding: '0.3rem 0.4rem' }}
                                                            >
                                                                <option value="">-- Chọn mã ứng viên --</option>
                                                                {candidates.map(c => (
                                                                    <option key={c.candidate_id || c.id} value={c.candidate_id || c.id}>
                                                                        {c.candidate_code} - {c.full_name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td style={{ fontWeight: 700, color: 'var(--bravo-teal-dark)', whiteSpace: 'nowrap' }}>
                                                            {row.full_name || '—'}
                                                        </td>
                                                        <td style={{ fontWeight: 600, color: '#0369A1', whiteSpace: 'nowrap' }}>
                                                            {row.apply_position_name || '—'}
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="text"
                                                                className="form-input"
                                                                value={row.note || ''}
                                                                onChange={(e) => handleScheduleCandidateFieldChange(idx, 'note', e.target.value)}
                                                                placeholder="Ghi chú ứng viên..."
                                                                style={{ padding: '0.3rem 0.5rem', fontSize: '0.825rem' }}
                                                            />
                                                        </td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            <button
                                                                type="button"
                                                                className="btn btn-secondary"
                                                                onClick={() => handleRemoveScheduleCandidateRow(idx)}
                                                                style={{ padding: '0.25rem 0.45rem', color: '#EF4444', borderColor: '#FCA5A5' }}
                                                                disabled={scheduleCandidates.length <= 1}
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: HỘI ĐỒNG TUYỂN DỤNG */}
                            {scheduleModalTab === 'council' && (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                                            Thành viên Hội đồng phỏng vấn / thi tuyển:
                                        </span>
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            onClick={handleAddScheduleCouncilRow}
                                            style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', backgroundColor: 'var(--bravo-teal)' }}
                                        >
                                            <Plus size={14} />
                                            <span>Thêm người phỏng vấn</span>
                                        </button>
                                    </div>

                                    <div style={{ overflowX: 'auto', backgroundColor: '#FFFFFF', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
                                        <table className="erp-table" style={{ width: '100%', minWidth: '750px' }}>
                                            <thead>
                                                <tr style={{ backgroundColor: '#F8FAFC' }}>
                                                    <th style={{ width: '50px', textAlign: 'center', whiteSpace: 'nowrap' }}>STT</th>
                                                    <th style={{ width: '180px', whiteSpace: 'nowrap' }}>MÃ NHÂN VIÊN</th>
                                                    <th style={{ minWidth: '180px', whiteSpace: 'nowrap' }}>HỌ TÊN</th>
                                                    <th style={{ minWidth: '180px', whiteSpace: 'nowrap' }}>VỊ TRÍ / BỘ PHẬN</th>
                                                    <th style={{ width: '140px', textAlign: 'center', whiteSpace: 'nowrap' }}>NGƯỜI QUYẾT ĐỊNH</th>
                                                    <th style={{ width: '55px', textAlign: 'center', whiteSpace: 'nowrap' }}>XÓA</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {scheduleCouncil.map((row, idx) => (
                                                    <tr key={row.id || idx}>
                                                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{idx + 1}</td>
                                                        <td>
                                                            <select
                                                                className="form-select"
                                                                value={row.employee_id || ''}
                                                                onChange={(e) => handleScheduleCouncilEmployeeChange(idx, e.target.value)}
                                                                style={{ fontSize: '0.825rem', padding: '0.3rem 0.4rem' }}
                                                            >
                                                                <option value="">-- Chọn mã nhân viên --</option>
                                                                {employees.map(emp => (
                                                                    <option key={emp.employee_id || emp.id} value={emp.employee_id || emp.id}>
                                                                        {emp.employee_code || emp.code} - {emp.full_name || emp.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td style={{ fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap' }}>
                                                            {row.full_name || '—'}
                                                        </td>
                                                        <td style={{ fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>
                                                            {row.position_name || '—'}
                                                        </td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={row.is_decision_maker === 1 || row.is_decision_maker === true}
                                                                onChange={(e) => handleScheduleCouncilFieldChange(idx, 'is_decision_maker', e.target.checked ? 1 : 0)}
                                                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                                            />
                                                        </td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            <button
                                                                type="button"
                                                                className="btn btn-secondary"
                                                                onClick={() => handleRemoveScheduleCouncilRow(idx)}
                                                                style={{ padding: '0.25rem 0.45rem', color: '#EF4444', borderColor: '#FCA5A5' }}
                                                                disabled={scheduleCouncil.length <= 1}
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: CHI TIẾT BÀI THI */}
                            {scheduleModalTab === 'tests' && (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                                            Chi tiết bài thi & Tài liệu thi tuyển:
                                        </span>
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            onClick={handleAddScheduleTestRow}
                                            style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', backgroundColor: 'var(--bravo-teal)' }}
                                        >
                                            <Plus size={14} />
                                            <span>Thêm bài thi</span>
                                        </button>
                                    </div>

                                    <div style={{ overflowX: 'auto', backgroundColor: '#FFFFFF', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
                                        <table className="erp-table" style={{ width: '100%', minWidth: '800px' }}>
                                            <thead>
                                                <tr style={{ backgroundColor: '#F8FAFC' }}>
                                                    <th style={{ width: '50px', textAlign: 'center', whiteSpace: 'nowrap' }}>STT</th>
                                                    <th style={{ minWidth: '200px', whiteSpace: 'nowrap' }}>TÊN BÀI THI</th>
                                                    <th style={{ width: '120px', textAlign: 'center', whiteSpace: 'nowrap' }}>ĐIỂM KỲ VỌNG</th>
                                                    <th style={{ width: '140px', textAlign: 'center', whiteSpace: 'nowrap' }}>THỜI LƯỢNG (PHÚT)</th>
                                                    <th style={{ minWidth: '160px', whiteSpace: 'nowrap' }}>ĐỀ THI (TẢI FILE)</th>
                                                    <th style={{ minWidth: '160px', whiteSpace: 'nowrap' }}>ĐÁP ÁN (TẢI FILE)</th>
                                                    <th style={{ width: '55px', textAlign: 'center', whiteSpace: 'nowrap' }}>XÓA</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {scheduleTests.map((row, idx) => (
                                                    <tr key={row.id || idx}>
                                                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{idx + 1}</td>
                                                        <td>
                                                            <input
                                                                type="text"
                                                                className="form-input"
                                                                value={row.test_name || ''}
                                                                onChange={(e) => handleScheduleTestFieldChange(idx, 'test_name', e.target.value)}
                                                                placeholder="Tên bài thi (VD: Bài thi Logic & ERP)..."
                                                                style={{ padding: '0.3rem 0.5rem', fontSize: '0.825rem', fontWeight: 700 }}
                                                            />
                                                        </td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                max={100}
                                                                className="form-input"
                                                                value={row.expected_score || 75}
                                                                onChange={(e) => handleScheduleTestFieldChange(idx, 'expected_score', parseInt(e.target.value) || 0)}
                                                                style={{ textAlign: 'center', padding: '0.3rem 0.4rem', fontSize: '0.85rem', fontWeight: 700 }}
                                                            />
                                                        </td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            <input
                                                                type="number"
                                                                min={5}
                                                                className="form-input"
                                                                value={row.duration_minutes || 60}
                                                                onChange={(e) => handleScheduleTestFieldChange(idx, 'duration_minutes', parseInt(e.target.value) || 30)}
                                                                style={{ textAlign: 'center', padding: '0.3rem 0.4rem', fontSize: '0.85rem', fontWeight: 700 }}
                                                            />
                                                        </td>
                                                        <td>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                                <input
                                                                    type="file"
                                                                    id={`exam-file-${idx}`}
                                                                    style={{ display: 'none' }}
                                                                    onChange={(e) => {
                                                                        const file = e.target.files[0];
                                                                        if (file) handleScheduleTestFieldChange(idx, 'exam_file_name', file.name);
                                                                    }}
                                                                />
                                                                <label
                                                                    htmlFor={`exam-file-${idx}`}
                                                                    className="btn btn-secondary"
                                                                    style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                                                                >
                                                                    <Upload size={12} />
                                                                    <span>Đề thi</span>
                                                                </label>
                                                                <span style={{ fontSize: '0.75rem', color: '#0F172A', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100px' }}>
                                                                    {row.exam_file_name || row.exam_file || 'Chưa chọn file'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                                <input
                                                                    type="file"
                                                                    id={`answer-file-${idx}`}
                                                                    style={{ display: 'none' }}
                                                                    onChange={(e) => {
                                                                        const file = e.target.files[0];
                                                                        if (file) handleScheduleTestFieldChange(idx, 'answer_file_name', file.name);
                                                                    }}
                                                                />
                                                                <label
                                                                    htmlFor={`answer-file-${idx}`}
                                                                    className="btn btn-secondary"
                                                                    style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                                                                >
                                                                    <Upload size={12} />
                                                                    <span>Đáp án</span>
                                                                </label>
                                                                <span style={{ fontSize: '0.75rem', color: '#0F172A', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100px' }}>
                                                                    {row.answer_file_name || row.answer_file || 'Chưa chọn file'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            <button
                                                                type="button"
                                                                className="btn btn-secondary"
                                                                onClick={() => handleRemoveScheduleTestRow(idx)}
                                                                style={{ padding: '0.25rem 0.45rem', color: '#EF4444', borderColor: '#FCA5A5' }}
                                                                disabled={scheduleTests.length <= 1}
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </form>
                </Modal>
            )}

            {/* MODAL THÊM MỚI / CHỈNH SỬA YÊU CẦU TUYỂN DỤNG */}
            {modalType === 'req' && (
                <Modal
                    isOpen={true}
                    onClose={() => setModalType(null)}
                    title={isEditingRequest ? "Chỉnh sửa Yêu cầu Tuyển dụng" : "Thêm mới Yêu cầu Tuyển dụng"}
                    width="900px"
                    footer={
                        <>
                            <button type="button" className="btn btn-secondary" onClick={() => setModalType(null)}>Hủy</button>
                            <button type="button" className="btn btn-primary" onClick={handleSaveRequest} style={{ backgroundColor: 'var(--bravo-teal)' }}>
                                {isEditingRequest ? 'Cập nhật Yêu cầu' : 'Tạo Yêu cầu'}
                            </button>
                        </>
                    }
                >
                    <form onSubmit={handleSaveRequest} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {/* THÔNG TIN CHUNG YÊU CẦU TUYỂN DỤNG */}
                        <div style={{ backgroundColor: '#F8FAFC', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.85rem', color: 'var(--bravo-teal-dark)', fontWeight: 800, fontSize: '0.9rem', borderBottom: '1px solid #CBD5E1', paddingBottom: '0.4rem' }}>
                                <FileText size={16} />
                                <span>1. THÔNG TIN CHUNG YÊU CẦU TUYỂN DỤNG</span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                {/* Ngày lập phiếu */}
                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: 700 }}>Ngày lập phiếu (*)</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={requestFormData.request_date}
                                        onChange={(e) => setRequestFormData({ ...requestFormData, request_date: e.target.value })}
                                        required
                                    />
                                </div>

                                {/* Số phiếu YCTD/yy-000 */}
                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: 700 }}>Số phiếu</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={requestFormData.request_code}
                                        onChange={(e) => setRequestFormData({ ...requestFormData, request_code: e.target.value })}
                                        placeholder="VD: YCTD/26-001"
                                        style={{ backgroundColor: '#F1F5F9', color: 'var(--bravo-teal-dark)', fontWeight: 800 }}
                                    />
                                </div>

                                {/* Loại yêu cầu: Trong định biên / Ngoài định biên */}
                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: 700 }}>Loại yêu cầu (*)</label>
                                    <select
                                        className="form-select"
                                        value={requestFormData.is_outside_headcount}
                                        onChange={(e) => setRequestFormData({ ...requestFormData, is_outside_headcount: Number(e.target.value) })}
                                        style={{ fontWeight: 700 }}
                                    >
                                        <option value={0}>Trong định biên</option>
                                        <option value={1}>Ngoài định biên</option>
                                    </select>
                                </div>

                                {/* Người lập: chọn từ hồ sơ nhân sự */}
                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: 700 }}>Người lập (*)</label>
                                    <select
                                        className="form-select"
                                        value={requestFormData.requested_by || ''}
                                        onChange={(e) => handleRequestedByChange(e.target.value)}
                                        required
                                    >
                                        <option value="">-- Chọn Người lập (Hồ sơ nhân sự) --</option>
                                        {employees.map(emp => (
                                            <option key={emp.employee_id || emp.id} value={emp.employee_id || emp.id}>
                                                {emp.employee_code || emp.code} - {emp.full_name || emp.name} ({emp.position_name || 'Nhân sự'})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Bộ phận: Tự động binding theo dữ liệu người lập */}
                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: 700 }}>
                                        Bộ phận (*)
                                    </label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={requestFormData.department_name || ''}
                                        disabled
                                        readOnly
                                        style={{ backgroundColor: '#F1F5F9', color: '#0F172A', fontWeight: 800, cursor: 'not-allowed' }}
                                    />
                                </div>

                                {/* Lý do cần tuyển */}
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label className="form-label" style={{ fontWeight: 700 }}>Lý do cần tuyển (*)</label>
                                    <textarea
                                        className="form-input"
                                        rows={2}
                                        value={requestFormData.reason}
                                        onChange={(e) => setRequestFormData({ ...requestFormData, reason: e.target.value })}
                                        placeholder="Nhập lý do nhu cầu tuyển dụng nhân sự..."
                                        required
                                        style={{ resize: 'vertical' }}
                                    />
                                </div>

                                {/* Ghi chú nội bộ */}
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label className="form-label" style={{ fontWeight: 700 }}>Ghi chú nội bộ</label>
                                    <textarea
                                        className="form-input"
                                        rows={2}
                                        value={requestFormData.internal_note}
                                        onChange={(e) => setRequestFormData({ ...requestFormData, internal_note: e.target.value })}
                                        placeholder="Nhập ghi chú nội bộ (nếu có)..."
                                        style={{ resize: 'vertical' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* TAB CHI TIẾT VỊ TRÍ */}
                        <div style={{ backgroundColor: '#F8FAFC', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', borderBottom: '1px solid #CBD5E1', paddingBottom: '0.4rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--bravo-teal-dark)', fontWeight: 800, fontSize: '0.9rem' }}>
                                    <Users size={16} />
                                    <span>2. CHI TIẾT VỊ TRÍ CẦN TUYỂN</span>
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleAddPositionDetailRow}
                                    style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', backgroundColor: 'var(--bravo-teal)' }}
                                >
                                    <Plus size={14} />
                                    <span>Thêm vị trí</span>
                                </button>
                            </div>

                            <div style={{ overflowX: 'auto', backgroundColor: '#FFFFFF', borderRadius: '6px', border: '1px solid #CBD5E1', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                <table className="erp-table" style={{ width: '100%', minWidth: '850px', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#F8FAFC' }}>
                                            <th style={{ width: '50px', textAlign: 'center', whiteSpace: 'nowrap' }}>STT</th>
                                            <th style={{ width: '170px', whiteSpace: 'nowrap' }}>MÃ VỊ TRÍ</th>
                                            <th style={{ minWidth: '180px', whiteSpace: 'nowrap' }}>TÊN VỊ TRÍ</th>
                                            <th style={{ textAlign: 'center', width: '130px', whiteSpace: 'nowrap' }}>SỐ LƯỢNG CẦN TUYỂN</th>
                                            <th style={{ textAlign: 'center', width: '140px', whiteSpace: 'nowrap' }}>NGÀY CẦN NGƯỜI</th>
                                            <th style={{ minWidth: '150px', whiteSpace: 'nowrap' }}>GHI CHÚ</th>
                                            <th style={{ width: '55px', textAlign: 'center', whiteSpace: 'nowrap' }}>XÓA</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {requestPositionDetails.map((row, idx) => (
                                            <tr key={row.id || idx}>
                                                <td style={{ textAlign: 'center', fontWeight: 600 }}>{idx + 1}</td>
                                                <td>
                                                    <select
                                                        className="form-select"
                                                        value={row.position_id || ''}
                                                        onChange={(e) => handlePositionDetailCodeChange(idx, e.target.value)}
                                                        style={{ fontSize: '0.825rem', padding: '0.3rem 0.4rem', width: '100%', borderRadius: '6px' }}
                                                    >
                                                        <option value="">-- Chọn mã vị trí --</option>
                                                        {positions.map(p => (
                                                            <option key={p.position_id} value={p.position_id}>
                                                                {p.position_code} ({p.position_name})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td style={{ fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap', color: 'var(--bravo-teal-dark)' }}>
                                                    {row.position_name || '—'}
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        className="form-input"
                                                        value={row.quantity || 1}
                                                        onChange={(e) => handlePositionDetailFieldChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                                                        style={{ textAlign: 'center', padding: '0.3rem 0.4rem', fontSize: '0.85rem', fontWeight: 700, borderRadius: '6px' }}
                                                    />
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <input
                                                        type="date"
                                                        className="form-input"
                                                        value={row.expected_date || ''}
                                                        onChange={(e) => handlePositionDetailFieldChange(idx, 'expected_date', e.target.value)}
                                                        style={{ fontSize: '0.825rem', padding: '0.3rem 0.4rem', borderRadius: '6px' }}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        value={row.note || ''}
                                                        onChange={(e) => handlePositionDetailFieldChange(idx, 'note', e.target.value)}
                                                        placeholder="Nhập ghi chú vị trí..."
                                                        style={{ padding: '0.3rem 0.5rem', fontSize: '0.825rem', width: '100%', borderRadius: '6px' }}
                                                    />
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <button
                                                        type="button"
                                                        className="btn btn-secondary"
                                                        onClick={() => handleRemovePositionDetailRow(idx)}
                                                        style={{ padding: '0.25rem 0.45rem', color: '#EF4444', borderColor: '#FCA5A5', borderRadius: '6px' }}
                                                        title="Xóa vị trí"
                                                        disabled={requestPositionDetails.length <= 1}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </form>
                </Modal>
            )}

            {/* MODAL LẬP KẾ HOẠCH TUYỂN DỤNG */}
            {modalType === 'plan' && (
                <Modal
                    isOpen={true}
                    onClose={() => setModalType(null)}
                    title="Lập Kế hoạch Tuyển dụng"
                    footer={
                        <>
                            <button className="btn btn-secondary" onClick={() => setModalType(null)}>Hủy</button>
                            <button className="btn btn-primary" onClick={handleCreatePlan}>Tạo Kế hoạch</button>
                        </>
                    }
                >
                    <form onSubmit={handleCreatePlan}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="form-label">Căn cứ Yêu cầu tuyển dụng (*)</label>
                                <select className="form-select" onChange={(e) => setFormData({ ...formData, recruitment_request_id: e.target.value })}>
                                    {requests.map((r) => (
                                        <option key={r.recruitment_request_id} value={r.recruitment_request_id}>{r.request_code} - {r.department_name} ({r.position_name})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="form-label">Tên kế hoạch (*)</label>
                                <input type="text" className="form-input" placeholder="VD: Kế hoạch Tuyển dụng Nhân sự Công nghệ Q3/2026" required onChange={(e) => setFormData({ ...formData, plan_name: e.target.value })} />
                            </div>
                        </div>
                    </form>
                </Modal>
            )}

            {/* MODAL TẠO LỊCH PHỎNG VẤN */}
            {modalType === 'interview' && (
                <Modal
                    isOpen={true}
                    onClose={() => setModalType(null)}
                    title="Tạo Lịch Phỏng vấn & Đánh giá"
                    footer={
                        <>
                            <button className="btn btn-secondary" onClick={() => setModalType(null)}>Hủy</button>
                            <button className="btn btn-primary" onClick={handleCreateInterview}>Lưu phỏng vấn</button>
                        </>
                    }
                >
                    <form onSubmit={handleCreateInterview}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="form-label">Ứng viên phỏng vấn (*)</label>
                                <select className="form-select" onChange={(e) => setFormData({ ...formData, candidate_id: e.target.value })}>
                                    {candidates.map((c) => (
                                        <option key={c.candidate_id} value={c.candidate_id}>{c.candidate_code} - {c.full_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Người phỏng vấn</label>
                                <select className="form-select" onChange={(e) => setFormData({ ...formData, interviewer_id: e.target.value })}>
                                    <option value="">-- Chọn Người phỏng vấn --</option>
                                    {employees.map((e) => (
                                        <option key={e.employee_id} value={e.employee_id}>{e.employee_code} - {e.full_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Ngày phỏng vấn</label>
                                <input type="date" className="form-input" onChange={(e) => setFormData({ ...formData, interview_date: e.target.value })} />
                            </div>
                        </div>
                    </form>
                </Modal>
            )}

            {/* MODAL CẬP NHẬT / TẠO MỚI OFFER TUYỂN DỤNG */}
            {modalType === 'offer' && (
                <Modal
                    isOpen={true}
                    onClose={() => setModalType(null)}
                    title={offerFormData.isEdit ? "Cập nhật Thư mời Nhận việc (Offer)" : "Phát hành Thư mời Nhận việc (Offer) Mới"}
                    maxWidth="750px"
                    footer={
                        <>
                            <button className="btn btn-secondary" onClick={() => setModalType(null)}>Hủy bỏ</button>
                            <button className="btn btn-primary" onClick={handleSaveOffer} style={{ fontWeight: 700, backgroundColor: 'var(--bravo-teal)' }}>
                                {offerFormData.isEdit ? "Lưu Cập Nhật" : "Phát hành Offer"}
                            </button>
                        </>
                    }
                >
                    <form onSubmit={handleSaveOffer} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ backgroundColor: '#F8FAFC', padding: '1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem', color: 'var(--bravo-teal-dark)', fontWeight: 800, fontSize: '0.9rem', borderBottom: '1px solid #CBD5E1', paddingBottom: '0.4rem' }}>
                                <Award size={16} />
                                <span>THÔNG TIN THƯ MỜI NHẬN VIỆC (OFFER)</span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                {/* 1. Ứng viên */}
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label className="form-label" style={{ fontWeight: 700 }}>Ứng viên nhận Offer (*)</label>
                                    <select
                                        className="form-select"
                                        value={offerFormData.candidate_id || ''}
                                        onChange={(e) => {
                                            const matched = candidates.find(c => (c.candidate_id === e.target.value || c.id === e.target.value)) || {};
                                            setOfferFormData({
                                                ...offerFormData,
                                                candidate_id: e.target.value,
                                                candidate_code: matched.candidate_code || '',
                                                candidate_name: matched.full_name || '',
                                                department_name: matched.department_name || '',
                                                position_name: matched.apply_position_name || matched.position_name || ''
                                            });
                                        }}
                                        required
                                        style={{ fontWeight: 600 }}
                                    >
                                        <option value="">-- Chọn Ứng viên (Hồ sơ tuyển dụng) --</option>
                                        {candidates.map((c) => (
                                            <option key={c.candidate_id || c.id} value={c.candidate_id || c.id}>
                                                {c.candidate_code || 'UV'} - {c.full_name} ({c.apply_position_name || c.position_name || 'Ứng viên'})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* 2. Ngày trao đổi */}
                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: 700 }}>Ngày trao đổi (*)</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={offerFormData.offer_date}
                                        onChange={(e) => setOfferFormData({ ...offerFormData, offer_date: e.target.value })}
                                        required
                                    />
                                </div>

                                {/* 3. Ngày bắt đầu đi làm */}
                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: 700 }}>Ngày bắt đầu đi làm (*)</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={offerFormData.expected_start_date}
                                        onChange={(e) => setOfferFormData({ ...offerFormData, expected_start_date: e.target.value })}
                                        required
                                    />
                                </div>

                                {/* 4. Lương thử việc */}
                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: 700 }}>Mức lương thử việc (VNĐ/tháng) (*)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="VD: 15000000"
                                        value={offerFormData.probation_salary}
                                        onChange={(e) => setOfferFormData({ ...offerFormData, probation_salary: parseFloat(e.target.value) || 0 })}
                                        required
                                        style={{ fontWeight: 700, color: '#047857' }}
                                    />
                                </div>

                                {/* 5. Lương chính thức */}
                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: 700 }}>Mức lương chính thức (VNĐ/tháng) (*)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="VD: 18000000"
                                        value={offerFormData.official_salary}
                                        onChange={(e) => setOfferFormData({ ...offerFormData, official_salary: parseFloat(e.target.value) || 0 })}
                                        required
                                        style={{ fontWeight: 700, color: '#2D6F62' }}
                                    />
                                </div>

                                {/* Trạng thái Offer */}
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label className="form-label" style={{ fontWeight: 700 }}>Trạng thái Thư mời (Offer)</label>
                                    <select
                                        className="form-select"
                                        value={offerFormData.offer_status}
                                        onChange={(e) => setOfferFormData({ ...offerFormData, offer_status: e.target.value })}
                                        style={{ fontWeight: 600 }}
                                    >
                                        <option value="Đã phát hành">Đã phát hành (SENT)</option>
                                        <option value="ACCEPTED">Ứng viên đã chấp nhận (ACCEPTED)</option>
                                        <option value="REJECTED">Ứng viên từ chối (REJECTED)</option>
                                    </select>
                                </div>

                                {/* 6. Ghi chú */}
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label className="form-label" style={{ fontWeight: 700 }}>Ghi chú nội bộ / Lưu ý đính kèm</label>
                                    <textarea
                                        className="form-textarea"
                                        rows={3}
                                        placeholder="Ghi chú chi tiết chế độ đãi ngộ, thời gian thử việc, thưởng..."
                                        value={offerFormData.note}
                                        onChange={(e) => setOfferFormData({ ...offerFormData, note: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </form>
                </Modal>
            )}

            {/* MODAL: TẠO PHIẾU ĐỊNH BIÊN NHÂN SỰ MỚI */}
            <Modal
                isOpen={modalType === 'quota'}
                onClose={() => setModalType(null)}
                title="Tạo Phiếu Định biên Nhân sự Mới"
                maxWidth="780px"
                footer={
                    <>
                        <button
                            className="btn btn-secondary"
                            onClick={() => setModalType(null)}
                            disabled={isSubmittingQuota}
                        >
                            Hủy
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleCreateQuotaSubmit}
                            disabled={isSubmittingQuota}
                            style={{ fontWeight: 700, backgroundColor: 'var(--bravo-teal)' }}
                        >
                            {isSubmittingQuota ? 'Đang tạo phiếu...' : 'Tạo định biên'}
                        </button>
                    </>
                }
            >
                <form onSubmit={handleCreateQuotaSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* SECTION 1: THÔNG TIN CHUNG */}
                    <div style={{ backgroundColor: '#F8FAFC', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.85rem', color: 'var(--bravo-teal-dark)', fontWeight: 800, fontSize: '0.9rem', borderBottom: '1px solid #CBD5E1', paddingBottom: '0.4rem' }}>
                            <Building2 size={16} />
                            <span>1. THÔNG TIN CHUNG PHIẾU ĐỊNH BIÊN</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 700 }}>Ngày áp dụng (*)</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={createQuotaData.effective_date}
                                    onChange={(e) => setCreateQuotaData({ ...createQuotaData, effective_date: e.target.value })}
                                    style={{ borderColor: createQuotaErrors.effective_date ? '#EF4444' : '#CBD5E1' }}
                                />
                                {createQuotaErrors.effective_date && (
                                    <span style={{ fontSize: '0.75rem', color: '#EF4444', fontWeight: 600 }}>{createQuotaErrors.effective_date}</span>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 700 }}>Số phiếu</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={createQuotaData.quota_code || 'ĐB/0826-0004'}
                                    disabled
                                    readOnly
                                    style={{ backgroundColor: '#F1F5F9', color: 'var(--bravo-teal-dark)', cursor: 'not-allowed', fontWeight: 800 }}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 700 }}>Người lập (*)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={createQuotaData.creator_name}
                                    onChange={(e) => setCreateQuotaData({ ...createQuotaData, creator_name: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 700 }}>Bộ phận phân công (*)</label>
                                <select
                                    className="form-select"
                                    value={createQuotaData.department_id}
                                    onChange={(e) => handleDepartmentChangeForCreateQuota(e.target.value)}
                                    style={{ borderColor: createQuotaErrors.department_id ? '#EF4444' : '#CBD5E1' }}
                                >
                                    <option value="">-- Chọn Bộ phận --</option>
                                    {departments.map(d => (
                                        <option key={d.department_id} value={d.department_id}>{d.department_name}</option>
                                    ))}
                                </select>
                                {createQuotaErrors.department_id && (
                                    <span style={{ fontSize: '0.75rem', color: '#EF4444', fontWeight: 600 }}>{createQuotaErrors.department_id}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: DANH SÁCH VỊ TRÍ CHI TIẾT */}
                    <div style={{ backgroundColor: '#F8FAFC', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', borderBottom: '1px solid #CBD5E1', paddingBottom: '0.4rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--bravo-teal-dark)', fontWeight: 800, fontSize: '0.9rem' }}>
                                <Users size={16} />
                                <span>2. CHI TIẾT VỊ TRÍ ĐỊNH BIÊN</span>
                            </div>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleAddCreateQuotaDetailRow}
                                style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', backgroundColor: 'var(--bravo-teal)' }}
                            >
                                <Plus size={14} />
                                <span>Thêm vị trí</span>
                            </button>
                        </div>

                        <div style={{ overflowX: 'auto', backgroundColor: '#FFFFFF', borderRadius: '6px', border: '1px solid #CBD5E1', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <table className="erp-table" style={{ width: '100%', minWidth: '950px', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#F8FAFC' }}>
                                        <th style={{ width: '50px', textAlign: 'center', whiteSpace: 'nowrap' }}>STT</th>
                                        <th style={{ width: '160px', whiteSpace: 'nowrap' }}>MÃ VỊ TRÍ</th>
                                        <th style={{ minWidth: '170px', whiteSpace: 'nowrap' }}>TÊN VỊ TRÍ</th>
                                        <th style={{ textAlign: 'center', width: '100px', whiteSpace: 'nowrap' }}>ĐỊNH BIÊN</th>
                                        <th style={{ textAlign: 'center', width: '95px', whiteSpace: 'nowrap' }}>NGHỈ VIỆC</th>
                                        <th style={{ textAlign: 'center', width: '95px', whiteSpace: 'nowrap' }}>THAI SẢN</th>
                                        <th style={{ textAlign: 'center', width: '95px', whiteSpace: 'nowrap' }}>HIỆN TẠI</th>
                                        <th style={{ textAlign: 'center', width: '95px', whiteSpace: 'nowrap' }}>CẦN TUYỂN</th>
                                        <th style={{ minWidth: '140px', whiteSpace: 'nowrap' }}>GHI CHÚ</th>
                                        <th style={{ width: '55px', textAlign: 'center', whiteSpace: 'nowrap' }}>XÓA</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {createQuotaDetails.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} style={{ textAlign: 'center', padding: '1.5rem', color: '#94A3B8' }}>
                                                Chưa chọn vị trí. Nhấn '+ Thêm vị trí' để bổ sung vị trí công việc.
                                            </td>
                                        </tr>
                                    ) : (
                                        createQuotaDetails.map((row, idx) => (
                                            <tr key={row.detail_id || idx}>
                                                <td style={{ textAlign: 'center', fontWeight: 600 }}>{idx + 1}</td>
                                                <td>
                                                    <select
                                                        className="form-select"
                                                        value={row.position_id || ''}
                                                        onChange={(e) => handleCreateQuotaDetailChange(idx, 'position_id', e.target.value)}
                                                        style={{ fontSize: '0.8rem', padding: '0.3rem 0.4rem', width: '100%', borderRadius: '6px' }}
                                                    >
                                                        <option value="">-- Chọn vị trí --</option>
                                                        {positions
                                                            .filter(p => !createQuotaData.department_id || p.department_id === createQuotaData.department_id)
                                                            .map(p => (
                                                                <option key={p.position_id} value={p.position_id}>{p.position_code}</option>
                                                            ))}
                                                    </select>
                                                </td>
                                                <td style={{ fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap', color: 'var(--bravo-teal-dark)' }}>
                                                    {row.position_name || '—'}
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        className="form-input"
                                                        value={row.target_headcount || 0}
                                                        onChange={(e) => handleCreateQuotaDetailChange(idx, 'target_headcount', e.target.value)}
                                                        style={{ textAlign: 'center', padding: '0.3rem 0.4rem', fontSize: '0.85rem', fontWeight: 700, borderRadius: '6px' }}
                                                    />
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        className="form-input"
                                                        value={row.resignation_count || 0}
                                                        onChange={(e) => handleCreateQuotaDetailChange(idx, 'resignation_count', e.target.value)}
                                                        style={{ textAlign: 'center', padding: '0.3rem 0.4rem', fontSize: '0.85rem', borderRadius: '6px' }}
                                                    />
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        className="form-input"
                                                        value={row.maternity_count || 0}
                                                        onChange={(e) => handleCreateQuotaDetailChange(idx, 'maternity_count', e.target.value)}
                                                        style={{ textAlign: 'center', padding: '0.3rem 0.4rem', fontSize: '0.85rem', borderRadius: '6px' }}
                                                    />
                                                </td>
                                                <td style={{ textAlign: 'center', fontWeight: 800, fontSize: '0.9rem', color: '#15803D' }}>
                                                    <span style={{ backgroundColor: '#DCFCE7', padding: '0.2rem 0.55rem', borderRadius: '12px', display: 'inline-block' }}>
                                                        {row.current_headcount || 0}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'center', fontWeight: 800, fontSize: '0.9rem', color: (row.needed_headcount || 0) > 0 ? '#2563EB' : '#475569' }}>
                                                    <span style={{ backgroundColor: (row.needed_headcount || 0) > 0 ? '#DBEAFE' : '#F1F5F9', padding: '0.2rem 0.55rem', borderRadius: '12px', display: 'inline-block' }}>
                                                        {row.needed_headcount || 0}
                                                    </span>
                                                </td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        value={row.note || ''}
                                                        onChange={(e) => handleCreateQuotaDetailChange(idx, 'note', e.target.value)}
                                                        placeholder="Ghi chú..."
                                                        style={{ padding: '0.3rem 0.5rem', fontSize: '0.825rem', width: '100%', borderRadius: '6px' }}
                                                    />
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <button
                                                        type="button"
                                                        className="btn btn-secondary"
                                                        onClick={() => handleRemoveCreateQuotaDetailRow(idx)}
                                                        style={{ padding: '0.25rem 0.45rem', color: '#EF4444', borderColor: '#FCA5A5', borderRadius: '6px' }}
                                                        title="Xóa dòng"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* SECTION 3: ĐỊNH BIÊN TỔNG & NGÂN SÁCH DỰ KIẾN */}
                    <div style={{ backgroundColor: '#F8FAFC', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', borderBottom: '1px solid #CBD5E1', paddingBottom: '0.4rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--bravo-teal-dark)', fontWeight: 800, fontSize: '0.9rem' }}>
                                <FileText size={16} />
                                <span>3. NGÂN SÁCH DỰ KIẾN</span>
                            </div>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleAddCreateBudgetDetailRow}
                                style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', borderColor: 'var(--bravo-teal)', color: 'var(--bravo-teal-dark)', fontWeight: 700 }}
                            >
                                <Plus size={13} />
                                <span>Thêm dòng chi phí</span>
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 700 }}>Tổng định biên</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={createQuotaData.target_headcount}
                                    disabled
                                    readOnly
                                    style={{ textAlign: 'right', fontWeight: 800, backgroundColor: '#F1F5F9' }}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 700 }}>Sức chứa tối đa</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={createQuotaData.max_capacity}
                                    onChange={(e) => setCreateQuotaData({ ...createQuotaData, max_capacity: e.target.value })}
                                    style={{ textAlign: 'right' }}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Trạng thái tạo phiếu</label>
                                <select
                                    className="form-select"
                                    value={createQuotaData.status}
                                    onChange={(e) => setCreateQuotaData({ ...createQuotaData, status: e.target.value })}
                                >
                                    <option value="Tạo phiếu">Tạo phiếu</option>
                                    <option value="Đang duyệt">Đang duyệt</option>
                                    <option value="Đã hoàn thiện">Đã hoàn thiện</option>
                                </select>
                            </div>

                            <div className="form-group" style={{ gridColumn: 'span 3' }}>
                                <label className="form-label">Diễn giải nội dung</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Diễn giải mục đích tạo định biên..."
                                    value={createQuotaData.description}
                                    onChange={(e) => setCreateQuotaData({ ...createQuotaData, description: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* BẢNG CHI TIẾT NGÂN SÁCH DỰ KIẾN */}
                        <div style={{ overflowX: 'auto', border: '1px solid #CBD5E1', borderRadius: '6px', backgroundColor: '#FFFFFF' }}>
                            <table className="erp-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '45px' }}>STT</th>
                                        <th>Loại chi phí</th>
                                        <th style={{ width: '200px' }}>Nguồn tuyển dụng</th>
                                        <th style={{ textAlign: 'right', width: '160px' }}>Chi phí dự kiến</th>
                                        <th style={{ width: '45px' }}>Xóa</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {createBudgetDetails.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} style={{ textAlign: 'center', padding: '1.25rem', color: '#94A3B8' }}>
                                                Chưa có chi tiết ngân sách dự kiến. Bấm '+ Thêm dòng chi phí' để thêm.
                                            </td>
                                        </tr>
                                    ) : (
                                        createBudgetDetails.map((bRow, idx) => (
                                            <tr key={bRow.id || idx}>
                                                <td>{idx + 1}</td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        value={bRow.cost_type || ''}
                                                        placeholder="Nhập loại chi phí (VD: Đăng tin, Giới thiệu...)"
                                                        onChange={(e) => handleCreateBudgetDetailChange(idx, 'cost_type', e.target.value)}
                                                        style={{ fontSize: '0.85rem' }}
                                                    />
                                                </td>
                                                <td>
                                                    <select
                                                        className="form-select"
                                                        value={bRow.source || 'TopCV'}
                                                        onChange={(e) => handleCreateBudgetDetailChange(idx, 'source', e.target.value)}
                                                        style={{ fontSize: '0.85rem' }}
                                                    >
                                                        <option value="Bạn bè giới thiệu">Bạn bè giới thiệu</option>
                                                        <option value="MXH">MXH</option>
                                                        <option value="LinkedIn">LinkedIn</option>
                                                        <option value="TopCV">TopCV</option>
                                                        <option value="Trang web">Trang web</option>
                                                    </select>
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        className="form-input"
                                                        value={bRow.estimated_cost || 0}
                                                        onChange={(e) => handleCreateBudgetDetailChange(idx, 'estimated_cost', e.target.value)}
                                                        style={{ textAlign: 'right', fontWeight: 700, color: '#047857', fontSize: '0.85rem' }}
                                                    />
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <button
                                                        type="button"
                                                        className="btn btn-secondary"
                                                        style={{ padding: '0.2rem 0.4rem', color: '#EF4444', borderColor: '#FCA5A5' }}
                                                        onClick={() => handleRemoveCreateBudgetDetailRow(idx)}
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                                {createBudgetDetails.length > 0 && (
                                    <tfoot>
                                        <tr style={{ backgroundColor: '#F8FAFC', fontWeight: 800 }}>
                                            <td colSpan={3} style={{ textAlign: 'right' }}>Tổng ngân sách dự kiến:</td>
                                            <td style={{ textAlign: 'right', color: '#047857', fontSize: '0.9rem' }}>
                                                {createBudgetDetails.reduce((sum, item) => sum + (Number(item.estimated_cost) || 0), 0).toLocaleString('vi-VN')}
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </div>
                </form>

            </Modal>

            {/* MODAL LẬP/SỬA PHIẾU SƠ LOẠI ỨNG VIÊN */}
            <Modal
                isOpen={modalType === 'pre_screening'}
                onClose={() => setModalType(null)}
                title={formData.isEdit ? 'Cập nhật Phiếu Sơ loại Ứng viên' : 'Lập Phiếu Sơ loại Ứng viên'}
                maxWidth="900px"
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setModalType(null)}>Hủy</button>
                        <button className="btn btn-primary" onClick={handleSubmitPreScreening}>Lưu Phiếu Sơ loại</button>
                    </>
                }
            >
                <form onSubmit={handleSubmitPreScreening}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                        {/* Thông tin chung - tự điền theo ứng viên được chọn */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Ứng viên (*)</label>
                                <select
                                    className="form-select"
                                    value={formData.candidate_id || ''}
                                    onChange={(e) => handleSelectCandidateForScreening(e.target.value)}
                                    disabled={formData.isEdit}
                                >
                                    <option value="">-- Chọn ứng viên --</option>
                                    {candidates.map((c) => (
                                        <option key={c.candidate_id} value={c.candidate_id}>{c.candidate_code} - {c.full_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Ngày nhận hồ sơ</label>
                                <input type="date" className="form-input" value={formData.received_date || ''} disabled style={{ backgroundColor: '#F3F4F6', color: '#374151' }} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Trình độ văn hóa</label>
                                <input type="text" className="form-input" value={formData.culture_level || ''} disabled style={{ backgroundColor: '#F3F4F6', color: '#374151' }} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Trình độ chuyên môn</label>
                                <input type="text" className="form-input" value={formData.education_level || ''} disabled style={{ backgroundColor: '#F3F4F6', color: '#374151' }} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Đơn vị đào tạo</label>
                                <input type="text" className="form-input" value={formData.education_school || ''} disabled style={{ backgroundColor: '#F3F4F6', color: '#374151' }} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Vị trí dự tuyển</label>
                                <input type="text" className="form-input" value={positions.find(p => p.position_id === formData.position_id)?.position_name || '—'} disabled style={{ backgroundColor: '#F3F4F6', color: '#374151' }} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Bộ phận</label>
                                <input type="text" className="form-input" value={departments.find(d => d.department_id === formData.department_id)?.department_name || '—'} disabled style={{ backgroundColor: '#F3F4F6', color: '#374151' }} />
                            </div>
                        </div>

                        {/* TAB CHI TIẾT ĐIỀU KIỆN SƠ LOẠI */}
                        <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0F172A' }}>
                                    📝 Chi tiết Điều kiện Sơ loại ({psCriteriaRows.length} điều kiện)
                                </h4>
                                <button type="button" className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={handleAddPsCriteriaRow}>
                                    <Plus size={14} />
                                    <span>Thêm điều kiện</span>
                                </button>
                            </div>

                            <table className="erp-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '160px' }}>Điều kiện</th>
                                        <th colSpan={2} style={{ textAlign: 'center' }}>Điều kiện cần đạt</th>
                                        <th colSpan={2} style={{ textAlign: 'center' }}>Thông tin ứng viên</th>
                                        <th style={{ width: '70px', textAlign: 'center' }}>Đạt</th>
                                        <th>Ghi chú</th>
                                        <th style={{ width: '40px' }}></th>
                                    </tr>
                                    <tr>
                                        <th></th>
                                        <th style={{ fontWeight: 400, fontSize: '0.75rem' }}>Từ</th>
                                        <th style={{ fontWeight: 400, fontSize: '0.75rem' }}>Mô tả</th>
                                        <th style={{ fontWeight: 400, fontSize: '0.75rem' }}>Giá trị</th>
                                        <th style={{ fontWeight: 400, fontSize: '0.75rem' }}>Mô tả</th>
                                        <th></th>
                                        <th></th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {psCriteriaRows.map((row, idx) => (
                                        <tr key={idx}>
                                            <td>
                                                <select className="form-select" style={{ fontSize: '0.8rem' }} value={row.criteria_type} onChange={(e) => handlePsCriteriaChange(idx, 'criteria_type', e.target.value)}>
                                                    {PRE_SCREENING_CRITERIA_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                </select>
                                            </td>
                                            <td><input type="text" className="form-input" style={{ fontSize: '0.8rem' }} value={row.required_from} onChange={(e) => handlePsCriteriaChange(idx, 'required_from', e.target.value)} /></td>
                                            <td><input type="text" className="form-input" style={{ fontSize: '0.8rem' }} value={row.required_description} onChange={(e) => handlePsCriteriaChange(idx, 'required_description', e.target.value)} /></td>
                                            <td><input type="text" className="form-input" style={{ fontSize: '0.8rem' }} value={row.candidate_value} onChange={(e) => handlePsCriteriaChange(idx, 'candidate_value', e.target.value)} /></td>
                                            <td><input type="text" className="form-input" style={{ fontSize: '0.8rem' }} value={row.candidate_description} onChange={(e) => handlePsCriteriaChange(idx, 'candidate_description', e.target.value)} /></td>
                                            <td style={{ textAlign: 'center' }}>
                                                <input type="checkbox" checked={!!row.is_passed} onChange={(e) => handlePsCriteriaChange(idx, 'is_passed', e.target.checked)} style={{ width: '18px', height: '18px' }} />
                                            </td>
                                            <td><input type="text" className="form-input" style={{ fontSize: '0.8rem' }} value={row.note} onChange={(e) => handlePsCriteriaChange(idx, 'note', e.target.value)} /></td>
                                            <td>
                                                <button type="button" className="btn btn-secondary" style={{ padding: '0.2rem 0.4rem', color: '#EF4444', borderColor: '#FCA5A5' }} onClick={() => handleRemovePsCriteriaRow(idx)}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* ĐÁNH GIÁ CUỐI CÙNG */}
                        <div style={{ background: '#F0FDF4', padding: '1rem', borderRadius: '8px', border: '1px solid #A7F3D0' }}>
                            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.75rem' }}>✅ Đánh giá cuối cùng</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Ngày sơ loại</label>
                                    <input type="date" className="form-input" value={formData.screening_date || ''} onChange={(e) => setFormData({ ...formData, screening_date: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Đánh giá sơ loại</label>
                                    <select className="form-select" value={formData.screening_result || 'ĐẠT'} onChange={(e) => setFormData({ ...formData, screening_result: e.target.value })}>
                                        <option value="ĐẠT">Đạt</option>
                                        <option value="KHÔNG ĐẠT">Không đạt</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label className="form-label">Mức độ: <b style={{ color: 'var(--bravo-teal-dark)', fontSize: '1rem' }}>{formData.level_score || 5}/10</b></label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="10"
                                        step="1"
                                        value={formData.level_score || 5}
                                        onChange={(e) => setFormData({ ...formData, level_score: parseInt(e.target.value) })}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label className="form-label">Nhận xét sơ loại</label>
                                    <textarea className="form-textarea" rows={2} value={formData.comment || ''} onChange={(e) => setFormData({ ...formData, comment: e.target.value })} placeholder="Nhận xét tổng quan về kết quả sơ loại..." />
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* MODAL LẬP/SỬA PHIẾU ĐÁNH GIÁ PHỎNG VẤN */}
            <Modal
                isOpen={modalType === 'interview_eval'}
                onClose={() => setModalType(null)}
                title={formData.isEdit ? 'Cập nhật Phiếu Đánh giá phỏng vấn' : 'Lập Phiếu Đánh giá phỏng vấn'}
                maxWidth="900px"
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setModalType(null)}>Hủy</button>
                        <button className="btn btn-primary" onClick={handleSubmitInterviewEvaluation}>Lưu Phiếu Đánh giá</button>
                    </>
                }
            >
                <form onSubmit={handleSubmitInterviewEvaluation}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                        {/* Thông tin chung */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Ngày đánh giá</label>
                                <input type="date" className="form-input" value={formData.evaluation_date || ''} onChange={(e) => setFormData({ ...formData, evaluation_date: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Thời lượng (phút)</label>
                                <input type="number" className="form-input" min="1" value={formData.duration_minutes || 30} onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Lịch số (*)</label>
                                <select
                                    className="form-select"
                                    value={formData.schedule_id || ''}
                                    onChange={(e) => handleSelectScheduleForEval(e.target.value)}
                                    disabled={formData.isEdit}
                                >
                                    <option value="">-- Chọn lịch phỏng vấn --</option>
                                    {interviewSchedules.map((s) => (
                                        <option key={s.schedule_id || s.id} value={s.schedule_id || s.id}>{s.schedule_code} - {s.location}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Ứng viên (*) - trong lịch đã chọn</label>
                                <select
                                    className="form-select"
                                    value={formData.candidate_id || ''}
                                    onChange={(e) => setFormData({ ...formData, candidate_id: e.target.value })}
                                    disabled={formData.isEdit}
                                >
                                    <option value="">-- Chọn ứng viên --</option>
                                    {getCandidatesInSchedule(formData.schedule_id).map((c) => (
                                        <option key={c.candidate_id} value={c.candidate_id}>{c.candidate_code} - {c.full_name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* TAB KỊCH BẢN PHỎNG VẤN */}
                        <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0F172A' }}>
                                    🎤 Kịch bản phỏng vấn ({ievScriptRows.length} câu)
                                </h4>
                                <button type="button" className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={handleAddScriptRow}>
                                    <Plus size={14} />
                                    <span>Thêm câu hỏi</span>
                                </button>
                            </div>
                            <table className="erp-table">
                                <thead>
                                    <tr>
                                        <th>Câu hỏi</th>
                                        <th>Kỳ vọng</th>
                                        <th>Câu trả lời</th>
                                        <th style={{ width: '40px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ievScriptRows.map((row, idx) => (
                                        <tr key={idx}>
                                            <td><input type="text" className="form-input" style={{ fontSize: '0.8rem' }} value={row.question} onChange={(e) => handleScriptChange(idx, 'question', e.target.value)} /></td>
                                            <td><input type="text" className="form-input" style={{ fontSize: '0.8rem' }} value={row.expectation} onChange={(e) => handleScriptChange(idx, 'expectation', e.target.value)} /></td>
                                            <td><input type="text" className="form-input" style={{ fontSize: '0.8rem' }} value={row.answer} onChange={(e) => handleScriptChange(idx, 'answer', e.target.value)} /></td>
                                            <td>
                                                <button type="button" className="btn btn-secondary" style={{ padding: '0.2rem 0.4rem', color: '#EF4444', borderColor: '#FCA5A5' }} onClick={() => handleRemoveScriptRow(idx)}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* TAB CHI TIẾT ĐIỀU KIỆN ĐÁNH GIÁ */}
                        <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0F172A' }}>
                                    📝 Chi tiết Điều kiện Đánh giá ({ievCriteriaRows.length} điều kiện)
                                </h4>
                                <button type="button" className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={handleAddIevCriteriaRow}>
                                    <Plus size={14} />
                                    <span>Thêm điều kiện</span>
                                </button>
                            </div>
                            <table className="erp-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '160px' }}>Điều kiện</th>
                                        <th colSpan={2} style={{ textAlign: 'center' }}>Điều kiện cần đạt</th>
                                        <th colSpan={2} style={{ textAlign: 'center' }}>Thông tin ứng viên</th>
                                        <th style={{ width: '70px', textAlign: 'center' }}>Đạt</th>
                                        <th>Ghi chú</th>
                                        <th style={{ width: '40px' }}></th>
                                    </tr>
                                    <tr>
                                        <th></th>
                                        <th style={{ fontWeight: 400, fontSize: '0.75rem' }}>Từ</th>
                                        <th style={{ fontWeight: 400, fontSize: '0.75rem' }}>Mô tả</th>
                                        <th style={{ fontWeight: 400, fontSize: '0.75rem' }}>Giá trị</th>
                                        <th style={{ fontWeight: 400, fontSize: '0.75rem' }}>Mô tả</th>
                                        <th></th>
                                        <th></th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ievCriteriaRows.map((row, idx) => (
                                        <tr key={idx}>
                                            <td>
                                                <select className="form-select" style={{ fontSize: '0.8rem' }} value={row.criteria_type} onChange={(e) => handleIevCriteriaChange(idx, 'criteria_type', e.target.value)}>
                                                    {PRE_SCREENING_CRITERIA_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                </select>
                                            </td>
                                            <td><input type="text" className="form-input" style={{ fontSize: '0.8rem' }} value={row.required_from} onChange={(e) => handleIevCriteriaChange(idx, 'required_from', e.target.value)} /></td>
                                            <td><input type="text" className="form-input" style={{ fontSize: '0.8rem' }} value={row.required_description} onChange={(e) => handleIevCriteriaChange(idx, 'required_description', e.target.value)} /></td>
                                            <td><input type="text" className="form-input" style={{ fontSize: '0.8rem' }} value={row.candidate_value} onChange={(e) => handleIevCriteriaChange(idx, 'candidate_value', e.target.value)} /></td>
                                            <td><input type="text" className="form-input" style={{ fontSize: '0.8rem' }} value={row.candidate_description} onChange={(e) => handleIevCriteriaChange(idx, 'candidate_description', e.target.value)} /></td>
                                            <td style={{ textAlign: 'center' }}>
                                                <input type="checkbox" checked={!!row.is_passed} onChange={(e) => handleIevCriteriaChange(idx, 'is_passed', e.target.checked)} style={{ width: '18px', height: '18px' }} />
                                            </td>
                                            <td><input type="text" className="form-input" style={{ fontSize: '0.8rem' }} value={row.note} onChange={(e) => handleIevCriteriaChange(idx, 'note', e.target.value)} /></td>
                                            <td>
                                                <button type="button" className="btn btn-secondary" style={{ padding: '0.2rem 0.4rem', color: '#EF4444', borderColor: '#FCA5A5' }} onClick={() => handleRemoveIevCriteriaRow(idx)}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* ĐÁNH GIÁ CUỐI CÙNG */}
                        <div style={{ background: '#F0FDF4', padding: '1rem', borderRadius: '8px', border: '1px solid #A7F3D0' }}>
                            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.75rem' }}>✅ Đánh giá cuối cùng</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Đánh giá chung</label>
                                    <select className="form-select" value={formData.overall_result || 'ĐẠT'} onChange={(e) => setFormData({ ...formData, overall_result: e.target.value })}>
                                        <option value="ĐẠT">Đạt</option>
                                        <option value="KHÔNG ĐẠT">Không đạt</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Mức độ: <b style={{ color: 'var(--bravo-teal-dark)', fontSize: '1rem' }}>{formData.level_score || 5}/10</b></label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="10"
                                        step="1"
                                        value={formData.level_score || 5}
                                        onChange={(e) => setFormData({ ...formData, level_score: parseInt(e.target.value) })}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label className="form-label">Nhận xét chung</label>
                                    <textarea className="form-textarea" rows={2} value={formData.overall_comment || ''} onChange={(e) => setFormData({ ...formData, overall_comment: e.target.value })} placeholder="Nhận xét tổng quan về buổi phỏng vấn..." />
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* MODAL XÁC NHẬN XÓA PHIẾU ĐỊNH BIÊN */}
            <Modal
                isOpen={deleteQuotaConfirmModal}
                onClose={() => setDeleteQuotaConfirmModal(false)}
                title="Xác nhận xóa phiếu định biên nhân sự"
                maxWidth="520px"
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setDeleteQuotaConfirmModal(false)}>Hủy</button>
                        <button className="btn btn-danger" onClick={handleDeleteQuotaConfirm} style={{ fontWeight: 700 }}>
                            Xóa phiếu định biên
                        </button>
                    </>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#DC2626', backgroundColor: '#FEF2F2', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #FCA5A5' }}>
                        <AlertTriangle size={24} style={{ flexShrink: 0 }} />
                        <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                            Thao tác này sẽ xóa vĩnh viễn chứng từ định biên khỏi hệ thống.
                        </div>
                    </div>

                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155' }}>
                        Bạn có chắc chắn muốn xóa phiếu định biên <b>{selectedQuota?.quota_code}</b> không?
                    </p>

                    {selectedQuota && (
                        <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', padding: '0.85rem 1rem', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.825rem', color: '#64748B', fontWeight: 600 }}>Chứng từ được chọn xóa:</div>
                            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', marginTop: '0.2rem' }}>
                                Số phiếu: {selectedQuota.quota_code} - {selectedQuota.department_name}
                            </div>
                            <div style={{ fontSize: '0.825rem', color: 'var(--bravo-teal-dark)', fontWeight: 600, marginTop: '0.1rem' }}>
                                Tổng định biên: {selectedQuota.target_headcount} | Ngân sách: {Number(selectedQuota.budget || 0).toLocaleString('vi-VN')} VNĐ
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};