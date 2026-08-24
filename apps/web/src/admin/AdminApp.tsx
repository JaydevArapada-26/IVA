'use client';

import React, { useState } from 'react';
import { darkThemeColors, lightThemeColors, ThemeColors } from 'shared/constants/theme';
import { setAuthToken } from '../lib/api';
import { AdminLogin } from './views/AdminLogin';
import { AdminDashboard } from './views/AdminDashboard';
import { AdminSchemes } from './views/AdminSchemes';
import { AdminCanonicalImport } from './views/AdminCanonicalImport';
import { AdminUsers } from './views/AdminUsers';
import { AdminAlerts } from './views/AdminAlerts';
import { AdminLanguages } from './views/AdminLanguages';
import { AdminLogs } from './views/AdminLogs';
import { AdminSettings } from './views/AdminSettings';

// Clean SVG Icons for Nav & Header

const DashboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const SchemesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const FolderIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const UsersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const GlobeNavIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const ScrollIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const UserAdminIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

interface AdminIdentity {
  readonly displayName: string;
  readonly role: string;
}

export const AdminApp: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [admin, setAdmin] = useState<AdminIdentity | null>(null);
  const [route, setRoute] = useState<string>('/admin/dashboard');
  const [isDark, setIsDark] = useState<boolean>(false);

  const theme: ThemeColors = isDark ? darkThemeColors : lightThemeColors;

  const handleLogout = () => {
    setAuthToken(undefined);
    setAdmin(null);
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <AdminLogin
        theme={theme}
        onLogin={(identity) => {
          setAdmin(identity);
          setIsAuthenticated(true);
        }}
      />
    );
  }

  const navItems = [
    { route: '/admin/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { route: '/admin/schemes', label: 'Schemes', icon: <SchemesIcon /> },
    { route: '/admin/import', label: 'CSV Scheme Import', icon: <FolderIcon /> },
    { route: '/admin/users', label: 'Users', icon: <UsersIcon /> },
    { route: '/admin/alerts', label: 'SMS Logs', icon: <BellIcon /> },
    { route: '/admin/languages', label: 'Languages', icon: <GlobeNavIcon /> },
    { route: '/admin/logs', label: 'Audit Logs', icon: <ScrollIcon /> },
    { route: '/admin/settings', label: 'Settings', icon: <SettingsIcon /> },
  ];

  return (
    <div style={{ backgroundColor: theme.background, color: theme.textBody, minHeight: '100vh', display: 'flex', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Admin Sidebar Layout */}
      <aside
        style={{
          width: '260px',
          backgroundColor: theme.surface,
          borderRight: `1.5px solid ${theme.border}`,
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 16px',
          position: 'sticky',
          top: 0,
          height: '100vh',
          boxSizing: 'border-box',
        }}
      >
        {/* Brand Logo Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px', paddingLeft: '8px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <img src="/logo.png" alt="IVA" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '900', color: theme.textHeading }}>IVA Admin</div>
            <div style={{ fontSize: '11px', color: theme.primary, fontWeight: '700' }}>Control Room</div>
          </div>
        </div>

        {/* Navigation Item Links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
          {navItems.map((item) => {
            const isActive = route === item.route;
            return (
              <button
                key={item.route}
                onClick={() => setRoute(item.route)}
                style={{
                  backgroundColor: isActive ? theme.primary : 'transparent',
                  color: isActive ? '#ffffff' : theme.textHeading,
                  border: '1.5px solid transparent',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '14px',
                  fontWeight: isActive ? '800' : '600',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? '0 4px 12px rgba(0, 0, 0, 0.08)' : 'none',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', color: isActive ? '#ffffff' : theme.primary }}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Lock Admin Session Bottom Action */}
        <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: '16px' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              backgroundColor: isDark ? 'rgba(255, 107, 107, 0.1)' : '#fff0f0',
              color: theme.alertUrgent,
              border: `1px solid ${theme.alertUrgent}`,
              padding: '10px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <LockIcon />
            Lock Admin Session
          </button>
        </div>
      </aside>

      {/* Admin Content View Shell */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
        {/* Top Admin Header */}
        <header
          style={{
            backgroundColor: theme.surface,
            borderBottom: `1.5px solid ${theme.border}`,
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: '700', color: theme.textMuted }}>
            IVA Admin Panel — <span style={{ color: theme.primary, fontWeight: '800' }}>Scheme Management System</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => setIsDark(!isDark)}
              style={{
                backgroundColor: theme.surfaceSubtle,
                border: `1px solid ${theme.border}`,
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: theme.textHeading,
              }}
              title="Toggle Dark/Light Mode"
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>
            <div style={{ fontSize: '14px', fontWeight: '700', color: theme.textHeading, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <UserAdminIcon />
              Admin: <span style={{ color: theme.primary }}>{admin?.displayName || admin?.role || 'Signed In'}</span>
            </div>
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto' }}>
          {route === '/admin/dashboard' && <AdminDashboard theme={theme} onNavigate={setRoute} />}
          {route === '/admin/schemes' && <AdminSchemes theme={theme} />}
          {route === '/admin/import' && <AdminCanonicalImport theme={theme} />}
          {route === '/admin/users' && <AdminUsers theme={theme} />}
          {route === '/admin/alerts' && <AdminAlerts theme={theme} />}
          {route === '/admin/languages' && <AdminLanguages theme={theme} />}
          {route === '/admin/logs' && <AdminLogs theme={theme} />}
          {route === '/admin/settings' && <AdminSettings theme={theme} />}
        </main>
      </div>
    </div>
  );
};
