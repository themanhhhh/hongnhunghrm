export const INITIAL_INTERVIEW_SCHEDULES = [
    {
        schedule_id: 'sch-01',
        id: 'sch-01',
        schedule_code: 'PVTT/26-001',
        created_date: new Date('2026-08-25').getTime(),
        round_type: 'Vòng phỏng vấn',
        format_type: 'Offline',
        location: 'Phòng họp Tầng 3 - Tòa nhà BRAVO Building, Hà Nội',
        start_time: '2026-08-28T09:00',
        end_time: '2026-08-28T11:00',
        note: 'Chuẩn bị phòng họp, máy chiếu và hồ sơ ứng viên in sẵn',
        candidate_note: 'Ứng viên mang theo CCCD và bằng cấp gốc để đối chiếu',
        candidates_json: JSON.stringify([
            { candidate_id: 'cand-uv08', candidate_code: 'UV-2024-008', full_name: 'Nguyễn Thị Bích Ngọc', apply_position_name: 'Nhân viên Kinh doanh', note: 'Xác nhận tham gia' },
            { candidate_id: 'cand-uv10', candidate_code: 'UV-2024-010', full_name: 'Đỗ Quốc Hưng', apply_position_name: 'Nhân viên Kinh doanh', note: 'Đã gọi điện xác nhận' }
        ]),
        council_json: JSON.stringify([
            { employee_id: 'emp-kd-01', employee_code: 'NV-2024-027', full_name: 'Phạm Quốc Tuấn', position_name: 'Trưởng Phòng Kinh doanh', is_decision_maker: 1 },
            { employee_id: 'emp-hr-01', employee_code: 'NV-2024-004', full_name: 'Trần Thị Thu Hà', position_name: 'Trưởng Phòng Nhân sự', is_decision_maker: 0 }
        ]),
        tests_json: JSON.stringify([
            { test_name: 'Bài thi Kỹ năng Tư vấn ERP', expected_score: 80, duration_minutes: 45, exam_file_name: 'De_thi_KinhDoanh_ERP_V1.pdf', answer_file_name: 'Dap_an_KinhDoanh_ERP_V1.pdf' }
        ]),
        status: 'Đã lên lịch'
    },
    {
        schedule_id: 'sch-02',
        id: 'sch-02',
        schedule_code: 'PVTT/26-002',
        created_date: new Date('2026-08-25').getTime(),
        round_type: 'Vòng thi tuyển',
        format_type: 'Online',
        location: 'Google Meet: https://meet.google.com/bravo-hr-interview',
        start_time: '2026-08-29T14:00',
        end_time: '2026-08-29T15:30',
        note: 'Gửi link Google Meet trước 30 phút cho ứng viên',
        candidate_note: 'Ứng viên mở camera trong suốt quá trình thi tuyển online',
        candidates_json: JSON.stringify([
            { candidate_id: 'cand-uv01', candidate_code: 'UV-2024-001', full_name: 'Trần Văn Minh', apply_position_name: 'Nhân viên Kiểm thử', note: 'Kiểm tra đường truyền internet' }
        ]),
        council_json: JSON.stringify([
            { employee_id: 'emp-kt-01', employee_code: 'NV-2024-105', full_name: 'Phạm Thị Mai', position_name: 'Trưởng Phòng Kiểm thử', is_decision_maker: 1 }
        ]),
        tests_json: JSON.stringify([
            { test_name: 'Bài thi Kiểm thử phần mềm (QA/QC Test)', expected_score: 75, duration_minutes: 60, exam_file_name: 'De_thi_KiemThu_QA_V2.pdf', answer_file_name: 'Dap_an_KiemThu_QA_V2.pdf' }
        ]),
        status: 'Đã lên lịch'
    }
];

const INITIAL_DEPARTMENTS = [
    { id: 'dept-bgd', department_id: 'dept-bgd', department_code: 'BGD', department_name: 'Ban Giám Đốc', description: 'Ban Giám đốc BRAVO Software JSC', manager_name: 'Bùi Xuân Thức', target_headcount: 4, current_count: 3, outside_request_count: 0, parent_department_id: null, status: 1 },
    { id: 'dept-hr', department_id: 'dept-hr', department_code: 'PHR', department_name: 'Phòng Nhân sự', description: 'Quản lý Nhân sự, C&B và Tuyển dụng', manager_name: 'Trần Thị Thu Hà', target_headcount: 8, current_count: 8, outside_request_count: 0, parent_department_id: null, status: 1 },
    { id: 'dept-pmk', department_id: 'dept-pmk', department_code: 'PMK', department_name: 'Phòng Marketing', description: 'Marketing, Truyền thông & Quảng bá thương hiệu', manager_name: 'Đỗ Thị Thu Trang', target_headcount: 15, current_count: 15, outside_request_count: 1, parent_department_id: null, status: 1 },
    { id: 'dept-kd', department_id: 'dept-kd', department_code: 'PKD', department_name: 'Phòng Kinh doanh', description: 'Kinh doanh & Phát triển Thị trường ERP', manager_name: 'Phạm Quốc Tuấn', target_headcount: 20, current_count: 17, outside_request_count: 0, parent_department_id: null, status: 1 },
    { id: 'dept-gptv', department_id: 'dept-gptv', department_code: 'GPTV', department_name: 'Phòng Giải pháp tư vấn', description: 'Tư vấn Giải pháp Quản trị Doanh nghiệp ERP', manager_name: 'Hoàng Minh Trí', target_headcount: 10, current_count: 8, outside_request_count: 0, parent_department_id: null, status: 1 },
    { id: 'dept-kttk', department_id: 'dept-kttk', department_code: 'KTTK', department_name: 'Khối Kỹ thuật triển khai', description: 'Khối chỉ đạo Triển khai & Cài đặt hệ thống ERP', manager_name: 'Trịnh Đình Dũng', target_headcount: 2, current_count: 2, outside_request_count: 0, parent_department_id: null, status: 1 },
    { id: 'dept-kttk-1', department_id: 'dept-kttk-1', department_code: 'KTTK1', department_name: 'Phòng KTTK 1', description: 'Phòng Kỹ thuật Triển khai Dự án Miền Bắc', manager_name: 'Nguyễn Văn Hùng', target_headcount: 12, current_count: 12, outside_request_count: 0, parent_department_id: 'dept-kttk', parent_department_name: 'Khối Kỹ thuật triển khai', status: 1 },
    { id: 'dept-kttk-2', department_id: 'dept-kttk-2', department_code: 'KTTK2', department_name: 'Phòng KTTK 2', description: 'Phòng Kỹ thuật Triển khai Dự án Miền Trung & Nam', manager_name: 'Đặng Việt Khoa', target_headcount: 15, current_count: 12, outside_request_count: 0, parent_department_id: 'dept-kttk', parent_department_name: 'Khối Kỹ thuật triển khai', status: 1 },
    { id: 'dept-ptnv', department_id: 'dept-ptnv', department_code: 'PTNV', department_name: 'Phòng Phân tích nghiệp vụ', description: 'Phân tích Quy trình Nghiệp vụ & Thiết kế Luồng (BA)', manager_name: 'Mai Văn Vinh', target_headcount: 6, current_count: 6, outside_request_count: 0, parent_department_id: null, status: 1 },
    { id: 'dept-ptsp', department_id: 'dept-ptsp', department_code: 'PTSP', department_name: 'Phòng Phát triển sản phẩm', description: 'Nghiên cứu & Thiết kế Tính năng Sản phẩm BRAVO 10', manager_name: 'Trịnh Thái Sơn', target_headcount: 14, current_count: 11, outside_request_count: 0, parent_department_id: null, status: 1 },
    { id: 'dept-kcn', department_id: 'dept-kcn', department_code: 'KCN', department_name: 'Khối Công nghệ', description: 'Khối R&D và Định hướng Công nghệ Phần mềm', manager_name: 'Lê Hoàng Nam', target_headcount: 2, current_count: 2, outside_request_count: 0, parent_department_id: null, status: 1 },
    { id: 'dept-cloud', department_id: 'dept-cloud', department_code: 'CLOUD', department_name: 'Phòng Cloud và Hạ tầng', description: 'Quản trị Nền tảng Cloud, Server & DevOps', manager_name: 'Hoàng Trọng Nghĩa', target_headcount: 10, current_count: 7, outside_request_count: 0, parent_department_id: 'dept-kcn', parent_department_name: 'Khối Công nghệ', status: 1 },
    { id: 'dept-kt', department_id: 'dept-kt', department_code: 'PKT', department_name: 'Phòng Kiểm thử', description: 'Kiểm thử Tính năng, Chất lượng & Hiệu năng ERP (QA/QC)', manager_name: 'Phạm Thị Mai', target_headcount: 12, current_count: 9, outside_request_count: 0, parent_department_id: null, status: 1 },
    { id: 'dept-bh', department_id: 'dept-bh', department_code: 'PBH', department_name: 'Phòng Bảo hành', description: 'Bảo hành, Hỗ trợ Kỹ thuật & Chăm sóc Sau Bán hàng', manager_name: 'Cao Văn Cường', target_headcount: 8, current_count: 8, outside_request_count: 0, parent_department_id: null, status: 1 }
];

const INITIAL_POSITIONS = [
    // Ban Giám Đốc (Bộ phận cấp cao nhất, parent = null)
    { id: 'pos-bgd-ceo', position_id: 'pos-bgd-ceo', position_code: 'BGD_CEO', position_name: 'Giám đốc', department_id: 'dept-bgd', department_name: 'Ban Giám Đốc', target_headcount: 1, current_count: 1, status: 1 },
    { id: 'pos-bgd-vp', position_id: 'pos-bgd-vp', position_code: 'BGD_VP', position_name: 'Phó Giám đốc', department_id: 'dept-bgd', department_name: 'Ban Giám Đốc', target_headcount: 2, current_count: 2, status: 1 },
    { id: 'pos-bgd-asst', position_id: 'pos-bgd-asst', position_code: 'BGD_ASST', position_name: 'Trợ lý Giám đốc', department_id: 'dept-bgd', department_name: 'Ban Giám Đốc', target_headcount: 1, current_count: 1, status: 1 },

    // Phòng Nhân sự
    { id: 'pos-hr-mgr', position_id: 'pos-hr-mgr', position_code: 'PHR_MGR', position_name: 'Trưởng Phòng Nhân sự', department_id: 'dept-hr', department_name: 'Phòng Nhân sự', target_headcount: 1, current_count: 1, status: 1 },
    { id: 'pos-hr-lead', position_id: 'pos-hr-lead', position_code: 'PHR_LEAD', position_name: 'Trưởng Nhóm Nhân sự', department_id: 'dept-hr', department_name: 'Phòng Nhân sự', target_headcount: 2, current_count: 2, status: 1 },
    { id: 'pos-hr-emp', position_id: 'pos-hr-emp', position_code: 'PHR_EMP', position_name: 'Nhân viên Nhân sự', department_id: 'dept-hr', department_name: 'Phòng Nhân sự', target_headcount: 5, current_count: 5, status: 1 },

    // Phòng Marketing
    { id: 'pos-mkt-mgr', position_id: 'pos-mkt-mgr', position_code: 'PMK_MGR', position_name: 'Trưởng Phòng Marketing', department_id: 'dept-pmk', department_name: 'Phòng Marketing', target_headcount: 1, current_count: 1, status: 1 },
    { id: 'pos-mkt-lead', position_id: 'pos-mkt-lead', position_code: 'PMK_LEAD', position_name: 'Trưởng Nhóm Marketing', department_id: 'dept-pmk', department_name: 'Phòng Marketing', target_headcount: 2, current_count: 2, status: 1 },
    { id: 'pos-mkt-emp', position_id: 'pos-mkt-emp', position_code: 'PMK_EMP', position_name: 'Nhân viên Marketing', department_id: 'dept-pmk', department_name: 'Phòng Marketing', target_headcount: 12, current_count: 12, status: 1 },

    // Phòng Kinh doanh
    { id: 'pos-kd-mgr', position_id: 'pos-kd-mgr', position_code: 'PKD_MGR', position_name: 'Trưởng Phòng Kinh doanh', department_id: 'dept-kd', department_name: 'Phòng Kinh doanh', target_headcount: 1, current_count: 1, status: 1 },
    { id: 'pos-kd-lead', position_id: 'pos-kd-lead', position_code: 'PKD_LEAD', position_name: 'Trưởng Nhóm Kinh doanh', department_id: 'dept-kd', department_name: 'Phòng Kinh doanh', target_headcount: 2, current_count: 2, status: 1 },
    { id: 'pos-kd-emp', position_id: 'pos-kd-emp', position_code: 'PKD_EMP', position_name: 'Nhân viên Kinh doanh', department_id: 'dept-kd', department_name: 'Phòng Kinh doanh', target_headcount: 17, current_count: 14, status: 1 },

    // Khối KTTK
    { id: 'pos-kttk-dir', position_id: 'pos-kttk-dir', position_code: 'KTTK_DIR', position_name: 'Trưởng Khối Kỹ thuật triển khai', department_id: 'dept-kttk', department_name: 'Khối Kỹ thuật triển khai', target_headcount: 1, current_count: 1, status: 1 },
    { id: 'pos-kttk-dep', position_id: 'pos-kttk-dep', position_code: 'KTTK_DEP', position_name: 'Phó Khối Kỹ thuật triển khai', department_id: 'dept-kttk', department_name: 'Khối Kỹ thuật triển khai', target_headcount: 1, current_count: 1, status: 1 },

    // Phòng KTTK 1
    { id: 'pos-kttk1-mgr', position_id: 'pos-kttk1-mgr', position_code: 'KTTK1_MGR', position_name: 'Trưởng Phòng KTTK 1', department_id: 'dept-kttk-1', department_name: 'Phòng KTTK 1', target_headcount: 1, current_count: 1, status: 1 },
    { id: 'pos-kttk1-lead', position_id: 'pos-kttk1-lead', position_code: 'KTTK1_LEAD', position_name: 'Trưởng Nhóm KTTK 1', department_id: 'dept-kttk-1', department_name: 'Phòng KTTK 1', target_headcount: 2, current_count: 2, status: 1 },
    { id: 'pos-kttk1-emp', position_id: 'pos-kttk1-emp', position_code: 'KTTK1_EMP', position_name: 'Nhân viên KTTK 1', department_id: 'dept-kttk-1', department_name: 'Phòng KTTK 1', target_headcount: 9, current_count: 9, status: 1 },

    // Khối Công nghệ
    { id: 'pos-kcn-dir', position_id: 'pos-kcn-dir', position_code: 'KCN_DIR', position_name: 'Trưởng Khối Công nghệ', department_id: 'dept-kcn', department_name: 'Khối Công nghệ', target_headcount: 1, current_count: 1, status: 1 },
    { id: 'pos-kcn-dep', position_id: 'pos-kcn-dep', position_code: 'KCN_DEP', position_name: 'Phó Khối Công nghệ', department_id: 'dept-kcn', department_name: 'Khối Công nghệ', target_headcount: 1, current_count: 1, status: 1 },

    // Phòng Cloud và Hạ tầng
    { id: 'pos-cloud-mgr', position_id: 'pos-cloud-mgr', position_code: 'CLOUD_MGR', position_name: 'Trưởng Phòng Cloud và Hạ tầng', department_id: 'dept-cloud', department_name: 'Phòng Cloud và Hạ tầng', target_headcount: 1, current_count: 1, status: 1 },
    { id: 'pos-cloud-lead', position_id: 'pos-cloud-lead', position_code: 'CLOUD_LEAD', position_name: 'Trưởng Nhóm Cloud và Hạ tầng', department_id: 'dept-cloud', department_name: 'Phòng Cloud và Hạ tầng', target_headcount: 2, current_count: 2, status: 1 },
    { id: 'pos-cloud-emp', position_id: 'pos-cloud-emp', position_code: 'CLOUD_EMP', position_name: 'Nhân viên Cloud và Hạ tầng', department_id: 'dept-cloud', department_name: 'Phòng Cloud và Hạ tầng', target_headcount: 7, current_count: 4, status: 1 },

    // Phòng Kiểm thử
    { id: 'pos-kt-mgr', position_id: 'pos-kt-mgr', position_code: 'PKT_MGR', position_name: 'Trưởng Phòng Kiểm thử', department_id: 'dept-kt', department_name: 'Phòng Kiểm thử', target_headcount: 1, current_count: 1, status: 1 },
    { id: 'pos-kt-lead', position_id: 'pos-kt-lead', position_code: 'PKT_LEAD', position_name: 'Trưởng Nhóm Kiểm thử', department_id: 'dept-kt', department_name: 'Phòng Kiểm thử', target_headcount: 2, current_count: 2, status: 1 },
    { id: 'pos-kt-emp', position_id: 'pos-kt-emp', position_code: 'PKT_EMP', position_name: 'Nhân viên Kiểm thử', department_id: 'dept-kt', department_name: 'Phòng Kiểm thử', target_headcount: 9, current_count: 6, status: 1 }
];

export const INITIAL_QUOTAS = [
    {
        quota_id: 'quota-01',
        id: 'quota-01',
        quota_code: 'ĐB/0726-0001',
        effective_date: new Date('2026-07-01').getTime(),
        department_id: 'dept-bh',
        department_name: 'Bộ phận Kinh doanh',
        creator_name: 'HR01: HR Test 01',
        target_headcount: 11,
        max_capacity: 15,
        current_headcount: 9,
        budget: 170000000,
        description: 'Định biên quý 3, quý 4 - Bộ phận Kinh doanh & Dự án ERP',
        status: 'Đã hoàn thiện'
    },
    {
        quota_id: 'quota-02',
        id: 'quota-02',
        quota_code: 'ĐB/0726-0002',
        effective_date: new Date('2026-07-01').getTime(),
        department_id: 'dept-hr',
        department_name: 'Phòng Nhân sự',
        creator_name: 'HR01: HR Test 01',
        target_headcount: 7,
        max_capacity: 10,
        current_headcount: 6,
        budget: 110000000,
        description: 'Định biên Nhân sự & Đào tạo nội bộ BRAVO 2026',
        status: 'Đã hoàn thiện'
    },
    {
        quota_id: 'quota-03',
        id: 'quota-03',
        quota_code: 'ĐB/0726-0003',
        effective_date: new Date('2026-07-01').getTime(),
        department_id: 'dept-kt',
        department_name: 'Phòng Kế toán',
        creator_name: 'HR01: HR Test 01',
        target_headcount: 6,
        max_capacity: 8,
        current_headcount: 5,
        budget: 95000000,
        description: 'Định biên Phòng Kế toán & Tài chính 2026',
        status: 'Đã hoàn thiện'
    },
    {
        quota_id: 'quota-04',
        id: 'quota-04',
        quota_code: 'ĐB/0726-0004',
        effective_date: new Date('2026-07-01').getTime(),
        department_id: 'dept-cloud',
        department_name: 'Khối Công nghệ & Phát triển Phần mềm',
        creator_name: 'HR01: HR Test 01',
        target_headcount: 10,
        max_capacity: 15,
        current_headcount: 8,
        budget: 210000000,
        description: 'Định biên Khối Công nghệ Cloud & Hạ tầng phần mềm',
        status: 'Đã hoàn thiện'
    }
];

const INITIAL_EMPLOYEES = [
    // --- BAN GIÁM ĐỐC (3 người) ---
    { id: 'emp-bgd-01', employee_id: 'emp-bgd-01', employee_code: 'NV-2024-001', full_name: 'Bùi Xuân Thức', gender: 'Nam', date_of_birth: '1975-04-12', phone: '0988123456', email: 'thuc.bx@bravo.com.vn', department_id: 'dept-bgd', department_name: 'Ban Giám Đốc', position_name: 'Tổng Giám Đốc', level: 'Ban Giám Đốc', manager_id: null, manager_name: null, employment_status: 'WORKING', is_active: 1 },
    { id: 'emp-bgd-02', employee_id: 'emp-bgd-02', employee_code: 'NV-2024-002', full_name: 'Phạm Thị Thanh Vân', gender: 'Nữ', date_of_birth: '1980-08-25', phone: '0912345678', email: 'van.pt@bravo.com.vn', department_id: 'dept-bgd', department_name: 'Ban Giám Đốc', position_name: 'Phó Tổng Giám Đốc', level: 'Ban Giám Đốc', manager_id: 'emp-bgd-01', manager_name: 'Bùi Xuân Thức', employment_status: 'WORKING', is_active: 1 },
    { id: 'emp-bgd-03', employee_id: 'emp-bgd-03', employee_code: 'NV-2024-003', full_name: 'Trương Minh Hoàng', gender: 'Nam', date_of_birth: '1990-11-15', phone: '0903456789', email: 'hoang.tm@bravo.com.vn', department_id: 'dept-bgd', department_name: 'Ban Giám Đốc', position_name: 'Phó Tổng Giám Đốc', level: 'Ban Giám Đốc', manager_id: 'emp-bgd-01', manager_name: 'Bùi Xuân Thức', employment_status: 'WORKING', is_active: 1 },

    // --- 1. PHÒNG NHÂN SỰ ---
    { id: 'emp-hr-01', employee_id: 'emp-hr-01', employee_code: 'NV-2024-004', full_name: 'Trần Thị Thu Hà', gender: 'Nữ', date_of_birth: '1988-09-20', phone: '0977234567', email: 'ha.tran@bravo.com.vn', department_id: 'dept-hr', department_name: 'Phòng Nhân sự', position_name: 'Trưởng phòng Nhân sự', level: 'Trưởng phòng', manager_id: 'emp-bgd-01', manager_name: 'Bùi Xuân Thức', employment_status: 'WORKING', is_active: 1 },
    { id: 'emp-hr-02', employee_id: 'emp-hr-02', employee_code: 'NV-2024-005', full_name: 'Nguyễn Thùy Linh', gender: 'Nữ', date_of_birth: '1992-03-14', phone: '0966123456', email: 'linh.nt@bravo.com.vn', department_id: 'dept-hr', department_name: 'Phòng Nhân sự', position_name: 'Trưởng nhóm Tuyển dụng', level: 'Trưởng nhóm', manager_id: 'emp-hr-01', manager_name: 'Trần Thị Thu Hà', employment_status: 'WORKING', is_active: 1 },
    { id: 'emp-hr-04', employee_id: 'emp-hr-04', employee_code: 'NV-2024-007', full_name: 'Đỗ Phương Thảo', gender: 'Nữ', date_of_birth: '1994-01-30', phone: '0918273645', email: 'thao.dp@bravo.com.vn', department_id: 'dept-hr', department_name: 'Phòng Nhân sự', position_name: 'Trưởng nhóm C&B & Đào tạo', level: 'Trưởng nhóm', manager_id: 'emp-hr-01', manager_name: 'Trần Thị Thu Hà', employment_status: 'WORKING', is_active: 1 },
    { id: 'emp-hr-03', employee_id: 'emp-hr-03', employee_code: 'NV-2024-006', full_name: 'Hoàng Bích Ngọc', gender: 'Nữ', date_of_birth: '1995-07-22', phone: '0934567890', email: 'ngoc.hb@bravo.com.vn', department_id: 'dept-hr', department_name: 'Phòng Nhân sự', position_name: 'Chuyên viên Tuyển dụng', level: 'Nhân viên', manager_id: 'emp-hr-02', manager_name: 'Nguyễn Thùy Linh', employment_status: 'WORKING', is_active: 1 },
    { id: 'emp-hr-05', employee_id: 'emp-hr-05', employee_code: 'NV-2024-008', full_name: 'Vũ Hoài Nam', gender: 'Nam', date_of_birth: '1993-06-18', phone: '0987654321', email: 'nam.vh@bravo.com.vn', department_id: 'dept-hr', department_name: 'Phòng Nhân sự', position_name: 'Chuyên viên Đào tạo', level: 'Nhân viên', manager_id: 'emp-hr-04', manager_name: 'Đỗ Phương Thảo', employment_status: 'WORKING', is_active: 1 },
    { id: 'emp-hr-06', employee_id: 'emp-hr-06', employee_code: 'NV-2024-009', full_name: 'Lê Khánh Huyền', gender: 'Nữ', date_of_birth: '1997-12-05', phone: '0922334455', email: 'huyen.lk@bravo.com.vn', department_id: 'dept-hr', department_name: 'Phòng Nhân sự', position_name: 'Nhân viên Hành chính', level: 'Nhân viên', manager_id: 'emp-hr-04', manager_name: 'Đỗ Phương Thảo', employment_status: 'WORKING', is_active: 1 },

    // --- 2. PHÒNG MARKETING ---
    { id: 'emp-mkt-01', employee_id: 'emp-mkt-01', employee_code: 'NV-2024-012', full_name: 'Đỗ Thị Thu Trang', gender: 'Nữ', date_of_birth: '1987-05-18', phone: '0966334455', email: 'trang.dtt@bravo.com.vn', department_id: 'dept-pmk', department_name: 'Phòng Marketing', position_name: 'Trưởng phòng Marketing', level: 'Trưởng phòng', manager_id: 'emp-bgd-02', manager_name: 'Phạm Thị Thanh Vân', employment_status: 'WORKING', is_active: 1 },
    { id: 'emp-mkt-02', employee_id: 'emp-mkt-02', employee_code: 'NV-2024-013', full_name: 'Nguyễn Hoàng Anh', gender: 'Nam', date_of_birth: '1991-03-27', phone: '0977445566', email: 'anh.nh@bravo.com.vn', department_id: 'dept-pmk', department_name: 'Phòng Marketing', position_name: 'Trưởng nhóm Digital Marketing', level: 'Trưởng nhóm', manager_id: 'emp-mkt-01', manager_name: 'Đỗ Thị Thu Trang', employment_status: 'WORKING', is_active: 1 },
    { id: 'emp-mkt-03', employee_id: 'emp-mkt-03', employee_code: 'NV-2024-014', full_name: 'Lê Minh Triết', gender: 'Nam', date_of_birth: '1992-09-14', phone: '0988556677', email: 'triet.lm@bravo.com.vn', department_id: 'dept-pmk', department_name: 'Phòng Marketing', position_name: 'Trưởng nhóm Content & Brand', level: 'Trưởng nhóm', manager_id: 'emp-mkt-01', manager_name: 'Đỗ Thị Thu Trang', employment_status: 'WORKING', is_active: 1 },
    { id: 'emp-mkt-04', employee_id: 'emp-mkt-04', employee_code: 'NV-2024-015', full_name: 'Phạm Ngọc Bảo', gender: 'Nam', date_of_birth: '1994-11-08', phone: '0911667788', email: 'bao.pn@bravo.com.vn', department_id: 'dept-pmk', department_name: 'Phòng Marketing', position_name: 'Chuyên viên SEO & Ads', level: 'Nhân viên', manager_id: 'emp-mkt-02', manager_name: 'Nguyễn Hoàng Anh', employment_status: 'WORKING', is_active: 1 },
    { id: 'emp-mkt-05', employee_id: 'emp-mkt-05', employee_code: 'NV-2024-016', full_name: 'Vũ Phương Thảo', gender: 'Nữ', date_of_birth: '1995-04-02', phone: '0922778899', email: 'thao.vp@bravo.com.vn', department_id: 'dept-pmk', department_name: 'Phòng Marketing', position_name: 'Chuyên viên Content Marketing', level: 'Nhân viên', manager_id: 'emp-mkt-03', manager_name: 'Lê Minh Triết', employment_status: 'WORKING', is_active: 1 },

    // --- 3. PHÒNG KINH DOANH ---
    { id: 'emp-kd-01', employee_id: 'emp-kd-01', employee_code: 'NV-2024-027', full_name: 'Phạm Quốc Tuấn', gender: 'Nam', date_of_birth: '1985-10-10', phone: '0911223344', email: 'tuan.pq@bravo.com.vn', department_id: 'dept-kd', department_name: 'Phòng Kinh doanh', position_name: 'Trưởng phòng Kinh doanh', level: 'Trưởng phòng', manager_id: 'emp-bgd-02', manager_name: 'Phạm Thị Thanh Vân', employment_status: 'WORKING', is_active: 1 },
    { id: 'emp-kd-02', employee_id: 'emp-kd-02', employee_code: 'NV-2024-028', full_name: 'Đặng Đình Hùng', gender: 'Nam', date_of_birth: '1989-04-05', phone: '0933445566', email: 'hung.dd@bravo.com.vn', department_id: 'dept-kd', department_name: 'Phòng Kinh doanh', position_name: 'Trưởng nhóm Kinh doanh ERP 1', level: 'Trưởng nhóm', manager_id: 'emp-kd-01', manager_name: 'Phạm Quốc Tuấn', employment_status: 'WORKING', is_active: 1 },
    { id: 'emp-kd-03', employee_id: 'emp-kd-03', employee_code: 'NV-2024-029', full_name: 'Nguyễn Văn Thanh', gender: 'Nam', date_of_birth: '1990-08-19', phone: '0977889900', email: 'thanh.nv@bravo.com.vn', department_id: 'dept-kd', department_name: 'Phòng Kinh doanh', position_name: 'Trưởng nhóm Kinh doanh ERP 2', level: 'Trưởng nhóm', manager_id: 'emp-kd-01', manager_name: 'Phạm Quốc Tuấn', employment_status: 'WORKING', is_active: 1 },
    { id: 'emp-kd-04', employee_id: 'emp-kd-04', employee_code: 'NV-2024-030', full_name: 'Trần Đức Thắng', gender: 'Nam', date_of_birth: '1993-01-25', phone: '0988990011', email: 'thang.td@bravo.com.vn', department_id: 'dept-kd', department_name: 'Phòng Kinh doanh', position_name: 'Chuyên viên Kinh doanh ERP', level: 'Nhân viên', manager_id: 'emp-kd-02', manager_name: 'Đặng Đình Hùng', employment_status: 'WORKING', is_active: 1 },
    { id: 'emp-kd-05', employee_id: 'emp-kd-05', employee_code: 'NV-2024-031', full_name: 'Lê Thị Hải Yến', gender: 'Nữ', date_of_birth: '1994-06-30', phone: '0911002233', email: 'yen.lth@bravo.com.vn', department_id: 'dept-kd', department_name: 'Phòng Kinh doanh', position_name: 'Chuyên viên Tư vấn ERP', level: 'Nhân viên', manager_id: 'emp-kd-03', manager_name: 'Nguyễn Văn Thanh', employment_status: 'WORKING', is_active: 1 },

    // --- 4. PHÒNG GIẢI PHÁP TƯ VẤN ---
    { id: 'emp-gptv-01', employee_id: 'emp-gptv-01', employee_code: 'NV-2024-044', full_name: 'Hoàng Minh Trí', gender: 'Nam', date_of_birth: '1984-06-15', phone: '0966991122', email: 'tri.hm@bravo.com.vn', department_id: 'dept-gptv', department_name: 'Phòng Giải pháp tư vấn', position_name: 'Trưởng phòng GPTV', level: 'Trưởng phòng', manager_id: 'emp-bgd-03', manager_name: 'Trương Minh Hoàng', employment_status: 'WORKING', is_active: 1 },
    { id: 'emp-gptv-02', employee_id: 'emp-gptv-02', employee_code: 'NV-2024-045', full_name: 'Đào Bích Liên', gender: 'Nữ', date_of_birth: '1989-11-20', phone: '0977002233', email: 'lien.db@bravo.com.vn', department_id: 'dept-gptv', department_name: 'Phòng Giải pháp tư vấn', position_name: 'Trưởng nhóm Tư vấn 1', level: 'Trưởng nhóm', manager_id: 'emp-gptv-01', manager_name: 'Hoàng Minh Trí', employment_status: 'WORKING', is_active: 1 },
    { id: 'emp-gptv-03', employee_id: 'emp-gptv-03', employee_code: 'NV-2024-046', full_name: 'Nguyễn Quang Huy', gender: 'Nam', date_of_birth: '1992-03-08', phone: '0988113344', email: 'huy.nq@bravo.com.vn', department_id: 'dept-gptv', department_name: 'Phòng Giải pháp tư vấn', position_name: 'Trưởng nhóm Tư vấn 2', level: 'Trưởng nhóm', manager_id: 'emp-gptv-01', manager_name: 'Hoàng Minh Trí', employment_status: 'WORKING', is_active: 1 },
    { id: 'emp-gptv-04', employee_id: 'emp-gptv-04', employee_code: 'NV-2024-047', full_name: 'Lê Thu Hà', gender: 'Nữ', date_of_birth: '1994-08-14', phone: '0911224455', email: 'ha.lt@bravo.com.vn', department_id: 'dept-gptv', department_name: 'Phòng Giải pháp tư vấn', position_name: 'Chuyên viên Tư vấn ERP', level: 'Nhân viên', manager_id: 'emp-gptv-02', manager_name: 'Đào Bích Liên', employment_status: 'WORKING', is_active: 1 },

    // --- 5. KHỐI KỸ THUẬT TRIỂN KHAI ---
    { id: 'emp-kttk-01', employee_id: 'emp-kttk-01', employee_code: 'NV-2024-052', full_name: 'Trịnh Đình Dũng', gender: 'Nam', date_of_birth: '1981-02-14', phone: '0966778899', email: 'dung.td@bravo.com.vn', department_id: 'dept-kttk', department_name: 'Khối Kỹ thuật triển khai', position_name: 'Trưởng khối KTTK', level: 'Trưởng phòng', manager_id: 'emp-bgd-01', manager_name: 'Bùi Xuân Thức', employment_status: 'WORKING', is_active: 1 },
    { id: 'emp-kttk-02', employee_id: 'emp-kttk-02', employee_code: 'NV-2024-053', full_name: 'Nguyễn Hoàng Minh', gender: 'Nam', date_of_birth: '1986-07-22', phone: '0977889900', email: 'minh.nh@bravo.com.vn', department_id: 'dept-kttk', department_name: 'Khối Kỹ thuật triển khai', position_name: 'Trưởng nhóm Kỹ thuật 1', level: 'Trưởng nhóm', manager_id: 'emp-kttk-01', manager_name: 'Trịnh Đình Dũng', employment_status: 'WORKING', is_active: 1 },
    { id: 'emp-kttk-03', employee_id: 'emp-kttk-03', employee_code: 'NV-2024-053b', full_name: 'Vũ Đình Nam', gender: 'Nam', date_of_birth: '1988-11-05', phone: '0988776655', email: 'nam.vd@bravo.com.vn', department_id: 'dept-kttk', department_name: 'Khối Kỹ thuật triển khai', position_name: 'Trưởng nhóm Quản trị Dự án', level: 'Trưởng nhóm', manager_id: 'emp-kttk-01', manager_name: 'Trịnh Đình Dũng', employment_status: 'WORKING', is_active: 1 },

    // --- 6. PHÒNG KTTK 1 ---
    { id: 'emp-kttk1-01', employee_id: 'emp-kttk1-01', employee_code: 'NV-2024-054', full_name: 'Nguyễn Văn Hùng', gender: 'Nam', date_of_birth: '1987-10-01', phone: '0988990011', email: 'hung.nv@bravo.com.vn', department_id: 'dept-kttk-1', department_name: 'Phòng KTTK 1', position_name: 'Trưởng phòng KTTK 1', level: 'Trưởng phòng', manager_id: 'emp-kttk-01', manager_name: 'Trịnh Đình Dũng', employment_status: 'WORKING', is_active: 1 },
    { id: 'emp-kttk1-02', employee_id: 'emp-kttk1-02', employee_code: 'NV-2024-055', full_name: 'Lê Đình Toàn', gender: 'Nam', date_of_birth: '1991-04-18', phone: '0911001122', email: 'toan.ld@bravo.com.vn', department_id: 'dept-kttk-1', department_name: 'Phòng KTTK 1', position_name: 'Trưởng nhóm Triển khai 1', level: 'Trưởng nhóm', manager_id: 'emp-kttk1-01', manager_name: 'Nguyễn Văn Hùng', employment_status: 'WORKING', is_active: 1 },
    { id: 'emp-kttk1-03', employee_id: 'emp-kttk1-03', employee_code: 'NV-2024-056', full_name: 'Phạm Thị Lan', gender: 'Nữ', date_of_birth: '1993-09-09', phone: '0922112233', email: 'lan.pt@bravo.com.vn', department_id: 'dept-kttk-1', department_name: 'Phòng KTTK 1', position_name: 'Trưởng nhóm Triển khai 2', level: 'Trưởng nhóm', manager_id: 'emp-kttk1-01', manager_name: 'Nguyễn Văn Hùng', employment_status: 'WORKING', is_active: 1 },
    { id: 'emp-kttk1-04', employee_id: 'emp-kttk1-04', employee_code: 'NV-2024-057', full_name: 'Vũ Quốc Khánh', gender: 'Nam', date_of_birth: '1994-12-03', phone: '0933223344', email: 'khanh.vq@bravo.com.vn', department_id: 'dept-kttk-1', department_name: 'Phòng KTTK 1', position_name: 'Chuyên viên Triển khai ERP', level: 'Nhân viên', manager_id: 'emp-kttk1-02', manager_name: 'Lê Đình Toàn', employment_status: 'WORKING', is_active: 1 },

    // --- 7. PHÒNG KTTK 2 ---
    { id: 'emp-kttk2-01', employee_id: 'emp-kttk2-01', employee_code: 'NV-2024-066', full_name: 'Đặng Việt Khoa', gender: 'Nam', date_of_birth: '1986-03-12', phone: '0944112233', email: 'khoa.dv@bravo.com.vn', department_id: 'dept-kttk-2', department_name: 'Phòng KTTK 2', position_name: 'Trưởng phòng KTTK 2', level: 'Trưởng phòng', manager_id: 'emp-kttk-01', manager_name: 'Trịnh Đình Dũng', employment_status: 'WORKING', is_active: 1 },
    { id: 'emp-kttk2-02', employee_id: 'emp-kttk2-02', employee_code: 'NV-2024-067', full_name: 'Lê Thị Bích Ngọc', gender: 'Nữ', date_of_birth: '1990-09-05', phone: '0955223344', email: 'ngoc.ltb@bravo.com.vn', department_id: 'dept-kttk-2', department_name: 'Phòng KTTK 2', position_name: 'Trưởng nhóm Triển khai Miền Nam 1', level: 'Trưởng nhóm', manager_id: 'emp-kttk2-01', manager_name: 'Đặng Việt Khoa', employment_status: 'WORKING', is_active: 1 },
    { id: 'emp-kttk2-03', employee_id: 'emp-kttk2-03', employee_code: 'NV-2024-068', full_name: 'Phùng Minh Nhật', gender: 'Nam', date_of_birth: '1992-06-20', phone: '0966334455', email: 'nhat.pm@bravo.com.vn', department_id: 'dept-kttk-2', department_name: 'Phòng KTTK 2', position_name: 'Trưởng nhóm Triển khai Miền Nam 2', level: 'Trưởng nhóm', manager_id: 'emp-kttk2-01', manager_name: 'Đặng Việt Khoa', employment_status: 'WORKING', is_active: 1 },
    { id: 'emp-kttk2-04', employee_id: 'emp-kttk2-04', employee_code: 'NV-2024-069', full_name: 'Nguyễn Huy Hoàng', gender: 'Nam', date_of_birth: '1994-04-11', phone: '0977445566', email: 'hoang.nh@bravo.com.vn', department_id: 'dept-kttk-2', department_name: 'Phòng KTTK 2', position_name: 'Chuyên viên Triển khai ERP', level: 'Nhân viên', manager_id: 'emp-kttk2-02', manager_name: 'Lê Thị Bích Ngọc', employment_status: 'WORKING', is_active: 1 },

    // --- 8. PHÒNG PHÂN TÍCH NGHIỆP VỤ ---
    { id: 'emp-ptnv-01', employee_id: 'emp-ptnv-01', employee_code: 'NV-2024-078', full_name: 'Mai Văn Vinh', gender: 'Nam', date_of_birth: '1987-07-07', phone: '0988334455', email: 'vinh.mv@bravo.com.vn', department_id: 'dept-ptnv', department_name: 'Phòng Phân tích nghiệp vụ', position_name: 'Trưởng phòng PTNV', level: 'Trưởng phòng', manager_id: 'emp-bgd-03', manager_name: 'Trương Minh Hoàng', employment_status: 'WORKING', is_active: 1 },
    { id: 'emp-ptnv-02', employee_id: 'emp-ptnv-02', employee_code: 'NV-2024-079', full_name: 'Nguyễn Thu Trang', gender: 'Nữ', date_of_birth: '1992-02-14', phone: '0911445566', email: 'trang.nt@bravo.com.vn', department_id: 'dept-ptnv', department_name: 'Phòng Phân tích nghiệp vụ', position_name: 'Trưởng nhóm BA Tài chính - Kế toán', level: 'Trưởng nhóm', manager_id: 'emp-ptnv-01', manager_name: 'Mai Văn Vinh', employment_status: 'WORKING', is_active: 1 },
    { id: 'emp-ptnv-03', employee_id: 'emp-ptnv-03', employee_code: 'NV-2024-080', full_name: 'Trần Đức Thắng', gender: 'Nam', date_of_birth: '1994-05-22', phone: '0922556677', email: 'thang.td2@bravo.com.vn', department_id: 'dept-ptnv', department_name: 'Phòng Phân tích nghiệp vụ', position_name: 'Trưởng nhóm BA Quản trị Nhân sự', level: 'Trưởng nhóm', manager_id: 'emp-ptnv-01', manager_name: 'Mai Văn Vinh', employment_status: 'WORKING', is_active: 1 },
    { id: 'emp-ptnv-04', employee_id: 'emp-ptnv-04', employee_code: 'NV-2024-081', full_name: 'Vũ Bảo An', gender: 'Nữ', date_of_birth: '1995-10-10', phone: '0933667788', email: 'an.vb@bravo.com.vn', department_id: 'dept-ptnv', department_name: 'Phòng Phân tích nghiệp vụ', position_name: 'Chuyên viên Phân tích Nghiệp vụ (BA)', level: 'Nhân viên', manager_id: 'emp-ptnv-02', manager_name: 'Nguyễn Thu Trang', employment_status: 'WORKING', is_active: 1 },

    // --- 9. PHÒNG PHÁT TRIỂN SẢN PHẨM ---
    { id: 'emp-ptsp-01', employee_id: 'emp-ptsp-01', employee_code: 'NV-2024-084', full_name: 'Trịnh Thái Sơn', gender: 'Nam', date_of_birth: '1986-08-08', phone: '0966990011', email: 'son.tt@bravo.com.vn', department_id: 'dept-ptsp', department_name: 'Phòng Phát triển sản phẩm', position_name: 'Trưởng phòng PTSP', level: 'Trưởng phòng', manager_id: 'emp-bgd-03', manager_name: 'Trương Minh Hoàng', employment_status: 'WORKING', is_active: 1 },
    { id: 'emp-ptsp-02', employee_id: 'emp-ptsp-02', employee_code: 'NV-2024-085', full_name: 'Nguyễn Quang Huy', gender: 'Nam', date_of_birth: '1990-01-19', phone: '0977001122', email: 'huy.nq3@bravo.com.vn', department_id: 'dept-ptsp', department_name: 'Phòng Phát triển sản phẩm', position_name: 'Trưởng nhóm Product Core', level: 'Trưởng nhóm', manager_id: 'emp-ptsp-01', manager_name: 'Trịnh Thái Sơn', employment_status: 'WORKING', is_active: 1 },
    { id: 'emp-ptsp-03', employee_id: 'emp-ptsp-03', employee_code: 'NV-2024-086', full_name: 'Phạm Đức Anh', gender: 'Nam', date_of_birth: '1992-07-27', phone: '0988112233', email: 'anh.pd2@bravo.com.vn', department_id: 'dept-ptsp', department_name: 'Phòng Phát triển sản phẩm', position_name: 'Trưởng nhóm Product Web & Mobile', level: 'Trưởng nhóm', manager_id: 'emp-ptsp-01', manager_name: 'Trịnh Thái Sơn', employment_status: 'WORKING', is_active: 1 },
    { id: 'emp-ptsp-04', employee_id: 'emp-ptsp-04', employee_code: 'NV-2024-087', full_name: 'Lê Thị Yến', gender: 'Nữ', date_of_birth: '1995-10-15', phone: '0911223344', email: 'yen.lt@bravo.com.vn', department_id: 'dept-ptsp', department_name: 'Phòng Phát triển sản phẩm', position_name: 'Lập trình viên ERP Senior', level: 'Nhân viên', manager_id: 'emp-ptsp-02', manager_name: 'Nguyễn Quang Huy', employment_status: 'WORKING', is_active: 1 },

    // --- 10. KHỐI CÔNG NGHỆ ---
    { id: 'emp-kcn-01', employee_id: 'emp-kcn-01', employee_code: 'NV-2024-095', full_name: 'Lê Hoàng Nam', gender: 'Nam', date_of_birth: '1988-05-15', phone: '0911345678', email: 'nam.le@bravo.com.vn', department_id: 'dept-kcn', department_name: 'Khối Công nghệ', position_name: 'Trưởng khối Công nghệ', level: 'Trưởng phòng', manager_id: 'emp-bgd-01', manager_name: 'Bùi Xuân Thức', employment_status: 'WORKING', is_active: 1 },
    { id: 'emp-kcn-02', employee_id: 'emp-kcn-02', employee_code: 'NV-2024-096', full_name: 'Bùi Khánh Lâm', gender: 'Nam', date_of_birth: '1990-02-20', phone: '0922110022', email: 'lam.bk@bravo.com.vn', department_id: 'dept-kcn', department_name: 'Khối Công nghệ', position_name: 'Trưởng nhóm Kiến trúc Nền tảng', level: 'Trưởng nhóm', manager_id: 'emp-kcn-01', manager_name: 'Lê Hoàng Nam', employment_status: 'WORKING', is_active: 1 },
    { id: 'emp-kcn-03', employee_id: 'emp-kcn-03', employee_code: 'NV-2024-096b', full_name: 'Phan Văn Hải', gender: 'Nam', date_of_birth: '1991-06-12', phone: '0933445566', email: 'hai.pv2@bravo.com.vn', department_id: 'dept-kcn', department_name: 'Khối Công nghệ', position_name: 'Trưởng nhóm R&D Công nghệ', level: 'Trưởng nhóm', manager_id: 'emp-kcn-01', manager_name: 'Lê Hoàng Nam', employment_status: 'WORKING', is_active: 1 },
    { id: 'emp-kcn-04', employee_id: 'emp-kcn-04', employee_code: 'NV-2024-096c', full_name: 'Ngô Thị Nga', gender: 'Nữ', date_of_birth: '1996-09-09', phone: '0944556677', email: 'nga.nt2@bravo.com.vn', department_id: 'dept-kcn', department_name: 'Khối Công nghệ', position_name: 'Kỹ sư Nghiên cứu Công nghệ', level: 'Nhân viên', manager_id: 'emp-kcn-02', manager_name: 'Bùi Khánh Lâm', employment_status: 'WORKING', is_active: 1 },

    // --- 11. PHÒNG CLOUD VÀ HẠ TẦNG ---
    { id: 'emp-cloud-01', employee_id: 'emp-cloud-01', employee_code: 'NV-2024-097', full_name: 'Hoàng Trọng Nghĩa', gender: 'Nam', date_of_birth: '1989-10-29', phone: '0933221100', email: 'nghia.ht@bravo.com.vn', department_id: 'dept-cloud', department_name: 'Phòng Cloud và Hạ tầng', position_name: 'Trưởng phòng Cloud & Hạ tầng', level: 'Trưởng phòng', manager_id: 'emp-kcn-01', manager_name: 'Lê Hoàng Nam', employment_status: 'WORKING', is_active: 1 },
    { id: 'emp-cloud-02', employee_id: 'emp-cloud-02', employee_code: 'NV-2024-098', full_name: 'Nguyễn Quốc Bảo', gender: 'Nam', date_of_birth: '1992-07-04', phone: '0944332211', email: 'bao.nq@bravo.com.vn', department_id: 'dept-cloud', department_name: 'Phòng Cloud và Hạ tầng', position_name: 'Trưởng nhóm Cloud Infrastructure', level: 'Trưởng nhóm', manager_id: 'emp-cloud-01', manager_name: 'Hoàng Trọng Nghĩa', employment_status: 'WORKING', is_active: 1 },
    { id: 'emp-cloud-03', employee_id: 'emp-cloud-03', employee_code: 'NV-2024-099', full_name: 'Đỗ Duy Tân', gender: 'Nam', date_of_birth: '1994-03-24', phone: '0955443322', email: 'tan.dd@bravo.com.vn', department_id: 'dept-cloud', department_name: 'Phòng Cloud và Hạ tầng', position_name: 'Trưởng nhóm DevOps & Security', level: 'Trưởng nhóm', manager_id: 'emp-cloud-01', manager_name: 'Hoàng Trọng Nghĩa', employment_status: 'WORKING', is_active: 1 },
    { id: 'emp-cloud-04', employee_id: 'emp-cloud-04', employee_code: 'NV-2024-100', full_name: 'Phạm Minh Nhật', gender: 'Nam', date_of_birth: '1995-11-07', phone: '0966554433', email: 'nhat.pm2@bravo.com.vn', department_id: 'dept-cloud', department_name: 'Phòng Cloud và Hạ tầng', position_name: 'Chuyên viên System Admin', level: 'Nhân viên', manager_id: 'emp-cloud-02', manager_name: 'Nguyễn Quốc Bảo', employment_status: 'WORKING', is_active: 1 },
    { id: 'emp-cloud-05', employee_id: 'emp-cloud-05', employee_code: 'NV-2024-101', full_name: 'Lê Văn Lâm', gender: 'Nam', date_of_birth: '1996-05-13', phone: '0977665544', email: 'lam.lv@bravo.com.vn', department_id: 'dept-cloud', department_name: 'Phòng Cloud và Hạ tầng', position_name: 'Chuyên viên An ninh Mạng', level: 'Nhân viên', manager_id: 'emp-cloud-03', manager_name: 'Đỗ Duy Tân', employment_status: 'WORKING', is_active: 1 },

    // --- 12. PHÒNG KIỂM THỬ ---
    { id: 'emp-kt-01', employee_id: 'emp-kt-01', employee_code: 'NV-2024-104', full_name: 'Phạm Thị Mai', gender: 'Nữ', date_of_birth: '1991-08-22', phone: '0922998877', email: 'mai.pt@bravo.com.vn', department_id: 'dept-kt', department_name: 'Phòng Kiểm thử', position_name: 'Trưởng phòng Kiểm thử', level: 'Trưởng phòng', manager_id: 'emp-kcn-01', manager_name: 'Lê Hoàng Nam', employment_status: 'WORKING', is_active: 1 },
    { id: 'emp-kt-02', employee_id: 'emp-kt-02', employee_code: 'NV-2024-105', full_name: 'Trần Văn Cường', gender: 'Nam', date_of_birth: '1993-09-02', phone: '0933009988', email: 'cuong.tv@bravo.com.vn', department_id: 'dept-kt', department_name: 'Phòng Kiểm thử', position_name: 'Trưởng nhóm Manual Testing', level: 'Trưởng nhóm', manager_id: 'emp-kt-01', manager_name: 'Phạm Thị Mai', employment_status: 'WORKING', is_active: 1 },
    { id: 'emp-kt-03', employee_id: 'emp-kt-03', employee_code: 'NV-2024-106', full_name: 'Nguyễn Thị Lan', gender: 'Nữ', date_of_birth: '1995-04-15', phone: '0944110099', email: 'lan.nt@bravo.com.vn', department_id: 'dept-kt', department_name: 'Phòng Kiểm thử', position_name: 'Trưởng nhóm Automation Testing', level: 'Trưởng nhóm', manager_id: 'emp-kt-01', manager_name: 'Phạm Thị Mai', employment_status: 'WORKING', is_active: 1 },
    { id: 'emp-kt-04', employee_id: 'emp-kt-04', employee_code: 'NV-2024-107', full_name: 'Bùi Xuân Hải', gender: 'Nam', date_of_birth: '1997-03-05', phone: '0955221100', email: 'hai.bx@bravo.com.vn', department_id: 'dept-kt', department_name: 'Phòng Kiểm thử', position_name: 'Chuyên viên QA/QC', level: 'Nhân viên', manager_id: 'emp-kt-02', manager_name: 'Trần Văn Cường', employment_status: 'WORKING', is_active: 1 },
    { id: 'emp-kt-05', employee_id: 'emp-kt-05', employee_code: 'NV-2024-108', full_name: 'Đỗ Thị Yến', gender: 'Nữ', date_of_birth: '1998-08-14', phone: '0966332211', email: 'yen.dt@bravo.com.vn', department_id: 'dept-kt', department_name: 'Phòng Kiểm thử', position_name: 'Chuyên viên Automation Test', level: 'Nhân viên', manager_id: 'emp-kt-03', manager_name: 'Nguyễn Thị Lan', employment_status: 'WORKING', is_active: 1 },

    // --- 13. PHÒNG BẢO HÀNH ---
    { id: 'emp-bh-01', employee_id: 'emp-bh-01', employee_code: 'NV-2024-113', full_name: 'Cao Văn Cường', gender: 'Nam', date_of_birth: '1989-02-28', phone: '0933887766', email: 'cuong.cv2@bravo.com.vn', department_id: 'dept-bh', department_name: 'Phòng Bảo hành', position_name: 'Trưởng phòng Bảo hành', level: 'Trưởng phòng', manager_id: 'emp-kd-01', manager_name: 'Phạm Quốc Tuấn', employment_status: 'WORKING', is_active: 1 },
    { id: 'emp-bh-02', employee_id: 'emp-bh-02', employee_code: 'NV-2024-114', full_name: 'Nguyễn Minh Tiến', gender: 'Nam', date_of_birth: '1993-08-16', phone: '0944998877', email: 'tien.nm@bravo.com.vn', department_id: 'dept-bh', department_name: 'Phòng Bảo hành', position_name: 'Trưởng nhóm Hỗ trợ Kỹ thuật', level: 'Trưởng nhóm', manager_id: 'emp-bh-01', manager_name: 'Cao Văn Cường', employment_status: 'WORKING', is_active: 1 },
    { id: 'emp-bh-03', employee_id: 'emp-bh-03', employee_code: 'NV-2024-115', full_name: 'Phạm Quỳnh Anh', gender: 'Nữ', date_of_birth: '1994-12-03', phone: '0955009988', email: 'anh.pq@bravo.com.vn', department_id: 'dept-bh', department_name: 'Phòng Bảo hành', position_name: 'Trưởng nhóm Hỗ trợ Khách hàng', level: 'Trưởng nhóm', manager_id: 'emp-bh-01', manager_name: 'Cao Văn Cường', employment_status: 'WORKING', is_active: 1 },
    { id: 'emp-bh-04', employee_id: 'emp-bh-04', employee_code: 'NV-2024-116', full_name: 'Vũ Đình Nam', gender: 'Nam', date_of_birth: '1996-04-21', phone: '0966110099', email: 'nam.vd2@bravo.com.vn', department_id: 'dept-bh', department_name: 'Phòng Bảo hành', position_name: 'Chuyên viên Hỗ trợ Kỹ thuật', level: 'Nhân viên', manager_id: 'emp-bh-02', manager_name: 'Nguyễn Minh Tiến', employment_status: 'WORKING', is_active: 1 },
    { id: 'emp-bh-05', employee_id: 'emp-bh-05', employee_code: 'NV-2024-117', full_name: 'Trịnh Thị Hoa', gender: 'Nữ', date_of_birth: '1998-09-09', phone: '0977221100', email: 'hoa.tt@bravo.com.vn', department_id: 'dept-bh', department_name: 'Phòng Bảo hành', position_name: 'Chuyên viên Chăm sóc Khách hàng', level: 'Nhân viên', manager_id: 'emp-bh-03', manager_name: 'Phạm Quỳnh Anh', employment_status: 'WORKING', is_active: 1 }
];

const INITIAL_REQUESTS = [
    {
        id: 'req-rne-01', recruitment_request_id: 'req-rne-01', request_code: 'RNE/0726-0001', department_id: 'dept-kt', department_name: 'Phòng Kiểm thử',
        position_id: 'pos-kt-mgr', position_name: 'Chuyên viên Kiểm thử Sản phẩm', quantity: 3, reason: 'Nhu cầu bổ sung 3 Chuyên viên Kiểm thử QA cho đủ định biên năm 2026', expected_date: '2026-08-30', priority: 'HIGH', status: 'APPROVED', is_outside_headcount: 0
    },
    {
        id: 'req-rne-02', recruitment_request_id: 'req-rne-02', request_code: 'RNE/0726-0002', department_id: 'dept-kd', department_name: 'Phòng Kinh doanh',
        position_id: 'pos-kd-mgr', position_name: 'Chuyên viên Tư vấn ERP', quantity: 3, reason: 'Nhu cầu bổ sung 3 Chuyên viên Tư vấn ERP còn thiếu so với định biên', expected_date: '2026-08-30', priority: 'HIGH', status: 'APPROVED', is_outside_headcount: 0
    },
    {
        id: 'req-rne-03', recruitment_request_id: 'req-rne-03', request_code: 'RNE/0826-0001', department_id: 'dept-pmk', department_name: 'Phòng Marketing',
        position_id: 'pos-mkt-spec', position_name: 'Chuyên viên Digital Marketing', quantity: 1, reason: 'Đã đủ định biên (15/15), phát sinh nhu cầu tuyển thêm 1 Chuyên viên Senior Growth Marketing ngoài định biên', expected_date: '2026-09-15', priority: 'URGENT', status: 'APPROVED', is_outside_headcount: 1
    },
    {
        id: 'req-rne-04', recruitment_request_id: 'req-rne-04', request_code: 'RNE/0826-0002', department_id: 'dept-cloud', department_name: 'Phòng Cloud và Hạ tầng',
        position_id: 'pos-cloud-mgr', position_name: 'Chuyên viên Cloud & Security', quantity: 3, reason: 'Bổ sung 3 Chuyên viên Cloud & Security còn thiếu theo chỉ tiêu định biên', expected_date: '2026-09-30', priority: 'HIGH', status: 'PENDING', is_outside_headcount: 0
    }
];

const INITIAL_PLANS = [
    {
        id: 'plan-rne-01', recruitment_plan_id: 'plan-rne-01', recruitment_request_id: 'req-rne-01', request_code: 'RNE/0726-0001',
        plan_name: 'KHTD/0726-01: Tuyển bổ sung Chuyên viên Kiểm thử QA', start_date: '2026-07-01', end_date: '2026-08-30', budget: 35000000, status: 'IN_PROGRESS'
    },
    {
        id: 'plan-rne-02', recruitment_plan_id: 'plan-rne-02', recruitment_request_id: 'req-rne-02', request_code: 'RNE/0726-0002',
        plan_name: 'KHTD/0726-02: Tuyển bổ sung Chuyên viên Kinh doanh ERP', start_date: '2026-07-01', end_date: '2026-08-30', budget: 50000000, status: 'IN_PROGRESS'
    },
    {
        id: 'plan-rne-03', recruitment_plan_id: 'plan-rne-03', recruitment_request_id: 'req-rne-03', request_code: 'RNE/0826-0001',
        plan_name: 'KHTD/0826-01: Tuyển Senior Growth Marketing (Ngoài định biên)', start_date: '2026-08-01', end_date: '2026-09-30', budget: 40000000, status: 'IN_PROGRESS'
    }
];

const INITIAL_CANDIDATES = [
    {
        id: 'cand-uv01', candidate_id: 'cand-uv01', candidate_code: 'UV01', full_name: 'Nguyễn Nhung', gender: 'Nữ', date_of_birth: '2004-05-18',
        phone: '0987456223', email: 'nhung.nguyen@gmail.com', received_date: '2026-07-17', recruitment_plan_id: 'plan-rne-01', plan_name: 'KHTD/0726-01: Tuyển bổ sung Chuyên viên Kiểm thử QA',
        citizen_id: '001206123456', education_level: 'Đại học', major: 'CNTT', education_school: 'Đại học Quốc gia Hà Nội', source: 'TopCV', status: 'S1: Mới', rejection_reason: null
    },
    {
        id: 'cand-uv09', candidate_id: 'cand-uv09', candidate_code: 'UV09', full_name: 'Phạm Khánh Linh', gender: 'Nữ', date_of_birth: '2004-11-04',
        phone: '0938456123', email: 'pkl02@gmail.com', received_date: '2026-08-01', recruitment_plan_id: 'plan-rne-02', plan_name: 'KHTD/0726-02: Tuyển bổ sung Chuyên viên Kinh doanh ERP',
        citizen_id: '001204456789', education_level: 'Đại học', major: 'Kinh tế', education_school: 'Đại học Kinh tế Quốc dân', source: 'TopCV', status: 'S1: Mới', rejection_reason: null
    },
    {
        id: 'cand-uv07', candidate_id: 'cand-uv07', candidate_code: 'UV07', full_name: 'Nguyễn Minh Anh', gender: 'Nam', date_of_birth: '2001-04-12',
        phone: '0912345698', email: 'minhanh@gmail.com', received_date: '2026-07-31', recruitment_plan_id: 'plan-rne-02', plan_name: 'KHTD/0726-02: Tuyển bổ sung Chuyên viên Kinh doanh ERP',
        citizen_id: '001201123456', education_level: 'Đại học', major: 'KT: Kinh tế', education_school: 'Đại học Quốc gia Hà Nội - Khoa Kinh tế', source: 'TopCV', status: 'S7: Loại', rejection_reason: 'Lý do: Kỹ năng chuyên môn chưa phù hợp'
    },
    {
        id: 'cand-uv08', candidate_id: 'cand-uv08', candidate_code: 'UV08', full_name: 'Nguyễn Thu Hà', gender: 'Nữ', date_of_birth: '2002-09-20',
        phone: '0988123456', email: 'thuha@gmail.com', received_date: '2026-07-31', recruitment_plan_id: 'plan-rne-02', plan_name: 'KHTD/0726-02: Tuyển bổ sung Chuyên viên Kinh doanh ERP',
        citizen_id: '001202234567', education_level: 'Đại học', major: 'Quản trị Kinh doanh', education_school: 'Đại học Thương mại', source: 'LinkedIn', status: 'S2: Phỏng vấn', rejection_reason: null
    },
    {
        id: 'cand-uv10', candidate_id: 'cand-uv10', candidate_code: 'UV10', full_name: 'Đỗ Quốc Hưng', gender: 'Nam', date_of_birth: '1999-02-08',
        phone: '0909123789', email: 'dqhung@gmail.com', received_date: '2026-07-31', recruitment_plan_id: 'plan-rne-02', plan_name: 'KHTD/0726-02: Tuyển bổ sung Chuyên viên Kinh doanh ERP',
        citizen_id: '001199345678', education_level: 'Đại học', major: 'Marketing', education_school: 'Đại học Hà Nội', source: 'Website BRAVO', status: 'S5: Trúng tuyển', rejection_reason: null
    }
];

const INITIAL_INTERVIEWS = [
    {
        id: 'int-001', interview_id: 'int-001', candidate_id: 'cand-uv08', candidate_code: 'UV08', candidate_name: 'Nguyễn Thu Hà',
        round_name: 'Vòng 2: Phỏng vấn Chuyên môn', interview_date: '2026-08-10', interviewer_name: 'Phạm Quốc Tuấn', location: 'Phòng họp B3, BRAVO Hà Nội',
        score: 8.5, comment: 'Ứng viên giao tiếp tự tin, có kinh nghiệm tư vấn phần mềm B2B tốt', result: 'PASSED', status: 'PASSED'
    }
];

const INITIAL_OFFERS = [
    {
        id: 'off-001', offer_id: 'off-001', candidate_id: 'cand-uv10', candidate_code: 'UV10', candidate_name: 'Đỗ Quốc Hưng',
        position_name: 'Chuyên viên Tư vấn ERP', department_name: 'Phòng Kinh doanh',
        salary_offer: 18000000, start_date: '2026-08-15', status: 'ACCEPTED', offer_status: 'ACCEPTED'
    }
];

const INITIAL_REWARDS = [
    {
        id: 'rd-dec-01', reward_id: 'rd-dec-01', reward_discipline_id: 'rd-dec-01', employee_id: 'emp-bgd-01', employee_name: 'Bùi Xuân Thức', department_name: 'Ban Giám Đốc',
        decision_no: 'QĐKT/2026/001', decision_date: '2026-08-01', decision_type: 'KHEN_THUONG', reward_title: 'Tuyên dương Cá nhân Xuất sắc Quý 2/2026', proposed_amount: 5000000, reason: 'Tuyên dương Cá nhân Xuất sắc Quý 2/2026', status: 'APPROVED'
    }
];

const INITIAL_DISCIPLINES = [
    {
        id: 'rd-dec-03', discipline_id: 'rd-dec-03', reward_discipline_id: 'rd-dec-03', employee_id: 'emp-hr-01', employee_name: 'Trần Thị Thu Hà', department_name: 'Phòng Nhân sự',
        decision_no: 'QĐKL/2026/001', decision_date: '2026-08-05', decision_type: 'KY_LUAT', discipline_title: 'Khiển trách Kỷ luật Lao động', reason: 'Nhắc nhở và Khiển trách do đi muộn quá 5 lần trong tháng 7/2026', status: 'APPROVED'
    }
];

const INITIAL_LEAVE_APPLICATIONS = [
    {
        id: 'lv-01',
        leave_id: 'lv-01',
        leave_code: 'DXNP/26-001',
        employee_id: 'emp-kd-04',
        employee_code: 'NV-2024-027',
        employee_name: 'Nhân viên Kinh doanh',
        department_id: 'dept-kd',
        department_name: 'Phòng Kinh doanh',
        approver_id: 'usr-mgr-kd',
        approver_name: 'Trưởng phòng Kinh doanh',
        related_person_id: 'emp-kd-02',
        related_person_name: 'Nguyễn Văn Nam (Trưởng nhóm)',
        start_date: Date.now() + 86400000,
        end_date: Date.now() + 2 * 86400000,
        total_days: 2.0,
        reason: 'Giải quyết công việc gia đình ở quê',
        details_json: JSON.stringify([
            { date: new Date(Date.now() + 86400000).toISOString().split('T')[0], time_option: 'Cả ngày', days: 1.0, note: 'Đi về quê' },
            { date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0], time_option: 'Cả ngày', days: 1.0, note: 'Giải quyết việc gia đình' }
        ]),
        approver_note: '',
        status: 'PENDING',
        created_date: Date.now(),
        last_modified_date: Date.now()
    }
];

const INITIAL_USERS = [
    { id: 'usr-nhung', user_id: 'usr-nhung', username: 'admin', full_name: 'Nguyễn Hồng Nhung', email: 'hongnhung188888@gmail.com', phone: '0988666888', role_id: 'role-admin', role_name: 'Administrator', department_id: 'dept-hr', department_name: 'Quản trị hệ thống', status: 1, created_date: 1723500000000, last_modified_date: 1723500000000 },
    { id: 'usr-nhung-nh', user_id: 'usr-nhung-nh', username: 'NHUNGNH', full_name: 'Nguyễn Hồng Nhung', email: 'hongnhung188888@gmail.com', phone: '0988666888', role_id: 'role-admin', role_name: 'Administrator', department_id: 'dept-hr', department_name: 'Quản trị hệ thống', status: 1, created_date: 1723500000000, last_modified_date: 1723500000000 },
    { id: 'usr-ceo', user_id: 'usr-ceo', username: 'ceo', full_name: 'Ban Giám đốc', email: 'ceo@bravo.com.vn', phone: '0988111222', role_id: 'role-ceo', role_name: 'User – CEO', department_id: 'dept-bgd', department_name: 'Ban Giám Đốc', status: 1, created_date: 1723400000000, last_modified_date: 1723400000000 },
    { id: 'usr-mgr-kd', user_id: 'usr-mgr-kd', username: 'mgr_kd', full_name: 'Trưởng phòng Kinh doanh', email: 'tuan.pq@bravo.com.vn', phone: '0977222333', role_id: 'role-manager', role_name: 'User – Manager', department_id: 'dept-kd', department_name: 'Phòng Kinh doanh', status: 1, created_date: 1723300000000, last_modified_date: 1723300000000 },
    { id: 'usr-emp-kd', user_id: 'usr-emp-kd', username: 'emp_kd', full_name: 'Nhân viên Kinh doanh', email: 'nam.nv@bravo.com.vn', phone: '0977333444', role_id: 'role-employee', role_name: 'User – Employee', department_id: 'dept-kd', department_name: 'Phòng Kinh doanh', status: 1, created_date: 1723200000000, last_modified_date: 1723200000000 }
];

// Helper to get or initialize local storage dataset
const getStorageItem = (key, initialValue) => {
    try {
        const item = localStorage.getItem(`bravo_hrm_mock_${key}`);
        if (item) return JSON.parse(item);
        localStorage.setItem(`bravo_hrm_mock_${key}`, JSON.stringify(initialValue));
        return initialValue;
    } catch (e) {
        return initialValue;
    }
};

const setStorageItem = (key, value) => {
    try {
        localStorage.setItem(`bravo_hrm_mock_${key}`, JSON.stringify(value));
    } catch (e) { }
};

// Relational Cascade Engine: Automatically propagates changes across entities
const cascadeDepartmentNameUpdate = (deptId, oldName, newName) => {
    if (!oldName || !newName || oldName === newName) return;

    // 1. Update Positions
    const posList = getStorageItem('positions', INITIAL_POSITIONS);
    const updatedPos = posList.map(p => (p.department_id === deptId || p.department_name === oldName) ? { ...p, department_name: newName } : p);
    setStorageItem('positions', updatedPos);

    // 2. Update Employees
    const empList = getStorageItem('employees', INITIAL_EMPLOYEES);
    const updatedEmp = empList.map(e => (e.department_id === deptId || e.department_name === oldName) ? { ...e, department_name: newName } : e);
    setStorageItem('employees', updatedEmp);

    // 3. Update Requests
    const reqList = getStorageItem('requests', INITIAL_REQUESTS);
    const updatedReq = reqList.map(r => (r.department_id === deptId || r.department_name === oldName) ? { ...r, department_name: newName } : r);
    setStorageItem('requests', updatedReq);

    // 4. Update Users
    const userList = getStorageItem('users', INITIAL_USERS);
    const updatedUser = userList.map(u => (u.department_id === deptId || u.department_name === oldName) ? { ...u, department_name: newName } : u);
    setStorageItem('users', updatedUser);
};

export const getMockResponse = (method, endpoint, body) => {
    console.warn(`[BRAVO HRM Unified Store] Action: ${method} ${endpoint}`);

    // 0. Auth Login Mock (Support ANY user created in storage)
    if (endpoint === '/auth/login') {
        const { username, password } = body || {};
        if (!username) {
            return { success: false, message: 'Vui lòng nhập tên đăng nhập.' };
        }

        const users = getStorageItem('users', INITIAL_USERS);
        const foundUser = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());

        if (foundUser) {
            if (Number(foundUser.status) === 0) {
                return {
                    success: false,
                    message: `Tài khoản '${username}' hiện đang ở trạng thái KHÓA và không được phép đăng nhập. Vui lòng liên hệ Quản trị viên.`
                };
            }
            return {
                success: true,
                token: `mock_token_${foundUser.user_id || foundUser.id}`,
                user: {
                    id: foundUser.user_id || foundUser.id,
                    username: foundUser.username,
                    fullName: foundUser.full_name,
                    email: foundUser.email,
                    roleName: foundUser.role_name,
                    deptId: foundUser.department_id,
                    deptName: foundUser.department_name || 'Phòng Nhân sự'
                }
            };
        }

        return {
            success: false,
            message: `Tài khoản '${username}' không tồn tại trong hệ thống. Vui lòng kiểm tra tên đăng nhập hoặc liên hệ Admin.`
        };
    }

    // 1. Departments
    if (endpoint === '/admin/departments') {
        if (method === 'GET') return { success: true, data: getStorageItem('departments', INITIAL_DEPARTMENTS) };
        if (method === 'POST') {
            const depts = getStorageItem('departments', INITIAL_DEPARTMENTS);
            const newDept = {
                id: `dept-${Date.now()}`, department_id: `dept-${Date.now()}`,
                status: 1, current_count: 0, outside_request_count: 0, ...body
            };
            setStorageItem('departments', [newDept, ...depts]);
            return { success: true, message: 'Thêm phòng ban thành công!', data: newDept };
        }
    }

    if (endpoint.startsWith('/admin/departments/') && method === 'PUT') {
        const id = endpoint.split('/admin/departments/')[1];
        const depts = getStorageItem('departments', INITIAL_DEPARTMENTS);
        const existing = depts.find(d => d.id === id || d.department_id === id);
        const updated = depts.map(d => (d.id === id || d.department_id === id) ? { ...d, ...body } : d);
        setStorageItem('departments', updated);

        if (existing && body.department_name && existing.department_name !== body.department_name) {
            cascadeDepartmentNameUpdate(id, existing.department_name, body.department_name);
        }
        return { success: true, message: 'Cập nhật phòng ban thành công!' };
    }

    if (endpoint.startsWith('/admin/departments/') && method === 'DELETE') {
        const id = endpoint.split('/admin/departments/')[1];
        const depts = getStorageItem('departments', INITIAL_DEPARTMENTS);
        const updated = depts.filter(d => d.id !== id && d.department_id !== id);
        setStorageItem('departments', updated);
        return { success: true, message: 'Xóa phòng ban thành công!' };
    }

    // 2. Positions
    if (endpoint === '/admin/positions') {
        if (method === 'GET') return { success: true, data: getStorageItem('positions', INITIAL_POSITIONS) };
        if (method === 'POST') {
            const posList = getStorageItem('positions', INITIAL_POSITIONS);
            const newPos = { id: `pos-${Date.now()}`, position_id: `pos-${Date.now()}`, status: 1, current_count: 0, ...body };
            setStorageItem('positions', [newPos, ...posList]);
            return { success: true, message: 'Thêm chức vụ thành công!', data: newPos };
        }
    }

    // 3. Users (Account Management)
    if (endpoint === '/admin/users') {
        if (method === 'GET') return { success: true, data: getStorageItem('users', INITIAL_USERS) };
        if (method === 'POST') {
            const users = getStorageItem('users', INITIAL_USERS);
            const { username, full_name, role_id, department_id, email, phone } = body || {};

            if (!username || !full_name) {
                return { success: false, message: 'Vui lòng nhập tên đăng nhập và họ tên đầy đủ.' };
            }

            const existing = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
            if (existing) {
                return { success: false, message: `Tên đăng nhập '${username}' đã tồn tại trong hệ thống. Vui lòng chọn tên khác.` };
            }

            let roleName = 'Recruitment Staff';
            if (role_id === 'role-admin' || role_id === 'Administrator') roleName = 'Administrator';
            else if (role_id === 'role-manager' || role_id === 'Department Manager') roleName = 'Department Manager';
            else if (role_id === 'role-hr' || role_id === 'HR Staff') roleName = 'HR Staff';

            const depts = getStorageItem('departments', INITIAL_DEPARTMENTS);
            const deptObj = depts.find(d => d.department_id === department_id || d.id === department_id);

            const newUser = {
                id: `usr-${Date.now()}`,
                user_id: `usr-${Date.now()}`,
                username: username.trim(),
                full_name,
                email: email || `${username}@bravo.com.vn`,
                phone: phone || '0988000111',
                role_id: role_id || 'role-hr',
                role_name: roleName,
                department_id: department_id || null,
                department_name: deptObj ? deptObj.department_name : 'Phòng Nhân sự',
                status: 1,
                created_date: Date.now()
            };

            const updatedUsers = [newUser, ...users];
            setStorageItem('users', updatedUsers);
            return { success: true, message: `Tạo tài khoản '${username}' (${roleName}) thành công! Bạn có thể đăng xuất và đăng nhập lại bằng tài khoản này.`, data: newUser };
        }
    }

    if (endpoint.startsWith('/admin/users/') && method === 'PUT') {
        const id = endpoint.split('/admin/users/')[1];
        const users = getStorageItem('users', INITIAL_USERS);
        const { full_name, email, phone, role_id, department_id, status } = body || {};

        let roleName = 'Recruitment Staff';
        if (role_id === 'role-admin' || role_id === 'Administrator') roleName = 'Administrator';
        else if (role_id === 'role-manager' || role_id === 'Department Manager') roleName = 'Department Manager';
        else if (role_id === 'role-hr' || role_id === 'HR Staff') roleName = 'HR Staff';
        else if (role_id === 'role-emp' || role_id === 'Employee') roleName = 'Employee';

        const depts = getStorageItem('departments', INITIAL_DEPARTMENTS);
        const deptObj = depts.find(d => d.department_id === department_id || d.id === department_id);

        const updatedUsers = users.map(u => {
            if (u.id === id || u.user_id === id) {
                return {
                    ...u,
                    full_name: full_name !== undefined ? full_name : u.full_name,
                    email: email !== undefined ? email : u.email,
                    phone: phone !== undefined ? phone : u.phone,
                    role_id: role_id !== undefined ? role_id : u.role_id,
                    role_name: roleName || u.role_name,
                    department_id: department_id !== undefined ? department_id : u.department_id,
                    department_name: deptObj ? deptObj.department_name : u.department_name,
                    status: status !== undefined ? Number(status) : u.status,
                    last_modified_date: Date.now()
                };
            }
            return u;
        });

        setStorageItem('users', updatedUsers);
        const updatedUser = updatedUsers.find(u => u.id === id || u.user_id === id);
        return { success: true, message: 'Cập nhật tài khoản thành công.', data: updatedUser };
    }

    if (endpoint === '/admin/roles' && method === 'GET') {
        return {
            success: true,
            data: [
                { role_id: 'role-admin', role_name: 'Administrator', description: 'Quản trị viên Hệ thống' },
                { role_id: 'role-hr', role_name: 'HR Staff', description: 'Nhân viên Quản trị Nhân sự' },
                { role_id: 'role-manager', role_name: 'Department Manager', description: 'Trưởng phòng / Trưởng khối' },
                { role_id: 'role-emp', role_name: 'Employee', description: 'Nhân viên' }
            ]
        };
    }

    // 4. Employees & HR Profile
    if (endpoint === '/hr/employees' || endpoint.startsWith('/hr/employees')) {
        if (method === 'GET') {
            const emps = getStorageItem('employees', INITIAL_EMPLOYEES);
            if (endpoint.includes('/hr/employees/')) {
                const id = endpoint.split('/hr/employees/')[1];
                const emp = emps.find(e => e.id === id || e.employee_id === id);
                return { success: true, data: emp || emps[0] };
            }
            return { success: true, data: emps };
        }
        if (method === 'POST') {
            const emps = getStorageItem('employees', INITIAL_EMPLOYEES);
            const newEmp = {
                id: `emp-${Date.now()}`, employee_id: `emp-${Date.now()}`,
                employee_code: `NV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
                employment_status: 'WORKING', is_active: 1, ...body
            };
            setStorageItem('employees', [newEmp, ...emps]);
            return { success: true, message: 'Tạo hồ sơ nhân viên thành công!', data: newEmp };
        }
        if (method === 'PUT') {
            const id = endpoint.split('/hr/employees/')[1];
            const emps = getStorageItem('employees', INITIAL_EMPLOYEES);
            const updated = emps.map(e => (e.id === id || e.employee_id === id) ? { ...e, ...body } : e);
            setStorageItem('employees', updated);
            return { success: true, message: 'Cập nhật hồ sơ nhân viên thành công!' };
        }
        if (method === 'DELETE') {
            const id = endpoint.split('/hr/employees/')[1];
            const emps = getStorageItem('employees', INITIAL_EMPLOYEES);
            const empToDelete = emps.find(e => e.id === id || e.employee_id === id);

            if (!empToDelete) {
                return { success: false, message: 'Hồ sơ nhân sự không tồn tại.' };
            }

            // Check Business Rule 1: Direct Manager of other staff
            const managedStaff = emps.filter(e => (e.manager_id === id || e.manager_id === empToDelete.employee_id) && (e.is_active === 1 || e.employment_status === 'WORKING') && (e.id !== id && e.employee_id !== id));
            if (managedStaff.length > 0) {
                return {
                    success: false,
                    message: `Không thể xóa nhân sự '${empToDelete.full_name}' do đang là Người quản lý trực tiếp của ${managedStaff.length} nhân viên khác. Vui lòng bàn giao công việc quản lý trước khi xóa.`
                };
            }

            // Check Business Rule 2: Department Manager
            const depts = getStorageItem('departments', INITIAL_DEPARTMENTS);
            const isDeptMgr = depts.find(d => d.manager_id === id || d.manager_id === empToDelete.employee_id);
            if (isDeptMgr) {
                return {
                    success: false,
                    message: `Không thể xóa nhân sự '${empToDelete.full_name}' do đang giữ vị trí Trưởng phòng của '${isDeptMgr.department_name}'. Vui lòng bổ nhiệm Trưởng phòng mới trước khi xóa.`
                };
            }

            const updated = emps.filter(e => e.id !== id && e.employee_id !== id);
            setStorageItem('employees', updated);
            return { success: true, message: 'Đã xóa hồ sơ nhân sự thành công.' };
        }
    }

    // 5. Recruitment Requests
    if (endpoint === '/recruitment/requests' || endpoint.startsWith('/recruitment/requests')) {
        if (method === 'GET') return { success: true, data: getStorageItem('requests', INITIAL_REQUESTS) };
        if (method === 'POST') {
            const reqs = getStorageItem('requests', INITIAL_REQUESTS);
            const newReq = {
                id: `req-${Date.now()}`, recruitment_request_id: `req-${Date.now()}`,
                request_code: `RNE/${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getFullYear()).slice(-2)}-${Math.floor(1000 + Math.random() * 9000)}`,
                status: 'PENDING', ...body
            };
            setStorageItem('requests', [newReq, ...reqs]);
            return { success: true, message: 'Tạo yêu cầu tuyển dụng thành công!', data: newReq };
        }
        if (endpoint.includes('/approve')) {
            const reqId = endpoint.split('/recruitment/requests/')[1].split('/approve')[0];
            const { status } = body || {};
            const reqs = getStorageItem('requests', INITIAL_REQUESTS);
            const updated = reqs.map(r => (r.id === reqId || r.recruitment_request_id === reqId) ? { ...r, status: status || 'APPROVED' } : r);
            setStorageItem('requests', updated);
            return { success: true, message: `Đã ${status === 'APPROVED' ? 'phê duyệt' : 'từ chối'} yêu cầu tuyển dụng!` };
        }
    }

    // 6. Recruitment Plans
    if (endpoint === '/recruitment/plans') {
        if (method === 'GET') return { success: true, data: getStorageItem('plans', INITIAL_PLANS) };
        if (method === 'POST') {
            const plans = getStorageItem('plans', INITIAL_PLANS);
            const newPlan = { id: `plan-${Date.now()}`, recruitment_plan_id: `plan-${Date.now()}`, status: 'IN_PROGRESS', ...body };
            setStorageItem('plans', [newPlan, ...plans]);
            return { success: true, message: 'Lập kế hoạch tuyển dụng thành công!', data: newPlan };
        }
    }

    // 7. Candidates
    if (endpoint === '/recruitment/candidates' || endpoint.startsWith('/recruitment/candidates')) {
        if (method === 'GET') return { success: true, data: getStorageItem('candidates', INITIAL_CANDIDATES) };
        if (method === 'POST') {
            const cands = getStorageItem('candidates', INITIAL_CANDIDATES);
            const newCand = {
                id: `cand-${Date.now()}`, candidate_id: `cand-${Date.now()}`,
                candidate_code: `UV${String(cands.length + 1).padStart(2, '0')}`,
                status: 'S1: Mới', received_date: new Date().toISOString().split('T')[0], ...body
            };
            setStorageItem('candidates', [newCand, ...cands]);
            return { success: true, message: 'Tiếp nhận hồ sơ ứng viên thành công!', data: newCand };
        }
        if (method === 'PUT') {
            const id = endpoint.split('/recruitment/candidates/')[1];
            const cands = getStorageItem('candidates', INITIAL_CANDIDATES);
            const updated = cands.map(c => (c.id === id || c.candidate_id === id) ? { ...c, ...body } : c);
            setStorageItem('candidates', updated);
            return { success: true, message: 'Cập nhật ứng viên thành công!' };
        }
    }

    // 8. Interview Schedules
    if (endpoint === '/hr/leave-applications') {
        if (method === 'GET') return { success: true, data: getStorageItem('leave_applications', INITIAL_LEAVE_APPLICATIONS) };
        if (method === 'POST') {
            const apps = getStorageItem('leave_applications', INITIAL_LEAVE_APPLICATIONS);
            const newApp = { id: `lv-${Date.now()}`, leave_id: `lv-${Date.now()}`, created_date: Date.now(), last_modified_date: Date.now(), status: 'PENDING', ...body };
            setStorageItem('leave_applications', [newApp, ...apps]);
            return { success: true, message: 'Tạo Đơn xin nghỉ phép thành công!', data: newApp };
        }
    }
    if (endpoint.startsWith('/hr/leave-applications/')) {
        const parts = endpoint.split('/');
        const id = parts[3];
        const subAction = parts[4];
        const apps = getStorageItem('leave_applications', INITIAL_LEAVE_APPLICATIONS);
        if (subAction === 'approve' && method === 'PUT') {
            const updated = apps.map(a => (a.id === id || a.leave_id === id) ? { ...a, status: body.status || 'APPROVED', approver_note: body.approver_note || '', last_modified_date: Date.now() } : a);
            setStorageItem('leave_applications', updated);
            return { success: true, message: `Đã ${body.status === 'APPROVED' ? 'phê duyệt' : 'từ chối'} Đơn xin nghỉ phép!` };
        }
        if (method === 'DELETE') {
            const updated = apps.filter(a => a.id !== id && a.leave_id !== id);
            setStorageItem('leave_applications', updated);
            return { success: true, message: 'Xóa Đơn xin nghỉ phép thành công!' };
        }
    }
    if (endpoint === '/recruitment/interview-schedules') {
        if (method === 'GET') return { success: true, data: getStorageItem('interview_schedules', INITIAL_INTERVIEW_SCHEDULES) };
        if (method === 'POST') {
            const schs = getStorageItem('interview_schedules', INITIAL_INTERVIEW_SCHEDULES);
            const newSch = { id: `sch-${Date.now()}`, schedule_id: `sch-${Date.now()}`, ...body };
            setStorageItem('interview_schedules', [newSch, ...schs]);
            return { success: true, message: 'Tạo Lịch phỏng vấn - thi tuyển thành công!', data: newSch };
        }
    }
    if (endpoint.startsWith('/recruitment/interview-schedules/')) {
        const id = endpoint.split('/recruitment/interview-schedules/')[1];
        const schs = getStorageItem('interview_schedules', INITIAL_INTERVIEW_SCHEDULES);
        if (method === 'PUT') {
            const updated = schs.map(s => (s.id === id || s.schedule_id === id) ? { ...s, ...body } : s);
            setStorageItem('interview_schedules', updated);
            return { success: true, message: 'Cập nhật Lịch phỏng vấn - thi tuyển thành công!' };
        }
        if (method === 'DELETE') {
            const updated = schs.filter(s => s.id !== id && s.schedule_id !== id);
            setStorageItem('interview_schedules', updated);
            return { success: true, message: 'Xóa Lịch phỏng vấn - thi tuyển thành công!' };
        }
    }

    // 8B. Interviews
    if (endpoint === '/recruitment/interviews') {
        if (method === 'GET') return { success: true, data: getStorageItem('interviews', INITIAL_INTERVIEWS) };
        if (method === 'POST') {
            const ints = getStorageItem('interviews', INITIAL_INTERVIEWS);
            const newInt = { id: `int-${Date.now()}`, interview_id: `int-${Date.now()}`, ...body };
            setStorageItem('interviews', [newInt, ...ints]);

            // Cascade update Candidate Status
            if (body.candidate_id) {
                const cands = getStorageItem('candidates', INITIAL_CANDIDATES);
                const newStatus = body.result === 'PASSED' ? 'S2: Phỏng vấn' : (body.result === 'FAILED' ? 'S7: Loại' : 'S1: Mới');
                const updatedCands = cands.map(c => (c.id === body.candidate_id || c.candidate_id === body.candidate_id) ? { ...c, status: newStatus } : c);
                setStorageItem('candidates', updatedCands);
            }
            return { success: true, message: 'Lên lịch & ghi nhận đánh giá phỏng vấn thành công!', data: newInt };
        }
    }

    // 9. Offers & Convert Candidate to Employee
    if (endpoint === '/recruitment/offers') {
        if (method === 'GET') return { success: true, data: getStorageItem('offers', INITIAL_OFFERS) };
        if (method === 'POST') {
            const offs = getStorageItem('offers', INITIAL_OFFERS);
            const newOff = { id: `off-${Date.now()}`, offer_id: `off-${Date.now()}`, offer_status: 'SENT', status: 'SENT', ...body };
            setStorageItem('offers', [newOff, ...offs]);

            if (body.candidate_id) {
                const cands = getStorageItem('candidates', INITIAL_CANDIDATES);
                const updatedCands = cands.map(c => (c.id === body.candidate_id || c.candidate_id === body.candidate_id) ? { ...c, status: 'S5: Trúng tuyển' } : c);
                setStorageItem('candidates', updatedCands);
            }
            return { success: true, message: 'Tạo Offer thành công!', data: newOff };
        }
    }

    if (endpoint === '/recruitment/convert-to-employee') {
        const { candidate_id } = body || {};
        const cands = getStorageItem('candidates', INITIAL_CANDIDATES);
        const candidate = cands.find(c => c.id === candidate_id || c.candidate_id === candidate_id);

        if (!candidate) {
            return { success: false, message: 'Không tìm thấy ứng viên.' };
        }

        const emps = getStorageItem('employees', INITIAL_EMPLOYEES);
        const newEmpCode = `NV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
        const newEmp = {
            id: `emp-${Date.now()}`,
            employee_id: `emp-${Date.now()}`,
            employee_code: newEmpCode,
            full_name: candidate.full_name,
            gender: candidate.gender || 'Nam',
            phone: candidate.phone,
            email: candidate.email,
            department_name: candidate.department_name || 'Phòng Nhân sự',
            position_name: candidate.position_name || 'Chuyên viên ERP',
            employment_status: 'WORKING',
            is_active: 1
        };

        setStorageItem('employees', [newEmp, ...emps]);

        // Update candidate status to HIRED
        const updatedCands = cands.map(c => (c.id === candidate_id || c.candidate_id === candidate_id) ? { ...c, status: 'HIRED' } : c);
        setStorageItem('candidates', updatedCands);

        return {
            success: true,
            message: `Chuyển ứng viên ${candidate.full_name} thành Nhân viên thành công! Mã NV mới: ${newEmpCode}`,
            data: newEmp
        };
    }

    // 10. Reward & Discipline
    if (endpoint === '/reward-discipline' || endpoint.startsWith('/reward-discipline')) {
        if (method === 'GET') {
            const r = getStorageItem('rewards', INITIAL_REWARDS);
            const d = getStorageItem('disciplines', INITIAL_DISCIPLINES);
            return { success: true, data: [...r, ...d] };
        }
        if (method === 'POST') {
            if (body.decision_type === 'KHEN_THUONG') {
                const r = getStorageItem('rewards', INITIAL_REWARDS);
                const newItem = { id: `rd-${Date.now()}`, reward_id: `rd-${Date.now()}`, decision_no: `QĐKT/${new Date().getFullYear()}/${Math.floor(10 + Math.random() * 90)}`, ...body };
                setStorageItem('rewards', [newItem, ...r]);
            } else {
                const d = getStorageItem('disciplines', INITIAL_DISCIPLINES);
                const newItem = { id: `rd-${Date.now()}`, discipline_id: `rd-${Date.now()}`, decision_no: `QĐKL/${new Date().getFullYear()}/${Math.floor(10 + Math.random() * 90)}`, ...body };
                setStorageItem('disciplines', [newItem, ...d]);
            }
            return { success: true, message: 'Thêm quyết định khen thưởng/kỷ luật thành công!' };
        }
    }

    // 11. Reports & Dashboard Summary
    if (endpoint === '/reports/dashboard/summary') {
        const emps = getStorageItem('employees', INITIAL_EMPLOYEES);
        const reqs = getStorageItem('requests', INITIAL_REQUESTS);
        const plans = getStorageItem('plans', INITIAL_PLANS);
        const cands = getStorageItem('candidates', INITIAL_CANDIDATES);
        const ints = getStorageItem('interviews', INITIAL_INTERVIEWS);
        const rews = getStorageItem('rewards', INITIAL_REWARDS);

        const pendingReqs = reqs.filter(r => r.status === 'PENDING');
        const pendingTasks = pendingReqs.map(r => ({
            id: r.id || r.recruitment_request_id,
            code: r.request_code,
            type: 'REQUEST',
            title: `Yêu cầu tuyển dụng ${r.request_code}: ${r.reason || r.position_name}`,
            status: 'Chờ duyệt'
        }));

        return {
            success: true,
            data: {
                totalEmployees: emps.length,
                totalRequests: reqs.length,
                activePlans: plans.length,
                totalCandidates: cands.length,
                pendingInterviews: ints.filter(i => i.result === 'PENDING').length,
                totalRewards: rews.length,
                pendingTasks
            }
        };
    }

    if (endpoint === '/reports/dashboard/charts') {
        const emps = getStorageItem('employees', INITIAL_EMPLOYEES);
        const depts = getStorageItem('departments', INITIAL_DEPARTMENTS);
        const cands = getStorageItem('candidates', INITIAL_CANDIDATES);
        const rews = getStorageItem('rewards', INITIAL_REWARDS);
        const discs = getStorageItem('disciplines', INITIAL_DISCIPLINES);

        const deptDistribution = depts.map(d => ({
            dept_name: d.department_name,
            emp_count: emps.filter(e => e.department_name === d.department_name || e.department_id === d.department_id).length
        }));

        const candidateStatusDistribution = [
            { status_code: 'S1: Mới', candidate_count: cands.filter(c => c.status === 'S1: Mới').length },
            { status_code: 'S2: Phỏng vấn', candidate_count: cands.filter(c => c.status === 'S2: Phỏng vấn').length },
            { status_code: 'S5: Trúng tuyển', candidate_count: cands.filter(c => c.status === 'S5: Trúng tuyển').length },
            { status_code: 'HIRED', candidate_count: cands.filter(c => c.status === 'HIRED').length },
            { status_code: 'S7: Loại', candidate_count: cands.filter(c => c.status === 'S7: Loại').length }
        ];

        const rewardDisciplineStats = [
            { record_type: 'KHEN_THUONG', count: rews.length },
            { record_type: 'KY_LUAT', count: discs.length }
        ];

        return {
            success: true,
            data: {
                deptDistribution,
                candidateStatusDistribution,
                rewardDisciplineStats
            }
        };
    }

    // Fallback for everything else
    return { success: true, data: [] };
};