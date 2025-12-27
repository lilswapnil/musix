const express = require('express');
const axios = require('axios');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const {
  saveRefreshToken,
  getStoredRefreshToken,
  getCachedAccessToken,
  setCachedAccessToken,
  isKeyVaultReady
} = require('./azureVault');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5175;

// Enable CORS for client-side requests
app.use(cors());
app.use(express.json());

const requireServiceKey = (req, res, next) => {
  const serviceKey = process.env.AZURE_SERVICE_API_KEY;
  if (!serviceKey) return next();

  const providedKey = req.header('x-service-key') || req.query.serviceKey;
  if (providedKey !== serviceKey) {
    return res.status(401).json({ error: 'Unauthorized: invalid service key' });
  }

  return next();
};

// Serve static files from the React app if in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
}

app.post('/api/azure/spotify/refresh-token', async (req, res) => {
  const { refreshToken } = req.body || {};

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  try {
    await saveRefreshToken(refreshToken);
    return res.json({ storedInKeyVault: isKeyVaultReady(), status: 'saved' });
  } catch (error) {
    console.error('Azure storage error:', error.message);
    return res.status(500).json({ error: 'Failed to store refresh token' });
  }
});

app.post('/api/azure/spotify/access-token', requireServiceKey, async (req, res) => {
  try {
    const cachedToken = getCachedAccessToken();
    if (cachedToken) {
      return res.json({ access_token: cachedToken, source: 'cache' });
    }

    const refreshToken = req.body?.refreshToken || await getStoredRefreshToken();
    if (!refreshToken) {
      return res.status(404).json({ error: 'No refresh token available' });
    }

    const tokenResponse = await axios.post('https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: process.env.SPOTIFY_CLIENT_ID,
        client_secret: process.env.SPOTIFY_CLIENT_SECRET
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    const payload = tokenResponse.data || {};
    setCachedAccessToken(payload.access_token, payload.expires_in);

    if (payload.refresh_token) {
      await saveRefreshToken(payload.refresh_token);
    }

    return res.json({
      access_token: payload.access_token,
      expires_in: payload.expires_in,
      scope: payload.scope,
      token_type: payload.token_type,
      source: 'spotify'
    });
  } catch (error) {
    console.error('Azure token service error:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Failed to issue access token' });
  }
});

// Spotify authentication callback route
app.get('/callback', async (req, res) => {
  const { code } = req.query;
  
  try {
    const response = await axios.post('https://accounts.spotify.com/api/token', 
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
        client_id: process.env.SPOTIFY_CLIENT_ID,
        client_secret: process.env.SPOTIFY_CLIENT_SECRET
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    // Redirect with tokens as query parameters
    // In production, consider using cookies or sessions instead
    res.redirect(`${process.env.CLIENT_URL}/#access_token=${response.data.access_token}&refresh_token=${response.data.refresh_token}`);
  } catch (error) {
    console.error('Token exchange error:', error.response?.data || error.message);
    res.redirect(`${process.env.CLIENT_URL}/#error=auth_failed`);
  }
});

// Token refresh endpoint
app.post('/refresh-token', async (req, res) => {
  const providedRefreshToken = req.body?.refresh_token;
  
  try {
    const refreshToken = providedRefreshToken || await getStoredRefreshToken();
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }
    
    const response = await axios.post('https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: process.env.SPOTIFY_CLIENT_ID,
        client_secret: process.env.SPOTIFY_CLIENT_SECRET
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const payload = response.data;
    if (payload?.refresh_token) {
      await saveRefreshToken(payload.refresh_token);
    }
    
    res.json(payload);
  } catch (error) {
    console.error('Token refresh error:', error.response?.data || error.message);
    res.status(400).json({ error: 'Failed to refresh token' });
  }
});

// Catch-all route for client-side routing in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});