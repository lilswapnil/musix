import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAccessToken, getUserProfile, getRefreshToken, clearAuthData } from '../utils/tokenStorage';
import { ensureValidToken } from '../utils/refreshToken';

export const AuthContext = createContext();

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

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      isLoading,
      userProfile, 
      setUserProfile,
      setIsAuthenticated 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);