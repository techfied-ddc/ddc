import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, GlassCard } from '@ddc/ui';
import { api, ApiError } from '../../lib/api.js';
import { useAuthStore } from '../../stores/auth.store.js';
import { initGoogleSignIn } from '../../lib/google-auth.js';
import type { Role } from '@ddc/shared';

const GOOGLE_CLIENT_ID = (import.meta.env['VITE_GOOGLE_CLIENT_ID'] as string | undefined) ?? '';

interface GoogleAuthResponse { data: { accessToken: string; userId: string; isNew: boolean } }

export default function LoginPage() {
  const [email,   setEmail]   = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const navigate     = useNavigate();
  const setAuth      = useAuthStore((s) => s.setAuth);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  // ── Google Sign-In ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleBtnRef.current) return;

    let mounted = true;

    async function handleGoogleCredential(response: { credential: string }) {
      if (!mounted) return;
      setError('');
      setLoading(true);
      try {
        const res = await api.post('/api/v1/auth/google', { idToken: response.credential }) as GoogleAuthResponse;
        const { accessToken } = res.data;
        // Fetch user role from /me since /google response may not include it
        const meRes = await api.get('/api/v1/users/me') as { data: { user: { _id: string; role: Role; storeId?: string } } };
        const u = meRes.data.user;
        setAuth({ id: u._id, role: u.role, storeId: u.storeId ?? null }, accessToken);
        navigate('/', { replace: true });
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Google sign-in failed. Please try again.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initGoogleSignIn(GOOGLE_CLIENT_ID, handleGoogleCredential, googleBtnRef.current)
      .catch(() => { /* GIS failed to load — button stays hidden */ });

    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Email OTP ─────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!isValid || loading) return;
    setError('');
    setLoading(true);
    try {
      await api.post('/api/v1/auth/otp/send', { email: email.trim() });
      navigate('/login/otp', { state: { email: email.trim() } });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <GlassCard className="p-6 space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">
          Sign in
        </h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Enter your email address to receive a one-time code.
        </p>
      </div>

      {/* Email input */}
      <div className="space-y-2">
        <label htmlFor="email-input" className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
          Email address
        </label>
        <div className="flex items-center bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 h-14 focus-within:border-[var(--gold)] transition-colors">
          <input
            id="email-input"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError('');
            }}
            onKeyDown={handleKey}
            placeholder="you@example.com"
            className="flex-1 bg-transparent text-[var(--text-primary)] text-base placeholder:text-[var(--text-subtle)] outline-none"
            autoFocus
            autoComplete="email"
          />
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              key="error"
              className="text-sm text-[var(--danger)]"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <Button
        className="w-full"
        size="lg"
        loading={loading}
        disabled={!isValid}
        onClick={handleSend}
      >
        Send OTP
      </Button>

      {/* Google Sign-In — only shown when VITE_GOOGLE_CLIENT_ID is configured */}
      {GOOGLE_CLIENT_ID && (
        <>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="text-xs text-[var(--text-subtle)]">or</span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>

          {/* GIS renders the official Google button into this div */}
          <div ref={googleBtnRef} className="w-full overflow-hidden rounded-xl" aria-label="Sign in with Google" />
        </>
      )}

      <p className="text-center text-xs text-[var(--text-subtle)]">
        By continuing you agree to our{' '}
        <a href="https://desiredrycleaning.in/terms" className="text-[var(--gold)] underline-offset-2 hover:underline">
          Terms
        </a>{' '}
        &{' '}
        <a href="https://desiredrycleaning.in/privacy" className="text-[var(--gold)] underline-offset-2 hover:underline">
          Privacy Policy
        </a>
        .
      </p>
    </GlassCard>
  );
}
