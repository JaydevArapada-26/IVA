import React, { useState } from 'react';
import type { ThemeColors } from 'shared/constants/theme';
import type { SupportedLanguage } from 'shared/types';
import { getTranslation } from 'shared/i18n/translations';
import { supabase } from '../lib/supabaseClient';
import { FONT_SERIF, ANIM } from '../design/tokens';

const SERIF = FONT_SERIF;

interface PasswordSecurityViewProps {
  theme: ThemeColors;
  language: SupportedLanguage;
  userEmail: string;
}

const SecurityHeaderIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const CheckShieldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

export const PasswordSecurityView: React.FC<PasswordSecurityViewProps> = ({ theme, language, userEmail }) => {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendReset = async () => {
    if (!userEmail) {
      setError('No email address is associated with your account.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: new URL('/auth/callback', window.location.origin).toString(),
      });
      if (resetError) {
        setError(resetError.message || 'Could not send reset email. Please try again.');
        return;
      }
      setSent(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px', animation: ANIM.fadeUp }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <div style={{ color: theme.primary, backgroundColor: theme.surfaceSubtle, border: `1.5px solid ${theme.border}`, borderRadius: '14px', padding: '10px', display: 'flex' }}>
          <SecurityHeaderIcon />
        </div>
        <div>
          <h2 style={{ fontFamily: SERIF, fontSize: '28px', fontWeight: '900', color: theme.textHeading, margin: 0, lineHeight: 1 }}>
            {getTranslation(language, 'profilePasswordSecurity')}
          </h2>
          <p style={{ fontSize: '14px', color: theme.textSubtle, margin: '4px 0 0', fontWeight: '500' }}>Manage your IVA account password</p>
        </div>
      </div>

      {/* Password Reset Card */}
      <div style={{ backgroundColor: theme.surface, borderRadius: '24px', padding: '32px', border: `1.5px solid ${theme.border}`, boxShadow: '0 4px 16px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
        <h3 style={{ fontFamily: SERIF, fontSize: '19px', fontWeight: '800', color: theme.textHeading, margin: '0 0 10px' }}>Reset Password</h3>
        <p style={{ fontSize: '14.5px', color: theme.textMuted, lineHeight: '1.6', margin: '0 0 24px' }}>
          We'll send a secure reset link to <strong style={{ color: theme.textHeading }}>{userEmail}</strong>. Click the link in your email to create a new password.
        </p>

        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', fontWeight: '600', marginBottom: '18px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            ⚠ {error}
          </div>
        )}

        {sent ? (
          <div style={{ backgroundColor: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: '14px', padding: '18px 22px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <div style={{ flexShrink: 0, marginTop: '2px' }}><CheckShieldIcon /></div>
            <div>
              <div style={{ fontFamily: SERIF, fontSize: '16px', fontWeight: '800', color: '#14532d', marginBottom: '5px' }}>{getTranslation(language, 'passwordResetSent')}</div>
              <div style={{ fontSize: '13.5px', color: '#166534', lineHeight: '1.5' }}>Check your inbox at <strong>{userEmail}</strong> and click the link to set a new password.</div>
            </div>
          </div>
        ) : (
          <button
            onClick={handleSendReset}
            disabled={busy}
            style={{
              background: busy ? theme.surfaceSubtle : `linear-gradient(135deg, ${theme.primary}, ${theme.primaryHover})`,
              color: busy ? theme.textSubtle : theme.textInverse,
              border: 'none', borderRadius: '12px',
              padding: '14px 28px', fontSize: '15px', fontWeight: '800',
              cursor: busy ? 'default' : 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              boxShadow: busy ? 'none' : '0 4px 14px rgba(113,131,85,0.3)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { if (!busy) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(113,131,85,0.4)'; } }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = busy ? 'none' : '0 4px 14px rgba(113,131,85,0.3)'; }}
          >
            {busy ? '⋯ Sending…' : getTranslation(language, 'sendPasswordResetEmail')}
          </button>
        )}
      </div>
    </div>
  );
};


