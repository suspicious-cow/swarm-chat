import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useDeliberationStore } from '../stores/deliberationStore';
import { COLORS, FONTS } from '../styles/constants';
import { instrumentCard, systemLabel, dataReadout, phosphorHeading, gridBg } from '../styles/retro';
import { fadeIn, staggerContainer, staggerItem } from '../styles/motion';
import type { Message } from '../types';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
    maxWidth: '900px',
    margin: '0 auto',
    paddingBottom: '40px',
  },
  header: {
    ...instrumentCard,
    padding: '24px 28px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
    flexWrap: 'wrap' as const,
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
    flex: 1,
    minWidth: '200px',
  },
  title: {
    ...phosphorHeading,
    fontSize: '28px',
    margin: 0,
    lineHeight: 1.3,
  },
  dateLine: {
    fontFamily: FONTS.MONO,
    fontSize: '15px',
    color: COLORS.TEXT_DIM,
    letterSpacing: '0.5px',
  },
  convergenceBox: {
    ...dataReadout,
    textAlign: 'center' as const,
    minWidth: '140px',
    padding: '12px 20px',
  } as React.CSSProperties,
  convergenceValue: {
    fontFamily: FONTS.MONO,
    fontSize: '36px',
    fontWeight: 700,
    lineHeight: 1.1,
  },
  convergenceLabel: {
    fontFamily: FONTS.MONO,
    fontSize: '13px',
    color: COLORS.TEXT_DIM,
    marginTop: '4px',
    textTransform: 'uppercase' as const,
    letterSpacing: '1.5px',
  },
  statusBadge: {
    padding: '3px 10px',
    borderRadius: '2px',
    fontSize: '13px',
    fontWeight: 600,
    fontFamily: FONTS.MONO,
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    background: COLORS.BADGE_COMPLETED_BG,
    color: COLORS.BADGE_COMPLETED_TEXT,
  } as React.CSSProperties,
  section: {
    ...instrumentCard,
    padding: '20px 24px',
  },
  sectionHeader: {
    ...systemLabel,
    marginBottom: '16px',
  },
  summaryText: {
    fontFamily: FONTS.BODY,
    fontSize: '18px',
    color: COLORS.TEXT_PRIMARY,
    lineHeight: 1.7,
    whiteSpace: 'pre-wrap' as const,
  },
  noSummary: {
    fontFamily: FONTS.MONO,
    fontSize: '16px',
    color: COLORS.TEXT_DIM,
    fontStyle: 'italic',
    padding: '12px 0',
  },
  idea: {
    ...instrumentCard,
    padding: '12px 14px',
    marginBottom: '8px',
  },
  ideaSummary: {
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.BODY,
    fontSize: '18px',
    lineHeight: 1.5,
  },
  ideaMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '6px',
    fontFamily: FONTS.MONO,
    fontSize: '15px',
    color: COLORS.TEXT_MUTED,
  },
  sentimentBar: {
    height: '3px',
    borderRadius: '1px',
    marginTop: '6px',
    background: COLORS.BORDER,
  },
  tabBar: {
    display: 'flex',
    gap: '2px',
    borderBottom: `1px solid ${COLORS.BORDER}`,
    marginBottom: '12px',
  },
  tab: {
    padding: '8px 16px',
    fontFamily: FONTS.MONO,
    fontSize: '15px',
    fontWeight: 500,
    color: COLORS.TEXT_DIM,
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    transition: 'all 0.15s ease',
    background: 'none',
    border: 'none',
    letterSpacing: '0.5px',
  } as React.CSSProperties,
  tabActive: {
    color: COLORS.ACCENT,
    borderBottom: `2px solid ${COLORS.ACCENT}`,
  },
  messageLog: {
    maxHeight: '400px',
    overflowY: 'auto' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
    ...gridBg,
    padding: '12px',
    borderRadius: '2px',
  },
  logEntry: {
    padding: '6px 10px',
    borderRadius: '2px',
    fontSize: '16px',
    lineHeight: 1.5,
  },
  logTimestamp: {
    fontFamily: FONTS.MONO,
    fontSize: '13px',
    color: COLORS.TEXT_DIM,
    marginRight: '8px',
    flexShrink: 0,
  },
  logSender: {
    fontFamily: FONTS.DISPLAY,
    fontWeight: 600,
    marginRight: '8px',
    fontSize: '16px',
  },
  logContent: {
    fontFamily: FONTS.BODY,
    color: COLORS.TEXT_PRIMARY,
    fontSize: '16px',
  },
  crewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '12px',
  },
  crewCard: {
    ...instrumentCard,
    padding: '14px 16px',
  },
  crewSubgroupLabel: {
    fontFamily: FONTS.DISPLAY,
    fontSize: '18px',
    fontWeight: 600,
    color: COLORS.TEXT_HEADING,
    marginBottom: '10px',
    letterSpacing: '0.5px',
  },
  crewMember: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 0',
    fontFamily: FONTS.BODY,
    fontSize: '16px',
    color: COLORS.TEXT_PRIMARY,
  },
  crewDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: COLORS.TEAL,
    boxShadow: `0 0 4px ${COLORS.TEAL}`,
    flexShrink: 0,
  },
  backBtn: {
    background: 'none',
    border: `1px solid ${COLORS.BORDER_LIGHT}`,
    color: COLORS.TEXT_MUTED,
    padding: '6px 14px',
    borderRadius: '2px',
    cursor: 'pointer',
    fontSize: '15px',
    fontFamily: FONTS.MONO,
    letterSpacing: '0.5px',
    transition: 'border-color 0.15s, color 0.15s',
  },
};

const MSG_TYPE_STYLES: Record<string, { bg: string; senderColor: string; tag: string }> = {
  human: { bg: 'transparent', senderColor: COLORS.TEXT_ACCENT, tag: '' },
  surrogate: { bg: COLORS.SURROGATE_BG, senderColor: COLORS.SURROGATE_TEXT, tag: 'SRG' },
  contributor: { bg: COLORS.CONTRIBUTOR_BG, senderColor: COLORS.CONTRIBUTOR_TEXT, tag: 'CTR' },
};

export function ResultsView() {
  const { resultsData, fetchResults, setView } = useDeliberationStore();
  const [activeTab, setActiveTab] = useState<string | null>(null);

  // The session ID is stored in the resultsData once loaded, or we rely on the
  // calling code to have called fetchResults before mounting this view.
  // On first mount, if we already have resultsData, set the default tab.
  useEffect(() => {
    if (resultsData?.subgroups?.length && !activeTab) {
      setActiveTab(resultsData.subgroups[0].id);
    }
  }, [resultsData?.subgroups]);

  if (!resultsData) {
    return (
      <motion.div {...fadeIn} style={{ textAlign: 'center', padding: '60px 0' }}>
        <div style={{ fontFamily: FONTS.MONO, color: COLORS.TEXT_DIM, fontSize: '18px' }}>
          Loading mission debrief...
        </div>
      </motion.div>
    );
  }

  const {
    title,
    status,
    created_at,
    summary,
    final_convergence,
    subgroups,
    ideas,
    messages,
  } = resultsData;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  const getSentimentColor = (s: number) => {
    if (s > 0.3) return COLORS.SUCCESS;
    if (s < -0.3) return COLORS.ERROR;
    return COLORS.TEXT_MUTED;
  };

  const getConvergenceColor = (score: number | null | undefined) => {
    if (score == null) return COLORS.TEXT_DIM;
    if (score >= 0.7) return COLORS.SUCCESS;
    if (score >= 0.4) return COLORS.ACCENT;
    return COLORS.ERROR;
  };

  const filteredMessages = activeTab
    ? messages.filter((m: Message) => m.subgroup_id === activeTab)
    : messages;

  const subgroupLabelMap = Object.fromEntries(
    subgroups.map((sg) => [sg.id, sg.label]),
  );

  return (
    <motion.div {...fadeIn} style={styles.container}>
      {/* System label + back button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={systemLabel}>[ MISSION DEBRIEF ]</div>
        <button
          style={styles.backBtn}
          onClick={() => setView('home')}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = COLORS.ACCENT;
            e.currentTarget.style.color = COLORS.ACCENT;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = COLORS.BORDER_LIGHT;
            e.currentTarget.style.color = COLORS.TEXT_MUTED;
          }}
        >
          &larr; BACK TO HOME
        </button>
      </div>

      {/* Header with title, date, convergence */}
      <motion.div
        style={styles.header}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <div style={styles.headerTop}>
          <div style={styles.headerLeft}>
            <span style={styles.statusBadge}>{status}</span>
            <h1 style={styles.title}>{title}</h1>
            <span style={styles.dateLine}>{formatDate(created_at)}</span>
          </div>
          <div style={styles.convergenceBox}>
            <div
              style={{
                ...styles.convergenceValue,
                color: getConvergenceColor(final_convergence),
              }}
            >
              {final_convergence != null
                ? `${(final_convergence * 100).toFixed(0)}%`
                : '--'}
            </div>
            <div style={styles.convergenceLabel}>Convergence</div>
          </div>
        </div>
      </motion.div>

      {/* Summary section */}
      <motion.div
        style={styles.section}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div style={styles.sectionHeader}>[ COLLECTIVE ASSESSMENT ]</div>
        {summary ? (
          <div style={styles.summaryText}>{summary}</div>
        ) : (
          <div style={styles.noSummary}>
            No summary generated for this session.
          </div>
        )}
      </motion.div>

      {/* Ideas section */}
      {ideas.length > 0 && (
        <motion.div
          style={styles.section}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div style={styles.sectionHeader}>
            [ KEY INSIGHTS ] &mdash; {ideas.length}
          </div>
          <motion.div variants={staggerContainer} initial="initial" animate="animate">
            {ideas.map((idea) => (
              <motion.div key={idea.id} variants={staggerItem} style={styles.idea}>
                <div style={styles.ideaSummary}>{idea.summary}</div>
                <div style={styles.ideaMeta}>
                  <span>
                    SUPPORT: {idea.support_count} | CHALLENGE: {idea.challenge_count}
                  </span>
                  <span style={{ color: getSentimentColor(idea.sentiment) }}>
                    {idea.sentiment > 0 ? '+' : ''}
                    {idea.sentiment.toFixed(1)}
                  </span>
                </div>
                <div style={styles.sentimentBar}>
                  <div
                    style={{
                      height: '100%',
                      borderRadius: '1px',
                      width: `${Math.abs(idea.sentiment) * 100}%`,
                      background: getSentimentColor(idea.sentiment),
                      marginLeft: idea.sentiment < 0 ? 'auto' : 0,
                      boxShadow: `0 0 6px ${getSentimentColor(idea.sentiment)}`,
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      )}

      {/* Communication log section */}
      {messages.length > 0 && (
        <motion.div
          style={styles.section}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div style={styles.sectionHeader}>
            [ COMMUNICATION LOG ] &mdash; {messages.length} transmissions
          </div>

          {/* Subgroup tabs */}
          {subgroups.length > 1 && (
            <div style={styles.tabBar}>
              {subgroups.map((sg) => (
                <button
                  key={sg.id}
                  style={{
                    ...styles.tab,
                    ...(activeTab === sg.id ? styles.tabActive : {}),
                  }}
                  onClick={() => setActiveTab(sg.id)}
                  onMouseEnter={(e) => {
                    if (activeTab !== sg.id) {
                      e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== sg.id) {
                      e.currentTarget.style.color = COLORS.TEXT_DIM;
                    }
                  }}
                >
                  {sg.label}
                </button>
              ))}
            </div>
          )}

          <div style={styles.messageLog}>
            {filteredMessages.length === 0 ? (
              <div
                style={{
                  fontFamily: FONTS.MONO,
                  color: COLORS.TEXT_DIM,
                  fontSize: '16px',
                  textAlign: 'center',
                  padding: '20px',
                }}
              >
                No transmissions in this channel.
              </div>
            ) : (
              filteredMessages.map((msg: Message) => {
                const typeStyle = MSG_TYPE_STYLES[msg.msg_type] || MSG_TYPE_STYLES.human;
                return (
                  <div
                    key={msg.id}
                    style={{
                      ...styles.logEntry,
                      background: typeStyle.bg,
                      display: 'flex',
                      flexWrap: 'wrap' as const,
                      alignItems: 'baseline',
                    }}
                  >
                    <span style={styles.logTimestamp}>
                      {formatTime(msg.created_at)}
                    </span>
                    {typeStyle.tag && (
                      <span
                        style={{
                          fontFamily: FONTS.MONO,
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '1px 5px',
                          borderRadius: '2px',
                          marginRight: '6px',
                          background: typeStyle.senderColor,
                          color: COLORS.BG_PRIMARY,
                          letterSpacing: '0.5px',
                        }}
                      >
                        {typeStyle.tag}
                      </span>
                    )}
                    <span
                      style={{
                        ...styles.logSender,
                        color: typeStyle.senderColor,
                      }}
                    >
                      {msg.display_name || 'Unknown'}:
                    </span>
                    <span style={styles.logContent}>{msg.content}</span>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      )}

      {/* Crew manifest */}
      {subgroups.length > 0 && (
        <motion.div
          style={styles.section}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div style={styles.sectionHeader}>[ CREW MANIFEST ]</div>
          <div style={styles.crewGrid}>
            {subgroups.map((sg) => (
              <div key={sg.id} style={styles.crewCard}>
                <div style={styles.crewSubgroupLabel}>{sg.label}</div>
                {sg.members.map((m) => (
                  <div key={m.id} style={styles.crewMember}>
                    <span style={styles.crewDot} />
                    {m.display_name}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
