import React, { createContext, useState, useContext, useEffect } from 'react';
import { getToken, setToken, removeToken } from '../utils/tokenStorage';
import { generatePKCEChallenge } from '../utils/pkceUtils';
// Create auth context
const AuthContext = createContext(null);

// Spotify API configuration
const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;

const REDIRECT_URI =  import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
const SCOPES = [
        'user-read-private',
        'user-read-email',
        'user-read-currently-playing',
        'user-read-playback-state',
        'user-read-recently-played',
        'user-library-read',
        'user-top-read'
].join('%20');

// Function to redirect to Spotify auth page
export const redirectToSpotify = async () => {
  const codeChallenge = await generatePKCEChallenge();
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=${SCOPES}&response_type=code&code_challenge_method=S256&code_challenge=${codeChallenge}`;
  
  window.location.href = authUrl;
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    //Check if we already have a token
    const storedToken = getToken();
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const login = (userData, accessToken) => {
    setUser(userData);
    setToken(accessToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    removeToken();
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  return useContext(AuthContext);
};