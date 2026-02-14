import { useEffect, useRef } from 'react';
import { useDeliberationStore } from '../stores/deliberationStore';
import { useWebSocket } from '../hooks/useWebSocket';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { AdminPanel } from './AdminPanel';

const styles = {
  container: {
    display: 'flex',
    gap: '24px',
    height: 'calc(100vh - 120px)',
  },
  chatArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    background: '#1a1a3e',
    borderRadius: '12px',
    border: '1px solid #2a2a5a',
    overflow: 'hidden',
  },
  chatHeader: {
    padding: '12px 20px',
    borderBottom: '1px solid #2a2a5a',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#c0c0ff',
    margin: 0,
  },
  chatSubtitle: {
    fontSize: '12px',
    color: '#6a6a9a',
  },
  messageList: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  sidebar: {
    width: '280px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  memberList: {
    background: '#1a1a3e',
    border: '1px solid #2a2a5a',
    borderRadius: '12px',
    padding: '16px',
  },
  memberTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#8888bb',
    marginBottom: '12px',
  },
  member: {
    padding: '6px 0',
    fontSize: '13px',
    color: '#a0a0d0',
  },
  typingIndicator: {
    padding: '8px 20px',
    fontSize: '13px',
    color: '#7c8aff',
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
      <div style={styles.chatArea}>
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
            <div style={{ textAlign: 'center', color: '#6a6a9a', padding: '40px' }}>
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

      <div style={styles.sidebar}>
        <div style={styles.memberList}>
          <div style={styles.memberTitle}>
            Members ({mySubgroup?.members?.length || 0})
          </div>
          {mySubgroup?.members?.map(member => (
            <div key={member.id} style={styles.member}>
              {member.display_name}
              {member.id === currentUser.id ? ' (you)' : ''}
            </div>
          ))}
        </div>

        {currentUser.is_admin && <AdminPanel />}
      </div>
    </div>
  );
}
