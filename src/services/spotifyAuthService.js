import { generatePKCEChallenge, storeCodeVerifier, getCodeVerifier, clearCodeVerifier } from '../utils/pkceUtils';
import { setAccessToken, setRefreshToken, removeAccessToken, removeRefreshToken } from '../utils/tokenStorage';


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
  'user-top-read',
].join('%20');

export const redirectToSpotify = async () => {
  try {
    const { codeVerifier, codeChallenge } = await generatePKCEChallenge();
    storeCodeVerifier(codeVerifier);

    // Store the current app location
    const currentLocation = window.location.pathname + window.location.search;
    localStorage.setItem('app_redirect_location', currentLocation);

    const authUrl = `https://accounts.spotify.com/authorize?` +
      `client_id=${CLIENT_ID}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&scope=${SCOPES}` +
      `&code_challenge_method=S256` +
      `&code_challenge=${codeChallenge}`;

    window.location.href = authUrl;
  } catch (error) {
    console.error('Error redirecting to Spotify:', error);
  }
};

export const exchangeCodeForToken = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  console.log('URL Params:', urlParams.toString());
  const code = urlParams.get('code');
  if (!code) throw new Error('Authorization code is missing.');

  const codeVerifier = getCodeVerifier();
  if (!codeVerifier) throw new Error('Code verifier is missing.');

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        code_verifier: codeVerifier,
      }).toString(),
    });

    const data = await response.json();
    if (response.ok) {
      setAccessToken(data.access_token);
      setRefreshToken(data.refresh_token);
      clearCodeVerifier();
      return data.access_token;
    } else {
      throw new Error(data.error || 'Token exchange failed.');
    }
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    throw error;
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
      setAccessToken(data.access_token);
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