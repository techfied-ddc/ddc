import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard, Button, OtpInput, useLiquidGlass } from '@ddc/ui';
import { Role } from '@ddc/shared';
import { api, ApiError, setAccessToken } from '../../lib/api.js';
import { useAuthStore } from '../../stores/auth.store.js';

const OTP_RESEND_SECONDS = 30;

type Step = 'email' | 'otp';
interface VerifyResponse { data: { accessToken: string; userId: string; isNew: boolean } }
interface MeResponse { data: { user: { _id: string; role: Role; storeId?: string } } }

export default function LoginPage() {
  const setAuth  = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const canvasRef = useLiquidGlass({ intensity: 0.05 });

  const [step, setStep]       = useState<Step>('email');
  const [email, setEmail]     = useState('');
  const [otp, setOtp]         = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(null!);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const startCountdown = () => {
    clearInterval(timerRef.current);
    setCountdown(OTP_RESEND_SECONDS);
    timerRef.current = setInterval(() => {
      setCountdown((c) => { if (c <= 1) { clearInterval(timerRef.current); return 0; } return c - 1; });
    }, 1000);
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  const handleSendOtp = async () => {
    if (!isValidEmail || loading) return;
    setError('');
    setLoading(true);
    try {
      await api.post('/api/v1/auth/otp/send', { email: email.trim() });
      setStep('otp');
      startCountdown();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (value: string) => {
    if (value.length !== 6 || loading) return;
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/api/v1/auth/otp/verify', { email: email.trim(), otp: value }) as VerifyResponse;
      const { accessToken } = res.data;

      // Set token before /me so the request carries the Authorization header
      setAccessToken(accessToken);
      const meRes = await api.get('/api/v1/users/me') as MeResponse;
      const u = meRes.data.user;

      // Guard: only store/rider roles can access this app
      if (u.role !== Role.STORE_OWNER && u.role !== Role.STORE_STAFF && u.role !== Role.RIDER) {
        setError('This app is for store staff and riders only.');
        setLoading(false);
        return;
      }

      setAuth({ id: u._id, role: u.role, storeId: u.storeId ?? null }, accessToken);
      navigate(u.role === Role.RIDER ? '/rider' : '/', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Verification failed. Please try again.');
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-void)] relative overflow-hidden px-5 py-10">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden />

      <div className="relative z-10 w-full max-w-sm space-y-8">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <p className="font-mono text-[10px] tracking-[0.2em] text-[var(--gold)] uppercase mb-2">Desire Premium</p>
          <h1 className="font-display text-3xl font-light text-[var(--text-primary)]">Store Platform</h1>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.1 }}>
          <GlassCard className="p-6 space-y-6">
            <AnimatePresence mode="wait">
              {step === 'email' ? (
                <motion.div key="email" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                  <div>
                    <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">Sign in</h2>
                    <p className="text-sm text-[var(--text-muted)] mt-1">For store owners, staff, and riders.</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide block mb-2">
                      Email address
                    </label>
                    <div className="flex items-center bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 h-14 focus-within:border-[var(--gold)] transition-colors">
                      <input
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
                  </div>
                  {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
                  <Button className="w-full" size="lg" loading={loading} disabled={!isValidEmail} onClick={handleSendOtp}>
                    Send OTP
                  </Button>
                </motion.div>
              ) : (
                <motion.div key="otp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                  <div>
                    <button onClick={() => { setStep('email'); setOtp(''); setError(''); }} className="text-xs text-[var(--gold)] mb-3 block hover:opacity-80">
                      ← Change email
                    </button>
                    <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">Enter the code</h2>
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                      Sent to <span className="font-mono text-[var(--text-primary)]">{email}</span>
                    </p>
                  </div>
                  <OtpInput length={6} value={otp} onChange={(v) => { setOtp(v); setError(''); }} onComplete={handleVerify} disabled={loading} />
                  {error && <p className="text-sm text-[var(--danger)] text-center">{error}</p>}
                  <Button className="w-full" size="lg" loading={loading} disabled={otp.length !== 6} onClick={() => handleVerify(otp)}>
                    Verify
                  </Button>
                  <p className="text-center text-sm text-[var(--text-muted)]">
                    {countdown > 0 ? (
                      <span className="font-mono text-[var(--text-subtle)]">Resend in {countdown}s</span>
                    ) : (
                      <button onClick={async () => { await api.post('/api/v1/auth/otp/send', { email: email.trim() }); startCountdown(); }} className="text-[var(--gold)] hover:opacity-80">
                        Resend OTP
                      </button>
                    )}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
