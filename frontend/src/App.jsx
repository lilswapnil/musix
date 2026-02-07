import React, { lazy, Suspense } from 'react';
import './App.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PageSkeleton from './components/common/ui/PageSkeleton';
import RouteErrorBoundary from './components/common/ui/RouteErrorBoundary';
import { musicRoutes } from './routes/musicRoutes';

// Lazy-loaded routes for faster initial load
const AuthCallback = lazy(() => import('./features/auth/components/callback/AuthCallback'));
const Layout = lazy(() => import('./components/layout/Layout'));
const ProtectedRoute = lazy(() => import('./components/routes/ProtectedRoute'));
const LoginPage = lazy(() => import('./features/auth/pages/LoginPage'));
const HomePage = lazy(() => import('./features/home/pages/HomePage'));
const LibraryPage = lazy(() => import('./features/library/pages/LibraryPage'));
const Account = lazy(() => import('./features/account/pages/AccountPage'));
const SearchPage = lazy(() => import('./features/search/pages/SearchPage'));

const withRouteBoundary = (element) => (
  <RouteErrorBoundary>
    <Suspense fallback={<PageSkeleton />}>
      {element}
    </Suspense>
  </RouteErrorBoundary>
);

const routes = [
  // Auth pages without navbar/layout
  {
    index: true,
    element: withRouteBoundary(<LoginPage />)
  },
  {
    path: '/login',
    element: withRouteBoundary(<LoginPage />)
  },
  // Single callback route
  {
    path: '/callback',
    element: withRouteBoundary(<AuthCallback />)
  },
  
  // Main app with layout
  {
    path: "/",
    element: withRouteBoundary(<Layout />),
    children: [
      {
        path: 'home',
        element: withRouteBoundary(<HomePage />)
      },
      {
        path: "my-library",
        element: withRouteBoundary(<ProtectedRoute><LibraryPage /></ProtectedRoute>)
      },
      {
        path: "account",
        element: withRouteBoundary(<ProtectedRoute><Account /></ProtectedRoute>)
      },
      {
        path: "search",
        element: withRouteBoundary(<SearchPage />)
      },
      // ...existing code...
      ...musicRoutes
    ]
  }
];

const router = createBrowserRouter(routes);

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}

export default App