import React from 'react';
import { ThemeColors } from 'shared/constants/theme';
import { SupportedLanguage } from 'shared/types';
import { getTranslation } from 'shared/i18n/translations';
import { FONT_SERIF, FONT_DISPLAY, ANIM } from '../design/tokens';

interface LandingPageProps {
  theme: ThemeColors;
  language: SupportedLanguage;
  onNavigate: (route: string) => void;
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const ArrowRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);
const GlobeIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);
const MicIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);
const FileTextIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);
const ShieldIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const SparkleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
  </svg>
);

const STATS = [
  { value: '4,670+', label: 'Verified Schemes' },
  { value: '10', label: 'Indian Languages' },
  { value: '100%', label: 'Free & Open' },
  { value: 'AI', label: 'Eligibility Engine' },
];

const FEATURES = [
  {
    icon: <GlobeIcon />,
    title: '10 Indian Languages',
    desc: 'Read and hear scheme guides in Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Odia, and English.',
  },
  {
    icon: <MicIcon />,
    title: 'AI Voice Assistance',
    desc: 'Ask questions out loud. Our AI assistant explains schemes in plain language, without jargon or middlemen.',
  },
  {
    icon: <FileTextIcon />,
    title: 'Document Checklists',
    desc: 'Know exactly which Aadhaar, Ration, or Bank certificates you need before visiting your nearest CSC center.',
  },
  {
    icon: <ShieldIcon />,
    title: 'Privacy-First Design',
    desc: "IVA never stores your physical documents. We only track document availability locally to evaluate your eligibility.",
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({ theme, language, onNavigate }) => {
  const isDark = theme.isDark;
  const bgImage = isDark ? '/homebgdark.png' : '/homebglight.png';

  return (
    <div
      style={{
        color: theme.textBody,
        backgroundColor: theme.background,
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
      }}
    >
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '80px 24px 100px',
          textAlign: 'center',
          background: isDark
            ? 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(82,183,136,0.15) 0%, transparent 70%)'
            : 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(113,131,85,0.12) 0%, transparent 70%)',
        }}
      >
        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: theme.surface, border: `1.5px solid ${theme.border}`, padding: '6px 18px', borderRadius: '100px', fontSize: '13px', fontWeight: '700', color: theme.primary, marginBottom: '28px', animation: ANIM.fadeUp, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <SparkleIcon />
          India's AI-Powered Citizen Welfare Platform
        </div>

        {/* Heading */}
        <h1 style={{ fontFamily: FONT_SERIF, fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: '900', color: theme.textHeading, margin: '0 auto 20px', lineHeight: '1.1', maxWidth: '900px', animation: `${ANIM.fadeUp} 0.1s`, letterSpacing: '-0.02em' }}>
          {getTranslation(language, 'appName')}
        </h1>

        <p style={{ fontSize: 'clamp(16px, 2.2vw, 20px)', color: theme.textMuted, maxWidth: '680px', margin: '0 auto 40px', lineHeight: '1.65', animation: `${ANIM.fadeUp} 0.15s` }}>
          Browse, understand, and apply for 4,670+ central and state government schemes — in your native language, instantly, with zero middlemen.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', animation: `${ANIM.fadeUp} 0.2s` }}>
          <button
            onClick={() => onNavigate('/wizard')}
            style={{
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryHover})`,
              color: theme.textInverse,
              border: 'none',
              padding: '16px 32px',
              borderRadius: '14px',
              fontSize: '16px',
              fontWeight: '800',
              cursor: 'pointer',
              boxShadow: `0 8px 24px rgba(113,131,85,0.35)`,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.18s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(113,131,85,0.45)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(113,131,85,0.35)'; }}
          >
            <span>Find Schemes for Me</span>
            <ArrowRightIcon />
          </button>
          <button
            onClick={() => onNavigate('/schemes')}
            style={{
              backgroundColor: theme.surface,
              color: theme.textHeading,
              border: `2px solid ${theme.border}`,
              padding: '16px 32px',
              borderRadius: '14px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = theme.surfaceSubtle; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = theme.surface; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            Explore Scheme Directory
          </button>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap', marginTop: '64px', animation: `${ANIM.fadeUp} 0.25s` }}>
          {STATS.map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: '32px', fontWeight: '900', color: theme.primary, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: theme.textSubtle, marginTop: '4px', letterSpacing: '0.03em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature Cards ─────────────────────────────────────────────── */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontFamily: FONT_SERIF, fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: '900', color: theme.textHeading, margin: '0 0 12px' }}>
            Everything a Citizen Needs
          </h2>
          <p style={{ fontSize: '16px', color: theme.textMuted, margin: 0, maxWidth: '540px', lineHeight: '1.6', marginLeft: 'auto', marginRight: 'auto' }}>
            IVA bridges the gap between complex government portals and everyday citizens.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              style={{
                backgroundColor: theme.surface,
                padding: '28px',
                borderRadius: '24px',
                border: `1.5px solid ${theme.border}`,
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                animation: `fadeUp 0.35s ${i * 0.06}s ease both`,
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,0,0,0.09)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'; }}
            >
              <div style={{ color: theme.primary, marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', backgroundColor: theme.surfaceSubtle, borderRadius: '16px', border: `1px solid ${theme.borderSubtle}` }}>
                {f.icon}
              </div>
              <h3 style={{ fontFamily: FONT_SERIF, fontSize: '19px', fontWeight: '800', color: theme.textHeading, margin: '0 0 10px' }}>{f.title}</h3>
              <p style={{ fontSize: '14.5px', color: theme.textMuted, lineHeight: '1.6', margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it Works ──────────────────────────────────────────────── */}
      <section style={{ backgroundColor: theme.surface, borderTop: `1px solid ${theme.borderSubtle}`, borderBottom: `1px solid ${theme.borderSubtle}`, padding: '72px 24px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: FONT_SERIF, fontSize: 'clamp(24px, 4vw, 34px)', fontWeight: '900', color: theme.textHeading, marginBottom: '48px' }}>
            How IVA Works in 3 Steps
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '32px' }}>
            {[
              { num: '01', title: 'Create your profile', desc: 'Share your state, category, age, income, and documents once. IVA never asks again.' },
              { num: '02', title: 'AI ranks your schemes', desc: 'IVA\'s eligibility engine matches you to the right schemes and explains why you qualify.' },
              { num: '03', title: 'Apply with confidence', desc: 'Read guides, prepare documents, and click through to official portals — no middlemen.' },
            ].map(step => (
              <div key={step.num} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: '42px', fontWeight: '900', color: theme.border, lineHeight: 1, marginBottom: '14px' }}>{step.num}</div>
                <h4 style={{ fontSize: '17px', fontWeight: '800', color: theme.textHeading, margin: '0 0 10px' }}>{step.title}</h4>
                <p style={{ fontSize: '14px', color: theme.textMuted, lineHeight: '1.6', margin: 0 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Footer Band ────────────────────────────────────────────── */}
      <section style={{ padding: '72px 24px', textAlign: 'center', background: isDark ? `linear-gradient(180deg, ${theme.background} 0%, ${theme.surfaceSubtle} 100%)` : `linear-gradient(180deg, ${theme.background} 0%, ${theme.gradientFrom} 100%)` }}>
        <h2 style={{ fontFamily: FONT_SERIF, fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: '900', color: theme.textHeading, margin: '0 0 16px' }}>
          Your welfare rights, in your language.
        </h2>
        <p style={{ fontSize: '16px', color: theme.textMuted, maxWidth: '500px', margin: '0 auto 32px', lineHeight: '1.6' }}>
          Built for Bharat. Free forever. No app download required.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => onNavigate('/wizard')}
            style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryHover})`, color: theme.textInverse, border: 'none', padding: '14px 28px', borderRadius: '12px', fontSize: '15px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 6px 20px rgba(113,131,85,0.3)', transition: 'all 0.18s ease' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            Get Started — It's Free
          </button>
          <button onClick={() => onNavigate('/about')} style={{ backgroundColor: 'transparent', color: theme.primary, border: `1.5px solid ${theme.border}`, padding: '14px 28px', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.15s ease' }}>
            Learn About IVA
          </button>
        </div>
      </section>
    </div>
  );
};
