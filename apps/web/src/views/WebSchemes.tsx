import React, { useEffect, useMemo, useState } from 'react';
import { ThemeColors } from 'shared/constants/theme';
import { SupportedLanguage } from 'shared/types';
import type { SchemeDetailDto, SchemeSummaryDto } from 'shared/contracts';
import { getTranslation } from 'shared/i18n/translations';
import { api } from '../lib/api';
import { FONT_SERIF, FONT_DISPLAY, ANIM } from '../design/tokens';

const SERIF = FONT_SERIF;

interface WebSchemesProps {
  theme: ThemeColors;
  language: SupportedLanguage;
  selectedSchemeId?: string;
  onSelectScheme: (id: string) => void;
  savedSchemeIds?: Set<string>;
  onToggleSave?: (schemeId: string, currentlySaved: boolean) => Promise<void>;
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const FileTextIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);
const GiftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" />
    <line x1="12" y1="22" x2="12" y2="7" />
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
  </svg>
);
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const ExternalLinkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);
const BookmarkOutline = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);
const BookmarkFilled = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

function splitList(text?: string): readonly string[] {
  if (!text) return [];
  return text.split(/[;\n]/).map(s => s.trim()).filter(s => s.length > 0);
}
function formatDate(iso?: string): string | undefined {
  if (!iso) return undefined;
  try { return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }); }
  catch { return iso; }
}

interface ProcessStep {
  stepNum: number;
  body: string;
}

function parseApplicationSteps(text?: string): ProcessStep[] {
  if (!text || !text.trim()) return [];
  const raw = text.trim();

  // Case 1: Separated by pipes '|' (e.g. "Step 1: ... | Step 2: ...")
  if (raw.includes('|')) {
    const parts = raw.split(/\s*\|\s*/).filter(s => s.trim().length > 0);
    return parts.map((part, idx) => {
      const match = part.match(/^(?:Step\s*\d+[:\-]?|\d+[\.\)]\s*)(.*)/i);
      return {
        stepNum: idx + 1,
        body: match ? match[1].trim() : part.trim(),
      };
    });
  }

  // Case 2: Separated by newlines containing numbers or "Step N"
  if (raw.includes('\n')) {
    const lines = raw.split(/\r?\n/).map(s => s.trim()).filter(s => s.length > 0);
    return lines.map((line, idx) => {
      const match = line.match(/^(?:Step\s*\d+[:\-]?|\d+[\.\)]\s*)(.*)/i);
      return {
        stepNum: idx + 1,
        body: match ? match[1].trim() : line,
      };
    });
  }

  // Case 3: Text contains "Step 1:", "Step 2:", etc. inline
  const parts = raw.split(/(?=(?:Step\s*\d+[:\-]?|\b\d+[\.\)]\s*))/i).map(s => s.trim()).filter(s => s.length > 0);
  if (parts.length > 1) {
    return parts.map((part, idx) => {
      const match = part.match(/^(?:Step\s*\d+[:\-]?|\d+[\.\)]\s*)(.*)/i);
      return {
        stepNum: idx + 1,
        body: match ? match[1].trim() : part,
      };
    });
  }

  return [{ stepNum: 1, body: raw }];
}

// ─── Sub-components ───────────────────────────────────────────────────────────
const SectionBlock: React.FC<{ title: string; icon?: React.ReactNode; theme: ThemeColors; children: React.ReactNode }> = ({ title, icon, theme, children }) => (
  <div style={{ marginBottom: '28px' }}>
    <h3 style={{ fontFamily: SERIF, fontSize: '17px', fontWeight: '800', color: theme.textHeading, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', backgroundColor: theme.surfaceSubtle, borderRadius: '10px', border: `1px solid ${theme.borderSubtle}` }}>
      <span style={{ color: theme.primary }}>{icon}</span>
      {title}
    </h3>
    {children}
  </div>
);

export const WebSchemes: React.FC<WebSchemesProps> = ({
  theme, language, selectedSchemeId, onSelectScheme, savedSchemeIds = new Set(), onToggleSave,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [schemes, setSchemes] = useState<readonly SchemeSummaryDto[]>([]);
  const [listStatus, setListStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [activeScheme, setActiveScheme] = useState<SchemeDetailDto | null>(null);
  const [detailStatus, setDetailStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [loadingSchemeId, setLoadingSchemeId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const PAGE_SIZE = 10;

  useEffect(() => {
    let cancelled = false;
    setListStatus('loading');
    const offset = (currentPage - 1) * PAGE_SIZE;
    api.schemes.list({ search: searchQuery || undefined, limit: PAGE_SIZE + 1, cursor: String(offset) })
      .then(data => {
        if (cancelled) return;
        const more = data.length > PAGE_SIZE;
        const pageItems = more ? data.slice(0, PAGE_SIZE) : data;
        setSchemes(pageItems);
        setHasMore(more);
        setListStatus('ready');

        // Auto-select the first scheme if nothing is selected or if current selection is not in this page
        if (pageItems.length > 0) {
          const exists = selectedSchemeId && pageItems.some(s => s.id === selectedSchemeId || s.slug === selectedSchemeId);
          if (!exists) {
            onSelectScheme(pageItems[0].slug || pageItems[0].id);
          }
        }
      })
      .catch(() => { if (!cancelled) setListStatus('error'); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, currentPage]);

  const selectedSlug = useMemo(() => {
    if (!selectedSchemeId) return undefined;
    const found = schemes.find(s => s.id === selectedSchemeId || s.slug === selectedSchemeId);
    return found ? found.slug : selectedSchemeId;
  }, [schemes, selectedSchemeId]);

  useEffect(() => {
    if (!selectedSlug) return;
    let cancelled = false;
    setDetailStatus('loading');
    api.schemes.getBySlug(selectedSlug)
      .then(data => { if (!cancelled) { setActiveScheme(data); setDetailStatus('ready'); } })
      .catch(() => { if (!cancelled) setDetailStatus('error'); });
    return () => { cancelled = true; };
  }, [selectedSlug]);

  const displayedSchemes = schemes;

  const handleSchemeSelect = (idOrSlug: string) => { onSelectScheme(idOrSlug); };
  const handleSearchChange = (q: string) => { setSearchQuery(q); setCurrentPage(1); };
  const handlePageChange = (p: number) => { setCurrentPage(p); };
  const handleToggleSave = async (schemeId: string, currentlySaved: boolean) => {
    if (!onToggleSave) return;
    setLoadingSchemeId(schemeId);
    try { await onToggleSave(schemeId, currentlySaved); }
    finally { setLoadingSchemeId(null); }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '28px 24px', animation: ANIM.fadeUp }}>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontFamily: SERIF, fontSize: '30px', fontWeight: '900', color: theme.textHeading, margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: theme.primary }}><FileTextIcon /></span>
          {getTranslation(language, 'schemesTitle')}
        </h2>
        <p style={{ fontSize: '15px', color: theme.textMuted, margin: 0 }}>
          {getTranslation(language, 'appTagline')}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '24px', alignItems: 'start' }}>
        {/* ── Left: Scheme List ──────────────────────────────────────── */}
        <div style={{ position: 'sticky', top: '76px' }}>
          {/* Search */}
          <div style={{ position: 'relative', marginBottom: '14px' }}>
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: theme.textSubtle, display: 'flex', pointerEvents: 'none' }}>
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder={getTranslation(language, 'searchPlaceholder')}
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              style={{
                width: '100%', paddingLeft: '44px', paddingRight: '16px',
                paddingTop: '13px', paddingBottom: '13px',
                backgroundColor: theme.surface, color: theme.textHeading,
                border: `1.5px solid ${theme.border}`, borderRadius: '14px',
                fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                transition: 'border-color 0.15s, box-shadow 0.15s',
                fontFamily: 'inherit',
              }}
              onFocus={e => { e.target.style.borderColor = theme.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.isDark ? 'rgba(82,183,136,0.15)' : 'rgba(113,131,85,0.12)'}`; }}
              onBlur={e => { e.target.style.borderColor = theme.border; e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; }}
            />
          </div>

          {listStatus === 'loading' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ height: '88px', borderRadius: '14px', backgroundColor: theme.surfaceSubtle, animation: 'shimmer 1.5s ease-in-out infinite', backgroundImage: `linear-gradient(90deg, ${theme.surfaceSubtle} 25%, ${theme.border} 50%, ${theme.surfaceSubtle} 75%)`, backgroundSize: '200% 100%' }} />
              ))}
            </div>
          )}
          {listStatus === 'error' && <div style={{ color: theme.alertUrgent, padding: '14px', fontSize: '14px' }}>{getTranslation(language, 'couldNotLoadSchemes')}</div>}
          {listStatus === 'ready' && displayedSchemes.length === 0 && (
            <div style={{ color: theme.textMuted, padding: '24px 14px', textAlign: 'center', fontSize: '14px' }}>{getTranslation(language, 'noSchemesMatchSearch')}</div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '62vh', overflowY: 'auto', paddingRight: '2px' }}>
            {displayedSchemes.map(scheme => {
              const isSelected = scheme.id === selectedSchemeId || scheme.slug === selectedSchemeId
                || (activeScheme ? selectedSlug === activeScheme.slug && (scheme.id === activeScheme.id || scheme.slug === activeScheme.slug) : false);
              const isSaved = savedSchemeIds.has(scheme.id);
              const isLoading = loadingSchemeId === scheme.id;
              return (
                <div
                  key={scheme.id}
                  onClick={() => handleSchemeSelect(scheme.id)}
                  style={{
                    backgroundColor: isSelected ? theme.surfaceSubtle : theme.surface,
                    borderRadius: '14px',
                    padding: '14px 16px',
                    border: `1.5px solid ${isSelected ? theme.primary : theme.border}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 4px 14px rgba(0,0,0,0.08)' : '0 1px 4px rgba(0,0,0,0.03)',
                    borderLeft: isSelected ? `4px solid ${theme.primary}` : `4px solid transparent`,
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.07)'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.03)'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
                    <span style={{ backgroundColor: isSelected ? theme.primary : theme.surfaceSubtle, color: isSelected ? theme.textInverse : theme.primary, padding: '3px 9px', borderRadius: '100px', fontSize: '10.5px', fontWeight: '800', letterSpacing: '0.02em' }}>
                      {scheme.category}
                    </span>
                    {onToggleSave && (
                      <button
                        onClick={e => { e.stopPropagation(); handleToggleSave(scheme.id, isSaved); }}
                        disabled={isLoading}
                        style={{ backgroundColor: isSaved ? '#fef3c7' : 'transparent', color: isSaved ? '#d97706' : theme.textSubtle, border: `1px solid ${isSaved ? '#fde68a' : 'transparent'}`, borderRadius: '7px', padding: '4px 8px', cursor: isLoading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '700' }}
                      >
                        {isSaved ? <BookmarkFilled /> : <BookmarkOutline />}
                        {isSaved ? getTranslation(language, 'schemesSaved') : getTranslation(language, 'saveScheme')}
                      </button>
                    )}
                  </div>
                  <h4 style={{ fontFamily: SERIF, fontSize: '14.5px', fontWeight: '800', color: theme.textHeading, margin: '0 0 5px', lineHeight: '1.3' }}>
                    {scheme.title}
                  </h4>
                  <p style={{ fontSize: '12.5px', color: theme.textMuted, margin: 0, lineHeight: '1.45', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {scheme.summary}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {listStatus === 'ready' && (displayedSchemes.length > 0 || currentPage > 1) && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', paddingTop: '12px', borderTop: `1px solid ${theme.borderSubtle}` }}>
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                style={{ backgroundColor: theme.surface, color: currentPage === 1 ? theme.textSubtle : theme.primary, border: `1.5px solid ${theme.border}`, borderRadius: '10px', padding: '8px 16px', fontSize: '13px', fontWeight: '700', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1, transition: 'all 0.15s' }}
              >
                {getTranslation(language, 'prevPage')}
              </button>
              <span style={{ fontSize: '12px', fontWeight: '700', color: theme.textMuted, backgroundColor: theme.surfaceSubtle, padding: '5px 12px', borderRadius: '100px' }}>
                {getTranslation(language, 'pageLabel')} {currentPage}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!hasMore}
                style={{ backgroundColor: theme.surface, color: !hasMore ? theme.textSubtle : theme.primary, border: `1.5px solid ${theme.border}`, borderRadius: '10px', padding: '8px 16px', fontSize: '13px', fontWeight: '700', cursor: !hasMore ? 'not-allowed' : 'pointer', opacity: !hasMore ? 0.5 : 1, transition: 'all 0.15s' }}
              >
                {getTranslation(language, 'nextPage')}
              </button>
            </div>
          )}
        </div>

        {/* ── Right: Scheme Detail ──────────────────────────────────── */}
        <div style={{ backgroundColor: theme.surface, borderRadius: '24px', border: `1.5px solid ${theme.border}`, minHeight: '600px', overflowY: 'auto', maxHeight: 'calc(100vh - 100px)', position: 'sticky', top: '76px' }}>
          {detailStatus === 'loading' && (
            <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[160, 100, 80, 120].map((h, i) => (
                <div key={i} style={{ height: `${h}px`, borderRadius: '12px', backgroundColor: theme.surfaceSubtle, animation: 'shimmer 1.5s ease-in-out infinite', backgroundImage: `linear-gradient(90deg, ${theme.surfaceSubtle} 25%, ${theme.border} 50%, ${theme.surfaceSubtle} 75%)`, backgroundSize: '200% 100%' }} />
              ))}
            </div>
          )}
          {detailStatus === 'error' && <div style={{ padding: '40px', color: theme.alertUrgent, fontSize: '15px' }}>{getTranslation(language, 'couldNotLoadScheme')}</div>}
          {detailStatus === 'idle' && (
            <div style={{ padding: '60px 40px', textAlign: 'center', color: theme.textMuted }}>
              <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.4 }}>
                <FileTextIcon />
              </div>
              <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px' }}>{getTranslation(language, 'schemeSelectPrompt')}</div>
              <div style={{ fontSize: '14px' }}>{getTranslation(language, 'schemeSelectDesc')}</div>
            </div>
          )}

          {detailStatus === 'ready' && activeScheme && (
            <div style={{ padding: '32px' }}>
              {/* Tags row */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ backgroundColor: theme.surfaceSubtle, color: theme.primary, padding: '5px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: '800' }}>
                    {activeScheme.category} · {activeScheme.department}
                  </span>
                  {activeScheme.level && <span style={{ backgroundColor: theme.surfaceSubtle, color: theme.textHeading, padding: '5px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: '700' }}>{activeScheme.level}</span>}
                  {activeScheme.state && <span style={{ backgroundColor: theme.surfaceSubtle, color: theme.textHeading, padding: '5px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: '700' }}>{activeScheme.state}</span>}
                  {activeScheme.dbtScheme && <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '5px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: '800' }}>Direct Benefit Transfer</span>}
                </div>
                {onToggleSave && (
                  <button
                    onClick={() => handleToggleSave(activeScheme.id, savedSchemeIds.has(activeScheme.id))}
                    disabled={loadingSchemeId === activeScheme.id}
                    style={{ backgroundColor: savedSchemeIds.has(activeScheme.id) ? '#fef3c7' : theme.surfaceSubtle, color: savedSchemeIds.has(activeScheme.id) ? '#d97706' : theme.textHeading, border: `1.5px solid ${savedSchemeIds.has(activeScheme.id) ? '#fde68a' : theme.border}`, borderRadius: '10px', padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', transition: 'all 0.15s', flexShrink: 0 }}
                  >
                    {savedSchemeIds.has(activeScheme.id) ? <BookmarkFilled /> : <BookmarkOutline />}
                    {savedSchemeIds.has(activeScheme.id) ? getTranslation(language, 'schemesSaved') : getTranslation(language, 'saveScheme')}
                  </button>
                )}
              </div>

              {/* Title & Description */}
              <h2 style={{ fontFamily: SERIF, fontSize: '26px', fontWeight: '900', color: theme.textHeading, margin: '0 0 14px', lineHeight: '1.2' }}>
                {activeScheme.title}
              </h2>
              <p style={{ fontSize: '15.5px', color: theme.textMuted, lineHeight: '1.7', marginBottom: '20px' }}>{activeScheme.fullDescription}</p>

              {/* Metadata Grid */}
              {(activeScheme.ministry || activeScheme.beneficiaryType || activeScheme.benefitType || activeScheme.schemeOpenDate || activeScheme.schemeCloseDate) && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px', marginBottom: '24px', padding: '16px', backgroundColor: theme.surfaceSubtle, borderRadius: '14px', border: `1px solid ${theme.borderSubtle}` }}>
                  {activeScheme.ministry && <div style={{ fontSize: '13px', color: theme.textMuted }}><strong style={{ color: theme.textHeading, display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>{getTranslation(language, 'schemeMinistryLabel')}</strong>{activeScheme.ministry}</div>}
                  {activeScheme.benefitType && <div style={{ fontSize: '13px', color: theme.textMuted }}><strong style={{ color: theme.textHeading, display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>{getTranslation(language, 'schemeBenefitTypeLabel')}</strong>{activeScheme.benefitType}</div>}
                  {activeScheme.beneficiaryType && <div style={{ fontSize: '13px', color: theme.textMuted }}><strong style={{ color: theme.textHeading, display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>{getTranslation(language, 'schemeWhoBenefitsLabel')}</strong>{activeScheme.beneficiaryType}</div>}
                  {activeScheme.schemeOpenDate && <div style={{ fontSize: '13px', color: theme.textMuted }}><strong style={{ color: theme.textHeading, display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>{getTranslation(language, 'schemeOpensLabel')}</strong>{formatDate(activeScheme.schemeOpenDate)}</div>}
                  {activeScheme.schemeCloseDate && <div style={{ fontSize: '13px', color: theme.alertUrgent }}><strong style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>{getTranslation(language, 'schemeDeadlineLabel')}</strong>{formatDate(activeScheme.schemeCloseDate)}</div>}
                </div>
              )}

              {/* Benefits */}
              <SectionBlock title={getTranslation(language, 'schemeBenefitsLabel')} icon={<GiftIcon />} theme={theme}>
                {activeScheme.benefits.length > 0 ? (
                  <ul style={{ paddingLeft: '20px', fontSize: '14.5px', color: theme.textBody, lineHeight: '1.7', margin: 0 }}>
                    {activeScheme.benefits.map(b => <li key={b.id} style={{ marginBottom: '6px' }}>{b.title}{b.valueText ? ` — ${b.valueText}` : ''}</li>)}
                  </ul>
                ) : splitList(activeScheme.benefitsText).length > 0 ? (
                  <ul style={{ paddingLeft: '20px', fontSize: '14.5px', color: theme.textBody, lineHeight: '1.7', margin: 0 }}>
                    {splitList(activeScheme.benefitsText).map((line, i) => <li key={i} style={{ marginBottom: '6px' }}>{line}</li>)}
                  </ul>
                ) : (
                  <p style={{ fontSize: '14px', color: theme.textMuted, margin: 0 }}>{getTranslation(language, 'schemeNoDetails')}</p>
                )}
              </SectionBlock>

              {/* Eligibility */}
              {splitList(activeScheme.eligibilityText).length > 0 && (
                <SectionBlock title={getTranslation(language, 'schemeEligibilityLabel')} icon={<CheckIcon />} theme={theme}>
                  <ul style={{ paddingLeft: '20px', fontSize: '14.5px', color: theme.textBody, lineHeight: '1.7', margin: 0 }}>
                    {splitList(activeScheme.eligibilityText).map((line, i) => <li key={i} style={{ marginBottom: '6px' }}>{line}</li>)}
                  </ul>
                </SectionBlock>
              )}

              {/* Exclusions */}
              {splitList(activeScheme.exclusionsText).length > 0 && (
                <SectionBlock title={getTranslation(language, 'schemeNotEligibleLabel')} theme={theme}>
                  <ul style={{ paddingLeft: '20px', fontSize: '14.5px', color: theme.textBody, lineHeight: '1.7', margin: 0 }}>
                    {splitList(activeScheme.exclusionsText).map((line, i) => <li key={i} style={{ marginBottom: '6px' }}>{line}</li>)}
                  </ul>
                </SectionBlock>
              )}

              {/* Documents */}
              <SectionBlock title={`${getTranslation(language, 'schemeDocumentsLabel')}${(activeScheme.documentsRequired.length > 0 ? ` (${activeScheme.documentsRequired.length})` : splitList(activeScheme.documentsRequiredText).length > 0 ? ` (${splitList(activeScheme.documentsRequiredText).length})` : '')}`} icon={<FileTextIcon />} theme={theme}>
                {activeScheme.documentsRequired.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {activeScheme.documentsRequired.map(doc => (
                      <div key={doc.id} style={{ backgroundColor: theme.surface, padding: '11px 14px', borderRadius: '10px', fontSize: '13.5px', fontWeight: '600', color: theme.textHeading, border: `1px solid ${theme.borderSubtle}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckIcon /> {doc.documentName}
                      </div>
                    ))}
                  </div>
                ) : splitList(activeScheme.documentsRequiredText).length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {splitList(activeScheme.documentsRequiredText).map((doc, i) => (
                      <div key={i} style={{ backgroundColor: theme.surface, padding: '11px 14px', borderRadius: '10px', fontSize: '13.5px', fontWeight: '600', color: theme.textHeading, border: `1px solid ${theme.borderSubtle}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckIcon /> {doc}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '14px', color: theme.textMuted, margin: 0 }}>{getTranslation(language, 'schemeNoDocChecklist')}</p>
                )}
              </SectionBlock>

              {/* How to Apply */}
              {activeScheme.applicationProcess && (() => {
                const steps = parseApplicationSteps(activeScheme.applicationProcess);
                return (
                  <SectionBlock title={`${getTranslation(language, 'schemeHowToApplyLabel')}${activeScheme.applicationMode ? ` (${activeScheme.applicationMode})` : ''}`} theme={theme}>
                    {steps.length > 1 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {steps.map(s => (
                          <div
                            key={s.stepNum}
                            style={{
                              backgroundColor: theme.surfaceSubtle,
                              borderRadius: '14px',
                              padding: '16px 18px',
                              border: `1px solid ${theme.borderSubtle}`,
                              display: 'flex',
                              gap: '14px',
                              alignItems: 'flex-start',
                              boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
                            }}
                          >
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '10px',
                                backgroundColor: theme.primary,
                                color: theme.textInverse,
                                fontSize: '13px',
                                fontWeight: '900',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                fontFamily: FONT_DISPLAY,
                                boxShadow: '0 2px 8px rgba(113,131,85,0.25)',
                              }}
                            >
                              {String(s.stepNum).padStart(2, '0')}
                            </div>
                            <div style={{ flex: 1, minWidth: 0, paddingTop: '3px' }}>
                              <div style={{ fontSize: '14.5px', color: theme.textHeading, lineHeight: '1.65', fontWeight: '500' }}>
                                {s.body}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ backgroundColor: theme.surfaceSubtle, borderRadius: '14px', padding: '18px 20px', border: `1px solid ${theme.borderSubtle}`, fontSize: '15px', color: theme.textBody, lineHeight: '1.7' }}>
                        {steps[0].body}
                      </div>
                    )}
                  </SectionBlock>
                );
              })()}

              {/* CTA */}
              {(activeScheme.applicationUrl || activeScheme.officialUrl) && (
                <a
                  href={activeScheme.applicationUrl || activeScheme.officialUrl}
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryHover})`,
                    color: theme.textInverse,
                    padding: '15px 30px', borderRadius: '14px',
                    fontSize: '15px', fontWeight: '800',
                    textDecoration: 'none',
                    boxShadow: '0 6px 20px rgba(113,131,85,0.28)',
                    transition: 'all 0.18s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(113,131,85,0.38)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(113,131,85,0.28)'; }}
                >
                  <ExternalLinkIcon />
                  <span>{getTranslation(language, 'schemeOfficialPortalLabel')}</span>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

