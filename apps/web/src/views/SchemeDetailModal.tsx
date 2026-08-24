import React, { useEffect, useState } from "react";
import { ThemeColors } from "shared/constants/theme";
import { SupportedLanguage } from "shared/types";
import type { SchemeDetailDto } from "shared/contracts";
import { getTranslation } from "shared/i18n/translations";
import { api } from "../lib/api";
import { FONT_SERIF, FONT_DISPLAY } from "../design/tokens";

interface SchemeDetailModalProps {
  schemeSlug: string;
  theme: ThemeColors;
  language: SupportedLanguage;
  onClose: () => void;
  savedSchemeIds?: Set<string>;
  onToggleSave?: (schemeId: string, currentlySaved: boolean) => Promise<void>;
}

const XIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
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
const FileTextIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

function splitList(text?: string): readonly string[] {
  if (!text) return [];
  return text.split(/[;\n]/).map((s) => s.trim()).filter((s) => s.length > 0);
}
function formatDate(iso?: string): string | undefined {
  if (!iso) return undefined;
  try { return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }); }
  catch { return iso; }
}
interface ProcessStep { stepNum: number; body: string; }
function parseApplicationSteps(text?: string): ProcessStep[] {
  if (!text || !text.trim()) return [];
  const raw = text.trim();
  if (raw.includes("|")) {
    const parts = raw.split(/\s*\|\s*/).filter((s) => s.trim().length > 0);
    return parts.map((part, idx) => {
      const match = part.match(/^(?:Step\s*\d+[:\-]?|\d+[.\)]\s*)(.*)/i);
      return { stepNum: idx + 1, body: match ? match[1].trim() : part.trim() };
    });
  }
  if (raw.includes("\n")) {
    const lines = raw.split(/\r?\n/).map((s) => s.trim()).filter((s) => s.length > 0);
    return lines.map((line, idx) => {
      const match = line.match(/^(?:Step\s*\d+[:\-]?|\d+[.\)]\s*)(.*)/i);
      return { stepNum: idx + 1, body: match ? match[1].trim() : line };
    });
  }
  const parts = raw.split(/(?=(?:Step\s*\d+[:\-]?|\b\d+[.\)]\s*))/i).map((s) => s.trim()).filter((s) => s.length > 0);
  if (parts.length > 1) {
    return parts.map((part, idx) => {
      const match = part.match(/^(?:Step\s*\d+[:\-]?|\d+[.\)]\s*)(.*)/i);
      return { stepNum: idx + 1, body: match ? match[1].trim() : part };
    });
  }
  return [{ stepNum: 1, body: raw }];
}

const SectionBlock: React.FC<{ title: string; icon?: React.ReactNode; theme: ThemeColors; children: React.ReactNode }> = ({ title, icon, theme, children }) => (
  <div style={{ marginBottom: "28px" }}>
    <h3 style={{ fontFamily: FONT_SERIF, fontSize: "17px", fontWeight: "800", color: theme.textHeading, marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", backgroundColor: theme.surfaceSubtle, borderRadius: "10px", border: `1px solid ${theme.borderSubtle}` }}>
      <span style={{ color: theme.primary }}>{icon}</span>
      {title}
    </h3>
    {children}
  </div>
);

const SchemeDetailPanel: React.FC<{
  scheme: SchemeDetailDto;
  theme: ThemeColors;
  language: SupportedLanguage;
  savedSchemeIds?: Set<string>;
  onToggleSave?: (schemeId: string, currentlySaved: boolean) => Promise<void>;
}> = ({ scheme, theme, language, savedSchemeIds = new Set(), onToggleSave }) => {
  const [savingId, setSavingId] = useState<string | null>(null);
  const t = (key: string) => getTranslation(language, key);
  const isSaved = savedSchemeIds.has(scheme.id);

  const handleToggleSave = async (schemeId: string, currentlySaved: boolean) => {
    if (!onToggleSave) return;
    setSavingId(schemeId);
    try { await onToggleSave(schemeId, currentlySaved); }
    finally { setSavingId(null); }
  };

  return (
    <div style={{ padding: "32px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          <span style={{ backgroundColor: theme.surfaceSubtle, color: theme.primary, padding: "5px 12px", borderRadius: "100px", fontSize: "12px", fontWeight: "800" }}>
            {scheme.category} · {scheme.department}
          </span>
          {scheme.level && <span style={{ backgroundColor: theme.surfaceSubtle, color: theme.textHeading, padding: "5px 12px", borderRadius: "100px", fontSize: "12px", fontWeight: "700" }}>{scheme.level}</span>}
          {scheme.state && <span style={{ backgroundColor: theme.surfaceSubtle, color: theme.textHeading, padding: "5px 12px", borderRadius: "100px", fontSize: "12px", fontWeight: "700" }}>{scheme.state}</span>}
          {scheme.dbtScheme && <span style={{ backgroundColor: "#dcfce7", color: "#15803d", padding: "5px 12px", borderRadius: "100px", fontSize: "12px", fontWeight: "800" }}>Direct Benefit Transfer</span>}
        </div>
        {onToggleSave && (
          <button
            onClick={() => handleToggleSave(scheme.id, isSaved)}
            disabled={savingId === scheme.id}
            style={{ backgroundColor: isSaved ? "#fef3c7" : theme.surfaceSubtle, color: isSaved ? "#d97706" : theme.textHeading, border: `1.5px solid ${isSaved ? "#fde68a" : theme.border}`, borderRadius: "10px", padding: "8px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "700", transition: "all 0.15s", flexShrink: 0 }}
          >
            {isSaved ? <BookmarkFilled /> : <BookmarkOutline />}
            {isSaved ? t("schemesSaved") : t("saveScheme")}
          </button>
        )}
      </div>

      <h2 style={{ fontFamily: FONT_SERIF, fontSize: "26px", fontWeight: "900", color: theme.textHeading, margin: "0 0 14px", lineHeight: "1.2" }}>{scheme.title}</h2>
      <p style={{ fontSize: "15.5px", color: theme.textMuted, lineHeight: "1.7", marginBottom: "20px" }}>{scheme.fullDescription}</p>

      {(scheme.ministry || scheme.beneficiaryType || scheme.benefitType || scheme.schemeOpenDate || scheme.schemeCloseDate) && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px", marginBottom: "24px", padding: "16px", backgroundColor: theme.surfaceSubtle, borderRadius: "14px", border: `1px solid ${theme.borderSubtle}` }}>
          {scheme.ministry && <div style={{ fontSize: "13px", color: theme.textMuted }}><strong style={{ color: theme.textHeading, display: "block", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "3px" }}>{t("schemeMinistryLabel")}</strong>{scheme.ministry}</div>}
          {scheme.benefitType && <div style={{ fontSize: "13px", color: theme.textMuted }}><strong style={{ color: theme.textHeading, display: "block", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "3px" }}>{t("schemeBenefitTypeLabel")}</strong>{scheme.benefitType}</div>}
          {scheme.beneficiaryType && <div style={{ fontSize: "13px", color: theme.textMuted }}><strong style={{ color: theme.textHeading, display: "block", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "3px" }}>{t("schemeWhoBenefitsLabel")}</strong>{scheme.beneficiaryType}</div>}
          {scheme.schemeOpenDate && <div style={{ fontSize: "13px", color: theme.textMuted }}><strong style={{ color: theme.textHeading, display: "block", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "3px" }}>{t("schemeOpensLabel")}</strong>{formatDate(scheme.schemeOpenDate)}</div>}
          {scheme.schemeCloseDate && <div style={{ fontSize: "13px", color: theme.alertUrgent }}><strong style={{ display: "block", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "3px" }}>{t("schemeDeadlineLabel")}</strong>{formatDate(scheme.schemeCloseDate)}</div>}
        </div>
      )}

      <SectionBlock title={t("schemeBenefitsLabel")} icon={<GiftIcon />} theme={theme}>
        {scheme.benefits.length > 0 ? (
          <ul style={{ paddingLeft: "20px", fontSize: "14.5px", color: theme.textBody, lineHeight: "1.7", margin: 0 }}>
            {scheme.benefits.map((b) => <li key={b.id} style={{ marginBottom: "6px" }}>{b.title}{b.valueText ? ` — ${b.valueText}` : ""}</li>)}
          </ul>
        ) : splitList(scheme.benefitsText).length > 0 ? (
          <ul style={{ paddingLeft: "20px", fontSize: "14.5px", color: theme.textBody, lineHeight: "1.7", margin: 0 }}>
            {splitList(scheme.benefitsText).map((line, i) => <li key={i} style={{ marginBottom: "6px" }}>{line}</li>)}
          </ul>
        ) : <p style={{ fontSize: "14px", color: theme.textMuted, margin: 0 }}>{t("schemeNoDetails")}</p>}
      </SectionBlock>

      {splitList(scheme.eligibilityText).length > 0 && (
        <SectionBlock title={t("schemeEligibilityLabel")} icon={<CheckIcon />} theme={theme}>
          <ul style={{ paddingLeft: "20px", fontSize: "14.5px", color: theme.textBody, lineHeight: "1.7", margin: 0 }}>
            {splitList(scheme.eligibilityText).map((line, i) => <li key={i} style={{ marginBottom: "6px" }}>{line}</li>)}
          </ul>
        </SectionBlock>
      )}

      {splitList(scheme.exclusionsText).length > 0 && (
        <SectionBlock title={t("schemeNotEligibleLabel")} theme={theme}>
          <ul style={{ paddingLeft: "20px", fontSize: "14.5px", color: theme.textBody, lineHeight: "1.7", margin: 0 }}>
            {splitList(scheme.exclusionsText).map((line, i) => <li key={i} style={{ marginBottom: "6px" }}>{line}</li>)}
          </ul>
        </SectionBlock>
      )}

      <SectionBlock
        title={`${t("schemeDocumentsLabel")}${scheme.documentsRequired.length > 0 ? ` (${scheme.documentsRequired.length})` : splitList(scheme.documentsRequiredText).length > 0 ? ` (${splitList(scheme.documentsRequiredText).length})` : ""}`}
        icon={<FileTextIcon />}
        theme={theme}
      >
        {scheme.documentsRequired.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {scheme.documentsRequired.map((doc) => (
              <div key={doc.id} style={{ backgroundColor: theme.surface, padding: "11px 14px", borderRadius: "10px", fontSize: "13.5px", fontWeight: "600", color: theme.textHeading, border: `1px solid ${theme.borderSubtle}`, display: "flex", alignItems: "center", gap: "8px" }}>
                <CheckIcon /> {doc.documentName}
              </div>
            ))}
          </div>
        ) : splitList(scheme.documentsRequiredText).length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {splitList(scheme.documentsRequiredText).map((doc, i) => (
              <div key={i} style={{ backgroundColor: theme.surface, padding: "11px 14px", borderRadius: "10px", fontSize: "13.5px", fontWeight: "600", color: theme.textHeading, border: `1px solid ${theme.borderSubtle}`, display: "flex", alignItems: "center", gap: "8px" }}>
                <CheckIcon /> {doc}
              </div>
            ))}
          </div>
        ) : <p style={{ fontSize: "14px", color: theme.textMuted, margin: 0 }}>{t("schemeNoDocChecklist")}</p>}
      </SectionBlock>

      {scheme.applicationProcess && (() => {
        const steps = parseApplicationSteps(scheme.applicationProcess);
        return (
          <SectionBlock title={`${t("schemeHowToApplyLabel")}${scheme.applicationMode ? ` (${scheme.applicationMode})` : ""}`} theme={theme}>
            {steps.length > 1 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {steps.map((s) => (
                  <div key={s.stepNum} style={{ backgroundColor: theme.surfaceSubtle, borderRadius: "14px", padding: "16px 18px", border: `1px solid ${theme.borderSubtle}`, display: "flex", gap: "14px", alignItems: "flex-start" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "10px", backgroundColor: theme.primary, color: theme.textInverse, fontSize: "13px", fontWeight: "900", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: FONT_DISPLAY }}>
                      {String(s.stepNum).padStart(2, "0")}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, paddingTop: "3px", fontSize: "14.5px", color: theme.textHeading, lineHeight: "1.65", fontWeight: "500" }}>{s.body}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ backgroundColor: theme.surfaceSubtle, borderRadius: "14px", padding: "18px 20px", border: `1px solid ${theme.borderSubtle}`, fontSize: "15px", color: theme.textBody, lineHeight: "1.7" }}>
                {steps[0].body}
              </div>
            )}
          </SectionBlock>
        );
      })()}

      {(scheme.applicationUrl || scheme.officialUrl) && (
        <a
          href={scheme.applicationUrl || scheme.officialUrl}
          target="_blank" rel="noopener noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryHover})`, color: theme.textInverse, padding: "15px 30px", borderRadius: "14px", fontSize: "15px", fontWeight: "800", textDecoration: "none", boxShadow: "0 6px 20px rgba(113,131,85,0.28)", transition: "all 0.18s ease" }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 10px 28px rgba(113,131,85,0.38)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(113,131,85,0.28)"; }}
        >
          <ExternalLinkIcon />
          <span>{t("schemeOfficialPortalLabel")}</span>
        </a>
      )}
    </div>
  );
};

export const SchemeDetailModal: React.FC<SchemeDetailModalProps> = ({
  schemeSlug, theme, language, onClose, savedSchemeIds, onToggleSave,
}) => {
  const [scheme, setScheme] = useState<SchemeDetailDto | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const t = (key: string) => getTranslation(language, key);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    api.schemes.getBySlug(schemeSlug)
      .then((data) => { if (!cancelled) { setScheme(data); setStatus("ready"); } })
      .catch(() => { if (!cancelled) setStatus("error"); });
    return () => { cancelled = true; };
  }, [schemeSlug]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9500, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
    >
      <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <div
        style={{ position: "relative", width: "100%", maxWidth: "860px", maxHeight: "90vh", backgroundColor: theme.surface, borderRadius: "24px", border: `1.5px solid ${theme.border}`, boxShadow: "0 24px 72px rgba(0,0,0,0.22)", display: "flex", flexDirection: "column", overflowY: "auto", animation: "fadeUp 0.22s ease both" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 28px", borderBottom: `1px solid ${theme.borderSubtle}`, flexShrink: 0, position: "sticky", top: 0, backgroundColor: theme.surface, zIndex: 1 }}>
          <span style={{ fontFamily: FONT_SERIF, fontSize: "15px", fontWeight: "800", color: theme.textHeading }}>
            {t("schemeDetails")}
          </span>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ backgroundColor: theme.surfaceSubtle, border: `1px solid ${theme.borderSubtle}`, borderRadius: "10px", padding: "8px", cursor: "pointer", color: theme.textMuted, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.border; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = theme.surfaceSubtle; }}
          >
            <XIcon />
          </button>
        </div>

        {status === "loading" && (
          <div style={{ padding: "40px", display: "flex", flexDirection: "column", gap: "16px" }}>
            {[160, 100, 80, 120].map((h, i) => (
              <div key={i} style={{ height: `${h}px`, borderRadius: "12px", backgroundColor: theme.surfaceSubtle, backgroundImage: `linear-gradient(90deg, ${theme.surfaceSubtle} 25%, ${theme.border} 50%, ${theme.surfaceSubtle} 75%)`, backgroundSize: "200% 100%", animation: "shimmer 1.5s ease-in-out infinite" }} />
            ))}
          </div>
        )}

        {status === "error" && (
          <div style={{ padding: "60px", textAlign: "center", color: theme.alertUrgent, fontSize: "15px" }}>
            {t("couldNotLoadScheme")}
          </div>
        )}

        {status === "ready" && scheme && (
          <SchemeDetailPanel scheme={scheme} theme={theme} language={language} savedSchemeIds={savedSchemeIds} onToggleSave={onToggleSave} />
        )}
      </div>
    </div>
  );
};
