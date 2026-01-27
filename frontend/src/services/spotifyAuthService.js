import { generatePKCEChallenge, storeCodeVerifier, getCodeVerifier, clearCodeVerifier } from '../utils/pkceUtils';
import { setAccessToken, setRefreshToken, setUserProfile, getRefreshToken } from '../utils/tokenStorage';

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL;

const persistRefreshTokenInAzure = async (refreshToken) => {
  if (!refreshToken || !BACKEND_BASE_URL) return;

  try {
    await fetch(`${BACKEND_BASE_URL}/api/azure/spotify/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
  } catch (error) {
    console.warn('Failed to persist refresh token in Azure service:', error.message);
  }
};

// Helper function to get consistent redirect URI
const getRedirectUri = () => {
  // Check if running on localhost (development)
  const isLocalhost = window.location.hostname === 'localhost' ||
                      window.location.hostname === '127.0.0.1';

  if (isLocalhost) {
    return import.meta.env.VITE_SPOTIFY_LOCAL_REDIRECT_URI;
  }

  return import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
};

const SCOPES = [
  'user-read-private',
  'user-read-email',
  'user-read-currently-playing',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-recently-played',
  'user-library-read',
  'user-library-modify',
  'user-top-read',
  'playlist-read-private',
  'playlist-read-collaborative',
  'streaming',
].join('%20');

export const redirectToSpotify = async () => {
  try {
    const { codeVerifier, codeChallenge } = await generatePKCEChallenge();
    storeCodeVerifier(codeVerifier);

    const redirectUri = getRedirectUri();
    const authUrl = `https://accounts.spotify.com/authorize?` +
      `client_id=${CLIENT_ID}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${SCOPES}` +
      `&code_challenge_method=S256` +
      `&code_challenge=${codeChallenge}` +
      `&show_dialog=false`;

    window.location.href = authUrl;
  } catch (error) {
    console.error('Error redirecting to Spotify:', error);
    throw new Error(`Failed to initiate Spotify login: ${error.message}`);
  }
};

export const exchangeCodeForToken = async (code) => {
  if (!code) {
    throw new Error('Authorization code is missing.');
  }

  const codeVerifier = getCodeVerifier();
  if (!codeVerifier) {
    throw new Error('Code verifier is missing. Please try logging in again.');
  }

  const redirectUri = getRedirectUri();

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: CLIENT_ID,
        code_verifier: codeVerifier,
      }).toString(),
    });

    const data = await response.json();

    if (response.ok) {
      setAccessToken(data.access_token, data.expires_in);
      setRefreshToken(data.refresh_token);
      persistRefreshTokenInAzure(data.refresh_token);
      clearCodeVerifier();
      await fetchAndStoreUserProfile(data.access_token);
      return data.access_token;
    } else {
      console.error('Token exchange failed:', data);
      const errorMsg = data.error_description || data.error || 'Token exchange failed';
      throw new Error(errorMsg);
    }
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    clearCodeVerifier();
    throw error;
  }
};

// Add new function to fetch user profile
export const fetchAndStoreUserProfile = async (accessToken) => {
  try {
    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (response.ok) {
      const userProfile = await response.json();
      setUserProfile(userProfile);
      return userProfile;
    } else {
      const errorData = await response.json();
      console.error('Failed to fetch user profile:', errorData);
      return null;
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

export const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('Refresh token is missing.');

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: CLIENT_ID,
      }).toString(),
    });

    const data = await response.json();
    if (response.ok) {
      setAccessToken(data.access_token, data.expires_in);
      if (data.refresh_token) setRefreshToken(data.refresh_token);
      return data.access_token;
    } else {
      throw new Error(data.error || 'Token refresh failed.');
    }
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw error;
  }
};