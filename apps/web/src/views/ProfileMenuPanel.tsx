import React, { useEffect, useRef, useState } from 'react';
import type { ThemeColors } from 'shared/constants/theme';
import type { SupportedLanguage } from 'shared/types';
import type { ProfileDto } from 'shared/contracts/profile';
import { getTranslation } from 'shared/i18n/translations';
import { ProfileDashboardView } from './ProfileDashboardView';
import { PasswordSecurityView } from './PasswordSecurityView';
import { SchemesForMeView } from './SchemesForMeView';
import { SavedSchemesView } from './SavedSchemesView';
import { SmsHistoryView } from './SmsHistoryView';

const SERIF = '"Noto Serif", Georgia, serif';
const PANEL_WIDTH = 400;
const ANIMATION_MS = 260;

type PanelSection = 'menu' | 'dashboard' | 'password' | 'schemesForMe' | 'savedSchemes' | 'smsHistory';

interface ProfileMenuPanelProps {
  open: boolean;
  onClose: () => void;
  theme: ThemeColors;
  language: SupportedLanguage;
  profile: ProfileDto;
  savedSchemeIds: Set<string>;
  onToggleSave: (schemeId: string, currentlySaved: boolean) => Promise<void>;
  onNavigateToScheme?: (slug: string) => void;
  onLogout: () => void;
  onProfileSaved: (patch: Partial<ProfileDto>) => void;
  onUnsaved?: (schemeId: string) => void;
}

const menuItems = [
  { id: 'dashboard' as PanelSection, icon: '⊞', labelKey: 'profileDashboard' as const },
  { id: 'password' as PanelSection, icon: '🔐', labelKey: 'profilePasswordSecurity' as const },
  { id: 'schemesForMe' as PanelSection, icon: '🎯', labelKey: 'schemesForMe' as const },
  { id: 'savedSchemes' as PanelSection, icon: '🔖', labelKey: 'savedSchemes' as const },
  { id: 'smsHistory' as PanelSection, icon: '💬', labelKey: 'smsHistory' as const },
];

const BackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const CloseIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ChevronIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

/** Derives initials from a display name for the avatar. */
const getInitials = (name?: string): string => {
  if (!name?.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const ProfileMenuPanel: React.FC<ProfileMenuPanelProps> = ({
  open, onClose, theme, language, profile, savedSchemeIds,
  onToggleSave, onNavigateToScheme, onLogout, onProfileSaved, onUnsaved,
}) => {
  const [section, setSection] = useState<PanelSection>('menu');
  const [visible, setVisible] = useState(false);
  const [animIn, setAnimIn] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Mount / unmount animation
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

  // Reset to menu whenever panel opens
  useEffect(() => {
    if (open) { setSection('menu'); scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); }
  }, [open]);

  // Scroll to top on section change
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [section]);

  if (!visible) return null;

  const panelBg = theme.surface;
  const overlayBg = 'rgba(0,0,0,0.45)';

  const handleNavigate = (slug: string) => {
    onClose();
    onNavigateToScheme?.(slug);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9000, display: 'flex', justifyContent: 'flex-end' }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          backgroundColor: overlayBg,
          opacity: animIn ? 1 : 0,
          transition: `opacity ${ANIMATION_MS}ms ease`,
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'relative',
          width: `${PANEL_WIDTH}px`,
          maxWidth: '100vw',
          height: '100vh',
          backgroundColor: panelBg,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.25)',
          transform: animIn ? 'translateX(0)' : `translateX(${PANEL_WIDTH}px)`,
          transition: `transform ${ANIMATION_MS}ms cubic-bezier(0.4,0,0.2,1)`,
          borderRadius: '20px 0 0 20px',
          overflow: 'hidden',
        }}
      >
        {/* Top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 18px', borderBottom: `1px solid ${theme.border}`, flexShrink: 0,
        }}>
          {section !== 'menu' ? (
            <button onClick={() => setSection('menu')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: '600', padding: '4px 0' }}>
              <BackIcon /> Back
            </button>
          ) : (
            <span style={{ fontFamily: SERIF, fontSize: '16px', fontWeight: '700', color: theme.textHeading }}>
              {getTranslation(language, 'avatarMenu')}
            </span>
          )}
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, padding: '4px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CloseIcon />
          </button>
        </div>

        {/* Scrollable body */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 18px' }}>

          {/* ─── MENU ─── */}
          {section === 'menu' && (
            <div>
              {/* Profile card */}
              <div style={{
                backgroundColor: theme.surfaceSubtle,
                border: `1px solid ${theme.border}`,
                borderRadius: '18px',
                padding: '20px',
                marginBottom: '20px',
                display: 'flex', alignItems: 'center', gap: '16px',
              }}>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '50%',
                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryHover ?? theme.primary})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '20px', fontWeight: '900', color: '#fff',
                  fontFamily: SERIF, flexShrink: 0, letterSpacing: '0.02em',
                }}>
                  {getInitials(profile.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: SERIF, fontSize: '16px', fontWeight: '700', color: theme.textHeading, marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {profile.name ?? profile.username ?? 'Citizen'}
                  </div>
                  {profile.email && (
                    <div style={{ fontSize: '12.5px', color: theme.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.email}</div>
                  )}
                  {profile.phoneNumber && (
                    <div style={{ fontSize: '12px', color: theme.textMuted }}>{profile.phoneNumber}</div>
                  )}
                </div>
              </div>

              {/* Nav items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ fontSize: '10.5px', fontWeight: '800', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px', paddingLeft: '2px' }}>
                  {getTranslation(language, 'profileMenu')}
                </div>
                {menuItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setSection(item.id)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      width: '100%', textAlign: 'left', backgroundColor: theme.surfaceSubtle,
                      color: theme.textHeading, border: `1px solid ${theme.border}`,
                      borderRadius: '14px', padding: '13px 16px', cursor: 'pointer',
                      fontSize: '14px', fontWeight: '600', transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = theme.border)}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = theme.surfaceSubtle)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '18px', lineHeight: 1 }}>{item.icon}</span>
                      {getTranslation(language, item.labelKey)}
                    </div>
                    <ChevronIcon />
                  </button>
                ))}
              </div>

              {/* Logout */}
              <button
                onClick={onLogout}
                style={{
                  width: '100%', marginTop: '20px',
                  backgroundColor: '#dc2626', color: '#fff', border: 'none',
                  borderRadius: '14px', padding: '14px', fontSize: '14px', fontWeight: '800',
                  cursor: 'pointer', letterSpacing: '0.02em', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '8px',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                {getTranslation(language, 'logout')}
              </button>
            </div>
          )}

          {/* ─── DASHBOARD ─── */}
          {section === 'dashboard' && (
            <ProfileDashboardView
              theme={theme}
              language={language}
              initialProfile={profile}
              onProfileSaved={onProfileSaved}
            />
          )}

          {/* ─── PASSWORD & SECURITY ─── */}
          {section === 'password' && (
            <PasswordSecurityView
              theme={theme}
              language={language}
              userEmail={profile.email ?? ''}
            />
          )}

          {/* ─── SCHEMES FOR ME ─── */}
          {section === 'schemesForMe' && (
            <SchemesForMeView
              theme={theme}
              language={language}
              savedSchemeIds={savedSchemeIds}
              onToggleSave={onToggleSave}
              onOpenScheme={handleNavigate}
            />
          )}

          {/* ─── SAVED SCHEMES ─── */}
          {section === 'savedSchemes' && (
            <SavedSchemesView
              theme={theme}
              language={language}
              onOpenScheme={handleNavigate}
              onUnsaved={onUnsaved}
            />
          )}

          {/* ─── SMS HISTORY ─── */}
          {section === 'smsHistory' && (
            <SmsHistoryView
              theme={theme}
              language={language}
            />
          )}
        </div>
      </div>
    </div>
  );
};
