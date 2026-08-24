import type { ThemeColors } from 'shared/constants/theme';
import type React from 'react';

// ─── Typography ──────────────────────────────────────────────────────────────
export const FONT_SANS = "'Inter', system-ui, -apple-system, sans-serif";
export const FONT_SERIF = "'Noto Serif', Georgia, serif";
export const FONT_DISPLAY = "'Outfit', 'Inter', system-ui, sans-serif";

// ─── Spacing scale ────────────────────────────────────────────────────────────
export const SPACE = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px',
} as const;

// ─── Border radius ────────────────────────────────────────────────────────────
export const RADIUS = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '32px',
  full: '9999px',
} as const;

// ─── Shadow scale ─────────────────────────────────────────────────────────────
export const SHADOW = {
  sm: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  md: '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
  lg: '0 8px 24px rgba(0,0,0,0.10), 0 4px 8px rgba(0,0,0,0.06)',
  xl: '0 16px 40px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.08)',
  hover: '0 8px 24px rgba(0,0,0,0.13), 0 4px 8px rgba(0,0,0,0.07)',
} as const;

// ─── Transitions ──────────────────────────────────────────────────────────────
export const TRANSITION = {
  fast: 'all 0.12s ease',
  base: 'all 0.18s ease',
  slow: 'all 0.28s ease',
} as const;

// ─── Animations ──────────────────────────────────────────────────────────────
export const ANIM = {
  fadeUp: 'fadeUp 0.35s ease both',
  fadeIn: 'fadeIn 0.25s ease both',
  scaleIn: 'scaleIn 0.2s ease both',
  slideInRight: 'slideInRight 0.3s ease both',
} as const;

// ─── Style builders ───────────────────────────────────────────────────────────

export const cardStyle = (theme: ThemeColors, options?: { elevated?: boolean; hoverable?: boolean; selected?: boolean }): React.CSSProperties => ({
  backgroundColor: options?.elevated ? theme.surfaceElevated : theme.surface,
  border: `1.5px solid ${options?.selected ? theme.primary : theme.border}`,
  borderRadius: RADIUS['2xl'],
  boxShadow: options?.selected ? SHADOW.md : SHADOW.sm,
  padding: `${SPACE.lg} ${SPACE.lg}`,
  transition: TRANSITION.base,
});

export const chipStyle = (theme: ThemeColors, variant: 'primary' | 'subtle' | 'success' | 'urgent' | 'warning' = 'subtle'): React.CSSProperties => {
  const map: Record<string, React.CSSProperties> = {
    primary:  { backgroundColor: theme.primary,      color: theme.textInverse,  border: `1px solid ${theme.primary}` },
    subtle:   { backgroundColor: theme.surfaceSubtle, color: theme.primary,      border: `1px solid ${theme.borderSubtle}` },
    success:  { backgroundColor: '#dcfce7',           color: '#14532d',          border: '1px solid #bbf7d0' },
    urgent:   { backgroundColor: '#fee2e2',           color: '#7f1d1d',          border: '1px solid #fecaca' },
    warning:  { backgroundColor: '#fef3c7',           color: '#78350f',          border: '1px solid #fde68a' },
  };
  return {
    ...map[variant],
    display: 'inline-flex',
    alignItems: 'center',
    gap: SPACE.xs,
    padding: '4px 12px',
    borderRadius: RADIUS.full,
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '0.02em',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  };
};

export const btnPrimaryStyle = (theme: ThemeColors, size: 'sm' | 'md' | 'lg' = 'md'): React.CSSProperties => {
  const sizes = {
    sm: { padding: '8px 16px', fontSize: '13px' },
    md: { padding: '12px 24px', fontSize: '15px' },
    lg: { padding: '16px 32px', fontSize: '17px' },
  };
  return {
    backgroundColor: theme.primary,
    color: theme.textInverse,
    border: 'none',
    borderRadius: RADIUS.lg,
    fontWeight: '800',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.sm,
    boxShadow: `0 4px 14px rgba(113,131,85,0.35)`,
    transition: TRANSITION.base,
    fontFamily: FONT_SANS,
    ...sizes[size],
  };
};

export const btnOutlineStyle = (theme: ThemeColors, size: 'sm' | 'md' | 'lg' = 'md'): React.CSSProperties => {
  const sizes = {
    sm: { padding: '8px 16px', fontSize: '13px' },
    md: { padding: '12px 24px', fontSize: '15px' },
    lg: { padding: '16px 32px', fontSize: '17px' },
  };
  return {
    backgroundColor: theme.surface,
    color: theme.primary,
    border: `2px solid ${theme.border}`,
    borderRadius: RADIUS.lg,
    fontWeight: '700',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.sm,
    transition: TRANSITION.base,
    fontFamily: FONT_SANS,
    ...sizes[size],
  };
};

export const inputFieldStyle = (theme: ThemeColors): React.CSSProperties => ({
  width: '100%',
  padding: '12px 16px',
  backgroundColor: theme.surface,
  color: theme.textHeading,
  border: `1.5px solid ${theme.border}`,
  borderRadius: RADIUS.lg,
  fontSize: '15px',
  outline: 'none',
  boxSizing: 'border-box' as const,
  fontFamily: FONT_SANS,
  transition: TRANSITION.fast,
});

export const emptyStateStyle = (theme: ThemeColors): React.CSSProperties => ({
  textAlign: 'center' as const,
  padding: `${SPACE['3xl']} ${SPACE.xl}`,
  backgroundColor: theme.surface,
  borderRadius: RADIUS['3xl'],
  border: `1.5px solid ${theme.borderSubtle}`,
  animation: ANIM.fadeUp,
});

export const sectionHeaderStyle = (theme: ThemeColors): React.CSSProperties => ({
  fontFamily: FONT_SERIF,
  fontSize: '22px',
  fontWeight: '900',
  color: theme.textHeading,
  margin: '0 0 16px 0',
  display: 'flex',
  alignItems: 'center',
  gap: SPACE.sm,
});
