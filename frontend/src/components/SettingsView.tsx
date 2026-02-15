import { motion } from 'motion/react';
import { useAuthStore } from '../stores/authStore';
import { MfaSettingsPanel } from './MfaSettingsPanel';
import { InviteCodeManager } from './InviteCodeManager';
import { COLORS, FONTS } from '../styles/constants';
import { instrumentCard, systemLabel, dataReadout, phosphorHeading } from '../styles/retro';
import { staggerContainer, staggerItem } from '../styles/motion';

const styles = {
  container: {
    maxWidth: '700px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '28px',
  },
  topLabel: {
    ...systemLabel,
    marginBottom: '4px',
  } as React.CSSProperties,
  title: {
    ...phosphorHeading,
    fontSize: '32px',
    margin: 0,
  },
  section: {
    ...instrumentCard,
    padding: '24px',
  } as React.CSSProperties,
  sectionLabel: {
    ...systemLabel,
    marginBottom: '16px',
    display: 'block',
  } as React.CSSProperties,
  sectionHeading: {
    fontFamily: FONTS.DISPLAY,
    fontSize: '21px',
    fontWeight: 600,
    color: COLORS.TEXT_ACCENT,
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
    marginBottom: '12px',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: `1px solid ${COLORS.BORDER}`,
  },
  rowLast: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
  },
  label: {
    fontFamily: FONTS.BODY,
    fontSize: '18px',
    color: COLORS.TEXT_MUTED,
  },
  value: {
    ...dataReadout,
    padding: '4px 10px',
    fontSize: '18px',
  } as React.CSSProperties,
};

export function SettingsView() {
  const { account } = useAuthStore();

  if (!account) return null;

  return (
    <motion.div
      style={styles.container}
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      <motion.div variants={staggerItem}>
        <span style={styles.topLabel}>[ SYSTEM CONFIGURATION ]</span>
        <h2 style={styles.title}>Preferences</h2>
      </motion.div>

      <motion.div style={styles.section} variants={staggerItem}>
        <span style={styles.sectionLabel}>[ ACCOUNT ]</span>
        <div style={styles.row}>
          <span style={styles.label}>Username</span>
          <span style={styles.value}>{account.username}</span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Display Name</span>
          <span style={styles.value}>{account.display_name}</span>
        </div>
        <div style={styles.rowLast}>
          <span style={styles.label}>Role</span>
          <span style={styles.value}>{account.is_server_admin ? 'Server Admin' : 'User'}</span>
        </div>
      </motion.div>

      <motion.div variants={staggerItem}>
        <span style={styles.sectionHeading}>[ SECURITY ]</span>
        <MfaSettingsPanel />
      </motion.div>

      {account.is_server_admin && (
        <motion.div variants={staggerItem}>
          <span style={styles.sectionHeading}>[ ACCESS CODES ]</span>
          <InviteCodeManager />
        </motion.div>
      )}
    </motion.div>
  );
}
