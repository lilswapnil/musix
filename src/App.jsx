import React from 'react';
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
import Artist from './features/search/components/Artist';



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
  {
    path: '/callback',
    element: <AuthCallback />
  },
  
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: '/home',
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
      }
    ]
  }
]

const router = createHashRouter(routes);

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}

export default App