import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '24px',
    paddingTop: '80px',
  },
  card: {
    background: '#1a1a3e',
    border: '1px solid #2a2a5a',
    borderRadius: '12px',
    padding: '32px',
    width: '340px',
    textAlign: 'center' as const,
  },
  title: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#c0c0ff',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '13px',
    color: '#8888bb',
    marginBottom: '20px',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    background: '#0f0f23',
    border: '1px solid #3a3a6a',
    borderRadius: '8px',
    color: '#e0e0e0',
    fontSize: '20px',
    letterSpacing: '6px',
    textAlign: 'center' as const,
    marginBottom: '16px',
    boxSizing: 'border-box' as const,
  },
  btn: {
    width: '100%',
    padding: '12px',
    background: '#4a4aff',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  error: {
    color: '#ff6b6b',
    fontSize: '13px',
    marginTop: '8px',
  },
  backLink: {
    color: '#7c8aff',
    fontSize: '13px',
    cursor: 'pointer',
    marginTop: '12px',
  },
};

export function MfaChallengeView() {
  const { verifyMfa, logout, loading, error } = useAuthStore();
  const [code, setCode] = useState('');

  const handleSubmit = async () => {
    if (code.trim().length !== 6) return;
    await verifyMfa(code.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h3 style={styles.title}>Two-Factor Authentication</h3>
        <p style={styles.subtitle}>Enter the 6-digit code from your authenticator app</p>

        <input
          style={styles.input}
          placeholder="000000"
          value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          onKeyDown={handleKeyDown}
          maxLength={6}
          autoFocus
        />

        <button style={styles.btn} onClick={handleSubmit} disabled={loading || code.length !== 6}>
          {loading ? 'Verifying...' : 'Verify'}
        </button>

        {error && <p style={styles.error}>{error}</p>}

        <p style={styles.backLink} onClick={logout}>
          Back to login
        </p>
      </div>
    </div>
  );
}
