import type { Message } from '../types';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    maxWidth: '75%',
    gap: '2px',
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
    background: '#3a3aaa',
    color: '#fff',
    borderBottomRightRadius: '4px',
  },
  humanOther: {
    background: '#2a2a5a',
    color: '#e0e0e0',
    borderBottomLeftRadius: '4px',
  },
  surrogate: {
    background: '#1a2a3e',
    color: '#c0d8f0',
    border: '1px solid #2a3a5a',
    borderBottomLeftRadius: '4px',
  },
  contributor: {
    background: '#251a3e',
    color: '#d0c0f0',
    border: '1px solid #3a2a5a',
    borderBottomLeftRadius: '4px',
  },
  time: {
    fontSize: '10px',
    color: '#5a5a8a',
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
    background: 'rgba(106, 176, 208, 0.15)',
    color: '#6ab0d0',
  },
  contributorBadge: {
    background: 'rgba(176, 128, 208, 0.15)',
    color: '#b080d0',
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

  const nameColor = isSurrogate ? '#6ab0d0' : isContributor ? '#b080d0' : isOwn ? '#8888cc' : '#9090c0';

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
