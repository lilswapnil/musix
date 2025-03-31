import { getRefreshToken, setAccessToken } from './tokenStorage';

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

export default refreshAccessToken;