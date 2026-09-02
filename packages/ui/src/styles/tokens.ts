// CSS custom property names — single source of truth.
// These map 1-to-1 with the variables defined in globals.css.

export const tokens = {
  // ── Colour ─────────────────────────────────────────────────────────────────
  gold:        'var(--gold)',
  goldBright:  'var(--gold-bright)',
  goldDeep:    'var(--gold-deep)',
  goldGlow:    'var(--gold-glow)',

  bgVoid:      'var(--bg-void)',
  bgBase:      'var(--bg-base)',
  bgElevated:  'var(--bg-elevated)',
  bgAsh:       'var(--bg-ash)',

  textPrimary: 'var(--text-primary)',
  textMuted:   'var(--text-muted)',
  textSubtle:  'var(--text-subtle)',

  border:      'var(--border)',
  borderMuted: 'var(--border-muted)',

  // Semantic
  success:     'var(--success)',
  warning:     'var(--warning)',
  danger:      'var(--danger)',
  info:        'var(--info)',

  // Glass
  glassBg:     'var(--glass-bg)',
  glassBorder: 'var(--glass-border)',
  glassBlur:   'var(--glass-blur)',
} as const;

export type TokenKey = keyof typeof tokens;
