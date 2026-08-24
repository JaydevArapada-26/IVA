import React, { useEffect, useRef, useState } from "react";
import type { ThemeColors } from "shared/constants/theme";
import type { SupportedLanguage } from "shared/types";
import type { SchemeRecommendationDto } from "shared/contracts/schemes";
import { getTranslation } from "shared/i18n/translations";
import { api } from "../lib/api";
import { FONT_SERIF, FONT_DISPLAY, ANIM } from "../design/tokens";
import { SchemeDetailModal } from "./SchemeDetailModal";

const PAGE_SIZE = 8;

interface SchemesForMeViewProps {
  theme: ThemeColors;
  language: SupportedLanguage;
  savedSchemeIds: Set<string>;
  onToggleSave: (schemeId: string, currentlySaved: boolean) => void;
  onOpenScheme?: (slug: string) => void;
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const TargetIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </svg>
);
const BookmarkOutline = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);
const BookmarkFilled = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);
const RefreshIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);
const ArrowRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);
const UserIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);

const SkeletonCard: React.FC<{ theme: ThemeColors }> = ({ theme }) => (
  <div style={{ backgroundColor: theme.surface, borderRadius: '20px', padding: '22px', border: `1.5px solid ${theme.border}`, display: 'flex', flexDirection: 'column', gap: '12px' }}>
    <div style={{ height: '18px', width: '50%', borderRadius: '8px', backgroundImage: `linear-gradient(90deg, ${theme.surfaceSubtle} 25%, ${theme.border} 50%, ${theme.surfaceSubtle} 75%)`, backgroundSize: '200% 100%', animation: 'shimmer 1.5s ease-in-out infinite' }} />
    <div style={{ height: '14px', width: '85%', borderRadius: '8px', backgroundImage: `linear-gradient(90deg, ${theme.surfaceSubtle} 25%, ${theme.border} 50%, ${theme.surfaceSubtle} 75%)`, backgroundSize: '200% 100%', animation: 'shimmer 1.5s ease-in-out infinite' }} />
    <div style={{ height: '14px', width: '70%', borderRadius: '8px', backgroundImage: `linear-gradient(90deg, ${theme.surfaceSubtle} 25%, ${theme.border} 50%, ${theme.surfaceSubtle} 75%)`, backgroundSize: '200% 100%', animation: 'shimmer 1.5s ease-in-out infinite' }} />
    <div style={{ height: '24px', width: '40%', borderRadius: '8px', backgroundImage: `linear-gradient(90deg, ${theme.surfaceSubtle} 25%, ${theme.border} 50%, ${theme.surfaceSubtle} 75%)`, backgroundSize: '200% 100%', animation: 'shimmer 1.5s ease-in-out infinite', marginTop: '8px' }} />
  </div>
);

export const SchemesForMeView: React.FC<SchemesForMeViewProps> = ({
  theme, language, savedSchemeIds, onToggleSave, onOpenScheme,
}) => {
  const [schemes, setSchemes] = useState<readonly SchemeRecommendationDto[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'empty'>('loading');
  const [page, setPage] = useState(1);
  const [loadingSchemeId, setLoadingSchemeId] = useState<string | null>(null);
  const [modalSlug, setModalSlug] = useState<string | null>(null);
  const hasNextPageRef = useRef(false);

  const load = async (newPage: number) => {
    setStatus('loading');
    try {
      const result = await api.schemes.recommended(newPage, PAGE_SIZE, true);
      if (result.data.length === 0) {
        if (newPage === 1) { setStatus('empty'); }
        else {
          setPage(1);
          const fromStart = await api.schemes.recommended(1, PAGE_SIZE, true);
          setSchemes(fromStart.data);
          hasNextPageRef.current = fromStart.hasNextPage;
          setStatus(fromStart.data.length === 0 ? 'empty' : 'ready');
        }
        return;
      }
      setSchemes(result.data);
      hasNextPageRef.current = result.hasNextPage;
      setStatus('ready');
    } catch { setStatus('error'); }
  };

  useEffect(() => { load(1); }, []);

  const handleRefresh = () => {
    const nextPage = hasNextPageRef.current ? page + 1 : 1;
    setPage(nextPage);
    load(nextPage);
  };

  const handleToggleSave = async (schemeId: string, currentlySaved: boolean) => {
    setLoadingSchemeId(schemeId);
    try { await onToggleSave(schemeId, currentlySaved); }
    finally { setLoadingSchemeId(null); }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px', animation: ANIM.fadeUp }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ color: theme.primary, backgroundColor: theme.surfaceSubtle, border: `1.5px solid ${theme.border}`, borderRadius: '14px', padding: '10px', display: 'flex' }}>
            <TargetIcon />
          </div>
          <div>
            <h2 style={{ fontFamily: FONT_SERIF, fontSize: '28px', fontWeight: '900', color: theme.textHeading, margin: 0, lineHeight: 1 }}>
              {getTranslation(language, 'schemesForMe')}
            </h2>
            <p style={{ fontSize: '14px', color: theme.textSubtle, margin: '4px 0 0', fontWeight: '500' }}>{getTranslation(language, 'aiRankedSubtitle')}</p>
          </div>
        </div>

        {status === 'ready' && (
          <button
            onClick={handleRefresh}
            style={{ backgroundColor: theme.surface, color: theme.primary, border: `1.5px solid ${theme.border}`, borderRadius: '12px', padding: '10px 20px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = theme.surfaceSubtle; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = theme.surface; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <RefreshIcon />
            {getTranslation(language, 'refreshSchemes')}
          </button>
        )}
      </div>

      {/* Loading */}
      {status === 'loading' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} theme={theme} />)}
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: theme.surface, borderRadius: '24px', border: `1.5px solid ${theme.border}` }}>
          <div style={{ fontSize: '36px', marginBottom: '12px', color: theme.alertUrgent, opacity: 0.7 }}>⚠</div>
          <div style={{ fontSize: '16px', fontWeight: '700', color: theme.textHeading, marginBottom: '6px' }}>{getTranslation(language, 'couldNotLoadRecommendations')}</div>
          <div style={{ fontSize: '14px', color: theme.textMuted }}>Please try again or refresh the page.</div>
          <button onClick={() => load(1)} style={{ marginTop: '20px', backgroundColor: theme.primary, color: theme.textInverse, border: 'none', padding: '10px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: '800', cursor: 'pointer' }}>{getTranslation(language, 'retryButton')}</button>
        </div>
      )}

      {/* Empty */}
      {status === 'empty' && (
        <div style={{ textAlign: 'center', padding: '72px 20px', backgroundColor: theme.surface, borderRadius: '28px', border: `1.5px solid ${theme.border}`, animation: ANIM.fadeUp }}>
          <div style={{ color: theme.textSubtle, marginBottom: '16px', display: 'flex', justifyContent: 'center' }}><UserIcon /></div>
          <h3 style={{ fontFamily: FONT_SERIF, fontSize: '20px', fontWeight: '800', color: theme.textHeading, margin: '0 0 10px' }}>{getTranslation(language, 'noRecommendationsTitle')}</h3>
          <p style={{ fontSize: '15px', color: theme.textMuted, maxWidth: '440px', margin: '0 auto 24px', lineHeight: '1.6' }}>
            {getTranslation(language, 'noRecommendationsBody')}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {[{ step: '1', text: 'Add your state & district' }, { step: '2', text: 'Set age & income' }, { step: '3', text: 'Mark your documents' }].map(s => (
              <div key={s.step} style={{ backgroundColor: theme.surfaceSubtle, border: `1px solid ${theme.borderSubtle}`, borderRadius: '12px', padding: '12px 18px', fontSize: '13px', color: theme.textMuted, fontWeight: '600' }}>
                <span style={{ fontFamily: FONT_DISPLAY, fontWeight: '900', color: theme.primary, marginRight: '8px' }}>{s.step}</span>{s.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cards Grid */}
      {status === 'ready' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
            {schemes.map((scheme, index) => {
              const isSaved = savedSchemeIds.has(scheme.id);
              const isLoading = loadingSchemeId === scheme.id;
              return (
                <div
                  key={scheme.id}
                  onClick={() => setModalSlug(scheme.slug)}
                  style={{
                    backgroundColor: theme.surface,
                    borderRadius: '20px',
                    padding: '22px',
                    border: `1.5px solid ${scheme.isUrgent ? theme.alertUrgent : theme.border}`,
                    cursor: 'pointer',
                    transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    animation: `fadeUp 0.35s ${index * 0.04}s ease both`,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.09)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.04)'; }}
                >
                  {/* Urgency stripe */}
                  {scheme.isUrgent && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', backgroundColor: theme.alertUrgent }} />}

                  <div>
                    {/* Top row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ backgroundColor: theme.surfaceSubtle, color: theme.primary, padding: '4px 10px', borderRadius: '100px', fontSize: '11.5px', fontWeight: '800', letterSpacing: '0.01em' }}>
                        {scheme.category}
                      </span>
                      <button
                        onClick={e => { e.stopPropagation(); handleToggleSave(scheme.id, isSaved); }}
                        disabled={isLoading}
                        style={{ backgroundColor: isSaved ? '#fef3c7' : theme.surfaceSubtle, color: isSaved ? '#d97706' : theme.textSubtle, border: `1px solid ${isSaved ? '#fde68a' : theme.borderSubtle}`, borderRadius: '8px', padding: '5px 10px', cursor: isLoading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', fontWeight: '700', transition: 'all 0.15s' }}
                      >
                        {isSaved ? <BookmarkFilled /> : <BookmarkOutline />}
                        {isSaved ? getTranslation(language, 'schemesSaved') : getTranslation(language, 'saveScheme')}
                      </button>
                    </div>

                    {/* Title */}
                    <h4 style={{ fontFamily: FONT_SERIF, fontSize: '17px', fontWeight: '800', color: theme.textHeading, margin: '0 0 8px', lineHeight: '1.3' }}>{scheme.title}</h4>

                    {/* Summary */}
                    <p style={{ fontSize: '13.5px', color: theme.textMuted, margin: '0 0 12px', lineHeight: '1.55', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>{scheme.summary}</p>

                    {/* Match reason */}
                    {scheme.matchReason && (
                      <div style={{ backgroundColor: theme.isDark ? 'rgba(82,183,136,0.1)' : 'rgba(113,131,85,0.07)', border: `1px solid ${theme.borderSubtle}`, borderRadius: '10px', padding: '8px 12px', fontSize: '12.5px', color: theme.primary, fontWeight: '700', lineHeight: '1.4' }}>
                        ✓ {scheme.matchReason}
                      </div>
                    )}
                  </div>

                  {/* Footer CTA */}
                  <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: theme.primary, display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {getTranslation(language, 'viewDetails')} <ArrowRightIcon />
                    </span>
                    {scheme.isUrgent && (
                      <span style={{ fontSize: '11px', fontWeight: '800', color: theme.alertUrgent, backgroundColor: '#fee2e2', padding: '3px 8px', borderRadius: '100px' }}>URGENT</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: '13px', color: theme.textSubtle, textAlign: 'center', marginTop: '24px', fontWeight: '500' }}>
            {schemes.length} {getTranslation(language, 'showingRecommendations')}
          </p>
        </>
      )}

      {/* Scheme Detail Modal */}
      {modalSlug && (
        <SchemeDetailModal
          schemeSlug={modalSlug}
          theme={theme}
          language={language}
          onClose={() => setModalSlug(null)}
          savedSchemeIds={savedSchemeIds}
          onToggleSave={async (id, saved) => { await onToggleSave(id, saved); }}
        />
      )}
    </div>
  );
};
