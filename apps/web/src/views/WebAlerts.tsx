import React, { useEffect, useState } from 'react';
import { ThemeColors } from 'shared/constants/theme';
import { SupportedLanguage } from 'shared/types';
import { getTranslation } from 'shared/i18n/translations';
import type { NotificationDto } from 'shared/contracts';
import { api } from '../lib/api';

interface WebAlertsProps {
  theme: ThemeColors;
  language: SupportedLanguage;
  onOpenScheme?: (schemeId: string) => void;
}

const BellIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const AlertTriangleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const InfoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

export const WebAlerts: React.FC<WebAlertsProps> = ({ theme, language, onOpenScheme }) => {
  const [alerts, setAlerts] = useState<readonly NotificationDto[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    api.profile
      .notifications()
      .then((data) => {
        if (!cancelled) {
          setAlerts(data);
          setStatus('ready');
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div style={{ padding: '16px 16px 80px', backgroundColor: theme.background, minHeight: '100%' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '800', color: theme.textHeading, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BellIcon /> {getTranslation(language, 'alertsTitle')}
        </h2>
        <p style={{ fontSize: '13px', color: theme.textMuted, margin: 0 }}>
          Deadline reminders and scheme updates from your account
        </p>
      </div>

      {status === 'loading' && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: theme.textMuted }}>Loading alerts…</div>
      )}

      {status === 'error' && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: theme.alertUrgent }}>
          Could not load alerts right now. Please try again shortly.
        </div>
      )}

      {status === 'ready' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {alerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: theme.textMuted }}>
              {getTranslation(language, 'noAlerts')}
            </div>
          ) : (
            alerts.map((alert) => {
              const isHigh = alert.notificationType === 'deadline_reminder';
              return (
                <div
                  key={alert.id}
                  onClick={() => alert.schemeId && onOpenScheme?.(alert.schemeId)}
                  style={{
                    backgroundColor: theme.surface,
                    borderRadius: '16px',
                    padding: '16px',
                    border: `1.5px solid ${isHigh ? theme.alertUrgent : theme.border}`,
                    cursor: alert.schemeId ? 'pointer' : 'default',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span
                      style={{
                        backgroundColor: isHigh ? '#fff1f2' : '#eff6ff',
                        color: isHigh ? '#e11d48' : '#2563eb',
                        padding: '3px 10px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: '800',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {isHigh ? <AlertTriangleIcon /> : <InfoIcon />}
                      {isHigh ? 'URGENT DEADLINE' : 'INFORMATION'}
                    </span>
                    <span style={{ fontSize: '11px', color: theme.textMuted }}>
                      {new Date(alert.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '16px', fontWeight: '800', color: theme.textHeading, margin: '0 0 6px 0' }}>
                    {alert.title}
                  </h4>
                  <p style={{ fontSize: '13px', color: theme.textMuted, margin: 0, lineHeight: '1.4' }}>
                    {alert.body}
                  </p>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
