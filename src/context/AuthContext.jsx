import React, { useState, useEffect } from 'react';
import { getAccessToken, getUserProfile, getRefreshToken } from '../utils/tokenStorage';
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
          console.log("Session data found, validating token");
          // Try to get a valid token and refresh if needed
          const token = await ensureValidToken();
          const profile = getUserProfile();
          
          if (token && profile) {
            setIsAuthenticated(true);
            setUserProfile(profile);
          } else {
            setIsAuthenticated(false);
            setUserProfile(null);
          }
        } else {
          console.log('No valid session data found');
          setIsAuthenticated(false);
          setUserProfile(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
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

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      isLoading,
      userProfile, 
      setUserProfile,
      setIsAuthenticated,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};
