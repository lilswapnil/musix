import { getAccessToken, removeAccessToken } from './tokenStorage';
import { refreshAccessToken as refreshSpotifyToken } from '../services/spotifyAuthService';

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || '';

export const ensureValidToken = async () => {
  try {
    // First check if we have a token at all
    const token = getAccessToken();
    if (!token) {
      return null;
    }

    // Validate token by making a test request
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/spotify/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 200) {
        // Token is valid
        return token;
      }
      
      if (response.status === 401) {
        // Token is expired, try to refresh
        return await refreshAccessToken();
      }
      
      return null;
    } catch (validationError) {
      console.error("Error validating token:", validationError);
      return await refreshAccessToken();
    }
  } catch (error) {
    console.error("Token ensure error:", error);
    return null;
  }
};

// This is the function that gets exported as default
export const refreshAccessToken = async () => {
  try {
    const newToken = await refreshSpotifyToken();
    return newToken;
  } catch (error) {
    console.error("Failed to refresh token:", error);
    removeAccessToken();
    return null;
  }
};

export default refreshAccessToken;