import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

export const Header = ({ currentTab, activeSubTab }) => {
    const { user, logout } = useAuth();

    return (
        <header style={{
            height: '70px',
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            zIndex: 10
        }}>
            {/* Left: Breadcrumbs & Current Page Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                    background: 'var(--bravo-teal-light)',
                    color: 'var(--bravo-teal-dark)',
                    padding: '0.4rem 0.6rem',
                    borderRadius: '6px',
                    fontWeight: 700,
                    fontSize: '0.85rem'
                }}>
                    BRAVO HRM
                </div>
                <span style={{ color: '#94A3B8', fontSize: '0.9rem' }}>/</span>
                <span style={{ fontWeight: 600, color: '#0F172A', fontSize: '1.05rem' }}>
                    {currentTab} {activeSubTab ? `› ${activeSubTab}` : ''}
                </span>
            </div>

            {/* Right: User Info & Logout Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>

                {/* User Card & Logout Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--bravo-teal-light)',
                        color: 'var(--bravo-teal-dark)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        border: '2px solid var(--bravo-teal)'
                    }}>
                        {user?.fullName ? user.fullName.charAt(0) : 'B'}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>
                            {user?.fullName || 'Nguyễn Văn Quản Trị'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--bravo-teal-dark)', fontWeight: 500 }}>
                            {user?.roleName || 'Administrator'} • {user?.deptName || 'BRAVO ERP'}
                        </span>
                    </div>

                    <button
                        onClick={logout}
                        title="Đăng xuất khỏi hệ thống"
                        style={{
                            marginLeft: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.45rem 0.75rem',
                            backgroundColor: '#FEF2F2',
                            color: '#EF4444',
                            border: '1px solid #FCA5A5',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        <LogOut size={15} />
                        <span>Đăng xuất</span>
                    </button>
                </div>
            </div>
        </header>
    );
};