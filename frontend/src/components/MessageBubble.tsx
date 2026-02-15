import { COLORS, FONTS } from '../styles/constants';
import type { Message } from '../types';

const PURPLE_ACCENT = '#8b5cf6';

const styles = {
  entry: {
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '10px 14px',
    borderRadius: '2px',
    borderLeft: '2px solid transparent',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  ownEntry: {
    background: COLORS.OWN_MSG_BG,
    borderLeftColor: COLORS.ACCENT,
  },
  otherEntry: {
    background: COLORS.OTHER_MSG_BG,
    borderLeftColor: COLORS.BORDER_LIGHT,
  },
  surrogateEntry: {
    background: COLORS.SURROGATE_BG,
    borderLeftColor: COLORS.TEAL,
  },
  contributorEntry: {
    background: COLORS.CONTRIBUTOR_BG,
    borderLeftColor: PURPLE_ACCENT,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '3px',
  },
  name: {
    fontFamily: FONTS.MONO,
    fontSize: '16px',
    fontWeight: 700,
  },
  badge: {
    fontFamily: FONTS.MONO,
    display: 'inline-block',
    fontSize: '12px',
    fontWeight: 600,
    padding: '1px 5px',
    borderRadius: '2px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  surrogateBadge: {
    background: 'rgba(0,212,170,0.15)',
    color: COLORS.TEAL,
  },
  contributorBadge: {
    background: 'rgba(139,92,246,0.15)',
    color: PURPLE_ACCENT,
  },
  timestamp: {
    fontFamily: FONTS.MONO,
    fontSize: '15px',
    color: COLORS.TEXT_MUTED,
    marginLeft: 'auto',
    flexShrink: 0,
  },
  content: {
    fontFamily: FONTS.BODY,
    fontSize: '18px',
    lineHeight: 1.5,
    color: COLORS.TEXT_PRIMARY,
    wordBreak: 'break-word' as const,
  },
};

interface Props {
  message: Message;
  isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: Props) {
  const isSurrogate = message.msg_type === 'surrogate';
  const isContributor = message.msg_type === 'contributor';

  const getEntryStyle = (): React.CSSProperties => {
    if (isSurrogate) return { ...styles.entry, ...styles.surrogateEntry };
    if (isContributor) return { ...styles.entry, ...styles.contributorEntry };
    if (isOwn) return { ...styles.entry, ...styles.ownEntry };
    return { ...styles.entry, ...styles.otherEntry };
  };

  const nameColor = isSurrogate
    ? COLORS.SURROGATE_TEXT
    : isContributor
      ? COLORS.CONTRIBUTOR_TEXT
      : isOwn
        ? COLORS.ACCENT
        : COLORS.TEXT_MUTED;

  const time = message.created_at
    ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const displayName = message.display_name
    || (isSurrogate ? 'Cross-group Insight' : isContributor ? 'AI Contributor' : 'Unknown');

  return (
    <div style={getEntryStyle()}>
      <div style={styles.header}>
        <span style={{ ...styles.name, color: nameColor }}>
          {displayName}
        </span>
        {isSurrogate && (
          <span style={{ ...styles.badge, ...styles.surrogateBadge }}>Surrogate</span>
        )}
        {isContributor && (
          <span style={{ ...styles.badge, ...styles.contributorBadge }}>AI</span>
        )}
        <span style={styles.timestamp}>{time}</span>
      </div>
      <div style={{
        ...styles.content,
        ...(isSurrogate ? { color: COLORS.SURROGATE_TEXT } : {}),
        ...(isContributor ? { color: COLORS.CONTRIBUTOR_TEXT } : {}),
      }}>
        {message.content}
      </div>
    </div>
  );
}
