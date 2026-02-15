import { COLORS } from '../styles/constants';
import type { Message } from '../types';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    maxWidth: '75%',
    gap: '2px',
    animation: 'fadeIn 0.2s ease',
  },
  ownContainer: {
    alignSelf: 'flex-end' as const,
  },
  otherContainer: {
    alignSelf: 'flex-start' as const,
  },
  name: {
    fontSize: '11px',
    fontWeight: 600,
    marginBottom: '2px',
    padding: '0 8px',
  },
  bubble: {
    padding: '10px 14px',
    borderRadius: '12px',
    fontSize: '14px',
    lineHeight: 1.5,
    wordBreak: 'break-word' as const,
  },
  humanOwn: {
    background: COLORS.OWN_MSG_BG,
    color: COLORS.TEXT_PRIMARY,
    borderBottomRightRadius: '4px',
  },
  humanOther: {
    background: COLORS.OTHER_MSG_BG,
    color: COLORS.TEXT_PRIMARY,
    borderBottomLeftRadius: '4px',
  },
  surrogate: {
    background: COLORS.SURROGATE_BG,
    color: COLORS.SURROGATE_TEXT,
    border: `1px solid ${COLORS.SURROGATE_BORDER}`,
    borderBottomLeftRadius: '4px',
  },
  contributor: {
    background: COLORS.CONTRIBUTOR_BG,
    color: COLORS.CONTRIBUTOR_TEXT,
    border: `1px solid ${COLORS.CONTRIBUTOR_BORDER}`,
    borderBottomLeftRadius: '4px',
  },
  time: {
    fontSize: '10px',
    color: COLORS.TEXT_DIM,
    padding: '0 8px',
  },
  badge: {
    display: 'inline-block',
    fontSize: '9px',
    fontWeight: 600,
    padding: '1px 5px',
    borderRadius: '3px',
    marginLeft: '6px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  surrogateBadge: {
    background: 'rgba(20, 184, 166, 0.15)',
    color: COLORS.ACCENT_TERTIARY,
  },
  contributorBadge: {
    background: 'rgba(208, 184, 224, 0.15)',
    color: COLORS.CONTRIBUTOR_TEXT,
  },
};

interface Props {
  message: Message;
  isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: Props) {
  const isSurrogate = message.msg_type === 'surrogate';
  const isContributor = message.msg_type === 'contributor';
  const isAI = isSurrogate || isContributor;

  const getBubbleStyle = () => {
    if (isSurrogate) return { ...styles.bubble, ...styles.surrogate };
    if (isContributor) return { ...styles.bubble, ...styles.contributor };
    if (isOwn) return { ...styles.bubble, ...styles.humanOwn };
    return { ...styles.bubble, ...styles.humanOther };
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

  return (
    <div
      style={{
        ...styles.container,
        ...(isOwn && !isAI ? styles.ownContainer : styles.otherContainer),
      }}
    >
      <div style={{ ...styles.name, color: nameColor }}>
        {message.display_name || (isSurrogate ? 'Cross-group Insight' : isContributor ? 'AI Contributor' : 'Unknown')}
        {isSurrogate && (
          <span style={{ ...styles.badge, ...styles.surrogateBadge }}>Surrogate</span>
        )}
        {isContributor && (
          <span style={{ ...styles.badge, ...styles.contributorBadge }}>AI</span>
        )}
      </div>
      <div style={getBubbleStyle()}>
        {message.content}
      </div>
      <div style={styles.time}>{time}</div>
    </div>
  );
}
