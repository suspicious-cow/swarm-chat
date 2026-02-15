export const LAYOUT = {
  SIDEBAR_WIDTH: 240,
  TOP_BAR_HEIGHT: 52,
  CONTENT_PADDING: 24,
} as const;

export const FONTS = {
  DISPLAY: "'Chakra Petch', sans-serif",
  BODY: "'IBM Plex Sans', sans-serif",
  MONO: "'IBM Plex Mono', monospace",
} as const;

export const COLORS = {
  // Backgrounds
  BG_PRIMARY: '#0a0a0f',
  BG_SIDEBAR: '#0d0d14',
  BG_CARD: '#111118',
  BG_INPUT: '#0e0e15',
  BG_HOVER: '#16161f',
  BG_ELEVATED: '#141420',

  // Borders
  BORDER: '#1e1e2a',
  BORDER_LIGHT: '#2a2a3a',

  // Text
  TEXT_PRIMARY: '#d4cfc4',
  TEXT_HEADING: '#e8e4d8',
  TEXT_ACCENT: '#FFB800',
  TEXT_MUTED: '#6a6670',
  TEXT_DIM: '#4a4650',

  // Accent — CRT Phosphor
  ACCENT: '#FFB800',
  ACCENT_DIM: '#CC9200',
  ACCENT_GLOW: 'rgba(255,184,0,0.15)',
  ACCENT_SECONDARY: '#00D4AA',
  ACCENT_TERTIARY: '#00D4AA',

  // Teal
  TEAL: '#00D4AA',
  TEAL_DIM: '#00A888',
  TEAL_GLOW: 'rgba(0,212,170,0.12)',

  // Buttons
  BUTTON: '#CC9200',
  BUTTON_HOVER: '#FFB800',

  // Status
  SUCCESS: '#00FF88',
  ERROR: '#FF4444',
  WARNING: '#FFB800',

  // Navigation
  NAV_ACTIVE_BG: '#14141e',
  NAV_ACTIVE_BORDER: '#FFB800',

  // Gradients
  GRADIENT_PRIMARY: 'linear-gradient(135deg, #CC9200, #FFB800)',
  GRADIENT_SIDEBAR: 'linear-gradient(180deg, #0d0d14, #0a0a0f)',
  GRADIENT_HERO: 'linear-gradient(135deg, #111118 0%, #141420 50%, #0d0d14 100%)',

  // Shadows
  SHADOW_SM: '0 2px 8px rgba(0,0,0,0.5)',
  SHADOW_MD: '0 4px 16px rgba(0,0,0,0.6)',
  SHADOW_GLOW: '0 0 20px rgba(255,184,0,0.15)',
  SHADOW_TEAL: '0 0 20px rgba(0,212,170,0.12)',

  // Badge colors
  BADGE_WAITING_BG: '#1a1500',
  BADGE_WAITING_TEXT: '#FFB800',
  BADGE_ACTIVE_BG: '#001a10',
  BADGE_ACTIVE_TEXT: '#00FF88',
  BADGE_COMPLETED_BG: '#151518',
  BADGE_COMPLETED_TEXT: '#6a6670',

  // Message colors
  SURROGATE_BG: '#0a1418',
  SURROGATE_TEXT: '#80e0cc',
  SURROGATE_BORDER: '#1a2a2a',
  CONTRIBUTOR_BG: '#12101a',
  CONTRIBUTOR_TEXT: '#b8a8d0',
  CONTRIBUTOR_BORDER: '#2a2240',
  OWN_MSG_BG: '#1a1400',
  OTHER_MSG_BG: '#111118',
} as const;
