import React from 'react';
import { useNotification } from '../context/NotificationContext';
import { CheckCircle2, AlertTriangle, XCircle, X } from 'lucide-react';

export const ToastContainer = () => {
  const { toasts, removeToast } = useNotification();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      background: 'rgba(15, 23, 42, 0.42)',
      backdropFilter: 'blur(3px)'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        width: 'min(100%, 440px)'
      }}>
        {toasts.map((toast) => {
        let bg = 'white';
        let borderColor = 'var(--bravo-teal)';
        let Icon = CheckCircle2;
        let iconColor = 'var(--bravo-teal)';

        if (toast.type === 'error') {
          borderColor = '#EF4444';
          Icon = XCircle;
          iconColor = '#EF4444';
        } else if (toast.type === 'warning') {
          borderColor = '#F59E0B';
          Icon = AlertTriangle;
          iconColor = '#F59E0B';
        }

        return (
          <div
            key={toast.id}
            role="alertdialog"
            aria-live="assertive"
            style={{
              background: bg,
              borderRadius: '12px',
              border: `1px solid ${borderColor}`,
              borderTop: `4px solid ${borderColor}`,
              boxShadow: '0 20px 45px -12px rgba(0,0,0,0.3)',
              padding: '1.25rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              animation: 'slideUp 0.25s ease-out'
            }}
          >
            <Icon size={20} color={iconColor} style={{ marginTop: '2px', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              {toast.title && (
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0F172A', marginBottom: '2px' }}>
                  {toast.title}
                </div>
              )}
              <div style={{ fontSize: '0.825rem', color: '#334155' }}>
                {toast.message}
              </div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94A3B8' }}
            >
              <X size={16} />
            </button>
          </div>
        );
        })}
      </div>
    </div>
  );
};
