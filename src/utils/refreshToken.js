import { getRefreshToken, setAccessToken, clearAuthData, getAccessToken } from './tokenStorage';

const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    console.error("No refresh token available");
    return null;
  }
  
  const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  
  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: CLIENT_ID,
      })
    });
    
    if (!response.ok) {
      const data = await response.json();
      console.error("Token refresh failed:", data);
      return null;
    }
    
    const data = await response.json();
    
    // Update tokens
    setAccessToken(data.access_token);
    
    console.log("Token refreshed successfully");
    return data.access_token;
  } catch (error) {
    console.error("Error refreshing token:", error);
    return null;
  }
};

/**
 * Ensures we have a valid access token, refreshing if necessary
 * @returns {Promise<string|null>} Valid access token or null if unavailable/can't refresh
 */
export const ensureValidToken = async () => {
  try {
    // Check if we have a token
    const accessToken = getAccessToken();
    if (!accessToken) {
      console.log("No access token available");
      return await refreshAccessToken();
    }
    
    // Validate token with a lightweight request
    try {
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      if (response.ok) {
        console.log("Token is valid");
        return accessToken;
      }
      
      // If 401 Unauthorized, token is expired or invalid
      if (response.status === 401) {
        console.log("Token is expired or invalid, attempting refresh");
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

export default refreshAccessToken;