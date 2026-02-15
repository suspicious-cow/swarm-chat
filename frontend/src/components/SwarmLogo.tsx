interface Props {
  size?: number;
  glow?: boolean;
}

export function SwarmLogo({ size = 40, glow = false }: Props) {
  const filterId = `swarm-glow-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id={filterId} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={glow ? 3 : 1.5} result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <linearGradient id={`${filterId}-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#CC9200" />
          <stop offset="100%" stopColor="#FFB800" />
        </linearGradient>
      </defs>

      {/* Outer hexagon with glow */}
      <polygon
        points="24,4 42.39,14.5 42.39,35.5 24,46 5.61,35.5 5.61,14.5"
        fill="none"
        stroke="#FFB800"
        strokeWidth="1.5"
        filter={`url(#${filterId})`}
        opacity={glow ? 1 : 0.9}
      />

      {/* Inner hexagon */}
      <polygon
        points="24,10 36.39,17.5 36.39,32.5 24,40 11.61,32.5 11.61,17.5"
        fill="rgba(255,184,0,0.06)"
        stroke="#CC9200"
        strokeWidth="1"
        opacity="0.7"
      />

      {/* Circuit traces from vertices */}
      <g stroke="#FFB800" strokeWidth="1" opacity="0.5">
        {/* Top vertex - trace up */}
        <line x1="24" y1="4" x2="24" y2="0.5" />
        <circle cx="24" cy="0.5" r="1" fill="#FFB800" />

        {/* Top-right vertex */}
        <line x1="42.39" y1="14.5" x2="45.5" y2="12" />
        <circle cx="45.5" cy="12" r="1" fill="#FFB800" />

        {/* Bottom-right vertex */}
        <line x1="42.39" y1="35.5" x2="45.5" y2="38" />
        <circle cx="45.5" cy="38" r="1" fill="#FFB800" />

        {/* Bottom vertex */}
        <line x1="24" y1="46" x2="24" y2="47.5" />

        {/* Bottom-left vertex */}
        <line x1="5.61" y1="35.5" x2="2.5" y2="38" />
        <circle cx="2.5" cy="38" r="1" fill="#FFB800" />

        {/* Top-left vertex */}
        <line x1="5.61" y1="14.5" x2="2.5" y2="12" />
        <circle cx="2.5" cy="12" r="1" fill="#FFB800" />
      </g>

      {/* Center dot pattern */}
      <g fill="#FFB800" opacity="0.6">
        <circle cx="24" cy="25" r="2" />
        <circle cx="19" cy="22" r="1" />
        <circle cx="29" cy="22" r="1" />
        <circle cx="19" cy="28" r="1" />
        <circle cx="29" cy="28" r="1" />
      </g>

      {/* SC text — subtle inside hexagon */}
      <text
        x="24"
        y="26.5"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="'IBM Plex Mono', monospace"
        fontSize="7"
        fontWeight="600"
        letterSpacing="1"
        fill={`url(#${filterId}-grad)`}
        opacity="0"
      >
        SC
      </text>
    </svg>
  );
}
