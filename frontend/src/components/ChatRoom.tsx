import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useDeliberationStore } from '../stores/deliberationStore';
import { useWebSocket } from '../hooks/useWebSocket';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { COLORS, FONTS } from '../styles/constants';
import { systemLabel, gridBg } from '../styles/retro';
import { messageVariants } from '../styles/motion';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: 'calc(100vh - 100px)',
    background: COLORS.BG_CARD,
    border: `1px solid ${COLORS.BORDER}`,
    borderRadius: '2px',
    overflow: 'hidden',
    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.03), ${COLORS.SHADOW_SM}`,
  },
  chatHeader: {
    padding: '12px 20px',
    borderBottom: `1px solid ${COLORS.BORDER}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: COLORS.BG_ELEVATED,
  },
  chatTitle: {
    fontFamily: FONTS.DISPLAY,
    fontSize: '16px',
    fontWeight: 600,
    color: COLORS.TEXT_HEADING,
    letterSpacing: '1px',
    margin: 0,
  },
  chatSubtitle: {
    fontFamily: FONTS.MONO,
    fontSize: '11px',
    color: COLORS.TEXT_DIM,
    letterSpacing: '0.5px',
  },
  memberCount: {
    fontFamily: FONTS.MONO,
    fontSize: '11px',
    color: COLORS.TEXT_DIM,
    letterSpacing: '0.5px',
  },
  messageList: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '5px',
    ...gridBg,
  },
  terminalLabel: {
    ...systemLabel,
    textAlign: 'center' as const,
    padding: '8px 0 12px 0',
    borderBottom: `1px solid ${COLORS.BORDER}`,
    marginBottom: '12px',
  } as React.CSSProperties,
  emptyState: {
    textAlign: 'center' as const,
    fontFamily: FONTS.MONO,
    color: COLORS.TEXT_DIM,
    fontSize: '13px',
    padding: '40px',
    letterSpacing: '0.5px',
  },
  systemMessage: {
    fontFamily: FONTS.MONO,
    fontSize: '11px',
    color: COLORS.TEXT_ACCENT,
    textAlign: 'center' as const,
    padding: '4px 0',
    letterSpacing: '0.5px',
  },
  typingIndicator: {
    padding: '8px 20px',
    fontFamily: FONTS.MONO,
    fontSize: '12px',
    color: COLORS.ACCENT,
    letterSpacing: '0.5px',
    borderTop: `1px solid ${COLORS.BORDER}`,
    background: COLORS.BG_ELEVATED,
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
        <span style={styles.memberCount}>
          {mySubgroup?.members?.length || 0} members
        </span>
      </div>

      <div style={styles.messageList}>
        <div style={styles.terminalLabel}>[ COMMUNICATION TERMINAL ]</div>

        {messages.length === 0 && (
          <div style={styles.emptyState}>
            -- No transmissions yet. Initiate communication. --
          </div>
        )}
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            variants={messageVariants}
            initial="initial"
            animate="animate"
          >
            <MessageBubble
              message={msg}
              isOwn={msg.user_id === currentUser.id}
            />
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {surrogateTyping && (
        <div style={styles.typingIndicator}>
          &gt; Surrogate Agent is composing...
        </div>
      )}

      <ChatInput onSend={sendMessage} />
    </div>
  );
}
