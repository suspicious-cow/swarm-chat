import { useAuthStore } from '../stores/authStore';
import { MfaSettingsPanel } from './MfaSettingsPanel';
import { InviteCodeManager } from './InviteCodeManager';
import { COLORS } from '../styles/constants';

const styles = {
  container: {
    maxWidth: '700px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '28px',
    animation: 'fadeIn 0.3s ease',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: COLORS.TEXT_HEADING,
  },
  section: {
    background: COLORS.BG_CARD,
    border: `1px solid ${COLORS.BORDER}`,
    borderRadius: '12px',
    padding: '24px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: COLORS.TEXT_ACCENT,
    marginBottom: '16px',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    fontSize: '14px',
  },
  label: {
    color: COLORS.TEXT_MUTED,
  },
  value: {
    color: COLORS.TEXT_PRIMARY,
    fontWeight: 500,
  },
};

export function SettingsView() {
  const { account } = useAuthStore();

  if (!account) return null;

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Settings</h2>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Account</h3>
        <div style={styles.row}>
          <span style={styles.label}>Username</span>
          <span style={styles.value}>{account.username}</span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Display Name</span>
          <span style={styles.value}>{account.display_name}</span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Role</span>
          <span style={styles.value}>{account.is_server_admin ? 'Server Admin' : 'User'}</span>
        </div>
      </div>

      <div>
        <h3 style={{ ...styles.sectionTitle, marginBottom: '12px' }}>Two-Factor Authentication</h3>
        <MfaSettingsPanel />
      </div>

      {account.is_server_admin && (
        <div>
          <h3 style={{ ...styles.sectionTitle, marginBottom: '12px' }}>Invite Codes</h3>
          <InviteCodeManager />
        </div>
      )}
    </div>
  );
}
