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

const LoginPage             = lazy(() => import('./features/auth/LoginPage.js'));
const AppLayout             = lazy(() => import('./features/layout/AppLayout.js'));
const StoreDashboard        = lazy(() => import('./features/store/StoreDashboard.js'));
const StoreOrdersPage       = lazy(() => import('./features/orders/StoreOrdersPage.js'));
const StoreOrderDetailPage  = lazy(() => import('./features/orders/StoreOrderDetailPage.js'));
const RidersPage            = lazy(() => import('./features/riders/RidersPage.js'));
const RiderHome             = lazy(() => import('./features/rider/RiderHome.js'));
const StorePayoutsPage      = lazy(() => import('./features/payouts/StorePayoutsPage.js'));
const StoreProfilePage      = lazy(() => import('./features/store/StoreProfilePage.js'));

const Loader = () => (
  <div className="min-h-screen flex items-center justify-center bg-[var(--bg-void)]">
    <div className="w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
  </div>
);

const w = (el: React.ReactNode) => <Suspense fallback={<Loader />}>{el}</Suspense>;

const router = createBrowserRouter([
  { path: '/login', element: w(<LoginPage />) },
  {
    element: w(<AppLayout />),
    children: [
      { path: '/',              element: w(<StoreDashboard />) },
      { path: '/orders',        element: w(<StoreOrdersPage />) },
      { path: '/orders/:id',    element: w(<StoreOrderDetailPage />) },
      { path: '/riders',        element: w(<RidersPage />) },
      { path: '/rider',         element: w(<RiderHome />) },
      { path: '/rider/history', element: w(<RiderHome />) },
      { path: '/rider/profile', element: w(<StoreProfilePage />) },
      { path: '/profile',       element: w(<StoreProfilePage />) },
      { path: '/payouts',       element: w(<StorePayoutsPage />) },
      { path: '*',              element: <Navigate to="/" replace /> },
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
