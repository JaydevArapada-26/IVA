import React, { useEffect, useState } from 'react';
import { ThemeColors } from 'shared/constants/theme';

interface EmailConfirmedPageProps {
  theme: ThemeColors;
  onContinue: () => void;
}

const CheckCircleIcon = () => (
  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const SYNC_STEPS = ['Confirming with frontend…', 'Verifying with backend…', 'Writing your profile to the database…', 'Establishing your authenticated session…'];

/**
 * Shown right after a citizen clicks the email confirmation link, in place of silently jumping
 * to the dashboard — the account is already fully signed in behind this screen by the time it
 * renders (App.tsx sets isSignedIn before showing this), so there is never a flash of the guest
 * landing page; this is purely a branded acknowledgement + a deliberate "go to dashboard" step.
 */
export const EmailConfirmedPage: React.FC<EmailConfirmedPageProps> = ({ theme, onContinue }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (stepIndex >= SYNC_STEPS.length - 1) {
      const finishTimer = setTimeout(() => setDone(true), 500);
      return () => clearTimeout(finishTimer);
    }
    const timer = setTimeout(() => setStepIndex((i) => i + 1), 500);
    return () => clearTimeout(timer);
  }, [stepIndex]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.background, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ backgroundColor: theme.surface, borderRadius: '28px', padding: '48px 40px', maxWidth: '440px', width: '100%', textAlign: 'center', border: `1.5px solid ${theme.border}`, boxShadow: '0 12px 40px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '28px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <img src="/logo.png" alt="IVA" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <span style={{ fontSize: '20px', fontWeight: '900', color: theme.textHeading }}>IVA</span>
        </div>

        {!done ? (
          <>
            <div
              style={{
                width: '56px',
                height: '56px',
                margin: '0 auto 24px',
                borderRadius: '50%',
                border: `4px solid ${theme.surfaceSubtle}`,
                borderTopColor: theme.primary,
                animation: 'iva-spin 0.9s linear infinite',
              }}
            />
            <style>{'@keyframes iva-spin { to { transform: rotate(360deg); } }'}</style>
            <h2 style={{ fontSize: '20px', fontWeight: '900', color: theme.textHeading, margin: '0 0 10px 0' }}>
              Confirming Your Account
            </h2>
            <p style={{ fontSize: '14px', color: theme.textMuted, margin: 0, minHeight: '20px' }}>
              {SYNC_STEPS[stepIndex]}
            </p>
          </>
        ) : (
          <>
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
              <CheckCircleIcon />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: '900', color: theme.textHeading, margin: '0 0 10px 0' }}>
              Email Verified
            </h2>
            <p style={{ fontSize: '14px', color: theme.textMuted, margin: '0 0 28px 0', lineHeight: '1.5' }}>
              Your account is confirmed and ready. Welcome to IVA.
            </p>
            <button
              onClick={onContinue}
              style={{
                width: '100%',
                backgroundColor: theme.primary,
                color: '#ffffff',
                border: 'none',
                padding: '15px',
                borderRadius: '14px',
                fontSize: '15px',
                fontWeight: '800',
                cursor: 'pointer',
              }}
            >
              Go to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
};
