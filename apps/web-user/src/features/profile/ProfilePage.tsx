import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard, Button, Reveal } from '@ddc/ui';
import { useAuthStore } from '../../stores/auth.store.js';
import { useProfile, useUpdateProfile } from '../../lib/api.hooks.js';
import { api, ApiError } from '../../lib/api.js';

// ── Avatar initials ───────────────────────────────────────────────────────────

function AvatarCircle({ name, size = 72 }: { name?: string; size?: number }) {
  const initials = (name ?? '?')
    .split(' ')
    .map((w) => w[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(212,175,55,0.25) 0%, rgba(212,175,55,0.08) 100%)',
        border: '2px solid rgba(212,175,55,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-display)',
        fontSize: size * 0.32,
        fontWeight: 700,
        color: 'var(--gold)',
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

// ── Field row ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {label}
      </span>
      <span style={{ fontSize: 15, color: 'var(--text-primary)', fontFamily: mono ? 'var(--font-mono)' : undefined, wordBreak: 'break-all' }}>
        {value}
      </span>
    </div>
  );
}

// ── Edit profile modal ────────────────────────────────────────────────────────

function EditModal({
  initialName,
  initialEmail,
  onClose,
}: {
  initialName:  string;
  initialEmail: string;
  onClose: () => void;
}) {
  const [name, setName]   = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState('');
  const update = useUpdateProfile();

  const handleSave = async () => {
    if (!name.trim()) { setError('Name cannot be empty.'); return; }
    setError('');
    try {
      await update.mutateAsync({ name: name.trim(), email: email.trim() || undefined });
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Update failed. Try again.');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', padding: '0 16px 16px' }}>
      <motion.div
        style={{ width: '100%', maxWidth: 480 }}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <GlassCard className="p-6 space-y-5">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Edit Profile</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 22, cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}>×</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
                placeholder="Your name"
                style={inputStyle}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="you@example.com"
                style={inputStyle}
                autoComplete="email"
              />
            </div>
          </div>

          {error && <p style={{ fontSize: 13, color: 'var(--danger)', textAlign: 'center' }}>{error}</p>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={secondaryBtn}>Cancel</button>
            <Button className="flex-1" size="md" loading={update.isPending} onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}

// ── Toggle switch ─────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', minHeight: 44 }}>
      <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{label}</span>
      <div
        onClick={onChange}
        role="switch"
        aria-checked={checked}
        style={{
          width: 44,
          height: 26,
          borderRadius: 999,
          background: checked ? 'var(--gold)' : 'rgba(255,255,255,0.1)',
          border: `1px solid ${checked ? 'var(--gold)' : 'var(--glass-border)'}`,
          position: 'relative',
          transition: 'background 0.2s, border-color 0.2s',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 2,
            left: checked ? 20 : 2,
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: checked ? '#0B0B0C' : 'var(--text-muted)',
            transition: 'left 0.2s',
          }}
        />
      </div>
    </label>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const clearAuth    = useAuthStore((s) => s.clearAuth);
  const navigate     = useNavigate();
  const { data: profile, isLoading } = useProfile();

  const [loggingOut, setLoggingOut]   = useState(false);
  const [showEdit, setShowEdit]       = useState(false);
  const [notifySms, setNotifySms]     = useState<boolean | null>(null);
  const [notifyEmail, setNotifyEmail] = useState<boolean | null>(null);

  const resolvedNotifySms   = notifySms   ?? profile?.notifyBySms   ?? true;
  const resolvedNotifyEmail = notifyEmail ?? profile?.notifyByEmail ?? false;

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

  const handleNotifyToggle = async (field: 'sms' | 'email') => {
    const next = field === 'sms' ? !resolvedNotifySms : !resolvedNotifyEmail;
    if (field === 'sms') setNotifySms(next);
    else setNotifyEmail(next);
    try {
      await api.patch('/api/v1/users/me', field === 'sms' ? { notifyBySms: next } : { notifyByEmail: next });
    } catch {
      // revert on failure
      if (field === 'sms') setNotifySms(!next);
      else setNotifyEmail(!next);
    }
  };

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })
    : null;

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg-void)', paddingBottom: 40 }}>
      {/* ── Header ── */}
      <div style={{ padding: '28px 16px 20px' }}>
        <Reveal>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
            My Profile
          </h1>
          {memberSince && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Member since {memberSince}</p>
          )}
        </Reveal>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 520 }}>

        {/* ── Identity card ── */}
        <Reveal delay={0.06}>
          <GlassCard className="p-5">
            {isLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
                <div style={{ width: 28, height: 28, border: '2px solid var(--gold)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Avatar + edit row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <AvatarCircle name={profile?.name} size={60} />
                    <div>
                      <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                        {profile?.name ?? '—'}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                        {profile?.role?.toLowerCase().replace('_', ' ') ?? 'customer'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowEdit(true)}
                    style={{
                      flexShrink: 0,
                      padding: '8px 14px',
                      borderRadius: 10,
                      background: 'rgba(212,175,55,0.1)',
                      border: '1px solid rgba(212,175,55,0.3)',
                      color: 'var(--gold)',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      minHeight: 36,
                    }}
                  >
                    Edit
                  </button>
                </div>

                {/* Contact info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <InfoRow label="Email" value={profile?.email} />
                  <InfoRow label="Phone" value={profile?.phone} />
                </div>
              </div>
            )}
          </GlassCard>
        </Reveal>

        {/* ── Notifications ── */}
        <Reveal delay={0.1}>
          <GlassCard className="p-5">
            <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
              Notifications
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Toggle
                label="SMS updates"
                checked={resolvedNotifySms}
                onChange={() => void handleNotifyToggle('sms')}
              />
              <div style={{ height: 1, background: 'var(--glass-border)' }} />
              <Toggle
                label="Email updates"
                checked={resolvedNotifyEmail}
                onChange={() => void handleNotifyToggle('email')}
              />
            </div>
          </GlassCard>
        </Reveal>

        {/* ── Support shortcut ── */}
        <Reveal delay={0.13}>
          <button
            onClick={() => navigate('/support')}
            style={{
              width: '100%',
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: 16,
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              minHeight: 56,
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <SupportIcon />
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Help &amp; Support</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>Raise a ticket or track your request</p>
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4l4 4-4 4" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </Reveal>

        {/* ── Sign out ── */}
        <Reveal delay={0.16}>
          <Button
            variant="danger"
            className="w-full"
            size="lg"
            loading={loggingOut}
            onClick={handleLogout}
          >
            Sign Out
          </Button>
        </Reveal>
      </div>

      {/* ── Edit modal ── */}
      <AnimatePresence>
        {showEdit && (
          <EditModal
            initialName={profile?.name ?? ''}
            initialEmail={profile?.email ?? ''}
            onClose={() => setShowEdit(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Support icon SVG ──────────────────────────────────────────────────────────
function SupportIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10Z" stroke="var(--gold)" strokeWidth="1.5" />
      <path d="M12 17v-1m0-7a2.5 2.5 0 0 1 0 5" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid var(--glass-border)',
  color: 'var(--text-primary)',
  borderRadius: 10,
  padding: '12px 14px',
  fontSize: 15,
  width: '100%',
  outline: 'none',
  boxSizing: 'border-box',
};

const secondaryBtn: React.CSSProperties = {
  flex: 1,
  background: 'transparent',
  color: 'var(--text-muted)',
  border: '1px solid var(--glass-border)',
  borderRadius: 12,
  padding: '12px 0',
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
  minHeight: 44,
};
