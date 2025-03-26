import React, { createContext, useState, useContext, useEffect } from 'react';
import { getAccessToken, removeAccessToken } from '../utils/tokenStorage';

// Create auth context
const AuthContext = createContext(null);

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = getAccessToken();
    if (storedToken) setToken(storedToken);
  }, []);

  const logout = () => {
    setToken(null);
    removeAccessToken();
  };

  return (
    <AuthContext.Provider value={{ token, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext);