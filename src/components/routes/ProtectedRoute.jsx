import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAccessToken } from '../../utils/tokenStorage';
import LoadingSpinner from '../common/ui/LoadingSpinner';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [tokenChecked, setTokenChecked] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Check for token directly as the primary authentication method
    const token = getAccessToken();
    setHasToken(!!token);
    setTokenChecked(true);
  }, []);

  // If we've checked for a token and found one, render the children
  if (tokenChecked && hasToken) {
    return children;
  }

  // If we're still checking token or auth context is loading, show loading
  if (!tokenChecked || isLoading) {
    return <LoadingSpinner message="Verifying your session..." />;
  }
  
  // If no token and context confirms not authenticated, redirect to login
  if (!hasToken && !isAuthenticated) {
    localStorage.setItem('app_redirect_location', location.pathname);
    return <Navigate to="/login" replace />;
  }
  
  return children;
}