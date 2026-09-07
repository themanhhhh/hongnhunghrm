import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Settings,
    ClipboardList,
    Users,
    Award,
    BarChart3,
    Building2,
    Briefcase,
    UserCheck,
    FileText,
    Calendar,
    Gift,
    ShieldAlert,
    ChevronRight,
    TrendingUp
} from 'lucide-react';

export const Sidebar = ({ currentTab, setCurrentTab, activeSubTab, setActiveSubTab }) => {
    const { user } = useAuth();

    const allMenuGroups = [
        {
            title: 'TỔNG QUAN',
            items: [
                { id: 'Dashboard', label: 'Dashboard ERP', icon: LayoutDashboard }
            ]
        },
        {
            title: 'HỆ THỐNG',
            requiredRole: 'Administrator', // ONLY Administrator can see this group
            items: [
                {
                    id: 'AdminModule',
                    label: 'Quản trị hệ thống',
                    icon: Settings,
                    subItems: [
                        'Tài khoản & Phân quyền',
                        'Danh mục Bộ phận',
                        'Danh mục Vị trí công việc',
                        'Danh mục Loại HĐLĐ'
                    ]
                }
            ]
        },
        {
            title: 'QUY TRÌNH NGHIỆP VỤ',
            items: [
                {
                    id: 'RecruitmentModule',
                    label: 'Quản lý tuyển dụng',
                    icon: ClipboardList,
                    subItems: [
                        'Định biên nhân sự',
                        'Yêu cầu tuyển dụng',
                        'Hồ sơ ứng viên',
                        'Sơ loại',
                        'Lịch Phỏng vấn',
                        'Đánh giá phỏng vấn',
                        'Offer',
                        'Chuyển thành nhân viên'
                    ]
                },
                {
                    id: 'HRModule',
                    label: 'Quản lý nhân sự',
                    icon: Users,
                    subItems: [
                        'Hồ sơ nhân sự',
                        'Hợp đồng lao động',
                        'Đơn xin nghỉ phép',
                        'Đề xuất thuyên chuyển, bổ nhiệm, miễn nhiệm',
                        'Quyết định thuyên chuyển, bổ nhiệm'
                    ]
                },
                {
                    id: 'RewardDisciplineModule',
                    label: 'Khen thưởng & Kỷ luật',
                    icon: Award,
                    subItems: [
                        'Tiêu chí đánh giá nhân viên',
                        'Phiếu đánh giá nhân viên',
                        'Đề xuất khen thưởng/kỷ luật',
                        'Quyết định khen thưởng kỷ luật',
                        'Tra cứu lịch sử'
                    ]
                }
            ]
        },
        {
            title: 'BÁO CÁO & PHÂN TÍCH',
            items: [
                {
                    id: 'ReportsModule',
                    label: 'Báo cáo thống kê',
                    icon: BarChart3
                }
            ]
        }
    ];

    const isEmployeeRole = user?.roleName === 'Nhân viên';

    // RBAC Menu Filtering: Hide groups/modules/subItems according to user role
    // Nhân viên thường: chỉ được vào HRModule (giới hạn còn Hồ sơ nhân sự + Đơn xin nghỉ phép) - không vào Tuyển dụng/Khen thưởng-Kỷ luật/Báo cáo/Quản trị
    const menuGroups = allMenuGroups.map(group => {
        // 1. System Group requiring Administrator role
        if (group.requiredRole && user?.roleName !== group.requiredRole) {
            return null;
        }

        // Filter items inside group
        const filteredItems = group.items.filter(item => {
            // AdminModule restricted strictly to Administrator
            if (item.id === 'AdminModule' && user?.roleName !== 'Administrator') {
                return false;
            }
            // Nhân viên thường không được vào: Dashboard, Tuyển dụng, Khen thưởng/Kỷ luật, Báo cáo thống kê
            if (isEmployeeRole) {
                if (item.id === 'Dashboard' || item.id === 'RecruitmentModule' || item.id === 'RewardDisciplineModule' || item.id === 'ReportsModule') {
                    return false;
                }
            }
            return true;
        }).map(item => {
            // Nhân viên thường vào HRModule chỉ thấy Hồ sơ nhân sự (của chính mình) và Đơn xin nghỉ phép
            if (item.id === 'HRModule' && isEmployeeRole) {
                return {
                    ...item,
                    subItems: ['Hồ sơ nhân sự', 'Đơn xin nghỉ phép']
                };
            }
            return item;
        });

        if (filteredItems.length === 0) return null;

        return {
            ...group,
            items: filteredItems
        };
    }).filter(Boolean);

    return (
        <aside style={{
            width: '260px',
            backgroundColor: 'var(--sidebar-bg)',
            color: 'white',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid #1E293B',
            flexShrink: 0
        }}>
            {/* Brand Header with BRAVO Teal Color */}
            <div style={{
                padding: '1.25rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                borderBottom: '1px solid #1E293B'
            }}>
                {/* Render SVG Logo matching BRAVO brand color */}
                <div style={{
                    background: 'var(--bravo-teal)',
                    color: 'white',
                    fontWeight: 900,
                    padding: '0.4rem 0.6rem',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    letterSpacing: '0.05em'
                }}>
                    BRAVO
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: '#F8FAFC', letterSpacing: '-0.02em' }}>
                        HRM System
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--bravo-teal)', fontWeight: 600 }}>
                        Software JSC
                    </span>
                </div>
            </div>

            {/* Navigation Links */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 0.75rem' }}>
                {menuGroups.map((group, gIdx) => (
                    <div key={gIdx} style={{ marginBottom: '1.25rem' }}>
                        <div style={{
                            fontSize: '0.675rem',
                            fontWeight: 700,
                            color: '#64748B',
                            letterSpacing: '0.08em',
                            padding: '0 0.75rem 0.5rem 0.75rem'
                        }}>
                            {group.title}
                        </div>

                        {group.items.map((item) => {
                            const Icon = item.icon;
                            const isActive = currentTab === item.id;

                            return (
                                <div key={item.id} style={{ marginBottom: '0.25rem' }}>
                                    <button
                                        onClick={() => {
                                            setCurrentTab(item.id);
                                            if (item.subItems && item.subItems.length > 0) {
                                                setActiveSubTab(item.subItems[0]);
                                            } else {
                                                setActiveSubTab('');
                                            }
                                        }}
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '0.65rem 0.75rem',
                                            borderRadius: '8px',
                                            border: 'none',
                                            backgroundColor: isActive ? 'var(--bravo-teal)' : 'transparent',
                                            color: isActive ? '#FFFFFF' : 'var(--sidebar-text)',
                                            fontWeight: isActive ? 600 : 400,
                                            fontSize: '0.875rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s ease'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <Icon size={18} color={isActive ? '#FFFFFF' : 'var(--bravo-teal)'} />
                                            <span>{item.label}</span>
                                        </div>
                                        {item.subItems && (
                                            <ChevronRight
                                                size={14}
                                                style={{
                                                    transform: isActive ? 'rotate(90deg)' : 'rotate(0deg)',
                                                    transition: 'transform 0.2s ease'
                                                }}
                                            />
                                        )}
                                    </button>

                                    {/* Submenu items */}
                                    {isActive && item.subItems && (
                                        <div style={{
                                            paddingLeft: '2rem',
                                            marginTop: '0.25rem',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.2rem',
                                            borderLeft: '2px solid rgba(79, 166, 148, 0.3)',
                                            marginLeft: '1.25rem'
                                        }}>
                                            {item.subItems.map((sub, sIdx) => {
                                                const isSubActive = activeSubTab === sub;
                                                return (
                                                    <button
                                                        key={sIdx}
                                                        onClick={() => setActiveSubTab(sub)}
                                                        style={{
                                                            textAlign: 'left',
                                                            padding: '0.4rem 0.6rem',
                                                            borderRadius: '6px',
                                                            border: 'none',
                                                            backgroundColor: isSubActive ? 'rgba(79, 166, 148, 0.15)' : 'transparent',
                                                            color: isSubActive ? 'var(--bravo-teal)' : '#94A3B8',
                                                            fontWeight: isSubActive ? 600 : 400,
                                                            fontSize: '0.8rem',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.15s ease'
                                                        }}
                                                    >
                                                        • {sub}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Footer Info */}
            <div style={{
                padding: '0.875rem 1rem',
                borderTop: '1px solid #1E293B',
                fontSize: '0.75rem',
                color: '#64748B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <span>Phiên bản: <b>BRAVO 10 ERP</b></span>
                <span style={{ color: 'var(--bravo-teal)', fontWeight: 600 }}>v1.0.0</span>
            </div>
        </aside>
    );
};