import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ToastContainer } from './components/Toast';

import { Dashboard } from './pages/Dashboard';
import { AdminModule } from './pages/AdminModule';
import { RecruitmentModule } from './pages/RecruitmentModule';
import { HRModule } from './pages/HRModule';
import { RewardDisciplineModule } from './pages/RewardDisciplineModule';
import { ReportsModule } from './pages/ReportsModule';

import { Login } from './pages/Login';
import { ShieldAlert } from 'lucide-react';

const MainAppContent = () => {
    const { user } = useAuth();
    const [currentTab, setCurrentTab] = useState('Dashboard');
    const [activeSubTab, setActiveSubTab] = useState('');

    // Nhân viên thường KHÔNG có Dashboard - tự động chuyển vào Hồ sơ nhân sự (bản thân) ngay sau đăng nhập
    useEffect(() => {
        if (user?.roleName === 'Nhân viên') {
            setCurrentTab('HRModule');
            setActiveSubTab('Hồ sơ nhân sự');
        }
    }, [user?.roleName]);

    // 1. Unauthenticated -> Render Login Screen
    if (!user) {
        return <Login />;
    }

    // 2. Protected Module Access Guard
    const renderModuleContent = () => {
        // Nhân viên thường không có Dashboard trong bất kỳ trường hợp nào
        if (user.roleName === 'Nhân viên' && (currentTab === 'Dashboard' || !currentTab)) {
            return <HRModule activeSubTab="Hồ sơ nhân sự" />;
        }

        switch (currentTab) {
            case 'Dashboard':
                return <Dashboard setCurrentTab={setCurrentTab} setActiveSubTab={setActiveSubTab} />;

            case 'AdminModule':
                // RBAC Guard: Only Administrator can access AdminModule
                if (user.roleName !== 'Administrator') {
                    return (
                        <div style={{
                            padding: '3rem 2rem',
                            textAlign: 'center',
                            backgroundColor: '#FFFFFF',
                            borderRadius: '12px',
                            border: '1px solid #E2E8F0',
                            marginTop: '1rem'
                        }}>
                            <ShieldAlert size={48} color="#EF4444" style={{ marginBottom: '1rem' }} />
                            <h2 style={{ color: '#0F172A', fontSize: '1.25rem', margin: '0 0 0.5rem 0' }}>
                                Truy cập bị từ chối (Access Denied)
                            </h2>
                            <p style={{ color: '#64748B', fontSize: '0.9rem', maxWidth: '500px', margin: '0 auto 1.5rem auto' }}>
                                Tài khoản của bạn với vai trò <b>{user.roleName}</b> không có quyền truy cập vào module <b>Quản trị hệ thống</b>. Vui lòng liên hệ IT Quản trị hệ thống nếu cần cấp quyền.
                            </p>
                            <button
                                className="btn btn-primary"
                                onClick={() => setCurrentTab('Dashboard')}
                            >
                                Quay về Trang chủ Dashboard
                            </button>
                        </div>
                    );
                }
                return <AdminModule activeSubTab={activeSubTab} />;

            case 'RecruitmentModule':
                return <RecruitmentModule activeSubTab={activeSubTab} />;
            case 'HRModule':
                return <HRModule activeSubTab={activeSubTab} />;
            case 'RewardDisciplineModule':
                return <RewardDisciplineModule activeSubTab={activeSubTab} />;
            case 'ReportsModule':
                return <ReportsModule activeSubTab={activeSubTab} />;
            default:
                return <Dashboard setCurrentTab={setCurrentTab} setActiveSubTab={setActiveSubTab} />;
        }
    };

    return (
        <div className="app-container">
            {/* Sidebar Navigation */}
            <Sidebar
                currentTab={currentTab}
                setCurrentTab={setCurrentTab}
                activeSubTab={activeSubTab}
                setActiveSubTab={setActiveSubTab}
            />

            {/* Main Layout Area */}
            <div className="main-layout">
                <Header currentTab={currentTab} activeSubTab={activeSubTab} />
                <div className="content-body">
                    {renderModuleContent()}
                </div>
            </div>

            {/* Toast Notifications */}
            <ToastContainer />
        </div>
    );
};

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("BRAVO HRM UI Error Boundary Caught:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem',
                    fontFamily: 'Inter, sans-serif',
                    backgroundColor: '#F8FAFC',
                    color: '#1E293B',
                    textAlign: 'center'
                }}>
                    <h2 style={{ color: '#2D6F62', fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.75rem' }}>
                        Hệ thống BRAVO HRM đang khởi tạo lại...
                    </h2>
                    <p style={{ color: '#64748B', marginBottom: '1rem', maxWidth: '520px', lineHeight: 1.5, fontSize: '0.9rem' }}>
                        Đã xảy ra sự cố hiển thị tạm thời khi chuyển đổi dữ liệu. Vui lòng bấm nút bên dưới để khôi phục màn hình làm việc.
                    </p>

                    {this.state.error && (
                        <div style={{
                            backgroundColor: '#FEF2F2',
                            border: '1px solid #FCA5A5',
                            color: '#991B1B',
                            padding: '0.75rem 1rem',
                            borderRadius: '8px',
                            maxWidth: '650px',
                            fontSize: '0.8rem',
                            textAlign: 'left',
                            marginBottom: '1.25rem',
                            wordBreak: 'break-word',
                            maxHeight: '150px',
                            overflowY: 'auto'
                        }}>
                            <b>Lỗi chi tiết:</b> {this.state.error.toString()}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                            onClick={() => {
                                this.setState({ hasError: false, error: null });
                                window.location.reload();
                            }}
                            style={{
                                padding: '0.65rem 1.25rem',
                                backgroundColor: '#2D6F62',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                fontSize: '0.875rem'
                            }}
                        >
                            🔄 Tải lại giao diện
                        </button>
                        <button
                            onClick={() => {
                                localStorage.removeItem('bravo_hrm_user');
                                window.location.reload();
                            }}
                            style={{
                                padding: '0.65rem 1.25rem',
                                backgroundColor: '#F1F5F9',
                                color: '#475569',
                                border: '1px solid #CBD5E1',
                                borderRadius: '8px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                fontSize: '0.875rem'
                            }}
                        >
                            🧹 Đăng nhập lại
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

export default function App() {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <NotificationProvider>
                    <MainAppContent />
                </NotificationProvider>
            </AuthProvider>
        </ErrorBoundary>
    );
}