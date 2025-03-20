const refreshAccessToken = async () => {
  const refreshToken = sessionStorage.getItem('spotify_refresh_token');
  
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
      }).toString(),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error("Token refresh failed:", data);
      return null;
    }
    
    // Update stored tokens
    const { access_token, refresh_token } = data;
    sessionStorage.setItem('spotify_access_token', access_token);
    
    // Update refresh token if provided
    if (refresh_token) {
      sessionStorage.setItem('spotify_refresh_token', refresh_token);
    }
    
    console.log("Token refreshed successfully");
    return access_token;
  } catch (error) {
    console.error("Error refreshing token:", error);
    return null;
  }
};

export default refreshAccessToken;