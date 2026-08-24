import React, { useState } from 'react';
import { ThemeColors } from 'shared/constants/theme';
import { api, setAuthToken } from '../../lib/api';

interface AdminLoginIdentity {
  readonly displayName: string;
  readonly role: string;
}

interface AdminLoginProps {
  theme: ThemeColors;
  onLogin: (identity: AdminLoginIdentity) => void;
}

const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export const AdminLogin: React.FC<AdminLoginProps> = ({ theme, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setIsBusy(true);
    setError(null);
    try {
      const response = await api.auth.adminLogin({ email: email.trim(), password });
      setAuthToken(response.token);
      onLogin({ displayName: response.displayName || response.role, role: response.role });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please check your credentials and try again.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: theme.background,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          backgroundColor: theme.surface,
          borderRadius: '24px',
          padding: '40px',
          border: `1.5px solid ${theme.border}`,
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '20px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              overflow: 'hidden',
            }}
          >
            <img src="/logo.png" alt="IVA" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '900', color: theme.textHeading, margin: '0 0 6px 0' }}>
            IVA Admin Portal
          </h2>
          <p style={{ fontSize: '14px', color: theme.textMuted, margin: 0 }}>
            Authorized Personnel Control Room Login
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: theme.textHeading, marginBottom: '6px' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@iva.gov.in"
              required
              style={{
                width: '100%',
                backgroundColor: theme.background,
                color: theme.textHeading,
                border: `1px solid ${theme.border}`,
                borderRadius: '12px',
                padding: '12px 14px',
                fontSize: '15px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: theme.textHeading, marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                backgroundColor: theme.background,
                color: theme.textHeading,
                border: `1px solid ${theme.border}`,
                borderRadius: '12px',
                padding: '12px 14px',
                fontSize: '15px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div style={{ color: theme.alertUrgent, fontSize: '13px', fontWeight: '600' }}>{error}</div>
          )}

          <button
            type="submit"
            disabled={isBusy}
            style={{
              backgroundColor: theme.primary,
              color: theme.textInverse,
              border: 'none',
              padding: '16px',
              borderRadius: '14px',
              fontSize: '16px',
              fontWeight: '800',
              cursor: isBusy ? 'default' : 'pointer',
              marginTop: '12px',
              boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
              opacity: isBusy ? 0.7 : 1,
            }}
          >
            {isBusy ? 'Authenticating…' : 'Authenticate & Open Control Room'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '12px', color: theme.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
          <LockIcon /> 256-bit Encrypted Government Admin Network
        </div>
      </div>
    </div>
  );
};
