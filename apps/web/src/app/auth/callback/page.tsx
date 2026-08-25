"use client";

import { useEffect, useState, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { api, setAuthToken } from '../../../lib/api';
import { readPendingSignup, clearPendingSignup, type PendingSignup } from '../../../lib/pendingSignup';
import { markLoginTimestamp } from '../../../lib/sessionTimeout';
import { saveRememberedAccount } from '../../../lib/rememberedAccount';
import type { Session } from '@supabase/supabase-js';

function AuthCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [statusMessage, setStatusMessage] = useState('Verifying your email...');
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [destinationUrl, setDestinationUrl] = useState('/');
  const processedRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    async function finishAuthSession(session: Session, next: string) {
      if (processedRef.current) return;
      processedRef.current = true;
      setStatusMessage('Setting up your profile...');

      let pending = readPendingSignup();
      if (!pending && session.user?.user_metadata?.displayName && session.user?.user_metadata?.phoneNumber) {
        const meta = session.user.user_metadata;
        // email is now explicitly stored in user_metadata (see AuthPages.tsx signUp call), so
        // this reconstruction works even when localStorage is unavailable (different tab/device).
        const resolvedEmail = session.user.email || meta.email || '';
        if (resolvedEmail) {
          pending = {
            displayName: meta.displayName,
            username: meta.username || meta.displayName.toLowerCase().replace(/\s+/g, '_'),
            phoneNumber: meta.phoneNumber,
            email: resolvedEmail,
            profile: meta.profile,
            rememberMe: meta.rememberMe ?? false,
          };
        } else {
          console.warn('[Callback] Cannot reconstruct pending signup: email missing from both session.user.email and user_metadata.email');
        }
      }

      // After confirmation and auth, redirect directly to homepage ('/').
      const destination = next && next !== '/profile/schemes-for-me' ? next : '/';

      if (pending) {
        try {
          const result = await api.auth.signupComplete({
            supabaseAccessToken: session.access_token,
            ...pending,
          });
          clearPendingSignup();
          setAuthToken(result.token);
          markLoginTimestamp();
          if (pending.rememberMe) {
            saveRememberedAccount(pending.email);
          }
        } catch (err: unknown) {
          // Log the real error so it's visible in the browser console for debugging.
          console.error('[Callback] signupComplete failed:', err);
          console.warn('[Callback] Falling back to sessionExchange (user may already exist)');
          try {
            const ex = await api.auth.sessionExchange({ supabaseAccessToken: session.access_token });
            setAuthToken(ex.token);
            markLoginTimestamp();
          } catch (exErr) {
            console.error('[Callback] sessionExchange also failed — user may not exist in public.users yet:', exErr);
          }
        }
      } else {
        try {
          const ex = await api.auth.sessionExchange({ supabaseAccessToken: session.access_token });
          setAuthToken(ex.token);
          markLoginTimestamp();
        } catch (exErr) {
          console.warn('[Callback] sessionExchange failed for existing user:', exErr);
        }
      }

      if (mounted) {
        setStatusMessage('Email Confirmed Successfully!');
        setDestinationUrl(destination);
        setIsSuccess(true);
      }
    }

    async function handleAuth() {
      // Check for error in hash params (#error=...&error_description=...)
      if (typeof window !== 'undefined' && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const hashError = hashParams.get('error_description') || hashParams.get('error');
        if (hashError) {
          setError(decodeURIComponent(hashError));
          setTimeout(() => {
            if (mounted) window.location.href = '/?error=auth-callback-failed';
          }, 3000);
          return;
        }
      }

      const code = searchParams?.get('code');
      const next = searchParams?.get('next') ?? '/';

      // 1. If a PKCE authorization code is present, try exchanging it ourselves — the fast path
      // when we win the race described below.
      //
      // IMPORTANT: the Supabase client (lib/supabaseClient.ts) is configured with
      // `detectSessionInUrl: true`, which means it ALSO tries to detect and consume this same
      // one-time-use code automatically, in the background, as soon as it initializes on this
      // page. Whichever of the two wins is fine — but if the automatic detection wins the race,
      // our own exchangeCodeForSession call below fails (the code was already redeemed), and that
      // failure does NOT mean the citizen isn't signed in. Treat it as "maybe already handled" and
      // fall through to steps 2-4 instead of showing an error and bouncing them away — that was
      // the actual bug: a citizen who WAS successfully confirmed still saw "Authentication Failed".
      if (code) {
        try {
          const { data, error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
          if (!exchangeErr && data.session) {
            await finishAuthSession(data.session, next);
            return;
          }
          if (exchangeErr) {
            console.warn('[Callback] exchangeCodeForSession failed (may already be handled by detectSessionInUrl):', exchangeErr.message);
          }
        } catch (err: unknown) {
          console.warn('[Callback] exchangeCodeForSession threw (may already be handled by detectSessionInUrl):', err instanceof Error ? err.message : err);
        }
      }

      // 2. Check if a session already exists (covers detectSessionInUrl having won the race above)
      const { data: initialData } = await supabase.auth.getSession();
      if (initialData.session) {
        await finishAuthSession(initialData.session, next);
        return;
      }

      // 3. Listen for asynchronous hash/PKCE token processing
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED')) {
          authListener.subscription.unsubscribe();
          if (mounted) {
            await finishAuthSession(session, next);
          }
        }
      });

      // 4. Only after truly exhausting every path (manual exchange, existing session, and a real
      // chance for the automatic listener to fire) do we treat this as a genuine failure.
      const timeoutId = setTimeout(() => {
        authListener.subscription.unsubscribe();
        if (mounted && !processedRef.current) {
          setError('Could not verify your email confirmation link. It may have expired or already been used — please request a new confirmation email and try again.');
          setTimeout(() => {
            if (mounted) window.location.href = '/?error=auth-callback-failed';
          }, 3000);
        }
      }, 6000);

      return () => {
        clearTimeout(timeoutId);
        authListener.subscription.unsubscribe();
      };
    }

    handleAuth();

    return () => {
      mounted = false;
    };
  }, [router, searchParams]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {error ? (
        <div style={{ color: '#ef4444', textAlign: 'center', maxWidth: '420px', padding: '24px', borderRadius: '16px', background: '#fee2e2', border: '1px solid #fca5a5' }}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 800 }}>Authentication Failed</h2>
          <p style={{ margin: '0 0 12px 0', fontSize: '14px', lineHeight: 1.5 }}>{error}</p>
          <p style={{ margin: 0, fontSize: '13px', color: '#991b1b' }}>Redirecting you back...</p>
        </div>
      ) : isSuccess ? (
        <div style={{ color: '#16a34a', textAlign: 'center', maxWidth: '420px', padding: '32px', borderRadius: '16px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <div style={{ width: '56px', height: '56px', margin: '0 auto 16px', backgroundColor: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg style={{ width: '32px', height: '32px', color: '#16a34a' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '22px', fontWeight: 800, color: '#15803d' }}>{statusMessage}</h2>
          <p style={{ margin: '0 0 24px 0', fontSize: '15px', color: '#166534' }}>Your account has been successfully verified.</p>
          <button
            onClick={() => { window.location.href = destinationUrl; }}
            style={{
              padding: '12px 24px',
              backgroundColor: '#16a34a',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 700,
              cursor: 'pointer',
              width: '100%',
              boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.2)'
            }}
          >
            Continue to Homepage
          </button>
        </div>
      ) : (
        <div style={{ color: '#374151', textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #e5e7eb', borderTopColor: '#16a34a', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <h2 style={{ margin: '0 0 6px 0', fontSize: '20px', fontWeight: 800 }}>{statusMessage}</h2>
          <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>Please wait a moment while we securely log you in.</p>
        </div>
      )}
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <AuthCallbackHandler />
    </Suspense>
  );
}
