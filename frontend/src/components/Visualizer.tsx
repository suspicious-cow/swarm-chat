import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useDeliberationStore } from '../stores/deliberationStore';
import { SubgroupNode } from './SubgroupNode';
import { COLORS, FONTS } from '../styles/constants';
import { instrumentCard, systemLabel, dataReadout } from '../styles/retro';
import { fadeIn, staggerContainer, staggerItem } from '../styles/motion';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: 'calc(100vh - 100px)',
    gap: '16px',
  },
  vizArea: {
    flex: 1,
    ...instrumentCard,
    position: 'relative' as const,
    overflow: 'hidden',
    minHeight: '300px',
  },
  vizHeader: {
    padding: '10px 20px',
    borderBottom: `1px solid ${COLORS.BORDER}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    ...instrumentCard,
    padding: '16px',
    maxHeight: '240px',
    overflowY: 'auto' as const,
  },
  ideasTitle: {
    ...systemLabel,
    marginBottom: '12px',
  },
  idea: {
    ...instrumentCard,
    padding: '10px 12px',
    marginBottom: '8px',
    fontSize: '13px',
    lineHeight: 1.5,
  },
  ideaSummary: {
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.BODY,
    fontSize: '13px',
  },
  ideaMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '6px',
    fontFamily: FONTS.MONO,
    fontSize: '11px',
    color: COLORS.TEXT_MUTED,
  },
  sentimentBar: {
    height: '3px',
    borderRadius: '1px',
    marginTop: '6px',
    background: COLORS.BORDER,
  },
  statsRow: {
    ...dataReadout,
    display: 'inline-block',
    padding: '4px 10px',
    fontSize: '11px',
  } as React.CSSProperties,
};

/* CSS keyframe for radar sweep rotation — injected once */
const SWEEP_KEYFRAMES = `
@keyframes radarSweep {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
`;

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

  const headerHeight = 42;
  const centerX = size.width / 2;
  const centerY = (size.height - headerHeight) / 2;
  const radius = Math.min(centerX, centerY) * 0.65;

  // Concentric ring radii (3 rings)
  const ringRadii = [radius * 0.4, radius * 0.7, radius * 1.0];

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
    <motion.div style={styles.container} {...fadeIn}>
      {/* Inject radar sweep keyframes */}
      <style>{SWEEP_KEYFRAMES}</style>

      <div style={styles.vizArea} ref={vizRef}>
        <div style={styles.vizHeader}>
          <span style={systemLabel}>[ TACTICAL DISPLAY ]</span>
          <span style={styles.statsRow}>
            {subgroups.length} THINKTANKS | {ideas.length} IDEAS
          </span>
        </div>

        {/* SVG radar overlay */}
        <svg
          style={styles.canvas}
          viewBox={`0 0 ${size.width} ${size.height}`}
          preserveAspectRatio="none"
        >
          <defs>
            {/* Amber glow filter */}
            <filter id="amberGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Sweep line gradient (fades from amber to transparent) */}
            <linearGradient id="sweepGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,184,0,0.0)" />
              <stop offset="60%" stopColor="rgba(255,184,0,0.12)" />
              <stop offset="100%" stopColor="rgba(255,184,0,0.35)" />
            </linearGradient>
          </defs>

          {/* Background fill */}
          <rect width={size.width} height={size.height} fill={COLORS.BG_PRIMARY} />

          {/* Concentric reference rings */}
          {ringRadii.map((r, i) => (
            <circle
              key={`ring-${i}`}
              cx={centerX}
              cy={centerY + headerHeight}
              r={r}
              fill="none"
              stroke="rgba(255,184,0,0.08)"
              strokeWidth="1"
            />
          ))}

          {/* Crosshair lines */}
          <line
            x1={centerX}
            y1={headerHeight}
            x2={centerX}
            y2={size.height}
            stroke="rgba(255,184,0,0.06)"
            strokeWidth="1"
          />
          <line
            x1={0}
            y1={centerY + headerHeight}
            x2={size.width}
            y2={centerY + headerHeight}
            stroke="rgba(255,184,0,0.06)"
            strokeWidth="1"
          />

          {/* Animated radar sweep line */}
          <g
            style={{
              transformOrigin: `${centerX}px ${centerY + headerHeight}px`,
              animation: 'radarSweep 8s linear infinite',
            }}
          >
            {/* Sweep line */}
            <line
              x1={centerX}
              y1={centerY + headerHeight}
              x2={centerX}
              y2={centerY + headerHeight - radius * 1.1}
              stroke="rgba(255,184,0,0.3)"
              strokeWidth="1"
            />
            {/* Sweep trail (triangular wedge) */}
            <path
              d={`M ${centerX} ${centerY + headerHeight}
                  L ${centerX} ${centerY + headerHeight - radius * 1.1}
                  A ${radius * 1.1} ${radius * 1.1} 0 0 0
                  ${centerX + radius * 1.1 * Math.sin(-0.25)} ${centerY + headerHeight - radius * 1.1 * Math.cos(-0.25)}`}
              fill="url(#sweepGradient)"
              opacity="0.5"
            />
          </g>

          {/* Center blip */}
          <circle
            cx={centerX}
            cy={centerY + headerHeight}
            r="3"
            fill={COLORS.ACCENT}
            opacity="0.6"
          />

          {/* Connection lines between subgroups */}
          {connections.map((c, i) => (
            <line
              key={i}
              x1={c.x1}
              y1={c.y1 + headerHeight}
              x2={c.x2}
              y2={c.y2 + headerHeight}
              stroke={COLORS.ACCENT}
              strokeWidth="1"
              opacity="0.2"
              filter="url(#amberGlow)"
            />
          ))}

          {/* Animated flow indicators along connections */}
          {connections.map((c, i) => (
            <circle key={`flow-${i}`} r="2" fill={COLORS.ACCENT} opacity="0.5">
              <animateMotion
                dur={`${4 + i * 0.7}s`}
                repeatCount="indefinite"
                path={`M${c.x1},${c.y1 + headerHeight} L${c.x2},${c.y2 + headerHeight}`}
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
          [ LIVE IDEAS ] &mdash; {ideas.length}
        </div>
        {ideas.length === 0 && (
          <div style={{ color: COLORS.TEXT_MUTED, fontFamily: FONTS.MONO, fontSize: '12px' }}>
            Ideas will appear here as the discussion progresses.
          </div>
        )}
        <motion.div variants={staggerContainer} initial="initial" animate="animate">
          {ideas.map(idea => (
            <motion.div key={idea.id} variants={staggerItem} style={styles.idea}>
              <div style={styles.ideaSummary}>{idea.summary}</div>
              <div style={styles.ideaMeta}>
                <span>SUPPORT: {idea.support_count} | CHALLENGE: {idea.challenge_count}</span>
                <span style={{ color: getSentimentColor(idea.sentiment) }}>
                  {idea.sentiment > 0 ? '+' : ''}{idea.sentiment.toFixed(1)}
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
      </div>
    </motion.div>
  );
}
