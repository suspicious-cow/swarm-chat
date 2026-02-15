import { useState } from 'react';
import { COLORS, FONTS } from '../styles/constants';
import { retroInput, retroButton } from '../styles/retro';

const styles = {
  container: {
    padding: '12px 16px',
    borderTop: `1px solid ${COLORS.BORDER}`,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: COLORS.BG_ELEVATED,
  },
  prompt: {
    fontFamily: FONTS.MONO,
    fontSize: '16px',
    fontWeight: 700,
    color: COLORS.ACCENT,
    userSelect: 'none' as const,
    flexShrink: 0,
  },
  input: {
    ...retroInput,
    fontFamily: FONTS.MONO,
    fontSize: '14px',
    flex: 1,
    width: 'auto',
    outline: 'none',
  } as React.CSSProperties,
  btn: {
    ...retroButton,
    padding: '8px 18px',
    fontSize: '13px',
    flexShrink: 0,
  } as React.CSSProperties,
};

interface Props {
  onSend: (content: string) => void;
}

export function ChatInput({ onSend }: Props) {
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const [btnHover, setBtnHover] = useState(false);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  };

  const focusStyle: React.CSSProperties = focused
    ? {
        boxShadow: '0 0 12px rgba(255,184,0,0.2)',
        border: `1px solid ${COLORS.ACCENT}`,
      }
    : {};

  const btnHoverStyle: React.CSSProperties = btnHover
    ? {
        boxShadow: '0 0 16px rgba(255,184,0,0.35)',
      }
    : {};

  return (
    <div style={styles.container}>
      <span style={styles.prompt}>&gt;</span>
      <input
        style={{ ...styles.input, ...focusStyle }}
        placeholder="Type your message..."
        value={text}
        onChange={e => setText(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
      />
      <button
        style={{ ...styles.btn, ...btnHoverStyle }}
        onClick={handleSend}
        onMouseEnter={() => setBtnHover(true)}
        onMouseLeave={() => setBtnHover(false)}
      >
        Send
      </button>
    </div>
  );
}
