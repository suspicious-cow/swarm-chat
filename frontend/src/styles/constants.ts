export const LAYOUT = {
  SIDEBAR_WIDTH: 240,
  TOP_BAR_HEIGHT: 52,
  CONTENT_PADDING: 24,
} as const;

export const COLORS = {
  // Backgrounds
  BG_PRIMARY: '#141418',
  BG_SIDEBAR: '#1a1a20',
  BG_CARD: '#1e1e26',
  BG_INPUT: '#16161c',
  BG_HOVER: '#26262e',
  BG_ELEVATED: '#242430',

  // Borders
  BORDER: '#2e2e38',
  BORDER_LIGHT: '#3a3a46',

  // Text
  TEXT_PRIMARY: '#e8e6e3',
  TEXT_HEADING: '#f5f3f0',
  TEXT_ACCENT: '#d4a574',
  TEXT_MUTED: '#8a8a96',
  TEXT_DIM: '#6a6a76',

  // Accent
  ACCENT: '#F59E0B',
  ACCENT_SECONDARY: '#F97316',
  ACCENT_TERTIARY: '#14B8A6',

  // Buttons
  BUTTON: '#D97706',
  BUTTON_HOVER: '#F59E0B',

  // Status
  SUCCESS: '#34D399',
  ERROR: '#F87171',
  WARNING: '#FBBF24',

  // Navigation
  NAV_ACTIVE_BG: '#262630',
  NAV_ACTIVE_BORDER: '#F59E0B',

  // Gradients
  GRADIENT_PRIMARY: 'linear-gradient(135deg, #D97706, #F59E0B)',
  GRADIENT_SIDEBAR: 'linear-gradient(180deg, #1a1a20, #16161c)',
  GRADIENT_HERO: 'linear-gradient(135deg, #1e1e26 0%, #242430 50%, #1a1a20 100%)',

  // Shadows
  SHADOW_SM: '0 2px 8px rgba(0,0,0,0.3)',
  SHADOW_MD: '0 4px 16px rgba(0,0,0,0.4)',
  SHADOW_GLOW: '0 0 20px rgba(245,158,11,0.15)',

  // Badge colors
  BADGE_WAITING_BG: '#332b00',
  BADGE_WAITING_TEXT: '#FBBF24',
  BADGE_ACTIVE_BG: '#003d20',
  BADGE_ACTIVE_TEXT: '#34D399',
  BADGE_COMPLETED_BG: '#2a2a30',
  BADGE_COMPLETED_TEXT: '#8a8a96',

  // Message colors
  SURROGATE_BG: '#1e2428',
  SURROGATE_TEXT: '#9dd5d0',
  SURROGATE_BORDER: '#2a3a3a',
  CONTRIBUTOR_BG: '#241e28',
  CONTRIBUTOR_TEXT: '#d0b8e0',
  CONTRIBUTOR_BORDER: '#3a2a4a',
  OWN_MSG_BG: '#3a2e10',
  OTHER_MSG_BG: '#222228',
} as const;
