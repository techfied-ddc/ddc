import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard, Button, Reveal } from '@ddc/ui';
import { useAuthStore } from '../../stores/auth.store.js';
import { api } from '../../lib/api.js';

export default function ProfilePage() {
  const user      = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate  = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await api.post('/api/v1/auth/logout');
    } catch {
      // Ignore — clear client state regardless
    } finally {
      clearAuth();
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
      <Reveal>
        <h1 className="font-display text-2xl text-[var(--text-primary)]">Profile</h1>
      </Reveal>

      <Reveal delay={0.08}>
        <GlassCard className="p-5 space-y-4">
          <div>
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-0.5">Account ID</p>
            <p className="font-mono text-sm text-[var(--text-primary)] break-all">{user?.id ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-0.5">Role</p>
            <p className="text-sm text-[var(--text-primary)] capitalize">{user?.role?.toLowerCase() ?? '—'}</p>
          </div>
        </GlassCard>
      </Reveal>

      <Reveal delay={0.14}>
        <GlassCard className="p-5 space-y-3">
          <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide">Notifications</h2>
          <p className="text-sm text-[var(--text-subtle)]">
            Manage notification preferences in the next release.
          </p>
        </GlassCard>
      </Reveal>

      <Reveal delay={0.2}>
        <Button
          variant="danger"
          className="w-full"
          size="lg"
          loading={loggingOut}
          onClick={handleLogout}
        >
          Sign out
        </Button>
      </Reveal>
    </div>
  );
}
