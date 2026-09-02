import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/auth.store.js';
import { subscribeToPush } from '../../lib/push.js';
import { connectSocket, disconnectSocket } from '../../lib/socket.js';
import { AppBar, AppBarSpacer, BottomTabBar, BottomTabBarSpacer } from '@ddc/ui';
import type { TabItem } from '@ddc/ui';

const HomeIcon    = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>;
const PackageIcon = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M16.5 9.4 7.5 4.21M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12"/></svg>;
const HelpIcon    = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const UserIcon    = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;

const TABS: TabItem[] = [
  { key: 'home',    label: 'Home',    icon: <HomeIcon /> },
  { key: 'orders',  label: 'Orders',  icon: <PackageIcon /> },
  { key: 'support', label: 'Help',    icon: <HelpIcon /> },
  { key: 'profile', label: 'Profile', icon: <UserIcon /> },
];

const TAB_ROUTES: Record<string, string> = {
  home:    '/',
  orders:  '/orders',
  support: '/support',
  profile: '/profile',
};

function pathToTab(path: string): string {
  if (path.startsWith('/orders'))  return 'orders';
  if (path.startsWith('/support')) return 'support';
  if (path.startsWith('/profile')) return 'profile';
  return 'home';
}

export default function AppLayout() {
  const user        = useAuthStore((s) => s.user);
  const fetchMe     = useAuthStore((s) => s.fetchMe);
  const navigate    = useNavigate();
  const location    = useLocation();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) {
      fetchMe().then(() => {
        if (!useAuthStore.getState().user) navigate('/login', { replace: true });
      });
    }
  }, [user, fetchMe, navigate]);

  // Request push notification permission once user is known
  useEffect(() => {
    if (user) subscribeToPush().catch(() => undefined);
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Real-time order updates via Socket.IO
  useEffect(() => {
    if (!user) return;
    connectSocket(user.id, queryClient);
    return () => { disconnectSocket(); };
  }, [user?.id, queryClient]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--bg-void)] flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[var(--gold)] border-t-transparent animate-spin" />
      </div>
    );
  }

  const activeTab = pathToTab(location.pathname);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-void)]">
      <AppBar title="Desire Dry Cleaning" scrolled />
      <AppBarSpacer />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
        <BottomTabBarSpacer />
      </main>
      <BottomTabBar
        tabs={TABS}
        activeKey={activeTab}
        onChange={(key) => navigate(TAB_ROUTES[key] ?? '/')}
      />
    </div>
  );
}
