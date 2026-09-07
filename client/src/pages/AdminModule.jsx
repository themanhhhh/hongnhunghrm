import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import {
  Building2, Briefcase, Users, Layers, Plus, ShieldCheck,
  ArrowLeft, Edit3, Save, X, Lock, CheckCircle, Mail, Phone, AlertCircle,
  FileText, Trash2, ChevronRight, UserCheck, Calendar, Info
} from 'lucide-react';

export const AdminModule = ({ activeSubTab }) => {
  const { addToast } = useNotification();
  const { user: currentUser, updateUserSession } = useAuth();

  // Common catalog subtab state ('dept' | 'pos' | 'contractType')
  const [catalogTab, setCatalogTab] = useState('dept');

  // Master Data states
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [contractTypes, setContractTypes] = useState([]);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  // Single-Click Inspection States
  const [selectedDeptRow, setSelectedDeptRow] = useState(null);
  const [deptEmployees, setDeptEmployees] = useState([]);
  const [loadingDeptEmployees, setLoadingDeptEmployees] = useState(false);

  const [selectedPosRow, setSelectedPosRow] = useState(null);
  const [posPathway, setPosPathway] = useState([]);
  const [loadingPosPathway, setLoadingPosPathway] = useState(false);

  // User Account Detail Panel state
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editUserData, setEditUserData] = useState({});
  const [formErrors, setFormErrors] = useState({});

  // Modals state
  const [modalType, setModalType] = useState(null); // 'dept' | 'pos' | 'contractType' | 'pathway' | 'user'
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (activeSubTab === 'Danh mục Bộ phận') setCatalogTab('dept');
    else if (activeSubTab === 'Danh mục Vị trí công việc') setCatalogTab('pos');
    else if (activeSubTab === 'Danh mục Loại HĐLĐ') setCatalogTab('contractType');
  }, [activeSubTab]);

  useEffect(() => {
    fetchData();
  }, [activeSubTab, catalogTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resEmp, resDept, resPos, resCT] = await Promise.all([
        api.get('/hr/employees'),
        api.get('/admin/departments'),
        api.get('/admin/positions'),
        api.get('/admin/contract-types')
      ]);

      if (resEmp?.success) setEmployees(resEmp.data || []);
      if (resDept?.success) setDepartments(resDept.data || []);
      if (resPos?.success) setPositions(resPos.data || []);
      if (resCT?.success) setContractTypes(resCT.data || []);

      if (!activeSubTab || activeSubTab === 'Tài khoản & Phân quyền') {
        const [resUser, resRole] = await Promise.all([
          api.get('/admin/users'),
          api.get('/admin/roles')
        ]);
        if (resUser?.success && Array.isArray(resUser.data)) setUsers(resUser.data);
        if (resRole?.success && Array.isArray(resRole.data)) setRoles(resRole.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- SINGLE-CLICK HANDLERS ---
  const handleSingleClickDept = async (deptRow) => {
    setSelectedDeptRow(deptRow);
    setLoadingDeptEmployees(true);
    try {
      const res = await api.get(`/admin/departments/${deptRow.department_id}/employees`);
      if (res.success) {
        setDeptEmployees(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDeptEmployees(false);
    }
  };

  const handleSingleClickPos = async (posRow) => {
    setSelectedPosRow(posRow);
    setLoadingPosPathway(true);
    try {
      const res = await api.get(`/admin/positions/${posRow.position_id}/pathway`);
      if (res.success) {
        setPosPathway(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPosPathway(false);
    }
  };

  // --- DEPARTMENT CRUD HANDLERS ---
  const handleOpenAddDeptModal = () => {
    setEditMode(false);
    setFormData({
      department_code: '',
      department_name: '',
      parent_department_id: '',
      manager_id: '',
      target_headcount: 10,
      description: ''
    });
    setModalType('dept');
  };

  const handleOpenEditDeptModal = (deptRow) => {
    setEditMode(true);
    setFormData({
      department_id: deptRow.department_id,
      department_code: deptRow.department_code || '',
      department_name: deptRow.department_name || '',
      parent_department_id: deptRow.parent_department_id || '',
      manager_id: deptRow.manager_id || '',
      target_headcount: deptRow.target_headcount || 0,
      description: deptRow.description || ''
    });
    setModalType('dept');
  };

  const handleSaveDepartment = async (e) => {
    if (e) e.preventDefault();
    if (!formData.department_code || !formData.department_code.trim()) {
      addToast('Vui lòng nhập Mã bộ phận (*)', 'error');
      return;
    }
    if (!formData.department_name || !formData.department_name.trim()) {
      addToast('Vui lòng nhập Tên bộ phận (*)', 'error');
      return;
    }

    try {
      let res;
      if (editMode) {
        res = await api.put(`/admin/departments/${formData.department_id}`, formData);
      } else {
        res = await api.post('/admin/departments', formData);
      }

      if (res.success) {
        addToast(res.message || 'Lưu bộ phận thành công!', 'success');
        setModalType(null);
        fetchData();
      } else {
        addToast(res.message || 'Thao tác thất bại.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Đã xảy ra lỗi hệ thống.', 'error');
    }
  };

  const handleDeleteDepartment = async (deptId, deptName) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bộ phận "${deptName}"?`)) return;
    try {
      const res = await api.delete(`/admin/departments/${deptId}`);
      if (res.success) {
        addToast(res.message || 'Xóa bộ phận thành công!', 'success');
        if (selectedDeptRow?.department_id === deptId) setSelectedDeptRow(null);
        fetchData();
      } else {
        addToast(res.message || 'Không thể xóa bộ phận.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Đã xảy ra lỗi khi kết nối máy chủ.', 'error');
    }
  };

  // --- POSITION CRUD HANDLERS ---
  const handleOpenAddPosModal = () => {
    setEditMode(false);
    setFormData({
      position_code: '',
      position_name: '',
      department_id: departments[0]?.department_id || '',
      target_headcount: 5,
      is_assistant: 0,
      salary_grade: 'Bậc 1',
      description: ''
    });
    setModalType('pos');
  };

  const handleOpenEditPosModal = (posRow) => {
    setEditMode(true);
    setFormData({
      position_id: posRow.position_id,
      position_code: posRow.position_code || '',
      position_name: posRow.position_name || '',
      department_id: posRow.department_id || '',
      target_headcount: posRow.target_headcount || 0,
      is_assistant: posRow.is_assistant ? 1 : 0,
      salary_grade: posRow.salary_grade || '',
      description: posRow.description || ''
    });
    setModalType('pos');
  };

  const handleSavePosition = async (e) => {
    if (e) e.preventDefault();
    if (!formData.position_code || !formData.position_code.trim()) {
      addToast('Vui lòng nhập Mã vị trí (*)', 'error');
      return;
    }
    if (!formData.position_name || !formData.position_name.trim()) {
      addToast('Vui lòng nhập Tên vị trí công việc (*)', 'error');
      return;
    }
    if (!formData.department_id) {
      addToast('Vui lòng chọn Bộ phận trực thuộc (*)', 'error');
      return;
    }

    try {
      let res;
      if (editMode) {
        res = await api.put(`/admin/positions/${formData.position_id}`, formData);
      } else {
        res = await api.post('/admin/positions', formData);
      }

      if (res.success) {
        addToast(res.message || 'Lưu vị trí công việc thành công!', 'success');
        setModalType(null);
        fetchData();
      } else {
        addToast(res.message || 'Thao tác thất bại.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Đã xảy ra lỗi hệ thống.', 'error');
    }
  };

  const handleDeletePosition = async (posId, posName) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vị trí công việc "${posName}"?`)) return;
    try {
      const res = await api.delete(`/admin/positions/${posId}`);
      if (res.success) {
        addToast(res.message || 'Xóa vị trí công việc thành công!', 'success');
        if (selectedPosRow?.position_id === posId) setSelectedPosRow(null);
        fetchData();
      } else {
        addToast(res.message || 'Không thể xóa vị trí công việc.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Đã xảy ra lỗi khi kết nối máy chủ.', 'error');
    }
  };

  // --- POSITION PATHWAY HANDLERS ---
  const handleOpenAddPathwayModal = () => {
    if (!selectedPosRow) {
      addToast('Vui lòng chọn một Vị trí công việc trước.', 'error');
      return;
    }
    setFormData({
      contract_type_id: contractTypes[0]?.contract_type_id || '',
      step_order: (posPathway.length || 0) + 1,
      note: ''
    });
    setModalType('pathway');
  };

  const handleSavePathwayStep = async (e) => {
    if (e) e.preventDefault();
    if (!formData.contract_type_id) {
      addToast('Vui lòng chọn Loại HĐLĐ (*)', 'error');
      return;
    }

    try {
      const res = await api.post(`/admin/positions/${selectedPosRow.position_id}/pathway`, formData);
      if (res.success) {
        addToast('Thêm bước lộ trình thành công!', 'success');
        setModalType(null);
        handleSingleClickPos(selectedPosRow);
      } else {
        addToast(res.message || 'Không thể thêm bước lộ trình.', 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePathwayStep = async (pathwayId) => {
    if (!window.confirm('Xóa bước lộ trình ký HĐLĐ này?')) return;
    try {
      const res = await api.delete(`/admin/positions/${selectedPosRow.position_id}/pathway/${pathwayId}`);
      if (res.success) {
        addToast('Xóa bước lộ trình thành công!', 'success');
        handleSingleClickPos(selectedPosRow);
      } else {
        addToast(res.message, 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- CONTRACT TYPE CRUD HANDLERS ---
  const handleOpenAddContractTypeModal = () => {
    setEditMode(false);
    setFormData({
      contract_type_code: '',
      contract_type_name: '',
      duration_months: 12,
      has_probation: 0,
      probation_days: 0
    });
    setModalType('contractType');
  };

  const handleOpenEditContractTypeModal = (ctRow) => {
    setEditMode(true);
    setFormData({
      contract_type_id: ctRow.contract_type_id,
      contract_type_code: ctRow.contract_type_code || '',
      contract_type_name: ctRow.contract_type_name || '',
      duration_months: ctRow.duration_months || 0,
      has_probation: ctRow.has_probation ? 1 : 0,
      probation_days: ctRow.probation_days || 0
    });
    setModalType('contractType');
  };

  const handleSaveContractType = async (e) => {
    if (e) e.preventDefault();
    if (!formData.contract_type_code || !formData.contract_type_code.trim()) {
      addToast('Vui lòng nhập Mã loại HĐ (*)', 'error');
      return;
    }
    if (!formData.contract_type_name || !formData.contract_type_name.trim()) {
      addToast('Vui lòng nhập Tên loại HĐLĐ (*)', 'error');
      return;
    }
    if (formData.has_probation) {
      const probDays = parseInt(formData.probation_days);
      if (isNaN(probDays) || probDays <= 0) {
        addToast('Vui lòng nhập Số ngày thử việc (*)', 'error');
        return;
      }
    }

    try {
      let res;
      if (editMode) {
        res = await api.put(`/admin/contract-types/${formData.contract_type_id}`, formData);
      } else {
        res = await api.post('/admin/contract-types', formData);
      }

      if (res.success) {
        addToast(res.message || 'Lưu loại HĐLĐ thành công!', 'success');
        setModalType(null);
        fetchData();
      } else {
        addToast(res.message || 'Thao tác thất bại.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Đã xảy ra lỗi hệ thống.', 'error');
    }
  };

  const handleDeleteContractType = async (ctId, ctName) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa loại HĐLĐ "${ctName}"?`)) return;
    try {
      const res = await api.delete(`/admin/contract-types/${ctId}`);
      if (res.success) {
        addToast(res.message || 'Xóa loại HĐLĐ thành công!', 'success');
        fetchData();
      } else {
        addToast(res.message || 'Không thể xóa loại HĐLĐ.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Đã xảy ra lỗi khi kết nối máy chủ.', 'error');
    }
  };

  // --- ACCOUNT HANDLERS ---
  const handleOpenUserDetail = (userRow) => {
    setSelectedUser(userRow);
    setEditUserData({
      user_id: userRow.user_id || userRow.id,
      username: userRow.username,
      full_name: userRow.full_name || '',
      email: userRow.email || '',
      phone: userRow.phone || '',
      role_id: userRow.role_id || 'role-hr',
      role_name: userRow.role_name || '',
      department_id: userRow.department_id || '',
      department_name: userRow.department_name || '',
      status: userRow.status !== undefined ? Number(userRow.status) : 1,
      created_date: userRow.created_date,
      last_modified_date: userRow.last_modified_date
    });
    setIsEditingUser(false);
    setFormErrors({});
  };

  const handleBackToList = () => {
    if (isEditingUser) {
      const isChanged =
        (editUserData.full_name || '') !== (selectedUser.full_name || '') ||
        (editUserData.email || '') !== (selectedUser.email || '') ||
        (editUserData.phone || '') !== (selectedUser.phone || '') ||
        (editUserData.role_id || '') !== (selectedUser.role_id || '') ||
        (editUserData.department_id || '') !== (selectedUser.department_id || '') ||
        Number(editUserData.status) !== Number(selectedUser.status);

      if (isChanged) {
        if (!window.confirm('Bạn có thay đổi chưa được lưu. Bạn có chắc chắn muốn hủy?')) {
          return;
        }
      }
    }
    setSelectedUser(null);
    setIsEditingUser(false);
    setFormErrors({});
  };

  const handleCancelEdit = () => {
    setEditUserData({
      user_id: selectedUser.user_id || selectedUser.id,
      username: selectedUser.username,
      full_name: selectedUser.full_name || '',
      email: selectedUser.email || '',
      phone: selectedUser.phone || '',
      role_id: selectedUser.role_id || 'role-hr',
      role_name: selectedUser.role_name || '',
      department_id: selectedUser.department_id || '',
      department_name: selectedUser.department_name || '',
      status: selectedUser.status !== undefined ? Number(selectedUser.status) : 1,
      created_date: selectedUser.created_date,
      last_modified_date: selectedUser.last_modified_date
    });
    setIsEditingUser(false);
    setFormErrors({});
  };

  const handleSaveUser = async (e) => {
    if (e) e.preventDefault();

    const errors = {};
    if (!editUserData.full_name || !editUserData.full_name.trim()) {
      errors.full_name = 'Họ và tên không được để trống.';
    }
    if (!editUserData.email || !editUserData.email.trim()) {
      errors.email = 'Email không được để trống.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editUserData.email.trim())) {
        errors.email = 'Định dạng email không hợp lệ (VD: user@example.com).';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      addToast('Vui lòng kiểm tra lại dữ liệu nhập hợp lệ.', 'error');
      return;
    }

    const userId = editUserData.user_id || selectedUser.user_id || selectedUser.id;
    try {
      const res = await api.put(`/admin/users/${userId}`, {
        full_name: editUserData.full_name.trim(),
        email: editUserData.email.trim(),
        phone: editUserData.phone ? editUserData.phone.trim() : '',
        role_id: editUserData.role_id,
        department_id: editUserData.department_id,
        status: Number(editUserData.status)
      });

      if (res.success) {
        addToast('Cập nhật tài khoản thành công.', 'success');

        const matchedRole = roles.find(r => r.role_id === editUserData.role_id);
        const matchedDept = departments.find(d => d.department_id === editUserData.department_id);

        const updatedUserObj = {
          ...selectedUser,
          ...editUserData,
          full_name: editUserData.full_name.trim(),
          email: editUserData.email.trim(),
          phone: editUserData.phone ? editUserData.phone.trim() : '',
          role_id: editUserData.role_id,
          role_name: matchedRole ? matchedRole.role_name : selectedUser.role_name,
          department_id: editUserData.department_id,
          department_name: matchedDept ? matchedDept.department_name : selectedUser.department_name,
          status: Number(editUserData.status),
          last_modified_date: Date.now()
        };

        setSelectedUser(updatedUserObj);
        setEditUserData(updatedUserObj);
        setIsEditingUser(false);
        setFormErrors({});

        setUsers(prev => prev.map(u => (u.user_id === userId || u.id === userId) ? updatedUserObj : u));
        fetchData();

        if (currentUser && (currentUser.username?.toLowerCase() === updatedUserObj.username?.toLowerCase() || currentUser.id === userId)) {
          updateUserSession({
            fullName: updatedUserObj.full_name,
            email: updatedUserObj.email,
            roleName: updatedUserObj.role_name,
            deptId: updatedUserObj.department_id,
            deptName: updatedUserObj.department_name
          });
        }
      } else {
        addToast(res.message || 'Cập nhật tài khoản thất bại.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Đã xảy ra lỗi khi kết nối máy chủ.', 'error');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    const res = await api.post('/admin/users', formData);
    if (res.success) {
      addToast('Tạo tài khoản người dùng thành công!', 'success');
      setModalType(null);
      fetchData();
    } else {
      addToast(res.message, 'error');
    }
  };

  const isNhungAdmin = currentUser && (
    currentUser.username?.toUpperCase() === 'NHUNGNH' ||
    (currentUser.fullName && currentUser.fullName.toLowerCase().includes('hồng nhung'))
  );

  const handleDeleteUser = async (userObj) => {
    if (!isNhungAdmin) {
      addToast('Chỉ có Quản trị viên Nguyễn Hồng Nhung mới có quyền thực hiện xóa tài khoản khỏi hệ thống!', 'error');
      return;
    }
    const targetUser = userObj || selectedUser;
    const userId = targetUser?.user_id || targetUser?.id;
    const username = targetUser?.username;

    if (!userId) {
      addToast('Không tìm thấy tài khoản để xóa.', 'error');
      return;
    }

    if (currentUser && (currentUser.id === userId || currentUser.username?.toLowerCase() === username?.toLowerCase())) {
      addToast('Không thể xóa tài khoản của chính bạn đang đăng nhập!', 'error');
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản "${username}" khỏi hệ thống? Thao tác này không thể hoàn tác.`)) {
      return;
    }

    try {
      const res = await api.delete(`/admin/users/${userId}`);
      if (res.success) {
        addToast(res.message || 'Đã xóa tài khoản người dùng thành công!', 'success');
        if (selectedUser?.user_id === userId || selectedUser?.id === userId) {
          setSelectedUser(null);
        }
        fetchData();
      } else {
        addToast(res.message || 'Xóa tài khoản thất bại.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Đã xảy ra lỗi khi kết nối máy chủ.', 'error');
    }
  };

  const isCatalogSection = activeSubTab && activeSubTab.startsWith('Danh mục');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* COMMON CATALOGS SECTION (DANH MỤC DÙNG CHUNG) */}
      {isCatalogSection && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* TAB 1: DANH MỤC BỘ PHẬN */}
          {catalogTab === 'dept' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <DataTable
                loading={loading}
                addLabel="Thêm mới"
                onAdd={handleOpenAddDeptModal}
                onRowDoubleClick={(row) => handleOpenEditDeptModal(row)}
                searchPlaceholder="Tìm mã phòng ban, tên bộ phận..."
                columns={[
                  {
                    header: 'Mã bộ phận',
                    accessor: 'department_code',
                    render: (r) => (
                      <button
                        style={{ background: 'none', border: 'none', padding: 0, color: 'var(--bravo-teal-dark)', fontWeight: 800, cursor: 'pointer', textAlign: 'left' }}
                        onClick={() => handleSingleClickDept(r)}
                      >
                        {r.department_code}
                      </button>
                    )
                  },
                  {
                    header: 'Tên bộ phận',
                    accessor: 'department_name',
                    render: (r) => (
                      <span
                        style={{ fontWeight: 700, color: selectedDeptRow?.department_id === r.department_id ? 'var(--bravo-teal-dark)' : '#0F172A', cursor: 'pointer' }}
                        onClick={() => handleSingleClickDept(r)}
                      >
                        {r.department_name}
                      </span>
                    )
                  },
                  {
                    header: 'Bộ phận cấp trên',
                    accessor: 'parent_department_name',
                    render: (r) => r.parent_department_name ? <span style={{ fontWeight: 600, color: '#334155' }}>{r.parent_department_name}</span> : <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>— Cấp 1 —</span>
                  },
                  {
                    header: 'Trưởng bộ phận',
                    accessor: 'manager_name',
                    render: (r) => r.manager_name ? <span style={{ fontWeight: 600, color: '#0F172A' }}>{r.manager_name}</span> : <span style={{ color: '#94A3B8' }}>Chưa bổ nhiệm</span>
                  },
                  {
                    header: 'Số lượng nhân sự',
                    accessor: 'current_count',
                    render: (r) => <span className="badge badge-teal" style={{ fontWeight: 700 }}>{r.current_count || 0} nhân sự</span>
                  }
                ]}
                data={departments}
              />

              {/* SINGLE-CLICK INSPECTION PANEL: CHI TIẾT NHÂN VIÊN THUỘC BỘ PHẬN */}
              {selectedDeptRow && (
                <div className="card" style={{ padding: '1.25rem', backgroundColor: '#FFFFFF', border: '2px solid var(--bravo-teal)', boxShadow: 'var(--shadow-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <Users size={20} color="var(--bravo-teal-dark)" />
                      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                        Chi tiết nhân viên thuộc bộ phận: <span style={{ color: 'var(--bravo-teal-dark)' }}>{selectedDeptRow.department_name} ({selectedDeptRow.department_code})</span>
                      </h3>
                    </div>

                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
                      onClick={() => setSelectedDeptRow(null)}
                    >
                      <X size={14} />
                      <span>Đóng tra cứu</span>
                    </button>
                  </div>

                  {loadingDeptEmployees ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>Đang nạp danh sách nhân viên thuộc bộ phận...</div>
                  ) : deptEmployees.length === 0 ? (
                    <div style={{ padding: '2.5rem', textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px dashed #CBD5E1' }}>
                      <AlertCircle size={32} color="#94A3B8" style={{ marginBottom: '0.5rem' }} />
                      <h4 style={{ margin: 0, color: '#64748B', fontWeight: 700 }}>Chưa có nhân viên thuộc bộ phận</h4>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.825rem', color: '#94A3B8' }}>
                        Bộ phận này hiện chưa có nhân sự chính thức nào trực thuộc.
                      </p>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="erp-table">
                        <thead>
                          <tr>
                            <th>STT</th>
                            <th>Mã NV</th>
                            <th>Họ tên nhân viên</th>
                            <th>Ngày sinh</th>
                            <th>Giới tính</th>
                            <th>Thâm niên làm việc</th>
                            <th>Số điện thoại</th>
                            <th>Chức vụ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {deptEmployees.map((emp, idx) => (
                            <tr key={emp.employee_id || idx}>
                              <td style={{ fontWeight: 600, color: '#64748B' }}>{idx + 1}</td>
                              <td style={{ fontWeight: 700, color: 'var(--bravo-teal-dark)' }}>{emp.employee_code}</td>
                              <td style={{ fontWeight: 700, color: '#0F172A' }}>{emp.full_name}</td>
                              <td>{emp.date_of_birth ? new Date(emp.date_of_birth).toLocaleDateString('vi-VN') : '—'}</td>
                              <td>
                                <span className={`badge ${emp.gender === 'Nam' ? 'badge-blue' : 'badge-yellow'}`}>
                                  {emp.gender || 'Chưa rõ'}
                                </span>
                              </td>
                              <td>
                                <span className="badge badge-green" style={{ fontWeight: 700 }}>
                                  {emp.seniority}
                                </span>
                              </td>
                              <td style={{ fontWeight: 600 }}>{emp.phone || '—'}</td>
                              <td style={{ fontWeight: 600, color: '#334155' }}>{emp.position_name || 'Nhân viên'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DANH MỤC VỊ TRÍ CÔNG VIỆC */}
          {catalogTab === 'pos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <DataTable
                loading={loading}
                addLabel="Thêm mới"
                onAdd={handleOpenAddPosModal}
                onRowDoubleClick={(row) => handleOpenEditPosModal(row)}
                searchPlaceholder="Tìm mã vị trí, tên vị trí công việc..."
                columns={[
                  {
                    header: 'Mã vị trí',
                    accessor: 'position_code',
                    render: (r) => (
                      <button
                        style={{ background: 'none', border: 'none', padding: 0, color: 'var(--bravo-teal-dark)', fontWeight: 800, cursor: 'pointer', textAlign: 'left' }}
                        onClick={() => handleSingleClickPos(r)}
                      >
                        {r.position_code}
                      </button>
                    )
                  },
                  {
                    header: 'Tên vị trí công việc',
                    accessor: 'position_name',
                    render: (r) => (
                      <span
                        style={{ fontWeight: 700, color: selectedPosRow?.position_id === r.position_id ? 'var(--bravo-teal-dark)' : '#0F172A', cursor: 'pointer' }}
                        onClick={() => handleSingleClickPos(r)}
                      >
                        {r.position_name}
                      </span>
                    )
                  },
                  { header: 'Bộ phận trực thuộc', accessor: 'department_name', render: (r) => <span style={{ fontWeight: 600 }}>{r.department_name || 'Chưa gán'}</span> },
                  {
                    header: 'Là trợ lý',
                    accessor: 'is_assistant',
                    render: (r) => r.is_assistant ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', border: '2px solid var(--bravo-teal-dark)', borderRadius: '4px', backgroundColor: 'var(--bravo-teal)', color: '#FFFFFF', fontWeight: 900, fontSize: '0.8rem' }}>✓</span>
                    ) : (
                      <span style={{ display: 'inline-block', width: '20px', height: '20px', border: '2px solid #CBD5E1', borderRadius: '4px', backgroundColor: '#FFFFFF' }}></span>
                    )
                  },
                  { header: 'Thang/bậc lương', accessor: 'salary_grade', render: (r) => <span style={{ fontWeight: 700, color: '#047857' }}>{r.salary_grade || 'Bậc 1'}</span> }
                ]}
                data={positions}
              />

              {/* SINGLE-CLICK INSPECTION PANEL: LỘ TRÌNH KÝ HỢP ĐỒNG */}
              {selectedPosRow && (
                <div className="card" style={{ padding: '1.25rem', backgroundColor: '#FFFFFF', border: '2px solid var(--bravo-teal)', boxShadow: 'var(--shadow-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <FileText size={20} color="var(--bravo-teal-dark)" />
                      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                        Lộ trình ký hợp đồng: <span style={{ color: 'var(--bravo-teal-dark)' }}>{selectedPosRow.position_name} ({selectedPosRow.position_code})</span>
                      </h3>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        className="btn btn-primary"
                        style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', fontWeight: 700 }}
                        onClick={handleOpenAddPathwayModal}
                      >
                        <Plus size={14} />
                        <span>+ Thêm bước lộ trình</span>
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
                        onClick={() => setSelectedPosRow(null)}
                      >
                        <X size={14} />
                        <span>Đóng</span>
                      </button>
                    </div>
                  </div>

                  {loadingPosPathway ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>Đang nạp lộ trình ký HĐLĐ...</div>
                  ) : posPathway.length === 0 ? (
                    <div style={{ padding: '2.5rem', textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px dashed #CBD5E1' }}>
                      <AlertCircle size={32} color="#94A3B8" style={{ marginBottom: '0.5rem' }} />
                      <h4 style={{ margin: 0, color: '#64748B', fontWeight: 700 }}>Chưa khai báo lộ trình ký hợp đồng</h4>
                      <p style={{ margin: '0.35rem 0 1rem 0', fontSize: '0.825rem', color: '#94A3B8' }}>
                        Bấm nút bên dưới để chọn loại HĐLĐ từ Danh mục loại HĐLĐ khai báo lộ trình cho vị trí này.
                      </p>
                      <button className="btn btn-primary" style={{ fontSize: '0.825rem' }} onClick={handleOpenAddPathwayModal}>
                        + Thêm bước lộ trình đầu tiên
                      </button>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="erp-table">
                        <thead>
                          <tr>
                            <th style={{ width: '60px' }}>Thứ tự</th>
                            <th>Mã loại HĐ</th>
                            <th>Tên loại hợp đồng lao động</th>
                            <th>Thời hạn (Số tháng)</th>
                            <th>Chế độ Thử việc</th>
                            <th>Ghi chú</th>
                            <th style={{ width: '80px' }}>Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {posPathway.map((step, idx) => (
                            <tr key={step.pathway_id || idx}>
                              <td style={{ fontWeight: 800, color: 'var(--bravo-teal-dark)', textAlign: 'center' }}>
                                <span className="badge badge-teal">{step.step_order || idx + 1}</span>
                              </td>
                              <td style={{ fontWeight: 700, color: '#0F172A' }}>{step.contract_type_code}</td>
                              <td style={{ fontWeight: 700, color: 'var(--bravo-teal-dark)' }}>{step.contract_type_name}</td>
                              <td style={{ fontWeight: 700 }}>
                                {step.duration_months > 0 ? `${step.duration_months} tháng` : 'Không xác định thời hạn'}
                              </td>
                              <td>
                                {step.has_probation ? (
                                  <span className="badge badge-yellow">Có thử việc ({step.probation_days} ngày)</span>
                                ) : (
                                  <span className="badge badge-green">Không thử việc</span>
                                )}
                              </td>
                              <td style={{ fontStyle: 'italic', color: '#64748B' }}>{step.note || '—'}</td>
                              <td>
                                <button
                                  className="btn btn-secondary"
                                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', color: '#EF4444', borderColor: '#FCA5A5' }}
                                  onClick={() => handleDeletePathwayStep(step.pathway_id)}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DANH MỤC LOẠI HỢP ĐỒNG LAO ĐỘNG (HĐLĐ) */}
          {catalogTab === 'contractType' && (
            <DataTable
              loading={loading}
              addLabel="Thêm mới"
              onAdd={handleOpenAddContractTypeModal}
              onRowDoubleClick={(row) => handleOpenEditContractTypeModal(row)}
              searchPlaceholder="Tìm mã loại HĐ, tên hợp đồng..."
              columns={[
                { header: 'Mã loại HĐ', accessor: 'contract_type_code', render: (r) => <b style={{ color: 'var(--bravo-teal-dark)' }}>{r.contract_type_code}</b> },
                { header: 'Tên loại HĐLĐ', accessor: 'contract_type_name', render: (r) => <span style={{ fontWeight: 700, color: '#0F172A' }}>{r.contract_type_name}</span> },
                {
                  header: 'Số tháng (Thời hạn)',
                  accessor: 'duration_months',
                  render: (r) => <span style={{ fontWeight: 700 }}>{r.duration_months > 0 ? `${r.duration_months} tháng` : 'Không xác định'}</span>
                },
                {
                  header: 'Có thử việc',
                  accessor: 'has_probation',
                  render: (r) => r.has_probation ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', border: '2px solid var(--bravo-teal-dark)', borderRadius: '4px', backgroundColor: 'var(--bravo-teal)', color: '#FFFFFF', fontWeight: 900, fontSize: '0.8rem' }}>✓</span>
                  ) : (
                    <span style={{ display: 'inline-block', width: '20px', height: '20px', border: '2px solid #CBD5E1', borderRadius: '4px', backgroundColor: '#FFFFFF' }}></span>
                  )
                },
                {
                  header: 'Số ngày thử việc',
                  accessor: 'probation_days',
                  render: (r) => r.has_probation ? <span style={{ fontWeight: 700, color: '#0F172A' }}>{r.probation_days} ngày</span> : <span style={{ color: '#94A3B8' }}>—</span>
                }
              ]}
              data={contractTypes}
            />
          )}

        </div>
      )}

      {/* ACCOUNT & PERMISSIONS SECTION */}
      {(!activeSubTab || activeSubTab === 'Tài khoản & Phân quyền') && (
        selectedUser ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
                      Chi tiết tài khoản: <span style={{ color: 'var(--bravo-teal-dark)' }}>{selectedUser.username}</span>
                    </h2>
                    <span className={`badge ${Number(editUserData.status) === 1 ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}>
                      {Number(editUserData.status) === 1 ? '● Hoạt động' : '● Khóa'}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {!isEditingUser ? (
                  <>
                    <button
                      className="btn btn-primary"
                      onClick={() => setIsEditingUser(true)}
                      style={{ padding: '0.5rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}
                    >
                      <Edit3 size={16} />
                      <span>Sửa</span>
                    </button>
                    {isNhungAdmin && (
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDeleteUser(selectedUser)}
                        style={{ padding: '0.5rem 1.1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, backgroundColor: '#EF4444', color: '#FFFFFF', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        <Trash2 size={16} />
                        <span>Xóa</span>
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      className="btn btn-secondary"
                      onClick={handleCancelEdit}
                      style={{ padding: '0.5rem 1.1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <X size={16} />
                      <span>Hủy</span>
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={handleSaveUser}
                      style={{ padding: '0.5rem 1.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}
                    >
                      <Save size={16} />
                      <span>Lưu</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div className="card" style={{ padding: '1.5rem', backgroundColor: '#FFFFFF' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '2px solid #E2E8F0', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                  <Lock size={18} color="var(--bravo-teal-dark)" />
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>1. Thông tin đăng nhập</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700 }}>Username (Cố định)</label>
                    <input type="text" className="form-input" value={editUserData.username || ''} disabled readOnly style={{ backgroundColor: '#F3F4F6', fontWeight: 700 }} />
                  </div>
                </div>
              </div>

              <div className="card" style={{ padding: '1.5rem', backgroundColor: '#FFFFFF' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '2px solid #E2E8F0', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                  <Users size={18} color="var(--bravo-teal-dark)" />
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>2. Thông tin người dùng</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700 }}>Họ và tên (*)</label>
                    <input type="text" className="form-input" value={editUserData.full_name || ''} disabled={!isEditingUser} onChange={(e) => setEditUserData({ ...editUserData, full_name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700 }}>Email (*)</label>
                    <input type="email" className="form-input" value={editUserData.email || ''} disabled={!isEditingUser} onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <DataTable
            loading={loading}
            addLabel="Tạo Tài khoản mới"
            onAdd={() => {
              setFormData({ role_id: 'role-hr' });
              setModalType('user');
            }}
            onRowDoubleClick={handleOpenUserDetail}
            searchPlaceholder="Tìm tài khoản, họ tên, email..."
            columns={[
              { header: 'Username', accessor: 'username', render: (r) => <b>{r.username}</b> },
              { header: 'Họ và tên', accessor: 'full_name', render: (r) => <span style={{ fontWeight: 600 }}>{r.full_name}</span> },
              { header: 'Vai trò hệ thống', accessor: 'role_name', render: (r) => <span className="badge badge-teal">{r.role_name}</span> },
              { header: 'Phòng ban', accessor: 'department_name' },
              { header: 'Email', accessor: 'email' },
              {
                header: 'Trạng thái',
                accessor: 'status',
                render: (r) => (
                  <span className={`badge ${Number(r.status) === 1 ? 'badge-green' : 'badge-red'}`}>
                    {Number(r.status) === 1 ? 'Hoạt động' : 'Khóa'}
                  </span>
                )
              }
            ]}
            data={users}
          />
        )
      )}

      {/* MODAL THÊM / SỬA PHÒNG BÀN */}
      <Modal
        isOpen={modalType === 'dept'}
        onClose={() => setModalType(null)}
        title={editMode ? "Chỉnh sửa Bộ Phận Danh Mục Dùng Chung" : "Thêm mới Bộ Phận Danh Mục Dùng Chung"}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalType(null)}>Hủy</button>
            <button className="btn btn-primary" onClick={handleSaveDepartment}>Lưu thông tin</button>
          </>
        }
      >
        <form onSubmit={handleSaveDepartment}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>Mã bộ phận (*)</label>
              <input
                type="text"
                className="form-input"
                placeholder="VD: PMK, KKD..."
                value={formData.department_code || ''}
                onChange={(e) => setFormData({ ...formData, department_code: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>Tên bộ phận (*)</label>
              <input
                type="text"
                className="form-input"
                placeholder="VD: Phòng Marketing..."
                value={formData.department_name || ''}
                onChange={(e) => setFormData({ ...formData, department_name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>Bộ phận cấp trên</label>
              <select
                className="form-select"
                value={formData.parent_department_id || ''}
                onChange={(e) => setFormData({ ...formData, parent_department_id: e.target.value })}
              >
                <option value="">-- Đơn vị độc lập (Cấp 1) --</option>
                {departments
                  .filter(d => d.department_id !== formData.department_id)
                  .map((d) => (
                    <option key={d.department_id} value={d.department_id}>{d.department_name}</option>
                  ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>Chỉ tiêu Định biên</label>
              <input
                type="number"
                className="form-input"
                min="0"
                value={formData.target_headcount || 0}
                onChange={(e) => setFormData({ ...formData, target_headcount: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label" style={{ fontWeight: 700 }}>Trưởng bộ phận</label>
              <select
                className="form-select"
                value={formData.manager_id || ''}
                onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
              >
                <option value="">-- Chưa bổ nhiệm --</option>
                {employees.map((e) => (
                  <option key={e.employee_id} value={e.employee_id}>{e.employee_code} - {e.full_name}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Mô tả nhiệm vụ</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Mô tả nhiệm vụ bộ phận..."
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              ></textarea>
            </div>
          </div>
        </form>
      </Modal>

      {/* MODAL THÊM / SỬA VỊ TRÍ CÔNG VIỆC */}
      <Modal
        isOpen={modalType === 'pos'}
        onClose={() => setModalType(null)}
        title={editMode ? "Chỉnh sửa Vị Trí Công Việc Dùng Chung" : "Thêm mới Vị Trí Công Việc Dùng Chung"}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalType(null)}>Hủy</button>
            <button className="btn btn-primary" onClick={handleSavePosition}>Lưu vị trí</button>
          </>
        }
      >
        <form onSubmit={handleSavePosition}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>Mã vị trí (*)</label>
              <input
                type="text"
                className="form-input"
                placeholder="VD: POS_TESTER, POS_DEV..."
                value={formData.position_code || ''}
                onChange={(e) => setFormData({ ...formData, position_code: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>Tên vị trí công việc (*)</label>
              <input
                type="text"
                className="form-input"
                placeholder="VD: Nhân viên Tester, Chuyên viên HR..."
                value={formData.position_name || ''}
                onChange={(e) => setFormData({ ...formData, position_name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>Bộ phận trực thuộc (*)</label>
              <select
                className="form-select"
                value={formData.department_id || ''}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
              >
                {departments.map((d) => (
                  <option key={d.department_id} value={d.department_id}>{d.department_name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>Thang/bậc lương</label>
              <input
                type="text"
                className="form-input"
                placeholder="VD: Bậc 1, Bậc 2, 15-20 triệu..."
                value={formData.salary_grade || ''}
                onChange={(e) => setFormData({ ...formData, salary_grade: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>Chỉ tiêu định biên</label>
              <input
                type="number"
                className="form-input"
                min="0"
                value={formData.target_headcount || 0}
                onChange={(e) => setFormData({ ...formData, target_headcount: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="form-group" style={{ justifyContent: 'center' }}>
              <label className="form-label" style={{ fontWeight: 700 }}>Vai trò đặc thù</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={Boolean(formData.is_assistant)}
                  onChange={(e) => setFormData({ ...formData, is_assistant: e.target.checked ? 1 : 0 })}
                />
                <span>Là vị trí Trợ lý / Thư ký</span>
              </label>
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Mô tả</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Mô tả trách nhiệm vị trí công việc..."
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              ></textarea>
            </div>
          </div>
        </form>
      </Modal>

      {/* MODAL THÊM BƯỚC LỘ TRÌNH KÝ HỢP ĐỒNG */}
      <Modal
        isOpen={modalType === 'pathway'}
        onClose={() => setModalType(null)}
        title={`Thêm bước lộ trình ký HĐLĐ cho Vị trí: ${selectedPosRow?.position_name || ''}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalType(null)}>Hủy</button>
            <button className="btn btn-primary" onClick={handleSavePathwayStep}>Thêm bước lộ trình</button>
          </>
        }
      >
        <form onSubmit={handleSavePathwayStep}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>Thứ tự bước (*)</label>
              <input
                type="number"
                className="form-input"
                min="1"
                value={formData.step_order || 1}
                onChange={(e) => setFormData({ ...formData, step_order: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>Loại HĐLĐ (*)</label>
              <select
                className="form-select"
                value={formData.contract_type_id || ''}
                onChange={(e) => setFormData({ ...formData, contract_type_id: e.target.value })}
              >
                {contractTypes.map((ct) => (
                  <option key={ct.contract_type_id} value={ct.contract_type_id}>
                    {ct.contract_type_code} - {ct.contract_type_name} ({ct.duration_months > 0 ? `${ct.duration_months} tháng` : 'Không XĐTH'})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Ghi chú hướng dẫn</label>
              <input
                type="text"
                className="form-input"
                placeholder="VD: Hợp đồng áp dụng sau khi đạt đánh giá thử việc..."
                value={formData.note || ''}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* MODAL THÊM / SỬA LOẠI HỢP ĐỒNG LAO ĐỘNG */}
      <Modal
        isOpen={modalType === 'contractType'}
        onClose={() => setModalType(null)}
        title={editMode ? "Chỉnh sửa Loại Hợp Đồng Lao Động" : "Khai báo Loại Hợp Đồng Lao Động Mới"}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalType(null)}>Hủy</button>
            <button className="btn btn-primary" onClick={handleSaveContractType}>Lưu loại HĐLĐ</button>
          </>
        }
      >
        <form onSubmit={handleSaveContractType}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>Mã loại HĐ (*)</label>
              <input
                type="text"
                className="form-input"
                placeholder="VD: HDTV, HD12M, HDKTH..."
                value={formData.contract_type_code || ''}
                onChange={(e) => setFormData({ ...formData, contract_type_code: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>Tên loại HĐLĐ (*)</label>
              <input
                type="text"
                className="form-input"
                placeholder="VD: Hợp đồng xác định thời hạn 12 tháng..."
                value={formData.contract_type_name || ''}
                onChange={(e) => setFormData({ ...formData, contract_type_name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>Số tháng thời hạn</label>
              <input
                type="number"
                className="form-input"
                min="0"
                placeholder="0 = Không xác định thời hạn"
                value={formData.duration_months !== undefined ? formData.duration_months : 12}
                onChange={(e) => setFormData({ ...formData, duration_months: parseInt(e.target.value) || 0 })}
              />
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Nhập 0 nếu là Hợp đồng Không xác định thời hạn</span>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>Chế độ thử việc</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginTop: '0.35rem', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={Boolean(formData.has_probation)}
                  onChange={(e) => {
                    const isProb = e.target.checked ? 1 : 0;
                    setFormData({
                      ...formData,
                      has_probation: isProb,
                      probation_days: isProb ? (formData.probation_days || 60) : 0
                    });
                  }}
                />
                <span>Có giai đoạn thử việc</span>
              </label>
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label" style={{ fontWeight: 700 }}>
                Số ngày thử việc {formData.has_probation ? '(*)' : ''}
              </label>
              <input
                type="number"
                className="form-input"
                min="1"
                placeholder="VD: 30 ngày, 60 ngày..."
                disabled={!formData.has_probation}
                value={formData.has_probation ? (formData.probation_days || 60) : ''}
                onChange={(e) => setFormData({ ...formData, probation_days: parseInt(e.target.value) || 0 })}
                style={{ backgroundColor: !formData.has_probation ? '#F3F4F6' : '#FFFFFF' }}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* MODAL TẠO TÀI KHOẢN */}
      <Modal
        isOpen={modalType === 'user'}
        onClose={() => setModalType(null)}
        title="Tạo Tài khoản Người dùng Mới"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalType(null)}>Hủy</button>
            <button className="btn btn-primary" onClick={handleCreateUser}>Tạo tài khoản</button>
          </>
        }
      >
        <form onSubmit={handleCreateUser}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Tên đăng nhập (Username) (*)</label>
              <input type="text" className="form-input" required value={formData.username || ''} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Mật khẩu (*)</label>
              <input type="password" className="form-input" placeholder="Mặc định: 123456" value={formData.password || ''} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Họ và tên người dùng (*)</label>
              <input type="text" className="form-input" required value={formData.full_name || ''} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Email (*)</label>
              <input type="email" className="form-input" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
