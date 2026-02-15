import { useToastStore } from '../stores/toastStore';
import type { ToastType } from '../stores/toastStore';

const toastColors: Record<ToastType, { bg: string; border: string; color: string }> = {
  success: { bg: '#0a2a1a', border: '#1a5a3a', color: '#44ff88' },
  error: { bg: '#2a0a0a', border: '#5a1a1a', color: '#ff6b6b' },
  info: { bg: '#0a0a2a', border: '#1a1a5a', color: '#7c8aff' },
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    }}>
      {toasts.map((toast) => {
        const colors = toastColors[toast.type];
        return (
          <div
            key={toast.id}
            style={{
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              color: colors.color,
              padding: '12px 20px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              minWidth: '240px',
              maxWidth: '400px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            }}
            onClick={() => removeToast(toast.id)}
          >
            {toast.message}
          </div>
        );
      })}
    </div>
  );
}
