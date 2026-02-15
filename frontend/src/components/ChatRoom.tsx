import { useEffect, useRef } from 'react';
import { useDeliberationStore } from '../stores/deliberationStore';
import { useWebSocket } from '../hooks/useWebSocket';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { COLORS } from '../styles/constants';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: 'calc(100vh - 100px)',
    background: COLORS.BG_CARD,
    borderRadius: '12px',
    border: `1px solid ${COLORS.BORDER}`,
    overflow: 'hidden',
  },
  chatHeader: {
    padding: '12px 20px',
    borderBottom: `1px solid ${COLORS.BORDER}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: COLORS.TEXT_ACCENT,
    margin: 0,
  },
  chatSubtitle: {
    fontSize: '12px',
    color: COLORS.TEXT_DIM,
  },
  messageList: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  typingIndicator: {
    padding: '8px 20px',
    fontSize: '13px',
    color: COLORS.ACCENT,
    fontStyle: 'italic' as const,
  },
};

export function ChatRoom() {
  const {
    currentUser,
    currentSession,
    messages,
    subgroups,
    surrogateTyping,
    fetchMessages,
  } = useDeliberationStore();
  const { sendMessage } = useWebSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load initial messages
  useEffect(() => {
    fetchMessages();
  }, [currentUser?.subgroup_id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (!currentUser || !currentSession) return null;

  const mySubgroup = subgroups.find(sg => sg.id === currentUser.subgroup_id);

  return (
    <div style={styles.container}>
      <div style={styles.chatHeader}>
        <div>
          <h3 style={styles.chatTitle}>
            {mySubgroup?.label || 'Chat'}
          </h3>
          <span style={styles.chatSubtitle}>
            {currentSession.title}
          </span>
        </div>
        <span style={styles.chatSubtitle}>
          {mySubgroup?.members?.length || 0} members
        </span>
      </div>

      <div style={styles.messageList}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: COLORS.TEXT_DIM, padding: '40px' }}>
            No messages yet. Start the conversation!
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.user_id === currentUser.id}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {surrogateTyping && (
        <div style={styles.typingIndicator}>
          Surrogate Agent is typing...
        </div>
      )}

      <ChatInput onSend={sendMessage} />
    </div>
  );
}
