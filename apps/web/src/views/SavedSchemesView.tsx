import React, { useEffect, useState } from 'react';
import type { ThemeColors } from 'shared/constants/theme';
import type { SupportedLanguage } from 'shared/types';
import type { SavedSchemeDto } from 'shared/contracts/schemes';
import { getTranslation } from 'shared/i18n/translations';
import { api } from '../lib/api';
import { FONT_SERIF, ANIM } from '../design/tokens';
import { SchemeDetailModal } from './SchemeDetailModal';

interface SavedSchemesViewProps {
  theme: ThemeColors;
  language: SupportedLanguage;
  onOpenScheme?: (slug: string) => void;
  onUnsaved?: (schemeId: string) => void;
}

const BookmarkFilledIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);
const BookmarkOutlineIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);
const ArrowRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

export const SavedSchemesView: React.FC<SavedSchemesViewProps> = ({ theme, language, onOpenScheme, onUnsaved }) => {
  const [schemes, setSchemes] = useState<readonly SavedSchemeDto[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'empty'>('loading');
  const [unsavingId, setUnsavingId] = useState<string | null>(null);
  const [modalSlug, setModalSlug] = useState<string | null>(null);

  const load = async () => {
    setStatus('loading');
    try {
      const data = await api.schemes.savedList();
      setSchemes(data);
      setStatus(data.length === 0 ? 'empty' : 'ready');
    } catch { setStatus('error'); }
  };

  useEffect(() => { load(); }, []);

  const handleUnsave = async (schemeId: string) => {
    setUnsavingId(schemeId);
    try {
      await api.schemes.unsave(schemeId);
      setSchemes(prev => prev.filter(s => s.schemeId !== schemeId));
      onUnsaved?.(schemeId);
      if (schemes.length - 1 === 0) setStatus('empty');
    } finally { setUnsavingId(null); }
  };

  const formatDate = (iso: string) => {
    try { return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return '—'; }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 24px', animation: ANIM.fadeUp }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <div style={{ color: theme.primary, backgroundColor: theme.surfaceSubtle, border: `1.5px solid ${theme.border}`, borderRadius: '14px', padding: '10px', display: 'flex' }}>
          <BookmarkOutlineIcon />
        </div>
        <div>
          <h2 style={{ fontFamily: FONT_SERIF, fontSize: '28px', fontWeight: '900', color: theme.textHeading, margin: 0, lineHeight: 1 }}>
            {getTranslation(language, 'savedSchemes')}
          </h2>
          <p style={{ fontSize: '14px', color: theme.textSubtle, margin: '4px 0 0', fontWeight: '500' }}>{getTranslation(language, 'savedSchemeSubtitle')}</p>
        </div>
      </div>

      {/* Loading */}
      {status === 'loading' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ height: '100px', borderRadius: '18px', backgroundImage: `linear-gradient(90deg, ${theme.surfaceSubtle} 25%, ${theme.border} 50%, ${theme.surfaceSubtle} 75%)`, backgroundSize: '200% 100%', animation: 'shimmer 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: theme.alertUrgent, fontSize: '14px', fontWeight: 600 }}>
          Could not load saved schemes. <button onClick={load} style={{ marginLeft: '8px', backgroundColor: 'transparent', color: theme.primary, border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '14px' }}>{getTranslation(language, 'retryButton')}</button>
        </div>
      )}

      {/* Empty */}
      {status === 'empty' && (
        <div style={{ textAlign: 'center', padding: '72px 20px', backgroundColor: theme.surface, borderRadius: '28px', border: `1.5px solid ${theme.borderSubtle}`, animation: ANIM.scaleIn }}>
          <div style={{ color: theme.textSubtle, marginBottom: '16px', display: 'flex', justifyContent: 'center', opacity: 0.5 }}>
            <BookmarkOutlineIcon />
          </div>
          <h3 style={{ fontFamily: FONT_SERIF, fontSize: '20px', fontWeight: '800', color: theme.textHeading, margin: '0 0 10px' }}>
            {getTranslation(language, 'noSavedSchemes')}
          </h3>
          <p style={{ fontSize: '14.5px', color: theme.textMuted, maxWidth: '380px', margin: '0 auto', lineHeight: '1.65' }}>
            {getTranslation(language, 'savedBrowseHint')}
          </p>
        </div>
      )}

      {/* Cards */}
      {status === 'ready' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {schemes.map((scheme, index) => (
            <div
              key={scheme.savedSchemeId}
              style={{
                backgroundColor: theme.surface,
                borderRadius: '20px',
                padding: '20px 24px',
                border: `1.5px solid ${theme.border}`,
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                transition: 'transform 0.16s ease, box-shadow 0.16s ease',
                animation: `fadeUp 0.3s ${index * 0.04}s ease both`,
              }}
              onClick={() => setModalSlug(scheme.schemeSlug)}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 22px rgba(0,0,0,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.04)'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ fontFamily: FONT_SERIF, fontSize: '18px', fontWeight: '800', color: theme.textHeading, margin: '0 0 7px', lineHeight: '1.3' }}>
                    {scheme.schemeTitle}
                  </h4>
                  <p style={{ fontSize: '13.5px', color: theme.textMuted, margin: '0 0 12px', lineHeight: '1.55', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {scheme.schemeSummary}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '11.5px', color: theme.textSubtle, backgroundColor: theme.surfaceSubtle, padding: '3px 10px', borderRadius: '100px', fontWeight: '600' }}>
                      {getTranslation(language, 'savedAt')} {formatDate(scheme.savedAt)}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: theme.primary, display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {getTranslation(language, 'viewDetails')} <ArrowRightIcon />
                    </span>
                  </div>
                </div>

                <button
                  onClick={e => { e.stopPropagation(); handleUnsave(scheme.schemeId); }}
                  disabled={unsavingId === scheme.schemeId}
                  title="Remove from saved"
                  style={{
                    color: '#d97706', backgroundColor: '#fef3c7',
                    border: '1.5px solid #fde68a', borderRadius: '10px',
                    padding: '9px 14px', cursor: unsavingId === scheme.schemeId ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    fontSize: '12.5px', fontWeight: '700', flexShrink: 0,
                    opacity: unsavingId === scheme.schemeId ? 0.6 : 1,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#fde68a'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fef3c7'; }}
                >
                  <BookmarkFilledIcon />
                  {getTranslation(language, 'schemesSaved')}
                </button>
              </div>
            </div>
          ))}

          <div style={{ textAlign: 'center', marginTop: '8px' }}>
            <span style={{ fontSize: '12.5px', color: theme.textSubtle, backgroundColor: theme.surfaceSubtle, padding: '5px 16px', borderRadius: '100px', fontWeight: '600' }}>
              {schemes.length} {schemes.length !== 1 ? getTranslation(language, 'savedCountPlural') : getTranslation(language, 'savedCount')}
            </span>
          </div>
        </div>
      )}

      {/* Scheme Detail Modal */}
      {modalSlug && (
        <SchemeDetailModal
          schemeSlug={modalSlug}
          theme={theme}
          language={language}
          onClose={() => setModalSlug(null)}
        />
      )}
    </div>
  );
};
