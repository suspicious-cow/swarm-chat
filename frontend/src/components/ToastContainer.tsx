import { AnimatePresence, motion } from 'motion/react';
import { useToastStore } from '../stores/toastStore';
import { COLORS, FONTS } from '../styles/constants';
import { instrumentCard } from '../styles/retro';
import { toastVariants } from '../styles/motion';
import type { ToastType } from '../stores/toastStore';

const borderColors: Record<ToastType, string> = {
  success: COLORS.SUCCESS,
  error: COLORS.ERROR,
  info: COLORS.ACCENT,
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      pointerEvents: 'none',
    }}>
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const borderColor = borderColors[toast.type];
          return (
            <motion.div
              key={toast.id}
              variants={toastVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              layout
              style={{
                ...instrumentCard,
                borderLeft: `3px solid ${borderColor}`,
                padding: '12px 16px',
                minWidth: '280px',
                maxWidth: '420px',
                cursor: 'pointer',
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.03), ${COLORS.SHADOW_MD}`,
              }}
              onClick={() => removeToast(toast.id)}
            >
              <span style={{
                fontFamily: FONTS.MONO,
                fontSize: '10px',
                fontWeight: 500,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                color: COLORS.TEXT_DIM,
                flexShrink: 0,
                marginTop: '1px',
              }}>
                [ SYSTEM ]
              </span>
              <span style={{
                fontFamily: FONTS.MONO,
                fontSize: '13px',
                color: COLORS.TEXT_PRIMARY,
                lineHeight: '1.4',
              }}>
                {toast.message}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeToast(toast.id);
                }}
                style={{
                  marginLeft: 'auto',
                  flexShrink: 0,
                  background: 'none',
                  border: 'none',
                  color: COLORS.TEXT_DIM,
                  fontSize: '14px',
                  cursor: 'pointer',
                  padding: '0 2px',
                  lineHeight: '1',
                  fontFamily: FONTS.MONO,
                }}
              >
                x
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
