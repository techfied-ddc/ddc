import { createBrowserRouter, Navigate } from 'react-router-dom';
import React, { lazy, Suspense } from 'react';

// Lazy-loaded route components (to be built in Phase 1+)
const AuthLayout       = lazy(() => import('./features/auth/AuthLayout.js'));
const LoginPage        = lazy(() => import('./features/auth/LoginPage.js'));
const OtpVerifyPage    = lazy(() => import('./features/auth/OtpVerifyPage.js'));
const AppLayout        = lazy(() => import('./features/layout/AppLayout.js'));
const HomePage         = lazy(() => import('./features/home/HomePage.js'));
const CatalogPage      = lazy(() => import('./features/catalog/CatalogPage.js'));
const CheckoutPage     = lazy(() => import('./features/checkout/CheckoutPage.js'));
const OrdersPage       = lazy(() => import('./features/orders/OrdersPage.js'));
const OrderDetailPage  = lazy(() => import('./features/orders/OrderDetailPage.js'));
const OtpDisplayPage   = lazy(() => import('./features/orders/OtpDisplayPage.js'));
const InvoicePayPage   = lazy(() => import('./features/orders/InvoicePayPage.js'));
const ProfilePage      = lazy(() => import('./features/profile/ProfilePage.js'));
const SupportPage      = lazy(() => import('./features/support/SupportPage.js'));
const TicketDetailPage = lazy(() => import('./features/support/TicketDetailPage.js'));

const Loader = () => (
  <div className="min-h-screen flex items-center justify-center bg-[var(--bg-void)]">
    <div className="w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
  </div>
);

const withSuspense = (el: React.ReactNode) => (
  <Suspense fallback={<Loader />}>{el}</Suspense>
);

export const router = createBrowserRouter([
  // Public auth routes
  {
    element: withSuspense(<AuthLayout />),
    children: [
      { path: '/login',      element: withSuspense(<LoginPage />) },
      { path: '/login/otp',  element: withSuspense(<OtpVerifyPage />) },
    ],
  },
  // Protected app routes
  {
    element: withSuspense(<AppLayout />),
    children: [
      { path: '/',                    element: withSuspense(<HomePage />) },
      { path: '/catalog',             element: withSuspense(<CatalogPage />) },
      { path: '/checkout',            element: withSuspense(<CheckoutPage />) },
      { path: '/orders',              element: withSuspense(<OrdersPage />) },
      { path: '/orders/:id',          element: withSuspense(<OrderDetailPage />) },
      { path: '/orders/:id/otp',      element: withSuspense(<OtpDisplayPage />) },
      { path: '/orders/:id/invoice',  element: withSuspense(<InvoicePayPage />) },
      { path: '/profile',             element: withSuspense(<ProfilePage />) },
      { path: '/support',             element: withSuspense(<SupportPage />) },
      { path: '/support/:id',         element: withSuspense(<TicketDetailPage />) },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
