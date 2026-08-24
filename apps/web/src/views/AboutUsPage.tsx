import React from 'react';
import type { ThemeColors } from 'shared/constants/theme';
import type { SupportedLanguage } from 'shared/types';
import { FONT_SERIF, FONT_DISPLAY, ANIM } from '../design/tokens';

interface AboutUsPageProps {
  theme: ThemeColors;
  language: SupportedLanguage;
  onNavigate: (route: string) => void;
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const HeartIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);
const ShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const GlobeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);
const TargetIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </svg>
);
const SparkleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
  </svg>
);
const UserIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);
const ArrowRightIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

const STATS = [
  { value: '4,670+', label: 'Verified Schemes', sub: 'Central & State' },
  { value: '10', label: 'Languages', sub: 'Including regional' },
  { value: '0', label: 'Middlemen', sub: 'Direct to citizen' },
  { value: 'AI', label: 'Powered Engine', sub: 'Gemini by Google' },
];

const HOW_IT_WORKS = [
  { num: '01', title: 'Create Your Profile', desc: 'Share your state, age, income range, category, occupation, and document availability once. IVA remembers it all.' },
  { num: '02', title: 'AI Matches Your Schemes', desc: 'Our priority engine scans 4,670+ schemes against your profile and ranks them by urgency, eligibility, and recency — instantly.' },
  { num: '03', title: 'Apply With Confidence', desc: 'Read full details, prepare your document checklist, and click through to official government portals. No forms, no fees, no agents.' },
];

const VALUES = [
  { icon: <HeartIcon />, title: 'Citizen-First', desc: 'Every design decision is made for the last-mile user — low-literacy, low-bandwidth, multilingual.' },
  { icon: <ShieldIcon />, title: 'Privacy-Respecting', desc: 'IVA never stores your physical documents. We only track document availability checkmarks locally to evaluate eligibility.' },
  { icon: <GlobeIcon />, title: 'Inclusive by Default', desc: 'Voice, SMS, web, and app — IVA works on feature phones and smartphones alike, in your language.' },
  { icon: <SparkleIcon />, title: 'AI-Powered Accuracy', desc: 'Eligibility isn\'t guessed — it\'s computed by a graded scoring engine that considers urgency, category, income, and occupation.' },
];

const SectionDivider: React.FC<{ theme: ThemeColors }> = ({ theme }) => (
  <div style={{ borderTop: `1px solid ${theme.borderSubtle}`, margin: '0' }} />
);

export const AboutUsPage: React.FC<AboutUsPageProps> = ({ theme, onNavigate }) => {
  const isDark = theme.isDark;

  return (
    <div style={{ color: theme.textBody, backgroundColor: theme.background }}>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section style={{
        padding: '72px 24px 80px',
        textAlign: 'center',
        background: isDark
          ? `radial-gradient(ellipse 70% 50% at 50% 0%, rgba(52,183,136,0.15) 0%, transparent 65%), ${theme.background}`
          : `radial-gradient(ellipse 70% 50% at 50% 0%, rgba(113,131,85,0.12) 0%, transparent 65%), ${theme.background}`,
        animation: ANIM.fadeUp,
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: theme.surface, border: `1.5px solid ${theme.border}`, padding: '6px 18px', borderRadius: '100px', fontSize: '13px', fontWeight: '700', color: theme.primary, marginBottom: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <TargetIcon /> About IVA
        </div>
        <h1 style={{ fontFamily: FONT_SERIF, fontSize: 'clamp(32px, 5vw, 54px)', fontWeight: '900', color: theme.textHeading, margin: '0 auto 18px', lineHeight: '1.15', maxWidth: '780px' }}>
          Bridging the gap between citizens and their welfare rights
        </h1>
        <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: theme.textMuted, maxWidth: '640px', margin: '0 auto', lineHeight: '1.7' }}>
          IVA — Intelligent Welfare Assistance — is India's AI-powered platform that helps every citizen discover, understand, and apply for government schemes in their own language, without middlemen, without confusion.
        </p>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      <section style={{ backgroundColor: theme.surface, borderTop: `1px solid ${theme.borderSubtle}`, borderBottom: `1px solid ${theme.borderSubtle}`, padding: '48px 24px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '32px', textAlign: 'center' }}>
          {STATS.map(s => (
            <div key={s.label}>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: '40px', fontWeight: '900', color: theme.primary, lineHeight: 1, marginBottom: '6px' }}>{s.value}</div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: theme.textHeading, marginBottom: '3px' }}>{s.label}</div>
              <div style={{ fontSize: '12.5px', color: theme.textSubtle, fontWeight: '500' }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Mission ───────────────────────────────────────────────────── */}
      <section style={{ maxWidth: '900px', margin: '0 auto', padding: '72px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
          <div style={{ backgroundColor: theme.surface, borderRadius: '24px', padding: '32px', border: `1.5px solid ${theme.border}`, boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
            <div style={{ fontFamily: FONT_SERIF, fontSize: '13px', fontWeight: '800', color: theme.primary, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Our Mission</div>
            <h3 style={{ fontFamily: FONT_SERIF, fontSize: '22px', fontWeight: '900', color: theme.textHeading, margin: '0 0 14px', lineHeight: '1.3' }}>
              Make welfare access as simple as sending a message
            </h3>
            <p style={{ fontSize: '15px', color: theme.textMuted, lineHeight: '1.7', margin: 0 }}>
              India runs thousands of welfare schemes. Most citizens never find them. IVA fixes that — through AI eligibility matching, multilingual guides, and no-middleman access to official portals.
            </p>
          </div>
          <div style={{ backgroundColor: theme.surface, borderRadius: '24px', padding: '32px', border: `1.5px solid ${theme.border}`, boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
            <div style={{ fontFamily: FONT_SERIF, fontSize: '13px', fontWeight: '800', color: theme.primary, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Our Vision</div>
            <h3 style={{ fontFamily: FONT_SERIF, fontSize: '22px', fontWeight: '900', color: theme.textHeading, margin: '0 0 14px', lineHeight: '1.3' }}>
              A Bharat where no eligible citizen misses a scheme
            </h3>
            <p style={{ fontSize: '15px', color: theme.textMuted, lineHeight: '1.7', margin: 0 }}>
              By 2030, we envision IVA becoming the default welfare discovery layer for India — accessible via web, app, SMS, WhatsApp, and CSC kiosks alike.
            </p>
          </div>
        </div>
      </section>

      <SectionDivider theme={theme} />

      {/* ── Values ────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '72px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontFamily: FONT_SERIF, fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: '900', color: theme.textHeading, margin: '0 0 12px' }}>
            What IVA Stands For
          </h2>
          <p style={{ fontSize: '15.5px', color: theme.textMuted, maxWidth: '500px', margin: '0 auto', lineHeight: '1.65' }}>
            Four principles that guide every feature we build.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          {VALUES.map((v, i) => (
            <div key={v.title} style={{ backgroundColor: theme.surface, borderRadius: '20px', padding: '26px', border: `1.5px solid ${theme.border}`, animation: `fadeUp 0.35s ${i * 0.07}s ease both` }}>
              <div style={{ color: theme.primary, width: '48px', height: '48px', backgroundColor: theme.surfaceSubtle, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${theme.borderSubtle}`, marginBottom: '16px' }}>
                {v.icon}
              </div>
              <h4 style={{ fontFamily: FONT_SERIF, fontSize: '18px', fontWeight: '800', color: theme.textHeading, margin: '0 0 10px' }}>{v.title}</h4>
              <p style={{ fontSize: '14px', color: theme.textMuted, lineHeight: '1.65', margin: 0 }}>{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <SectionDivider theme={theme} />

      {/* ── How It Works ──────────────────────────────────────────────── */}
      <section style={{ backgroundColor: theme.surface, padding: '72px 24px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: FONT_SERIF, fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: '900', color: theme.textHeading, margin: '0 0 12px' }}>
            How IVA Works
          </h2>
          <p style={{ fontSize: '15.5px', color: theme.textMuted, marginBottom: '52px', lineHeight: '1.65' }}>Three simple steps from citizen to scheme.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.num} style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', textAlign: 'left', animation: `fadeUp 0.35s ${i * 0.08}s ease both` }}>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: '28px', fontWeight: '900', color: theme.primary, minWidth: '52px', opacity: 0.8 }}>{step.num}</div>
                <div>
                  <h4 style={{ fontFamily: FONT_SERIF, fontSize: '19px', fontWeight: '800', color: theme.textHeading, margin: '0 0 8px' }}>{step.title}</h4>
                  <p style={{ fontSize: '15px', color: theme.textMuted, lineHeight: '1.65', margin: 0 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider theme={theme} />

      {/* ── Why IVA Was Built ─────────────────────────────────────────── */}
      <section style={{ maxWidth: '800px', margin: '0 auto', padding: '72px 24px' }}>
        <h2 style={{ fontFamily: FONT_SERIF, fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: '900', color: theme.textHeading, margin: '0 0 24px', textAlign: 'center' }}>
          Why IVA Was Built
        </h2>
        <div style={{ backgroundColor: theme.surface, borderRadius: '24px', padding: '36px', border: `1.5px solid ${theme.border}`, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <p style={{ fontSize: '16px', color: theme.textMuted, lineHeight: '1.85', margin: '0 0 18px' }}>
            India has some of the world's most expansive welfare programs — but millions of eligible citizens never benefit from them. Language barriers, complex portals, and reliance on middlemen mean that those who need help most, get it least.
          </p>
          <p style={{ fontSize: '16px', color: theme.textMuted, lineHeight: '1.85', margin: '0 0 18px' }}>
            We built IVA because we believe that access to welfare is a right, not a privilege. It should be as easy as asking a question in your own language. It should work on a ₹2,000 smartphone. It should never cost you a rupee.
          </p>
          <p style={{ fontSize: '16px', color: theme.textMuted, lineHeight: '1.85', margin: 0 }}>
            IVA is our answer to that belief — built with AI, built with empathy, and built for Bharat.
          </p>
        </div>
      </section>

      <SectionDivider theme={theme} />

      {/* ── Privacy Promise ───────────────────────────────────────────── */}
      <section style={{ backgroundColor: isDark ? theme.surfaceSubtle : '#f0fdf4', borderTop: `1px solid ${theme.borderSubtle}`, borderBottom: `1px solid ${theme.borderSubtle}`, padding: '56px 24px' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ color: '#15803d', display: 'flex', justifyContent: 'center', marginBottom: '16px' }}><ShieldIcon /></div>
          <h2 style={{ fontFamily: FONT_SERIF, fontSize: '26px', fontWeight: '900', color: theme.textHeading, margin: '0 0 14px' }}>
            Our Privacy Promise
          </h2>
          <p style={{ fontSize: '15.5px', color: theme.textMuted, lineHeight: '1.75', margin: 0 }}>
            <strong style={{ color: theme.textHeading }}>IVA never stores your physical documents.</strong> We only track document availability checkmarks locally — on your device — to evaluate eligibility. Your Aadhaar, PAN, income certificate, and all other documents remain yours. IVA is a navigator, not a vault.
          </p>
        </div>
      </section>

      {/* ── Team ──────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: '800px', margin: '0 auto', padding: '72px 24px' }}>
        <h2 style={{ fontFamily: FONT_SERIF, fontSize: 'clamp(24px, 4vw, 34px)', fontWeight: '900', color: theme.textHeading, margin: '0 0 14px', textAlign: 'center' }}>
          The Team Behind IVA
        </h2>
        <p style={{ fontSize: '15.5px', color: theme.textMuted, textAlign: 'center', marginBottom: '44px', lineHeight: '1.65' }}>
          Two builders with one mission — making welfare accessible to every Indian.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
          {[
            { name: 'Nistha Leua', role: 'Co-Founder & Product', note: 'Drives citizen experience, multilingual design, and product strategy.' },
            { name: 'Jaydev Arapada', role: 'Co-Founder & Engineering', note: 'Architects the AI eligibility engine, backend systems, and data pipeline.' },
          ].map((person, i) => (
            <div key={person.name} style={{ backgroundColor: theme.surface, borderRadius: '22px', padding: '32px', border: `1.5px solid ${theme.border}`, textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.05)', animation: `fadeUp 0.35s ${i * 0.1}s ease both` }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryHover})`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', color: theme.textInverse, boxShadow: '0 4px 16px rgba(0,0,0,0.14)' }}>
                <UserIcon />
              </div>
              <h3 style={{ fontFamily: FONT_SERIF, fontSize: '20px', fontWeight: '900', color: theme.textHeading, margin: '0 0 4px' }}>{person.name}</h3>
              <div style={{ fontSize: '13px', fontWeight: '700', color: theme.primary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>{person.role}</div>
              <p style={{ fontSize: '14px', color: theme.textMuted, lineHeight: '1.65', margin: 0 }}>{person.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Footer ────────────────────────────────────────────────── */}
      <section style={{ backgroundColor: theme.surface, borderTop: `1px solid ${theme.borderSubtle}`, padding: '64px 24px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: FONT_SERIF, fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: '900', color: theme.textHeading, margin: '0 0 14px' }}>
          Ready to find your schemes?
        </h2>
        <p style={{ fontSize: '15.5px', color: theme.textMuted, maxWidth: '420px', margin: '0 auto 32px', lineHeight: '1.65' }}>
          It takes 3 minutes to set up your profile. The rest is automatic.
        </p>
        <button
          onClick={() => onNavigate('/wizard')}
          style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryHover})`, color: theme.textInverse, border: 'none', padding: '15px 32px', borderRadius: '14px', fontSize: '16px', fontWeight: '800', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 6px 20px rgba(113,131,85,0.32)', transition: 'all 0.18s ease' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(113,131,85,0.42)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(113,131,85,0.32)'; }}
        >
          Get Started — Free Forever <ArrowRightIcon />
        </button>
      </section>
    </div>
  );
};
