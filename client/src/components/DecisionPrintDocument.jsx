import React from 'react';
import { formatDate, parseDateValue } from '../utils/date';

const valueOf = (document, ...keys) => {
    for (const key of keys) {
        if (document?.[key] !== undefined && document?.[key] !== null && document?.[key] !== '') return document[key];
    }
    return '';
};

const dateParts = (value) => {
    const date = parseDateValue(value) || new Date();
    if (Number.isNaN(date.getTime())) return { day: '....', month: '....', year: '........' };
    return {
        day: String(date.getDate()).padStart(2, '0'),
        month: String(date.getMonth() + 1).padStart(2, '0'),
        year: String(date.getFullYear())
    };
};

const normalizeType = (value) => String(value || 'Thuyên chuyển').toLowerCase();

const getDecisionType = (document) => {
    const type = normalizeType(valueOf(document, 'decision_type', 'type'));
    if (type.includes('bổ nhiệm') || type.includes('bo nhiem') || type.includes('promotion')) return 'Bổ nhiệm';
    if (type.includes('miễn nhiệm') || type.includes('mien nhiem') || type.includes('dismiss')) return 'Miễn nhiệm';
    if (type.includes('nghỉ việc') || type.includes('thôi việc') || type.includes('resign')) return 'Nghỉ việc';
    return 'Thuyên chuyển';
};

const EmployeeCvDocument = ({ document }) => {
    const fullName = valueOf(document, 'full_name', 'employee_name') || 'Chưa cập nhật';
    const contracts = Array.isArray(document.contracts) ? document.contracts : [];
    const workHistory = Array.isArray(document.workHistory) ? document.workHistory : [];
    const rewards = Array.isArray(document.rewards) ? document.rewards : [];
    const info = [
        ['Mã nhân viên', valueOf(document, 'employee_code')],
        ['Giới tính', valueOf(document, 'gender')],
        ['Ngày sinh', formatDate(valueOf(document, 'date_of_birth'))],
        ['Số CCCD', valueOf(document, 'citizen_id')],
        ['Điện thoại', valueOf(document, 'phone')],
        ['Email công ty', valueOf(document, 'company_email', 'email')],
        ['Địa chỉ hiện tại', valueOf(document, 'address')],
        ['Địa chỉ thường trú', valueOf(document, 'permanent_address')],
        ['Ngày vào làm', formatDate(valueOf(document, 'join_date'))],
        ['Ngày chính thức', formatDate(valueOf(document, 'official_date'))],
        ['Trạng thái', valueOf(document, 'employment_status') === 'WORKING' ? 'Đang làm việc' : valueOf(document, 'employment_status')],
        ['Quản lý trực tiếp', valueOf(document, 'manager_name')]
    ];
    return (
        <div className="decision-print-root employee-cv-print-root" aria-hidden="true">
            <article className="employee-cv-print-page">
                <header className="employee-cv-header">
                    <div>
                        <strong>VĂN PHÒNG CÔNG TY CỔ PHẦN BRAVO</strong>
                        <div>HỒ SƠ NHÂN SỰ</div>
                    </div>
                    <div className="employee-cv-date">Ngày in: {formatDate(Date.now())}</div>
                </header>
                <section className="employee-cv-title">
                    <h1>THÔNG TIN HỒ SƠ NHÂN SỰ</h1>
                    <h2>{fullName}</h2>
                    <div>{valueOf(document, 'position_name')} - {valueOf(document, 'department_name')}</div>
                </section>
                <section className="employee-cv-section">
                    <h3>1. Thông tin cá nhân và công việc</h3>
                    <div className="employee-cv-grid">
                        {info.map(([label, value]) => <div key={label}><b>{label}</b><span>{value || '................................'}</span></div>)}
                    </div>
                </section>
                <section className="employee-cv-section">
                    <h3>2. Hợp đồng lao động</h3>
                    {contracts.length ? <table><thead><tr><th>Số hợp đồng</th><th>Loại hợp đồng</th><th>Ngày ký</th><th>Ngày bắt đầu</th><th>Ngày kết thúc</th><th>Trạng thái</th></tr></thead><tbody>{contracts.map((contract, index) => <tr key={contract.contract_id || index}><td>{valueOf(contract, 'contract_no')}</td><td>{valueOf(contract, 'contract_type')}</td><td>{formatDate(contract.sign_date)}</td><td>{formatDate(contract.start_date)}</td><td>{formatDate(contract.end_date)}</td><td>{valueOf(contract, 'status')}</td></tr>)}</tbody></table> : <p className="employee-cv-empty">Chưa có dữ liệu hợp đồng.</p>}
                </section>
                <section className="employee-cv-section">
                    <h3>3. Quá trình công tác</h3>
                    {workHistory.length ? <table><thead><tr><th>Ngày hiệu lực</th><th>Loại biến động</th><th>Bộ phận</th><th>Vị trí</th><th>Lý do</th></tr></thead><tbody>{workHistory.map((item, index) => <tr key={item.work_history_id || index}><td>{formatDate(item.effective_date)}</td><td>{valueOf(item, 'decision_type')}</td><td>{valueOf(item, 'department_name')}</td><td>{valueOf(item, 'position_name')}</td><td>{valueOf(item, 'reason')}</td></tr>)}</tbody></table> : <p className="employee-cv-empty">Chưa có dữ liệu quá trình công tác.</p>}
                </section>
                <section className="employee-cv-section">
                    <h3>4. Khen thưởng / kỷ luật</h3>
                    {rewards.length ? <table><thead><tr><th>Số quyết định</th><th>Loại</th><th>Ngày</th><th>Lý do</th><th>Người ký</th></tr></thead><tbody>{rewards.map((item, index) => <tr key={item.reward_discipline_id || index}><td>{valueOf(item, 'decision_no', 'decision_number')}</td><td>{valueOf(item, 'decision_type')}</td><td>{formatDate(item.decision_date)}</td><td>{valueOf(item, 'reason')}</td><td>{valueOf(item, 'decision_by')}</td></tr>)}</tbody></table> : <p className="employee-cv-empty">Chưa có dữ liệu khen thưởng hoặc kỷ luật.</p>}
                </section>
                <footer className="employee-cv-signature">Người lập hồ sơ<br /><strong>Phòng Hành chính Nhân sự</strong></footer>
            </article>
        </div>
    );
};

const DecisionPrintDocument = ({ document }) => {
    if (!document) return null;

    const kind = document.kind || 'transfer';
    if (kind === 'employee') return <EmployeeCvDocument document={document} />;
    const employeeName = valueOf(document, 'employee_name', 'full_name') || 'Ông/Bà ................................';
    const employeeCode = valueOf(document, 'employee_code');
    const currentDepartment = valueOf(document, 'current_dept_name', 'current_department', 'department_name') || '................................';
    const currentPosition = valueOf(document, 'current_pos_name', 'current_position', 'position_name') || '................................';
    const targetDepartment = valueOf(document, 'target_dept_name', 'new_department_name') || '................................';
    const targetPosition = valueOf(document, 'target_pos_name', 'new_position_name') || '................................';
    const signedBy = valueOf(document, 'signed_by', 'signer_name', 'decision_by') || 'Thủ trưởng cơ quan';
    const decisionDate = valueOf(document, 'decision_date', 'proposal_date', 'created_date');
    const effectiveDate = valueOf(document, 'effective_date', 'proposed_effective_date', 'start_date');
    const parts = dateParts(decisionDate);
    const decisionType = getDecisionType(document);
    const documentNumber = valueOf(document, 'decision_number', 'decision_no', 'contract_no', 'leave_code', 'proposal_code') || '...../TT';

    let subtitle = 'Về việc điều chỉnh nhân sự';
    if (kind === 'contract') subtitle = 'HỢP ĐỒNG LAO ĐỘNG';
    else if (kind === 'transfer-proposal') subtitle = `Về việc đề xuất ${decisionType.toLowerCase()} nhân sự`;
    else if (kind === 'leave') subtitle = 'Về việc phê duyệt đơn xin nghỉ phép';
    else if (kind === 'employee') subtitle = 'Về việc tiếp nhận và quản lý nhân sự';
    else if (kind === 'resignation') subtitle = 'Về việc chấm dứt hợp đồng lao động';
    else if (decisionType === 'Bổ nhiệm') subtitle = 'Về việc bổ nhiệm cán bộ';
    else if (decisionType === 'Miễn nhiệm') subtitle = 'Về việc miễn nhiệm chức vụ';

    const renderDecisionArticles = () => {
        if (kind === 'transfer-proposal') {
            return (
                <>
                    <p><b>1. Nội dung đề xuất:</b> Đề xuất {decisionType.toLowerCase()} đối với Ông/Bà <b>{employeeName}</b>{employeeCode ? ` (${employeeCode})` : ''}, hiện giữ vị trí {currentPosition} tại {currentDepartment}, chuyển sang vị trí <b>{targetPosition}</b> tại {targetDepartment}, kể từ ngày <b>{formatDate(effectiveDate)}</b>.</p>
                    <p><b>2. Lý do đề xuất:</b> {valueOf(document, 'reason', 'note') || 'Phù hợp yêu cầu công tác, năng lực và nhu cầu tổ chức nhân sự của đơn vị'}.</p>
                    <p><b>3. Kiến nghị:</b> Kính đề nghị Thủ trưởng cơ quan xem xét, phê duyệt để các bộ phận liên quan triển khai thực hiện.</p>
                </>
            );
        }
        if (kind === 'contract') {
            return (
                <>
                    <p><b>Điều 1.</b> Bên A tiếp nhận Ông/Bà <b>{employeeName}</b>{employeeCode ? ` (${employeeCode})` : ''} vào làm việc tại {currentDepartment}, chức danh {currentPosition} theo loại hợp đồng <b>{valueOf(document, 'contract_type') || '................................'}</b>.</p>
                    <p><b>Điều 2.</b> Thời hạn hợp đồng từ ngày <b>{formatDate(valueOf(document, 'start_date'))}</b> đến ngày <b>{formatDate(valueOf(document, 'end_date'))}</b>. Mức lương: <b>{Number(valueOf(document, 'base_salary', 'salary') || 0).toLocaleString('vi-VN')} đồng/tháng</b>.</p>
                    <p><b>Điều 3.</b> Hai bên có trách nhiệm thực hiện đầy đủ các quyền và nghĩa vụ theo hợp đồng, nội quy lao động và quy định hiện hành của Công ty.</p>
                    <p><b>Điều 4.</b> Các bộ phận liên quan và Ông/Bà <b>{employeeName}</b> có trách nhiệm thi hành hợp đồng này.</p>
                </>
            );
        }
        if (kind === 'leave') {
            return (
                <>
                    <p><b>Điều 1.</b> Phê duyệt cho Ông/Bà <b>{employeeName}</b>{employeeCode ? ` (${employeeCode})` : ''}, thuộc {currentDepartment}, được nghỉ từ ngày <b>{formatDate(valueOf(document, 'start_date'))}</b> đến ngày <b>{formatDate(valueOf(document, 'end_date'))}</b>, tổng số <b>{Number(valueOf(document, 'total_days') || 0).toFixed(2)} ngày</b>.</p>
                    <p><b>Điều 2.</b> Lý do nghỉ: {valueOf(document, 'reason') || '................................'}.</p>
                    <p><b>Điều 3.</b> Ông/Bà <b>{employeeName}</b> có trách nhiệm bàn giao công việc và chấp hành quy định của đơn vị trong thời gian nghỉ.</p>
                    <p><b>Điều 4.</b> Trưởng phòng, bộ phận hành chính nhân sự, tài chính - kế toán và Ông/Bà <b>{employeeName}</b> có trách nhiệm thi hành quyết định này.</p>
                </>
            );
        }
        if (kind === 'resignation') {
            return (
                <>
                    <p><b>Điều 1.</b> Nay cho Ông/Bà <b>{employeeName}</b>{employeeCode ? ` (${employeeCode})` : ''}, thuộc {currentDepartment}, chấm dứt hợp đồng lao động kể từ ngày <b>{formatDate(valueOf(document, 'official_resign_date', 'effective_date'))}</b>.</p>
                    <p><b>Điều 2.</b> Lý do chấm dứt: {valueOf(document, 'reason') || 'Theo đơn xin nghỉ việc và thỏa thuận của các bên'}.</p>
                    <p><b>Điều 3.</b> Ông/Bà <b>{employeeName}</b> có trách nhiệm hoàn tất bàn giao công việc, tài sản và các nghĩa vụ liên quan trước ngày nghỉ việc.</p>
                    <p><b>Điều 4.</b> Các bộ phận liên quan và Ông/Bà <b>{employeeName}</b> có trách nhiệm thi hành quyết định này.</p>
                </>
            );
        }
        if (kind === 'employee') {
            return (
                <>
                    <p><b>Điều 1.</b> Tiếp nhận và quản lý hồ sơ Ông/Bà <b>{employeeName}</b>{employeeCode ? ` (${employeeCode})` : ''}, làm việc tại {currentDepartment}, chức danh {currentPosition}, kể từ ngày <b>{formatDate(valueOf(document, 'join_date'))}</b>.</p>
                    <p><b>Điều 2.</b> Ông/Bà <b>{employeeName}</b> được hưởng các chế độ, quyền lợi và thực hiện nghĩa vụ theo vị trí công việc, hợp đồng lao động và quy định của Công ty.</p>
                    <p><b>Điều 3.</b> Bộ phận hành chính nhân sự, quản lý trực tiếp và Ông/Bà <b>{employeeName}</b> có trách nhiệm thi hành quyết định này.</p>
                </>
            );
        }
        if (decisionType === 'Bổ nhiệm') {
            return (
                <>
                    <p><b>Điều 1.</b> Nay bổ nhiệm Ông/Bà <b>{employeeName}</b>{employeeCode ? ` (${employeeCode})` : ''}, từ chức vụ {currentPosition} giữ chức vụ <b>{targetPosition}</b> tại {targetDepartment}, kể từ ngày <b>{formatDate(effectiveDate)}</b>.</p>
                    <p><b>Điều 2.</b> Ông/Bà <b>{employeeName}</b> có trách nhiệm thực hiện đầy đủ quyền hạn, nhiệm vụ của chức vụ được bổ nhiệm và chịu trách nhiệm trước Thủ trưởng cơ quan.</p>
                    <p><b>Điều 3.</b> Ông/Bà <b>{employeeName}</b> được hưởng lương và các khoản phụ cấp theo chức vụ mới kể từ ngày quyết định có hiệu lực.</p>
                    <p><b>Điều 4.</b> Các bộ phận liên quan và Ông/Bà <b>{employeeName}</b> có trách nhiệm thi hành quyết định này.</p>
                </>
            );
        }
        if (decisionType === 'Miễn nhiệm') {
            return (
                <>
                    <p><b>Điều 1.</b> Nay miễn nhiệm chức vụ <b>{currentPosition}</b> đối với Ông/Bà <b>{employeeName}</b>{employeeCode ? ` (${employeeCode})` : ''}, thuộc {currentDepartment}, kể từ ngày <b>{formatDate(effectiveDate)}</b>.</p>
                    <p><b>Điều 2.</b> Lý do miễn nhiệm: {valueOf(document, 'reason', 'note') || 'Theo yêu cầu công tác và sắp xếp nhân sự của đơn vị'}.</p>
                    <p><b>Điều 3.</b> Ông/Bà <b>{employeeName}</b> có trách nhiệm bàn giao công việc, hồ sơ và tài sản liên quan cho người được phân công.</p>
                    <p><b>Điều 4.</b> Các bộ phận liên quan và Ông/Bà <b>{employeeName}</b> có trách nhiệm thi hành quyết định này.</p>
                </>
            );
        }
        return (
            <>
                <p><b>Điều 1.</b> Nay điều chỉnh Ông/Bà <b>{employeeName}</b>{employeeCode ? ` (${employeeCode})` : ''} từ {currentPosition} thuộc {currentDepartment} đến nhận công tác tại {targetDepartment}, giữ vị trí <b>{targetPosition}</b>, kể từ ngày <b>{formatDate(effectiveDate)}</b>.</p>
                <p><b>Điều 2.</b> Lý do điều chỉnh người lao động: {valueOf(document, 'reason', 'note') || 'Theo yêu cầu công tác và khả năng cán bộ nhân viên'}.</p>
                <p><b>Điều 3.</b> Ông/Bà <b>{employeeName}</b> được hưởng lương và các khoản phụ cấp theo vị trí công tác mới kể từ ngày quyết định có hiệu lực.</p>
                <p><b>Điều 4.</b> Các ông/bà Chánh Văn phòng, Tài chính - Kế toán, Tổ chức cán bộ và Ông/Bà <b>{employeeName}</b> có trách nhiệm thi hành quyết định này.</p>
            </>
        );
    };

    return (
        <div className="decision-print-root" aria-hidden="true">
            <article className="decision-print-page">
                <header className="decision-print-header">
                    <div>
                        <strong>TÊN CƠ QUAN</strong>
                        <div>VĂN PHÒNG CÔNG TY CỔ PHẦN BRAVO</div>
                        <div className="decision-print-rule" />
                        <div>Số: {documentNumber}</div>
                    </div>
                    <div className="decision-print-national">
                        <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong>
                        <div>Độc lập - Tự do - Hạnh phúc</div>
                        <div className="decision-print-rule" />
                        <div>Hà Nội, ngày {parts.day} tháng {parts.month} năm {parts.year}</div>
                    </div>
                </header>

                <section className="decision-print-heading">
                    <h1>{kind === 'contract' ? 'HỢP ĐỒNG LAO ĐỘNG' : kind === 'transfer-proposal' ? 'TỜ TRÌNH' : 'QUYẾT ĐỊNH'}</h1>
                    <h2>{subtitle}</h2>
                </section>

                {kind !== 'contract' && <p className="decision-print-authority"><b>{kind === 'transfer-proposal' ? 'Kính gửi: Thủ trưởng cơ quan (đơn vị)' : 'Thủ trưởng cơ quan (đơn vị)'}</b></p>}
                {kind === 'contract' ? (
                    <div className="decision-print-intro">
                        <p>Căn cứ Bộ luật Lao động và các quy định hiện hành;</p>
                        <p>Căn cứ nhu cầu sử dụng lao động và sự thỏa thuận của hai bên;</p>
                        <p>Hôm nay, tại Công ty Cổ phần BRAVO, chúng tôi gồm:</p>
                        <p><b>BÊN A - NGƯỜI SỬ DỤNG LAO ĐỘNG:</b> {signedBy}</p>
                        <p><b>BÊN B - NGƯỜI LAO ĐỘNG:</b> {employeeName}{employeeCode ? ` (${employeeCode})` : ''}</p>
                    </div>
                ) : (
                    <div className="decision-print-intro">
                        <p>- Căn cứ vào quyết định số ...... /KH, ngày ...... tháng ...... năm ............ của .......................... về việc thành lập cơ quan, đơn vị;</p>
                        <p>- Căn cứ vào hồ sơ, đề xuất và nhu cầu công tác của đơn vị;</p>
                        <p>- Xét yêu cầu công tác và khả năng cán bộ nhân viên;</p>
                        <p>- Xét đề nghị của Trưởng phòng Tổ chức cán bộ.</p>
                    </div>
                )}

                {kind !== 'contract' && kind !== 'transfer-proposal' && <p className="decision-print-authority decision-print-center"><b>QUYẾT ĐỊNH</b></p>}
                <section className="decision-print-articles">{renderDecisionArticles()}</section>

                <footer className="decision-print-footer">
                    <div>
                        <b>Nơi nhận:</b>
                        <div>- Như trên;</div>
                        <div>- Lưu VP.</div>
                    </div>
                    <div className="decision-print-signature">
                        <b>{kind === 'contract' ? 'ĐẠI DIỆN BÊN A' : kind === 'transfer-proposal' ? 'NGƯỜI LẬP TỜ TRÌNH' : 'THỦ TRƯỞNG CƠ QUAN'}</b>
                        <span>(ký tên đóng dấu)</span>
                        <strong>{signedBy}</strong>
                    </div>
                </footer>
            </article>
        </div>
    );
};

export default DecisionPrintDocument;
