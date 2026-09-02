import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';

import '@fontsource/fraunces/index.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/jetbrains-mono/400.css';
import '@ddc/ui/styles';
import './styles/app.css';

const LoginPage    = lazy(() => import('./features/auth/LoginPage.js'));
const AdminLayout  = lazy(() => import('./features/layout/AdminLayout.js'));
const DashboardPage = lazy(() => import('./features/dashboard/DashboardPage.js'));
const StoresPage   = lazy(() => import('./features/stores/StoresPage.js'));
const OrdersPage   = lazy(() => import('./features/orders/OrdersPage.js'));
const UsersPage    = lazy(() => import('./features/users/UsersPage.js'));
const CatalogPage  = lazy(() => import('./features/catalog/CatalogPage.js'));
const CouponsPage  = lazy(() => import('./features/coupons/CouponsPage.js'));
const TicketsPage  = lazy(() => import('./features/tickets/TicketsPage.js'));
const PayoutsPage  = lazy(() => import('./features/payouts/PayoutsPage.js'));

const Loader = () => (
  <div className="min-h-screen flex items-center justify-center bg-[var(--bg-void)]">
    <div className="w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
  </div>
);

const w = (el: React.ReactNode) => <Suspense fallback={<Loader />}>{el}</Suspense>;

const router = createBrowserRouter([
  { path: '/login', element: w(<LoginPage />) },
  {
    element: w(<AdminLayout />),
    children: [
      { path: '/',          element: w(<DashboardPage />) },
      { path: '/stores',    element: w(<StoresPage />) },
      { path: '/orders',    element: w(<OrdersPage />) },
      { path: '/users',     element: w(<UsersPage />) },
      { path: '/catalog',   element: w(<CatalogPage />) },
      { path: '/coupons',   element: w(<CouponsPage />) },
      { path: '/tickets',   element: w(<TicketsPage />) },
      { path: '/payouts',   element: w(<PayoutsPage />) },
      { path: '*',          element: <Navigate to="/" replace /> },
    ],
  },
]);

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>,
);
