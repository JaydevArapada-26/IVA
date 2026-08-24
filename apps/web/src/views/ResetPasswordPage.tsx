import React, { useState } from 'react';
import { ThemeColors } from 'shared/constants/theme';
import { supabase } from '../lib/supabaseClient';

interface ResetPasswordPageProps {
  theme: ThemeColors;
  onDone: () => void;
}

const CheckCircleIcon = ({ color }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ color: color || '#10b981', flexShrink: 0 }}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
  </svg>
);

const XCircleIcon = ({ color }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ color: color || '#94a3b8', flexShrink: 0 }}>
    <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
  </svg>
);

/** Reached via the link in Supabase's password-recovery email (App.tsx detects the
 * PASSWORD_RECOVERY auth event and renders this exclusively, in place of the normal app shell). */
export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ theme, onDone }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const isValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;
  const isMatching = confirmPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isValid) {
      setError('Please satisfy all password requirements.');
      return;
    }
    if (!isMatching) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        setError(updateError.message || 'Could not update your password. The reset link may have expired.');
        return;
      }
      setDone(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.background, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ backgroundColor: theme.surface, borderRadius: '28px', padding: '44px 40px', maxWidth: '440px', width: '100%', border: `1.5px solid ${theme.border}`, boxShadow: '0 12px 40px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '24px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <img src="/logo.png" alt="IVA" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <span style={{ fontSize: '20px', fontWeight: '900', color: theme.textHeading }}>IVA</span>
        </div>

        {done ? (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '900', color: theme.textHeading, margin: '0 0 10px 0' }}>Password Updated</h2>
            <p style={{ fontSize: '14px', color: theme.textMuted, margin: '0 0 24px 0' }}>You can now sign in with your new password.</p>
            <button
              onClick={onDone}
              style={{ width: '100%', backgroundColor: theme.primary, color: '#ffffff', border: 'none', padding: '15px', borderRadius: '14px', fontSize: '15px', fontWeight: '800', cursor: 'pointer' }}
            >
              Continue
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2 style={{ fontSize: '20px', fontWeight: '900', color: theme.textHeading, margin: '0 0 6px 0', textAlign: 'center' }}>Reset Your Password</h2>
            <p style={{ fontSize: '13.5px', color: theme.textMuted, margin: '0 0 24px 0', textAlign: 'center' }}>Choose a new password for your IVA account.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: theme.textHeading, marginBottom: '6px' }}>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: `1.5px solid ${theme.border}`, backgroundColor: theme.background, color: theme.textHeading, fontSize: '15px', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: theme.textHeading, marginBottom: '6px' }}>Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: `1.5px solid ${confirmPassword ? (isMatching ? '#10b981' : theme.alertUrgent) : theme.border}`, backgroundColor: theme.background, color: theme.textHeading, fontSize: '15px', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>

              <div style={{ backgroundColor: theme.surfaceSubtle, padding: '12px 14px', borderRadius: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12.5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasMinLength ? '#10b981' : theme.textMuted }}>{hasMinLength ? <CheckCircleIcon /> : <XCircleIcon color={theme.textMuted} />}8+ characters</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasUppercase ? '#10b981' : theme.textMuted }}>{hasUppercase ? <CheckCircleIcon /> : <XCircleIcon color={theme.textMuted} />}Uppercase letter</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasLowercase ? '#10b981' : theme.textMuted }}>{hasLowercase ? <CheckCircleIcon /> : <XCircleIcon color={theme.textMuted} />}Lowercase letter</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasNumber ? '#10b981' : theme.textMuted }}>{hasNumber ? <CheckCircleIcon /> : <XCircleIcon color={theme.textMuted} />}Number</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasSpecial ? '#10b981' : theme.textMuted, gridColumn: 'span 2' }}>{hasSpecial ? <CheckCircleIcon /> : <XCircleIcon color={theme.textMuted} />}Special character</div>
              </div>

              {error && <div style={{ color: theme.alertUrgent, fontSize: '13px', fontWeight: 600 }}>{error}</div>}

              <button
                type="submit"
                disabled={busy}
                style={{ backgroundColor: theme.primary, color: '#ffffff', border: 'none', padding: '15px', borderRadius: '14px', fontSize: '15px', fontWeight: '800', cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.7 : 1 }}
              >
                {busy ? 'Updating…' : 'Update Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
