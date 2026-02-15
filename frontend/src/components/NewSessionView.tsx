import { useState } from 'react';
import { motion } from 'motion/react';
import { useAuthStore } from '../stores/authStore';
import { useDeliberationStore } from '../stores/deliberationStore';
import { COLORS, FONTS } from '../styles/constants';
import { instrumentCard, systemLabel, dataReadout, retroInput, retroButton, phosphorHeading } from '../styles/retro';
import { fadeIn } from '../styles/motion';

export function NewSessionView() {
  const { account } = useAuthStore();
  const { createSession, joinSession, currentSession, currentUser, error, setView } = useDeliberationStore();
  const [title, setTitle] = useState('');
  const [size, setSize] = useState(5);
  const [creating, setCreating] = useState(false);
  const [entering, setEntering] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    if (!title.trim() || creating) return;
    setCreating(true);
    await createSession(title.trim(), size);
    setCreating(false);
  };

  const handleEnter = async () => {
    const state = useDeliberationStore.getState();
    if (!state.currentSession || !account || entering) return;
    setEntering(true);
    await joinSession(state.currentSession.join_code, account.display_name);
    setEntering(false);
  };

  const handleCopy = () => {
    if (currentSession?.join_code) {
      navigator.clipboard.writeText(currentSession.join_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Show "session created" screen
  if (currentSession && !currentUser) {
    return (
      <motion.div
        {...fadeIn}
        style={{
          maxWidth: '480px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column' as const,
          alignItems: 'center',
          gap: '24px',
          paddingTop: '40px',
          textAlign: 'center' as const,
        }}
      >
        <div style={systemLabel}>[ MISSION CONFIGURED ]</div>

        <h2
          style={{
            ...phosphorHeading,
            fontSize: '24px',
            margin: 0,
          }}
        >
          SESSION CREATED
        </h2>

        <p
          style={{
            fontFamily: FONTS.BODY,
            fontSize: '14px',
            color: COLORS.TEXT_MUTED,
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          Share this code with participants so they can join the deliberation.
        </p>

        {/* Large code readout */}
        <div
          style={{
            ...dataReadout,
            fontSize: '36px',
            fontWeight: 800,
            letterSpacing: '10px',
            padding: '20px 32px',
            color: COLORS.ACCENT,
            fontFamily: FONTS.MONO,
            textAlign: 'center' as const,
          }}
        >
          {currentSession.join_code}
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            style={{
              background: 'transparent',
              border: `1px solid ${COLORS.BORDER_LIGHT}`,
              borderRadius: '2px',
              color: copied ? COLORS.ACCENT : COLORS.TEXT_MUTED,
              padding: '8px 20px',
              cursor: 'pointer',
              fontFamily: FONTS.MONO,
              fontSize: '12px',
              letterSpacing: '1px',
              textTransform: 'uppercase' as const,
              transition: 'all 0.15s',
              boxShadow: copied ? COLORS.SHADOW_GLOW : 'none',
            }}
            onClick={handleCopy}
          >
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
        </div>

        <p
          style={{
            fontFamily: FONTS.MONO,
            fontSize: '13px',
            color: COLORS.TEXT_MUTED,
            margin: 0,
          }}
        >
          {currentSession.title}
        </p>

        <button
          style={{
            ...retroButton,
            width: 'auto',
            padding: '12px 40px',
            opacity: entering ? 0.5 : 1,
            cursor: entering ? 'not-allowed' : 'pointer',
          }}
          onClick={handleEnter}
          disabled={entering}
        >
          {entering ? 'Entering...' : 'Enter Session'}
        </button>

        {error && (
          <p
            style={{
              fontFamily: FONTS.MONO,
              color: COLORS.ERROR,
              fontSize: '13px',
              margin: 0,
            }}
          >
            {error}
          </p>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      {...fadeIn}
      style={{
        maxWidth: '560px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '24px',
        paddingTop: '20px',
      }}
    >
      <div style={systemLabel}>[ MISSION CONFIGURATION ]</div>

      <h2
        style={{
          ...phosphorHeading,
          fontSize: '24px',
          margin: 0,
        }}
      >
        INITIALIZE SESSION
      </h2>

      <div
        style={{
          ...instrumentCard,
          padding: '32px',
        }}
      >
        {/* Topic label */}
        <label
          style={{
            display: 'block',
            fontFamily: FONTS.MONO,
            fontSize: '11px',
            fontWeight: 500,
            color: COLORS.TEXT_MUTED,
            letterSpacing: '1.5px',
            textTransform: 'uppercase' as const,
            marginBottom: '8px',
          }}
        >
          Deliberation Topic / Question
        </label>
        <input
          style={{
            ...retroInput,
            fontFamily: FONTS.BODY,
          }}
          placeholder="e.g. Should cities ban cars from downtown?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = COLORS.ACCENT_DIM;
            e.currentTarget.style.boxShadow = `0 0 12px ${COLORS.ACCENT_GLOW}`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = COLORS.BORDER;
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
        <p
          style={{
            fontFamily: FONTS.BODY,
            fontSize: '12px',
            color: COLORS.TEXT_MUTED,
            marginTop: '4px',
            marginBottom: '20px',
            lineHeight: 1.5,
          }}
        >
          Frame as a clear question to guide focused discussion.
        </p>

        {/* ThinkTank size label */}
        <label
          style={{
            display: 'block',
            fontFamily: FONTS.MONO,
            fontSize: '11px',
            fontWeight: 500,
            color: COLORS.TEXT_MUTED,
            letterSpacing: '1.5px',
            textTransform: 'uppercase' as const,
            marginBottom: '8px',
          }}
        >
          ThinkTank Size (3-10)
        </label>
        <input
          style={{
            ...retroInput,
            fontFamily: FONTS.MONO,
          }}
          type="number"
          min={3}
          max={10}
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = COLORS.ACCENT_DIM;
            e.currentTarget.style.boxShadow = `0 0 12px ${COLORS.ACCENT_GLOW}`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = COLORS.BORDER;
            e.currentTarget.style.boxShadow = 'none';
          }}
        />

        {/* Size parameter readout */}
        <div
          style={{
            ...dataReadout,
            marginTop: '8px',
            marginBottom: '20px',
            fontSize: '12px',
          }}
        >
          Research shows groups of 4-7 participants with an AI Surrogate produce optimal
          deliberation. Default of 5 is recommended.
        </div>

        <button
          style={{
            ...retroButton,
            width: '100%',
            marginTop: '8px',
            opacity: creating || !title.trim() ? 0.5 : 1,
            cursor: creating || !title.trim() ? 'not-allowed' : 'pointer',
          }}
          onClick={handleCreate}
          disabled={creating || !title.trim()}
        >
          {creating ? 'Creating...' : 'Create Session'}
        </button>

        {error && (
          <p
            style={{
              fontFamily: FONTS.MONO,
              color: COLORS.ERROR,
              fontSize: '13px',
              marginTop: '8px',
            }}
          >
            {error}
          </p>
        )}
      </div>
    </motion.div>
  );
}
