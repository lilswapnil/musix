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
  try {
    // Generate PKCE challenge
    const pkceData = await generatePKCEChallenge();
    
    if (!pkceData || (!pkceData.codeChallenge && typeof pkceData !== 'string')) {
      throw new Error("Failed to generate code challenge");
    }
    
    const codeChallenge = pkceData.codeChallenge || pkceData;
    console.log("Generated code challenge:", codeChallenge);
    
    // Fix: remove quotes from redirect URI in .env file
    const redirectUri = REDIRECT_URI.replace(/['"]/g, '');
    const encodedRedirectUri = encodeURIComponent(redirectUri);
    
    console.log("Using redirect URI:", redirectUri);
    
    // Use proper request format - must use response_type=code for PKCE
    const authUrl = `https://accounts.spotify.com/authorize?` +
      `client_id=${CLIENT_ID}` +
      `&response_type=code` +
      `&redirect_uri=${encodedRedirectUri}` +
      `&scope=${SCOPES}` +
      `&code_challenge_method=S256` +
      `&code_challenge=${codeChallenge}`;
    
    console.log("Redirecting to Spotify with URL:", authUrl);
    
    window.location.href = authUrl;
  } catch (error) {
    console.error("Error initiating Spotify auth:", error);
    alert("Authentication failed. Please try again.");
  }
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