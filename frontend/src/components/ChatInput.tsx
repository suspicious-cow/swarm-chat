import { useState } from 'react';
import { COLORS } from '../styles/constants';

const styles = {
  container: {
    padding: '12px 16px',
    borderTop: `1px solid ${COLORS.BORDER}`,
    display: 'flex',
    gap: '10px',
  },
  input: {
    flex: 1,
    padding: '10px 14px',
    background: COLORS.BG_INPUT,
    border: `1px solid ${COLORS.BORDER_LIGHT}`,
    borderRadius: '8px',
    color: COLORS.TEXT_PRIMARY,
    fontSize: '14px',
    outline: 'none',
  },
  btn: {
    padding: '10px 20px',
    background: COLORS.BUTTON,
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.15s',
  } as React.CSSProperties,
};

interface Props {
  onSend: (content: string) => void;
}

export function ChatInput({ onSend }: Props) {
  const [text, setText] = useState('');

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <div style={styles.container}>
      <input
        style={styles.input}
        placeholder="Type your message..."
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
      />
      <button
        style={styles.btn}
        onClick={handleSend}
        onMouseEnter={e => { e.currentTarget.style.background = COLORS.BUTTON_HOVER; }}
        onMouseLeave={e => { e.currentTarget.style.background = COLORS.BUTTON; }}
      >
        Send
      </button>
    </div>
  );
}
