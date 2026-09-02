import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';

import '@fontsource/fraunces/index.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/jetbrains-mono/400.css';
import '@ddc/ui/styles';
import './styles/app.css';

const RootLayout  = lazy(() => import('./layout/RootLayout.js'));
const HomePage    = lazy(() => import('./pages/HomePage.js'));
const ServicesPage = lazy(() => import('./pages/ServicesPage.js'));
const AboutPage   = lazy(() => import('./pages/AboutPage.js'));
const ContactPage = lazy(() => import('./pages/ContactPage.js'));
const TermsPage   = lazy(() => import('./pages/TermsPage.js'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage.js'));

const router = createBrowserRouter([
  {
    element: <Suspense><RootLayout /></Suspense>,
    children: [
      { index: true,        element: <Suspense><HomePage /></Suspense> },
      { path: 'services',   element: <Suspense><ServicesPage /></Suspense> },
      { path: 'about',      element: <Suspense><AboutPage /></Suspense> },
      { path: 'contact',    element: <Suspense><ContactPage /></Suspense> },
      { path: 'terms',      element: <Suspense><TermsPage /></Suspense> },
      { path: 'privacy',    element: <Suspense><PrivacyPage /></Suspense> },
      { path: '*',          element: <Navigate to="/" replace /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
