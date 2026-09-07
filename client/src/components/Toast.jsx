import React from 'react';
import { useNotification } from '../context/NotificationContext';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

export const ToastContainer = () => {
  const { toasts, removeToast } = useNotification();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.5rem',
      right: '1.5rem',
      zIndex: 2000,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      maxWidth: '380px'
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
            style={{
              background: bg,
              borderRadius: '8px',
              borderLeft: `4px solid ${borderColor}`,
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
              padding: '0.875rem 1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              animation: 'slideUp 0.25 ease-out'
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
  );
};
