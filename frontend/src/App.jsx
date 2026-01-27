import React, { lazy, Suspense } from 'react';
import './App.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PageSkeleton from './components/common/ui/PageSkeleton';

// Lazy-loaded routes for faster initial load
const AuthCallback = lazy(() => import('./features/auth/components/AuthCallback'));
const Layout = lazy(() => import('./components/layout/Layout'));
const ProtectedRoute = lazy(() => import('./components/routes/ProtectedRoute'));
const LoginPage = lazy(() => import('./features/auth/pages/LoginPage'));
const HomePage = lazy(() => import('./features/home/pages/HomePage'));
const LibraryPage = lazy(() => import('./features/library/pages/LibraryPage'));
const Account = lazy(() => import('./features/account/pages/AccountPage'));
const SearchPage = lazy(() => import('./features/search/pages/SearchPage'));
const Albums = lazy(() => import('./features/search/components/Albums'));
const Artist = lazy(() => import('./features/search/components/Artists'));
const Songs = lazy(() => import('./features/search/components/Songs'));
const Genres = lazy(() => import('./features/search/components/Genres'));

const routes = [
  // Auth pages without navbar/layout
  {
    index: true,
    element: (
      <Suspense fallback={<PageSkeleton />}>
        <LoginPage />
      </Suspense>
    )
  },
  {
    path: '/login',
    element: (
      <Suspense fallback={<PageSkeleton />}>
        <LoginPage />
      </Suspense>
    )
  },
  // Single callback route
  {
    path: '/callback',
    element: (
      <Suspense fallback={<PageSkeleton />}>
        <AuthCallback />
      </Suspense>
    )
  },
  
  // Main app with layout
  {
    path: "/",
    element: (
      <Suspense fallback={<PageSkeleton />}>
        <Layout />
      </Suspense>
    ),
    children: [
      {
        path: 'home',
        element: (
          <Suspense fallback={<PageSkeleton />}>
            <HomePage />
          </Suspense>
        )
      },
      {
        path: "my-library",
        element: (
          <Suspense fallback={<PageSkeleton />}>
            <ProtectedRoute><LibraryPage /></ProtectedRoute>
          </Suspense>
        )
      },
      {
        path: "account",
        element: (
          <Suspense fallback={<PageSkeleton />}>
            <ProtectedRoute><Account /></ProtectedRoute>
          </Suspense>
        )
      },
      {
        path: "search",
        element: (
          <Suspense fallback={<PageSkeleton />}>
            <SearchPage />
          </Suspense>
        )
      },
      {
        path: "album/:albumId",
        element: (
          <Suspense fallback={<PageSkeleton />}>
            <Albums />
          </Suspense>
        )
      },
      {
        path: "artist/:artistId",
        element: (
          <Suspense fallback={<PageSkeleton />}>
            <Artist />
          </Suspense>
        )
      },
      {
        path: "song/:songId",
        element: (
          <Suspense fallback={<PageSkeleton />}>
            <Songs />
          </Suspense>
        )
      },
      {
        path: "genre/:genreName",
        element: (
          <Suspense fallback={<PageSkeleton />}>
            <Genres />
          </Suspense>
        )
      }
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