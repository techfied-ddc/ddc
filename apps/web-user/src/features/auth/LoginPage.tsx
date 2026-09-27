import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, GlassCard } from '@ddc/ui';
import { api, ApiError, setAccessToken } from '../../lib/api.js';
import { useAuthStore } from '../../stores/auth.store.js';
import { initGoogleSignIn } from '../../lib/google-auth.js';
import type { Role } from '@ddc/shared';

const GOOGLE_CLIENT_ID = (import.meta.env['VITE_GOOGLE_CLIENT_ID'] as string | undefined) ?? '';

type LoginMode = 'otp' | 'password';

interface AuthResponse { data: { accessToken: string; userId: string; isNew: boolean } }

export default function LoginPage() {
  const [mode,     setMode]     = useState<LoginMode>('otp');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const navigate     = useNavigate();
  const setAuth      = useAuthStore((s) => s.setAuth);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const finishLogin = (accessToken: string) => {
    setAccessToken(accessToken);
    api.get('/api/v1/users/me').then((meRes) => {
      const u = (meRes as { data: { user: { _id: string; role: Role; storeId?: string } } }).data.user;
      setAuth({ id: u._id, role: u.role, storeId: u.storeId ?? null }, accessToken);
      navigate('/', { replace: true });
    }).catch(() => {
      setAccessToken(null);
      setError('Login failed. Please try again.');
      setLoading(false);
    });
  };

  // ── Google Sign-In ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleBtnRef.current) return;
    let mounted = true;

    async function handleGoogleCredential(response: { credential: string }) {
      if (!mounted) return;
      setError('');
      setLoading(true);
      try {
        const res = await api.post('/api/v1/auth/google', { idToken: response.credential }) as AuthResponse;
        finishLogin(res.data.accessToken);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Google sign-in failed. Please try again.');
        if (mounted) setLoading(false);
      }
    }

    initGoogleSignIn(GOOGLE_CLIENT_ID, handleGoogleCredential, googleBtnRef.current)
      .catch(() => undefined);

    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Email OTP ──────────────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (!isValidEmail || loading) return;
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

  // ── Password login ─────────────────────────────────────────────────────────
  const handlePasswordLogin = async () => {
    if (!isValidEmail || !password || loading) return;
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/api/v1/auth/email/login', { email: email.trim(), password }) as AuthResponse;
      finishLogin(res.data.accessToken);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Incorrect email or password.');
      setLoading(false);
    }
  };

  const switchMode = (m: LoginMode) => {
    setMode(m);
    setError('');
    setPassword('');
  };

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex rounded-xl overflow-hidden border border-[var(--border)]">
        {(['otp', 'password'] as LoginMode[]).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className="flex-1 py-2.5 text-sm font-medium transition-colors"
            style={{
              background: mode === m ? 'rgba(212,175,55,0.15)' : 'transparent',
              color:      mode === m ? 'var(--gold)' : 'var(--text-muted)',
              borderRight: m === 'otp' ? '1px solid var(--border)' : 'none',
            }}
          >
            {m === 'otp' ? 'Email OTP' : 'Password'}
          </button>
        ))}
      </div>

      <GlassCard className="p-6 space-y-6">
        <AnimatePresence mode="wait">

          {/* ── OTP mode ── */}
          {mode === 'otp' && (
            <motion.div key="otp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
              <div>
                <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">Sign in with OTP</h2>
                <p className="text-sm text-[var(--text-muted)] mt-1">Enter your email to receive a one-time code.</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="email-otp" className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                  Email address
                </label>
                <div className="flex items-center bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 h-14 focus-within:border-[var(--gold)] transition-colors">
                  <input
                    id="email-otp"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                    placeholder="you@example.com"
                    className="flex-1 bg-transparent text-[var(--text-primary)] text-base placeholder:text-[var(--text-subtle)] outline-none"
                    autoFocus
                    autoComplete="email"
                  />
                </div>
                <AnimatePresence>
                  {error && (
                    <motion.p key="err" className="text-sm text-[var(--danger)]" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <Button className="w-full" size="lg" loading={loading} disabled={!isValidEmail} onClick={handleSendOtp}>
                Send OTP
              </Button>
            </motion.div>
          )}

          {/* ── Password mode ── */}
          {mode === 'password' && (
            <motion.div key="password" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
              <div>
                <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">Sign in</h2>
                <p className="text-sm text-[var(--text-muted)] mt-1">Use your email and password.</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label htmlFor="email-pw" className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide block mb-2">Email</label>
                  <div className="flex items-center bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 h-14 focus-within:border-[var(--gold)] transition-colors">
                    <input
                      id="email-pw"
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && handlePasswordLogin()}
                      placeholder="you@example.com"
                      className="flex-1 bg-transparent text-[var(--text-primary)] text-base placeholder:text-[var(--text-subtle)] outline-none"
                      autoFocus
                      autoComplete="email"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="pw-input" className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide block mb-2">Password</label>
                  <div className="flex items-center bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 h-14 focus-within:border-[var(--gold)] transition-colors">
                    <input
                      id="pw-input"
                      type="password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && handlePasswordLogin()}
                      placeholder="••••••••"
                      className="flex-1 bg-transparent text-[var(--text-primary)] text-base placeholder:text-[var(--text-subtle)] outline-none"
                      autoComplete="current-password"
                    />
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p key="err" className="text-sm text-[var(--danger)]" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <Button className="w-full" size="lg" loading={loading} disabled={!isValidEmail || !password} onClick={handlePasswordLogin}>
                Sign In
              </Button>

              <p className="text-center text-xs text-[var(--text-subtle)]">
                No password?{' '}
                <button onClick={() => switchMode('otp')} className="text-[var(--gold)] hover:underline underline-offset-2">
                  Use Email OTP instead
                </button>
              </p>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Google Sign-In */}
        {GOOGLE_CLIENT_ID && (
          <>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[var(--border)]" />
              <span className="text-xs text-[var(--text-subtle)]">or</span>
              <div className="flex-1 h-px bg-[var(--border)]" />
            </div>
            <div ref={googleBtnRef} className="w-full overflow-hidden rounded-xl" aria-label="Sign in with Google" />
          </>
        )}

        <p className="text-center text-xs text-[var(--text-subtle)]">
          By continuing you agree to our{' '}
          <a href="https://desiredrycleaning.in/terms" className="text-[var(--gold)] underline-offset-2 hover:underline">Terms</a>
          {' '}&amp;{' '}
          <a href="https://desiredrycleaning.in/privacy" className="text-[var(--gold)] underline-offset-2 hover:underline">Privacy Policy</a>.
        </p>
      </GlassCard>
    </div>
  );
}
