import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/auth.store.js';
import { subscribeToPush } from '../../lib/push.js';
import { connectSocket, disconnectSocket } from '../../lib/socket.js';
import { AppBar, AppBarSpacer, BottomTabBar, BottomTabBarSpacer } from '@ddc/ui';
import { Role } from '@ddc/shared';
import type { TabItem } from '@ddc/ui';

const LayoutIcon  = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>;
const PackageIcon = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12"/></svg>;
const TruckIcon   = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/><rect x="9" y="11" width="14" height="10" rx="2"/><circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/></svg>;
const UserIcon    = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const ClockIcon   = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>;
const CashIcon    = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3H8L2 7h20l-6-4z"/><circle cx="12" cy="14" r="2"/></svg>;

const STORE_TABS: TabItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutIcon /> },
  { key: 'orders',    label: 'Orders',    icon: <PackageIcon /> },
  { key: 'riders',    label: 'Riders',    icon: <TruckIcon /> },
  { key: 'payouts',   label: 'Payouts',   icon: <CashIcon /> },
];

const RIDER_TABS: TabItem[] = [
  { key: 'jobs',    label: 'Jobs',    icon: <PackageIcon /> },
  { key: 'history', label: 'History', icon: <ClockIcon /> },
  { key: 'profile', label: 'Profile', icon: <UserIcon /> },
];

const STORE_ROUTES: Record<string, string> = { dashboard: '/', orders: '/orders', riders: '/riders', payouts: '/payouts' };
const RIDER_ROUTES: Record<string, string> = { jobs: '/rider', history: '/rider/history', profile: '/rider/profile' };

function storePathToTab(path: string): string {
  if (path.startsWith('/orders'))  return 'orders';
  if (path.startsWith('/riders'))  return 'riders';
  if (path.startsWith('/payouts')) return 'payouts';
  return 'dashboard';
}
function riderPathToTab(path: string): string {
  if (path.startsWith('/rider/history')) return 'history';
  if (path.startsWith('/rider/profile')) return 'profile';
  return 'jobs';
}

export default function AppLayout() {
  const user        = useAuthStore((s) => s.user);
  const fetchMe     = useAuthStore((s) => s.fetchMe);
  const navigate    = useNavigate();
  const location    = useLocation();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Always run on mount: restores access token via refresh cookie and refreshes user data.
    fetchMe().then(() => {
      if (!useAuthStore.getState().user) navigate('/login', { replace: true });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Request push notification permission once user is known
  useEffect(() => {
    if (user) subscribeToPush().catch(() => undefined);
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Real-time order updates — join the store room so all staff see live changes
  useEffect(() => {
    if (!user?.storeId) return;
    connectSocket(user.storeId, queryClient);
    return () => { disconnectSocket(); };
  }, [user?.storeId, queryClient]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--bg-void)] flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[var(--gold)] border-t-transparent animate-spin" />
      </div>
    );
  }

  const isRider = user.role === Role.RIDER;
  const tabs     = isRider ? RIDER_TABS : STORE_TABS;
  const routes   = isRider ? RIDER_ROUTES : STORE_ROUTES;
  const activeTab = isRider
    ? riderPathToTab(location.pathname)
    : storePathToTab(location.pathname);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-void)]">
      <AppBar title={isRider ? 'Rider Dashboard' : 'Store Platform'} scrolled />
      <AppBarSpacer />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
        <BottomTabBarSpacer />
      </main>
      <BottomTabBar
        tabs={tabs}
        activeKey={activeTab}
        onChange={(key) => navigate(routes[key] ?? '/')}
      />
    </div>
  );
}
