/** Approved TruthBounty V2 design-token contract (UI-FE-001). */

export const BRAND_COLOR_TOKENS = {
  signalCyan: '#22D3EE',
  proofBlue: '#4F7CFF',
  inkNavy: '#070A12',
  deepSlate: '#101522',
  frostWhite: '#F7F9FC',
  bountyGold: '#F5B942',
} as const;

export const SEMANTIC_STATE_TOKENS = {
  success: '#41D39A',
  attention: '#F4B860',
  danger: '#FF6B7A',
  info: '#74A7FF',
} as const;

export const SPACING_TOKENS = [4, 8, 12, 16, 24, 32, 48, 64] as const;
export const RADIUS_TOKENS = [8, 12, 16, 20] as const;
export const CONTROL_HEIGHT_TOKENS = { compact: 36, default: 44, large: 52 } as const;
export const MOTION_TOKENS = { feedback: 120, component: 180, drawer: 240 } as const;

export const SEMANTIC_COLOR_TOKENS = [
  'canvas', 'surface', 'elevated', 'ink', 'ink-secondary', 'ink-muted',
  'action', 'action-hover', 'action-ink', 'focus', 'success', 'warning',
  'danger', 'info', 'pending', 'confirmed', 'finalized', 'orphaned',
  'divider', 'disabled',
] as const;
export type SemanticColorToken = (typeof SEMANTIC_COLOR_TOKENS)[number];

export const TYPE_SCALE_TOKENS = [
  'display', 'title', 'section', 'body', 'small', 'label', 'code', 'data',
] as const;
export type TypeScaleToken = (typeof TYPE_SCALE_TOKENS)[number];

export const LAYOUT_TOKENS = ['touch-target', 'content-width', 'gutter'] as const;
export type LayoutToken = (typeof LAYOUT_TOKENS)[number];

export const STATUS_TONES = [
  'neutral', 'pending', 'confirmed', 'finalized', 'orphaned',
  'success', 'warning', 'danger', 'info',
] as const;
export type StatusToneName = (typeof STATUS_TONES)[number];
