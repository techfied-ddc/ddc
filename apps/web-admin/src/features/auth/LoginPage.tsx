import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard, Button, useLiquidGlass } from '@ddc/ui';
import { Role } from '@ddc/shared';
import { api, ApiError } from '../../lib/api.js';
import { useAuthStore } from '../../stores/auth.store.js';

interface LoginResponse {
  data: {
    accessToken: string;
    user: { _id: string; name: string; email: string; role: Role };
  };
}

export default function LoginPage() {
  const setAuth   = useAuthStore((s) => s.setAuth);
  const navigate  = useNavigate();
  const canvasRef = useLiquidGlass({ intensity: 0.05 });

  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || loading) return;
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/api/v1/auth/email/login', { email, password }) as LoginResponse;
      const { accessToken, user: u } = res.data;

      if (u.role !== Role.ADMIN && u.role !== Role.SUPER_ADMIN) {
        setError('Access denied. Admin credentials required.');
        setLoading(false);
        return;
      }

      setAuth({ id: u._id, name: u.name, email: u.email, role: u.role }, accessToken);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed. Please check your credentials.');
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
          <h1 className="font-display text-3xl font-light text-[var(--text-primary)]">Admin Panel</h1>
          <p className="text-sm text-[var(--text-muted)] mt-2">Authorized personnel only.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.1 }}>
          <GlassCard className="p-6">
            <form onSubmit={handleLogin} className="space-y-5" noValidate>
              <div className="space-y-2">
                <label htmlFor="email" className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  autoComplete="email"
                  autoFocus
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="admin@desiredrycleaning.in"
                  className="w-full h-12 px-4 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] text-sm placeholder:text-[var(--text-subtle)] outline-none focus:border-[var(--gold)] transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  autoComplete="current-password"
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  className="w-full h-12 px-4 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] text-sm placeholder:text-[var(--text-subtle)] outline-none focus:border-[var(--gold)] transition-colors"
                />
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p
                    key="err"
                    className="text-sm text-[var(--danger)]"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <Button type="submit" className="w-full" size="lg" loading={loading} disabled={!email || !password}>
                Sign in
              </Button>
            </form>
          </GlassCard>
        </motion.div>

        <p className="text-center text-xs text-[var(--text-subtle)]">
          Need access?{' '}
          <a href="mailto:techfied.desiredrycleaning@gmail.com" className="text-[var(--gold)] hover:opacity-80">
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}
