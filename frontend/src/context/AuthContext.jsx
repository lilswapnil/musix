import React, { useState, useEffect, useMemo } from 'react';
import { getAccessToken, getUserProfile, getRefreshToken, removeAccessToken } from '../utils/tokenStorage';
import { ensureValidToken } from '../utils/refreshToken';
import { AuthContext } from './useAuth';

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to check if we have valid session data
  const hasValidSession = () => {
    const token = getAccessToken();
    const refreshToken = getRefreshToken();
    const profile = getUserProfile();
    
    return !!token && !!refreshToken && !!profile;
  };

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      
      try {
        // Quick check for valid session data
        if (hasValidSession()) {
          // Try to get a valid token and refresh if needed
          const token = await ensureValidToken();
          const profile = getUserProfile();
          
          if (token && profile) {
            try {
              // Validate token is actually working
              const validateRes = await fetch('https://api.spotify.com/v1/me', {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              
              if (validateRes.status === 403 || validateRes.status === 401) {
                // Token is invalid; clear silently and redirect to login
                removeAccessToken();
                setIsAuthenticated(false);
                setUserProfile(null);
                window.location.href = '/login';
                return;
              }
              
              if (validateRes.ok) {
                setIsAuthenticated(true);
                setUserProfile(profile);
              } else {
                setIsAuthenticated(false);
                setUserProfile(null);
              }
              } catch {
              // Network error during validation; clear and redirect
              removeAccessToken();
              setIsAuthenticated(false);
              setUserProfile(null);
              window.location.href = '/login';
            }
          } else {
            setIsAuthenticated(false);
            setUserProfile(null);
          }
        } else {
          setIsAuthenticated(false);
          setUserProfile(null);
        }
      } catch {
        // Silently handle errors; don't show console errors
        setIsAuthenticated(false);
        setUserProfile(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const logout = () => {
    // Clear all Spotify tokens from storage
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
    localStorage.removeItem('spotify_token_expiry');
    localStorage.removeItem('spotify_user_profile');

    // Clear YouTube tokens
    localStorage.removeItem('youtube_access_token');
    localStorage.removeItem('youtube_user_profile');

    // Clear PKCE verifier
    localStorage.removeItem('pkce_code_verifier');

    // Clear any other user-related data
    sessionStorage.removeItem('spotify_state');

    // Update auth state
    setIsAuthenticated(false);
    setUserProfile(null);

    console.log('User successfully logged out');
  };

  const contextValue = useMemo(() => ({
    isAuthenticated,
    isLoading,
    userProfile,
    setUserProfile,
    setIsAuthenticated,
    logout
  }), [isAuthenticated, isLoading, userProfile]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
