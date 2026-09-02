import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../stores/auth.store.js';
import { api } from '../../lib/api.js';

interface NavItem { label: string; to: string; icon: string; }

const NAV: NavItem[] = [
  { label: 'Dashboard', to: '/',        icon: '◈' },
  { label: 'Stores',    to: '/stores',  icon: '⊞' },
  { label: 'Orders',    to: '/orders',  icon: '◉' },
  { label: 'Users',     to: '/users',   icon: '◎' },
  { label: 'Catalog',   to: '/catalog', icon: '☰' },
  { label: 'Coupons',   to: '/coupons', icon: '◇' },
  { label: 'Payouts',   to: '/payouts', icon: '◫' },
  { label: 'Tickets',   to: '/tickets', icon: '◪' },
];

export default function AdminLayout() {
  const user     = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const fetchMe  = useAuthStore((s) => s.fetchMe);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut]   = useState(false);

  useEffect(() => {
    if (!user) {
      fetchMe().then(() => {
        if (!useAuthStore.getState().user) navigate('/login', { replace: true });
      });
    }
  }, [user, fetchMe, navigate]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await api.post('/api/v1/auth/logout'); } catch { /* ignore */ }
    clearAuth();
    navigate('/login', { replace: true });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--bg-void)] flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[var(--gold)] border-t-transparent animate-spin" />
      </div>
    );
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 py-6 border-b border-[var(--border)]">
        <p className="font-mono text-[9px] tracking-[0.25em] text-[var(--gold)] uppercase">Desire Premium</p>
        <p className="font-display text-lg text-[var(--text-primary)] mt-0.5">Admin Panel</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[var(--gold)] text-[var(--bg-void)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
              }`
            }
          >
            <span className="text-base w-5 text-center">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div className="border-t border-[var(--border)] px-4 py-4 space-y-1">
        <p className="text-xs text-[var(--text-muted)] truncate">{user.email}</p>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="text-xs text-[var(--danger)] hover:opacity-80 transition-opacity disabled:opacity-50"
        >
          {loggingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[var(--bg-void)]">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 flex-shrink-0 border-r border-[var(--border)] bg-[var(--bg-base)] flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              key="overlay"
              className="fixed inset-0 z-40 bg-black/60 md:hidden"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              key="drawer"
              className="fixed inset-y-0 left-0 z-50 w-64 bg-[var(--bg-base)] border-r border-[var(--border)] md:hidden"
              initial={{ x: -256 }} animate={{ x: 0 }} exit={{ x: -256 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <header className="md:hidden flex items-center gap-3 px-4 h-14 border-b border-[var(--border)] bg-[var(--bg-base)]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 flex flex-col items-center justify-center gap-1.5"
            aria-label="Open menu"
          >
            <span className="w-5 h-px bg-[var(--text-primary)] block" />
            <span className="w-5 h-px bg-[var(--text-primary)] block" />
            <span className="w-5 h-px bg-[var(--text-primary)] block" />
          </button>
          <span className="font-display text-base text-[var(--text-primary)]">Admin</span>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
