import React, { createContext, useState, useContext, useEffect } from 'react';
import { getAccessToken, getUserProfile, clearAuthData } from '../utils/tokenStorage';

// Create auth context
export const AuthContext = createContext(null);

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load token and profile when component mounts
    const loadAuthData = () => {
      const storedToken = getAccessToken();
      const storedProfile = getUserProfile();
      
      if (storedToken) setToken(storedToken);
      if (storedProfile) setUserProfile(storedProfile);
      
      setLoading(false);
    };
    
    loadAuthData();
    
    // Add event listener to reload auth data when storage changes
    window.addEventListener('storage', loadAuthData);
    
    return () => {
      window.removeEventListener('storage', loadAuthData);
    };
  }, []);

  const logout = () => {
    setToken(null);
    setUserProfile(null);
    clearAuthData();
  };

  return (
    <AuthContext.Provider value={{ 
      token, 
      userProfile, 
      loading, 
      logout,
      isAuthenticated: !!token
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext);