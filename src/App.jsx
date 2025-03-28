import React, { useEffect } from 'react';
import './App.css'
import { createHashRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AuthCallback from './features/auth/components/AuthCallback';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/routes/ProtectedRoute';
import LoginPage from './features/auth/pages/LoginPage';
import HomePage from './features/home/pages/HomePage';
import LibraryPage from './features/library/pages/LibraryPage'
import Account from './features/account/pages/AccountPage';
import SearchPage from './features/search/pages/SearchPage';
import Albums from './features/search/components/Albums';
import Artist from './features/search/components/Artists';
import Songs from './features/search/components/Songs';
import { getAccessToken } from './utils/tokenStorage';

const routes = [
  // Auth pages without navbar/layout
  {
    index: true,
    element: <LoginPage />
  },
  {
    path: '/login',
    element: <LoginPage />
  },
  // Single callback route
  {
    path: '/callback',
    element: <AuthCallback />
  },
  
  // Main app with layout
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: 'home',
        element: <HomePage />
      },
      {
        path: "my-library",
        element: <ProtectedRoute><LibraryPage /></ProtectedRoute>
      },
      {
        path: "account",
        element: <ProtectedRoute><Account /></ProtectedRoute>
      },
      {
        path: "search",
        element: <SearchPage />
      },
      {
        path: "album/:albumId",
        element: <Albums />
      },
      {
        path: "artist/:artistId",
        element: <Artist />
      },
      {
        path: "song/:songId",
        element: <Songs />
      }
    ]
  }
];

const router = createHashRouter(routes);

function App() {
  useEffect(() => {
    // Check for token on app start to prevent unnecessary auth checks
    const token = getAccessToken();
    
    // If redirecting from login and token exists, proceed to saved location
    if (token) {
      const savedLocation = localStorage.getItem('app_redirect_location');
      if (savedLocation && window.location.pathname === '/login') {
        localStorage.removeItem('app_redirect_location');
        window.location.hash = savedLocation;
      }
    }
  }, []);
  
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}

export default App