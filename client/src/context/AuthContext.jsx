import React, { createContext, useContext, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // Trước đây có DEFAULT_USER với roleName: 'Administrator' được dùng khi
    // chưa có phiên đăng nhập nào - nghĩa là ai mở app lên cũng đã "đăng nhập sẵn"
    // làm Administrator, màn hình Login không bao giờ hiện ra. Đã bỏ để phải
    // đăng nhập thật (qua /api/auth/login) mới có quyền truy cập.
    const [user, setUser] = useState(() => {
        try {
            const savedUser = localStorage.getItem('bravo_hrm_user');
            return (savedUser && savedUser !== 'undefined') ? JSON.parse(savedUser) : null;
        } catch (e) {
            return null;
        }
    });

    const [loading, setLoading] = useState(false);

    const login = async (username, password) => {
        setLoading(true);
        try {
            const res = await api.post('/auth/login', { username, password });
            if (res.success) {
                localStorage.setItem('bravo_hrm_token', res.token);
                localStorage.setItem('bravo_hrm_user', JSON.stringify(res.user));
                setUser(res.user);
                return { success: true };
            }
            return { success: false, message: res.message };
        } catch (err) {
            return { success: false, message: 'Không thể kết nối đến máy chủ API.' };
        } finally {
            setLoading(false);
        }
    };

    const switchRole = async (roleName) => {
        setLoading(true);
        try {
            const res = await api.post('/auth/switch-role', { roleName });
            if (res.success) {
                localStorage.setItem('bravo_hrm_token', res.token);
                localStorage.setItem('bravo_hrm_user', JSON.stringify(res.user));
                setUser(res.user);
                return { success: true, user: res.user };
            }
            return { success: false, message: res.message };
        } catch (err) {
            return { success: false, message: 'Lỗi chuyển đổi quyền.' };
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('bravo_hrm_token');
        localStorage.removeItem('bravo_hrm_user');
        setUser(null);
    };

    const updateUserSession = (newUserData) => {
        if (!user) return;
        const updated = { ...user, ...newUserData };
        localStorage.setItem('bravo_hrm_user', JSON.stringify(updated));
        setUser(updated);
    };

    // Centralized Permission Checker (Action-Level Permission Control)
    const hasPermission = (action, resource, itemDeptId) => {
        if (!user) return false;
        const role = user.roleName || user.role_name || 'User – Employee';
        const isHrDept = user.deptId === 'dept-hr' || user.department_id === 'dept-hr' || (user.deptName && user.deptName.toLowerCase().includes('nhân sự'));

        // 1. Administrator: Full access everywhere
        if (role === 'Administrator' || role === 'Admin' || role === 'role-admin') {
            return true;
        }

        // 2. Admin System Resources (User accounts, Roles) restricted strictly to Administrator
        if (resource === 'USER' || resource === 'ROLE' || resource === 'SYSTEM_CONFIG' || resource === 'ADMIN_MODULE') {
            return false;
        }

        // 3. User – CEO / Ban Giám đốc
        if (role === 'User – CEO' || role === 'CEO' || role === 'Ban Giám đốc') {
            if (action === 'DELETE') return false; // CEO cannot delete system master records
            return true;
        }

        // 4. User – Manager / Trưởng phòng
        if (role === 'User – Manager' || role === 'Department Manager' || role === 'Trưởng phòng') {
            if (action === 'DELETE') return false; // Manager cannot delete master records
            if (action === 'APPROVE' || action === 'REJECT') {
                // Approval permission strictly restricted to manager's department
                if (itemDeptId && user.deptId && itemDeptId !== user.deptId && itemDeptId !== user.department_id) {
                    return false;
                }
                return true;
            }
            return true;
        }

        // 5. User – Employee / Nhân viên
        if (role === 'User – Employee' || role === 'Employee' || role === 'Nhân viên') {
            if (action === 'APPROVE' || action === 'REJECT' || action === 'DELETE') {
                return false; // Employees cannot approve, reject, or delete
            }
            if (isHrDept) {
                return true; // HR Staff can perform HR operations assigned to them
            } else {
                // Non-HR Employees can ONLY view, create, edit Leave Applications (Đơn xin nghỉ phép)
                if (resource === 'LEAVE_APPLICATION' || resource === 'RESIGNATION') {
                    return action === 'VIEW' || action === 'CREATE' || action === 'EDIT' || action === 'UPDATE';
                }
                return false;
            }
        }

        // Fallback for HR Staff
        if (role === 'HR Staff') {
            if (action === 'DELETE' && (resource === 'DEPARTMENT' || resource === 'POSITION')) return false;
            return true;
        }

        return false;
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, switchRole, updateUserSession, hasPermission, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
