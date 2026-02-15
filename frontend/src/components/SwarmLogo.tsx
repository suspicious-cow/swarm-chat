interface Props {
  size?: number;
}

export function SwarmLogo({ size = 32 }: Props) {
  const s = size;
  return (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Back hexagon — teal */}
      <path
        d="M10 6.5l7.79-4.5 7.79 4.5v9L17.79 20 10 15.5z"
        fill="#14B8A6"
        opacity="0.5"
      />
      {/* Middle hexagon — coral */}
      <path
        d="M6.21 11l7.79-4.5 7.79 4.5v9L14 25 6.21 20z"
        fill="#F97316"
        opacity="0.6"
      />
      {/* Front hexagon — amber */}
      <path
        d="M8 13l8-4.62L24 13v9.24L16 26.86 8 22.24z"
        fill="#F59E0B"
        opacity="0.85"
      />
    </svg>
  );
}
