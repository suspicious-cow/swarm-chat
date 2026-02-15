import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { COLORS, FONTS } from '../styles/constants';
import { instrumentCard, systemLabel, dataReadout, statusLed, retroInput, retroButton } from '../styles/retro';
import { staggerContainer, staggerItem } from '../styles/motion';
import type { InviteCode } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';

const styles = {
  panel: {
    ...instrumentCard,
    padding: '24px',
    width: '100%',
    boxSizing: 'border-box' as const,
  } as React.CSSProperties,
  topLabel: {
    ...systemLabel,
    marginBottom: '16px',
    display: 'block',
  } as React.CSSProperties,
  heading: {
    fontFamily: FONTS.DISPLAY,
    fontSize: '16px',
    fontWeight: 600,
    color: COLORS.TEXT_HEADING,
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
    margin: '0 0 20px 0',
  },
  createRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
    alignItems: 'flex-end',
    flexWrap: 'wrap' as const,
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  fieldLabel: {
    ...systemLabel,
    fontSize: '10px',
    letterSpacing: '1.5px',
  } as React.CSSProperties,
  input: {
    ...retroInput,
    width: '140px',
    fontSize: '13px',
    fontFamily: FONTS.MONO,
    padding: '8px 12px',
  } as React.CSSProperties,
  btn: {
    ...retroButton,
    padding: '9px 18px',
    fontSize: '12px',
  } as React.CSSProperties,
  codeRow: {
    ...instrumentCard,
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    marginBottom: '6px',
  } as React.CSSProperties,
  codeText: {
    ...dataReadout,
    fontFamily: FONTS.MONO,
    fontSize: '16px',
    fontWeight: 600,
    letterSpacing: '2px',
    padding: '6px 14px',
    flexShrink: 0,
  } as React.CSSProperties,
  usageText: {
    fontFamily: FONTS.MONO,
    fontSize: '12px',
    color: COLORS.TEXT_MUTED,
    minWidth: '60px',
  },
  expiryText: {
    fontFamily: FONTS.MONO,
    fontSize: '11px',
    color: COLORS.TEXT_MUTED,
    flexGrow: 1,
  },
  statusContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    minWidth: '70px',
  },
  statusTextActive: {
    fontFamily: FONTS.MONO,
    fontSize: '11px',
    fontWeight: 600,
    color: COLORS.SUCCESS,
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
  },
  statusTextInactive: {
    fontFamily: FONTS.MONO,
    fontSize: '11px',
    fontWeight: 600,
    color: COLORS.TEXT_MUTED,
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
  },
  copyBtn: {
    padding: '4px 10px',
    background: 'transparent',
    border: `1px solid ${COLORS.ACCENT_DIM}`,
    borderRadius: '2px',
    color: COLORS.ACCENT,
    fontFamily: FONTS.MONO,
    fontSize: '10px',
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
    cursor: 'pointer',
    transition: 'border-color 0.15s, color 0.15s',
    flexShrink: 0,
  },
  deactivateBtn: {
    padding: '4px 10px',
    background: 'transparent',
    border: `1px solid ${COLORS.ERROR}`,
    borderRadius: '2px',
    color: COLORS.ERROR,
    fontFamily: FONTS.MONO,
    fontSize: '10px',
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
    cursor: 'pointer',
    flexShrink: 0,
  },
  empty: {
    fontFamily: FONTS.MONO,
    color: COLORS.TEXT_MUTED,
    fontSize: '12px',
    textAlign: 'center' as const,
    padding: '24px 0',
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
  },
  error: {
    fontFamily: FONTS.MONO,
    color: COLORS.ERROR,
    fontSize: '12px',
    marginBottom: '12px',
  },
};

export function InviteCodeManager() {
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [maxUses, setMaxUses] = useState('');
  const [expiresIn, setExpiresIn] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchCodes = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/invite-codes`, {
        credentials: 'include',
      });
      if (res.ok) {
        setCodes(await res.json());
      }
    } catch (_) {
      // silent
    }
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {};
      if (maxUses.trim()) body.max_uses = parseInt(maxUses, 10);
      if (expiresIn.trim()) {
        const hours = parseInt(expiresIn, 10);
        body.expires_at = new Date(Date.now() + hours * 3600000).toISOString();
      }
      const res = await fetch(`${API_BASE}/api/admin/invite-codes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to create invite code');
      }
      setMaxUses('');
      setExpiresIn('');
      await fetchCodes();
    } catch (e: unknown) {
      setError((e as Error).message);
    }
    setLoading(false);
  };

  const handleDeactivate = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/invite-codes/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        await fetchCodes();
      }
    } catch (_) {
      // silent
    }
  };

  const handleCopy = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (_) {
      // silent
    }
  };

  const formatExpiry = (iso: string | null) => {
    if (!iso) return 'Never';
    const d = new Date(iso);
    if (d < new Date()) return 'Expired';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={styles.panel}>
      <span style={styles.topLabel}>[ ACCESS CODES ]</span>
      <h4 style={styles.heading}>Invitation Protocols</h4>

      <div style={styles.createRow}>
        <div style={styles.fieldGroup}>
          <span style={styles.fieldLabel}>Max Uses</span>
          <input
            style={styles.input}
            placeholder="unlimited"
            value={maxUses}
            onChange={e => setMaxUses(e.target.value.replace(/\D/g, ''))}
            onFocus={e => {
              e.target.style.borderColor = COLORS.ACCENT;
              e.target.style.boxShadow = `0 0 12px ${COLORS.ACCENT_GLOW}`;
            }}
            onBlur={e => {
              e.target.style.borderColor = COLORS.BORDER;
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
        <div style={styles.fieldGroup}>
          <span style={styles.fieldLabel}>Expires In (hrs)</span>
          <input
            style={styles.input}
            placeholder="never"
            value={expiresIn}
            onChange={e => setExpiresIn(e.target.value.replace(/\D/g, ''))}
            onFocus={e => {
              e.target.style.borderColor = COLORS.ACCENT;
              e.target.style.boxShadow = `0 0 12px ${COLORS.ACCENT_GLOW}`;
            }}
            onBlur={e => {
              e.target.style.borderColor = COLORS.BORDER;
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
        <button style={styles.btn} onClick={handleCreate} disabled={loading}>
          {loading ? 'Generating...' : 'Generate Code'}
        </button>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      {codes.length === 0 ? (
        <p style={styles.empty}>No access codes generated</p>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
        >
          <AnimatePresence>
            {codes.map(c => (
              <motion.div
                key={c.id}
                variants={staggerItem}
                layout
                style={styles.codeRow}
              >
                <div style={styles.statusContainer}>
                  <span style={statusLed(c.is_active ? COLORS.SUCCESS : COLORS.TEXT_DIM)} />
                  <span style={c.is_active ? styles.statusTextActive : styles.statusTextInactive}>
                    {c.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <span style={styles.codeText}>{c.code}</span>

                <span style={styles.usageText}>
                  {c.use_count}{c.max_uses !== null ? `/${c.max_uses}` : ''} used
                </span>

                <span style={styles.expiryText}>
                  {formatExpiry(c.expires_at)}
                </span>

                <button
                  style={styles.copyBtn}
                  onClick={() => handleCopy(c.code, c.id)}
                >
                  {copiedId === c.id ? 'Copied' : 'Copy'}
                </button>

                {c.is_active && (
                  <button style={styles.deactivateBtn} onClick={() => handleDeactivate(c.id)}>
                    Deactivate
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
