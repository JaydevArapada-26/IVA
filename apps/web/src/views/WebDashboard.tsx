import React, { useEffect, useState } from 'react';
import { ThemeColors } from 'shared/constants/theme';
import { SupportedLanguage, UserProfile } from 'shared/types';
import { getTranslation } from 'shared/i18n/translations';
import type { SchemeRecommendationDto } from 'shared/contracts';
import { api } from '../lib/api';

const SERIF = '"Noto Serif", Georgia, serif';

interface WebDashboardProps {
  theme: ThemeColors;
  language: SupportedLanguage;
  profile: UserProfile;
  savedSchemeIds: Set<string>;
  onToggleSave: (schemeId: string, currentlySaved: boolean) => Promise<void>;
  onNavigate: (route: string) => void;
  onSelectScheme: (schemeId: string) => void;
}

// SVG Icons
const MicIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const StarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const BookmarkOutline = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

const BookmarkFilled = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

export const WebDashboard: React.FC<WebDashboardProps> = ({
  theme,
  language,
  profile,
  savedSchemeIds,
  onToggleSave,
  onNavigate,
  onSelectScheme,
}) => {
  const [recommended, setRecommended] = useState<readonly SchemeRecommendationDto[]>([]);
  const [recommendedStatus, setRecommendedStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadingSchemeId, setLoadingSchemeId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.schemes
      .recommended()
      .then((result) => {
        if (!cancelled) {
          setRecommended(result.data);
          setRecommendedStatus('ready');
        }
      })
      .catch(() => {
        if (!cancelled) setRecommendedStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleToggleSave = async (schemeId: string, currentlySaved: boolean) => {
    setLoadingSchemeId(schemeId);
    try {
      await onToggleSave(schemeId, currentlySaved);
    } finally {
      setLoadingSchemeId(null);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Top Banner */}
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontFamily: SERIF, fontSize: '32px', fontWeight: '900', color: theme.textHeading, marginBottom: '6px' }}>
          Welcome back, {profile.name || 'Citizen'}!
        </h2>
        <p style={{ fontSize: '16px', color: theme.textMuted, margin: 0 }}>
          {profile.state
            ? `Here are your recommended schemes based on your profile in ${profile.state}.`
            : 'Complete your profile to get personalized scheme recommendations.'}
        </p>
      </div>

      {/* Profile Completeness Notice */}
      {profile.completeness && !profile.completeness.isComplete && (
        <div
          onClick={() => {
            const btn = document.getElementById('avatar-menu-btn');
            if (btn) btn.click();
          }}
          style={{
            backgroundColor: '#fffbeb',
            border: '1.5px solid #fde68a',
            borderRadius: '18px',
            padding: '16px 20px',
            marginBottom: '24px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#92400e' }}>Your profile is incomplete</div>
            <div style={{ fontSize: '12.5px', color: '#92400e', marginTop: '2px' }}>
              Missing: {profile.completeness.missingFields.slice(0, 4).join(', ')}
              {profile.completeness.missingFields.length > 4 ? `, +${profile.completeness.missingFields.length - 4} more` : ''} — complete it in your profile menu.
            </div>
          </div>
          <span style={{ fontSize: '13px', fontWeight: '800', color: '#92400e', whiteSpace: 'nowrap' }}>Complete Profile →</span>
        </div>
      )}

      {/* Main Single Column Area */}
      <div>
        {/* AI Voice Assistant Quick Card */}
        <div
          onClick={() => onNavigate('/assistant')}
          style={{
            backgroundColor: theme.primary,
            color: theme.textInverse,
            borderRadius: '24px',
            padding: '24px 30px',
            marginBottom: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '36px' }}><MicIcon /></span>
            <div>
              <h3 style={{ fontFamily: SERIF, fontSize: '20px', fontWeight: '800', margin: '0 0 4px 0' }}>
                IVA AI Scheme Assistant
              </h3>
              <p style={{ fontSize: '14px', opacity: 0.9, margin: 0 }}>
                Ask questions in your native language ({language.toUpperCase()}) using text or voice.
              </p>
            </div>
          </div>
          <span style={{ fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
            Ask AI <ArrowRightIcon />
          </span>
        </div>

        {/* Recommended Schemes Grid */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: SERIF, fontSize: '22px', fontWeight: '800', color: theme.textHeading, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <StarIcon />
              {getTranslation(language, 'recommendedSchemes')}
            </h3>
            <button
              onClick={() => onNavigate('/schemes')}
              style={{
                background: 'none',
                border: 'none',
                color: theme.primary,
                fontSize: '15px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              View All Directory <ArrowRightIcon />
            </button>
          </div>

          {recommendedStatus === 'loading' && <div style={{ color: theme.textMuted }}>Loading recommendations…</div>}
          {recommendedStatus === 'error' && <div style={{ color: theme.alertUrgent }}>Could not load recommendations right now.</div>}
          {recommendedStatus === 'ready' && recommended.length === 0 && (
            <div style={{ color: theme.textMuted }}>No schemes published yet.</div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {recommended.map((scheme) => {
              const isSaved = savedSchemeIds.has(scheme.id);
              const isLoading = loadingSchemeId === scheme.id;

              return (
                <div
                  key={scheme.id}
                  onClick={() => onSelectScheme(scheme.id)}
                  style={{
                    backgroundColor: theme.surface,
                    borderRadius: '20px',
                    padding: '22px',
                    border: `1.5px solid ${theme.border}`,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span
                        style={{
                          backgroundColor: theme.surfaceSubtle,
                          color: theme.primary,
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '700',
                        }}
                      >
                        {scheme.category}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSave(scheme.id, isSaved);
                        }}
                        disabled={isLoading}
                        style={{
                          backgroundColor: isSaved ? '#fef3c7' : theme.surfaceSubtle,
                          color: isSaved ? '#d97706' : theme.textMuted,
                          border: `1px solid ${isSaved ? '#fde68a' : theme.border}`,
                          borderRadius: '8px',
                          padding: '5px 9px',
                          cursor: isLoading ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          fontWeight: '700',
                        }}
                      >
                        {isSaved ? <BookmarkFilled /> : <BookmarkOutline />}
                        {isSaved ? getTranslation(language, 'schemesSaved') : getTranslation(language, 'saveScheme')}
                      </button>
                    </div>

                    <h4 style={{ fontFamily: SERIF, fontSize: '18px', fontWeight: '800', color: theme.textHeading, margin: '6px 0 8px 0', lineHeight: '1.3' }}>
                      {scheme.title}
                    </h4>
                    <p style={{ fontSize: '13.5px', color: theme.textMuted, lineHeight: '1.5', margin: 0 }}>
                      {scheme.summary}
                    </p>
                    {scheme.matchReason && (
                      <p style={{ fontSize: '12.5px', color: theme.primary, fontWeight: 700, lineHeight: '1.4', margin: '10px 0 0 0' }}>
                        ✓ {scheme.matchReason}
                      </p>
                    )}
                  </div>

                  <div style={{ marginTop: '18px', fontSize: '13px', fontWeight: '800', color: theme.primary, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    View Details <ArrowRightIcon />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
