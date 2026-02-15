import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';

const styles = {
  panel: {
    background: '#1a1a3e',
    border: '1px solid #2a2a5a',
    borderRadius: '12px',
    padding: '24px',
    width: '100%',
  },
  title: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#c0c0ff',
    marginBottom: '16px',
  },
  status: {
    fontSize: '14px',
    color: '#8888bb',
    marginBottom: '16px',
  },
  enabled: {
    color: '#44ff88',
    fontWeight: 600,
  },
  disabled: {
    color: '#ff6b6b',
    fontWeight: 600,
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    background: '#0f0f23',
    border: '1px solid #3a3a6a',
    borderRadius: '8px',
    color: '#e0e0e0',
    fontSize: '14px',
    marginBottom: '12px',
    boxSizing: 'border-box' as const,
  },
  btn: {
    padding: '10px 20px',
    background: '#4a4aff',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    marginRight: '8px',
  },
  btnDanger: {
    padding: '10px 20px',
    background: '#ff4444',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnSecondary: {
    padding: '10px 20px',
    background: 'transparent',
    border: '1px solid #3a3a6a',
    borderRadius: '8px',
    color: '#8888bb',
    fontSize: '14px',
    cursor: 'pointer',
  },
  qrContainer: {
    textAlign: 'center' as const,
    margin: '16px 0',
  },
  secretText: {
    fontSize: '12px',
    color: '#6a6a9a',
    wordBreak: 'break-all' as const,
    margin: '8px 0',
  },
  error: {
    color: '#ff6b6b',
    fontSize: '13px',
    marginTop: '8px',
  },
  success: {
    color: '#44ff88',
    fontSize: '13px',
    marginTop: '8px',
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

  return (
    <div style={styles.panel}>
      <h4 style={styles.title}>Two-Factor Authentication</h4>
      <p style={styles.status}>
        Status: <span style={hasMfa ? styles.enabled : styles.disabled}>
          {hasMfa ? 'Enabled' : 'Disabled'}
        </span>
      </p>

      {!hasMfa && !setupData && (
        <button style={styles.btn} onClick={handleSetup}>
          Set Up MFA
        </button>
      )}

      {setupData && (
        <div>
          <p style={{ color: '#e0e0e0', fontSize: '14px', marginBottom: '12px' }}>
            Scan this QR code with your authenticator app, or manually enter the secret key:
          </p>
          <div style={styles.qrContainer}>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setupData.uri)}`}
              alt="TOTP QR Code"
              width={200}
              height={200}
              style={{ borderRadius: '8px' }}
            />
            <p style={styles.secretText}>Secret: {setupData.secret}</p>
          </div>
          <label style={{ display: 'block', fontSize: '12px', color: '#6a6a9a', marginBottom: '4px' }}>
            Enter code from authenticator to confirm
          </label>
          <input
            style={styles.input}
            placeholder="6-digit code"
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
          />
          <button style={styles.btn} onClick={handleEnable} disabled={loading || code.length !== 6}>
            {loading ? 'Enabling...' : 'Enable MFA'}
          </button>
          <button style={styles.btnSecondary} onClick={() => { setSetupData(null); setCode(''); }}>
            Cancel
          </button>
        </div>
      )}

      {hasMfa && (
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#6a6a9a', marginBottom: '4px' }}>
            Enter current TOTP code to disable MFA
          </label>
          <input
            style={styles.input}
            placeholder="6-digit code"
            value={disableCode}
            onChange={e => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
          />
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
