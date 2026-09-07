const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { queryOne } = require('../db/connection');
const { JWT_SECRET, authenticateToken, authorizeRole } = require('../middleware/auth');

// Đăng nhập
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập tên đăng nhập và mật khẩu.' });
        }

        const user = await queryOne(
            `SELECT u.*, r.role_name, d.department_name 
       FROM User u 
       JOIN Role r ON u.role_id = r.role_id 
       LEFT JOIN Department d ON u.department_id = d.department_id 
       WHERE u.username = ? AND u.status = 1`,
            [username]
        );

        if (!user) {
            return res.status(404).json({ success: false, message: 'Tài khoản không tồn tại hoặc đã bị khóa.' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Mật khẩu không chính xác.' });
        }

        const token = jwt.sign(
            {
                id: user.user_id,
                username: user.username,
                fullName: user.full_name,
                roleId: user.role_id,
                roleName: user.role_name,
                deptId: user.department_id,
                deptName: user.department_name,
                employeeId: user.employee_id
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        return res.json({
            success: true,
            message: 'Đăng nhập thành công',
            token,
            user: {
                id: user.user_id,
                username: user.username,
                fullName: user.full_name,
                email: user.email,
                roleName: user.role_name,
                deptId: user.department_id,
                deptName: user.department_name,
                employeeId: user.employee_id,
                avatarUrl: user.avatar_url
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi đăng nhập.' });
    }
});

// Switch role (Demo nhanh cho Hội đồng chấm đồ án)
// Chỉ Administrator ĐÃ đăng nhập hợp lệ mới được dùng công cụ demo này -
// trước đây route này mở công khai, cho phép bất kỳ ai tự cấp quyền Administrator.
router.post('/switch-role', authenticateToken, authorizeRole('Administrator'), async (req, res) => {
    try {
        const { roleName } = req.body;

        const user = await queryOne(
            `SELECT TOP (1) u.*, r.role_name, d.department_name FROM User u JOIN Role r ON u.role_id = r.role_id LEFT JOIN Department d ON u.department_id = d.department_id WHERE r.role_name = ?`,
            [roleName]
        );

        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng cho vai trò này.' });
        }

        const token = jwt.sign(
            {
                id: user.user_id,
                username: user.username,
                fullName: user.full_name,
                roleId: user.role_id,
                roleName: user.role_name,
                deptId: user.department_id,
                deptName: user.department_name,
                employeeId: user.employee_id
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        return res.json({
            success: true,
            message: `Đã chuyển sang quyền ${user.role_name}`,
            token,
            user: {
                id: user.user_id,
                username: user.username,
                fullName: user.full_name,
                email: user.email,
                roleName: user.role_name,
                deptId: user.department_id,
                deptName: user.department_name,
                employeeId: user.employee_id,
                avatarUrl: user.avatar_url
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Lỗi chuyển đổi vai trò demo.' });
    }
});

// Lấy thông tin user hiện tại
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await queryOne(
            `SELECT u.user_id, u.username, u.full_name, u.email, u.phone, u.avatar_url, r.role_name, d.department_name 
       FROM User u 
       JOIN Role r ON u.role_id = r.role_id 
       LEFT JOIN Department d ON u.department_id = d.department_id 
       WHERE u.user_id = ?`,
            [req.user.id]
        );

        return res.json({ success: true, user });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Lỗi lấy thông tin người dùng.' });
    }
});

module.exports = router;
