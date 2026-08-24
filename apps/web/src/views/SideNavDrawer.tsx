import React, { useEffect, useState } from 'react';
import type { ThemeColors } from 'shared/constants/theme';
import type { SupportedLanguage } from 'shared/types';
import type { ProfileDto } from 'shared/contracts/profile';
import { getTranslation } from 'shared/i18n/translations';
import { FONT_SERIF } from '../design/tokens';

const DRAWER_WIDTH = 320;
const ANIMATION_MS = 240;

interface SideNavDrawerProps {
  open: boolean;
  onClose: () => void;
  theme: ThemeColors;
  language: SupportedLanguage;
  profile: ProfileDto | null;
  currentRoute: string;
  onNavigate: (route: string) => void;
  onLogout: () => void;
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const DashboardIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" />
  </svg>
);
const SecurityIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const TargetIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </svg>
);
const BookmarkIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);
const SmsIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const LogoutIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
const CloseIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const getInitials = (name?: string): string => {
  if (!name?.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const NAV_SECTIONS = [
  {
    label: 'MY ACCOUNT',
    items: [
      { route: '/profile/dashboard', icon: <DashboardIcon />, labelKey: 'profileDashboard' as const },
      { route: '/profile/password', icon: <SecurityIcon />, labelKey: 'profilePasswordSecurity' as const },
    ],
  },
  {
    label: 'SCHEMES',
    items: [
      { route: '/profile/schemes-for-me', icon: <TargetIcon />, labelKey: 'schemesForMe' as const },
      { route: '/saved-schemes', icon: <BookmarkIcon />, labelKey: 'savedSchemes' as const },
    ],
  },
  {
    label: 'HISTORY',
    items: [
      { route: '/sms-history', icon: <SmsIcon />, labelKey: 'smsHistory' as const },
    ],
  },
];

export const SideNavDrawer: React.FC<SideNavDrawerProps> = ({
  open, onClose, theme, language, profile, currentRoute, onNavigate, onLogout,
}) => {
  const [visible, setVisible] = useState(false);
  const [animIn, setAnimIn] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimIn(true)));
    } else {
      setAnimIn(false);
      const t = setTimeout(() => setVisible(false), ANIMATION_MS);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!visible) return null;

  const handleSelectRoute = (targetRoute: string) => {
    onNavigate(targetRoute);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9000, display: 'flex', justifyContent: 'flex-end' }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', opacity: animIn ? 1 : 0, transition: `opacity ${ANIMATION_MS}ms ease`, backdropFilter: 'blur(2px)' }}
      />

      {/* Drawer Panel */}
      <div
        style={{
          position: 'relative',
          width: `${DRAWER_WIDTH}px`,
          maxWidth: '88vw',
          height: '100vh',
          backgroundColor: theme.surface,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-12px 0 48px rgba(0,0,0,0.22)',
          transform: animIn ? 'translateX(0)' : `translateX(${DRAWER_WIDTH}px)`,
          transition: `transform ${ANIMATION_MS}ms cubic-bezier(0.4,0,0.2,1)`,
          overflowY: 'auto',
          borderLeft: `1px solid ${theme.border}`,
        }}
      >
        {/* ── Header ────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${theme.borderSubtle}` }}>
          <span style={{ fontFamily: FONT_SERIF, fontSize: '15px', fontWeight: '800', color: theme.textHeading }}>
            {getTranslation(language, 'avatarMenu')}
          </span>
          <button
            onClick={onClose}
            style={{ background: theme.surfaceSubtle, border: `1px solid ${theme.borderSubtle}`, cursor: 'pointer', color: theme.textMuted, padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = theme.border; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = theme.surfaceSubtle; }}
          >
            <CloseIcon />
          </button>
        </div>

        {/* ── Profile Card ──────────────────────────────────────────── */}
        {profile && (
          <div style={{ padding: '20px', background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`, borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '50%',
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryHover})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px', fontWeight: '900', color: theme.textInverse,
              fontFamily: FONT_SERIF, flexShrink: 0,
              boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
              border: `2px solid ${theme.surface}`,
            }}>
              {getInitials(profile.name)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: FONT_SERIF, fontSize: '15px', fontWeight: '800', color: theme.textHeading, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile.name || profile.username || 'Citizen'}
              </div>
              {profile.email && <div style={{ fontSize: '12px', color: theme.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>{profile.email}</div>}
              {profile.state && <div style={{ fontSize: '11px', color: theme.textSubtle, marginTop: '2px' }}>{profile.state}{profile.district ? `, ${profile.district}` : ''}</div>}
            </div>
          </div>
        )}

        {/* ── Nav Sections ─────────────────────────────────────────── */}
        <div style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>
          {NAV_SECTIONS.map(section => (
            <div key={section.label}>
              <div style={{ fontSize: '10.5px', fontWeight: '800', color: theme.textSubtle, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', paddingLeft: '10px' }}>
                {section.label}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {section.items.map(item => {
                  const isActive = currentRoute === item.route;
                  return (
                    <button
                      key={item.route}
                      onClick={() => handleSelectRoute(item.route)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        width: '100%', textAlign: 'left',
                        backgroundColor: isActive ? (theme.isDark ? 'rgba(82,183,136,0.15)' : 'rgba(113,131,85,0.1)') : 'transparent',
                        color: isActive ? theme.primary : theme.textHeading,
                        border: 'none',
                        borderRadius: '12px',
                        padding: '11px 12px',
                        fontSize: '14px',
                        fontWeight: isActive ? '800' : '600',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        borderLeft: isActive ? `3px solid ${theme.primary}` : '3px solid transparent',
                      }}
                      onMouseEnter={e => { if (!isActive) { e.currentTarget.style.backgroundColor = theme.surfaceSubtle; } }}
                      onMouseLeave={e => { if (!isActive) { e.currentTarget.style.backgroundColor = 'transparent'; } }}
                    >
                      <span style={{ color: isActive ? theme.primary : theme.textMuted, flexShrink: 0 }}>{item.icon}</span>
                      {getTranslation(language, item.labelKey)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ── Logout ───────────────────────────────────────────────── */}
        <div style={{ padding: '16px', borderTop: `1px solid ${theme.borderSubtle}` }}>
          <button
            onClick={() => { onClose(); onLogout(); }}
            style={{
              width: '100%', backgroundColor: '#fee2e2', color: '#b91c1c',
              border: '1.5px solid #fecaca', borderRadius: '12px',
              padding: '12px', fontSize: '14px', fontWeight: '800',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '8px', transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#fecaca'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fee2e2'; }}
          >
            <LogoutIcon />
            {getTranslation(language, 'logout')}
          </button>
        </div>
      </div>
    </div>
  );
};
