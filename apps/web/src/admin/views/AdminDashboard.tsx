import React, { useEffect, useState } from 'react';
import { ThemeColors } from 'shared/constants/theme';
import type { AdminStatsDto } from 'shared/contracts';
import { api } from '../../lib/api';

interface AdminDashboardProps {
  theme: ThemeColors;
  onNavigate: (route: string) => void;
}

const LayoutDashboardIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const FileTextIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const IngestionIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="8 17 12 21 16 17" />
    <line x1="12" y1="12" x2="12" y2="21" />
    <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29" />
  </svg>
);

const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const GlobeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const LinkIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const ScrollIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ theme, onNavigate }) => {
  const [stats, setStats] = useState<AdminStatsDto | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    const loadStats = () => {
      api.admin
        .stats()
        .then((data) => {
          if (!cancelled) {
            setStats(data);
            setStatus('ready');
          }
        })
        .catch(() => {
          if (!cancelled) setStatus((prev) => (prev === 'ready' ? prev : 'error'));
        });
    };

    loadStats();
    // Real-time telemetry: reflect live table data without requiring a manual refresh.
    const interval = setInterval(loadStats, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const statTiles = stats
    ? [
        { label: 'Total Schemes', value: stats.totalSchemes.toLocaleString(), color: '#6366f1' },
        { label: 'Active Citizens', value: stats.activeUsers.toLocaleString(), color: '#10b981' },
        { label: 'Total Citizens', value: stats.totalUsers.toLocaleString(), color: '#6366f1' },
        { label: 'SMS Sent', value: stats.smsSent.toLocaleString(), color: '#10b981' },
        { label: 'SMS Queued', value: stats.smsQueued.toLocaleString(), color: theme.alertWarning },
        { label: 'Languages Configured', value: stats.languagesConfigured.toLocaleString(), color: theme.primary },
      ]
    : [];

  const modules = [
    { title: 'Schemes Management', desc: 'Add, update, or remove scheme descriptions and deadlines', route: '/admin/schemes', icon: <FileTextIcon /> },
    { title: 'Citizen User Support', desc: 'Monitor citizen engagement and helpline support tickets', route: '/admin/users', icon: <UsersIcon /> },
    { title: 'Alert & SMS Logs', desc: 'Track automated and admin-triggered SMS notification delivery', route: '/admin/alerts', icon: <BellIcon /> },
    { title: 'Language Management', desc: 'Add or remove UI languages available to citizens', route: '/admin/languages', icon: <GlobeIcon /> },
    { title: 'System Audit Logs', desc: 'Track administrative access and security logs', route: '/admin/logs', icon: <ScrollIcon /> },
    { title: 'Admin Settings', desc: 'Configure system feature flags and API throttles', route: '/admin/settings', icon: <SettingsIcon /> },
  ];

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1300px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '900', color: theme.textHeading, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <LayoutDashboardIcon /> Control-Room Dashboard Overview
        </h2>
        <p style={{ fontSize: '14px', color: theme.textMuted, margin: 0 }}>
          Real-time metrics, scheme ingestion queues, and citizen support telemetry
        </p>
      </div>

      {/* Quick Telemetry KPI Grid */}
      {status === 'loading' && <div style={{ color: theme.textMuted, padding: '16px' }}>Loading dashboard metrics…</div>}
      {status === 'error' && <div style={{ color: theme.alertUrgent, padding: '16px' }}>Could not load dashboard metrics right now.</div>}

      {status === 'ready' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {statTiles.map((st) => (
            <div
              key={st.label}
              style={{
                backgroundColor: theme.surface,
                borderRadius: '20px',
                padding: '20px',
                border: `1.5px solid ${theme.border}`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ fontSize: '13px', color: theme.textMuted, fontWeight: '700', marginBottom: '8px' }}>
                {st.label}
              </div>
              <div style={{ fontSize: '32px', fontWeight: '900', color: st.color }}>
                {st.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Control Modules Grid */}
      <h3 style={{ fontSize: '20px', fontWeight: '800', color: theme.textHeading, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <SettingsIcon /> Management Control Modules
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {modules.map((mod) => (
          <div
            key={mod.route}
            onClick={() => onNavigate(mod.route)}
            style={{
              backgroundColor: theme.surface,
              borderRadius: '20px',
              padding: '20px',
              border: `1.5px solid ${theme.border}`,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.15s ease',
            }}
          >
            <div>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: theme.surfaceSubtle, color: theme.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                {mod.icon}
              </div>
              <h4 style={{ fontSize: '17px', fontWeight: '800', color: theme.textHeading, margin: '0 0 6px 0' }}>
                {mod.title}
              </h4>
              <p style={{ fontSize: '13px', color: theme.textMuted, margin: 0, lineHeight: '1.4' }}>
                {mod.desc}
              </p>
            </div>

            <div style={{ marginTop: '16px', fontSize: '13px', fontWeight: '800', color: theme.primary, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              Open Module <ArrowRightIcon />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
