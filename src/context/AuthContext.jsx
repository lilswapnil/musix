import React, { createContext, useState, useContext, useEffect } from 'react';
import { getToken, setToken, removeToken } from '../utils/tokenStorage';
import { generatePKCEChallenge } from '../utils/pkceUtils';

// Create auth context
const AuthContext = createContext(null);

// Spotify API configuration
const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = import.meta.env.MODE === 'development'
  ? import.meta.env.VITE_SPOTIFY_LOCAL_REDIRECT_URI
  : import.meta.env.VITE_SPOTIFY_REDIRECT_URI.replace(/#/g, '%23');
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
    const codeVerifier = pkceData.codeVerifier || pkceData;
    const codeChallenge = pkceData.codeChallenge || pkceData;

    // Store the code_verifier in localStorage
    localStorage.setItem('pkce_code_verifier', codeVerifier);

    // Construct the authorization URL
    const authUrl = `https://accounts.spotify.com/authorize?` +
      `client_id=${CLIENT_ID}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
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