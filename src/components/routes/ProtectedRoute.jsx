import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAccessToken } from '../../utils/tokenStorage';
import LoadingSpinner from '../common/ui/LoadingSpinner';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const [directAccess, setDirectAccess] = useState(false);
  const location = useLocation();
  
  useEffect(() => {
    // Check for token directly to avoid unnecessary redirects
    const token = getAccessToken();
    if (token) {
      setDirectAccess(true);
    }
  }, []);
  
  if (loading && !directAccess) {
    return <LoadingSpinner message="Checking authentication..." />;
  }
  
  if (!isAuthenticated && !directAccess) {
    // Store the attempted path for redirect after login
    localStorage.setItem('app_redirect_location', location.pathname);
    return <Navigate to="/login" replace />;
  }
  
  return children;
}