import { COLORS, FONTS } from './constants';

/** Instrument panel card — sharp corners, 1px border, subtle inner shadow */
export const instrumentCard: React.CSSProperties = {
  background: COLORS.BG_CARD,
  border: `1px solid ${COLORS.BORDER}`,
  borderRadius: '2px',
  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.03), ${COLORS.SHADOW_SM}`,
};

/** [ SECTION NAME ] system label in monospace, uppercase, letter-spaced */
export const systemLabel: React.CSSProperties = {
  fontFamily: FONTS.MONO,
  fontSize: '15px',
  fontWeight: 500,
  letterSpacing: '2px',
  textTransform: 'uppercase',
  color: COLORS.TEXT_MUTED,
};

/** Data readout — monospace on tinted background */
export const dataReadout: React.CSSProperties = {
  fontFamily: FONTS.MONO,
  fontSize: '18px',
  fontWeight: 400,
  background: 'rgba(255,184,0,0.06)',
  border: `1px solid ${COLORS.BORDER}`,
  borderRadius: '2px',
  padding: '8px 12px',
  color: COLORS.ACCENT,
};

/** Status LED base — 8px circle */
export const statusLed = (color: string, pulse = false): React.CSSProperties => ({
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  background: color,
  boxShadow: `0 0 6px ${color}`,
  display: 'inline-block',
  flexShrink: 0,
  animation: pulse ? 'ledPulse 2s infinite' : 'none',
});

/** Corner bracket pseudo-decoration style (applied via ::before/::after in CSS) */
export const cornerBracketBorder: React.CSSProperties = {
  position: 'relative',
  padding: '20px',
};

/** Scan-line overlay for an element */
export const scanLineOverlay: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  pointerEvents: 'none',
  zIndex: 9998,
  background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)',
};

/** CRT vignette radial gradient */
export const crtVignette: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  pointerEvents: 'none',
  zIndex: 9997,
  background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.4) 100%)',
};

/** Faint graph-paper grid background */
export const gridBg: React.CSSProperties = {
  backgroundImage: `
    linear-gradient(rgba(255,184,0,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,184,0,0.03) 1px, transparent 1px)
  `,
  backgroundSize: '24px 24px',
};

/** CRT phosphor heading — amber glow text-shadow */
export const phosphorHeading: React.CSSProperties = {
  fontFamily: FONTS.DISPLAY,
  fontWeight: 700,
  color: COLORS.TEXT_HEADING,
  textShadow: COLORS.TEXT_GLOW_AMBER,
  letterSpacing: '2px',
  textTransform: 'uppercase',
};

/** Retro input field styling */
export const retroInput: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  background: COLORS.BG_INPUT,
  border: `1px solid ${COLORS.BORDER}`,
  borderRadius: '2px',
  color: COLORS.TEXT_PRIMARY,
  fontFamily: FONTS.BODY,
  fontSize: '18px',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

/** Retro button — amber gradient CTA */
export const retroButton: React.CSSProperties = {
  padding: '12px 24px',
  background: COLORS.GRADIENT_PRIMARY,
  border: 'none',
  borderRadius: '2px',
  color: '#0a0a0f',
  fontFamily: FONTS.DISPLAY,
  fontSize: '18px',
  fontWeight: 600,
  letterSpacing: '1px',
  textTransform: 'uppercase',
  cursor: 'pointer',
  transition: 'box-shadow 0.15s, transform 0.1s',
  boxShadow: COLORS.SHADOW_GLOW,
};
