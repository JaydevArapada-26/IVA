'use client';

import React, { useState } from 'react';
import { lightThemeColors, darkThemeColors, ThemeColors, SUPPORTED_LANGUAGES_LIST } from 'shared/constants/theme';
import { SupportedLanguage, UserProfile } from 'shared/types';
import type { ProfileDto } from 'shared/contracts/profile';
import { LandingPage } from './views/LandingPage';
import { AuthPages } from './views/AuthPages';
import { WebSchemes } from './views/WebSchemes';
import { WebAssistant } from './views/WebAssistant';
import { WebAlerts } from './views/WebAlerts';
import { ProfileDashboardView } from './views/ProfileDashboardView';
import { PasswordSecurityView } from './views/PasswordSecurityView';
import { SchemesForMeView } from './views/SchemesForMeView';
import { SavedSchemesView } from './views/SavedSchemesView';
import { SmsHistoryView } from './views/SmsHistoryView';
import { SideNavDrawer } from './views/SideNavDrawer';
import { AboutUsPage } from './views/AboutUsPage';
import { getTranslation } from 'shared/i18n/translations';
import { api, setAuthToken } from './lib/api';
import { supabase, isRememberMePreferred } from './lib/supabaseClient';
import { clearPendingSignup, readPendingSignup } from './lib/pendingSignup';
import { ApiError } from 'shared/api-client';
import { toLocalDigits } from './lib/phone';
import { clearRememberedAccount, readRememberedAccount } from './lib/rememberedAccount';
import { clearLoginTimestamp, isSessionExpired, markLoginTimestamp } from './lib/sessionTimeout';
import { EmailConfirmedPage } from './views/EmailConfirmedPage';
import { ResetPasswordPage } from './views/ResetPasswordPage';

// ─── Navbar Icons ─────────────────────────────────────────────────────────────
const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);
const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);
const MenuIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

export const WebApp: React.FC = () => {
  const [route, setRouteState] = useState<string>('/');

  const setRoute = (newRoute: string) => {
    setRouteState(newRoute);
    if (newRoute !== '/' && newRoute !== '/auth' && typeof window !== 'undefined') {
      localStorage.setItem('iva_active_route', newRoute);
    }
  };

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isDark, setIsDark] = useState<boolean>(false);
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [selectedSchemeId, setSelectedSchemeId] = useState<string>('');
  const [isSignedIn, setIsSignedIn] = useState<boolean>(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [savedSchemeIds, setSavedSchemeIds] = useState<Set<string>>(new Set());
  const [profileDto, setProfileDto] = useState<ProfileDto | null>(null);

  const [passwordRecoveryMode, setPasswordRecoveryMode] = useState(false);
  const [showEmailConfirmedAck, setShowEmailConfirmedAck] = useState(false);
  const [assistantFloatingOpen, setAssistantFloatingOpen] = useState(false);

  const [rememberedIdentifier, setRememberedIdentifier] = useState<string | null>(null);
  const [chooserDismissed, setChooserDismissed] = useState(false);

  React.useEffect(() => {
    if (isRememberMePreferred()) {
      setRememberedIdentifier(readRememberedAccount());
    }
    const saved = localStorage.getItem('iva_active_route');
    if (saved && (saved === '/schemes' || saved === '/about' || saved === '/assistant' || saved === '/alerts')) {
      setRouteState(saved);
    }
  }, []);

  const [profile, setProfile] = useState<UserProfile>({
    language: 'en',
    consentGiven: false,
    phoneVerified: false,
    onboardingCompleted: false,
  });

  React.useEffect(() => {
    let signedInThisSession = false;

    const { data: subscription } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecoveryMode(true);
        return;
      }

      if (event === 'USER_UPDATED' && session) {
        try {
          const result = await api.profile.syncIdentity({ supabaseAccessToken: session.access_token });
          setProfile((prev) => ({ ...prev, ...(result.email ? { email: result.email } : {}), phone: toLocalDigits(result.phoneNumber) }));
        } catch {
          // Best effort
        }
        return;
      }

      if (!session) return;
      if (event !== 'SIGNED_IN' && event !== 'INITIAL_SESSION' && event !== 'TOKEN_REFRESHED') return;
      if (signedInThisSession) return;

      if (isSessionExpired()) {
        clearLoginTimestamp();
        localStorage.removeItem('iva_active_route');
        await supabase.auth.signOut();
        return;
      }

      let pending = readPendingSignup();
      if (!pending && session.user?.user_metadata?.displayName && session.user?.user_metadata?.phoneNumber) {
        const meta = session.user.user_metadata;
        pending = {
          displayName: meta.displayName,
          username: meta.username || meta.displayName.toLowerCase().replace(/\s+/g, '_'),
          phoneNumber: meta.phoneNumber,
          email: session.user.email || meta.email || '',
          profile: meta.profile,
          rememberMe: meta.rememberMe ?? false,
        };
      }
      try {
        if (pending) {
          const result = await api.auth.signupComplete({ supabaseAccessToken: session.access_token, ...pending });
          clearPendingSignup();
          signedInThisSession = true;
          setAuthToken(result.token);
          markLoginTimestamp();
          setProfile((prev) => ({
            ...prev,
            name: pending.displayName,
            phone: toLocalDigits(pending.phoneNumber),
            email: pending.email,
            state: pending.profile?.state,
            district: pending.profile?.district,
            occupation: prev.occupation,
            disabilityStatus: pending.profile?.disabilityStatus,
            phoneVerified: true,
            onboardingCompleted: true,
          }));
          setIsSignedIn(true);
          const gotoRoute = typeof window !== 'undefined' ? sessionStorage.getItem('iva_goto_after_auth') : null;
          if (gotoRoute) {
            sessionStorage.removeItem('iva_goto_after_auth');
            setRoute(gotoRoute);
          } else {
            setShowEmailConfirmedAck(true);
          }
        } else {
          const result = await api.auth.sessionExchange({ supabaseAccessToken: session.access_token });
          signedInThisSession = true;
          setAuthToken(result.token);
          markLoginTimestamp();
          setIsSignedIn(true);
          const gotoRoute = typeof window !== 'undefined' ? sessionStorage.getItem('iva_goto_after_auth') : null;
          if (gotoRoute) {
            sessionStorage.removeItem('iva_goto_after_auth');
            setRoute(gotoRoute);
          } else {
            const savedRoute = typeof window !== 'undefined' ? localStorage.getItem('iva_active_route') : null;
            if (savedRoute && savedRoute !== '/' && savedRoute !== '/auth') {
              setRouteState(savedRoute);
            } else {
              setRoute('/');
            }
          }
        }
      } catch (error) {
        if (error instanceof ApiError && error.code === 'CONFLICT') {
          // The account already exists locally — almost always because /auth/callback (a
          // separate page/component tree) already finished signupComplete for this exact session
          // moments earlier, right before its window.location.href reload landed us back here
          // with `pending` reconstructed fresh from Supabase's user_metadata. That's not a real
          // conflict, it's the same signup being seen twice — fall back to an ordinary session
          // exchange so the citizen ends up signed in instead of looking logged out.
          clearPendingSignup();
          try {
            const result = await api.auth.sessionExchange({ supabaseAccessToken: session.access_token });
            signedInThisSession = true;
            setAuthToken(result.token);
            markLoginTimestamp();
            if (pending) {
              setProfile((prev) => ({
                ...prev,
                name: pending!.displayName,
                phone: toLocalDigits(pending!.phoneNumber),
                email: pending!.email,
                state: pending!.profile?.state,
                district: pending!.profile?.district,
                disabilityStatus: pending!.profile?.disabilityStatus,
                phoneVerified: true,
                onboardingCompleted: true,
              }));
            }
            setIsSignedIn(true);
            const gotoRoute = typeof window !== 'undefined' ? sessionStorage.getItem('iva_goto_after_auth') : null;
            if (gotoRoute) {
              sessionStorage.removeItem('iva_goto_after_auth');
              setRoute(gotoRoute);
            } else {
              setShowEmailConfirmedAck(true);
            }
          } catch (exErr) {
            console.error('[IVA] sessionExchange fallback after CONFLICT also failed:', exErr);
          }
        } else if (error instanceof ApiError && error.code === 'NOT_FOUND') {
          await supabase.auth.signOut();
        } else {
          console.error('[IVA] Could not complete signup/session-exchange:', event, error);
        }
      }
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  React.useEffect(() => {
    if (!isSignedIn) return;
    let cancelled = false;
    api.profile
      .get()
      .then((dto) => {
        if (cancelled) return;
        setProfileDto(dto);
        setLanguage(dto.languageCode);
        setProfile((prev) => ({
          ...prev,
          name: dto.name,
          phone: dto.phoneNumber ? toLocalDigits(dto.phoneNumber) : undefined,
          age: dto.age,
          gender: dto.gender,
          state: dto.state,
          district: dto.district,
          incomeRange: dto.incomeRange,
          occupation: dto.occupation,
          category: dto.category,
          disabilityStatus: dto.disabilityStatus,
          studentStatus: dto.studentStatus,
          farmerStatus: dto.farmerStatus,
          seniorCitizenStatus: dto.seniorCitizenStatus,
          language: dto.languageCode,
          consentGiven: dto.consentGiven,
          phoneVerified: dto.phoneVerified,
          onboardingCompleted: dto.onboardingCompleted,
          completeness: dto.completeness,
        }));
      })
      .catch(() => {});
    api.schemes.savedList()
      .then((saved) => { if (!cancelled) setSavedSchemeIds(new Set(saved.map((s) => s.schemeId))); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isSignedIn]);

  React.useEffect(() => {
    if (!isSignedIn) return;
    const interval = setInterval(() => {
      if (isSessionExpired()) {
        clearLoginTimestamp();
        localStorage.removeItem('iva_active_route');
        void supabase.auth.signOut().then(() => {
          setAuthToken(undefined);
          setIsSignedIn(false);
          setRoute('/');
        });
      }
    }, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isSignedIn]);

  const handleLogout = async () => {
    setDrawerOpen(false);
    await supabase.auth.signOut();
    clearRememberedAccount();
    clearLoginTimestamp();
    localStorage.removeItem('iva_active_route');
    setAuthToken(undefined);
    setIsSignedIn(false);
    setProfileDto(null);
    setSavedSchemeIds(new Set());
    setProfile({ language: 'en', consentGiven: false, phoneVerified: false, onboardingCompleted: false });
    setRoute('/');
  };

  const handleToggleSave = async (schemeId: string, currentlySaved: boolean) => {
    if (currentlySaved) {
      await api.schemes.unsave(schemeId);
      setSavedSchemeIds((prev) => { const next = new Set(prev); next.delete(schemeId); return next; });
    } else {
      await api.schemes.save(schemeId);
      setSavedSchemeIds((prev) => new Set([...prev, schemeId]));
    }
  };

  const theme: ThemeColors = isDark ? darkThemeColors : lightThemeColors;

  if (passwordRecoveryMode) {
    return <ResetPasswordPage theme={theme} onDone={() => { setPasswordRecoveryMode(false); setRoute('/auth'); setAuthMode('login'); }} />;
  }
  if (showEmailConfirmedAck) {
    return <EmailConfirmedPage theme={theme} onContinue={() => { setShowEmailConfirmedAck(false); setRoute('/profile/schemes-for-me'); }} />;
  }
  if (rememberedIdentifier && !chooserDismissed) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: theme.background, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ backgroundColor: theme.surface, borderRadius: '28px', padding: '44px 40px', maxWidth: '420px', width: '100%', textAlign: 'center', border: `1.5px solid ${theme.border}`, boxShadow: '0 12px 40px rgba(0,0,0,0.1)' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: theme.surfaceSubtle, color: theme.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', fontSize: '22px', fontWeight: 900 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '900', color: theme.textHeading, margin: '0 0 6px 0' }}>Welcome back</h2>
          <p style={{ fontSize: '14px', color: theme.textMuted, margin: '0 0 24px 0' }}>{rememberedIdentifier}</p>
          <button
            onClick={() => { setChooserDismissed(true); setRoute('/profile/schemes-for-me'); }}
            style={{ width: '100%', backgroundColor: theme.primary, color: '#ffffff', border: 'none', padding: '14px', borderRadius: '14px', fontSize: '15px', fontWeight: '800', cursor: 'pointer', marginBottom: '10px' }}
          >
            Login
          </button>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              clearRememberedAccount();
              setChooserDismissed(true);
              setAuthMode('login');
              setRoute('/auth');
            }}
            style={{ width: '100%', backgroundColor: 'transparent', color: theme.textMuted, border: 'none', padding: '8px', fontSize: '13.5px', fontWeight: '700', cursor: 'pointer' }}
          >
            Use a different account
          </button>
        </div>
      </div>
    );
  }

  const getInitials = (name?: string) => {
    if (!name?.trim()) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div style={{ backgroundColor: theme.background, minHeight: '100vh', color: theme.textBody, fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* ── Premium Top Navbar ─────────────────────────────────────── */}
      <nav
        className="top-navbar"
        style={{
          backgroundColor: theme.isDark ? 'rgba(13,43,30,0.92)' : 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: `1px solid ${theme.borderSubtle}`,
          padding: '0 40px',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 200,
          boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
        }}
      >
        {/* Brand */}
        <button
          onClick={() => setRoute('/')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
        >
          <div style={{ width: '32px', height: '32px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
            <img src="/logo.png" alt="IVA" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1 }}>
            <span style={{ fontFamily: "'Outfit', 'Noto Serif', Georgia, serif", fontSize: '18px', fontWeight: '900', color: theme.textHeading, letterSpacing: '-0.5px' }}>IVA</span>
            <span style={{ fontSize: '10px', fontWeight: '700', color: theme.textSubtle, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Citizen Portal</span>
          </div>
        </button>

        {/* Nav Links */}
        <div className="nav-links-container" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {[
            { id: '/', label: getTranslation(language, 'navHome') },
            { id: '/schemes', label: getTranslation(language, 'navAllSchemes') },
            { id: '/about', label: 'About' },
          ].map((item) => {
            const isActive = route === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setRoute(item.id)}
                style={{
                  background: isActive ? (theme.isDark ? 'rgba(82,183,136,0.12)' : 'rgba(113,131,85,0.08)') : 'none',
                  border: 'none',
                  color: isActive ? theme.primary : theme.textMuted,
                  fontSize: '13.5px',
                  fontWeight: isActive ? '800' : '600',
                  cursor: 'pointer',
                  padding: '6px 14px',
                  borderRadius: '10px',
                  transition: 'all 0.15s ease',
                  letterSpacing: isActive ? '-0.01em' : '0',
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.backgroundColor = theme.isDark ? 'rgba(82,183,136,0.06)' : 'rgba(113,131,85,0.05)'; e.currentTarget.style.color = theme.textHeading; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = theme.textMuted; } }}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Right Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
            style={{ backgroundColor: theme.surfaceSubtle, color: theme.textMuted, border: `1px solid ${theme.borderSubtle}`, borderRadius: '8px', padding: '5px 8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', outline: 'none' }}
          >
            {SUPPORTED_LANGUAGES_LIST.map((l) => <option key={l.code} value={l.code}>{l.nativeName}</option>)}
          </select>

          {/* Theme Toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            style={{ backgroundColor: theme.surfaceSubtle, border: `1px solid ${theme.borderSubtle}`, borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.textMuted, transition: 'all 0.15s ease' }}
            title="Toggle theme"
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = theme.surface; e.currentTarget.style.color = theme.primary; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = theme.surfaceSubtle; e.currentTarget.style.color = theme.textMuted; }}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* Avatar / Login */}
          {isSignedIn ? (
            <button
              id="avatar-menu-btn"
              onClick={() => setDrawerOpen(true)}
              title={getTranslation(language, 'avatarMenu')}
              style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryHover} 100%)`,
                color: theme.textInverse, border: `2px solid ${theme.border}`,
                fontSize: '13px', fontWeight: '900',
                fontFamily: "'Noto Serif', Georgia, serif",
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                transition: 'box-shadow 0.15s, transform 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.07)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.25)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.18)'; }}
            >
              {getInitials(profile.name)}
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => { setAuthMode('login'); setRoute('/auth'); }}
                style={{ backgroundColor: theme.surfaceSubtle, color: theme.primary, border: `1.5px solid ${theme.border}`, padding: '7px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}
              >
                Login
              </button>
              <button
                onClick={() => { setAuthMode('register'); setRoute('/auth'); }}
                style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryHover})`, color: theme.textInverse, border: 'none', padding: '7px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 2px 8px rgba(113,131,85,0.3)' }}
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* ── Main Body Page Views ─────────────────────────────────── */}
      <div style={{ animation: 'fadeUp 0.3s ease both' }}>
        {route === '/' && (
          <LandingPage
            theme={theme} language={language}
            onNavigate={(target) => {
              if (target === '/signup' || target === '/login' || target === '/wizard' || target === '/schemes') {
                if (isSignedIn) { setRoute('/profile/schemes-for-me'); }
                else { setAuthMode('login'); setRoute('/auth'); }
              } else { setRoute(target); }
            }}
          />
        )}
        {route === '/auth' && (
          <AuthPages
            theme={theme} language={language} initialMode={authMode}
            onAuthenticated={(p) => {
              setProfile((prev) => ({ ...prev, ...p }));
              setIsSignedIn(true);
              setRoute('/profile/schemes-for-me'); // Route directly to Schemes for Me
            }}
          />
        )}
        {/* Legacy /dashboard redirect */}
        {route === '/dashboard' && (
          <SchemesForMeView
            theme={theme}
            language={language}
            savedSchemeIds={savedSchemeIds}
            onToggleSave={handleToggleSave}
            onOpenScheme={(slug) => { setSelectedSchemeId(slug); setRoute('/schemes'); }}
          />
        )}
        {/* Dedicated Pages for Side Nav */}
        {route === '/profile/dashboard' && (
          profileDto ? (
            <ProfileDashboardView
              theme={theme}
              language={language}
              initialProfile={profileDto}
              onProfileSaved={(patch) => {
                setProfileDto((prev) => prev ? { ...prev, ...patch } : prev);
                setProfile((prev) => ({ ...prev, name: patch.name ?? prev.name }));
              }}
            />
          ) : (
            <div style={{ maxWidth: '900px', margin: '60px auto', textAlign: 'center', color: theme.textMuted }}>Loading profile…</div>
          )
        )}
        {route === '/profile/password' && (
          <PasswordSecurityView
            theme={theme}
            language={language}
            userEmail={profileDto?.email ?? profile.email ?? ''}
          />
        )}
        {route === '/profile/schemes-for-me' && (
          <SchemesForMeView
            theme={theme}
            language={language}
            savedSchemeIds={savedSchemeIds}
            onToggleSave={handleToggleSave}
            onOpenScheme={(slug) => { setSelectedSchemeId(slug); setRoute('/schemes'); }}
          />
        )}
        {route === '/saved-schemes' && (
          <SavedSchemesView
            theme={theme}
            language={language}
            onOpenScheme={(slug) => { setSelectedSchemeId(slug); setRoute('/schemes'); }}
            onUnsaved={(schemeId) => setSavedSchemeIds((prev) => { const next = new Set(prev); next.delete(schemeId); return next; })}
          />
        )}
        {route === '/sms-history' && (
          <SmsHistoryView
            theme={theme}
            language={language}
          />
        )}
        {route === '/schemes' && (
          <WebSchemes
            theme={theme} language={language}
            selectedSchemeId={selectedSchemeId}
            onSelectScheme={setSelectedSchemeId}
            savedSchemeIds={savedSchemeIds}
            onToggleSave={handleToggleSave}
          />
        )}
        {route === '/alerts' && (
          <div style={{ maxWidth: '700px', margin: '32px auto' }}>
            <WebAlerts theme={theme} language={language} onOpenScheme={(id) => { setSelectedSchemeId(id); setRoute('/schemes'); }} />
          </div>
        )}
        {route === '/assistant' && (
          <div style={{ maxWidth: '760px', margin: '0 auto', height: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column' }}>
            <WebAssistant theme={theme} language={language} />
          </div>
        )}
        {route === '/about' && (
          <AboutUsPage theme={theme} language={language} onNavigate={setRoute} />
        )}
      </div>

      {/* ── Floating Assistant Launcher & Popup ───────────────────── */}
      {route !== '/assistant' && (
        <>
          {/* Floating Bubble Button */}
          <button
            onClick={() => setAssistantFloatingOpen(!assistantFloatingOpen)}
            title="Ask IVA Assistant"
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              zIndex: 8000,
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryHover})`,
              color: theme.textInverse,
              border: `2px solid ${theme.border}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 24px rgba(0,0,0,0.22)',
              transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.22)'; }}
          >
            {assistantFloatingOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            )}
          </button>

          {/* Floating Assistant Drawer Popup */}
          {assistantFloatingOpen && (
            <div
              className="floating-assistant-popup"
              style={{
                position: 'fixed',
                bottom: '92px',
                right: '24px',
                zIndex: 8000,
                width: '420px',
                maxWidth: 'calc(100vw - 32px)',
                height: '580px',
                maxHeight: 'calc(100vh - 120px)',
                backgroundColor: theme.surface,
                borderRadius: '24px',
                border: `1.5px solid ${theme.border}`,
                boxShadow: '0 16px 48px rgba(0,0,0,0.25)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                animation: 'scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) both',
              }}
            >
              <WebAssistant theme={theme} language={language} />
            </div>
          )}
        </>
      )}

      {/* Side Navigation Drawer */}
      {isSignedIn && (
        <SideNavDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          theme={theme}
          language={language}
          profile={profileDto}
          currentRoute={route}
          onNavigate={(targetRoute) => setRoute(targetRoute)}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
};
