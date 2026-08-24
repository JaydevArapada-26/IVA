import React, { useEffect, useState } from 'react';
import type { ThemeColors } from 'shared/constants/theme';
import type { SupportedLanguage } from 'shared/types';
import type { SmsHistoryDto } from 'shared/contracts/profile';
import { getTranslation } from 'shared/i18n/translations';
import { api } from '../lib/api';
import { FONT_SERIF, ANIM } from '../design/tokens';

interface SmsHistoryViewProps {
  theme: ThemeColors;
  language: SupportedLanguage;
}

const SmsHeaderIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const EmptySmsIllustration = () => (
  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const ChevronDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  sent:      { color: '#15803d', bg: '#dcfce7', label: 'Sent' },
  delivered: { color: '#15803d', bg: '#dcfce7', label: 'Delivered' },
  failed:    { color: '#b91c1c', bg: '#fee2e2', label: 'Failed' },
  queued:    { color: '#92400e', bg: '#fef3c7', label: 'Queued' },
  sending:   { color: '#1d4ed8', bg: '#dbeafe', label: 'Sending' },
  cancelled: { color: '#6b7280', bg: '#f3f4f6', label: 'Cancelled' },
};

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return '—'; }
};

export const SmsHistoryView: React.FC<SmsHistoryViewProps> = ({ theme, language }) => {
  const [records, setRecords] = useState<readonly SmsHistoryDto[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'empty'>('loading');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    api.profile.smsHistory()
      .then(data => { setRecords(data); setStatus(data.length === 0 ? 'empty' : 'ready'); })
      .catch(() => setStatus('error'));
  }, []);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px', animation: ANIM.fadeUp }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <div style={{ color: theme.primary, backgroundColor: theme.surfaceSubtle, border: `1.5px solid ${theme.border}`, borderRadius: '14px', padding: '10px', display: 'flex' }}>
          <SmsHeaderIcon />
        </div>
        <div>
          <h2 style={{ fontFamily: FONT_SERIF, fontSize: '28px', fontWeight: '900', color: theme.textHeading, margin: 0, lineHeight: 1 }}>
            {getTranslation(language, 'smsHistory')}
          </h2>
          <p style={{ fontSize: '14px', color: theme.textSubtle, margin: '4px 0 0', fontWeight: '500' }}>IVA scheme recommendation messages</p>
        </div>
      </div>

      {/* Loading */}
      {status === 'loading' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ height: '80px', borderRadius: '16px', backgroundImage: `linear-gradient(90deg, ${theme.surfaceSubtle} 25%, ${theme.border} 50%, ${theme.surfaceSubtle} 75%)`, backgroundSize: '200% 100%', animation: 'shimmer 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: theme.alertUrgent, fontSize: '14px', fontWeight: 600 }}>
          Could not load SMS history. Please try again.
        </div>
      )}

      {/* Empty */}
      {status === 'empty' && (
        <div style={{ textAlign: 'center', padding: '72px 20px', backgroundColor: theme.surface, borderRadius: '28px', border: `1.5px solid ${theme.borderSubtle}`, animation: ANIM.scaleIn }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}><EmptySmsIllustration /></div>
          <h3 style={{ fontFamily: FONT_SERIF, fontSize: '20px', fontWeight: '800', color: theme.textHeading, margin: '0 0 10px' }}>
            {getTranslation(language, 'noSmsHistory')}
          </h3>
          <p style={{ fontSize: '14.5px', color: theme.textMuted, maxWidth: '360px', margin: '0 auto', lineHeight: '1.65' }}>
            When IVA sends you scheme recommendations via SMS, they will appear here as a timeline.
          </p>
        </div>
      )}

      {/* Timeline */}
      {status === 'ready' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {records.map((record, index) => {
            const isExpanded = expanded === record.id;
            const cfg = STATUS_CONFIG[record.status] ?? { color: '#6b7280', bg: '#f3f4f6', label: record.status };
            return (
              <div
                key={record.id}
                style={{
                  backgroundColor: theme.surface,
                  borderRadius: '18px',
                  border: `1.5px solid ${isExpanded ? theme.primary : theme.border}`,
                  overflow: 'hidden',
                  transition: 'all 0.18s ease',
                  boxShadow: isExpanded ? '0 4px 18px rgba(0,0,0,0.08)' : '0 1px 4px rgba(0,0,0,0.03)',
                  animation: `fadeUp 0.3s ${index * 0.04}s ease both`,
                }}
              >
                <div
                  style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px' }}
                  onClick={() => setExpanded(isExpanded ? null : record.id)}
                >
                  <div style={{ display: 'flex', gap: '14px', flex: 1, minWidth: 0 }}>
                    {/* Status dot */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '3px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: cfg.color, flexShrink: 0, boxShadow: `0 0 0 3px ${cfg.bg}` }} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', flexWrap: 'wrap' }}>
                        <span style={{ backgroundColor: cfg.bg, color: cfg.color, padding: '2px 9px', borderRadius: '100px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          {cfg.label}
                        </span>
                        <span style={{ fontSize: '12px', color: theme.textSubtle }}>{formatDate(record.sentAt ?? record.createdAt)}</span>
                      </div>
                      {record.schemeTitle && (
                        <div style={{ fontFamily: FONT_SERIF, fontSize: '15px', fontWeight: '700', color: theme.textHeading, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {record.schemeTitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <span style={{ color: theme.textSubtle, transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'none', flexShrink: 0, marginTop: '4px' }}>
                    <ChevronDownIcon />
                  </span>
                </div>

                {isExpanded && (
                  <div style={{ padding: '0 20px 20px 44px', borderTop: `1px solid ${theme.borderSubtle}` }}>
                    <div style={{ paddingTop: '14px', fontSize: '14px', color: theme.textBody, lineHeight: '1.7', fontFamily: 'inherit', whiteSpace: 'pre-wrap', backgroundColor: theme.surfaceSubtle, borderRadius: '12px', padding: '14px 16px', border: `1px solid ${theme.borderSubtle}`, marginTop: '14px' }}>
                      {record.messageBody}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div style={{ textAlign: 'center', marginTop: '8px' }}>
            <span style={{ fontSize: '12.5px', color: theme.textSubtle, backgroundColor: theme.surfaceSubtle, padding: '5px 16px', borderRadius: '100px', fontWeight: '600' }}>
              {records.length} message{records.length !== 1 ? 's' : ''} · IVA recommendation SMS only
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
