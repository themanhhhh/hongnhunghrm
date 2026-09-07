import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Lock,
    User,
    Mail,
    ArrowLeft,
    CheckCircle2,
    Eye,
    EyeOff,
    AlertCircle,
    Building2,
    ArrowRight
} from 'lucide-react';

export const Login = () => {
    const { login } = useAuth();

    // View states: 'LOGIN' | 'FORGOT_PASSWORD'
    const [viewMode, setViewMode] = useState('LOGIN');

    // Form states
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [email, setEmail] = useState('');

    // Status & Feedback states
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [forgotSuccess, setForgotSuccess] = useState(false);

    // Handle Login Submit
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');

        if (!username.trim()) {
            setErrorMessage('Vui lòng nhập tên người dùng.');
            return;
        }
        if (!password.trim()) {
            setErrorMessage('Vui lòng nhập mật khẩu.');
            return;
        }

        setLoading(true);
        const res = await login(username.trim(), password.trim());
        setLoading(false);

        if (!res.success) {
            setErrorMessage(res.message || 'Tên người dùng hoặc mật khẩu không chính xác.');
        }
    };

    // Handle Forgot Password Submit
    const handleForgotSubmit = (e) => {
        e.preventDefault();
        setErrorMessage('');

        if (!email.trim() || !email.includes('@')) {
            setErrorMessage('Vui lòng nhập Email công ty hợp lệ.');
            return;
        }

        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setForgotSuccess(true);
        }, 800);
    };

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            minHeight: '650px',
            display: 'flex',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            backgroundColor: '#F4F8F7',
            color: '#0F172A',
            overflow: 'hidden'
        }}>
            <style>{`
        @media (max-width: 900px) {
          .login-split-container {
            flex-direction: column !important;
          }
          .login-branding-col {
            display: none !important;
          }
          .login-form-col {
            width: 100% !important;
            padding: 1.5rem !important;
          }
        }
      `}</style>

            {/* 1. LEFT BRANDING COLUMN (~45% WIDTH) - TEAL/EMERALD GREEN PALETTE */}
            <div className="login-branding-col" style={{
                width: '45%',
                position: 'relative',
                backgroundColor: '#1C473E',
                backgroundImage: `linear-gradient(135deg, rgba(28, 71, 62, 0.94) 0%, rgba(13, 42, 36, 0.97) 100%), url('/login-bg.png')`,
                backgroundPosition: 'center center',
                backgroundSize: 'cover',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '3.5rem 3rem',
                color: '#FFFFFF',
                boxSizing: 'border-box'
            }}>
                {/* Top Branding Section */}
                <div>
                    {/* Logo & ERP Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '2.5rem' }}>
                        <div style={{
                            background: '#2D6F62',
                            color: '#FFFFFF',
                            fontWeight: 900,
                            padding: '0.45rem 0.85rem',
                            borderRadius: '8px',
                            fontSize: '1.15rem',
                            letterSpacing: '0.05em',
                            boxShadow: '0 4px 12px rgba(45, 111, 98, 0.4)'
                        }}>
                            BRAVO
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 800, fontSize: '1.15rem', color: '#F8FAFC', letterSpacing: '-0.02em' }}>
                                BRAVO 10 ERP
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#64D2B7', fontWeight: 600 }}>
                                Enterprise Management Software
                            </span>
                        </div>
                    </div>

                    {/* Portal Title & Description */}
                    <div style={{ marginTop: '2.5rem' }}>
                        <div style={{
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: '#64D2B7',
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            marginBottom: '0.5rem'
                        }}>
                            Hệ thống Quản trị Doanh nghiệp
                        </div>
                        <h1 style={{
                            fontSize: '2.25rem',
                            fontWeight: 900,
                            lineHeight: 1.2,
                            margin: '0 0 1rem 0',
                            color: '#FFFFFF',
                            letterSpacing: '-0.02em'
                        }}>
                            CỔNG NHÂN SỰ
                        </h1>
                        <p style={{
                            fontSize: '0.95rem',
                            color: '#A3D9CE',
                            lineHeight: 1.6,
                            maxWidth: '400px',
                            margin: 0
                        }}>
                            Quản lý Tuyển dụng, Hồ sơ nhân sự, Đánh giá & Phân quyền trong một nền tảng duy nhất.
                        </p>
                    </div>
                </div>

                {/* Bottom Trust Line */}
                <div style={{
                    borderTop: '1px solid rgba(255, 255, 255, 0.12)',
                    paddingTop: '1.5rem',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#64D2B7',
                    letterSpacing: '0.05em'
                }}>
                    AN TOÀN – BẢO MẬT
                </div>
            </div>

            {/* 2. RIGHT LOGIN FORM COLUMN (~55% WIDTH) */}
            <div className="login-form-col" style={{
                flex: 1,
                backgroundColor: '#F4F8F7',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2.5rem',
                position: 'relative',
                boxSizing: 'border-box'
            }}>
                {/* Main Login Card */}
                <div style={{
                    width: '100%',
                    maxWidth: '440px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 10px 30px rgba(45, 111, 98, 0.06)',
                    padding: '2.5rem',
                    boxSizing: 'border-box'
                }}>
                    {/* Header section inside card */}
                    <div style={{ marginBottom: '1.75rem' }}>
                        <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '12px',
                            backgroundColor: '#E8F4F1',
                            color: '#2D6F62',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '1rem'
                        }}>
                            <Building2 size={24} color="#2D6F62" />
                        </div>

                        <h2 style={{
                            fontSize: '1.35rem',
                            fontWeight: 800,
                            color: '#0F172A',
                            margin: '0 0 0.35rem 0'
                        }}>
                            {viewMode === 'LOGIN' ? 'Đăng nhập Cổng Nhân sự' : 'Khôi phục Mật khẩu'}
                        </h2>
                        <p style={{
                            fontSize: '0.85rem',
                            color: '#64748B',
                            margin: 0
                        }}>
                            {viewMode === 'LOGIN' ? 'Vui lòng nhập thông tin tài khoản để tiếp tục' : 'Nhập email công ty để nhận liên kết đặt lại mật khẩu'}
                        </p>
                    </div>

                    {/* Validation Alert */}
                    {errorMessage && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                            backgroundColor: '#FEF2F2',
                            border: '1px solid #FCA5A5',
                            color: '#991B1B',
                            padding: '0.75rem 1rem',
                            borderRadius: '10px',
                            fontSize: '0.825rem',
                            fontWeight: 500,
                            marginBottom: '1.25rem'
                        }}>
                            <AlertCircle size={18} style={{ flexShrink: 0 }} />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    {/* VIEW MODE 1: LOGIN FORM */}
                    {viewMode === 'LOGIN' && (
                        <form onSubmit={handleLoginSubmit}>
                            {/* Field 1: Username */}
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.825rem',
                                    fontWeight: 600,
                                    color: '#334155',
                                    marginBottom: '0.4rem'
                                }}>
                                    Tên người dùng
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <User
                                        size={18}
                                        style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
                                    />
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="Nhập tên người dùng"
                                        style={{
                                            width: '100%',
                                            height: '44px',
                                            paddingLeft: '2.6rem',
                                            paddingRight: '1rem',
                                            borderRadius: '8px',
                                            border: '1px solid #CBD5E1',
                                            backgroundColor: '#FFFFFF',
                                            fontSize: '0.9rem',
                                            color: '#0F172A',
                                            outline: 'none',
                                            boxSizing: 'border-box',
                                            transition: 'border-color 0.15s ease'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#2D6F62'}
                                        onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
                                    />
                                </div>
                            </div>

                            {/* Field 2: Password */}
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.825rem',
                                    fontWeight: 600,
                                    color: '#334155',
                                    marginBottom: '0.4rem'
                                }}>
                                    Mật khẩu
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <Lock
                                        size={18}
                                        style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
                                    />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Nhập mật khẩu"
                                        style={{
                                            width: '100%',
                                            height: '44px',
                                            paddingLeft: '2.6rem',
                                            paddingRight: '2.6rem',
                                            borderRadius: '8px',
                                            border: '1px solid #CBD5E1',
                                            backgroundColor: '#FFFFFF',
                                            fontSize: '0.9rem',
                                            color: '#0F172A',
                                            outline: 'none',
                                            boxSizing: 'border-box',
                                            transition: 'border-color 0.15s ease'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#2D6F62'}
                                        onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute',
                                            right: '12px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            color: '#94A3B8',
                                            cursor: 'pointer',
                                            padding: '4px',
                                            display: 'flex',
                                            alignItems: 'center'
                                        }}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Checkbox Remember Me & Forgot Password Link */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '1.5rem',
                                fontSize: '0.825rem'
                            }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', color: '#475569', fontWeight: 500 }}>
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        style={{ cursor: 'pointer', accentColor: '#2D6F62' }}
                                    />
                                    <span>Ghi nhớ đăng nhập</span>
                                </label>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setViewMode('FORGOT_PASSWORD');
                                        setErrorMessage('');
                                        setForgotSuccess(false);
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#2D6F62',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        padding: 0
                                    }}
                                >
                                    Quên mật khẩu?
                                </button>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    width: '100%',
                                    height: '46px',
                                    backgroundColor: loading ? '#94A3B8' : '#2D6F62',
                                    color: '#FFFFFF',
                                    fontWeight: 700,
                                    fontSize: '0.95rem',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    boxShadow: '0 4px 12px rgba(45, 111, 98, 0.3)',
                                    transition: 'background-color 0.15s ease'
                                }}
                            >
                                <span>{loading ? 'Đang xác thực...' : 'Đăng nhập'}</span>
                                <ArrowRight size={18} />
                            </button>
                        </form>
                    )}

                    {/* VIEW MODE 2: FORGOT PASSWORD */}
                    {viewMode === 'FORGOT_PASSWORD' && (
                        <div>
                            {forgotSuccess ? (
                                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                                    <CheckCircle2 size={48} color="#10B981" style={{ marginBottom: '0.75rem' }} />
                                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.5rem' }}>
                                        Yêu cầu đã được tiếp nhận!
                                    </h3>
                                    <p style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                                        Hướng dẫn khôi phục mật khẩu đã được gửi đến email <b>{email}</b>. Vui lòng kiểm tra hộp thư.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setViewMode('LOGIN');
                                            setForgotSuccess(false);
                                        }}
                                        style={{
                                            width: '100%',
                                            height: '42px',
                                            backgroundColor: '#2D6F62',
                                            color: '#FFFFFF',
                                            fontWeight: 700,
                                            borderRadius: '8px',
                                            border: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Quay lại Đăng nhập
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleForgotSubmit}>
                                    <div style={{ marginBottom: '1.25rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                                            Email công ty
                                        </label>
                                        <div style={{ position: 'relative' }}>
                                            <Mail
                                                size={18}
                                                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
                                            />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="VD: nguyenanh@example.com"
                                                style={{
                                                    width: '100%',
                                                    height: '44px',
                                                    paddingLeft: '2.6rem',
                                                    paddingRight: '1rem',
                                                    borderRadius: '8px',
                                                    border: '1px solid #CBD5E1',
                                                    backgroundColor: '#FFFFFF',
                                                    fontSize: '0.9rem',
                                                    color: '#0F172A',
                                                    outline: 'none',
                                                    boxSizing: 'border-box'
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        style={{
                                            width: '100%',
                                            height: '44px',
                                            backgroundColor: '#2D6F62',
                                            color: '#FFFFFF',
                                            fontWeight: 700,
                                            fontSize: '0.9rem',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: loading ? 'not-allowed' : 'pointer',
                                            marginBottom: '1rem'
                                        }}
                                    >
                                        {loading ? 'Đang gửi...' : 'Gửi yêu cầu khôi phục'}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setViewMode('LOGIN');
                                            setErrorMessage('');
                                        }}
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.35rem',
                                            background: 'none',
                                            border: 'none',
                                            color: '#64748B',
                                            fontSize: '0.825rem',
                                            fontWeight: 600,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <ArrowLeft size={16} />
                                        <span>Quay lại Đăng nhập</span>
                                    </button>
                                </form>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    marginTop: '2rem',
                    fontSize: '0.775rem',
                    color: '#94A3B8',
                    fontWeight: 500
                }}>
                    © 2026 BRAVO ERP | Cổng Nhân sự - Software JSC
                </div>
            </div>
        </div>
    );
};