import { getAccessToken, removeAccessToken } from './tokenStorage';
import { refreshAccessToken as refreshSpotifyToken } from '../services/spotifyAuthService';

export const ensureValidToken = async () => {
  try {
    // First check if we have a token at all
    const token = getAccessToken();
    if (!token) {
      return null;
    }

    // Validate token by making a test request
    try {
      const response = await fetch('https://api.spotify.com/v1/me', {
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
        console.log('Token expired, attempting to refresh');
        return await refreshAccessToken();
      }
      
      console.log(`Unexpected status checking token: ${response.status}`);
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