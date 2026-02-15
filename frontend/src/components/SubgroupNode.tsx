import type { Subgroup } from '../types';
import { COLORS, FONTS } from '../styles/constants';

const RETRO_GROUP_COLORS = [
  '#FFB800', // amber
  '#00D4AA', // teal
  '#FF6B6B', // coral
  '#88C999', // sage
  '#CD7F32', // copper
  '#B8A8D0', // lavender
  '#F4A460', // sandy
  '#6BC5D2', // cyan
];

/* Pulse animation keyframes — injected once */
const PULSE_KEYFRAMES = `
@keyframes blipPulse {
  0%, 100% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.15); opacity: 1; }
}
`;

let keyframesInjected = false;
function ensureKeyframes() {
  if (keyframesInjected) return;
  const styleEl = document.createElement('style');
  styleEl.textContent = PULSE_KEYFRAMES;
  document.head.appendChild(styleEl);
  keyframesInjected = true;
}

interface Props {
  subgroup: Subgroup;
  index: number;
  total: number;
  isHighlighted: boolean;
  centerX: number;
  centerY: number;
  radius: number;
}

export function SubgroupNode({ subgroup, index, total, isHighlighted, centerX, centerY, radius }: Props) {
  ensureKeyframes();

  const angle = (2 * Math.PI * index) / total - Math.PI / 2;
  const x = centerX + radius * Math.cos(angle);
  const y = centerY + radius * Math.sin(angle);
  const color = RETRO_GROUP_COLORS[index % RETRO_GROUP_COLORS.length];
  const memberCount = subgroup.members?.length || 0;
  const headerOffset = 42; // matches Visualizer headerHeight

  // Core blip radius
  const coreR = 14;
  // Outer glow ring radius
  const outerR = 28;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${x - outerR}px`,
        top: `${y - outerR + headerOffset}px`,
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        cursor: 'pointer',
        zIndex: isHighlighted ? 10 : 1,
      }}
    >
      <svg
        width={outerR * 2}
        height={outerR * 2}
        viewBox={`0 0 ${outerR * 2} ${outerR * 2}`}
        style={{ overflow: 'visible' }}
      >
        {/* Outer glow ring */}
        <circle
          cx={outerR}
          cy={outerR}
          r={outerR - 2}
          fill={color}
          opacity={isHighlighted ? 0.15 : 0.08}
          filter="url(#amberGlow)"
          style={isHighlighted ? {
            animation: 'blipPulse 2s ease-in-out infinite',
            transformOrigin: `${outerR}px ${outerR}px`,
          } : undefined}
        />

        {/* Middle ring stroke */}
        <circle
          cx={outerR}
          cy={outerR}
          r={outerR - 4}
          fill="none"
          stroke={color}
          strokeWidth="1"
          opacity={isHighlighted ? 0.5 : 0.25}
        />

        {/* Core blip dot */}
        <circle
          cx={outerR}
          cy={outerR}
          r={coreR}
          fill={color}
          opacity={isHighlighted ? 0.9 : 0.6}
          filter="url(#amberGlow)"
        />

        {/* Inner bright core */}
        <circle
          cx={outerR}
          cy={outerR}
          r={coreR * 0.5}
          fill="#fff"
          opacity={isHighlighted ? 0.3 : 0.15}
        />

        {/* Participant count inside blip */}
        <text
          x={outerR}
          y={outerR + 1}
          textAnchor="middle"
          dominantBaseline="central"
          fill={COLORS.BG_PRIMARY}
          fontSize="15"
          fontFamily={FONTS.MONO}
          fontWeight="700"
        >
          {memberCount}
        </text>

        {/* Surrogate indicator: small teal dot offset upper-right */}
        {isHighlighted && (
          <circle
            cx={outerR + coreR + 4}
            cy={outerR - coreR - 2}
            r="4"
            fill={COLORS.TEAL}
            opacity="0.9"
          >
            <animate
              attributeName="opacity"
              values="0.9;0.5;0.9"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
        )}
      </svg>

      {/* Label text below blip */}
      <div
        style={{
          fontFamily: FONTS.MONO,
          fontSize: '13px',
          fontWeight: 500,
          letterSpacing: '1px',
          color: color,
          textAlign: 'center' as const,
          marginTop: '4px',
          textTransform: 'uppercase' as const,
          whiteSpace: 'nowrap' as const,
          textShadow: `0 0 8px ${color}`,
        }}
      >
        {subgroup.label}
      </div>

      {/* Member count text */}
      <div
        style={{
          fontFamily: FONTS.MONO,
          fontSize: '12px',
          color: COLORS.TEXT_DIM,
          textAlign: 'center' as const,
          marginTop: '1px',
        }}
      >
        {memberCount} MBR{memberCount !== 1 ? 'S' : ''}
      </div>
    </div>
  );
}
