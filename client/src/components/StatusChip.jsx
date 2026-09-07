import React from 'react';

export const StatusChip = ({ status }) => {
  let badgeClass = 'badge-gray';
  let label = status;

  switch (status) {
    // Recruitment Request Approval Status
    case 'PENDING':
    case 'Chờ duyệt':
      badgeClass = 'badge-yellow';
      label = 'Chờ phê duyệt';
      break;
    case 'APPROVED':
    case 'Đã duyệt':
      badgeClass = 'badge-teal';
      label = 'Đã phê duyệt';
      break;
    case 'REJECTED':
    case 'Từ chối':
      badgeClass = 'badge-red';
      label = 'Từ chối / Loại';
      break;

    // Candidate Status
    case 'SUBMITTED':
      badgeClass = 'badge-blue';
      label = 'Mới tiếp nhận';
      break;
    case 'SCREENING':
      badgeClass = 'badge-yellow';
      label = 'Đang sàng lọc';
      break;
    case 'INTERVIEWING':
      badgeClass = 'badge-teal';
      label = 'Đang phỏng vấn';
      break;
    case 'OFFERED':
      badgeClass = 'badge-teal';
      label = 'Đã tạo Offer';
      break;
    case 'HIRED':
      badgeClass = 'badge-green';
      label = 'Đã tuyển (Nhân viên)';
      break;

    // Interview Results
    case 'PASSED':
      badgeClass = 'badge-green';
      label = 'Đạt phỏng vấn';
      break;

    // Employee & Work Status
    case 'WORKING':
    case 'ACTIVE':
      badgeClass = 'badge-green';
      label = 'Đang làm việc / Hoạt động';
      break;
    case 'RESIGNED':
      badgeClass = 'badge-red';
      label = 'Đã nghỉ việc';
      break;

    // Offer Status
    case 'SENT':
      badgeClass = 'badge-blue';
      label = 'Đã gửi Offer';
      break;
    case 'ACCEPTED':
      badgeClass = 'badge-green';
      label = 'Ứng viên Chấp nhận';
      break;

    // Reward / Discipline
    case 'KHEN_THUONG':
      badgeClass = 'badge-teal';
      label = 'Khen thưởng';
      break;
    case 'KY_LUAT':
      badgeClass = 'badge-red';
      label = 'Kỷ luật';
      break;

    default:
      badgeClass = 'badge-gray';
  }

  return <span className={`badge ${badgeClass}`}>{label}</span>;
};
