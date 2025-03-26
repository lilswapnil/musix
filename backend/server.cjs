const express = require('express');
const axios = require('axios');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5175;

// Enable CORS for client-side requests
app.use(cors());
app.use(express.json());

// Serve static files from the React app if in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
}

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
  const { refresh_token } = req.body;
  
  if (!refresh_token) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }
  
  try {
    const response = await axios.post('https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token,
        client_id: process.env.SPOTIFY_CLIENT_ID,
        client_secret: process.env.SPOTIFY_CLIENT_SECRET
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    res.json(response.data);
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