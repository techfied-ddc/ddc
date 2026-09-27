import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard, Button } from '@ddc/ui';
import { api, ApiError } from '../../lib/api.js';
import { useAuthStore } from '../../stores/auth.store.js';
import { useMyProfile, useUpdateMyProfile, useChangePassword } from '../../lib/api.hooks.js';

function AvatarCircle({ name, size = 60 }: { name?: string; size?: number }) {
  const initials = (name ?? '?').split(' ').map((w) => w[0] ?? '').slice(0, 2).join('').toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, rgba(212,175,55,0.25) 0%, rgba(212,175,55,0.08) 100%)',
      border: '2px solid rgba(212,175,55,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontSize: size * 0.32,
      fontWeight: 700, color: 'var(--gold)', flexShrink: 0,
    }}>{initials}</div>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
      <span style={{ fontSize: 14, color: 'var(--text-primary)', wordBreak: 'break-all' }}>{value}</span>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
  color: 'var(--text-primary)', borderRadius: 10, padding: '11px 14px',
  fontSize: 14, width: '100%', outline: 'none', boxSizing: 'border-box',
};

// ── Edit profile modal ────────────────────────────────────────────────────────
function EditModal({ initialName, initialEmail, onClose }: { initialName: string; initialEmail: string; onClose: () => void }) {
  const [name,  setName]  = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState('');
  const update = useUpdateMyProfile();

  const handleSave = async () => {
    if (!name.trim()) { setError('Name cannot be empty.'); return; }
    setError('');
    try {
      await update.mutateAsync({ name: name.trim(), ...(email.trim() ? { email: email.trim() } : {}) });
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Update failed.');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', padding: '0 16px 16px' }}>
      <motion.div style={{ width: '100%', maxWidth: 480 }} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }} transition={{ duration: 0.25 }}>
        <GlassCard className="p-6 space-y-5">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>Edit Profile</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Full Name</label>
              <input type="text" value={name} onChange={(e) => { setName(e.target.value); setError(''); }} style={inputStyle} autoFocus />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Email</label>
              <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }} placeholder="you@example.com" style={inputStyle} />
            </div>
          </div>
          {error && <p style={{ fontSize: 13, color: 'var(--danger)', textAlign: 'center' }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--glass-border)', borderRadius: 12, padding: '12px 0', fontWeight: 600, fontSize: 14, cursor: 'pointer', minHeight: 44 }}>Cancel</button>
            <Button className="flex-1" size="md" loading={update.isPending} onClick={handleSave}>Save</Button>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}

// ── Change password modal ─────────────────────────────────────────────────────
function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [currentPw, setCurrentPw] = useState('');
  const [newPw,     setNewPw]     = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState(false);
  const changePassword = useChangePassword();

  const handleSave = async () => {
    setError('');
    if (newPw.length < 8) { setError('New password must be at least 8 characters.'); return; }
    if (newPw !== confirmPw) { setError('Passwords do not match.'); return; }
    try {
      await changePassword.mutateAsync({ ...(currentPw ? { currentPassword: currentPw } : {}), newPassword: newPw });
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to update password.');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', padding: '0 16px 16px' }}>
      <motion.div style={{ width: '100%', maxWidth: 480 }} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }} transition={{ duration: 0.25 }}>
        <GlassCard className="p-6 space-y-5">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
              {success ? 'Password Updated!' : 'Set / Change Password'}
            </h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
          </div>
          {success ? (
            <p style={{ fontSize: 14, color: 'var(--gold)', textAlign: 'center' }}>✓ Your password has been saved.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Current Password</label>
                <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} placeholder="Leave empty if setting for the first time" style={inputStyle} autoComplete="current-password" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>New Password</label>
                <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="At least 8 characters" style={inputStyle} autoComplete="new-password" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Confirm Password</label>
                <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="Repeat new password" style={inputStyle} autoComplete="new-password" />
              </div>
              {error && <p style={{ fontSize: 13, color: 'var(--danger)', textAlign: 'center' }}>{error}</p>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={onClose} style={{ flex: 1, background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--glass-border)', borderRadius: 12, padding: '12px 0', fontWeight: 600, fontSize: 14, cursor: 'pointer', minHeight: 44 }}>Cancel</button>
                <Button className="flex-1" size="md" loading={changePassword.isPending} disabled={!newPw || !confirmPw} onClick={handleSave}>Save Password</Button>
              </div>
            </div>
          )}
        </GlassCard>
      </motion.div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function StoreProfilePage() {
  const clearAuth  = useAuthStore((s) => s.clearAuth);
  const navigate   = useNavigate();
  const { data, isLoading } = useMyProfile();
  const profile = data?.user;

  const [loggingOut,   setLoggingOut]   = useState(false);
  const [showEdit,     setShowEdit]     = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await api.post('/api/v1/auth/logout'); } catch { /* ignore */ }
    clearAuth();
    navigate('/login', { replace: true });
  };

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })
    : null;

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg-void)', paddingBottom: 40 }}>
      <div style={{ padding: '28px 16px 20px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
          My Profile
        </h1>
        {memberSince && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Member since {memberSince}</p>}
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 520 }}>
        {/* Identity card */}
        <GlassCard className="p-5">
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
              <div style={{ width: 28, height: 28, border: '2px solid var(--gold)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <AvatarCircle name={profile?.name} size={56} />
                  <div>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{profile?.name ?? '—'}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{profile?.role?.toLowerCase().replace('_', ' ') ?? '—'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEdit(true)}
                  style={{ padding: '8px 14px', borderRadius: 10, background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', color: 'var(--gold)', fontSize: 13, fontWeight: 600, cursor: 'pointer', minHeight: 36, flexShrink: 0 }}
                >
                  Edit
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Field label="Email"          value={profile?.email} />
                <Field label="Phone"          value={profile?.phone} />
                <Field label="Vehicle Number" value={profile?.vehicleNumber} />
              </div>
            </div>
          )}
        </GlassCard>

        {/* Password */}
        <button
          onClick={() => setShowPassword(true)}
          style={{ width: '100%', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 16, padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', minHeight: 56, textAlign: 'left' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" stroke="var(--gold)" strokeWidth="1.5"/><path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round"/></svg>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Password</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>Set or change your login password</p>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>

        {/* Sign out */}
        <Button variant="danger" className="w-full" size="lg" loading={loggingOut} onClick={handleLogout}>
          Sign Out
        </Button>
      </div>

      <AnimatePresence>
        {showEdit && profile && (
          <EditModal initialName={profile.name} initialEmail={profile.email ?? ''} onClose={() => setShowEdit(false)} />
        )}
        {showPassword && (
          <ChangePasswordModal onClose={() => setShowPassword(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
