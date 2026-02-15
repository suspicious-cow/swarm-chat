import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { COLORS, FONTS } from '../styles/constants';
import { instrumentCard, systemLabel, dataReadout, statusLed, retroInput, retroButton } from '../styles/retro';

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
    marginBottom: '16px',
    margin: 0,
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
    fontFamily: FONTS.MONO,
    fontSize: '13px',
    color: COLORS.TEXT_MUTED,
  },
  statusText: {
    fontWeight: 600,
    fontSize: '13px',
    fontFamily: FONTS.MONO,
  },
  qrFrame: {
    ...instrumentCard,
    textAlign: 'center' as const,
    padding: '20px',
    margin: '16px 0',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '12px',
  } as React.CSSProperties,
  secretDisplay: {
    ...dataReadout,
    fontSize: '11px',
    wordBreak: 'break-all' as const,
    maxWidth: '320px',
  } as React.CSSProperties,
  codeInput: {
    ...retroInput,
    fontFamily: FONTS.MONO,
    fontSize: '20px',
    letterSpacing: '6px',
    textAlign: 'center' as const,
    maxWidth: '220px',
    marginBottom: '16px',
    padding: '12px 16px',
  } as React.CSSProperties,
  label: {
    display: 'block',
    fontFamily: FONTS.MONO,
    fontSize: '11px',
    letterSpacing: '1px',
    color: COLORS.TEXT_MUTED,
    marginBottom: '6px',
    textTransform: 'uppercase' as const,
  },
  btn: {
    ...retroButton,
    padding: '10px 20px',
    fontSize: '13px',
    marginRight: '8px',
  } as React.CSSProperties,
  btnDanger: {
    padding: '10px 20px',
    background: COLORS.ERROR,
    border: 'none',
    borderRadius: '2px',
    color: '#0a0a0f',
    fontFamily: FONTS.DISPLAY,
    fontSize: '13px',
    fontWeight: 600,
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
    cursor: 'pointer',
    transition: 'box-shadow 0.15s, transform 0.1s',
  },
  btnSecondary: {
    padding: '10px 20px',
    background: 'transparent',
    border: `1px solid ${COLORS.BORDER_LIGHT}`,
    borderRadius: '2px',
    color: COLORS.TEXT_MUTED,
    fontFamily: FONTS.MONO,
    fontSize: '12px',
    cursor: 'pointer',
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
  },
  bodyText: {
    fontFamily: FONTS.BODY,
    color: COLORS.TEXT_PRIMARY,
    fontSize: '14px',
    marginBottom: '12px',
    lineHeight: '1.5',
  },
  error: {
    fontFamily: FONTS.MONO,
    color: COLORS.ERROR,
    fontSize: '12px',
    marginTop: '12px',
  },
  success: {
    fontFamily: FONTS.MONO,
    color: COLORS.SUCCESS,
    fontSize: '12px',
    marginTop: '12px',
  },
};

export function MfaSettingsPanel() {
  const { account, setupMfa, enableMfa, disableMfa, fetchMe } = useAuthStore();
  const [setupData, setSetupData] = useState<{ secret: string; uri: string } | null>(null);
  const [code, setCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const hasMfa = !!account?.totp_enabled;

  const handleSetup = async () => {
    setError(null);
    setSuccess(null);
    try {
      const data = await setupMfa();
      setSetupData(data);
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  };

  const handleEnable = async () => {
    if (!setupData || code.length !== 6) return;
    setLoading(true);
    setError(null);
    try {
      await enableMfa(setupData.secret, code);
      setSetupData(null);
      setCode('');
      setSuccess('MFA enabled successfully');
      await fetchMe();
    } catch (e: unknown) {
      setError((e as Error).message);
    }
    setLoading(false);
  };

  const handleDisable = async () => {
    if (disableCode.length !== 6) return;
    setLoading(true);
    setError(null);
    try {
      await disableMfa(disableCode);
      setDisableCode('');
      setSuccess('MFA disabled');
      await fetchMe();
    } catch (e: unknown) {
      setError((e as Error).message);
    }
    setLoading(false);
  };

  const ledColor = hasMfa
    ? COLORS.SUCCESS
    : setupData
      ? COLORS.ACCENT
      : COLORS.TEXT_DIM;

  const statusText = hasMfa
    ? 'ENABLED'
    : setupData
      ? 'CONFIGURING'
      : 'DISABLED';

  return (
    <div style={styles.panel}>
      <span style={styles.topLabel}>[ SECURITY PROTOCOLS ]</span>
      <h4 style={styles.heading}>Two-Factor Authentication</h4>

      <div style={styles.statusRow}>
        <span style={statusLed(ledColor, hasMfa)} />
        <span>Status:</span>
        <span style={{
          ...styles.statusText,
          color: hasMfa ? COLORS.SUCCESS : setupData ? COLORS.ACCENT : COLORS.TEXT_DIM,
        }}>
          {statusText}
        </span>
      </div>

      {!hasMfa && !setupData && (
        <button style={styles.btn} onClick={handleSetup}>
          Set Up MFA
        </button>
      )}

      {setupData && (
        <div>
          <p style={styles.bodyText}>
            Scan this QR code with your authenticator app, or manually enter the secret key:
          </p>
          <div style={styles.qrFrame}>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setupData.uri)}`}
              alt="TOTP QR Code"
              width={200}
              height={200}
              style={{ borderRadius: '2px' }}
            />
            <div style={styles.secretDisplay}>
              SECRET: {setupData.secret}
            </div>
          </div>
          <label style={styles.label}>
            Enter code from authenticator to confirm
          </label>
          <div>
            <input
              style={styles.codeInput}
              placeholder="000000"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
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
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <button style={styles.btn} onClick={handleEnable} disabled={loading || code.length !== 6}>
              {loading ? 'Enabling...' : 'Enable MFA'}
            </button>
            <button style={styles.btnSecondary} onClick={() => { setSetupData(null); setCode(''); }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {hasMfa && (
        <div>
          <label style={styles.label}>
            Enter current TOTP code to disable MFA
          </label>
          <div>
            <input
              style={styles.codeInput}
              placeholder="000000"
              value={disableCode}
              onChange={e => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
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
          <button style={styles.btnDanger} onClick={handleDisable} disabled={loading || disableCode.length !== 6}>
            {loading ? 'Disabling...' : 'Disable MFA'}
          </button>
        </div>
      )}

      {error && <p style={styles.error}>{error}</p>}
      {success && <p style={styles.success}>{success}</p>}
    </div>
  );
}
