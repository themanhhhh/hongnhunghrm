import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { StatusChip } from '../components/StatusChip';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import {
    Users,
    FileText,
    TrendingUp,
    Upload,
    Eye,
    Plus,
    Building2,
    Calendar,
    AlertTriangle,
    CheckCircle2,
    UserCheck,
    UserX,
    RefreshCw,
    Award,
    Briefcase,
    Layers,
    Edit2,
    Filter,
    ArrowLeft,
    Edit3,
    Save,
    X,
    Trash2,
    Mail,
    Phone,
    Lock,
    ShieldCheck,
    DollarSign
} from 'lucide-react';

export const HRModule = ({ activeSubTab }) => {
    const { user, hasPermission } = useAuth();
    const { addToast } = useNotification();

    // Data states for all HR sub-modules & master data
    const [employees, setEmployees] = useState([]);
    const [contracts, setContracts] = useState([]);
    const [expiringContracts, setExpiringContracts] = useState([]);
    const [contractProposals, setContractProposals] = useState([]);
    const [contractExtensions, setContractExtensions] = useState([]);
    const [transferProposals, setTransferProposals] = useState([]);
    const [transferDecisions, setTransferDecisions] = useState([]);
    const [resignationApplications, setResignationApplications] = useState([]);
    const [resignationDecisions, setResignationDecisions] = useState([]);

    const [departments, setDepartments] = useState([]);
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filters state for Employee List
    const [filterDept, setFilterDept] = useState('ALL');
    const [filterLevel, setFilterLevel] = useState('ALL');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [selectedOrgDeptId, setSelectedOrgDeptId] = useState('dept-hr');

    // Selected Employee Detail & Edit/Delete Page states
    const [selectedEmp, setSelectedEmp] = useState(null);
    const [isEditingEmp, setIsEditingEmp] = useState(false);
    const [editEmpData, setEditEmpData] = useState({});
    const [empFormErrors, setEmpFormErrors] = useState({});
    const [deleteConfirmModal, setDeleteConfirmModal] = useState(false);
    const [activeEmpTab, setActiveEmpTab] = useState('basic');
    // Dữ liệu 3 tab bổ sung trong hồ sơ cá nhân: Hợp đồng lao động / Quá trình công tác / Khen thưởng-Kỷ luật
    const [profileContracts, setProfileContracts] = useState([]);
    const [profileWorkHistory, setProfileWorkHistory] = useState([]);
    const [profileRewards, setProfileRewards] = useState([]);
    const [profileDetailLoading, setProfileDetailLoading] = useState(false);
    const isSelfServiceEmployee = user?.roleName === 'Nhân viên';

    const generateShortName = (fullName) => {
        if (!fullName || !fullName.trim()) return '';
        const removeAccents = (str) => {
            return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
        };
        const words = fullName.trim().split(/\s+/);
        if (words.length === 1) {
            const w = removeAccents(words[0]);
            return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
        }
        const lastName = removeAccents(words[words.length - 1]);
        const capitalizedLastName = lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase();
        const initials = words.slice(0, words.length - 1)
            .map(w => removeAccents(w).charAt(0).toUpperCase())
            .join('');
        return capitalizedLastName + initials;
    };

    const calculateTenure = (joinDate) => {
        if (!joinDate) return '—';
        const start = new Date(joinDate);
        if (isNaN(start.getTime())) return '—';
        const now = new Date();
        let years = now.getFullYear() - start.getFullYear();
        let months = now.getMonth() - start.getMonth();
        if (months < 0) {
            years--;
            months += 12;
        }
        if (years > 0 && months > 0) return `${years} năm ${months} tháng`;
        if (years > 0) return `${years} năm`;
        if (months > 0) return `${months} tháng`;
        return 'Dưới 1 tháng';
    };

    // Modals & Forms state
    const [modalType, setModalType] = useState(null);
    const [formData, setFormData] = useState({});

    // State for Contract Create/Edit
    const [contractFormData, setContractFormData] = useState({
        isEdit: false,
        contract_id: null,
        contract_no: '',
        contract_date: '',
        signer_id: '',
        signer_name: '',
        signer_position: '',
        employee_id: '',
        employee_position: '',
        contract_type: 'Hợp đồng thử việc',
        start_date: '',
        end_date: '',
        probation_from_date: '',
        probation_to_date: '',
        job_description: '',
        salary_scale: 'Bảng lương Chuyên viên ERP',
        salary_grade: 'Bậc 1',
        allowance_details: [],
        base_salary: 15000000,
        social_insurance_salary: 5000000
    });

    // State for Transfer Proposal Create/Edit
    const [transferProposalFormData, setTransferProposalFormData] = useState({
        isEdit: false,
        proposal_id: null,
        proposal_date: new Date().toISOString().split('T')[0],
        proposal_code: '',
        effective_date: new Date().toISOString().split('T')[0],
        decision_type: 'Thuyên chuyển',
        proposer_id: '',
        proposer_name: '',
        proposer_position: '',
        proposer_department: '',
        note: '',
        detail_items: []
    });

    // Create New Employee Form states
    const [createEmpData, setCreateEmpData] = useState({
        full_name: '',
        gender: 'Nam',
        date_of_birth: '',
        citizen_id: '',
        email: '',
        phone: '',
        address: '',
        department_id: '',
        position_title: 'Nhân viên',
        manager_id: '',
        join_date: new Date().toISOString().split('T')[0],
        employee_type: 'Nhân viên chính thức',
        employment_status: 'WORKING'
    });
    const [createEmpErrors, setCreateEmpErrors] = useState({});
    const [isSubmittingEmp, setIsSubmittingEmp] = useState(false);

    // --- States for Đơn xin nghỉ phép (Leave Applications) ---
    const [leaveApplications, setLeaveApplications] = useState([]);
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [leaveFormData, setLeaveFormData] = useState({
        leave_id: null,
        created_date: new Date().toISOString().split('T')[0],
        leave_code: '',
        employee_id: '',
        employee_code: '',
        employee_name: '',
        department_id: '',
        department_name: '',
        approver_id: '',
        approver_name: '',
        related_person_id: '',
        related_person_name: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        total_days: 1.0,
        reason: '',
        details: [
            { date: new Date().toISOString().split('T')[0], time_option: 'Cả ngày', days: 1.0, note: '' }
        ],
        approver_note: ''
    });
    const [quotas, setQuotas] = useState([]);
    const [filterQuotaDept, setFilterQuotaDept] = useState('ALL');
    const [filterQuotaStatus, setFilterQuotaStatus] = useState('ALL');
    const [selectedQuota, setSelectedQuota] = useState(null);
    const [isEditingQuota, setIsEditingQuota] = useState(false);
    const [editQuotaData, setEditQuotaData] = useState({});
    const [quotaFormErrors, setQuotaFormErrors] = useState({});
    const [deleteQuotaConfirmModal, setDeleteQuotaConfirmModal] = useState(false);

    const [createQuotaData, setCreateQuotaData] = useState({
        effective_date: new Date().toISOString().split('T')[0],
        quota_code: '',
        department_id: '',
        creator_name: user?.full_name || 'HR01: HR Test 01',
        target_headcount: 10,
        max_capacity: 15,
        budget: 150000000,
        description: '',
        status: 'Đã hoàn thiện'
    });
    const [createQuotaErrors, setCreateQuotaErrors] = useState({});
    const [isSubmittingQuota, setIsSubmittingQuota] = useState(false);

    // Dynamic filter for eligible managers during employee creation
    const getEligibleManagersForCreate = (deptId, posTitle) => {
        if (!deptId || !posTitle) return [];

        if (deptId === 'dept-board') {
            if (posTitle === 'Tổng Giám đốc') return [];
            return employees.filter(e => e.department_id === 'dept-board' || e.level === 'Ban Giám Đốc' || e.position_name?.includes('Tổng Giám Đốc'));
        }

        if (posTitle === 'Trưởng phòng') {
            // Direct Manager of Trưởng phòng is Ban Giám đốc
            return employees.filter(e => e.department_id === 'dept-board' || e.level === 'Ban Giám Đốc' || e.position_name?.includes('Giám Đốc'));
        }

        if (posTitle === 'Trưởng nhóm') {
            // Direct Manager of Trưởng nhóm is Trưởng phòng of SAME department
            return employees.filter(e => e.department_id === deptId && (e.position_name?.includes('Trưởng phòng') || e.level === 'Trưởng phòng') && (e.is_active === 1 || e.employment_status === 'WORKING'));
        }

        if (posTitle === 'Nhân viên') {
            // Direct Manager of Staff is one of the Trưởng nhóm of SAME department
            return employees.filter(e => e.department_id === deptId && (e.position_name?.includes('Trưởng nhóm') || e.level === 'Trưởng nhóm') && (e.is_active === 1 || e.employment_status === 'WORKING'));
        }

        return employees.filter(e => e.department_id === deptId && (e.is_active === 1 || e.employment_status === 'WORKING'));
    };

    useEffect(() => {
        setSelectedEmp(null);
        setModalType(null);
        fetchCommonData();
        fetchSubTabModuleData();
    }, [activeSubTab]);

    const fetchCommonData = async () => {
        try {
            const resDept = await api.get('/admin/departments');
            const resPos = await api.get('/admin/positions');
            const resExp = await api.get('/hr/expiring-contracts');
            const resQuotas = await api.get('/hr/quotas');

            if (resDept.success && Array.isArray(resDept.data)) setDepartments(resDept.data);
            if (resPos.success && Array.isArray(resPos.data)) setPositions(resPos.data);
            if (resExp.success && Array.isArray(resExp.data)) setExpiringContracts(resExp.data);
            if (resQuotas.success && Array.isArray(resQuotas.data)) setQuotas(resQuotas.data);

            if (!isSelfServiceEmployee) {
                const resEmp = await api.get('/hr/employees');
                if (resEmp.success && Array.isArray(resEmp.data)) setEmployees(resEmp.data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchSubTabModuleData = async () => {
        setLoading(true);
        try {
            if (!activeSubTab || activeSubTab === 'Hồ sơ nhân sự') {
                if (isSelfServiceEmployee) {
                    // Nhân viên thường: KHÔNG được gọi danh sách toàn bộ - chỉ xem hồ sơ bản thân
                    const meRes = await api.get('/hr/employees/me');
                    if (meRes && meRes.success && meRes.data) {
                        setSelectedEmp(meRes.data);
                        setProfileContracts(Array.isArray(meRes.data.contracts) ? meRes.data.contracts : []);
                        setProfileWorkHistory(Array.isArray(meRes.data.workHistory) ? meRes.data.workHistory : []);
                        setProfileRewards(Array.isArray(meRes.data.rewards) ? meRes.data.rewards : []);
                    }
                } else {
                    const res = await api.get('/hr/employees');
                    if (res && res.success && Array.isArray(res.data)) setEmployees(res.data);
                }
            } else if (activeSubTab === 'Định biên nhân sự') {
                const res = await api.get('/hr/quotas');
                if (res && res.success && Array.isArray(res.data)) setQuotas(res.data);
            } else if (activeSubTab === 'Danh mục bộ phận') {
                const res = await api.get('/admin/departments');
                if (res && res.success && Array.isArray(res.data)) setDepartments(res.data);
            } else if (activeSubTab === 'Danh mục vị trí công việc') {
                const res = await api.get('/admin/positions');
                if (res && res.success && Array.isArray(res.data)) setPositions(res.data);
            } else if (activeSubTab === 'Đề xuất HĐLĐ') {
                const res = await api.get('/hr/contract-proposals');
                if (res && res.success && Array.isArray(res.data)) setContractProposals(res.data);
            } else if (activeSubTab === 'Hợp đồng lao động') {
                const res = await api.get('/hr/contracts');
                if (res && res.success && Array.isArray(res.data)) setContracts(res.data);
            } else if (activeSubTab === 'Gia hạn HĐLĐ') {
                const res = await api.get('/hr/contract-extensions');
                if (res && res.success && Array.isArray(res.data)) setContractExtensions(res.data);
            } else if (activeSubTab === 'Đơn xin nghỉ phép') {
                const res = await api.get('/hr/leave-applications');
                if (res && res.success && Array.isArray(res.data)) setLeaveApplications(res.data);
            } else if (activeSubTab === 'Đề xuất thuyên chuyển, bổ nhiệm' || activeSubTab === 'Đề xuất thuyên chuyển, bổ nhiệm, miễn nhiệm') {
                const res = await api.get('/hr/transfer-proposals');
                if (res && res.success && Array.isArray(res.data)) setTransferProposals(res.data);
            } else if (activeSubTab === 'Quyết định thuyên chuyển, bổ nhiệm') {
                const res = await api.get('/hr/transfer-decisions');
                if (res && res.success && Array.isArray(res.data)) setTransferDecisions(res.data);
            } else if (activeSubTab === 'Đơn xin nghỉ việc') {
                const res = await api.get('/hr/resignation-applications');
                if (res && res.success && Array.isArray(res.data)) setResignationApplications(res.data);
            } else if (activeSubTab === 'Quyết định nghỉ việc') {
                const res = await api.get('/hr/resignation-decisions');
                if (res && res.success && Array.isArray(res.data)) setResignationDecisions(res.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // --- HANDLERS DÀNH CHO HỒ SƠ NHÂN SỰ (VIEW / EDIT / DELETE / SYNC) ---
    const fetchProfileDetail = async (empId) => {
        if (!empId) return;
        setProfileDetailLoading(true);
        try {
            const res = await api.get(`/hr/employees/${empId}`);
            if (res && res.success && res.data) {
                setProfileContracts(Array.isArray(res.data.contracts) ? res.data.contracts : []);
                setProfileWorkHistory(Array.isArray(res.data.workHistory) ? res.data.workHistory : []);
                setProfileRewards(Array.isArray(res.data.rewards) ? res.data.rewards : []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setProfileDetailLoading(false);
        }
    };

    const handleViewDetail = (empId) => {
        const empObj = employees.find(e => e.employee_id === empId || e.id === empId);
        if (!empObj) return;

        fetchProfileDetail(empObj.employee_id || empObj.id);
        const shortNameVal = empObj.short_name || empObj.employee_code || generateShortName(empObj.full_name);

        setSelectedEmp(empObj);
        setEditEmpData({
            employee_id: empObj.employee_id || empObj.id,
            employee_code: empObj.employee_code || shortNameVal,
            short_name: shortNameVal,
            full_name: empObj.full_name || '',
            gender: empObj.gender || 'Nam',
            date_of_birth: empObj.date_of_birth,
            place_of_birth: empObj.place_of_birth || empObj.citizen_issue_place || '',
            is_foreign: empObj.is_foreign ? 1 : 0,
            hometown: empObj.hometown || '',
            nationality: empObj.nationality || 'Việt Nam',
            ethnicity: empObj.ethnicity || 'Kinh',
            religion: empObj.religion || 'Không',
            marital_status: empObj.marital_status || 'Độc thân',
            citizen_id: empObj.citizen_id || '',
            citizen_issue_date: empObj.citizen_issue_date,
            citizen_issue_place: empObj.citizen_issue_place || '',
            phone: empObj.phone || '',
            email: empObj.email || empObj.company_email || empObj.personal_email || '',
            personal_email: empObj.personal_email || empObj.email || '',
            company_email: empObj.company_email || empObj.email || '',
            address: empObj.address || '',
            permanent_address: empObj.permanent_address || '',
            department_id: empObj.department_id || '',
            department_name: empObj.department_name || '',
            position_id: empObj.position_id || '',
            position_name: empObj.position_name || '',
            manager_id: empObj.manager_id || null,
            manager_name: empObj.manager_name || null,
            level: empObj.level || 'Nhân viên',
            join_date: empObj.join_date,
            official_date: empObj.official_date,
            resignation_date: empObj.resignation_date || null,
            employment_status: empObj.employment_status || 'WORKING',
            note: empObj.note || ''
        });
        setActiveEmpTab('basic');
        setIsEditingEmp(false);
        setEmpFormErrors({});
        setModalType(null);
    };

    const handleBackToList = () => {
        if (isEditingEmp) {
            const isChanged =
                (editEmpData.full_name || '') !== (selectedEmp.full_name || '') ||
                (editEmpData.email || '') !== (selectedEmp.email || '') ||
                (editEmpData.phone || '') !== (selectedEmp.phone || '') ||
                (editEmpData.department_id || '') !== (selectedEmp.department_id || '') ||
                (editEmpData.position_id || '') !== (selectedEmp.position_id || '') ||
                (editEmpData.manager_id || '') !== (selectedEmp.manager_id || '') ||
                (editEmpData.level || '') !== (selectedEmp.level || '') ||
                (editEmpData.employment_status || '') !== (selectedEmp.employment_status || '');

            if (isChanged) {
                if (!window.confirm('Bạn có thay đổi chưa được lưu. Bạn có chắc chắn muốn hủy?')) {
                    return;
                }
            }
        }
        setSelectedEmp(null);
        setIsEditingEmp(false);
        setEmpFormErrors({});
    };

    const handleOpenCreateEmpPage = () => {
        const firstDept = departments[0]?.department_id || 'dept-hr';
        const firstPos = positions[0]?.position_id || 'pos-hr-spec';
        const newEmp = {
            isNew: true,
            employee_code: '',
            short_name: '',
            full_name: '',
            gender: 'Nam',
            date_of_birth: '',
            place_of_birth: '',
            is_foreign: 0,
            hometown: '',
            nationality: 'Việt Nam',
            ethnicity: 'Kinh',
            religion: 'Không',
            marital_status: 'Độc thân',
            phone: '',
            personal_email: '',
            company_email: '',
            email: '',
            address: '',
            permanent_address: '',
            department_id: firstDept,
            position_id: firstPos,
            level: 'Nhân viên',
            manager_id: '',
            join_date: new Date().toISOString().split('T')[0],
            official_date: new Date().toISOString().split('T')[0],
            resignation_date: '',
            employment_status: 'WORKING'
        };
        setSelectedEmp(newEmp);
        setEditEmpData(newEmp);
        setIsEditingEmp(true);
        setActiveEmpTab('basic');
        setEmpFormErrors({});
    };

    const handleCancelEditEmp = () => {
        const isChanged =
            (editEmpData.full_name || '') !== (selectedEmp.full_name || '') ||
            (editEmpData.email || '') !== (selectedEmp.email || '') ||
            (editEmpData.phone || '') !== (selectedEmp.phone || '') ||
            (editEmpData.department_id || '') !== (selectedEmp.department_id || '') ||
            (editEmpData.position_id || '') !== (selectedEmp.position_id || '') ||
            (editEmpData.manager_id || '') !== (selectedEmp.manager_id || '') ||
            (editEmpData.level || '') !== (selectedEmp.level || '') ||
            (editEmpData.employment_status || '') !== (selectedEmp.employment_status || '');

        if (isChanged) {
            if (!window.confirm('Bạn có thay đổi chưa được lưu. Bạn có chắc chắn muốn hủy?')) {
                return;
            }
        }

        setEditEmpData({
            employee_id: selectedEmp.employee_id || selectedEmp.id,
            employee_code: selectedEmp.employee_code,
            full_name: selectedEmp.full_name || '',
            gender: selectedEmp.gender || 'Nam',
            date_of_birth: selectedEmp.date_of_birth,
            citizen_id: selectedEmp.citizen_id || '',
            citizen_issue_date: selectedEmp.citizen_issue_date,
            citizen_issue_place: selectedEmp.citizen_issue_place || '',
            phone: selectedEmp.phone || '',
            email: selectedEmp.email || '',
            address: selectedEmp.address || '',
            permanent_address: selectedEmp.permanent_address || '',
            department_id: selectedEmp.department_id || '',
            department_name: selectedEmp.department_name || '',
            position_id: selectedEmp.position_id || '',
            position_name: selectedEmp.position_name || '',
            manager_id: selectedEmp.manager_id || null,
            manager_name: selectedEmp.manager_name || null,
            level: selectedEmp.level || 'Nhân viên',
            join_date: selectedEmp.join_date,
            official_date: selectedEmp.official_date,
            employment_status: selectedEmp.employment_status || 'WORKING',
            note: selectedEmp.note || ''
        });
        setIsEditingEmp(false);
        setEmpFormErrors({});
    };

    const handleSaveEmpSubmit = async (e) => {
        if (e) e.preventDefault();

        const errors = {};
        if (!editEmpData.full_name || !editEmpData.full_name.trim()) {
            errors.full_name = 'Họ và tên không được để trống.';
        }
        if (!editEmpData.email || !editEmpData.email.trim()) {
            errors.email = 'Email không được để trống.';
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(editEmpData.email.trim())) {
                errors.email = 'Định dạng email không hợp lệ (VD: user@example.com).';
            }
        }

        if (Object.keys(errors).length > 0) {
            setEmpFormErrors(errors);
            addToast('Vui lòng kiểm tra lại thông tin nhập hợp lệ.', 'error');
            return;
        }

        if (editEmpData.isNew) {
            const shortNameVal = editEmpData.short_name || generateShortName(editEmpData.full_name);
            const payload = {
                ...editEmpData,
                employee_code: editEmpData.employee_code || shortNameVal,
                short_name: shortNameVal,
                full_name: editEmpData.full_name.trim(),
                email: editEmpData.email || editEmpData.company_email || editEmpData.personal_email || ''
            };
            try {
                const res = await api.post('/hr/employees', payload);
                if (res.success) {
                    addToast('Tạo hồ sơ nhân sự mới thành công!', 'success');
                    setSelectedEmp(null);
                    setIsEditingEmp(false);
                    setEmpFormErrors({});
                    fetchData();
                    fetchCommonData();
                } else {
                    addToast(res.message || 'Tạo hồ sơ nhân sự thất bại.', 'error');
                }
            } catch (err) {
                console.error(err);
                addToast('Đã xảy ra lỗi khi kết nối máy chủ.', 'error');
            }
            return;
        }

        const empId = editEmpData.employee_id || selectedEmp.employee_id || selectedEmp.id;
        try {
            const res = await api.put(`/hr/employees/${empId}`, editEmpData);
            if (res.success) {
                addToast('Cập nhật hồ sơ nhân sự thành công.', 'success');

                const deptObj = departments.find(d => d.department_id === editEmpData.department_id);
                const posObj = positions.find(p => p.position_id === editEmpData.position_id);
                const mgrObj = employees.find(m => m.employee_id === editEmpData.manager_id);

                const updatedEmpObj = {
                    ...selectedEmp,
                    ...editEmpData,
                    full_name: editEmpData.full_name.trim(),
                    email: editEmpData.email.trim(),
                    department_name: deptObj ? deptObj.department_name : selectedEmp.department_name,
                    position_name: posObj ? posObj.position_name : editEmpData.position_name,
                    manager_name: editEmpData.manager_id ? (mgrObj ? mgrObj.full_name : editEmpData.manager_name) : null,
                    last_modified_date: Date.now()
                };

                setSelectedEmp(updatedEmpObj);
                setEditEmpData(updatedEmpObj);
                setIsEditingEmp(false);
                setEmpFormErrors({});

                // Update in employees list
                setEmployees(prev => prev.map(e => (e.employee_id === empId || e.id === empId) ? updatedEmpObj : e));
                fetchData();
                fetchSubTabData();
            } else {
                addToast(res.message || 'Cập nhật hồ sơ nhân sự thất bại.', 'error');
            }
        } catch (err) {
            console.error(err);
            addToast('Đã xảy ra lỗi khi kết nối máy chủ.', 'error');
        }
    };

    const handleDeleteEmpClick = () => {
        const empId = selectedEmp.employee_id || selectedEmp.id;

        // Check Business Rule 1: Direct Manager of other active staff
        const managedStaff = employees.filter(e => (e.manager_id === empId || e.manager_id === selectedEmp.employee_id) && (e.is_active === 1 || e.employment_status === 'WORKING') && (e.employee_id !== empId && e.id !== empId));
        if (managedStaff.length > 0) {
            addToast(`Không thể xóa nhân sự '${selectedEmp.full_name}' do đang là Người quản lý trực tiếp của ${managedStaff.length} nhân viên khác (${managedStaff.slice(0, 2).map(s => s.full_name).join(', ')}...). Vui lòng bàn giao công việc quản lý trước khi xóa.`, 'error');
            return;
        }

        // Check Business Rule 2: Department Manager
        const isDeptMgr = departments.find(d => d.manager_id === empId || d.manager_id === selectedEmp.employee_id);
        if (isDeptMgr) {
            addToast(`Không thể xóa nhân sự '${selectedEmp.full_name}' do đang giữ vị trí Trưởng phòng của '${isDeptMgr.department_name}'. Vui lòng bổ nhiệm Trưởng phòng mới trước khi xóa.`, 'error');
            return;
        }

        setDeleteConfirmModal(true);
    };

    const handleConfirmDeleteEmp = async () => {
        const empId = selectedEmp.employee_id || selectedEmp.id;
        try {
            const res = await api.delete(`/hr/employees/${empId}`);
            if (res.success) {
                addToast('Đã xóa hồ sơ nhân sự thành công.', 'success');
                setEmployees(prev => prev.filter(e => e.employee_id !== empId && e.id !== empId));
                setDeleteConfirmModal(false);
                setSelectedEmp(null);
                setIsEditingEmp(false);
            } else {
                addToast(res.message || 'Xóa hồ sơ nhân sự thất bại.', 'error');
            }
        } catch (err) {
            console.error(err);
            addToast('Đã xảy ra lỗi khi kết nối máy chủ.', 'error');
        }
    };

    const handleCreateDepartment = async (e) => {
        e.preventDefault();
        if (!hasPermission('CREATE', 'DEPARTMENT')) {
            addToast('Tài khoản của bạn không có quyền thêm bộ phận!', 'error');
            return;
        }
        const res = await api.post('/admin/departments', formData);
        if (res.success) {
            addToast('Thêm danh mục bộ phận thành công!', 'success');
            setModalType(null);
            fetchSubTabModuleData();
            fetchCommonData();
        } else {
            addToast(res.message, 'error');
        }
    };

    const handleCreatePosition = async (e) => {
        e.preventDefault();
        if (!hasPermission('CREATE', 'POSITION')) {
            addToast('Tài khoản của bạn không có quyền thêm vị trí công việc!', 'error');
            return;
        }
        const res = await api.post('/admin/positions', formData);
        if (res.success) {
            addToast('Thêm vị trí công việc thành công!', 'success');
            setModalType(null);
            fetchSubTabModuleData();
            fetchCommonData();
        } else {
            addToast(res.message, 'error');
        }
    };

    const handleCreateEmployee = async (e) => {
        if (e) e.preventDefault();

        if (!hasPermission('CREATE', 'EMPLOYEE')) {
            addToast('Tài khoản của bạn không có quyền tạo Hồ sơ nhân viên!', 'error');
            return;
        }

        const errors = {};
        if (!createEmpData.full_name || !createEmpData.full_name.trim()) {
            errors.full_name = 'Họ và tên nhân viên không được để trống.';
        }

        if (!createEmpData.email || !createEmpData.email.trim()) {
            errors.email = 'Email công ty không được để trống.';
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(createEmpData.email.trim())) {
                errors.email = 'Định dạng email không hợp lệ (VD: user@example.com).';
            } else if (employees.some(emp => emp.email?.toLowerCase() === createEmpData.email.trim().toLowerCase())) {
                errors.email = 'Email công ty này đã được sử dụng bởi một nhân sự khác.';
            }
        }

        if (!createEmpData.phone || !createEmpData.phone.trim()) {
            errors.phone = 'Số điện thoại không được để trống.';
        } else {
            const phoneClean = createEmpData.phone.trim().replace(/[\s-()]/g, '');
            if (!/^\d{9,12}$/.test(phoneClean)) {
                errors.phone = 'Số điện thoại phải từ 9 đến 12 chữ số hợp lệ.';
            }
        }

        if (createEmpData.citizen_id && createEmpData.citizen_id.trim()) {
            const cidClean = createEmpData.citizen_id.trim();
            if (!/^\d{9,12}$/.test(cidClean)) {
                errors.citizen_id = 'Số CCCD phải từ 9 đến 12 chữ số hợp lệ.';
            } else if (employees.some(emp => emp.citizen_id && emp.citizen_id.trim() === cidClean)) {
                errors.citizen_id = 'Số CCCD này đã tồn tại trên hệ thống.';
            }
        }

        if (!createEmpData.department_id) {
            errors.department_id = 'Vui lòng chọn Phòng ban phân công.';
        }

        if (!createEmpData.position_title) {
            errors.position_title = 'Vui lòng chọn Vị trí công việc.';
        }

        if (!createEmpData.join_date) {
            errors.join_date = 'Vui lòng chọn Ngày vào làm.';
        }

        if (Object.keys(errors).length > 0) {
            setCreateEmpErrors(errors);
            addToast('Vui lòng kiểm tra lại dữ liệu nhập hợp lệ.', 'error');
            return;
        }

        // Business Rule Check 1: Trưởng phòng limit (Only 1 Trưởng phòng per Department)
        const selectedDept = departments.find(d => d.department_id === createEmpData.department_id);
        if (createEmpData.position_title === 'Trưởng phòng') {
            const existingDeptMgr = employees.find(emp =>
                emp.department_id === createEmpData.department_id &&
                (emp.position_name?.includes('Trưởng phòng') || emp.level === 'Trưởng phòng') &&
                (emp.is_active === 1 || emp.employment_status === 'WORKING')
            );
            if (existingDeptMgr) {
                addToast(`Phòng ban '${selectedDept?.department_name || ''}' đã có Trưởng phòng (${existingDeptMgr.full_name}). Không thể tạo thêm Trưởng phòng cho phòng ban này.`, 'error');
                return;
            }
        }

        // Business Rule Check 2: Trưởng nhóm limit (Max 2 Trưởng nhóm per Department)
        if (createEmpData.position_title === 'Trưởng nhóm') {
            const teamLeaders = employees.filter(emp =>
                emp.department_id === createEmpData.department_id &&
                (emp.position_name?.includes('Trưởng nhóm') || emp.level === 'Trưởng nhóm') &&
                (emp.is_active === 1 || emp.employment_status === 'WORKING')
            );
            if (teamLeaders.length >= 2) {
                addToast(`Phòng ban '${selectedDept?.department_name || ''}' đã đủ số lượng 02 Trưởng nhóm theo cơ cấu tổ chức (${teamLeaders.map(t => t.full_name).join(', ')}).`, 'error');
                return;
            }
        }

        setIsSubmittingEmp(true);
        setCreateEmpErrors({});

        try {
            // Find matching position_id or construct position_name
            const matchedPos = positions.find(p => p.position_name?.toLowerCase().includes(createEmpData.position_title.toLowerCase())) || positions[0];

            let level = 'Nhân viên';
            if (createEmpData.position_title.includes('Giám Đốc') || createEmpData.position_title.includes('Tổng Giám đốc')) {
                level = 'Ban Giám Đốc';
            } else if (createEmpData.position_title === 'Trưởng phòng') {
                level = 'Trưởng phòng';
            } else if (createEmpData.position_title === 'Trưởng nhóm') {
                level = 'Trưởng nhóm';
            }

            const mgrObj = employees.find(m => m.employee_id === createEmpData.manager_id);

            const payload = {
                full_name: createEmpData.full_name.trim(),
                gender: createEmpData.gender,
                date_of_birth: createEmpData.date_of_birth ? new Date(createEmpData.date_of_birth).getTime() : null,
                citizen_id: createEmpData.citizen_id ? createEmpData.citizen_id.trim() : '',
                email: createEmpData.email.trim(),
                phone: createEmpData.phone.trim(),
                address: createEmpData.address ? createEmpData.address.trim() : '',
                department_id: createEmpData.department_id,
                department_name: selectedDept ? selectedDept.department_name : '',
                position_id: matchedPos ? matchedPos.position_id : 'pos-emp',
                position_name: createEmpData.position_title,
                manager_id: createEmpData.manager_id || null,
                manager_name: mgrObj ? mgrObj.full_name : null,
                level: level,
                join_date: createEmpData.join_date ? new Date(createEmpData.join_date).getTime() : Date.now(),
                employment_status: createEmpData.employment_status || 'WORKING',
                note: `Loại nhân sự: ${createEmpData.employee_type}`
            };

            const res = await api.post('/hr/employees', payload);
            if (res.success) {
                addToast('Tạo hồ sơ nhân sự thành công.', 'success');

                const newEmpObject = {
                    ...payload,
                    employee_id: res.data?.id || res.data?.employee_id || `emp-${Date.now()}`,
                    id: res.data?.id || res.data?.employee_id || `emp-${Date.now()}`,
                    employee_code: res.data?.empCode || res.data?.employee_code || `NV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
                    created_date: Date.now(),
                    is_active: 1
                };

                setEmployees(prev => [newEmpObject, ...prev]);
                setModalType(null);
                fetchCommonData();
            } else {
                addToast(res.message || 'Tạo hồ sơ nhân sự thất bại.', 'error');
            }
        } catch (err) {
            console.error(err);
            addToast('Đã xảy ra lỗi kết nối máy chủ.', 'error');
        } finally {
            setIsSubmittingEmp(false);
        }
    };

    // --- QUOTA HANDLERS (Định biên nhân sự) ---
    const handleViewQuotaDetail = (quotaId) => {
        const q = quotas.find(item => item.quota_id === quotaId || item.id === quotaId);
        if (q) {
            setSelectedQuota(q);
            setEditQuotaData({
                ...q,
                effective_date: q.effective_date ? new Date(q.effective_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
            });
            setIsEditingQuota(false);
            setQuotaFormErrors({});
        }
    };

    const handleOpenCreateQuotaModal = async () => {
        const firstDept = departments[0]?.department_id || 'dept-bh';
        const today = new Date().toISOString().split('T')[0];

        try {
            const resCode = await api.get(`/hr/quotas/next-code?date=${today}`);
            const code = resCode.success && resCode.code ? resCode.code : `ĐB/${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getFullYear()).slice(-2)}-0001`;

            const empCount = employees.filter(e => e.department_id === firstDept && (e.is_active === 1 || e.employment_status === 'WORKING')).length;

            setCreateQuotaData({
                effective_date: today,
                quota_code: code,
                department_id: firstDept,
                creator_name: user?.full_name || 'HR01: HR Test 01',
                target_headcount: 10,
                max_capacity: 15,
                current_headcount: empCount,
                budget: 150000000,
                description: '',
                status: 'Đã hoàn thiện'
            });
            setCreateQuotaErrors({});
            setIsSubmittingQuota(false);
            setModalType('quota');
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateQuotaSubmit = async (e) => {
        if (e) e.preventDefault();

        const errors = {};
        if (!createQuotaData.effective_date) errors.effective_date = 'Vui lòng chọn Ngày áp dụng.';
        if (!createQuotaData.department_id) errors.department_id = 'Vui lòng chọn Bộ phận / Phòng ban.';
        if (createQuotaData.target_headcount === '' || Number(createQuotaData.target_headcount) < 0) {
            errors.target_headcount = 'Tổng định biên phải là số nguyên >= 0.';
        }
        if (createQuotaData.max_capacity === '' || Number(createQuotaData.max_capacity) < Number(createQuotaData.target_headcount)) {
            errors.max_capacity = 'Sức chứa tối đa phải lớn hơn hoặc bằng Tổng định biên.';
        }

        if (Object.keys(errors).length > 0) {
            setCreateQuotaErrors(errors);
            addToast('Vui lòng kiểm tra lại thông tin nhập hợp lệ.', 'error');
            return;
        }

        setIsSubmittingQuota(true);
        try {
            const payload = {
                effective_date: createQuotaData.effective_date,
                department_id: createQuotaData.department_id,
                creator_name: createQuotaData.creator_name,
                target_headcount: Number(createQuotaData.target_headcount),
                max_capacity: Number(createQuotaData.max_capacity),
                budget: Number(createQuotaData.budget) || 0,
                description: createQuotaData.description,
                status: createQuotaData.status || 'Đã hoàn thiện'
            };

            const res = await api.post('/hr/quotas', payload);
            if (res.success) {
                addToast('Tạo phiếu định biên nhân sự thành công!', 'success');
                setModalType(null);
                fetchCommonData();
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

    const handleSaveQuotaEdit = async () => {
        const errors = {};
        if (!editQuotaData.effective_date) errors.effective_date = 'Vui lòng chọn Ngày áp dụng.';
        if (!editQuotaData.department_id) errors.department_id = 'Vui lòng chọn Bộ phận.';
        if (editQuotaData.target_headcount === '' || Number(editQuotaData.target_headcount) < 0) {
            errors.target_headcount = 'Tổng định biên phải là số nguyên >= 0.';
        }
        if (editQuotaData.max_capacity === '' || Number(editQuotaData.max_capacity) < Number(editQuotaData.target_headcount)) {
            errors.max_capacity = 'Sức chứa tối đa phải lớn hơn hoặc bằng Tổng định biên.';
        }

        if (Object.keys(errors).length > 0) {
            setQuotaFormErrors(errors);
            addToast('Vui lòng kiểm tra lại dữ liệu nhập hợp lệ.', 'error');
            return;
        }

        try {
            const payload = {
                effective_date: editQuotaData.effective_date,
                department_id: editQuotaData.department_id,
                creator_name: editQuotaData.creator_name,
                target_headcount: Number(editQuotaData.target_headcount),
                max_capacity: Number(editQuotaData.max_capacity),
                budget: Number(editQuotaData.budget) || 0,
                description: editQuotaData.description,
                status: editQuotaData.status
            };

            const res = await api.put(`/hr/quotas/${selectedQuota.quota_id || selectedQuota.id}`, payload);
            if (res.success) {
                addToast('Cập nhật phiếu định biên nhân sự thành công.', 'success');
                setIsEditingQuota(false);

                const deptObj = departments.find(d => d.department_id === editQuotaData.department_id);
                const updated = {
                    ...selectedQuota,
                    ...payload,
                    department_name: deptObj ? deptObj.department_name : selectedQuota.department_name
                };
                setSelectedQuota(updated);
                fetchCommonData();
            } else {
                addToast(res.message || 'Cập nhật phiếu định biên thất bại.', 'error');
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
                addToast('Đã xóa phiếu định biên nhân sự thành công.', 'success');
                setDeleteQuotaConfirmModal(false);
                setSelectedQuota(null);
                fetchCommonData();
            } else {
                addToast(res.message || 'Xóa phiếu định biên thất bại.', 'error');
            }
        } catch (err) {
            console.error(err);
            addToast('Đã xảy ra lỗi kết nối máy chủ.', 'error');
        }
    };

    // --- CONTRACT MANAGEMENT HANDLERS ---
    const handleOpenCreateContractModal = () => {
        const defaultSigner = employees.find(e => e.level?.includes('Giám Đốc') || e.position_name?.includes('Giám đốc') || e.employee_code === 'QuynhNN') || employees[0];
        const defaultEmp = employees[0];
        const yr = new Date().getFullYear().toString().slice(-2);
        const count = contracts.length + 1;
        const autoNo = `HĐLĐ/${yr}-${String(count).padStart(3, '0')}`;

        setContractFormData({
            isEdit: false,
            contract_id: null,
            contract_no: autoNo,
            contract_date: new Date().toISOString().split('T')[0],
            signer_id: defaultSigner?.employee_id || '',
            signer_name: defaultSigner?.full_name || '',
            signer_position: defaultSigner?.position_name || defaultSigner?.level || 'Tổng Giám đốc',
            employee_id: defaultEmp?.employee_id || '',
            employee_position: defaultEmp?.position_name || defaultEmp?.level || 'Nhân viên',
            contract_type: 'Hợp đồng thử việc',
            start_date: new Date().toISOString().split('T')[0],
            end_date: '',
            probation_from_date: new Date().toISOString().split('T')[0],
            probation_to_date: '',
            job_description: 'Triển khai nhiệm vụ theo kế hoạch công tác của phòng ban',
            salary_scale: 'Bảng lương Chuyên viên ERP',
            salary_grade: 'Bậc 1',
            allowance_details: [
                { allowance_type: 'Phụ cấp ăn trưa', amount: 730000 },
                { allowance_type: 'Phụ cấp đi lại', amount: 500000 }
            ],
            base_salary: 15000000,
            social_insurance_salary: 5000000
        });
        setModalType('contract');
    };

    const handleOpenEditContractModal = (c) => {
        const signerObj = employees.find(e => e.employee_id === c.signer_id) || employees.find(e => e.full_name === c.signer_name) || employees[0];
        const empObj = employees.find(e => e.employee_id === c.employee_id) || employees[0];

        setContractFormData({
            isEdit: true,
            contract_id: c.contract_id,
            contract_no: c.contract_no || '',
            contract_date: c.contract_date ? (typeof c.contract_date === 'string' && c.contract_date.includes('-') ? c.contract_date : new Date(c.contract_date).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
            signer_id: c.signer_id || signerObj?.employee_id || '',
            signer_name: c.signer_name || signerObj?.full_name || '',
            signer_position: c.signer_position || signerObj?.position_name || signerObj?.level || '',
            employee_id: c.employee_id || empObj?.employee_id || '',
            employee_position: c.employee_position || empObj?.position_name || empObj?.level || '',
            contract_type: c.contract_type || 'Hợp đồng thử việc',
            start_date: c.start_date ? (typeof c.start_date === 'string' && c.start_date.includes('-') ? c.start_date : new Date(c.start_date).toISOString().split('T')[0]) : '',
            end_date: c.end_date ? (typeof c.end_date === 'string' && c.end_date.includes('-') ? c.end_date : new Date(c.end_date).toISOString().split('T')[0]) : '',
            probation_from_date: c.probation_from_date ? (typeof c.probation_from_date === 'string' && c.probation_from_date.includes('-') ? c.probation_from_date : new Date(c.probation_from_date).toISOString().split('T')[0]) : '',
            probation_to_date: c.probation_to_date ? (typeof c.probation_to_date === 'string' && c.probation_to_date.includes('-') ? c.probation_to_date : new Date(c.probation_to_date).toISOString().split('T')[0]) : '',
            job_description: c.job_description || '',
            salary_scale: c.salary_scale || 'Bảng lương Chuyên viên ERP',
            salary_grade: c.salary_grade || 'Bậc 1',
            allowance_details: Array.isArray(c.allowance_details) ? c.allowance_details : [],
            base_salary: c.base_salary || c.salary || 0,
            social_insurance_salary: c.social_insurance_salary || 0
        });
        setModalType('contract');
    };

    const handleDeleteContract = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa Hợp đồng lao động này?')) return;
        const res = await api.delete(`/hr/contracts/${id}`);
        if (res.success) {
            addToast('Xóa Hợp đồng lao động thành công!', 'success');
            fetchSubTabModuleData();
        } else {
            addToast(res.message || 'Lỗi khi xóa hợp đồng!', 'error');
        }
    };

    const handleDeleteTransferProposal = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa Đề xuất thuyên chuyển/bổ nhiệm/miễn nhiệm này?')) return;
        const res = await api.delete(`/hr/transfer-proposals/${id}`);
        if (res.success) {
            addToast('Xóa Đề xuất thành công!', 'success');
            fetchSubTabModuleData();
        } else {
            addToast(res.message || 'Lỗi khi xóa đề xuất!', 'error');
        }
    };

    const handleDeleteTransferDecision = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa Quyết định thuyên chuyển/bổ nhiệm này?')) return;
        const res = await api.delete(`/hr/transfer-decisions/${id}`);
        if (res.success) {
            addToast('Xóa Quyết định thành công!', 'success');
            fetchSubTabModuleData();
        } else {
            addToast(res.message || 'Lỗi khi xóa quyết định!', 'error');
        }
    };

    const handleAddAllowanceRow = () => {
        setContractFormData(prev => ({
            ...prev,
            allowance_details: [
                ...(prev.allowance_details || []),
                { allowance_type: 'Phụ cấp ăn trưa', amount: 500000 }
            ]
        }));
    };

    const handleRemoveAllowanceRow = (idx) => {
        setContractFormData(prev => ({
            ...prev,
            allowance_details: (prev.allowance_details || []).filter((_, i) => i !== idx)
        }));
    };

    const handleAllowanceChange = (idx, field, value) => {
        setContractFormData(prev => {
            const updated = [...(prev.allowance_details || [])];
            updated[idx] = { ...updated[idx], [field]: value };
            return { ...prev, allowance_details: updated };
        });
    };

    const handleSaveContractSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!contractFormData.employee_id) {
            addToast('Vui lòng chọn nhân viên hợp đồng.', 'error');
            return;
        }

        try {
            let res;
            if (contractFormData.isEdit) {
                res = await api.put(`/hr/contracts/${contractFormData.contract_id}`, contractFormData);
            } else {
                res = await api.post('/hr/contracts', contractFormData);
            }

            if (res.success) {
                addToast(contractFormData.isEdit ? 'Cập nhật hợp đồng lao động thành công!' : 'Tạo hợp đồng lao động mới thành công!', 'success');
                setModalType(null);
                fetchSubTabData();
            } else {
                addToast(res.message || 'Lưu hợp đồng lao động thất bại.', 'error');
            }
        } catch (err) {
            console.error(err);
            addToast('Đã xảy ra lỗi khi kết nối máy chủ.', 'error');
        }
    };

    // --- TRANSFER PROPOSAL HANDLERS ---
    const handleOpenCreateTransferProposalModal = () => {
        const defaultProposer = employees.find(e => e.level?.includes('Trưởng') || e.employee_code === 'QuynhNN') || employees[0];
        const yr = new Date().getFullYear().toString().slice(-2);
        const count = transferProposals.length + 1;
        const autoCode = `DX/TCBN-${yr}${String(count).padStart(3, '0')}`;

        const defaultEmp = employees[0] || {};
        const defaultPos = positions[0] || {};
        const defaultNewDept = departments.find(d => d.department_id === defaultPos.department_id) || departments[0] || {};

        setTransferProposalFormData({
            isEdit: false,
            proposal_id: null,
            proposal_date: new Date().toISOString().split('T')[0],
            proposal_code: autoCode,
            effective_date: new Date().toISOString().split('T')[0],
            decision_type: 'Thuyên chuyển',
            proposer_id: defaultProposer?.employee_id || '',
            proposer_name: defaultProposer?.full_name || '',
            proposer_position: defaultProposer?.position_name || defaultProposer?.level || '',
            proposer_department: defaultProposer?.department_name || '',
            note: 'Đề xuất điều chỉnh thuyên chuyển / bổ nhiệm nhân sự định kỳ',
            detail_items: [
                {
                    employee_id: defaultEmp.employee_id || '',
                    employee_name: defaultEmp.full_name || '',
                    current_position: defaultEmp.position_name || defaultEmp.level || 'Nhân viên',
                    current_department: defaultEmp.department_name || '',
                    new_position_id: defaultPos.position_id || '',
                    new_position_name: defaultPos.position_name || '',
                    new_department_id: defaultNewDept.department_id || '',
                    new_department_name: defaultNewDept.department_name || '',
                    note: ''
                }
            ]
        });
        setModalType('proposal_transfer');
    };

    const handleOpenEditTransferProposalModal = (tp) => {
        const proposer = employees.find(e => e.employee_id === tp.proposer_id) || employees.find(e => e.full_name === tp.proposer_name) || employees[0];

        setTransferProposalFormData({
            isEdit: true,
            proposal_id: tp.proposal_id,
            proposal_code: tp.proposal_code || '',
            proposal_date: tp.proposal_date ? (typeof tp.proposal_date === 'string' && tp.proposal_date.includes('-') ? tp.proposal_date : new Date(tp.proposal_date).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
            effective_date: tp.effective_date ? (typeof tp.effective_date === 'string' && tp.effective_date.includes('-') ? tp.effective_date : new Date(tp.effective_date).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
            decision_type: tp.decision_type || 'Thuyên chuyển',
            proposer_id: tp.proposer_id || proposer?.employee_id || '',
            proposer_name: tp.proposer_name || proposer?.full_name || '',
            proposer_position: tp.proposer_position || proposer?.position_name || proposer?.level || '',
            proposer_department: tp.proposer_department || proposer?.department_name || '',
            note: tp.note || '',
            detail_items: Array.isArray(tp.detail_items) ? tp.detail_items : []
        });
        setModalType('proposal_transfer');
    };

    const handleAddTransferDetailRow = () => {
        const defaultEmp = employees[0] || {};
        const defaultPos = positions[0] || {};
        const defaultNewDept = departments.find(d => d.department_id === defaultPos.department_id) || departments[0] || {};

        setTransferProposalFormData(prev => ({
            ...prev,
            detail_items: [
                ...(prev.detail_items || []),
                {
                    employee_id: defaultEmp.employee_id || '',
                    employee_name: defaultEmp.full_name || '',
                    current_position: defaultEmp.position_name || defaultEmp.level || 'Nhân viên',
                    current_department: defaultEmp.department_name || '',
                    new_position_id: defaultPos.position_id || '',
                    new_position_name: defaultPos.position_name || '',
                    new_department_id: defaultNewDept.department_id || '',
                    new_department_name: defaultNewDept.department_name || '',
                    note: ''
                }
            ]
        }));
    };

    const handleRemoveTransferDetailRow = (idx) => {
        setTransferProposalFormData(prev => ({
            ...prev,
            detail_items: (prev.detail_items || []).filter((_, i) => i !== idx)
        }));
    };

    const handleTransferDetailChange = (idx, field, value) => {
        setTransferProposalFormData(prev => {
            const updated = [...(prev.detail_items || [])];
            let row = { ...updated[idx] };

            if (field === 'employee_id') {
                const emp = employees.find(e => e.employee_id === value);
                row.employee_id = value;
                row.employee_name = emp ? emp.full_name : '';
                row.current_position = emp ? (emp.position_name || emp.level) : '';
                row.current_department = emp ? emp.department_name : '';
            } else if (field === 'new_position_id') {
                const pos = positions.find(p => p.position_id === value);
                const dept = departments.find(d => d.department_id === pos?.department_id);
                row.new_position_id = value;
                row.new_position_name = pos ? pos.position_name : '';
                row.new_department_id = dept ? dept.department_id : '';
                row.new_department_name = dept ? dept.department_name : '';
            } else {
                row[field] = value;
            }

            updated[idx] = row;
            return { ...prev, detail_items: updated };
        });
    };

    const handleSaveTransferProposalSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!transferProposalFormData.detail_items || transferProposalFormData.detail_items.length === 0) {
            addToast('Vui lòng thêm ít nhất 1 dòng chi tiết nhân sự đề xuất.', 'error');
            return;
        }

        try {
            let res;
            if (transferProposalFormData.isEdit) {
                res = await api.put(`/hr/transfer-proposals/${transferProposalFormData.proposal_id}`, transferProposalFormData);
            } else {
                res = await api.post('/hr/transfer-proposals', transferProposalFormData);
            }

            if (res.success) {
                addToast(transferProposalFormData.isEdit ? 'Cập nhật đề xuất thuyên chuyển, bổ nhiệm, miễn nhiệm thành công!' : 'Tạo phiếu đề xuất thuyên chuyển, bổ nhiệm, miễn nhiệm thành công!', 'success');
                setModalType(null);
                fetchSubTabData();
            } else {
                addToast(res.message || 'Lưu phiếu đề xuất thất bại.', 'error');
            }
        } catch (err) {
            console.error(err);
            addToast('Đã xảy ra lỗi khi kết nối máy chủ.', 'error');
        }
    };

    const handleCreateContractProposal = async (e) => {
        e.preventDefault();
        const res = await api.post('/hr/contract-proposals', formData);
        if (res.success) {
            addToast('Tạo Phiếu Đề xuất HĐLĐ thành công!', 'success');
            setModalType(null);
            fetchSubTabModuleData();
        } else {
            addToast(res.message, 'error');
        }
    };

    const handleCreateContract = async (e) => {
        e.preventDefault();
        const res = await api.post('/hr/contracts', formData);
        if (res.success) {
            addToast('Lập Hợp đồng lao động mới thành công!', 'success');
            setModalType(null);
            fetchSubTabModuleData();
            fetchCommonData();
        } else {
            addToast(res.message, 'error');
        }
    };

    const handleCreateContractExtension = async (e) => {
        e.preventDefault();
        const res = await api.post('/hr/contract-extensions', formData);
        if (res.success) {
            addToast('Tạo Phiếu Gia hạn HĐLĐ thành công!', 'success');
            setModalType(null);
            fetchSubTabModuleData();
            fetchCommonData();
        } else {
            addToast(res.message, 'error');
        }
    };

    const handleCreateTransferProposal = async (e) => {
        e.preventDefault();
        const res = await api.post('/hr/transfer-proposals', formData);
        if (res.success) {
            addToast('Tạo Phiếu Đề xuất Thuyên chuyển/Bổ nhiệm thành công!', 'success');
            setModalType(null);
            fetchSubTabModuleData();
        } else {
            addToast(res.message, 'error');
        }
    };

    const handleCreateTransferDecision = async (e) => {
        e.preventDefault();
        const res = await api.post('/hr/transfer-decisions', formData);
        if (res.success) {
            addToast('Ban hành Quyết định Thuyên chuyển/Bổ nhiệm & Cập nhật nhân sự thành công!', 'success');
            setModalType(null);
            fetchSubTabModuleData();
            fetchCommonData();
        } else {
            addToast(res.message, 'error');
        }
    };

    const handleCreateResignationApplication = async (e) => {
        e.preventDefault();
        const res = await api.post('/hr/resignation-applications', formData);
        if (res.success) {
            addToast('Tiếp nhận Đơn xin nghỉ việc thành công!', 'success');
            setModalType(null);
            fetchSubTabModuleData();
        } else {
            addToast(res.message, 'error');
        }
    };

    const handleCreateResignationDecision = async (e) => {
        e.preventDefault();
        const res = await api.post('/hr/resignation-decisions', formData);
        if (res.success) {
            addToast('Ban hành Quyết định thôi việc & Cập nhật trạng thái NGHỈ VIỆC thành công!', 'success');
            setModalType(null);
            fetchSubTabModuleData();
            fetchCommonData();
        } else {
            addToast(res.message, 'error');
        }
    };

    // --- ĐƠN XIN NGHỈ PHÉP HANDLERS ---
    const generateLeaveDetailsRows = (startDateStr, endDateStr, currentDetails = []) => {
        if (!startDateStr || !endDateStr) return [];
        const start = new Date(startDateStr);
        const end = new Date(endDateStr);
        if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return [];

        const rows = [];
        let curr = new Date(start);
        while (curr <= end) {
            const dStr = curr.toISOString().split('T')[0];
            const existing = (currentDetails || []).find(r => r.date === dStr);
            rows.push({
                date: dStr,
                time_option: existing?.time_option || 'Cả ngày',
                days: existing?.days !== undefined ? existing.days : 1.0,
                note: existing?.note || ''
            });
            curr.setDate(curr.getDate() + 1);
        }
        return rows;
    };

    const handleLeaveDetailTimeOptionChange = (idx, optionVal) => {
        setLeaveFormData(prev => {
            const updatedDetails = [...(prev.details || [])];
            let dayVal = 1.0;
            if (optionVal === 'Nửa ca đầu ngày' || optionVal === 'Nửa ca cuối ngày') dayVal = 0.5;
            updatedDetails[idx] = { ...updatedDetails[idx], time_option: optionVal, days: dayVal };

            const newTotal = updatedDetails.reduce((sum, r) => sum + Number(r.days || 1), 0);
            return { ...prev, details: updatedDetails, total_days: newTotal };
        });
    };

    const calculateRemainingLeaveDays = (empId) => {
        if (!empId) return 12;
        const empLeaves = (leaveApplications || []).filter(l => (l.employee_id === empId || l.id === empId) && l.status !== 'REJECTED');
        const usedDays = empLeaves.reduce((sum, l) => sum + Number(l.total_days || 1), 0);
        return Math.max(0, 12 - usedDays);
    };

    const handleOpenCreateLeaveModal = () => {
        const defaultEmp = employees.find(e => (e.employee_id === user?.employeeId || e.id === user?.employeeId)) || user || employees[0] || {};
        const empDeptId = defaultEmp.department_id || defaultEmp.deptId || 'dept-kd';
        const empDeptName = defaultEmp.department_name || defaultEmp.deptName || 'Phòng Kinh doanh';

        const approverObj = employees.find(e => e.department_id === empDeptId && (e.position_name?.includes('Trưởng phòng') || e.level === 'Trưởng phòng')) || { full_name: 'Nguyễn Văn Nam (Trưởng phòng)', employee_id: 'mgr-kd' };

        const todayStr = new Date().toISOString().split('T')[0];
        const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
        const initialDetails = generateLeaveDetailsRows(todayStr, tomorrowStr, []);

        setLeaveFormData({
            leave_code: `DXNP/${String(new Date().getFullYear()).slice(-2)}-${String((leaveApplications || []).length + 1).padStart(3, '0')}`,
            created_date: todayStr,
            employee_id: defaultEmp.employee_id || defaultEmp.id || 'emp-kd',
            employee_code: defaultEmp.employee_code || defaultEmp.code || 'NV-001',
            employee_name: defaultEmp.full_name || defaultEmp.name || user?.full_name || 'Nhân viên Kinh doanh',
            department_id: empDeptId,
            department_name: empDeptName,
            approver_id: approverObj.employee_id || approverObj.id || '',
            approver_name: approverObj.full_name || approverObj.name || 'Trưởng phòng Kinh doanh',
            related_person_id: '',
            related_person_name: '',
            start_date: todayStr,
            end_date: tomorrowStr,
            total_days: 2.0,
            reason: '',
            details: initialDetails
        });
        setModalType('create_leave');
    };

    const handleSaveLeaveApplication = async (e) => {
        if (e) e.preventDefault();
        if (!leaveFormData.start_date || !leaveFormData.end_date) {
            addToast('Vui lòng chọn ngày bắt đầu và kết thúc xin nghỉ!', 'error');
            return;
        }
        if (!leaveFormData.reason || leaveFormData.reason.trim() === '') {
            addToast('Vui lòng nhập lý do xin nghỉ phép!', 'error');
            return;
        }

        try {
            const payload = {
                ...leaveFormData,
                details_json: JSON.stringify(leaveFormData.details || [])
            };
            const res = await api.post('/hr/leave-applications', payload);
            if (res.success) {
                addToast(res.message || 'Tạo Đơn xin nghỉ phép thành công!', 'success');
                setModalType(null);
                fetchSubTabModuleData();
            } else {
                addToast(res.message || 'Lỗi khi tạo đơn xin nghỉ phép', 'error');
            }
        } catch (err) {
            addToast(err.message || 'Lỗi hệ thống khi gửi đơn', 'error');
        }
    };

    const handleApproveLeaveApplication = async (statusVal) => {
        if (!selectedLeave) return;
        try {
            const res = await api.put(`/hr/leave-applications/${selectedLeave.leave_id || selectedLeave.id}/approve`, {
                status: statusVal,
                approver_note: selectedLeave.approver_note || ''
            });
            if (res.success) {
                addToast(res.message || `Đã ${statusVal === 'APPROVED' ? 'Duyệt' : 'Từ chối'} Đơn xin nghỉ phép!`, 'success');
                setModalType(null);
                setSelectedLeave(null);
                fetchSubTabModuleData();
            } else {
                addToast(res.message || 'Lỗi khi cập nhật trạng thái đơn', 'error');
            }
        } catch (err) {
            addToast(err.message || 'Lỗi hệ thống khi duyệt đơn', 'error');
        }
    };

    const handleDeleteLeaveApplication = async (id, code) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa Đơn xin nghỉ phép ${code || ''}?`)) return;
        try {
            const res = await api.delete(`/hr/leave-applications/${id}`);
            if (res.success) {
                addToast(res.message || 'Đã xóa Đơn xin nghỉ phép thành công!', 'success');
                fetchSubTabModuleData();
            } else {
                addToast(res.message || 'Lỗi khi xóa đơn nghỉ phép', 'error');
            }
        } catch (err) {
            addToast(err.message || 'Lỗi hệ thống khi xóa đơn', 'error');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* 1. HỒ SƠ NHÂN SỰ */}
            {(!activeSubTab || activeSubTab === 'Hồ sơ nhân sự') && (
                selectedEmp ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {/* Top Control & Action Bar */}
                        <div className="card" style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', backgroundColor: '#FFFFFF' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <button
                                    className="btn btn-secondary"
                                    onClick={handleBackToList}
                                    style={{ padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}
                                >
                                    <ArrowLeft size={16} />
                                    <span>Quay lại</span>
                                </button>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                                            {selectedEmp.isNew ? (
                                                <span>Thêm mới hồ sơ nhân sự</span>
                                            ) : (
                                                <>Chi tiết hồ sơ nhân sự: <span style={{ color: 'var(--bravo-teal-dark)' }}>{selectedEmp.full_name}</span> ({selectedEmp.employee_code})</>
                                            )}
                                        </h2>
                                        {!selectedEmp.isNew && (
                                            <span className={`badge ${selectedEmp.employment_status === 'WORKING' ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}>
                                                {selectedEmp.employment_status === 'WORKING' ? '🟢 Đang làm việc' : '🔴 Nghỉ việc'}
                                            </span>
                                        )}
                                    </div>
                                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.825rem', color: '#64748B' }}>
                                        {selectedEmp.isNew ? 'Nhập đầy đủ thông tin để khởi tạo chứng từ nhân sự mới' : 'Quản lý thông tin định danh cá nhân, phòng ban chức vụ, quan hệ quản lý và trạng thái nhân sự'}
                                    </p>
                                </div>
                            </div>

                            {/* Action Buttons - Nhân viên thường xem hồ sơ bản thân: chỉ xem, không hiện nút Sửa/Xóa */}
                            {!isSelfServiceEmployee && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    {!isEditingEmp ? (
                                        <>
                                            {!selectedEmp.isNew && (
                                                <button
                                                    className="btn btn-danger"
                                                    onClick={handleDeleteEmpClick}
                                                    style={{ padding: '0.5rem 1.1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                                                >
                                                    <Trash2 size={16} />
                                                    <span>Xóa hồ sơ</span>
                                                </button>
                                            )}
                                            <button
                                                className="btn btn-primary"
                                                onClick={() => setIsEditingEmp(true)}
                                                style={{ padding: '0.5rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}
                                            >
                                                <Edit3 size={16} />
                                                <span>Sửa</span>
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                className="btn btn-secondary"
                                                onClick={handleCancelEditEmp}
                                                style={{ padding: '0.5rem 1.1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                            >
                                                <X size={16} />
                                                <span>Hủy</span>
                                            </button>
                                            <button
                                                className="btn btn-primary"
                                                onClick={handleSaveEmpSubmit}
                                                style={{ padding: '0.5rem 1.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, backgroundColor: 'var(--bravo-teal)' }}
                                            >
                                                <Save size={16} />
                                                <span>{selectedEmp.isNew ? 'Lưu mới' : 'Lưu'}</span>
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* TAB NAVIGATION FOR EMPLOYEE DETAIL */}
                        <div className="card" style={{ padding: '0.5rem 1rem', backgroundColor: '#FFFFFF', display: 'flex', gap: '0.5rem', borderBottom: '2px solid #E2E8F0' }}>
                            <button
                                type="button"
                                className="btn"
                                onClick={() => setActiveEmpTab('basic')}
                                style={{
                                    padding: '0.5rem 1.25rem',
                                    fontWeight: 700,
                                    fontSize: '0.875rem',
                                    borderRadius: '6px',
                                    backgroundColor: activeEmpTab === 'basic' ? 'var(--bravo-teal-light)' : 'transparent',
                                    color: activeEmpTab === 'basic' ? 'var(--bravo-teal-dark)' : '#64748B',
                                    border: activeEmpTab === 'basic' ? '1px solid var(--bravo-teal)' : '1px solid transparent'
                                }}
                            >
                                1. Thông tin cơ bản
                            </button>
                            <button
                                type="button"
                                className="btn"
                                onClick={() => setActiveEmpTab('onboarding')}
                                style={{
                                    padding: '0.5rem 1.25rem',
                                    fontWeight: 700,
                                    fontSize: '0.875rem',
                                    borderRadius: '6px',
                                    backgroundColor: activeEmpTab === 'onboarding' ? 'var(--bravo-teal-light)' : 'transparent',
                                    color: activeEmpTab === 'onboarding' ? 'var(--bravo-teal-dark)' : '#64748B',
                                    border: activeEmpTab === 'onboarding' ? '1px solid var(--bravo-teal)' : '1px solid transparent'
                                }}
                            >
                                2. Thông tin tiếp nhận ban đầu
                            </button>
                            <button
                                type="button"
                                className="btn"
                                onClick={() => setActiveEmpTab('contact')}
                                style={{
                                    padding: '0.5rem 1.25rem',
                                    fontWeight: 700,
                                    fontSize: '0.875rem',
                                    borderRadius: '6px',
                                    backgroundColor: activeEmpTab === 'contact' ? 'var(--bravo-teal-light)' : 'transparent',
                                    color: activeEmpTab === 'contact' ? 'var(--bravo-teal-dark)' : '#64748B',
                                    border: activeEmpTab === 'contact' ? '1px solid var(--bravo-teal)' : '1px solid transparent'
                                }}
                            >
                                3. Thông tin liên hệ
                            </button>
                            {!selectedEmp.isNew && (
                                <>
                                    <button
                                        type="button"
                                        className="btn"
                                        onClick={() => setActiveEmpTab('contracts')}
                                        style={{
                                            padding: '0.5rem 1.25rem',
                                            fontWeight: 700,
                                            fontSize: '0.875rem',
                                            borderRadius: '6px',
                                            backgroundColor: activeEmpTab === 'contracts' ? 'var(--bravo-teal-light)' : 'transparent',
                                            color: activeEmpTab === 'contracts' ? 'var(--bravo-teal-dark)' : '#64748B',
                                            border: activeEmpTab === 'contracts' ? '1px solid var(--bravo-teal)' : '1px solid transparent'
                                        }}
                                    >
                                        4. Hợp đồng lao động
                                    </button>
                                    <button
                                        type="button"
                                        className="btn"
                                        onClick={() => setActiveEmpTab('workhistory')}
                                        style={{
                                            padding: '0.5rem 1.25rem',
                                            fontWeight: 700,
                                            fontSize: '0.875rem',
                                            borderRadius: '6px',
                                            backgroundColor: activeEmpTab === 'workhistory' ? 'var(--bravo-teal-light)' : 'transparent',
                                            color: activeEmpTab === 'workhistory' ? 'var(--bravo-teal-dark)' : '#64748B',
                                            border: activeEmpTab === 'workhistory' ? '1px solid var(--bravo-teal)' : '1px solid transparent'
                                        }}
                                    >
                                        5. Quá trình công tác
                                    </button>
                                    <button
                                        type="button"
                                        className="btn"
                                        onClick={() => setActiveEmpTab('rewards')}
                                        style={{
                                            padding: '0.5rem 1.25rem',
                                            fontWeight: 700,
                                            fontSize: '0.875rem',
                                            borderRadius: '6px',
                                            backgroundColor: activeEmpTab === 'rewards' ? 'var(--bravo-teal-light)' : 'transparent',
                                            color: activeEmpTab === 'rewards' ? 'var(--bravo-teal-dark)' : '#64748B',
                                            border: activeEmpTab === 'rewards' ? '1px solid var(--bravo-teal)' : '1px solid transparent'
                                        }}
                                    >
                                        6. Khen thưởng / Kỷ luật
                                    </button>
                                </>
                            )}
                        </div>

                        {/* TAB 1: THÔNG TIN CƠ BẢN */}
                        {activeEmpTab === 'basic' && (
                            <div className="card" style={{ padding: '1.5rem', backgroundColor: '#FFFFFF' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '2px solid #E2E8F0', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                                    <Users size={18} color="var(--bravo-teal-dark)" />
                                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                                        1. Thông tin cơ bản
                                    </h3>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                                    <div className="form-group">
                                        <label className="form-label" style={{ fontWeight: 700 }}>Mã nhân viên</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={editEmpData.employee_code || ''}
                                            disabled
                                            readOnly
                                            style={{ backgroundColor: '#F3F4F6', color: '#374151', cursor: 'not-allowed', fontWeight: 700 }}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label" style={{ fontWeight: 700 }}>Họ và tên nhân viên (*)</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={editEmpData.full_name || ''}
                                            disabled={!isEditingEmp}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                const short = generateShortName(val);
                                                setEditEmpData({
                                                    ...editEmpData,
                                                    full_name: val,
                                                    short_name: short,
                                                    employee_code: short || editEmpData.employee_code
                                                });
                                            }}
                                            style={!isEditingEmp ? { backgroundColor: '#F3F4F6', color: '#374151', cursor: 'not-allowed' } : { backgroundColor: '#FFFFFF' }}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label" style={{ fontWeight: 700 }}>Tên ngắn gọn</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={editEmpData.short_name || ''}
                                            disabled={!isEditingEmp}
                                            onChange={(e) => setEditEmpData({ ...editEmpData, short_name: e.target.value })}
                                            style={!isEditingEmp ? { backgroundColor: '#F3F4F6', color: '#374151', cursor: 'not-allowed', fontWeight: 700 } : { backgroundColor: '#FFFFFF', fontWeight: 700 }}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Giới tính</label>
                                        <select
                                            className="form-select"
                                            value={editEmpData.gender || 'Nam'}
                                            disabled={!isEditingEmp}
                                            onChange={(e) => setEditEmpData({ ...editEmpData, gender: e.target.value })}
                                            style={!isEditingEmp ? { backgroundColor: '#F3F4F6', color: '#374151', cursor: 'not-allowed' } : { backgroundColor: '#FFFFFF' }}
                                        >
                                            <option value="Nam">Nam</option>
                                            <option value="Nữ">Nữ</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Ngày sinh</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={editEmpData.date_of_birth ? (typeof editEmpData.date_of_birth === 'string' && editEmpData.date_of_birth.includes('-') ? editEmpData.date_of_birth : new Date(editEmpData.date_of_birth).toISOString().split('T')[0]) : ''}
                                            disabled={!isEditingEmp}
                                            onChange={(e) => setEditEmpData({ ...editEmpData, date_of_birth: e.target.value })}
                                            style={!isEditingEmp ? { backgroundColor: '#F3F4F6', color: '#374151', cursor: 'not-allowed' } : { backgroundColor: '#FFFFFF' }}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Nơi sinh</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="Nơi sinh..."
                                            value={editEmpData.place_of_birth || ''}
                                            disabled={!isEditingEmp}
                                            onChange={(e) => setEditEmpData({ ...editEmpData, place_of_birth: e.target.value })}
                                            style={!isEditingEmp ? { backgroundColor: '#F3F4F6', color: '#374151', cursor: 'not-allowed' } : { backgroundColor: '#FFFFFF' }}
                                        />
                                    </div>

                                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', marginTop: '1.4rem' }}>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '0.55rem 0.85rem', border: '1px solid #CBD5E1', borderRadius: '6px', backgroundColor: '#F8FAFC', width: '100%' }}>
                                            <input
                                                type="checkbox"
                                                id="is_foreign"
                                                checked={Boolean(editEmpData.is_foreign)}
                                                disabled={!isEditingEmp}
                                                onChange={(e) => setEditEmpData({ ...editEmpData, is_foreign: e.target.checked ? 1 : 0 })}
                                                style={{ width: '18px', height: '18px', cursor: isEditingEmp ? 'pointer' : 'not-allowed', accentColor: 'var(--bravo-teal)' }}
                                            />
                                            <label htmlFor="is_foreign" style={{ margin: 0, fontWeight: 700, fontSize: '0.875rem', cursor: isEditingEmp ? 'pointer' : 'not-allowed', color: '#0F172A', userSelect: 'none' }}>
                                                Là người nước ngoài
                                            </label>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Nguyên quán</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="Nguyên quán..."
                                            value={editEmpData.hometown || ''}
                                            disabled={!isEditingEmp}
                                            onChange={(e) => setEditEmpData({ ...editEmpData, hometown: e.target.value })}
                                            style={!isEditingEmp ? { backgroundColor: '#F3F4F6', color: '#374151', cursor: 'not-allowed' } : { backgroundColor: '#FFFFFF' }}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Quốc tịch</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={editEmpData.nationality || 'Việt Nam'}
                                            disabled={!isEditingEmp}
                                            onChange={(e) => setEditEmpData({ ...editEmpData, nationality: e.target.value })}
                                            style={!isEditingEmp ? { backgroundColor: '#F3F4F6', color: '#374151', cursor: 'not-allowed' } : { backgroundColor: '#FFFFFF' }}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Dân tộc</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={editEmpData.ethnicity || 'Kinh'}
                                            disabled={!isEditingEmp}
                                            onChange={(e) => setEditEmpData({ ...editEmpData, ethnicity: e.target.value })}
                                            style={!isEditingEmp ? { backgroundColor: '#F3F4F6', color: '#374151', cursor: 'not-allowed' } : { backgroundColor: '#FFFFFF' }}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Tôn giáo</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={editEmpData.religion || 'Không'}
                                            disabled={!isEditingEmp}
                                            onChange={(e) => setEditEmpData({ ...editEmpData, religion: e.target.value })}
                                            style={!isEditingEmp ? { backgroundColor: '#F3F4F6', color: '#374151', cursor: 'not-allowed' } : { backgroundColor: '#FFFFFF' }}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Tình trạng hôn nhân</label>
                                        <select
                                            className="form-select"
                                            value={editEmpData.marital_status || 'Độc thân'}
                                            disabled={!isEditingEmp}
                                            onChange={(e) => setEditEmpData({ ...editEmpData, marital_status: e.target.value })}
                                            style={!isEditingEmp ? { backgroundColor: '#F3F4F6', color: '#374151', cursor: 'not-allowed' } : { backgroundColor: '#FFFFFF' }}
                                        >
                                            <option value="Độc thân">Độc thân</option>
                                            <option value="Đã kết hôn">Đã kết hôn</option>
                                            <option value="Khác">Khác</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: THÔNG TIN TIẾP NHẬN BAN ĐẦU */}
                        {activeEmpTab === 'onboarding' && (
                            <div className="card" style={{ padding: '1.5rem', backgroundColor: '#FFFFFF' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '2px solid #E2E8F0', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                                    <Briefcase size={18} color="var(--bravo-teal-dark)" />
                                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                                        2. Thông tin tiếp nhận ban đầu
                                    </h3>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                                    <div className="form-group">
                                        <label className="form-label" style={{ fontWeight: 700 }}>Ngày vào làm</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={editEmpData.join_date ? (typeof editEmpData.join_date === 'string' && editEmpData.join_date.includes('-') ? editEmpData.join_date : new Date(editEmpData.join_date).toISOString().split('T')[0]) : ''}
                                            disabled={!isEditingEmp}
                                            onChange={(e) => setEditEmpData({ ...editEmpData, join_date: e.target.value })}
                                            style={!isEditingEmp ? { backgroundColor: '#F3F4F6', color: '#374151', cursor: 'not-allowed' } : { backgroundColor: '#FFFFFF' }}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label" style={{ fontWeight: 700 }}>Ngày ký HĐLĐ</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={editEmpData.official_date ? (typeof editEmpData.official_date === 'string' && editEmpData.official_date.includes('-') ? editEmpData.official_date : new Date(editEmpData.official_date).toISOString().split('T')[0]) : ''}
                                            disabled={!isEditingEmp}
                                            onChange={(e) => setEditEmpData({ ...editEmpData, official_date: e.target.value })}
                                            style={!isEditingEmp ? { backgroundColor: '#F3F4F6', color: '#374151', cursor: 'not-allowed' } : { backgroundColor: '#FFFFFF' }}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label" style={{ fontWeight: 700 }}>Bộ phận (*)</label>
                                        <select
                                            className="form-select"
                                            value={editEmpData.department_id || ''}
                                            disabled={!isEditingEmp}
                                            onChange={(e) => setEditEmpData({ ...editEmpData, department_id: e.target.value })}
                                            style={!isEditingEmp ? { backgroundColor: '#F3F4F6', color: '#374151', cursor: 'not-allowed' } : { backgroundColor: '#FFFFFF' }}
                                        >
                                            {departments.map((d) => (
                                                <option key={d.department_id} value={d.department_id}>{d.department_name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label" style={{ fontWeight: 700 }}>Vị trí công việc</label>
                                        <select
                                            className="form-select"
                                            value={editEmpData.position_id || ''}
                                            disabled={!isEditingEmp}
                                            onChange={(e) => {
                                                const posObj = positions.find(p => p.position_id === e.target.value);
                                                setEditEmpData({
                                                    ...editEmpData,
                                                    position_id: e.target.value,
                                                    position_name: posObj ? posObj.position_name : editEmpData.position_name
                                                });
                                            }}
                                            style={!isEditingEmp ? { backgroundColor: '#F3F4F6', color: '#374151', cursor: 'not-allowed' } : { backgroundColor: '#FFFFFF' }}
                                        >
                                            {positions.map((p) => (
                                                <option key={p.position_id} value={p.position_id}>{p.position_name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label" style={{ fontWeight: 700 }}>Chức vụ (*)</label>
                                        <select
                                            className="form-select"
                                            value={editEmpData.level || 'Nhân viên'}
                                            disabled={!isEditingEmp}
                                            onChange={(e) => setEditEmpData({ ...editEmpData, level: e.target.value })}
                                            style={!isEditingEmp ? { backgroundColor: '#F3F4F6', color: '#374151', cursor: 'not-allowed' } : { backgroundColor: '#FFFFFF' }}
                                        >
                                            <option value="Nhân viên">Nhân viên</option>
                                            <option value="Trưởng Nhóm">Trưởng Nhóm</option>
                                            <option value="Trưởng Phòng">Trưởng Phòng</option>
                                            <option value="Phó Giám Đốc">Phó Giám Đốc</option>
                                            <option value="Giám Đốc">Giám Đốc</option>
                                            <option value="Trợ lý Giám đốc">Trợ lý Giám đốc</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label" style={{ fontWeight: 700 }}>Quản lý trực tiếp</label>
                                        <select
                                            className="form-select"
                                            value={editEmpData.manager_id || ''}
                                            disabled={!isEditingEmp}
                                            onChange={(e) => {
                                                const mgrObj = employees.find(m => m.employee_id === e.target.value);
                                                setEditEmpData({
                                                    ...editEmpData,
                                                    manager_id: e.target.value || null,
                                                    manager_name: mgrObj ? mgrObj.full_name : null
                                                });
                                            }}
                                            style={!isEditingEmp ? { backgroundColor: '#F3F4F6', color: '#374151', cursor: 'not-allowed' } : { backgroundColor: '#FFFFFF' }}
                                        >
                                            <option value="">-- Không có (Thuộc Ban Giám Đốc) --</option>
                                            {employees.filter(m => (m.employee_id !== editEmpData.employee_id && m.id !== editEmpData.employee_id)).map((m) => (
                                                <option key={m.employee_id} value={m.employee_id}>
                                                    {m.full_name} ({m.level || m.position_name})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 3: THÔNG TIN LIÊN HỆ */}
                        {activeEmpTab === 'contact' && (
                            <div className="card" style={{ padding: '1.5rem', backgroundColor: '#FFFFFF' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '2px solid #E2E8F0', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                                    <Mail size={18} color="var(--bravo-teal-dark)" />
                                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                                        3. Thông tin liên hệ
                                    </h3>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">SĐT</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={editEmpData.phone || ''}
                                            disabled={!isEditingEmp}
                                            onChange={(e) => setEditEmpData({ ...editEmpData, phone: e.target.value })}
                                            style={!isEditingEmp ? { backgroundColor: '#F3F4F6', color: '#374151', cursor: 'not-allowed' } : { backgroundColor: '#FFFFFF' }}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Email cá nhân</label>
                                        <input
                                            type="email"
                                            className="form-input"
                                            placeholder="email.canhan@gmail.com..."
                                            value={editEmpData.personal_email || ''}
                                            disabled={!isEditingEmp}
                                            onChange={(e) => setEditEmpData({ ...editEmpData, personal_email: e.target.value })}
                                            style={!isEditingEmp ? { backgroundColor: '#F3F4F6', color: '#374151', cursor: 'not-allowed' } : { backgroundColor: '#FFFFFF' }}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label" style={{ fontWeight: 700 }}>Email công ty (*)</label>
                                        <input
                                            type="email"
                                            className="form-input"
                                            value={editEmpData.company_email || editEmpData.email || ''}
                                            disabled={!isEditingEmp}
                                            onChange={(e) => setEditEmpData({ ...editEmpData, company_email: e.target.value, email: e.target.value })}
                                            style={!isEditingEmp ? { backgroundColor: '#F3F4F6', color: '#374151', cursor: 'not-allowed' } : { backgroundColor: '#FFFFFF' }}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Địa chỉ (hiện tại)</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="Địa chỉ cư trú hiện tại..."
                                            value={editEmpData.address || ''}
                                            disabled={!isEditingEmp}
                                            onChange={(e) => setEditEmpData({ ...editEmpData, address: e.target.value })}
                                            style={!isEditingEmp ? { backgroundColor: '#F3F4F6', color: '#374151', cursor: 'not-allowed' } : { backgroundColor: '#FFFFFF' }}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Địa chỉ (thường trú)</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="Địa chỉ hộ khẩu thường trú..."
                                            value={editEmpData.permanent_address || ''}
                                            disabled={!isEditingEmp}
                                            onChange={(e) => setEditEmpData({ ...editEmpData, permanent_address: e.target.value })}
                                            style={!isEditingEmp ? { backgroundColor: '#F3F4F6', color: '#374151', cursor: 'not-allowed' } : { backgroundColor: '#FFFFFF' }}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Ngày nghỉ việc</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={editEmpData.resignation_date ? (typeof editEmpData.resignation_date === 'string' && editEmpData.resignation_date.includes('-') ? editEmpData.resignation_date : new Date(editEmpData.resignation_date).toISOString().split('T')[0]) : ''}
                                            disabled={!isEditingEmp}
                                            onChange={(e) => setEditEmpData({ ...editEmpData, resignation_date: e.target.value })}
                                            style={!isEditingEmp ? { backgroundColor: '#F3F4F6', color: '#374151', cursor: 'not-allowed' } : { backgroundColor: '#FFFFFF' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 4: HỢP ĐỒNG LAO ĐỘNG */}
                        {activeEmpTab === 'contracts' && !selectedEmp.isNew && (
                            <div className="card" style={{ padding: '1.5rem', backgroundColor: '#FFFFFF' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '2px solid #E2E8F0', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                                    <FileText size={18} color="var(--bravo-teal-dark)" />
                                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>Toàn bộ hợp đồng lao động đã ký</h3>
                                </div>
                                {profileDetailLoading ? (
                                    <p style={{ color: '#64748B', fontSize: '0.875rem' }}>Đang tải dữ liệu...</p>
                                ) : profileContracts.length === 0 ? (
                                    <p style={{ color: '#64748B', fontSize: '0.875rem' }}>Chưa có hợp đồng lao động nào được ghi nhận.</p>
                                ) : (
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                        <thead>
                                            <tr style={{ backgroundColor: '#F8FAFC', textAlign: 'left' }}>
                                                <th style={{ padding: '0.6rem 0.75rem', borderBottom: '2px solid #E2E8F0' }}>Số HĐ</th>
                                                <th style={{ padding: '0.6rem 0.75rem', borderBottom: '2px solid #E2E8F0' }}>Loại hợp đồng</th>
                                                <th style={{ padding: '0.6rem 0.75rem', borderBottom: '2px solid #E2E8F0' }}>Ngày ký</th>
                                                <th style={{ padding: '0.6rem 0.75rem', borderBottom: '2px solid #E2E8F0' }}>Ngày bắt đầu</th>
                                                <th style={{ padding: '0.6rem 0.75rem', borderBottom: '2px solid #E2E8F0' }}>Ngày kết thúc</th>
                                                <th style={{ padding: '0.6rem 0.75rem', borderBottom: '2px solid #E2E8F0' }}>Trạng thái</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {profileContracts.map((c, idx) => (
                                                <tr key={c.contract_id || idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                                    <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600 }}>{c.contract_no}</td>
                                                    <td style={{ padding: '0.6rem 0.75rem' }}>{c.contract_type}</td>
                                                    <td style={{ padding: '0.6rem 0.75rem' }}>{c.sign_date ? new Date(c.sign_date).toLocaleDateString('vi-VN') : '—'}</td>
                                                    <td style={{ padding: '0.6rem 0.75rem' }}>{c.start_date ? new Date(c.start_date).toLocaleDateString('vi-VN') : '—'}</td>
                                                    <td style={{ padding: '0.6rem 0.75rem' }}>{c.end_date ? new Date(c.end_date).toLocaleDateString('vi-VN') : 'Không xác định'}</td>
                                                    <td style={{ padding: '0.6rem 0.75rem' }}>
                                                        <span className={`badge ${c.status === 'ACTIVE' ? 'badge-green' : c.status === 'EXPIRED' ? 'badge-gray' : 'badge-red'}`}>
                                                            {c.status === 'ACTIVE' ? 'Đang hiệu lực' : c.status === 'EXPIRED' ? 'Đã hết hạn' : c.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}

                        {/* TAB 5: QUÁ TRÌNH CÔNG TÁC */}
                        {activeEmpTab === 'workhistory' && !selectedEmp.isNew && (
                            <div className="card" style={{ padding: '1.5rem', backgroundColor: '#FFFFFF' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '2px solid #E2E8F0', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                                    <TrendingUp size={18} color="var(--bravo-teal-dark)" />
                                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>Lịch sử phòng ban, chức vụ theo thời gian</h3>
                                </div>
                                {profileDetailLoading ? (
                                    <p style={{ color: '#64748B', fontSize: '0.875rem' }}>Đang tải dữ liệu...</p>
                                ) : profileWorkHistory.length === 0 ? (
                                    <p style={{ color: '#64748B', fontSize: '0.875rem' }}>Chưa có lịch sử quá trình công tác nào được ghi nhận.</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {[...profileWorkHistory].sort((a, b) => (a.effective_date || 0) - (b.effective_date || 0)).map((wh, idx) => (
                                            <div key={wh.work_history_id || idx} style={{ display: 'flex', gap: '1rem', padding: '0.85rem 1rem', backgroundColor: '#F8FAFC', borderRadius: '8px', borderLeft: '3px solid var(--bravo-teal)' }}>
                                                <div style={{ minWidth: '110px', fontWeight: 700, color: 'var(--bravo-teal-dark)', fontSize: '0.85rem' }}>
                                                    {wh.effective_date ? new Date(wh.effective_date).toLocaleDateString('vi-VN') : '—'}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0F172A' }}>
                                                        {wh.position_name || wh.position_id} — {wh.department_name || wh.department_id}
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.15rem' }}>
                                                        {wh.decision_type === 'RECRUIT' ? 'Tuyển dụng mới' : wh.decision_type === 'PROMOTION' ? 'Bổ nhiệm / Thăng chức' : wh.decision_type === 'TRANSFER' ? 'Điều chuyển phòng ban' : wh.decision_type}
                                                        {wh.reason ? ` — ${wh.reason}` : ''}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB 6: KHEN THƯỞNG / KỶ LUẬT */}
                        {activeEmpTab === 'rewards' && !selectedEmp.isNew && (
                            <div className="card" style={{ padding: '1.5rem', backgroundColor: '#FFFFFF' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '2px solid #E2E8F0', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                                    <Award size={18} color="var(--bravo-teal-dark)" />
                                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>Lịch sử khen thưởng & kỷ luật</h3>
                                </div>
                                {profileDetailLoading ? (
                                    <p style={{ color: '#64748B', fontSize: '0.875rem' }}>Đang tải dữ liệu...</p>
                                ) : profileRewards.length === 0 ? (
                                    <p style={{ color: '#64748B', fontSize: '0.875rem' }}>Chưa có khen thưởng/kỷ luật nào được ghi nhận.</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {profileRewards.map((rd, idx) => {
                                            const isReward = rd.decision_type === 'REWARD';
                                            return (
                                                <div key={rd.reward_discipline_id || idx} style={{
                                                    padding: '0.85rem 1rem',
                                                    backgroundColor: isReward ? '#F0FDF4' : '#FEF2F2',
                                                    borderRadius: '8px',
                                                    borderLeft: `3px solid ${isReward ? '#16A34A' : '#DC2626'}`
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                        <span style={{ fontWeight: 700, fontSize: '0.875rem', color: isReward ? '#166534' : '#991B1B' }}>
                                                            {isReward ? '🏆 Khen thưởng' : '⚠️ Kỷ luật'} — {rd.decision_no}
                                                        </span>
                                                        <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                                                            {rd.decision_date ? new Date(rd.decision_date).toLocaleDateString('vi-VN') : '—'}
                                                        </span>
                                                    </div>
                                                    <div style={{ fontSize: '0.85rem', color: '#0F172A', marginTop: '0.35rem', fontWeight: 600 }}>{rd.reason}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.2rem' }}>{rd.content}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.35rem' }}>Ký duyệt: {rd.decision_by}</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* Multi-criteria Filter Bar ("Điều kiện lọc") */}
                        <div className="card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', backgroundColor: '#FFFFFF' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Filter size={18} color="var(--bravo-teal-dark)" />
                                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>Điều kiện lọc:</h3>
                            </div>

                            {/* Filter 1: Phòng ban */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span style={{ fontSize: '0.825rem', color: '#64748B', fontWeight: 600 }}>Phòng ban:</span>
                                <select
                                    value={filterDept}
                                    onChange={(e) => setFilterDept(e.target.value)}
                                    style={{ padding: '0.4rem 0.65rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.825rem', outline: 'none', backgroundColor: '#FFFFFF', fontWeight: 600 }}
                                >
                                    <option value="ALL">Tất cả phòng ban</option>
                                    {departments.map((d) => (
                                        <option key={d.department_id} value={d.department_id}>{d.department_name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Filter 2: Cấp bậc */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span style={{ fontSize: '0.825rem', color: '#64748B', fontWeight: 600 }}>Cấp bậc:</span>
                                <select
                                    value={filterLevel}
                                    onChange={(e) => setFilterLevel(e.target.value)}
                                    style={{ padding: '0.4rem 0.65rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.825rem', outline: 'none', backgroundColor: '#FFFFFF', fontWeight: 600 }}
                                >
                                    <option value="ALL">Tất cả cấp bậc</option>
                                    <option value="Ban Giám Đốc">Ban Giám Đốc</option>
                                    <option value="Trưởng phòng">Trưởng phòng</option>
                                    <option value="Trưởng nhóm">Trưởng nhóm</option>
                                    <option value="Nhân viên">Nhân viên</option>
                                </select>
                            </div>

                            {/* Filter 3: Trạng thái */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span style={{ fontSize: '0.825rem', color: '#64748B', fontWeight: 600 }}>Trạng thái:</span>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    style={{ padding: '0.4rem 0.65rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.825rem', outline: 'none', backgroundColor: '#FFFFFF', fontWeight: 600 }}
                                >
                                    <option value="ALL">Tất cả trạng thái</option>
                                    <option value="WORKING">🟢 Đang làm việc</option>
                                    <option value="RESIGNED">🔴 Nghỉ việc</option>
                                </select>
                            </div>

                            {(filterDept !== 'ALL' || filterLevel !== 'ALL' || filterStatus !== 'ALL') && (
                                <button
                                    className="btn btn-secondary"
                                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', color: '#DC2626', borderColor: '#FCA5A5', backgroundColor: '#FEF2F2', fontWeight: 700 }}
                                    onClick={() => { setFilterDept('ALL'); setFilterLevel('ALL'); setFilterStatus('ALL'); }}
                                >
                                    Xóa bộ lọc
                                </button>
                            )}
                        </div>

                        <DataTable
                            loading={loading}
                            addLabel="Thêm Hồ sơ Nhân viên Mới"
                            onAdd={handleOpenCreateEmpPage}
                            onRowDoubleClick={(row) => handleViewDetail(row.employee_id || row.id)}
                            searchPlaceholder="Tìm mã nhân viên, họ tên, số CCCD..."
                            columns={[
                                { header: 'Mã nhân viên', accessor: 'employee_code', render: (r) => <b style={{ color: 'var(--bravo-teal-dark)', whiteSpace: 'nowrap' }}>{r.employee_code || r.short_name}</b> },
                                {
                                    header: 'Tên nhân viên',
                                    accessor: 'full_name',
                                    render: (r) => <span style={{ fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap' }}>{r.full_name}</span>
                                },
                                { header: 'Tên ngắn gọn', accessor: 'short_name', render: (r) => <b style={{ color: '#0284C7', whiteSpace: 'nowrap' }}>{r.short_name || r.employee_code}</b> },
                                { header: 'Bộ phận', accessor: 'department_name', render: (r) => <span style={{ whiteSpace: 'nowrap' }}>{r.department_name}</span> },
                                {
                                    header: 'Chức vụ',
                                    accessor: 'level',
                                    render: (r) => {
                                        const pos = r.level || r.position_name || 'Nhân viên';
                                        let bStyle = { backgroundColor: '#F1F5F9', color: '#475569' };
                                        if (pos.includes('Giám Đốc') || pos.includes('Giám đốc')) bStyle = { backgroundColor: '#F3E8FF', color: '#6B21A8' };
                                        else if (pos.includes('Trưởng Phòng') || pos.includes('Trưởng phòng')) bStyle = { backgroundColor: '#EFF6FF', color: '#1E40AF' };
                                        else if (pos.includes('Trưởng Nhóm') || pos.includes('Trưởng nhóm')) bStyle = { backgroundColor: '#E8F4F1', color: '#2D6F62' };
                                        return (
                                            <span style={{ padding: '0.2rem 0.55rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap', ...bStyle }}>
                                                {pos}
                                            </span>
                                        );
                                    }
                                },
                                { header: 'Ngày vào làm', render: (r) => <span style={{ whiteSpace: 'nowrap' }}>{r.join_date ? new Date(r.join_date).toLocaleDateString('vi-VN') : '—'}</span> },
                                { header: 'Ngày ký HĐLĐ', render: (r) => <span style={{ whiteSpace: 'nowrap' }}>{r.official_date ? new Date(r.official_date).toLocaleDateString('vi-VN') : '—'}</span> },
                                { header: 'Thâm niên', render: (r) => <span style={{ fontWeight: 700, color: '#047857', whiteSpace: 'nowrap' }}>{calculateTenure(r.join_date)}</span> },
                                { header: 'Ngày sinh', render: (r) => <span style={{ whiteSpace: 'nowrap' }}>{r.date_of_birth ? new Date(r.date_of_birth).toLocaleDateString('vi-VN') : '—'}</span> },
                                { header: 'Giới tính', accessor: 'gender', render: (r) => <span style={{ whiteSpace: 'nowrap' }}>{r.gender}</span> },
                                { header: 'SĐT', accessor: 'phone', render: (r) => <span style={{ whiteSpace: 'nowrap' }}>{r.phone || '—'}</span> },
                                { header: 'Email', render: (r) => <span style={{ whiteSpace: 'nowrap' }}>{r.company_email || r.email || r.personal_email || '—'}</span> },
                                { header: 'Nơi sinh', render: (r) => <span style={{ whiteSpace: 'nowrap' }}>{r.place_of_birth || r.citizen_issue_place || '—'}</span> },
                                { header: 'Địa chỉ (hiện tại)', render: (r) => <span style={{ whiteSpace: 'nowrap' }}>{r.address || '—'}</span> },
                                { header: 'Địa chỉ (thường trú)', render: (r) => <span style={{ whiteSpace: 'nowrap' }}>{r.permanent_address || '—'}</span> },
                                { header: 'Ngày nghỉ việc', render: (r) => <span style={{ whiteSpace: 'nowrap' }}>{r.resignation_date ? new Date(r.resignation_date).toLocaleDateString('vi-VN') : '—'}</span> }
                            ]}
                            data={employees.filter(emp => {
                                if (filterDept !== 'ALL' && emp.department_id !== filterDept && emp.department_name !== filterDept) return false;
                                if (filterLevel !== 'ALL') {
                                    const empLvl = emp.level || (emp.position_name?.includes('Giám Đốc') ? 'Ban Giám Đốc' : emp.position_name?.includes('Trưởng phòng') ? 'Trưởng phòng' : emp.position_name?.includes('Trưởng nhóm') ? 'Trưởng nhóm' : 'Nhân viên');
                                    if (empLvl.toLowerCase() !== filterLevel.toLowerCase()) return false;
                                }
                                if (filterStatus !== 'ALL' && emp.employment_status !== filterStatus) return false;
                                return true;
                            })}
                        />
                    </div>
                )
            )}



            {/* 2. DANH MỤC BỘ PHẬN */}
            {activeSubTab === 'Danh mục bộ phận' && (
                <DataTable
                    loading={loading}
                    addLabel="Thêm Bộ phận / Phòng ban Mới"
                    onAdd={() => {
                        setFormData({
                            department_code: 'PB-' + Math.floor(100 + Math.random() * 900),
                            department_name: ''
                        });
                        setModalType('dept');
                    }}
                    searchPlaceholder="Tìm mã bộ phận, tên phòng ban..."
                    columns={[
                        { header: 'Mã Bộ phận', accessor: 'department_code', render: (r) => <b>{r.department_code}</b> },
                        { header: 'Tên Bộ phận / Phòng ban', accessor: 'department_name', render: (r) => <span style={{ fontWeight: 700, color: 'var(--bravo-teal-dark)' }}>{r.department_name}</span> },
                        { header: 'Quản lý Trưởng bộ phận', accessor: 'manager_name', render: (r) => r.manager_name || 'Chưa phân công' },
                        { header: 'Mô tả nhiệm vụ', accessor: 'description' },
                        { header: 'Trạng thái', render: () => <span className="badge badge-green">Hoạt động</span> }
                    ]}
                    data={departments}
                />
            )}

            {/* 3. DANH MỤC VỊ TRÍ CÔNG VIỆC */}
            {activeSubTab === 'Danh mục vị trí công việc' && (
                <DataTable
                    loading={loading}
                    addLabel="Thêm Vị trí Công việc Mới"
                    onAdd={() => {
                        setFormData({
                            position_code: 'VT-' + Math.floor(100 + Math.random() * 900),
                            position_name: '',
                            department_id: departments[0]?.department_id || ''
                        });
                        setModalType('pos');
                    }}
                    searchPlaceholder="Tìm mã vị trí, tên chức danh..."
                    columns={[
                        { header: 'Mã Vị trí', accessor: 'position_code', render: (r) => <b>{r.position_code}</b> },
                        { header: 'Tên Vị trí / Chức danh', accessor: 'position_name', render: (r) => <span style={{ fontWeight: 700, color: 'var(--bravo-teal-dark)' }}>{r.position_name}</span> },
                        { header: 'Trực thuộc Bộ phận', accessor: 'department_name' },
                        { header: 'Mô tả công việc', accessor: 'description' },
                        { header: 'Trạng thái', render: () => <span className="badge badge-green">Đang dùng</span> }
                    ]}
                    data={positions}
                />
            )}



            {/* 5. HỢP ĐỒNG LAO ĐỘNG (ĐÃ TÁCH RIÊNG PHIẾU HĐLĐ) */}
            {/* 5. HỢP ĐỒNG LAO ĐỘNG */}
            {activeSubTab === 'Hợp đồng lao động' && (
                <DataTable
                    loading={loading}
                    addLabel="Lập Phiếu Hợp đồng Lao động Mới"
                    onAdd={handleOpenCreateContractModal}
                    onRowDoubleClick={(row) => handleOpenEditContractModal(row)}
                    searchPlaceholder="Tìm số hợp đồng, tên nhân viên..."
                    columns={[
                        { header: 'Số Hợp đồng', accessor: 'contract_no', render: (r) => <b style={{ color: 'var(--bravo-teal-dark)', whiteSpace: 'nowrap' }}>{r.contract_no}</b> },
                        { header: 'Ngày HĐ', render: (r) => <span style={{ whiteSpace: 'nowrap' }}>{r.contract_date ? new Date(r.contract_date).toLocaleDateString('vi-VN') : (r.created_date ? new Date(r.created_date).toLocaleDateString('vi-VN') : '—')}</span> },
                        { header: 'Người ký', render: (r) => <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{r.signer_name || 'Bùi Xuân Thức'}</span> },
                        { header: 'Nhân viên', accessor: 'employee_name', render: (r) => <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{r.employee_name} ({r.employee_code})</span> },
                        { header: 'Loại hợp đồng', accessor: 'contract_type', render: (r) => <span className="badge badge-teal" style={{ whiteSpace: 'nowrap' }}>{r.contract_type}</span> },
                        { header: 'Lương cơ sở', render: (r) => <b style={{ color: '#059669', whiteSpace: 'nowrap' }}>{Number(r.base_salary || r.salary || 0).toLocaleString('vi-VN')} VNĐ</b> },
                        { header: 'Lương đóng BHXH', render: (r) => <span style={{ fontWeight: 600, color: '#0284C7', whiteSpace: 'nowrap' }}>{Number(r.social_insurance_salary || 0).toLocaleString('vi-VN')} VNĐ</span> },
                        { header: 'Thời hạn', render: (r) => <span style={{ whiteSpace: 'nowrap' }}>{r.start_date ? new Date(r.start_date).toLocaleDateString('vi-VN') : '—'} ➔ {r.end_date ? new Date(r.end_date).toLocaleDateString('vi-VN') : 'Không thời hạn'}</span> },
                        {
                            header: 'Thao tác',
                            render: (r) => (
                                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', whiteSpace: 'nowrap' }}>
                                    <button
                                        className="btn btn-secondary"
                                        style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}
                                        onClick={() => handleOpenEditContractModal(r)}
                                    >
                                        <Edit3 size={14} />
                                        <span>Sửa</span>
                                    </button>
                                    <button
                                        className="btn btn-secondary"
                                        style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', fontWeight: 600, color: '#EF4444', borderColor: '#FCA5A5', display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}
                                        onClick={() => handleDeleteContract(r.contract_id)}
                                        title="Xóa hợp đồng"
                                    >
                                        <Trash2 size={14} />
                                        <span>Xóa</span>
                                    </button>
                                </div>
                            )
                        }
                    ]}
                    data={contracts}
                />
            )}

            {/* 6. ĐỀ XUẤT THUYÊN CHUYỂN, BỔ NHIỆM, MIỄN NHIỆM */}
            {activeSubTab === 'Đề xuất thuyên chuyển, bổ nhiệm, miễn nhiệm' && (
                <DataTable
                    loading={loading}
                    addLabel="Lập Phiếu Đề xuất Thuyên chuyển, Bổ nhiệm, Miễn nhiệm"
                    onAdd={handleOpenCreateTransferProposalModal}
                    onRowDoubleClick={(row) => handleOpenEditTransferProposalModal(row)}
                    searchPlaceholder="Tìm số đề xuất, người đề xuất, nhân viên..."
                    columns={[
                        { header: 'Số Đề xuất', accessor: 'proposal_code', render: (r) => <b style={{ color: 'var(--bravo-teal-dark)', whiteSpace: 'nowrap' }}>{r.proposal_code}</b> },
                        { header: 'Ngày đề xuất', render: (r) => <span style={{ whiteSpace: 'nowrap' }}>{r.proposal_date ? new Date(r.proposal_date).toLocaleDateString('vi-VN') : (r.created_date ? new Date(r.created_date).toLocaleDateString('vi-VN') : '—')}</span> },
                        { header: 'Loại quyết định', accessor: 'decision_type', render: (r) => <span className="badge badge-teal" style={{ whiteSpace: 'nowrap' }}>{r.decision_type || 'Thuyên chuyển'}</span> },
                        { header: 'Người đề xuất', render: (r) => <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{r.proposer_name || 'Bùi Xuân Thức'}</span> },
                        { header: 'Số lượng NV', render: (r) => <b style={{ color: '#0284C7', whiteSpace: 'nowrap' }}>{Array.isArray(r.detail_items) ? r.detail_items.length : 1} nhân viên</b> },
                        { header: 'Ngày hiệu lực', render: (r) => <span style={{ whiteSpace: 'nowrap' }}>{r.effective_date ? new Date(r.effective_date).toLocaleDateString('vi-VN') : (r.proposed_effective_date ? new Date(r.proposed_effective_date).toLocaleDateString('vi-VN') : '—')}</span> },
                        { header: 'Ghi chú / Lý do', accessor: 'note', render: (r) => <span>{r.note || r.reason || '—'}</span> },
                        { header: 'Trạng thái', accessor: 'status', render: (r) => <span className="badge badge-yellow" style={{ whiteSpace: 'nowrap' }}>Chờ phê duyệt</span> },
                        {
                            header: 'Thao tác',
                            render: (r) => (
                                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', whiteSpace: 'nowrap' }}>
                                    <button
                                        className="btn btn-secondary"
                                        style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}
                                        onClick={() => handleOpenEditTransferProposalModal(r)}
                                    >
                                        <Edit3 size={14} />
                                        <span>Sửa</span>
                                    </button>
                                    <button
                                        className="btn btn-secondary"
                                        style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', fontWeight: 600, color: '#EF4444', borderColor: '#FCA5A5', display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}
                                        onClick={() => handleDeleteTransferProposal(r.proposal_id)}
                                        title="Xóa đề xuất"
                                    >
                                        <Trash2 size={14} />
                                        <span>Xóa</span>
                                    </button>
                                </div>
                            )
                        }
                    ]}
                    data={transferProposals}
                />
            )}

            {/* 8. QUYẾT ĐỊNH THUYÊN CHUYỂN, BỔ NHIỆM */}
            {activeSubTab === 'Quyết định thuyên chuyển, bổ nhiệm' && (
                <DataTable
                    loading={loading}
                    addLabel="Ban hành Quyết định Thuyên chuyển/Bổ nhiệm"
                    onAdd={() => {
                        setFormData({
                            employee_id: employees[0]?.employee_id || '',
                            target_department_id: departments[0]?.department_id || '',
                            target_position_id: positions[0]?.position_id || '',
                            signed_by: 'Bùi Xuân Thức - Tổng Giám Đốc'
                        });
                        setModalType('decision_transfer');
                    }}
                    searchPlaceholder="Tìm số quyết định, tên nhân viên..."
                    columns={[
                        { header: 'Số Quyết định', accessor: 'decision_number', render: (r) => <b>{r.decision_number}</b> },
                        { header: 'Nhân viên', accessor: 'employee_name', render: (r) => <span style={{ fontWeight: 700 }}>{r.employee_name} ({r.employee_code})</span> },
                        { header: 'Bộ phận chính thức mới', accessor: 'target_dept_name', render: (r) => <b>{r.target_dept_name}</b> },
                        { header: 'Vị trí công việc mới', accessor: 'target_pos_name', render: (r) => <span className="badge badge-teal">{r.target_pos_name}</span> },
                        { header: 'Ngày hiệu lực', render: (r) => r.effective_date ? new Date(r.effective_date).toLocaleDateString('vi-VN') : '—' },
                        { header: 'Người ký ban hành', accessor: 'signed_by' },
                        { header: 'Trạng thái', render: () => <span className="badge badge-green">Đã thi hành</span> },
                        {
                            header: 'Thao tác',
                            render: (r) => (
                                <button
                                    className="btn btn-secondary"
                                    style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', fontWeight: 600, color: '#EF4444', borderColor: '#FCA5A5', display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}
                                    onClick={() => handleDeleteTransferDecision(r.decision_id)}
                                    title="Xóa quyết định"
                                >
                                    <Trash2 size={14} />
                                    <span>Xóa</span>
                                </button>
                            )
                        }
                    ]}
                    data={transferDecisions}
                />
            )}



            {/* 11. ĐƠN XIN NGHỈ PHÉP */}
            {activeSubTab === 'Đơn xin nghỉ phép' && (
                <DataTable
                    loading={loading}
                    title="Danh sách Đơn xin nghỉ phép"
                    addLabel="Tạo Đơn xin nghỉ phép"
                    onAdd={handleOpenCreateLeaveModal}
                    searchPlaceholder="Tìm số phiếu, tên nhân viên, bộ phận..."
                    columns={[
                        { header: 'Ngày tạo', render: (r) => <span style={{ whiteSpace: 'nowrap' }}>{r.created_date ? new Date(r.created_date).toLocaleDateString('vi-VN') : '—'}</span> },
                        { header: 'Số phiếu', accessor: 'leave_code', render: (r) => <b>{r.leave_code}</b> },
                        { header: 'Nhân viên', accessor: 'employee_name', render: (r) => <span style={{ fontWeight: 700 }}>{r.employee_name} ({r.employee_code || '—'})</span> },
                        { header: 'Bộ phận', accessor: 'department_name' },
                        { header: 'Quản lý duyệt', accessor: 'approver_name' },
                        { header: 'Số buổi', accessor: 'total_days', render: (r) => <span style={{ fontWeight: 700, color: '#2D6F62' }}>{Number(r.total_days || 1).toFixed(2)}</span> },
                        { header: 'Từ ngày', render: (r) => <span style={{ whiteSpace: 'nowrap' }}>{r.start_date ? new Date(r.start_date).toLocaleDateString('vi-VN') : '—'}</span> },
                        { header: 'Đến ngày', render: (r) => <span style={{ whiteSpace: 'nowrap' }}>{r.end_date ? new Date(r.end_date).toLocaleDateString('vi-VN') : '—'}</span> },
                        { header: 'Lý do', accessor: 'reason' },
                        {
                            header: 'Trạng thái',
                            render: (r) => {
                                if (r.status === 'APPROVED') return <span className="badge badge-green">Đã duyệt</span>;
                                if (r.status === 'REJECTED') return <span className="badge badge-red">Từ chối</span>;
                                return <span className="badge badge-yellow">Chờ duyệt</span>;
                            }
                        },
                        {
                            header: 'Duyệt / Thao tác',
                            render: (r) => (
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                    {['Administrator', 'Ban Giám Đốc', 'Trưởng Khối', 'Trưởng Phòng', 'HR Staff'].includes(user?.roleName) ? (
                                        <button
                                            className="btn btn-secondary"
                                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.775rem', backgroundColor: '#EFF6FF', color: '#1D4ED8', borderColor: '#BFDBFE', fontWeight: 600 }}
                                            onClick={() => {
                                                setSelectedLeave({
                                                    ...r,
                                                    approver_note: r.approver_note || ''
                                                });
                                                setModalType('approve_leave');
                                            }}
                                        >
                                            Duyệt / Chi tiết
                                        </button>
                                    ) : (
                                        <button
                                            className="btn btn-secondary"
                                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.775rem' }}
                                            onClick={() => {
                                                setSelectedLeave(r);
                                                setModalType('view_leave');
                                            }}
                                        >
                                            Xem chi tiết
                                        </button>
                                    )}
                                    <button
                                        className="btn btn-secondary"
                                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.775rem', color: '#EF4444', borderColor: '#FECACA' }}
                                        onClick={() => handleDeleteLeaveApplication(r.leave_id || r.id, r.leave_code)}
                                    >
                                        Xóa
                                    </button>
                                </div>
                            )
                        }
                    ]}
                    data={leaveApplications}
                />
            )}

            {/* ---------------------------------------------------- */}
            {/* FORM MODALS FOR ALL HR MASTER DATA & VOUCHERS        */}
            {/* ---------------------------------------------------- */}

            {/* MODAL 1: THÊM DANH MỤC BỘ PHẬN */}
            <Modal
                isOpen={modalType === 'dept'}
                onClose={() => setModalType(null)}
                title="Thêm Danh mục Bộ phận / Phòng ban Mới"
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setModalType(null)}>Hủy</button>
                        <button className="btn btn-primary" onClick={handleCreateDepartment}>Lưu Bộ phận</button>
                    </>
                }
            >
                <form onSubmit={handleCreateDepartment}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label">Mã Bộ phận / Phòng ban (*)</label>
                            <input type="text" className="form-input" required defaultValue={formData.department_code} onChange={(e) => setFormData({ ...formData, department_code: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Tên Bộ phận / Phòng ban (*)</label>
                            <input type="text" className="form-input" required placeholder="VD: Khối Kỹ thuật Phần mềm, Khối Kinh doanh ERP..." onChange={(e) => setFormData({ ...formData, department_name: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Mô tả chức năng nhiệm vụ</label>
                            <textarea className="form-textarea" rows={3} placeholder="Mô tả chức năng..." onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                        </div>
                    </div>
                </form>
            </Modal>

            {/* MODAL 2: THÊM DANH MỤC VỊ TRÍ CÔNG VIỆC */}
            <Modal
                isOpen={modalType === 'pos'}
                onClose={() => setModalType(null)}
                title="Thêm Danh mục Vị trí Công việc Mới"
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setModalType(null)}>Hủy</button>
                        <button className="btn btn-primary" onClick={handleCreatePosition}>Lưu Vị trí Công việc</button>
                    </>
                }
            >
                <form onSubmit={handleCreatePosition}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label">Mã Vị trí Công việc (*)</label>
                            <input type="text" className="form-input" required defaultValue={formData.position_code} onChange={(e) => setFormData({ ...formData, position_code: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Tên Vị trí / Chức danh (*)</label>
                            <input type="text" className="form-input" required placeholder="VD: Kỹ sư Phần mềm Senior, Chuyên viên Tư vấn ERP..." onChange={(e) => setFormData({ ...formData, position_name: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Trực thuộc Bộ phận (*)</label>
                            <select className="form-select" onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}>
                                {departments.map((d) => (
                                    <option key={d.department_id} value={d.department_id}>{d.department_name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Mô tả công việc</label>
                            <textarea className="form-textarea" rows={3} placeholder="Mô tả nhiệm vụ công việc..." onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                        </div>
                    </div>
                </form>
            </Modal>

            {/* MODAL 3: TẠO HỒ SƠ NHÂN SỰ MỚI (3 PHÂN NHÓM CHUẨN ERP) */}
            <Modal
                isOpen={modalType === 'emp'}
                onClose={() => setModalType(null)}
                title="Tạo Hồ sơ Nhân sự Mới"
                maxWidth="780px"
                footer={
                    <>
                        <button
                            className="btn btn-secondary"
                            onClick={() => setModalType(null)}
                            disabled={isSubmittingEmp}
                        >
                            Hủy
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleCreateEmployee}
                            disabled={isSubmittingEmp}
                            style={{ fontWeight: 700, backgroundColor: 'var(--bravo-teal)' }}
                        >
                            {isSubmittingEmp ? 'Đang tạo hồ sơ...' : 'Tạo hồ sơ'}
                        </button>
                    </>
                }
            >
                <form onSubmit={handleCreateEmployee} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* SECTION A: THÔNG TIN CÁ NHÂN */}
                    <div style={{ backgroundColor: '#F8FAFC', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.85rem', color: 'var(--bravo-teal-dark)', fontWeight: 800, fontSize: '0.9rem', borderBottom: '1px solid #CBD5E1', paddingBottom: '0.4rem' }}>
                            <Users size={16} />
                            <span>A. THÔNG TIN CÁ NHÂN</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 700 }}>Họ và tên nhân viên (*)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Nhập đầy đủ họ và tên..."
                                    value={createEmpData.full_name}
                                    onChange={(e) => setCreateEmpData({ ...createEmpData, full_name: e.target.value })}
                                    style={{ borderColor: createEmpErrors.full_name ? '#EF4444' : '#CBD5E1' }}
                                />
                                {createEmpErrors.full_name && (
                                    <span style={{ fontSize: '0.75rem', color: '#EF4444', fontWeight: 600 }}>{createEmpErrors.full_name}</span>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Giới tính</label>
                                <select
                                    className="form-select"
                                    value={createEmpData.gender}
                                    onChange={(e) => setCreateEmpData({ ...createEmpData, gender: e.target.value })}
                                >
                                    <option value="Nam">Nam</option>
                                    <option value="Nữ">Nữ</option>
                                    <option value="Khác">Khác</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Ngày sinh</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={createEmpData.date_of_birth}
                                    onChange={(e) => setCreateEmpData({ ...createEmpData, date_of_birth: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Số CCCD / CMND</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Nhập 9 hoặc 12 số CCCD..."
                                    value={createEmpData.citizen_id}
                                    onChange={(e) => setCreateEmpData({ ...createEmpData, citizen_id: e.target.value })}
                                    style={{ borderColor: createEmpErrors.citizen_id ? '#EF4444' : '#CBD5E1' }}
                                />
                                {createEmpErrors.citizen_id && (
                                    <span style={{ fontSize: '0.75rem', color: '#EF4444', fontWeight: 600 }}>{createEmpErrors.citizen_id}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* SECTION B: THÔNG TIN LIÊN HỆ */}
                    <div style={{ backgroundColor: '#F8FAFC', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.85rem', color: 'var(--bravo-teal-dark)', fontWeight: 800, fontSize: '0.9rem', borderBottom: '1px solid #CBD5E1', paddingBottom: '0.4rem' }}>
                            <Mail size={16} />
                            <span>B. THÔNG TIN LIÊN HỆ</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 700 }}>Email công ty (*)</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    placeholder="user@bravo.com.vn..."
                                    value={createEmpData.email}
                                    onChange={(e) => setCreateEmpData({ ...createEmpData, email: e.target.value })}
                                    style={{ borderColor: createEmpErrors.email ? '#EF4444' : '#CBD5E1' }}
                                />
                                {createEmpErrors.email && (
                                    <span style={{ fontSize: '0.75rem', color: '#EF4444', fontWeight: 600 }}>{createEmpErrors.email}</span>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 700 }}>Số điện thoại (*)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="09xx xxx xxx..."
                                    value={createEmpData.phone}
                                    onChange={(e) => setCreateEmpData({ ...createEmpData, phone: e.target.value })}
                                    style={{ borderColor: createEmpErrors.phone ? '#EF4444' : '#CBD5E1' }}
                                />
                                {createEmpErrors.phone && (
                                    <span style={{ fontSize: '0.75rem', color: '#EF4444', fontWeight: 600 }}>{createEmpErrors.phone}</span>
                                )}
                            </div>

                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="form-label">Địa chỉ liên hệ</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Nhập địa chỉ cư trú hiện tại..."
                                    value={createEmpData.address}
                                    onChange={(e) => setCreateEmpData({ ...createEmpData, address: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECTION C: THÔNG TIN CÔNG VIỆC */}
                    <div style={{ backgroundColor: '#F8FAFC', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.85rem', color: 'var(--bravo-teal-dark)', fontWeight: 800, fontSize: '0.9rem', borderBottom: '1px solid #CBD5E1', paddingBottom: '0.4rem' }}>
                            <Briefcase size={16} />
                            <span>C. THÔNG TIN CÔNG VIỆC & CƠ CẤU TỔ CHỨC</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            {/* Phòng ban */}
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 700 }}>Phòng ban phân công (*)</label>
                                <select
                                    className="form-select"
                                    value={createEmpData.department_id}
                                    onChange={(e) => {
                                        const newDept = e.target.value;
                                        const eligible = getEligibleManagersForCreate(newDept, createEmpData.position_title);
                                        setCreateEmpData({
                                            ...createEmpData,
                                            department_id: newDept,
                                            manager_id: eligible.length > 0 ? eligible[0].employee_id : ''
                                        });
                                    }}
                                    style={{ borderColor: createEmpErrors.department_id ? '#EF4444' : '#CBD5E1' }}
                                >
                                    <option value="">-- Chọn Phòng ban --</option>
                                    {departments.map((d) => (
                                        <option key={d.department_id} value={d.department_id}>{d.department_name}</option>
                                    ))}
                                </select>
                                {createEmpErrors.department_id && (
                                    <span style={{ fontSize: '0.75rem', color: '#EF4444', fontWeight: 600 }}>{createEmpErrors.department_id}</span>
                                )}
                            </div>

                            {/* Vị trí công việc (Trường duy nhất thể hiện Cấp bậc & Chức vụ) */}
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 700 }}>Vị trí công việc (*)</label>
                                <select
                                    className="form-select"
                                    value={createEmpData.position_title}
                                    onChange={(e) => {
                                        const newPos = e.target.value;
                                        const eligible = getEligibleManagersForCreate(createEmpData.department_id, newPos);
                                        setCreateEmpData({
                                            ...createEmpData,
                                            position_title: newPos,
                                            manager_id: eligible.length > 0 ? eligible[0].employee_id : ''
                                        });
                                    }}
                                    style={{ borderColor: createEmpErrors.position_title ? '#EF4444' : '#CBD5E1' }}
                                >
                                    {createEmpData.department_id === 'dept-board' ? (
                                        <>
                                            <option value="Tổng Giám đốc">Tổng Giám đốc</option>
                                            <option value="Phó Tổng Giám đốc">Phó Tổng Giám đốc</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="Trưởng phòng">Trưởng phòng</option>
                                            <option value="Trưởng nhóm">Trưởng nhóm</option>
                                            <option value="Nhân viên">Nhân viên</option>
                                        </>
                                    )}
                                </select>
                                {createEmpErrors.position_title && (
                                    <span style={{ fontSize: '0.75rem', color: '#EF4444', fontWeight: 600 }}>{createEmpErrors.position_title}</span>
                                )}
                            </div>

                            {/* Người quản lý trực tiếp (Được lọc ĐỘNG theo Phòng ban + Vị trí) */}
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 700 }}>Người quản lý trực tiếp</label>
                                {(() => {
                                    const eligibleManagers = getEligibleManagersForCreate(createEmpData.department_id, createEmpData.position_title);

                                    if (!createEmpData.department_id) {
                                        return (
                                            <select className="form-select" disabled style={{ backgroundColor: '#F3F4F6', color: '#94A3B8' }}>
                                                <option>-- Chọn Phòng ban trước --</option>
                                            </select>
                                        );
                                    }

                                    if (createEmpData.position_title === 'Tổng Giám đốc') {
                                        return (
                                            <input
                                                type="text"
                                                className="form-input"
                                                value="-- Không có (Thuộc HĐQT / Cấp cao nhất) --"
                                                disabled
                                                readOnly
                                                style={{ backgroundColor: '#F3F4F6', color: '#64748B', cursor: 'not-allowed' }}
                                            />
                                        );
                                    }

                                    return (
                                        <select
                                            className="form-select"
                                            value={createEmpData.manager_id || ''}
                                            onChange={(e) => setCreateEmpData({ ...createEmpData, manager_id: e.target.value })}
                                        >
                                            {eligibleManagers.length === 0 ? (
                                                <option value="">-- Chưa có Quản lý phù hợp trong phòng ban --</option>
                                            ) : (
                                                eligibleManagers.map((m) => (
                                                    <option key={m.employee_id} value={m.employee_id}>
                                                        {m.full_name} ({m.position_name || m.level})
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                    );
                                })()}
                                <span style={{ fontSize: '0.725rem', color: '#64748B', fontStyle: 'italic', marginTop: '0.2rem' }}>
                                    Danh sách Quản lý tự động lọc theo cơ cấu: {createEmpData.position_title === 'Trưởng phòng' ? 'Ban Giám đốc' : createEmpData.position_title === 'Trưởng nhóm' ? 'Trưởng phòng cùng phòng ban' : 'Trưởng nhóm cùng phòng ban'}.
                                </span>
                            </div>

                            {/* Ngày vào làm */}
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 700 }}>Ngày vào làm (*)</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={createEmpData.join_date}
                                    onChange={(e) => setCreateEmpData({ ...createEmpData, join_date: e.target.value })}
                                    style={{ borderColor: createEmpErrors.join_date ? '#EF4444' : '#CBD5E1' }}
                                />
                                {createEmpErrors.join_date && (
                                    <span style={{ fontSize: '0.75rem', color: '#EF4444', fontWeight: 600 }}>{createEmpErrors.join_date}</span>
                                )}
                            </div>

                            {/* Loại nhân sự */}
                            <div className="form-group">
                                <label className="form-label">Loại nhân sự</label>
                                <select
                                    className="form-select"
                                    value={createEmpData.employee_type}
                                    onChange={(e) => setCreateEmpData({ ...createEmpData, employee_type: e.target.value })}
                                >
                                    <option value="Nhân viên chính thức">Nhân viên chính thức</option>
                                    <option value="Thử việc">Thử việc</option>
                                    <option value="Thực tập sinh">Thực tập sinh</option>
                                </select>
                            </div>

                            {/* Trạng thái làm việc */}
                            <div className="form-group">
                                <label className="form-label">Trạng thái làm việc</label>
                                <select
                                    className="form-select"
                                    value={createEmpData.employment_status}
                                    onChange={(e) => setCreateEmpData({ ...createEmpData, employment_status: e.target.value })}
                                >
                                    <option value="WORKING">🟢 Đang làm việc (Mặc định)</option>
                                    <option value="LEAVE">🟡 Tạm nghỉ</option>
                                    <option value="RESIGNED">🔴 Nghỉ việc</option>
                                </select>
                            </div>

                            {/* Mã nhân viên Box */}
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <div style={{ backgroundColor: '#F1F5F9', border: '1px dashed #CBD5E1', padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.825rem', color: '#475569' }}>
                                    💡 <b>Mã nhân viên (Auto-generated):</b> Hệ thống sẽ tự động sinh mã định danh duy nhất (Ví dụ: <code>NV-2026-xxx</code>) ngay sau khi bạn bấm <b>Tạo hồ sơ</b>.
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* MODAL 4: TẠO PHIẾU ĐỀ XUẤT HĐLĐ */}
            <Modal
                isOpen={modalType === 'proposal_contract'}
                onClose={() => setModalType(null)}
                title="Lập Phiếu Đề xuất Hợp đồng Lao động"
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setModalType(null)}>Hủy</button>
                        <button className="btn btn-primary" onClick={handleCreateContractProposal}>Gửi Đề xuất HĐLĐ</button>
                    </>
                }
            >
                <form onSubmit={handleCreateContractProposal}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label">Chọn Nhân viên (*)</label>
                            <select className="form-select" onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}>
                                {employees.map((e) => (
                                    <option key={e.employee_id} value={e.employee_id}>{e.employee_code} - {e.full_name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Loại HĐLĐ đề xuất (*)</label>
                            <select className="form-select" onChange={(e) => setFormData({ ...formData, contract_type: e.target.value })}>
                                <option value="Hợp đồng Thử việc (2 tháng)">Hợp đồng Thử việc (2 tháng)</option>
                                <option value="Hợp đồng Xác định thời hạn 1 năm">Hợp đồng Xác định thời hạn 1 năm</option>
                                <option value="Hợp đồng Xác định thời hạn 3 năm">Hợp đồng Xác định thời hạn 3 năm</option>
                                <option value="Hợp đồng Không xác định thời hạn">Hợp đồng Không xác định thời hạn</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Mức lương đề xuất (VNĐ)</label>
                            <input type="number" className="form-input" defaultValue={18000000} onChange={(e) => setFormData({ ...formData, proposed_salary: parseFloat(e.target.value) })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Lý do đề xuất</label>
                            <textarea className="form-textarea" rows={3} placeholder="Mô tả lý do đề xuất ký hợp đồng..." onChange={(e) => setFormData({ ...formData, reason: e.target.value })} />
                        </div>
                    </div>
                </form>
            </Modal>

            {/* MODAL 5: CHỈNH SỬA / THÊM MỚI HỢP ĐỒNG LAO ĐỘNG */}
            <Modal
                isOpen={modalType === 'contract'}
                onClose={() => setModalType(null)}
                title={contractFormData.isEdit ? "Chỉnh sửa Hợp đồng Lao động" : "Thêm mới Hợp đồng Lao động"}
                maxWidth="850px"
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setModalType(null)}>Hủy</button>
                        <button className="btn btn-primary" onClick={handleSaveContractSubmit} style={{ backgroundColor: 'var(--bravo-teal)' }}>
                            {contractFormData.isEdit ? "Cập nhật HĐLĐ" : "Lưu Hợp đồng"}
                        </button>
                    </>
                }
            >
                <form onSubmit={handleSaveContractSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* MỤC 1: THÔNG TIN HỢP ĐỒNG LAO ĐỘNG */}
                    <div style={{ backgroundColor: '#F8FAFC', padding: '1.25rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--bravo-teal-dark)', fontWeight: 800, fontSize: '0.95rem', borderBottom: '2px solid #CBD5E1', paddingBottom: '0.5rem' }}>
                            <FileText size={18} />
                            <span>1. MỤC THÔNG TIN HỢP ĐỒNG LAO ĐỘNG</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            {/* Ngày HĐ */}
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 700 }}>Ngày HĐ (*)</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={contractFormData.contract_date || ''}
                                    onChange={(e) => setContractFormData({ ...contractFormData, contract_date: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Số HĐ */}
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 700 }}>Số HĐ (Cú pháp HĐLĐ/yy-000)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Ví dụ: HĐLĐ/26-001"
                                    value={contractFormData.contract_no || ''}
                                    onChange={(e) => setContractFormData({ ...contractFormData, contract_no: e.target.value })}
                                    style={{ fontWeight: 700, color: 'var(--bravo-teal-dark)' }}
                                />
                            </div>

                            {/* Người ký */}
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 700 }}>Người ký (*)</label>
                                <select
                                    className="form-select"
                                    value={contractFormData.signer_id || ''}
                                    onChange={(e) => {
                                        const signer = employees.find(emp => emp.employee_id === e.target.value);
                                        setContractFormData({
                                            ...contractFormData,
                                            signer_id: e.target.value,
                                            signer_name: signer ? signer.full_name : '',
                                            signer_position: signer ? (signer.position_name || signer.level) : ''
                                        });
                                    }}
                                >
                                    {employees.map((emp) => (
                                        <option key={emp.employee_id} value={emp.employee_id}>
                                            {emp.full_name} ({emp.employee_code}) - {emp.level || emp.position_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Vị trí của người ký */}
                            <div className="form-group">
                                <label className="form-label">Vị trí (Người ký)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={contractFormData.signer_position || ''}
                                    readOnly
                                    disabled
                                    style={{ backgroundColor: '#F1F5F9', color: '#475569', fontWeight: 600 }}
                                />
                            </div>

                            {/* Nhân viên */}
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 700 }}>Nhân viên (*)</label>
                                <select
                                    className="form-select"
                                    value={contractFormData.employee_id || ''}
                                    onChange={(e) => {
                                        const targetEmp = employees.find(emp => emp.employee_id === e.target.value);
                                        setContractFormData({
                                            ...contractFormData,
                                            employee_id: e.target.value,
                                            employee_position: targetEmp ? (targetEmp.position_name || targetEmp.level) : ''
                                        });
                                    }}
                                >
                                    {employees.map((emp) => (
                                        <option key={emp.employee_id} value={emp.employee_id}>
                                            {emp.full_name} ({emp.employee_code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Vị trí của nhân viên */}
                            <div className="form-group">
                                <label className="form-label">Vị trí (Nhân viên)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={contractFormData.employee_position || ''}
                                    readOnly
                                    disabled
                                    style={{ backgroundColor: '#F1F5F9', color: '#475569', fontWeight: 600 }}
                                />
                            </div>

                            {/* Loại HĐ */}
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="form-label" style={{ fontWeight: 700 }}>Loại HĐ (*)</label>
                                <select
                                    className="form-select"
                                    value={contractFormData.contract_type || 'Hợp đồng thử việc'}
                                    onChange={(e) => setContractFormData({ ...contractFormData, contract_type: e.target.value })}
                                >
                                    <option value="Hợp đồng thử việc">Hợp đồng thử việc</option>
                                    <option value="Hợp đồng xác định thời hạn 1 năm">Hợp đồng xác định thời hạn 1 năm</option>
                                    <option value="Hợp đồng xác định thời hạn 3 năm">Hợp đồng xác định thời hạn 3 năm</option>
                                    <option value="Hợp đồng không xác định thời hạn">Hợp đồng không xác định thời hạn</option>
                                </select>
                            </div>

                            {/* Thời hạn HĐ từ ngày - đến ngày */}
                            <div className="form-group">
                                <label className="form-label">Thời hạn HĐ từ ngày</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={contractFormData.start_date || ''}
                                    onChange={(e) => setContractFormData({ ...contractFormData, start_date: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Đến ngày (Bỏ trống nếu Không thời hạn)</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={contractFormData.end_date || ''}
                                    onChange={(e) => setContractFormData({ ...contractFormData, end_date: e.target.value })}
                                />
                            </div>

                            {/* Thử việc từ ngày - đến ngày */}
                            <div className="form-group">
                                <label className="form-label">Thử việc từ ngày</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={contractFormData.probation_from_date || ''}
                                    onChange={(e) => setContractFormData({ ...contractFormData, probation_from_date: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Đến ngày</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={contractFormData.probation_to_date || ''}
                                    onChange={(e) => setContractFormData({ ...contractFormData, probation_to_date: e.target.value })}
                                />
                            </div>

                            {/* Mô tả công việc */}
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="form-label">Mô tả công việc</label>
                                <textarea
                                    className="form-textarea"
                                    rows={2}
                                    placeholder="Nhập mô tả nhiệm vụ công việc chính theo hợp đồng..."
                                    value={contractFormData.job_description || ''}
                                    onChange={(e) => setContractFormData({ ...contractFormData, job_description: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* MỤC 2: MỨC LƯƠNG & PHỤ CẤP */}
                    <div style={{ backgroundColor: '#F8FAFC', padding: '1.25rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--bravo-teal-dark)', fontWeight: 800, fontSize: '0.95rem', borderBottom: '2px solid #CBD5E1', paddingBottom: '0.5rem' }}>
                            <DollarSign size={18} />
                            <span>2. MỤC MỨC LƯƠNG & PHỤ CẤP</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                            {/* Thang/bậc lương */}
                            <div className="form-group">
                                <label className="form-label">Thang/bậc lương</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="VD: Bảng lương Chuyên viên ERP..."
                                    value={contractFormData.salary_scale || ''}
                                    onChange={(e) => setContractFormData({ ...contractFormData, salary_scale: e.target.value })}
                                />
                            </div>

                            {/* Bậc lương */}
                            <div className="form-group">
                                <label className="form-label">Bậc lương</label>
                                <select
                                    className="form-select"
                                    value={contractFormData.salary_grade || 'Bậc 1'}
                                    onChange={(e) => setContractFormData({ ...contractFormData, salary_grade: e.target.value })}
                                >
                                    <option value="Bậc 1">Bậc 1</option>
                                    <option value="Bậc 2">Bậc 2</option>
                                    <option value="Bậc 3">Bậc 3</option>
                                    <option value="Bậc 4">Bậc 4</option>
                                    <option value="Bậc 5">Bậc 5</option>
                                </select>
                            </div>

                            {/* Mức lương cơ sở */}
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 700 }}>Mức lương cơ sở (VNĐ) (*)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={contractFormData.base_salary || 0}
                                    onChange={(e) => setContractFormData({ ...contractFormData, base_salary: parseFloat(e.target.value) || 0 })}
                                    style={{ fontWeight: 700, color: '#059669' }}
                                />
                            </div>

                            {/* Mức lương đóng BHXH */}
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 700 }}>Mức lương đóng BHXH (VNĐ)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={contractFormData.social_insurance_salary || 0}
                                    onChange={(e) => setContractFormData({ ...contractFormData, social_insurance_salary: parseFloat(e.target.value) || 0 })}
                                    style={{ fontWeight: 700, color: '#0284C7' }}
                                />
                            </div>
                        </div>

                        {/* BẢNG CHI TIẾT PHỤ CẤP */}
                        <div style={{ marginTop: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0F172A' }}>Bảng chi tiết phụ cấp:</span>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={handleAddAllowanceRow}
                                    style={{ padding: '0.3rem 0.75rem', fontSize: '0.775rem', color: 'var(--bravo-teal-dark)', borderColor: 'var(--bravo-teal)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                                >
                                    <Plus size={14} />
                                    <span>Thêm dòng phụ cấp</span>
                                </button>
                            </div>

                            <table className="erp-table" style={{ width: '100%', backgroundColor: '#FFFFFF' }}>
                                <thead>
                                    <tr>
                                        <th style={{ width: '50px', textAlignment: 'center', whiteSpace: 'nowrap' }}>STT</th>
                                        <th style={{ whiteSpace: 'nowrap' }}>Loại phụ cấp</th>
                                        <th style={{ width: '200px', whiteSpace: 'nowrap' }}>Tiền hưởng (VNĐ)</th>
                                        <th style={{ width: '80px', textAlignment: 'center', whiteSpace: 'nowrap' }}>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(contractFormData.allowance_details || []).length === 0 ? (
                                        <tr>
                                            <td colSpan={4} style={{ textAlign: 'center', padding: '1rem', color: '#94A3B8', fontSize: '0.825rem' }}>
                                                Chưa có khoản phụ cấp nào. Bấm "+ Thêm dòng phụ cấp" để bổ sung.
                                            </td>
                                        </tr>
                                    ) : (
                                        contractFormData.allowance_details.map((item, idx) => (
                                            <tr key={idx}>
                                                <td style={{ textAlign: 'center', fontWeight: 700 }}>{idx + 1}</td>
                                                <td>
                                                    <select
                                                        className="form-select"
                                                        value={item.allowance_type}
                                                        onChange={(e) => handleAllowanceChange(idx, 'allowance_type', e.target.value)}
                                                        style={{ padding: '0.3rem 0.5rem', fontSize: '0.85rem' }}
                                                    >
                                                        <option value="Phụ cấp ăn trưa">Phụ cấp ăn trưa</option>
                                                        <option value="Phụ cấp đi lại">Phụ cấp đi lại</option>
                                                        <option value="Phụ cấp điện thoại">Phụ cấp điện thoại</option>
                                                        <option value="Phụ cấp trách nhiệm">Phụ cấp trách nhiệm</option>
                                                        <option value="Phụ cấp hiệu suất">Phụ cấp hiệu suất</option>
                                                    </select>
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        className="form-input"
                                                        value={item.amount || 0}
                                                        onChange={(e) => handleAllowanceChange(idx, 'amount', parseFloat(e.target.value) || 0)}
                                                        style={{ padding: '0.3rem 0.5rem', fontSize: '0.85rem', fontWeight: 600 }}
                                                    />
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <button
                                                        type="button"
                                                        className="btn btn-secondary"
                                                        onClick={() => handleRemoveAllowanceRow(idx)}
                                                        style={{ padding: '0.25rem', color: '#EF4444', borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' }}
                                                        title="Xóa phụ cấp"
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
                </form>
            </Modal>


            {/* MODAL 7: CHỈNH SỬA / THÊM MỚI ĐỀ XUẤT THUYÊN CHUYỂN, BỔ NHIỆM, MIỄN NHIỆM */}
            <Modal
                isOpen={modalType === 'proposal_transfer'}
                onClose={() => setModalType(null)}
                title={transferProposalFormData.isEdit ? "Chỉnh sửa Đề xuất Thuyên chuyển, Bổ nhiệm, Miễn nhiệm" : "Thêm mới Đề xuất Thuyên chuyển, Bổ nhiệm, Miễn nhiệm"}
                maxWidth="950px"
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setModalType(null)}>Hủy</button>
                        <button className="btn btn-primary" onClick={handleSaveTransferProposalSubmit} style={{ backgroundColor: 'var(--bravo-teal)' }}>
                            {transferProposalFormData.isEdit ? "Cập nhật Đề xuất" : "Lưu Đề xuất"}
                        </button>
                    </>
                }
            >
                <form onSubmit={handleSaveTransferProposalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* MỤC 1: THÔNG TIN CHUNG ĐỀ XUẤT */}
                    <div style={{ backgroundColor: '#F8FAFC', padding: '1.25rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--bravo-teal-dark)', fontWeight: 800, fontSize: '0.95rem', borderBottom: '2px solid #CBD5E1', paddingBottom: '0.5rem' }}>
                            <FileText size={18} />
                            <span>1. THÔNG TIN CHUNG ĐỀ XUẤT</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                            {/* Ngày đề xuất */}
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 700 }}>Ngày đề xuất (*)</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={transferProposalFormData.proposal_date || ''}
                                    onChange={(e) => setTransferProposalFormData({ ...transferProposalFormData, proposal_date: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Số đề xuất */}
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 700 }}>Số đề xuất (DX/TCBN-yy000)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Ví dụ: DX/TCBN-26001"
                                    value={transferProposalFormData.proposal_code || ''}
                                    onChange={(e) => setTransferProposalFormData({ ...transferProposalFormData, proposal_code: e.target.value })}
                                    style={{ fontWeight: 700, color: 'var(--bravo-teal-dark)' }}
                                />
                            </div>

                            {/* Ngày hiệu lực */}
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 700 }}>Ngày hiệu lực (*)</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={transferProposalFormData.effective_date || ''}
                                    onChange={(e) => setTransferProposalFormData({ ...transferProposalFormData, effective_date: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Loại quyết định */}
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 700 }}>Loại quyết định (*)</label>
                                <select
                                    className="form-select"
                                    value={transferProposalFormData.decision_type || 'Thuyên chuyển'}
                                    onChange={(e) => setTransferProposalFormData({ ...transferProposalFormData, decision_type: e.target.value })}
                                >
                                    <option value="Thuyên chuyển">Thuyên chuyển</option>
                                    <option value="Bổ nhiệm">Bổ nhiệm</option>
                                    <option value="Miễn nhiệm">Miễn nhiệm</option>
                                    <option value="Điều chuyển công tác">Điều chuyển công tác</option>
                                </select>
                            </div>

                            {/* Người đề xuất */}
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 700 }}>Người đề xuất (*)</label>
                                <select
                                    className="form-select"
                                    value={transferProposalFormData.proposer_id || ''}
                                    onChange={(e) => {
                                        const proposer = employees.find(emp => emp.employee_id === e.target.value);
                                        setTransferProposalFormData({
                                            ...transferProposalFormData,
                                            proposer_id: e.target.value,
                                            proposer_name: proposer ? proposer.full_name : '',
                                            proposer_position: proposer ? (proposer.position_name || proposer.level) : '',
                                            proposer_department: proposer ? proposer.department_name : ''
                                        });
                                    }}
                                >
                                    {employees.map((emp) => (
                                        <option key={emp.employee_id} value={emp.employee_id}>
                                            {emp.full_name} ({emp.employee_code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Vị trí của người đề xuất */}
                            <div className="form-group">
                                <label className="form-label">Vị trí (Người đề xuất)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={transferProposalFormData.proposer_position || ''}
                                    readOnly
                                    disabled
                                    style={{ backgroundColor: '#F1F5F9', color: '#475569', fontWeight: 600 }}
                                />
                            </div>

                            {/* Bộ phận của người đề xuất */}
                            <div className="form-group" style={{ gridColumn: 'span 3' }}>
                                <label className="form-label">Bộ phận (Người đề xuất)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={transferProposalFormData.proposer_department || ''}
                                    readOnly
                                    disabled
                                    style={{ backgroundColor: '#F1F5F9', color: '#475569', fontWeight: 600 }}
                                />
                            </div>

                            {/* Ghi chú */}
                            <div className="form-group" style={{ gridColumn: 'span 3' }}>
                                <label className="form-label">Ghi chú</label>
                                <textarea
                                    className="form-textarea"
                                    rows={2}
                                    placeholder="Nhập ghi chú hoặc lý do đề xuất..."
                                    value={transferProposalFormData.note || ''}
                                    onChange={(e) => setTransferProposalFormData({ ...transferProposalFormData, note: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* MỤC 2: BẢNG CHI TIẾT ĐỀ XUẤT */}
                    <div style={{ backgroundColor: '#F8FAFC', padding: '1.25rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--bravo-teal-dark)', fontWeight: 800, fontSize: '0.95rem' }}>
                                <Users size={18} />
                                <span>2. BẢNG CHI TIẾT ĐỀ XUẤT</span>
                            </div>

                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleAddTransferDetailRow}
                                style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', color: 'var(--bravo-teal-dark)', borderColor: 'var(--bravo-teal)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                            >
                                <Plus size={14} />
                                <span>Thêm dòng chi tiết</span>
                            </button>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table className="erp-table" style={{ width: '100%', backgroundColor: '#FFFFFF' }}>
                                <thead>
                                    <tr>
                                        <th style={{ width: '40px', textAlignment: 'center', whiteSpace: 'nowrap' }}>STT</th>
                                        <th style={{ minWidth: '180px', whiteSpace: 'nowrap' }}>Nhân viên</th>
                                        <th style={{ minWidth: '130px', whiteSpace: 'nowrap' }}>Vị trí hiện tại</th>
                                        <th style={{ minWidth: '130px', whiteSpace: 'nowrap' }}>Bộ phận hiện tại</th>
                                        <th style={{ minWidth: '180px', whiteSpace: 'nowrap' }}>Vị trí mới</th>
                                        <th style={{ minWidth: '140px', whiteSpace: 'nowrap' }}>Bộ phận mới</th>
                                        <th style={{ minWidth: '120px', whiteSpace: 'nowrap' }}>Ghi chú</th>
                                        <th style={{ width: '60px', textAlignment: 'center', whiteSpace: 'nowrap' }}>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(transferProposalFormData.detail_items || []).length === 0 ? (
                                        <tr>
                                            <td colSpan={8} style={{ textAlign: 'center', padding: '1.25rem', color: '#94A3B8', fontSize: '0.85rem' }}>
                                                Chưa có chi tiết nhân sự đề xuất. Bấm "+ Thêm dòng chi tiết" để thêm nhân viên.
                                            </td>
                                        </tr>
                                    ) : (
                                        transferProposalFormData.detail_items.map((row, idx) => (
                                            <tr key={idx}>
                                                <td style={{ textAlign: 'center', fontWeight: 700 }}>{idx + 1}</td>
                                                {/* Chọn Nhân viên */}
                                                <td>
                                                    <select
                                                        className="form-select"
                                                        value={row.employee_id}
                                                        onChange={(e) => handleTransferDetailChange(idx, 'employee_id', e.target.value)}
                                                        style={{ padding: '0.3rem 0.5rem', fontSize: '0.825rem' }}
                                                    >
                                                        {employees.map((emp) => (
                                                            <option key={emp.employee_id} value={emp.employee_id}>
                                                                {emp.full_name} ({emp.employee_code})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>

                                                {/* Vị trí hiện tại (binding) */}
                                                <td>
                                                    <span style={{ fontWeight: 600, fontSize: '0.825rem', color: '#475569' }}>
                                                        {row.current_position || '—'}
                                                    </span>
                                                </td>

                                                {/* Bộ phận hiện tại (binding) */}
                                                <td>
                                                    <span style={{ fontSize: '0.825rem', color: '#64748B' }}>
                                                        {row.current_department || '—'}
                                                    </span>
                                                </td>

                                                {/* Vị trí mới (chọn từ danh mục vị trí công việc) */}
                                                <td>
                                                    <select
                                                        className="form-select"
                                                        value={row.new_position_id}
                                                        onChange={(e) => handleTransferDetailChange(idx, 'new_position_id', e.target.value)}
                                                        style={{ padding: '0.3rem 0.5rem', fontSize: '0.825rem', fontWeight: 700, color: 'var(--bravo-teal-dark)' }}
                                                    >
                                                        {positions.map((pos) => (
                                                            <option key={pos.position_id} value={pos.position_id}>
                                                                {pos.position_name} ({pos.department_name})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>

                                                {/* Bộ phận mới (tự động binding theo vị trí mới) */}
                                                <td>
                                                    <b style={{ fontSize: '0.825rem', color: '#0284C7' }}>
                                                        {row.new_department_name || '—'}
                                                    </b>
                                                </td>

                                                {/* Ghi chú */}
                                                <td>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        placeholder="Ghi chú..."
                                                        value={row.note || ''}
                                                        onChange={(e) => handleTransferDetailChange(idx, 'note', e.target.value)}
                                                        style={{ padding: '0.3rem 0.5rem', fontSize: '0.825rem' }}
                                                    />
                                                </td>

                                                {/* Thao tác */}
                                                <td style={{ textAlign: 'center' }}>
                                                    <button
                                                        type="button"
                                                        className="btn btn-secondary"
                                                        onClick={() => handleRemoveTransferDetailRow(idx)}
                                                        style={{ padding: '0.25rem', color: '#EF4444', borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' }}
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
                </form>
            </Modal>

            {/* MODAL 8: PHIẾU QUYẾT ĐỊNH THUYÊN CHUYỂN, BỔ NHIỆM */}
            <Modal
                isOpen={modalType === 'decision_transfer'}
                onClose={() => setModalType(null)}
                title="Ban hành Quyết định Thuyên chuyển / Bổ nhiệm"
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setModalType(null)}>Hủy</button>
                        <button className="btn btn-primary" onClick={handleCreateTransferDecision}>Ban hành Quyết định</button>
                    </>
                }
            >
                <form onSubmit={handleCreateTransferDecision}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label">Chọn Nhân viên (*)</label>
                            <select className="form-select" onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}>
                                {employees.map((e) => (
                                    <option key={e.employee_id} value={e.employee_id}>{e.employee_code} - {e.full_name}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Bộ phận chính thức mới (*)</label>
                                <select className="form-select" onChange={(e) => setFormData({ ...formData, target_department_id: e.target.value })}>
                                    {departments.map((d) => (
                                        <option key={d.department_id} value={d.department_id}>{d.department_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Vị trí công việc mới (*)</label>
                                <select className="form-select" onChange={(e) => setFormData({ ...formData, target_position_id: e.target.value })}>
                                    {positions.map((p) => (
                                        <option key={p.position_id} value={p.position_id}>{p.position_name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Người ký ban hành</label>
                            <input type="text" className="form-input" defaultValue="Bùi Xuân Thức - Tổng Giám Đốc" onChange={(e) => setFormData({ ...formData, signed_by: e.target.value })} />
                        </div>
                    </div>
                </form>
            </Modal>



            {/* MODAL XÁC NHẬN XÓA HỒ SƠ NHÂN SỰ */}
            <Modal
                isOpen={deleteConfirmModal}
                onClose={() => setDeleteConfirmModal(false)}
                title="Xác nhận xóa hồ sơ nhân sự"
                maxWidth="520px"
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setDeleteConfirmModal(false)}>Hủy</button>
                        <button className="btn btn-danger" onClick={handleConfirmDeleteEmp} style={{ fontWeight: 700 }}>
                            Xóa hồ sơ
                        </button>
                    </>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#DC2626', backgroundColor: '#FEF2F2', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #FCA5A5' }}>
                        <AlertTriangle size={24} style={{ flexShrink: 0 }} />
                        <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                            Hành động này sẽ thực hiện xóa/ngưng hoạt động hồ sơ nhân sự khỏi danh sách quản lý.
                        </div>
                    </div>

                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155' }}>
                        Bạn có chắc chắn muốn xóa hồ sơ nhân sự này không?
                    </p>

                    {selectedEmp && (
                        <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', padding: '0.85rem 1rem', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.825rem', color: '#64748B', fontWeight: 600 }}>Bản ghi được chọn xóa:</div>
                            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', marginTop: '0.2rem' }}>
                                Mã NV: {selectedEmp.employee_code} - {selectedEmp.full_name}
                            </div>
                            <div style={{ fontSize: '0.825rem', color: 'var(--bravo-teal-dark)', fontWeight: 600, marginTop: '0.1rem' }}>
                                Chức vụ: {selectedEmp.position_name} • Phòng ban: {selectedEmp.department_name}
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            {/* MODAL 11: TẠO PHIẾU ĐỊNH BIÊN NHÂN SỰ MỚI */}
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
                            <span>1. THÔNG TIN CHUNG PHIẾU</span>
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
                                <label className="form-label" style={{ fontWeight: 700 }}>Số phiếu (*)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={createQuotaData.quota_code || 'ĐB/0826-0001'}
                                    disabled
                                    readOnly
                                    style={{ backgroundColor: '#F3F4F6', color: '#374151', cursor: 'not-allowed', fontWeight: 800 }}
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
                                    onChange={(e) => {
                                        const deptId = e.target.value;
                                        const count = employees.filter(emp => emp.department_id === deptId && (emp.is_active === 1 || emp.employment_status === 'WORKING')).length;
                                        setCreateQuotaData({ ...createQuotaData, department_id: deptId, current_headcount: count });
                                    }}
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

                    {/* SECTION 2: CHỈ SỐ ĐỊNH BIÊN & NGÂN SÁCH */}
                    <div style={{ backgroundColor: '#F8FAFC', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.85rem', color: 'var(--bravo-teal-dark)', fontWeight: 800, fontSize: '0.9rem', borderBottom: '1px solid #CBD5E1', paddingBottom: '0.4rem' }}>
                            <Users size={16} />
                            <span>2. THÔNG TIN ĐỊNH BIÊN & NGÂN SÁCH</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 700 }}>Tổng định biên phê duyệt (*)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={createQuotaData.target_headcount}
                                    onChange={(e) => setCreateQuotaData({ ...createQuotaData, target_headcount: e.target.value })}
                                    style={{ borderColor: createQuotaErrors.target_headcount ? '#EF4444' : '#CBD5E1' }}
                                />
                                {createQuotaErrors.target_headcount && (
                                    <span style={{ fontSize: '0.75rem', color: '#EF4444', fontWeight: 600 }}>{createQuotaErrors.target_headcount}</span>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 700 }}>Sức chứa tối đa (*)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={createQuotaData.max_capacity}
                                    onChange={(e) => setCreateQuotaData({ ...createQuotaData, max_capacity: e.target.value })}
                                    style={{ borderColor: createQuotaErrors.max_capacity ? '#EF4444' : '#CBD5E1' }}
                                />
                                {createQuotaErrors.max_capacity && (
                                    <span style={{ fontSize: '0.75rem', color: '#EF4444', fontWeight: 600 }}>{createQuotaErrors.max_capacity}</span>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Số lượng hiện tại (Thực tế)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={`${createQuotaData.current_headcount} nhân sự đang làm việc`}
                                    disabled
                                    readOnly
                                    style={{ backgroundColor: '#F3F4F6', color: '#15803D', fontWeight: 800, cursor: 'not-allowed' }}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Ngân sách phân bổ (VNĐ)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={createQuotaData.budget}
                                    onChange={(e) => setCreateQuotaData({ ...createQuotaData, budget: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: DIỄN GIẢI & TRẠNG THÁI */}
                    <div style={{ backgroundColor: '#F8FAFC', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.85rem', color: 'var(--bravo-teal-dark)', fontWeight: 800, fontSize: '0.9rem', borderBottom: '1px solid #CBD5E1', paddingBottom: '0.4rem' }}>
                            <FileText size={16} />
                            <span>3. DIỄN GIẢI & TRẠNG THÁI</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Diễn giải</label>
                                <textarea
                                    className="form-textarea"
                                    rows={2}
                                    placeholder="Ghi chú mục đích tạo định biên..."
                                    value={createQuotaData.description}
                                    onChange={(e) => setCreateQuotaData({ ...createQuotaData, description: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Trạng thái phiếu</label>
                                <select
                                    className="form-select"
                                    value={createQuotaData.status}
                                    onChange={(e) => setCreateQuotaData({ ...createQuotaData, status: e.target.value })}
                                >
                                    <option value="Nháp">Nháp</option>
                                    <option value="Chờ duyệt">Chờ duyệt</option>
                                    <option value="Đã duyệt">Đã duyệt</option>
                                    <option value="Đã hoàn thiện">Đã hoàn thiện</option>
                                </select>
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

            {/* MODAL 1: TẠO MỚI ĐƠN XIN NGHỈ PHÉP (Quy tắc: Chỉ tạo mới, không cho sửa; cho phép xóa) */}
            <Modal
                isOpen={modalType === 'create_leave'}
                onClose={() => setModalType(null)}
                title="Tạo mới Đơn xin nghỉ phép"
                maxWidth="900px"
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setModalType(null)}>Hủy bỏ</button>
                        <button className="btn btn-primary" onClick={handleSaveLeaveApplication}>Lưu Đơn xin nghỉ phép</button>
                    </>
                }
            >
                <form onSubmit={(e) => { e.preventDefault(); handleSaveLeaveApplication(); }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {/* THÔNG TIN CHUNG */}
                        <div style={{
                            backgroundColor: '#F8FAFC',
                            padding: '1.25rem',
                            borderRadius: '8px',
                            border: '1px solid #E2E8F0'
                        }}>
                            <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: '#0F172A', fontWeight: 700, borderBottom: '1px solid #CBD5E1', paddingBottom: '0.5rem' }}>
                                1. Thông tin chung phiếu nghỉ phép
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Ngày tạo phiếu</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={leaveFormData.created_date}
                                        onChange={(e) => setLeaveFormData({ ...leaveFormData, created_date: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Số phiếu (*)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={leaveFormData.leave_code}
                                        readOnly
                                        style={{ backgroundColor: '#F1F5F9', fontWeight: 700, color: '#2D6F62' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Nhân viên (*)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={`${leaveFormData.employee_name} (${leaveFormData.employee_code || 'Tự động binding'})`}
                                        readOnly
                                        style={{ backgroundColor: '#F1F5F9', fontWeight: 600 }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Bộ phận (*)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={leaveFormData.department_name}
                                        readOnly
                                        style={{ backgroundColor: '#F1F5F9', fontWeight: 600 }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Quản lý (người duyệt) (*)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={leaveFormData.approver_name}
                                        readOnly
                                        style={{ backgroundColor: '#F1F5F9', fontWeight: 600 }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Người liên quan (trưởng nhóm)</label>
                                    <select
                                        className="form-select"
                                        value={leaveFormData.related_person_id}
                                        onChange={(e) => {
                                            const relEmp = employees.find(emp => emp.employee_id === e.target.value || emp.id === e.target.value);
                                            setLeaveFormData({
                                                ...leaveFormData,
                                                related_person_id: e.target.value,
                                                related_person_name: relEmp ? relEmp.full_name : ''
                                            });
                                        }}
                                    >
                                        <option value="">-- Chọn trưởng nhóm cùng bộ phận --</option>
                                        {employees
                                            .filter(emp => emp.department_id === leaveFormData.department_id || emp.department_name === leaveFormData.department_name)
                                            .map(emp => (
                                                <option key={emp.employee_id || emp.id} value={emp.employee_id || emp.id}>
                                                    {emp.full_name} - {emp.position_name || emp.level || 'Nhân sự'}
                                                </option>
                                            ))
                                        }
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Xin nghỉ từ ngày (*)</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        required
                                        value={leaveFormData.start_date}
                                        onChange={(e) => {
                                            const newStart = e.target.value;
                                            const newDetails = generateLeaveDetailsRows(newStart, leaveFormData.end_date, leaveFormData.details);
                                            const newTotal = newDetails.reduce((s, r) => s + (Number(r.days) || 0), 0);
                                            setLeaveFormData({
                                                ...leaveFormData,
                                                start_date: newStart,
                                                details: newDetails,
                                                total_days: newTotal
                                            });
                                        }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Xin nghỉ đến ngày (*)</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        required
                                        value={leaveFormData.end_date}
                                        onChange={(e) => {
                                            const newEnd = e.target.value;
                                            const newDetails = generateLeaveDetailsRows(leaveFormData.start_date, newEnd, leaveFormData.details);
                                            const newTotal = newDetails.reduce((s, r) => s + (Number(r.days) || 0), 0);
                                            setLeaveFormData({
                                                ...leaveFormData,
                                                end_date: newEnd,
                                                details: newDetails,
                                                total_days: newTotal
                                            });
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="form-group" style={{ marginTop: '1rem' }}>
                                <label className="form-label">Lý do (*)</label>
                                <textarea
                                    className="form-textarea"
                                    rows={2}
                                    required
                                    placeholder="Ghi rõ lý do xin nghỉ phép..."
                                    value={leaveFormData.reason}
                                    onChange={(e) => setLeaveFormData({ ...leaveFormData, reason: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* BẢNG CHI TIẾT TỪNG NGÀY NGHỈ */}
                        <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
                            <div style={{ backgroundColor: '#F1F5F9', padding: '0.75rem 1rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F172A' }}>
                                    2. Bảng chi tiết từng ngày nghỉ
                                </span>
                                <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                                    Tự động sinh từng ngày trong khoảng nghỉ
                                </span>
                            </div>
                            <table className="data-table" style={{ width: '100%', margin: 0 }}>
                                <thead>
                                    <tr>
                                        <th style={{ width: '50px', textAlign: 'center' }}>STT</th>
                                        <th style={{ width: '140px' }}>Ngày nghỉ</th>
                                        <th style={{ width: '220px' }}>Thời gian ghi nhận</th>
                                        <th style={{ width: '100px', textAlign: 'right' }}>Số buổi</th>
                                        <th>Ghi chú</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(leaveFormData.details || []).map((row, idx) => (
                                        <tr key={idx}>
                                            <td style={{ textAlign: 'center', fontWeight: 600 }}>{idx + 1}</td>
                                            <td>
                                                <input
                                                    type="date"
                                                    className="form-input"
                                                    style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
                                                    value={row.date}
                                                    onChange={(e) => {
                                                        const updated = [...leaveFormData.details];
                                                        updated[idx].date = e.target.value;
                                                        setLeaveFormData({ ...leaveFormData, details: updated });
                                                    }}
                                                />
                                            </td>
                                            <td>
                                                <select
                                                    className="form-select"
                                                    style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem', fontWeight: 600 }}
                                                    value={row.time_option}
                                                    onChange={(e) => handleLeaveDetailTimeOptionChange(idx, e.target.value)}
                                                >
                                                    <option value="Cả ngày">Cả ngày (1.00 buổi)</option>
                                                    <option value="Nửa ca đầu ngày">Nửa ca đầu ngày (0.50 buổi)</option>
                                                    <option value="Nửa ca cuối ngày">Nửa ca cuối ngày (0.50 buổi)</option>
                                                </select>
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: 700, color: '#2D6F62' }}>
                                                {Number(row.days || 1.0).toFixed(2)}
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    placeholder="Ghi chú (không bắt buộc)..."
                                                    style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
                                                    value={row.note || ''}
                                                    onChange={(e) => {
                                                        const updated = [...leaveFormData.details];
                                                        updated[idx].note = e.target.value;
                                                        setLeaveFormData({ ...leaveFormData, details: updated });
                                                    }}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* KHU VỰC TỔNG KẾT (CUỐI PHIẾU) */}
                        <div style={{
                            backgroundColor: '#EFF6FF',
                            border: '1px solid #BFDBFE',
                            borderRadius: '8px',
                            padding: '1rem 1.25rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <div style={{ fontSize: '0.825rem', color: '#1E40AF', fontWeight: 600 }}>
                                    Số phép còn lại hiện tại (Hạn mức 12 ngày/năm):
                                </div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1D4ED8' }}>
                                    {calculateRemainingLeaveDays(leaveFormData.employee_id)} ngày
                                </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.825rem', color: '#1E40AF', fontWeight: 600 }}>
                                    Tổng số buổi xin nghỉ lần này:
                                </div>
                                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#047857' }}>
                                    {Number(leaveFormData.total_days || 0).toFixed(2)} buổi
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* MODAL 2: DUYỆT / XEM CHI TIẾT ĐƠN XIN NGHỈ PHÉP */}
            <Modal
                isOpen={modalType === 'approve_leave' || modalType === 'view_leave'}
                onClose={() => { setModalType(null); setSelectedLeave(null); }}
                title={modalType === 'approve_leave' ? "Phê duyệt Đơn xin nghỉ phép" : "Chi tiết Đơn xin nghỉ phép"}
                maxWidth="850px"
                footer={
                    modalType === 'approve_leave' ? (
                        <>
                            <button className="btn btn-secondary" onClick={() => { setModalType(null); setSelectedLeave(null); }}>Đóng</button>
                            <button
                                className="btn btn-secondary"
                                style={{ backgroundColor: '#FEF2F2', color: '#DC2626', borderColor: '#FCA5A5', fontWeight: 700 }}
                                onClick={() => handleApproveLeaveApplication('REJECTED')}
                            >
                                Không duyệt
                            </button>
                            <button
                                className="btn btn-primary"
                                style={{ backgroundColor: '#059669', borderColor: '#059669', fontWeight: 700 }}
                                onClick={() => handleApproveLeaveApplication('APPROVED')}
                            >
                                Phê duyệt Đơn
                            </button>
                        </>
                    ) : (
                        <button className="btn btn-secondary" onClick={() => { setModalType(null); setSelectedLeave(null); }}>Đóng</button>
                    )
                }
            >
                {selectedLeave && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ backgroundColor: '#F8FAFC', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', fontSize: '0.875rem' }}>
                                <div><b>Số phiếu:</b> <span style={{ color: '#2D6F62', fontWeight: 700 }}>{selectedLeave.leave_code}</span></div>
                                <div><b>Ngày tạo:</b> {selectedLeave.created_date ? new Date(selectedLeave.created_date).toLocaleDateString('vi-VN') : '—'}</div>
                                <div><b>Nhân viên:</b> <b>{selectedLeave.employee_name}</b> ({selectedLeave.employee_code || '—'})</div>
                                <div><b>Bộ phận:</b> {selectedLeave.department_name}</div>
                                <div><b>Quản lý duyệt:</b> {selectedLeave.approver_name}</div>
                                <div><b>Trưởng nhóm liên quan:</b> {selectedLeave.related_person_name || 'Không có'}</div>
                                <div><b>Từ ngày:</b> {selectedLeave.start_date ? new Date(selectedLeave.start_date).toLocaleDateString('vi-VN') : '—'}</div>
                                <div><b>Đến ngày:</b> {selectedLeave.end_date ? new Date(selectedLeave.end_date).toLocaleDateString('vi-VN') : '—'}</div>
                                <div><b>Tổng số buổi:</b> <b style={{ color: '#047857' }}>{Number(selectedLeave.total_days || 1).toFixed(2)} buổi</b></div>
                            </div>

                            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #E2E8F0', fontSize: '0.875rem' }}>
                                <b>Lý do xin nghỉ:</b>
                                <p style={{ margin: '0.25rem 0 0 0', color: '#334155', fontStyle: 'italic', backgroundColor: '#FFFFFF', padding: '0.5rem', borderRadius: '4px', border: '1px solid #CBD5E1' }}>
                                    {selectedLeave.reason || 'Không có mô tả lý do'}
                                </p>
                            </div>
                        </div>

                        {/* BẢNG CHI TIẾT NGÀY NGHỈ */}
                        <div>
                            <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#0F172A', fontWeight: 700 }}>
                                Chi tiết thời gian nghỉ ghi nhận:
                            </h5>
                            <table className="data-table" style={{ width: '100%', margin: 0 }}>
                                <thead>
                                    <tr>
                                        <th style={{ width: '50px', textAlign: 'center' }}>STT</th>
                                        <th style={{ width: '140px' }}>Ngày nghỉ</th>
                                        <th>Thời gian ghi nhận</th>
                                        <th style={{ width: '100px', textAlign: 'right' }}>Số buổi</th>
                                        <th>Ghi chú</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        let detailsArr = [];
                                        try {
                                            detailsArr = typeof selectedLeave.details_json === 'string' ? JSON.parse(selectedLeave.details_json) : (selectedLeave.details_json || []);
                                        } catch (e) {
                                            detailsArr = [];
                                        }
                                        if (detailsArr.length === 0) {
                                            return <tr><td colSpan={5} style={{ textAlign: 'center', color: '#94A3B8' }}>Không có bảng chi tiết từng ngày</td></tr>;
                                        }
                                        return detailsArr.map((row, idx) => (
                                            <tr key={idx}>
                                                <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                                                <td style={{ fontWeight: 600 }}>{row.date}</td>
                                                <td><span className="badge badge-teal">{row.time_option}</span></td>
                                                <td style={{ textAlign: 'right', fontWeight: 700, color: '#2D6F62' }}>{Number(row.days || 1).toFixed(2)}</td>
                                                <td style={{ color: '#64748B' }}>{row.note || '—'}</td>
                                            </tr>
                                        ));
                                    })()}
                                </tbody>
                            </table>
                        </div>

                        {/* KHU VỰC QUẢN LÝ PHÊ DUYỆT */}
                        {modalType === 'approve_leave' && (
                            <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', padding: '1rem', borderRadius: '8px' }}>
                                <label className="form-label" style={{ fontWeight: 700, color: '#B45309' }}>
                                    Ghi chú phê duyệt / Phản hồi của Trưởng phòng:
                                </label>
                                <textarea
                                    className="form-textarea"
                                    rows={2}
                                    placeholder="Nhập ghi chú hoặc lý do nếu từ chối..."
                                    value={selectedLeave.approver_note || ''}
                                    onChange={(e) => setSelectedLeave({ ...selectedLeave, approver_note: e.target.value })}
                                />
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};