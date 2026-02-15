import type { Subgroup } from '../types';
import { COLORS } from '../styles/constants';

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
    color: COLORS.TEXT_MUTED,
    textAlign: 'center' as const,
  },
  count: {
    fontSize: '11px',
    color: COLORS.TEXT_DIM,
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

const GROUP_COLORS = [
  { bg: '#2a2210', border: '#D97706', text: '#F59E0B' },   // amber
  { bg: '#102a2a', border: '#0D9488', text: '#14B8A6' },   // teal
  { bg: '#2a1a10', border: '#EA580C', text: '#F97316' },   // coral
  { bg: '#1a2a1a', border: '#4ADE80', text: '#6EE7A0' },   // sage
  { bg: '#241a2a', border: '#A78BFA', text: '#C4B5FD' },   // lavender
  { bg: '#2a2018', border: '#B45309', text: '#D4A574' },   // copper
];

export function SubgroupNode({ subgroup, index, total, isHighlighted, centerX, centerY, radius }: Props) {
  const angle = (2 * Math.PI * index) / total - Math.PI / 2;
  const x = centerX + radius * Math.cos(angle);
  const y = centerY + radius * Math.sin(angle);
  const color = GROUP_COLORS[index % GROUP_COLORS.length];

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
