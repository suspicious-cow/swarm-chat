import type { Subgroup } from '../types';

const styles = {
  node: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  circle: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: 700,
    border: '3px solid',
    transition: 'all 0.3s',
  },
  label: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#a0a0d0',
    textAlign: 'center' as const,
  },
  count: {
    fontSize: '11px',
    color: '#6a6a9a',
  },
};

interface Props {
  subgroup: Subgroup;
  index: number;
  total: number;
  isHighlighted: boolean;
  centerX: number;
  centerY: number;
  radius: number;
}

const COLORS = [
  { bg: '#1a2a5a', border: '#4a6aff', text: '#7c8aff' },
  { bg: '#1a3a2a', border: '#4aaa6a', text: '#6ad08a' },
  { bg: '#3a1a2a', border: '#aa4a6a', text: '#d06a8a' },
  { bg: '#2a2a1a', border: '#aaaa4a', text: '#d0d06a' },
  { bg: '#1a2a3a', border: '#4a8aaa', text: '#6ab0d0' },
  { bg: '#2a1a3a', border: '#8a4aaa', text: '#b06ad0' },
];

export function SubgroupNode({ subgroup, index, total, isHighlighted, centerX, centerY, radius }: Props) {
  const angle = (2 * Math.PI * index) / total - Math.PI / 2;
  const x = centerX + radius * Math.cos(angle);
  const y = centerY + radius * Math.sin(angle);
  const color = COLORS[index % COLORS.length];

  return (
    <div
      style={{
        ...styles.node,
        position: 'absolute',
        left: `${x - 40}px`,
        top: `${y - 50}px`,
        transform: isHighlighted ? 'scale(1.15)' : 'scale(1)',
      }}
    >
      <div
        style={{
          ...styles.circle,
          background: color.bg,
          borderColor: isHighlighted ? '#fff' : color.border,
          color: color.text,
          boxShadow: isHighlighted ? `0 0 20px ${color.border}40` : 'none',
        }}
      >
        {subgroup.members?.length || 0}
      </div>
      <div style={styles.label}>{subgroup.label}</div>
      <div style={styles.count}>
        {subgroup.members?.length || 0} members
      </div>
    </div>
  );
}
