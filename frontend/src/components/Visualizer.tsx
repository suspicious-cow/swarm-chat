import { useEffect, useRef, useState } from 'react';
import { useDeliberationStore } from '../stores/deliberationStore';
import { SubgroupNode } from './SubgroupNode';
import { COLORS } from '../styles/constants';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: 'calc(100vh - 100px)',
    gap: '16px',
    animation: 'fadeIn 0.3s ease',
  },
  vizArea: {
    flex: 1,
    background: COLORS.BG_CARD,
    borderRadius: '12px',
    border: `1px solid ${COLORS.BORDER}`,
    position: 'relative' as const,
    overflow: 'hidden',
    minHeight: '300px',
  },
  vizHeader: {
    padding: '12px 20px',
    borderBottom: `1px solid ${COLORS.BORDER}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vizTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: COLORS.TEXT_ACCENT,
  },
  canvas: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none' as const,
  },
  ideasPanel: {
    background: COLORS.BG_CARD,
    border: `1px solid ${COLORS.BORDER}`,
    borderRadius: '12px',
    padding: '16px',
    maxHeight: '240px',
    overflowY: 'auto' as const,
  },
  ideasTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: COLORS.TEXT_MUTED,
    marginBottom: '12px',
  },
  idea: {
    padding: '10px',
    background: COLORS.BG_INPUT,
    borderRadius: '8px',
    marginBottom: '8px',
    fontSize: '13px',
    lineHeight: 1.5,
  },
  ideaSummary: {
    color: COLORS.TEXT_PRIMARY,
  },
  ideaMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '6px',
    fontSize: '11px',
    color: COLORS.TEXT_DIM,
  },
  sentimentBar: {
    height: '4px',
    borderRadius: '2px',
    marginTop: '4px',
    background: COLORS.BORDER,
  },
};

export function Visualizer() {
  const { currentSession, currentUser, subgroups, ideas, fetchSubgroups, fetchIdeas } = useDeliberationStore();
  const vizRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 600, height: 500 });

  useEffect(() => {
    fetchSubgroups();
    fetchIdeas();
  }, []);

  // Responsive sizing
  useEffect(() => {
    if (!vizRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(vizRef.current);
    return () => observer.disconnect();
  }, []);

  if (!currentSession) return null;

  const centerX = size.width / 2;
  const centerY = (size.height - 50) / 2; // offset for header
  const radius = Math.min(centerX, centerY) * 0.65;

  // Compute connection lines between subgroups
  const connections: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 0; i < subgroups.length; i++) {
    for (let j = i + 1; j < subgroups.length; j++) {
      const angle1 = (2 * Math.PI * i) / subgroups.length - Math.PI / 2;
      const angle2 = (2 * Math.PI * j) / subgroups.length - Math.PI / 2;
      connections.push({
        x1: centerX + radius * Math.cos(angle1),
        y1: centerY + radius * Math.sin(angle1),
        x2: centerX + radius * Math.cos(angle2),
        y2: centerY + radius * Math.sin(angle2),
      });
    }
  }

  const getSentimentColor = (s: number) => {
    if (s > 0.3) return COLORS.SUCCESS;
    if (s < -0.3) return COLORS.ERROR;
    return COLORS.TEXT_MUTED;
  };

  return (
    <div style={styles.container}>
      <div style={styles.vizArea} ref={vizRef}>
        <div style={styles.vizHeader}>
          <span style={styles.vizTitle}>Deliberation Map</span>
          <span style={{ color: COLORS.TEXT_DIM, fontSize: '13px' }}>
            {subgroups.length} ThinkTanks | {ideas.length} Ideas
          </span>
        </div>

        {/* Connection lines */}
        <svg style={styles.canvas}>
          {connections.map((c, i) => (
            <line
              key={i}
              x1={c.x1}
              y1={c.y1 + 50}
              x2={c.x2}
              y2={c.y2 + 50}
              stroke={COLORS.BORDER}
              strokeWidth="1"
              strokeDasharray="4,4"
              opacity="0.5"
            />
          ))}
          {/* Animated flow indicators */}
          {connections.map((c, i) => (
            <circle key={`flow-${i}`} r="3" fill={COLORS.ACCENT} opacity="0.6">
              <animateMotion
                dur={`${3 + i * 0.5}s`}
                repeatCount="indefinite"
                path={`M${c.x1},${c.y1 + 50} L${c.x2},${c.y2 + 50}`}
              />
            </circle>
          ))}
        </svg>

        {/* Subgroup nodes */}
        {subgroups.map((sg, i) => (
          <SubgroupNode
            key={sg.id}
            subgroup={sg}
            index={i}
            total={subgroups.length}
            isHighlighted={sg.id === currentUser?.subgroup_id}
            centerX={centerX}
            centerY={centerY}
            radius={radius}
          />
        ))}
      </div>

      {/* Ideas panel below map */}
      <div style={styles.ideasPanel}>
        <div style={styles.ideasTitle}>
          Live Ideas ({ideas.length})
        </div>
        {ideas.length === 0 && (
          <div style={{ color: COLORS.TEXT_DIM, fontSize: '13px' }}>
            Ideas will appear here as the discussion progresses.
          </div>
        )}
        {ideas.map(idea => (
          <div key={idea.id} style={styles.idea}>
            <div style={styles.ideaSummary}>{idea.summary}</div>
            <div style={styles.ideaMeta}>
              <span>Support: {idea.support_count} | Challenge: {idea.challenge_count}</span>
              <span style={{ color: getSentimentColor(idea.sentiment) }}>
                {idea.sentiment > 0 ? '+' : ''}{idea.sentiment.toFixed(1)}
              </span>
            </div>
            <div style={styles.sentimentBar}>
              <div
                style={{
                  height: '100%',
                  borderRadius: '2px',
                  width: `${Math.abs(idea.sentiment) * 100}%`,
                  background: getSentimentColor(idea.sentiment),
                  marginLeft: idea.sentiment < 0 ? 'auto' : 0,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
