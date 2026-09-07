const crypto = require('crypto');
const { query, queryOne, run } = require('../db/connection');

/**
 * XÁC ĐỊNH CHUỖI DUYỆT (APPROVAL CHAIN)
 * Dựa trên: vai trò người gửi (Nhân viên/Trưởng Phòng/Trưởng Khối) và cơ cấu Department/parent_department_id.
 * KHÔNG hardcode username - chỉ dựa vào dữ liệu tổ chức thật.
 *
 * Quy tắc (theo đúng mục 3 của yêu cầu nghiệp vụ):
 *  - Nhân viên       -> Cấp 1: Trưởng Phòng của phòng mình -> Cấp 2: Ban Giám Đốc
 *  - Trưởng Phòng    -> Cấp 1: Trưởng Khối của khối mình (nếu phòng có khối cha) -> Cấp 2: Ban Giám Đốc
 *                       (nếu phòng không thuộc khối nào) -> chỉ 1 cấp: Ban Giám Đốc
 *  - Trưởng Khối     -> Cấp 1: Ban Giám Đốc
 *  - Ban Giám Đốc/Administrator -> Không cần duyệt (tự động APPROVED)
 *
 * @param {string} employeeId - employee_id của người gửi đơn
 * @param {string} requesterRoleName - roleName của người gửi (từ req.user.roleName)
 * @param {string} requesterDeptId - department_id của người gửi
 * @returns {Array<{level_order, required_role, department_scope}>}
 */
async function buildApprovalChain(employeeId, requesterRoleName, requesterDeptId) {
    const chain = [];

    if (requesterRoleName === 'Ban Giám Đốc' || requesterRoleName === 'Administrator') {
        return chain; // Không cần duyệt - tự động APPROVED
    }

    if (requesterRoleName === 'Nhân viên' || requesterRoleName === 'HR Staff') {
        // Cấp 1: Trưởng Phòng của phòng người gửi
        chain.push({ level_order: 1, required_role: 'Trưởng Phòng', department_scope: requesterDeptId });
        // Cấp 2: Ban Giám Đốc (cấp cuối)
        chain.push({ level_order: 2, required_role: 'Ban Giám Đốc', department_scope: null });
        return chain;
    }

    if (requesterRoleName === 'Trưởng Phòng') {
        const dept = await queryOne(`SELECT parent_department_id FROM Department WHERE department_id = ?`, [requesterDeptId]);
        if (dept && dept.parent_department_id) {
            chain.push({ level_order: 1, required_role: 'Trưởng Khối', department_scope: dept.parent_department_id });
            chain.push({ level_order: 2, required_role: 'Ban Giám Đốc', department_scope: null });
        } else {
            // Phòng không trực thuộc khối nào -> duyệt thẳng ở Ban Giám Đốc
            chain.push({ level_order: 1, required_role: 'Ban Giám Đốc', department_scope: null });
        }
        return chain;
    }

    if (requesterRoleName === 'Trưởng Khối') {
        chain.push({ level_order: 1, required_role: 'Ban Giám Đốc', department_scope: null });
        return chain;
    }

    // Vai trò không xác định -> mặc định về Ban Giám Đốc để an toàn
    chain.push({ level_order: 1, required_role: 'Ban Giám Đốc', department_scope: null });
    return chain;
}

/**
 * Khởi tạo chuỗi duyệt cho 1 tài liệu (đơn/phiếu) cụ thể, ghi vào bảng ApprovalHistory.
 * Trả về status ban đầu để lưu vào bảng tài liệu gốc (VD: LeaveApplication.status).
 */
async function initApprovalChain(documentType, documentId, employeeId) {
    const now = Date.now();
    const emp = await queryOne(`SELECT department_id FROM Employee WHERE employee_id = ?`, [employeeId]);
    const requesterDeptId = emp ? emp.department_id : null;
    const requesterRoleName = await inferEmployeeRoleName(employeeId);

    const chain = await buildApprovalChain(employeeId, requesterRoleName, requesterDeptId);

    if (chain.length === 0) {
        return 'APPROVED'; // Ban Giám Đốc / Admin tự gửi -> tự động duyệt
    }

    for (const [idx, step] of chain.entries()) {
        await run(
            `INSERT INTO ApprovalHistory (approval_id, document_type, document_id, level_order, required_role, department_scope, status, submitted_date, created_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                'appr-' + crypto.randomUUID(),
                documentType,
                documentId,
                step.level_order,
                step.required_role,
                step.department_scope,
                idx === 0 ? 'PENDING' : 'WAITING', // chỉ cấp đầu tiên ở trạng thái chờ duyệt ngay, các cấp sau chờ tới lượt
                idx === 0 ? now : null,
                now
            ]
        );
    }

    return `PENDING_LEVEL_${chain[0].level_order}`;
}

/** Lấy toàn bộ lịch sử duyệt của 1 tài liệu, sắp theo cấp */
async function getApprovalHistory(documentType, documentId) {
    return await query(
        `SELECT * FROM ApprovalHistory WHERE document_type = ? AND document_id = ? ORDER BY level_order ASC`,
        [documentType, documentId]
    );
}

/** Kiểm tra user hiện tại có quyền duyệt ở 1 cấp cụ thể không */
function canUserApproveLevel(user, level) {
    if (user.roleName === 'Administrator') return true; // Admin luôn duyệt được (quyền tối cao)
    if (user.roleName !== level.required_role) return false;
    if (!level.department_scope) return true; // Cấp Ban Giám Đốc - không giới hạn phòng ban
    return user.deptId === level.department_scope;
}

/**
 * Xử lý quyết định duyệt/từ chối cho cấp đang chờ (PENDING) của 1 tài liệu.
 * Trả về { newDocumentStatus, error } - error khác null nghĩa là bị từ chối do không đủ quyền.
 */
async function advanceApproval(documentType, documentId, decision, comment, user) {
    const currentLevel = await queryOne(
        `SELECT TOP (1) * FROM ApprovalHistory WHERE document_type = ? AND document_id = ? AND status = 'PENDING' ORDER BY level_order ASC`,
        [documentType, documentId]
    );

    if (!currentLevel) {
        return { error: 'Tài liệu này không có cấp duyệt nào đang chờ xử lý (có thể đã được duyệt/từ chối trước đó).' };
    }

    if (!canUserApproveLevel(user, currentLevel)) {
        return { error: `Bạn không có thẩm quyền duyệt ở cấp này (yêu cầu: ${currentLevel.required_role}${currentLevel.department_scope ? ' - đúng phòng ban liên quan' : ''}).` };
    }

    const now = Date.now();

    if (decision === 'REJECTED') {
        await run(
            `UPDATE ApprovalHistory SET status = 'REJECTED', comment = ?, approver_employee_id = ?, approver_name = ?, decided_date = ? WHERE approval_id = ?`,
            [comment || '', user.employeeId || null, user.fullName, now, currentLevel.approval_id]
        );
        return { newDocumentStatus: 'REJECTED' };
    }

    // APPROVED ở cấp hiện tại
    await run(
        `UPDATE ApprovalHistory SET status = 'APPROVED', comment = ?, approver_employee_id = ?, approver_name = ?, decided_date = ? WHERE approval_id = ?`,
        [comment || '', user.employeeId || null, user.fullName, now, currentLevel.approval_id]
    );

    // Tìm cấp tiếp theo (nếu có) để kích hoạt
    const nextLevel = await queryOne(
        `SELECT * FROM ApprovalHistory WHERE document_type = ? AND document_id = ? AND level_order = ? `,
        [documentType, documentId, currentLevel.level_order + 1]
    );

    if (nextLevel) {
        await run(`UPDATE ApprovalHistory SET status = 'PENDING', submitted_date = ? WHERE approval_id = ?`, [now, nextLevel.approval_id]);
        return { newDocumentStatus: `PENDING_LEVEL_${nextLevel.level_order}` };
    }

    return { newDocumentStatus: 'APPROVED' }; // Đã qua hết các cấp
}

/**
 * Suy luận "vai trò nghiệp vụ" của 1 Employee bất kỳ - kể cả khi họ CHƯA có tài khoản User đăng nhập.
 * Ưu tiên 1: nếu có User account liên kết -> dùng đúng role_name của tài khoản đó.
 * Ưu tiên 2: suy luận từ tên chức vụ (Position.position_name) - theo đúng gợi ý của yêu cầu nghiệp vụ
 * (dựa vào Position/Management level thay vì hardcode).
 */
async function inferEmployeeRoleName(employeeId) {
    const linkedUser = await queryOne(
        `SELECT TOP (1) r.role_name FROM User u JOIN Role r ON u.role_id = r.role_id WHERE u.employee_id = ?`,
        [employeeId]
    );
    if (linkedUser) return linkedUser.role_name;

    const emp = await queryOne(
        `SELECT e.department_id, p.position_name FROM Employee e LEFT JOIN Position p ON e.position_id = p.position_id WHERE e.employee_id = ?`,
        [employeeId]
    );
    if (!emp) return 'Nhân viên';

    const posName = (emp.position_name || '').toLowerCase();
    if (emp.department_id === 'dept-bgd' && (posName.includes('giám đốc') || posName.includes('gd'))) {
        return 'Ban Giám Đốc';
    }
    if (posName.includes('trưởng khối') || posName.includes('giám đốc khối')) {
        return 'Trưởng Khối';
    }
    if (posName.includes('trưởng phòng') || posName.includes('trưởng ban')) {
        return 'Trưởng Phòng';
    }
    return 'Nhân viên';
}

module.exports = {
    buildApprovalChain,
    inferEmployeeRoleName,
    initApprovalChain,
    getApprovalHistory,
    canUserApproveLevel,
    advanceApproval
};
