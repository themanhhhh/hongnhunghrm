require('dotenv').config();

const { run, query, queryOne } = require('./connection');
const { initSchema } = require('./schema');
const bcrypt = require('bcryptjs');

const seedData = async (forceClear = false) => {
    console.log('Starting BRAVO HRM Comprehensive System Seeding...');

    // Re-initialize schema & columns
    await initSchema();

    // A fixed snapshot keeps clean installs and demos reproducible over time.
    const now = new Date('2026-09-01T09:00:00.000Z').getTime();
    const passwordHash = await bcrypt.hash('123456', 10);

    // Clear existing tables ONLY if forceClear is true (manual CLI run)
    if (forceClear) {
        const tablesToClear = [
            'PositionContractPathway', 'ApprovalHistory', 'AuditLog', 'DepartmentQuotaDetail', 'DepartmentQuota',
            'InterviewEvaluationCriteria', 'InterviewEvaluationScript', 'InterviewEvaluation', 'PreScreeningCriteria',
            'PreScreening', 'Offer', 'Interview', 'InterviewSchedule', 'Candidate', 'RecruitmentRound',
            'RecruitmentPlan', 'RecruitmentRequest', 'RewardDisciplineProposal', 'EmployeeEvaluationDetail',
            'EmployeeEvaluation', 'EvaluationScale', 'EvaluationCriteria', 'LeaveApplication', 'ResignationDecision',
            'ResignationApplication', 'TransferDecision', 'TransferProposal', 'ContractExtension', 'ContractProposal',
            'RewardDiscipline', 'WorkHistory', 'EmployeeContract', 'User', 'Employee', 'Position', 'Department', 'Role'
        ];

        for (const table of tablesToClear) {
            try { await run(`DELETE FROM ${table}`); } catch (e) { }
        }
    }

    // =========================================================================
    // 1. ROLES
    // =========================================================================
    const roles = [
        { role_id: 'role-admin', role_name: 'Administrator', description: 'Admin - Quản trị hệ thống và phân quyền toàn hệ thống' },
        { role_id: 'role-ceo', role_name: 'Ban Giám Đốc', description: 'Ban Giám đốc - Quyền xem, thực hiện nghiệp vụ và phê duyệt cấp cao nhất' },
        { role_id: 'role-khoi', role_name: 'Trưởng Khối', description: 'Trưởng Khối - Quản lý nhiều phòng ban trực thuộc, phê duyệt cấp khối' },
        { role_id: 'role-manager', role_name: 'Trưởng Phòng', description: 'Trưởng Phòng - Quyền quản lý nghiệp vụ phòng ban và phê duyệt cấp bộ phận' },
        { role_id: 'role-employee', role_name: 'Nhân viên', description: 'Nhân viên - Quyền thực hiện nghiệp vụ theo phân quyền phòng ban' },
        { role_id: 'role-hr', role_name: 'HR Staff', description: 'Nhân viên Tuyển dụng và Quản lý Hồ sơ Nhân sự' }
    ];

    for (const r of roles) {
        const existing = await queryOne('SELECT role_id FROM Role WHERE role_id = ?', [r.role_id]);
        if (!existing) {
            await run(`INSERT INTO Role (role_id, role_name, description, created_date, last_modified_date, status) VALUES (?, ?, ?, ?, ?, 1)`,
                [r.role_id, r.role_name, r.description, now, now]);
        } else {
            await run(`UPDATE Role SET role_name = ?, description = ?, last_modified_date = ? WHERE role_id = ?`,
                [r.role_name, r.description, now, r.role_id]);
        }
    }

    // =========================================================================
    // 2. DEPARTMENTS (14 Đơn vị tổ chức chuẩn cơ cấu BRAVO ERP)
    // =========================================================================
    const departments = [
        { department_id: 'dept-bgd', department_code: 'BGD', department_name: 'Ban Giám Đốc', description: 'Ban Giám đốc BRAVO Software JSC', parent_department_id: null, target_headcount: 4 },
        { department_id: 'dept-hr', department_code: 'PHR', department_name: 'Phòng Nhân sự', description: 'Quản lý Nhân sự, C&B và Tuyển dụng', parent_department_id: null, target_headcount: 8 },
        { department_id: 'dept-pmk', department_code: 'PMK', department_name: 'Phòng Marketing', description: 'Marketing, Truyền thông & Quảng bá thương hiệu', parent_department_id: null, target_headcount: 15 },
        { department_id: 'dept-kd', department_code: 'PKD', department_name: 'Phòng Kinh doanh', description: 'Kinh doanh & Phát triển Thị trường ERP', parent_department_id: null, target_headcount: 20 },
        { department_id: 'dept-gptv', department_code: 'GPTV', department_name: 'Phòng Giải pháp tư vấn', description: 'Tư vấn Giải pháp Quản trị Doanh nghiệp ERP', parent_department_id: null, target_headcount: 10 },

        // Khối KTTK & 2 Phòng trực thuộc
        { department_id: 'dept-kttk', department_code: 'KTTK', department_name: 'Khối Kỹ thuật triển khai', description: 'Khối chỉ đạo Triển khai & Cài đặt hệ thống ERP', parent_department_id: null, target_headcount: 2 },
        { department_id: 'dept-kttk-1', department_code: 'KTTK1', department_name: 'Phòng KTTK 1', description: 'Phòng Kỹ thuật Triển khai Dự án Miền Bắc', parent_department_id: 'dept-kttk', target_headcount: 12 },
        { department_id: 'dept-kttk-2', department_code: 'KTTK2', department_name: 'Phòng KTTK 2', description: 'Phòng Kỹ thuật Triển khai Dự án Miền Trung & Nam', parent_department_id: 'dept-kttk', target_headcount: 15 },

        { department_id: 'dept-ptnv', department_code: 'PTNV', department_name: 'Phòng Phân tích nghiệp vụ', description: 'Phân tích Quy trình Nghiệp vụ & Thiết kế Luồng (BA)', parent_department_id: null, target_headcount: 6 },
        { department_id: 'dept-ptsp', department_code: 'PTSP', department_name: 'Phòng Phát triển sản phẩm', description: 'Nghiên cứu & Thiết kế Tính năng Sản phẩm BRAVO 10', parent_department_id: null, target_headcount: 14 },

        // Khối Công nghệ & Phòng Cloud
        { department_id: 'dept-kcn', department_code: 'KCN', department_name: 'Khối Công nghệ', description: 'Khối R&D và Định hướng Công nghệ Phần mềm', parent_department_id: null, target_headcount: 2 },
        { department_id: 'dept-cloud', department_code: 'CLOUD', department_name: 'Phòng Cloud và Hạ tầng', description: 'Quản trị Nền tảng Cloud, Server & DevOps', parent_department_id: 'dept-kcn', target_headcount: 10 },

        { department_id: 'dept-kt', department_code: 'PKT', department_name: 'Phòng Kiểm thử', description: 'Kiểm thử Tính năng, Chất lượng & Hiệu năng ERP (QA/QC)', parent_department_id: null, target_headcount: 12 },
        { department_id: 'dept-bh', department_code: 'PBH', department_name: 'Phòng Bảo hành', description: 'Bảo hành, Hỗ trợ Kỹ thuật & Chăm sóc Sau Bán hàng', parent_department_id: null, target_headcount: 8 }
    ];

    for (const d of departments) {
        const existing = await queryOne('SELECT department_id FROM Department WHERE department_id = ?', [d.department_id]);
        if (existing) {
            await run(`UPDATE Department SET department_name = ?, department_code = ?, description = ?, parent_department_id = ?, target_headcount = ?, last_modified_date = ? WHERE department_id = ?`,
                [d.department_name, d.department_code, d.description, d.parent_department_id, d.target_headcount, now, d.department_id]);
        } else {
            await run(`INSERT INTO Department (department_id, created_date, last_modified_date, department_code, department_name, description, parent_department_id, target_headcount, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
                [d.department_id, now, now, d.department_code, d.department_name, d.description, d.parent_department_id, d.target_headcount]);
        }
    }

    // =========================================================================
    // 3. POSITIONS (Danh mục Vị trí Công việc Chuẩn hóa)
    // =========================================================================
    const positions = [
        // --- Ban Giám Đốc (dept-bgd) --- (Bộ phận cấp cao nhất, parent_department_id = null)
        { position_id: 'pos-bgd-ceo', position_code: 'BGD_CEO', position_name: 'Giám đốc', department_id: 'dept-bgd', target_headcount: 1, description: 'Điều hành toàn bộ hoạt động công ty' },
        { position_id: 'pos-bgd-vp', position_code: 'BGD_VP', position_name: 'Phó Giám đốc', department_id: 'dept-bgd', target_headcount: 2, description: 'Phụ trách các khối hoạt động chuyên môn' },
        { position_id: 'pos-bgd-asst', position_code: 'BGD_ASST', position_name: 'Trợ lý Giám đốc', department_id: 'dept-bgd', target_headcount: 1, description: 'Hỗ trợ Ban Giám đốc điều hành & quản lý' },

        // --- Phòng Nhân sự (dept-hr) ---
        { position_id: 'pos-hr-mgr', position_code: 'PHR_MGR', position_name: 'Trưởng Phòng Nhân sự', department_id: 'dept-hr', target_headcount: 1, description: 'Quản lý toàn bộ công tác nhân sự công ty' },
        { position_id: 'pos-hr-lead', position_code: 'PHR_LEAD', position_name: 'Trưởng Nhóm Nhân sự', department_id: 'dept-hr', target_headcount: 2, description: 'Phụ trách nhóm tuyển dụng, C&B & đào tạo' },
        { position_id: 'pos-hr-emp', position_code: 'PHR_EMP', position_name: 'Nhân viên Nhân sự', department_id: 'dept-hr', target_headcount: 5, description: 'Thực hiện các công tác nghiệp vụ nhân sự & hành chính' },

        // --- Phòng Marketing (dept-pmk) ---
        { position_id: 'pos-mkt-mgr', position_code: 'PMK_MGR', position_name: 'Trưởng Phòng Marketing', department_id: 'dept-pmk', target_headcount: 1, description: 'Hoạch định chiến lược Thương hiệu & Marketing' },
        { position_id: 'pos-mkt-lead', position_code: 'PMK_LEAD', position_name: 'Trưởng Nhóm Marketing', department_id: 'dept-pmk', target_headcount: 2, description: 'Quản lý nhóm truyền thông, digital & thiết kế' },
        { position_id: 'pos-mkt-emp', position_code: 'PMK_EMP', position_name: 'Nhân viên Marketing', department_id: 'dept-pmk', target_headcount: 12, description: 'Triển khai các chiến dịch truyền thông & marketing' },

        // --- Phòng Kinh doanh (dept-kd) ---
        { position_id: 'pos-kd-mgr', position_code: 'PKD_MGR', position_name: 'Trưởng Phòng Kinh doanh', department_id: 'dept-kd', target_headcount: 1, description: 'Quản lý hoạt động kinh doanh & chỉ tiêu doanh số' },
        { position_id: 'pos-kd-lead', position_code: 'PKD_LEAD', position_name: 'Trưởng Nhóm Kinh doanh', department_id: 'dept-kd', target_headcount: 2, description: 'Quản lý nhóm tư vấn & bán hàng dự án' },
        { position_id: 'pos-kd-emp', position_code: 'PKD_EMP', position_name: 'Nhân viên Kinh doanh', department_id: 'dept-kd', target_headcount: 17, description: 'Tìm kiếm khách hàng & phát triển thị trường ERP' },

        // --- Phòng Giải pháp tư vấn (dept-gptv) ---
        { position_id: 'pos-gptv-mgr', position_code: 'GPTV_MGR', position_name: 'Trưởng Phòng Giải pháp tư vấn', department_id: 'dept-gptv', target_headcount: 1, description: 'Quản lý hoạt động tư vấn giải pháp doanh nghiệp' },
        { position_id: 'pos-gptv-lead', position_code: 'GPTV_LEAD', position_name: 'Trưởng Nhóm Giải pháp tư vấn', department_id: 'dept-gptv', target_headcount: 2, description: 'Quản lý nhóm tư vấn chuyên sâu giải pháp ERP' },
        { position_id: 'pos-gptv-emp', position_code: 'GPTV_EMP', position_name: 'Nhân viên Giải pháp tư vấn', department_id: 'dept-gptv', target_headcount: 7, description: 'Khảo sát & tư vấn giải pháp quản trị doanh nghiệp' },

        // --- Khối Kỹ thuật triển khai (dept-kttk) ---
        { position_id: 'pos-kttk-dir', position_code: 'KTTK_DIR', position_name: 'Trưởng Khối Kỹ thuật triển khai', department_id: 'dept-kttk', target_headcount: 1, description: 'Điều hành toàn bộ khối triển khai kỹ thuật' },
        { position_id: 'pos-kttk-dep', position_code: 'KTTK_DEP', position_name: 'Phó Khối Kỹ thuật triển khai', department_id: 'dept-kttk', target_headcount: 1, description: 'Hỗ trợ điều hành khối triển khai kỹ thuật' },

        // --- Phòng KTTK 1 (dept-kttk-1) --- (Trực thuộc Khối KTTK)
        { position_id: 'pos-kttk1-mgr', position_code: 'KTTK1_MGR', position_name: 'Trưởng Phòng KTTK 1', department_id: 'dept-kttk-1', target_headcount: 1, description: 'Quản lý phòng kỹ thuật triển khai dự án miền Bắc' },
        { position_id: 'pos-kttk1-lead', position_code: 'KTTK1_LEAD', position_name: 'Trưởng Nhóm KTTK 1', department_id: 'dept-kttk-1', target_headcount: 2, description: 'Quản lý nhóm kỹ thuật triển khai dự án' },
        { position_id: 'pos-kttk1-emp', position_code: 'KTTK1_EMP', position_name: 'Nhân viên KTTK 1', department_id: 'dept-kttk-1', target_headcount: 9, description: 'Cài đặt, tùy chỉnh & triển khai phần mềm ERP' },

        // --- Phòng KTTK 2 (dept-kttk-2) --- (Trực thuộc Khối KTTK)
        { position_id: 'pos-kttk2-mgr', position_code: 'KTTK2_MGR', position_name: 'Trưởng Phòng KTTK 2', department_id: 'dept-kttk-2', target_headcount: 1, description: 'Quản lý phòng kỹ thuật triển khai dự án miền Trung & Nam' },
        { position_id: 'pos-kttk2-lead', position_code: 'KTTK2_LEAD', position_name: 'Trưởng Nhóm KTTK 2', department_id: 'dept-kttk-2', target_headcount: 2, description: 'Quản lý nhóm kỹ thuật triển khai dự án' },
        { position_id: 'pos-kttk2-emp', position_code: 'KTTK2_EMP', position_name: 'Nhân viên KTTK 2', department_id: 'dept-kttk-2', target_headcount: 12, description: 'Lập trình báo cáo, cài đặt & triển khai hệ thống' },

        // --- Phòng Phân tích nghiệp vụ (dept-ptnv) ---
        { position_id: 'pos-ptnv-mgr', position_code: 'PTNV_MGR', position_name: 'Trưởng Phòng Phân tích nghiệp vụ', department_id: 'dept-ptnv', target_headcount: 1, description: 'Định hướng & quản lý công tác phân tích nghiệp vụ (BA)' },
        { position_id: 'pos-ptnv-lead', position_code: 'PTNV_LEAD', position_name: 'Trưởng Nhóm Phân tích nghiệp vụ', department_id: 'dept-ptnv', target_headcount: 1, description: 'Quản lý nhóm chuyên viên phân tích nghiệp vụ' },
        { position_id: 'pos-ptnv-emp', position_code: 'PTNV_EMP', position_name: 'Nhân viên Phân tích nghiệp vụ', department_id: 'dept-ptnv', target_headcount: 4, description: 'Khảo sát bài toán, vẽ sơ đồ luồng & tả yêu cầu BA' },

        // --- Phòng Phát triển sản phẩm (dept-ptsp) ---
        { position_id: 'pos-ptsp-mgr', position_code: 'PTSP_MGR', position_name: 'Trưởng Phòng Phát triển sản phẩm', department_id: 'dept-ptsp', target_headcount: 1, description: 'Định hướng phát triển lộ trình sản phẩm ERP' },
        { position_id: 'pos-ptsp-lead', position_code: 'PTSP_LEAD', position_name: 'Trưởng Nhóm Phát triển sản phẩm', department_id: 'dept-ptsp', target_headcount: 2, description: 'Quản lý nhóm phát triển tính năng sản phẩm' },
        { position_id: 'pos-ptsp-emp', position_code: 'PTSP_EMP', position_name: 'Nhân viên Phát triển sản phẩm', department_id: 'dept-ptsp', target_headcount: 11, description: 'Nghiên cứu, thiết kế & kiểm thử sản phẩm phần mềm' },

        // --- Khối Công nghệ (dept-kcn) ---
        { position_id: 'pos-kcn-dir', position_code: 'KCN_DIR', position_name: 'Trưởng Khối Công nghệ', department_id: 'dept-kcn', target_headcount: 1, description: 'Phụ trách định hướng chiến lược công nghệ & R&D' },
        { position_id: 'pos-kcn-dep', position_code: 'KCN_DEP', position_name: 'Phó Khối Công nghệ', department_id: 'dept-kcn', target_headcount: 1, description: 'Hỗ trợ điều hành khối công nghệ & kiến trúc nền tảng' },

        // --- Phòng Cloud và Hạ tầng (dept-cloud) --- (Trực thuộc Khối Công nghệ)
        { position_id: 'pos-cloud-mgr', position_code: 'CLOUD_MGR', position_name: 'Trưởng Phòng Cloud và Hạ tầng', department_id: 'dept-cloud', target_headcount: 1, description: 'Quản trị hệ thống Cloud, Server & Hạ tầng' },
        { position_id: 'pos-cloud-lead', position_code: 'CLOUD_LEAD', position_name: 'Trưởng Nhóm Cloud và Hạ tầng', department_id: 'dept-cloud', target_headcount: 2, description: 'Quản lý nhóm vận hành hạ tầng DevOps & Cloud' },
        { position_id: 'pos-cloud-emp', position_code: 'CLOUD_EMP', position_name: 'Nhân viên Cloud và Hạ tầng', department_id: 'dept-cloud', target_headcount: 7, description: 'Vận hành, bảo mật & hỗ trợ hạ tầng mạng máy chủ' },

        // --- Phòng Kiểm thử (dept-kt) ---
        { position_id: 'pos-kt-mgr', position_code: 'PKT_MGR', position_name: 'Trưởng Phòng Kiểm thử', department_id: 'dept-kt', target_headcount: 1, description: 'Quản lý quy trình kiểm thử chất lượng sản phẩm' },
        { position_id: 'pos-kt-lead', position_code: 'PKT_LEAD', position_name: 'Trưởng Nhóm Kiểm thử', department_id: 'dept-kt', target_headcount: 2, description: 'Quản lý kịch bản & đội ngũ kiểm thử phần mềm' },
        { position_id: 'pos-kt-emp', position_code: 'PKT_EMP', position_name: 'Nhân viên Kiểm thử', department_id: 'dept-kt', target_headcount: 9, description: 'Thực thi kiểm thử giao diện, chức năng & hiệu năng' },

        // --- Phòng Bảo hành (dept-bh) ---
        { position_id: 'pos-bh-mgr', position_code: 'PBH_MGR', position_name: 'Trưởng Phòng Bảo hành', department_id: 'dept-bh', target_headcount: 1, description: 'Quản lý hoạt động bảo hành & hỗ trợ sau bán hàng' },
        { position_id: 'pos-bh-lead', position_code: 'PBH_LEAD', position_name: 'Trưởng Nhóm Bảo hành', department_id: 'dept-bh', target_headcount: 1, description: 'Quản lý nhóm tiếp nhận & xử lý sự cố bảo hành' },
        { position_id: 'pos-bh-emp', position_code: 'PBH_EMP', position_name: 'Nhân viên Bảo hành', department_id: 'dept-bh', target_headcount: 6, description: 'Hỗ trợ kỹ thuật, bảo trì phần mềm & chăm sóc KH' }
    ];

    for (const p of positions) {
        const existing = await queryOne('SELECT position_id FROM Position WHERE position_id = ?', [p.position_id]);
        if (existing) {
            await run(`UPDATE Position SET position_name = ?, position_code = ?, department_id = ?, description = ?, target_headcount = ?, last_modified_date = ? WHERE position_id = ?`,
                [p.position_name, p.position_code, p.department_id, p.description, p.target_headcount, now, p.position_id]);
        } else {
            await run(`INSERT INTO Position (position_id, created_date, last_modified_date, position_code, position_name, department_id, description, target_headcount, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
                [p.position_id, now, now, p.position_code, p.position_name, p.department_id, p.description, p.target_headcount]);
        }
    }

    // =========================================================================
    // 4. EMPLOYEES (120 Nhân sự thực tế tiếng Việt chuẩn)
    // =========================================================================
    const employeeSeedSpecs = [
        // BGD (3/3)
        { id: 'emp-bgd-01', code: 'NV-2024-001', name: 'Bùi Xuân Thức', gender: 'Nam', dob: '1975-04-12', phone: '0988123456', email: 'thuc.bx@bravo.com.vn', dept: 'dept-bgd', pos: 'pos-bgd-ceo', salary: 65000000 },
        { id: 'emp-bgd-02', code: 'NV-2024-002', name: 'Phạm Thị Thanh Vân', gender: 'Nữ', dob: '1980-08-25', phone: '0912345678', email: 'van.pt@bravo.com.vn', dept: 'dept-bgd', pos: 'pos-bgd-vp', salary: 50000000 },
        { id: 'emp-bgd-03', code: 'NV-2024-003', name: 'Trương Minh Hoàng', gender: 'Nam', dob: '1990-11-15', phone: '0903456789', email: 'hoang.tm@bravo.com.vn', dept: 'dept-bgd', pos: 'pos-bgd-asst', salary: 28000000 },

        // PHR (8/8)
        { id: 'emp-hr-01', code: 'NV-2024-004', name: 'Trần Thị Thu Hà', gender: 'Nữ', dob: '1988-09-20', phone: '0977234567', email: 'ha.tran@bravo.com.vn', dept: 'dept-hr', pos: 'pos-hr-mgr', salary: 32000000 },
        { id: 'emp-hr-02', code: 'NV-2024-005', name: 'Nguyễn Thùy Linh', gender: 'Nữ', dob: '1992-03-14', phone: '0966123456', email: 'linh.nt@bravo.com.vn', dept: 'dept-hr', pos: 'pos-hr-lead', salary: 22000000 },
        { id: 'emp-hr-03', code: 'NV-2024-006', name: 'Hoàng Bích Ngọc', gender: 'Nữ', dob: '1995-07-22', phone: '0934567890', email: 'ngoc.hb@bravo.com.vn', dept: 'dept-hr', pos: 'pos-hr-emp', salary: 16000000 },
        { id: 'emp-hr-04', code: 'NV-2024-007', name: 'Đỗ Phương Thảo', gender: 'Nữ', dob: '1994-01-30', phone: '0918273645', email: 'thao.dp@bravo.com.vn', dept: 'dept-hr', pos: 'pos-hr-lead', salary: 17500000 },
        { id: 'emp-hr-05', code: 'NV-2024-008', name: 'Vũ Hoài Nam', gender: 'Nam', dob: '1993-06-18', phone: '0987654321', email: 'nam.vh@bravo.com.vn', dept: 'dept-hr', pos: 'pos-hr-emp', salary: 16500000 },
        { id: 'emp-hr-06', code: 'NV-2024-009', name: 'Lê Khánh Huyền', gender: 'Nữ', dob: '1997-12-05', phone: '0922334455', email: 'huyen.lk@bravo.com.vn', dept: 'dept-hr', pos: 'pos-hr-emp', salary: 13000000 },
        { id: 'emp-hr-07', code: 'NV-2024-010', name: 'Trịnh Minh Đức', gender: 'Nam', dob: '1991-05-09', phone: '0944556677', email: 'duc.tm@bravo.com.vn', dept: 'dept-hr', pos: 'pos-hr-emp', salary: 15500000 },
        { id: 'emp-hr-08', code: 'NV-2024-011', name: 'Bùi Mai Phương', gender: 'Nữ', dob: '1998-02-17', phone: '0955667788', email: 'phuong.bm@bravo.com.vn', dept: 'dept-hr', pos: 'pos-hr-emp', salary: 14500000 },

        // PMK (15/15)
        { id: 'emp-mkt-01', code: 'NV-2024-012', name: 'Đỗ Thị Thu Trang', gender: 'Nữ', dob: '1987-05-18', phone: '0966334455', email: 'trang.dtt@bravo.com.vn', dept: 'dept-pmk', pos: 'pos-mkt-mgr', salary: 35000000 },
        { id: 'emp-mkt-02', code: 'NV-2024-013', name: 'Nguyễn Hoàng Anh', gender: 'Nam', dob: '1991-03-27', phone: '0977445566', email: 'anh.nh@bravo.com.vn', dept: 'dept-pmk', pos: 'pos-mkt-lead', salary: 23000000 },
        { id: 'emp-mkt-03', code: 'NV-2024-014', name: 'Lê Minh Triết', gender: 'Nam', dob: '1992-09-14', phone: '0988556677', email: 'triet.lm@bravo.com.vn', dept: 'dept-pmk', pos: 'pos-mkt-lead', salary: 22500000 },
        { id: 'emp-mkt-04', code: 'NV-2024-015', name: 'Phạm Ngọc Bảo', gender: 'Nam', dob: '1994-11-08', phone: '0911667788', email: 'bao.pn@bravo.com.vn', dept: 'dept-pmk', pos: 'pos-mkt-emp', salary: 17000000 },
        { id: 'emp-mkt-05', code: 'NV-2024-016', name: 'Vũ Phương Thảo', gender: 'Nữ', dob: '1995-04-02', phone: '0922778899', email: 'thao.vp@bravo.com.vn', dept: 'dept-pmk', pos: 'pos-mkt-emp', salary: 16500000 },
        { id: 'emp-mkt-06', code: 'NV-2024-017', name: 'Hoàng Văn Việt', gender: 'Nam', dob: '1993-07-19', phone: '0933889900', email: 'viet.hv@bravo.com.vn', dept: 'dept-pmk', pos: 'pos-mkt-emp', salary: 16000000 },
        { id: 'emp-mkt-07', code: 'NV-2024-018', name: 'Trịnh Thị Linh', gender: 'Nữ', dob: '1996-01-23', phone: '0944990011', email: 'linh.tt@bravo.com.vn', dept: 'dept-pmk', pos: 'pos-mkt-emp', salary: 18000000 },
        { id: 'emp-mkt-08', code: 'NV-2024-019', name: 'Bùi Tiến Đạt', gender: 'Nam', dob: '1997-08-30', phone: '0955001122', email: 'dat.bt@bravo.com.vn', dept: 'dept-pmk', pos: 'pos-mkt-emp', salary: 17500000 },
        { id: 'emp-mkt-09', code: 'NV-2024-020', name: 'Nguyễn Khánh Hà', gender: 'Nữ', dob: '1994-12-12', phone: '0966112233', email: 'ha.nk@bravo.com.vn', dept: 'dept-pmk', pos: 'pos-mkt-emp', salary: 15500000 },
        { id: 'emp-mkt-10', code: 'NV-2024-021', name: 'Đặng Văn Phúc', gender: 'Nam', dob: '1993-02-15', phone: '0977223344', email: 'phuc.dv@bravo.com.vn', dept: 'dept-pmk', pos: 'pos-mkt-emp', salary: 15000000 },
        { id: 'emp-mkt-11', code: 'NV-2024-022', name: 'Trần Quỳnh Như', gender: 'Nữ', dob: '1998-06-20', phone: '0988334455', email: 'nhu.tq@bravo.com.vn', dept: 'dept-pmk', pos: 'pos-mkt-emp', salary: 12500000 },
        { id: 'emp-mkt-12', code: 'NV-2024-023', name: 'Phan Văn Hải', gender: 'Nam', dob: '1997-10-05', phone: '0911445566', email: 'hai.pv@bravo.com.vn', dept: 'dept-pmk', pos: 'pos-mkt-emp', salary: 12000000 },
        { id: 'emp-mkt-13', code: 'NV-2024-024', name: 'Lâm Bích Thủy', gender: 'Nữ', dob: '1995-03-31', phone: '0922556677', email: 'thuy.lb@bravo.com.vn', dept: 'dept-pmk', pos: 'pos-mkt-emp', salary: 16000000 },
        { id: 'emp-mkt-14', code: 'NV-2024-025', name: 'Đỗ Minh Đức', gender: 'Nam', dob: '1998-07-14', phone: '0933667788', email: 'duc.dm@bravo.com.vn', dept: 'dept-pmk', pos: 'pos-mkt-emp', salary: 12000000 },
        { id: 'emp-mkt-15', code: 'NV-2024-026', name: 'Ngô Thị Nga', gender: 'Nữ', dob: '1999-05-25', phone: '0944778899', email: 'nga.nt@bravo.com.vn', dept: 'dept-pmk', pos: 'pos-mkt-emp', salary: 11500000 },

        // PKD (17/20)
        { id: 'emp-kd-01', code: 'NV-2024-027', name: 'Phạm Quốc Tuấn', gender: 'Nam', dob: '1985-10-10', phone: '0911223344', email: 'tuan.pq@bravo.com.vn', dept: 'dept-kd', pos: 'pos-kd-mgr', salary: 40000000 },
        { id: 'emp-kd-02', code: 'NV-2024-028', name: 'Đặng Đình Hùng', gender: 'Nam', dob: '1989-04-05', phone: '0933445566', email: 'hung.dd@bravo.com.vn', dept: 'dept-kd', pos: 'pos-kd-lead', salary: 25000000 },
        { id: 'emp-kd-03', code: 'NV-2024-029', name: 'Nguyễn Văn Thanh', gender: 'Nam', dob: '1990-08-19', phone: '0977889900', email: 'thanh.nv@bravo.com.vn', dept: 'dept-kd', pos: 'pos-kd-lead', salary: 24000000 },
        { id: 'emp-kd-04', code: 'NV-2024-030', name: 'Trần Đức Thắng', gender: 'Nam', dob: '1993-01-25', phone: '0988990011', email: 'thang.td@bravo.com.vn', dept: 'dept-kd', pos: 'pos-kd-emp', salary: 18000000 },
        { id: 'emp-kd-05', code: 'NV-2024-031', name: 'Lê Thị Hải Yến', gender: 'Nữ', dob: '1994-06-30', phone: '0911002233', email: 'yen.lth@bravo.com.vn', dept: 'dept-kd', pos: 'pos-kd-emp', salary: 17500000 },
        { id: 'emp-kd-06', code: 'NV-2024-032', name: 'Võ Minh Nhật', gender: 'Nam', dob: '1995-09-12', phone: '0922113344', email: 'nhat.vm@bravo.com.vn', dept: 'dept-kd', pos: 'pos-kd-emp', salary: 17000000 },
        { id: 'emp-kd-07', code: 'NV-2024-033', name: 'Đỗ Thị Hương', gender: 'Nữ', dob: '1996-03-08', phone: '0933224455', email: 'huong.dt@bravo.com.vn', dept: 'dept-kd', pos: 'pos-kd-emp', salary: 16500000 },
        { id: 'emp-kd-08', code: 'NV-2024-034', name: 'Nguyễn Hoàng Long', gender: 'Nam', dob: '1992-11-20', phone: '0944335566', email: 'long.nh@bravo.com.vn', dept: 'dept-kd', pos: 'pos-kd-emp', salary: 18500000 },
        { id: 'emp-kd-09', code: 'NV-2024-035', name: 'Bùi Thị Tuyết', gender: 'Nữ', dob: '1997-07-07', phone: '0955446677', email: 'tuyet.bt@bravo.com.vn', dept: 'dept-kd', pos: 'pos-kd-emp', salary: 13000000 },
        { id: 'emp-kd-10', code: 'NV-2024-036', name: 'Trịnh Xuân Bách', gender: 'Nam', dob: '1998-05-14', phone: '0966557788', email: 'bach.tx@bravo.com.vn', dept: 'dept-kd', pos: 'pos-kd-emp', salary: 12500000 },
        { id: 'emp-kd-11', code: 'NV-2024-037', name: 'Phan Bảo Ngọc', gender: 'Nữ', dob: '1999-10-01', phone: '0977668899', email: 'ngoc.pb@bravo.com.vn', dept: 'dept-kd', pos: 'pos-kd-emp', salary: 12000000 },
        { id: 'emp-kd-12', code: 'NV-2024-038', name: 'Cao Văn Cường', gender: 'Nam', dob: '1994-02-28', phone: '0988779900', email: 'cuong.cv@bravo.com.vn', dept: 'dept-kd', pos: 'pos-kd-emp', salary: 17000000 },
        { id: 'emp-kd-13', code: 'NV-2024-039', name: 'Mai Thị Hồng', gender: 'Nữ', dob: '1996-08-16', phone: '0911889900', email: 'hong.mt@bravo.com.vn', dept: 'dept-kd', pos: 'pos-kd-emp', salary: 13000000 },
        { id: 'emp-kd-14', code: 'NV-2024-040', name: 'Hồ Văn Nam', gender: 'Nam', dob: '1991-12-03', phone: '0922990011', email: 'nam.hv@bravo.com.vn', dept: 'dept-kd', pos: 'pos-kd-emp', salary: 17500000 },
        { id: 'emp-kd-15', code: 'NV-2024-041', name: 'Đinh Thu Trang', gender: 'Nữ', dob: '1997-04-21', phone: '0933001122', email: 'trang.dt@bravo.com.vn', dept: 'dept-kd', pos: 'pos-kd-emp', salary: 12500000 },
        { id: 'emp-kd-16', code: 'NV-2024-042', name: 'Vũ Thành Đạt', gender: 'Nam', dob: '1998-09-09', phone: '0944112233', email: 'dat.vt@bravo.com.vn', dept: 'dept-kd', pos: 'pos-kd-emp', salary: 12000000 },
        { id: 'emp-kd-17', code: 'NV-2024-043', name: 'Nguyễn Thị Ngọc', gender: 'Nữ', dob: '1999-01-11', phone: '0955223344', email: 'ngoc.nt@bravo.com.vn', dept: 'dept-kd', pos: 'pos-kd-emp', salary: 16000000 },

        // GPTV (8/10)
        { id: 'emp-gptv-01', code: 'NV-2024-044', name: 'Hoàng Minh Trí', gender: 'Nam', dob: '1984-06-15', phone: '0966991122', email: 'tri.hm@bravo.com.vn', dept: 'dept-gptv', pos: 'pos-gptv-mgr', salary: 38000000 },
        { id: 'emp-gptv-02', code: 'NV-2024-045', name: 'Đào Bích Liên', gender: 'Nữ', dob: '1989-11-20', phone: '0977002233', email: 'lien.db@bravo.com.vn', dept: 'dept-gptv', pos: 'pos-gptv-lead', salary: 26000000 },
        { id: 'emp-gptv-03', code: 'NV-2024-046', name: 'Nguyễn Quang Huy', gender: 'Nam', dob: '1992-03-08', phone: '0988113344', email: 'huy.nq@bravo.com.vn', dept: 'dept-gptv', pos: 'pos-gptv-lead', salary: 25000000 },
        { id: 'emp-gptv-04', code: 'NV-2024-047', name: 'Lê Thu Hà', gender: 'Nữ', dob: '1994-08-14', phone: '0911224455', email: 'ha.lt@bravo.com.vn', dept: 'dept-gptv', pos: 'pos-gptv-emp', salary: 19000000 },
        { id: 'emp-gptv-05', code: 'NV-2024-048', name: 'Phạm Hồng Thái', gender: 'Nam', dob: '1993-01-09', phone: '0922335566', email: 'thai.ph@bravo.com.vn', dept: 'dept-gptv', pos: 'pos-gptv-emp', salary: 18500000 },
        { id: 'emp-gptv-06', code: 'NV-2024-049', name: 'Vũ Tuyết Nhung', gender: 'Nữ', dob: '1995-10-27', phone: '0933446677', email: 'nhung.vt@bravo.com.vn', dept: 'dept-gptv', pos: 'pos-gptv-emp', salary: 18000000 },
        { id: 'emp-gptv-07', code: 'NV-2024-050', name: 'Trịnh Quốc Tuấn', gender: 'Nam', dob: '1996-05-04', phone: '0944557788', email: 'tuan.tq@bravo.com.vn', dept: 'dept-gptv', pos: 'pos-gptv-emp', salary: 17500000 },
        { id: 'emp-gptv-08', code: 'NV-2024-051', name: 'Bùi Thị Dung', gender: 'Nữ', dob: '1998-12-18', phone: '0955668899', email: 'dung.bt@bravo.com.vn', dept: 'dept-gptv', pos: 'pos-gptv-emp', salary: 13500000 },

        // Khối KTTK (2/2)
        { id: 'emp-kttk-01', code: 'NV-2024-052', name: 'Trịnh Đình Dũng', gender: 'Nam', dob: '1981-02-14', phone: '0966778899', email: 'dung.td@bravo.com.vn', dept: 'dept-kttk', pos: 'pos-kttk-dir', salary: 45000000 },
        { id: 'emp-kttk-02', code: 'NV-2024-053', name: 'Nguyễn Hoàng Minh', gender: 'Nam', dob: '1986-07-22', phone: '0977889900', email: 'minh.nh@bravo.com.vn', dept: 'dept-kttk', pos: 'pos-kttk-dep', salary: 35000000 },

        // KTTK 1 (12/12)
        { id: 'emp-kttk1-01', code: 'NV-2024-054', name: 'Nguyễn Văn Hùng', gender: 'Nam', dob: '1987-10-01', phone: '0988990011', email: 'hung.nv@bravo.com.vn', dept: 'dept-kttk-1', pos: 'pos-kttk1-mgr', salary: 30000000 },
        { id: 'emp-kttk1-02', code: 'NV-2024-055', name: 'Lê Đình Toàn', gender: 'Nam', dob: '1991-04-18', phone: '0911001122', email: 'toan.ld@bravo.com.vn', dept: 'dept-kttk-1', pos: 'pos-kttk1-lead', salary: 22000000 },
        { id: 'emp-kttk1-03', code: 'NV-2024-056', name: 'Phạm Thị Lan', gender: 'Nữ', dob: '1993-09-09', phone: '0922112233', email: 'lan.pt@bravo.com.vn', dept: 'dept-kttk-1', pos: 'pos-kttk1-lead', salary: 21500000 },
        { id: 'emp-kttk1-04', code: 'NV-2024-057', name: 'Vũ Quốc Khánh', gender: 'Nam', dob: '1994-12-03', phone: '0933223344', email: 'khanh.vq@bravo.com.vn', dept: 'dept-kttk-1', pos: 'pos-kttk1-emp', salary: 17000000 },
        { id: 'emp-kttk1-05', code: 'NV-2024-058', name: 'Hoàng Thị Hoa', gender: 'Nữ', dob: '1995-05-15', phone: '0944334455', email: 'hoa.ht@bravo.com.vn', dept: 'dept-kttk-1', pos: 'pos-kttk1-emp', salary: 16500000 },
        { id: 'emp-kttk1-06', code: 'NV-2024-059', name: 'Trịnh Văn Long', gender: 'Nam', dob: '1996-08-21', phone: '0955445566', email: 'long.tv@bravo.com.vn', dept: 'dept-kttk-1', pos: 'pos-kttk1-emp', salary: 16000000 },
        { id: 'emp-kttk1-07', code: 'NV-2024-060', name: 'Bùi Đức Anh', gender: 'Nam', dob: '1994-01-11', phone: '0966556677', email: 'anh.bd@bravo.com.vn', dept: 'dept-kttk-1', pos: 'pos-kttk1-emp', salary: 16500000 },
        { id: 'emp-kttk1-08', code: 'NV-2024-061', name: 'Cao Thu Hà', gender: 'Nữ', dob: '1997-03-30', phone: '0977667788', email: 'ha.ct@bravo.com.vn', dept: 'dept-kttk-1', pos: 'pos-kttk1-emp', salary: 15500000 },
        { id: 'emp-kttk1-09', code: 'NV-2024-062', name: 'Đặng Văn Tiến', gender: 'Nam', dob: '1998-07-07', phone: '0988778899', email: 'tien.dv@bravo.com.vn', dept: 'dept-kttk-1', pos: 'pos-kttk1-emp', salary: 15000000 },
        { id: 'emp-kttk1-10', code: 'NV-2024-063', name: 'Mai Hoàng Việt', gender: 'Nam', dob: '1999-11-25', phone: '0911889900', email: 'viet.mh@bravo.com.vn', dept: 'dept-kttk-1', pos: 'pos-kttk1-emp', salary: 12500000 },
        { id: 'emp-kttk1-11', code: 'NV-2024-064', name: 'Hồ Mỹ Duyên', gender: 'Nữ', dob: '1997-02-14', phone: '0922990011', email: 'duyen.hm@bravo.com.vn', dept: 'dept-kttk-1', pos: 'pos-kttk1-emp', salary: 12000000 },
        { id: 'emp-kttk1-12', code: 'NV-2024-065', name: 'Đinh Thành Công', gender: 'Nam', dob: '1998-10-08', phone: '0933001122', email: 'cong.dt@bravo.com.vn', dept: 'dept-kttk-1', pos: 'pos-kttk1-emp', salary: 12000000 },

        // KTTK 2 (12/15)
        { id: 'emp-kttk2-01', code: 'NV-2024-066', name: 'Đặng Việt Khoa', gender: 'Nam', dob: '1986-03-12', phone: '0944112233', email: 'khoa.dv@bravo.com.vn', dept: 'dept-kttk-2', pos: 'pos-kttk2-mgr', salary: 31000000 },
        { id: 'emp-kttk2-02', code: 'NV-2024-067', name: 'Vũ Hải Long', gender: 'Nam', dob: '1990-09-05', phone: '0955223344', email: 'long.vh@bravo.com.vn', dept: 'dept-kttk-2', pos: 'pos-kttk2-lead', salary: 22500000 },
        { id: 'emp-kttk2-03', code: 'NV-2024-068', name: 'Nguyễn Bích Thảo', gender: 'Nữ', dob: '1992-06-20', phone: '0966334455', email: 'thao.nb@bravo.com.vn', dept: 'dept-kttk-2', pos: 'pos-kttk2-lead', salary: 22000000 },
        { id: 'emp-kttk2-04', code: 'NV-2024-069', name: 'Phạm Minh Tuấn', gender: 'Nam', dob: '1994-04-11', phone: '0977445566', email: 'tuan.pm@bravo.com.vn', dept: 'dept-kttk-2', pos: 'pos-kttk2-emp', salary: 17000000 },
        { id: 'emp-kttk2-05', code: 'NV-2024-070', name: 'Lê Thanh Bình', gender: 'Nam', dob: '1993-11-28', phone: '0988556677', email: 'binh.lt@bravo.com.vn', dept: 'dept-kttk-2', pos: 'pos-kttk2-emp', salary: 16500000 },
        { id: 'emp-kttk2-06', code: 'NV-2024-071', name: 'Trần Bích Ngọc', gender: 'Nữ', dob: '1995-08-03', phone: '0911667788', email: 'ngoc.tb@bravo.com.vn', dept: 'dept-kttk-2', pos: 'pos-kttk2-emp', salary: 16000000 },
        { id: 'emp-kttk2-07', code: 'NV-2024-072', name: 'Hoàng Trọng Tú', gender: 'Nam', dob: '1996-01-19', phone: '0922778899', email: 'tu.ht@bravo.com.vn', dept: 'dept-kttk-2', pos: 'pos-kttk2-emp', salary: 16500000 },
        { id: 'emp-kttk2-08', code: 'NV-2024-073', name: 'Bùi Thị Loan', gender: 'Nữ', dob: '1997-07-25', phone: '0933889900', email: 'loan.bt@bravo.com.vn', dept: 'dept-kttk-2', pos: 'pos-kttk2-emp', salary: 15500000 },
        { id: 'emp-kttk2-09', code: 'NV-2024-074', name: 'Trịnh Hữu Thắng', gender: 'Nam', dob: '1998-05-30', phone: '0944990011', email: 'thang.th@bravo.com.vn', dept: 'dept-kttk-2', pos: 'pos-kttk2-emp', salary: 15000000 },
        { id: 'emp-kttk2-10', code: 'NV-2024-075', name: 'Cao Thị Trang', gender: 'Nữ', dob: '1999-02-17', phone: '0955001122', email: 'trang.ct@bravo.com.vn', dept: 'dept-kttk-2', pos: 'pos-kttk2-emp', salary: 12500000 },
        { id: 'emp-kttk2-11', code: 'NV-2024-076', name: 'Đỗ Văn Thành', gender: 'Nam', dob: '1998-09-08', phone: '0966112233', email: 'thanh.dv@bravo.com.vn', dept: 'dept-kttk-2', pos: 'pos-kttk2-emp', salary: 12000000 },
        { id: 'emp-kttk2-12', code: 'NV-2024-077', name: 'Mai Khánh Linh', gender: 'Nữ', dob: '1999-12-01', phone: '0977223344', email: 'linh.mk@bravo.com.vn', dept: 'dept-kttk-2', pos: 'pos-kttk2-emp', salary: 12000000 },

        // PTNV (6/6)
        { id: 'emp-ptnv-01', code: 'NV-2024-078', name: 'Mai Văn Vinh', gender: 'Nam', dob: '1987-07-07', phone: '0988334455', email: 'vinh.mv@bravo.com.vn', dept: 'dept-ptnv', pos: 'pos-ptnv-mgr', salary: 33000000 },
        { id: 'emp-ptnv-02', code: 'NV-2024-079', name: 'Đào Thị Thắm', gender: 'Nữ', dob: '1992-02-14', phone: '0911445566', email: 'tham.dt@bravo.com.vn', dept: 'dept-ptnv', pos: 'pos-ptnv-lead', salary: 23500000 },
        { id: 'emp-ptnv-03', code: 'NV-2024-080', name: 'Nguyễn Quốc Huy', gender: 'Nam', dob: '1994-05-22', phone: '0922556677', email: 'huy.nq2@bravo.com.vn', dept: 'dept-ptnv', pos: 'pos-ptnv-emp', salary: 18500000 },
        { id: 'emp-ptnv-04', code: 'NV-2024-081', name: 'Lê Thị Thu', gender: 'Nữ', dob: '1995-10-10', phone: '0933667788', email: 'thu.lt@bravo.com.vn', dept: 'dept-ptnv', pos: 'pos-ptnv-emp', salary: 17500000 },
        { id: 'emp-ptnv-05', code: 'NV-2024-082', name: 'Phạm Đức Anh', gender: 'Nam', dob: '1996-03-31', phone: '0944778899', email: 'anh.pd@bravo.com.vn', dept: 'dept-ptnv', pos: 'pos-ptnv-emp', salary: 17000000 },
        { id: 'emp-ptnv-06', code: 'NV-2024-083', name: 'Vũ Thị Hằng', gender: 'Nữ', dob: '1998-08-19', phone: '0955889900', email: 'hang.vt@bravo.com.vn', dept: 'dept-ptnv', pos: 'pos-ptnv-emp', salary: 13000000 },

        // PTSP (11/14)
        { id: 'emp-ptsp-01', code: 'NV-2024-084', name: 'Trịnh Thái Sơn', gender: 'Nam', dob: '1986-08-08', phone: '0966990011', email: 'son.tt@bravo.com.vn', dept: 'dept-ptsp', pos: 'pos-ptsp-mgr', salary: 36000000 },
        { id: 'emp-ptsp-02', code: 'NV-2024-085', name: 'Nguyễn Hữu Đạt', gender: 'Nam', dob: '1990-01-19', phone: '0977001122', email: 'dat.nh@bravo.com.vn', dept: 'dept-ptsp', pos: 'pos-ptsp-lead', salary: 25000000 },
        { id: 'emp-ptsp-03', code: 'NV-2024-086', name: 'Lê Minh Quân', gender: 'Nam', dob: '1992-07-27', phone: '0988112233', email: 'quan.lm@bravo.com.vn', dept: 'dept-ptsp', pos: 'pos-ptsp-emp', salary: 19500000 },
        { id: 'emp-ptsp-04', code: 'NV-2024-087', name: 'Đặng Thị Bích', gender: 'Nữ', dob: '1995-10-15', phone: '0911223344', email: 'bich.dt@bravo.com.vn', dept: 'dept-ptsp', pos: 'pos-ptsp-emp', salary: 18500000 },
        { id: 'emp-ptsp-05', code: 'NV-2024-088', name: 'Phạm Đức Duy', gender: 'Nam', dob: '1994-04-03', phone: '0922334455', email: 'duy.pd@bravo.com.vn', dept: 'dept-ptsp', pos: 'pos-ptsp-emp', salary: 20000000 },
        { id: 'emp-ptsp-06', code: 'NV-2024-089', name: 'Vũ Khánh Linh', gender: 'Nữ', dob: '1996-12-01', phone: '0933445566', email: 'linh.vk@bravo.com.vn', dept: 'dept-ptsp', pos: 'pos-ptsp-emp', salary: 18000000 },
        { id: 'emp-ptsp-07', code: 'NV-2024-090', name: 'Hoàng Văn Tùng', gender: 'Nam', dob: '1993-09-09', phone: '0944556677', email: 'tung.hv@bravo.com.vn', dept: 'dept-ptsp', pos: 'pos-ptsp-emp', salary: 17500000 },
        { id: 'emp-ptsp-08', code: 'NV-2024-091', name: 'Đỗ Phương Anh', gender: 'Nữ', dob: '1997-03-21', phone: '0955667788', email: 'anh.dp@bravo.com.vn', dept: 'dept-ptsp', pos: 'pos-ptsp-emp', salary: 18500000 },
        { id: 'emp-ptsp-09', code: 'NV-2024-092', name: 'Bùi Văn Hải', gender: 'Nam', dob: '1998-11-11', phone: '0966778899', email: 'hai.bv@bravo.com.vn', dept: 'dept-ptsp', pos: 'pos-ptsp-emp', salary: 13000000 },
        { id: 'emp-ptsp-10', code: 'NV-2024-093', name: 'Trịnh Thị Mai', gender: 'Nữ', dob: '1996-06-06', phone: '0977889900', email: 'mai.tt@bravo.com.vn', dept: 'dept-ptsp', pos: 'pos-ptsp-emp', salary: 17000000 },
        { id: 'emp-ptsp-11', code: 'NV-2024-094', name: 'Cao Đức Nhật', gender: 'Nam', dob: '1999-01-29', phone: '0988990011', email: 'nhat.cd@bravo.com.vn', dept: 'dept-ptsp', pos: 'pos-ptsp-emp', salary: 12500000 },

        // KCN (2/2)
        { id: 'emp-kcn-01', code: 'NV-2024-095', name: 'Lê Hoàng Nam', gender: 'Nam', dob: '1988-05-15', phone: '0911345678', email: 'nam.le@bravo.com.vn', dept: 'dept-kcn', pos: 'pos-kcn-dir', salary: 42000000 },
        { id: 'emp-kcn-02', code: 'NV-2024-096', name: 'Vũ Văn Khiêm', gender: 'Nam', dob: '1990-02-20', phone: '0922110022', email: 'khiem.vv@bravo.com.vn', dept: 'dept-kcn', pos: 'pos-kcn-dep', salary: 32000000 },

        // CLOUD (7/10)
        { id: 'emp-cloud-01', code: 'NV-2024-097', name: 'Hoàng Trọng Nghĩa', gender: 'Nam', dob: '1989-10-29', phone: '0933221100', email: 'nghia.ht@bravo.com.vn', dept: 'dept-cloud', pos: 'pos-cloud-mgr', salary: 34000000 },
        { id: 'emp-cloud-02', code: 'NV-2024-098', name: 'Trần Tuấn Anh', gender: 'Nam', dob: '1992-07-04', phone: '0944332211', email: 'anh.tt@bravo.com.vn', dept: 'dept-cloud', pos: 'pos-cloud-lead', salary: 24000000 },
        { id: 'emp-cloud-03', code: 'NV-2024-099', name: 'Nguyễn Thanh Tùng', gender: 'Nam', dob: '1994-03-24', phone: '0955443322', email: 'tung.nt@bravo.com.vn', dept: 'dept-cloud', pos: 'pos-cloud-emp', salary: 19000000 },
        { id: 'emp-cloud-04', code: 'NV-2024-100', name: 'Đặng Việt Dũng', gender: 'Nam', dob: '1995-11-07', phone: '0966554433', email: 'dung.dv@bravo.com.vn', dept: 'dept-cloud', pos: 'pos-cloud-emp', salary: 18500000 },
        { id: 'emp-cloud-05', code: 'NV-2024-101', name: 'Bùi Quang Huy', gender: 'Nam', dob: '1996-05-13', phone: '0977665544', email: 'huy.bq@bravo.com.vn', dept: 'dept-cloud', pos: 'pos-cloud-emp', salary: 18000000 },
        { id: 'emp-cloud-06', code: 'NV-2024-102', name: 'Cao Đức Tài', gender: 'Nam', dob: '1998-12-20', phone: '0988776655', email: 'tai.cd@bravo.com.vn', dept: 'dept-cloud', pos: 'pos-cloud-emp', salary: 13000000 },
        { id: 'emp-cloud-07', code: 'NV-2024-103', name: 'Trịnh Hoàng Nam', gender: 'Nam', dob: '1999-06-11', phone: '0911887766', email: 'nam.th@bravo.com.vn', dept: 'dept-cloud', pos: 'pos-cloud-emp', salary: 12500000 },

        // PKT (9/12)
        { id: 'emp-kt-01', code: 'NV-2024-104', name: 'Phạm Thị Mai', gender: 'Nữ', dob: '1991-08-22', phone: '0922998877', email: 'mai.pt@bravo.com.vn', dept: 'dept-kt', pos: 'pos-kt-mgr', salary: 28000000 },
        { id: 'emp-kt-02', code: 'NV-2024-105', name: 'Phan Thị Loan', gender: 'Nữ', dob: '1993-09-02', phone: '0933009988', email: 'loan.pt@bravo.com.vn', dept: 'dept-kt', pos: 'pos-kt-lead', salary: 20000000 },
        { id: 'emp-kt-03', code: 'NV-2024-106', name: 'Hồ Bích Ngọc', gender: 'Nữ', dob: '1995-04-15', phone: '0944110099', email: 'ngoc.hb2@bravo.com.vn', dept: 'dept-kt', pos: 'pos-kt-emp', salary: 15500000 },
        { id: 'emp-kt-04', code: 'NV-2024-107', name: 'Lê Cẩm Tú', gender: 'Nữ', dob: '1997-03-05', phone: '0955221100', email: 'tu.lc@bravo.com.vn', dept: 'dept-kt', pos: 'pos-kt-emp', salary: 15000000 },
        { id: 'emp-kt-05', code: 'NV-2024-108', name: 'Bùi Thị Hằng', gender: 'Nữ', dob: '1998-08-14', phone: '0966332211', email: 'hang.bt@bravo.com.vn', dept: 'dept-kt', pos: 'pos-kt-emp', salary: 14500000 },
        { id: 'emp-kt-06', code: 'NV-2024-109', name: 'Trần Văn Nhật', gender: 'Nam', dob: '1996-11-11', phone: '0977443322', email: 'nhat.tv@bravo.com.vn', dept: 'dept-kt', pos: 'pos-kt-emp', salary: 15000000 },
        { id: 'emp-kt-07', code: 'NV-2024-110', name: 'Đỗ Thị Hương', gender: 'Nữ', dob: '1997-05-05', phone: '0988554433', email: 'huong.dt2@bravo.com.vn', dept: 'dept-kt', pos: 'pos-kt-emp', salary: 11500000 },
        { id: 'emp-kt-08', code: 'NV-2024-111', name: 'Nguyễn Văn Minh', gender: 'Nam', dob: '1999-01-01', phone: '0911665544', email: 'minh.nv@bravo.com.vn', dept: 'dept-kt', pos: 'pos-kt-emp', salary: 11000000 },
        { id: 'emp-kt-09', code: 'NV-2024-112', name: 'Lâm Bích Ngọc', gender: 'Nữ', dob: '1998-07-23', phone: '0922776655', email: 'ngoc.lb@bravo.com.vn', dept: 'dept-kt', pos: 'pos-kt-emp', salary: 11000000 },

        // PBH (8/8)
        { id: 'emp-bh-01', code: 'NV-2024-113', name: 'Nguyễn Mạnh Cường', gender: 'Nam', dob: '1989-02-28', phone: '0933887766', email: 'cuong.nm@bravo.com.vn', dept: 'dept-bh', pos: 'pos-bh-mgr', salary: 27000000 },
        { id: 'emp-bh-02', code: 'NV-2024-114', name: 'Trần Thu Hồng', gender: 'Nữ', dob: '1993-08-16', phone: '0944998877', email: 'hong.tt2@bravo.com.vn', dept: 'dept-bh', pos: 'pos-bh-lead', salary: 19000000 },
        { id: 'emp-bh-03', code: 'NV-2024-115', name: 'Lê Quốc Nam', gender: 'Nam', dob: '1992-12-03', phone: '0955009988', email: 'nam.lq@bravo.com.vn', dept: 'dept-bh', pos: 'pos-bh-emp', salary: 15000000 },
        { id: 'emp-bh-04', code: 'NV-2024-116', name: 'Đinh Thu Trang', gender: 'Nữ', dob: '1995-04-21', phone: '0966110099', email: 'trang.dt2@bravo.com.vn', dept: 'dept-bh', pos: 'pos-bh-emp', salary: 14500000 },
        { id: 'emp-bh-05', code: 'NV-2024-117', name: 'Vũ Thành Đạt', gender: 'Nam', dob: '1996-09-09', phone: '0977221100', email: 'dat.vt2@bravo.com.vn', dept: 'dept-bh', pos: 'pos-bh-emp', salary: 14000000 },
        { id: 'emp-bh-06', code: 'NV-2024-118', name: 'Nguyễn Thị Ngọc', gender: 'Nữ', dob: '1997-01-11', phone: '0988332211', email: 'ngoc.nt2@bravo.com.vn', dept: 'dept-bh', pos: 'pos-bh-emp', salary: 14000000 },
        { id: 'emp-bh-07', code: 'NV-2024-119', name: 'Trịnh Văn Đức', gender: 'Nam', dob: '1998-06-14', phone: '0911443322', email: 'duc.tv@bravo.com.vn', dept: 'dept-bh', pos: 'pos-bh-emp', salary: 11000000 },
        { id: 'emp-bh-08', code: 'NV-2024-120', name: 'Bùi Thị Hà', gender: 'Nữ', dob: '1999-03-30', phone: '0922554433', email: 'ha.bt@bravo.com.vn', dept: 'dept-bh', pos: 'pos-bh-emp', salary: 11000000 }
    ];

    for (const [index, e] of employeeSeedSpecs.entries()) {
        const existing = await queryOne('SELECT employee_id FROM Employee WHERE employee_id = ?', [e.id]);
        if (!existing) {
            const dobTs = new Date(e.dob).getTime();
            const joinTs = new Date('2023-01-15').getTime();
            const citizenId = `001${String(240000000 + index).padStart(9, '0')}`;
            await run(`INSERT INTO Employee (employee_id, created_date, last_modified_date, employee_code, full_name, gender, date_of_birth, citizen_id, citizen_issue_date, citizen_issue_place, phone, email, address, permanent_address, department_id, position_id, join_date, official_date, employment_status, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Cục Cảnh sát QLHC về Trật tự xã hội', ?, ?, 'Hà Nội', 'Hà Nội', ?, ?, ?, ?, 'WORKING', 1)`,
                [e.id, now, now, e.code, e.name, e.gender, dobTs, citizenId, dobTs + 18 * 365 * 86400000, e.phone, e.email, e.dept, e.pos, joinTs, joinTs + 60 * 86400000]);
        }
    }

    // Update Department Managers
    const deptManagers = [
        { dept_id: 'dept-bgd', mgr_id: 'emp-bgd-01' },
        { dept_id: 'dept-hr', mgr_id: 'emp-hr-01' },
        { dept_id: 'dept-pmk', mgr_id: 'emp-mkt-01' },
        { dept_id: 'dept-kd', mgr_id: 'emp-kd-01' },
        { dept_id: 'dept-gptv', mgr_id: 'emp-gptv-01' },
        { dept_id: 'dept-kttk', mgr_id: 'emp-kttk-01' },
        { dept_id: 'dept-kttk-1', mgr_id: 'emp-kttk1-01' },
        { dept_id: 'dept-kttk-2', mgr_id: 'emp-kttk2-01' },
        { dept_id: 'dept-ptnv', mgr_id: 'emp-ptnv-01' },
        { dept_id: 'dept-ptsp', mgr_id: 'emp-ptsp-01' },
        { dept_id: 'dept-kcn', mgr_id: 'emp-kcn-01' },
        { dept_id: 'dept-cloud', mgr_id: 'emp-cloud-01' },
        { dept_id: 'dept-kt', mgr_id: 'emp-kt-01' },
        { dept_id: 'dept-bh', mgr_id: 'emp-bh-01' }
    ];

    for (const dm of deptManagers) {
        await run(`UPDATE Department SET manager_id = ?, last_modified_date = ? WHERE department_id = ? AND manager_id IS NULL`, [dm.mgr_id, now, dm.dept_id]);
    }

    // Update Employee Levels & Direct Managers across all 14 departments
    const explicitEmpLevels = [
        { id: 'emp-bgd-01', level: 'Ban Giám Đốc', mgr: null },
        { id: 'emp-bgd-02', level: 'Ban Giám Đốc', mgr: 'emp-bgd-01' },
        { id: 'emp-bgd-03', level: 'Ban Giám Đốc', mgr: 'emp-bgd-01' },

        { id: 'emp-hr-01', level: 'Trưởng phòng', mgr: 'emp-bgd-01' },
        { id: 'emp-hr-02', level: 'Trưởng nhóm', mgr: 'emp-hr-01' },
        { id: 'emp-hr-04', level: 'Trưởng nhóm', mgr: 'emp-hr-01' },
        { id: 'emp-hr-03', level: 'Nhân viên', mgr: 'emp-hr-02' },
        { id: 'emp-hr-05', level: 'Nhân viên', mgr: 'emp-hr-04' },
        { id: 'emp-hr-06', level: 'Nhân viên', mgr: 'emp-hr-04' },

        { id: 'emp-mkt-01', level: 'Trưởng phòng', mgr: 'emp-bgd-02' },
        { id: 'emp-mkt-02', level: 'Trưởng nhóm', mgr: 'emp-mkt-01' },
        { id: 'emp-mkt-03', level: 'Trưởng nhóm', mgr: 'emp-mkt-01' },
        { id: 'emp-mkt-04', level: 'Nhân viên', mgr: 'emp-mkt-02' },
        { id: 'emp-mkt-05', level: 'Nhân viên', mgr: 'emp-mkt-03' },

        { id: 'emp-kd-01', level: 'Trưởng phòng', mgr: 'emp-bgd-02' },
        { id: 'emp-kd-02', level: 'Trưởng nhóm', mgr: 'emp-kd-01' },
        { id: 'emp-kd-03', level: 'Trưởng nhóm', mgr: 'emp-kd-01' },
        { id: 'emp-kd-04', level: 'Nhân viên', mgr: 'emp-kd-02' },
        { id: 'emp-kd-05', level: 'Nhân viên', mgr: 'emp-kd-03' },

        { id: 'emp-gptv-01', level: 'Trưởng phòng', mgr: 'emp-bgd-03' },
        { id: 'emp-gptv-02', level: 'Trưởng nhóm', mgr: 'emp-gptv-01' },
        { id: 'emp-gptv-03', level: 'Trưởng nhóm', mgr: 'emp-gptv-01' },
        { id: 'emp-gptv-04', level: 'Nhân viên', mgr: 'emp-gptv-02' },

        { id: 'emp-kttk-01', level: 'Trưởng phòng', mgr: 'emp-bgd-01' },
        { id: 'emp-kttk-02', level: 'Trưởng nhóm', mgr: 'emp-kttk-01' },

        { id: 'emp-kttk1-01', level: 'Trưởng phòng', mgr: 'emp-kttk-01' },
        { id: 'emp-kttk1-02', level: 'Trưởng nhóm', mgr: 'emp-kttk1-01' },
        { id: 'emp-kttk1-03', level: 'Trưởng nhóm', mgr: 'emp-kttk1-01' },
        { id: 'emp-kttk1-04', level: 'Nhân viên', mgr: 'emp-kttk1-02' },

        { id: 'emp-kttk2-01', level: 'Trưởng phòng', mgr: 'emp-kttk-01' },
        { id: 'emp-kttk2-02', level: 'Trưởng nhóm', mgr: 'emp-kttk2-01' },
        { id: 'emp-kttk2-03', level: 'Trưởng nhóm', mgr: 'emp-kttk2-01' },
        { id: 'emp-kttk2-04', level: 'Nhân viên', mgr: 'emp-kttk2-02' },

        { id: 'emp-ptnv-01', level: 'Trưởng phòng', mgr: 'emp-bgd-03' },
        { id: 'emp-ptnv-02', level: 'Trưởng nhóm', mgr: 'emp-ptnv-01' },
        { id: 'emp-ptnv-03', level: 'Nhân viên', mgr: 'emp-ptnv-02' },
        { id: 'emp-ptnv-04', level: 'Nhân viên', mgr: 'emp-ptnv-02' },

        { id: 'emp-ptsp-01', level: 'Trưởng phòng', mgr: 'emp-bgd-03' },
        { id: 'emp-ptsp-02', level: 'Trưởng nhóm', mgr: 'emp-ptsp-01' },
        { id: 'emp-ptsp-03', level: 'Nhân viên', mgr: 'emp-ptsp-02' },
        { id: 'emp-ptsp-04', level: 'Nhân viên', mgr: 'emp-ptsp-02' },

        { id: 'emp-kcn-01', level: 'Trưởng phòng', mgr: 'emp-bgd-01' },
        { id: 'emp-kcn-02', level: 'Trưởng nhóm', mgr: 'emp-kcn-01' },

        { id: 'emp-cloud-01', level: 'Trưởng phòng', mgr: 'emp-kcn-01' },
        { id: 'emp-cloud-02', level: 'Trưởng nhóm', mgr: 'emp-cloud-01' },
        { id: 'emp-cloud-03', level: 'Nhân viên', mgr: 'emp-cloud-02' },
        { id: 'emp-cloud-04', level: 'Nhân viên', mgr: 'emp-cloud-02' },

        { id: 'emp-kt-01', level: 'Trưởng phòng', mgr: 'emp-kcn-01' },
        { id: 'emp-kt-02', level: 'Trưởng nhóm', mgr: 'emp-kt-01' },
        { id: 'emp-kt-03', level: 'Nhân viên', mgr: 'emp-kt-02' },
        { id: 'emp-kt-04', level: 'Nhân viên', mgr: 'emp-kt-02' },

        { id: 'emp-bh-01', level: 'Trưởng phòng', mgr: 'emp-kd-01' },
        { id: 'emp-bh-02', level: 'Trưởng nhóm', mgr: 'emp-bh-01' },
        { id: 'emp-bh-03', level: 'Nhân viên', mgr: 'emp-bh-02' },
        { id: 'emp-bh-04', level: 'Nhân viên', mgr: 'emp-bh-02' }
    ];

    for (const spec of explicitEmpLevels) {
        await run(`UPDATE Employee SET level = ?, manager_id = ? WHERE employee_id = ?`, [spec.level, spec.mgr, spec.id]);
    }

    // =========================================================================
    // 5. USERS (Tài khoản Đăng nhập mẫu chuẩn phân quyền RBAC)
    // =========================================================================
    const users = [
        { user_id: 'usr-nhung', username: 'admin', full_name: 'Nguyễn Hồng Nhung', email: 'hongnhung188888@gmail.com', phone: '0988666888', role_id: 'role-admin', department_id: 'dept-hr', employee_id: null },
        // NHUNGNH là ADMIN - không được gán phòng ban (department_id = null) và không có employee_id theo đúng yêu cầu nghiệp vụ
        { user_id: 'usr-nhung-nh', username: 'NHUNGNH', full_name: 'Nguyễn Hồng Nhung', email: 'hongnhung188888@gmail.com', phone: '0988666888', role_id: 'role-admin', department_id: null, employee_id: null },
        { user_id: 'usr-ceo', username: 'ceo', full_name: 'Bùi Xuân Thức', email: 'ceo@bravo.com.vn', phone: '0988111222', role_id: 'role-ceo', department_id: 'dept-bgd', employee_id: 'emp-bgd-01' },
        { user_id: 'usr-mgr-kd', username: 'mgr_kd', full_name: 'Phạm Quốc Tuấn', email: 'tuan.pq@bravo.com.vn', phone: '0977222333', role_id: 'role-manager', department_id: 'dept-kd', employee_id: 'emp-kd-01' },
        { user_id: 'usr-emp-kd', username: 'emp_kd', full_name: 'Đặng Đình Hùng', email: 'hung.dd@bravo.com.vn', phone: '0933445566', role_id: 'role-employee', department_id: 'dept-kd', employee_id: 'emp-kd-02' },
        { user_id: 'usr-ha', username: 'HANT', full_name: 'Nguyễn Thùy Linh', email: 'linh.nt@bravo.com.vn', phone: '0966123456', role_id: 'role-hr', department_id: 'dept-hr', employee_id: 'emp-hr-02' },

        // --- Tài khoản demo bổ sung theo mục 21 của yêu cầu RBAC ---
        { user_id: 'usr-sonnd', username: 'SONND', full_name: 'Phạm Thị Thanh Vân', email: 'sonnd@bravo.com.vn', phone: '0911000001', role_id: 'role-ceo', department_id: 'dept-bgd', employee_id: 'emp-bgd-02' },
        { user_id: 'usr-dungnx', username: 'DUNGNX', full_name: 'Lê Hoàng Nam', email: 'dungnx@bravo.com.vn', phone: '0911000002', role_id: 'role-khoi', department_id: 'dept-kcn', employee_id: 'emp-kcn-01' },
        { user_id: 'usr-locdd', username: 'LOCDD', full_name: 'Đỗ Thị Thu Trang', email: 'locdd@bravo.com.vn', phone: '0911000003', role_id: 'role-manager', department_id: 'dept-pmk', employee_id: 'emp-mkt-01' },
        { user_id: 'usr-quynhnn', username: 'QUYNHNN', full_name: 'Trần Thị Thu Hà', email: 'quynhnn@bravo.com.vn', phone: '0911000004', role_id: 'role-hr', department_id: 'dept-hr', employee_id: 'emp-hr-01' },
        { user_id: 'usr-haptt', username: 'HAPTT', full_name: 'Hoàng Bích Ngọc', email: 'haptt@bravo.com.vn', phone: '0911000005', role_id: 'role-hr', department_id: 'dept-hr', employee_id: 'emp-hr-03' },
        { user_id: 'usr-tiennd', username: 'TIENND', full_name: 'Lê Minh Quân', email: 'tiennd@bravo.com.vn', phone: '0911000006', role_id: 'role-employee', department_id: 'dept-ptsp', employee_id: 'emp-ptsp-03' }
    ];

    for (const u of users) {
        const existing = await queryOne('SELECT user_id FROM User WHERE username = ?', [u.username]);
        if (!existing) {
            await run(`INSERT INTO User (user_id, username, password_hash, full_name, email, phone, role_id, department_id, employee_id, created_date, last_modified_date, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
                [u.user_id, u.username, passwordHash, u.full_name, u.email, u.phone, u.role_id, u.department_id, u.employee_id || null, now, now]);
        } else {
            await run(`UPDATE User SET role_id = ?, department_id = ?, employee_id = ?, password_hash = ?, full_name = ?, last_modified_date = ? WHERE username = ?`,
                [u.role_id, u.department_id, u.employee_id || null, passwordHash, u.full_name, now, u.username]);
        }
    }

    // =========================================================================
    // 6. EMPLOYEE CONTRACTS (Hợp đồng lao động)
    // =========================================================================
    for (let i = 0; i < employeeSeedSpecs.length; i++) {
        const e = employeeSeedSpecs[i];
        const cid = `contract-${e.id}`;
        const existing = await queryOne('SELECT contract_id FROM EmployeeContract WHERE contract_id = ?', [cid]);
        if (!existing) {
            const cno = `HĐLĐ/2026/${(i + 1).toString().padStart(4, '0')}`;
            const signDate = new Date('2026-01-15').getTime();
            const ctype = i % 3 === 0 ? 'HĐLĐ Không xác định thời hạn' : (i % 3 === 1 ? 'HĐLĐ Xác định thời hạn 3 năm' : 'HĐLĐ Xác định thời hạn 1 năm');
            const endDate = ctype === 'HĐLĐ Không xác định thời hạn'
                ? null
                : new Date(ctype.includes('3 năm') ? '2029-01-14' : '2027-01-14').getTime();
            await run(`INSERT INTO EmployeeContract (contract_id, created_date, last_modified_date, contract_no, employee_id, contract_type, sign_date, start_date, end_date, salary, status, note)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 'Hợp đồng lao động chính thức ký kết theo đúng quy định bộ luật lao động')`,
                [cid, now, now, cno, e.id, ctype, signDate, signDate, endDate, e.salary]);
        }
    }

    // =========================================================================
    // 6B. QUÁ TRÌNH CÔNG TÁC (WorkHistory) - bổ sung cho các nhân viên đã thăng chức
    // =========================================================================
    // Những người hiện đang giữ vị trí "Trưởng Nhóm" (lead) trong seed - khởi điểm là Nhân viên (emp), sau đó thăng lên Trưởng Nhóm (lead)
    const promotionHistory = [
        { emp: 'emp-mkt-02', dept: 'dept-pmk', fromPos: 'pos-mkt-emp', toPos: 'pos-mkt-lead' },
        { emp: 'emp-mkt-03', dept: 'dept-pmk', fromPos: 'pos-mkt-emp', toPos: 'pos-mkt-lead' },
        { emp: 'emp-kd-02', dept: 'dept-kd', fromPos: 'pos-kd-emp', toPos: 'pos-kd-lead' },
        { emp: 'emp-kd-03', dept: 'dept-kd', fromPos: 'pos-kd-emp', toPos: 'pos-kd-lead' },
        { emp: 'emp-hr-02', dept: 'dept-hr', fromPos: 'pos-hr-emp', toPos: 'pos-hr-lead' },
        { emp: 'emp-hr-04', dept: 'dept-hr', fromPos: 'pos-hr-emp', toPos: 'pos-hr-lead' },
        { emp: 'emp-kt-02', dept: 'dept-kt', fromPos: 'pos-kt-emp', toPos: 'pos-kt-lead' },
        { emp: 'emp-bh-02', dept: 'dept-bh', fromPos: 'pos-bh-emp', toPos: 'pos-bh-lead' },
        { emp: 'emp-cloud-02', dept: 'dept-cloud', fromPos: 'pos-cloud-emp', toPos: 'pos-cloud-lead' },
        { emp: 'emp-gptv-02', dept: 'dept-gptv', fromPos: 'pos-gptv-emp', toPos: 'pos-gptv-lead' },
        { emp: 'emp-gptv-03', dept: 'dept-gptv', fromPos: 'pos-gptv-emp', toPos: 'pos-gptv-lead' },
        { emp: 'emp-kttk1-02', dept: 'dept-kttk-1', fromPos: 'pos-kttk1-emp', toPos: 'pos-kttk1-lead' },
        { emp: 'emp-kttk1-03', dept: 'dept-kttk-1', fromPos: 'pos-kttk1-emp', toPos: 'pos-kttk1-lead' },
        { emp: 'emp-kttk2-02', dept: 'dept-kttk-2', fromPos: 'pos-kttk2-emp', toPos: 'pos-kttk2-lead' },
        { emp: 'emp-kttk2-03', dept: 'dept-kttk-2', fromPos: 'pos-kttk2-emp', toPos: 'pos-kttk2-lead' },
        { emp: 'emp-ptnv-02', dept: 'dept-ptnv', fromPos: 'pos-ptnv-emp', toPos: 'pos-ptnv-lead' },
        { emp: 'emp-ptsp-02', dept: 'dept-ptsp', fromPos: 'pos-ptsp-emp', toPos: 'pos-ptsp-lead' }
    ];

    const joinTs2023 = new Date('2023-01-15').getTime();
    const promoteTs2023 = new Date('2023-10-01').getTime();

    for (const ph of promotionHistory) {
        const whId1 = `wh-${ph.emp}-01`;
        if (!await queryOne('SELECT work_history_id FROM WorkHistory WHERE work_history_id = ?', [whId1])) {
            await run(`INSERT INTO WorkHistory (work_history_id, employee_id, department_id, position_id, decision_type, effective_date, reason, note, created_date, last_modified_date)
           VALUES (?, ?, ?, ?, 'RECRUIT', ?, 'Tuyển dụng mới', 'Nhận việc vị trí khởi điểm', ?, ?)`,
                [whId1, ph.emp, ph.dept, ph.fromPos, joinTs2023, now, now]);
        }
        const whId2 = `wh-${ph.emp}-02`;
        if (!await queryOne('SELECT work_history_id FROM WorkHistory WHERE work_history_id = ?', [whId2])) {
            await run(`INSERT INTO WorkHistory (work_history_id, employee_id, department_id, position_id, decision_type, effective_date, reason, note, created_date, last_modified_date)
           VALUES (?, ?, ?, ?, 'PROMOTION', ?, 'Hoàn thành xuất sắc nhiệm vụ, đủ điều kiện bổ nhiệm', 'Bổ nhiệm Trưởng Nhóm', ?, ?)`,
                [whId2, ph.emp, ph.dept, ph.toPos, promoteTs2023, now, now]);
        }
    }

    // 2 trường hợp chuyển phòng ban (Department A -> Department B) - dữ liệu minh họa theo đúng yêu cầu mục 13
    const transferHistory = [
        { emp: 'emp-bh-03', fromDept: 'dept-kt', fromPos: 'pos-kt-emp', toDept: 'dept-bh', toPos: 'pos-bh-emp', reason: 'Điều chuyển từ bộ phận Kiểm thử sang Bảo hành theo nhu cầu nhân sự' },
        { emp: 'emp-kttk2-04', fromDept: 'dept-kttk-1', fromPos: 'pos-kttk1-emp', toDept: 'dept-kttk-2', toPos: 'pos-kttk2-emp', reason: 'Điều chuyển nội bộ trong Khối Kỹ thuật triển khai' }
    ];

    for (const th of transferHistory) {
        const whId1 = `wh-${th.emp}-01`;
        if (!await queryOne('SELECT work_history_id FROM WorkHistory WHERE work_history_id = ?', [whId1])) {
            await run(`INSERT INTO WorkHistory (work_history_id, employee_id, department_id, position_id, decision_type, effective_date, reason, note, created_date, last_modified_date)
           VALUES (?, ?, ?, ?, 'RECRUIT', ?, 'Tuyển dụng mới', 'Nhận việc tại bộ phận ban đầu', ?, ?)`,
                [whId1, th.emp, th.fromDept, th.fromPos, joinTs2023, now, now]);
        }
        const whId2 = `wh-${th.emp}-02`;
        if (!await queryOne('SELECT work_history_id FROM WorkHistory WHERE work_history_id = ?', [whId2])) {
            await run(`INSERT INTO WorkHistory (work_history_id, employee_id, department_id, position_id, decision_type, effective_date, reason, note, created_date, last_modified_date)
           VALUES (?, ?, ?, ?, 'TRANSFER', ?, ?, 'Quyết định điều chuyển phòng ban', ?, ?)`,
                [whId2, th.emp, th.toDept, th.toPos, promoteTs2023, th.reason, now, now]);
        }
    }

    // =========================================================================
    // 6C. LỊCH SỬ NHIỀU HỢP ĐỒNG - một số nhân viên có 2-3 hợp đồng (thử việc -> chính thức)
    // =========================================================================
    const probationBefore = [
        { emp: 'emp-mkt-02', salary: 18000000 },
        { emp: 'emp-kd-02', salary: 17000000 },
        { emp: 'emp-hr-02', salary: 16000000 },
        { emp: 'emp-kt-02', salary: 15500000 },
        { emp: 'emp-gptv-02', salary: 15000000 },
        { emp: 'emp-kttk1-02', salary: 15500000 }
    ];
    const probStart = new Date('2022-10-01').getTime();
    const probEnd = new Date('2023-01-14').getTime();

    for (const pb of probationBefore) {
        const cid = `contract-${pb.emp}-probation`;
        if (!await queryOne('SELECT contract_id FROM EmployeeContract WHERE contract_id = ?', [cid])) {
            await run(`INSERT INTO EmployeeContract (contract_id, created_date, last_modified_date, contract_no, employee_id, contract_type, sign_date, start_date, end_date, salary, status, note)
           VALUES (?, ?, ?, ?, ?, 'HĐLĐ Thử việc', ?, ?, ?, ?, 'EXPIRED', 'Hợp đồng thử việc trước khi ký chính thức')`,
                [cid, now, now, `HĐTV/2022/${pb.emp}`, pb.emp, probStart, probStart, probEnd, pb.salary]);
        }
    }

    // 2 trong số đó có thêm 1 hợp đồng xác định thời hạn ở giữa (đủ 3 hợp đồng: thử việc -> 1 năm -> hiện tại)
    const midTermExtra = [
        { emp: 'emp-mkt-02', salary: 20000000 },
        { emp: 'emp-kd-02', salary: 19000000 }
    ];
    const midStart = new Date('2023-01-15').getTime();
    const midEnd = new Date('2023-10-01').getTime();

    for (const mt of midTermExtra) {
        const cid = `contract-${mt.emp}-midterm`;
        if (!await queryOne('SELECT contract_id FROM EmployeeContract WHERE contract_id = ?', [cid])) {
            await run(`INSERT INTO EmployeeContract (contract_id, created_date, last_modified_date, contract_no, employee_id, contract_type, sign_date, start_date, end_date, salary, status, note)
           VALUES (?, ?, ?, ?, ?, 'HĐLĐ Xác định thời hạn 1 năm', ?, ?, ?, ?, 'EXPIRED', 'Hợp đồng xác định thời hạn trước khi được bổ nhiệm Trưởng Nhóm')`,
                [cid, now, now, `HĐLĐ/2023/${mt.emp}-TM`, mt.emp, midStart, midStart, midEnd, mt.salary]);
        }
    }

    // =========================================================================
    // 7. CONTRACT PROPOSALS & EXTENSIONS (Đề xuất & Gia hạn Hợp đồng)
    // =========================================================================
    const contractProposals = [
        { id: 'prop-c-01', code: 'DXHD/0826-0001', emp_id: 'emp-hr-03', ctype: 'HĐLĐ Xác định thời hạn 1 năm', salary: 17000000, reason: 'Nhân sự Hoàn thành xuất sắc 2 tháng thử việc vị trí Chuyên viên Tuyển dụng' },
        { id: 'prop-c-02', code: 'DXHD/0826-0002', emp_id: 'emp-kd-09', ctype: 'HĐLĐ Xác định thời hạn 1 năm', salary: 14000000, reason: 'Đạt 120% chỉ tiêu doanh số thử việc vị trí Nhân viên Kinh doanh' },
        { id: 'prop-c-03', code: 'DXHD/0826-0003', emp_id: 'emp-kt-07', ctype: 'HĐLĐ Xác định thời hạn 1 năm', salary: 12500000, reason: 'Đạt đánh giá thử việc loại A bộ phận Kiểm thử QA' }
    ];

    for (const cp of contractProposals) {
        const existing = await queryOne('SELECT proposal_id FROM ContractProposal WHERE proposal_id = ?', [cp.id]);
        if (!existing) {
            await run(`INSERT INTO ContractProposal (proposal_id, created_date, last_modified_date, proposal_code, employee_id, contract_type, proposed_salary, proposed_start_date, reason, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
                [cp.id, now, now, cp.code, cp.emp_id, cp.ctype, cp.salary, now + 5 * 86400000, cp.reason]);
        }
    }

    const contractExtensions = [
        { id: 'ext-c-01', code: 'GHHD/0726-0001', contract_id: 'contract-emp-mkt-04', emp_id: 'emp-mkt-04', term: '2 năm', new_end: new Date('2029-01-14').getTime(), salary: 18500000, reason: 'Gia hạn HĐLĐ thêm 2 năm cho Chuyên viên Digital Marketing' },
        { id: 'ext-c-02', code: 'GHHD/0726-0002', contract_id: 'contract-emp-kd-04', emp_id: 'emp-kd-04', term: '3 năm', new_end: new Date('2030-01-14').getTime(), salary: 20000000, reason: 'Gia hạn HĐLĐ 3 năm cho Chuyên viên Tư vấn ERP đạt thành tích xuất sắc' }
    ];

    for (const ce of contractExtensions) {
        const existing = await queryOne('SELECT extension_id FROM ContractExtension WHERE extension_id = ?', [ce.id]);
        if (!existing) {
            await run(`INSERT INTO ContractExtension (extension_id, created_date, last_modified_date, extension_code, contract_id, employee_id, new_end_date, new_salary, extension_term, reason, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED')`,
                [ce.id, now, now, ce.code, ce.contract_id, ce.emp_id, ce.new_end, ce.salary, ce.term, ce.reason]);
        }
    }

    // =========================================================================
    // 8. WORK HISTORY, TRANSFER PROPOSALS & DECISIONS (Biến động Nhân sự)
    // =========================================================================
    const workHistories = [
        { id: 'wh-01', emp_id: 'emp-kd-02', dept_id: 'dept-kd', pos_id: 'pos-kd-lead', dtype: 'Bổ nhiệm', eff_date: '2025-01-01', reason: 'Bổ nhiệm Trưởng nhóm Kinh doanh Dự án ERP' },
        { id: 'wh-02', emp_id: 'emp-mkt-02', dept_id: 'dept-pmk', pos_id: 'pos-mkt-lead', dtype: 'Nâng lương', eff_date: '2025-06-01', reason: 'Tăng lương hiệu suất chiến dịch Marketing B2B' },
        { id: 'wh-03', emp_id: 'emp-kttk1-02', dept_id: 'dept-kttk-1', pos_id: 'pos-kttk1-lead', dtype: 'Bổ nhiệm', eff_date: '2025-03-15', reason: 'Bổ nhiệm Trưởng nhóm Triển khai ERP miền Bắc' }
    ];

    for (const wh of workHistories) {
        const existing = await queryOne('SELECT work_history_id FROM WorkHistory WHERE work_history_id = ?', [wh.id]);
        if (!existing) {
            const effTs = new Date(wh.eff_date).getTime();
            await run(`INSERT INTO WorkHistory (work_history_id, created_date, last_modified_date, employee_id, department_id, position_id, decision_type, effective_date, reason, note)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Đã luân chuyển quyết định chính thức')`,
                [wh.id, now, now, wh.emp_id, wh.dept_id, wh.pos_id, wh.dtype, effTs, wh.reason]);
        }
    }

    const transferProposals = [
        { id: 'prop-t-01', code: 'DXTC/0826-0001', emp_id: 'emp-kttk1-06', cur_dept: 'dept-kttk-1', tar_dept: 'dept-kttk-2', cur_pos: 'pos-kttk1-emp', tar_pos: 'pos-kttk2-emp', reason: 'Điều chuyển hỗ trợ triển khai dự án ERP tập đoàn tại khu vực Miền Nam' }
    ];

    for (const tp of transferProposals) {
        const existing = await queryOne('SELECT proposal_id FROM TransferProposal WHERE proposal_id = ?', [tp.id]);
        if (!existing) {
            await run(`INSERT INTO TransferProposal (proposal_id, created_date, last_modified_date, proposal_code, employee_id, current_department_id, target_department_id, current_position_id, target_position_id, proposed_effective_date, reason, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
                [tp.id, now, now, tp.code, tp.emp_id, tp.cur_dept, tp.tar_dept, tp.cur_pos, tp.tar_pos, now + 15 * 86400000, tp.reason]);
        }
    }

    const transferDecisions = [
        { id: 'dec-t-01', no: 'QĐTC/2026/001', prop_id: 'prop-t-01', emp_id: 'emp-kttk1-06', tar_dept: 'dept-kttk-2', tar_pos: 'pos-kttk2-emp', signed_by: 'Bùi Xuân Thức', reason: 'Quyết định thuyên chuyển công tác cán bộ triển khai ERP' }
    ];

    for (const td of transferDecisions) {
        const existing = await queryOne('SELECT decision_id FROM TransferDecision WHERE decision_id = ?', [td.id]);
        if (!existing) {
            await run(`INSERT INTO TransferDecision (decision_id, created_date, last_modified_date, decision_number, proposal_id, employee_id, target_department_id, target_position_id, effective_date, signed_by, reason, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'EXECUTED')`,
                [td.id, now, now, td.no, td.prop_id, td.emp_id, td.tar_dept, td.tar_pos, now + 15 * 86400000, td.signed_by, td.reason]);
        }
    }

    // =========================================================================
    // 9. RESIGNATIONS (Đơn & Quyết định Nghỉ việc / Offboarding)
    // =========================================================================
    const resignApps = [
        { id: 'res-app-01', code: 'DXNV/0726-0001', emp_id: 'emp-kd-16', reason: 'Thay đổi định hướng công việc và chuyển nơi cư trú cùng gia đình', notes: 'Đã hoàn tất bàn giao file dữ liệu tư vấn khách hàng cho Trưởng nhóm' },
        { id: 'res-app-02', code: 'DXNV/0826-0001', emp_id: 'emp-kt-08', reason: 'Đi du học cao học chuyên ngành Khoa học Máy tính tại Đức', notes: 'Bàn giao kịch bản kiểm thử tự động ERP 10 cho Trưởng phòng QA' }
    ];

    for (const ra of resignApps) {
        const existing = await queryOne('SELECT application_id FROM ResignationApplication WHERE application_id = ?', [ra.id]);
        if (!existing) {
            await run(`INSERT INTO ResignationApplication (application_id, created_date, last_modified_date, application_code, employee_id, desired_resign_date, reason, handover_notes, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED')`,
                [ra.id, now, now, ra.code, ra.emp_id, now + 30 * 86400000, ra.reason, ra.notes]);
        }
    }

    const resignDecs = [
        { id: 'res-dec-01', no: 'QĐNV/2026/001', app_id: 'res-app-01', emp_id: 'emp-kd-16', signed_by: 'Bùi Xuân Thức', reason: 'Chấp thuận chấm dứt HĐLĐ theo nguyện vọng cá nhân' }
    ];

    for (const rd of resignDecs) {
        const existing = await queryOne('SELECT decision_id FROM ResignationDecision WHERE decision_id = ?', [rd.id]);
        if (!existing) {
            await run(`INSERT INTO ResignationDecision (decision_id, created_date, last_modified_date, decision_number, application_id, employee_id, official_resign_date, handover_status, signed_by, reason, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'COMPLETED', ?, ?, 'EXECUTED')`,
                [rd.id, now, now, rd.no, rd.app_id, rd.emp_id, now + 30 * 86400000, rd.signed_by, rd.reason]);
        }
    }

    // =========================================================================
    // 10. RECRUITMENT REQUESTS & PLANS (Tuyển dụng)
    // =========================================================================
    const requests = [
        // TH2: Chưa đủ định biên (Thiếu 3 nhân sự - Phòng Kiểm thử 9/12)
        { id: 'req-rne-01', code: 'RNE/0726-0001', dept_id: 'dept-kt', pos_id: 'pos-kt-emp', requested_by: 'emp-kt-01', qty: 3, reason: 'Nhu cầu bổ sung 3 Nhân viên Kiểm thử cho đủ định biên năm 2026', is_outside: 0, priority: 'HIGH', status: 'APPROVED' },

        // TH2: Chưa đủ định biên (Thiếu 3 nhân sự - Phòng Kinh doanh 17/20)
        { id: 'req-rne-02', code: 'RNE/0726-0002', dept_id: 'dept-kd', pos_id: 'pos-kd-emp', requested_by: 'emp-kd-01', qty: 3, reason: 'Nhu cầu bổ sung 3 Nhân viên Kinh doanh còn thiếu so với định biên', is_outside: 0, priority: 'HIGH', status: 'APPROVED' },

        // TH3: Đã đủ định biên (15/15) nhưng PHÁT SINH nhu cầu tuyển NGOÀI ĐỊNH BIÊN (Phòng Marketing 15/15)
        { id: 'req-rne-03', code: 'RNE/0826-0001', dept_id: 'dept-pmk', pos_id: 'pos-mkt-emp', requested_by: 'emp-mkt-01', qty: 1, reason: 'Đã đủ định biên (15/15), phát sinh nhu cầu tuyển thêm 1 Nhân viên Marketing ngoài định biên cho dự án miền Nam', is_outside: 1, priority: 'URGENT', status: 'APPROVED' },

        // TH2: Chưa đủ định biên (Thiếu 3 nhân sự - Phòng Cloud & Hạ tầng 7/10)
        { id: 'req-rne-04', code: 'RNE/0826-0002', dept_id: 'dept-cloud', pos_id: 'pos-cloud-emp', requested_by: 'emp-cloud-01', qty: 3, reason: 'Bổ sung 3 Nhân viên Cloud và Hạ tầng còn thiếu theo chỉ tiêu định biên', is_outside: 0, priority: 'HIGH', status: 'APPROVED' },

        // TH2: Chưa đủ định biên (Thiếu 3 nhân sự - Phòng KTTK 2 12/15)
        { id: 'req-rne-05', code: 'RNE/0726-0003', dept_id: 'dept-kttk-2', pos_id: 'pos-kttk2-emp', requested_by: 'emp-kttk2-01', qty: 3, reason: 'Bổ sung 3 Nhân viên KTTK 2 dự án miền Nam', is_outside: 0, priority: 'MEDIUM', status: 'APPROVED' },

        // TH2: Chưa đủ định biên (Thiếu 3 nhân sự - Phòng Phát triển sản phẩm 11/14)
        { id: 'req-rne-06', code: 'RNE/0826-0004', dept_id: 'dept-ptsp', pos_id: 'pos-ptsp-emp', requested_by: 'emp-ptsp-01', qty: 3, reason: 'Tuyển bổ sung 3 Nhân viên Phát triển sản phẩm cho đủ định biên 14 người', is_outside: 0, priority: 'HIGH', status: 'APPROVED' }
    ];

    for (const req of requests) {
        const existing = await queryOne('SELECT recruitment_request_id FROM RecruitmentRequest WHERE recruitment_request_id = ?', [req.id]);
        if (!existing) {
            await run(`INSERT INTO RecruitmentRequest (recruitment_request_id, created_date, last_modified_date, request_code, department_id, position_id, requested_by, quantity, reason, expected_date, priority, status, is_outside_headcount)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [req.id, now, now, req.code, req.dept_id, req.pos_id, req.requested_by, req.qty, req.reason, now + 30 * 86400000, req.priority, req.status, req.is_outside]);
        }
    }

    const plans = [
        { id: 'plan-rne-01', req_id: 'req-rne-01', name: 'KHTD/0726-01: Tuyển bổ sung Chuyên viên Kiểm thử QA (Trong định biên)', budget: 35000000 },
        { id: 'plan-rne-02', req_id: 'req-rne-02', name: 'KHTD/0726-02: Tuyển bổ sung Chuyên viên Kinh doanh ERP (Trong định biên)', budget: 50000000 },
        { id: 'plan-rne-03', req_id: 'req-rne-03', name: 'KHTD/0826-01: Tuyển Senior Growth Marketing (Ngoài định biên phát sinh)', budget: 40000000 },
        { id: 'plan-rne-04', req_id: 'req-rne-04', name: 'KHTD/0826-02: Tuyển bổ sung Chuyên viên Cloud & Security (Trong định biên)', budget: 45000000 },
        { id: 'plan-rne-05', req_id: 'req-rne-05', name: 'KHTD/0826-03: Tuyển Chuyên viên Triển khai ERP Miền Nam', budget: 42000000 },
        { id: 'plan-rne-06', req_id: 'req-rne-06', name: 'KHTD/0826-04: Tuyển Kỹ sư Phát triển sản phẩm ERP', budget: 60000000 }
    ];

    for (const pl of plans) {
        const existing = await queryOne('SELECT recruitment_plan_id FROM RecruitmentPlan WHERE recruitment_plan_id = ?', [pl.id]);
        if (!existing) {
            await run(`INSERT INTO RecruitmentPlan (recruitment_plan_id, created_date, last_modified_date, recruitment_request_id, plan_name, start_date, end_date, budget, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'IN_PROGRESS')`,
                [pl.id, now, now, pl.req_id, pl.name, now - 15 * 86400000, now + 45 * 86400000, pl.budget]);
        }
    }

    // Vòng tuyển dụng (Recruitment Rounds)
    const rounds = [
        { id: 'round-01', plan_id: 'plan-rne-01', name: 'Vòng 1: Sàng lọc CV & Đánh giá Hồ sơ', order: 1 },
        { id: 'round-02', plan_id: 'plan-rne-01', name: 'Vòng 2: Phỏng vấn Chuyên môn & Test QA', order: 2 },
        { id: 'round-03', plan_id: 'plan-rne-01', name: 'Vòng 3: Phỏng vấn Ban Giám đốc & Offer', order: 3 },
        { id: 'round-04', plan_id: 'plan-rne-02', name: 'Vòng 1: Phỏng vấn Chuyên môn Kinh doanh', order: 1 },
        { id: 'round-05', plan_id: 'plan-rne-03', name: 'Vòng 1: Phỏng vấn Chuyên môn Marketing', order: 1 },
        { id: 'round-06', plan_id: 'plan-rne-04', name: 'Vòng 1: Phỏng vấn Chuyên môn Cloud & Security', order: 1 },
        { id: 'round-07', plan_id: 'plan-rne-05', name: 'Vòng 1: Kiểm tra Nghiệp vụ Triển khai ERP', order: 1 },
        { id: 'round-08', plan_id: 'plan-rne-06', name: 'Vòng 1: Phỏng vấn Kỹ thuật Phát triển Sản phẩm', order: 1 }
    ];

    for (const rnd of rounds) {
        const existing = await queryOne('SELECT recruitment_round_id FROM RecruitmentRound WHERE recruitment_round_id = ?', [rnd.id]);
        if (!existing) {
            await run(`INSERT INTO RecruitmentRound (recruitment_round_id, created_date, last_modified_date, recruitment_plan_id, round_name, round_order, description, status)
           VALUES (?, ?, ?, ?, ?, ?, 'Vòng đánh giá quy chuẩn tuyển dụng BRAVO', 'ACTIVE')`,
                [rnd.id, now, now, rnd.plan_id, rnd.name, rnd.order]);
        }
    }

    // =========================================================================
    // 11. CANDIDATES, INTERVIEWS & OFFERS
    // =========================================================================
    const candidates = [
        { id: 'cand-uv01', code: 'UV01', name: 'Nguyễn Nhung', dob: '2004-05-18', gender: 'Nữ', phone: '0987456223', email: 'nhung.nguyen@gmail.com', received: '2026-07-17', plan_id: 'plan-rne-01', cid: '001206123456', edu: 'Đại học', major: 'CNTT', school: 'Đại học Quốc gia Hà Nội', source: 'TopCV', status: 'S1: Mới' },
        { id: 'cand-uv09', code: 'UV09', name: 'Phạm Khánh Linh', dob: '2004-11-04', gender: 'Nữ', phone: '0938456123', email: 'pkl02@gmail.com', received: '2026-08-01', plan_id: 'plan-rne-02', cid: '001204456789', edu: 'Đại học', major: 'Kinh tế', school: 'Đại học Kinh tế Quốc dân', source: 'TopCV', status: 'S1: Mới' },
        { id: 'cand-uv07', code: 'UV07', name: 'Nguyễn Minh Anh', dob: '2001-04-12', gender: 'Nam', phone: '0912345698', email: 'minhanh@gmail.com', received: '2026-07-31', plan_id: 'plan-rne-02', cid: '001201123456', edu: 'Đại học', major: 'KT: Kinh tế', school: 'Đại học Quốc gia Hà Nội - Khoa Kinh tế', source: 'TopCV', status: 'S7: Loại', rejection: 'Lý do: Kỹ năng chuyên môn chưa phù hợp' },
        { id: 'cand-uv08', code: 'UV08', name: 'Nguyễn Thu Hà', dob: '2002-09-20', gender: 'Nữ', phone: '0988123456', email: 'thuha@gmail.com', received: '2026-07-31', plan_id: 'plan-rne-02', cid: '001202234567', edu: 'Đại học', major: 'Quản trị Kinh doanh', school: 'Đại học Thương mại', source: 'LinkedIn', status: 'S2: Phỏng vấn' },
        { id: 'cand-uv10', code: 'UV10', name: 'Đỗ Quốc Hưng', dob: '1999-02-08', gender: 'Nam', phone: '0909123789', email: 'dqhung@gmail.com', received: '2026-07-31', plan_id: 'plan-rne-02', cid: '001199345678', edu: 'Đại học', major: 'Marketing', school: 'Đại học Hà Nội', source: 'Website BRAVO', status: 'S5: Trúng tuyển' },
        { id: 'cand-uv06', code: 'UV06', name: 'Nguyễn Lê Tú Anh', dob: '2000-01-15', gender: 'Nữ', phone: '02466805588', email: 'hotro@topcv.vn', received: '2026-08-09', plan_id: 'plan-rne-03', cid: '001200555888', edu: 'Đại học', major: 'Truyền thông', school: 'Học viện Báo chí', source: 'TopCV', status: 'S1: Mới' },
        { id: 'cand-uv05', code: 'UV05', name: 'Phan Quốc Hưng', dob: '1997-06-25', gender: 'Nam', phone: '0968457123', email: 'hungpq@gmail.com', received: '2026-08-08', plan_id: 'plan-rne-03', cid: '001197457123', edu: 'Đại học', major: 'Marketing', school: 'Đại học Ngoại thương', source: 'TopCV', status: 'S2: Phỏng vấn' },
        { id: 'cand-uv04', code: 'UV04', name: 'Nguyễn Minh Khang', dob: '1998-03-10', gender: 'Nam', phone: '0983123456', email: 'khangnm@gmail.com', received: '2026-08-07', plan_id: 'plan-rne-03', cid: '001198123456', edu: 'Đại học', major: 'CNTT', school: 'Đại học Bách Khoa', source: 'LinkedIn', status: 'S1: Mới' },
        { id: 'cand-uv03', code: 'UV03', name: 'Đỗ Khánh Linh', dob: '2001-11-20', gender: 'Nữ', phone: '0905234781', email: 'linhdk@gmail.com', received: '2026-08-06', plan_id: 'plan-rne-03', cid: '001201234781', edu: 'Đại học', major: 'Kinh tế', school: 'Đại học Quốc gia Hà Nội', source: 'TopCV', status: 'S1: Mới' },
        { id: 'cand-uv02', code: 'UV02', name: 'Nguyễn Hải Yến', dob: '2002-04-18', gender: 'Nữ', phone: '0918567432', email: 'yennh@gmail.com', received: '2026-08-04', plan_id: 'plan-rne-03', cid: '001202567432', edu: 'Đại học', major: 'Marketing', school: 'Đại học Hà Nội', source: 'Referral', status: 'S1: Mới' },

        // --- Bổ sung đa dạng trạng thái (mục 10 yêu cầu nghiệp vụ) ---
        { id: 'cand-uv11', code: 'UV11', name: 'Trần Bảo Ngọc', dob: '2000-02-14', gender: 'Nữ', phone: '0977111222', email: 'ngoctb@gmail.com', received: '2026-08-10', plan_id: 'plan-rne-01', cid: '001200111222', edu: 'Đại học', major: 'CNTT', school: 'Đại học Bách Khoa Hà Nội', source: 'TopCV', status: 'Đã sàng lọc' },
        { id: 'cand-uv12', code: 'UV12', name: 'Lê Xuân Bách', dob: '1999-08-30', gender: 'Nam', phone: '0977222333', email: 'bachlx@gmail.com', received: '2026-08-11', plan_id: 'plan-rne-01', cid: '001199222333', edu: 'Đại học', major: 'CNTT', school: 'Học viện Công nghệ Bưu chính Viễn thông', source: 'LinkedIn', status: 'Đã sàng lọc' },
        { id: 'cand-uv13', code: 'UV13', name: 'Phạm Thu Uyên', dob: '2003-01-05', gender: 'Nữ', phone: '0977333444', email: 'uyenpt@gmail.com', received: '2026-08-12', plan_id: 'plan-rne-01', cid: '001203333444', edu: 'Cao đẳng', major: 'CNTT', school: 'Cao đẳng FPT Polytechnic', source: 'TopCV', status: 'Không đạt CV', rejection: 'Kinh nghiệm kiểm thử phần mềm chưa đáp ứng yêu cầu vị trí' },
        { id: 'cand-uv14', code: 'UV14', name: 'Vũ Đình Khoa', dob: '2000-06-19', gender: 'Nam', phone: '0977444555', email: 'khoavd@gmail.com', received: '2026-08-13', plan_id: 'plan-rne-01', cid: '001200444555', edu: 'Đại học', major: 'CNTT', school: 'Đại học Công nghiệp Hà Nội', source: 'Referral', status: 'S2: Phỏng vấn' },
        { id: 'cand-uv15', code: 'UV15', name: 'Đặng Thị Kim Chi', dob: '2001-09-25', gender: 'Nữ', phone: '0977555666', email: 'chidtk@gmail.com', received: '2026-08-14', plan_id: 'plan-rne-04', cid: '001201555666', edu: 'Đại học', major: 'An toàn thông tin', school: 'Học viện Kỹ thuật Mật mã', source: 'TopCV', status: 'S1: Mới' },
        { id: 'cand-uv16', code: 'UV16', name: 'Ngô Tuấn Kiệt', dob: '1998-12-03', gender: 'Nam', phone: '0977666777', email: 'kietnt@gmail.com', received: '2026-08-15', plan_id: 'plan-rne-04', cid: '001198666777', edu: 'Đại học', major: 'CNTT', school: 'Đại học FPT', source: 'LinkedIn', status: 'Đã sàng lọc' },
        { id: 'cand-uv17', code: 'UV17', name: 'Bùi Thị Ánh Tuyết', dob: '2002-07-11', gender: 'Nữ', phone: '0977777888', email: 'tuyetbta@gmail.com', received: '2026-08-16', plan_id: 'plan-rne-04', cid: '001202777888', edu: 'Đại học', major: 'CNTT', school: 'Đại học Thủy Lợi', source: 'TopCV', status: 'Không đạt CV', rejection: 'Thiếu chứng chỉ chuyên môn Cloud (AWS/Azure) theo yêu cầu' },
        { id: 'cand-uv18', code: 'UV18', name: 'Hoàng Gia Bảo', dob: '1999-05-28', gender: 'Nam', phone: '0977888999', email: 'baohg@gmail.com', received: '2026-08-17', plan_id: 'plan-rne-04', cid: '001199888999', edu: 'Đại học', major: 'CNTT', school: 'Đại học Bách Khoa Hà Nội', source: 'Website BRAVO', status: 'S2: Phỏng vấn' },
        { id: 'cand-uv19', code: 'UV19', name: 'Đinh Thị Mỹ Duyên', dob: '2000-10-17', gender: 'Nữ', phone: '0977999000', email: 'duyendtm@gmail.com', received: '2026-08-05', plan_id: 'plan-rne-04', cid: '001200999000', edu: 'Đại học', major: 'CNTT', school: 'Học viện Bưu chính Viễn thông', source: 'TopCV', status: 'S7: Loại', rejection: 'Kết quả phỏng vấn kỹ thuật chưa đạt yêu cầu vị trí Cloud' },
        { id: 'cand-uv20', code: 'UV20', name: 'Trịnh Anh Quân', dob: '1997-03-22', gender: 'Nam', phone: '0966111222', email: 'quanta@gmail.com', received: '2026-07-20', plan_id: 'plan-rne-02', cid: '001197111222', edu: 'Đại học', major: 'Kinh tế', school: 'Đại học Ngoại thương', source: 'Referral', status: 'S5: Trúng tuyển' },
        { id: 'cand-uv21', code: 'UV21', name: 'Lương Thị Hồng Nhung', dob: '1998-11-09', gender: 'Nữ', phone: '0966222333', email: 'nhunglth@gmail.com', received: '2026-08-02', plan_id: 'plan-rne-03', cid: '001198222333', edu: 'Đại học', major: 'Marketing', school: 'Học viện Báo chí và Tuyên truyền', source: 'LinkedIn', status: 'S5: Trúng tuyển' },
        { id: 'cand-uv22', code: 'UV22', name: 'Phan Đức Anh', dob: '1996-04-16', gender: 'Nam', phone: '0966333444', email: 'anhpd@gmail.com', received: '2026-07-05', plan_id: 'plan-rne-01', cid: '001196333444', edu: 'Đại học', major: 'CNTT', school: 'Đại học Bách Khoa Hà Nội', source: 'TopCV', status: 'HIRED' },
        { id: 'cand-uv23', code: 'UV23', name: 'Vũ Minh Khôi', dob: '1998-06-08', gender: 'Nam', phone: '0903812345', email: 'khoi.vm@example.test', received: '2026-08-20', plan_id: 'plan-rne-05', cid: '001198234567', edu: 'Đại học', major: 'Hệ thống thông tin quản lý', school: 'Đại học Kinh tế Quốc dân', source: 'Referral', status: 'SCREENED' },
        { id: 'cand-uv24', code: 'UV24', name: 'Lê Bảo Trâm', dob: '2000-02-28', gender: 'Nữ', phone: '0909123456', email: 'tram.lb@example.test', received: '2026-08-26', plan_id: 'plan-rne-06', cid: '001200345678', edu: 'Đại học', major: 'Kỹ thuật phần mềm', school: 'Đại học Công nghệ - ĐHQGHN', source: 'LinkedIn', status: 'SUBMITTED' }
    ];

    const candidatePositionByPlan = {
        'plan-rne-01': 'pos-kt-emp',
        'plan-rne-02': 'pos-kd-emp',
        'plan-rne-03': 'pos-mkt-emp',
        'plan-rne-04': 'pos-cloud-emp',
        'plan-rne-05': 'pos-kttk2-emp',
        'plan-rne-06': 'pos-ptsp-emp'
    };

    for (const c of candidates) {
        const existing = await queryOne('SELECT candidate_id FROM Candidate WHERE candidate_id = ?', [c.id]);
        if (!existing) {
            const dobTs = new Date(c.dob).getTime();
            const recTs = new Date(c.received).getTime();

            await run(`INSERT INTO Candidate (candidate_id, created_date, last_modified_date, candidate_code, full_name, gender, date_of_birth, citizen_id, phone, email, address, culture_level, education_level, education_school, major, recruitment_plan_id, position_id, source, received_date, status, rejection_reason)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Hà Nội', '12/12', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [c.id, now, now, c.code, c.name, c.gender, dobTs, c.cid, c.phone, c.email, c.edu, c.school, c.major, c.plan_id, candidatePositionByPlan[c.plan_id], c.source, recTs, c.status, c.rejection || null]);
        }
    }

    // Interviews
    const interviews = [
        { id: 'int-01', cand_id: 'cand-uv08', round_id: 'round-04', interviewer_id: 'emp-kd-01', score: 8.5, result: 'PASSED', comment: 'Ứng viên giao tiếp tự tin, có kinh nghiệm tư vấn phần mềm B2B tốt' },
        { id: 'int-02', cand_id: 'cand-uv10', round_id: 'round-04', interviewer_id: 'emp-kd-01', score: 9.0, result: 'PASSED', comment: 'Kỹ năng thương lượng xuất sắc, đề xuất tuyển dụng ngay' },
        { id: 'int-03', cand_id: 'cand-uv14', round_id: 'round-02', interviewer_id: 'emp-kt-01', date: '2026-08-28', score: 8.0, result: 'PASSED', comment: 'Hoàn thành tốt bài test kỹ thuật, đủ điều kiện chuyển sang vòng trao đổi offer' },
        { id: 'int-04', cand_id: 'cand-uv18', round_id: 'round-06', interviewer_id: 'emp-cloud-01', score: 8.0, result: 'PENDING', comment: 'Đã phỏng vấn vòng 1, chờ lịch phỏng vấn chuyên sâu bảo mật' }
    ];

    for (const it of interviews) {
        const existing = await queryOne('SELECT interview_id FROM Interview WHERE interview_id = ?', [it.id]);
        if (!existing) {
            const interviewDate = it.date ? new Date(it.date).getTime() : now - 2 * 86400000;
            await run(`INSERT INTO Interview (interview_id, created_date, last_modified_date, candidate_id, recruitment_round_id, interviewer_id, interview_date, score, result, comment)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [it.id, now, now, it.cand_id, it.round_id, it.interviewer_id, interviewDate, it.score, it.result, it.comment]);
        }
    }

    // InterviewSchedules (Lịch phỏng vấn - thi tuyển)
    const interviewSchedules = [
        {
            id: 'sch-01',
            code: 'PVTT/26-001',
            round_type: 'Vòng phỏng vấn',
            format_type: 'Offline',
            location: 'Phòng họp Tầng 3 - Tòa nhà BRAVO Building, Hà Nội',
            start_time: now + 86400000,
            end_time: now + 86400000 + 7200000,
            note: 'Chuẩn bị phòng họp, máy chiếu và hồ sơ ứng viên in sẵn',
            candidate_note: 'Ứng viên mang theo CCCD và bằng cấp gốc để đối chiếu',
            candidates: JSON.stringify([
                { candidate_id: 'cand-uv08', candidate_code: 'UV08', full_name: 'Nguyễn Thu Hà', apply_position_name: 'Nhân viên Kinh doanh', note: 'Xác nhận tham gia' },
                { candidate_id: 'cand-uv10', candidate_code: 'UV10', full_name: 'Đỗ Quốc Hưng', apply_position_name: 'Nhân viên Kinh doanh', note: 'Đã gọi điện xác nhận' }
            ]),
            council: JSON.stringify([
                { employee_id: 'emp-kd-01', employee_code: 'NV-2024-027', full_name: 'Phạm Quốc Tuấn', position_name: 'Trưởng Phòng Kinh doanh', is_decision_maker: 1 },
                { employee_id: 'emp-hr-01', employee_code: 'NV-2024-004', full_name: 'Trần Thị Thu Hà', position_name: 'Trưởng Phòng Nhân sự', is_decision_maker: 0 }
            ]),
            tests: JSON.stringify([
                { test_name: 'Bài thi Kỹ năng Tư vấn ERP', expected_score: 80, duration_minutes: 45, exam_file: 'De_thi_KinhDoanh_ERP_V1.pdf', answer_file: 'Dap_an_KinhDoanh_ERP_V1.pdf' }
            ]),
            status: 'Đã lên lịch'
        },
        {
            id: 'sch-02',
            code: 'PVTT/26-002',
            round_type: 'Vòng thi tuyển',
            format_type: 'Online',
            location: 'Google Meet: https://meet.google.com/bravo-hr-interview',
            start_time: now + 2 * 86400000,
            end_time: now + 2 * 86400000 + 5400000,
            note: 'Gửi link Google Meet trước 30 phút cho ứng viên',
            candidate_note: 'Ứng viên mở camera trong suốt quá trình thi tuyển online',
            candidates: JSON.stringify([
                { candidate_id: 'cand-uv01', candidate_code: 'UV01', full_name: 'Nguyễn Nhung', apply_position_name: 'Nhân viên Kiểm thử', note: 'Kiểm tra đường truyền internet' }
            ]),
            council: JSON.stringify([
                { employee_id: 'emp-kt-01', employee_code: 'NV-2024-105', full_name: 'Phạm Thị Mai', position_name: 'Trưởng Phòng Kiểm thử', is_decision_maker: 1 }
            ]),
            tests: JSON.stringify([
                { test_name: 'Bài thi Kiểm thử phần mềm (QA/QC Test)', expected_score: 75, duration_minutes: 60, exam_file: 'De_thi_KiomThu_QA_V2.pdf', answer_file: 'Dap_an_KiomThu_QA_V2.pdf' }
            ]),
            status: 'Đã lên lịch'
        },
        {
            id: 'sch-03',
            code: 'PVTT/26-003',
            round_type: 'Vòng phỏng vấn',
            format_type: 'Offline',
            location: 'Phòng họp Tầng 2 - Tòa nhà BRAVO Building, Hà Nội',
            start_time: now - 4 * 86400000,
            end_time: now - 4 * 86400000 + 5400000,
            note: 'Chuẩn bị đề thi kiểm thử phần mềm bản in',
            candidate_note: 'Ứng viên mang laptop cá nhân để làm bài test thực hành',
            candidates: JSON.stringify([
                { candidate_id: 'cand-uv14', candidate_code: 'UV14', full_name: 'Vũ Đình Khoa', apply_position_name: 'Nhân viên Kiểm thử', note: 'Xác nhận tham gia' }
            ]),
            council: JSON.stringify([
                { employee_id: 'emp-kt-01', employee_code: 'NV-2024-105', full_name: 'Phạm Thị Mai', position_name: 'Trưởng Phòng Kiểm thử', is_decision_maker: 1 },
                { employee_id: 'emp-hr-01', employee_code: 'NV-2024-004', full_name: 'Trần Thị Thu Hà', position_name: 'Trưởng Phòng Nhân sự', is_decision_maker: 0 }
            ]),
            tests: JSON.stringify([
                { test_name: 'Bài thi thực hành Kiểm thử phần mềm', expected_score: 75, duration_minutes: 60, exam_file: 'De_thi_KiemThu_V3.pdf', answer_file: 'Dap_an_KiemThu_V3.pdf' }
            ]),
            status: 'Đã hoàn thành'
        },
        {
            id: 'sch-04',
            code: 'PVTT/26-004',
            round_type: 'Vòng phỏng vấn',
            format_type: 'Online',
            location: 'Google Meet: https://meet.google.com/bravo-cloud-interview',
            start_time: now + 4 * 86400000,
            end_time: now + 4 * 86400000 + 5400000,
            note: 'Chuẩn bị câu hỏi tình huống về bảo mật hạ tầng Cloud',
            candidate_note: 'Ứng viên chuẩn bị trình bày 1 dự án Cloud/Security đã triển khai',
            candidates: JSON.stringify([
                { candidate_id: 'cand-uv18', candidate_code: 'UV18', full_name: 'Hoàng Gia Bảo', apply_position_name: 'Nhân viên Cloud và Hạ tầng', note: 'Xác nhận tham gia online' }
            ]),
            council: JSON.stringify([
                { employee_id: 'emp-cloud-01', employee_code: 'NV-2024-097', full_name: 'Hoàng Trọng Nghĩa', position_name: 'Trưởng Phòng Cloud và Hạ tầng', is_decision_maker: 1 },
                { employee_id: 'emp-kcn-01', employee_code: 'NV-2024-095', full_name: 'Lê Hoàng Nam', position_name: 'Trưởng Khối Công nghệ', is_decision_maker: 1 }
            ]),
            tests: JSON.stringify([
                { test_name: 'Bài phỏng vấn tình huống Cloud/Security', expected_score: 80, duration_minutes: 45, exam_file: '', answer_file: '' }
            ]),
            status: 'Đã lên lịch'
        }
    ];

    for (const sch of interviewSchedules) {
        const existing = await queryOne('SELECT schedule_id FROM InterviewSchedule WHERE schedule_id = ?', [sch.id]);
        if (!existing) {
            await run(`INSERT INTO InterviewSchedule (schedule_id, created_date, last_modified_date, schedule_code, round_type, format_type, location, start_time, end_time, note, candidate_note, candidates_json, council_json, tests_json, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [sch.id, now, now, sch.code, sch.round_type, sch.format_type, sch.location, sch.start_time, sch.end_time, sch.note, sch.candidate_note, sch.candidates, sch.council, sch.tests, sch.status]);
        }
    }

    // Sơ loại và đánh giá phỏng vấn minh họa đầy đủ các biểu mẫu nghiệp vụ.
    const preScreenings = [
        {
            id: 'prescreen-01',
            code: 'SL/2026-001',
            candidateId: 'cand-uv11',
            positionId: 'pos-kt-emp',
            departmentId: 'dept-kt',
            cultureLevel: '12/12',
            educationLevel: 'Đại học',
            educationSchool: 'Đại học Bách Khoa Hà Nội',
            result: 'PASSED',
            score: 8,
            comment: 'Hồ sơ đáp ứng yêu cầu nền tảng QA; chuyển ứng viên sang vòng phỏng vấn chuyên môn.',
            criteria: [
                ['prescreen-01-01', 1, 'Trình độ học vấn', 'Đại học', 'Chuyên ngành CNTT hoặc tương đương', 'Đại học', 'CNTT - Đại học Bách Khoa Hà Nội', 1, 'Đáp ứng'],
                ['prescreen-01-02', 2, 'Kinh nghiệm QA', 'Từ 1 năm', 'Có trải nghiệm kiểm thử phần mềm', '18 tháng', 'Manual test và viết test case cho web application', 1, 'Đáp ứng'],
                ['prescreen-01-03', 3, 'Giao tiếp', 'Khá', 'Trình bày rõ ràng và phối hợp nhóm tốt', 'Khá', 'CV có mô tả vai trò phối hợp BA và Developer', 1, 'Đáp ứng']
            ]
        }
    ];

    for (const screening of preScreenings) {
        if (!await queryOne('SELECT pre_screening_id FROM PreScreening WHERE pre_screening_id = ?', [screening.id])) {
            await run(`INSERT INTO PreScreening (pre_screening_id, screening_code, candidate_id, received_date, culture_level, education_level, education_school, position_id, department_id, screening_date, level_score, screening_result, comment, created_date, last_modified_date)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [screening.id, screening.code, screening.candidateId, new Date('2026-08-10').getTime(), screening.cultureLevel, screening.educationLevel, screening.educationSchool, screening.positionId, screening.departmentId, new Date('2026-08-18').getTime(), screening.score, screening.result, screening.comment, now, now]);
        }

        for (const [id, order, type, requiredFrom, requiredDescription, candidateValue, candidateDescription, passed, note] of screening.criteria) {
            if (!await queryOne('SELECT criteria_detail_id FROM PreScreeningCriteria WHERE criteria_detail_id = ?', [id])) {
                await run(`INSERT INTO PreScreeningCriteria (criteria_detail_id, pre_screening_id, row_order, criteria_type, required_from, required_description, candidate_value, candidate_description, is_passed, note)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [id, screening.id, order, type, requiredFrom, requiredDescription, candidateValue, candidateDescription, passed, note]);
            }
        }
    }

    const interviewEvaluations = [
        {
            id: 'interview-eval-01',
            code: 'DG-PV/2026-001',
            scheduleId: 'sch-03',
            candidateId: 'cand-uv14',
            score: 8,
            result: 'PASSED',
            comment: 'Ứng viên có tư duy kiểm thử tốt, phù hợp chuyển sang vòng trao đổi offer.',
            scripts: [
                ['interview-script-01', 1, 'Hãy mô tả cách xây dựng test case cho chức năng đặt hàng.', 'Nêu được happy path, validation và các trường hợp biên.', 'Ứng viên phân tích theo luồng nghiệp vụ, có checklist dữ liệu đầu vào và đầu ra.'],
                ['interview-script-02', 2, 'Bạn xử lý thế nào khi phát hiện lỗi blocker trước ngày phát hành?', 'Đánh giá mức độ ảnh hưởng, thông báo sớm và theo dõi khắc phục.', 'Ứng viên đề xuất triage với BA, Developer và Product Owner; có phương án regression test.']
            ],
            criteria: [
                ['interview-criterion-01', 1, 'Kiến thức kiểm thử', 'Manual testing', 'Hiểu test case, bug lifecycle và regression test', 'Tốt', 'Diễn giải chính xác quy trình kiểm thử', 1, 'Đáp ứng tốt'],
                ['interview-criterion-02', 2, 'Tư duy phân tích', 'Phân tích nghiệp vụ', 'Nhận diện được rủi ro và trường hợp biên', 'Tốt', 'Có cấu trúc phân tích rõ ràng', 1, 'Đáp ứng'],
                ['interview-criterion-03', 3, 'Giao tiếp', 'Khá', 'Trao đổi với nhóm dự án mạch lạc', 'Khá', 'Trình bày súc tích, tiếp nhận phản biện tốt', 1, 'Đáp ứng']
            ]
        }
    ];

    for (const evaluation of interviewEvaluations) {
        if (!await queryOne('SELECT interview_eval_id FROM InterviewEvaluation WHERE interview_eval_id = ?', [evaluation.id])) {
            await run(`INSERT INTO InterviewEvaluation (interview_eval_id, eval_code, evaluation_date, schedule_id, candidate_id, duration_minutes, level_score, overall_result, overall_comment, created_date, last_modified_date)
               VALUES (?, ?, ?, ?, ?, 75, ?, ?, ?, ?, ?)`,
                [evaluation.id, evaluation.code, new Date('2026-08-28').getTime(), evaluation.scheduleId, evaluation.candidateId, evaluation.score, evaluation.result, evaluation.comment, now, now]);
        }

        for (const [id, order, question, expectation, answer] of evaluation.scripts) {
            if (!await queryOne('SELECT script_id FROM InterviewEvaluationScript WHERE script_id = ?', [id])) {
                await run(`INSERT INTO InterviewEvaluationScript (script_id, interview_eval_id, row_order, question, expectation, answer)
                   VALUES (?, ?, ?, ?, ?, ?)`, [id, evaluation.id, order, question, expectation, answer]);
            }
        }

        for (const [id, order, type, requiredFrom, requiredDescription, candidateValue, candidateDescription, passed, note] of evaluation.criteria) {
            if (!await queryOne('SELECT criteria_detail_id FROM InterviewEvaluationCriteria WHERE criteria_detail_id = ?', [id])) {
                await run(`INSERT INTO InterviewEvaluationCriteria (criteria_detail_id, interview_eval_id, row_order, criteria_type, required_from, required_description, candidate_value, candidate_description, is_passed, note)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [id, evaluation.id, order, type, requiredFrom, requiredDescription, candidateValue, candidateDescription, passed, note]);
            }
        }
    }

    const approvalSteps = [
        ['approval-demo-01', 1, 'Trưởng Phòng', 'dept-hr', 'emp-hr-01', 'Trần Thị Thu Hà', 'APPROVED', 'Đã xác nhận kết quả thử việc và nhu cầu nhân sự.', now - 2 * 86400000, now - 2 * 86400000],
        ['approval-demo-02', 2, 'Ban Giám Đốc', null, null, null, 'PENDING', null, now - 86400000, null]
    ];

    for (const [id, level, role, scope, approverId, approverName, status, comment, submittedDate, decidedDate] of approvalSteps) {
        if (!await queryOne('SELECT approval_id FROM ApprovalHistory WHERE approval_id = ?', [id])) {
            await run(`INSERT INTO ApprovalHistory (approval_id, document_type, document_id, level_order, required_role, department_scope, approver_employee_id, approver_name, status, comment, submitted_date, decided_date, created_date)
               VALUES (?, 'ContractProposal', 'prop-c-01', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [id, level, role, scope, approverId, approverName, status, comment, submittedDate, decidedDate, now]);
        }
    }

    if (!await queryOne('SELECT audit_id FROM AuditLog WHERE audit_id = ?', ['audit-demo-01'])) {
        await run(`INSERT INTO AuditLog (audit_id, user_id, username, action, entity_type, entity_id, entity_name, details, created_date)
           VALUES (?, 'usr-ha', 'HANT', 'CREATE', 'RecruitmentRequest', 'req-rne-01', 'RNE/0726-0001', ?, ?)`,
            ['audit-demo-01', JSON.stringify({ department: 'Phòng Kiểm thử', quantity: 3, reason: 'Bổ sung nhân sự theo định biên Quý 3/2026' }), now - 20 * 86400000]);
    }

    // LeaveApplications (Đơn xin nghỉ phép)
    const leaveApplications = [
        {
            id: 'lv-01',
            code: 'DXNP/26-001',
            emp_id: 'emp-kd-04',
            emp_code: 'NV-2024-030',
            emp_name: 'Trần Đức Thắng',
            dept_id: 'dept-kd',
            dept_name: 'Phòng Kinh doanh',
            approver_id: 'emp-kd-01',
            approver_name: 'Phạm Quốc Tuấn',
            related_person_id: 'emp-kd-02',
            related_person_name: 'Đặng Đình Hùng',
            start_date: now + 86400000,
            end_date: now + 2 * 86400000,
            total_days: 2.0,
            reason: 'Giải quyết công việc gia đình ở quê',
            details: JSON.stringify([
                { date: new Date(now + 86400000).toISOString().split('T')[0], time_option: 'Cả ngày', days: 1.0, note: 'Đi về quê' },
                { date: new Date(now + 2 * 86400000).toISOString().split('T')[0], time_option: 'Cả ngày', days: 1.0, note: 'Giải quyết việc gia đình' }
            ]),
            approverNote: '',
            status: 'PENDING'
        },
        {
            id: 'lv-02',
            code: 'DXNP/26-002',
            emp_id: 'emp-hr-03',
            emp_code: 'NV-2024-006',
            emp_name: 'Hoàng Bích Ngọc',
            dept_id: 'dept-hr',
            dept_name: 'Phòng Nhân sự',
            approver_id: 'emp-hr-01',
            approver_name: 'Trần Thị Thu Hà',
            related_person_id: 'emp-hr-02',
            related_person_name: 'Nguyễn Thùy Linh',
            start_date: now - 3 * 86400000,
            end_date: now - 3 * 86400000,
            total_days: 0.5,
            reason: 'Khám sức khỏe định kỳ theo lịch hẹn',
            details: JSON.stringify([
                { date: '2026-08-29', time_option: 'Buổi sáng', days: 0.5, note: 'Đã bàn giao lịch phỏng vấn ứng viên' }
            ]),
            approverNote: 'Đồng ý nghỉ nửa ngày, đã xác nhận kế hoạch bàn giao công việc.',
            status: 'APPROVED'
        },
        {
            id: 'lv-03',
            code: 'DXNP/26-003',
            emp_id: 'emp-cloud-05',
            emp_code: 'NV-2024-101',
            emp_name: 'Bùi Quang Huy',
            dept_id: 'dept-cloud',
            dept_name: 'Phòng Cloud và Hạ tầng',
            approver_id: 'emp-cloud-01',
            approver_name: 'Hoàng Trọng Nghĩa',
            related_person_id: 'emp-cloud-02',
            related_person_name: 'Trần Tuấn Anh',
            start_date: now - 10 * 86400000,
            end_date: now - 9 * 86400000,
            total_days: 2,
            reason: 'Việc cá nhân đột xuất trong giai đoạn vận hành cao điểm',
            details: JSON.stringify([
                { date: '2026-08-22', time_option: 'Cả ngày', days: 1, note: 'Trùng lịch trực vận hành hệ thống' },
                { date: '2026-08-23', time_option: 'Cả ngày', days: 1, note: 'Chưa bố trí được người trực thay thế' }
            ]),
            approverNote: 'Chưa thể phê duyệt do thiếu nhân sự trực vận hành trong giai đoạn cao điểm.',
            status: 'REJECTED'
        }
    ];

    for (const lv of leaveApplications) {
        const existing = await queryOne('SELECT leave_id FROM LeaveApplication WHERE leave_id = ?', [lv.id]);
        if (!existing) {
            await run(`INSERT INTO LeaveApplication (leave_id, created_date, last_modified_date, leave_code, employee_id, employee_code, employee_name, department_id, department_name, approver_id, approver_name, related_person_id, related_person_name, start_date, end_date, total_days, reason, details_json, approver_note, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [lv.id, now, now, lv.code, lv.emp_id, lv.emp_code, lv.emp_name, lv.dept_id, lv.dept_name, lv.approver_id, lv.approver_name, lv.related_person_id, lv.related_person_name, lv.start_date, lv.end_date, lv.total_days, lv.reason, lv.details, lv.approverNote, lv.status]);
        }
    }

    // Offers
    const offers = [
        { id: 'off-01', cand_id: 'cand-uv10', offer_date: now - 86400000, start_date: now + 7 * 86400000, salary: 18000000, status: 'ACCEPTED', note: 'Ứng viên Đỗ Quốc Hưng đã đồng ý nhận vị trí Chuyên viên Tư vấn ERP' },
        { id: 'off-02', cand_id: 'cand-uv20', offer_date: now - 2 * 86400000, start_date: now + 10 * 86400000, salary: 17500000, status: 'Đã phát hành', note: 'Đã gửi thư mời, đang chờ ứng viên Trịnh Anh Quân phản hồi' },
        { id: 'off-03', cand_id: 'cand-uv21', offer_date: now - 5 * 86400000, start_date: now + 5 * 86400000, salary: 16000000, status: 'Từ chối', note: 'Ứng viên Lương Thị Hồng Nhung từ chối do đã nhận việc tại công ty khác' },
        { id: 'off-04', cand_id: 'cand-uv22', offer_date: now - 30 * 86400000, start_date: now - 20 * 86400000, salary: 15500000, status: 'Đã chấp nhận', note: 'Ứng viên Phan Đức Anh đã chấp nhận và chính thức trở thành nhân viên' }
    ];

    for (const ofr of offers) {
        const existing = await queryOne('SELECT offer_id FROM Offer WHERE offer_id = ?', [ofr.id]);
        if (!existing) {
            await run(`INSERT INTO Offer (offer_id, created_date, last_modified_date, candidate_id, offer_date, expected_start_date, salary_offer, offer_status, note)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [ofr.id, now, now, ofr.cand_id, ofr.offer_date, ofr.start_date, ofr.salary, ofr.status, ofr.note]);
        }
    }

    // Hoàn tất chuỗi Request -> Plan -> Round -> Candidate -> Interview -> Offer -> Employee (mục 11)
    // Ứng viên cand-uv22 (Phan Đức Anh) đã trúng tuyển và trở thành nhân viên chính thức - Candidate vẫn được giữ nguyên, không xóa.
    const hiredEmployeeId = 'emp-uv22-hired';
    if (!await queryOne('SELECT employee_id FROM Employee WHERE employee_id = ?', [hiredEmployeeId])) {
        const joinTs = now - 20 * 86400000;
        await run(`INSERT INTO Employee (employee_id, created_date, last_modified_date, employee_code, full_name, gender, date_of_birth, citizen_id, citizen_issue_date, citizen_issue_place, phone, email, address, permanent_address, department_id, position_id, join_date, official_date, employment_status, is_active)
         VALUES (?, ?, ?, 'NV-2026-201', 'Phan Đức Anh', 'Nam', ?, '001196333444', ?, 'Cục Cảnh sát QLHC về Trật tự xã hội', '0966333444', 'anhpd@gmail.com', 'Hà Nội', 'Hà Nội', 'dept-kt', 'pos-kt-emp', ?, ?, 'WORKING', 1)`,
            [hiredEmployeeId, now, now, new Date('1996-04-16').getTime(), new Date('1996-04-16').getTime() + 18 * 365 * 86400000, joinTs, joinTs + 60 * 86400000]);

        const hiredContractId = `contract-${hiredEmployeeId}`;
        if (!await queryOne('SELECT contract_id FROM EmployeeContract WHERE contract_id = ?', [hiredContractId])) {
            await run(`INSERT INTO EmployeeContract (contract_id, created_date, last_modified_date, contract_no, employee_id, contract_type, sign_date, start_date, end_date, salary, status, note)
           VALUES (?, ?, ?, 'HĐLĐ/2026/0201', ?, 'HĐLĐ Xác định thời hạn 1 năm', ?, ?, ?, ?, 'ACTIVE', 'Hợp đồng chính thức sau khi trúng tuyển từ quy trình tuyển dụng')`,
                [hiredContractId, now, now, hiredEmployeeId, joinTs, joinTs, joinTs + 365 * 86400000, 15500000]);
        }

        await run(`INSERT INTO WorkHistory (work_history_id, employee_id, department_id, position_id, decision_type, effective_date, reason, note, created_date, last_modified_date)
         VALUES (?, ?, 'dept-kt', 'pos-kt-emp', 'RECRUIT', ?, 'Trúng tuyển qua quy trình tuyển dụng KHTD/0726-01', 'Chuyển đổi từ ứng viên cand-uv22 thành nhân viên chính thức', ?, ?)`,
            [`wh-${hiredEmployeeId}-01`, hiredEmployeeId, joinTs, now, now]);
    }

    // =========================================================================
    // 12. EVALUATION CRITERIA, SCALES, EVALUATIONS & DETAILS (Đánh giá KPI)
    // =========================================================================
    const criteriaList = [
        { id: 'crit-01', code: 'KPI_WORK', name: 'Mức độ hoàn thành chỉ tiêu công việc (KPI)', weight: 40, desc: 'Đánh giá tiến độ, chất lượng và số lượng công việc được giao' },
        { id: 'crit-02', code: 'SKILL_PROF', name: 'Kỹ năng chuyên môn & Nghiệp vụ', weight: 20, desc: 'Mức độ thành thạo quy trình, kỹ thuật và xử lý vấn đề' },
        { id: 'crit-03', code: 'ATTITUDE', name: 'Thái độ làm việc & Kỷ luật lao động', weight: 20, desc: 'Ý thức chấp hành nội quy, giờ giấc và tinh thần trách nhiệm' },
        { id: 'crit-04', code: 'TEAMWORK', name: 'Kỹ năng phối hợp & Làm việc nhóm', weight: 20, desc: 'Khả năng giao tiếp, tinh thần đồng đội và chia sẻ tri thức' }
    ];

    for (const cr of criteriaList) {
        const existing = await queryOne('SELECT criteria_id FROM EvaluationCriteria WHERE criteria_id = ?', [cr.id]);
        if (!existing) {
            await run(`INSERT INTO EvaluationCriteria (criteria_id, created_date, last_modified_date, criteria_code, criteria_name, weight, description, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
                [cr.id, now, now, cr.code, cr.name, cr.weight, cr.desc]);
        }
    }

    const scaleBands = [
        ['D - Cần cải thiện', 0, 6.49, 'Chưa đáp ứng yêu cầu, cần kế hoạch cải thiện cụ thể.'],
        ['C - Đạt yêu cầu', 6.5, 7.99, 'Hoàn thành yêu cầu cơ bản của vị trí.'],
        ['B - Tốt', 8, 8.99, 'Hoàn thành tốt mục tiêu và chủ động trong công việc.'],
        ['A - Xuất sắc', 9, 10, 'Vượt kỳ vọng, tạo tác động tích cực rõ rệt cho đội ngũ.']
    ];

    for (const criterion of criteriaList) {
        for (const [index, [grade, min, max, description]] of scaleBands.entries()) {
            const scaleId = `scale-${criterion.id}-${index + 1}`;
            if (!await queryOne('SELECT scale_id FROM EvaluationScale WHERE scale_id = ?', [scaleId])) {
                await run(`INSERT INTO EvaluationScale (scale_id, criteria_id, grade_name, min_score, max_score, description)
                   VALUES (?, ?, ?, ?, ?, ?)`, [scaleId, criterion.id, grade, min, max, description]);
            }
        }
    }

    // Employee Evaluations
    const sampleEvals = [
        { id: 'eval-01', code: 'DG/2026-001', emp_id: 'emp-hr-02', eval_id: 'emp-hr-01', dept_id: 'dept-hr', pos_id: 'pos-hr-lead', score: 9.2, grade: 'Loại A - Xuất sắc', desc: 'Hoàn thành xuất sắc chỉ tiêu tuyển dụng Quý 2 năm 2026', scores: [9.5, 9, 9, 9] },
        { id: 'eval-02', code: 'DG/2026-002', emp_id: 'emp-kd-02', eval_id: 'emp-kd-01', dept_id: 'dept-kd', pos_id: 'pos-kd-lead', score: 8.8, grade: 'Loại B - Tốt', desc: 'Đạt 110% kế hoạch doanh số tư vấn triển khai phần mềm ERP', scores: [9, 8.5, 8.5, 9] },
        { id: 'eval-03', code: 'DG/2026-003', emp_id: 'emp-mkt-02', eval_id: 'emp-mkt-01', dept_id: 'dept-pmk', pos_id: 'pos-mkt-lead', score: 8.5, grade: 'Loại B - Tốt', desc: 'Triển khai thành công các chiến dịch Lead Generation B2B', scores: [8.5, 8.5, 8, 9] },
        { id: 'eval-04', code: 'DG/2026-004', emp_id: 'emp-kttk1-02', eval_id: 'emp-kttk1-01', dept_id: 'dept-kttk-1', pos_id: 'pos-kttk1-lead', score: 9.5, grade: 'Loại A - Xuất sắc', desc: 'Dẫn dắt đội ngũ triển khai hoàn thành đúng hạn dự án tập đoàn', scores: [9.5, 9.5, 9.5, 9.5] },
        { id: 'eval-05', code: 'DG/2026-005', emp_id: 'emp-kt-02', eval_id: 'emp-kt-01', dept_id: 'dept-kt', pos_id: 'pos-kt-lead', score: 8.6, grade: 'Loại B - Tốt', desc: 'Kiểm soát chất lượng bản phát hành BRAVO ERP 10 không có lỗi nghiêm trọng', scores: [8.5, 8.5, 8.5, 9] }
    ];

    for (const ev of sampleEvals) {
        const existing = await queryOne('SELECT evaluation_id FROM EmployeeEvaluation WHERE evaluation_id = ?', [ev.id]);
        if (!existing) {
            await run(`INSERT INTO EmployeeEvaluation (evaluation_id, created_date, last_modified_date, evaluation_code, evaluation_date, year, evaluator_id, employee_id, department_id, position_id, total_score, grade_result, description, status)
           VALUES (?, ?, ?, ?, ?, 2026, ?, ?, ?, ?, ?, ?, ?, 'COMPLETED')`,
                [ev.id, now, now, ev.code, now - 10 * 86400000, ev.eval_id, ev.emp_id, ev.dept_id, ev.pos_id, ev.score, ev.grade, ev.desc]);

            // Evaluation details for criteria
            for (const [index, cr] of criteriaList.entries()) {
                const detId = `det-${ev.id}-${cr.code}`;
                await run(`INSERT INTO EmployeeEvaluationDetail (detail_id, evaluation_id, criteria_id, criteria_code, criteria_name, weight, score, note)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'Đánh giá hoàn thành chỉ tiêu theo quy chế')`,
                    [detId, ev.id, cr.id, cr.code, cr.name, cr.weight, ev.scores[index]]);
            }
        }
    }

    // =========================================================================
    // 13. REWARD & DISCIPLINE (Khen thưởng & Kỷ luật)
    // =========================================================================
    const rdProposals = [
        { id: 'rd-prop-01', code: 'DXKT/0826-0001', type: 'REWARD', emp_id: 'emp-kttk1-02', amount: 5000000, reason: 'Tuyên dương Cá nhân Xuất sắc Quý 2/2026 bộ phận Triển khai', proposed_by: 'Nguyễn Văn Hùng', status: 'APPROVED' },
        { id: 'rd-prop-02', code: 'DXKT/0826-0002', type: 'REWARD', emp_id: 'emp-ptsp-05', amount: 10000000, reason: 'Sáng kiến cải tiến trải nghiệm giao diện người dùng sản phẩm BRAVO 10', proposed_by: 'Trịnh Thái Sơn', status: 'APPROVED' },
        { id: 'rd-prop-03', code: 'DXKL/0826-0001', type: 'DISCIPLINE', emp_id: 'emp-mkt-12', amount: 0, reason: 'Nhắc nhở và Khiển trách do đi muộn quá 5 lần trong tháng 7/2026', proposed_by: 'Đỗ Thị Thu Trang', status: 'APPROVED' },
        { id: 'rd-prop-04', code: 'DXKT/0826-0003', type: 'REWARD', emp_id: 'emp-kd-06', amount: 3000000, reason: 'Hoàn thành xuất sắc chỉ tiêu doanh số tháng 8/2026', proposed_by: 'Phạm Quốc Tuấn', status: 'PENDING' },
        { id: 'rd-prop-05', code: 'DXKT/0826-0004', type: 'REWARD', emp_id: 'emp-cloud-04', amount: 4000000, reason: 'Xử lý sự cố hạ tầng khẩn cấp ngoài giờ, đảm bảo hệ thống hoạt động ổn định', proposed_by: 'Vũ Văn Khiêm', status: 'PENDING' },
        { id: 'rd-prop-06', code: 'DXKL/0826-0002', type: 'DISCIPLINE', emp_id: 'emp-bh-06', amount: 0, reason: 'Đề xuất nhắc nhở do chưa hoàn thành báo cáo bảo hành đúng hạn 3 lần liên tiếp', proposed_by: 'Nguyễn Thị Hồng', status: 'REJECTED' }
    ];

    for (const rdp of rdProposals) {
        const existing = await queryOne('SELECT proposal_id FROM RewardDisciplineProposal WHERE proposal_id = ?', [rdp.id]);
        if (!existing) {
            await run(`INSERT INTO RewardDisciplineProposal (proposal_id, created_date, last_modified_date, proposal_code, record_type, employee_id, proposed_amount, reason, proposed_by, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [rdp.id, now, now, rdp.code, rdp.type, rdp.emp_id, rdp.amount, rdp.reason, rdp.proposed_by, rdp.status]);
        }
    }

    const rdDecisions = [
        { id: 'rd-dec-01', emp_id: 'emp-kttk1-02', no: 'QĐKT/2026/001', type: 'REWARD', reason: 'Tuyên dương & Khen thưởng Cá nhân Xuất sắc Quý 2/2026', content: 'Tặng bằng khen công ty và tiền thưởng 5.000.000 VNĐ', signed_by: 'Bùi Xuân Thức' },
        { id: 'rd-dec-02', emp_id: 'emp-ptsp-05', no: 'QĐKT/2026/002', type: 'REWARD', reason: 'Khen thưởng Sáng kiến Đổi mới Sản phẩm BRAVO ERP 10', content: 'Thưởng sáng kiến 10.000.000 VNĐ và ghi nhận tích lũy thăng tiến', signed_by: 'Bùi Xuân Thức' },
        { id: 'rd-dec-03', emp_id: 'emp-mkt-12', no: 'QĐKL/2026/001', type: 'DISCIPLINE', reason: 'Khiển trách Kỷ luật Lao động về chấp hành giờ giấc', content: 'Khiển trách bằng văn bản và trừ điểm đánh giá thi đua tháng 7/2026', signed_by: 'Trần Thị Thu Hà' }
    ];

    for (const rdd of rdDecisions) {
        const existing = await queryOne('SELECT reward_discipline_id FROM RewardDiscipline WHERE reward_discipline_id = ?', [rdd.id]);
        if (!existing) {
            await run(`INSERT INTO RewardDiscipline (reward_discipline_id, created_date, last_modified_date, employee_id, decision_no, decision_type, decision_date, effective_date, reason, content, decision_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [rdd.id, now, now, rdd.emp_id, rdd.no, rdd.type, now - 5 * 86400000, now - 5 * 86400000, rdd.reason, rdd.content, rdd.signed_by]);
        }
    }

    // =========================================================================
    // 14. DEPARTMENT HEADCOUNT QUOTAS (Định biên Nhân sự & Chi tiết Vị trí)
    // =========================================================================
    const quotaSeeds = [
        {
            id: 'quota-01',
            code: 'ĐB/0826-0002',
            effDate: new Date('2026-08-12').getTime(),
            deptId: 'dept-hr',
            creatorId: 'emp-hr-01',
            creator: 'Trần Thị Thu Hà',
            target: 8,
            max: 9,
            current: 8,
            budget: 48000000,
            desc: 'Định biên Phòng Nhân sự tháng 8/2026, duy trì đủ đội ngũ tuyển dụng và C&B.',
            status: 'Đang duyệt',
            details: [
                { id: 'qdet-01-1', posId: 'pos-hr-mgr', posCode: 'PHR_MGR', posName: 'Trưởng Phòng Nhân sự', target: 1, resign: 0, mat: 0, curr: 1, need: 0, note: '' },
                { id: 'qdet-01-2', posId: 'pos-hr-lead', posCode: 'PHR_LEAD', posName: 'Trưởng Nhóm Nhân sự', target: 2, resign: 0, mat: 0, curr: 2, need: 0, note: '' },
                { id: 'qdet-01-3', posId: 'pos-hr-emp', posCode: 'PHR_EMP', posName: 'Nhân viên Nhân sự', target: 5, resign: 0, mat: 0, curr: 5, need: 0, note: '' }
            ]
        },
        {
            id: 'quota-02',
            code: 'ĐB/0726-0002',
            effDate: new Date('2026-07-19').getTime(),
            deptId: 'dept-pmk',
            creatorId: 'emp-hr-02',
            creator: 'Nguyễn Thùy Linh',
            target: 15,
            max: 20,
            current: 15,
            budget: 150000000,
            desc: 'Kế hoạch Marketing và Lead Generation Quý 3/2026, duy trì định biên hiện hữu.',
            status: 'Đã hoàn thiện',
            details: [
                { id: 'qdet-02-1', posId: 'pos-mkt-mgr', posCode: 'PMK_MGR', posName: 'Trưởng Phòng Marketing', target: 1, resign: 0, mat: 0, curr: 1, need: 0, note: '' },
                { id: 'qdet-02-2', posId: 'pos-mkt-lead', posCode: 'PMK_LEAD', posName: 'Trưởng Nhóm Marketing', target: 2, resign: 0, mat: 0, curr: 2, need: 0, note: '' },
                { id: 'qdet-02-3', posId: 'pos-mkt-emp', posCode: 'PMK_EMP', posName: 'Nhân viên Marketing', target: 12, resign: 0, mat: 0, curr: 12, need: 0, note: '' }
            ]
        },
        {
            id: 'quota-03',
            code: 'ĐB/0726-0001',
            effDate: new Date('2026-07-16').getTime(),
            deptId: 'dept-hr',
            creatorId: 'emp-hr-01',
            creator: 'Trần Thị Thu Hà',
            target: 10,
            max: 15,
            current: 8,
            budget: 120000000,
            desc: 'Định biên Phòng Nhân sự đầu năm 2026, dự phòng hai chuyên viên cho kế hoạch mở rộng.',
            status: 'Đã hoàn thiện',
            details: [
                { id: 'qdet-03-1', posId: 'pos-hr-mgr', posCode: 'PHR_MGR', posName: 'Trưởng Phòng Nhân sự', target: 1, resign: 0, mat: 0, curr: 1, need: 0, note: '' },
                { id: 'qdet-03-2', posId: 'pos-hr-lead', posCode: 'PHR_LEAD', posName: 'Trưởng Nhóm Nhân sự', target: 2, resign: 0, mat: 0, curr: 2, need: 0, note: '' },
                { id: 'qdet-03-3', posId: 'pos-hr-emp', posCode: 'PHR_EMP', posName: 'Nhân viên Nhân sự', target: 7, resign: 0, mat: 0, curr: 5, need: 2, note: 'Dự phòng chuyên viên tuyển dụng và C&B' }
            ]
        },
        {
            id: 'quota-04',
            code: 'ĐB/0726-0003',
            effDate: new Date('2026-07-01').getTime(),
            deptId: 'dept-kd',
            creatorId: 'emp-hr-02',
            creator: 'Nguyễn Thùy Linh',
            target: 20,
            max: 22,
            current: 17,
            budget: 170000000,
            desc: 'Định biên Quý 3, Quý 4/2026 của Phòng Kinh doanh, cần tuyển thêm ba chuyên viên ERP.',
            status: 'Đã hoàn thiện',
            details: [
                { id: 'qdet-04-1', posId: 'pos-kd-mgr', posCode: 'PKD_MGR', posName: 'Trưởng Phòng Kinh doanh', target: 1, resign: 0, mat: 0, curr: 1, need: 0, note: '' },
                { id: 'qdet-04-2', posId: 'pos-kd-lead', posCode: 'PKD_LEAD', posName: 'Trưởng Nhóm Kinh doanh', target: 2, resign: 0, mat: 0, curr: 2, need: 0, note: '' },
                { id: 'qdet-04-3', posId: 'pos-kd-emp', posCode: 'PKD_EMP', posName: 'Nhân viên Kinh doanh', target: 17, resign: 0, mat: 0, curr: 14, need: 3, note: 'Bổ sung chuyên viên kinh doanh ERP theo kế hoạch tuyển dụng.' }
            ]
        },
        {
            id: 'quota-05',
            code: 'ĐB/0826-0001',
            effDate: new Date('2026-08-01').getTime(),
            deptId: 'dept-kt',
            creatorId: 'emp-hr-01',
            creator: 'Trần Thị Thu Hà',
            target: 12,
            max: 14,
            current: 9,
            budget: 50000000,
            desc: 'Định biên Phòng Kiểm thử Quý 3/2026, bổ sung ba nhân sự cho kế hoạch phát hành ERP 10.',
            status: 'Tạo phiếu',
            details: [
                { id: 'qdet-05-1', posId: 'pos-kt-mgr', posCode: 'PKT_MGR', posName: 'Trưởng Phòng Kiểm thử', target: 1, resign: 0, mat: 0, curr: 1, need: 0, note: '' },
                { id: 'qdet-05-2', posId: 'pos-kt-lead', posCode: 'PKT_LEAD', posName: 'Trưởng Nhóm Kiểm thử', target: 2, resign: 0, mat: 0, curr: 1, need: 1, note: 'Bổ sung trưởng nhóm kiểm thử tự động.' },
                { id: 'qdet-05-3', posId: 'pos-kt-emp', posCode: 'PKT_EMP', posName: 'Nhân viên Kiểm thử', target: 9, resign: 0, mat: 0, curr: 7, need: 2, note: 'Bổ sung nhân sự kiểm thử dự án.' }
            ]
        },
        {
            id: 'quota-06',
            code: 'ĐB/0826-0003',
            effDate: new Date('2026-08-05').getTime(),
            deptId: 'dept-cloud',
            creatorId: 'emp-hr-02',
            creator: 'Nguyễn Thùy Linh',
            target: 10,
            max: 12,
            current: 7,
            budget: 200000000,
            desc: 'Tuyển bổ sung Kỹ sư DevOps và Cloud Hạ tầng theo nhu cầu trực vận hành 24/7.',
            status: 'Từ chối',
            details: [
                { id: 'qdet-06-1', posId: 'pos-cloud-mgr', posCode: 'CLOUD_MGR', posName: 'Trưởng Phòng Cloud và Hạ tầng', target: 1, resign: 0, mat: 0, curr: 1, need: 0, note: '' },
                { id: 'qdet-06-2', posId: 'pos-cloud-lead', posCode: 'CLOUD_LEAD', posName: 'Trưởng Nhóm Cloud và Hạ tầng', target: 2, resign: 0, mat: 0, curr: 1, need: 1, note: 'Cần bổ sung năng lực điều phối ca trực.' },
                { id: 'qdet-06-3', posId: 'pos-cloud-emp', posCode: 'CLOUD_EMP', posName: 'Nhân viên Cloud và Hạ tầng', target: 7, resign: 0, mat: 0, curr: 5, need: 2, note: 'Cần giải trình thêm chi tiết ngân sách.' }
            ]
        }
    ];

    for (const q of quotaSeeds) {
        const existing = await queryOne('SELECT quota_id FROM DepartmentQuota WHERE quota_id = ?', [q.id]);
        if (!existing) {
            await run(`INSERT INTO DepartmentQuota (quota_id, created_date, last_modified_date, quota_code, effective_date, department_id, creator_id, creator_name, target_headcount, max_capacity, current_headcount, budget, description, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [q.id, now, now, q.code, q.effDate, q.deptId, q.creatorId, q.creator, q.target, q.max, q.current, q.budget, q.desc, q.status]);

            for (const d of q.details) {
                await run(`INSERT INTO DepartmentQuotaDetail (detail_id, quota_id, position_id, position_code, position_name, target_headcount, resignation_count, maternity_count, current_headcount, needed_headcount, note)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [d.id, q.id, d.posId, d.posCode, d.posName, d.target, d.resign, d.mat, d.curr, d.need, d.note]);
            }
        }
    }

    // =========================================================================
    // 15. CONTRACT TYPES (Danh mục Loại HĐLĐ Dùng chung)
    // =========================================================================
    const contractTypes = [
        { id: 'cttype-tv', code: 'HDTV', name: 'Hợp đồng Thử việc (02 tháng)', duration: 2, hasProbation: 1, probationDays: 60 },
        { id: 'cttype-12m', code: 'HD12M', name: 'Hợp đồng Xác định thời hạn 12 tháng', duration: 12, hasProbation: 0, probationDays: 0 },
        { id: 'cttype-24m', code: 'HD24M', name: 'Hợp đồng Xác định thời hạn 24 tháng', duration: 24, hasProbation: 0, probationDays: 0 },
        { id: 'cttype-36m', code: 'HD36M', name: 'Hợp đồng Xác định thời hạn 36 tháng', duration: 36, hasProbation: 0, probationDays: 0 },
        { id: 'cttype-kth', code: 'HDKTH', name: 'Hợp đồng Không xác định thời hạn', duration: 0, hasProbation: 0, probationDays: 0 }
    ];

    for (const ct of contractTypes) {
        const existing = await queryOne('SELECT contract_type_id FROM ContractType WHERE contract_type_id = ?', [ct.id]);
        if (!existing) {
            await run(`INSERT INTO ContractType (contract_type_id, created_date, last_modified_date, contract_type_code, contract_type_name, duration_months, has_probation, probation_days, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
                [ct.id, now, now, ct.code, ct.name, ct.duration, ct.hasProbation, ct.probationDays]);
        }
    }

    // =========================================================================
    // 16. POSITION CONTRACT PATHWAYS (Lộ trình ký HĐLĐ theo Vị trí)
    // =========================================================================
    const pathwaySeeds = [
        { id: 'pw-01', posId: 'pos-kt-emp', ctId: 'cttype-tv', order: 1, note: 'Giai đoạn thử việc 02 tháng đầu tiên' },
        { id: 'pw-02', posId: 'pos-kt-emp', ctId: 'cttype-12m', order: 2, note: 'Hợp đồng chính thức 12 tháng năm thứ 1' },
        { id: 'pw-03', posId: 'pos-kt-emp', ctId: 'cttype-24m', order: 3, note: 'Gia hạn HĐLĐ 24 tháng năm tiếp theo' },
        { id: 'pw-04', posId: 'pos-kt-emp', ctId: 'cttype-kth', order: 4, note: 'Chuyển thành HĐLĐ Không xác định thời hạn dài lâu' },
        { id: 'pw-05', posId: 'pos-hr-emp', ctId: 'cttype-tv', order: 1, note: 'Thử việc 60 ngày' },
        { id: 'pw-06', posId: 'pos-hr-emp', ctId: 'cttype-12m', order: 2, note: 'HĐLĐ 1 năm' },
        { id: 'pw-07', posId: 'pos-hr-emp', ctId: 'cttype-kth', order: 3, note: 'HĐLĐ Không xác định thời hạn' },
        { id: 'pw-08', posId: 'pos-kd-emp', ctId: 'cttype-tv', order: 1, note: 'Thử việc 60 ngày trước khi nhận KPI doanh số' },
        { id: 'pw-09', posId: 'pos-kd-emp', ctId: 'cttype-12m', order: 2, note: 'HĐLĐ 12 tháng sau khi hoàn thành thử việc' },
        { id: 'pw-10', posId: 'pos-kd-emp', ctId: 'cttype-36m', order: 3, note: 'HĐLĐ 36 tháng dành cho nhân sự đạt KPI ổn định' },
        { id: 'pw-11', posId: 'pos-mkt-emp', ctId: 'cttype-tv', order: 1, note: 'Thử việc 60 ngày' },
        { id: 'pw-12', posId: 'pos-mkt-emp', ctId: 'cttype-12m', order: 2, note: 'HĐLĐ 12 tháng theo chu kỳ chiến dịch' },
        { id: 'pw-13', posId: 'pos-mkt-emp', ctId: 'cttype-36m', order: 3, note: 'HĐLĐ 36 tháng cho nhân sự chủ chốt' },
        { id: 'pw-14', posId: 'pos-cloud-emp', ctId: 'cttype-tv', order: 1, note: 'Thử việc 60 ngày, đánh giá trực vận hành' },
        { id: 'pw-15', posId: 'pos-cloud-emp', ctId: 'cttype-12m', order: 2, note: 'HĐLĐ 12 tháng sau khi đạt yêu cầu vận hành' },
        { id: 'pw-16', posId: 'pos-cloud-emp', ctId: 'cttype-36m', order: 3, note: 'HĐLĐ 36 tháng cho kỹ sư vận hành ổn định' },
        { id: 'pw-17', posId: 'pos-kttk2-emp', ctId: 'cttype-tv', order: 1, note: 'Thử việc 60 ngày theo dự án triển khai' },
        { id: 'pw-18', posId: 'pos-kttk2-emp', ctId: 'cttype-12m', order: 2, note: 'HĐLĐ 12 tháng sau khi hoàn thành dự án đầu tiên' },
        { id: 'pw-19', posId: 'pos-kttk2-emp', ctId: 'cttype-36m', order: 3, note: 'HĐLĐ 36 tháng cho chuyên viên triển khai' },
        { id: 'pw-20', posId: 'pos-ptsp-emp', ctId: 'cttype-tv', order: 1, note: 'Thử việc 60 ngày với bài đánh giá kỹ thuật' },
        { id: 'pw-21', posId: 'pos-ptsp-emp', ctId: 'cttype-12m', order: 2, note: 'HĐLĐ 12 tháng sau khi hoàn thành sprint thử việc' },
        { id: 'pw-22', posId: 'pos-ptsp-emp', ctId: 'cttype-36m', order: 3, note: 'HĐLĐ 36 tháng cho kỹ sư phát triển sản phẩm' }
    ];

    for (const pw of pathwaySeeds) {
        const existing = await queryOne('SELECT pathway_id FROM PositionContractPathway WHERE pathway_id = ?', [pw.id]);
        if (!existing) {
            await run(`INSERT INTO PositionContractPathway (pathway_id, position_id, contract_type_id, step_order, note, created_date)
           VALUES (?, ?, ?, ?, ?, ?)`,
                [pw.id, pw.posId, pw.ctId, pw.order, pw.note, now]);
        }
    }

    console.log('BRAVO HRM Comprehensive Database Seeding completed successfully across ALL modules!');
};

if (require.main === module) {
    seedData(true)
        .then(() => process.exit(0))
        .catch((err) => {
            console.error('Seeding error:', err);
            process.exit(1);
        });
}

module.exports = { seedData };
