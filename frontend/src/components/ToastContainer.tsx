import { useToastStore } from '../stores/toastStore';
import { COLORS } from '../styles/constants';
import type { ToastType } from '../stores/toastStore';

const toastColors: Record<ToastType, { bg: string; border: string; color: string }> = {
  success: { bg: '#0a2a18', border: '#1a5a38', color: COLORS.SUCCESS },
  error: { bg: '#2a0a0a', border: '#5a1a1a', color: COLORS.ERROR },
  info: { bg: '#2a2210', border: '#4a3a10', color: COLORS.ACCENT },
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
              boxShadow: COLORS.SHADOW_MD,
              animation: 'fadeIn 0.2s ease',
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
