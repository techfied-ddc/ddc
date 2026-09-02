import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, OtpInput, GlassCard } from '@ddc/ui';
import { api, ApiError } from '../../lib/api.js';
import { useAuthStore } from '../../stores/auth.store.js';
import type { Role } from '@ddc/shared';

const OTP_RESEND_SECONDS = 30;

interface LocationState { phone?: string }
interface VerifyResponse { data: { accessToken: string; user: { _id: string; role: Role; storeId?: string } } }

export default function OtpVerifyPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const setAuth   = useAuthStore((s) => s.setAuth);

  const phone = (location.state as LocationState)?.phone ?? '';

  const [otp, setOtp]           = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [countdown, setCountdown] = useState(OTP_RESEND_SECONDS);
  const [resending, setResending] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>(null!);

  useEffect(() => {
    if (!phone) { navigate('/login', { replace: true }); return; }
    startCountdown();
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone]);

  const startCountdown = () => {
    clearInterval(timerRef.current);
    setCountdown(OTP_RESEND_SECONDS);
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(timerRef.current); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const handleVerify = async (value: string) => {
    if (value.length !== 6 || loading) return;
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/api/v1/auth/otp/verify', { phone, otp: value }) as VerifyResponse;
      const { accessToken, user: u } = res.data;
      setAuth({ id: u._id, role: u.role, storeId: u.storeId ?? null }, accessToken);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Verification failed. Please try again.');
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    setError('');
    try {
      await api.post('/api/v1/auth/otp/send', { phone });
      startCountdown();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not resend OTP. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const maskedPhone = phone.length > 4
    ? `${phone.slice(0, 3)}${'•'.repeat(phone.length - 7)}${phone.slice(-4)}`
    : phone;

  return (
    <GlassCard className="p-6 space-y-6">
      <div>
        <button
          onClick={() => navigate('/login')}
          className="text-xs text-[var(--gold)] mb-4 flex items-center gap-1 hover:opacity-80 transition-opacity"
        >
          ← Change number
        </button>
        <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">
          Enter the code
        </h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          A 6-digit code was sent to{' '}
          <span className="font-mono text-[var(--text-primary)]">{maskedPhone}</span>.
        </p>
      </div>

      {/* OTP boxes */}
      <OtpInput
        length={6}
        value={otp}
        onChange={(v) => { setOtp(v); if (error) setError(''); }}
        onComplete={handleVerify}
        disabled={loading}
      />

      <AnimatePresence>
        {error && (
          <motion.p
            key="err"
            className="text-sm text-[var(--danger)] text-center"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <Button
        className="w-full"
        size="lg"
        loading={loading}
        disabled={otp.length !== 6}
        onClick={() => handleVerify(otp)}
      >
        Verify
      </Button>

      {/* Resend */}
      <p className="text-center text-sm text-[var(--text-muted)]">
        Didn&apos;t receive it?{' '}
        {countdown > 0 ? (
          <span className="font-mono text-[var(--text-subtle)]">
            Resend in {countdown}s
          </span>
        ) : (
          <button
            onClick={handleResend}
            disabled={resending}
            className="text-[var(--gold)] hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            {resending ? 'Sending…' : 'Resend OTP'}
          </button>
        )}
      </p>
    </GlassCard>
  );
}
